"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { onSnapshot, doc, query, where } from "firebase/firestore";
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
                endD.setDate(endD.getDate() + 7);
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
                            .filter((e: any) => e.status !== "VOID" && e.status !== "VOIDED" && !e.isHidden && e.type !== "pelunasan_ar" && e.type !== "pelunasan_reversal" && !e.isPelunasan)
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
                        const isAccommodation = !isPOS && (e.type === "accommodation" || (!e.type && e.guestName));
                        
                        if (isAccommodation) {
                            const normGuestName = (e.guestName || "").trim().toLowerCase();
                            const roomIdent = String(e.roomNumber || e.roomTypeId || e.roomType || '').trim();
                            const cIn = e.checkInDate || e.checkIn || '';
                            const cOut = e.checkOutDate || e.checkOut || '';
                            const key = (normGuestName && cIn) 
                                ? `${normGuestName}_${roomIdent}_${cIn}_${cOut}` 
                                : (e.bookingId ? `b_${e.bookingId}` : `t_${e.timestamp}`);
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
                        const isCancelled = group.some(e => 
                            e.status === "CANCELLED" || 
                            e.paymentStatus === "CANCELLED" || 
                            e.status === "CANCEL" || 
                            e.paymentStatus === "CANCEL"
                        );
                        
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

                        // Deduplicate entries per distinct docDate to avoid summing duplicate records from same night
                        const dateMap: Record<string, any> = {};
                        group.forEach(item => {
                            const dKey = item._docDate || item.effectiveDate || item.checkInDate || 'default';
                            dateMap[dKey] = item;
                        });
                        const distinctEntries = Object.values(dateMap);

                        const stayTotalAmount = distinctEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
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

                        // Check if group has explicit daily entries for the selected dates
                        const periodEntries = group.filter(e => e._docDate && e._docDate >= startDateStr && e._docDate <= endDateStr);
                        
                        let periodAmount = 0;
                        let periodPayHotel = 0;
                        let periodPayTransfer = 0;

                        if (periodEntries.length > 0 && periodEntries.length === nightsInPeriod) {
                            periodAmount = periodEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                            periodPayHotel = periodEntries.reduce((sum, item) => sum + (Number(item.payHotel || item.paidCash || item.paidAmount1) || 0), 0);
                            periodPayTransfer = periodEntries.reduce((sum, item) => sum + (Number(item.payTransfer || item.payNexura || item.paidTransfer || item.paidAmount2) || 0), 0);
                        } else if (nightsInPeriod > 0) {
                            periodAmount = Math.round((stayTotalAmount / totalStayNights) * nightsInPeriod);
                            periodPayHotel = Math.round((stayPayHotel / totalStayNights) * nightsInPeriod);
                            periodPayTransfer = Math.round((stayPayTransfer / totalStayNights) * nightsInPeriod);
                        } else {
                            periodAmount = Math.round(stayTotalAmount / totalStayNights);
                            periodPayHotel = Math.round(stayPayHotel / totalStayNights);
                            periodPayTransfer = Math.round(stayPayTransfer / totalStayNights);
                        }

                        rep.totalAmount = stayTotalAmount;
                        rep.ratePerNight = Math.round(stayTotalAmount / totalStayNights);
                        rep.totalStayNights = totalStayNights;
                        rep.nightsInPeriod = nightsInPeriod || 1;
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
                        const isCancelled = e.status === "CANCELLED" || e.paymentStatus === "CANCELLED" || e.status === "CANCEL" || e.paymentStatus === "CANCEL";
                        
                        if (!isCancelled) {
                            if (e.checkInDate >= startDateStr && e.checkInDate <= endDateStr) {
                                checkIn.push({ ...e, isExtend: false });
                                todayTransactions.push({ ...e, isExtend: false });
                            } else if (e.checkInDate < startDateStr && e.checkOutDate > startDateStr) {
                                checkIn.push({ ...e, isExtend: true });
                                todayTransactions.push({ ...e, isExtend: true });
                            }
                            
                            if (e.checkOutDate >= startDateStr && e.checkOutDate <= endDateStr) {
                                checkOut.push(e);
                            }
                            allAccommodation.push(e);
                        } else {
                            const cancellationDate = e.cancelledAt || e.checkInDate;
                            if (cancellationDate >= startDateStr && cancellationDate <= endDateStr) {
                                cancels.push(e);
                            }
                            if (e.checkInDate >= startDateStr && e.checkInDate <= endDateStr) {
                                todayTransactions.push({ ...e, isExtend: false });
                            } else if (e.checkInDate < startDateStr && e.checkOutDate > startDateStr) {
                                todayTransactions.push({ ...e, isExtend: true });
                            }
                        }
                    });

                    nonAccommodationEntries.forEach((e) => {
                        if (e._docDate >= startDateStr && e._docDate <= endDateStr) {
                            todayTransactions.push(e);
                        }
                    });
                    
                    const latest = [...todayTransactions]
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

    // Separate useEffect for static collections to avoid re-reading when toggling dates
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") return;

        const unsubRooms = onSnapshot(getHotelCollection(db, "roomTypes", activeHotelCode), (snapshot) => {
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
        });

        const unsubGallery = onSnapshot(getHotelCollection(db, "gallery", activeHotelCode), (snapshot) => {
            setStats(prev => ({ ...prev, galleryCount: snapshot.size }));
        });

        const unsubAttractions = onSnapshot(getHotelCollection(db, "attractions", activeHotelCode), (snapshot) => {
            setStats(prev => ({ ...prev, attractionsCount: snapshot.size }));
        });

        const unsubSEO = onSnapshot(doc(getHotelCollection(db, "settings", activeHotelCode), "seo"), (snapshot) => {
            setStats(prev => ({
                ...prev,
                seoConfigured: snapshot.exists(),
                loading: false
            }));
        });

        return () => {
            unsubRooms();
            unsubGallery();
            unsubAttractions();
            unsubSEO();
        };
    }, [activeHotelCode]);

    return stats;
};
