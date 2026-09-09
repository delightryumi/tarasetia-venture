"use client";

import React from "react";
import { formatIDR } from "@/lib/pnl-utils";
import { YearlyBudgetDocument } from "@/lib/budget-types";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import styles from "../pnl-budget.module.css";

interface AnnualSummaryTabProps {
  year: number;
  budgetDoc: YearlyBudgetDocument | null;
  actualMonthlyData: Record<string, any>;
  hotelRoomCount: number;
}

export const AnnualSummaryTab: React.FC<AnnualSummaryTabProps> = ({
  year,
  budgetDoc,
  actualMonthlyData,
  hotelRoomCount,
}) => {
  // Aggregate Annual Totals (12 Months)
  let bRoomsAvail = 0;
  let bRoomsSold = 0;
  let bPax = 0;
  let bRoomRev = 0;
  let bFnbRev = 0;
  let bModRev = 0;
  let bOtherInc = 0;
  let bTotRev = 0;
  let bRoomCogs = 0;
  let bFnbCogs = 0;
  let bModCogs = 0;
  let bTotCogs = 0;
  let bRoomExp = 0;
  let bFnbExp = 0;
  let bModExp = 0;
  let bTotDeptExp = 0;
  let bAgExp = 0;
  let bHrdExp = 0;
  let bSmExp = 0;
  let bPomecExp = 0;
  let bTotUoe = 0;

  let aRoomsSold = 0;
  let aPax = 0;
  let aRoomRev = 0;
  let aFnbRev = 0;
  let aModRev = 0;
  let aOtherInc = 0;
  let aTotRev = 0;
  let aRoomCogs = 0;
  let aFnbCogs = 0;
  let aModCogs = 0;
  let aTotCogs = 0;
  let aRoomExp = 0;
  let aFnbExp = 0;
  let aModExp = 0;
  let aTotDeptExp = 0;
  let aAgExp = 0;
  let aHrdExp = 0;
  let aSmExp = 0;
  let aPomecExp = 0;
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

  for (let m = 1; m <= 12; m++) {
    const k = String(m).padStart(2, "0");
    const days = new Date(year, m, 0).getDate();
    bRoomsAvail += hotelRoomCount * days;

    const mB = budgetDoc?.months?.[k];
    if (mB) {
      bRoomsSold += mB.statistic?.occupiedRoomsPaid || 0;
      bPax += mB.statistic?.totalPax || mB.statistic?.payingPax || (mB.statistic?.occupiedRoomsPaid || 0);
      bRoomRev += mB.summaryPnl?.roomRevenue || 0;
      bFnbRev += mB.summaryPnl?.fnbRevenue || 0;
      bModRev += mB.summaryPnl?.modRevenue || 0;
      bOtherInc += mB.deptMod?.otherIncome?.revenue?.total || 0;
      bTotRev += mB.summaryPnl?.totalNetRevenue || 0;
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

    const mA = actualMonthlyData[k] || {};
    aRoomsSold += mA.occupiedRooms || 0;
    aPax += mA.totalPax || mA.payingPax || (mA.occupiedRooms || 0);
    aRoomRev += mA.roomRevenue || 0;
    aFnbRev += mA.fnbRevenue || 0;
    aModRev += mA.modRevenue || 0;
    aOtherInc += mA.otherIncome || 0;
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

  aTotRev = aRoomRev + aFnbRev + aModRev + aOtherInc;

  const bGrossProfit = bTotRev - bTotCogs;
  const aGrossProfit = aTotRev - aTotCogs;

  const bTdp = bGrossProfit - bTotDeptExp;
  const aTdp = aGrossProfit - aTotDeptExp;

  const bGop = bTdp - bTotUoe;
  const aGop = aTdp - aTotUoe;

  const bNoi = bGop - bNonOp;
  const aNoi = aGop - aNonOp;

  const bOcc = bRoomsAvail > 0 ? (bRoomsSold / bRoomsAvail) * 100 : 0;
  const aOcc = bRoomsAvail > 0 ? (aRoomsSold / bRoomsAvail) * 100 : 0;

  const bArr = bRoomsSold > 0 ? bRoomRev / bRoomsSold : 0;
  const aArr = aRoomsSold > 0 ? aRoomRev / aRoomsSold : 0;

  const bRevPar = bRoomsAvail > 0 ? bRoomRev / bRoomsAvail : 0;
  const aRevPar = bRoomsAvail > 0 ? aRoomRev / bRoomsAvail : 0;

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
        <td className={styles.colVariance} style={{ color: isFavorable ? "#16a34a" : "#dc2626" }}>
          {diffVal > 0 ? "+" : ""}
          {isCurrency ? formatIDR(diffVal) : diffVal.toLocaleString("id-ID")}
        </td>
        <td className={styles.colPercent} style={{ color: isFavorable ? "#16a34a" : "#dc2626" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
            {pct > 0 ? <ArrowUpRight size={13} /> : pct < 0 ? <ArrowDownRight size={13} /> : <Minus size={13} />}
            {pct.toFixed(1)}%
          </span>
        </td>
      </>
    );
  };

  return (
    <div className={styles.excelCard}>
      <div className={styles.excelSheetBanner}>
        <div className={styles.excelSheetTitleGroup}>
          <span className={styles.excelSheetBadge}>ANNUAL</span>
          <span className={styles.excelSheetTitle}>RINGKASAN TAHUNAN LABA RUGI — {year}</span>
        </div>
        <span className={styles.excelSheetTag}>Full Year Actual vs Budget</span>
      </div>

      <div className={styles.excelTableContainer}>
        <table className={styles.excelTable}>
          <thead>
            <tr>
              <th className={styles.colCode}>KODE</th>
              <th className={styles.colDesc}>DESKRIPSI AKUN USALI</th>
              <th className={styles.colAmount} style={{ background: "#e0f2fe", color: "#0369a1" }}>ACTUAL FULL YEAR</th>
              <th className={styles.colAmount} style={{ background: "#f1f5f9" }}>BUDGET FULL YEAR</th>
              <th className={styles.colVariance}>VARIANCE (RP)</th>
              <th className={styles.colPercent}>VAR (%)</th>
            </tr>
          </thead>
          <tbody>
            {/* ── 1. OPERATING STATISTICS ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>STAT</td>
              <td colSpan={5}>1. STATISTIK OPERASIONAL HOTEL TAHUNAN (TAMU & KAMAR REAL)</td>
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-01</td>
              <td className={styles.colDesc}>Rooms Available (Kamar Tersedia Tahunan)</td>
              <td className={styles.colAmount}>{bRoomsAvail}</td>
              <td className={styles.colAmount}>{bRoomsAvail}</td>
              <td className={styles.colVariance} style={{ color: "#78716c" }}>0</td>
              <td className={styles.colPercent} style={{ color: "#78716c" }}>0.0%</td>
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-02</td>
              <td className={styles.colDesc}>Rooms Sold (Kamar Terjual Tahunan)</td>
              <td className={styles.colAmount} style={{ fontWeight: 800, color: "#2563eb" }}>{aRoomsSold}</td>
              <td className={styles.colAmount}>{bRoomsSold}</td>
              {renderVarCell(aRoomsSold, bRoomsSold, false, false)}
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-03</td>
              <td className={styles.colDesc}>Total Guest Pax (Jumlah Tamu Real Tahunan)</td>
              <td className={styles.colAmount} style={{ fontWeight: 800, color: "#059669" }}>{aPax}</td>
              <td className={styles.colAmount}>{bPax}</td>
              {renderVarCell(aPax, bPax, false, false)}
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-04</td>
              <td className={styles.colDesc}>Occupancy Rate (%)</td>
              <td className={styles.colAmount} style={{ fontWeight: 800, color: "#2563eb" }}>{aOcc.toFixed(1)}%</td>
              <td className={styles.colAmount}>{bOcc.toFixed(1)}%</td>
              <td className={styles.colVariance} style={{ color: aOcc >= bOcc ? "#16a34a" : "#dc2626" }}>
                {(aOcc - bOcc).toFixed(1)}% pts
              </td>
              <td className={styles.colPercent} style={{ color: aOcc >= bOcc ? "#16a34a" : "#dc2626" }}>
                {bOcc > 0 ? (((aOcc - bOcc) / bOcc) * 100).toFixed(1) : "0.0"}%
              </td>
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-05</td>
              <td className={styles.colDesc}>Average Room Rate (ARR)</td>
              <td className={styles.colAmount}>{formatIDR(aArr)}</td>
              <td className={styles.colAmount}>{formatIDR(bArr)}</td>
              {renderVarCell(aArr, bArr)}
            </tr>
            <tr>
              <td className={styles.colCode}>STAT-06</td>
              <td className={styles.colDesc}>RevPAR (Revenue Per Available Room)</td>
              <td className={styles.colAmount}>{formatIDR(aRevPar)}</td>
              <td className={styles.colAmount}>{formatIDR(bRevPar)}</td>
              {renderVarCell(aRevPar, bRevPar)}
            </tr>

            {/* ── 2. OPERATING REVENUE ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>3000</td>
              <td colSpan={5}>2. PENDAPATAN OPERASIONAL (TOTAL REVENUE)</td>
            </tr>
            <tr>
              <td className={styles.colCode}>3013</td>
              <td className={styles.colDesc}>Room Revenue</td>
              <td className={styles.colAmount}>{formatIDR(aRoomRev)}</td>
              <td className={styles.colAmount}>{formatIDR(bRoomRev)}</td>
              {renderVarCell(aRoomRev, bRoomRev)}
            </tr>
            <tr>
              <td className={styles.colCode}>3023</td>
              <td className={styles.colDesc}>F&B Revenue</td>
              <td className={styles.colAmount}>{formatIDR(aFnbRev)}</td>
              <td className={styles.colAmount}>{formatIDR(bFnbRev)}</td>
              {renderVarCell(aFnbRev, bFnbRev)}
            </tr>
            <tr>
              <td className={styles.colCode}>3033</td>
              <td className={styles.colDesc}>Minor Operating Departments</td>
              <td className={styles.colAmount}>{formatIDR(aModRev)}</td>
              <td className={styles.colAmount}>{formatIDR(bModRev)}</td>
              {renderVarCell(aModRev, bModRev)}
            </tr>
            <tr>
              <td className={styles.colCode}>3043</td>
              <td className={styles.colDesc}>Other Income</td>
              <td className={styles.colAmount}>{formatIDR(aOtherInc)}</td>
              <td className={styles.colAmount}>{formatIDR(bOtherInc)}</td>
              {renderVarCell(aOtherInc, bOtherInc)}
            </tr>
            <tr className={styles.subTotalRow}>
              <td className={styles.colCode}>3999</td>
              <td className={styles.colDesc}>TOTAL OPERATING REVENUE</td>
              <td className={styles.colAmount} style={{ color: "#0284c7" }}>{formatIDR(aTotRev)}</td>
              <td className={styles.colAmount}>{formatIDR(bTotRev)}</td>
              {renderVarCell(aTotRev, bTotRev)}
            </tr>

            {/* ── 3. COST OF SALES ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>4000</td>
              <td colSpan={5}>3. HARGA POKOK PENJUALAN (COST OF SALES)</td>
            </tr>
            <tr>
              <td className={styles.colCode}>4014</td>
              <td className={styles.colDesc}>Cost of Rooms</td>
              <td className={styles.colAmount}>{formatIDR(aRoomCogs)}</td>
              <td className={styles.colAmount}>{formatIDR(bRoomCogs)}</td>
              {renderVarCell(aRoomCogs, bRoomCogs, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>4024</td>
              <td className={styles.colDesc}>Cost of F&B</td>
              <td className={styles.colAmount}>{formatIDR(aFnbCogs)}</td>
              <td className={styles.colAmount}>{formatIDR(bFnbCogs)}</td>
              {renderVarCell(aFnbCogs, bFnbCogs, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>4034</td>
              <td className={styles.colDesc}>Cost of Minor Departments</td>
              <td className={styles.colAmount}>{formatIDR(aModCogs)}</td>
              <td className={styles.colAmount}>{formatIDR(bModCogs)}</td>
              {renderVarCell(aModCogs, bModCogs, true)}
            </tr>
            <tr className={styles.subTotalRow}>
              <td className={styles.colCode}>4999</td>
              <td className={styles.colDesc}>TOTAL COST OF SALES</td>
              <td className={styles.colAmount} style={{ color: "#e11d48" }}>{formatIDR(aTotCogs)}</td>
              <td className={styles.colAmount}>{formatIDR(bTotCogs)}</td>
              {renderVarCell(aTotCogs, bTotCogs, true)}
            </tr>
            <tr className={styles.subTotalRow} style={{ background: "#f0fdf4" }}>
              <td className={styles.colCode}>4990</td>
              <td className={styles.colDesc} style={{ color: "#166534" }}>GROSS PROFIT</td>
              <td className={styles.colAmount} style={{ color: "#16a34a" }}>{formatIDR(aGrossProfit)}</td>
              <td className={styles.colAmount}>{formatIDR(bGrossProfit)}</td>
              {renderVarCell(aGrossProfit, bGrossProfit)}
            </tr>

            {/* ── 4. DEPARTMENTAL OPERATING EXPENSES ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>5000</td>
              <td colSpan={5}>4. BIAYA OPERASIONAL DEPARTEMEN</td>
            </tr>
            <tr>
              <td className={styles.colCode}>5015</td>
              <td className={styles.colDesc}>Room Department</td>
              <td className={styles.colAmount}>{formatIDR(aRoomExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bRoomExp)}</td>
              {renderVarCell(aRoomExp, bRoomExp, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>5025</td>
              <td className={styles.colDesc}>Food & Beverage Department</td>
              <td className={styles.colAmount}>{formatIDR(aFnbExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bFnbExp)}</td>
              {renderVarCell(aFnbExp, bFnbExp, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>5035</td>
              <td className={styles.colDesc}>Minor Operating Departments</td>
              <td className={styles.colAmount}>{formatIDR(aModExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bModExp)}</td>
              {renderVarCell(aModExp, bModExp, true)}
            </tr>
            <tr className={styles.subTotalRow}>
              <td className={styles.colCode}>5999</td>
              <td className={styles.colDesc}>TOTAL DEPARTMENTAL PROFIT (TDP)</td>
              <td className={styles.colAmount} style={{ color: "#2563eb" }}>{formatIDR(aTdp)}</td>
              <td className={styles.colAmount}>{formatIDR(bTdp)}</td>
              {renderVarCell(aTdp, bTdp)}
            </tr>

            {/* ── 5. UNDISTRIBUTED OPERATING EXPENSES ── */}
            <tr className={styles.tierHeaderRow}>
              <td className={styles.colCode}>6000</td>
              <td colSpan={5}>5. BIAYA TIDAK TERDISTRIBUSI</td>
            </tr>
            <tr>
              <td className={styles.colCode}>6015</td>
              <td className={styles.colDesc}>Administration & General (A&G)</td>
              <td className={styles.colAmount}>{formatIDR(aAgExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bAgExp)}</td>
              {renderVarCell(aAgExp, bAgExp, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>6025</td>
              <td className={styles.colDesc}>Human Resources (HRD)</td>
              <td className={styles.colAmount}>{formatIDR(aHrdExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bHrdExp)}</td>
              {renderVarCell(aHrdExp, bHrdExp, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>6035</td>
              <td className={styles.colDesc}>Sales & Marketing</td>
              <td className={styles.colAmount}>{formatIDR(aSmExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bSmExp)}</td>
              {renderVarCell(aSmExp, bSmExp, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>6045</td>
              <td className={styles.colDesc}>POMEC (Property Ops, Maintenance & Energy)</td>
              <td className={styles.colAmount}>{formatIDR(aPomecExp)}</td>
              <td className={styles.colAmount}>{formatIDR(bPomecExp)}</td>
              {renderVarCell(aPomecExp, bPomecExp, true)}
            </tr>
            <tr className={styles.subTotalRow}>
              <td className={styles.colCode}>6999</td>
              <td className={styles.colDesc}>TOTAL UNDISTRIBUTED EXPENSES</td>
              <td className={styles.colAmount} style={{ color: "#e11d48" }}>{formatIDR(aTotUoe)}</td>
              <td className={styles.colAmount}>{formatIDR(bTotUoe)}</td>
              {renderVarCell(aTotUoe, bTotUoe, true)}
            </tr>

            {/* ── 6. GROSS OPERATING PROFIT (GOP) ── */}
            <tr className={styles.gopRow}>
              <td className={styles.colCode}>7000</td>
              <td className={styles.colDesc}>GROSS OPERATING PROFIT (GOP)</td>
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
            <tr>
              <td className={styles.colCode}>8011</td>
              <td className={styles.colDesc}>Exp. Management Fees (Base Fee)</td>
              <td className={styles.colAmount}>{formatIDR(aNonOpBaseFee)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpBaseFee)}</td>
              {renderVarCell(aNonOpBaseFee, bNonOpBaseFee, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>8012</td>
              <td className={styles.colDesc}>Exp. Incentive Fees</td>
              <td className={styles.colAmount}>{formatIDR(aNonOpIncentiveFee)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpIncentiveFee)}</td>
              {renderVarCell(aNonOpIncentiveFee, bNonOpIncentiveFee, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>8013</td>
              <td className={styles.colDesc}>Exp. Franchise / Royalty Fee</td>
              <td className={styles.colAmount}>{formatIDR(aNonOpFranchiseFee)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpFranchiseFee)}</td>
              {renderVarCell(aNonOpFranchiseFee, bNonOpFranchiseFee, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>8021</td>
              <td className={styles.colDesc}>Exp. Building & Property Insurance</td>
              <td className={styles.colAmount}>{formatIDR(aNonOpInsurance)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpInsurance)}</td>
              {renderVarCell(aNonOpInsurance, bNonOpInsurance, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>8022</td>
              <td className={styles.colDesc}>Exp. Property Tax (PBB)</td>
              <td className={styles.colAmount}>{formatIDR(aNonOpPropertyTax)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpPropertyTax)}</td>
              {renderVarCell(aNonOpPropertyTax, bNonOpPropertyTax, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>8031</td>
              <td className={styles.colDesc}>Exp. Bank Interest & Financing Charges</td>
              <td className={styles.colAmount}>{formatIDR(aNonOpBankInterest)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpBankInterest)}</td>
              {renderVarCell(aNonOpBankInterest, bNonOpBankInterest, true)}
            </tr>
            <tr>
              <td className={styles.colCode}>8041</td>
              <td className={styles.colDesc}>Exp. Depreciation & Amortization</td>
              <td className={styles.colAmount}>{formatIDR(aNonOpDepreciation)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOpDepreciation)}</td>
              {renderVarCell(aNonOpDepreciation, bNonOpDepreciation, true)}
            </tr>
            <tr className={styles.subTotalRow}>
              <td className={styles.colCode}>8999</td>
              <td className={styles.colDesc}>TOTAL OTHER NON-OPERATING EXPENSES</td>
              <td className={styles.colAmount} style={{ color: "#e11d48" }}>{formatIDR(aNonOp)}</td>
              <td className={styles.colAmount}>{formatIDR(bNonOp)}</td>
              {renderVarCell(aNonOp, bNonOp, true)}
            </tr>

            {/* ── 8. NET OPERATING INCOME (NOI) ── */}
            <tr className={styles.noiRow}>
              <td className={styles.colCode}>9000</td>
              <td className={styles.colDesc}>NET OPERATING INCOME (NOI)</td>
              <td className={styles.colAmount} style={{ color: aNoi >= 0 ? "#047857" : "#dc2626" }}>
                {formatIDR(aNoi)}
              </td>
              <td className={styles.colAmount}>{formatIDR(bNoi)}</td>
              {renderVarCell(aNoi, bNoi)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
