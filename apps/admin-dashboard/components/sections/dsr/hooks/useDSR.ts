"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";
import { YearlyBudgetDocument, DSRReportResult, createDefaultBudgetMonthData } from "@/lib/budget-types";
import { computeDSRReport, TransactionEntry, PosOrder, CustomIncomeItem } from "@/lib/dsr-engine";

export const useDSR = () => {
  const { activeHotelCode, activeHotelName } = useAuth();

  const getInitialHotelCode = () => {
    if (activeHotelCode && activeHotelCode !== "0") return activeHotelCode;
    if (typeof window !== "undefined") {
      return localStorage.getItem("active_hotel_code") || "0";
    }
    return "0";
  };

  const getInitialHotelName = () => {
    if (activeHotelName) return activeHotelName;
    if (typeof window !== "undefined") {
      return localStorage.getItem("active_hotel_name") || "Bumi Anyom Hotel";
    }
    return "Bumi Anyom Hotel";
  };

  const [hotelCode, setHotelCode] = useState<string>(getInitialHotelCode);
  const [hotelName, setHotelName] = useState<string>(getInitialHotelName);
  const [hotelRoomCount, setHotelRoomCount] = useState<number>(39);

  // Default to today's date YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const [loadingBudget, setLoadingBudget] = useState<boolean>(false);
  const [loadingActuals, setLoadingActuals] = useState<boolean>(false);
  const [budgetDoc, setBudgetDoc] = useState<YearlyBudgetDocument | null>(null);

  const [transactionsCache, setTransactionsCache] = useState<{
    year: number;
    entries: TransactionEntry[];
  }>({ year: parseInt(selectedDate.slice(0, 4), 10), entries: [] });

  const [posOrdersCache, setPosOrdersCache] = useState<{
    year: number;
    orders: PosOrder[];
  }>({ year: parseInt(selectedDate.slice(0, 4), 10), orders: [] });

  const [customIncomesCache, setCustomIncomesCache] = useState<{
    year: number;
    items: CustomIncomeItem[];
  }>({ year: parseInt(selectedDate.slice(0, 4), 10), items: [] });

  const selectedYear = parseInt(selectedDate.slice(0, 4), 10);
  const selectedMonth = selectedDate.slice(5, 7);

  // Sync hotel code from useAuth / localStorage / window events
  useEffect(() => {
    if (activeHotelCode && activeHotelCode !== "0") {
      setHotelCode(activeHotelCode);
      if (activeHotelName) setHotelName(activeHotelName);
    }
  }, [activeHotelCode, activeHotelName]);

  useEffect(() => {
    const handleStorageChange = () => {
      const code = localStorage.getItem("active_hotel_code") || "0";
      const name = localStorage.getItem("active_hotel_name") || "Bumi Anyom Hotel";
      setHotelCode(code);
      setHotelName(name);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("hotelChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("hotelChanged", handleStorageChange);
    };
  }, []);

  // 1. Fetch Hotel Room Count from CPanel (hotels doc or roomTypes)
  const fetchHotelRoomCount = useCallback(async (code: string) => {
    if (!code || code === "0") return 39;
    try {
      let count = 0;
      const hotelRef = doc(db, "hotels", code);
      const hSnap = await getDoc(hotelRef);
      if (hSnap.exists()) {
        const hd = hSnap.data() as any;
        count =
          typeof hd.roomCount === "number"
            ? hd.roomCount
            : typeof hd.totalRooms === "number"
            ? hd.totalRooms
            : 0;
      }

      if (count === 0) {
        const rSnap = await getDocs(getHotelCollection(db, "roomTypes", code));
        rSnap.forEach((rd) => {
          const d = rd.data() as any;
          if (Array.isArray(d.physicalRooms) && d.physicalRooms.length > 0) {
            count += d.physicalRooms.length;
          } else if (typeof d.roomCount === "number" && d.roomCount > 0) {
            count += d.roomCount;
          } else {
            count += 1;
          }
        });
      }

      const finalCount = count > 0 ? count : 39;
      setHotelRoomCount(finalCount);
      return finalCount;
    } catch (e) {
      console.error("Error fetching hotel room count:", e);
      return 39;
    }
  }, []);

  // 2. Fetch Budget Document (1 single read per year)
  const fetchBudgetDoc = useCallback(
    async (yr: number) => {
      if (!hotelCode || hotelCode === "0") return;
      setLoadingBudget(true);
      try {
        await fetchHotelRoomCount(hotelCode);
        const budgetRef = doc(getHotelCollection(db, "budgeting", hotelCode), String(yr));
        const snap = await getDoc(budgetRef);

        if (snap.exists()) {
          setBudgetDoc(snap.data() as YearlyBudgetDocument);
        } else {
          setBudgetDoc(null);
        }
      } catch (err) {
        console.error("Error fetching budget doc:", err);
      } finally {
        setLoadingBudget(false);
      }
    },
    [hotelCode, fetchHotelRoomCount]
  );

  // 3. Fetch Actuals Data in 1 single efficient ranged query (no looping)
  const fetchActualsData = useCallback(
    async (yr: number, upToDate: string) => {
      if (!hotelCode || hotelCode === "0") return;
      setLoadingActuals(true);
      try {
        // Query from Dec of previous year to capture overlapping cross-year check-ins
        const startOfRange = `${yr - 1}-12-01`;

        const qRev = query(
          getHotelCollection(db, "daily_revenue", hotelCode),
          where("date", ">=", startOfRange),
          where("date", "<=", upToDate)
        );

        const revSnap = await getDocs(qRev);
        const allEntries: TransactionEntry[] = [];

        revSnap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const docDate = data.date || docSnap.id.replace(`${hotelCode}_`, "") || docSnap.id;
          (data.entries || []).forEach((t: any) => {
            allEntries.push({
              ...t,
              date: t.effectiveDate || docDate || t.date || t.checkInDate,
            });
          });
        });

        setTransactionsCache({ year: yr, entries: allEntries });

        // Query POS Orders (single fetch, cached in memory)
        try {
          const posSnap = await getDocs(getHotelCollection(db, "pos_orders", hotelCode));
          const posOrders: any[] = [];
          posSnap.forEach((d) => {
            const data = d.data() as any;
            const st = (data.status || "").toUpperCase();
            if (st === "VOID" || st === "VOIDED" || st === "CANCELLED" || st === "CANCEL" || data.isDeleted) return;

            let dateStr = "";
            if (data.timestamp) {
              const dt = typeof data.timestamp.toDate === "function" ? data.timestamp.toDate() : new Date(data.timestamp.seconds ? data.timestamp.seconds * 1000 : data.timestamp);
              dateStr = dt.toISOString().split("T")[0];
            } else if (data.createdAt) {
              dateStr = typeof data.createdAt === "string" ? data.createdAt.split("T")[0] : "";
            } else if (data.date) {
              dateStr = data.date;
            }

            if (dateStr >= `${yr}-01-01` && dateStr <= upToDate) {
              posOrders.push({
                id: d.id,
                ...data,
                date: dateStr,
                createdAt: data.createdAt || (dateStr ? `${dateStr}T00:00:00.000Z` : ""),
              });
            }
          });
          setPosOrdersCache({ year: yr, orders: posOrders });
        } catch {
          setPosOrdersCache({ year: yr, orders: [] });
        }

        // Query Custom Incomes & Non-Commission Revenue from global_pnl_reports (single fetch, cached in memory)
        try {
          const pnlQ = query(
            getHotelCollection(db, "global_pnl_reports", hotelCode),
            where("__name__", ">=", `${yr}-01`),
            where("__name__", "<=", `${yr}-12`)
          );
          const pnlSnap = await getDocs(pnlQ);
          const customIncomesList: CustomIncomeItem[] = [];
          pnlSnap.forEach((d) => {
            const data = d.data();
            const mDoc = d.id;
            (data.customIncomes || []).forEach((ci: any, idx: number) => {
              customIncomesList.push({
                id: ci.id || `${mDoc}-ci-${idx}`,
                name: ci.name || ci.description || "Other Income",
                amount: Number(ci.amount) || 0,
                category: ci.category || "other",
                date: ci.date || `${mDoc}-01`,
              });
            });
            (data.nonCommissionRevenue || []).forEach((ncr: any, idx: number) => {
              customIncomesList.push({
                id: ncr.id || `${mDoc}-ncr-${idx}`,
                name: ncr.name || ncr.description || "Non-Commission Revenue",
                amount: Number(ncr.amount) || 0,
                category: "other",
                date: ncr.date || `${mDoc}-01`,
              });
            });
          });
          setCustomIncomesCache({ year: yr, items: customIncomesList });
        } catch {
          setCustomIncomesCache({ year: yr, items: [] });
        }
      } catch (err) {
        console.error("Error fetching actuals data:", err);
      } finally {
        setLoadingActuals(false);
      }
    },
    [hotelCode]
  );

  useEffect(() => {
    fetchBudgetDoc(selectedYear);
  }, [selectedYear, fetchBudgetDoc]);

  useEffect(() => {
    fetchActualsData(selectedYear, selectedDate);
  }, [selectedYear, selectedDate, fetchActualsData]);

  // Compute DSR in memory with zero extra queries
  const dsrReport: DSRReportResult = useMemo(() => {
    const startOfMonth = `${selectedYear}-${selectedMonth}-01`;

    const todayPos = posOrdersCache.orders.filter((o) => {
      const d = o.date || (o.createdAt || "").slice(0, 10);
      return d === selectedDate;
    });
    const mtdPos = posOrdersCache.orders.filter((o) => {
      const d = o.date || (o.createdAt || "").slice(0, 10);
      return d >= startOfMonth && d <= selectedDate;
    });
    const ytdPos = posOrdersCache.orders;

    return computeDSRReport({
      date: selectedDate,
      hotelCode,
      hotelName,
      totalPropertyRooms: hotelRoomCount,
      budgetDoc,
      allTransactions: transactionsCache.entries,
      todayPosOrders: todayPos,
      mtdPosOrders: mtdPos,
      ytdPosOrders: ytdPos,
      customIncomes: customIncomesCache.items,
    });
  }, [
    selectedDate,
    selectedYear,
    selectedMonth,
    hotelCode,
    hotelName,
    hotelRoomCount,
    budgetDoc,
    transactionsCache,
    posOrdersCache,
    customIncomesCache,
  ]);

  return {
    selectedDate,
    setSelectedDate,
    selectedYear,
    selectedMonth,
    hotelCode,
    hotelName,
    hotelRoomCount,
    loadingBudget,
    loadingActuals,
    budgetDoc,
    dsrReport,
    refetchActuals: () => fetchActualsData(selectedYear, selectedDate),
  };
};
