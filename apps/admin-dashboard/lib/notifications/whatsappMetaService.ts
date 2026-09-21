import { adminDb } from "@/lib/firebaseAdmin";

export interface WhatsAppNotificationPayload {
    event: "booking_new" | "booking_cancellation" | "booking_modification" | "test";
    channelName: string;
    bookingRef: string;
    guestName: string;
    roomName: string;
    arrivalDate: string;
    departureDate: string;
    totalPrice: number | string;
    paymentStatus?: string;
    nights?: number;
    customNote?: string;
}

const META_API_VERSION = "v20.0";
const DEFAULT_PHONE_NUMBER_ID = process.env.WHATSAPP_META_PHONE_NUMBER_ID || "1330469396819460";
const DEFAULT_WABA_ID = process.env.WHATSAPP_META_WABA_ID || "2318352782319691";
const DEFAULT_ACCESS_TOKEN = process.env.WHATSAPP_META_ACCESS_TOKEN || "";

/**
 * Normalizes phone numbers to international standard format (E.164 without +)
 * e.g., "085645365440" -> "6285645365440"
 *       "+62 812-3456-7890" -> "6281234567890"
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
 * Low-level HTTP call to Meta Graph API for WhatsApp Cloud Messaging
 */
export async function sendMetaWhatsAppMessage({
    to,
    message,
    templateName,
    templateLanguage = "id",
    templateComponents,
    accessToken,
    phoneNumberId
}: {
    to: string;
    message?: string;
    templateName?: string;
    templateLanguage?: string;
    templateComponents?: any[];
    accessToken?: string;
    phoneNumberId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string; raw?: any }> {
    const activePhoneId = phoneNumberId || DEFAULT_PHONE_NUMBER_ID;
    const activeToken = accessToken || DEFAULT_ACCESS_TOKEN;
    const cleanTo = normalizePhoneNumber(to);

    if (!cleanTo) {
        return { success: false, error: "Nomor tujuan tidak valid atau kosong." };
    }

    if (!activeToken) {
        return {
            success: false,
            error: "Meta WhatsApp Access Token belum dikonfigurasi di Environment / Pengaturan Server."
        };
    }

    const url = `https://graph.facebook.com/${META_API_VERSION}/${activePhoneId}/messages`;

    // Construct request body depending on whether template or text message is used
    let bodyPayload: any;

    if (templateName) {
        bodyPayload = {
            messaging_product: "whatsapp",
            to: cleanTo,
            type: "template",
            template: {
                name: templateName,
                language: { code: templateLanguage },
                ...(templateComponents && templateComponents.length > 0 ? { components: templateComponents } : {})
            }
        };
    } else {
        bodyPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanTo,
            type: "text",
            text: {
                preview_url: false,
                body: message || "Halo dari My Tara CRS."
            }
        };
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${activeToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyPayload)
        });

        const data = await response.json();

        if (response.ok && data.messages && data.messages.length > 0) {
            return {
                success: true,
                messageId: data.messages[0].id,
                raw: data
            };
        } else {
            // Auto-fallback: If blocked by 24-hour customer service window, fallback to official pre-approved template
            if (data.error?.code === 131047 && !templateName) {
                console.log("[Meta WhatsApp] Outside 24h customer window. Retrying with official template hello_world...");
                return sendMetaWhatsAppMessage({
                    to: cleanTo,
                    templateName: "hello_world",
                    templateLanguage: "en_US",
                    accessToken: activeToken,
                    phoneNumberId: activePhoneId
                });
            }

            const errorMsg = data.error?.message || data.error?.error_user_msg || JSON.stringify(data);
            console.error(`[Meta WhatsApp API Error] HTTP ${response.status}:`, data);
            return {
                success: false,
                error: errorMsg,
                raw: data
            };
        }
    } catch (err: any) {
        console.error("[Meta WhatsApp API Network Error]:", err);
        return {
            success: false,
            error: err.message || "Network error contacting Meta Graph API"
        };
    }
}

/**
 * High-level function: Reads hotel-specific owner phone number from Firestore and dispatches notification.
 * Multi-tenant safe: Hotel A's bookings only go to Hotel A's owner phone number.
 */
