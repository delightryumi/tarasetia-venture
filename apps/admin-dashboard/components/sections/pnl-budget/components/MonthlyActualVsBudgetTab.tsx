"use client";

import React, { useState } from "react";
import { formatIDR } from "@/lib/pnl-utils";
import { YearlyBudgetDocument, BudgetMonthData, createDefaultBudgetMonthData } from "@/lib/budget-types";
import { ArrowUpRight, ArrowDownRight, Minus, Calendar, TrendingUp } from "lucide-react";
import { AuditDetailModal } from "./AuditDetailModal";
import { ActualBreakdownItem } from "../hooks/usePNLBudget";
import styles from "../pnl-budget.module.css";

interface MonthlyActualVsBudgetTabProps {
  year: number;
  monthKey: string;
  budgetDoc: YearlyBudgetDocument | null;
  actualData: any;
  allActualMonthlyData?: Record<string, any>;
  hotelRoomCount: number;
}

const MONTH_NAMES = [
  { key: "01", name: "Januari" },
  { key: "02", name: "Februari" },
  { key: "03", name: "Maret" },
  { key: "04", name: "April" },
  { key: "05", name: "Mei" },
  { key: "06", name: "Juni" },
  { key: "07", name: "Juli" },
  { key: "08", name: "Agustus" },
  { key: "09", name: "September" },
  { key: "10", name: "Oktober" },
  { key: "11", name: "November" },
  { key: "12", name: "Desember" },
];

