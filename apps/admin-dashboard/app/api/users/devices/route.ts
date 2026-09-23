import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Device Activity & Session Management API
 * ─────────────────────────────────────────────
 * GET    /api/users/devices?hotelCode=14034&userEmail=...
 * POST   /api/users/devices (Heartbeat/Register device session)
 * DELETE /api/users/devices (Revoke session)
 */

function parseUserAgent(ua: string): { deviceType: "desktop" | "mobile" | "tablet"; os: string; browser: string } {
    let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
    if (/tablet|ipad/i.test(ua)) {
        deviceType = "tablet";
    } else if (/mobile|iphone|android.*mobile/i.test(ua)) {
        deviceType = "mobile";
    }

    let os = "Unknown OS";
    if (/windows nt 10/i.test(ua)) os = "Windows 10/11";
    else if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
    else if (/linux/i.test(ua)) os = "Linux";

    let browser = "Web Browser";
    if (/edg\//i.test(ua)) browser = "Microsoft Edge";
    else if (/chrome\//i.test(ua)) browser = "Google Chrome";
    else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = "Apple Safari";
    else if (/firefox\//i.test(ua)) browser = "Mozilla Firefox";

    return { deviceType, os, browser };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");
        const userEmail = searchParams.get("userEmail");

        let query: FirebaseFirestore.Query = adminDb.collection("device_sessions");

        if (userEmail) {
            query = query.where("userEmail", "==", userEmail.toLowerCase().trim());
        } else if (hotelCode && hotelCode !== "0" && hotelCode !== "all") {
            query = query.where("hotelCode", "==", hotelCode);
        }

        const snapshot = await query.orderBy("lastActive", "desc").limit(40).get();
        const devices: any[] = [];
        snapshot.forEach(doc => {
            devices.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return NextResponse.json({ success: true, devices });
    } catch (error: any) {
        console.error("[Device GET Error]:", error);
        return NextResponse.json({ success: false, error: error.message, devices: [] }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, userEmail, userName, hotelCode, sessionId } = body;

        if (!userEmail) {
            return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
        }

        const rawUa = req.headers.get("user-agent") || "";
        const forwardedFor = req.headers.get("x-forwarded-for");
        const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

        const { deviceType, os, browser } = parseUserAgent(rawUa);
        const docId = sessionId || `${userEmail.replace(/[@.]/g, "_")}_${os.replace(/\s+/g, "")}_${browser.replace(/\s+/g, "")}`;

        const sessionData = {
            id: docId,
            userId: userId || "",
            userEmail: userEmail.toLowerCase().trim(),
            userName: userName || userEmail.split("@")[0],
            hotelCode: hotelCode || "0",
            deviceType,
            os,
            browser,
            ipAddress,
            userAgent: rawUa,
            lastActive: new Date().toISOString(),
            status: "active"
        };

        await adminDb.collection("device_sessions").doc(docId).set(sessionData, { merge: true });

        return NextResponse.json({ success: true, sessionId: docId, device: sessionData });
    } catch (error: any) {
        console.error("[Device POST Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
        }

        // Revoke session
        await adminDb.collection("device_sessions").doc(sessionId).set({
            status: "revoked",
            revokedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true, message: "Sesi perangkat berhasil diputuskan (Revoked)." });
    } catch (error: any) {
        console.error("[Device DELETE Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
