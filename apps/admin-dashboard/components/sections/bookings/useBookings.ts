"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { query, where, onSnapshot, getDocs } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";
import { resolveChannelName, getChannelLogo, resolveBookingIdentifiers } from "@/lib/channelHelper";
import { BookingRecord, BookingStatusFilter, BookingStatsSummary, BookingSortOption, RoomTypePhysicalConfig } from "./types";

interface UseBookingsOptions {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    statusFilter: BookingStatusFilter;
    channelFilter: string;
    roomTypeFilter: string;
    searchQuery: string;
    sortBy: BookingSortOption;
}

function parseTimestampValue(raw: any): number {
    if (!raw) return 0;
    if (typeof raw === "number") {
        // Handle seconds vs milliseconds epoch
        return raw < 1e12 ? raw * 1000 : raw;
    }
    if (typeof raw === "object") {
        if (typeof raw.toMillis === "function") return raw.toMillis();
        if (typeof raw.seconds === "number") return raw.seconds * 1000;
    }
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return 0;
        if (/^\d+$/.test(trimmed)) {
            const num = Number(trimmed);
            return num < 1e12 ? num * 1000 : num;
        }
        const parsed = Date.parse(trimmed);
        if (!isNaN(parsed)) return parsed;
    }
    return 0;
}

function resolveEntryTimestamp(
    entry: any,
    docData: any,
    docDate: string,
    checkInDate: string
): { iso: string; ms: number; dateStr: string } {
    // 1. Check explicit entry-level timestamps (pick the latest valid timestamp for newly arrived/revised bookings)
    const entryCandidates = [
        entry.timestamp,
        entry.updatedAt,
        entry.createdAt,
        entry.channexRaw?.insertedAt,
        entry.inserted_at,
    ];

    let bestMs = 0;
    for (const c of entryCandidates) {
        const ms = parseTimestampValue(c);
        if (ms > bestMs) bestMs = ms;
    }

    // 2. Fallback to document-level timestamps or date (never fallback to Date.now() so old entries don't jump to front)
    if (bestMs <= 0) {
        const docCandidates = [docData?.lastUpdated, docData?.createdAt];
        for (const c of docCandidates) {
            const ms = parseTimestampValue(c);
            if (ms > bestMs) bestMs = ms;
        }
    }

    if (bestMs <= 0) {
        const fallbackDate = entry.bookingDate || checkInDate || docDate || "1970-01-01";
        const parsedFallback = Date.parse(`${fallbackDate}T00:00:00+07:00`);
        bestMs = !isNaN(parsedFallback) ? parsedFallback : 0;
    }

    const d = new Date(bestMs || 0);
    const dateStr =
        bestMs > 0
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
            : docDate;

    return {
        iso: bestMs > 0 ? d.toISOString() : `${docDate}T00:00:00.000Z`,
        ms: bestMs,
        dateStr,
    };
}

