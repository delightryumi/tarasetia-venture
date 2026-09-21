import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendWhatsAppNotificationToOwner as sendFonnteNotification } from "@/lib/notifications/whatsappFonnteService";
import { sendWhatsAppNotificationToOwner as sendMetaNotification } from "@/lib/notifications/whatsappMetaService";

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

        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: `Hotel [${hotelCode}] tidak ditemukan.` }, { status: 404 });
        }

        const hotelData = hotelDoc.data() || {};
        const waConfig = hotelData.whatsappNotification || {
            gateway: "fonnte",
            enabled: true,
            ownerPhone: hotelData.phone || "",
            fonnteToken: "",
            notifyOnNewBooking: true,
            notifyOnCancellation: true,
            phoneNumberId: "",
            accessToken: ""
        };

        return NextResponse.json({
            success: true,
            hotelCode,
            hotelName: hotelData.name || "",
            config: waConfig,
            systemDefaults: {
                hasFonnteToken: !!(process.env.FONNTE_API_TOKEN || waConfig.fonnteToken),
                phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID || "1330469396819460",
                wabaId: process.env.WHATSAPP_META_WABA_ID || "2318352782319691",
                hasMetaToken: !!process.env.WHATSAPP_META_ACCESS_TOKEN
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/notifications/whatsapp
 * Update WhatsApp configuration or trigger a test message
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, action = "save_config", config, testRecipient } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        // ==========================================
        // ACTION 1: SAVE CONFIG
        // ==========================================
        if (action === "save_config") {
            const updateData = {
                whatsappNotification: {
                    gateway: config.gateway || "fonnte",
                    enabled: config.enabled ?? true,
                    ownerPhone: config.ownerPhone || "",
                    fonnteToken: config.fonnteToken || "",
                    notifyOnNewBooking: config.notifyOnNewBooking ?? true,
                    notifyOnCancellation: config.notifyOnCancellation ?? true,
                    phoneNumberId: config.phoneNumberId || "",
                    accessToken: config.accessToken || "",
                    updatedAt: new Date().toISOString()
                }
            };

            await adminDb.collection("hotels").doc(hotelCode).set(updateData, { merge: true });

            return NextResponse.json({
                success: true,
                message: `Pengaturan WhatsApp untuk Hotel [${hotelCode}] berhasil disimpan.`,
                config: updateData.whatsappNotification
            });
        }

        // ==========================================
        // ACTION 2: TEST SEND TO SPECIFIC / OWNER NUMBER
        // ==========================================
        if (action === "test_send") {
            const targetPhone = testRecipient || config?.ownerPhone;
            const gateway = config?.gateway || "fonnte";

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
                customNote: "Ini adalah pesan uji coba integrasi WhatsApp Fonnte Gateway di My Tara CRS."
            };

            let testResult;
            if (gateway === "meta") {
                testResult = await sendMetaNotification(hotelCode, testPayload);
            } else {
                testResult = await sendFonnteNotification(hotelCode, testPayload);
            }

            if (testResult.success) {
                const isPending = (testResult as any).process === "pending";
                return NextResponse.json({
                    success: true,
                    message: isPending
                        ? `Permintaan diterima Fonnte (Antrean/Queue: ID ${testResult.messageId}). Pastikan WhatsApp pada nomor device Fonnte sedang terhubung.`
                        : `Pesan uji coba WhatsApp berhasil dikirim ke nomor ${targetPhone}!`,
                    messageId: testResult.messageId,
                    process: (testResult as any).process
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
