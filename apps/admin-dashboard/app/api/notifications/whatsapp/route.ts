import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendWhatsAppNotificationToOwner as sendMetaNotification } from "@/lib/notifications/whatsappMetaService";
import { requireHotelAccess } from "@/lib/security/serverAuth";

const MASTER_ADMIN_PIN = process.env.ADMIN_MASTER_PIN;

function maskToken(token?: string): string {
    if (!token || typeof token !== "string") return "";
    if (token.length <= 8) return "********";
    return `${token.slice(0, 4)}********${token.slice(-4)}`;
}

/**
 * GET /api/notifications/whatsapp?hotelCode=1
 * Retrieve WhatsApp configuration for a specific hotel tenant
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelCode = searchParams.get("hotelCode");

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const authCheck = await requireHotelAccess(req, hotelCode);
        if ("errorResponse" in authCheck) return authCheck.errorResponse;

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: `Hotel [${hotelCode}] tidak ditemukan.` }, { status: 404 });
        }

        const hotelData = hotelDoc.data() || {};
        const waConfig = hotelData.whatsappNotification || {
            gateway: "meta",
            enabled: true,
            ownerPhone: hotelData.phone || "",
            notifyOnNewBooking: true,
            notifyOnCancellation: true,
            notifyOnModification: true,
            phoneNumberId: "",
            accessToken: ""
        };

        const defaultPhoneId = process.env.WHATSAPP_META_PHONE_NUMBER_ID || "1330469396819460";
        const defaultWabaId = process.env.WHATSAPP_META_WABA_ID || "2318352782319691";
        const hasMetaToken = !!process.env.WHATSAPP_META_ACCESS_TOKEN;

        return NextResponse.json({
            success: true,
            hotelCode,
            hotelName: hotelData.name || "",
            config: {
                ...waConfig,
                accessToken: waConfig.accessToken ? maskToken(waConfig.accessToken) : "",
                hasCustomAccessToken: Boolean(waConfig.accessToken),
                gateway: "meta"
            },
            systemDefaults: {
                senderDisplay: "+62 856-4536-5440 (Tara Official Cloud API)",
                phoneNumberId: defaultPhoneId,
                wabaId: defaultWabaId,
                hasMetaToken: hasMetaToken,
                status: "VERIFIED_ACTIVE"
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/notifications/whatsapp
 * Update WhatsApp configuration, test sending, or verify admin PIN
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, action = "save_config", config, testRecipient, pin } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const authCheck = await requireHotelAccess(req, hotelCode);
        if ("errorResponse" in authCheck) return authCheck.errorResponse;

        // Verify Admin PIN to unlock custom credentials
        if (action === "verify_admin_pin") {
            if (MASTER_ADMIN_PIN && pin && String(pin) === String(MASTER_ADMIN_PIN)) {
                return NextResponse.json({ success: true, authorized: true });
            }
            return NextResponse.json({ success: false, error: "Sandi Admin / PIN tidak valid." }, { status: 401 });
        }

        // ==========================================
        // ACTION 1: SAVE CONFIG
        // ==========================================
        if (action === "save_config") {
            const existingHotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
            const existingToken = existingHotelDoc.data()?.whatsappNotification?.accessToken || "";
            const incomingToken = config.accessToken || "";
            const resolvedToken = incomingToken.includes("********") ? existingToken : incomingToken;

            const updateData = {
                whatsappNotification: {
                    gateway: "meta",
                    enabled: config.enabled ?? true,
                    ownerPhone: config.ownerPhone || "",
                    notifyOnNewBooking: config.notifyOnNewBooking ?? true,
                    notifyOnCancellation: config.notifyOnCancellation ?? true,
                    notifyOnModification: config.notifyOnModification ?? true,
                    phoneNumberId: config.phoneNumberId || "",
                    accessToken: resolvedToken,
                    updatedAt: new Date().toISOString()
                }
            };

            await adminDb.collection("hotels").doc(hotelCode).set(updateData, { merge: true });

            return NextResponse.json({
                success: true,
                message: `Pengaturan WhatsApp Official Meta untuk Hotel [${hotelCode}] berhasil disimpan.`,
                config: {
                    ...updateData.whatsappNotification,
                    accessToken: resolvedToken ? maskToken(resolvedToken) : ""
                }
            });
        }

        // ==========================================
        // ACTION 2: TEST SEND TO SPECIFIC / OWNER NUMBER
        // ==========================================
        if (action === "test_send") {
            const targetPhone = testRecipient || config?.ownerPhone;

            const testPayload = {
                event: "test" as const,
                channelName: "Test Simulator (My Tara)",
                bookingRef: "TEST-" + Math.floor(100000 + Math.random() * 900000),
                guestName: "Bapak / Ibu Owner (Uji Coba)",
                roomName: "Deluxe King Room",
                arrivalDate: new Date().toISOString().split("T")[0],
                departureDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
                totalPrice: 1500000,
                paymentStatus: "Lunas (Test Payment)",
                nights: 2,
                customNote: "Ini adalah pesan uji coba resmi dari Meta WhatsApp Cloud API My Tara CRS.",
                customRecipient: targetPhone
            };

            const testResult = await sendMetaNotification(hotelCode, testPayload);

            if (testResult.success) {
                const multiMsg = testResult.totalRecipients && testResult.totalRecipients > 1
                    ? `Pesan uji coba resmi Meta WhatsApp berhasil dikirim ke ${testResult.deliveredCount} dari ${testResult.totalRecipients} nomor penerima!`
                    : `Pesan uji coba resmi Meta WhatsApp berhasil dikirim ke nomor ${targetPhone}!`;

                return NextResponse.json({
                    success: true,
                    message: multiMsg,
                    deliveredCount: testResult.deliveredCount,
                    totalRecipients: testResult.totalRecipients,
                    messageId: testResult.messageId,
                    details: testResult.details
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: testResult.error || testResult.reason || "Gagal mengirim pesan uji coba WhatsApp.",
                    detail: testResult
                }, { status: 400 });
            }
        }

        return NextResponse.json({ error: `Unknown action [${action}]` }, { status: 400 });
    } catch (err: any) {
        console.error("[WhatsApp API Error]:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
