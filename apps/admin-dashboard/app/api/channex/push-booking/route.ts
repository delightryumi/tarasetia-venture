import { NextRequest, NextResponse } from "next/server";
import { channexSyncService } from "@/lib/channex/syncService";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuthenticatedUser } from "@/lib/security/serverAuth";

/**
 * Route: POST /api/channex/push-booking
 * Pushes PMS Direct / Walk-In Reservation into Channex CRS (Two-Way Synchronization)
 * Official Channex Specification: POST /api/v1/bookings
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, bookingData } = body;

        if (!hotelCode || !bookingData) {
            return NextResponse.json({ error: "hotelCode and bookingData are required" }, { status: 400 });
        }

        const authUser = await getAuthenticatedUser(req).catch(() => null);

        // 1. Dispatch CRS push via ChannexSyncService
        const result = await channexSyncService.pushCrsBookingToChannex(hotelCode, bookingData);

        if (result.success && result.channexBookingId) {
            // 2. Automatically attach channexBookingId to daily_revenue entries for this reservation
            try {
                const dates: string[] = [];
                const start = new Date(bookingData.checkInDate);
                const end = new Date(bookingData.checkOutDate);
                for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                    dates.push(d.toISOString().split("T")[0]);
                }
                if (dates.length === 0) dates.push(bookingData.checkInDate);

                const docRefs = dates.map(dStr => adminDb.collection(`hotels/${hotelCode}/daily_revenue`).doc(`${hotelCode}_${dStr}`));
                const docSnaps = await Promise.all(docRefs.map(ref => ref.get()));
                const batch = adminDb.batch();
                let hasUpdates = false;

                docSnaps.forEach((docSnap, idx) => {
                    if (docSnap.exists) {
                        const entries = docSnap.data()?.entries || [];
                        let matchedInDoc = false;
                        const updatedEntries = entries.map((e: any) => {
                            const isMatch = (bookingData.bookingId && e.bookingId === bookingData.bookingId) ||
                                (bookingData.reservationId && e.reservationId === bookingData.reservationId);
                            if (isMatch) {
                                matchedInDoc = true;
                                return {
                                    ...e,
                                    channexBookingId: result.channexBookingId,
                                    isSyncedToChannexCrs: true,
                                    syncedToChannexAt: new Date().toISOString()
                                };
                            }
                            return e;
                        });
                        if (matchedInDoc) {
                            batch.update(docRefs[idx], { entries: updatedEntries });
                            hasUpdates = true;
                        }
                    }
                });

                if (hasUpdates) {
                    await batch.commit();
                }
            } catch (patchErr) {
                console.warn("[push-booking] Could not patch daily_revenue with channexBookingId:", patchErr);
            }
        }

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("[push-booking] Error pushing to Channex CRS:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "Failed to push booking to Channex CRS"
        }, { status: 500 });
    }
}
