import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

/**
 * DOKU (Jokul / Hosted Checkout) Payment Notification Webhook Endpoint
 * Handles automated payment notifications and updates reservation + daily_revenue in PMS.
 * URL: POST /api/payment-gateway/webhook/doku?hotelCode={hotelCode}
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { searchParams } = new URL(req.url);
        let hotelCode = searchParams.get("hotelCode") || body.hotelCode || "";

        // DOKU notification payload structure:
        // { order: { invoice_number: "DIR-XXXXXX", amount: 720000 }, transaction: { status: "SUCCESS" }, service: { id: "ONLINE_PAYMENT" } }
        const invoiceNumber =
            body.order?.invoice_number ||
            body.invoice_number ||
            body.order?.id ||
            body.bookingCode ||
            body.external_id ||
            "";

        const rawStatus = (
            body.transaction?.status ||
            body.status ||
            body.transaction_status ||
            ""
        ).toUpperCase();

        if (!invoiceNumber) {
            return NextResponse.json({ success: false, message: "Missing invoice_number or order reference" }, { status: 400 });
        }

        console.log(`[DOKU Webhook] Received notification for: ${invoiceNumber}, Status: ${rawStatus}, Hotel: ${hotelCode}`);

        // If hotelCode not in query, find the hotel containing this reservation via collectionGroup (1 query instead of 100+)
        if (!hotelCode) {
            try {
                const { collectionGroup } = await import("firebase/firestore");
                const resCheck = await getDocs(
                    query(collectionGroup(db, "reservations"), where("bookingCode", "==", invoiceNumber))
                );
                if (!resCheck.empty) {
                    const parentHotelRef = resCheck.docs[0].ref.parent.parent;
                    if (parentHotelRef) {
                        hotelCode = parentHotelRef.id;
                    }
                }
            } catch (cgErr) {
                console.warn("[DOKU Webhook] collectionGroup fallback:", cgErr);
                const hotelsSnap = await getDocs(collection(db, "hotels"));
                for (const hDoc of hotelsSnap.docs) {
                    const resCheck = await getDocs(
                        query(collection(db, "hotels", hDoc.id, "reservations"), where("bookingCode", "==", invoiceNumber))
                    );
                    if (!resCheck.empty) {
                        hotelCode = hDoc.id;
                        break;
                    }
                }
            }
        }

        if (!hotelCode) {
            return NextResponse.json({ success: false, message: `Reservation ${invoiceNumber} not found in any hotel.` }, { status: 404 });
        }

        let newPaymentStatus: "PAID" | "PENDING" | "CANCELLED" = "PENDING";
        let newBookingStatus: "CONFIRMED" | "CANCELLED" = "CONFIRMED";

        if (rawStatus === "SUCCESS" || rawStatus === "PAID" || rawStatus === "SETTLED") {
            newPaymentStatus = "PAID";
        } else if (rawStatus === "FAILED" || rawStatus === "EXPIRED" || rawStatus === "CANCELLED") {
            newPaymentStatus = "CANCELLED";
            newBookingStatus = "CANCELLED";
        } else if (rawStatus === "PENDING") {
            newPaymentStatus = "PENDING";
        }

        // 1. Update Reservation document in Firestore
        const resQuery = query(
            collection(db, "hotels", hotelCode, "reservations"),
            where("bookingCode", "==", invoiceNumber)
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
                dokuNotification: body,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        }

        // 2. Synchronize all stay night entries in daily_revenue for inventory and revenue tracking
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
                        if (e.bookingId === invoiceNumber || e.voucherCode === invoiceNumber) {
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
            invoiceNumber,
            hotelCode,
            paymentStatus: newPaymentStatus,
            bookingStatus: newBookingStatus,
        });
    } catch (err: any) {
        console.error("[DOKU Webhook] Handler error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
