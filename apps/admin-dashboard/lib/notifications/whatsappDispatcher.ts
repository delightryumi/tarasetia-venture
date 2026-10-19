import { adminDb } from "@/lib/firebaseAdmin";
import { sendWhatsAppNotificationToOwner as sendMetaNotification, WhatsAppNotificationPayload } from "@/lib/notifications/whatsappMetaService";

import { sendWhatsAppNotificationToOwner as sendFonnteNotification } from "@/lib/notifications/whatsappFonnteService";

export type { WhatsAppNotificationPayload };

/**
 * Unified WhatsApp Dispatcher for My Tara CRS
 * Routes to Meta WhatsApp Cloud API or Fonnte Gateway based on hotel configuration
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
        const gateway = waConfig.gateway || (waConfig.fonnteToken && !process.env.WHATSAPP_META_ACCESS_TOKEN ? "fonnte" : "meta");

        if (gateway === "fonnte") {
            const fonnteRes = await sendFonnteNotification(hotelCode, payload);
            return {
                ...fonnteRes,
                gateway: "fonnte"
            };
        }

        const result = await sendMetaNotification(hotelCode, payload);

        // Fallback to Fonnte if Meta failed and Fonnte token is configured
        if (!result.success && waConfig.fonnteToken) {
            console.warn(`[WhatsApp Dispatcher] Meta delivery failed for ${hotelCode}, trying Fonnte fallback...`);
            const fallbackRes = await sendFonnteNotification(hotelCode, payload);
            return {
                ...fallbackRes,
                gateway: "fonnte_fallback"
            };
        }

        return {
            ...result,
            gateway: "meta"
        };
    } catch (err: any) {
        console.error(`[WhatsApp Dispatcher Error for Hotel ${hotelCode}]:`, err);
        return { success: false, error: err.message, reason: err.message };
    }
}
