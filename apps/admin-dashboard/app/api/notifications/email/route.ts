import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendEmailNotificationToOwner } from "@/lib/notifications/emailBrevoService";

/**
 * GET /api/notifications/email?hotelCode=xxx
 * Retrieve Email notification configuration for a specific hotel tenant
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
        const emailConfig = hotelData.emailNotification || {
            enabled: true,
            ownerEmail: hotelData.email || "",
            notifyOnNewBooking: true,
            notifyOnCancellation: true,
            notifyOnModification: true,
            senderEmail: process.env.SMTP_FROM_EMAIL || "delightryumi@gmail.com",
            senderName: `${hotelData.name || "Tara PMS"} via Setara`
        };

        const defaultSender = process.env.SMTP_FROM_EMAIL || "delightryumi@gmail.com";
        const hasBrevoKey = !!(process.env.SMTP_PASS || process.env.BREVO_API_KEY);

        return NextResponse.json({
            success: true,
            hotelCode,
            hotelName: hotelData.name || "",
            config: emailConfig,
            systemDefaults: {
                senderEmail: defaultSender,
                hasBrevoKey,
                status: hasBrevoKey ? "VERIFIED_ACTIVE" : "KEY_MISSING"
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/notifications/email
 * Save configuration or trigger a test email
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
                emailNotification: {
                    enabled: config.enabled ?? true,
                    ownerEmail: config.ownerEmail || "",
                    notifyOnNewBooking: config.notifyOnNewBooking ?? true,
                    notifyOnCancellation: config.notifyOnCancellation ?? true,
                    notifyOnModification: config.notifyOnModification ?? true,
                    senderEmail: config.senderEmail || process.env.SMTP_FROM_EMAIL || "delightryumi@gmail.com",
                    senderName: config.senderName || "Tara PMS Notifications",
                    updatedAt: new Date().toISOString()
                }
            };

            await adminDb.collection("hotels").doc(hotelCode).set(updateData, { merge: true });

            return NextResponse.json({
                success: true,
                message: `Pengaturan Email Notifikasi Brevo untuk Hotel [${hotelCode}] berhasil disimpan.`,
                config: updateData.emailNotification
            });
        }

        // ==========================================
        // ACTION 2: TEST SEND TO SPECIFIC / OWNER EMAIL
        // ==========================================
        if (action === "test_send") {
            const targetEmail = testRecipient || config?.ownerEmail;

            const testPayload = {
                event: "test" as const,
                channelName: "Brevo Relay Simulator",
                bookingRef: "TEST-" + Math.floor(100000 + Math.random() * 900000),
                guestName: "Bapak / Ibu Owner & Management (Uji Coba)",
                guestPhone: "+62 812-3456-7890",
                guestEmail: targetEmail || "test@hotel.com",
                roomName: "Deluxe Executive King",
                roomCount: 1,
                pax: 2,
                mealsIncluded: true,
                arrivalDate: new Date().toISOString().split("T")[0],
                departureDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
                totalPrice: 1500000,
                paymentStatus: "Lunas (Test Payment)",
                nights: 2,
                customNote: "Ini adalah email uji coba resmi dari Brevo REST API terintegrasi dengan My Tara CRS.",
                customRecipient: targetEmail
            };

            const testResult = await sendEmailNotificationToOwner(hotelCode, testPayload);

            if (testResult.success) {
                const multiMsg = testResult.totalRecipients && testResult.totalRecipients > 1
                    ? `Email uji coba resmi Brevo berhasil dikirim ke ${testResult.deliveredCount} alamat email penerima!`
                    : `Email uji coba resmi Brevo berhasil dikirim ke ${targetEmail}! Periksa folder Inbox / Spam Anda.`;

                return NextResponse.json({
                    success: true,
                    message: multiMsg,
                    deliveredCount: testResult.deliveredCount,
                    totalRecipients: testResult.totalRecipients,
                    messageId: testResult.messageId
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: testResult.error || testResult.reason || "Gagal mengirim email uji coba.",
                    detail: testResult
                }, { status: 400 });
            }
        }

        return NextResponse.json({ error: `Unknown action [${action}]` }, { status: 400 });
    } catch (err: any) {
        console.error("[Email Notification API Error]:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
