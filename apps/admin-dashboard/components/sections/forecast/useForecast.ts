import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDocs, query, where } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface ForecastStats {
    totalGrossRevenue: number;
    salesPayAtTransfer: number;
    salesPayAtHotel: number;
    walkInRevenue: number;
    otaRevenue: number;
    otherRevenue: number;
    
    occ: number;
    arr: number;
    revPar: number;
    roomsSold: number;
    totalPossibleRoomNights: number;
    
    entries: any[];
    trendData: any[];
    loading: boolean;
}

export const useForecast = (viewMode: "daily" | "monthly" | "yearly", selectedDate: string) => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [stats, setStats] = useState<ForecastStats>({
        totalGrossRevenue: 0,
        salesPayAtTransfer: 0,
        salesPayAtHotel: 0,
        walkInRevenue: 0,
        otaRevenue: 0,
        otherRevenue: 0,
        occ: 0,
        arr: 0,
        revPar: 0,
        roomsSold: 0,
        totalPossibleRoomNights: 0,
        entries: [],
        trendData: [],
        loading: true,
    });

    useEffect(() => {
        setStats(prev => ({ ...prev, loading: true }));
        
        const fetchRooms = async () => {
            const roomSnap = await getDocs(getHotelCollection(db, "roomTypes"));
            let count = 0;
            roomSnap.forEach(d => {
                const data = d.data();
                count += (data.roomCount || data.totalRooms || 1);
            });
            return count;
        };

        const hotelId = localStorage.getItem("active_hotel_code") || "87241";
        
        const fetchData = async () => {
            const totalPhysicalRooms = await fetchRooms();
            const [year, month, day] = selectedDate.split("-");
            
            let startStr, endStr, totalDaysForOcc;
            let trendLabels: string[] = [];
            let trendMode: 'days' | 'months' | 'years' = 'days';

            if (viewMode === "daily") {
                startStr = `${year}-${month}-01`;
                const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
                endStr = `${year}-${month}-${String(daysInMonth).padStart(2, '0')}`;
                totalDaysForOcc = 1; 
                trendMode = 'days';
                for(let i=1; i<=daysInMonth; i++) trendLabels.push(String(i));
            } else if (viewMode === "monthly") {
                startStr = `${year}-01-01`;
                endStr = `${year}-12-31`;
                totalDaysForOcc = new Date(Number(year), Number(month), 0).getDate();
                trendMode = 'months';
                trendLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            } else {
                startStr = `2024-01-01`;
                endStr = `2030-12-31`;
                totalDaysForOcc = (Number(year) % 4 === 0 && (Number(year) % 100 !== 0 || Number(year) % 400 === 0)) ? 366 : 365;
                trendMode = 'years';
                trendLabels = ['2024','2025','2026','2027','2028','2029','2030'];
            }

            const q = query(getHotelCollection(db, "daily_revenue"), where("date", ">=", startStr), where("date", "<=", endStr));
            const snap = await getDocs(q);
            
            let gross = 0, walkin = 0, ota = 0, other = 0, transferAmt = 0, hotel = 0, roomsSold = 0, roomRevenue = 0;
            let currentEntries: any[] = [];
            
            const buckets: Record<string, any> = {};
            trendLabels.forEach(l => buckets[l] = { gross: 0, roomRev: 0, sold: 0 });

            snap.forEach(d => {
                const data = d.data();
                const date = data.date || ""; 
                const [dY, dM, dD] = date.split('-');
                
                let label = "";
                if (trendMode === 'days') label = String(parseInt(dD));
                else if (trendMode === 'months') label = trendLabels[parseInt(dM)-1];
                else label = dY;

                const isCurrent = (viewMode === "daily" && date === selectedDate) ||
                                  (viewMode === "monthly" && dY === year && dM === month) ||
                                  (viewMode === "yearly" && dY === year);

                (data.entries || []).forEach((e: any) => {
                    const isPOS = e.guestName?.startsWith('POS Order #') || Array.isArray(e.posItems);
                    if (isPOS) return;
                    if (e.status === "VOID" || e.status === "VOIDED") return;

                    const isCancelled = e.status === "CANCELLED" || e.status === "CANCEL";

                    if (!isCancelled) {
                        const amount = Number(e.amount) || 0;
                        const isAcc = e.type === "accommodation" || (!e.type && e.guestName);

                        if (buckets[label]) {
                            buckets[label].gross += amount;
                            if (isAcc) {
                                buckets[label].roomRev += amount;
                                buckets[label].sold += 1;
                            }
                        }

                        if (isCurrent) {
                            gross += amount;
                            if (e.type === "other_income") other += amount;
                            else {
                                if (e.source === "Walk-in") walkin += amount;
                                else if (e.source === "OTA") ota += amount;
                                else other += amount;
                            }

                             const cashAmt = Number(e.payHotel || e.paidCash || e.paidAmount1 || 0);
                             const digitalAmt = Number(e.payTransfer || e.payNexura || e.paidTransfer || e.paidAmount2 || 0);
                             
                             if (cashAmt > 0 || digitalAmt > 0) {
                                 hotel += cashAmt;
                                 transferAmt += digitalAmt;
                             } else {
                                 if (e.paymentStatus === "Pay at Nexura" || e.paymentStatus === "Virtual Payment / OTA") transferAmt += amount;
                                 if (e.paymentStatus === "Pay at Hotel") hotel += amount;
                             }

                            if (isAcc) {
                                roomsSold += 1;
                                roomRevenue += amount;
                            }
                            currentEntries.push({ ...e, _docId: d.id });
                        }
                    } else {
                        if (isCurrent) {
                            currentEntries.push({ ...e, _docId: d.id });
                        }
                    }
                });
            });

            const trendData = trendLabels.map(label => {
                const b = buckets[label];
                const daysInBucket = trendMode === 'days' ? 1 : 
                                     trendMode === 'months' ? new Date(Number(year), trendLabels.indexOf(label)+1, 0).getDate() :
                                     365;
                
                const occ = (totalPhysicalRooms * daysInBucket) > 0 ? (b.sold / (totalPhysicalRooms * daysInBucket)) * 100 : 0;
                const arr = b.sold > 0 ? b.roomRev / b.sold : 0;
                const revPar = (totalPhysicalRooms * daysInBucket) > 0 ? b.roomRev / (totalPhysicalRooms * daysInBucket) : 0;

                return { label, gross: b.gross, occ, arr, revPar };
            });

            const totalPossibleRoomNights = totalPhysicalRooms * totalDaysForOcc;
            
            const forecastAccommodationGroups: Record<string, any[]> = {};
            const resolvedEntries: any[] = [];

            currentEntries.forEach((e) => {
                const isAcc = e.type === "accommodation" || (!e.type && e.guestName);
                if (isAcc) {
                    const key = e.bookingId || e.timestamp || `${e.guestName}_${e.checkInDate}_${e.checkOutDate}_${e.roomNumber}`;
                    if (!forecastAccommodationGroups[key]) {
                        forecastAccommodationGroups[key] = [];
                    }
                    forecastAccommodationGroups[key].push(e);
                } else {
                    resolvedEntries.push(e);
                }
            });

            Object.values(forecastAccommodationGroups).forEach((group) => {
                const rep = { ...group[0] };
                rep.amount = group.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                rep.payHotel = group.reduce((sum, item) => sum + (Number(item.payHotel || item.paidCash || item.paidAmount1) || 0), 0);
                 rep.payTransfer = group.reduce((sum, item) => sum + (Number(item.payTransfer || item.payNexura || item.paidTransfer || item.paidAmount2) || 0), 0);
                resolvedEntries.push(rep);
            });

// Compute ARR and RevPar based on view mode
            let finalArr = 0;
            let finalRevPar = 0;
            if (viewMode === 'monthly') {
                // Monthly bucket
                const monthIdx = Number(month) - 1;
                const monthLabel = trendLabels[monthIdx];
                const monthBucket = buckets[monthLabel] || { roomRev: 0, sold: 0 };
                finalArr = monthBucket.sold > 0 ? monthBucket.roomRev / monthBucket.sold : 0;
                const daysInMonth = totalDaysForOcc; // days in selected month
                finalRevPar = (totalPhysicalRooms * daysInMonth) > 0 ? monthBucket.roomRev / (totalPhysicalRooms * daysInMonth) : 0;
            } else if (viewMode === 'daily') {
                // Daily bucket
                const day = selectedDate.split('-')[2];
                const dayLabel = String(parseInt(day, 10));
                const dayBucket = buckets[dayLabel] || { roomRev: 0, sold: 0 };
                finalArr = dayBucket.sold > 0 ? dayBucket.roomRev / dayBucket.sold : 0;
                finalRevPar = (totalPhysicalRooms) > 0 ? dayBucket.roomRev / totalPhysicalRooms : 0;
            } else {
                // Yearly totals
                finalArr = roomsSold > 0 ? roomRevenue / roomsSold : 0;
                finalRevPar = totalPossibleRoomNights > 0 ? roomRevenue / totalPossibleRoomNights : 0;
            }

            setStats({
                totalGrossRevenue: gross,
                salesPayAtTransfer: transferAmt,
                salesPayAtHotel: hotel,
                walkInRevenue: walkin,
                otaRevenue: ota,
                otherRevenue: other,
                occ: totalPossibleRoomNights > 0 ? (roomsSold / totalPossibleRoomNights) * 100 : 0,
                arr: finalArr,
                revPar: finalRevPar,
                roomsSold,
                totalPossibleRoomNights,
                entries: resolvedEntries.sort((a, b) => (b.checkInDate || "").localeCompare(a.checkInDate || "")),
                trendData,
                loading: false,
            });
        };

        fetchData();
    }, [viewMode, selectedDate, refreshTrigger]);

    return { ...stats, refresh: () => setRefreshTrigger(prev => prev + 1) };
};
