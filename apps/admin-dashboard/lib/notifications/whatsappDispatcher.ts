import { adminDb } from "@/lib/firebaseAdmin";
import { sendWhatsAppNotificationToOwner as sendMetaNotification, WhatsAppNotificationPayload } from "@/lib/notifications/whatsappMetaService";

export type { WhatsAppNotificationPayload };

/**
 * Unified WhatsApp Dispatcher for My Tara CRS
 * 100% Official Meta WhatsApp Cloud API Integration
 */
export async function dispatchWhatsAppNotification(
    hotelCode: string,
    payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; gateway?: string; messageId?: string; error?: string; reason?: string; detail?: any }> {
    if (!hotelCode) return { success: false, reason: "hotelCode is required" };

    try {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return { success: false, reason: `Hotel [${hotelCode}] tidak ditemukan.` };
        }

        const result = await sendMetaNotification(hotelCode, payload);

        return {
            ...result,
            gateway: "meta"
        };
    } catch (err: any) {
        console.error(`[WhatsApp Dispatcher Error for Hotel ${hotelCode}]:`, err);
        return { success: false, error: err.message, reason: err.message };
    }
}
