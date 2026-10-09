import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

/**
 * Xendit Payment Notification Webhook Endpoint
 * Handles automated invoice settlement callbacks from Xendit PG.
 * URL: POST /api/payment-gateway/webhook/xendit?hotelCode={hotelCode}
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { searchParams } = new URL(req.url);
        let hotelCode = searchParams.get("hotelCode") || body.description || "";

        const externalId = body.external_id || body.bookingCode || body.id;
        const status = (body.status || "").toUpperCase();

        if (!externalId) {
            return NextResponse.json({ success: false, message: "Missing external_id" }, { status: 400 });
        }

        console.log(`[Xendit Webhook] Received for ID: ${externalId}, Status: ${status}, Hotel: ${hotelCode}`);

        // If hotelCode not in query, find the hotel containing this reservation via collectionGroup (1 query instead of 100+)
        if (!hotelCode) {
            try {
                const { collectionGroup } = await import("firebase/firestore");
                const resCheck = await getDocs(
                    query(collectionGroup(db, "reservations"), where("bookingCode", "==", externalId))
                );
                if (!resCheck.empty) {
                    const parentHotelRef = resCheck.docs[0].ref.parent.parent;
                    if (parentHotelRef) {
                        hotelCode = parentHotelRef.id;
                    }
                }
            } catch (cgErr) {
                console.warn("[Xendit Webhook] collectionGroup fallback:", cgErr);
                const hotelsSnap = await getDocs(collection(db, "hotels"));
                for (const hDoc of hotelsSnap.docs) {
                    const resCheck = await getDocs(
                        query(collection(db, "hotels", hDoc.id, "reservations"), where("bookingCode", "==", externalId))
                    );
                    if (!resCheck.empty) {
                        hotelCode = hDoc.id;
                        break;
                    }
                }
            }
        }

        if (!hotelCode) {
            return NextResponse.json({ success: false, message: `Reservation ${externalId} not found in any hotel.` }, { status: 404 });
        }

        // 0. Verify Xendit Callback Token
        const callbackToken = req.headers.get("x-callback-token");
        let expectedToken = process.env.XENDIT_CALLBACK_TOKEN || "";
        if (!expectedToken && hotelCode) {
            try {
                const pgSnap = await getDoc(doc(db, "hotels", hotelCode, "settings", "payment_gateway"));
                if (pgSnap.exists()) {
                    expectedToken = pgSnap.data()?.xendit?.webhookVerificationToken || "";
                }
            } catch (err) {
                console.warn("[Xendit Webhook] Could not fetch hotel PG settings for token verification:", err);
            }
        }

        if (expectedToken) {
            if (callbackToken !== expectedToken) {
                console.error(`[Xendit Webhook] Invalid callback token for ID: ${externalId}`);
                return NextResponse.json({ success: false, message: "Invalid Xendit callback token" }, { status: 401 });
            }
        } else {
            console.warn(`[Xendit Webhook] ⚠️ Xendit Callback Token not configured for hotel ${hotelCode}. Skipping strict token verification for testing.`);
        }

        let newPaymentStatus: "PAID" | "PENDING" | "CANCELLED" = "PENDING";
        let newBookingStatus: "CONFIRMED" | "CANCELLED" = "CONFIRMED";

        if (status === "PAID" || status === "SETTLED") {
            newPaymentStatus = "PAID";
        } else if (status === "EXPIRED") {
            newPaymentStatus = "CANCELLED";
            newBookingStatus = "CANCELLED";
        } else if (status === "PENDING") {
            newPaymentStatus = "PENDING";
        }

        // 1. Update Reservation document
        const resQuery = query(
            collection(db, "hotels", hotelCode, "reservations"),
            where("bookingCode", "==", externalId)
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
                xenditNotification: body,
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
                        if (e.bookingId === externalId || e.voucherCode === externalId) {
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
            externalId,
            hotelCode,
            paymentStatus: newPaymentStatus,
            bookingStatus: newBookingStatus,
        });
    } catch (err: any) {
        console.error("[Xendit Webhook] Handler error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
