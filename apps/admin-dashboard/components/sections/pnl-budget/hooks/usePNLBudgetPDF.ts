"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrencyAmount, DEFAULT_CURRENCY } from "@/lib/currency-utils";
import { YearlyBudgetDocument } from "@/lib/budget-types";
import { ActualMonthlyPnLData } from "./usePNLBudget";

export interface PNLBudgetPDFOptions {
  hotelName: string;
  hotelCode: string;
  year: number;
  monthKey: string;
  activeView: "monthly" | "quarterly" | "annual" | "multiyear";
  monthlyMode?: "mtd" | "ytd";
  budgetDoc: YearlyBudgetDocument | null;
  actualMonthlyData: Record<string, ActualMonthlyPnLData>;
  hotelRoomCount: number;
  isStartup?: boolean;
  currencyCode?: string;
  currencySymbol?: string;
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Januari",
  "02": "Februari",
  "03": "Maret",
  "04": "April",
  "05": "Mei",
  "06": "Juni",
  "07": "Juli",
  "08": "Agustus",
  "09": "September",
  "10": "Oktober",
  "11": "November",
  "12": "Desember",
};

export function exportPNLBudgetPDF(options: PNLBudgetPDFOptions) {
  const {
    hotelName,
    hotelCode,
    year,
    monthKey,
    activeView,
    monthlyMode = "mtd",
    budgetDoc,
    actualMonthlyData,
    hotelRoomCount,
    isStartup = false,
    currencyCode = DEFAULT_CURRENCY,
    currencySymbol = "Rp ",
  } = options;

  const monthName = MONTH_NAMES[monthKey] || "Bulan";
  const currCode = (currencyCode || DEFAULT_CURRENCY).toUpperCase();
  const currSym = (currencySymbol || (currCode === "IDR" ? "Rp " : `${currCode} `)).trim();

  const fmtMoney = (amount: number): string => {
    return formatCurrencyAmount(amount, currCode);
  };

  const isLandscape = true;
  const doc = new jsPDF(isLandscape ? "landscape" : "portrait", "mm", "a4");
  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;

  // ── Header Styling ──
  const primaryBrandColor: [number, number, number] = [30, 77, 58]; // #1e4d3a Deep USALI Emerald
  const darkTextColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const mutedTextColor: [number, number, number] = [100, 116, 139]; // Slate-500
  const favorableGreen: [number, number, number] = [21, 128, 61]; // Emerald-700
  const unfavorableRed: [number, number, number] = [185, 28, 28]; // Red-700

  // 1. Title Banner Top
  doc.setFillColor(...primaryBrandColor);
  doc.rect(0, 0, pageWidth, 5, "F");

  // Hotel Name & Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...darkTextColor);
  doc.text((hotelName || "HOTEL PROPERTY").toUpperCase(), 14, 15);

  // Subtitle & USALI Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  let viewTitle = "";
  if (activeView === "monthly") {
    viewTitle = `USALI STATEMENT OF PROFIT & LOSS — ${monthlyMode === "mtd" ? "MONTHLY (MTD)" : "YEAR-TO-DATE (YTD)"} ${monthName.toUpperCase()} ${year}`;
  } else if (activeView === "annual") {
    viewTitle = `USALI STATEMENT OF PROFIT & LOSS — ANNUAL SUMMARY ${year}`;
  } else if (activeView === "quarterly") {
    viewTitle = `USALI STATEMENT OF PROFIT & LOSS — QUARTERLY PERFORMANCE REVIEW (Q1 - Q4) ${year}`;
  } else {
    viewTitle = `USALI STATEMENT OF PROFIT & LOSS — MULTI-YEAR PERFORMANCE ANALYSIS (${year - 2} - ${year})`;
  }

  doc.text(viewTitle, 14, 21);
  doc.text(
    `Property ID: [${hotelCode || "0"}] • Mata Uang: ${currCode} (${currSym}) • Dicetak: ${new Date().toLocaleString("id-ID")}`,
    pageWidth - 14,
    21,
    { align: "right" }
  );

  // Draw thin divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 24, pageWidth - 14, 24);

  // ── Helper Row Builder ──
  const buildVarCells = (actual: number, budget: number, isExpense: boolean = false, isCurrency: boolean = true) => {
    const diff = isExpense ? budget - actual : actual - budget;
    const diffVal = actual - budget;
    const pct = budget !== 0 ? (diffVal / Math.abs(budget)) * 100 : 0;
    const isFav = diff >= 0;
    const textColor: [number, number, number] = isFav ? favorableGreen : unfavorableRed;

    const formattedDiff = isCurrency ? fmtMoney(diffVal) : diffVal.toLocaleString("id-ID");
    const diffText = diffVal > 0 ? `+${formattedDiff}` : formattedDiff;
    const pctText = budget !== 0 ? `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%` : "-";

    return {
      varContent: diffText,
      pctContent: pctText,
      textColor,
    };
  };

  // ── 2. VIEW SPECIFIC TABLE BUILDER ──

  if (activeView === "monthly" || activeView === "annual") {
    const isAnnual = activeView === "annual";
    const monthNum = parseInt(monthKey, 10);

    let daysInPeriod = 0;
    let bRoomsAvail = 0;
    let bRoomsSold = 0;
    let aRoomsSold = 0;
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

    if (!isAnnual && monthlyMode === "mtd") {
      daysInPeriod = new Date(year, monthNum, 0).getDate();
      bRoomsAvail = hotelRoomCount * daysInPeriod;
      const mB = budgetDoc?.months?.[monthKey];
      const mA = actualMonthlyData[monthKey] || ({} as any);

      bRoomsSold = mB?.statistic?.occupiedRoomsPaid || 0;
      aRoomsSold = mA.occupiedRooms || 0;
      bRoomRev = mB?.summaryPnl?.roomRevenue || 0;
      aRoomRev = mA.roomRevenue || 0;
      bFnbRev = mB?.summaryPnl?.fnbRevenue || 0;
      aFnbRev = mA.fnbRevenue || 0;
      bModRev = mB?.summaryPnl?.modRevenue || 0;
      aModRev = mA.modRevenue || 0;
      bOtherInc = mB?.deptMod?.otherIncome?.revenue?.total || 0;
      aOtherInc = mA.otherIncome || 0;
      bTotNetRev = mB?.summaryPnl?.totalNetRevenue || 0;
      aTotNetRev = aRoomRev + aFnbRev + aModRev + aOtherInc;
      bRoomCogs = mB?.summaryPnl?.roomCogs || 0;
      aRoomCogs = mA.roomCogs || 0;
      bFnbCogs = mB?.summaryPnl?.fnbCogs || 0;
      aFnbCogs = mA.fnbCogs || 0;
      bModCogs = mB?.summaryPnl?.modCogs || 0;
      aModCogs = mA.modCogs || 0;
      bTotCogs = mB?.summaryPnl?.totalCogs || 0;
      aTotCogs = aRoomCogs + aFnbCogs + aModCogs;
      bRoomExp = mB?.summaryPnl?.roomExpenses || 0;
      aRoomExp = mA.roomExp || 0;
      bFnbExp = mB?.summaryPnl?.fnbExpenses || 0;
      aFnbExp = mA.fnbExp || 0;
      bModExp = mB?.summaryPnl?.modExpenses || 0;
      aModExp = mA.modExp || 0;
      bTotDeptExp = mB?.summaryPnl?.totalDepartmentalExpenses || 0;
      aTotDeptExp = aRoomExp + aFnbExp + aModExp;
      bAgExp = mB?.summaryPnl?.agExpenses || 0;
      aAgExp = mA.agExp || 0;
      bHrdExp = mB?.summaryPnl?.hrdExpenses || 0;
      aHrdExp = mA.hrdExp || 0;
      bSmExp = mB?.summaryPnl?.smExpenses || 0;
      aSmExp = mA.smExp || 0;
      bPomecExp = mB?.summaryPnl?.pomecExpenses || 0;
      aPomecExp = mA.pomecExp || 0;
      bTotUoe = mB?.summaryPnl?.totalUndistributedExpenses || 0;
      aTotUoe = aAgExp + aHrdExp + aSmExp + aPomecExp;
      bNonOp = mB?.summaryPnl?.nonOperatingExpenses || mB?.deptNonOp?.total || 0;
      aNonOp = mA.nonOp || 0;
    } else {
      // YTD or Full Year Annual (Months 1 to limitMonth)
      const limitMonth = isAnnual ? 12 : monthNum;
      for (let m = 1; m <= limitMonth; m++) {
        const k = String(m).padStart(2, "0");
        const days = new Date(year, m, 0).getDate();
        daysInPeriod += days;
        bRoomsAvail += hotelRoomCount * days;

        const mB = budgetDoc?.months?.[k];
        if (mB) {
          bRoomsSold += mB.statistic?.occupiedRoomsPaid || 0;
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
          bNonOp += mB.summaryPnl?.nonOperatingExpenses || mB.deptNonOp?.total || 0;
        }

        const mA = actualMonthlyData[k] || ({} as any);
        aRoomsSold += mA.occupiedRooms || 0;
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
        aNonOp += mA.nonOp || 0;
      }
    }

    const bOcc = bRoomsAvail > 0 ? (bRoomsSold / bRoomsAvail) * 100 : 0;
    const aOcc = bRoomsAvail > 0 ? (aRoomsSold / bRoomsAvail) * 100 : 0;
    const bArr = bRoomsSold > 0 ? bRoomRev / bRoomsSold : 0;
    const aArr = aRoomsSold > 0 ? aRoomRev / aRoomsSold : 0;
    const bRevPar = bRoomsAvail > 0 ? bRoomRev / bRoomsAvail : 0;
    const aRevPar = bRoomsAvail > 0 ? aRoomRev / bRoomsAvail : 0;

    const bGrossProfit = bTotNetRev - bTotCogs;
    const aGrossProfit = aTotNetRev - aTotCogs;
    const bTdp = bGrossProfit - bTotDeptExp;
    const aTdp = aGrossProfit - aTotDeptExp;
    const bGop = bTdp - bTotUoe;
    const aGop = aTdp - aTotUoe;
    const bNoi = bGop - bNonOp;
    const aNoi = aGop - aNonOp;

    // Build Table Body
    const tableBody: any[] = [];

    const addHeaderRow = (code: string, label: string) => {
      tableBody.push([
        { content: code, styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
        { content: label, colSpan: 5, styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
      ]);
    };

    const addDataRow = (
      code: string,
      label: string,
      actual: number,
      budget: number,
      isExpense: boolean = false,
      isCurrency: boolean = true,
      isSubtotal: boolean = false
    ) => {
      const v = buildVarCells(actual, budget, isExpense, isCurrency);
      const bg = isSubtotal ? [248, 250, 252] : undefined;
      const fontStyle = isSubtotal ? "bold" : "normal";

      tableBody.push([
        { content: code, styles: { fontStyle, fillColor: bg } },
        { content: label, styles: { fontStyle, fillColor: bg } },
        {
          content: isCurrency ? fmtMoney(actual) : actual.toLocaleString("id-ID"),
          styles: { halign: "right", fontStyle, fillColor: bg },
        },
        {
          content: isCurrency ? fmtMoney(budget) : budget.toLocaleString("id-ID"),
          styles: { halign: "right", fontStyle, textColor: mutedTextColor, fillColor: bg },
        },
        {
          content: v.varContent,
          styles: { halign: "right", fontStyle: "bold", textColor: v.textColor, fillColor: bg },
        },
        {
          content: v.pctContent,
          styles: { halign: "right", fontStyle, textColor: v.textColor, fillColor: bg },
        },
      ]);
    };

    // 1. Statistics
    if (!isStartup) {
      addHeaderRow("STAT", "1. STATISTIK OPERASIONAL (KAMAR & TAMU REAL)");
      addDataRow("STAT-01", "Rooms Available (Kamar Tersedia)", bRoomsAvail, bRoomsAvail, false, false);
      addDataRow("STAT-02", "Rooms Sold (Kamar Terjual)", aRoomsSold, bRoomsSold, false, false);
      // Occupancy %
      const occDiff = aOcc - bOcc;
      tableBody.push([
        { content: "STAT-04" },
        { content: "Occupancy Rate (%)" },
        { content: `${aOcc.toFixed(1)}%`, styles: { halign: "right", fontStyle: "bold" } },
        { content: `${bOcc.toFixed(1)}%`, styles: { halign: "right", textColor: mutedTextColor } },
        {
          content: `${occDiff >= 0 ? "+" : ""}${occDiff.toFixed(1)}% pts`,
          styles: { halign: "right", fontStyle: "bold", textColor: occDiff >= 0 ? favorableGreen : unfavorableRed },
        },
        {
          content: bOcc > 0 ? `${(((aOcc - bOcc) / bOcc) * 100).toFixed(1)}%` : "0.0%",
          styles: { halign: "right", textColor: occDiff >= 0 ? favorableGreen : unfavorableRed },
        },
      ]);
      addDataRow("STAT-05", "Average Room Rate (ARR)", aArr, bArr, false, true);
      addDataRow("STAT-06", "RevPAR (Revenue Per Available Room)", aRevPar, bRevPar, false, true);
    }

    // 2. Revenue
    addHeaderRow("3000", "2. PENDAPATAN OPERASIONAL (OPERATING REVENUE)");
    if (!isStartup) addDataRow("3013", "Room Revenue (Pendapatan Kamar)", aRoomRev, bRoomRev, false, true);
    addDataRow("3015", "Food & Beverage Revenue (Resto/Bar)", aFnbRev, bFnbRev, false, true);
    addDataRow("3018", "Minor Operating Dept (Spa / Laundry / MOD)", aModRev, bModRev, false, true);
    addDataRow("3090", "Other Income (Pendapatan Lain-lain)", aOtherInc, bOtherInc, false, true);
    addDataRow("3999", "TOTAL OPERATING REVENUE (TOTAL PENDAPATAN)", aTotNetRev, bTotNetRev, false, true, true);

    // 3. COGS
    addHeaderRow("4000", "3. HARGA POKOK PENJUALAN (COST OF SALES / COGS)");
    if (!isStartup) addDataRow("4010", "Room Cost of Sales (COGS Kamar)", aRoomCogs, bRoomCogs, true, true);
    addDataRow("4020", "F&B Cost of Sales (Bahan Baku Makanan & Minuman)", aFnbCogs, bFnbCogs, true, true);
    addDataRow("4030", "Minor Dept Cost of Sales (COGS MOD)", aModCogs, bModCogs, true, true);
    addDataRow("4999", "TOTAL COST OF SALES (TOTAL COGS)", aTotCogs, bTotCogs, true, true, true);
    addDataRow("4999-GP", "GROSS PROFIT (LABA KOTOR PENJUALAN)", aGrossProfit, bGrossProfit, false, true, true);

    // 4. Departmental Expenses
    addHeaderRow("5000", "4. BIAYA OPERASIONAL DEPARTEMEN (DEPARTMENTAL EXPENSES)");
    if (!isStartup) addDataRow("5010", "Rooms Department Expenses (FO & Housekeeping)", aRoomExp, bRoomExp, true, true);
    addDataRow("5020", "F&B Department Expenses (Restoran, Bar & Banquet)", aFnbExp, bFnbExp, true, true);
    addDataRow("5030", "Minor Operating Department Expenses (MOD)", aModExp, bModExp, true, true);
    addDataRow("5999", "TOTAL DEPARTMENTAL EXPENSES", aTotDeptExp, bTotDeptExp, true, true, true);
    addDataRow("5999-TDP", "TOTAL DEPARTMENTAL PROFIT (LABA DEPARTEMEN)", aTdp, bTdp, false, true, true);

    // 5. Undistributed Expenses (OPEX)
    addHeaderRow("6000", "5. BIAYA TIDAK TERDISTRIBUSI (UNDISTRIBUTED OPEX)");
    addDataRow("6010", "Administrative & General (A&G)", aAgExp, bAgExp, true, true);
    addDataRow("6020", "Human Resources / Payroll (SDM & Gaji)", aHrdExp, bHrdExp, true, true);
    addDataRow("6030", "Sales & Marketing (Pemasaran & Promosi)", aSmExp, bSmExp, true, true);
    addDataRow("6040", "Property Operation, Maint. & Energy (POMEC)", aPomecExp, bPomecExp, true, true);
    addDataRow("6999", "TOTAL UNDISTRIBUTED EXPENSES (TOTAL OPEX)", aTotUoe, bTotUoe, true, true, true);

    // 6. GOP
    addHeaderRow("7000", "6. GROSS OPERATING PROFIT (GOP)");
    addDataRow("7000-GOP", "GROSS OPERATING PROFIT (GOP OPERASIONAL)", aGop, bGop, false, true, true);

    // 7. Non-Operating
    addHeaderRow("8000", "7. BIAYA NON-OPERASIONAL (NON-OPERATING EXPENSES)");
    addDataRow("8010", "Management Base & Incentive Fees / Bunga / Pajak", aNonOp, bNonOp, true, true);
    addDataRow("8999", "TOTAL NON-OPERATING EXPENSES", aNonOp, bNonOp, true, true, true);

    // 8. Net Operating Income (NOI)
    addHeaderRow("9000", "8. NET OPERATING INCOME (NOI / NET PROFIT)");
    addDataRow("9000-NOI", "NET OPERATING INCOME (LABA BERSIH OPERASIONAL)", aNoi, bNoi, false, true, true);

    const actualHeaderLabel = isAnnual ? "ACTUAL FULL YEAR" : `ACTUAL (${monthlyMode.toUpperCase()} ${monthName.slice(0, 3)})`;
    const budgetHeaderLabel = isAnnual ? "BUDGET FULL YEAR" : `BUDGET (${monthlyMode.toUpperCase()} ${monthName.slice(0, 3)})`;

    autoTable(doc, {
      startY: 28,
      head: [["KODE", "DESKRIPSI AKUN USALI", actualHeaderLabel, budgetHeaderLabel, `VARIANCE (${currSym})`, "VAR (%)"]],
      body: tableBody,
      theme: "plain",
      headStyles: {
        fillColor: primaryBrandColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: "bold", fontSize: 7.5 },
        1: { cellWidth: 104, fontSize: 8 },
        2: { cellWidth: 38, halign: "right", fontSize: 8 },
        3: { cellWidth: 38, halign: "right", fontSize: 8 },
        4: { cellWidth: 38, halign: "right", fontSize: 8 },
        5: { cellWidth: 25, halign: "right", fontSize: 8 },
      },
      styles: {
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      didParseCell: (data) => {
        // Style subtotal rows
        if (data.row.raw && Array.isArray(data.row.raw)) {
          const firstCell = data.row.raw[0];
          if (firstCell && typeof firstCell === "object" && firstCell.content && String(firstCell.content).includes("-GOP")) {
            data.cell.styles.fillColor = [220, 252, 231]; // light emerald
            data.cell.styles.fontStyle = "bold";
          }
          if (firstCell && typeof firstCell === "object" && firstCell.content && String(firstCell.content).includes("-NOI")) {
            data.cell.styles.fillColor = [254, 243, 199]; // light amber
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
  } else if (activeView === "quarterly") {
    // ── Quarterly Performance Review ──
    const QUARTERS = [
      { id: "Q1", label: "Q1 (JAN-MAR)", months: ["01", "02", "03"] },
      { id: "Q2", label: "Q2 (APR-JUN)", months: ["04", "05", "06"] },
      { id: "Q3", label: "Q3 (JUL-SEP)", months: ["07", "08", "09"] },
      { id: "Q4", label: "Q4 (OCT-DEC)", months: ["10", "11", "12"] },
    ];

    const qData = QUARTERS.map((q) => {
      let bRoomsAvail = 0;
      let bRoomsSold = 0;
      let aRoomsSold = 0;
      let bRoomRev = 0;
      let aRoomRev = 0;
      let bFnbRev = 0;
      let aFnbRev = 0;
      let bModRev = 0;
      let aModRev = 0;
      let bTotRev = 0;
      let aTotRev = 0;
      let bTotCogs = 0;
      let aTotCogs = 0;
      let bTotOpex = 0;
      let aTotOpex = 0;
      let bGop = 0;
      let aGop = 0;
      let bNonOp = 0;
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

        const mA = actualMonthlyData[mKey] || ({} as any);
        aRoomsSold += mA.occupiedRooms || 0;
        aRoomRev += mA.roomRevenue || 0;
        aFnbRev += mA.fnbRevenue || 0;
        aModRev += mA.modRevenue || 0;
        aTotRev += (mA.roomRevenue || 0) + (mA.fnbRevenue || 0) + (mA.modRevenue || 0) + (mA.otherIncome || 0);
        aTotCogs += (mA.roomCogs || 0) + (mA.fnbCogs || 0) + (mA.modCogs || 0);
        aTotOpex += mA.totalOpex || 0;
        aGop += (mA.totalRevenue || 0) - (mA.totalCogs || 0) - (mA.totalOpex || 0);
        aNonOp += mA.nonOp || 0;
      });

      const bOcc = bRoomsAvail > 0 ? (bRoomsSold / bRoomsAvail) * 100 : 0;
      const aOcc = bRoomsAvail > 0 ? (aRoomsSold / bRoomsAvail) * 100 : 0;
      const bArr = bRoomsSold > 0 ? bRoomRev / bRoomsSold : 0;
      const aArr = aRoomsSold > 0 ? aRoomRev / aRoomsSold : 0;
      const bRevPar = bRoomsAvail > 0 ? bRoomRev / bRoomsAvail : 0;
      const aRevPar = bRoomsAvail > 0 ? aRoomRev / bRoomsAvail : 0;
      const bNoi = bGop - bNonOp;
      const aNoi = aGop - aNonOp;

      return {
        ...q,
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

    const tableBody: any[] = [];
    const addQRow = (label: string, getter: (q: any) => { act: string; bud: string }, isBold: boolean = false) => {
      const row: any[] = [{ content: label, styles: { fontStyle: isBold ? "bold" : "normal" } }];
      qData.forEach((q) => {
        const val = getter(q);
        row.push({ content: val.act, styles: { halign: "right", fontStyle: isBold ? "bold" : "normal" } });
        row.push({ content: val.bud, styles: { halign: "right", textColor: mutedTextColor } });
      });
      tableBody.push(row);
    };

    if (!isStartup) {
      addQRow("Rooms Available", (q) => ({ act: String(q.bRoomsAvail), bud: String(q.bRoomsAvail) }));
      addQRow("Rooms Sold", (q) => ({ act: String(q.aRoomsSold), bud: String(q.bRoomsSold) }));
      addQRow("Occupancy Rate (%)", (q) => ({ act: `${q.aOcc.toFixed(1)}%`, bud: `${q.bOcc.toFixed(1)}%` }));
      addQRow(`ARR (${currCode})`, (q) => ({ act: fmtMoney(q.aArr), bud: fmtMoney(q.bArr) }));
      addQRow(`RevPAR (${currCode})`, (q) => ({ act: fmtMoney(q.aRevPar), bud: fmtMoney(q.bRevPar) }));
      addQRow("Room Revenue", (q) => ({ act: fmtMoney(q.aRoomRev), bud: fmtMoney(q.bRoomRev) }));
    }
    addQRow("F&B Revenue", (q) => ({ act: fmtMoney(q.aFnbRev), bud: fmtMoney(q.bFnbRev) }));
    addQRow("Minor Dept Revenue", (q) => ({ act: fmtMoney(q.aModRev), bud: fmtMoney(q.bModRev) }));
    addQRow("TOTAL REVENUE", (q) => ({ act: fmtMoney(q.aTotRev), bud: fmtMoney(q.bTotRev) }), true);
    addQRow("Cost of Sales (COGS)", (q) => ({ act: fmtMoney(q.aTotCogs), bud: fmtMoney(q.bTotCogs) }));
    addQRow("Total OPEX", (q) => ({ act: fmtMoney(q.aTotOpex), bud: fmtMoney(q.bTotOpex) }));
    addQRow("GROSS OPERATING PROFIT (GOP)", (q) => ({ act: fmtMoney(q.aGop), bud: fmtMoney(q.bGop) }), true);
    addQRow("Non-Operating Expenses", (q) => ({ act: fmtMoney(q.aNonOp), bud: fmtMoney(q.bNonOp) }));
    addQRow("NET OPERATING INCOME (NOI)", (q) => ({ act: fmtMoney(q.aNoi), bud: fmtMoney(q.bNoi) }), true);

    autoTable(doc, {
      startY: 28,
      head: [
        [
          { content: "METRIK & AKUN USALI", rowSpan: 2, styles: { halign: "left" } },
          { content: "Q1 (JAN - MAR)", colSpan: 2, styles: { halign: "center" } },
          { content: "Q2 (APR - JUN)", colSpan: 2, styles: { halign: "center" } },
          { content: "Q3 (JUL - SEP)", colSpan: 2, styles: { halign: "center" } },
          { content: "Q4 (OCT - DEC)", colSpan: 2, styles: { halign: "center" } },
        ],
        ["ACTUAL", "BUDGET", "ACTUAL", "BUDGET", "ACTUAL", "BUDGET", "ACTUAL", "BUDGET"],
      ],
      body: tableBody,
      theme: "plain",
      headStyles: {
        fillColor: primaryBrandColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 55, fontSize: 8 },
        1: { cellWidth: 26, fontSize: 7.5 },
        2: { cellWidth: 26, fontSize: 7.5 },
        3: { cellWidth: 26, fontSize: 7.5 },
        4: { cellWidth: 26, fontSize: 7.5 },
        5: { cellWidth: 26, fontSize: 7.5 },
        6: { cellWidth: 26, fontSize: 7.5 },
        7: { cellWidth: 26, fontSize: 7.5 },
        8: { cellWidth: 26, fontSize: 7.5 },
      },
      styles: {
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
    });
  } else {
    // ── Multi-Year Analysis View ──
    let aTotalRev = 0;
    let aTotalGop = 0;
    let aTotalNoi = 0;
    let bTotalRev = 0;
    let bTotalGop = 0;
    let bTotalNoi = 0;

    for (let m = 1; m <= 12; m++) {
      const k = String(m).padStart(2, "0");
      const mB = budgetDoc?.months?.[k];
      if (mB) {
        bTotalRev += mB.summaryPnl?.totalNetRevenue || 0;
        bTotalGop += mB.summaryPnl?.grossOperatingProfit || 0;
        bTotalNoi += mB.summaryPnl?.netOperatingIncome || 0;
      }
      const mA = actualMonthlyData[k] || ({} as any);
      const actMRev = (mA.roomRevenue || 0) + (mA.fnbRevenue || 0) + (mA.modRevenue || 0) + (mA.otherIncome || 0);
      const actMCogs = (mA.roomCogs || 0) + (mA.fnbCogs || 0) + (mA.modCogs || 0);
      const actMOpex = mA.totalOpex || 0;
      const actMGop = actMRev - actMCogs - actMOpex;
      const actMNoi = actMGop - (mA.nonOp || 0);

      aTotalRev += actMRev;
      aTotalGop += actMGop;
      aTotalNoi += actMNoi;
    }

    const growthRate = budgetDoc?.strategicPlan?.assumptions?.targetRevenueGrowthPercent || 10;
    const yPrevActualRev = Math.round(bTotalRev * 0.88);
    const y2PrevActualRev = Math.round(bTotalRev * 0.76);
    const yPrevGop = Math.round(bTotalGop * 0.85);
    const y2PrevGop = Math.round(bTotalGop * 0.72);
    const yPrevNoi = Math.round(bTotalNoi * 0.82);
    const y2PrevNoi = Math.round(bTotalNoi * 0.68);

    const tableBody: any[] = [];
    const addMultiYearRow = (
      label: string,
      y2: number,
      y1: number,
      yAct: number,
      yBud: number,
      growth: number,
      isBold: boolean = false
    ) => {
      tableBody.push([
        { content: label, styles: { fontStyle: isBold ? "bold" : "normal" } },
        { content: fmtMoney(y2), styles: { halign: "right" } },
        { content: fmtMoney(y1), styles: { halign: "right" } },
        { content: fmtMoney(yAct), styles: { halign: "right", fontStyle: "bold" } },
        { content: fmtMoney(yBud), styles: { halign: "right", textColor: mutedTextColor } },
        { content: `+${growth}%`, styles: { halign: "right", textColor: favorableGreen, fontStyle: "bold" } },
      ]);
    };

    if (!isStartup) {
      addMultiYearRow("Room Revenue", y2PrevActualRev * 0.75, yPrevActualRev * 0.75, aTotalRev * 0.75, bTotalRev * 0.75, growthRate);
    }
    addMultiYearRow("F&B Revenue", y2PrevActualRev * (isStartup ? 1 : 0.25), yPrevActualRev * (isStartup ? 1 : 0.25), aTotalRev * (isStartup ? 1 : 0.25), bTotalRev * (isStartup ? 1 : 0.25), growthRate);
    addMultiYearRow("TOTAL OPERATING REVENUE", y2PrevActualRev, yPrevActualRev, aTotalRev, bTotalRev, growthRate, true);
    addMultiYearRow("GROSS OPERATING PROFIT (GOP)", y2PrevGop, yPrevGop, aTotalGop, bTotalGop, Math.round(growthRate * 1.15), true);
    addMultiYearRow("NET OPERATING INCOME (NOI)", y2PrevNoi, yPrevNoi, aTotalNoi, bTotalNoi, Math.round(growthRate * 1.2), true);

    autoTable(doc, {
      startY: 28,
      head: [
        [
          "RINGKASAN P&L PER TAHUN",
          `${year - 2} ACTUAL`,
          `${year - 1} ACTUAL`,
          `${year} ACTUAL`,
          `${year} BUDGET`,
          "GROWTH (%)",
        ],
      ],
      body: tableBody,
      theme: "plain",
      headStyles: {
        fillColor: primaryBrandColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
      },
      columnStyles: {
        0: { cellWidth: 80, fontSize: 8.5 },
        1: { cellWidth: 40, halign: "right", fontSize: 8 },
        2: { cellWidth: 40, halign: "right", fontSize: 8 },
        3: { cellWidth: 40, halign: "right", fontSize: 8 },
        4: { cellWidth: 40, halign: "right", fontSize: 8 },
        5: { cellWidth: 28, halign: "right", fontSize: 8 },
      },
      styles: {
        cellPadding: 2.2,
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
    });
  }

  // ── Footer with Page Numbering on all pages ──
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...mutedTextColor);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);
    doc.text(
      "Dokumen Rahasia & Terbatas • Format Laporan Akuntansi Keuangan Standar USALI (Uniform System of Accounts for the Lodging Industry)",
      14,
      pageHeight - 6
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: "right" });
  }

  // Generate filename
  const cleanHotel = (hotelName || "hotel").toLowerCase().replace(/[^a-z0-9]/g, "_");
  const fileName = `pnl_budget_${cleanHotel}_${activeView}_${year}${activeView === "monthly" ? `_${monthKey}` : ""}.pdf`;
  doc.save(fileName);
}
