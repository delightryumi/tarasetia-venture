import { adminDb } from "@/lib/firebaseAdmin";
import { formatCurrencyAmount } from "@/lib/currency-utils";

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
    eta?: string;
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
    grossPrice?: number | string;
    revenueRecordingMode?: string;
    otaCommission?: number | string;
    currency?: string;
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

// ── NOTIFICATION IDEMPOTENCY / DEDUPLICATION CACHE ──
// Prevents duplicate notifications when Channex retries webhooks or sync-feed triggers concurrently
const NOTIFICATION_DEDUP_CACHE = new Map<string, number>();
const DEDUP_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown window

/**
 * High-level function: Reads hotel-specific owner phone number(s) from Firestore and dispatches notification.
 * Multi-tenant safe & Multi-recipient capable: Sends to all configured owner/GM phone numbers.
 */
export async function sendWhatsAppNotificationToOwner(
    hotelCode: string,
    payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; reason?: string; error?: string; messageId?: string; deliveredCount?: number; totalRecipients?: number; details?: any[] }> {
    if (!hotelCode) return { success: false, reason: "hotelCode is required" };

    // 0. Idempotency Check: Prevent duplicate messages for identical booking events within cooldown
    const isTestEvent = payload.event === "test";
    const dedupKey = `${hotelCode}_${payload.bookingRef}_${payload.event}_${payload.revisionId || ""}`;
    const now = Date.now();
    const lastDispatched = NOTIFICATION_DEDUP_CACHE.get(dedupKey);
    if (!isTestEvent && lastDispatched && (now - lastDispatched) < DEDUP_COOLDOWN_MS) {
        console.log(`[WhatsApp Meta] 🛡️ Duplicate dispatch suppressed for [${dedupKey}] (${Math.round((now - lastDispatched)/1000)}s since last send)`);
        return {
            success: true,
            reason: `Duplicate dispatch suppressed within 60s cooldown window for booking ${payload.bookingRef}.`
        };
    }

    try {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return { success: false, reason: `Hotel [${hotelCode}] tidak ditemukan.` };
        }

        const hotelData = hotelDoc.data() || {};
        const waConfig = hotelData.whatsappNotification || {};

        // Check if WhatsApp notification is explicitly enabled for this hotel
        const isEnabled = waConfig.enabled === true; // Strictly require explicit enabled: true
        const rawTarget = payload.customRecipient || waConfig.ownerPhone || waConfig.phones || "";
        const targetPhones = parsePhoneNumbers(rawTarget);

        if (!isEnabled || targetPhones.length === 0) {
            return { success: false, reason: `Notifikasi WhatsApp dinonaktifkan atau nomor belum diatur untuk hotel ${hotelCode}. (Biaya Meta Rp 0)` };
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
        const hotelCurrency = (payload.currency || hotelData.currency || hotelData.channelManager?.currency || hotelData.settings?.currency || "IDR").toUpperCase().trim();
        const hotelPricingModel = (hotelData.channelManager?.pricingModel || hotelData.settings?.revenueRecordingMode || payload.revenueRecordingMode || "net").toUpperCase();
        payload.currency = hotelCurrency;
        payload.revenueRecordingMode = hotelPricingModel;

        // Strict Enforcement of Tara Channel Manager Pricing Model:
        let displayTariff = payload.totalPrice;
        if (hotelPricingModel === "NET" && payload.netToHotel && payload.netToHotel > 0) {
            displayTariff = payload.netToHotel;
        } else if (hotelPricingModel === "GROSS" && payload.grossPrice && payload.grossPrice > 0) {
            displayTariff = payload.grossPrice;
        }
        payload.totalPrice = displayTariff;

        const formattedPrice = formatCurrencyAmount(displayTariff, hotelCurrency);
        const modeBadge = hotelPricingModel === "NET" ? " (Nett)" : " (Gross)";

        // Build elegant, comprehensive notification message
        const messageText = buildWhatsAppMessage(hotelName, payload);

        // Custom hotel credentials if configured per hotel, else default to system
        const accessToken = waConfig.accessToken || DEFAULT_ACCESS_TOKEN;
        const phoneNumberId = waConfig.phoneNumberId || DEFAULT_PHONE_NUMBER_ID;

        // Dispatch message via Meta Official Template
        const templateChannel = isCancel 
            ? `[CANCELLED] ${payload.channelName || "OTA Channel"}` 
            : (isModif ? `[MODIFIED] ${payload.channelName || "OTA Channel"}` : (payload.channelName || "OTA Channel"));
        const templateGuest = isCancel 
            ? `${payload.guestName || "-"} (CANCELLED)` 
            : (isModif ? `${payload.guestName || "-"} (MODIFIED)` : (payload.guestName || "-"));
        const templateCheckIn = payload.eta 
            ? `${payload.arrivalDate || "-"} (ETA: ${payload.eta})` 
            : (payload.arrivalDate || "-");
        const templatePrice = isCancel 
            ? `${formattedPrice}${modeBadge} (CANCELLED)`.slice(0, 30) 
            : `${formattedPrice}${modeBadge}`.slice(0, 30);

        const sanitizeParam = (val: any, maxLen: number, fallback = "-"): string => {
            if (val === undefined || val === null) return fallback;
            const cleaned = String(val).replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
            if (!cleaned) return fallback;
            return cleaned.slice(0, maxLen);
        };

        // 1. Legacy 8-parameter Indonesian approved template
        const legacyTemplateComponents = [
            {
                type: "body",
                parameters: [
                    { type: "text", text: sanitizeParam(`${hotelName} (#${hotelCode})`, 60, "Hotel") },
                    { type: "text", text: sanitizeParam(templateChannel, 40, "OTA Channel") },
                    { type: "text", text: sanitizeParam(payload.bookingRef, 40, "-") },
                    { type: "text", text: sanitizeParam(templateGuest, 60, "-") },
                    { type: "text", text: sanitizeParam(payload.roomName, 60, "-") },
                    { type: "text", text: sanitizeParam(templateCheckIn, 30, "-") },
                    { type: "text", text: sanitizeParam(`${payload.departureDate || "-"} ${payload.nights ? `(${payload.nights} Malam)` : ""}`, 30, "-") },
                    { type: "text", text: sanitizeParam(templatePrice, 30, "-") }
                ]
            }
        ];

        // 2. New 11-parameter International Hotelier template with Interactive Buttons
        const guestContactDisplay = `${payload.guestName || "-"}${payload.guestPhone ? ` (${payload.guestPhone})` : ""}`;
        const planPaxDisplay = `${payload.mealsIncluded !== undefined ? (payload.mealsIncluded ? "With Breakfast Included" : "Room Only") : "Standard Plan"} • ${payload.pax || 2} Guests`;
        const paymentLabel = payload.paymentStatus || "Collect by OTA (Prepaid)";
        const notesSummary = payload.customNote || payload.notes || "No special request";

        const newTemplateComponents = [
            {
                type: "body",
                parameters: [
                    { type: "text", text: sanitizeParam(`${hotelName} (#${hotelCode})`, 60, "Hotel") },
                    { type: "text", text: sanitizeParam(templateChannel, 40, "OTA Channel") },
                    { type: "text", text: sanitizeParam(payload.bookingRef, 40, "-") },
                    { type: "text", text: sanitizeParam(guestContactDisplay, 60, "-") },
                    { type: "text", text: sanitizeParam(payload.roomName, 60, "-") },
                    { type: "text", text: sanitizeParam(templateCheckIn, 30, "-") },
                    { type: "text", text: sanitizeParam(`${payload.departureDate || "-"} ${payload.nights ? `(${payload.nights} Nights)` : ""}`, 30, "-") },
                    { type: "text", text: sanitizeParam(planPaxDisplay, 40, "-") },
                    { type: "text", text: sanitizeParam(templatePrice, 30, "-") },
                    { type: "text", text: sanitizeParam(paymentLabel, 35, "-") },
                    { type: "text", text: sanitizeParam(notesSummary, 80, "No special request") }
                ]
            }
        ];

        // Send to all target phone numbers in parallel
        const sendPromises = targetPhones.map(async (phone) => {
            // Priority 1: Try New International 11-parameter Template with Interactive Buttons
            let res = await sendMetaWhatsAppMessage({
                to: phone,
                templateName: "crs_reservation_notification",
                templateLanguage: "en_US",
                templateComponents: newTemplateComponents,
                message: messageText,
                accessToken,
                phoneNumberId
            });

            let usedTemplate = "crs_reservation_notification";

            // Priority 2: Fallback to existing Approved 8-parameter Template if new template is still PENDING
            if (!res.success) {
                console.log(`[Meta WhatsApp] Primary template [crs_reservation_notification] unready (${res.error}), falling back to approved template [crs_booking_notification]...`);
                const fallbackTemplateRes = await sendMetaWhatsAppMessage({
                    to: phone,
                    templateName: "crs_booking_notification",
                    templateLanguage: "id",
                    templateComponents: legacyTemplateComponents,
                    message: messageText,
                    accessToken,
                    phoneNumberId
                });

                if (fallbackTemplateRes.success) {
                    res = fallbackTemplateRes;
                    usedTemplate = "crs_booking_notification";
                } else {
                    // Priority 3: Fallback to direct text if both templates fail
                    const directRes = await sendMetaWhatsAppMessage({
                        to: phone,
                        message: messageText,
                        accessToken,
                        phoneNumberId
                    });
                    if (directRes.success) {
                        res = directRes;
                        usedTemplate = "direct_text";
                    }
                }
            } else if (payload.notes || payload.customNote) {
                // Priority 4: If template succeeded and guest provided extra long notes,
                // try sending additional detail via text (delivers if customer 24h window is open)
                const specialNotes = (payload.notes || payload.customNote || "").replace(/[\r\n]+/g, " ").trim();
                if (specialNotes && specialNotes.length > 50) {
                    sendMetaWhatsAppMessage({
                        to: phone,
                        message: `📝 *Guest Remark (${payload.bookingRef}):*\n"${specialNotes}"`,
                        accessToken,
                        phoneNumberId
                    }).catch(() => {});
                }
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
                error: res.error || null,
                templateUsed: res.success ? usedTemplate : null
            }).catch(() => {});

            return { phone, ...res };
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(r => r.success).length;

        if (successCount > 0) {
            NOTIFICATION_DEDUP_CACHE.set(dedupKey, now);
            // Periodic cleanup of stale dedup keys
            for (const [k, ts] of NOTIFICATION_DEDUP_CACHE.entries()) {
                if (now - ts > DEDUP_COOLDOWN_MS * 2) {
                    NOTIFICATION_DEDUP_CACHE.delete(k);
                }
            }
        }

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
 * Formatted with professional hospitality industry standards (hotelier grade).
 */
export function buildWhatsAppMessage(hotelName: string, payload: WhatsAppNotificationPayload): string {
    const isCancel = payload.event === "booking_cancellation" || payload.event === "booking_cancelled";
    const isModif = payload.event === "booking_modification" || payload.event === "booking_modified";
    const isTest = payload.event === "test";

    const activeCurrency = (payload.currency || "IDR").toUpperCase().trim();
    const formattedPrice = formatCurrencyAmount(payload.totalPrice, activeCurrency);
    const isNet = (payload.revenueRecordingMode || "").toUpperCase() === "NET";
    const modeBadge = isNet ? " (Nett to Hotel)" : " (Gross)";

    if (isTest) {
        return [
            "🧪 *TARA CRS NOTIFICATION TEST*",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `🏨 *Property*: ${hotelName}`,
            `🌐 *Channel*: ${payload.channelName || "Direct Channel"}`,
            `🔢 *Booking Reference*: ${payload.bookingRef}`,
            `👤 *Guest Name*: ${payload.guestName}`,
            `🛏️ *Room Type*: ${payload.roomName}`,
            `📅 *Check-in Date*: ${payload.arrivalDate}${payload.eta ? ` (Est. ETA: ${payload.eta})` : ""}`,
            `📅 *Check-out Date*: ${payload.departureDate}${payload.nights ? ` (${payload.nights} Nights)` : ""}`,
            `💰 *Total Tariff*: ${formattedPrice}${modeBadge}`,
            `💳 *Payment Policy*: ${payload.paymentStatus || "Paid (Test)"}`,
            ...(payload.customNote || payload.notes ? [
                "",
                `📝 *Guest Notes / Remarks*:`,
                `"${payload.customNote || payload.notes}"`
            ] : []),
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "✅ *Status*: WhatsApp Gateway is successfully connected to your PMS.",
            "_Powered by My Tara Central Reservation System_"
        ].filter(Boolean).join("\n");
    }

    if (isCancel) {
        return [
            "📋 *BOOKING CANCELLATION NOTICE*",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `🏨 *Property*: ${hotelName}`,
            `🌐 *Channel*: ${payload.channelName || "OTA Channel"}`,
            `🔢 *Booking Reference*: ${payload.bookingRef}`,
            "❌ *Status*: CANCELLED",
            "",
            `👤 *Guest Name*: ${payload.guestName}`,
            ...(payload.guestPhone ? [`📞 *Contact*: ${payload.guestPhone}`] : []),
            `🛏️ *Room Type*: ${payload.roomName}${payload.roomCount && payload.roomCount > 1 ? ` (${payload.roomCount} Rooms)` : ""}`,
            `📅 *Original Stay Dates*: ${payload.arrivalDate} to ${payload.departureDate}${payload.nights ? ` (${payload.nights} Nights)` : ""}`,
            `💰 *Original Tariff Value*: ${formattedPrice}${modeBadge} (Cancelled / Void)`,
            ...(payload.cancellationReason ? [`📝 *Cancellation Reason*: ${payload.cancellationReason}`] : []),
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "⚡ *PMS Operational Status*: Room allotment has been released back to general inventory across all channels.",
            "_Powered by My Tara Central Reservation System_"
        ].filter(Boolean).join("\n");
    }

    if (isModif) {
        const hasOldDates = Boolean(payload.previousArrivalDate && payload.previousDepartureDate);
        return [
            "🔄 *BOOKING MODIFICATION CONFIRMED*",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `🏨 *Property*: ${hotelName}`,
            `🌐 *Channel*: ${payload.channelName || "OTA Channel"}`,
            `🔢 *Booking Reference*: ${payload.bookingRef}`,
            "🔄 *Status*: MODIFIED",
            "",
            `👤 *Guest Name*: ${payload.guestName}`,
            ...(payload.guestPhone ? [`📞 *Contact*: ${payload.guestPhone}`] : []),
            `🛏️ *Room Type*: ${payload.roomName}${payload.roomCount && payload.roomCount > 1 ? ` (${payload.roomCount} Rooms)` : ""}`,
            ...(payload.mealsIncluded !== undefined ? [`🍳 *Meal Plan*: ${payload.mealsIncluded ? "With Breakfast Included" : "Room Only"}`] : []),
            "",
            `📅 *New Check-in*: ${payload.arrivalDate}${payload.eta ? ` (Est. ETA: ${payload.eta})` : ""}`,
            `📅 *New Check-out*: ${payload.departureDate}${payload.nights ? ` (${payload.nights} Nights)` : ""}`,
            ...(hasOldDates ? [`⏳ *Previous Schedule*: ${payload.previousArrivalDate} to ${payload.previousDepartureDate}`] : []),
            "",
            `💰 *Total Tariff*: ${formattedPrice}${modeBadge}`,
            `💳 *Payment Policy*: ${payload.paymentStatus || "Per OTA Policy"}`,
            ...(payload.customNote || payload.notes ? [
                "",
                `📝 *Guest Notes / Remarks*:`,
                `"${payload.customNote || payload.notes}"`
            ] : []),
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "⚡ *PMS Operational Status*: New stay dates locked in PMS. Previous room dates released to inventory.",
            "_Powered by My Tara Central Reservation System_"
        ].filter(Boolean).join("\n");
    }

    // Default: booking_new
    const mealLabelEn = payload.mealsIncluded !== undefined 
        ? (payload.mealsIncluded ? "With Breakfast Included" : "Room Only")
        : null;

    return [
        "🛎️ *NEW RESERVATION CONFIRMED*",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `🏨 *Property*: ${hotelName}`,
        `🌐 *Channel*: ${payload.channelName || "OTA Channel"}`,
        `🔢 *Booking Reference*: ${payload.bookingRef}`,
        ...(payload.revisionId ? [`🆔 *OTA Revision ID*: ${payload.revisionId}`] : []),
        "",
        `👤 *Guest Name*: ${payload.guestName}`,
        ...(payload.guestPhone ? [`📞 *Contact*: ${payload.guestPhone}`] : []),
        ...(payload.guestEmail ? [`📧 *Email*: ${payload.guestEmail}`] : []),
        "",
        `🛏️ *Room Type*: ${payload.roomName}${payload.roomCount && payload.roomCount > 1 ? ` (${payload.roomCount} Rooms)` : ""}`,
        ...(payload.pax ? [`👥 *Total Guests*: ${payload.pax} Guests`] : []),
        ...(mealLabelEn ? [`🍳 *Meal Plan*: ${mealLabelEn}`] : []),
        `📅 *Check-in Date*: ${payload.arrivalDate}${payload.eta ? ` (Est. ETA: ${payload.eta})` : ""}`,
        `📅 *Check-out Date*: ${payload.departureDate}${payload.nights ? ` (${payload.nights} Nights)` : ""}`,
        "",
        `💰 *Total Tariff*: ${formattedPrice}${modeBadge}`,
        `💳 *Payment Policy*: ${payload.paymentStatus || "Per OTA Policy"}`,
        ...(payload.customNote || payload.notes ? [
            "",
            `📝 *Guest Notes / Special Requests*:`,
            `"${payload.customNote || payload.notes}"`
        ] : []),
        "━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "⚡ *PMS Operational Status*: Room allotment is secured on the PMS calendar and channel inventory has been updated.",
        "_Powered by My Tara Central Reservation System_"
    ].filter(Boolean).join("\n");
}

