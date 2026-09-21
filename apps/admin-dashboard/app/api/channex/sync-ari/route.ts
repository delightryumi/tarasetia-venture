import { NextRequest, NextResponse } from "next/server";
import { channexSyncService } from "@/lib/channex/syncService";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Route to trigger Availability, Rates, and Restrictions Push to Channex
 * URL: POST /api/channex/sync-ari
 */
export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const body = await req.json();
        const { hotelCode, type = "availability", startDate, endDate, ratePlanId, rate, restrictions } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const start = startDate || new Date().toISOString().split("T")[0];
        const defaultEnd = new Date();
        defaultEnd.setDate(defaultEnd.getDate() + 30);
        const end = endDate || defaultEnd.toISOString().split("T")[0];

        if (type === "delta") {
            const { delta } = body;
            const result = await channexSyncService.pushDeltaBatch(hotelCode, delta || {});
            return NextResponse.json({
                success: true,
                message: result.message,
                taskIds: result.taskIds,
                restrictionsTaskId: result.restrictionsTaskId,
                availabilityTaskId: result.availabilityTaskId,
                latencyMs: result.latencyMs
            });
        }

        if (type === "full_sync") {
            const daysAhead = Number(body.daysAhead) || 500;
            const result = await channexSyncService.fullPropertySync(hotelCode, daysAhead);
            return NextResponse.json({
                success: true,
                message: result.message,
                taskIds: result.taskIds,
                availabilityTaskId: result.availabilityTaskId,
                restrictionsTaskId: result.restrictionsTaskId,
                availabilityCount: result.availabilityCount,
                restrictionsCount: result.restrictionsCount,
                latencyMs: result.latencyMs
            });
        }

        if (type === "rates" && ratePlanId && rate !== undefined) {
            const result = await channexSyncService.pushRateUpdate(hotelCode, ratePlanId, start, end, Number(rate), restrictions);
            const latency = Date.now() - startTime;
            const taskId = result?.taskId;

            try {
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    task_type: "POST /rates",
                    entity: `Rate Plan ${ratePlanId}`,
                    status: "SUCCESS",
                    inserted_at: new Date().toISOString(),
                    latency_ms: latency,
                    task_ids: taskId ? [taskId] : [],
                    message: `Pembaruan harga (${start} s/d ${end}) berhasil didistribusikan ke Channex ARI. Task ID: ${taskId || "N/A"}`,
                    ota_responses: []
                });
            } catch (logErr) {
                console.warn("Could not save task log:", logErr);
            }

            return NextResponse.json({
                success: true,
                message: `Rates pushed successfully to Channex for ${start} - ${end}. Task ID: ${taskId || "OK"}`,
                taskId,
                result
            });
        }

        // Default: Push Availability
        const result = await channexSyncService.recalculateAndPushAvailability(hotelCode, start, end);
        const latency = Date.now() - startTime;

        try {
            await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                task_type: "POST /availability",
                entity: "Allotment Kamar",
                status: "SUCCESS",
                inserted_at: new Date().toISOString(),
                latency_ms: latency,
                message: `Pembaruan ketersediaan kamar (${start} s/d ${end}) berhasil disebarkan ke Channex.`,
                ota_responses: []
            });
        } catch (logErr) {
            console.warn("Could not save task log:", logErr);
        }

        return NextResponse.json({
            success: true,
            message: `Availability pushed successfully to Channex for ${start} - ${end}`,
            result
        });
    } catch (error: any) {
        console.error("[Channex Sync-ARI Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to push ARI to Channex"
        }, { status: 500 });
    }
}
