import { NextRequest, NextResponse } from "next/server";
import { channexSyncService } from "@/lib/channex/syncService";
import { channexClient } from "@/lib/channex/channexClient";
import { adminDb } from "@/lib/firebaseAdmin";
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

        // Channex Certification: CHANNEX_WEBHOOK_SECRET must be configured in production
        if (!expectedSecret) {
            console.error("[Channex Webhook] ⚠️  CHANNEX_WEBHOOK_SECRET environment variable is not set! Configure this to secure your webhook endpoint.");
        }

        // Verify Secret if configured in environment
        if (expectedSecret && authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
            console.warn("[Channex Webhook] Unauthorized request received. Invalid secret.");
            // Per Channex spec: return 200 even for auth failures to prevent retry storms,
            // but log it for security monitoring
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = (await req.json()) as ChannexWebhookPayload;
        const eventType = payload?.event || (payload as any)?.type;
        console.log(`[Channex Webhook] Received Event: ${eventType}, Property: ${payload?.property_id || (payload as any)?.payload?.property_id}`);

        if (!payload || !eventType) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Standardize event name if passed in nested format
        payload.event = eventType;

        // 1. Handle Booking Events (new, modification, cancellation)
        const isBookingEvent = payload.event === "booking" || 
            payload.event === "booking_new" || 
            payload.event === "booking_modification" || 
            payload.event === "booking_cancellation" || 
            Boolean(payload.booking) || 
            Boolean((payload as any)?.payload?.booking_id);

        if (isBookingEvent) {
            // Extract revision ID and property ID if webhook came in lightweight notification shape
            const nestedPayload = (payload as any)?.payload || {};
            const revisionId = payload.booking_revision_id || 
                nestedPayload.revision_id || 
                (payload as any).revision_id || 
                (payload.booking as any)?.revision_id;
            
            const propertyId = payload.property_id || 
                nestedPayload.property_id || 
                (payload.booking as any)?.property_id;

            if (propertyId) {
                payload.property_id = propertyId;
            }

            // Hydrate authoritative full booking payload via GET /booking_revisions/:id if payload.booking is missing or incomplete
            if (revisionId && (!payload.booking || !payload.booking.rooms || payload.booking.rooms.length === 0)) {
                try {
                    const resolvedHotel = propertyId ? await channexSyncService.findHotelCodeByChannexPropertyId(propertyId) : null;
                    let customApiKey = process.env.CHANNEX_API_KEY;
                    let env: "staging" | "production" = (process.env.CHANNEX_ENV as any) || "staging";

                    if (resolvedHotel) {
                        const hDoc = await adminDb.collection("hotels").doc(resolvedHotel).get();
                        const hData = hDoc.data();
                        customApiKey = hData?.channelManager?.apiKey || customApiKey;
                        env = hData?.channelManager?.environment || hData?.channelManager?.env || env;
                    }

                    console.log(`[Channex Webhook Hydration] Pulling authoritative revision ${revisionId} from Channex...`);
                    const revRes = await channexClient.getBookingRevision(revisionId, customApiKey, env);
                    const revData = revRes?.data;
                    const bookingAttrs = revData?.attributes || revData;

                    if (bookingAttrs) {
                        payload.property_id = payload.property_id || bookingAttrs.property_id;
                        payload.booking_revision_id = revisionId;
                        payload.booking = {
                            id: bookingAttrs.id || nestedPayload.booking_id || revisionId,
                            property_id: payload.property_id,
                            ...bookingAttrs
                        };
                        console.log(`[Channex Webhook Hydration] Successfully hydrated revision ${revisionId} for Guest: ${(bookingAttrs as any)?.customer?.name}`);
                    }
                } catch (hydrErr: any) {
                    console.warn(`[Channex Webhook Hydration Warning] Could not fetch revision ${revisionId}:`, hydrErr.message);
                }
            }

            const result = await channexSyncService.processIncomingBookingWebhook(payload);

            // ============================================================
            // CHANNEX CERTIFICATION STAGE 5 — MANDATORY BOOKING ACK
            // Must call POST /booking_revisions/:id/ack IMMEDIATELY after
            // processing. This stops Channex from redelivering the same booking.
            // Source: docs.channex.io/pms-certification-tests
            // ============================================================
            if (revisionId && !((payload as any).is_simulation)) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(revisionId)) {
                    try {
                        // Resolve per-hotel API key for ACK call
                        const resolvedHotelForAck = propertyId
                            ? await channexSyncService.findHotelCodeByChannexPropertyId(propertyId)
                            : null;
                        let ackApiKey = process.env.CHANNEX_API_KEY;
                        let ackEnv: "staging" | "production" = (process.env.CHANNEX_ENV as any) || "staging";
                        if (resolvedHotelForAck) {
                            const ackHotelDoc = await adminDb.collection("hotels").doc(resolvedHotelForAck).get();
                            const ackHotelData = ackHotelDoc.data();
                            ackApiKey = ackHotelData?.channelManager?.apiKey || ackApiKey;
                            ackEnv = ackHotelData?.channelManager?.env || ackHotelData?.channelManager?.environment || ackEnv;
                        }
                        await channexClient.acknowledgeBooking(revisionId, ackApiKey, ackEnv);
                        console.log(`[Channex Webhook ACK] ✅ Booking revision ${revisionId} acknowledged successfully.`);
                    } catch (ackErr: any) {
                        // ACK failure is non-fatal — log and continue. Channex will retry delivery
                        console.warn(`[Channex Webhook ACK] ⚠️  Failed to acknowledge revision ${revisionId}:`, ackErr.message);
                    }
                }
            }

            // Broadcast Web Push to staff devices
            const targetPropertyId = payload.property_id || (payload.booking as any)?.property_id || propertyId;
            const hotelCode = targetPropertyId 
                ? await channexSyncService.findHotelCodeByChannexPropertyId(targetPropertyId)
                : null;

            if (hotelCode) {
                const bookingData = payload.booking || payload;
                const isCancel = payload.event === "booking_cancellation" || (bookingData as any)?.status === "cancelled";
                const guestName = `${(bookingData as any)?.customer?.name || ""} ${(bookingData as any)?.customer?.surname || ""}`.trim() || "Tamu OTA";
                const otaName = (bookingData as any)?.ota_name || (bookingData as any)?.channel_name || "OTA";
                const roomsList = (bookingData as any)?.rooms || [];
                const roomCount = roomsList.length;
                const primaryRoomName = roomsList[0]?.room_type_name || "Kamar Hotel";
                const roomName = roomCount > 1 
                    ? `${primaryRoomName} (${roomCount} Kamar)` 
                    : primaryRoomName;
                const bookingRef = (bookingData as any)?.channel_booking_id || (bookingData as any)?.ota_reservation_code || (bookingData as any)?.booking_id || result.bookingId || "Booking";
                const totalPrice = Number((bookingData as any)?.total_price || (bookingData as any)?.amount || (bookingData as any)?.total_amount) || 0;

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

                // Dispatch WhatsApp Notification to Hotel Owner (Auto-routed: Meta Official or Fonnte)
                try {
                    const { dispatchWhatsAppNotification } = await import("@/lib/notifications/whatsappDispatcher");
                    dispatchWhatsAppNotification(hotelCode, {
                        event: isCancel ? "booking_cancellation" : (payload.event === "booking_modification" ? "booking_modification" : "booking_new"),
                        channelName: otaName,
                        bookingRef,
                        guestName,
                        roomName,
                        arrivalDate: (bookingData as any)?.arrival_date || "-",
                        departureDate: (bookingData as any)?.departure_date || "-",
                        totalPrice: totalPrice,
                        paymentStatus: (bookingData as any)?.payment_type || "Sesuai OTA",
                        netToHotel: (result as any)?.financials?.netToHotel,
                        otaCommission: (result as any)?.financials?.otaCommissionAmount
                    }).catch(waErr => console.warn("[Webhook WhatsApp Notification Warning]:", waErr?.message));
                } catch (waErr: any) {
                    console.warn("[Webhook WhatsApp Import Warning]:", waErr?.message);
                }
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
        // CHANNEX CERTIFICATION REQUIREMENT: Always return HTTP 200 OK even on internal errors.
        // Returning 5xx causes Channex to retry delivery, leading to duplicate processing.
        // Internal errors must be logged and handled by our own monitoring system.
        return NextResponse.json({
            success: false,
            error: error.message || "Internal server error"
        }, { status: 200 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: "ACTIVE",
        service: "My Tara Channex Webhook Receiver",
        timestamp: new Date().toISOString()
    });
}
