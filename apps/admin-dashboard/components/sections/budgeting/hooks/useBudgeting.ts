import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc, setDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";
import {
  YearlyBudgetDocument,
  BudgetAuditLog,
  BudgetMonthData,
  createDefaultBudgetMonthData,
  createDefaultManningPlan,
  createDefaultFeesPlan,
  recalculateBudgetMonthData,
  DSRReportResult,
} from "@/lib/budget-types";
import { computeDSRReport } from "@/lib/dsr-engine";

export const useBudgeting = () => {
  const { user, activeHotelCode, activeHotelName } = useAuth();

  // Current Date default to today
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [activeTab, setActiveTab] = useState<"dsr" | "budget_input">("dsr");

  const [yearStr, monthStr] = selectedDate.split("-");
  const selectedYear = parseInt(yearStr, 10);
  const selectedMonth = monthStr;

  // Selected hotel code resolution
  const hotelCode = useMemo(() => {
    let code = activeHotelCode;
    if (!code && typeof window !== "undefined") {
      code = localStorage.getItem("active_hotel_code") || "";
    }
    return code || "default";
  }, [activeHotelCode]);

  const hotelName = activeHotelName || "BUMI ANYOM RESORT";

  // Data states
  const [hotelRoomCount, setHotelRoomCount] = useState<number>(8);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [loadingActuals, setLoadingActuals] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cached Budget Doc per Year
  const [budgetDoc, setBudgetDoc] = useState<YearlyBudgetDocument | null>(null);

  // Transactions fetched once for the active year up to selectedDate
  const [transactionsCache, setTransactionsCache] = useState<{
    year: number;
    entries: any[];
  }>({ year: selectedYear, entries: [] });

  const [posOrdersCache, setPosOrdersCache] = useState<{
    year: number;
    orders: any[];
  }>({ year: selectedYear, orders: [] });

  const [customIncomesCache, setCustomIncomesCache] = useState<{
    year: number;
    items: any[];
  }>({ year: selectedYear, items: [] });

  const [ratePlans, setRatePlans] = useState<any[]>([]);
  const [hotelBreakfastRate, setHotelBreakfastRate] = useState<number | undefined>(undefined);

  // 1. Fetch Hotel Room Count from CPanel (hotels doc or roomTypes)
  const fetchHotelRoomCount = useCallback(async (code: string) => {
    if (!code) return 8;
    try {
      let count = 0;
      // Check hotels master doc
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
        const bRate = Number(hd.settings?.breakfastRate || hd.settings?.defaultBreakfastRate || hd.breakfastRate);
        if (bRate > 0) {
          setHotelBreakfastRate(bRate);
        }
      }

      // Fetch Channel Manager rate plans for this hotel
      try {
        const rpSnap = await getDocs(getHotelCollection(db, "ratePlans", code));
        const rps: any[] = [];
        rpSnap.forEach((d) => rps.push({ id: d.id, ...d.data() }));
        setRatePlans(rps);
      } catch (err) {
        console.warn("Could not fetch ratePlans in useBudgeting:", err);
      }

      // If 0, check roomTypes
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

      const finalCount = count > 0 ? count : 8;
      setHotelRoomCount(finalCount);
      return finalCount;
    } catch (e) {
      console.error("Error fetching hotel room count:", e);
      return 8;
    }
  }, []);

  // 2. Fetch Budget Document (1 single read per year)
  const fetchBudgetDoc = useCallback(
    async (yr: number) => {
      if (!hotelCode) return;
      setLoadingBudget(true);
      try {
        const roomCount = await fetchHotelRoomCount(hotelCode);
        const budgetRef = doc(getHotelCollection(db, "budgeting", hotelCode), String(yr));
        const snap = await getDoc(budgetRef);

        if (snap.exists()) {
          const data = snap.data() as YearlyBudgetDocument;

          // Auto-fill roomsAvailable from CPanel if empty or 0
          for (let m = 1; m <= 12; m++) {
            const k = String(m).padStart(2, "0");
            const daysInM = new Date(yr, m, 0).getDate();
            const expectedAvail = roomCount * daysInM;

            if (!data.months[k]) {
              data.months[k] = createDefaultBudgetMonthData();
            }

            if (!data.months[k].statistic.roomsAvailable || data.months[k].statistic.roomsAvailable === 0) {
              data.months[k].statistic.roomsAvailable = expectedAvail;
              if (data.months[k].statistic.occupancyPercent > 0) {
                data.months[k].statistic.occupiedRoomsPaid = Math.round(
                  (expectedAvail * data.months[k].statistic.occupancyPercent) / 100
                );
              }
            }

            recalculateBudgetMonthData(data.months[k]);
          }

          if (!data.manning) {
            data.manning = createDefaultManningPlan(roomCount, yr);
          }
          if (!data.fees) {
            data.fees = createDefaultFeesPlan();
          }

          setBudgetDoc(data);
        } else {
          // Initialize default 12 months structure with auto-generated room counts from CPanel
          const emptyMonths: Record<string, BudgetMonthData> = {};
          for (let m = 1; m <= 12; m++) {
            const k = String(m).padStart(2, "0");
            const daysInM = new Date(yr, m, 0).getDate();
            const defaultData = createDefaultBudgetMonthData();
            defaultData.statistic.roomsAvailable = roomCount * daysInM;
            emptyMonths[k] = defaultData;
          }

          const defaultDoc: YearlyBudgetDocument = {
            year: yr,
            hotelCode,
            hotelName,
            months: emptyMonths,
            manning: createDefaultManningPlan(roomCount, yr),
            fees: createDefaultFeesPlan(),
          };
          setBudgetDoc(defaultDoc);
        }
      } catch (err) {
        console.error("Error fetching budget doc:", err);
      } finally {
        setLoadingBudget(false);
      }
    },
    [hotelCode, hotelName, fetchHotelRoomCount]
  );

  // 3. Fetch Transactions & POS Orders (Single ranged query for the active year, no loop)
  const fetchActualsData = useCallback(
    async (yr: number, upToDate: string) => {
      if (!hotelCode) return;
      setLoadingActuals(true);
      try {
        const startOfYear = `${yr}-01-01`;

        // Single query from start of year to selectedDate
        const qRev = query(
          getHotelCollection(db, "daily_revenue", hotelCode),
          where("date", ">=", startOfYear),
          where("date", "<=", upToDate)
        );

        const revSnap = await getDocs(qRev);
        const allEntries: any[] = [];

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

        // Query POS Orders if available (single fetch, cached in memory)
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

            if (dateStr >= startOfYear && dateStr <= upToDate) {
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
          const customIncomesList: any[] = [];
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

  // Save modified Budget Document
  const saveBudgetDoc = async (updatedDoc: YearlyBudgetDocument) => {
    if (!hotelCode) {
      throw new Error("Kode hotel tidak ditemukan. Silakan pilih hotel aktif.");
    }
    setSavingBudget(true);
    setSaveSuccess(false);
    try {
      const now = new Date().toISOString();
      const userName = user?.displayName || user?.email?.split("@")[0] || "Admin";
      const userEmail = user?.email || "admin@setara.com";
      const userRole = user?.role || "Staff";

      const newLogEntry: BudgetAuditLog = {
        timestamp: now,
        userName,
        userEmail,
        userRole,
        action: `Update Target Budget Tahun ${updatedDoc.year}`,
        snapshot: {
          months: updatedDoc.months ? JSON.parse(JSON.stringify(updatedDoc.months)) : {},
          manning: updatedDoc.manning ? JSON.parse(JSON.stringify(updatedDoc.manning)) : null,
          fees: updatedDoc.fees ? JSON.parse(JSON.stringify(updatedDoc.fees)) : null,
        },
      };

      // Keep up to 5 full snapshots to strictly protect from 1MB Firestore document limit
      const existingLogs = Array.isArray(updatedDoc.auditLogs) ? updatedDoc.auditLogs : [];
      const sanitizedExistingLogs = existingLogs.slice(0, 15).map((l, idx) => {
        if (idx >= 4) {
          const { snapshot, ...rest } = l;
          return rest;
        }
        return l;
      });
      const updatedLogs = [newLogEntry, ...sanitizedExistingLogs];

      const rawPayload = {
        ...updatedDoc,
        year: Number(updatedDoc.year),
        hotelCode: hotelCode || "default",
        hotelName: updatedDoc.hotelName || hotelName || "Hotel",
        updatedAt: now,
        lastUpdatedBy: userName,
        lastUpdatedByEmail: userEmail,
        lastUpdatedByRole: userRole,
        auditLogs: updatedLogs,
      };

      // Sanitize payload with JSON serialization to strip all undefined fields that cause Firestore errors
      const cleanPayload: YearlyBudgetDocument = JSON.parse(JSON.stringify(rawPayload));

      const budgetRef = doc(getHotelCollection(db, "budgeting", hotelCode), String(updatedDoc.year));
      await setDoc(budgetRef, cleanPayload, { merge: true });

      setBudgetDoc(cleanPayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving budget doc:", err);
      throw err;
    } finally {
      setSavingBudget(false);
    }
  };

  // Restore / Rollback to a specific Audit Log Snapshot (Superadmin only)
  const restoreBudgetFromLog = async (logIndex: number) => {
    if (!hotelCode || !budgetDoc || !budgetDoc.auditLogs || !budgetDoc.auditLogs[logIndex]) {
      throw new Error("Data riwayat log tidak ditemukan.");
    }
    const targetLog = budgetDoc.auditLogs[logIndex];
    if (!targetLog.snapshot || !targetLog.snapshot.months) {
      throw new Error("Snapshot data untuk versi ini tidak tersedia atau versi dibuat sebelum fitur snapshot aktif.");
    }

    setSavingBudget(true);
    try {
      const now = new Date().toISOString();
      const userName = user?.displayName || user?.email?.split("@")[0] || "Superadmin";
      const userEmail = user?.email || "superadmin@setara.com";
      const userRole = user?.role || "superadmin";

      const rollbackLogEntry: BudgetAuditLog = {
        timestamp: now,
        userName,
        userEmail,
        userRole,
        action: `Rollback ke versi ${new Date(targetLog.timestamp).toLocaleString("id-ID")}`,
        snapshot: {
          months: JSON.parse(JSON.stringify(targetLog.snapshot.months || {})),
          manning: targetLog.snapshot.manning ? JSON.parse(JSON.stringify(targetLog.snapshot.manning)) : null,
          fees: targetLog.snapshot.fees ? JSON.parse(JSON.stringify(targetLog.snapshot.fees)) : null,
        },
      };

      const existingLogs = Array.isArray(budgetDoc.auditLogs) ? budgetDoc.auditLogs : [];
      const sanitizedExistingLogs = existingLogs.slice(0, 15).map((l, idx) => {
        if (idx >= 4) {
          const { snapshot, ...rest } = l;
          return rest;
        }
        return l;
      });
      const updatedLogs = [rollbackLogEntry, ...sanitizedExistingLogs];

      const rawRestoredPayload = {
        ...budgetDoc,
        months: JSON.parse(JSON.stringify(targetLog.snapshot.months)),
        manning: targetLog.snapshot.manning ? JSON.parse(JSON.stringify(targetLog.snapshot.manning)) : budgetDoc.manning,
        fees: targetLog.snapshot.fees ? JSON.parse(JSON.stringify(targetLog.snapshot.fees)) : budgetDoc.fees,
        updatedAt: now,
        lastUpdatedBy: userName,
        lastUpdatedByEmail: userEmail,
        lastUpdatedByRole: userRole,
        auditLogs: updatedLogs,
      };

      const cleanRestoredPayload: YearlyBudgetDocument = JSON.parse(JSON.stringify(rawRestoredPayload));

      const budgetRef = doc(getHotelCollection(db, "budgeting", hotelCode), String(budgetDoc.year));
      await setDoc(budgetRef, cleanRestoredPayload, { merge: true });

      setBudgetDoc(cleanRestoredPayload);
      return cleanRestoredPayload;
    } catch (err) {
      console.error("Error restoring budget from log:", err);
      throw err;
    } finally {
      setSavingBudget(false);
    }
  };

  // Compute DSR in memory with zero extra queries
  const dsrReport: DSRReportResult = useMemo(() => {
    const startOfMonth = `${yearStr}-${monthStr}-01`;

    const todayTxs = transactionsCache.entries.filter((t) => t.date === selectedDate);
    const mtdTxs = transactionsCache.entries.filter(
      (t) => t.date >= startOfMonth && t.date <= selectedDate
    );
    const ytdTxs = transactionsCache.entries;

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
      todayTransactions: todayTxs,
      mtdTransactions: mtdTxs,
      ytdTransactions: ytdTxs,
      todayPosOrders: todayPos,
      mtdPosOrders: mtdPos,
      ytdPosOrders: ytdPos,
      customIncomes: customIncomesCache.items,
      ratePlans,
      hotelBreakfastRate,
    });
  }, [
    selectedDate,
    yearStr,
    monthStr,
    hotelCode,
    hotelName,
    hotelRoomCount,
    budgetDoc,
    transactionsCache,
    posOrdersCache,
    customIncomesCache,
    ratePlans,
    hotelBreakfastRate,
  ]);

  return {
    selectedDate,
    setSelectedDate,
    selectedYear,
    selectedMonth,
    activeTab,
    setActiveTab,
    hotelCode,
    hotelName,
    hotelRoomCount,
    loadingBudget,
    loadingActuals,
    savingBudget,
    saveSuccess,
    budgetDoc,
    saveBudgetDoc,
    restoreBudgetFromLog,
    dsrReport,
    refetchActuals: () => fetchActualsData(selectedYear, selectedDate),
  };
};
