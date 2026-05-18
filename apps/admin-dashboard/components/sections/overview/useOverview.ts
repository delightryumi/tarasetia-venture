"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { collection, onSnapshot, doc, query, where } from "firebase/firestore";

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

export const useOverview = (targetDate: 'today' | 'tomorrow' = 'today') => {
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
                const baseDate = targetDate === 'tomorrow' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date();
                const dateStr = getLocalDateString(baseDate);
                
                // Query a range to catch overlaps (last 30 days should be enough)
                const startRange = getLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
                const endRange = getLocalDateString(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)); // Include 15 days ahead for calendar
                
                const q = query(
                    collection(db, "daily_revenue"), 
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
                    
                    querySnapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        const docDate = data.date || docSnap.id;
                        allDays.push({ ...data, date: docDate });

                        const entries = (data.entries || []).map((e: any) => ({ ...e, _docId: docSnap.id }));
                        
                        entries.forEach((e: any) => {
                            const isCancelled = e.status === "CANCELLED";
                            const isAccommodation = e.type === "accommodation" || (!e.type && e.guestName);
                            
                            if (isAccommodation) {
                                const reservationId = `${e.guestName}_${e.checkInDate}_${e.checkOutDate}_${e.roomNumber}`;
                                
                                if (!seenReservations.has(reservationId)) {
                                    seenReservations.add(reservationId);
                                    
                                    // 1. Logic for Check-In Today (Arrivals + Extensions)
                                    if (!isCancelled) {
                                        if (e.checkInDate === dateStr) {
                                            checkIn.push({ ...e, isExtend: false });
                                            todayTransactions.push({ ...e, isExtend: false });
                                        } else if (e.checkInDate < dateStr && e.checkOutDate > dateStr) {
                                            checkIn.push({ ...e, isExtend: true });
                                            todayTransactions.push({ ...e, isExtend: true });
                                        }
                                        
                                        if (e.checkOutDate === dateStr) checkOut.push(e);
                                        allAccommodation.push(e);
                                    }

                                    // 2. Logic for Cancellations
                                    if (isCancelled && e.checkInDate === dateStr) {
                                        cancels.push(e);
                                    }
                                }
                            } else {
                                // 3. Logic for "Other Income" created today
                                if (docDate === dateStr) {
                                    todayTransactions.push(e);
                                }
                            }
                        });
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

        const unsubRooms = onSnapshot(collection(db, "roomTypes"), (snapshot) => {
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

        const unsubGallery = onSnapshot(collection(db, "gallery"), (snapshot) => {
            setStats(prev => ({ ...prev, galleryCount: snapshot.size }));
        });

        const unsubAttractions = onSnapshot(collection(db, "attractions"), (snapshot) => {
            setStats(prev => ({ ...prev, attractionsCount: snapshot.size }));
        });

        const unsubSEO = onSnapshot(doc(db, "settings", "seo"), (snapshot) => {
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
    }, [targetDate]);

    return stats;
};
