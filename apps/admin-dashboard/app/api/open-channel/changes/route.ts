import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Channex Open Channel - Changes Endpoint
 * Method: POST
 * URL: /api/open-channel/changes/
 * 
 * Channex pushes availability and restriction updates to this endpoint whenever
 * rate plans or rooms mapped to Open Channel change.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const notificationItems = body?.data || [];

        console.log(`[OpenChannel:Changes] Received ${notificationItems.length} changes notification batches`);

        for (const item of notificationItems) {
            if (item.type === "changes_notification") {
                const attrs = item.attributes || {};
                const hotelCode = attrs.hotel_code || "1";
                const requestId = attrs.request_id || `req_${Date.now()}`;
                const changes = attrs.changes || [];

                console.log(`[OpenChannel:Changes] Processing batch for hotel ${hotelCode} (${changes.length} items)`);

                // Log change event to channex_task_logs
                try {
                    await adminDb.collection("hotels").doc(hotelCode).collection("channex_task_logs").add({
                        taskType: "open_channel_changes",
                        requestId,
                        changesCount: changes.length,
                        changesPreview: changes.slice(0, 5),
                        createdAt: new Date().toISOString()
                    });
                } catch (logErr: any) {
                    console.warn("[OpenChannel:Changes] Failed to log change batch:", logErr.message);
                }
            }
        }

        // Standard Channex Open Channel response
        return NextResponse.json({
            success: true,
            unique_id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        }, { status: 200 });
    } catch (err: any) {
        console.error("[OpenChannel:Changes] Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
