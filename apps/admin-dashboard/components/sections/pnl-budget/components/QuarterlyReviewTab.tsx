"use client";

import React from "react";
import { formatIDR } from "@/lib/pnl-utils";
import { YearlyBudgetDocument, BudgetMonthData } from "@/lib/budget-types";
import styles from "../pnl-budget.module.css";

interface QuarterlyReviewTabProps {
  year: number;
  budgetDoc: YearlyBudgetDocument | null;
  actualMonthlyData: Record<string, any>;
  hotelRoomCount: number;
}

const QUARTERS = [
  { id: "Q1", label: "QUARTER 1 (JAN - MAR)", months: ["01", "02", "03"], days: 90 },
  { id: "Q2", label: "QUARTER 2 (APR - JUN)", months: ["04", "05", "06"], days: 91 },
  { id: "Q3", label: "QUARTER 3 (JUL - SEP)", months: ["07", "08", "09"], days: 92 },
  { id: "Q4", label: "QUARTER 4 (OCT - DEC)", months: ["10", "11", "12"], days: 92 },
];

export const QuarterlyReviewTab: React.FC<QuarterlyReviewTabProps> = ({
  year,
  budgetDoc,
  actualMonthlyData,
  hotelRoomCount,
}) => {
  // Aggregate Q1 - Q4 data for Budget and Actual
  const qData = QUARTERS.map((q) => {
    let bRoomsAvail = 0;
    let bRoomsSold = 0;
    let bRoomRev = 0;
    let bFnbRev = 0;
    let bModRev = 0;
    let bTotRev = 0;
    let bTotCogs = 0;
    let bTotOpex = 0;
    let bGop = 0;
    let bNonOp = 0;

    let aRoomsSold = 0;
    let aRoomRev = 0;
    let aFnbRev = 0;
    let aModRev = 0;
    let aOtherInc = 0;
    let aTotRev = 0;
    let aTotCogs = 0;
    let aTotOpex = 0;
    let aGop = 0;
    let aNonOp = 0;

    q.months.forEach((mKey) => {
      const days = new Date(year, parseInt(mKey, 10), 0).getDate();
      bRoomsAvail += hotelRoomCount * days;

      const mB = budgetDoc?.months?.[mKey];
      if (mB) {
        bRoomsSold += mB.statistic?.occupiedRoomsPaid || 0;
        bRoomRev += mB.summaryPnl?.roomRevenue || 0;
        bFnbRev += mB.summaryPnl?.fnbRevenue || 0;
        bModRev += mB.summaryPnl?.modRevenue || 0;
        bTotRev += mB.summaryPnl?.totalNetRevenue || 0;
        bTotCogs += mB.summaryPnl?.totalCogs || 0;
        bTotOpex += (mB.summaryPnl?.totalDepartmentalExpenses || 0) + (mB.summaryPnl?.totalUndistributedExpenses || 0);
        bGop += mB.summaryPnl?.grossOperatingProfit || 0;
        bNonOp += mB.summaryPnl?.nonOperatingExpenses || mB.deptNonOp?.total || 0;
      }

      const mA = actualMonthlyData[mKey] || {};
      aRoomsSold += mA.occupiedRooms || 0;
      aRoomRev += mA.roomRevenue || 0;
      aFnbRev += mA.fnbRevenue || 0;
      aModRev += mA.modRevenue || 0;
      aOtherInc += mA.otherIncome || 0;
      aTotRev += (mA.roomRevenue || 0) + (mA.fnbRevenue || 0) + (mA.modRevenue || 0) + (mA.otherIncome || 0);
      aTotCogs += (mA.roomCogs || 0) + (mA.fnbCogs || 0) + (mA.modCogs || 0);
      aTotOpex += mA.totalOpex || 0;
      aNonOp += mA.nonOp || 0;
    });

    aGop = aTotRev - aTotCogs - aTotOpex;
    const bNoi = bGop - bNonOp;
    const aNoi = aGop - aNonOp;

    const bOcc = bRoomsAvail > 0 ? (bRoomsSold / bRoomsAvail) * 100 : 0;
    const aOcc = bRoomsAvail > 0 ? (aRoomsSold / bRoomsAvail) * 100 : 0;

    const bArr = bRoomsSold > 0 ? bRoomRev / bRoomsSold : 0;
    const aArr = aRoomsSold > 0 ? aRoomRev / aRoomsSold : 0;

    const bRevPar = bRoomsAvail > 0 ? bRoomRev / bRoomsAvail : 0;
    const aRevPar = bRoomsAvail > 0 ? aRoomRev / bRoomsAvail : 0;

    return {
      qId: q.id,
      bRoomsAvail,
      bRoomsSold,
      aRoomsSold,
      bOcc,
      aOcc,
      bArr,
      aArr,
      bRevPar,
      aRevPar,
      bRoomRev,
      aRoomRev,
      bFnbRev,
      aFnbRev,
      bModRev,
      aModRev,
      bTotRev,
      aTotRev,
      bTotCogs,
      aTotCogs,
      bTotOpex,
      aTotOpex,
      bGop,
      aGop,
      bNonOp,
      aNonOp,
      bNoi,
      aNoi,
    };
  });

  return (
    <div className={styles.excelCard}>
      <div className={styles.excelSheetBanner}>
        <div className={styles.excelSheetTitleGroup}>
          <span className={styles.excelSheetBadge}>QUARTERLY</span>
          <span className={styles.excelSheetTitle}>TINJAUAN KUARTAL LABA RUGI (Q1 - Q4)</span>
        </div>
        <span className={styles.excelSheetTag}>Q1–Q4 Actual vs Budget</span>
      </div>

      <div className={styles.excelTableContainer}>
        <table className={styles.excelTable}>
          <thead>
            <tr>
              <th style={{ minWidth: "160px" }}>METRIK & AKUN</th>
              <th colSpan={2} style={{ textAlign: "center", background: "#e2e8f0" }}>Q1 (JAN - MAR)</th>
              <th colSpan={2} style={{ textAlign: "center", background: "#cbd5e1" }}>Q2 (APR - JUN)</th>
              <th colSpan={2} style={{ textAlign: "center", background: "#e2e8f0" }}>Q3 (JUL - SEP)</th>
              <th colSpan={2} style={{ textAlign: "center", background: "#cbd5e1" }}>Q4 (OCT - DEC)</th>
            </tr>
            <tr>
              <th>DESKRIPSI</th>
              <th style={{ textAlign: "right", background: "#f0fdf4", color: "#166534" }}>ACTUAL</th>
              <th style={{ textAlign: "right", background: "#f8fafc" }}>BUDGET</th>
              <th style={{ textAlign: "right", background: "#f0fdf4", color: "#166534" }}>ACTUAL</th>
              <th style={{ textAlign: "right", background: "#f8fafc" }}>BUDGET</th>
              <th style={{ textAlign: "right", background: "#f0fdf4", color: "#166534" }}>ACTUAL</th>
              <th style={{ textAlign: "right", background: "#f8fafc" }}>BUDGET</th>
              <th style={{ textAlign: "right", background: "#f0fdf4", color: "#166534" }}>ACTUAL</th>
              <th style={{ textAlign: "right", background: "#f8fafc" }}>BUDGET</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.tierHeaderRow}>
              <td colSpan={9}>1. STATISTIK OPERASIONAL</td>
            </tr>
            <tr>
              <td className={styles.colDesc}>Room Available</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount}>{q.bRoomsAvail}</td>
                  <td className={styles.colAmount}>{q.bRoomsAvail}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.colDesc}>Room Sold</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount} style={{ color: "#2563eb", fontWeight: 800 }}>{q.aRoomsSold}</td>
                  <td className={styles.colAmount}>{q.bRoomsSold}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.colDesc}>Occupancy %</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount} style={{ color: "#2563eb", fontWeight: 800 }}>{q.aOcc.toFixed(1)}%</td>
                  <td className={styles.colAmount}>{q.bOcc.toFixed(1)}%</td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.colDesc}>ARR (IDR)</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount}>{formatIDR(q.aArr)}</td>
                  <td className={styles.colAmount}>{formatIDR(q.bArr)}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.colDesc}>RevPAR (IDR)</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount}>{formatIDR(q.aRevPar)}</td>
                  <td className={styles.colAmount}>{formatIDR(q.bRevPar)}</td>
                </React.Fragment>
              ))}
            </tr>

            <tr className={styles.tierHeaderRow}>
              <td colSpan={9}>2. REVENUE & PROFIT</td>
            </tr>
            <tr>
              <td className={styles.colDesc}>Room Revenue</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount}>{formatIDR(q.aRoomRev)}</td>
                  <td className={styles.colAmount}>{formatIDR(q.bRoomRev)}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.colDesc}>F&B Revenue</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount}>{formatIDR(q.aFnbRev)}</td>
                  <td className={styles.colAmount}>{formatIDR(q.bFnbRev)}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.colDesc}>Minor Dept Revenue</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount}>{formatIDR(q.aModRev)}</td>
                  <td className={styles.colAmount}>{formatIDR(q.bModRev)}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr className={styles.subTotalRow}>
              <td className={styles.colDesc}>TOTAL REVENUE</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount} style={{ color: "#0284c7" }}>{formatIDR(q.aTotRev)}</td>
                  <td className={styles.colAmount}>{formatIDR(q.bTotRev)}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.colDesc}>Cost of Sales</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount} style={{ color: "#e11d48" }}>{formatIDR(q.aTotCogs)}</td>
                  <td className={styles.colAmount}>{formatIDR(q.bTotCogs)}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.colDesc}>Operating Expenses</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount} style={{ color: "#e11d48" }}>{formatIDR(q.aTotOpex)}</td>
                  <td className={styles.colAmount}>{formatIDR(q.bTotOpex)}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr className={styles.gopRow}>
              <td className={styles.colDesc}>GROSS OPERATING PROFIT (GOP)</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount} style={{ color: q.aGop >= 0 ? "#1e40af" : "#dc2626" }}>
                    {formatIDR(q.aGop)}
                  </td>
                  <td className={styles.colAmount}>{formatIDR(q.bGop)}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className={styles.colDesc}>Non-Operating Expenses & Fees</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount} style={{ color: "#e11d48" }}>{formatIDR(q.aNonOp)}</td>
                  <td className={styles.colAmount}>{formatIDR(q.bNonOp)}</td>
                </React.Fragment>
              ))}
            </tr>
            <tr className={styles.noiRow || styles.gopRow}>
              <td className={styles.colDesc} style={{ fontWeight: 800 }}>NET OPERATING INCOME (NOI / NET PROFIT)</td>
              {qData.map((q) => (
                <React.Fragment key={q.qId}>
                  <td className={styles.colAmount} style={{ color: q.aNoi >= 0 ? "#047857" : "#dc2626", fontWeight: 800 }}>
                    {formatIDR(q.aNoi)}
                  </td>
                  <td className={styles.colAmount} style={{ fontWeight: 800 }}>{formatIDR(q.bNoi)}</td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
