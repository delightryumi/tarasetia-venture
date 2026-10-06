"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";
import { resolveChannelName, getChannelLogo, resolveBookingIdentifiers } from "@/lib/channelHelper";
import { BookingRecord, BookingStatusFilter, BookingStatsSummary } from "./types";

interface UseBookingsOptions {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    statusFilter: BookingStatusFilter;
    channelFilter: string;
    roomTypeFilter: string;
    searchQuery: string;
    sortBy: "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "guest_asc";
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
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

        Object.entries(rawDocsMap).forEach(([docId, docData]) => {
            const docDate = docData.date || docId.replace(`${activeHotelCode}_`, "") || docId;
            const entries = docData.entries || [];

            entries.forEach((entry: any) => {
                // Only process accommodation bookings (skip stand-alone F&B other_income if not linked)
                if (entry.type && entry.type !== "accommodation" && !entry.roomType && !entry.checkInDate && !entry.checkIn) {
                    return;
                }

                const ids = resolveBookingIdentifiers(entry);
                const guestName = (entry.guestName || "Tamu").trim();
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
                    entry.bookingId ||
                    entry.reservationId ||
                    entry.otaReservationId ||
                    entry.channexBookingId ||
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

                // Booking Date / Timestamp
                let bookingDateStr = docDate;
                if (entry.timestamp) {
                    try {
                        const t = typeof entry.timestamp === "number" ? new Date(entry.timestamp) : new Date(String(entry.timestamp));
                        if (!isNaN(t.getTime())) {
                            bookingDateStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
                        }
                    } catch {
                        // fallback to docDate
                    }
                }

                const currentAmount = Number(entry.amount ?? entry.totalAmount ?? 0);
                const currentGross = Number(entry.grossAmount ?? entry.totalPrice ?? currentAmount);
                const currentNet = Number(entry.netToHotel ?? currentAmount);

                if (!bookingsMap.has(canonicalId)) {
                    // Create new consolidated booking record
                    bookingsMap.set(canonicalId, {
                        id: canonicalId,
                        bookingId: ids.bookingId || canonicalId,
                        reservationId: ids.reservationId || canonicalId,
                        otaReservationId: ids.otaReservationId || entry.voucherCode || canonicalId,
                        revisionId: ids.revisionId || "",
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
                        timestamp: entry.timestamp || new Date().toISOString(),
                        nights: nightsCount,
                        roomType: entry.roomType || entry.roomTypeName || "Standard Room",
                        roomTypeId: entry.roomTypeId || "",
                        roomNumber: entry.roomNumber || "AUTO",
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
                        cancelReason: entry.cancelReason || (isEntryCancelled ? (entry.note || "Dibatalkan melalui OTA / Tamu") : undefined),
                        note: entry.note || "",
                        staffName: entry.staffName || "Front Desk",
                        propertyName: entry.propertyName || "",

                        _docId: docId,
                        _datesOccurred: [docDate],
                    });
                } else {
                    // Update existing consolidated record
                    const existing = bookingsMap.get(canonicalId)!;

                    if (!existing._datesOccurred.includes(docDate)) {
                        existing._datesOccurred.push(docDate);
                    }

                    // Keep earliest check-in & latest check-out
                    if (checkInDate && checkInDate < existing.checkInDate) {
                        existing.checkInDate = checkInDate;
                    }
                    if (checkOutDate && checkOutDate > existing.checkOutDate) {
                        existing.checkOutDate = checkOutDate;
                    }

                    // If any occurrence is marked cancelled, keep cancelled flag
                    if (isEntryCancelled) {
                        existing.isCancelled = true;
                        existing.status = "CANCELLED";
                        existing.paymentStatus = "CANCELLED";
                        existing.guestStatus = "cancelled";
                    }

                    // Accumulate totals if per-night entries were recorded separately
                    if (!existing.totalAmount || existing.totalAmount === 0) {
                        existing.totalAmount = existing.totalAmount + currentGross;
                    }
                }
            });
        });

        return Array.from(bookingsMap.values());
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

        // 6. Sorting
        list.sort((a, b) => {
            if (sortBy === "date_desc") {
                const dateA = a.checkInDate || a.bookingDate;
                const dateB = b.checkInDate || b.bookingDate;
                return dateB.localeCompare(dateA);
            }
            if (sortBy === "date_asc") {
                const dateA = a.checkInDate || a.bookingDate;
                const dateB = b.checkInDate || b.bookingDate;
                return dateA.localeCompare(dateB);
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
        rawCount: allAggregatedBookings.length,
        stats,
        filterOptions,
        loading,
        error,
    };
}
