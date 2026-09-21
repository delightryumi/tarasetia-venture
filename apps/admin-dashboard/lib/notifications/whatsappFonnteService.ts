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
    netToHotel?: number | string;
    otaCommission?: number | string;
}

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
}): Promise<{ success: boolean; id?: string; error?: string; raw?: any }> {
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
): Promise<{ success: boolean; reason?: string; error?: string; messageId?: string }> {
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
        const isCancel = payload.event === "booking_cancellation";
        const isModif = payload.event === "booking_modification";

        const formattedPrice = typeof payload.totalPrice === "number"
            ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(payload.totalPrice)
            : payload.totalPrice;

        // Build neat, rich, bilingual notification message
        let header = "🛎️ *RESERVASI BARU MASUK / NEW RESERVATION ALERT*";
        let actionNote = "";

        if (isCancel) {
            header = "🚨 *PEMBATALAN RESERVASI / RESERVATION CANCELLED*";
            actionNote = "⚡ *Tindakan Sistem / Action*: Slot kamar otomatis dibuka kembali ke semua saluran OTA.\n_Room inventory has been automatically released back to all channels._";
        } else if (isModif) {
            header = "✏️ *PERUBAHAN JADWAL RESERVASI / BOOKING MODIFIED (RESCHEDULE)*";
            actionNote = "📌 *Tindakan Sistem / Action*: Kalender ketersediaan telah disesuaikan otomatis di PMS.\n_Inventory and stay dates have been updated automatically in PMS._";
        } else if (payload.event === "test") {
            header = "🧪 *TES NOTIFIKASI WHATSAPP / SYSTEM INTEGRATION TEST*";
            actionNote = "✅ *Status*: Integrasi WhatsApp Gateway Fonnte terhubung aktif ke My Tara PMS.";
        }

        const messageText = [
            header,
            "━━━━━━━━━━━━━━━━━━━━━━━━",
            `🏨 *Properti / Property*: ${hotelName}`,
            `🌐 *Saluran / Channel*: ${payload.channelName || "OTA Channel"}`,
            `🔢 *No. Reservasi / Booking ID*: ${payload.bookingRef}`,
            "",
            `👤 *Nama Tamu / Guest*: ${payload.guestName}`,
            `🛏️ *Tipe Kamar / Room*: ${payload.roomName}`,
            `📅 *Check-in*: ${payload.arrivalDate}`,
            `📅 *Check-out*: ${payload.departureDate}`,
            `⏳ *Durasi / Duration*: ${payload.nights ? `${payload.nights} Malam / ${payload.nights} Night(s)` : "1 Malam"}`,
            `💰 *Total Tarif / Total Amount*: ${formattedPrice}`,
            ...(payload.netToHotel && Number(payload.netToHotel) !== Number(payload.totalPrice) ? [
                `💵 *Net to Hotel (Est. Payout)*: ${typeof payload.netToHotel === 'number' ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(payload.netToHotel)) : payload.netToHotel}`
            ] : []),
            `💳 *Pembayaran / Payment*: ${payload.paymentStatus || "Sesuai OTA"}`,
            ...(payload.customNote ? [
                "━━━━━━━━━━━━━━━━━━━━━━━━",
                `📝 *Catatan Khusus / Special Request*:`,
                `"${payload.customNote}"`
            ] : []),
            ...(actionNote ? [
                "━━━━━━━━━━━━━━━━━━━━━━━━",
                actionNote
            ] : []),
            "━━━━━━━━━━━━━━━━━━━━━━━━",
            `_Powered by Tara_`
        ].filter(Boolean).join("\n");

        const token = waConfig.fonnteToken || DEFAULT_FONNTE_TOKEN;

        const result = await sendFonnteMessage({
            target: targetPhone,
            message: messageText,
            token
        });

        // Audit log in Firestore
        await adminDb.collection("hotels").doc(hotelCode).collection("whatsapp_logs").add({
            timestamp: new Date().toISOString(),
            gateway: "fonnte",
            event: payload.event,
            recipient: targetPhone,
            bookingRef: payload.bookingRef,
            guestName: payload.guestName,
            channelName: payload.channelName,
            status: result.success ? "DELIVERED" : "FAILED",
            messageId: result.id || null,
            error: result.error || null
        }).catch(() => {});

        return {
            success: result.success,
            messageId: result.id,
            error: result.error,
            reason: result.error
        };
    } catch (err: any) {
        console.error(`[WhatsApp Fonnte Error for Hotel ${hotelCode}]:`, err);
        return { success: false, reason: err.message, error: err.message };
    }
}