export function useBookings({
    startDate,
    endDate,
    statusFilter,
    channelFilter,
    roomTypeFilter,
    searchQuery,
    sortBy,
}: UseBookingsOptions) {
    const { activeHotelCode } = useAuth();
    const [rawDocsMap, setRawDocsMap] = useState<Record<string, any>>({});
    const [roomTypesList, setRoomTypesList] = useState<RoomTypePhysicalConfig[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Room Types once per hotel session (low-cost single getDocs read)
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setRoomTypesList([]);
            return;
        }
        let cancelled = false;
        getDocs(getHotelCollection(db, "roomTypes", activeHotelCode))
            .then((snap) => {
                if (cancelled) return;
                const list: RoomTypePhysicalConfig[] = snap.docs.map((d) => {
                    const data = d.data();
                    const rawPhys: string[] = Array.isArray(data.physicalRooms)
                        ? data.physicalRooms
                              .map((p: any) => (typeof p === "string" ? p.trim() : String(p?.number || p?.name || "").trim()))
                              .filter(Boolean)
                        : [];
                    const totalRooms = Math.max(
                        1,
                        Number(
                            data.roomCount ??
                            data.totalRooms ??
                            data.roomsCount ??
                            (rawPhys.length > 0 ? rawPhys.length : (data.quantity ?? 1))
                        )
                    );
                    const paddedPhys = [...rawPhys];
                    let genericCounter = 1;
                    while (paddedPhys.length < totalRooms) {
                        let candidate = `${genericCounter}`;
                        while (paddedPhys.some((pr) => pr.toUpperCase() === candidate.toUpperCase())) {
                            genericCounter++;
                            candidate = `${genericCounter}`;
                        }
                        paddedPhys.push(candidate);
                    }
                    return {
                        id: d.id,
                        name: data.name || "Standard Room",
                        code: data.code || d.id,
                        totalRooms,
                        physicalRooms: paddedPhys,
                    };
                });
                setRoomTypesList(list);
            })
            .catch((err) => {
                console.warn("[useBookings] Could not load roomTypes:", err);
            });
        return () => {
            cancelled = true;
        };
    }, [activeHotelCode]);

    // Compute expanded query range with buffer to capture multi-night stays
    const { queryStart, queryEnd } = useMemo(() => {
        if (!startDate || !endDate) {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, "0");
            const d = String(today.getDate()).padStart(2, "0");
            const cur = `${y}-${m}-${d}`;
            return { queryStart: cur, queryEnd: cur };
        }

        try {
            const [sY, sM, sD] = startDate.split("-").map(Number);
            const startD = new Date(sY, (sM || 1) - 1, sD || 1);
            // 45-day lookback buffer for prior check-ins of long stays
            startD.setDate(startD.getDate() - 45);
            const qStart = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, "0")}-${String(startD.getDate()).padStart(2, "0")}`;

            const [eY, eM, eD] = endDate.split("-").map(Number);
            const endD = new Date(eY, (eM || 1) - 1, eD || 1);
            // 30-day forward buffer
            endD.setDate(endD.getDate() + 30);
            const qEnd = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, "0")}-${String(endD.getDate()).padStart(2, "0")}`;

            return { queryStart: qStart, queryEnd: qEnd };
        } catch {
            return { queryStart: startDate, queryEnd: endDate };
        }
    }, [startDate, endDate]);

    // Single low-cost indexed query on daily_revenue
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setRawDocsMap({});
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const colRef = getHotelCollection(db, "daily_revenue", activeHotelCode);
        const q = query(
            colRef,
            where("date", ">=", queryStart),
            where("date", "<=", queryEnd)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const newMap: Record<string, any> = {};
                snapshot.forEach((docSnap) => {
                    newMap[docSnap.id] = docSnap.data();
                });
                setRawDocsMap(newMap);
                setLoading(false);
            },
            (err) => {
                console.error("[useBookings] Firestore query error:", err);
                setError(err.message || "Gagal memuat data booking dari server");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [activeHotelCode, queryStart, queryEnd]);

    // Aggregate & Deduplicate multi-night booking records in-memory (O(N) single pass)
    const allAggregatedBookings = useMemo<BookingRecord[]>(() => {
        const bookingsMap = new Map<string, BookingRecord>();
        let entryOrderCounter = 0;

        // Sort rawDocsMap entries deterministically by date ascending before iterating
        const sortedDocEntries = Object.entries(rawDocsMap).sort(([idA, dataA], [idB, dataB]) => {
            const dA = dataA?.date || idA;
            const dB = dataB?.date || idB;
            return String(dA).localeCompare(String(dB));
        });

        sortedDocEntries.forEach(([docId, docData]) => {
            const docDate = docData.date || docId.replace(`${activeHotelCode}_`, "") || docId;
            const entries = docData.entries || [];

            entries.forEach((entry: any) => {
                entryOrderCounter += 1;
                const currentEntryOrder = entryOrderCounter;

                // Only process accommodation bookings (skip stand-alone F&B other_income or breakfast packages)
                if (entry.isBreakfastPackage || entry.type === "other_income" || (entry.type && entry.type !== "accommodation" && !entry.roomType)) {
                    return;
                }

                const ids = resolveBookingIdentifiers(entry);

                // Safely sanitize string fields that might be stored as objects in Firestore
                const guestName = (() => {
                    if (!entry.guestName) return "Tamu";
                    if (typeof entry.guestName === "string") return entry.guestName.trim() || "Tamu";
                    if (typeof entry.guestName === "object") {
                        return (entry.guestName.name || `${entry.guestName.first_name || ""} ${entry.guestName.last_name || ""}`).trim() || "Tamu";
                    }
                    return String(entry.guestName);
                })();

                const safeRoomType = (() => {
                    const raw = entry.roomType || entry.roomTypeName;
                    if (!raw) return "Standard Room";
                    if (typeof raw === "string") return raw.trim() || "Standard Room";
                    if (typeof raw === "object") {
                        return raw.name || raw.title || raw.roomType || raw.id || "Standard Room";
                    }
                    return String(raw);
                })();

                const safeRoomNumber = (() => {
                    const raw = entry.roomNumber;
                    if (!raw) return "AUTO";
                    if (typeof raw === "string") return raw.trim() || "AUTO";
                    if (typeof raw === "number") return String(raw);
                    if (typeof raw === "object") {
                        return raw.number || raw.name || raw.id || "AUTO";
                    }
                    return String(raw);
                })();

                const checkInDate = entry.checkInDate || entry.checkIn || entry.arrivalDate || entry.arrival_date || entry.effectiveDate || docDate || "";
                let checkOutDate = entry.checkOutDate || entry.checkOut || entry.departureDate || entry.departure_date || "";
                const nightsCount = Number(entry.nights || entry.totalStayNights || 1);

                if (!checkOutDate && checkInDate) {
                    try {
                        const [ciY, ciM, ciD] = checkInDate.split("-").map(Number);
                        const outDate = new Date(ciY, (ciM || 1) - 1, (ciD || 1) + nightsCount);
                        checkOutDate = `${outDate.getFullYear()}-${String(outDate.getMonth() + 1).padStart(2, "0")}-${String(outDate.getDate()).padStart(2, "0")}`;
                    } catch {
                        checkOutDate = checkInDate;
                    }
                }

                const canonicalId = (
                    entry.reservationId ||
                    ids.reservationId ||
                    entry.otaReservationId ||
                    ids.otaReservationId ||
                    (ids.bookingId && ids.bookingId !== ids.revisionId ? ids.bookingId : "") ||
                    (entry.bookingId && entry.bookingId !== entry.revisionId ? entry.bookingId : "") ||
                    (entry.channexBookingId && entry.channexBookingId !== entry.revisionId ? entry.channexBookingId : "") ||
                    entry.voucherCode ||
                    (guestName && checkInDate ? `${guestName.toLowerCase()}_${checkInDate}` : "") ||
                    `${docId}_${entry.timestamp || Math.random()}`
                ).trim();

                if (!canonicalId) return;

                const channel = resolveChannelName(entry);
                const channelLogo = getChannelLogo(channel);

                // Detect cancellation status
                const st = String(entry.status || "").toUpperCase();
                const pst = String(entry.paymentStatus || "").toUpperCase();
                const gst = String(entry.guestStatus || "").toLowerCase();
                const isEntryCancelled =
                    st === "CANCELLED" ||
                    st === "CANCEL" ||
                    pst === "CANCELLED" ||
                    pst === "CANCEL" ||
                    gst === "cancelled" ||
                    gst === "cancel" ||
                    Boolean(entry.isCancelled);

                // Booking Date / Timestamp (accurate incoming / revision epoch ms)
                const resolvedTs = resolveEntryTimestamp(entry, docData, docDate, checkInDate);
                const bookingDateStr = resolvedTs.dateStr || docDate;

                const currentAmount = Number(entry.amount ?? entry.totalAmount ?? 0);
                const currentGross = Number(entry.grossAmount ?? entry.totalPrice ?? currentAmount);
                const currentNet = Number(entry.netToHotel ?? currentAmount);

                const initialRevId = entry.initialRevisionId || 
                    (!entry.isModified && !isEntryCancelled ? (entry.revisionId || ids.revisionId) : undefined) ||
                    entry.revisionId || 
                    ids.revisionId;

                const modifiedRevId = entry.modifiedRevisionId || 
                    ((entry.isModified || entry.revisionEvent === "booking_modification" || entry.channexRaw?.eventId === "booking_modification") 
                        ? (entry.revisionId || ids.revisionId) 
                        : undefined);

                const cancelledRevId = entry.cancelledRevisionId || 
                    (isEntryCancelled ? (entry.revisionId || ids.revisionId) : undefined);

                let safeBookingId = ids.bookingId;
                if (safeBookingId === ids.revisionId && entry.channexBookingId && entry.channexBookingId !== ids.revisionId) {
                    safeBookingId = entry.channexBookingId;
                }
                if (safeBookingId === ids.revisionId && entry.booking_id && entry.booking_id !== ids.revisionId) {
                    safeBookingId = entry.booking_id;
                }
                if (safeBookingId === ids.revisionId && entry.bookingId && entry.bookingId !== ids.revisionId) {
                    safeBookingId = entry.bookingId;
                }
                if (safeBookingId === ids.revisionId && entry.channexRaw?.booking_id && entry.channexRaw?.booking_id !== ids.revisionId) {
                    safeBookingId = entry.channexRaw.booking_id;
                }

                if (!bookingsMap.has(canonicalId)) {
                    // Create new consolidated booking record
                    bookingsMap.set(canonicalId, {
                        id: canonicalId,
                        bookingId: safeBookingId || ids.bookingId || canonicalId,
                        reservationId: ids.reservationId || entry.reservationId || canonicalId,
                        otaReservationId: ids.otaReservationId || entry.otaReservationId || entry.voucherCode || canonicalId,
                        revisionId: ids.revisionId || entry.revisionId || "",
                        initialRevisionId: initialRevId,
                        modifiedRevisionId: modifiedRevId,
                        cancelledRevisionId: cancelledRevId,
                        voucherCode: entry.voucherCode || ids.otaReservationId || ids.reservationId || canonicalId,

                        guestName,
                        phone: entry.phone || "",
                        email: entry.email || "",
                        address: entry.address || "",
                        nationality: entry.nationality || "Indonesia",

                        channel,
                        otaName: entry.otaName || channel,
                        channelLogo,
                        connectionChannel: entry.connectionChannel || (entry.isOTA ? "Open Channel" : "Front Desk Direct"),
                        isOTA: Boolean(entry.isOTA || channel !== "Walk-in"),

                        checkInDate,
                        checkOutDate,
                        effectiveDate: entry.effectiveDate || docDate,
                        bookingDate: bookingDateStr || docDate,
                        timestamp: resolvedTs.iso,
                        timestampMs: resolvedTs.ms,
                        nights: nightsCount,
                        roomType: safeRoomType,
                        roomTypeId: entry.roomTypeId || "",
                        roomNumber: safeRoomNumber,
                        pax: Number(entry.pax || entry.adults || 2),
                        adults: Number(entry.adults || entry.pax || 2),
                        ratePlanName: entry.ratePlanName || (entry.hasBreakfast ? "With Breakfast" : "Room Only"),
                        rateCode: entry.rateCode || (entry.hasBreakfast ? "BB" : "RO"),
                        hasBreakfast: Boolean(entry.hasBreakfast || entry.mealsIncluded),
                        breakfastPax: Number(entry.breakfastPax || (entry.hasBreakfast ? entry.pax || 2 : 0)),

                        amount: currentAmount,
                        totalAmount: Number(entry.totalAmount || currentGross || currentAmount),
                        grossAmount: currentGross,
                        netToHotel: currentNet,
                        otaCommissionPercent: Number(entry.otaCommissionPercent || 0),
                        otaCommissionAmount: Number(entry.otaCommissionAmount || 0),
                        otaPromoAmount: Number(entry.otaPromoAmount || 0),
                        totalDeductionAmount: Number(entry.totalDeductionAmount || 0),
                        breakfastAmount: Number(entry.breakfastAmount || 0),

                        paymentMethod: entry.paymentMethod || (entry.paidOta ? "Channel Collect (VCC/OTA)" : "Pay at Hotel"),
                        paymentCollect: entry.paymentCollect || (entry.paidOta ? "channel" : "property"),
                        paymentStatus: isEntryCancelled ? "CANCELLED" : (entry.paymentStatus || (entry.paidOta || entry.paidTransfer || entry.paidCash ? "Lunas" : "Belum Bayar")),
                        paidCash: Number(entry.paidCash || 0),
                        paidTransfer: Number(entry.paidTransfer || 0),
                        paidOta: Number(entry.paidOta || 0),
                        paidEdc: Number(entry.paidEdc || 0),
                        paidQris: Number(entry.paidQris || 0),

                        status: isEntryCancelled ? "CANCELLED" : (entry.status || "CONFIRMED"),
                        guestStatus: entry.guestStatus || (isEntryCancelled ? "cancelled" : "confirmed"),
                        isCancelled: isEntryCancelled,
                        isOverbooked: Boolean(entry.isOverbooked || safeRoomNumber.toUpperCase() === "OVERBOOK"),
                        isModified: Boolean(
                            entry.isModified || 
                            entry.revisionEvent === "booking_modification" || 
                            entry.channexRaw?.eventId === "booking_modification" ||
                            (entry.note && (entry.note.toLowerCase().includes("revisi") || entry.note.toLowerCase().includes("perubahan")))
                        ),
                        isRescheduled: Boolean(entry.isRescheduled),
                        cancelReason: entry.cancelReason || (isEntryCancelled ? (entry.note || "Dibatalkan melalui OTA / Tamu") : undefined),
                        note: entry.note || "",
                        staffName: entry.staffName || "Front Desk",
                        propertyName: entry.propertyName || "",

                        _docId: docId,
                        _datesOccurred: [docDate],
                        _lastEntryOrder: currentEntryOrder,
                    });
                } else {
                    // Update existing consolidated record
                    const existing = bookingsMap.get(canonicalId)!;

                    if (!existing._datesOccurred.includes(docDate)) {
                        existing._datesOccurred.push(docDate);
                    }

                    // Keep latest roomNumber & roomType if moved manually
                    if (safeRoomNumber && safeRoomNumber !== "AUTO") {
                        existing.roomNumber = safeRoomNumber;
                    }
                    if (entry.isOverbooked || safeRoomNumber.toUpperCase() === "OVERBOOK") {
                        existing.isOverbooked = true;
                    } else if (safeRoomNumber && safeRoomNumber !== "AUTO" && safeRoomNumber.toUpperCase() !== "OVERBOOK") {
                        existing.isOverbooked = false;
                    }

                    // Keep the newest incoming / revision timestamp across multi-night occurrences
                    if (resolvedTs.ms > (existing.timestampMs || 0)) {
                        existing.timestampMs = resolvedTs.ms;
                        existing.timestamp = resolvedTs.iso;
                        existing.bookingDate = bookingDateStr || existing.bookingDate;
                    }
                    if (currentEntryOrder > (existing._lastEntryOrder || 0)) {
                        existing._lastEntryOrder = currentEntryOrder;
                    }

                    // Keep earliest check-in & latest check-out
                    if (checkInDate && checkInDate < existing.checkInDate) {
                        existing.checkInDate = checkInDate;
                    }
                    if (checkOutDate && checkOutDate > existing.checkOutDate) {
                        existing.checkOutDate = checkOutDate;
                    }

                    // Propagate revision IDs & flags across occurrences
                    if (entry.initialRevisionId && !existing.initialRevisionId) {
                        existing.initialRevisionId = entry.initialRevisionId;
                    }
                    if (!existing.initialRevisionId) {
                        existing.initialRevisionId = initialRevId || existing.revisionId;
                    }

                    if (entry.modifiedRevisionId && !existing.modifiedRevisionId) {
                        existing.modifiedRevisionId = entry.modifiedRevisionId;
                    }
                    if (entry.cancelledRevisionId && !existing.cancelledRevisionId) {
                        existing.cancelledRevisionId = entry.cancelledRevisionId;
                    }

                    // Preserve and heal true Channex booking ID if existing was equal to revisionId
                    if (existing.bookingId === existing.revisionId && safeBookingId && safeBookingId !== existing.revisionId) {
                        existing.bookingId = safeBookingId;
                    } else if (existing.bookingId === existing.revisionId && ids.bookingId && ids.bookingId !== ids.revisionId) {
                        existing.bookingId = ids.bookingId;
                    } else if (existing.bookingId === existing.revisionId && entry.channexBookingId && entry.channexBookingId !== existing.revisionId) {
                        existing.bookingId = entry.channexBookingId;
                    }

                    const isEntryModified = Boolean(
                        entry.isModified || 
                        entry.revisionEvent === "booking_modification" || 
                        entry.channexRaw?.eventId === "booking_modification" ||
                        (entry.note && (entry.note.toLowerCase().includes("revisi") || entry.note.toLowerCase().includes("perubahan")))
                    );
                    if (isEntryModified) {
                        existing.isModified = true;
                        if (!existing.modifiedRevisionId && (entry.revisionId || ids.revisionId)) {
                            existing.modifiedRevisionId = entry.revisionId || ids.revisionId;
                        }
                    }

                    // If any occurrence is marked cancelled, keep cancelled flag
                    if (isEntryCancelled) {
                        existing.isCancelled = true;
                        existing.status = "CANCELLED";
                        existing.paymentStatus = "CANCELLED";
                        existing.guestStatus = "cancelled";
                        if (!existing.cancelledRevisionId && (entry.revisionId || ids.revisionId)) {
                            existing.cancelledRevisionId = entry.revisionId || ids.revisionId;
                        }
                    }

                    // Accumulate totals if per-night entries were recorded separately
                    if (!existing.totalAmount || existing.totalAmount === 0) {
                        existing.totalAmount = existing.totalAmount + currentGross;
                    }
                }
            });
        });

        const list = Array.from(bookingsMap.values());

        // Detect physical room double-booking conflicts across active reservations (O(N) date-room bucket check)
        const dateRoomOccupants = new Map<string, BookingRecord[]>();
        for (const b of list) {
            if (b.isCancelled) continue;
            const rNum = String(b.roomNumber || "").trim().toUpperCase();
            if (!rNum || rNum === "AUTO" || rNum === "OVERBOOK" || rNum === "UNASSIGNED") continue;
            const rtKey = String(b.roomTypeId || b.roomType || "").trim().toLowerCase();

            for (const dStr of b._datesOccurred) {
                const slotKey = `${dStr}::${rtKey}::${rNum}`;
                const arr = dateRoomOccupants.get(slotKey) || [];
                arr.push(b);
                dateRoomOccupants.set(slotKey, arr);
            }
        }

        for (const occupants of dateRoomOccupants.values()) {
            if (occupants.length > 1) {
                for (const b of occupants) {
                    b.hasRoomConflict = true;
                    const others = occupants.filter((o) => o.id !== b.id).map((o) => o.guestName);
                    if (others.length > 0) {
                        b.conflictWithGuest = others.join(", ");
                    }
                }
            }
        }

        return list;
    }, [rawDocsMap]);

    // Unique filter options extracted dynamically
    const filterOptions = useMemo(() => {
        const channels = new Set<string>();
        const roomTypes = new Set<string>();

        allAggregatedBookings.forEach((b) => {
            if (b.channel) channels.add(b.channel);
            if (b.roomType) roomTypes.add(b.roomType);
        });

        return {
            channels: Array.from(channels).sort(),
            roomTypes: Array.from(roomTypes).sort(),
        };
    }, [allAggregatedBookings]);

    // Client-side filtering (Zero Firestore cost when switching filters!)
    const filteredBookings = useMemo<BookingRecord[]>(() => {
        let list = [...allAggregatedBookings];

        // 1. Date filter (Check-In date within selected date range)
        if (startDate && endDate) {
            list = list.filter((b) => {
                const targetDate = b.checkInDate || b.effectiveDate;
                if (!targetDate) return true;
                return targetDate >= startDate && targetDate <= endDate;
            });
        }

        // 2. Status filter
        if (statusFilter !== "ALL") {
            list = list.filter((b) => {
                if (statusFilter === "CANCELLED") return b.isCancelled || b.status === "CANCELLED";
                if (statusFilter === "CONFIRMED") return !b.isCancelled && (b.status === "CONFIRMED" || b.status === "Pending" || !b.status || b.status === "new" || b.status === "NEW" || b.status === "guaranteed" || b.status === "active");
                if (statusFilter === "CHECKED_OUT") return !b.isCancelled && (b.status === "CHECKED_OUT" || b.guestStatus === "checked_out");
                return true;
            });
        }

        // 3. Channel / OTA filter
        if (channelFilter && channelFilter !== "ALL") {
            list = list.filter((b) => b.channel.toLowerCase() === channelFilter.toLowerCase());
        }

        // 4. Room Type filter
        if (roomTypeFilter && roomTypeFilter !== "ALL") {
            list = list.filter((b) => b.roomType.toLowerCase() === roomTypeFilter.toLowerCase());
        }

        // 5. Search query (Guest name, Voucher, Booking ID, Room number)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter((b) => {
                return (
                    b.guestName.toLowerCase().includes(q) ||
                    b.voucherCode.toLowerCase().includes(q) ||
                    b.bookingId.toLowerCase().includes(q) ||
                    b.reservationId.toLowerCase().includes(q) ||
                    b.otaReservationId.toLowerCase().includes(q) ||
                    b.roomNumber.toLowerCase().includes(q) ||
                    b.roomType.toLowerCase().includes(q) ||
                    b.channel.toLowerCase().includes(q) ||
                    (b.phone && b.phone.toLowerCase().includes(q))
                );
            });
        }

        // 6. Sorting (Default "date_desc": Newest incoming booking at the very front)
        list.sort((a, b) => {
            if (sortBy === "date_desc") {
                const tsDiff = (b.timestampMs || 0) - (a.timestampMs || 0);
                if (tsDiff !== 0) return tsDiff;
                const bDateDiff = (b.bookingDate || "").localeCompare(a.bookingDate || "");
                if (bDateDiff !== 0) return bDateDiff;
                const orderDiff = (b._lastEntryOrder || 0) - (a._lastEntryOrder || 0);
                if (orderDiff !== 0) return orderDiff;
                return (b.checkInDate || "").localeCompare(a.checkInDate || "");
            }
            if (sortBy === "date_asc") {
                const tsDiff = (a.timestampMs || 0) - (b.timestampMs || 0);
                if (tsDiff !== 0) return tsDiff;
                const bDateDiff = (a.bookingDate || "").localeCompare(b.bookingDate || "");
                if (bDateDiff !== 0) return bDateDiff;
                const orderDiff = (a._lastEntryOrder || 0) - (b._lastEntryOrder || 0);
                if (orderDiff !== 0) return orderDiff;
                return (a.checkInDate || "").localeCompare(b.checkInDate || "");
            }
            if (sortBy === "checkin_asc") {
                const ciDiff = (a.checkInDate || a.bookingDate).localeCompare(b.checkInDate || b.bookingDate);
                if (ciDiff !== 0) return ciDiff;
                return (b.timestampMs || 0) - (a.timestampMs || 0);
            }
            if (sortBy === "checkin_desc") {
                const ciDiff = (b.checkInDate || b.bookingDate).localeCompare(a.checkInDate || a.bookingDate);
                if (ciDiff !== 0) return ciDiff;
                return (b.timestampMs || 0) - (a.timestampMs || 0);
            }
            if (sortBy === "amount_desc") {
                return (b.totalAmount || b.amount) - (a.totalAmount || a.amount);
            }
            if (sortBy === "amount_asc") {
                return (a.totalAmount || a.amount) - (b.totalAmount || b.amount);
            }
            if (sortBy === "guest_asc") {
                return a.guestName.localeCompare(b.guestName);
            }
            return 0;
        });

        return list;
    }, [
        allAggregatedBookings,
        startDate,
        endDate,
        statusFilter,
        channelFilter,
        roomTypeFilter,
        searchQuery,
        sortBy,
    ]);

    // Summary statistics calculated on filtered dataset
    const stats = useMemo<BookingStatsSummary>(() => {
        let confirmed = 0;
        let checkedIn = 0;
        let checkedOut = 0;
        let cancelled = 0;
        let totalGross = 0;
        let totalNet = 0;
        let totalNights = 0;

        filteredBookings.forEach((b) => {
            if (b.isCancelled) {
                cancelled += 1;
            } else {
                if (b.status === "CHECKED_IN" || b.guestStatus === "in_house") {
                    checkedIn += 1;
                } else if (b.status === "CHECKED_OUT" || b.guestStatus === "checked_out") {
                    checkedOut += 1;
                } else {
                    confirmed += 1;
                }

                totalGross += (b.totalAmount || b.grossAmount || b.amount || 0);
                totalNet += (b.netToHotel || b.amount || 0);
                totalNights += (b.nights || 1);
            }
        });

        return {
            totalBookings: filteredBookings.length,
            confirmedCount: confirmed,
            checkedInCount: checkedIn,
            checkedOutCount: checkedOut,
            cancelledCount: cancelled,
            totalGrossRevenue: totalGross,
            totalNetRevenue: totalNet,
            totalNights,
        };
    }, [filteredBookings]);

    return {
        bookings: filteredBookings,
        allBookings: allAggregatedBookings,
        roomTypesList,
        rawCount: allAggregatedBookings.length,
        stats,
        filterOptions,
        loading,
        error,
    };
}
