import webpush from "web-push";
import { adminDb } from "@/lib/firebaseAdmin";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@setara.co.id";

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

/**
 * Broadcast push notification to all staff / devices registered for a specific hotel.
 */
export async function sendPushNotificationToHotel(hotelCode: string, payload: PushPayload): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
    if (!hotelCode) return { success: false, sentCount: 0, failedCount: 0 };

    try {
        const subsSnap = await adminDb.collection(`hotels/${hotelCode}/push_subscriptions`).get();
        if (subsSnap.empty) {
            console.log(`[WebPush] No active subscriptions found for hotel ${hotelCode}`);
            return { success: true, sentCount: 0, failedCount: 0 };
        }

        const notificationData = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || "/channel-manager?tab=logs",
            tag: payload.tag || `event-${Date.now()}`,
            type: payload.type || "booking_new",
            icon: payload.icon || "/icons/icon-192x192.png",
            badge: payload.badge || "/icons/icon-192x192.png",
            bookingId: payload.bookingId,
            otaName: payload.otaName,
            timestamp: Date.now()
        });

        let sentCount = 0;
        let failedCount = 0;

        const promises = subsSnap.docs.map(async (docSnap) => {
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

        return { success: true, sentCount, failedCount };
    } catch (err: any) {
        console.error(`[WebPush] Error sending notifications to hotel ${hotelCode}:`, err);
        return { success: false, sentCount: 0, failedCount: 0 };
    }
}
