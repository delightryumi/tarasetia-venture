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
    paymentStatus?: string;
    type?: string;
    incomeCategory?: string;
    roomStatus?: string;
    guestStatus?: string;
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
                startD.setDate(startD.getDate() - 60);
                const startRange = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;

                const [eY, eM, eD] = endDateStr.split('-').map(Number);
                const endD = new Date(eY, (eM || 1) - 1, eD || 1);
                endD.setDate(endD.getDate() + 30);
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
                            const roomIdent = e.roomNumber || e.roomTypeId || e.roomType || '';
                            const key = e.bookingId 
                                ? `${e.bookingId}_${roomIdent}_${e.checkInDate}_${e.checkOutDate}` 
                                : `${e.guestName}_${roomIdent}_${e.checkInDate}_${e.checkOutDate}_${e.timestamp || ''}`;
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

                        const rep = { ...group[0] };
                        if (isCancelled) {
                            rep.status = "CANCELLED";
                            rep.paymentStatus = "CANCELLED";
                        }
                        
                        // Aggregate accommodation amounts across all nights of the stay
                        rep.amount = group.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                        rep.payHotel = group.reduce((sum, item) => sum + (Number(item.payHotel || item.paidCash || item.paidAmount1) || 0), 0);
                        rep.payTransfer = group.reduce((sum, item) => sum + (Number(item.payTransfer || item.payNexura || item.paidTransfer || item.paidAmount2) || 0), 0);
                        
                        rep.checkInDate = rep.checkInDate || rep.checkIn || group[0]._docDate;
                        rep.checkOutDate = rep.checkOutDate || rep.checkOut || "";

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
            if (unsubDaily) unsubDaily();
        };
    }, [activeHotelCode, startDateStr, endDateStr]);

    return stats;
};
