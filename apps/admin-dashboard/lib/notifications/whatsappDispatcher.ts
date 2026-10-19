import { adminDb } from "@/lib/firebaseAdmin";
import { sendWhatsAppNotificationToOwner as sendMetaNotification, WhatsAppNotificationPayload } from "@/lib/notifications/whatsappMetaService";
import { sendEmailNotificationToOwner } from "@/lib/notifications/emailBrevoService";

export type { WhatsAppNotificationPayload };

/**
 * Unified Notification Dispatcher for My Tara CRS
 * Concurrently dispatches Meta WhatsApp Cloud Notification & Brevo Email Notification
 */
export async function dispatchWhatsAppNotification(
    hotelCode: string,
    payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; gateway?: string; messageId?: string; error?: string; reason?: string; emailResult?: any; detail?: any }> {
    if (!hotelCode) return { success: false, reason: "hotelCode is required" };

    try {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return { success: false, reason: `Hotel [${hotelCode}] tidak ditemukan.` };
        }

        // 1. Dispatch Meta WhatsApp notification
        const waPromise = sendMetaNotification(hotelCode, payload);

        // 2. Dispatch Brevo Email notification concurrently
        const emailPromise = sendEmailNotificationToOwner(hotelCode, payload).catch(err => {
            console.warn(`[Brevo Email Dispatch Warning for ${hotelCode}]:`, err?.message);
            return { success: false, error: err?.message };
        });

        const [result, emailResult] = await Promise.all([waPromise, emailPromise]);

        return {
            ...result,
            gateway: "meta",
            emailResult
        };
    } catch (err: any) {
        console.error(`[Notification Dispatcher Error for Hotel ${hotelCode}]:`, err);
        return { success: false, error: err.message, reason: err.message };
    }
}

export { sendEmailNotificationToOwner };
