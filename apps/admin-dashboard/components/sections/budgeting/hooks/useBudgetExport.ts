import ExcelJS from "exceljs";
import {
  YearlyBudgetDocument,
  BudgetMonthData,
  createDefaultBudgetMonthData,
} from "@/lib/budget-types";

interface UseBudgetExportProps {
  year: number;
  budgetDoc: YearlyBudgetDocument | null;
  hotelName: string;
  hotelRoomCount: number;
}

const MONTH_KEYS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Matrix Columns:
// Col 1 (A): Account Description
// Col 2 (B): Jan
// Col 3 (C): Feb
// Col 4 (D): Mar
// Col 5 (E): Q1 TOTAL (Formula: =SUM(B:D))
// Col 6 (F): Apr
// Col 7 (G): Mei
// Col 8 (H): Jun
// Col 9 (I): Q2 TOTAL (Formula: =SUM(F:H))
// Col 10 (J): Jul
// Col 11 (K): Agu
// Col 12 (L): Sep
// Col 13 (M): Q3 TOTAL (Formula: =SUM(J:L))
// Col 14 (N): Okt
// Col 15 (O): Nov
// Col 16 (P): Des
// Col 17 (Q): Q4 TOTAL (Formula: =SUM(N:P))
// Col 18 (R): FULL YEAR (Formula: =E+I+M+Q)
// Col 19 (S): % OF REV (Formula: =IF(R$netRev>0, R/R$netRev, 0))

// ═══════════════════════════════════════════════════════════════════════════
// COLOR PALETTE & STYLES (Soft Pastel & Elegant USALI Theme)
// ═══════════════════════════════════════════════════════════════════════════
const COLORS = {
  headerBg: "FF1E293B",        // Soft Dark Slate
  headerText: "FFFFFFFF",
  subtitleBg: "FF334155",      // Cool Slate
  subtitleText: "FFE2E8F0",
  colHeaderDesc: "FF334155",   // Slate
  colHeaderMonth: "FFF1F5F9",  // Soft Slate Gray
  colHeaderMonthText: "FF1E293B",
  colHeaderQuarter: "FFDBEAFE",// Soft Sky Blue
  colHeaderQuarterText: "FF1E40AF",
  colHeaderYear: "FFD1FAE5",   // Soft Mint Green
  colHeaderYearText: "FF065F46",
  colHeaderPct: "FFF3E8FF",    // Soft Lavender
  colHeaderPctText: "FF6B21A8",
  sectionBg: "FFE2E8F0",       // Soft Slate 200
  sectionText: "FF0F172A",
  subtotalBg: "FFE0F2FE",      // Soft Sky 100
  subtotalText: "FF0C4A6E",
  profitBg: "FFFEF3C7",        // Soft Warm Amber 100
  profitText: "FF78350F",
  quarterCellBg: "FFF0F9FF",   // Sky 50 tint
  yearCellBg: "FFF0FDF4",      // Green 50 tint
  pctCellBg: "FFFAF5FF",       // Purple 50 tint
  gridBorder: "FFE2E8F0",      // Light slate border
  strongBorder: "FF94A3B8",    // Medium slate border
  amberBorder: "FFD97706",     // Amber border
};

const BORDERS = {
  thin: {
    top: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
    left: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
    bottom: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
    right: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
  },
  subtotal: {
    top: { style: "thin" as const, color: { argb: COLORS.strongBorder } },
    left: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
    bottom: { style: "thin" as const, color: { argb: COLORS.strongBorder } },
    right: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
  },
  profit: {
    top: { style: "thin" as const, color: { argb: COLORS.amberBorder } },
    left: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
    bottom: { style: "double" as const, color: { argb: COLORS.amberBorder } },
    right: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
  },
  section: {
    top: { style: "medium" as const, color: { argb: COLORS.strongBorder } },
    left: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
    bottom: { style: "thin" as const, color: { argb: COLORS.strongBorder } },
    right: { style: "thin" as const, color: { argb: COLORS.gridBorder } },
  },
};

