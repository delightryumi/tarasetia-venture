import { adminDb } from "@/lib/firebaseAdmin";

import { WhatsAppNotificationPayload, buildWhatsAppMessage } from "@/lib/notifications/whatsappMetaService";

export type { WhatsAppNotificationPayload };

const FONNTE_API_URL = "https://api.fonnte.com/send";
const DEFAULT_FONNTE_TOKEN = process.env.FONNTE_API_TOKEN || "";

/**
 * Normalizes phone numbers to standard format
 * e.g., "085645365440" -> "6285645365440"
 */
export function normalizePhoneNumber(phone: string): string {
    if (!phone) return "";
    let clean = phone.replace(/[^\d]/g, "");
    if (clean.startsWith("0")) {
        clean = "62" + clean.slice(1);
    } else if (clean.startsWith("8")) {
        clean = "62" + clean;
    }
    return clean;
}

/**
 * Send WhatsApp message using Fonnte API
 * Endpoint: POST https://api.fonnte.com/send
 */
export async function sendFonnteMessage({
    target,
    message,
    token
}: {
    target: string;
    message: string;
    token?: string;
}): Promise<{ success: boolean; id?: string; error?: string; raw?: any; process?: string; detail?: string }> {
    const activeToken = (token || DEFAULT_FONNTE_TOKEN).trim();
    const cleanTarget = normalizePhoneNumber(target);

    if (!cleanTarget) {
        return { success: false, error: "Nomor tujuan WhatsApp tidak valid atau kosong." };
    }

    if (!activeToken) {
        return {
            success: false,
            error: "Token Fonnte belum dikonfigurasi. Silakan salin Token dari menu Device di Fonnte dan simpan di pengaturan."
        };
    }

    try {
        const formData = new URLSearchParams();
        formData.append("target", cleanTarget);
        formData.append("message", message);
        formData.append("countryCode", "62");

        const response = await fetch(FONNTE_API_URL, {
            method: "POST",
            headers: {
                "Authorization": activeToken
            },
            body: formData
        });

        const data = await response.json();

        // Fonnte returns { status: true, id: [...], process: "..." } on success
        if (data.status === true || data.status === "true") {
            const firstId = Array.isArray(data.id) ? data.id[0] : data.id;
            return {
                success: true,
                id: firstId || "sent",
                process: data.process || "sent",
                detail: data.detail || "",
                raw: data
            };
        } else {
            const errorMsg = data.reason || data.message || (typeof data === "string" ? data : JSON.stringify(data));
            console.error(`[Fonnte API Error]:`, data);
            return {
                success: false,
                error: `Fonnte: ${errorMsg}`,
                raw: data
            };
        }
    } catch (err: any) {
        console.error("[Fonnte API Network Error]:", err);
        return {
            success: false,
            error: err.message || "Gagal menghubungi server Fonnte."
        };
    }
}

/**
 * Multi-tenant safe: Dispatches WhatsApp alert to specific hotel owner
 * Hotel A -> Owner Hotel A; Hotel B -> Owner Hotel B
 */
export async function sendWhatsAppNotificationToOwner(
    hotelCode: string,
    payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; reason?: string; error?: string; messageId?: string; process?: string; detail?: string }> {
    if (!hotelCode) return { success: false, reason: "hotelCode is required" };

    try {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return { success: false, reason: `Hotel [${hotelCode}] tidak ditemukan.` };
        }

        const hotelData = hotelDoc.data() || {};
        const waConfig = hotelData.whatsappNotification || {};

        // Check if enabled
        const isEnabled = waConfig.enabled !== false;
        const targetPhone = waConfig.ownerPhone || hotelData.phone || "";

        if (!isEnabled) {
            return { success: false, reason: `Notifikasi WhatsApp dinonaktifkan untuk hotel ${hotelCode}.` };
        }

        if (!targetPhone) {
            return { success: false, reason: `Nomor WhatsApp Owner belum diatur untuk hotel ${hotelCode}.` };
        }

        // Check event filters
        if (payload.event === "booking_cancellation" && waConfig.notifyOnCancellation === false) {
            return { success: false, reason: "Notifikasi pembatalan dimatikan oleh owner." };
        }
        if (payload.event === "booking_new" && waConfig.notifyOnNewBooking === false) {
            return { success: false, reason: "Notifikasi booking baru dimatikan oleh owner." };
        }

        const hotelName = hotelData.name || hotelData.propertyName || `Hotel #${hotelCode}`;
        // Build neat, rich notification message (omitting net to hotel & commission)
        const messageText = buildWhatsAppMessage(hotelName, payload);

        const token = waConfig.fonnteToken || DEFAULT_FONNTE_TOKEN;

        const result = await sendFonnteMessage({
            target: targetPhone,
            message: messageText,
            token
        });

        // Audit log in Firestore
        const isQueued = result.success && (result.raw?.process === "pending" || (result as any).process === "pending");
        await adminDb.collection("hotels").doc(hotelCode).collection("whatsapp_logs").add({
            timestamp: new Date().toISOString(),
            gateway: "fonnte",
            event: payload.event,
            recipient: targetPhone,
            bookingRef: payload.bookingRef,
            guestName: payload.guestName,
            channelName: payload.channelName,
            status: result.success ? (isQueued ? "QUEUED" : "DELIVERED") : "FAILED",
            messageId: result.id || null,
            detail: (result as any).detail || result.raw?.detail || null,
            error: result.error || null
        }).catch(() => {});

        return {
            success: result.success,
            messageId: result.id,
            process: (result as any).process || (result.success ? "sent" : "failed"),
            detail: (result as any).detail || null,
            error: result.error,
            reason: result.error
        };
    } catch (err: any) {
        console.error(`[WhatsApp Fonnte Error for Hotel ${hotelCode}]:`, err);
        return { success: false, reason: err.message, error: err.message };
    }
}
