import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { getHotelCollection } from "@/lib/firestoreHelper";
import { ExtendedTransaction } from "@/lib/pnl-logic";
import { TrendDataItem, MultiYearTrendDataItem } from "../types";

export const YEARS = [2024, 2025, 2026];
export const MONTHS = [
    { n: "January", v: "01" }, { n: "February", v: "02" }, { n: "March", v: "03" },
    { n: "April", v: "04" }, { n: "May", v: "05" }, { n: "June", v: "06" },
    { n: "July", v: "07" }, { n: "August", v: "08" }, { n: "September", v: "09" },
    { n: "October", v: "10" }, { n: "November", v: "11" }, { n: "December", v: "12" }
];

// In-memory cache for all-time trend data across years to prevent querying 1,100+ documents on every month toggle
interface TrendCacheItem {
    timestamp: number;
    currentYear: string;
    monthlyBuckets: number[];
    yearlyBuckets: Record<number, number>;
}
const globalTrendCache: Record<string, TrendCacheItem> = {};
const TREND_CACHE_TTL = 60 * 60 * 1000; // 60 minutes cache

const getStoredTrendCache = (key: string): TrendCacheItem | null => {
    if (globalTrendCache[key] && (Date.now() - globalTrendCache[key].timestamp < TREND_CACHE_TTL)) {
        return globalTrendCache[key];
    }
    if (typeof window !== "undefined") {
        try {
            const raw = sessionStorage.getItem(`trend_fo_${key}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.timestamp < TREND_CACHE_TTL) {
                    globalTrendCache[key] = parsed;
                    return parsed;
                }
            }
        } catch (e) {}
    }
    return null;
};

const setStoredTrendCache = (key: string, item: TrendCacheItem) => {
    globalTrendCache[key] = item;
    if (typeof window !== "undefined") {
        try {
            sessionStorage.setItem(`trend_fo_${key}`, JSON.stringify(item));
        } catch (e) {}
    }
};

// In-memory cache for period transactions (daily_revenue)
interface PeriodFOCacheItem {
    timestamp: number;
    transactions: ExtendedTransaction[];
}
const globalPeriodFOCache: Record<string, PeriodFOCacheItem> = {};
const PERIOD_FO_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const useFrontOfficeData = (month: string, viewMode: "monthly" | "yearly") => {
    const [loadingFO, setLoadingFO] = useState(false);
    const [rawTransactions, setRawTransactions] = useState<ExtendedTransaction[]>([]);
    const [yearTrendData, setYearTrendData] = useState<TrendDataItem[]>([]);
    const [multiYearTrendData, setMultiYearTrendData] = useState<MultiYearTrendDataItem[]>([]);

    const fetchFOData = async () => {
        setLoadingFO(true);
        try {
            const [y, m] = month.split('-');
            let startStr, endStr;
            
            if (viewMode === "monthly") {
                startStr = `${y}-${m}-01`;
                const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
                endStr = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
            } else {
                startStr = `${y}-01-01`;
                endStr = `${y}-12-31`;
            }

            const hotelCode = typeof window !== "undefined" ? localStorage.getItem("active_hotel_code") || "default" : "default";
            const periodKey = `${hotelCode}_${viewMode}_${startStr}_${endStr}`;
            const cachedPeriod = globalPeriodFOCache[periodKey];
            const now = Date.now();

            let transactions: ExtendedTransaction[] = [];
            if (cachedPeriod && now - cachedPeriod.timestamp < PERIOD_FO_CACHE_TTL) {
                transactions = [...cachedPeriod.transactions];
                setRawTransactions(transactions);
            } else {
                // Fetch transactions for the current period
                const q = query(getHotelCollection(db, "daily_revenue"), where("date", ">=", startStr), where("date", "<=", endStr));
                const querySnapshot = await getDocs(q);

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const hotelId = data.hotelId || "";
                
                // Group & Deduplicate entries for this specific day document
                const dayAccommodationGroups: Record<string, any[]> = {};
                const dayNonAccEntries: any[] = [];

                (data.entries || []).forEach((t: any) => {
                    const isPOS = t.guestName?.startsWith('POS Order') || Array.isArray(t.posItems) || (t.revenueType && t.revenueType !== 'breakfast');
                    if (isPOS) return;

                    const status = (t.status || "").toUpperCase();
                    const payStatus = (t.paymentStatus || "").toUpperCase();
                    const isIgnored = t.isDeleted || t.isHidden ||
                        status === "VOID" || status === "VOIDED" || status === "CANCEL" || status === "CANCELLED" || status === "NO-SHOW" ||
                        payStatus === "VOID" || payStatus === "VOIDED" || payStatus === "CANCEL" || payStatus === "CANCELLED";
                    if (isIgnored) return;

                    const isPelunasan = t.isPelunasan || t.type === "pelunasan_ar" || t.type === "pelunasan_reversal" || 
                        t.guestName?.startsWith("Koreksi Tanggal Pelunasan") || t.guestName?.startsWith("Pelunasan Piutang");
                    if (isPelunasan) return;

                    const isAcc = t.type === "accommodation" || (!t.type && t.guestName && !t.revenueType);
                    if (isAcc) {
                        const normGuestName = (t.guestName || "").trim().toLowerCase();
                        const roomIdent = String(t.roomNumber || t.roomTypeId || t.roomType || '').trim();
                        const cIn = t.checkInDate || t.checkIn || '';
                        const cOut = t.checkOutDate || t.checkOut || '';
                        const bId = t.bookingId ? `b_${t.bookingId}` : '';
                        const rIdx = t.roomIndex !== undefined ? `_rIdx_${t.roomIndex}` : '';
                        const key = (normGuestName && cIn) 
                            ? `${normGuestName}_${roomIdent}_${cIn}_${cOut}_${bId}${rIdx}_${t.id || ''}` 
                            : (bId ? `${bId}${rIdx}` : `t_${t.timestamp}`);
                        if (!dayAccommodationGroups[key]) {
                            dayAccommodationGroups[key] = [];
                        }
                        dayAccommodationGroups[key].push(t);
                    } else {
                        dayNonAccEntries.push(t);
                    }
                });

                const cleanDayEntries: any[] = [];
                Object.values(dayAccommodationGroups).forEach(group => {
                    group.sort((a, b) => {
                        const tA = new Date(a.timestamp || 0).getTime();
                        const tB = new Date(b.timestamp || 0).getTime();
                        return tA - tB;
                    });
                    cleanDayEntries.push(group[group.length - 1]);
                });
                cleanDayEntries.push(...dayNonAccEntries);

                cleanDayEntries.forEach((t: any) => {
                    transactions.push({
                        ...t,
                        // Resolve date: prefer t.date → effectiveDate → checkInDate → document-level date
                        date: t.date || t.effectiveDate || t.checkInDate || t.checkIn || data.date || '',
                        propertyId: hotelId,
                        amount: Number(t.amount) || 0,
                        paidCash: Number(t.payHotel ?? t.paidCash ?? t.paidAmount1 ?? 0),
                        paidTransfer: Number(t.payTransfer ?? t.paidTransfer ?? t.payNexura ?? t.paidAmount2 ?? 0)
                    });
                });
            });

            globalPeriodFOCache[periodKey] = {
                timestamp: Date.now(),
                transactions
            };
            setRawTransactions(transactions);
        }

            // Fetch transactions for Trend Data (using cache if fresh)
            const currentYear = month.split('-')[0];
            const cacheKey = `${hotelCode}_${currentYear}`;
            const cached = getStoredTrendCache(cacheKey);

            let monthlyBuckets = Array(12).fill(0);
            let yearlyBuckets: Record<number, number> = {};
            YEARS.forEach(yr => yearlyBuckets[yr] = 0);

            if (cached) {
                monthlyBuckets = [...cached.monthlyBuckets];
                yearlyBuckets = { ...cached.yearlyBuckets };
            } else if (viewMode === "yearly" && y === currentYear && transactions.length > 0) {
                // Reuse current year transactions already queried above to save Firestore reads!
                transactions.forEach((t: any) => {
                    const d = t.date || "";
                    const [, moStr] = d.split('-');
                    const moIdx = parseInt(moStr) - 1;
                    const amt = Number(t.amount) || 0;
                    if (moIdx >= 0 && moIdx < 12) {
                        monthlyBuckets[moIdx] += amt;
                    }
                    const numYr = Number(currentYear);
                    if (yearlyBuckets[numYr] !== undefined) {
                        yearlyBuckets[numYr] += amt;
                    }
                });
                setStoredTrendCache(cacheKey, {
                    timestamp: Date.now(),
                    currentYear,
                    monthlyBuckets: [...monthlyBuckets],
                    yearlyBuckets: { ...yearlyBuckets }
                });
            } else {
                // Query ONLY the current year to prevent reading 1,000+ documents across all 3 years
                const allRevenueQ = query(
                    getHotelCollection(db, "daily_revenue", hotelCode),
                    where("date", ">=", `${currentYear}-01-01`),
                    where("date", "<=", `${currentYear}-12-31`)
                );
                const allRevenueSnap = await getDocs(allRevenueQ);

                allRevenueSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    const d = data.date || "";
                    const [yrStr, moStr] = d.split('-');
                    const yr = parseInt(yrStr);
                    const moIdx = parseInt(moStr) - 1;

                    const dayAccommodationGroups: Record<string, any[]> = {};
                    const dayNonAccEntries: any[] = [];

                    (data.entries || []).forEach((t: any) => {
                        const isPOS = t.guestName?.startsWith('POS Order') || Array.isArray(t.posItems) || (t.revenueType && t.revenueType !== 'breakfast');
                        if (isPOS) return;

                        const status = (t.status || "").toUpperCase();
                        const payStatus = (t.paymentStatus || "").toUpperCase();
                        const isIgnored = t.isDeleted || t.isHidden ||
                            status === "VOID" || status === "VOIDED" || status === "CANCEL" || status === "CANCELLED" || status === "NO-SHOW" ||
                            payStatus === "VOID" || payStatus === "VOIDED" || payStatus === "CANCEL" || payStatus === "CANCELLED";
                        if (isIgnored) return;

                        const isPelunasan = t.isPelunasan || t.type === "pelunasan_ar" || t.type === "pelunasan_reversal" || 
                            t.guestName?.startsWith("Koreksi Tanggal Pelunasan") || t.guestName?.startsWith("Pelunasan Piutang");
                        if (isPelunasan) return;

                        const isAcc = t.type === "accommodation" || (!t.type && t.guestName && !t.revenueType);
                        if (isAcc) {
                            const normGuestName = (t.guestName || "").trim().toLowerCase();
                            const roomIdent = String(t.roomNumber || t.roomTypeId || t.roomType || '').trim();
                            const cIn = t.checkInDate || t.checkIn || '';
                            const cOut = t.checkOutDate || t.checkOut || '';
                            const bId = t.bookingId ? `b_${t.bookingId}` : '';
                            const rIdx = t.roomIndex !== undefined ? `_rIdx_${t.roomIndex}` : '';
                            const key = (normGuestName && cIn) 
                                ? `${normGuestName}_${roomIdent}_${cIn}_${cOut}_${bId}${rIdx}_${t.id || ''}` 
                                : (bId ? `${bId}${rIdx}` : `t_${t.timestamp}`);
                            if (!dayAccommodationGroups[key]) {
                                dayAccommodationGroups[key] = [];
                            }
                            dayAccommodationGroups[key].push(t);
                        } else {
                            dayNonAccEntries.push(t);
                        }
                    });

                    const cleanEntries: any[] = [];
                    Object.values(dayAccommodationGroups).forEach(group => {
                        group.sort((a, b) => {
                            const tA = new Date(a.timestamp || 0).getTime();
                            const tB = new Date(b.timestamp || 0).getTime();
                            return tA - tB;
                        });
                        cleanEntries.push(group[group.length - 1]);
                    });
                    cleanEntries.push(...dayNonAccEntries);

                    cleanEntries.forEach((t: any) => {
                        const amt = (Number(t.amount) || 0);
                        if (yearlyBuckets[yr] !== undefined) {
                            yearlyBuckets[yr] += amt;
                        }
                        if (yrStr === currentYear && moIdx >= 0 && moIdx < 12) {
                            monthlyBuckets[moIdx] += amt;
                        }
                    });
                });

                setStoredTrendCache(cacheKey, {
                    timestamp: Date.now(),
                    currentYear,
                    monthlyBuckets: [...monthlyBuckets],
                    yearlyBuckets: { ...yearlyBuckets }
                });
            }
            
        setYearTrendData(monthlyBuckets.map((rev, i) => ({
                month: MONTHS[i].n.slice(0, 3),
                revenue: rev,
                fullMonth: MONTHS[i].v
            })));
            setMultiYearTrendData(YEARS.map(yr => ({
                year: yr.toString(),
                revenue: yearlyBuckets[yr]
            })));
            
        } catch (error) {
            console.error("Error fetching Front Office data:", error);
        } finally {
            setLoadingFO(false);
        }
    };

    useEffect(() => {
        fetchFOData();
    }, [month, viewMode]);

    return {
        loadingFO,
        rawTransactions,
        yearTrendData,
        multiYearTrendData,
        refetchFOData: fetchFOData
    };
};
