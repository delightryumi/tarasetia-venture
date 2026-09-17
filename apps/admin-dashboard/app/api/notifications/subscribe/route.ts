import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BLuwRrpBTaK6tmXC32qj_BZnSfnBYJmPcJMKxwDWoliqBjeQVidWv2L7s0pUUCRiu4t3WIgYLU1g5D6dQZvVHpk";

export async function GET() {
    return NextResponse.json({
        success: true,
        publicKey: VAPID_PUBLIC_KEY
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, subscription, userAgent, userEmail, preferences } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        // ── Case 1: Preferences-only update (no subscription) ──
        // Called when user toggles individual notification types in the settings drawer.
        if (!subscription || !subscription.endpoint) {
            if (preferences && userEmail) {
                // Save per-user preferences to Firestore (keyed by email)
                const safeKey = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
                await adminDb
                    .collection(`hotels/${hotelCode}/notification_preferences`)
                    .doc(safeKey)
                    .set({ userEmail, preferences, updatedAt: new Date().toISOString() }, { merge: true });
            }
            return NextResponse.json({ success: true, message: "Preferences saved" });
        }

        // ── Case 2: Full subscription registration ──
        // Generate a deterministic ID based on the subscription endpoint hash to prevent duplicates
        const subId = Buffer.from(subscription.endpoint).toString("base64").slice(-32).replace(/[^a-zA-Z0-9]/g, "_");

        await adminDb.collection(`hotels/${hotelCode}/push_subscriptions`).doc(subId).set({
            subscription,
            userAgent: userAgent || "Unknown Device",
            userEmail: userEmail || "anonymous",
            preferences: preferences || null,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }, { merge: true });

        // Also save preferences snapshot per-user
        if (preferences && userEmail) {
            const safeKey = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
            await adminDb
                .collection(`hotels/${hotelCode}/notification_preferences`)
                .doc(safeKey)
                .set({ userEmail, preferences, updatedAt: new Date().toISOString() }, { merge: true });
        }

        return NextResponse.json({
            success: true,
            id: subId,
            message: "Push subscription successfully registered"
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}


export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");
        const endpoint = searchParams.get("endpoint");

        if (!hotelCode || !endpoint) {
            return NextResponse.json({ error: "hotelCode and endpoint are required" }, { status: 400 });
        }

        const subId = Buffer.from(endpoint).toString("base64").slice(-32).replace(/[^a-zA-Z0-9]/g, "_");
        await adminDb.collection(`hotels/${hotelCode}/push_subscriptions`).doc(subId).delete();

        return NextResponse.json({
            success: true,
            message: "Push subscription removed"
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
