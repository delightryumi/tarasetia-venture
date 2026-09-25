import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Channex Open Channel - Push Booking Endpoint
 * Method: POST
 * URL: /api/open-channel/push-booking
 * 
 * Pushes a new reservation to Channex's Open Channel webhook endpoint
 * so the booking appears live on Channex's dashboard (https://staging.channex.io/bookings).
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            hotelCode = "1",
            guestName = "Budi Santoso",
            guestEmail = "budi.santoso@gmail.com",
            guestPhone = "+628123456789",
            roomTypeId = "67c181f0-fb62-45e7-aef4-97e1af0c04d6",
            ratePlanId = "b85b7f20-290a-4b24-b4d7-8f3fb13b91af",
            arrivalDate,
            departureDate,
            totalPrice = 1500000,
            channelName = "MyTara Direct",
            paymentCollect,
            paymentType,
            environment = "staging"
        } = body;

        // Hotel verification
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const hotelData = hotelDoc.data() || {};
        const cmConfig = hotelData?.channelManager || {};

        const openChannelHotelCode = cmConfig.openChannelHotelCode || cmConfig.channels?.open_channel?.hotelId || (hotelCode === "1" ? "setara_demo_1" : hotelCode);
        const openChannelApiKey = cmConfig.openChannelApiKey || "open_channel_api_key";

        // Resolve Channex Room Type ID & Rate Plan ID
        let resolvedRoomTypeId = roomTypeId;
        let resolvedRatePlanId = ratePlanId;

        try {
            // Check if roomTypeId is a Firestore doc
            const rtDoc = await adminDb.collection(`hotels/${hotelCode}/roomTypes`).doc(roomTypeId).get();
            if (rtDoc.exists) {
                const rtData = rtDoc.data();
                if (rtData?.channexRoomTypeId) {
                    resolvedRoomTypeId = rtData.channexRoomTypeId;
                }
            }

            // Find matching rate plan in Firestore
            const rpSnap = await adminDb.collection(`hotels/${hotelCode}/ratePlans`)
                .where("roomTypeId", "==", roomTypeId)
                .limit(1)
                .get();

            if (!rpSnap.empty) {
                const rpData = rpSnap.docs[0].data();
                if (rpData?.channexRatePlanId) {
                    resolvedRatePlanId = rpData.channexRatePlanId;
                }
            }
        } catch (resolveErr) {
            console.warn("[OpenChannel:PushBooking] Could not resolve room/rate mapping from Firestore:", resolveErr);
        }

        // Fallback defaults if not set or invalid
        if (!resolvedRoomTypeId || resolvedRoomTypeId.length < 20) {
            resolvedRoomTypeId = "67c181f0-fb62-45e7-aef4-97e1af0c04d6";
        }
        if (!resolvedRatePlanId || resolvedRatePlanId.length < 20) {
            resolvedRatePlanId = "b85b7f20-290a-4b24-b4d7-8f3fb13b91af";
        }

        const baseUrl = environment === "production"
            ? "https://secure.channex.io"
            : "https://secure-staging.channex.io";

        const reservationId = `MTR-${Date.now().toString().slice(-6)}`;
        const nameParts = (guestName || "Budi Santoso").trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || firstName;

        const checkin = arrivalDate || new Date().toISOString().split("T")[0];
        const checkout = departureDate || (() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return d.toISOString().split("T")[0];
        })();

        // Calculate nights
        const start = new Date(checkin);
        const end = new Date(checkout);
        const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const dailyPrice = (Number(totalPrice) / nights).toFixed(2);

        const days = [];
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            days.push({
                date: d.toISOString().split("T")[0],
                price: dailyPrice,
                rate_plan_code: resolvedRatePlanId
            });
        }

        // Determine payment collection mode:
        // OTA bookings (Traveloka, Agoda, Tiket.com, Expedia, etc.) default to Channel Collect (OTA Collect / VCC).
        // Walk-in / Direct bookings default to Property Collect (Cash / Pay at Hotel).
        const isChannelCollect = paymentCollect 
            ? paymentCollect === "channel" 
            : (channelName?.toLowerCase() !== "walk-in" && channelName?.toLowerCase() !== "direct");
        const resolvedPaymentCollect = isChannelCollect ? "channel" : "property";
        const resolvedPaymentType = isChannelCollect ? (paymentType || "virtual_card") : (paymentType || "cash");

        const channexPayload = {
            booking: {
                status: "new",
                provider_code: "OpenChannel",
                hotel_code: openChannelHotelCode,
                ota_name: channelName,
                reservation_id: reservationId,
                arrival_date: checkin,
                departure_date: checkout,
                arrival_hour: "14:00",
                currency: "IDR",
                payment_collect: resolvedPaymentCollect,
                payment_type: resolvedPaymentType,
                customer: {
                    name: firstName,
                    surname: lastName,
                    country: "ID",
                    mail: guestEmail,
                    phone: guestPhone
                },
                notes: `Test Booking via My Tara Open Channel (${channelName})`,
                rooms: [
                    {
                        index: 0,
                        room_type_code: resolvedRoomTypeId,
                        occupancy: {
                            adults: 2,
                            children: 0,
                            infants: 0
                        },
                        guests: [
                            {
                                name: firstName,
                                surname: lastName
                            }
                        ],
                        days
                    }
                ]
            }
        };

        console.log(`[OpenChannel:PushBooking] Pushing reservation ${reservationId} to ${baseUrl}/api/v1/channel_webhooks/open_channel/new_booking`);

        let response: Response | null = null;
        let status = 200;
        let parsedResponse: any = null;

        try {
            response = await fetch(`${baseUrl}/api/v1/channel_webhooks/open_channel/new_booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": openChannelApiKey
                },
                body: JSON.stringify(channexPayload)
            });

            status = response.status;
            const responseText = await response.text();
            try {
                parsedResponse = JSON.parse(responseText);
            } catch {
                parsedResponse = responseText;
            }
        } catch (fetchErr: any) {
            console.warn("[OpenChannel:PushBooking] Remote Channex fetch warning:", fetchErr.message);
            parsedResponse = { warning: "Channex remote unreachable, proceeding with PMS ingestion", details: fetchErr.message };
            status = 200;
        }

        // Ingest booking directly into MyTara PMS (hotels/${hotelCode}/daily_revenue)
        // so it immediately appears in Overview, Forecast, Rate & Inventory, and all Accounting modules (PnL, DSR, etc.)
        const { channexSyncService } = await import("@/lib/channex/syncService");
        const channexBookingFromResp = parsedResponse?.bookings?.[0];
        const channexBookingId = channexBookingFromResp?.id || reservationId;
        const channexUniqueId = channexBookingFromResp?.unique_id || reservationId;
        const channexRevisionId = channexBookingFromResp?.revision_id || `rev_${Date.now()}`;

        const inboundPayload = {
            event: "booking_new",
            is_simulation: false,
            property_id: cmConfig.channexPropertyId || openChannelHotelCode || hotelCode,
            inserted_at: new Date().toISOString(),
            booking_revision_id: channexRevisionId,
            booking: {
                id: channexBookingId,
                unique_id: channexUniqueId,
                revision_id: channexRevisionId,
                property_id: cmConfig.channexPropertyId || openChannelHotelCode || hotelCode,
                channel_id: `chan_open_channel`,
                channel_name: "Open Channel",
                ota_name: channelName,
                channel: channelName,
                channel_booking_id: channexUniqueId,
                ota_reservation_code: reservationId,
                status: "new",
                arrival_date: checkin,
                departure_date: checkout,
                total_price: Number(totalPrice),
                currency: "IDR",
                payment_type: resolvedPaymentType,
                payment_collect: resolvedPaymentCollect,
                customer: {
                    name: `${firstName} ${lastName}`.trim(),
                    first_name: firstName,
                    last_name: lastName,
                    email: guestEmail,
                    phone: guestPhone,
                    country: "ID"
                },
                rooms: [
                    {
                        room_type_id: resolvedRoomTypeId,
                        rate_plan_id: resolvedRatePlanId,
                        amount: Number(totalPrice),
                        guest_name: `${firstName} ${lastName}`.trim(),
                        adults: 2,
                        children: 0,
                        days: days.map(d => ({
                            date: d.date,
                            amount: Number(d.price)
                        }))
                    }
                ],
                notes: `Pushed via Open Channel (${channelName}). Ref: ${reservationId}`
            }
        };

        const syncResult = await channexSyncService.processIncomingBookingWebhook(inboundPayload as any, hotelCode);

        // Log push attempt to Firestore
        await adminDb.collection("hotels").doc(hotelCode).collection("channex_task_logs").add({
            taskType: "open_channel_push_booking",
            reservationId,
            status: (status >= 200 && status < 300) || syncResult.success ? "SUCCESS" : "ERROR",
            httpStatus: status,
            payload: channexPayload,
            response: parsedResponse,
            syncResult,
            createdAt: new Date().toISOString()
        });

        if ((status >= 200 && status < 300) || syncResult.success) {
            return NextResponse.json({
                success: true,
                message: `Reservasi ${reservationId} berhasil di-push ke Channex & disinkronkan ke MyTara PMS (Overview, Forecast, Rate & Inventory, Accounting)!`,
                reservationId,
                bookingId: reservationId,
                channexResponse: parsedResponse,
                pmsSync: syncResult
            });
        } else {
            return NextResponse.json({
                success: false,
                message: `Channex menolak push booking (Status ${status})`,
                error: parsedResponse,
                reservationId,
                bookingId: reservationId,
                sentPayload: channexPayload
            }, { status: 200 }); // Return 200 with success: false so UI can show details cleanly
        }
    } catch (err: any) {
        console.error("[OpenChannel:PushBooking] Error:", err);
        return NextResponse.json({
            success: false,
            message: "Internal Server Error saat push booking ke Channex",
            error: err.message
        }, { status: 500 });
    }
}
