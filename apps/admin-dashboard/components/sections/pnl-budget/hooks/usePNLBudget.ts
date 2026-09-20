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
import { detectBreakfastAllocation } from "@/lib/breakfast-utils";

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

export interface ActualBreakdownItem {
  id: string;
  docNum?: string;
  name: string;
  department?: string;
  description?: string;
  amount: number;
  date?: string;
  source: 'SR' | 'DML' | 'PR' | 'Payroll' | 'Revenue' | 'Expense';
  paymentStatus?: string;
}

export interface ActualMonthlyPnLData {
  roomRevenue: number;
  fnbRevenue: number;
  modRevenue: number;
  otherIncome: number;
  totalRevenue: number;
  roomCogs: number;
  fnbCogs: number;
  modCogs: number;
  totalCogs: number;
  roomExp: number;
  fnbExp: number;
  modExp: number;
  agExp: number;
  hrdExp: number;
  smExp: number;
  pomecExp: number;
  totalOpex: number;
  nonOp: number;
  nonOpBaseFee: number;
  nonOpIncentiveFee: number;
  nonOpFranchiseFee: number;
  nonOpInsurance: number;
  nonOpPropertyTax: number;
  nonOpBankInterest: number;
  nonOpDepreciation: number;
  occupiedRooms: number;
  totalPax: number;
  payingPax: number;
  houseUsePax: number;
  complimentPax: number;
  breakdown?: Record<string, ActualBreakdownItem[]>;
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
  const [hotelRoomCount, setHotelRoomCount] = useState<number>(8);

  // Live actual monthly data aggregated from transactions/orders/incomes/expenses
  const [actualMonthlyData, setActualMonthlyData] = useState<Record<string, ActualMonthlyPnLData>>({});

  // 1. Fetch Room Count
  const fetchRoomCount = useCallback(async (hCode: string) => {
    if (!hCode || hCode === "0") return 8;
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

      const finalCount = count > 0 ? count : 8;
      setHotelRoomCount(finalCount);
      return finalCount;
    } catch {
      return 8;
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
          breakdown: {
            roomRevenue: [],
            fnbRevenue: [],
            modRevenue: [],
            otherIncome: [],
            roomCogs: [],
            fnbCogs: [],
            modCogs: [],
            roomExp: [],
            fnbExp: [],
            modExp: [],
            agExp: [],
            hrdExp: [],
            smExp: [],
            pomecExp: [],
            nonOpBaseFee: [],
            nonOpIncentiveFee: [],
            nonOpFranchiseFee: [],
            nonOpInsurance: [],
            nonOpPropertyTax: [],
            nonOpBankInterest: [],
            nonOpDepreciation: [],
          },
        };
      }