export const useBudgetExport = ({
  year,
  budgetDoc,
  hotelName,
  hotelRoomCount,
}: UseBudgetExportProps) => {

  const getMonthsArray = (): BudgetMonthData[] => {
    return MONTH_KEYS.map((k) => budgetDoc?.months?.[k] || createDefaultBudgetMonthData());
  };

  // Helper to trigger browser download from workbook
  const saveWorkbook = async (wb: ExcelJS.Workbook, fileName: string) => {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Setup Standard Matrix Sheet with Header, Frozen Panes and Styles
  const setupMatrixWorksheet = (wb: ExcelJS.Workbook, sheetName: string, titleDesc: string) => {
    const ws = wb.addWorksheet(sheetName, {
      views: [{ state: "frozen", xSplit: 1, ySplit: 6 }],
      properties: { showGridLines: true, defaultRowHeight: 20 },
    });

    // Column widths
    ws.columns = [
      { key: "desc", width: 42 },
      { key: "m01", width: 15 },
      { key: "m02", width: 15 },
      { key: "m03", width: 15 },
      { key: "q1", width: 17 },
      { key: "m04", width: 15 },
      { key: "m05", width: 15 },
      { key: "m06", width: 15 },
      { key: "q2", width: 17 },
      { key: "m07", width: 15 },
      { key: "m08", width: 15 },
      { key: "m09", width: 15 },
      { key: "q3", width: 17 },
      { key: "m10", width: 15 },
      { key: "m11", width: 15 },
      { key: "m12", width: 15 },
      { key: "q4", width: 17 },
      { key: "year", width: 19 },
      { key: "pct", width: 13 },
    ];

    // Row 1: Hotel Name Banner
    const r1 = ws.addRow([hotelName.toUpperCase()]);
    ws.mergeCells("A1:S1");
    r1.height = 24;
    r1.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
    r1.getCell(1).font = { name: "Segoe UI", size: 12, bold: true, color: { argb: COLORS.headerText } };
    r1.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    // Row 2: Sheet Title
    const r2 = ws.addRow([`ANNUAL OPERATING BUDGET — ${titleDesc.toUpperCase()}`]);
    ws.mergeCells("A2:S2");
    r2.height = 20;
    r2.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.subtitleBg } };
    r2.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: COLORS.subtitleText } };
    r2.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    // Row 3: Meta Info
    const r3 = ws.addRow([`Fiscal Year: ${year} | Capacity: ${hotelRoomCount} Physical Rooms | Standard: USALI 11th Edition`]);
    ws.mergeCells("A3:S3");
    r3.height = 18;
    r3.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    r3.getCell(1).font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF475569" } };
    r3.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    // Row 4: Currency & Date Info
    const r4 = ws.addRow([`Exported: ${new Date().toLocaleString("id-ID")} | Currency: IDR (Rupiah)`]);
    ws.mergeCells("A4:S4");
    r4.height = 18;
    r4.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    r4.getCell(1).font = { name: "Segoe UI", size: 8.5, color: { argb: "FF64748B" } };
    r4.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    // Row 5: Empty Spacer
    ws.addRow([]);
    ws.getRow(5).height = 8;

    // Row 6: Column Header Row
    const headerRow = ws.addRow([
      "Account Description",
      "Jan", "Feb", "Mar", "Q1 TOTAL",
      "Apr", "Mei", "Jun", "Q2 TOTAL",
      "Jul", "Agu", "Sep", "Q3 TOTAL",
      "Okt", "Nov", "Des", "Q4 TOTAL",
      "FULL YEAR", "% OF REV"
    ]);
    headerRow.height = 24;

    headerRow.eachCell((cell, colNum) => {
      cell.border = BORDERS.thin;
      cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "right" };

      if (colNum === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderDesc } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
      } else if ([5, 9, 13, 17].includes(colNum)) {
        // Quarters
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderQuarter } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.colHeaderQuarterText } };
      } else if (colNum === 18) {
        // Full Year
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderYear } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.colHeaderYearText } };
      } else if (colNum === 19) {
        // % of Rev
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderPct } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.colHeaderPctText } };
      } else {
        // Normal Months
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderMonth } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.colHeaderMonthText } };
      }
    });

    return ws;
  };

  // Helper to add a Section Divider Row
  const addSectionRow = (ws: ExcelJS.Worksheet, title: string) => {
    const row = ws.addRow([title]);
    const rIdx = row.number;
    ws.mergeCells(`A${rIdx}:S${rIdx}`);
    row.height = 22;
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.sectionBg } };
    row.getCell(1).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.sectionText } };
    row.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    row.getCell(1).border = BORDERS.section;
    return rIdx;
  };

  // Helper to add a Standard Data Row with Formulas
  const addDataRow = (
    ws: ExcelJS.Worksheet,
    desc: string,
    extractor: (m: BudgetMonthData) => number,
    months: BudgetMonthData[],
    netRevRow?: number,
    isRateOrAverage: boolean = false
  ) => {
    const vals = months.map((m) => Math.round(extractor(m) || 0));
    const row = ws.addRow([desc]);
    const r = row.number;
    row.height = 19;

    // Col 1: Description
    const cellDesc = row.getCell(1);
    cellDesc.font = { name: "Segoe UI", size: 9.5 };
    cellDesc.border = BORDERS.thin;
    cellDesc.alignment = { vertical: "middle", horizontal: "left" };

    // Month Col mappings:
    // Jan: B(2), Feb: C(3), Mar: D(4), Q1: E(5)
    // Apr: F(6), Mei: G(7), Jun: H(8), Q2: I(9)
    // Jul: J(10), Agu: K(11), Sep: L(12), Q3: M(13)
    // Okt: N(14), Nov: O(15), Des: P(16), Q4: Q(17)
    // Full Year: R(18), % Rev: S(19)

    // Q1
    row.getCell(2).value = vals[0];
    row.getCell(3).value = vals[1];
    row.getCell(4).value = vals[2];
    row.getCell(5).value = isRateOrAverage
      ? { formula: `AVERAGE(B${r}:D${r})`, result: Math.round((vals[0] + vals[1] + vals[2]) / 3) }
      : { formula: `SUM(B${r}:D${r})`, result: vals[0] + vals[1] + vals[2] };

    // Q2
    row.getCell(6).value = vals[3];
    row.getCell(7).value = vals[4];
    row.getCell(8).value = vals[5];
    row.getCell(9).value = isRateOrAverage
      ? { formula: `AVERAGE(F${r}:H${r})`, result: Math.round((vals[3] + vals[4] + vals[5]) / 3) }
      : { formula: `SUM(F${r}:H${r})`, result: vals[3] + vals[4] + vals[5] };

    // Q3
    row.getCell(10).value = vals[6];
    row.getCell(11).value = vals[7];
    row.getCell(12).value = vals[8];
    row.getCell(13).value = isRateOrAverage
      ? { formula: `AVERAGE(J${r}:L${r})`, result: Math.round((vals[6] + vals[7] + vals[8]) / 3) }
      : { formula: `SUM(J${r}:L${r})`, result: vals[6] + vals[7] + vals[8] };

    // Q4
    row.getCell(14).value = vals[9];
    row.getCell(15).value = vals[10];
    row.getCell(16).value = vals[11];
    row.getCell(17).value = isRateOrAverage
      ? { formula: `AVERAGE(N${r}:P${r})`, result: Math.round((vals[9] + vals[10] + vals[11]) / 3) }
      : { formula: `SUM(N${r}:P${r})`, result: vals[9] + vals[10] + vals[11] };

    // Full Year
    const sumAll = vals.reduce((a, b) => a + b, 0);
    row.getCell(18).value = isRateOrAverage
      ? { formula: `AVERAGE(B${r},C${r},D${r},F${r},G${r},H${r},J${r},K${r},L${r},N${r},O${r},P${r})`, result: Math.round(sumAll / 12) }
      : { formula: `E${r}+I${r}+M${r}+Q${r}`, result: sumAll };

    // % of Net Revenue
    if (netRevRow && !isRateOrAverage) {
      row.getCell(19).value = { formula: `IF(R$${netRevRow}>0, R${r}/R$${netRevRow}, 0)` };
    } else {
      row.getCell(19).value = "-";
    }

    // Styling cells
    for (let c = 2; c <= 19; c++) {
      const cell = row.getCell(c);
      cell.border = BORDERS.thin;
      cell.alignment = { vertical: "middle", horizontal: "right" };

      if (c === 19) {
        cell.numFmt = "0.0%";
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.pctCellBg } };
        cell.font = { name: "Segoe UI", size: 9, color: { argb: "FF581C87" } };
      } else if (c === 18) {
        cell.numFmt = "#,##0";
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.yearCellBg } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF064E3B" } };
      } else if ([5, 9, 13, 17].includes(c)) {
        cell.numFmt = "#,##0";
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.quarterCellBg } };
        cell.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF1E3A8A" } };
      } else {
        cell.numFmt = "#,##0";
        cell.font = { name: "Segoe UI", size: 9 };
      }
    }

    return r;
  };

  // Helper to add a Subtotal / Sum Row of multiple row indices
  const addSumRow = (
    ws: ExcelJS.Worksheet,
    desc: string,
    startRow: number,
    endRow: number,
    netRevRow?: number,
    isProfitHighlight: boolean = false
  ) => {
    const row = ws.addRow([desc]);
    const r = row.number;
    row.height = isProfitHighlight ? 22 : 20;

    const bg = isProfitHighlight ? COLORS.profitBg : COLORS.subtotalBg;
    const fg = isProfitHighlight ? COLORS.profitText : COLORS.subtotalText;
    const border = isProfitHighlight ? BORDERS.profit : BORDERS.subtotal;

    const cols = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];

    cols.forEach((colLetter, idx) => {
      const colNum = idx + 2;
      const cell = row.getCell(colNum);
      if ([5, 9, 13, 17].includes(colNum)) {
        // Quarter column
        const qStart = cols[idx - 3];
        const qEnd = cols[idx - 1];
        cell.value = { formula: `SUM(${qStart}${r}:${qEnd}${r})` };
      } else if (colNum === 18) {
        // Full Year
        cell.value = { formula: `E${r}+I${r}+M${r}+Q${r}` };
      } else {
        cell.value = { formula: `SUM(${colLetter}${startRow}:${colLetter}${endRow})` };
      }
      cell.numFmt = "#,##0";
      cell.border = border;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: fg } };
      cell.alignment = { vertical: "middle", horizontal: "right" };
    });

    // Col 1 Styling
    const cellDesc = row.getCell(1);
    cellDesc.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: fg } };
    cellDesc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cellDesc.border = border;
    cellDesc.alignment = { vertical: "middle", horizontal: "left" };

    // Col 19 (% of Net Rev)
    const cellPct = row.getCell(19);
    cellPct.border = border;
    cellPct.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cellPct.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: fg } };
    cellPct.alignment = { vertical: "middle", horizontal: "right" };
    cellPct.numFmt = "0.0%";
    if (netRevRow) {
      cellPct.value = { formula: `IF(R$${netRevRow}>0, R${r}/R$${netRevRow}, 0)` };
    }

    return r;
  };

  // Helper to add a Formula Calculation Row (e.g., A - B)
  const addCalcRow = (
    ws: ExcelJS.Worksheet,
    desc: string,
    formulaBuilder: (col: string) => string,
    netRevRow?: number,
    isProfitHighlight: boolean = true
  ) => {
    const row = ws.addRow([desc]);
    const r = row.number;
    row.height = isProfitHighlight ? 22 : 20;

    const bg = isProfitHighlight ? COLORS.profitBg : COLORS.subtotalBg;
    const fg = isProfitHighlight ? COLORS.profitText : COLORS.subtotalText;
    const border = isProfitHighlight ? BORDERS.profit : BORDERS.subtotal;

    const cols = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];

    cols.forEach((colLetter, idx) => {
      const colNum = idx + 2;
      const cell = row.getCell(colNum);
      if ([5, 9, 13, 17].includes(colNum)) {
        // Quarter column
        const qStart = cols[idx - 3];
        const qEnd = cols[idx - 1];
        cell.value = { formula: `SUM(${qStart}${r}:${qEnd}${r})` };
      } else if (colNum === 18) {
        // Full Year
        cell.value = { formula: `E${r}+I${r}+M${r}+Q${r}` };
      } else {
        cell.value = { formula: formulaBuilder(colLetter) };
      }
      cell.numFmt = "#,##0";
      cell.border = border;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: fg } };
      cell.alignment = { vertical: "middle", horizontal: "right" };
    });

    // Col 1 Styling
    const cellDesc = row.getCell(1);
    cellDesc.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: fg } };
    cellDesc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cellDesc.border = border;
    cellDesc.alignment = { vertical: "middle", horizontal: "left" };

    // Col 19
    const cellPct = row.getCell(19);
    cellPct.border = border;
    cellPct.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cellPct.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: fg } };
    cellPct.alignment = { vertical: "middle", horizontal: "right" };
    cellPct.numFmt = "0.0%";
    if (netRevRow) {
      cellPct.value = { formula: `IF(R$${netRevRow}>0, R${r}/R$${netRevRow}, 0)` };
    }

    return r;
  };

  // ════════════════════════════════════════════════════════════════════════
  // 1. FULL ANNUAL MASTER EXCEL WORKBOOK (MULTI-SHEET USALI COMPREHENSIVE)
  // ════════════════════════════════════════════════════════════════════════
  const exportYearlyMasterExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = "CRS Setara Hospitality";
    wb.lastModifiedBy = "CRS Setara Hospitality";
    wb.created = new Date();
    wb.modified = new Date();

    const months = getMonthsArray();

    // ─────────────────────────────────────────────────────────────
    // SHEET 1: SUMMARY P&L (CONSOLIDATED USALI 11TH EDITION)
    // ─────────────────────────────────────────────────────────────
    const wsPnl = setupMatrixWorksheet(wb, "Summary P&L", "Summary Profit & Loss (Consolidated USALI)");

    // 1. Operating Revenue
    addSectionRow(wsPnl, "=== 1. OPERATING REVENUE ===");
    const rRoomRev = addDataRow(wsPnl, "3013 • Rooms Revenue", (m) => m.summaryPnl?.roomRevenue || 0, months, 11);
    const rFnbRev = addDataRow(wsPnl, "3023 • Food & Beverage Revenue", (m) => m.summaryPnl?.fnbRevenue || 0, months, 11);
    const rModRev = addDataRow(wsPnl, "3323 • Minor Operating Departments (MOD)", (m) => m.summaryPnl?.modRevenue || 0, months, 11);
    const rNetRev = addSumRow(wsPnl, "TOTAL HOTEL NET REVENUE", rRoomRev, rModRev, 11);
    const rSc = addDataRow(wsPnl, "Service Charge (10%)", (m) => m.summaryPnl?.serviceCharge || 0, months, rNetRev);
    const rTax = addDataRow(wsPnl, "Government Tax (10%)", (m) => m.summaryPnl?.governmentTax || 0, months, rNetRev);
    addCalcRow(wsPnl, "TOTAL GROSS REVENUE (INC. TAX & SC)", (col) => `${col}${rNetRev}+${col}${rSc}+${col}${rTax}`, rNetRev, false);
    wsPnl.addRow([]);

    // 2. Cost of Goods Sold (COGS)
    addSectionRow(wsPnl, "=== 2. COST OF GOODS SOLD (COGS) ===");
    const rRoomCogs = addDataRow(wsPnl, "Cost of Sales - Rooms (Linen & Supplies)", (m) => m.summaryPnl?.roomCogs || 0, months, rNetRev);
    const rFnbCogs = addDataRow(wsPnl, "Cost of Sales - Food & Beverage", (m) => m.summaryPnl?.fnbCogs || 0, months, rNetRev);
    const rModCogs = addDataRow(wsPnl, "Cost of Sales - Minor Operating Dept", (m) => m.summaryPnl?.modCogs || 0, months, rNetRev);
    const rTotalCogs = addSumRow(wsPnl, "TOTAL COST OF GOODS SOLD (COGS)", rRoomCogs, rModCogs, rNetRev);
    const rGrossProfit = addCalcRow(wsPnl, "TOTAL GROSS PROFIT (GROSS MARGIN)", (col) => `${col}${rNetRev}-${col}${rTotalCogs}`, rNetRev, true);
    wsPnl.addRow([]);

    // 3. Departmental Operational Expenses
    addSectionRow(wsPnl, "=== 3. DEPARTMENTAL OPERATIONAL EXPENSES ===");
    const rRoomExp = addDataRow(wsPnl, "Rooms Department Operational Expenses", (m) => m.summaryPnl?.roomExpenses || 0, months, rNetRev);
    const rFnbExp = addDataRow(wsPnl, "Food & Beverage Operational Expenses", (m) => m.summaryPnl?.fnbExpenses || 0, months, rNetRev);
    const rModExp = addDataRow(wsPnl, "Minor Operating Department Expenses", (m) => m.summaryPnl?.modExpenses || 0, months, rNetRev);
    const rTotalDeptExp = addSumRow(wsPnl, "TOTAL DEPARTMENTAL EXPENSES", rRoomExp, rModExp, rNetRev);
    const rTdp = addCalcRow(wsPnl, "TOTAL DEPARTMENTAL PROFIT (TDP)", (col) => `${col}${rGrossProfit}-${col}${rTotalDeptExp}`, rNetRev, true);
    wsPnl.addRow([]);

    // 4. Undistributed Operating Expenses (UOE)
    addSectionRow(wsPnl, "=== 4. UNDISTRIBUTED OPERATING EXPENSES (UOE) ===");
    const rAgExp = addDataRow(wsPnl, "Administrative & General (A&G)", (m) => m.summaryPnl?.agExpenses || 0, months, rNetRev);
    const rHrdExp = addDataRow(wsPnl, "Human Resources Department (HRD)", (m) => m.summaryPnl?.hrdExpenses || 0, months, rNetRev);
    const rSmExp = addDataRow(wsPnl, "Sales & Marketing (S&M)", (m) => m.summaryPnl?.smExpenses || 0, months, rNetRev);
    const rPomecExp = addDataRow(wsPnl, "Property Operations, Maintenance & Energy (POMEC)", (m) => m.summaryPnl?.pomecExpenses || 0, months, rNetRev);
    const rTotalUoe = addSumRow(wsPnl, "TOTAL UNDISTRIBUTED EXPENSES", rAgExp, rPomecExp, rNetRev);
    wsPnl.addRow([]);

    // 5. GOP & NOI
    addSectionRow(wsPnl, "=== 5. GROSS OPERATING PROFIT (GOP) & NET OPERATING INCOME (NOI) ===");
    const rGop = addCalcRow(wsPnl, "GROSS OPERATING PROFIT (GOP)", (col) => `${col}${rTdp}-${col}${rTotalUoe}`, rNetRev, true);
    const rNonOp = addDataRow(wsPnl, "Non-Operating Expenses (Fees, Insurance, PBB)", (m) => m.summaryPnl?.nonOperatingExpenses || 0, months, rNetRev);
    addCalcRow(wsPnl, "NET OPERATING INCOME (NOI / EBITDA)", (col) => `${col}${rGop}-${col}${rNonOp}`, rNetRev, true);

    // ─────────────────────────────────────────────────────────────
    // SHEET 2: ROOM DEPARTMENT (ROOM-FO & ROOM-HK)
    // ─────────────────────────────────────────────────────────────
    const wsRoom = setupMatrixWorksheet(wb, "Room Dept", "Room Department Detailed Budget (FO & HK)");
    addSectionRow(wsRoom, "=== 1. ROOM STATISTICS ===");
    addDataRow(wsRoom, "Total Rooms Available", (m) => m.statistic?.roomsAvailable || 0, months, undefined, true);
    addDataRow(wsRoom, "Occupied Rooms (Paid)", (m) => m.statistic?.occupiedRoomsPaid || 0, months, undefined, true);
    addDataRow(wsRoom, "Complimentary & House Use Rooms", (m) => (m.statistic?.roomsCompliment || 0) + (m.statistic?.houseUse || 0), months, undefined, true);
    addDataRow(wsRoom, "Total Guest Pax", (m) => m.statistic?.totalPax || 0, months, undefined, true);
    addDataRow(wsRoom, "Occupancy Rate (%)", (m) => m.statistic?.occupancyPercent || 0, months, undefined, true);
    addDataRow(wsRoom, "Average Room Rate (ARR / ADR)", (m) => m.statistic?.arrIdr || 0, months, undefined, true);
    wsRoom.addRow([]);

    addSectionRow(wsRoom, "=== 2. ROOM REVENUE & COGS ===");
    const rLodging = addDataRow(wsRoom, "3013-01 • Lodging Revenue", (m) => m.roomRevenue?.lodging || 0, months);
    const rExtraBed = addDataRow(wsRoom, "3013-02 • Extra Bed Revenue", (m) => m.roomRevenue?.extraBed || 0, months);
    const rOtherRoom = addDataRow(wsRoom, "3013-03 • Other Room Revenue", (m) => m.roomRevenue?.otherRoomRevenue || 0, months);
    const rTotRoomRev = addSumRow(wsRoom, "TOTAL ROOM REVENUE", rLodging, rOtherRoom);
    const rSupplies = addDataRow(wsRoom, "COGS - Guest Supplies & Amenities", (m) => m.deptRoom?.cogs?.roomSupplies || 0, months, rTotRoomRev);
    const rLinen = addDataRow(wsRoom, "COGS - Linen Replacement", (m) => m.deptRoom?.cogs?.linenReplacement || 0, months, rTotRoomRev);
    const rTotRoomCogs = addSumRow(wsRoom, "TOTAL ROOM COGS", rSupplies, rLinen, rTotRoomRev);
    wsRoom.addRow([]);

    addSectionRow(wsRoom, "=== 3. FRONT OFFICE EXPENSES ===");
    const rFoPayroll = addDataRow(wsRoom, "FO Payroll & Employee Benefits", (m) => m.deptRoom?.frontOffice?.salary?.total || 0, months, rTotRoomRev);
    const rFoUniform = addDataRow(wsRoom, "FO Uniform & Laundry", (m) => m.deptRoom?.frontOffice?.expenses?.uniform || 0, months, rTotRoomRev);
    const rFoPrint = addDataRow(wsRoom, "FO Printing & Stationery", (m) => m.deptRoom?.frontOffice?.expenses?.printingStationery || 0, months, rTotRoomRev);
    const rFoNet = addDataRow(wsRoom, "FO Internet & TV Cable", (m) => (m.deptRoom?.frontOffice?.expenses?.internetProvider || 0) + (m.deptRoom?.frontOffice?.expenses?.tvCable || 0), months, rTotRoomRev);
    const rFoWelcome = addDataRow(wsRoom, "FO Welcome Drink & Supplies", (m) => (m.deptRoom?.frontOffice?.expenses?.welcomeDrink || 0) + (m.deptRoom?.frontOffice?.expenses?.guestSupplies || 0), months, rTotRoomRev);
    const rFoOta = addDataRow(wsRoom, "FO Reservation & OTA Commission", (m) => (m.deptRoom?.frontOffice?.expenses?.reservationExpenses || 0) + (m.deptRoom?.frontOffice?.expenses?.commission || 0), months, rTotRoomRev);
    const rFoMisc = addDataRow(wsRoom, "FO Miscellaneous & Other", (m) => m.deptRoom?.frontOffice?.expenses?.miscellaneous || 0, months, rTotRoomRev);
    const rTotFoExp = addSumRow(wsRoom, "TOTAL FRONT OFFICE EXPENSES", rFoPayroll, rFoMisc, rTotRoomRev);
    wsRoom.addRow([]);

    addSectionRow(wsRoom, "=== 4. HOUSEKEEPING EXPENSES ===");
    const rHkPayroll = addDataRow(wsRoom, "HK Payroll & Employee Benefits", (m) => m.deptRoom?.housekeeping?.salary?.total || 0, months, rTotRoomRev);
    const rHkSupplies = addDataRow(wsRoom, "HK Guest Supplies & Amenities", (m) => m.deptRoom?.housekeeping?.expenses?.guestSupplies || 0, months, rTotRoomRev);
    const rHkChemical = addDataRow(wsRoom, "HK Cleaning Supplies & Chemicals", (m) => m.deptRoom?.housekeeping?.expenses?.cleaningSupplies || 0, months, rTotRoomRev);
    const rHkLaundry = addDataRow(wsRoom, "HK Laundry Linen Washing", (m) => m.deptRoom?.housekeeping?.expenses?.laundryLinen || 0, months, rTotRoomRev);
    const rHkGarden = addDataRow(wsRoom, "HK Landscape & Gardening", (m) => m.deptRoom?.housekeeping?.expenses?.landscapeGround || 0, months, rTotRoomRev);
    const rHkPest = addDataRow(wsRoom, "HK Pest Control & Deodorant", (m) => (m.deptRoom?.housekeeping?.expenses?.pestControl || 0) + (m.deptRoom?.housekeeping?.expenses?.roomDeodorant || 0), months, rTotRoomRev);
    const rHkMisc = addDataRow(wsRoom, "HK Miscellaneous & Other", (m) => m.deptRoom?.housekeeping?.expenses?.miscellaneous || 0, months, rTotRoomRev);
    const rTotHkExp = addSumRow(wsRoom, "TOTAL HOUSEKEEPING EXPENSES", rHkPayroll, rHkMisc, rTotRoomRev);
    wsRoom.addRow([]);

    addSectionRow(wsRoom, "=== 5. ROOM DEPARTMENT PROFIT ===");
    const rTotRoomExp = addCalcRow(wsRoom, "TOTAL ROOM OPERATIONAL EXPENSES", (col) => `${col}${rTotFoExp}+${col}${rTotHkExp}`, rTotRoomRev, false);
    addCalcRow(wsRoom, "ROOM DEPARTMENT PROFIT (GOP)", (col) => `${col}${rTotRoomRev}-${col}${rTotRoomCogs}-${col}${rTotRoomExp}`, rTotRoomRev, true);

    // ─────────────────────────────────────────────────────────────
    // SHEET 3: FOOD & BEVERAGE DEPARTMENT
    // ─────────────────────────────────────────────────────────────
    const wsFnb = setupMatrixWorksheet(wb, "F&B Dept", "Food & Beverage Department Detailed Budget");
    addSectionRow(wsFnb, "=== 1. F&B REVENUE BREAKDOWN ===");
    const rRestFood = addDataRow(wsFnb, "Restaurant - Food Revenue", (m) => m.deptFnb?.revenue?.restaurant?.food || 0, months);
    const rRestBev = addDataRow(wsFnb, "Restaurant - Beverage Revenue", (m) => m.deptFnb?.revenue?.restaurant?.beverage || 0, months);
    const rRoomServ = addDataRow(wsFnb, "Room Service Revenue", (m) => m.deptFnb?.revenue?.roomService?.total || 0, months);
    const rBanquet = addDataRow(wsFnb, "Banquet & Event Revenue", (m) => m.deptFnb?.revenue?.banquet?.total || 0, months);
    const rBar = addDataRow(wsFnb, "Lounge & Bar Revenue", (m) => m.deptFnb?.revenue?.lounge?.total || 0, months);
    const rTotFnbRev = addSumRow(wsFnb, "TOTAL F&B REVENUE", rRestFood, rBar);
    wsFnb.addRow([]);

    addSectionRow(wsFnb, "=== 2. F&B COST OF GOODS SOLD (COGS) ===");
    const rFoodCost = addDataRow(wsFnb, "Food Cost (Groceries & Ingredients)", (m) => m.deptFnb?.cogs?.restaurant?.costFood || 0, months, rTotFnbRev);
    const rBevCost = addDataRow(wsFnb, "Beverage Cost", (m) => m.deptFnb?.cogs?.restaurant?.costBeverage || 0, months, rTotFnbRev);
    const rOtherCost = addDataRow(wsFnb, "Other F&B Production Cost", (m) => m.deptFnb?.cogs?.restaurant?.costOther || 0, months, rTotFnbRev);
    const rTotFnbCogs = addSumRow(wsFnb, "TOTAL F&B COGS", rFoodCost, rOtherCost, rTotFnbRev);
    wsFnb.addRow([]);

    addSectionRow(wsFnb, "=== 3. F&B OPERATIONAL EXPENSES ===");
    const rFnbServPay = addDataRow(wsFnb, "F&B Service Payroll & Benefits", (m) => m.deptFnb?.restaurant?.salary?.total || 0, months, rTotFnbRev);
    const rKitchenPay = addDataRow(wsFnb, "Kitchen Culinary Payroll & Benefits", (m) => m.deptFnb?.kitchen?.salary?.total || 0, months, rTotFnbRev);
    const rGas = addDataRow(wsFnb, "Kitchen Fuel & LPG Gas", (m) => m.deptFnb?.kitchen?.expenses?.kitchenFuelGas || 0, months, rTotFnbRev);
    const rKitchenSupp = addDataRow(wsFnb, "Kitchen Supplies & Service Equipment", (m) => (m.deptFnb?.kitchen?.expenses?.kitchenSupplies || 0) + (m.deptFnb?.kitchen?.expenses?.serviceEquipment || 0), months, rTotFnbRev);
    const rChinaGlass = addDataRow(wsFnb, "China, Glass & Silverware Replacement", (m) => m.deptFnb?.restaurant?.expenses?.chinaGlassSilverware || 0, months, rTotFnbRev);
    const rCleanPest = addDataRow(wsFnb, "Cleaning Supplies & Kitchen Pest Control", (m) => (m.deptFnb?.kitchen?.expenses?.cleaningSupplies || 0) + (m.deptFnb?.kitchen?.expenses?.pestControl || 0), months, rTotFnbRev);
    const rFnbLinen = addDataRow(wsFnb, "Linen Replacement & Laundry", (m) => (m.deptFnb?.restaurant?.expenses?.linenReplacement || 0) + (m.deptFnb?.restaurant?.expenses?.laundryLinen || 0), months, rTotFnbRev);
    const rMenuPrint = addDataRow(wsFnb, "Menu Printing & Paper Supplies", (m) => (m.deptFnb?.restaurant?.expenses?.menuFoodBevList || 0) + (m.deptFnb?.restaurant?.expenses?.paperSupplies || 0), months, rTotFnbRev);
    const rTotFnbExp = addSumRow(wsFnb, "TOTAL F&B OPERATIONAL EXPENSES", rFnbServPay, rMenuPrint, rTotFnbRev);
    wsFnb.addRow([]);

    addSectionRow(wsFnb, "=== 4. F&B DEPARTMENT PROFIT ===");
    addCalcRow(wsFnb, "F&B DEPARTMENT PROFIT (GOP)", (col) => `${col}${rTotFnbRev}-${col}${rTotFnbCogs}-${col}${rTotFnbExp}`, rTotFnbRev, true);

    // ─────────────────────────────────────────────────────────────
    // SHEET 4: MINOR OPERATING DEPARTMENTS (MOD)
    // ─────────────────────────────────────────────────────────────
    const wsMod = setupMatrixWorksheet(wb, "Minor Operating", "Minor Operating Departments (Laundry, Spa, Other)");
    addSectionRow(wsMod, "=== 1. LAUNDRY OUTLET ===");
    const rLdrRev = addDataRow(wsMod, "Guest Laundry Revenue", (m) => m.deptMod?.laundry?.revenue?.laundry || 0, months);
    const rLdrCogs = addDataRow(wsMod, "Laundry COGS (Chemicals & Detergents)", (m) => m.deptMod?.laundry?.cogs?.total || 0, months, rLdrRev);
    const rLdrExp = addDataRow(wsMod, "Laundry Payroll & Operating Expenses", (m) => (m.deptMod?.laundry?.salary?.total || 0) + (m.deptMod?.laundry?.expenses?.total || 0), months, rLdrRev);
    addCalcRow(wsMod, "Laundry Outlet Department Profit", (col) => `${col}${rLdrRev}-${col}${rLdrCogs}-${col}${rLdrExp}`, rLdrRev, false);
    wsMod.addRow([]);

    addSectionRow(wsMod, "=== 2. SPA & WELLNESS OUTLET ===");
    const rSpaRev = addDataRow(wsMod, "Spa & Massage Therapy Revenue", (m) => m.deptMod?.spaFitness?.revenue?.massageTherapy || 0, months);
    const rSpaCogs = addDataRow(wsMod, "Spa COGS (Oils & Treatment Products)", (m) => m.deptMod?.spaFitness?.cogs?.total || 0, months, rSpaRev);
    const rSpaExp = addDataRow(wsMod, "Spa Payroll & Operating Expenses", (m) => (m.deptMod?.spaFitness?.salary?.total || 0) + (m.deptMod?.spaFitness?.expenses?.total || 0), months, rSpaRev);
    addCalcRow(wsMod, "Spa & Wellness Outlet Profit", (col) => `${col}${rSpaRev}-${col}${rSpaCogs}-${col}${rSpaExp}`, rSpaRev, false);
    wsMod.addRow([]);

    addSectionRow(wsMod, "=== 3. OTHER OPERATING INCOME ===");
    const rSpaceRent = addDataRow(wsMod, "Space & Venue Rental", (m) => m.deptMod?.otherIncome?.revenue?.spaceRental || 0, months);
    const rTransport = addDataRow(wsMod, "Guest Transportation & Car Rental", (m) => m.deptMod?.otherIncome?.revenue?.transportation || 0, months);
    const rCityTour = addDataRow(wsMod, "City Tour & Excursions", (m) => m.deptMod?.otherIncome?.revenue?.cityTour || 0, months);
    const rCommOI = addDataRow(wsMod, "Commission & Sundry Income", (m) => m.deptMod?.otherIncome?.revenue?.commission || 0, months);
    const rTotOiRev = addSumRow(wsMod, "Total Other Income Revenue", rSpaceRent, rCommOI);
    const rTotOiCogs = addDataRow(wsMod, "Total Other Income COGS", (m) => m.deptMod?.otherIncome?.cogs?.total || 0, months, rTotOiRev);
    wsMod.addRow([]);

    addSectionRow(wsMod, "=== 4. TOTAL MINOR OPERATING SUMMARY ===");
    const rTotModRevAll = addCalcRow(wsMod, "TOTAL MOD REVENUE", (col) => `${col}${rLdrRev}+${col}${rSpaRev}+${col}${rTotOiRev}`, undefined, false);
    const rTotModCogsAll = addCalcRow(wsMod, "TOTAL MOD COGS", (col) => `${col}${rLdrCogs}+${col}${rSpaCogs}+${col}${rTotOiCogs}`, rTotModRevAll, false);
    const rTotModExpAll = addCalcRow(wsMod, "TOTAL MOD OPERATING EXPENSES", (col) => `${col}${rLdrExp}+${col}${rSpaExp}`, rTotModRevAll, false);
    addCalcRow(wsMod, "TOTAL MOD DEPARTMENT PROFIT", (col) => `${col}${rTotModRevAll}-${col}${rTotModCogsAll}-${col}${rTotModExpAll}`, rTotModRevAll, true);

    // ─────────────────────────────────────────────────────────────
    // SHEET 5: UNDISTRIBUTED OPERATING EXPENSES (UOE)
    // ─────────────────────────────────────────────────────────────
    const wsUoe = setupMatrixWorksheet(wb, "Undistributed Exp", "Undistributed Operating Expenses (A&G, HRD, S&M, POMEC)");
    addSectionRow(wsUoe, "=== 1. ADMINISTRATIVE & GENERAL (A&G) ===");
    const rAgPay = addDataRow(wsUoe, "A&G Payroll & Employee Benefits", (m) => m.deptAg?.salary?.total || 0, months);
    const rAgBank = addDataRow(wsUoe, "Bank Charges, EDC & Merchant Fees", (m) => m.deptAg?.expenses?.bankChargesEdc || 0, months);
    const rAgAudit = addDataRow(wsUoe, "Legal, Audit & Professional Fees", (m) => m.deptAg?.expenses?.legalAuditFees || 0, months);
    const rAgIt = addDataRow(wsUoe, "Software Licenses & IT Systems", (m) => m.deptAg?.expenses?.softwareLicensesIt || 0, months);
    const rAgTel = addDataRow(wsUoe, "Telephone, Internet & TV Cable", (m) => (m.deptAg?.expenses?.telephone || 0) + (m.deptAg?.expenses?.internetProvider || 0), months);
    const rAgIns = addDataRow(wsUoe, "Property & General Insurance", (m) => (m.deptAg?.expenses?.insuranceProperty || 0) + (m.deptAg?.expenses?.insuranceGeneral || 0), months);
    const rAgSec = addDataRow(wsUoe, "Security & Operational Services", (m) => m.deptAg?.expenses?.securityExpenses || 0, months);
    const rAgMisc = addDataRow(wsUoe, "A&G Miscellaneous & Other", (m) => m.deptAg?.expenses?.miscellaneous || 0, months);
    const rTotAg = addSumRow(wsUoe, "TOTAL A&G EXPENSES", rAgPay, rAgMisc);
    wsUoe.addRow([]);

    addSectionRow(wsUoe, "=== 2. HUMAN RESOURCES DEPARTMENT (HRD) ===");
    const rHrdPay = addDataRow(wsUoe, "HRD Payroll & Employee Benefits", (m) => m.deptHrd?.salary?.total || 0, months);
    const rHrdTrain = addDataRow(wsUoe, "Staff Training & Development", (m) => m.deptHrd?.expenses?.trainingSeminar || 0, months);
    const rHrdRecruit = addDataRow(wsUoe, "Recruitment & Job Advertisement", (m) => m.deptHrd?.expenses?.recruitmentAdvertisement || 0, months);
    const rHrdOuting = addDataRow(wsUoe, "Staff Outing, Gathering & Welfare", (m) => m.deptHrd?.expenses?.staffGatheringOuting || 0, months);
    const rHrdClinic = addDataRow(wsUoe, "Medical, Clinic & Health Support", (m) => m.deptHrd?.expenses?.medicalClinic || 0, months);
    const rHrdUniform = addDataRow(wsUoe, "Staff Uniform & Laundry", (m) => m.deptHrd?.expenses?.uniform || 0, months);
    const rTotHrd = addSumRow(wsUoe, "TOTAL HRD EXPENSES", rHrdPay, rHrdUniform);
    wsUoe.addRow([]);

    addSectionRow(wsUoe, "=== 3. SALES & MARKETING (S&M) ===");
    const rSmPay = addDataRow(wsUoe, "S&M Payroll & Employee Benefits", (m) => m.deptSm?.salary?.total || 0, months);
    const rSmAds = addDataRow(wsUoe, "Online Ads, Google & Meta Ads", (m) => m.deptSm?.expenses?.advertisingPromotionOnline || 0, months);
    const rSmOta = addDataRow(wsUoe, "OTA & Travel Agent Commissions", (m) => (m.deptSm?.expenses?.otaCommissions || 0) + (m.deptSm?.expenses?.travelAgentCommissions || 0), months);
    const rSmWeb = addDataRow(wsUoe, "Website, Domain & Digital Marketing", (m) => m.deptSm?.expenses?.websiteHostingDomain || 0, months);
    const rSmPhoto = addDataRow(wsUoe, "Photoshoot, Video & Content Creator", (m) => m.deptSm?.expenses?.photoVideoShootingContent || 0, months);
    const rSmPr = addDataRow(wsUoe, "Brochures, Collaterals & PR Media", (m) => (m.deptSm?.expenses?.marketingCollateralsBrochures || 0) + (m.deptSm?.expenses?.publicRelationsMedia || 0), months);
    const rTotSm = addSumRow(wsUoe, "TOTAL S&M EXPENSES", rSmPay, rSmPr);
    wsUoe.addRow([]);

    addSectionRow(wsUoe, "=== 4. PROPERTY OPERATIONS, MAINTENANCE & ENERGY (POMEC) ===");
    const rPomecPay = addDataRow(wsUoe, "POMEC Payroll & Employee Benefits", (m) => m.deptPomec?.salary?.total || 0, months);
    const rPln = addDataRow(wsUoe, "Electricity (PLN)", (m) => m.deptPomec?.energy?.electricityPln || 0, months);
    const rWater = addDataRow(wsUoe, "Water (PDAM / Deep Well)", (m) => m.deptPomec?.energy?.waterPdamWell || 0, months);
    const rGenset = addDataRow(wsUoe, "Generator Fuel & Diesel Solar", (m) => m.deptPomec?.energy?.dieselFuelSolar || 0, months);
    const rAc = addDataRow(wsUoe, "Air Conditioning Maintenance", (m) => m.deptPomec?.maintenance?.airConditioning || 0, months);
    const rBldg = addDataRow(wsUoe, "Building, Structural & Painting Repairs", (m) => (m.deptPomec?.maintenance?.buildingStructural || 0) + (m.deptPomec?.maintenance?.paintingCarpentry || 0), months);
    const rPool = addDataRow(wsUoe, "Plumbing, Water System & Pool Chemicals", (m) => (m.deptPomec?.maintenance?.plumbingWaterSystem || 0) + (m.deptPomec?.maintenance?.swimmingPoolChemicals || 0), months);
    const rTotPomec = addSumRow(wsUoe, "TOTAL POMEC EXPENSES", rPomecPay, rPool);
    wsUoe.addRow([]);

    addSectionRow(wsUoe, "=== 5. TOTAL UNDISTRIBUTED OPERATING EXPENSES ===");
    addCalcRow(wsUoe, "TOTAL UNDISTRIBUTED EXPENSES", (col) => `${col}${rTotAg}+${col}${rTotHrd}+${col}${rTotSm}+${col}${rTotPomec}`, undefined, true);

    // ─────────────────────────────────────────────────────────────
    // SHEET 6: MANNING & PAYROLL PLAN
    // ─────────────────────────────────────────────────────────────
    const wsManning = wb.addWorksheet("Manning & Payroll", {
      views: [{ state: "frozen", xSplit: 1, ySplit: 5 }],
      properties: { showGridLines: true, defaultRowHeight: 20 },
    });

    wsManning.columns = [
      { key: "dept", width: 38 },
      { key: "headcount", width: 16 },
      { key: "salaryKontrak", width: 18 },
      { key: "dailyWorker", width: 18 },
      { key: "bpjsKes", width: 16 },
      { key: "bpjsTk", width: 16 },
      { key: "bonusThr", width: 16 },
      { key: "monthlyTotal", width: 22 },
      { key: "annualTotal", width: 24 },
    ];

    // Banner
    const mR1 = wsManning.addRow([hotelName.toUpperCase()]);
    wsManning.mergeCells("A1:I1");
    mR1.height = 24;
    mR1.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
    mR1.getCell(1).font = { name: "Segoe UI", size: 12, bold: true, color: { argb: COLORS.headerText } };
    mR1.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    const mR2 = wsManning.addRow([`ANNUAL HOTEL MANNING & PAYROLL PLAN — ${year}`]);
    wsManning.mergeCells("A2:I2");
    mR2.height = 20;
    mR2.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.subtitleBg } };
    mR2.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: COLORS.subtitleText } };
    mR2.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    const mR3 = wsManning.addRow([`Fiscal Year: ${year} | Capacity: ${hotelRoomCount} Physical Rooms | Currency: IDR`]);
    wsManning.mergeCells("A3:I3");
    mR3.height = 18;
    mR3.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    mR3.getCell(1).font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF475569" } };
    mR3.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    wsManning.addRow([]);
    wsManning.getRow(4).height = 8;

    const mHeader = wsManning.addRow([
      "Department",
      "Headcount (Pax)",
      "Basic Salary",
      "Daily Workers",
      "BPJS Kesehatan",
      "BPJS TK",
      "Bonus / THR",
      "Total Monthly Payroll",
      "Annual Payroll (12M)"
    ]);
    mHeader.height = 24;

    mHeader.eachCell((cell, colNum) => {
      cell.border = BORDERS.thin;
      cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "right" };
      if (colNum === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderDesc } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
      } else if (colNum === 8) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderQuarter } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.colHeaderQuarterText } };
      } else if (colNum === 9) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderYear } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.colHeaderYearText } };
      } else {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderMonth } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.colHeaderMonthText } };
      }
    });

    const depts = [
      { key: "frontOffice", label: "Front Office (FO)", salary: months[0]?.deptRoom?.frontOffice?.salary },
      { key: "housekeeping", label: "Housekeeping (HK)", salary: months[0]?.deptRoom?.housekeeping?.salary },
      { key: "kitchen", label: "F&B Kitchen (Culinary)", salary: months[0]?.deptFnb?.kitchen?.salary },
      { key: "restaurant", label: "F&B Service & Bar", salary: months[0]?.deptFnb?.restaurant?.salary },
      { key: "ag", label: "Administration & General (A&G)", salary: months[0]?.deptAg?.salary },
      { key: "hrd", label: "Human Resources (HRD)", salary: months[0]?.deptHrd?.salary },
      { key: "sm", label: "Sales & Marketing (S&M)", salary: months[0]?.deptSm?.salary },
      { key: "pomec", label: "Engineering & Maintenance (POMEC)", salary: months[0]?.deptPomec?.salary },
      { key: "laundry", label: "Laundry", salary: months[0]?.deptMod?.laundry?.salary },
      { key: "spa", label: "Spa & Wellness", salary: months[0]?.deptMod?.spaFitness?.salary },
    ];

    const startDeptRow = 6;
    depts.forEach((d) => {
      const s = d.salary;
      const hc = budgetDoc?.manning?.departments?.[d.key as any]?.headcount || 1;
      const row = wsManning.addRow([
        d.label,
        hc,
        s?.salaryKontrak || 0,
        s?.wagesDailyWorker || 0,
        s?.bpjsKesehatan || 0,
        s?.bpjsKetenagakerjaan || 0,
        s?.bonusThr || 0,
      ]);
      const r = row.number;
      row.height = 19;

      // Col H (8): Total Monthly = SUM(C:G)
      row.getCell(8).value = { formula: `SUM(C${r}:G${r})` };
      // Col I (9): Annual Total = H * 12
      row.getCell(9).value = { formula: `H${r}*12` };

      row.eachCell((cell, colNum) => {
        cell.border = BORDERS.thin;
        cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "right" };
        if (colNum === 1) {
          cell.font = { name: "Segoe UI", size: 9.5 };
        } else if (colNum === 2) {
          cell.numFmt = "#,##0";
          cell.font = { name: "Segoe UI", size: 9.5 };
        } else if (colNum === 8) {
          cell.numFmt = "#,##0";
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.quarterCellBg } };
          cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF1E3A8A" } };
        } else if (colNum === 9) {
          cell.numFmt = "#,##0";
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.yearCellBg } };
          cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF064E3B" } };
        } else {
          cell.numFmt = "#,##0";
          cell.font = { name: "Segoe UI", size: 9 };
        }
      });
    });

    const endDeptRow = startDeptRow + depts.length - 1;
    wsManning.addRow([]);

    // Grand Total Row
    const mTotRow = wsManning.addRow([
      "TOTAL HOTEL MANNING & PAYROLL",
    ]);
    const mTotR = mTotRow.number;
    mTotRow.height = 22;

    mTotRow.getCell(2).value = { formula: `SUM(B${startDeptRow}:B${endDeptRow})` };
    mTotRow.getCell(3).value = { formula: `SUM(C${startDeptRow}:C${endDeptRow})` };
    mTotRow.getCell(4).value = { formula: `SUM(D${startDeptRow}:D${endDeptRow})` };
    mTotRow.getCell(5).value = { formula: `SUM(E${startDeptRow}:E${endDeptRow})` };
    mTotRow.getCell(6).value = { formula: `SUM(F${startDeptRow}:F${endDeptRow})` };
    mTotRow.getCell(7).value = { formula: `SUM(G${startDeptRow}:G${endDeptRow})` };
    mTotRow.getCell(8).value = { formula: `SUM(H${startDeptRow}:H${endDeptRow})` };
    mTotRow.getCell(9).value = { formula: `SUM(I${startDeptRow}:I${endDeptRow})` };

    mTotRow.eachCell((cell, colNum) => {
      cell.border = BORDERS.profit;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.profitBg } };
      cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.profitText } };
      cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "right" };
      if (colNum >= 2) cell.numFmt = "#,##0";
    });

    // ─────────────────────────────────────────────────────────────
    // SHEET 7: FEES & NOI SUMMARY
    // ─────────────────────────────────────────────────────────────
    const wsFees = setupMatrixWorksheet(wb, "Fees & NOI", "Management Fees & Net Operating Income (NOI)");
    addSectionRow(wsFees, "=== 1. MANAGEMENT FEES & OWNER EXPENSES ===");
    const rBaseFee = addDataRow(wsFees, "Operator Base Management Fee", (m) => m.deptNonOp?.managementBaseFee || 0, months);
    const rIncentFee = addDataRow(wsFees, "Operator Incentive Management Fee", (m) => m.deptNonOp?.managementIncentiveFee || 0, months);
    const rFranchise = addDataRow(wsFees, "Franchise / Royalty Fee", (m) => m.deptNonOp?.franchiseRoyaltyFee || 0, months);
    const rInsProp = addDataRow(wsFees, "Building & Property Insurance", (m) => m.deptNonOp?.buildingInsurance || 0, months);
    const rPbb = addDataRow(wsFees, "Property Tax (PBB)", (m) => m.deptNonOp?.propertyTaxPbb || 0, months);
    const rInterest = addDataRow(wsFees, "Bank Interest & Financing Charges", (m) => m.deptNonOp?.bankInterestCharges || 0, months);
    const rDeprec = addDataRow(wsFees, "Depreciation & Amortization", (m) => m.deptNonOp?.depreciationAmortization || 0, months);
    const rTotNonOp = addSumRow(wsFees, "TOTAL NON-OPERATING EXPENSES", rBaseFee, rDeprec);
    wsFees.addRow([]);

    addSectionRow(wsFees, "=== 2. BOTTOM LINE SUMMARY ===");
    const rGopSummary = addDataRow(wsFees, "GROSS OPERATING PROFIT (GOP)", (m) => m.summaryPnl?.grossOperatingProfit || 0, months);
    addCalcRow(wsFees, "NET OPERATING INCOME (NOI)", (col) => `${col}${rGopSummary}-${col}${rTotNonOp}`, undefined, true);

    // Save Workbook
    const cleanHotelName = hotelName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    await saveWorkbook(wb, `BUDGET_MASTER_${cleanHotelName}_${year}_USALI.xlsx`);
  };

  // ════════════════════════════════════════════════════════════════════════
  // 2. ACTIVE MONTH DETAILED EXCEL EXPORT (SINGLE MONTH DETAILED BREAKDOWN)
  // ════════════════════════════════════════════════════════════════════════
  const exportMonthlyBudgetExcel = async (monthKey: string = "01") => {
    const wb = new ExcelJS.Workbook();
    wb.creator = "CRS Setara Hospitality";
    wb.lastModifiedBy = "CRS Setara Hospitality";
    wb.created = new Date();
    wb.modified = new Date();

    const monthNum = parseInt(monthKey, 10);
    const monthName = MONTH_NAMES[monthNum - 1] || "Januari";
    const mData = budgetDoc?.months?.[monthKey] || createDefaultBudgetMonthData();
    const pnl = mData.summaryPnl;

    const ws = wb.addWorksheet(`Budget ${monthName}`, {
      views: [{ state: "frozen", xSplit: 0, ySplit: 6 }],
      properties: { showGridLines: true, defaultRowHeight: 20 },
    });

    ws.columns = [
      { key: "code", width: 16 },
      { key: "desc", width: 44 },
      { key: "dept", width: 22 },
      { key: "amount", width: 25 },
      { key: "pct", width: 18 },
    ];

    // Banner
    const r1 = ws.addRow([hotelName.toUpperCase()]);
    ws.mergeCells("A1:E1");
    r1.height = 24;
    r1.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
    r1.getCell(1).font = { name: "Segoe UI", size: 12, bold: true, color: { argb: COLORS.headerText } };
    r1.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    const r2 = ws.addRow([`MONTHLY OPERATING BUDGET BREAKDOWN — ${monthName.toUpperCase()} ${year}`]);
    ws.mergeCells("A2:E2");
    r2.height = 20;
    r2.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.subtitleBg } };
    r2.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: COLORS.subtitleText } };
    r2.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    const r3 = ws.addRow([`Period: ${monthName} ${year} | Capacity: ${hotelRoomCount} Physical Rooms | Standard: USALI`]);
    ws.mergeCells("A3:E3");
    r3.height = 18;
    r3.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    r3.getCell(1).font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF475569" } };
    r3.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    const r4 = ws.addRow([`Exported: ${new Date().toLocaleString("id-ID")} | Currency: IDR (Rupiah)`]);
    ws.mergeCells("A4:E4");
    r4.height = 18;
    r4.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    r4.getCell(1).font = { name: "Segoe UI", size: 8.5, color: { argb: "FF64748B" } };
    r4.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    ws.addRow([]);
    ws.getRow(5).height = 8;

    const mHeader = ws.addRow(["Account Code", "Account Description", "Department / Category", "Budget Amount (IDR)", "% of Net Revenue"]);
    mHeader.height = 24;
    mHeader.eachCell((cell, colNum) => {
      cell.border = BORDERS.thin;
      cell.alignment = { vertical: "middle", horizontal: colNum >= 4 ? "right" : "left" };
      if (colNum === 4) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderQuarter } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.colHeaderQuarterText } };
      } else if (colNum === 5) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderPct } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.colHeaderPctText } };
      } else {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.colHeaderDesc } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
      }
    });

    const addMonthSection = (title: string) => {
      const row = ws.addRow(["---", title, "", "", ""]);
      const r = row.number;
      ws.mergeCells(`B${r}:E${r}`);
      row.height = 22;
      row.getCell(1).font = { name: "Segoe UI", size: 9, color: { argb: "FF94A3B8" } };
      row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.sectionBg } };
      row.getCell(2).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: COLORS.sectionText } };
      row.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      row.getCell(2).border = BORDERS.section;
    };

    const addMonthItem = (code: string, desc: string, dept: string, amount: number, netRevR: number) => {
      const row = ws.addRow([code, desc, dept, Math.round(amount)]);
      const r = row.number;
      row.height = 19;
      row.getCell(5).value = { formula: `IF(D$${netRevR}>0, D${r}/D$${netRevR}, 0)` };

      row.eachCell((cell, colNum) => {
        cell.border = BORDERS.thin;
        cell.alignment = { vertical: "middle", horizontal: colNum >= 4 ? "right" : "left" };
        if (colNum === 4) {
          cell.numFmt = "#,##0";
          cell.font = { name: "Segoe UI", size: 9.5 };
        } else if (colNum === 5) {
          cell.numFmt = "0.0%";
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.pctCellBg } };
          cell.font = { name: "Segoe UI", size: 9, color: { argb: "FF581C87" } };
        } else {
          cell.font = { name: "Segoe UI", size: 9.5 };
        }
      });
      return r;
    };

    const addMonthCalc = (code: string, desc: string, dept: string, formulaStr: string, isProfit: boolean = false, netRevR?: number) => {
      const row = ws.addRow([code, desc, dept]);
      const r = row.number;
      row.height = isProfit ? 22 : 20;
      row.getCell(4).value = { formula: formulaStr };
      if (netRevR) {
        row.getCell(5).value = { formula: `IF(D$${netRevR}>0, D${r}/D$${netRevR}, 0)` };
      }

      const bg = isProfit ? COLORS.profitBg : COLORS.subtotalBg;
      const fg = isProfit ? COLORS.profitText : COLORS.subtotalText;
      const border = isProfit ? BORDERS.profit : BORDERS.subtotal;

      row.eachCell((cell, colNum) => {
        cell.border = border;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: fg } };
        cell.alignment = { vertical: "middle", horizontal: colNum >= 4 ? "right" : "left" };
        if (colNum === 4) cell.numFmt = "#,##0";
        if (colNum === 5) cell.numFmt = "0.0%";
      });
      return r;
    };

    // Revenue Section
    addMonthSection("=== I. OPERATING REVENUE ===");
    const rM_room = addMonthItem("3013", "Rooms Revenue (Lodging & Extra Bed)", "ROOM", pnl?.roomRevenue || 0, 11);
    const rM_fnb = addMonthItem("3023", "Food & Beverage Revenue", "F&B", pnl?.fnbRevenue || 0, 11);
    const rM_mod = addMonthItem("3323", "Minor Operating Departments (MOD)", "MOD", pnl?.modRevenue || 0, 11);
    const rM_netRev = addMonthCalc("---", "TOTAL NET REVENUE", "TOTAL", `SUM(D${rM_room}:D${rM_mod})`, false, 11);
    const rM_sc = addMonthItem("2110", "Service Charge (10%)", "SC", pnl?.serviceCharge || 0, rM_netRev);
    const rM_tax = addMonthItem("2120", "Government Tax (10%)", "TAX", pnl?.governmentTax || 0, rM_netRev);
    addMonthCalc("---", "TOTAL GROSS REVENUE", "GROSS", `D${rM_netRev}+D${rM_sc}+D${rM_tax}`, false, rM_netRev);
    ws.addRow([]);

    // COGS Section
    addMonthSection("=== II. COST OF GOODS SOLD (COGS) ===");
    const rM_cogsRoom = addMonthItem("4010", "Room COGS (Supplies & Linen Replacement)", "ROOM", pnl?.roomCogs || 0, rM_netRev);
    const rM_cogsFnb = addMonthItem("4020", "Food & Beverage COGS", "F&B", pnl?.fnbCogs || 0, rM_netRev);
    const rM_cogsMod = addMonthItem("4030", "Minor Operating COGS", "MOD", pnl?.modCogs || 0, rM_netRev);
    const rM_totCogs = addMonthCalc("---", "TOTAL COST OF GOODS SOLD (COGS)", "COGS", `SUM(D${rM_cogsRoom}:D${rM_cogsMod})`, false, rM_netRev);
    const rM_grossProfit = addMonthCalc("---", "GROSS OPERATING PROFIT (GROSS MARGIN)", "PROFIT", `D${rM_netRev}-D${rM_totCogs}`, true, rM_netRev);
    ws.addRow([]);

    // Departmental Expenses Section
    addMonthSection("=== III. DEPARTMENTAL OPERATIONAL EXPENSES ===");
    const rM_expRoom = addMonthItem("5010", "Rooms Department Expenses (FO + HK)", "ROOM", pnl?.roomExpenses || 0, rM_netRev);
    const rM_expFnb = addMonthItem("5020", "Food & Beverage Department Expenses", "F&B", pnl?.fnbExpenses || 0, rM_netRev);
    const rM_expMod = addMonthItem("5030", "Minor Operating Department Expenses", "MOD", pnl?.modExpenses || 0, rM_netRev);
    const rM_totDeptExp = addMonthCalc("---", "TOTAL DEPARTMENTAL EXPENSES", "EXPENSES", `SUM(D${rM_expRoom}:D${rM_expMod})`, false, rM_netRev);
    const rM_tdp = addMonthCalc("---", "TOTAL DEPARTMENTAL PROFIT (TDP)", "PROFIT", `D${rM_grossProfit}-D${rM_totDeptExp}`, true, rM_netRev);
    ws.addRow([]);

    // UOE Section
    addMonthSection("=== IV. UNDISTRIBUTED OPERATING EXPENSES ===");
    const rM_ag = addMonthItem("6010", "Administrative & General (A&G)", "A&G", pnl?.agExpenses || 0, rM_netRev);
    const rM_hrd = addMonthItem("6020", "Human Resources Department (HRD)", "HRD", pnl?.hrdExpenses || 0, rM_netRev);
    const rM_sm = addMonthItem("6030", "Sales & Marketing (S&M)", "S&M", pnl?.smExpenses || 0, rM_netRev);
    const rM_pomec = addMonthItem("6040", "Property Operations, Maintenance & Energy (POMEC)", "POMEC", pnl?.pomecExpenses || 0, rM_netRev);
    const rM_totUoe = addMonthCalc("---", "TOTAL UNDISTRIBUTED EXPENSES", "UOE", `SUM(D${rM_ag}:D${rM_pomec})`, false, rM_netRev);
    ws.addRow([]);

    // Bottom Line Section
    addMonthSection("=== V. BOTTOM LINE PROFIT ===");
    const rM_gop = addMonthCalc("---", "GROSS OPERATING PROFIT (GOP)", "GOP", `D${rM_tdp}-D${rM_totUoe}`, true, rM_netRev);
    const rM_nonOp = addMonthItem("7010", "Non-Operating Expenses (Fees, Ins, PBB)", "NON-OP", pnl?.nonOperatingExpenses || 0, rM_netRev);
    addMonthCalc("---", "NET OPERATING INCOME (NOI / EBITDA)", "NOI", `D${rM_gop}-D${rM_nonOp}`, true, rM_netRev);

    // Save Workbook
    const cleanHotelName = hotelName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    await saveWorkbook(wb, `BUDGET_${cleanHotelName}_${year}_${monthKey}_${monthName}.xlsx`);
  };

  return {
    exportYearlyMasterExcel,
    exportMonthlyBudgetExcel,
  };
};
