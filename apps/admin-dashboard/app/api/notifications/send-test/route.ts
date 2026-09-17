import { NextRequest, NextResponse } from "next/server";
import { sendPushNotificationToHotel } from "@/lib/notifications/webPushServer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            hotelCode,
            type = "booking_new",
            guestName = "Budi Santoso",
            roomName = "Deluxe King Room",
            otaName = "Booking.com",
            bookingRef = "BK-" + Math.floor(100000 + Math.random() * 900000)
        } = body;

        if (!hotelCode) {
            return NextResponse.json({ error: "hotelCode is required" }, { status: 400 });
        }

        const isCancel = type === "booking_cancelled";
        const title = isCancel
            ? `🚨 Pembatalan Reservasi OTA! [${otaName}]`
            : `🛎️ Reservasi Baru Masuk! [${otaName}]`;

        const messageBody = isCancel
            ? `Tamu ${guestName} membatalkan pesanan kamar ${roomName} (${bookingRef}). Segera cek ketersediaan!`
            : `Tamu ${guestName} memesan kamar ${roomName} (${bookingRef}). Check-in hari ini!`;

        const result = await sendPushNotificationToHotel(hotelCode, {
            title,
            body: messageBody,
            type: isCancel ? "booking_cancelled" : "booking_new",
            tag: `booking-${bookingRef}`,
            url: `/overview?module=front-office&bookingRef=${bookingRef}`,
            bookingId: bookingRef,
            otaName
        });

        return NextResponse.json({
            success: true,
            title,
            body: messageBody,
            ...result
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
