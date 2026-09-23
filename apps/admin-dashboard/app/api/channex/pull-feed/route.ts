import { NextRequest, NextResponse } from "next/server";
import { channexSyncService } from "@/lib/channex/syncService";
import { channexClient } from "@/lib/channex/channexClient";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Channex Booking Revision Feed Pull + Acknowledge
 * ─────────────────────────────────────────────────
 * CHANNEX PMS CERTIFICATION REQUIREMENT:
 *   Even when using webhooks, PMS must implement a pull fallback every 15-20 minutes
 *   to ensure no bookings are missed during webhook outages.
 *
 * This route:
 * 1. Calls GET /booking_revisions/feed to pull unacknowledged revisions
 * 2. Processes each revision through the same pipeline as the webhook handler
 * 3. Sends ACK for each successfully processed revision
 *
 * Route: GET /api/channex/pull-feed          (Vercel Cron or manual trigger)
 * Route: POST /api/channex/pull-feed         (Manual trigger with optional hotelCode)
 *
 * Vercel cron.json config (add to vercel.json):
 * { "crons": [{ "path": "/api/channex/pull-feed", "schedule": "*/15 * * * *" }] }
 */
export const maxDuration = 60; // 60 second timeout for feed processing

export async function GET(req: NextRequest) {
    return handlePullFeed(req);
}

export async function POST(req: NextRequest) {
    return handlePullFeed(req);
}

