import { NextRequest, NextResponse } from "next/server";
import { channexSyncService } from "@/lib/channex/syncService";
import { ChannexWebhookPayload } from "@/lib/channex/types";

/**
 * Global Webhook Endpoint for Channex.io
 * Receives incoming bookings, modifications, cancellations, and ARI events
 * URL: POST /api/channex/webhook
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("x-channex-webhook-secret") || req.headers.get("authorization");
        const expectedSecret = process.env.CHANNEX_WEBHOOK_SECRET;

        // Verify Secret if configured in environment
        if (expectedSecret && authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
            console.warn("[Channex Webhook] Unauthorized request received. Invalid secret.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = (await req.json()) as ChannexWebhookPayload;
        console.log(`[Channex Webhook] Received Event: ${payload?.event}, Property: ${payload?.property_id}`);

        if (!payload || !payload.event) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // 1. Handle Booking Events (new, modification, cancellation)
        if (payload.event === "booking" || payload.event === "booking_new" || payload.event === "booking_modification" || payload.event === "booking_cancellation" || payload.booking) {
            const result = await channexSyncService.processIncomingBookingWebhook(payload);

            // Broadcast Web Push to staff devices
            const propertyId = payload.property_id || (payload.booking as any)?.property_id;
            const hotelCode = propertyId 
                ? await channexSyncService.findHotelCodeByChannexPropertyId(propertyId)
                : null;

            if (hotelCode) {
                const bookingData = payload.booking || payload;
                const isCancel = payload.event === "booking_cancellation" || (bookingData as any)?.status === "cancelled";
                const guestName = `${(bookingData as any)?.customer?.name || ""} ${(bookingData as any)?.customer?.surname || ""}`.trim() || "Tamu OTA";
                const otaName = (bookingData as any)?.ota_name || (bookingData as any)?.channel_name || "OTA";
                const roomName = (bookingData as any)?.rooms?.[0]?.room_type_name || "Kamar Hotel";
                const bookingRef = (bookingData as any)?.booking_id || result.bookingId || "Booking";

                const pushTitle = isCancel
                    ? `🚨 Pembatalan Reservasi! [${otaName}]`
                    : `🛎️ Reservasi Baru Masuk! [${otaName}]`;

                const pushBody = isCancel
                    ? `Tamu ${guestName} membatalkan pesanan kamar ${roomName} (${bookingRef}). Segera cek ketersediaan!`
                    : `Tamu ${guestName} memesan kamar ${roomName} (${bookingRef}). Check-in segera!`;

                const { sendPushNotificationToHotel } = await import("@/lib/notifications/webPushServer");
                sendPushNotificationToHotel(hotelCode, {
                    title: pushTitle,
                    body: pushBody,
                    type: isCancel ? "booking_cancelled" : "booking_new",
                    tag: `booking-${bookingRef}`,
                    url: `/overview?module=front-office&bookingRef=${bookingRef}`,
                    bookingId: bookingRef,
                    otaName
                }).catch(err => console.warn("[Webhook Push] Warning:", err?.message));
            }

            return NextResponse.json({
                success: true,
                message: result.message,
                bookingId: result.bookingId
            });
        }

        // 1B. Handle Inbound ARI / Rate Changes from Channex
        if (payload.event === "ari" || payload.event === "rate" || payload.event === "restriction") {
            const ariResult = await channexSyncService.processIncomingAriWebhook(payload);
            return NextResponse.json({
                success: true,
                message: ariResult.message
            });
        }

        const hotelCode = payload.property_id 
            ? await channexSyncService.findHotelCodeByChannexPropertyId(payload.property_id)
            : null;

        // 2. Handle Unmapped Room / Rate Alerts (Certification Stage 5D)
        if (payload.event === "booking_unmapped_room" || payload.event === "booking_unmapped_rate") {
            console.error(`[Channex Webhook ALERT] ${payload.event} received for property ${payload.property_id}:`, JSON.stringify(payload));
            if (hotelCode) {
                const { adminDb } = await import("@/lib/firebaseAdmin");
                await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                    task_type: payload.event,
                    entity: "Room/Rate Mapping Alert",
                    status: "ACTION_REQUIRED",
                    inserted_at: new Date().toISOString(),
                    latency_ms: 0,
                    message: `PERINGATAN: Reservasi masuk dari OTA memiliki kamar/rate plan yang belum dipetakan ke My Tara! Segera periksa tab Pemetaan Saluran.`,
                    ota_responses: [payload]
                });
            }
            return NextResponse.json({
                success: true,
                message: `Unmapped alert ${payload.event} logged for hotel [${hotelCode}].`
            });
        }

        // 3. Handle Guest Message Events (2-Way Messaging Inbox)
        if (payload.event === "message" && hotelCode) {
            const { adminDb } = await import("@/lib/firebaseAdmin");
            const messageData = (payload as any).message || payload;
            await adminDb.collection(`hotels/${hotelCode}/guest_messages`).add({
                thread_id: messageData.thread_id || `thread_${Date.now()}`,
                sender: messageData.sender || "guest",
                guest_name: messageData.guest_name || "OTA Guest",
                channel: messageData.channel_name || "Airbnb / OTA",
                message: messageData.message || messageData.content || "",
                inserted_at: new Date().toISOString(),
                is_read: false
            });
            return NextResponse.json({ success: true, message: "Guest message ingested into 2-Way Inbox." });
        }

        // 4. Handle Guest Review Events (Unified OTA Reviews)
        if ((payload.event === "review" || payload.event === "updated_review") && hotelCode) {
            const { adminDb } = await import("@/lib/firebaseAdmin");
            const reviewData = (payload as any).review || payload;
            await adminDb.collection(`hotels/${hotelCode}/guest_reviews`).add({
                ota_review_id: reviewData.id || `rev_${Date.now()}`,
                channel_name: reviewData.channel_name || "OTA",
                guest_name: reviewData.author || "Guest",
                score: Number(reviewData.score || 9),
                title: reviewData.title || "",
                comments: reviewData.content || reviewData.comments || "",
                inserted_at: new Date().toISOString(),
                replied: false
            });
            return NextResponse.json({ success: true, message: "Guest review saved to Unified Reviews." });
        }

        // 5. Handle Sync Error & Warning Events
        if ((payload.event === "sync_error" || payload.event === "sync_warning" || payload.event === "rate_error") && hotelCode) {
            const { adminDb } = await import("@/lib/firebaseAdmin");
            await adminDb.collection(`hotels/${hotelCode}/channex_task_logs`).add({
                task_type: payload.event,
                entity: "Channex Channel Engine",
                status: payload.event === "sync_error" ? "ERROR" : "WARNING",
                inserted_at: new Date().toISOString(),
                latency_ms: 0,
                message: (payload as any).message || (payload as any).error || `Channex reported a ${payload.event}.`,
                ota_responses: [payload]
            });
            return NextResponse.json({ success: true, message: `Diagnostic event ${payload.event} recorded.` });
        }

        // Default: acknowledge other webhook events
        return NextResponse.json({
            success: true,
            message: `Event ${payload.event} acknowledged.`
        });
    } catch (error: any) {
        console.error("[Channex Webhook Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal server error"
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: "ACTIVE",
        service: "My Tara Channex Webhook Receiver",
        timestamp: new Date().toISOString()
    });
}
