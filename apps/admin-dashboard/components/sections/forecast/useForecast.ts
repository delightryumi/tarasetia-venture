import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { onSnapshot, getDocs, query, where } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface ForecastStats {
    totalGrossRevenue: number;
    totalRoomRevenue: number;
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
        totalRoomRevenue: 0,
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

        const hotelId = localStorage.getItem("active_hotel_code") || "";
        if (!hotelId || hotelId === "0") {
            setStats(prev => ({ ...prev, loading: false }));
            return;
        }
        
        const fetchData = async () => {
            const totalPhysicalRooms = await fetchRooms();
            const [year, month, day] = selectedDate.split("-");
            
            let startStr: string, endStr: string, totalDaysForOcc: number;
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

            // Expand query window by 35 days before startStr to catch multi-night stays originating in prior month
            const [sY, sM, sD] = startStr.split('-').map(Number);
            const queryStartDate = new Date(sY, (sM || 1) - 1, sD || 1);
            queryStartDate.setDate(queryStartDate.getDate() - 35);
            const queryStartStr = `${queryStartDate.getFullYear()}-${String(queryStartDate.getMonth() + 1).padStart(2, '0')}-${String(queryStartDate.getDate()).padStart(2, '0')}`;

            const q = query(
                getHotelCollection(db, "daily_revenue", hotelId), 
                where("date", ">=", queryStartStr), 
                where("date", "<=", endStr)
            );

            const unsubscribe = onSnapshot(q, (snap) => {
                let gross = 0, walkin = 0, ota = 0, other = 0, transferAmt = 0, hotel = 0, roomsSold = 0, roomRevenue = 0;
                
                const buckets: Record<string, { gross: number; roomRev: number; sold: number }> = {};
                trendLabels.forEach(l => buckets[l] = { gross: 0, roomRev: 0, sold: 0 });

                const rawAccommodationGroups: Record<string, any[]> = {};
                const nonAccEntries: any[] = [];

                snap.forEach(d => {
                    const data = d.data();
                    const docDate = data.date || d.id.replace(`${hotelId}_`, "") || d.id;

                    (data.entries || []).forEach((e: any) => {
                        const isPOS = e.guestName?.startsWith('POS Order #') || Array.isArray(e.posItems) || !!e.revenueType;
                        if (isPOS) return;
                        
                        const st = String(e.status || "").toUpperCase();
                        const pst = String(e.paymentStatus || "").toUpperCase();
                        const gst = String(e.guestStatus || "").toLowerCase();
                        if (st === "VOID" || st === "VOIDED" || pst === "VOID" || pst === "VOIDED" || gst === "void" || e.isDeleted === true || e.isVoid === true) return;

                        const isPelunasan = e.isHidden || e.isPelunasan || e.type === "pelunasan_ar" || e.type === "pelunasan_reversal" || e.guestName?.startsWith("Koreksi Tanggal Pelunasan") || e.guestName?.startsWith("Pelunasan Piutang");
                        if (isPelunasan) return;

                        const isAcc = e.type === "accommodation" || (!e.type && e.guestName);
                        if (isAcc) {
                            const normGuestName = (e.guestName || "").trim().toLowerCase();
                            const roomIdent = String(e.roomNumber || e.roomTypeId || e.roomType || '').trim();
                            const cIn = e.checkInDate || e.checkIn || docDate || '';
                            const cOut = e.checkOutDate || e.checkOut || '';
                            const key = (normGuestName && cIn) 
                                ? `${normGuestName}_${roomIdent}_${cIn}_${cOut}` 
                                : (e.bookingId ? `b_${e.bookingId}` : `t_${e.timestamp}`);
                            if (!rawAccommodationGroups[key]) {
                                rawAccommodationGroups[key] = [];
                            }
                            rawAccommodationGroups[key].push({ ...e, _docDate: docDate });
                        } else {
                            nonAccEntries.push({ ...e, _docDate: docDate });
                        }
                    });
                });

                const currentAccommodationEntries: any[] = [];

                // 1. Process Accommodation Bookings and distribute revenue per night
                Object.values(rawAccommodationGroups).forEach(group => {
                    const isCancelled = group.some(e => {
                        const st = String(e.status || "").toUpperCase();
                        const pst = String(e.paymentStatus || "").toUpperCase();
                        const gst = String(e.guestStatus || "").toLowerCase();
                        return st === "CANCELLED" || st === "CANCEL" || pst === "CANCELLED" || pst === "CANCEL" || gst === "cancelled" || gst === "cancel";
                    });

                    // Sort to pick latest metadata
                    group.sort((a, b) => {
                        const tA = new Date(a.timestamp || 0).getTime();
                        const tB = new Date(b.timestamp || 0).getTime();
                        return tA - tB;
                    });
                    const rep = { ...group[group.length - 1] };
                    if (isCancelled) {
                        rep.status = "CANCELLED";
                        rep.paymentStatus = "CANCELLED";
                    }

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

                    // Build all stay dates for this booking
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

                    // Calculate true total stay revenue
                    const dateMap: Record<string, any> = {};
                    group.forEach(item => {
                        const dKey = item._docDate || item.effectiveDate || item.checkInDate || 'default';
                        dateMap[dKey] = item;
                    });
                    const distinctEntries = Object.values(dateMap);

                    let trueTotalAmount = Number(rep.totalAmount) || 0;
                    if (trueTotalAmount <= 0) {
                        if (distinctEntries.length === totalStayNights) {
                            trueTotalAmount = distinctEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                        } else {
                            trueTotalAmount = Math.max(...distinctEntries.map(item => Number(item.amount) || 0), 0);
                        }
                    }
                    if (trueTotalAmount <= 0) {
                        trueTotalAmount = distinctEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                    }

                    const nightlyRate = totalStayNights > 0 ? Math.round(trueTotalAmount / totalStayNights) : trueTotalAmount;

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

                    const nightlyPayHotel = totalStayNights > 0 ? Math.round(stayPayHotel / totalStayNights) : stayPayHotel;
                    const nightlyPayTransfer = totalStayNights > 0 ? Math.round(stayPayTransfer / totalStayNights) : stayPayTransfer;

                    // Distribute across each stay night date
                    stayNightDates.forEach((nightDate, nIdx) => {
                        const [nY, nM, nD] = nightDate.split('-');

                        const exactEntry = dateMap[nightDate];
                        const specificNightRate = (exactEntry && Number(exactEntry.amount) > 0)
                            ? Number(exactEntry.amount)
                            : (Array.isArray(rep.nightRates) && rep.nightRates[nIdx] !== undefined && Number(rep.nightRates[nIdx]) > 0
                                ? Number(rep.nightRates[nIdx])
                                : nightlyRate);

                        // 1. Fill Trend Buckets
                        if (nightDate >= startStr && nightDate <= endStr) {
                            let bLabel = "";
                            if (trendMode === 'days') bLabel = String(parseInt(nD));
                            else if (trendMode === 'months') bLabel = trendLabels[parseInt(nM)-1];
                            else bLabel = nY;

                            if (buckets[bLabel] && !isCancelled) {
                                buckets[bLabel].gross += specificNightRate;
                                buckets[bLabel].roomRev += specificNightRate;
                                buckets[bLabel].sold += 1;
                            }
                        }

                        // 2. Check if this night belongs to currently selected view
                        const isCurrentNight = (viewMode === "daily" && nightDate === selectedDate) ||
                                              (viewMode === "monthly" && nY === year && nM === month) ||
                                              (viewMode === "yearly" && nY === year);

                        if (isCurrentNight) {
                            if (!isCancelled) {
                                gross += specificNightRate;
                                roomRevenue += specificNightRate;
                                roomsSold += 1;
                                hotel += nightlyPayHotel;
                                transferAmt += nightlyPayTransfer;

                                if (rep.source === "Walk-in" || rep.channel === "Walk-in" || rep.channel === "WALKIN") {
                                    walkin += specificNightRate;
                                } else if (rep.source === "OTA" || (rep.channel && rep.channel !== "Walk-in" && rep.channel !== "WALKIN" && rep.channel !== "Direct")) {
                                    ota += specificNightRate;
                                } else {
                                    other += specificNightRate;
                                }
                            }

                            currentAccommodationEntries.push({
                                ...rep,
                                effectiveDate: nightDate,
                                date: nightDate,
                                amount: specificNightRate,
                                ratePerNight: specificNightRate,
                                totalAmount: trueTotalAmount,
                                nightlyRate: nightlyRate,
                                payHotel: nightlyPayHotel,
                                payTransfer: nightlyPayTransfer,
                                totalStayNights: totalStayNights
                            });
                        }
                    });
                });

                // 2. Process Non-Accommodation entries (Other Income)
                const currentNonAccEntries: any[] = [];
                nonAccEntries.forEach((e: any) => {
                    const st = String(e.status || "").toUpperCase();
                    const isCancelled = st === "CANCELLED" || st === "CANCEL" || e.paymentStatus === "CANCELLED" || e.paymentStatus === "CANCEL";
                    const entryDate = e.effectiveDate || e.date || e.checkInDate || e._docDate || "";
                    const [eY, eM, eD] = entryDate.split('-');

                    const amount = Number(e.amount) || 0;

                    // Fill trend bucket
                    if (entryDate >= startStr && entryDate <= endStr) {
                        let bLabel = "";
                        if (trendMode === 'days') bLabel = String(parseInt(eD));
                        else if (trendMode === 'months') bLabel = trendLabels[parseInt(eM)-1];
                        else bLabel = eY;

                        if (buckets[bLabel] && !isCancelled) {
                            buckets[bLabel].gross += amount;
                        }
                    }

                    const isCurrent = (viewMode === "daily" && entryDate === selectedDate) ||
                                      (viewMode === "monthly" && eY === year && eM === month) ||
                                      (viewMode === "yearly" && eY === year);

                    if (isCurrent) {
                        if (!isCancelled) {
                            gross += amount;
                            other += amount;
                            const cashAmt = Number(e.payHotel || e.paidCash || e.paidAmount1 || 0);
                            const digitalAmt = Number(e.payTransfer || e.payNexura || e.paidTransfer || e.paidAmount2 || 0);
                            if (cashAmt > 0 || digitalAmt > 0) {
                                hotel += cashAmt;
                                transferAmt += digitalAmt;
                            } else {
                                if (e.paymentStatus === "Pay at Hotel") hotel += amount;
                                else transferAmt += amount;
                            }
                        }
                        currentNonAccEntries.push(e);
                    }
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

                // Group entries for drawer/ledger list
                let resolvedEntries: any[] = [];
                if (viewMode === 'daily') {
                    // In daily view, every occupied room on this day appears as 1 clear ledger line
                    resolvedEntries = [...currentAccommodationEntries, ...currentNonAccEntries];
                } else {
                    // In monthly / yearly view, aggregate multiple nights of same booking into 1 clean summary line
                    const bookingMap: Record<string, any> = {};
                    currentAccommodationEntries.forEach((item) => {
                        const key = item.bookingId || `${item.guestName}_${item.checkInDate}`;
                        if (!bookingMap[key]) {
                            bookingMap[key] = {
                                ...item,
                                amount: 0,
                                payHotel: 0,
                                payTransfer: 0,
                                nightsInPeriod: 0
                            };
                        }
                        bookingMap[key].amount += Number(item.amount) || 0;
                        bookingMap[key].payHotel += Number(item.payHotel) || 0;
                        bookingMap[key].payTransfer += Number(item.payTransfer) || 0;
                        bookingMap[key].nightsInPeriod += 1;
                    });
                    resolvedEntries = [...Object.values(bookingMap), ...currentNonAccEntries];
                }

                // If in daily view, roomsSold is exact count of occupied accommodation rooms
                let finalRoomsSold = roomsSold;
                if (viewMode === 'daily') {
                    finalRoomsSold = currentAccommodationEntries.filter(e => {
                        const isCancelled = e.status === "CANCELLED" || e.status === "CANCEL" || e.paymentStatus === "CANCELLED" || e.paymentStatus === "CANCEL";
                        return !isCancelled;
                    }).length;
                }

                // Compute ARR and RevPar strictly based on Room Revenue (Accommodation)
                let finalArr = 0;
                let finalRevPar = 0;
                let finalTotalRoomRevenue = 0;

                if (viewMode === 'monthly') {
                    const monthIdx = Number(month) - 1;
                    const monthLabel = trendLabels[monthIdx];
                    const monthBucket = buckets[monthLabel] || { roomRev: 0, sold: 0 };
                    finalTotalRoomRevenue = monthBucket.roomRev || 0;
                    finalArr = monthBucket.sold > 0 ? monthBucket.roomRev / monthBucket.sold : 0;
                    const daysInMonth = totalDaysForOcc;
                    finalRevPar = (totalPhysicalRooms * daysInMonth) > 0 ? monthBucket.roomRev / (totalPhysicalRooms * daysInMonth) : 0;
                } else if (viewMode === 'daily') {
                    finalTotalRoomRevenue = roomRevenue;
                    finalArr = finalRoomsSold > 0 ? roomRevenue / finalRoomsSold : 0;
                    finalRevPar = (totalPhysicalRooms) > 0 ? roomRevenue / totalPhysicalRooms : 0;
                } else {
                    finalTotalRoomRevenue = roomRevenue;
                    finalArr = roomsSold > 0 ? roomRevenue / roomsSold : 0;
                    finalRevPar = totalPossibleRoomNights > 0 ? roomRevenue / totalPossibleRoomNights : 0;
                }

                const computedOcc = totalPossibleRoomNights > 0 ? (finalRoomsSold / totalPossibleRoomNights) * 100 : 0;

                setStats({
                    totalGrossRevenue: gross,
                    totalRoomRevenue: finalTotalRoomRevenue,
                    salesPayAtTransfer: transferAmt,
                    salesPayAtHotel: hotel,
                    walkInRevenue: walkin,
                    otaRevenue: ota,
                    otherRevenue: other,
                    occ: computedOcc,
                    arr: finalArr,
                    revPar: finalRevPar,
                    roomsSold: finalRoomsSold,
                    totalPossibleRoomNights,
                    entries: resolvedEntries.sort((a, b) => (b.checkInDate || "").localeCompare(a.checkInDate || "")),
                    trendData,
                    loading: false,
                });
            }, (error) => {
                console.error("useForecast onSnapshot error:", error);
                setStats(prev => ({ ...prev, loading: false }));
            });

            return unsubscribe;
        };

        let unsub: any;
        fetchData().then(fn => { unsub = fn; });
        return () => { if (unsub) unsub(); };
    }, [viewMode, selectedDate, refreshTrigger]);

    return { ...stats, refresh: () => setRefreshTrigger(prev => prev + 1) };
};