async function handlePullFeed(req: NextRequest) {
    const startTime = Date.now();

    // Security: Verify Vercel Cron secret or internal API secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.CHANNEX_WEBHOOK_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Allow internal calls without auth (same-origin Next.js server)
        const isInternalCall = req.headers.get("x-internal-call") === "1";
        if (!isInternalCall) {
            console.warn("[Channex Pull Feed] Unauthorized cron request rejected.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    console.log(`[Channex Pull Feed] Starting booking revision feed pull at ${new Date().toISOString()}`);

    // Fetch all active hotels that have Channex configured
    const hotelsSnap = await adminDb.collection("hotels").get();
    const activeHotels = hotelsSnap.docs.filter(doc => {
        const data = doc.data();
        return !!(data?.channelManager?.apiKey || process.env.CHANNEX_API_KEY);
    });

    if (activeHotels.length === 0) {
        console.log("[Channex Pull Feed] No hotels with Channex configured. Skipping.");
        return NextResponse.json({ success: true, message: "No hotels configured.", processed: 0 });
    }

    const results: Array<{
        hotelCode: string;
        revisionsPulled: number;
        revisionsProcessed: number;
        revisionsAcked: number;
        errors: string[];
    }> = [];

    // Process feed per hotel (each hotel has its own API key)
    for (const hotelDoc of activeHotels) {
        const hotelCode = hotelDoc.id;
        const hotelData = hotelDoc.data();
        const customApiKey = hotelData?.channelManager?.apiKey || process.env.CHANNEX_API_KEY;
        const env: "staging" | "production" = (hotelData?.channelManager?.env || hotelData?.channelManager?.environment || process.env.CHANNEX_ENV || "staging") as any;

        if (!customApiKey) continue;

        const hotelResult = {
            hotelCode,
            revisionsPulled: 0,
            revisionsProcessed: 0,
            revisionsAcked: 0,
            errors: [] as string[]
        };

        try {
            // Pull unacknowledged booking revisions from Channex Feed API
            const feedRes = await channexClient.getBookingRevisionFeed(customApiKey, env);
            const revisions: any[] = feedRes?.data || [];
            hotelResult.revisionsPulled = revisions.length;

            if (revisions.length === 0) {
                console.log(`[Channex Pull Feed] [${hotelCode}] No unacknowledged revisions in feed.`);
                results.push(hotelResult);
                continue;
            }

            console.log(`[Channex Pull Feed] [${hotelCode}] Processing ${revisions.length} unacknowledged revision(s)...`);

            for (const revisionRaw of revisions) {
                const revisionId = revisionRaw?.id || revisionRaw?.data?.id;
                const attrs = revisionRaw?.attributes || revisionRaw?.data?.attributes || revisionRaw;
                const propertyId = attrs?.property_id || hotelData?.channexPropertyId || hotelData?.channelManager?.channexPropertyId;

                if (!revisionId) {
                    hotelResult.errors.push(`Revision without ID skipped`);
                    continue;
                }

                try {
                    // Pull full revision details if not complete
                    let fullRevision = attrs;
                    if (!fullRevision?.rooms && !fullRevision?.customer) {
                        const fullRes = await channexClient.getBookingRevision(revisionId, customApiKey, env);
                        fullRevision = fullRes?.data?.attributes || fullRes?.data || fullRevision;
                    }

                    // Build a synthetic webhook payload identical to what the webhook handler expects
                    const syntheticPayload = {
                        event: fullRevision?.status === "cancelled" ? "booking_cancellation" : "booking_new",
                        property_id: propertyId,
                        booking_revision_id: revisionId,
                        is_pull_feed: true, // Marks as pulled (skip duplicate ACK in syncService)
                        booking: {
                            id: fullRevision?.id || revisionId,
                            property_id: propertyId,
                            ...fullRevision
                        }
                    };

                    // Process booking through the same pipeline as the webhook
                    await channexSyncService.processIncomingBookingWebhook(syntheticPayload as any, hotelCode);
                    hotelResult.revisionsProcessed++;

                    // Send ACK — mandatory per Channex spec
                    try {
                        await channexClient.acknowledgeBooking(revisionId, customApiKey, env);
                        hotelResult.revisionsAcked++;
                        console.log(`[Channex Pull Feed] [${hotelCode}] ✅ Revision ${revisionId} processed & acknowledged.`);
                    } catch (ackErr: any) {
                        hotelResult.errors.push(`ACK failed for ${revisionId}: ${ackErr.message}`);
                        console.warn(`[Channex Pull Feed] [${hotelCode}] ⚠️  ACK failed for ${revisionId}:`, ackErr.message);
                    }

                } catch (processErr: any) {
                    hotelResult.errors.push(`Process failed for ${revisionId}: ${processErr.message}`);
                    console.error(`[Channex Pull Feed] [${hotelCode}] ❌ Failed to process revision ${revisionId}:`, processErr.message);

                    // Even on processing failure, ACK to avoid infinite retry loops
                    // (booking will be saved with error state, not lost)
                    try {
                        await channexClient.acknowledgeBooking(revisionId, customApiKey, env);
                        hotelResult.revisionsAcked++;
                        console.warn(`[Channex Pull Feed] [${hotelCode}] ⚠️  Revision ${revisionId} acknowledged despite process error (to prevent retry loop).`);
                    } catch (ackErr2: any) {
                        console.error(`[Channex Pull Feed] [${hotelCode}] ❌ ACK also failed for ${revisionId}:`, ackErr2.message);
                    }
                }

                // Small delay between revisions to respect Channex rate limits (10 req/min/property)
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Log pull-feed run to Firestore for audit trail
            try {
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    task_type: "GET /booking_revisions/feed (Pull Fallback Cron)",
                    entity: "Booking Feed Fallback",
                    status: hotelResult.errors.length > 0 ? "PARTIAL" : "SUCCESS",
                    inserted_at: new Date().toISOString(),
                    latency_ms: Date.now() - startTime,
                    message: `Pull Feed: ${hotelResult.revisionsPulled} pulled, ${hotelResult.revisionsProcessed} processed, ${hotelResult.revisionsAcked} acknowledged, ${hotelResult.errors.length} errors.`,
                    ota_responses: hotelResult.errors.length > 0 ? hotelResult.errors.map(e => ({ error: e })) : []
                });
            } catch (logErr) {
                console.warn("[Channex Pull Feed] Could not write audit log:", logErr);
            }

        } catch (feedErr: any) {
            hotelResult.errors.push(`Feed pull failed: ${feedErr.message}`);
            console.error(`[Channex Pull Feed] [${hotelCode}] ❌ Feed pull error:`, feedErr.message);
        }

        results.push(hotelResult);
    }

    const totalPulled = results.reduce((sum, r) => sum + r.revisionsPulled, 0);
    const totalProcessed = results.reduce((sum, r) => sum + r.revisionsProcessed, 0);
    const totalAcked = results.reduce((sum, r) => sum + r.revisionsAcked, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const latencyMs = Date.now() - startTime;

    console.log(`[Channex Pull Feed] ✅ Completed in ${latencyMs}ms. Hotels: ${results.length}, Revisions: ${totalPulled} pulled / ${totalProcessed} processed / ${totalAcked} acked / ${totalErrors} errors.`);

    return NextResponse.json({
        success: true,
        latencyMs,
        summary: {
            hotelsProcessed: results.length,
            totalRevisionsPulled: totalPulled,
            totalRevisionsProcessed: totalProcessed,
            totalRevisionsAcked: totalAcked,
            totalErrors
        },
        details: results
    });
}