export const MonthlyActualVsBudgetTab: React.FC<MonthlyActualVsBudgetTabProps> = ({
  year,
  monthKey,
  budgetDoc,
  actualData,
  allActualMonthlyData = {},
  hotelRoomCount,
}) => {
  const [mode, setMode] = useState<"mtd" | "ytd">("mtd");
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    code: string;
    title: string;
    actualAmount: number;
    budgetAmount: number;
    items: ActualBreakdownItem[];
    isCostOrExpense: boolean;
  }>({
    isOpen: false,
    code: "",
    title: "",
    actualAmount: 0,
    budgetAmount: 0,
    items: [],
    isCostOrExpense: true,
  });

  const monthNum = parseInt(monthKey, 10);
  const monthName = MONTH_NAMES.find((m) => m.key === monthKey)?.name || "Bulan";

  const handleOpenDetail = (
    code: string,
    title: string,
    bucketKeys: string | string[],
    aAmt: number,
    bAmt: number,
    isCostOrExpense: boolean = true
  ) => {
    const keys = Array.isArray(bucketKeys) ? bucketKeys : [bucketKeys];
    let collectedItems: ActualBreakdownItem[] = [];

    if (mode === "mtd") {
      keys.forEach((k) => {
        if (actualData?.breakdown?.[k]) {
          collectedItems = collectedItems.concat(actualData.breakdown[k]);
        }
      });
    } else {
      // YTD: kumpulkan dari bulan 1 sampai monthNum
      for (let m = 1; m <= monthNum; m++) {
        const mKey = String(m).padStart(2, "0");
        const monthActual = allActualMonthlyData[mKey];
        if (monthActual?.breakdown) {
          keys.forEach((k) => {
            if (monthActual.breakdown[k]) {
              collectedItems = collectedItems.concat(monthActual.breakdown[k]);
            }
          });
        }
      }
    }

    setDetailModal({
      isOpen: true,
      code,
      title,
      actualAmount: aAmt,
      budgetAmount: bAmt,
      items: collectedItems,
      isCostOrExpense,
    });
  };

  // Compute MTD and YTD values
  let roomsAvail = 0;
  let budgetRoomsSold = 0;
  let budgetPax = 0;
  let budgetOcc = 0;
  let budgetArr = 0;
  let budgetRevPar = 0;

  let actualRoomsSold = 0;
  let actualPax = 0;
  let actualOcc = 0;
  let actualArr = 0;
  let actualRevPar = 0;

  let bRoomRev = 0;
  let aRoomRev = 0;
  let bFnbRev = 0;
  let aFnbRev = 0;
  let bModRev = 0;
  let aModRev = 0;
  let bOtherInc = 0;
  let aOtherInc = 0;
  let bTotNetRev = 0;
  let aTotNetRev = 0;

  let bRoomCogs = 0;
  let aRoomCogs = 0;
  let bFnbCogs = 0;
  let aFnbCogs = 0;
  let bModCogs = 0;
  let aModCogs = 0;
  let bTotCogs = 0;
  let aTotCogs = 0;

  let bRoomExp = 0;
  let aRoomExp = 0;
  let bFnbExp = 0;
  let aFnbExp = 0;
  let bModExp = 0;
  let aModExp = 0;
  let bTotDeptExp = 0;
  let aTotDeptExp = 0;

  let bAgExp = 0;
  let aAgExp = 0;
  let bHrdExp = 0;
  let aHrdExp = 0;
  let bSmExp = 0;
  let aSmExp = 0;
  let bPomecExp = 0;
  let aPomecExp = 0;
  let bTotUoe = 0;
  let aTotUoe = 0;

  let bNonOp = 0;
  let aNonOp = 0;
  let bNonOpBaseFee = 0;
  let aNonOpBaseFee = 0;
  let bNonOpIncentiveFee = 0;
  let aNonOpIncentiveFee = 0;
  let bNonOpFranchiseFee = 0;
  let aNonOpFranchiseFee = 0;
  let bNonOpInsurance = 0;
  let aNonOpInsurance = 0;
  let bNonOpPropertyTax = 0;
  let aNonOpPropertyTax = 0;
  let bNonOpBankInterest = 0;
  let aNonOpBankInterest = 0;
  let bNonOpDepreciation = 0;
  let aNonOpDepreciation = 0;

  if (mode === "mtd") {
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    roomsAvail = hotelRoomCount * daysInMonth;

    const mBudget: BudgetMonthData =
      budgetDoc?.months?.[monthKey] || createDefaultBudgetMonthData();
    const mA = actualData || allActualMonthlyData[monthKey] || {};

    budgetRoomsSold = mBudget.statistic?.occupiedRoomsPaid || 0;
    budgetPax = mBudget.statistic?.totalPax || mBudget.statistic?.payingPax || budgetRoomsSold;
    budgetOcc = mBudget.statistic?.occupancyPercent || 0;
    budgetArr = mBudget.statistic?.arrIdr || 0;
    budgetRevPar = roomsAvail > 0 ? (mBudget.summaryPnl?.roomRevenue || 0) / roomsAvail : 0;

    actualRoomsSold = mA.occupiedRooms || 0;
    actualPax = mA.totalPax || mA.payingPax || actualRoomsSold;
    actualOcc = roomsAvail > 0 ? (actualRoomsSold / roomsAvail) * 100 : 0;
    actualArr = actualRoomsSold > 0 ? (mA.roomRevenue || 0) / actualRoomsSold : 0;
    actualRevPar = roomsAvail > 0 ? (mA.roomRevenue || 0) / roomsAvail : 0;

    bRoomRev = mBudget.summaryPnl?.roomRevenue || mBudget.roomRevenue?.totalRoomRevenue || 0;
    aRoomRev = mA.roomRevenue || 0;
    bFnbRev = mBudget.summaryPnl?.fnbRevenue || mBudget.fnbRevenue?.totalFnBRevenue || 0;
    aFnbRev = mA.fnbRevenue || 0;
    bModRev = mBudget.summaryPnl?.modRevenue || mBudget.minorOperatingRevenue?.totalMinorOperatingRevenue || 0;
    aModRev = mA.modRevenue || 0;
    bOtherInc = mBudget.deptMod?.otherIncome?.revenue?.total || 0;
    aOtherInc = mA.otherIncome || 0;
    bTotNetRev = mBudget.summaryPnl?.totalNetRevenue || mBudget.netRevenue || (bRoomRev + bFnbRev + bModRev + bOtherInc);
    aTotNetRev = aRoomRev + aFnbRev + aModRev + aOtherInc;

    bRoomCogs = mBudget.summaryPnl?.roomCogs || 0;
    aRoomCogs = mA.roomCogs || 0;
    bFnbCogs = mBudget.summaryPnl?.fnbCogs || 0;
    aFnbCogs = mA.fnbCogs || 0;
    bModCogs = mBudget.summaryPnl?.modCogs || 0;
    aModCogs = mA.modCogs || 0;
    bTotCogs = mBudget.summaryPnl?.totalCogs || (bRoomCogs + bFnbCogs + bModCogs);
    aTotCogs = aRoomCogs + aFnbCogs + aModCogs;

    bRoomExp = mBudget.summaryPnl?.roomExpenses || 0;
    aRoomExp = mA.roomExp || 0;
    bFnbExp = mBudget.summaryPnl?.fnbExpenses || 0;
    aFnbExp = mA.fnbExp || 0;
    bModExp = mBudget.summaryPnl?.modExpenses || 0;
    aModExp = mA.modExp || 0;
    bTotDeptExp = mBudget.summaryPnl?.totalDepartmentalExpenses || (bRoomExp + bFnbExp + bModExp);
    aTotDeptExp = aRoomExp + aFnbExp + aModExp;

    bAgExp = mBudget.summaryPnl?.agExpenses || mBudget.deptAg?.totalExpenses || 0;
    aAgExp = mA.agExp || 0;
    bHrdExp = mBudget.summaryPnl?.hrdExpenses || mBudget.deptHrd?.totalExpenses || 0;
    aHrdExp = mA.hrdExp || 0;
    bSmExp = mBudget.summaryPnl?.smExpenses || mBudget.deptSm?.totalExpenses || 0;
    aSmExp = mA.smExp || 0;
    bPomecExp = mBudget.summaryPnl?.pomecExpenses || mBudget.deptPomec?.totalExpenses || 0;
    aPomecExp = mA.pomecExp || 0;
    bTotUoe = mBudget.summaryPnl?.totalUndistributedExpenses || (bAgExp + bHrdExp + bSmExp + bPomecExp);
    aTotUoe = aAgExp + aHrdExp + aSmExp + aPomecExp;

    bNonOpBaseFee = mBudget.deptNonOp?.managementBaseFee || 0;
    aNonOpBaseFee = mA.nonOpBaseFee || 0;
    bNonOpIncentiveFee = mBudget.deptNonOp?.managementIncentiveFee || 0;
    aNonOpIncentiveFee = mA.nonOpIncentiveFee || 0;
    bNonOpFranchiseFee = mBudget.deptNonOp?.franchiseRoyaltyFee || 0;
    aNonOpFranchiseFee = mA.nonOpFranchiseFee || 0;
    bNonOpInsurance = mBudget.deptNonOp?.buildingInsurance || 0;
    aNonOpInsurance = mA.nonOpInsurance || 0;
    bNonOpPropertyTax = mBudget.deptNonOp?.propertyTaxPbb || 0;
    aNonOpPropertyTax = mA.nonOpPropertyTax || 0;
    bNonOpBankInterest = mBudget.deptNonOp?.bankInterestCharges || 0;
    aNonOpBankInterest = mA.nonOpBankInterest || 0;
    bNonOpDepreciation = mBudget.deptNonOp?.depreciationAmortization || 0;
    aNonOpDepreciation = mA.nonOpDepreciation || 0;

    bNonOp = mBudget.summaryPnl?.nonOperatingExpenses || (bNonOpBaseFee + bNonOpIncentiveFee + bNonOpFranchiseFee + bNonOpInsurance + bNonOpPropertyTax + bNonOpBankInterest + bNonOpDepreciation);
    aNonOp = (mA.nonOp || 0) > 0 ? mA.nonOp : (aNonOpBaseFee + aNonOpIncentiveFee + aNonOpFranchiseFee + aNonOpInsurance + aNonOpPropertyTax + aNonOpBankInterest + aNonOpDepreciation);
  } else {
    // YTD Mode (Months 1 to monthNum)
    for (let m = 1; m <= monthNum; m++) {
      const k = String(m).padStart(2, "0");
      const days = new Date(year, m, 0).getDate();
      roomsAvail += hotelRoomCount * days;

      const mB = budgetDoc?.months?.[k];
      if (mB) {
        budgetRoomsSold += mB.statistic?.occupiedRoomsPaid || 0;
        budgetPax += mB.statistic?.totalPax || mB.statistic?.payingPax || (mB.statistic?.occupiedRoomsPaid || 0);
        bRoomRev += mB.summaryPnl?.roomRevenue || 0;
        bFnbRev += mB.summaryPnl?.fnbRevenue || 0;
        bModRev += mB.summaryPnl?.modRevenue || 0;
        bOtherInc += mB.deptMod?.otherIncome?.revenue?.total || 0;
        bTotNetRev += mB.summaryPnl?.totalNetRevenue || 0;
        bRoomCogs += mB.summaryPnl?.roomCogs || 0;
        bFnbCogs += mB.summaryPnl?.fnbCogs || 0;
        bModCogs += mB.summaryPnl?.modCogs || 0;
        bTotCogs += mB.summaryPnl?.totalCogs || 0;
        bRoomExp += mB.summaryPnl?.roomExpenses || 0;
        bFnbExp += mB.summaryPnl?.fnbExpenses || 0;
        bModExp += mB.summaryPnl?.modExpenses || 0;
        bTotDeptExp += mB.summaryPnl?.totalDepartmentalExpenses || 0;
        bAgExp += mB.summaryPnl?.agExpenses || 0;
        bHrdExp += mB.summaryPnl?.hrdExpenses || 0;
        bSmExp += mB.summaryPnl?.smExpenses || 0;
        bPomecExp += mB.summaryPnl?.pomecExpenses || 0;
        bTotUoe += mB.summaryPnl?.totalUndistributedExpenses || 0;
        bNonOpBaseFee += mB.deptNonOp?.managementBaseFee || 0;
        bNonOpIncentiveFee += mB.deptNonOp?.managementIncentiveFee || 0;
        bNonOpFranchiseFee += mB.deptNonOp?.franchiseRoyaltyFee || 0;
        bNonOpInsurance += mB.deptNonOp?.buildingInsurance || 0;
        bNonOpPropertyTax += mB.deptNonOp?.propertyTaxPbb || 0;
        bNonOpBankInterest += mB.deptNonOp?.bankInterestCharges || 0;
        bNonOpDepreciation += mB.deptNonOp?.depreciationAmortization || 0;
        bNonOp += mB.summaryPnl?.nonOperatingExpenses || mB.deptNonOp?.total || 0;
      }

      const mA = allActualMonthlyData[k] || {};
      actualRoomsSold += mA.occupiedRooms || 0;
      actualPax += mA.totalPax || mA.payingPax || (mA.occupiedRooms || 0);
      aRoomRev += mA.roomRevenue || 0;
      aFnbRev += mA.fnbRevenue || 0;
      aModRev += mA.modRevenue || 0;
      aOtherInc += mA.otherIncome || 0;
      aTotNetRev += (mA.roomRevenue || 0) + (mA.fnbRevenue || 0) + (mA.modRevenue || 0) + (mA.otherIncome || 0);
      aRoomCogs += mA.roomCogs || 0;
      aFnbCogs += mA.fnbCogs || 0;
      aModCogs += mA.modCogs || 0;
      aTotCogs += (mA.roomCogs || 0) + (mA.fnbCogs || 0) + (mA.modCogs || 0);
      aRoomExp += mA.roomExp || 0;
      aFnbExp += mA.fnbExp || 0;
      aModExp += mA.modExp || 0;
      aTotDeptExp += (mA.roomExp || 0) + (mA.fnbExp || 0) + (mA.modExp || 0);
      aAgExp += mA.agExp || 0;
      aHrdExp += mA.hrdExp || 0;
      aSmExp += mA.smExp || 0;
      aPomecExp += mA.pomecExp || 0;
      aTotUoe += (mA.agExp || 0) + (mA.hrdExp || 0) + (mA.smExp || 0) + (mA.pomecExp || 0);
      aNonOpBaseFee += mA.nonOpBaseFee || 0;
      aNonOpIncentiveFee += mA.nonOpIncentiveFee || 0;
      aNonOpFranchiseFee += mA.nonOpFranchiseFee || 0;
      aNonOpInsurance += mA.nonOpInsurance || 0;
      aNonOpPropertyTax += mA.nonOpPropertyTax || 0;
      aNonOpBankInterest += mA.nonOpBankInterest || 0;
      aNonOpDepreciation += mA.nonOpDepreciation || 0;
      aNonOp += mA.nonOp || 0;
    }

    budgetOcc = roomsAvail > 0 ? (budgetRoomsSold / roomsAvail) * 100 : 0;
    budgetArr = budgetRoomsSold > 0 ? bRoomRev / budgetRoomsSold : 0;
    budgetRevPar = roomsAvail > 0 ? bRoomRev / roomsAvail : 0;

    actualOcc = roomsAvail > 0 ? (actualRoomsSold / roomsAvail) * 100 : 0;
    actualArr = actualRoomsSold > 0 ? aRoomRev / actualRoomsSold : 0;
    actualRevPar = roomsAvail > 0 ? aRoomRev / roomsAvail : 0;
  }

  const bGrossProfit = bTotNetRev - bTotCogs;
  const aGrossProfit = aTotNetRev - aTotCogs;

  const bTdp = bGrossProfit - bTotDeptExp;
  const aTdp = aGrossProfit - aTotDeptExp;

  const bGop = bTdp - bTotUoe;
  const aGop = aTdp - aTotUoe;

  const bNoi = bGop - bNonOp;
  const aNoi = aGop - aNonOp;

  const renderVarCell = (
    actual: number,
    budget: number,
    isExpense: boolean = false,
    isCurrency: boolean = true
  ) => {
    const diff = isExpense ? budget - actual : actual - budget;
    const diffVal = actual - budget;
    const pct = budget !== 0 ? (diffVal / Math.abs(budget)) * 100 : 0;
    const isFavorable = diff >= 0;

    return (
      <>
        <td
          className={styles.colVariance}
          style={{ color: isFavorable ? "#16a34a" : "#dc2626" }}
        >
          {diffVal > 0 ? "+" : ""}
          {isCurrency ? formatIDR(diffVal) : diffVal.toLocaleString("id-ID")}
        </td>
        <td
          className={styles.colPercent}
          style={{ color: isFavorable ? "#16a34a" : "#dc2626" }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
            {pct > 0 ? (
              <ArrowUpRight size={13} />
            ) : pct < 0 ? (
              <ArrowDownRight size={13} />
            ) : (
              <Minus size={13} />
            )}
            {pct.toFixed(1)}%
          </span>
        </td>
      </>
    );
  };

  const periodLabel =
    mode === "mtd"
      ? `${monthName.toUpperCase()} ${year}`
      : `YTD (JANUARI – ${monthName.toUpperCase()}) ${year}`;

  return (
    <div className={styles.excelCard}>
      {/* Banner with Mode Switcher (MTD vs YTD) */}
      <div className={styles.excelSheetBanner}>
        <div className={styles.excelSheetTitleGroup}>
          <span className={styles.excelSheetBadge}>
            {mode === "mtd" ? "MONTHLY (MTD)" : "YEAR-TO-DATE (YTD)"}
          </span>
          <span className={styles.excelSheetTitle}>
            LAPORAN LABA RUGI USALI — {periodLabel}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "2px",
              backgroundColor: "#e2e8f0",
              borderRadius: "8px",
            }}
          >
            <button
              onClick={() => setMode("mtd")}
              style={{
                border: "none",
                background: mode === "mtd" ? "#ffffff" : "transparent",
                color: mode === "mtd" ? "#0f172a" : "#64748b",
                fontWeight: 800,
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: mode === "mtd" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Bulan Ini (MTD)
            </button>
            <button
              onClick={() => setMode("ytd")}
              style={{
                border: "none",
                background: mode === "ytd" ? "#ffffff" : "transparent",
                color: mode === "ytd" ? "#0f172a" : "#64748b",
                fontWeight: 800,
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: mode === "ytd" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Kumulatif (YTD)
            </button>
          </div>
        </div>
      </div>

      <div className={styles.excelTableContainer}>
        <table className={styles.excelTable}>
          <thead>
            <tr>
              <th className={styles.colCode}>KODE</th>
              <th className={styles.colDesc}>DESKRIPSI AKUN USALI</th>
              <th className={styles.colAmount} style={{ background: "#e0f2fe", color: "#0369a1" }}>
                ACTUAL ({mode === "mtd" ? monthName.slice(0, 3) : `YTD ${monthName.slice(0, 3)}`})
              </th>
              <th className={styles.colAmount} style={{ background: "#f1f5f9" }}>
                BUDGET ({mode === "mtd" ? monthName.slice(0, 3) : `YTD ${monthName.slice(0, 3)}`})
              </th>
              <th className={styles.colVariance}>VARIANCE (RP)</th>
              <th className={styles.colPercent}>VAR (%)</th>
            </tr>
          </thead>
          <tbody>
            {/* ── 1. OPERATING STATISTICS ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>STAT</td>
              <td colSpan={5}>1. STATISTIK OPERASIONAL HOTEL (TAMU & KAMAR REAL)</td>
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-01</td>
              <td className={styles.colDesc}>Rooms Available (Kamar Tersedia)</td>
              <td className={styles.colAmount}>{roomsAvail}</td>
              <td className={styles.colAmount}>{roomsAvail}</td>
              <td className={styles.colVariance} style={{ color: "#78716c" }}>0</td>
              <td className={styles.colPercent} style={{ color: "#78716c" }}>0.0%</td>
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-02</td>
              <td className={styles.colDesc}>Rooms Sold (Kamar Terjual)</td>
              <td className={styles.colAmount} style={{ fontWeight: 800, color: "#2563eb" }}>{actualRoomsSold}</td>
              <td className={styles.colAmount}>{budgetRoomsSold}</td>
              {renderVarCell(actualRoomsSold, budgetRoomsSold, false, false)}
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-03</td>
              <td className={styles.colDesc}>Total Guest Pax (Jumlah Tamu Real)</td>
              <td className={styles.colAmount} style={{ fontWeight: 800, color: "#059669" }}>{actualPax}</td>
              <td className={styles.colAmount}>{budgetPax}</td>
              {renderVarCell(actualPax, budgetPax, false, false)}
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-04</td>
              <td className={styles.colDesc}>Occupancy Rate (%)</td>
              <td className={styles.colAmount} style={{ fontWeight: 800, color: "#2563eb" }}>{actualOcc.toFixed(1)}%</td>
              <td className={styles.colAmount}>{budgetOcc.toFixed(1)}%</td>
              <td className={styles.colVariance} style={{ color: actualOcc >= budgetOcc ? "#16a34a" : "#dc2626" }}>
                {(actualOcc - budgetOcc).toFixed(1)}% pts
              </td>
              <td className={styles.colPercent} style={{ color: actualOcc >= budgetOcc ? "#16a34a" : "#dc2626" }}>
                {budgetOcc > 0 ? (((actualOcc - budgetOcc) / budgetOcc) * 100).toFixed(1) : "0.0"}%
              </td>
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-05</td>
              <td className={styles.colDesc}>Average Room Rate (ARR)</td>
              <td className={styles.colAmount}>{formatIDR(actualArr)}</td>
              <td className={styles.colAmount}>{formatIDR(budgetArr)}</td>
              {renderVarCell(actualArr, budgetArr)}
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-06</td>
              <td className={styles.colDesc}>RevPAR (Revenue Per Available Room)</td>
              <td className={styles.colAmount}>{formatIDR(actualRevPar)}</td>
              <td className={styles.colAmount}>{formatIDR(budgetRevPar)}</td>
              {renderVarCell(actualRevPar, budgetRevPar)}
            </tr>

            {/* ── 2. OPERATING REVENUE ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>3000</td>
              <td colSpan={5}>2. PENDAPATAN OPERASIONAL (OPERATING REVENUE)</td>
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("3013", "Room Revenue (Kamar)", "roomRevenue", aRoomRev, bRoomRev, false)}
              title="Klik untuk melihat rincian pendapatan kamar"
            >
              <td className={styles.colCode}>3013</td>
              <td className={styles.colDesc}>
                Room Revenue (Kamar)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aRoomRev)}</td>
              <td className={styles.colAmount}>{formatIDR(bRoomRev)}</td>
              {renderVarCell(aRoomRev, bRoomRev)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("3023", "Food & Beverage Revenue", "fnbRevenue", aFnbRev, bFnbRev, false)}
              title="Klik untuk melihat rincian pendapatan resto & bar"
            >
              <td className={styles.colCode}>3023</td>
              <td className={styles.colDesc}>
                Food & Beverage Revenue
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aFnbRev)}</td>
              <td className={styles.colAmount}>{formatIDR(bFnbRev)}</td>
              {renderVarCell(aFnbRev, bFnbRev)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("3033", "Minor Operating Departments (Laundry, Spa)", "modRevenue", aModRev, bModRev, false)}
              title="Klik untuk melihat rincian pendapatan laundry & spa"
            >
              <td className={styles.colCode}>3033</td>
              <td className={styles.colDesc}>
                Minor Operating Departments (Laundry, Spa)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aModRev)}</td>
              <td className={styles.colAmount}>{formatIDR(bModRev)}</td>
              {renderVarCell(aModRev, bModRev)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("3043", "Other Income (Space Rental, Transport, Misc)", "otherIncome", aOtherInc, bOtherInc, false)}
              title="Klik untuk melihat rincian pendapatan lain-lain"
            >
              <td className={styles.colCode}>3043</td>
              <td className={styles.colDesc}>
                Other Income (Space Rental, Transport, Misc)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aOtherInc)}</td>
              <td className={styles.colAmount}>{formatIDR(bOtherInc)}</td>
              {renderVarCell(aOtherInc, bOtherInc)}
            </tr>
            <tr
              className={`${styles.subTotalRow} ${styles.clickableRow}`}
              onClick={() => handleOpenDetail("3999", "TOTAL OPERATING REVENUE", ["roomRevenue", "fnbRevenue", "modRevenue", "otherIncome"], aTotNetRev, bTotNetRev, false)}
              title="Klik untuk melihat seluruh rincian pendapatan operasional"
            >
              <td className={styles.colCode}>3999</td>
              <td className={styles.colDesc}>
                TOTAL OPERATING REVENUE
                <span className={styles.inspectHint}>🔍 Semua Pendapatan</span>
              </td>
              <td className={styles.colAmount} style={{ color: "#0284c7" }}>{formatIDR(aTotNetRev)}</td>
              <td className={styles.colAmount}>{formatIDR(bTotNetRev)}</td>
              {renderVarCell(aTotNetRev, bTotNetRev)}
            </tr>

            {/* ── 3. COST OF SALES ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>4000</td>
              <td colSpan={5}>3. HARGA POKOK PENJUALAN (COST OF SALES)</td>
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("4014", "Cost of Rooms (Guest Supplies, Linen)", "roomCogs", aRoomCogs, bRoomCogs, true)}
              title="Klik untuk melihat rincian transaksi dokumen"
            >
              <td className={styles.colCode}>4014</td>
              <td className={styles.colDesc}>
                Cost of Rooms (Guest Supplies, Linen)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aRoomCogs)}</td>
              <td className={styles.colAmount}>{formatIDR(bRoomCogs)}</td>
              {renderVarCell(aRoomCogs, bRoomCogs, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("4024", "Cost of F&B (Food & Beverage Ingredients)", "fnbCogs", aFnbCogs, bFnbCogs, true)}
              title="Klik untuk melihat rincian transaksi dokumen (SR, DML, PR)"
            >
              <td className={styles.colCode}>4024</td>
              <td className={styles.colDesc}>
                Cost of F&B (Food & Beverage Ingredients)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aFnbCogs)}</td>
              <td className={styles.colAmount}>{formatIDR(bFnbCogs)}</td>
              {renderVarCell(aFnbCogs, bFnbCogs, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("4034", "Cost of Minor Departments", "modCogs", aModCogs, bModCogs, true)}
              title="Klik untuk melihat rincian transaksi dokumen"
            >
              <td className={styles.colCode}>4034</td>
              <td className={styles.colDesc}>
                Cost of Minor Departments
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aModCogs)}</td>
              <td className={styles.colAmount}>{formatIDR(bModCogs)}</td>
              {renderVarCell(aModCogs, bModCogs, true)}
            </tr>
            <tr
              className={`${styles.subTotalRow} ${styles.clickableRow}`}
              onClick={() => handleOpenDetail("4999", "TOTAL COST OF SALES", ["roomCogs", "fnbCogs", "modCogs"], aTotCogs, bTotCogs, true)}
              title="Klik untuk melihat semua rincian HPP (Cost of Sales)"
            >
              <td className={styles.colCode}>4999</td>
              <td className={styles.colDesc}>
                TOTAL COST OF SALES
                <span className={styles.inspectHint}>🔍 Semua COGS</span>
              </td>
              <td className={styles.colAmount} style={{ color: "#e11d48" }}>{formatIDR(aTotCogs)}</td>
              <td className={styles.colAmount}>{formatIDR(bTotCogs)}</td>
              {renderVarCell(aTotCogs, bTotCogs, true)}
            </tr>
            <tr
              className={`${styles.subTotalRow} ${styles.clickableRow}`}
              style={{ background: "#f0fdf4" }}
              onClick={() => handleOpenDetail("4990", "GROSS PROFIT (Pendapatan - HPP)", ["roomRevenue", "fnbRevenue", "modRevenue", "otherIncome", "roomCogs", "fnbCogs", "modCogs"], aGrossProfit, bGrossProfit, false)}
              title="Klik untuk melihat rincian pembentuk Laba Kotor"
            >
              <td className={styles.colCode}>4990</td>
              <td className={styles.colDesc} style={{ color: "#166534" }}>
                GROSS PROFIT
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount} style={{ color: "#16a34a" }}>{formatIDR(aGrossProfit)}</td>
              <td className={styles.colAmount}>{formatIDR(bGrossProfit)}</td>
              {renderVarCell(aGrossProfit, bGrossProfit)}
            </tr>

            {/* ── 4. DEPARTMENTAL OPERATING EXPENSES ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>5000</td>
              <td colSpan={5}>4. BIAYA OPERASIONAL DEPARTEMEN (DEPARTMENTAL EXPENSES)</td>
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("5015", "Room Department (FO & HK Payroll & Expenses)", "roomExp", aRoomExp, bRoomExp, true)}
              title="Klik untuk melihat rincian biaya Room Dept"
            >
              <td className={styles.colCode}>5015</td>
              <td className={styles.colDesc}>
                Room Department (FO & HK Payroll & Expenses)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aRoomExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bRoomExp)}</td>
              {renderVarCell(aRoomExp, bRoomExp, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("5025", "Food & Beverage Department Expenses", "fnbExp", aFnbExp, bFnbExp, true)}
              title="Klik untuk melihat rincian biaya F&B Dept"
            >
              <td className={styles.colCode}>5025</td>
              <td className={styles.colDesc}>
                Food & Beverage Department Expenses
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aFnbExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bFnbExp)}</td>
              {renderVarCell(aFnbExp, bFnbExp, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("5035", "Minor Operating Department Expenses", "modExp", aModExp, bModExp, true)}
              title="Klik untuk melihat rincian biaya MOD"
            >
              <td className={styles.colCode}>5035</td>
              <td className={styles.colDesc}>
                Minor Operating Department Expenses
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aModExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bModExp)}</td>
              {renderVarCell(aModExp, bModExp, true)}
            </tr>
            <tr
              className={`${styles.subTotalRow} ${styles.clickableRow}`}
              onClick={() => handleOpenDetail("5999", "TOTAL DEPARTMENTAL PROFIT (TDP)", ["roomExp", "fnbExp", "modExp"], aTdp, bTdp, false)}
              title="Klik untuk melihat rincian biaya operasional departemen"
            >
              <td className={styles.colCode}>5999</td>
              <td className={styles.colDesc}>
                TOTAL DEPARTMENTAL PROFIT (TDP)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount} style={{ color: "#2563eb" }}>{formatIDR(aTdp)}</td>
              <td className={styles.colAmount}>{formatIDR(bTdp)}</td>
              {renderVarCell(aTdp, bTdp)}
            </tr>

            {/* ── 5. UNDISTRIBUTED OPERATING EXPENSES ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>6000</td>
              <td colSpan={5}>5. BIAYA TIDAK TERDISTRIBUSI (UNDISTRIBUTED EXPENSES)</td>
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("6015", "Administration & General (A&G)", "agExp", aAgExp, bAgExp, true)}
              title="Klik untuk melihat rincian biaya A&G"
            >
              <td className={styles.colCode}>6015</td>
              <td className={styles.colDesc}>
                Administration & General (A&G)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aAgExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bAgExp)}</td>
              {renderVarCell(aAgExp, bAgExp, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("6025", "Human Resources (HRD & Training)", "hrdExp", aHrdExp, bHrdExp, true)}
              title="Klik untuk melihat rincian biaya HRD"
            >
              <td className={styles.colCode}>6025</td>
              <td className={styles.colDesc}>
                Human Resources (HRD & Training)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aHrdExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bHrdExp)}</td>
              {renderVarCell(aHrdExp, bHrdExp, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("6035", "Sales & Marketing (SM & OTA Commissions)", "smExp", aSmExp, bSmExp, true)}
              title="Klik untuk melihat rincian biaya Sales & Marketing"
            >
              <td className={styles.colCode}>6035</td>
              <td className={styles.colDesc}>
                Sales & Marketing (SM & OTA Commissions)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aSmExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bSmExp)}</td>
              {renderVarCell(aSmExp, bSmExp, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("6045", "POMEC (Property Ops, Maintenance & Energy)", "pomecExp", aPomecExp, bPomecExp, true)}
              title="Klik untuk melihat rincian biaya POMEC"
            >
              <td className={styles.colCode}>6045</td>
              <td className={styles.colDesc}>
                POMEC (Property Ops, Maintenance & Energy)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aPomecExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bPomecExp)}</td>
              {renderVarCell(aPomecExp, bPomecExp, true)}
            </tr>
            <tr
              className={`${styles.subTotalRow} ${styles.clickableRow}`}
              onClick={() => handleOpenDetail("6999", "TOTAL UNDISTRIBUTED EXPENSES", ["agExp", "hrdExp", "smExp", "pomecExp"], aTotUoe, bTotUoe, true)}
              title="Klik untuk melihat semua rincian biaya tidak terdistribusi"
            >
              <td className={styles.colCode}>6999</td>
              <td className={styles.colDesc}>
                TOTAL UNDISTRIBUTED EXPENSES
                <span className={styles.inspectHint}>🔍 Semua UOE</span>
              </td>
              <td className={styles.colAmount} style={{ color: "#e11d48" }}>{formatIDR(aTotUoe)}</td>
              <td className={styles.colAmount}>{formatIDR(bTotUoe)}</td>
              {renderVarCell(aTotUoe, bTotUoe, true)}
            </tr>

            {/* ── 6. GROSS OPERATING PROFIT (GOP) ── */}
            <tr
              className={`${styles.gopRow} ${styles.clickableRow}`}
              onClick={() => handleOpenDetail("7000", "GROSS OPERATING PROFIT (GOP)", ["roomRevenue", "fnbRevenue", "modRevenue", "otherIncome", "roomCogs", "fnbCogs", "modCogs", "roomExp", "fnbExp", "modExp", "agExp", "hrdExp", "smExp", "pomecExp"], aGop, bGop, false)}
              title="Klik untuk melihat seluruh rincian laba operasional hotel"
            >
              <td className={styles.colCode}>7000</td>
              <td className={styles.colDesc}>
                GROSS OPERATING PROFIT (GOP)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount} style={{ color: aGop >= 0 ? "#1e40af" : "#dc2626" }}>
                {formatIDR(aGop)}
              </td>
              <td className={styles.colAmount}>{formatIDR(bGop)}</td>
              {renderVarCell(aGop, bGop)}
            </tr>

            {/* ── 7. NON-OPERATING EXPENSES & FEES ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>8000</td>
              <td colSpan={5}>6. BIAYA NON-OPERASIONAL & FEES (NON-OPERATING)</td>
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("8011", "Exp. Management Fees (Base Fee)", "nonOpBaseFee", aNonOpBaseFee, bNonOpBaseFee, true)}
            >
              <td className={styles.colCode}>8011</td>
              <td className={styles.colDesc}>
                Exp. Management Fees (Base Fee)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aNonOpBaseFee)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpBaseFee)}</td>
              {renderVarCell(aNonOpBaseFee, bNonOpBaseFee, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("8012", "Exp. Incentive Fees", "nonOpIncentiveFee", aNonOpIncentiveFee, bNonOpIncentiveFee, true)}
            >
              <td className={styles.colCode}>8012</td>
              <td className={styles.colDesc}>
                Exp. Incentive Fees
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aNonOpIncentiveFee)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpIncentiveFee)}</td>
              {renderVarCell(aNonOpIncentiveFee, bNonOpIncentiveFee, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("8013", "Exp. Franchise / Royalty Fee", "nonOpFranchiseFee", aNonOpFranchiseFee, bNonOpFranchiseFee, true)}
            >
              <td className={styles.colCode}>8013</td>
              <td className={styles.colDesc}>
                Exp. Franchise / Royalty Fee
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aNonOpFranchiseFee)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpFranchiseFee)}</td>
              {renderVarCell(aNonOpFranchiseFee, bNonOpFranchiseFee, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("8021", "Exp. Building & Property Insurance", "nonOpInsurance", aNonOpInsurance, bNonOpInsurance, true)}
            >
              <td className={styles.colCode}>8021</td>
              <td className={styles.colDesc}>
                Exp. Building & Property Insurance
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aNonOpInsurance)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpInsurance)}</td>
              {renderVarCell(aNonOpInsurance, bNonOpInsurance, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("8022", "Exp. Property Tax (PBB)", "nonOpPropertyTax", aNonOpPropertyTax, bNonOpPropertyTax, true)}
            >
              <td className={styles.colCode}>8022</td>
              <td className={styles.colDesc}>
                Exp. Property Tax (PBB)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aNonOpPropertyTax)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpPropertyTax)}</td>
              {renderVarCell(aNonOpPropertyTax, bNonOpPropertyTax, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("8031", "Exp. Bank Interest & Financing Charges", "nonOpBankInterest", aNonOpBankInterest, bNonOpBankInterest, true)}
            >
              <td className={styles.colCode}>8031</td>
              <td className={styles.colDesc}>
                Exp. Bank Interest & Financing Charges
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aNonOpBankInterest)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpBankInterest)}</td>
              {renderVarCell(aNonOpBankInterest, bNonOpBankInterest, true)}
            </tr>
            <tr
              className={styles.clickableRow}
              onClick={() => handleOpenDetail("8041", "Exp. Depreciation & Amortization", "nonOpDepreciation", aNonOpDepreciation, bNonOpDepreciation, true)}
            >
              <td className={styles.colCode}>8041</td>
              <td className={styles.colDesc}>
                Exp. Depreciation & Amortization
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount}>{formatIDR(aNonOpDepreciation)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpDepreciation)}</td>
              {renderVarCell(aNonOpDepreciation, bNonOpDepreciation, true)}
            </tr>
            <tr
              className={`${styles.subTotalRow} ${styles.clickableRow}`}
              onClick={() =>
                handleOpenDetail(
                  "8999",
                  "TOTAL OTHER NON-OPERATING EXPENSES",
                  [
                    "nonOpBaseFee",
                    "nonOpIncentiveFee",
                    "nonOpFranchiseFee",
                    "nonOpInsurance",
                    "nonOpPropertyTax",
                    "nonOpBankInterest",
                    "nonOpDepreciation",
                  ],
                  aNonOp,
                  bNonOp,
                  true
                )
              }
              title="Klik untuk melihat semua rincian biaya non-operasional"
            >
              <td className={styles.colCode}>8999</td>
              <td className={styles.colDesc}>
                TOTAL OTHER NON-OPERATING EXPENSES
                <span className={styles.inspectHint}>🔍 Semua Non-Op</span>
              </td>
              <td className={styles.colAmount} style={{ color: "#e11d48" }}>{formatIDR(aNonOp)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOp)}</td>
              {renderVarCell(aNonOp, bNonOp, true)}
            </tr>

            {/* ── 8. NET OPERATING INCOME (NOI) ── */}
            <tr
              className={`${styles.noiRow} ${styles.clickableRow}`}
              onClick={() =>
                handleOpenDetail(
                  "9000",
                  "NET OPERATING INCOME (NOI / NET PROFIT)",
                  [
                    "nonOpBaseFee",
                    "nonOpIncentiveFee",
                    "nonOpFranchiseFee",
                    "nonOpInsurance",
                    "nonOpPropertyTax",
                    "nonOpBankInterest",
                    "nonOpDepreciation",
                  ],
                  aNoi,
                  bNoi,
                  false
                )
              }
              title="Klik untuk melihat rincian biaya non-operasional & laba bersih"
            >
              <td className={styles.colCode}>9000</td>
              <td className={styles.colDesc}>
                NET OPERATING INCOME (NOI / NET PROFIT)
                <span className={styles.inspectHint}>🔍 Rincian</span>
              </td>
              <td className={styles.colAmount} style={{ color: aNoi >= 0 ? "#047857" : "#dc2626" }}>
                {formatIDR(aNoi)}
              </td>
              <td className={styles.colAmount}>{formatIDR(bNoi)}</td>
              {renderVarCell(aNoi, bNoi)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Audit Detail Modal */}
      <AuditDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal((prev) => ({ ...prev, isOpen: false }))}
        code={detailModal.code}
        title={detailModal.title}
        period={`${mode === "mtd" ? monthName : `Jan - ${monthName}`} ${year} (${mode.toUpperCase()})`}
        actualAmount={detailModal.actualAmount}
        budgetAmount={detailModal.budgetAmount}
        items={detailModal.items}
        isCostOrExpense={detailModal.isCostOrExpense}
      />
    </div>
  );
};
