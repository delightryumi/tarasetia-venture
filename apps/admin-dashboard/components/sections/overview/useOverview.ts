"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { collection, onSnapshot, doc, query, where } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";

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

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useOverview = (startDateStr: string, endDateStr: string) => {
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
        let unsubDaily: any = null;

        const initBookings = async () => {
            try {
                // Calculate dynamic Firestore query range to cover the selected dates plus padding
                const startRangeDate = new Date(startDateStr);
                startRangeDate.setDate(startRangeDate.getDate() - 30);
                const startRange = getLocalDateString(startRangeDate);
                
                const endRangeDate = new Date(endDateStr);
                endRangeDate.setDate(endRangeDate.getDate() + 15);
                const endRange = getLocalDateString(endRangeDate);
                
                const q = query(
                    getHotelCollection(db, "daily_revenue"), 
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
                    
                    const seenReservations = new Set<string>();
                    
                    const allEntriesRaw: any[] = [];
                    
                    querySnapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        const docDate = data.date || docSnap.id;
                        allDays.push({ ...data, date: docDate });

                        const entries = (data.entries || [])
                            .filter((e: any) => e.status !== "VOID" && e.status !== "VOIDED")
                            .map((e: any) => ({ 
                                ...e, 
                                _docId: docSnap.id,
                                _docDate: docDate
                            }));
                        allEntriesRaw.push(...entries);
                    });

                    const accommodationGroups: Record<string, any[]> = {};
                    const nonAccommodationEntries: any[] = [];

                    allEntriesRaw.forEach((e) => {
                        const isPOS = e.guestName?.startsWith("POS Order") || !!e.posItems || !!e.revenueType;
                        const isAccommodation = !isPOS && (e.type === "accommodation" || (!e.type && e.guestName));
                        
                        if (isAccommodation) {
                            const key = e.bookingId || e.timestamp || `${e.guestName}_${e.checkInDate}_${e.checkOutDate}_${e.roomNumber}`;
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
                        
                        const rep = { ...group[0] };
                        if (isCancelled) {
                            rep.status = "CANCELLED";
                            rep.paymentStatus = "CANCELLED";
                        }
                        
                        // Aggregate accommodation amounts across all nights of the stay
                        rep.amount = group.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                        rep.payHotel = group.reduce((sum, item) => sum + (Number(item.payHotel || item.paidCash || item.paidAmount1) || 0), 0);
                        rep.payTransfer = group.reduce((sum, item) => sum + (Number(item.payTransfer || item.payNexura || item.paidTransfer || item.paidAmount2) || 0), 0);
                        
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
            }
        };

        initBookings();

        const unsubRooms = onSnapshot(getHotelCollection(db, "roomTypes"), (snapshot) => {
            let totalRooms = 0;
            const rTypes: any[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const count = parseInt(data.roomCount) || parseInt(data.totalRooms) || parseInt(data.quantity) || 0;
                totalRooms += count;
                rTypes.push({
                    id: docSnap.id,
                    name: data.name,
                    allotment: count
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

        const unsubGallery = onSnapshot(getHotelCollection(db, "gallery"), (snapshot) => {
            setStats(prev => ({ ...prev, galleryCount: snapshot.size }));
        });

        const unsubAttractions = onSnapshot(getHotelCollection(db, "attractions"), (snapshot) => {
            setStats(prev => ({ ...prev, attractionsCount: snapshot.size }));
        });

        const unsubSEO = onSnapshot(doc(getHotelCollection(db, "settings"), "seo"), (snapshot) => {
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
    }, [startDateStr, endDateStr]);

    return stats;
};
