import { NextRequest, NextResponse } from "next/server";
import { channexClient } from "@/lib/channex/channexClient";
import { channexSyncService } from "@/lib/channex/syncService";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/security/serverAuth";
import { logAuditEvent } from "@/lib/auditLogger";

/**
 * Route: POST /api/channex/cancel-booking
 * Pushes cancellation of a reservation to Channex CRS and releases inventory
 * Official Channex Specification: POST /api/v1/bookings/{id}/cancel
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, bookingId, channexBookingId, reason, cancelledDates = [] } = body;

        if (!hotelCode || (!bookingId && !channexBookingId)) {
            return NextResponse.json({ error: "hotelCode and bookingId or channexBookingId are required" }, { status: 400 });
        }

        const authUser = await getAuthenticatedUser(req).catch(() => null);

        // Fetch hotel configuration for Channex
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: `Hotel [${hotelCode}] not found` }, { status: 404 });
        }
        const hotelData = hotelDoc.data() || {};
        const channexPropertyId = hotelData.channexPropertyId || hotelData.channelManager?.channexPropertyId || hotelData.channelManager?.propertyId;
        const customApiKey = hotelData.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env = hotelData.channelManager?.environment || hotelData.channelManager?.env || (process.env.CHANNEX_ENV as any) || "staging";

        let targetChannexId = channexBookingId;

        // If channexBookingId is not directly supplied, search in daily_revenue
        if (!targetChannexId && bookingId) {
            const snap = await adminDb.collection(`hotels/${hotelCode}/daily_revenue`).get();
            for (const docSnap of snap.docs) {
                const entries = docSnap.data().entries || [];
                const matched = entries.find((e: any) => e.bookingId === bookingId || e.reservationId === bookingId);
                if (matched?.channexBookingId) {
                    targetChannexId = matched.channexBookingId;
                    break;
                }
            }
        }

        let channexCancelled = false;
        let channexResponse: any = null;

        if (targetChannexId && channexPropertyId && customApiKey) {
            try {
                console.log(`[CancelBooking] Cancelling booking ${targetChannexId} on Channex for property ${channexPropertyId}...`);
                channexResponse = await channexClient.cancelBooking(
                    targetChannexId,
                    {
                        reason: reason || "Cancelled via My Tara Front Desk",
                    },
                    customApiKey,
                    env
                );
                channexCancelled = true;

                // Log task to channex_task_logs
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    task_type: "POST /bookings/{id}/cancel (CRS Cancellation)",
                    entity: `Booking #${bookingId || targetChannexId}`,
                    user: authUser?.displayName || authUser?.email || "Front Desk",
                    status: "SUCCESS",
                    inserted_at: new Date().toISOString(),
                    task_id: targetChannexId,
                    message: `Booking successfully cancelled in Channex CRS. Reason: ${reason || "Cancelled by Front Desk"}`
                });
            } catch (channexErr: any) {
                console.warn("[CancelBooking] Channex API cancel call warning:", channexErr?.message);
            }
        }

        // Trigger ARI synchronization for affected dates so inventory is immediately released to all OTAs
        if (cancelledDates.length > 0 && channexPropertyId && customApiKey) {
            try {
                const sortedDates = [...cancelledDates].sort();
                await channexSyncService.pushLiveAriToChannex(
                    hotelCode,
                    "availability",
                    sortedDates[0],
                    sortedDates[sortedDates.length - 1]
                );
            } catch (ariErr) {
                console.warn("[CancelBooking] ARI inventory release sync warning:", ariErr);
            }
        }

        return NextResponse.json({
            success: true,
            channexCancelled,
            channexBookingId: targetChannexId,
            message: channexCancelled 
                ? "Reservasi berhasil dibatalkan di My Tara dan disinkronkan ke Channex CRS." 
                : "Reservasi berhasil dibatalkan di My Tara (tidak terhubung ke Channex ID eksternal)."
        });
    } catch (err: any) {
        console.error("[CancelBooking] Error processing cancellation:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "Failed to process booking cancellation"
        }, { status: 500 });
    }
}

