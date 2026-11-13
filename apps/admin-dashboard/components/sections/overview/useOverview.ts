"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { onSnapshot, doc, query, where, getDocs } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";

export interface BookingEntry {
    guestName: string;
    bookingId?: string;
    roomType: string;
    channel: string;
    amount: number;
    status: string;
    timestamp: string;
    checkInDate?: string;
    checkOutDate?: string;
    isExtend?: boolean;
    _docId?: string;
    roomNumber?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    type?: string;
    incomeCategory?: string;
    roomStatus?: string;
    guestStatus?: string;
    totalAmount?: number;
    ratePerNight?: number;
    totalStayNights?: number;
    nightsInPeriod?: number;
    paidCash?: number;
    paidEdc?: number;
    paidQris?: number;
    paidTransfer?: number;
    paidOta?: number;
    payHotel?: number;
    payTransfer?: number;
}

export interface OverviewStats {
    roomsCount: number;
    galleryCount: number;
    attractionsCount: number;
    seoConfigured: boolean;
    loading: boolean;
    
    checkInCount: number;
    checkOutCount: number;
    cancelCount: number;
    todayCheckIns: BookingEntry[];
    todayCheckOuts: BookingEntry[];
    todayCanceled: BookingEntry[];
    roomStatus: { occupied: number; available: number; total: number };
    latestBookings: BookingEntry[];
    todayTransactions: any[];
    dailyData: any[];
    roomTypesData: any[];
}

