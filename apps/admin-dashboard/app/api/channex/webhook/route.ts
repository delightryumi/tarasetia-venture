import { NextRequest, NextResponse } from "next/server";
import { channexSyncService, getCachedHotelData } from "@/lib/channex/syncService";
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
        let expectedSecret = process.env.CHANNEX_WEBHOOK_SECRET;

        // Fallback: Check system_settings in Firestore if not configured in environment
        if (!expectedSecret) {
            try {
                const sysDoc = await adminDb.collection("system_settings").doc("channex").get();
                if (sysDoc.exists) {
                    expectedSecret = sysDoc.data()?.webhookSecret;
                }
            } catch (err) {
                console.warn("[Channex Webhook] Could not fetch system_settings for secret:", err);
            }
        }

        // Verify Secret if configured in environment or Firestore
        if (expectedSecret && authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
            console.warn("[Channex Webhook] Unauthorized request received. Invalid secret.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        } else if (!expectedSecret) {
            console.warn("[Channex Webhook] ⚠️  CHANNEX_WEBHOOK_SECRET is not configured in env or database. Skipping strict auth verification for testing.");
        }

        const payload = (await req.json()) as ChannexWebhookPayload;
        const eventType = payload?.event || (payload as any)?.type;
        console.log(`[Channex Webhook] Received Event: ${eventType}, Property: ${payload?.property_id || (payload as any)?.payload?.property_id}`);

        if (!payload || !eventType) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Standardize event name if passed in nested format
        payload.event = eventType;

        // 1. Handle Booking Events (new, modification, cancellation, revision)
        const isBookingEvent = payload.event === "booking" || 
            payload.event === "booking_new" || 
            payload.event === "booking_modification" || 
            payload.event === "booking_modified" ||
            payload.event === "booking_cancellation" || 
            payload.event === "booking_cancelled" || 
            payload.event === "booking_revision" ||
            Boolean(payload.booking) || 
            Boolean((payload as any)?.payload?.booking_id) ||
            Boolean((payload as any)?.data?.booking_id) ||
            Boolean((payload as any)?.booking_revision_id);

        if (isBookingEvent) {
            // Extract revision ID and property ID across all Channex webhook formats (data, payload, root)
            const nestedPayload = (payload as any)?.data || (payload as any)?.payload || {};
            const revisionId = payload.booking_revision_id || 
                nestedPayload.revision_id || 
                nestedPayload.booking_revision_id ||
                (payload as any).revision_id || 
                (payload.booking as any)?.revision_id;
            
            const propertyId = payload.property_id || 
                nestedPayload.property_id || 
                nestedPayload.attributes?.property_id ||
                (nestedPayload as any)?.relationships?.property?.data?.id ||
                (payload as any)?.relationships?.property?.data?.id ||
                (payload.booking as any)?.property_id ||
                (payload.booking as any)?.attributes?.property_id;

            if (propertyId) {
                payload.property_id = propertyId;
            }
            if (revisionId) {
                payload.booking_revision_id = revisionId;
            }

            // If nestedPayload already has booking attributes (or data)
            if (!payload.booking && (nestedPayload.rooms || nestedPayload.customer || nestedPayload.attributes)) {
                const attrs = nestedPayload.attributes || nestedPayload;
                const realBookingUuid = attrs.booking_id || 
                    attrs.bookingId ||
                    nestedPayload.relationships?.booking?.data?.id || 
                    (payload as any)?.relationships?.booking?.data?.id ||
                    nestedPayload.booking_id ||
                    (attrs.id && attrs.id !== revisionId ? attrs.id : undefined);

                payload.booking = {
                    id: realBookingUuid || attrs.id || nestedPayload.id || revisionId,
                    booking_id: realBookingUuid,
                    property_id: payload.property_id || attrs.property_id,
                    ...attrs
                };
            } else if (payload.booking) {
                const attrs = (payload.booking as any).attributes || payload.booking;
                const realBookingUuid = attrs.booking_id || 
                    attrs.bookingId ||
                    (payload.booking as any).booking_id ||
                    (payload.booking as any).bookingId ||
                    nestedPayload.relationships?.booking?.data?.id || 
                    (payload as any)?.relationships?.booking?.data?.id ||
                    (payload.booking as any)?.relationships?.booking?.data?.id ||
                    nestedPayload.booking_id ||
                    ((attrs.id && attrs.id !== revisionId) ? attrs.id : undefined);

                if (realBookingUuid) {
                    payload.booking.booking_id = realBookingUuid;
                    payload.booking.id = realBookingUuid;
                }
            }

            // Hydrate authoritative full booking payload via GET /booking_revisions/:id if payload.booking is missing, has no rooms, or is missing permanent booking_id
            let resolvedHotel = propertyId ? await channexSyncService.findHotelCodeByChannexPropertyId(propertyId) : null;
            const needsHydration = Boolean(
                revisionId && (
                    !payload.booking || 
                    !payload.booking.rooms || 
                    payload.booking.rooms.length === 0 ||
                    !payload.booking.booking_id ||
                    payload.booking.id === revisionId
                )
            );

            if (needsHydration) {
                try {
                    let customApiKey = process.env.CHANNEX_API_KEY;
                    let env: "staging" | "production" = (process.env.CHANNEX_ENV as any) || "staging";

                    if (resolvedHotel) {
                        const hData = await getCachedHotelData(resolvedHotel);
                        customApiKey = hData?.channelManager?.apiKey || customApiKey;
                        env = hData?.channelManager?.environment || hData?.channelManager?.env || env;
                    } else if (!customApiKey) {
                        // Fallback: search hotel documents with configured channelManager.apiKey
                        const hotelsWithKey = await adminDb.collection("hotels").where("channelManager.apiKey", "!=", null).limit(10).get();
                        for (const hDoc of hotelsWithKey.docs) {
                            const hData = hDoc.data();
                            if (hData?.channelManager?.apiKey) {
                                customApiKey = hData.channelManager.apiKey;
                                env = hData?.channelManager?.environment || hData?.channelManager?.env || env;
                                break;
                            }
                        }
                    }

                    console.log(`[Channex Webhook Hydration] Pulling authoritative revision ${revisionId} from Channex...`);
                    const revRes = await channexClient.getBookingRevision(revisionId, customApiKey, env);
                    const revData = revRes?.data;
                    const bookingAttrs = revData?.attributes || revData;

                    if (bookingAttrs) {
                        payload.property_id = payload.property_id || bookingAttrs.property_id || revData?.relationships?.property?.data?.id;
                        payload.booking_revision_id = revisionId;
                        const realBookingUuid = bookingAttrs.booking_id || 
                            revData?.relationships?.booking?.data?.id || 
                            bookingAttrs.bookingId ||
                            nestedPayload.booking_id ||
                            (bookingAttrs.id && bookingAttrs.id !== revisionId ? bookingAttrs.id : undefined);

                        payload.booking = {
                            id: realBookingUuid || bookingAttrs.id || revisionId,
                            booking_id: realBookingUuid,
                            property_id: payload.property_id,
                            ...bookingAttrs
                        };

                        if (!resolvedHotel && payload.property_id) {
                            resolvedHotel = await channexSyncService.findHotelCodeByChannexPropertyId(payload.property_id);
                        }

                        console.log(`[Channex Webhook Hydration] Successfully hydrated revision ${revisionId} (Booking UUID: ${realBookingUuid}) for Guest: ${(bookingAttrs as any)?.customer?.name}`);
                    }
                } catch (hydrErr: any) {
                    console.warn(`[Channex Webhook Hydration Warning] Could not fetch revision ${revisionId}:`, hydrErr.message);
                }
            }

            // Normalize event name based on booking status
            const bookingStatus = payload.booking?.status || (payload.booking as any)?.attributes?.status || nestedPayload.status || nestedPayload.attributes?.status;
            if (bookingStatus === "cancelled" && payload.event !== "booking_cancellation" && payload.event !== "booking_cancelled") {
                payload.event = "booking_cancellation";
            } else if (bookingStatus === "modified" && payload.event !== "booking_modification" && payload.event !== "booking_modified") {
                payload.event = "booking_modification";
            }

            const result = await channexSyncService.processIncomingBookingWebhook(payload, resolvedHotel || undefined);

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

            // Broadcast Web Push & Dispatches (WhatsApp & Email) to staff and management
            const targetPropertyId = payload.property_id || (payload.booking as any)?.property_id || propertyId;
            const hotelCode = (targetPropertyId 
                ? await channexSyncService.findHotelCodeByChannexPropertyId(targetPropertyId)
                : null) || resolvedHotel;

            if (hotelCode) {
                const bookingData = payload.booking || payload;
                const isCancel = payload.event === "booking_cancellation" || 
                    payload.event === "booking_cancelled" || 
                    (bookingData as any)?.status === "cancelled" ||
                    Boolean((result as any)?.isCancelled);
                const isModif = payload.event === "booking_modification" || 
                    payload.event === "booking_modified" || 
                    (bookingData as any)?.status === "modified" ||
                    Boolean((result as any)?.isModified);

                const customer = (bookingData as any)?.customer || (bookingData as any)?.guest || {};
                const fallbackDetails = (result as any)?.bookingDetails || {};
                const guestName = (customer.name || `${customer.first_name || ""} ${customer.last_name || ""}`).trim() || fallbackDetails.guestName || "Tamu OTA";
                const guestPhone = customer.phone || customer.telephone || customer.mobile || fallbackDetails.guestPhone || "";
                const guestEmail = customer.email || fallbackDetails.guestEmail || "";
                
                const rawOta = (bookingData as any)?.ota_name || (bookingData as any)?.channel_name || (bookingData as any)?.channel || (payload as any)?.channel_name;
                const otaName = (rawOta && rawOta.toLowerCase() !== "open channel" && rawOta.toLowerCase() !== "ota" && rawOta.toLowerCase() !== "ota channel")
                    ? rawOta
                    : (fallbackDetails.channelName && fallbackDetails.channelName.toLowerCase() !== "open channel" && fallbackDetails.channelName.toLowerCase() !== "ota" && fallbackDetails.channelName.toLowerCase() !== "ota channel"
                        ? fallbackDetails.channelName
                        : (rawOta || fallbackDetails.channelName || "OTA Channel"));

                const roomsList = (bookingData as any)?.rooms || [];
                const roomCount = roomsList.length || fallbackDetails.roomCount || 1;
                const primaryRoomName = fallbackDetails.roomName && fallbackDetails.roomName !== "Kamar Hotel" && fallbackDetails.roomName !== "Standard Room"
                    ? fallbackDetails.roomName
                    : (roomsList[0]?.room_type_name || fallbackDetails.roomName || "Standard Room");
                const roomName = roomCount > 1 
                    ? `${primaryRoomName} (${roomCount} Kamar)` 
                    : primaryRoomName;
                const bookingRef = (bookingData as any)?.unique_id || (bookingData as any)?.channel_booking_id || (bookingData as any)?.ota_reservation_code || (bookingData as any)?.booking_id || result.bookingId || "Booking";
                const revenueMode = ((result as any)?.financials?.revenueRecordingMode || (result as any)?.bookingDetails?.revenueRecordingMode || "NET").toUpperCase();
                const grossPrice = Number((result as any)?.financials?.guestPaidGross ?? (result as any)?.bookingDetails?.grossPrice ?? (bookingData as any)?.total_price ?? (bookingData as any)?.amount ?? 0);
                const netPrice = Number((result as any)?.financials?.netToHotel ?? (result as any)?.bookingDetails?.netToHotel ?? 0);
                const recordedPrice = revenueMode === "NET"
                    ? (netPrice || Number((result as any)?.financials?.recordedRevenue ?? (result as any)?.bookingDetails?.totalPrice) || grossPrice)
                    : (grossPrice || Number((result as any)?.financials?.recordedRevenue ?? (result as any)?.bookingDetails?.totalPrice) || netPrice);
                const currency = (bookingData as any)?.currency || (payload.booking as any)?.currency || fallbackDetails.currency || (result as any)?.financials?.currency;

                const arrivalDate = (bookingData as any)?.arrival_date || fallbackDetails.arrivalDate || result.previousStay?.arrivalDate || "-";
                const departureDate = (bookingData as any)?.departure_date || fallbackDetails.departureDate || result.previousStay?.departureDate || "-";
                const eta = (bookingData as any)?.arrival_hour || 
                    (bookingData as any)?.arrival_time || 
                    (bookingData as any)?.checkin_time || 
                    (bookingData as any)?.check_in_time || 
                    (bookingData as any)?.estimated_arrival_time || 
                    (bookingData as any)?.eta || 
                    (payload as any)?.arrival_hour || 
                    (payload as any)?.arrival_time || 
                    fallbackDetails.eta || 
                    "";
                let nights = fallbackDetails.nights || 0;
                if (!nights && arrivalDate !== "-" && departureDate !== "-") {
                    const diffMs = new Date(departureDate).getTime() - new Date(arrivalDate).getTime();
                    nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                }

                const adults = Number(roomsList[0]?.occupancy?.adults || roomsList[0]?.adults || customer.adults || (bookingData as any)?.occupancy || 2);
                const isWithBreakfast = Boolean(
                    (bookingData as any)?.meals?.breakfast ||
                    roomsList[0]?.meals?.breakfast ||
                    roomsList[0]?.rate_plan_name?.toLowerCase()?.includes("breakfast") ||
                    roomsList[0]?.rate_plan_name?.toLowerCase()?.includes("bb")
                );

                const specialNotes = (bookingData as any)?.notes || (bookingData as any)?.special_requests || "";
                const cancellationReason = (bookingData as any)?.cancellation_reason || (payload as any)?.cancellation_reason || (specialNotes ? specialNotes : (isCancel ? "Dibatalkan melalui portal OTA" : undefined));

                const formattedPriceStr = `${currency || "IDR"} ${Number(recordedPrice || 0).toLocaleString("id-ID")}${revenueMode === "NET" ? " (Nett)" : " (Gross)"}`;
                const mealStr = isWithBreakfast ? "🍳 Termasuk Sarapan" : "Hanya Kamar (Room Only)";
                const contactStr = guestPhone ? ` • 📞 ${guestPhone}` : "";
                const noteStr = specialNotes ? `\n📝 Catatan: "${specialNotes}"` : "";

                const pushTitle = isCancel
                    ? `❌ Pembatalan: #${bookingRef} - ${guestName} [${otaName}]`
                    : (isModif ? `🔄 Perubahan: #${bookingRef} - ${guestName} [${otaName}]` : `🛎️ Reservasi Baru: #${bookingRef} - ${guestName} [${otaName}]`);

                const pushBody = [
                    `🛏️ ${roomName} | 📅 ${arrivalDate} s/d ${departureDate} (${nights} Malam)`,
                    `💰 Rate: ${formattedPriceStr} • ${mealStr} (${adults} Tamu)`,
                    `💳 Pembayaran: ${(bookingData as any)?.payment_type || (bookingData as any)?.payment_collect || "Sesuai OTA"}${contactStr}${noteStr}`
                ].filter(Boolean).join("\n");

                const { sendPushNotificationToHotel } = await import("@/lib/notifications/webPushServer");
                sendPushNotificationToHotel(hotelCode, {
                    title: pushTitle,
                    body: pushBody,
                    type: isCancel ? "booking_cancelled" : (isModif ? "booking_modified" : "booking_new"),
                    tag: `booking-${bookingRef}`,
                    url: `/channel-manager?tab=logs&bookingRef=${bookingRef}`,
                    bookingId: bookingRef,
                    otaName
                }).catch(err => console.warn("[Webhook Push] Warning:", err?.message));

                // Dispatch WhatsApp Notification to Hotel Owner & Brevo Email Notification concurrently
                try {
                    const { dispatchWhatsAppNotification } = await import("@/lib/notifications/whatsappDispatcher");
                    dispatchWhatsAppNotification(hotelCode, {
                        event: isCancel ? "booking_cancellation" : (isModif ? "booking_modification" : "booking_new"),
                        channelName: otaName,
                        bookingRef,
                        guestName,
                        guestPhone,
                        guestEmail,
                        roomName,
                        roomCount,
                        pax: adults,
                        mealsIncluded: isWithBreakfast,
                        arrivalDate,
                        departureDate,
                        eta,
                        nights,
                        totalPrice: recordedPrice,
                        grossPrice,
                        netToHotel: netPrice,
                        revenueRecordingMode: revenueMode,
                        currency,
                        paymentStatus: (bookingData as any)?.payment_type || (bookingData as any)?.payment_collect || "Sesuai OTA",
                        notes: specialNotes,
                        customNote: specialNotes,
                        revisionId: (payload as any).booking_revision_id || (bookingData as any)?.revision_id || "",
                        previousArrivalDate: result.previousStay?.arrivalDate || fallbackDetails.previousArrivalDate,
                        previousDepartureDate: result.previousStay?.departureDate || fallbackDetails.previousDepartureDate,
                        cancellationReason
                    }).catch(waErr => console.warn("[Webhook Notification Warning]:", waErr?.message));
                } catch (waErr: any) {
                    console.warn("[Webhook Notification Import Warning]:", waErr?.message);
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
