import { adminDb } from "@/lib/firebaseAdmin";
import { sendWhatsAppNotificationToOwner as sendFonnteNotification, WhatsAppNotificationPayload } from "@/lib/notifications/whatsappFonnteService";
import { sendWhatsAppNotificationToOwner as sendMetaNotification } from "@/lib/notifications/whatsappMetaService";

export type { WhatsAppNotificationPayload };

/**
 * Unified Multi-Tenant WhatsApp Dispatcher
 * Automatically routes notifications to the gateway configured for the hotel ("meta" or "fonnte").
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

        const hotelData = hotelDoc.data() || {};
        const waConfig = hotelData.whatsappNotification || {};

        // Default to config.gateway or fallback to fonnte
        const gateway = waConfig.gateway || "fonnte";

        let result;
        if (gateway === "meta") {
            result = await sendMetaNotification(hotelCode, payload);
        } else {
            result = await sendFonnteNotification(hotelCode, payload);
        }

        return {
            ...result,
            gateway
        };
    } catch (err: any) {
        console.error(`[WhatsApp Dispatcher Error for Hotel ${hotelCode}]:`, err);
        return { success: false, error: err.message, reason: err.message };
    }
}