export const useOverview = (startDateStr: string, endDateStr: string) => {
    const { activeHotelCode } = useAuth();
    const [stats, setStats] = useState<OverviewStats>({
        roomsCount: 0,
        galleryCount: 0,
        attractionsCount: 0,
        seoConfigured: false,
        loading: true,
        
        checkInCount: 0,
        checkOutCount: 0,
        cancelCount: 0,
        todayCheckIns: [],
        todayCheckOuts: [],
        todayCanceled: [],
        roomStatus: { occupied: 0, available: 0, total: 0 },
        latestBookings: [],
        todayTransactions: [],
        dailyData: [],
        roomTypesData: [],
    });

    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setStats(prev => ({ ...prev, loading: false }));
            return;
        }

        let unsubDaily: any = null;

        const initBookings = async () => {
            try {
                // Calculate dynamic Firestore query range with timezone-safe parsing
                const [sY, sM, sD] = startDateStr.split('-').map(Number);
                const startD = new Date(sY, (sM || 1) - 1, sD || 1);
                startD.setDate(startD.getDate() - 30);
                const startRange = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;

                const [eY, eM, eD] = endDateStr.split('-').map(Number);
                const endD = new Date(eY, (eM || 1) - 1, eD || 1);
                endD.setDate(endD.getDate() + 90);
                const endRange = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;

                const q = query(
                    getHotelCollection(db, "daily_revenue", activeHotelCode), 
                    where("date", ">=", startRange),
                    where("date", "<=", endRange)
                );

                unsubDaily = onSnapshot(q, (querySnapshot) => {
                    let checkIn: BookingEntry[] = [];
                    let checkOut: BookingEntry[] = [];
                    let cancels: BookingEntry[] = [];
                    let allAccommodation: any[] = [];
                    let todayTransactions: any[] = [];
                    let allDays: any[] = [];
                    
                    const allEntriesRaw: any[] = [];
                    
                    querySnapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        const docDate = data.date || docSnap.id.replace(`${activeHotelCode}_`, "") || docSnap.id;
                        allDays.push({ ...data, date: docDate });

                        const entries = (data.entries || [])
                            .filter((e: any) => {
                                const st = String(e.status || "").toUpperCase();
                                const pst = String(e.paymentStatus || "").toUpperCase();
                                const gst = String(e.guestStatus || "").toLowerCase();
                                const isVoid = st === "VOID" || st === "VOIDED" || pst === "VOID" || pst === "VOIDED" || gst === "void" || e.isDeleted === true || e.isVoid === true;
                                return !isVoid && !e.isHidden && e.type !== "pelunasan_ar" && e.type !== "pelunasan_reversal" && !e.isPelunasan;
                            })
                            .map((e: any) => {
                                const checkInDate = e.checkInDate || e.checkIn || e.effectiveDate || docDate;
                                const checkOutDate = e.checkOutDate || e.checkOut || "";
                                return { 
                                    ...e, 
                                    checkInDate,
                                    checkOutDate,
                                    _docId: docSnap.id,
                                    _docDate: docDate
                                };
                            });
                        allEntriesRaw.push(...entries);
                    });

                    const accommodationGroups: Record<string, any[]> = {};
                    const nonAccommodationEntries: any[] = [];

                    allEntriesRaw.forEach((e) => {
                        const isPOS = e.guestName?.startsWith("POS Order") || !!e.posItems || !!e.revenueType;
                        const isAccommodation = !isPOS && (e.type === "accommodation" || e.type === "room" || (!e.type && e.guestName));
                        
                        if (isAccommodation) {
                            const normGuestName = (e.guestName || "").trim().toLowerCase();
                            const roomIdent = String(e.roomNumber || e.roomIndex || e.roomTypeId || e.roomType || '').trim();
                            const cIn = e.checkInDate || e.checkIn || '';
                            const cOut = e.checkOutDate || e.checkOut || '';
                            const bId = e.bookingId && e.bookingId !== '-' ? String(e.bookingId).trim() : '';
                            const cleanBId = bId.replace(/^OFL-/, '').replace(/-BFT$/i, '');
                            const rIdx = e.roomIndex !== undefined ? `_r${e.roomIndex}` : '';
                            const key = cleanBId 
                                ? `b_${cleanBId}${rIdx}_${roomIdent}` 
                                : (normGuestName && cIn) 
                                    ? `${normGuestName}_${roomIdent}${rIdx}_${cIn}_${cOut}` 
                                    : `t_${e.timestamp || Math.random()}`;
                            if (!accommodationGroups[key]) {
                                accommodationGroups[key] = [];
                            }
                            accommodationGroups[key].push(e);
                        } else {
                            if (!isPOS) {
                                nonAccommodationEntries.push(e);
                            }
                        }
                    });

                    const resolvedAccommodation: any[] = [];
                    Object.values(accommodationGroups).forEach((group) => {
                        const isCancelled = group.some(e => {
                            const st = String(e.status || "").toUpperCase();
                            const pst = String(e.paymentStatus || "").toUpperCase();
                            const gst = String(e.guestStatus || "").toLowerCase();
                            return st === "CANCELLED" || st === "CANCEL" || pst === "CANCELLED" || pst === "CANCEL" || gst === "cancelled" || gst === "cancel";
                        });
                        
                        group.sort((a, b) => (a._docDate || a.checkInDate || '').localeCompare(b._docDate || b.checkInDate || ''));

                        const rep = { ...group[group.length - 1] };
                        if (isCancelled) {
                            rep.status = "CANCELLED";
                            rep.paymentStatus = "CANCELLED";
                        }
                        
                        // Calculate stay nights and daily rate for accurate Daily Audit balance
                        const checkInDate = rep.checkInDate || rep.checkIn || group[0]._docDate;
                        const checkOutDate = rep.checkOutDate || rep.checkOut || "";

                        let totalStayNights = 1;
                        if (checkInDate && checkOutDate) {
                            const [ciY, ciM, ciD] = checkInDate.split('-').map(Number);
                            const [coY, coM, coD] = checkOutDate.split('-').map(Number);
                            const dIn = new Date(ciY, (ciM || 1) - 1, ciD || 1);
                            const dOut = new Date(coY, (coM || 1) - 1, coD || 1);
                            const diff = Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 60 * 60 * 24));
                            totalStayNights = Math.max(1, isNaN(diff) ? 1 : diff);
                        } else if (rep.nights) {
                            totalStayNights = Math.max(1, Number(rep.nights) || 1);
                        }

                        // Generate all stay night dates
                        const stayNightDates: string[] = [];
                        if (checkInDate && totalStayNights > 0) {
                            const [ciY, ciM, ciD] = checkInDate.split('-').map(Number);
                            let curr = new Date(ciY, (ciM || 1) - 1, ciD || 1);
                            for (let i = 0; i < totalStayNights; i++) {
                                const y = curr.getFullYear();
                                const m = String(curr.getMonth() + 1).padStart(2, '0');
                                const d = String(curr.getDate()).padStart(2, '0');
                                stayNightDates.push(`${y}-${m}-${d}`);
                                curr.setDate(curr.getDate() + 1);
                            }
                        }

                        // Deduplicate entries per distinct docDate
                        const dateMap: Record<string, any> = {};
                        group.forEach(item => {
                            const dKey = item._docDate || item.effectiveDate || item.checkInDate || 'default';
                            dateMap[dKey] = item;
                        });
                        const distinctEntries = Object.values(dateMap);

                        // FRONT OFFICE USALI STANDARD: Always display full room rate plan selling price (Rp 600.000)
                        const repGross = Number(rep.grossAmount || 0);
                        const repTotal = Number(rep.totalAmount || 0);
                        const repAmount = Number(rep.amount || 0);

                        let trueTotalAmount = repGross > 0 ? repGross : (repTotal > 0 ? repTotal : repAmount);
                        if (trueTotalAmount <= 0) {
                            if (distinctEntries.length === totalStayNights) {
                                trueTotalAmount = distinctEntries.reduce((sum, item) => {
                                    const iAmt = Number(item.amount) || 0;
                                    const iGross = Number(item.grossAmount) || 0;
                                    return sum + (iGross > 0 ? iGross : (Number(item.totalAmount) || iAmt));
                                }, 0);
                            } else {
                                trueTotalAmount = Math.max(...distinctEntries.map(item => {
                                    const iAmt = Number(item.amount) || 0;
                                    const iGross = Number(item.grossAmount) || 0;
                                    return iGross > 0 ? iGross : (Number(item.totalAmount) || iAmt);
                                }), 0);
                            }
                        }
                        if (trueTotalAmount <= 0) {
                            trueTotalAmount = distinctEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                        }

                        const ratePerNight = totalStayNights > 0 ? Math.round(trueTotalAmount / totalStayNights) : trueTotalAmount;

                        const stayPaidCash = distinctEntries.reduce((sum, item) => sum + (Number(item.paidCash) || 0), 0);
                        const stayPaidEdc = distinctEntries.reduce((sum, item) => sum + (Number(item.paidEdc) || 0), 0);
                        const stayPaidQris = distinctEntries.reduce((sum, item) => sum + (Number(item.paidQris) || 0), 0);
                        const stayPaidTransfer = distinctEntries.reduce((sum, item) => sum + (Number(item.paidTransfer) || 0), 0);
                        const stayPaidOta = distinctEntries.reduce((sum, item) => sum + (Number(item.paidOta) || 0), 0);

                        const hasGranularStay = (stayPaidCash > 0 || stayPaidEdc > 0 || stayPaidQris > 0 || stayPaidTransfer > 0 || stayPaidOta > 0);
                        const stayPayHotel = hasGranularStay 
                            ? (stayPaidCash + stayPaidEdc + stayPaidQris + stayPaidTransfer) 
                            : distinctEntries.reduce((sum, item) => sum + (Number(item.payHotel ?? item.paidCash ?? item.paidAmount1 ?? 0)), 0);
                        const stayPayTransfer = hasGranularStay 
                            ? (stayPaidOta + stayPaidTransfer) 
                            : distinctEntries.reduce((sum, item) => sum + (Number(item.payTransfer ?? item.payNexura ?? item.paidTransfer ?? item.paidAmount2 ?? 0)), 0);

                        // Find matching nights in current filter range [startDateStr, endDateStr]
                        const matchingNights = stayNightDates.filter(d => d >= startDateStr && d <= endDateStr);
                        const nightsInPeriod = matchingNights.length;

                        let periodAmount = 0;
                        matchingNights.forEach(nightDate => {
                            const exactEntry = dateMap[nightDate];
                            const nIdx = stayNightDates.indexOf(nightDate);
                            const exactAmt = Number(exactEntry?.amount || 0);
                            const exactGross = Number(exactEntry?.grossAmount || 0);
                            const fullExactRate = exactGross > 0 ? exactGross : (exactAmt > 0 ? exactAmt : ratePerNight);

                            const specificNightRate = (exactEntry && fullExactRate > 0)
                                ? fullExactRate
                                : (Array.isArray(rep.nightRates) && nIdx >= 0 && rep.nightRates[nIdx] !== undefined && Number(rep.nightRates[nIdx]) > 0
                                    ? Number(rep.nightRates[nIdx])
                                    : ratePerNight);
                            periodAmount += specificNightRate;
                        });

                        const periodPayHotel = totalStayNights > 0 ? Math.round((stayPayHotel / totalStayNights) * nightsInPeriod) : stayPayHotel;
                        const periodPayTransfer = totalStayNights > 0 ? Math.round((stayPayTransfer / totalStayNights) * nightsInPeriod) : stayPayTransfer;

                        // Authoritative Payment Status Resolution (Due Amount = 0 => Lunas)
                        const totalStayPaid = stayPayHotel + stayPayTransfer;
                        const isPaidInFull = !isCancelled && (
                            rep.isCompliment ||
                            (trueTotalAmount > 0 && totalStayPaid >= trueTotalAmount) ||
                            distinctEntries.some(item => {
                                const ps = String(item.paymentStatus || '').trim().toLowerCase();
                                return ps === 'lunas' || ps === 'settled';
                            }) ||
                            group.some(item => {
                                const ps = String(item.paymentStatus || '').trim().toLowerCase();
                                return ps === 'lunas' || ps === 'settled';
                            })
                        );

                        if (isCancelled) {
                            rep.paymentStatus = "CANCELLED";
                        } else if (isPaidInFull) {
                            rep.paymentStatus = "Lunas";
                        } else if (totalStayPaid > 0 && totalStayPaid < trueTotalAmount) {
                            rep.paymentStatus = "DP / Partial";
                        } else if (rep.paymentStatus === "Belum Bayar" && totalStayPaid >= trueTotalAmount && trueTotalAmount > 0) {
                            rep.paymentStatus = "Lunas";
                        }

                        rep.totalAmount = trueTotalAmount;
                        rep.ratePerNight = ratePerNight;
                        rep.totalStayNights = totalStayNights;
                        rep.nightsInPeriod = nightsInPeriod;
                        rep.amount = periodAmount;
                        rep.paidCash = stayPaidCash;
                        rep.paidEdc = stayPaidEdc;
                        rep.paidQris = stayPaidQris;
                        rep.paidTransfer = stayPaidTransfer;
                        rep.paidOta = stayPaidOta;
                        rep.payHotel = periodPayHotel;
                        rep.payTransfer = periodPayTransfer;
                        rep.checkInDate = checkInDate;
                        rep.checkOutDate = checkOutDate;

                        resolvedAccommodation.push(rep);
                    });

                    resolvedAccommodation.forEach((e) => {
                        const st = String(e.status || "").toUpperCase();
                        const pst = String(e.paymentStatus || "").toUpperCase();
                        const gst = String(e.guestStatus || "").toLowerCase();
                        const isCancelled = st === "CANCELLED" || st === "CANCEL" || pst === "CANCELLED" || pst === "CANCEL" || gst === "cancelled" || gst === "cancel";
                        
                        const isCheckInInPeriod = e.checkInDate >= startDateStr && e.checkInDate <= endDateStr;
                        const isInHouseInPeriod = e.checkInDate < startDateStr && e.checkOutDate > startDateStr;
                        const isCheckOutInPeriod = e.checkOutDate >= startDateStr && e.checkOutDate <= endDateStr;
                        const cancellationDate = e.cancelledAt || e.checkInDate;
                        const isCancelledInPeriod = isCancelled && Boolean(cancellationDate && cancellationDate >= startDateStr && cancellationDate <= endDateStr);
                        const bookingCreatedDate = e.timestamp ? String(e.timestamp).slice(0, 10) : "";
                        const isCreatedInPeriod = bookingCreatedDate >= startDateStr && bookingCreatedDate <= endDateStr;

                        if (!isCancelled) {
                            if (isCheckInInPeriod) {
                                checkIn.push({ ...e, isExtend: false });
                                todayTransactions.push({ ...e, isExtend: false });
                            } else if (isInHouseInPeriod) {
                                checkIn.push({ ...e, isExtend: true });
                                todayTransactions.push({ ...e, isExtend: true });
                            } else if (isCreatedInPeriod) {
                                todayTransactions.push({ ...e, isExtend: false });
                            }
                            
                            if (isCheckOutInPeriod) {
                                const checkOutEntry = {
                                    ...e,
                                    amount: Number(e.amount) > 0 ? e.amount : (e.totalAmount || e.ratePerNight || 0)
                                };
                                checkOut.push(checkOutEntry);
                            }
                            allAccommodation.push(e);
                        } else {
                            if (isCancelledInPeriod) {
                                cancels.push(e);
                            }
                            // CANCELLED GUEST: Keep in todayTransactions (with status CANCELLED) so it stays visible with strikethrough in AuditLedger!
                            if (isCancelledInPeriod || isCheckInInPeriod || isInHouseInPeriod || isCreatedInPeriod) {
                                todayTransactions.push({ ...e, isExtend: isInHouseInPeriod && !isCheckInInPeriod, status: "CANCELLED", paymentStatus: "CANCELLED" });
                            }
                        }
                    });

                    // Note: Overview Front Office tracks accommodation bookings.
                    // Deduplicate per room unit so multi-room bookings keep all units
                    const seenKeys = new Set<string>();
                    const deduped = todayTransactions.filter(e => {
                        const rIdx = e.roomIndex !== undefined ? `_r${e.roomIndex}` : '';
                        const rNum = e.roomNumber ? `_${e.roomNumber}` : '';
                        const key = e.bookingId
                            ? `${e.bookingId}${rIdx}${rNum}`
                            : e._docId
                            ? `${e._docId}_${e.guestName || ""}${rIdx}${rNum}`
                            : `${String(e.guestName || "").toLowerCase()}_${e.checkInDate || ""}_${e.checkOutDate || ""}${rIdx}${rNum}`;
                        if (seenKeys.has(key)) return false;
                        seenKeys.add(key);
                        return true;
                    });

                    const latest = deduped
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    
                    setStats(prev => {
                        return {
                            ...prev,
                            loading: false,
                            checkInCount: checkIn.length,
                            checkOutCount: checkOut.length,
                            cancelCount: cancels.length,
                            todayCheckIns: checkIn,
                            todayCheckOuts: checkOut,
                            todayCanceled: cancels,
                            latestBookings: latest,
                            todayTransactions: latest,
                            dailyData: allDays,
                            roomStatus: {
                                ...prev.roomStatus,
                                occupied: checkIn.length,
                                available: Math.max(0, prev.roomStatus.total - checkIn.length)
                            }
                        };
                    });
                });
            } catch (err) {
                console.error("Error fetching bookings for overview", err);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        initBookings();

        return () => {
            if (unsubDaily) unsubDaily();
        };
    }, [activeHotelCode, startDateStr, endDateStr]);

    // Low-cost 1-shot fetch for static roomTypes collection (avoids ongoing snapshot reads)
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") return;

        let cancelled = false;
        getDocs(getHotelCollection(db, "roomTypes", activeHotelCode)).then((snapshot) => {
            if (cancelled) return;
            let totalRooms = 0;
            const rTypes: any[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const count = parseInt(data.roomCount) || parseInt(data.totalRooms) || parseInt(data.quantity) || 0;
                totalRooms += count;
                rTypes.push({
                    id: docSnap.id,
                    name: data.name,
                    allotment: count,
                    physicalRooms: data.physicalRooms || []
                });
            });
            
            setStats(prev => {
                const occupied = prev.checkInCount;
                return { 
                    ...prev, 
                    roomsCount: snapshot.size,
                    roomTypesData: rTypes,
                    roomStatus: { 
                        total: totalRooms,
                        occupied: occupied,
                        available: Math.max(0, totalRooms - occupied)
                    }
                };
            });
        }).catch((err) => {
            console.error("Error loading room types in useOverview:", err);
        });

        return () => {
            cancelled = true;
        };
    }, [activeHotelCode]);

    return stats;
};
