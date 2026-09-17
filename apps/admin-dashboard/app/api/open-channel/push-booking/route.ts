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
            environment = "staging"
        } = body;

        // Hotel verification
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        const hotelData = hotelDoc.data() || {};
        const cmConfig = hotelData?.channelManager || {};

        const openChannelHotelCode = cmConfig.openChannelHotelCode || (hotelCode === "1" ? "setara_demo_1" : hotelCode);
        const openChannelApiKey = cmConfig.openChannelApiKey || "open_channel_api_key";

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
                rate_plan_code: ratePlanId
            });
        }

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
                payment_collect: "property",
                payment_type: "cash",
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
                        room_type_code: roomTypeId,
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

        const response = await fetch(`${baseUrl}/api/v1/channel_webhooks/open_channel/new_booking`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": openChannelApiKey
            },
            body: JSON.stringify(channexPayload)
        });

        const status = response.status;
        const responseText = await response.text();
        let parsedResponse: any = null;
        try {
            parsedResponse = JSON.parse(responseText);
        } catch {
            parsedResponse = responseText;
        }

        // Log push attempt to Firestore
        await adminDb.collection("hotels").doc(hotelCode).collection("channex_task_logs").add({
            taskType: "open_channel_push_booking",
            reservationId,
            status: status >= 200 && status < 300 ? "SUCCESS" : "ERROR",
            httpStatus: status,
            payload: channexPayload,
            response: parsedResponse,
            createdAt: new Date().toISOString()
        });

        if (status >= 200 && status < 300) {
            return NextResponse.json({
                success: true,
                message: `Reservasi ${reservationId} berhasil di-push ke Channex Open Channel!`,
                reservationId,
                channexResponse: parsedResponse
            });
        } else {
            return NextResponse.json({
                success: false,
                message: `Channex menolak push booking (Status ${status})`,
                error: parsedResponse,
                reservationId,
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
