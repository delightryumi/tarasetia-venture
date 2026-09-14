import { NextRequest, NextResponse } from "next/server";
import { channexSyncService } from "@/lib/channex/syncService";
import { adminDb } from "@/lib/firebaseAdmin";
import { ChannexWebhookPayload } from "@/lib/channex/types";

/**
 * Endpoint for Sandbox Testing & OTA Simulation
 * URL: POST /api/channex/sandbox-simulate
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            action = "create_booking", // "create_booking" | "cancel_booking" | "test_ari_push"
            hotelCode,
            channelName = "Booking.com",
            guestName = "Budi Santoso (Test Sandbox)",
            guestEmail = "budi.sandbox@test.com",
            guestPhone = "+6281234567890",
            roomTypeId,
            arrivalDate,
            departureDate,
            totalPrice = 1250000,
            bookingIdToCancel
        } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        // 1. Fetch Hotel Doc to get property ID
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return NextResponse.json({ error: `Hotel ${hotelCode} tidak ditemukan` }, { status: 404 });
        }

        const hotelData = hotelDoc.data();
        const channexPropertyId = hotelData?.channexPropertyId || hotelData?.channelManager?.channexPropertyId || `prop_sandbox_${hotelCode}`;

        // 2. Action: Create Simulated Booking
        if (action === "create_booking") {
            const simulatedBookingId = `OTA-SBX-${Math.floor(100000 + Math.random() * 900000)}`;
            const todayStr = new Date().toISOString().split("T")[0];
            const tomorrowStr = (() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return d.toISOString().split("T")[0];
            })();

            const checkin = arrivalDate || todayStr;
            const checkout = departureDate || tomorrowStr;

            const payload: ChannexWebhookPayload = {
                event: "booking_new",
                property_id: channexPropertyId,
                inserted_at: new Date().toISOString(),
                booking: {
                    id: simulatedBookingId,
                    property_id: channexPropertyId,
                    channel_id: `chan_${channelName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                    channel_name: channelName,
                    channel_booking_id: `${channelName.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-6)}`,
                    ota_reservation_code: `RES-${Date.now().toString().slice(-5)}`,
                    status: "new",
                    arrival_date: checkin,
                    departure_date: checkout,
                    total_price: Number(totalPrice) || 1200000,
                    currency: "IDR",
                    payment_type: "channel_collect",
                    payment_collect: "channel",
                    customer: {
                        name: guestName,
                        email: guestEmail,
                        phone: guestPhone,
                        country: "ID"
                    },
                    rooms: [
                        {
                            room_type_id: roomTypeId || "standard",
                            amount: Number(totalPrice) || 1200000,
                            guest_name: guestName,
                            adults: 2,
                            children: 0
                        }
                    ],
                    inserted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            };

            const result = await channexSyncService.processIncomingBookingWebhook(payload);

            return NextResponse.json({
                success: true,
                message: `Simulasi reservasi dari ${channelName} berhasil diterima dan dimasukkan ke Front Office PMS!`,
                bookingId: result.bookingId,
                simulatedPayload: payload
            });
        }

        // 3. Action: Cancel Simulated Booking
        if (action === "cancel_booking") {
            if (!bookingIdToCancel) {
                return NextResponse.json({ error: "bookingIdToCancel diperlukan untuk pembatalan" }, { status: 400 });
            }

            const payload: ChannexWebhookPayload = {
                event: "booking_cancellation",
                property_id: channexPropertyId,
                inserted_at: new Date().toISOString(),
                booking: {
                    id: bookingIdToCancel,
                    property_id: channexPropertyId,
                    channel_name: channelName,
                    channel_booking_id: bookingIdToCancel,
                    status: "cancelled",
                    arrival_date: arrivalDate || new Date().toISOString().split("T")[0],
                    departure_date: departureDate || new Date().toISOString().split("T")[0],
                    total_price: 0,
                    currency: "IDR",
                    rooms: [
                        {
                            room_type_id: roomTypeId || "standard"
                        }
                    ]
                }
            };

            const result = await channexSyncService.processIncomingBookingWebhook(payload);

            return NextResponse.json({
                success: true,
                message: `Simulasi pembatalan reservasi ${bookingIdToCancel} berhasil diproses! Stok kamar dikembalikan ke pool ketersediaan.`,
                result
            });
        }

        return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
    } catch (error: any) {
        console.error("[Channex Sandbox Simulate Error]:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Gagal memproses simulasi sandbox"
        }, { status: 500 });
    }
}
