import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

/**
 * Midtrans Payment Notification Webhook Endpoint
 * Handles automated payment settlement callbacks from Midtrans PG.
 * URL: POST /api/payment-gateway/webhook/midtrans?hotelCode={hotelCode}
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { searchParams } = new URL(req.url);
        let hotelCode = searchParams.get("hotelCode") || body.custom_field1 || "";

        const orderId = body.order_id || body.bookingCode;
        const transactionStatus = body.transaction_status;
        const fraudStatus = body.fraud_status;

        if (!orderId) {
            return NextResponse.json({ success: false, message: "Missing order_id" }, { status: 400 });
        }

        console.log(`[Midtrans Webhook] Received for Order: ${orderId}, Status: ${transactionStatus}, Hotel: ${hotelCode}`);

        // If hotelCode is not provided in query or custom_field, find the hotel containing this reservation
        if (!hotelCode) {
            const hotelsSnap = await getDocs(collection(db, "hotels"));
            for (const hDoc of hotelsSnap.docs) {
                const resCheck = await getDocs(
                    query(collection(db, "hotels", hDoc.id, "reservations"), where("bookingCode", "==", orderId))
                );
                if (!resCheck.empty) {
                    hotelCode = hDoc.id;
                    break;
                }
            }
        }

        if (!hotelCode) {
            return NextResponse.json({ success: false, message: `Reservation ${orderId} not found in any hotel.` }, { status: 404 });
        }

        let newPaymentStatus: "PAID" | "PENDING" | "CANCELLED" = "PENDING";
        let newBookingStatus: "CONFIRMED" | "CANCELLED" = "CONFIRMED";

        if (transactionStatus === "capture") {
            if (fraudStatus === "challenge") {
                newPaymentStatus = "PENDING";
            } else if (fraudStatus === "accept") {
                newPaymentStatus = "PAID";
            }
        } else if (transactionStatus === "settlement") {
            newPaymentStatus = "PAID";
        } else if (["cancel", "deny", "expire"].includes(transactionStatus)) {
            newPaymentStatus = "CANCELLED";
            newBookingStatus = "CANCELLED";
        } else if (transactionStatus === "pending") {
            newPaymentStatus = "PENDING";
        }

        // 1. Update Reservation document
        const resQuery = query(
            collection(db, "hotels", hotelCode, "reservations"),
            where("bookingCode", "==", orderId)
        );
        const resSnap = await getDocs(resQuery);

        let checkIn = "";
        let checkOut = "";

        if (!resSnap.empty) {
            const rDoc = resSnap.docs[0];
            const rData = rDoc.data();
            checkIn = rData.checkIn;
            checkOut = rData.checkOut;
            await setDoc(rDoc.ref, {
                paymentStatus: newPaymentStatus,
                status: newBookingStatus,
                midtransNotification: body,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        }

        // 2. Synchronize all stay night entries in daily_revenue
        if (checkIn && checkOut) {
            const stayDates: string[] = [];
            const startDateObj = new Date(checkIn);
            const endDateObj = new Date(checkOut);
            const totalNights = Math.max(1, Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)));

            for (let i = 0; i < totalNights; i++) {
                const d = new Date(startDateObj);
                d.setDate(startDateObj.getDate() + i);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                stayDates.push(`${y}-${m}-${day}`);
            }

            for (const dateStr of stayDates) {
                const dailyDocRef = doc(db, "hotels", hotelCode, "daily_revenue", `${hotelCode}_${dateStr}`);
                const dailySnap = await getDoc(dailyDocRef);
                if (dailySnap.exists()) {
                    const entries = (dailySnap.data()?.entries || []).map((e: any) => {
                        if (e.bookingId === orderId || e.voucherCode === orderId) {
                            return {
                                ...e,
                                paymentStatus: newPaymentStatus,
                                status: newBookingStatus,
                                payTransfer: newPaymentStatus === "PAID" ? (e.totalPrice || e.rate || 0) : e.payTransfer,
                                paidAmount1: newPaymentStatus === "PAID" ? (e.totalPrice || e.rate || 0) : e.paidAmount1,
                                lastUpdated: new Date().toISOString(),
                            };
                        }
                        return e;
                    });
                    await setDoc(dailyDocRef, {
                        ...dailySnap.data(),
                        entries,
                        lastUpdated: new Date().toISOString(),
                    }, { merge: true });
                }
            }
        }

        return NextResponse.json({
            success: true,
            orderId,
            hotelCode,
            paymentStatus: newPaymentStatus,
            bookingStatus: newBookingStatus,
        });
    } catch (err: any) {
        console.error("[Midtrans Webhook] Handler error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
