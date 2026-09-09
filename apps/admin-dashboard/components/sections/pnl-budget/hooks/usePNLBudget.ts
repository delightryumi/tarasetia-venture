"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";
import {
  YearlyBudgetDocument,
  BudgetMonthData,
  createDefaultBudgetMonthData,
  recalculateBudgetMonthData,
} from "@/lib/budget-types";

export interface PnLComparisonRow {
  code: string;
  name: string;
  isHeader?: boolean;
  isSubtotal?: boolean;
  isHighlight?: boolean;
  isGop?: boolean;
  isNoi?: boolean;
  isCostOrExpense?: boolean;
  actual: number;
  budget: number;
  varianceIdr: number;
  variancePercent: number;
}

export const usePNLBudget = () => {
  const { activeHotelCode, activeHotelName } = useAuth();

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonthNum = useMemo(() => String(new Date().getMonth() + 1).padStart(2, "0"), []);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum);
  const [activeView, setActiveView] = useState<"monthly" | "quarterly" | "annual" | "multiyear">("monthly");
  const [loading, setLoading] = useState<boolean>(true);

  const [budgetDoc, setBudgetDoc] = useState<YearlyBudgetDocument | null>(null);
  const [hotelRoomCount, setHotelRoomCount] = useState<number>(39);

  // Live actual monthly data aggregated from transactions/orders/incomes/expenses
  const [actualMonthlyData, setActualMonthlyData] = useState<Record<string, Partial<BudgetMonthData>>>({});

  // 1. Fetch Room Count
  const fetchRoomCount = useCallback(async (hCode: string) => {
    if (!hCode || hCode === "0") return 39;
    try {
      let count = 0;
      const hotelRef = doc(db, "hotels", hCode);
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
        const rSnap = await getDocs(getHotelCollection(db, "roomTypes", hCode));
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
    } catch {
      return 39;
    }
  }, []);

  // 2. Fetch Budget Document
  const fetchBudget = useCallback(async (yr: number, hCode: string): Promise<YearlyBudgetDocument | null> => {
    try {
      const bRef = doc(getHotelCollection(db, "budgeting", hCode), String(yr));
      const snap = await getDoc(bRef);
      if (snap.exists()) {
        const data = snap.data() as YearlyBudgetDocument;
        if (data.months) {
          Object.keys(data.months).forEach((k) => {
            if (data.months[k]) {
              recalculateBudgetMonthData(data.months[k]);
            }
          });
        }
        setBudgetDoc(data);
        return data;
      } else {
        setBudgetDoc(null);
        return null;
      }
    } catch (e) {
      console.error("Error fetching budget in usePNLBudget:", e);
      setBudgetDoc(null);
      return null;
    }
  }, []);

  // 3. Fetch Actual Transactions and Aggregate directly from PnL Statement data sources
  const fetchActuals = useCallback(async (yr: number, hCode: string, bDoc?: YearlyBudgetDocument | null) => {
    try {
      const startIso = `${yr}-01-01`;
      const endIso = `${yr}-12-31`;

      const monthlyMap: Record<string, any> = {};
      for (let m = 1; m <= 12; m++) {
        const k = String(m).padStart(2, "0");
        monthlyMap[k] = {
          roomRevenue: 0,
          fnbRevenue: 0,
          modRevenue: 0,
          otherIncome: 0,
          totalRevenue: 0,
          roomCogs: 0,
          fnbCogs: 0,
          modCogs: 0,
          totalCogs: 0,
          roomExp: 0,
          fnbExp: 0,
          modExp: 0,
          agExp: 0,
          hrdExp: 0,
          smExp: 0,
          pomecExp: 0,
          totalOpex: 0,
          nonOp: 0,
          nonOpBaseFee: 0,
          nonOpIncentiveFee: 0,
          nonOpFranchiseFee: 0,
          nonOpInsurance: 0,
          nonOpPropertyTax: 0,
          nonOpBankInterest: 0,
          nonOpDepreciation: 0,
          occupiedRooms: 0,
          totalPax: 0,
          payingPax: 0,
          houseUsePax: 0,
          complimentPax: 0,
        };
      }

      // A. Front Office Transactions (from daily_revenue - exact PnL Statement source)
      try {
        const qRev = query(
          getHotelCollection(db, "daily_revenue", hCode),
          where("date", ">=", startIso),
          where("date", "<=", endIso)
        );
        const revSnap = await getDocs(qRev);
        revSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const docDate = data.date || docSnap.id.replace(`${hCode}_`, "") || docSnap.id;
          (data.entries || []).forEach((t: any) => {
            const status = (t.status || "").toUpperCase();
            const payStatus = (t.paymentStatus || "").toUpperCase();
            const isIgnored =
              t.isDeleted ||
              t.isHidden ||
              ["VOID", "VOIDED", "CANCEL", "CANCELLED", "NO-SHOW"].includes(status) ||
              ["VOID", "VOIDED", "CANCEL", "CANCELLED"].includes(payStatus);
            if (isIgnored) return;

            const isPelunasan =
              t.isPelunasan ||
              t.type === "pelunasan_ar" ||
              t.type === "pelunasan_reversal" ||
              t.guestName?.startsWith("Koreksi Tanggal Pelunasan") ||
              t.guestName?.startsWith("Pelunasan Piutang");
            if (isPelunasan) return;

            const entryDate = t.effectiveDate || docDate || t.date || t.checkInDate || "";
            const mKey = entryDate.slice(5, 7);
            if (!monthlyMap[mKey]) return;

            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            const isAcc =
              !isPOS &&
              (t.type === "accommodation" || (!t.type && (t.guestName || t.roomNumber || t.roomType)));

            const amt = Number(t.amount) || 0;
            const paxCount = Number(t.pax) || (Number(t.adultCount || 0) + Number(t.childCount || 0)) || 1;
            const roomCount = Math.max(1, Number(t.roomsCount || (t as any).roomCount) || 1);

            if (isAcc) {
              const isOOO = status === "OOO" || status === "OUT_OF_ORDER" || !!t.isOOO || !!t.isOutOfOrder;
              const isHouseUse = status === "HOUSE_USE" || !!t.isHouseUse;
              const isCompliment = status === "COMPLIMENT" || payStatus === "COMPLIMENT" || !!t.isCompliment;

              if (!isOOO) {
                monthlyMap[mKey].totalPax += paxCount;
                if (isHouseUse) monthlyMap[mKey].houseUsePax += paxCount;
                else if (isCompliment) monthlyMap[mKey].complimentPax += paxCount;
                else monthlyMap[mKey].payingPax += paxCount;

                if (!isHouseUse && !isCompliment) {
                  monthlyMap[mKey].roomRevenue += amt;
                  monthlyMap[mKey].occupiedRooms += roomCount;
                }
              }
            } else {
              const cat = (t.category || t.department || "").toLowerCase();
              const desc = (t.description || "").toLowerCase();
              if (
                cat.includes("extra_bed") ||
                cat.includes("other_room") ||
                desc.includes("extra bed") ||
                desc.includes("late checkout") ||
                desc.includes("early checkin")
              ) {
                monthlyMap[mKey].roomRevenue += amt;
              } else if (
                cat.includes("f&b") ||
                cat.includes("resto") ||
                cat.includes("food") ||
                cat.includes("bev") ||
                desc.includes("makan") ||
                desc.includes("minum")
              ) {
                monthlyMap[mKey].fnbRevenue += amt;
              } else if (cat.includes("spa") || cat.includes("laundry") || cat.includes("mod")) {
                monthlyMap[mKey].modRevenue += amt;
              } else {
                monthlyMap[mKey].otherIncome += amt;
              }
            }
          });
        });
      } catch (err) {
        console.warn("daily_revenue query error in usePNLBudget:", err);
      }

      // B. POS Orders (from pos_orders - exact PnL Statement source)
      try {
        const posSnap = await getDocs(getHotelCollection(db, "pos_orders", hCode));
        posSnap.forEach((d) => {
          const o = d.data();
          const st = (o.status || "").toUpperCase();
          if (st === "VOID" || st === "VOIDED" || st === "CANCELLED" || st === "CANCEL" || o.isDeleted) return;
          
          let dStr = "";
          if (o.timestamp) {
            const dt = typeof o.timestamp.toDate === "function" ? o.timestamp.toDate() : new Date(o.timestamp.seconds ? o.timestamp.seconds * 1000 : o.timestamp);
            dStr = dt.toISOString().split("T")[0];
          } else if (o.createdAt) {
            dStr = typeof o.createdAt === "string" ? o.createdAt.split("T")[0] : "";
          } else if (o.date) {
            dStr = o.date;
          }

          if (!dStr || dStr < startIso || dStr > endIso) return;
          const mKey = dStr.slice(5, 7);
          if (!monthlyMap[mKey]) return;

          if (Array.isArray(o.items) && o.items.length > 0) {
            o.items.forEach((it: any) => {
              const itemAmt = Number(it.subtotal) || (Number(it.price || 0) * (Number(it.quantity) || 1));
              const itemCost = (Number(it.costPrice || it.buyPrice || 0)) * (Number(it.quantity) || 1);
              const cat = (it.category || it.pnlTarget || "").toLowerCase().trim();

              if (cat.includes("spa") || cat.includes("laundry") || cat.includes("mod")) {
                monthlyMap[mKey].modRevenue += itemAmt;
                monthlyMap[mKey].modCogs += itemCost;
              } else if (cat.includes("other") || cat.includes("lain")) {
                monthlyMap[mKey].otherIncome += itemAmt;
              } else {
                // Default: FOOD, BEVERAGE, BANQUET -> F&B
                monthlyMap[mKey].fnbRevenue += itemAmt;
                monthlyMap[mKey].fnbCogs += itemCost;
              }
            });
          } else {
            const amt = Number(o.subtotal || o.total || o.finalAmount || 0);
            const rType = (o.revenueType || o.category || "").toLowerCase();
            if (rType.includes("spa") || rType.includes("laundry") || rType.includes("mod")) {
              monthlyMap[mKey].modRevenue += amt;
            } else if (rType.includes("other")) {
              monthlyMap[mKey].otherIncome += amt;
            } else {
              monthlyMap[mKey].fnbRevenue += amt;
            }
          }
        });
      } catch (err) {
        console.warn("pos_orders query error in usePNLBudget:", err);
      }

      // C. Purchasing & Departmental Expenses (from global_pnl_reports - exact PnL Statement source)
      try {
        const pnlQ = query(
          getHotelCollection(db, "global_pnl_reports", hCode),
          where("__name__", ">=", `${yr}-01`),
          where("__name__", "<=", `${yr}-12`)
        );
        const pnlSnap = await getDocs(pnlQ);
        pnlSnap.forEach((d) => {
          const data = d.data();
          const mKey = d.id.slice(5, 7);
          if (!monthlyMap[mKey]) return;

          (data.customIncomes || []).forEach((ci: any) => {
            const amt = Number(ci.amount) || 0;
            const cat = (ci.category || ci.name || ci.description || "").toLowerCase();
            if (cat.includes("spa") || cat.includes("laundry") || cat.includes("mod")) {
              monthlyMap[mKey].modRevenue += amt;
            } else if (cat.includes("food") || cat.includes("bev") || cat.includes("resto") || cat.includes("f&b")) {
              monthlyMap[mKey].fnbRevenue += amt;
            } else {
              monthlyMap[mKey].otherIncome += amt;
            }
          });
          (data.nonCommissionRevenue || []).forEach((ncr: any) => {
            monthlyMap[mKey].otherIncome += Number(ncr.amount) || 0;
          });

          (data.expenses || []).forEach((e: any) => {
            const amt = Number(e.amount) || 0;
            const dept = (e.department || e.category || e.fbCategory || "").toLowerCase();
            const name = (e.name || e.description || "").toLowerCase();

            if (dept.includes("room") || dept.includes("fo") || dept.includes("hk") || dept.includes("housekeeping")) {
              monthlyMap[mKey].roomExp += amt;
            } else if (dept.includes("food") || dept.includes("bev") || dept.includes("f&b") || dept.includes("kitchen") || dept.includes("resto")) {
              if (dept.includes("cost") || name.includes("cost") || name.includes("bahan") || name.includes("raw")) {
                monthlyMap[mKey].fnbCogs += amt;
              } else {
                monthlyMap[mKey].fnbExp += amt;
              }
            } else if (dept.includes("spa") || dept.includes("laundry") || dept.includes("mod")) {
              if (dept.includes("cost") || name.includes("cost")) {
                monthlyMap[mKey].modCogs += amt;
              } else {
                monthlyMap[mKey].modExp += amt;
              }
            } else if (dept.includes("hrd") || dept.includes("hr") || dept.includes("payroll")) {
              monthlyMap[mKey].hrdExp += amt;
            } else if (dept.includes("sm") || dept.includes("sales") || dept.includes("marketing") || dept.includes("promo")) {
              monthlyMap[mKey].smExp += amt;
            } else if (dept.includes("pomec") || dept.includes("eng") || dept.includes("maintenance") || dept.includes("pln") || dept.includes("energy")) {
              monthlyMap[mKey].pomecExp += amt;
            } else if (
              dept.includes("nonop") ||
              dept.includes("non-op") ||
              dept.includes("non operating") ||
              dept.includes("fee") ||
              dept.includes("mgmt") ||
              dept.includes("pbb") ||
              dept.includes("asuransi") ||
              dept.includes("insurance") ||
              dept.includes("deprec") ||
              dept.includes("bunga") ||
              dept.includes("interest")
            ) {
              monthlyMap[mKey].nonOp += amt;
              const matchStr = (dept + " " + name + " " + (e.category || "")).toLowerCase();
              if (matchStr.includes("incentive")) {
                monthlyMap[mKey].nonOpIncentiveFee += amt;
              } else if (matchStr.includes("franchise") || matchStr.includes("royalty")) {
                monthlyMap[mKey].nonOpFranchiseFee += amt;
              } else if (matchStr.includes("insurance") || matchStr.includes("asuransi")) {
                monthlyMap[mKey].nonOpInsurance += amt;
              } else if (matchStr.includes("pbb") || matchStr.includes("property tax") || matchStr.includes("pajak bumi")) {
                monthlyMap[mKey].nonOpPropertyTax += amt;
              } else if (matchStr.includes("interest") || matchStr.includes("bunga") || matchStr.includes("financing")) {
                monthlyMap[mKey].nonOpBankInterest += amt;
              } else if (matchStr.includes("depreciation") || matchStr.includes("amortization") || matchStr.includes("penyusutan") || matchStr.includes("amortisasi")) {
                monthlyMap[mKey].nonOpDepreciation += amt;
              } else {
                monthlyMap[mKey].nonOpBaseFee += amt;
              }
            } else {
              monthlyMap[mKey].agExp += amt;
            }
          });
        });
      } catch (err) {
        console.warn("global_pnl_reports query error in usePNLBudget:", err);
      }

      // D. Payroll Expenses (from payroll_summaries - exact PnL Statement source)
      try {
        const summariesRef = getHotelCollection(db, "payroll_summaries", hCode);
        const qPay = query(
          summariesRef,
          where("__name__", ">=", `${yr}-01`),
          where("__name__", "<=", `${yr}-12`)
        );
        const snapPay = await getDocs(qPay);
        snapPay.forEach((d) => {
          const mKey = d.id.slice(5, 7);
          if (!monthlyMap[mKey]) return;
          const pData = d.data();
          const totalExp = Number(pData.totalPayrollExpense || 0);
          if (Array.isArray(pData.details) && pData.details.length > 0) {
            pData.details.forEach((det: any) => {
              const dept = (det.department || "").toLowerCase();
              const amt = Number(det.totalSalary || det.netPay || det.salary || 0);
              if (dept.includes("fo") || dept.includes("hk") || dept.includes("room")) {
                monthlyMap[mKey].roomExp += amt;
              } else if (dept.includes("fb") || dept.includes("kitchen") || dept.includes("f&b")) {
                monthlyMap[mKey].fnbExp += amt;
              } else if (dept.includes("spa") || dept.includes("laundry") || dept.includes("mod")) {
                monthlyMap[mKey].modExp += amt;
              } else if (dept.includes("sm") || dept.includes("marketing")) {
                monthlyMap[mKey].smExp += amt;
              } else if (dept.includes("pomec") || dept.includes("engineering")) {
                monthlyMap[mKey].pomecExp += amt;
              } else if (dept.includes("hrd")) {
                monthlyMap[mKey].hrdExp += amt;
              } else {
                monthlyMap[mKey].agExp += amt;
              }
            });
          } else {
            monthlyMap[mKey].hrdExp += totalExp;
          }
        });
      } catch (err) {
        console.warn("payroll_summaries query error in usePNLBudget:", err);
      }

      // Compute Totals & Auto Calculate Fees from Contract Rate
      for (let m = 1; m <= 12; m++) {
        const k = String(m).padStart(2, "0");
        const x = monthlyMap[k];
        x.totalRevenue = x.roomRevenue + x.fnbRevenue + x.modRevenue + x.otherIncome;
        x.totalCogs = x.roomCogs + x.fnbCogs + x.modCogs;
        x.totalOpex = x.roomExp + x.fnbExp + x.modExp + x.agExp + x.hrdExp + x.smExp + x.pomecExp;

        const gop = x.totalRevenue - x.totalCogs - x.totalOpex;
        const mgmtPercent = bDoc?.fees?.managementFeePercent || 3;
        const incPercent = bDoc?.fees?.incentiveFeePercent || 4;

        if (x.nonOpBaseFee === 0 && x.totalRevenue > 0) {
          x.nonOpBaseFee = Math.round(x.totalRevenue * (mgmtPercent / 100));
        }
        if (x.nonOpIncentiveFee === 0 && gop > 0) {
          x.nonOpIncentiveFee = Math.round(gop * (incPercent / 100));
        }

        x.nonOp =
          x.nonOpBaseFee +
          x.nonOpIncentiveFee +
          x.nonOpFranchiseFee +
          x.nonOpInsurance +
          x.nonOpPropertyTax +
          x.nonOpBankInterest +
          x.nonOpDepreciation;
      }

      setActualMonthlyData(monthlyMap);
    } catch (e) {
      console.error("Error fetching actuals in usePNLBudget:", e);
    }
  }, []);

  const reloadData = useCallback(async () => {
    if (!activeHotelCode) return;
    setLoading(true);
    await fetchRoomCount(activeHotelCode);
    const bDoc = await fetchBudget(selectedYear, activeHotelCode);
    await fetchActuals(selectedYear, activeHotelCode, bDoc);
    setLoading(false);
  }, [activeHotelCode, selectedYear, fetchRoomCount, fetchBudget, fetchActuals]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  return {
    hotelCode: activeHotelCode,
    hotelName: activeHotelName,
    hotelRoomCount,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    activeView,
    setActiveView,
    loading,
    budgetDoc,
    actualMonthlyData,
    reloadData,
  };
};
