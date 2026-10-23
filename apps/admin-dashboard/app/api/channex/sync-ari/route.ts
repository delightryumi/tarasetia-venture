import { NextRequest, NextResponse } from "next/server";
import { channexSyncService } from "@/lib/channex/syncService";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/security/serverAuth";

/**
 * Extracts all task UUIDs returned by Channex JSON:API responses
 */
function extractChannexTaskIds(res: any): string[] {
    if (!res) return [];
    const ids: string[] = [];
    if (typeof res.taskId === "string") ids.push(res.taskId);
    if (Array.isArray(res.taskIds)) ids.push(...res.taskIds);
    if (res.meta?.task_id) ids.push(res.meta.task_id);
    if (Array.isArray(res.meta?.task_ids)) ids.push(...res.meta.task_ids);
    if (Array.isArray(res.data)) {
        res.data.forEach((item: any) => {
            if (item?.id) ids.push(item.id);
            if (item?.attributes?.task_id) ids.push(item.attributes.task_id);
        });
    } else if (res.data) {
        if (res.data.id) ids.push(res.data.id);
        if (res.data.attributes?.task_id) ids.push(res.data.attributes.task_id);
    }
    return Array.from(new Set(ids.filter(Boolean)));
}

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

        // Resolve accountable user - priority: explicit body fields > server-verified token > users_master settings
        const authUser = await getAuthenticatedUser(req).catch(() => null);

        let resolvedName = body.userName || "";
        let resolvedEmail = body.userEmail || (authUser?.email || "");
        let resolvedRole = body.userRole || authUser?.role || "";

        if (body.user && typeof body.user === "string" && !resolvedEmail) {
            const match = body.user.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (match) resolvedEmail = match[1];
        }

        if (!resolvedEmail && authUser?.email) {
            resolvedEmail = authUser.email;
        }

        // Fetch from user settings (users_master) to guarantee exact Name & Role
        if (resolvedEmail) {
            try {
                const docId = resolvedEmail.toLowerCase().trim().replace(/[@.]/g, "_");
                const hotelUserDoc = await adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`).get();
                if (hotelUserDoc.exists) {
                    const uData = hotelUserDoc.data();
                    resolvedName = resolvedName || uData?.name || uData?.displayName || "";
                    resolvedRole = resolvedRole || uData?.role || "Staff";
                } else {
                    const rootUserDoc = await adminDb.doc(`users_master/${docId}`).get();
                    if (rootUserDoc.exists) {
                        const uData = rootUserDoc.data();
                        resolvedName = resolvedName || uData?.name || uData?.displayName || "";
                        resolvedRole = resolvedRole || uData?.role || "superadmin";
                    }
                }
            } catch (uErr: any) {
                console.warn("[sync-ari] Could not resolve user from users_master:", uErr?.message);
            }
        }

        if (!resolvedName && resolvedEmail) {
            resolvedName = resolvedEmail.split("@")[0];
        }
        if (!resolvedRole) {
            resolvedRole = "Staff";
        }

        // Build the display label
        let operatorUser: string;
        if (body.user && typeof body.user === "string" && !body.user.trim().toLowerCase().includes("operator") && body.user.trim() !== "") {
            operatorUser = body.user.trim();
        } else if (resolvedName && resolvedEmail) {
            operatorUser = `${resolvedName} (${resolvedEmail})`;
        } else if (resolvedEmail) {
            operatorUser = resolvedEmail;
        } else {
            operatorUser = "Operator";
        }

        if (type === "delta") {
            const { delta, immediate } = body;
            const result = immediate
                ? await channexSyncService.pushDeltaBatch(hotelCode, delta || {})
                : await channexSyncService.enqueueDebouncedDelta(hotelCode, delta || {}, false);
            const deltaTaskIds = result.taskIds || [];
            const primaryDeltaTaskId = deltaTaskIds[0] || result.restrictionsTaskId || result.availabilityTaskId || `delta-${Date.now()}`;

            try {
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    action: "Sync Delta to Channex",
                    task_type: "POST /ari-delta",
                    channelName: "Channex ARI Engine",
                    user: operatorUser,
                    user_label: operatorUser,
                    user_name: resolvedName || operatorUser,
                    user_email: resolvedEmail,
                    user_role: resolvedRole,
                    status: "SUCCESS",
                    result: "Success",
                    inserted_at: new Date().toISOString(),
                    started_at: new Date(startTime).toISOString(),
                    execution_time_ms: result.latencyMs || (Date.now() - startTime),
                    task_ids: deltaTaskIds,
                    task_id: primaryDeltaTaskId,
                    diff: delta,
                    message: result.message || `Delta inventory & restrictions synced to Channex. Task ID: ${primaryDeltaTaskId}`,
                    ota_responses: []
                });
            } catch (logErr) {
                console.warn("[sync-ari] Could not log delta task:", logErr);
            }

            return NextResponse.json({
                success: true,
                message: result.message,
                taskId: primaryDeltaTaskId,
                taskIds: result.taskIds,
                restrictionsTaskId: result.restrictionsTaskId,
                availabilityTaskId: result.availabilityTaskId,
                latencyMs: result.latencyMs
            });
        }

        if (type === "full_sync") {
            const daysAhead = Number(body.daysAhead) || 500;
            const result = await channexSyncService.fullPropertySync(hotelCode, daysAhead);
            const fullTaskIds = result.taskIds || [];
            const primaryFullTaskId = fullTaskIds[0] || result.availabilityTaskId || result.restrictionsTaskId || `full-sync-${Date.now()}`;

            try {
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    action: "Full Property Sync (500d)",
                    task_type: "FULL_SYNC",
                    channelName: "Channex Master Sync",
                    user: operatorUser,
                    user_label: operatorUser,
                    user_name: resolvedName || operatorUser,
                    user_email: resolvedEmail,
                    user_role: resolvedRole,
                    status: "SUCCESS",
                    result: "Success",
                    inserted_at: new Date().toISOString(),
                    started_at: new Date(startTime).toISOString(),
                    execution_time_ms: result.latencyMs || (Date.now() - startTime),
                    task_ids: fullTaskIds,
                    task_id: primaryFullTaskId,
                    diff: { daysAhead, availabilityCount: result.availabilityCount, restrictionsCount: result.restrictionsCount },
                    message: result.message || `Full property ARI sync completed. Task ID: ${primaryFullTaskId}`,
                    ota_responses: []
                });
            } catch (logErr) {
                console.warn("[sync-ari] Could not log full_sync task:", logErr);
            }

            return NextResponse.json({
                success: true,
                message: result.message,
                taskId: primaryFullTaskId,
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
            const rateTaskIds = extractChannexTaskIds(result);
            const taskId = rateTaskIds[0] || result?.taskId || `rate-${Date.now()}`;

            try {
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    action: `Push Rate Plan (${ratePlanId})`,
                    task_type: "POST /rates",
                    channelName: "Channex Rates Engine",
                    entity: `Rate Plan ${ratePlanId}`,
                    user: operatorUser,
                    user_label: operatorUser,
                    user_name: resolvedName || operatorUser,
                    user_email: resolvedEmail,
                    user_role: resolvedRole,
                    status: "SUCCESS",
                    result: "Success",
                    inserted_at: new Date().toISOString(),
                    started_at: new Date(startTime).toISOString(),
                    execution_time_ms: latency,
                    task_ids: rateTaskIds.length > 0 ? rateTaskIds : [taskId],
                    task_id: taskId,
                    diff: { ratePlanId, rate, start, end, restrictions },
                    message: `Pembaruan harga (${start} s/d ${end}) berhasil didistribusikan ke Channex ARI. Task ID: ${taskId}`,
                    ota_responses: []
                });
            } catch (logErr) {
                console.warn("Could not save task log:", logErr);
            }

            return NextResponse.json({
                success: true,
                message: `Rates pushed successfully to Channex for ${start} - ${end}. Task ID: ${taskId}`,
                taskId,
                taskIds: rateTaskIds.length > 0 ? rateTaskIds : [taskId],
                result
            });
        }

        // Default: Push Availability
        const result = await channexSyncService.recalculateAndPushAvailability(hotelCode, start, end);
        const latency = Date.now() - startTime;

        const availTaskIds = extractChannexTaskIds(result);
        const realTaskId = availTaskIds[0] || result?.data?.[0]?.id || result?.data?.id || result?.taskId || null;

        try {
            await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                action: "Push Availability Allotment",
                task_type: "POST /availability",
                channelName: "Channex Availability Engine",
                entity: "Allotment Kamar",
                user: operatorUser,
                user_label: operatorUser,
                user_name: resolvedName || operatorUser,
                user_email: resolvedEmail,
                user_role: resolvedRole,
                status: "SUCCESS",
                result: "Success",
                inserted_at: new Date().toISOString(),
                started_at: new Date(startTime).toISOString(),
                execution_time_ms: latency,
                task_id: realTaskId || (availTaskIds[0] || `avail-${Date.now()}`),
                task_ids: availTaskIds.length > 0 ? availTaskIds : (realTaskId ? [realTaskId] : []),
                diff: { startDate: start, endDate: end },
                message: `Pembaruan ketersediaan kamar (${start} s/d ${end}) berhasil disebarkan ke Channex.${realTaskId ? ` Task ID: ${realTaskId}` : ""}`,
                ota_responses: []
            });
        } catch (logErr) {
            console.warn("Could not save task log:", logErr);
        }

        return NextResponse.json({
            success: true,
            message: `Availability pushed successfully to Channex for ${start} - ${end}.${realTaskId ? ` Task ID: ${realTaskId}` : ""}`,
            taskId: realTaskId,
            taskIds: availTaskIds,
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
