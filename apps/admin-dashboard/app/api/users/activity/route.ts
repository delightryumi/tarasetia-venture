import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { resolveLocationFromReq } from "@/lib/geoHelper";
import { requireAuth, requireHotelAccess } from "@/lib/security/serverAuth";

/**
 * User Activity & Audit Trail API
 * ─────────────────────────────────────────────
 * GET  /api/users/activity?hotelCode=14034&limit=50
 * POST /api/users/activity
 */
export async function GET(req: NextRequest) {
    try {
        const authCheck = await requireAuth(req);
        if ("errorResponse" in authCheck) return authCheck.errorResponse;
        const authUser = authCheck.user;

        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");
        const limitCount = Math.min(Math.max(parseInt(searchParams.get("limit") || "60", 10) || 60, 1), 200);
        const userId = searchParams.get("userId");
        const moduleFilter = searchParams.get("module");

        let logsRef: FirebaseFirestore.Query;

        if (hotelCode && hotelCode !== "0" && hotelCode !== "all") {
            const accessCheck = await requireHotelAccess(req, hotelCode);
            if ("errorResponse" in accessCheck) return accessCheck.errorResponse;
            logsRef = adminDb.collection(`hotels/${hotelCode}/user_activities`);
        } else {
            if (!authUser.isSuperadmin) {
                return NextResponse.json({ success: false, error: "Akses Ditolak: Hanya Superadmin yang dapat melihat log aktivitas global.", logs: [] }, { status: 403 });
            }
            logsRef = adminDb.collection("system_activity_logs");
        }

        let logs: any[] = [];
        try {
            const snapshot = await logsRef.orderBy("timestamp", "desc").limit(limitCount * 2).get();
            snapshot.forEach(doc => {
                const data = doc.data();
                if (userId && data.userId !== userId) return;
                if (moduleFilter && moduleFilter !== "all" && data.module !== moduleFilter) return;
                logs.push({
                    id: doc.id,
                    ...data
                });
            });
            logs = logs.slice(0, limitCount);
        } catch (queryErr: any) {
            console.warn("[User Activity Query Fallback]:", queryErr.message);
            const snapshot = await logsRef.limit(limitCount).get();
            snapshot.forEach(doc => {
                logs.push({ id: doc.id, ...doc.data() });
            });
        }

        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        console.error("[User Activity GET Error]:", error);
        return NextResponse.json({ success: false, error: error.message, logs: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authCheck = await requireAuth(req);
        if ("errorResponse" in authCheck) return authCheck.errorResponse;
        const authUser = authCheck.user;

        const body = await req.json();
        const { 
            hotelCode, userId, userName, userEmail, 
            action, module, description, deviceInfo 
        } = body;

        const effectiveEmail = authUser.email || userEmail;
        if (!action || !effectiveEmail) {
            return NextResponse.json({ error: "action and userEmail are required" }, { status: 400 });
        }

        const resolvedHotelCode = hotelCode || authUser.hotelCode || "0";
        if (!authUser.isSuperadmin && resolvedHotelCode !== "0") {
            const accessCheck = await requireHotelAccess(req, resolvedHotelCode);
            if ("errorResponse" in accessCheck) return accessCheck.errorResponse;
        }

        // Resolve IP and Geographical Location
        const { ip: ipAddress, location } = await resolveLocationFromReq(req, body.timeZone, body.location);

        const logDoc = {
            hotelCode: resolvedHotelCode,
            userId: authUser.uid || userId || "",
            userName: userName || effectiveEmail.split("@")[0],
            userEmail: effectiveEmail,
            action,
            module: module || "SYSTEM",
            description: description || "",
            ipAddress,
            location,
            deviceInfo: deviceInfo || req.headers.get("user-agent") || "Browser",
            timestamp: new Date().toISOString()
        };

        if (resolvedHotelCode && resolvedHotelCode !== "0") {
            await adminDb.collection(`hotels/${resolvedHotelCode}/user_activities`).add(logDoc);
        }
        await adminDb.collection("system_activity_logs").add(logDoc);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[User Activity POST Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
