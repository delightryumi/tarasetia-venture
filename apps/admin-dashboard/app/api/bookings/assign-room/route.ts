import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { channexSyncService } from "@/lib/channex/syncService";

/**
 * POST /api/bookings/assign-room
 * Low-cost atomic room reassignment across all stay nights in daily_revenue.
 * Reads only the exact N stay-date documents via adminDb.getAll() and writes in 1 batch.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            hotelCode,
            bookingId,
            reservationId,
            otaReservationId,
            voucherCode,
            guestName,
            checkInDate,
            checkOutDate,
            datesOccurred,
            oldRoomNumber,
            newRoomNumber,
            newRoomTypeId,
            newRoomTypeName,
            oldRoomTypeId,
            movedBy
        } = body;

        if (!hotelCode || hotelCode === "0") {
            return NextResponse.json({ error: "Kode hotel tidak valid." }, { status: 400 });
        }
        if (!newRoomNumber || !String(newRoomNumber).trim()) {
            return NextResponse.json({ error: "Nomor kamar tujuan wajib diisi." }, { status: 400 });
        }

        const cleanNewRoom = String(newRoomNumber).trim();

        // Build exact set of dates to inspect (zero range scan, direct doc ID lookup)
        const dateSet = new Set<string>();
        if (Array.isArray(datesOccurred)) {
            datesOccurred.forEach((d: string) => {
                if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) dateSet.add(d);
            });
        }

        if (checkInDate && /^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) {
            const start = new Date(`${checkInDate}T00:00:00Z`);
            const end = checkOutDate && /^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)
                ? new Date(`${checkOutDate}T00:00:00Z`)
                : new Date(start.getTime() + 86400000);

            const maxNights = 60;
            let count = 0;
            for (let d = new Date(start); d < end && count < maxNights; d.setUTCDate(d.getUTCDate() + 1)) {
                dateSet.add(d.toISOString().split("T")[0]);
                count++;
            }
            if (dateSet.size === 0) {
                dateSet.add(checkInDate);
            }
        }

        const targetDates = Array.from(dateSet).sort();
        if (targetDates.length === 0) {
            return NextResponse.json({ error: "Tanggal menginap reservasi tidak ditemukan." }, { status: 400 });
        }

        const docRefs = targetDates.map((dStr) =>
            adminDb.collection(`hotels/${hotelCode}/daily_revenue`).doc(`${hotelCode}_${dStr}`)
        );

        const snapshots = await adminDb.getAll(...docRefs);
        const batch = adminDb.batch();
        let updatedDocsCount = 0;
        let updatedEntriesCount = 0;

        const normGuest = String(guestName || "").trim().toLowerCase();
        const normOldRoom = String(oldRoomNumber || "").trim().toUpperCase();

        const isTargetBookingEntry = (e: any): boolean => {
            if (!e) return false;

            // Match by canonical booking / reservation identifiers
            const candidateIds = [
                bookingId,
                reservationId,
                otaReservationId,
                voucherCode
            ]
                .map((x) => String(x || "").trim())
                .filter((x) => x.length > 2);

            const entryIds = [
                e.bookingId,
                e.channexBookingId,
                e.reservationId,
                e.otaReservationId,
                e.voucherCode,
                e.parentBookingId
            ]
                .map((x) => String(x || "").trim())
                .filter((x) => x.length > 2);

            if (candidateIds.length > 0 && entryIds.some((eid) => candidateIds.includes(eid))) {
                return true;
            }

            // Fallback match by Guest Name + CheckInDate (+ optional oldRoomNumber)
            const entryGuest = String(e.rawGuestName || e.guestName || "").trim().toLowerCase();
            const entryCheckIn = e.checkInDate || e.checkIn || "";
            const entryRoom = String(e.roomNumber || "").trim().toUpperCase();

            if (normGuest && (entryGuest === normGuest || entryGuest.startsWith(`${normGuest} (`))) {
                if (!checkInDate || !entryCheckIn || entryCheckIn === checkInDate) {
                    if (!normOldRoom || !entryRoom || entryRoom === normOldRoom) {
                        return true;
                    }
                }
            }

            return false;
        };

        const nowIso = new Date().toISOString();
        const cleanJson = (val: any) => JSON.parse(JSON.stringify(val, (_, v) => (v === undefined ? null : v)));

        for (const snap of snapshots) {
            if (!snap.exists) continue;
            const data = snap.data() || {};
            const entries: any[] = Array.isArray(data.entries) ? data.entries : [];
            let docModified = false;

            const updatedEntries = entries.map((e: any) => {
                if (!isTargetBookingEntry(e)) return e;
                docModified = true;
                updatedEntriesCount++;

                const updated: any = {
                    ...e,
                    roomNumber: cleanNewRoom,
                    isOverbooked: cleanNewRoom.toUpperCase() === "OVERBOOK",
                    lastRoomMoveAt: nowIso,
                    lastRoomMoveBy: movedBy || "Front Desk"
                };

                if (newRoomTypeId) {
                    updated.roomTypeId = newRoomTypeId;
                }
                if (newRoomTypeName) {
                    updated.roomType = newRoomTypeName;
                }

                return updated;
            });

            if (docModified) {
                batch.update(snap.ref, {
                    entries: cleanJson(updatedEntries),
                    lastUpdated: nowIso
                });
                updatedDocsCount++;
            }
        }

        if (updatedDocsCount === 0) {
            return NextResponse.json(
                { error: "Data reservasi tidak ditemukan pada tanggal menginap tersebut." },
                { status: 404 }
            );
        }

        await batch.commit();

        // If the room category changed, recalculate and push availability to Channex for affected dates
        if (newRoomTypeId && oldRoomTypeId && newRoomTypeId !== oldRoomTypeId) {
            const minDate = targetDates[0];
            const maxDate = targetDates[targetDates.length - 1];
            channexSyncService.recalculateAndPushAvailability(hotelCode, minDate, maxDate).catch((err) => {
                console.warn("[AssignRoom] Non-blocking Channex availability sync warning:", err);
            });
        }

        return NextResponse.json({
            success: true,
            newRoomNumber: cleanNewRoom,
            updatedDocsCount,
            updatedEntriesCount,
            message: `Kamar berhasil dipindahkan ke No. ${cleanNewRoom} (${updatedDocsCount} malam diperbarui).`
        });
    } catch (err: any) {
        console.error("[API /bookings/assign-room] Error:", err);
        return NextResponse.json(
            { error: err?.message || "Gagal memindahkan nomor kamar." },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/bookings/assign-room
 * Updates the physicalRooms list for a specific roomTypeId in hotels/{hotelCode}/roomTypes/{roomTypeId}.
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { hotelCode, roomTypeId, physicalRooms } = body;

        if (!hotelCode || hotelCode === "0" || !roomTypeId) {
            return NextResponse.json({ error: "Parameter hotelCode dan roomTypeId wajib diisi." }, { status: 400 });
        }
        if (!Array.isArray(physicalRooms)) {
            return NextResponse.json({ error: "Daftar nomor kamar fisik tidak valid." }, { status: 400 });
        }

        const cleanedList = Array.from(
            new Set(
                physicalRooms
                    .map((r: any) => String(r || "").trim())
                    .filter(Boolean)
            )
        );

        const rtRef = adminDb.collection(`hotels/${hotelCode}/roomTypes`).doc(roomTypeId);
        await rtRef.set(
            {
                physicalRooms: cleanedList,
                updatedAt: new Date().toISOString()
            },
            { merge: true }
        );

        return NextResponse.json({
            success: true,
            physicalRooms: cleanedList,
            message: `Daftar nomor kamar fisik (${cleanedList.length} unit) berhasil disimpan.`
        });
    } catch (err: any) {
        console.error("[API PUT /bookings/assign-room] Error:", err);
        return NextResponse.json(
            { error: err?.message || "Gagal menyimpan daftar nomor kamar fisik." },
            { status: 500 }
        );
    }
}

