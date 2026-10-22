import { adminDb } from "@/lib/firebaseAdmin";

export interface WhatsAppNotificationPayload {
    event: "booking_new" | "booking_cancellation" | "booking_cancelled" | "booking_modification" | "booking_modified" | "test";
    channelName: string;
    bookingRef: string;
    guestName: string;
    guestPhone?: string;
    guestEmail?: string;
    roomName: string;
    roomCount?: number;
    pax?: number;
    mealsIncluded?: boolean;
    arrivalDate: string;
    departureDate: string;
    totalPrice: number | string;
    paymentStatus?: string;
    nights?: number;
    customNote?: string;
    notes?: string;
    customRecipient?: string | string[];
    previousArrivalDate?: string;
    previousDepartureDate?: string;
    revisionId?: string;
    cancellationReason?: string;
    netToHotel?: number | string;
    otaCommission?: number | string;
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
 * Helper to parse a raw string or array of phone numbers into an array of clean normalized E.164 strings.
 * e.g. "08813794763, 081234567890; 085645365440" -> ["628813794763", "6281234567890", "6285645365440"]
 */
export function parsePhoneNumbers(rawPhone: string | string[]): string[] {
    if (!rawPhone) return [];
    const list = Array.isArray(rawPhone) ? rawPhone : String(rawPhone).split(/[,;\n\r]+/);
    const normalized = list
        .map(p => normalizePhoneNumber(p.trim()))
        .filter(p => p.length >= 8);
    return Array.from(new Set(normalized));
}

/**
 * High-level function: Reads hotel-specific owner phone number(s) from Firestore and dispatches notification.
 * Multi-tenant safe & Multi-recipient capable: Sends to all configured owner/GM phone numbers.
 */
export async function sendWhatsAppNotificationToOwner(
    hotelCode: string,
    payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; reason?: string; error?: string; messageId?: string; deliveredCount?: number; totalRecipients?: number; details?: any[] }> {
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
        const rawTarget = payload.customRecipient || waConfig.ownerPhone || waConfig.phones || hotelData.phone || "";
        const targetPhones = parsePhoneNumbers(rawTarget);

        if (!isEnabled) {
            return { success: false, reason: `Notifikasi WhatsApp dinonaktifkan untuk hotel ${hotelCode}.` };
        }

        if (targetPhones.length === 0) {
            return { success: false, reason: `Nomor WhatsApp Owner belum diatur untuk hotel ${hotelCode}.` };
        }

        const isCancel = payload.event === "booking_cancellation" || payload.event === "booking_cancelled";
        const isModif = payload.event === "booking_modification" || payload.event === "booking_modified";

        // Check event toggle
        if (isCancel && waConfig.notifyOnCancellation === false) {
            return { success: false, reason: "Notifikasi pembatalan dimatikan oleh owner." };
        }
        if (payload.event === "booking_new" && waConfig.notifyOnNewBooking === false) {
            return { success: false, reason: "Notifikasi booking baru dimatikan oleh owner." };
        }
        if (isModif && waConfig.notifyOnModification === false) {
            return { success: false, reason: "Notifikasi perubahan reservasi dimatikan oleh owner." };
        }

        const hotelName = hotelData.name || hotelData.propertyName || `Hotel #${hotelCode}`;
        const formattedPrice = typeof payload.totalPrice === "number"
            ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(payload.totalPrice)
            : (payload.totalPrice ? String(payload.totalPrice) : "Rp 0");

        // Build elegant, comprehensive notification message (Net to Hotel & Commission are strictly omitted)
        const messageText = buildWhatsAppMessage(hotelName, payload);

        // Custom hotel credentials if configured per hotel, else default to system
        const accessToken = waConfig.accessToken || DEFAULT_ACCESS_TOKEN;
        const phoneNumberId = waConfig.phoneNumberId || DEFAULT_PHONE_NUMBER_ID;

        // Dispatch message via Meta Official Template
        const templateChannel = isCancel 
            ? `[BATAL] ${payload.channelName || "OTA"}` 
            : (isModif ? `[REVISI] ${payload.channelName || "OTA"}` : (payload.channelName || "OTA Channel"));
        const templateGuest = isCancel 
            ? `${payload.guestName || "-"} (BATAL)` 
            : (isModif ? `${payload.guestName || "-"} (REVISI)` : (payload.guestName || "-"));
        const templatePrice = isCancel 
            ? `${formattedPrice} (BATAL)` 
            : (formattedPrice || "0");

        const templateComponents = [
            {
                type: "body",
                parameters: [
                    { type: "text", text: String(hotelName || "Hotel").slice(0, 60) },
                    { type: "text", text: String(templateChannel).slice(0, 40) },
                    { type: "text", text: String(payload.bookingRef || "-").slice(0, 40) },
                    { type: "text", text: String(templateGuest).slice(0, 60) },
                    { type: "text", text: String(payload.roomName || "-").slice(0, 60) },
                    { type: "text", text: String(payload.arrivalDate || "-").slice(0, 30) },
                    { type: "text", text: String(`${payload.departureDate || "-"} ${payload.nights ? `(${payload.nights} Malam)` : ""}`).slice(0, 30) },
                    { type: "text", text: String(templatePrice).slice(0, 30) }
                ]
            }
        ];

        // Send to all target phone numbers in parallel
        const sendPromises = targetPhones.map(async (phone) => {
            let res = await sendMetaWhatsAppMessage({
                to: phone,
                templateName: "crs_booking_notification",
                templateLanguage: "id",
                templateComponents,
                message: messageText,
                accessToken,
                phoneNumberId
            });

            // If template is still pending, not found, or param mismatch, fallback to direct text message
            const errorCode = res.raw?.error?.code;
            if (!res.success && (errorCode === 132001 || errorCode === 132000 || errorCode === 132005 || errorCode === 100 || errorCode?.toString()?.startsWith("132"))) {
                res = await sendMetaWhatsAppMessage({
                    to: phone,
                    message: messageText,
                    accessToken,
                    phoneNumberId
                });
            }

            // Audit logging in Firestore per recipient
            await adminDb.collection("hotels").doc(hotelCode).collection("whatsapp_logs").add({
                timestamp: new Date().toISOString(),
                event: payload.event,
                recipient: phone,
                bookingRef: payload.bookingRef,
                guestName: payload.guestName,
                channelName: payload.channelName,
                status: res.success ? "DELIVERED" : "FAILED",
                messageId: res.messageId || null,
                error: res.error || null
            }).catch(() => {});

            return { phone, ...res };
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(r => r.success).length;

        return {
            success: successCount > 0,
            deliveredCount: successCount,
            totalRecipients: targetPhones.length,
            messageId: results.find(r => r.messageId)?.messageId,
            details: results,
            error: successCount === 0 ? results[0]?.error || "Gagal mengirim ke semua nomor." : undefined
        };
    } catch (err: any) {
        console.error(`[WhatsApp Notification Error for Hotel ${hotelCode}]:`, err);
        return { success: false, reason: err.message };
    }
}

/**
 * Builds a structured, complete, and beautiful WhatsApp notification text.
 * Strictly excludes any internal financial commission or net-to-hotel payout lines.
 */
export function buildWhatsAppMessage(hotelName: string, payload: WhatsAppNotificationPayload): string {
    const isCancel = payload.event === "booking_cancellation" || payload.event === "booking_cancelled";
    const isModif = payload.event === "booking_modification" || payload.event === "booking_modified";
    const isTest = payload.event === "test";

    const formattedPrice = typeof payload.totalPrice === "number"
        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(payload.totalPrice)
        : (payload.totalPrice ? String(payload.totalPrice) : "Rp 0");

    if (isTest) {
        return [
            "🧪 *TES NOTIFIKASI WHATSAPP TARA*",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `🏨 *Properti*: ${hotelName}`,
            `🌐 *Saluran*: ${payload.channelName || "Test Channel"}`,
            `🔢 *No. Reservasi*: ${payload.bookingRef}`,
            `👤 *Nama Tamu*: ${payload.guestName}`,
            `🛏️ *Tipe Kamar*: ${payload.roomName}`,
            `📅 *Check-in*: ${payload.arrivalDate}`,
            `📅 *Check-out*: ${payload.departureDate}${payload.nights ? ` (${payload.nights} Malam)` : ""}`,
            `💰 *Total Tarif*: ${formattedPrice}`,
            `💳 *Pembayaran*: ${payload.paymentStatus || "Lunas (Test)"}`,
            ...(payload.customNote ? [`📝 *Catatan*: ${payload.customNote}`] : []),
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "✅ *Status*: Integrasi WhatsApp Gateway terhubung aktif ke My Tara PMS.",
            "_Powered by Tara_"
        ].filter(Boolean).join("\n");
    }

    if (isCancel) {
        return [
            "🚨 *PEMBATALAN RESERVASI OTA!*",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `🏨 *Properti*: ${hotelName}`,
            `🌐 *Saluran*: ${payload.channelName || "OTA Channel"}`,
            `🔢 *No. Reservasi*: ${payload.bookingRef}`,
            "⚠️ *Status*: DIBATALKAN (CANCELLED)",
            "",
            `👤 *Nama Tamu*: ${payload.guestName}`,
            ...(payload.guestPhone ? [`📞 *No. Kontak*: ${payload.guestPhone}`] : []),
            `🛏️ *Kamar Dibatalkan*: ${payload.roomName}${payload.roomCount && payload.roomCount > 1 ? ` (${payload.roomCount} Kamar)` : ""}`,
            `📅 *Jadwal Dibatalkan*: ${payload.arrivalDate} s/d ${payload.departureDate}${payload.nights ? ` (${payload.nights} Malam)` : ""}`,
            `💰 *Tarif Asal*: ${formattedPrice} (Dibatalkan / Void)`,
            ...(payload.cancellationReason ? [`📝 *Alasan*: ${payload.cancellationReason}`] : []),
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "⚡ *Tindakan Sistem*:",
            "✅ Slot kamar telah otomatis dibuka kembali ke seluruh saluran OTA.",
            "✅ Reservasi di PMS ditandai sebagai CANCELLED.",
            "_Powered by Tara_"
        ].filter(Boolean).join("\n");
    }

    if (isModif) {
        const hasOldDates = Boolean(payload.previousArrivalDate && payload.previousDepartureDate);
        return [
            "✏️ *PERUBAHAN JADWAL RESERVASI (RESCHEDULE)*",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `🏨 *Properti*: ${hotelName}`,
            `🌐 *Saluran*: ${payload.channelName || "OTA Channel"}`,
            `🔢 *No. Reservasi*: ${payload.bookingRef}`,
            "🔄 *Status*: MODIFIKASI JADWAL",
            "",
            `👤 *Nama Tamu*: ${payload.guestName}`,
            ...(payload.guestPhone ? [`📞 *No. Kontak*: ${payload.guestPhone}`] : []),
            `🛏️ *Tipe Kamar*: ${payload.roomName}${payload.roomCount && payload.roomCount > 1 ? ` (${payload.roomCount} Kamar)` : ""}`,
            ...(payload.mealsIncluded !== undefined ? [`🍳 *Paket*: ${payload.mealsIncluded ? "Termasuk Sarapan" : "Hanya Kamar"}`] : []),
            "",
            `📅 *Jadwal Baru*: ${payload.arrivalDate} s/d ${payload.departureDate}${payload.nights ? ` (${payload.nights} Malam)` : ""}`,
            ...(hasOldDates ? [`⏳ *Jadwal Sebelumnya*: ${payload.previousArrivalDate} s/d ${payload.previousDepartureDate}`] : []),
            "",
            `💰 *Total Tarif Baru*: ${formattedPrice}`,
            `💳 *Pembayaran*: ${payload.paymentStatus || "Sesuai OTA"}`,
            ...(payload.customNote || payload.notes ? [
                "",
                `📝 *Catatan*:`,
                `"${payload.customNote || payload.notes}"`
            ] : []),
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "⚡ *Tindakan Sistem*:",
            "✅ Jadwal lama telah dilepas & kamar pada tanggal baru berhasil diblokir.",
            "✅ Kalender inventori PMS & Channex telah diperbarui otomatis.",
            "_Powered by Tara_"
        ].filter(Boolean).join("\n");
    }

    // Default: booking_new
    const mealLabel = payload.mealsIncluded !== undefined 
        ? (payload.mealsIncluded ? "Termasuk Sarapan (With Breakfast)" : "Hanya Kamar (Room Only)")
        : null;

    return [
        "🛎️ *RESERVASI BARU MASUK!*",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `🏨 *Properti*: ${hotelName}`,
        `🌐 *Saluran*: ${payload.channelName || "OTA Channel"}`,
        `🔢 *No. Reservasi*: ${payload.bookingRef}`,
        ...(payload.revisionId ? [`🆔 *ID Revisi*: ${payload.revisionId}`] : []),
        "",
        `👤 *Nama Tamu*: ${payload.guestName}`,
        ...(payload.guestPhone ? [`📞 *No. Kontak*: ${payload.guestPhone}`] : []),
        ...(payload.guestEmail ? [`📧 *Email*: ${payload.guestEmail}`] : []),
        "",
        `🛏️ *Kamar*: ${payload.roomName}${payload.roomCount && payload.roomCount > 1 ? ` (${payload.roomCount} Kamar)` : ""}`,
        ...(payload.pax ? [`👥 *Jumlah Tamu*: ${payload.pax} Tamu`] : []),
        ...(mealLabel ? [`🍳 *Paket*: ${mealLabel}`] : []),
        `📅 *Check-in*: ${payload.arrivalDate}`,
        `📅 *Check-out*: ${payload.departureDate}${payload.nights ? ` (${payload.nights} Malam)` : ""}`,
        "",
        `💰 *Total Tarif*: ${formattedPrice}`,
        `💳 *Pembayaran*: ${payload.paymentStatus || "Sesuai OTA"}`,
        ...(payload.customNote || payload.notes ? [
            "",
            `📝 *Permintaan Khusus*:`,
            `"${payload.customNote || payload.notes}"`
        ] : []),
        "━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "⚡ *Status Sistem*: Kamar otomatis diblokir di PMS & kalender OTA telah disinkronkan.",
        "_Powered by Tara_"
    ].filter(Boolean).join("\n");
}

