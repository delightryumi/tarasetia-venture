import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { channexClient } from "@/lib/channex/channexClient";
import { channexSyncService } from "@/lib/channex/syncService";

/**
 * Endpoint to Poll and Ingest Unacknowledged Booking Revisions from Channex Feed
 * URL: POST /api/channex/sync-feed
 * Certification Requirement: Stage 5 Fallback Ingestion Loop
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { hotelCode } = body;

        let customApiKey = process.env.CHANNEX_API_KEY;
        let environment: "staging" | "production" = (process.env.CHANNEX_ENV as any) || "staging";

        if (hotelCode) {
            const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
            if (hotelDoc.exists) {
                const data = hotelDoc.data();
                customApiKey = data?.channelManager?.apiKey || customApiKey;
                environment = data?.channelManager?.environment || environment;
            }
        }

        if (!customApiKey) {
            return NextResponse.json({
                error: "Channex API Key is not configured."
            }, { status: 400 });
        }

        console.log(`[Channex Feed Poll] Querying unacknowledged booking revisions from ${environment}...`);
        const feedRes = await channexClient.getBookingRevisionFeed(customApiKey, environment);
        const revisions = feedRes?.data || [];

        console.log(`[Channex Feed Poll] Found ${revisions.length} unacknowledged revisions.`);

        const results: any[] = [];
        let successCount = 0;
        let ackCount = 0;

        for (const rev of revisions) {
            const revisionId = rev.id;
            const booking = rev.attributes || rev;
            const propertyId = booking.property_id || rev.relationships?.property?.data?.id;

            const webhookPayload = {
                event: (booking.status === "cancelled" ? "booking_cancellation" : "booking_new") as any,
                property_id: propertyId,
                booking_revision_id: revisionId,
                booking: {
                    id: booking.id || revisionId,
                    property_id: propertyId,
                    ...booking
                },
                inserted_at: rev.inserted_at || new Date().toISOString()
            };

            try {
                const ingestRes = await channexSyncService.processIncomingBookingWebhook(webhookPayload);
                successCount++;

                // Send ACK immediately
                try {
                    await channexClient.acknowledgeBooking(revisionId, customApiKey, environment);
                    ackCount++;
                } catch (ackErr: any) {
                    console.warn(`[Channex Feed Poll] Warning ACK failed for ${revisionId}:`, ackErr.message);
                }

                results.push({
                    revisionId,
                    status: "PROCESSED",
                    bookingId: ingestRes.bookingId
                });
            } catch (ingestErr: any) {
                console.error(`[Channex Feed Poll] Error ingesting revision ${revisionId}:`, ingestErr);
                results.push({
                    revisionId,
                    status: "FAILED",
                    error: ingestErr.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            totalRevisionsFound: revisions.length,
            processedCount: successCount,
            ackedCount: ackCount,
            results,
            message: revisions.length === 0 
                ? "Semua revisi reservasi dari Channex sudah sinkron (0 pending feed)."
                : `Berhasil memproses ${successCount} dari ${revisions.length} reservasi tertunda dan mengirim ${ackCount} ACK ke Channex.`
        });
    } catch (error: any) {
        console.error("[Channex Sync Feed Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Gagal memproses booking feed dari Channex"
        }, { status: 500 });
    }
}