      // Fetch Channel Manager rate plans & hotel settings for breakfast allocation
      let currentRatePlans: any[] = [];
      let currentBkfRate: number | undefined = undefined;
      try {
        const hotelRef = doc(db, "hotels", hCode);
        const hSnap = await getDoc(hotelRef);
        if (hSnap.exists()) {
          const hd = hSnap.data() as any;
          const bRate = Number(hd.settings?.breakfastRate || hd.settings?.defaultBreakfastRate || hd.breakfastRate);
          if (bRate > 0) currentBkfRate = bRate;
        }
        const rpSnap = await getDocs(getHotelCollection(db, "ratePlans", hCode));
        rpSnap.forEach((d) => currentRatePlans.push({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn("Could not fetch ratePlans in usePNLBudget:", err);
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

          const dayAccommodationGroups: Record<string, any[]> = {};
          const dayNonAccEntries: any[] = [];

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

            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            const isAcc =
              !isPOS &&
              (t.type === "accommodation" || (!t.type && (t.guestName || t.roomNumber || t.roomType)));

            if (isAcc) {
              const normGuestName = (t.guestName || "").trim().toLowerCase();
              const roomIdent = String(t.roomNumber || t.roomTypeId || t.roomType || '').trim();
              const cIn = t.checkInDate || t.checkIn || '';
              const cOut = t.checkOutDate || t.checkOut || '';
              const key = (normGuestName && cIn) 
                ? `${normGuestName}_${roomIdent}_${cIn}_${cOut}` 
                : (t.bookingId ? `b_${t.bookingId}` : `t_${t.timestamp}`);
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
            const entryDate = t.effectiveDate || docDate || t.date || t.checkInDate || "";
            const mKey = entryDate.slice(5, 7);
            if (!monthlyMap[mKey]) return;

            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            const isAcc =
              !isPOS &&
              (t.type === "accommodation" || (!t.type && (t.guestName || t.roomNumber || t.roomType)));

            const status = (t.status || "").toUpperCase();
            const payStatus = (t.paymentStatus || "").toUpperCase();
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
                  const alloc = detectBreakfastAllocation(t, { ratePlans: currentRatePlans, hotelBreakfastRate: currentBkfRate });
                  const netRoom = (alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0)
                    ? alloc.netRoomAmount
                    : amt;
                  const bfa = (alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0)
                    ? alloc.breakfastAmount
                    : 0;

                  monthlyMap[mKey].roomRevenue += netRoom;
                  monthlyMap[mKey].occupiedRooms += roomCount;

                  if (netRoom > 0) {
                    monthlyMap[mKey].breakdown.roomRevenue.push({
                      id: t.id || `${entryDate}-${t.guestName || t.roomNumber || Math.random()}`,
                      docNum: t.roomNumber ? `Kamar ${t.roomNumber}` : (t.bookingId || "Front Office"),
                      name: t.guestName || "Sewa Kamar",
                      department: "Front Office",
                      description: `Kamar: ${t.roomNumber || '-'} (${t.roomType || 'Standard'}) • Tamu: ${t.guestName || '-'}`,
                      amount: netRoom,
                      date: entryDate,
                      source: "Revenue",
                      paymentStatus: t.paymentStatus || "paid"
                    });
                  }

                  if (bfa > 0) {
                    monthlyMap[mKey].fnbRevenue += bfa;
                    monthlyMap[mKey].breakdown.fnbRevenue.push({
                      id: `bfk-alloc-${t.id || Math.random()}`,
                      docNum: t.roomNumber ? `Kamar ${t.roomNumber}` : "Bkf Alloc",
                      name: `Alokasi Sarapan (${t.guestName || "Kamar"})`,
                      department: "Food & Beverage",
                      description: `Alokasi Paket Sarapan (${t.roomType || 'Standard'} - Kamar ${t.roomNumber || '-'})`,
                      amount: bfa,
                      date: entryDate,
                      source: "Revenue",
                      paymentStatus: "paid"
                    });
                  }
                }
              }
            } else {
              const cat = (t.category || t.department || "").toLowerCase();
              const subCat = (t.subCategory || "").toLowerCase();
              const desc = (t.description || "").toLowerCase();
              if (
                cat.includes("extra_bed") ||
                cat.includes("other_room") ||
                desc.includes("extra bed") ||
                desc.includes("late checkout") ||
                desc.includes("early checkin")
              ) {
                monthlyMap[mKey].roomRevenue += amt;
                if (amt > 0) {
                  monthlyMap[mKey].breakdown.roomRevenue.push({
                    id: t.id || `${entryDate}-${Math.random()}`,
                    docNum: t.roomNumber ? `Kamar ${t.roomNumber}` : "Room Extra",
                    name: t.description || t.guestName || "Extra Bed / Room Charge",
                    department: "Front Office",
                    description: t.description || "Room Extra Service",
                    amount: amt,
                    date: entryDate,
                    source: "Revenue",
                    paymentStatus: t.paymentStatus || "paid"
                  });
                }
              } else if (
                cat.includes("f&b") ||
                cat.includes("resto") ||
                cat.includes("food") ||
                cat.includes("bev") ||
                subCat.includes("breakfast") ||
                desc.includes("breakfast") ||
                desc.includes("sarapan") ||
                desc.includes("makan") ||
                desc.includes("minum")
              ) {
                monthlyMap[mKey].fnbRevenue += amt;
                if (amt > 0) {
                  monthlyMap[mKey].breakdown.fnbRevenue.push({
                    id: t.id || `${entryDate}-${Math.random()}`,
                    docNum: t.roomNumber ? `Kamar ${t.roomNumber}` : "F&B Resto",
                    name: t.description || t.guestName || "F&B Resto / Breakfast",
                    department: "Food & Beverage",
                    description: t.description || "Pendapatan Makanan & Minuman",
                    amount: amt,
                    date: entryDate,
                    source: "Revenue",
                    paymentStatus: t.paymentStatus || "paid"
                  });
                }
              } else if (cat.includes("spa") || cat.includes("laundry") || cat.includes("mod")) {
                monthlyMap[mKey].modRevenue += amt;
                if (amt > 0) {
                  monthlyMap[mKey].breakdown.modRevenue.push({
                    id: t.id || `${entryDate}-${Math.random()}`,
                    docNum: "MOD",
                    name: t.description || "MOD Service",
                    department: "Minor Operating Dept",
                    description: t.description || "Spa / Laundry / Lain-lain",
                    amount: amt,
                    date: entryDate,
                    source: "Revenue",
                    paymentStatus: t.paymentStatus || "paid"
                  });
                }
              } else {
                monthlyMap[mKey].otherIncome += amt;
                if (amt > 0) {
                  monthlyMap[mKey].breakdown.otherIncome.push({
                    id: t.id || `${entryDate}-${Math.random()}`,
                    docNum: "OTHER",
                    name: t.description || "Other Income",
                    department: "Other",
                    description: t.description || "Pendapatan Lain-lain",
                    amount: amt,
                    date: entryDate,
                    source: "Revenue",
                    paymentStatus: t.paymentStatus || "paid"
                  });
                }
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
                if (itemAmt > 0) {
                  monthlyMap[mKey].breakdown.modRevenue.push({
                    id: `${d.id}-${it.id || Math.random()}`,
                    docNum: o.orderNumber || d.id,
                    name: it.name || it.menuName || "MOD Order",
                    department: "Minor Operating Dept",
                    description: `POS MOD: ${it.name || '-'} (x${it.quantity || 1})`,
                    amount: itemAmt,
                    date: dStr,
                    source: "Revenue",
                    paymentStatus: "paid"
                  });
                }
              } else if (cat.includes("other") || cat.includes("lain")) {
                monthlyMap[mKey].otherIncome += itemAmt;
                if (itemAmt > 0) {
                  monthlyMap[mKey].breakdown.otherIncome.push({
                    id: `${d.id}-${it.id || Math.random()}`,
                    docNum: o.orderNumber || d.id,
                    name: it.name || "Other Order",
                    department: "Other",
                    description: `POS: ${it.name || '-'}`,
                    amount: itemAmt,
                    date: dStr,
                    source: "Revenue",
                    paymentStatus: "paid"
                  });
                }
              } else {
                // Default: FOOD, BEVERAGE, BANQUET -> F&B
                monthlyMap[mKey].fnbRevenue += itemAmt;
                monthlyMap[mKey].fnbCogs += itemCost;
                if (itemAmt > 0) {
                  monthlyMap[mKey].breakdown.fnbRevenue.push({
                    id: `${d.id}-${it.id || Math.random()}`,
                    docNum: o.orderNumber || d.id,
                    name: it.name || it.menuName || "POS Order F&B",
                    department: "Food & Beverage",
                    description: `POS Resto/Bar: ${it.name || '-'} (x${it.quantity || 1})`,
                    amount: itemAmt,
                    date: dStr,
                    source: "Revenue",
                    paymentStatus: "paid"
                  });
                }
              }
            });
          } else {
            const amt = Number(o.subtotal || o.total || o.finalAmount || 0);
            const rType = (o.revenueType || o.category || "").toLowerCase();
            if (rType.includes("spa") || rType.includes("laundry") || rType.includes("mod")) {
              monthlyMap[mKey].modRevenue += amt;
              if (amt > 0) {
                monthlyMap[mKey].breakdown.modRevenue.push({
                  id: d.id,
                  docNum: o.orderNumber || d.id,
                  name: "MOD POS Order",
                  department: "Minor Operating Dept",
                  description: "POS Laundry/Spa",
                  amount: amt,
                  date: dStr,
                  source: "Revenue",
                  paymentStatus: "paid"
                });
              }
            } else if (rType.includes("other")) {
              monthlyMap[mKey].otherIncome += amt;
              if (amt > 0) {
                monthlyMap[mKey].breakdown.otherIncome.push({
                  id: d.id,
                  docNum: o.orderNumber || d.id,
                  name: "Other POS Order",
                  department: "Other",
                  description: "POS Other Revenue",
                  amount: amt,
                  date: dStr,
                  source: "Revenue",
                  paymentStatus: "paid"
                });
              }
            } else {
              monthlyMap[mKey].fnbRevenue += amt;
              if (amt > 0) {
                monthlyMap[mKey].breakdown.fnbRevenue.push({
                  id: d.id,
                  docNum: o.orderNumber || d.id,
                  name: "F&B POS Order",
                  department: "Food & Beverage",
                  description: "POS Resto/Bar Bill",
                  amount: amt,
                  date: dStr,
                  source: "Revenue",
                  paymentStatus: "paid"
                });
              }
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
            const ncrAmt = Number(ncr.amount) || 0;
            monthlyMap[mKey].otherIncome += ncrAmt;
            if (ncrAmt > 0) {
              monthlyMap[mKey].breakdown.otherIncome.push({
                id: ncr.id || `ncr-${mKey}-${Math.random()}`,
                docNum: "NCR",
                name: ncr.name || "Non-Commission Revenue",
                department: ncr.category || "Other",
                description: ncr.description || "Pendapatan Non-Komisi",
                amount: ncrAmt,
                date: `${yr}-${mKey}`,
                source: "Revenue",
                paymentStatus: "paid"
              });
            }
          });

