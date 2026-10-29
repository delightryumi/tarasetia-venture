import webpush from "web-push";
import { adminDb } from "@/lib/firebaseAdmin";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:reservation@mytara.id";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    } catch (e: any) {
        console.warn("[WebPush] VAPID configuration warning:", e?.message || e);
    }
} else {
    console.warn("[WebPush] VAPID keys not configured in environment variables. Web push notifications disabled.");
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    type?: "booking_new" | "booking_cancelled" | "booking_modification" | "system_alert";
    icon?: string;
    badge?: string;
    bookingId?: string;
    otaName?: string;
}

// ── WEBPUSH DEDUPLICATION CACHE (Prevents alert ghost loops / duplicate alarms) ──
const PUSH_DEDUP_CACHE = new Map<string, number>();
const PUSH_COOLDOWN_MS = 60 * 1000; // 60s cooldown per booking event

/**
 * Broadcast push notification to all staff / devices registered for a specific hotel.
 * Includes automatic deduplication (zero ghost loop) and multi-tenant fallback.
 */
export async function sendPushNotificationToHotel(
    hotelCode: string,
    payload: PushPayload
): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
    if (!hotelCode) return { success: false, sentCount: 0, failedCount: 0 };

    // 0. Deduplication check: Prevent ghost looping alerts
    const dedupKey = `${hotelCode}_${payload.bookingId || "alert"}_${payload.type || "event"}`;
    const now = Date.now();
    const lastSent = PUSH_DEDUP_CACHE.get(dedupKey);
    if (lastSent && (now - lastSent) < PUSH_COOLDOWN_MS) {
        console.log(`[WebPush] 🛡️ Duplicate push notification suppressed for [${dedupKey}] (${Math.round((now - lastSent)/1000)}s since last alert)`);
        return { success: true, sentCount: 0, failedCount: 0 };
    }

    try {
        // 1. Query subscriptions for target hotel
        const subsSnap = await adminDb.collection(`hotels/${hotelCode}/push_subscriptions`).get();

        // 2. Query global Superadmin subscriptions (receives real-time alerts from ALL hotels across the platform)
        const superSnap = await adminDb.collection("superadmin_push_subscriptions").get().catch(() => ({ docs: [] as any[] }));

        // 3. Multi-tenant fallback: If target hotelCode has no active subscriptions (e.g. Channex mapped code mismatch like '88888'),
        // fallback to default hotel code so management devices still receive the live alert
        const defaultHotel = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "bumi-anyom-resort";
        let defaultSubsSnap = null;
        if (subsSnap.empty && hotelCode !== defaultHotel) {
            defaultSubsSnap = await adminDb.collection(`hotels/${defaultHotel}/push_subscriptions`).get();
        }

        // Deduplicate devices by subscription endpoint so superadmin won't receive double notifications
        const rawDocs = [
            ...subsSnap.docs,
            ...superSnap.docs,
            ...(defaultSubsSnap ? defaultSubsSnap.docs : [])
        ];

        const uniqueDocsMap = new Map<string, any>();
        for (const docSnap of rawDocs) {
            const data = docSnap.data();
            const endpoint = data.subscription?.endpoint;
            if (endpoint && !uniqueDocsMap.has(endpoint)) {
                uniqueDocsMap.set(endpoint, docSnap);
            }
        }

        const allDocs = Array.from(uniqueDocsMap.values());
        if (allDocs.length === 0) {
            console.log(`[WebPush] No active subscriptions found for hotel [${hotelCode}], superadmin, or default [${defaultHotel}]`);
            return { success: true, sentCount: 0, failedCount: 0 };
        }

        const notificationData = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || "/channel-manager?tab=logs",
            tag: payload.tag || `booking-${payload.bookingId || Date.now()}`,
            type: payload.type || "booking_new",
            icon: payload.icon || "/icons/icon-192x192.png",
            badge: payload.badge || "/icons/icon-192x192.png",
            bookingId: payload.bookingId,
            otaName: payload.otaName,
            timestamp: Date.now()
        });

        let sentCount = 0;
        let failedCount = 0;

        const promises = allDocs.map(async (docSnap) => {
            const subData = docSnap.data();
            const pushSubscription = subData.subscription;
            if (!pushSubscription || !pushSubscription.endpoint) return;

            try {
                await webpush.sendNotification(pushSubscription, notificationData, {
                    urgency: "high", // Ensures immediate delivery on Android even when screen is off
                    TTL: 60 * 60 * 24 // 24 hours
                });
                sentCount++;
            } catch (err: any) {
                failedCount++;
                console.warn(`[WebPush] Failed delivery to subscription ${docSnap.id}:`, err.statusCode || err.message);
                // 404 or 410 means subscription is expired / revoked by user -> clean it up
                if (err.statusCode === 404 || err.statusCode === 410) {
                    await docSnap.ref.delete().catch(() => {});
                }
            }
        });

        await Promise.all(promises);

        if (sentCount > 0) {
            PUSH_DEDUP_CACHE.set(dedupKey, now);
            // Periodic cleanup
            for (const [k, ts] of PUSH_DEDUP_CACHE.entries()) {
                if (now - ts > PUSH_COOLDOWN_MS * 2) {
                    PUSH_DEDUP_CACHE.delete(k);
                }
            }
        }

        return { success: true, sentCount, failedCount };
    } catch (err: any) {
        console.error(`[WebPush] Error sending notifications to hotel ${hotelCode}:`, err);
        return { success: false, sentCount: 0, failedCount: 0 };
    }
}
