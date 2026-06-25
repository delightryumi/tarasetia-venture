import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { getHotelCollection } from "@/lib/firestoreHelper";
import { ExtendedTransaction } from "@/lib/pnl-logic";
import { TrendDataItem, MultiYearTrendDataItem } from "../types";

export const YEARS = [2024, 2025, 2026];
export const MONTHS = [
    { n: "Januari", v: "01" }, { n: "Februari", v: "02" }, { n: "Maret", v: "03" },
    { n: "April", v: "04" }, { n: "Mei", v: "05" }, { n: "Juni", v: "06" },
    { n: "Juli", v: "07" }, { n: "Agustus", v: "08" }, { n: "September", v: "09" },
    { n: "Oktober", v: "10" }, { n: "November", v: "11" }, { n: "Desember", v: "12" }
];

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

            // Fetch transactions for the current period
            const q = query(getHotelCollection(db, "daily_revenue"), where("date", ">=", startStr), where("date", "<=", endStr));
            const querySnapshot = await getDocs(q);
            const transactions: ExtendedTransaction[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const hotelId = data.hotelId || "";
                (data.entries || []).forEach((t: any) => {
                    // Skip cancelled or voided transactions
                    const status = (t.status || "").toUpperCase();
                    const payStatus = (t.paymentStatus || "").toUpperCase();
                    const isIgnored = t.isDeleted || 
                        status === "VOID" || status === "VOIDED" || status === "CANCEL" || status === "CANCELLED" || status === "NO-SHOW" ||
                        payStatus === "VOID" || payStatus === "VOIDED" || payStatus === "CANCEL" || payStatus === "CANCELLED";
                    if (isIgnored) {
                        return; // ignore this entry
                    }
                    transactions.push({
                        ...t,
                        propertyId: hotelId,
                        amount: Number(t.amount) || 0,
                        paidCash: Number(t.paidCash || t.paidAmount1) || 0,
                        paidTransfer: Number(t.paidTransfer || t.paidAmount2) || 0
                    });
                });
            });
            setRawTransactions(transactions);

            // Fetch all-time transactions for Trend Data
            const currentYear = month.split('-')[0];
            const monthlyBuckets = Array(12).fill(0);
            const yearlyBuckets: Record<number, number> = {};
            YEARS.forEach(yr => yearlyBuckets[yr] = 0);

            const allRevenueQ = query(getHotelCollection(db, "daily_revenue"));
            const allRevenueSnap = await getDocs(allRevenueQ);
            
            allRevenueSnap.forEach(doc => {
                const data = doc.data();
                const d = data.date || "";
                const [yrStr, moStr] = d.split('-');
                const yr = parseInt(yrStr);
                const moIdx = parseInt(moStr) - 1;

                if (yearlyBuckets[yr] !== undefined) {
                    (data.entries || []).forEach((t: any) => {
                        const status = (t.status || "").toUpperCase();
                        const payStatus = (t.paymentStatus || "").toUpperCase();
                        const isIgnored = t.isDeleted || 
                            status === "VOID" || status === "VOIDED" || status === "CANCEL" || status === "CANCELLED" || status === "NO-SHOW" ||
                            payStatus === "VOID" || payStatus === "VOIDED" || payStatus === "CANCEL" || payStatus === "CANCELLED";
                        if (isIgnored) return;

                        const amt = (Number(t.amount) || 0);
                        yearlyBuckets[yr] += amt;
                        if (yrStr === currentYear && moIdx >= 0 && moIdx < 12) {
                            monthlyBuckets[moIdx] += amt;
                        }
                    });
                }
            });
            
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