          (data.expenses || []).forEach((e: any) => {
            const amt = Number(e.amount) || 0;
            const dept = (e.department || e.category || "").toLowerCase().trim();
            const name = (e.name || e.description || "").toLowerCase();
            const docId = (e.id || "").toLowerCase();

            // SR (store-requisition) dan DML (daily-market-list) = COGS (bahan keluar gudang)
            // PR (purchase-requisition) = bisa COGS (bahan baku) atau OPEX (operasional)
            const isCogs = docId.startsWith("sr-") || docId.startsWith("dml-");

            // Identifikasi F&B secara tegas terlebih dahulu agar tidak false-positive dengan "fo" di "food"
            const isFnb =
              dept.startsWith("food") ||
              dept.startsWith("f&b") ||
              dept.startsWith("fnb") ||
              dept === "fb" ||
              dept.includes("kitchen") ||
              dept.includes("resto") ||
              dept.includes("restaurant") ||
              dept.includes("beverage") ||
              dept.includes("banquet");

            // Rooms: FO & Housekeeping (HINDARI dept.includes("fo") yang mencocokkan "food"!)
            const isRoom =
              !isFnb && (
                dept.startsWith("room") ||
                dept.includes("front office") ||
                dept.includes("housekeeping") ||
                dept === "fo" ||
                dept === "hk" ||
                /\bfo\b/.test(dept) ||
                /\bhk\b/.test(dept)
              );

            const isMod =
              !isFnb && !isRoom && (
                dept.includes("spa") ||
                dept.includes("laundry") ||
                dept.includes("mod")
              );

            const isHrd =
              !isFnb && !isRoom && !isMod && (
                dept.includes("hrd") ||
                dept.includes("hr") ||
                dept.includes("payroll") ||
                dept.includes("human resource")
              );

            const isSm =
              !isFnb && !isRoom && !isMod && !isHrd && (
                dept.includes("sm") ||
                dept.includes("sales") ||
                dept.includes("marketing") ||
                dept.includes("promo")
              );

            const isPomec =
              !isFnb && !isRoom && !isMod && !isHrd && !isSm && (
                dept.includes("pomec") ||
                dept.includes("engineering") ||
                dept.includes("maintenance") ||
                dept.includes("pln") ||
                dept.includes("energy") ||
                dept === "eng" ||
                /\beng\b/.test(dept)
              );

            const isNonOp =
              !isFnb && !isRoom && !isMod && !isHrd && !isSm && !isPomec && (
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
              );

            let targetBucket = "agExp";

            if (isRoom) {
              if (isCogs) {
                targetBucket = "roomCogs";
              } else {
                targetBucket = "roomExp";
              }
            } else if (isFnb) {
              if (isCogs || dept.includes("cost") || name.includes("cost") || name.includes("bahan") || name.includes("raw")) {
                targetBucket = "fnbCogs";
              } else {
                targetBucket = "fnbExp";
              }
            } else if (isMod) {
              if (isCogs || dept.includes("cost") || name.includes("cost")) {
                targetBucket = "modCogs";
              } else {
                targetBucket = "modExp";
              }
            } else if (isHrd) {
              targetBucket = "hrdExp";
            } else if (isSm) {
              targetBucket = "smExp";
            } else if (isPomec) {
              targetBucket = "pomecExp";
            } else if (isNonOp) {
              monthlyMap[mKey].nonOp += amt;
              const matchStr = (dept + " " + name + " " + (e.category || "")).toLowerCase();
              if (matchStr.includes("incentive")) {
                targetBucket = "nonOpIncentiveFee";
              } else if (matchStr.includes("franchise") || matchStr.includes("royalty")) {
                targetBucket = "nonOpFranchiseFee";
              } else if (matchStr.includes("insurance") || matchStr.includes("asuransi")) {
                targetBucket = "nonOpInsurance";
              } else if (matchStr.includes("pbb") || matchStr.includes("property tax") || matchStr.includes("pajak bumi")) {
                targetBucket = "nonOpPropertyTax";
              } else if (matchStr.includes("interest") || matchStr.includes("bunga") || matchStr.includes("financing")) {
                targetBucket = "nonOpBankInterest";
              } else if (matchStr.includes("depreciation") || matchStr.includes("amortization") || matchStr.includes("penyusutan") || matchStr.includes("amortisasi")) {
                targetBucket = "nonOpDepreciation";
              } else {
                targetBucket = "nonOpBaseFee";
              }
            } else {
              targetBucket = "agExp";
            }

            // Tambahkan nominal ke bucket yang tepat
            monthlyMap[mKey][targetBucket] += amt;

            // Catat detail breakdown untuk audit klik-detail
            const sourceBadge: 'SR' | 'DML' | 'PR' | 'Expense' = docId.startsWith("sr-")
              ? "SR"
              : docId.startsWith("dml-")
              ? "DML"
              : docId.startsWith("pr-")
              ? "PR"
              : "Expense";

            if (!monthlyMap[mKey].breakdown[targetBucket]) {
              monthlyMap[mKey].breakdown[targetBucket] = [];
            }

            monthlyMap[mKey].breakdown[targetBucket].push({
              id: e.id || `${targetBucket}-${mKey}-${Math.random()}`,
              docNum: e.docNum || (e.name ? e.name.split(" - ")[1] : "") || e.id || "-",
              name: e.name || e.description || "Pengeluaran",
              department: e.department || e.category || "-",
              description: e.description || e.notes || "",
              amount: amt,
              date: e.date || `${yr}-${mKey}`,
              source: sourceBadge,
              paymentStatus: e.paymentStatus || "paid",
            });
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
              const dept = (det.department || "").toLowerCase().trim();
              const amt = Number(det.totalSalary || det.netPay || det.salary || 0);

              const isPayrollFnb =
                dept.startsWith("food") ||
                dept.startsWith("f&b") ||
                dept.startsWith("fnb") ||
                dept === "fb" ||
                dept.includes("kitchen") ||
                dept.includes("resto");

              const isPayrollRoom =
                !isPayrollFnb && (
                  dept.startsWith("room") ||
                  dept.includes("front office") ||
                  dept.includes("housekeeping") ||
                  dept === "fo" ||
                  dept === "hk" ||
                  /\bfo\b/.test(dept) ||
                  /\bhk\b/.test(dept)
                );

              const isPayrollMod = !isPayrollFnb && !isPayrollRoom && (dept.includes("spa") || dept.includes("laundry") || dept.includes("mod"));
              const isPayrollSm = !isPayrollFnb && !isPayrollRoom && !isPayrollMod && (dept.includes("sm") || dept.includes("sales") || dept.includes("marketing"));
              const isPayrollPomec = !isPayrollFnb && !isPayrollRoom && !isPayrollMod && !isPayrollSm && (dept.includes("pomec") || dept.includes("engineering") || dept === "eng" || /\beng\b/.test(dept));
              const isPayrollHrd = !isPayrollFnb && !isPayrollRoom && !isPayrollMod && !isPayrollSm && !isPayrollPomec && (dept.includes("hrd") || dept.includes("hr"));

              let pTarget = "agExp";
              if (isPayrollRoom) pTarget = "roomExp";
              else if (isPayrollFnb) pTarget = "fnbExp";
              else if (isPayrollMod) pTarget = "modExp";
              else if (isPayrollSm) pTarget = "smExp";
              else if (isPayrollPomec) pTarget = "pomecExp";
              else if (isPayrollHrd) pTarget = "hrdExp";

              monthlyMap[mKey][pTarget] += amt;

              if (!monthlyMap[mKey].breakdown[pTarget]) {
                monthlyMap[mKey].breakdown[pTarget] = [];
              }
              monthlyMap[mKey].breakdown[pTarget].push({
                id: det.id || `${d.id}-${det.employeeName || 'payroll'}`,
                docNum: `PAYROLL-${mKey}`,
                name: det.employeeName || det.name || "Gaji Karyawan",
                department: det.department || "Payroll",
                description: `Gaji: ${det.role || det.position || 'Staff'}`,
                amount: amt,
                date: `${yr}-${mKey}`,
                source: "Payroll",
                paymentStatus: "paid",
              });
            });
          } else {
            monthlyMap[mKey].hrdExp += totalExp;
            if (!monthlyMap[mKey].breakdown["hrdExp"]) {
              monthlyMap[mKey].breakdown["hrdExp"] = [];
            }
            monthlyMap[mKey].breakdown["hrdExp"].push({
              id: d.id,
              docNum: `PAYROLL-${mKey}`,
              name: "Total Payroll Expense",
              department: "HRD",
              description: "Total akumulasi payroll bulanan",
              amount: totalExp,
              date: `${yr}-${mKey}`,
              source: "Payroll",
              paymentStatus: "paid",
            });
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

        // Pastikan ada rincian audit jika Base Fee atau Incentive Fee terhitung otomatis
        if (x.nonOpBaseFee > 0 && (!x.breakdown.nonOpBaseFee || x.breakdown.nonOpBaseFee.length === 0)) {
          if (!x.breakdown.nonOpBaseFee) x.breakdown.nonOpBaseFee = [];
          x.breakdown.nonOpBaseFee.push({
            id: `mgmt-fee-${k}`,
            docNum: "AUTO-MGMT",
            name: `Exp. Management Fees (Base Fee ${mgmtPercent}%)`,
            department: "Non-Operating",
            description: `Dihitung otomatis sistem: ${mgmtPercent}% x Total Pendapatan (Rp ${x.totalRevenue.toLocaleString("id-ID")})`,
            amount: x.nonOpBaseFee,
            date: `${yr}-${k}`,
            source: "Expense",
            paymentStatus: "paid"
          });
        }

        if (x.nonOpIncentiveFee > 0 && (!x.breakdown.nonOpIncentiveFee || x.breakdown.nonOpIncentiveFee.length === 0)) {
          if (!x.breakdown.nonOpIncentiveFee) x.breakdown.nonOpIncentiveFee = [];
          x.breakdown.nonOpIncentiveFee.push({
            id: `incentive-fee-${k}`,
            docNum: "AUTO-INCENTIVE",
            name: `Exp. Incentive Fees (${incPercent}%)`,
            department: "Non-Operating",
            description: `Dihitung otomatis sistem: ${incPercent}% x GOP (Rp ${gop.toLocaleString("id-ID")})`,
            amount: x.nonOpIncentiveFee,
            date: `${yr}-${k}`,
            source: "Expense",
            paymentStatus: "paid"
          });
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

  const effectiveHotelCode = useMemo(() => {
    let code = activeHotelCode;
    if (!code && typeof window !== "undefined") {
      code = localStorage.getItem("active_hotel_code") || "";
    }
    return code || "";
  }, [activeHotelCode]);

  const reloadData = useCallback(async () => {
    if (!effectiveHotelCode) return;
    setLoading(true);
    await fetchRoomCount(effectiveHotelCode);
    const bDoc = await fetchBudget(selectedYear, effectiveHotelCode);
    await fetchActuals(selectedYear, effectiveHotelCode, bDoc);
    setLoading(false);
  }, [effectiveHotelCode, selectedYear, fetchRoomCount, fetchBudget, fetchActuals]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  return {
    hotelCode: effectiveHotelCode || activeHotelCode,
    hotelName: activeHotelName || "BUMI ANYOM RESORT",
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