export async function sendWhatsAppNotificationToOwner(
    hotelCode: string,
    payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; reason?: string; error?: string; messageId?: string }> {
    if (!hotelCode) return { success: false, reason: "hotelCode is required" };

    try {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return { success: false, reason: `Hotel [${hotelCode}] tidak ditemukan.` };
        }

        const hotelData = hotelDoc.data() || {};
        const waConfig = hotelData.whatsappNotification || {};

        // Check if WhatsApp notification is enabled for this hotel
        const isEnabled = waConfig.enabled !== false; // Default true if configured
        const targetPhone = waConfig.ownerPhone || hotelData.phone || "";

        if (!isEnabled) {
            return { success: false, reason: `Notifikasi WhatsApp dinonaktifkan untuk hotel ${hotelCode}.` };
        }

        if (!targetPhone) {
            return { success: false, reason: `Nomor WhatsApp Owner belum diatur untuk hotel ${hotelCode}.` };
        }

        // Check event toggle
        if (payload.event === "booking_cancellation" && waConfig.notifyOnCancellation === false) {
            return { success: false, reason: "Notifikasi pembatalan dimatikan oleh owner." };
        }
        if (payload.event === "booking_new" && waConfig.notifyOnNewBooking === false) {
            return { success: false, reason: "Notifikasi booking baru dimatikan oleh owner." };
        }

        const hotelName = hotelData.name || hotelData.propertyName || `Hotel #${hotelCode}`;
        const isCancel = payload.event === "booking_cancellation";
        const isModif = payload.event === "booking_modification";

        const formattedPrice = typeof payload.totalPrice === "number"
            ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(payload.totalPrice)
            : payload.totalPrice;

        // Build elegant notification message
        let header = "🛎️ *RESERVASI BARU MASUK!*";
        if (isCancel) header = "🚨 *PEMBATALAN RESERVASI OTA!*";
        if (isModif) header = "✏️ *PERUBAHAN RESERVASI OTA!*";
        if (payload.event === "test") header = "🧪 *TES NOTIFIKASI WHATSAPP TARA*";

        const messageText = [
            header,
            "━━━━━━━━━━━━━━━━━━━━",
            `🏨 *Properti*: ${hotelName}`,
            `🌐 *Saluran*: ${payload.channelName || "OTA Channel"}`,
            `🔢 *No. Reservasi*: ${payload.bookingRef}`,
            `👤 *Nama Tamu*: ${payload.guestName}`,
            `🛏️ *Tipe Kamar*: ${payload.roomName}`,
            `📅 *Check-in*: ${payload.arrivalDate}`,
            `📅 *Check-out*: ${payload.departureDate} ${payload.nights ? `(${payload.nights} Malam)` : ""}`,
            `💰 *Total Tarif*: ${formattedPrice}`,
            `💳 *Pembayaran*: ${payload.paymentStatus || "Belum Bayar / Sesuai OTA"}`,
            ...(payload.customNote ? [`📝 *Catatan*: ${payload.customNote}`] : []),
            "━━━━━━━━━━━━━━━━━━━━",
            `_Powered by Tara_`
        ].filter(Boolean).join("\n");

        // Custom hotel credentials if configured per hotel, else default to system
        const accessToken = waConfig.accessToken || DEFAULT_ACCESS_TOKEN;
        const phoneNumberId = waConfig.phoneNumberId || DEFAULT_PHONE_NUMBER_ID;

        // Dispatch message
        const sendResult = await sendMetaWhatsAppMessage({
            to: targetPhone,
            message: messageText,
            accessToken,
            phoneNumberId
        });

        // Audit logging in Firestore
        await adminDb.collection("hotels").doc(hotelCode).collection("whatsapp_logs").add({
            timestamp: new Date().toISOString(),
            event: payload.event,
            recipient: targetPhone,
            bookingRef: payload.bookingRef,
            guestName: payload.guestName,
            channelName: payload.channelName,
            status: sendResult.success ? "DELIVERED" : "FAILED",
            messageId: sendResult.messageId || null,
            error: sendResult.error || null
        }).catch(() => {});

        return sendResult;
    } catch (err: any) {
        console.error(`[WhatsApp Notification Error for Hotel ${hotelCode}]:`, err);
        return { success: false, reason: err.message };
    }
}
