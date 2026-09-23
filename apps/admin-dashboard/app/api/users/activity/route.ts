import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * User Activity & Audit Trail API
 * ─────────────────────────────────────────────
 * GET  /api/users/activity?hotelCode=14034&limit=50
 * POST /api/users/activity
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");
        const limitCount = parseInt(searchParams.get("limit") || "60", 10);
        const userId = searchParams.get("userId");
        const moduleFilter = searchParams.get("module");

        let logsRef: FirebaseFirestore.Query;

        if (hotelCode && hotelCode !== "0" && hotelCode !== "all") {
            logsRef = adminDb.collection(`hotels/${hotelCode}/user_activities`);
        } else {
            logsRef = adminDb.collection("system_activity_logs");
        }

        let query = logsRef.orderBy("timestamp", "desc").limit(limitCount);

        if (userId) {
            query = query.where("userId", "==", userId);
        }
        if (moduleFilter && moduleFilter !== "all") {
            query = query.where("module", "==", moduleFilter);
        }

        const snapshot = await query.get();
        const logs: any[] = [];
        snapshot.forEach(doc => {
            logs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        console.error("[User Activity GET Error]:", error);
        return NextResponse.json({ success: false, error: error.message, logs: [] }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            hotelCode, userId, userName, userEmail, 
            action, module, description, deviceInfo 
        } = body;

        if (!action || !userEmail) {
            return NextResponse.json({ error: "action and userEmail are required" }, { status: 400 });
        }

        // Get IP from headers
        const forwardedFor = req.headers.get("x-forwarded-for");
        const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

        const logDoc = {
            hotelCode: hotelCode || "0",
            userId: userId || "",
            userName: userName || userEmail.split("@")[0],
            userEmail,
            action,
            module: module || "SYSTEM",
            description: description || "",
            ipAddress,
            deviceInfo: deviceInfo || req.headers.get("user-agent") || "Browser",
            timestamp: new Date().toISOString()
        };

        if (hotelCode && hotelCode !== "0") {
            await adminDb.collection(`hotels/${hotelCode}/user_activities`).add(logDoc);
        }
        await adminDb.collection("system_activity_logs").add(logDoc);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[User Activity POST Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
