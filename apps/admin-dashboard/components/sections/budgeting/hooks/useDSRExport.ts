import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DSRReportResult, DSRDataRow } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";

interface UseDSRExportProps {
  dsrReport: DSRReportResult;
  hotelName: string;
}

export const useDSRExport = ({ dsrReport, hotelName }: UseDSRExportProps) => {
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const [y, m, d] = dsrReport.date.split("-");
    const formattedDate = `${d}/${m}/${y}`;

    const rows: (string | number)[][] = [
      [hotelName.toUpperCase()],
      [`DAILY SALES REPORT On ${formattedDate}`],
      [],
      [
        "Remark",
        "TODAY Actual",
        "TODAY Var",
        "MTD Actual",
        "MTD %",
        "MTD Budget",
        "MTD Var",
        "YTD Actual",
        "YTD %",
        "YTD Budget",
        "YTD Var",
      ],
      ["--- STATISTIC ---"],
    ];

    const appendGroup = (title: string, groupRows: DSRDataRow[]) => {
      rows.push([`--- ${title.toUpperCase()} ---`]);
      groupRows.forEach((r) => {
        const c = r.cells;
        rows.push([
          r.label,
          c.todayActual || 0,
          c.todayVar !== undefined ? c.todayVar : "",
          c.mtdActual || 0,
          `${(c.mtdPercent || 0).toFixed(1)}%`,
          c.mtdBudget || 0,
          c.mtdVar || 0,
          c.ytdActual || 0,
          `${(c.ytdPercent || 0).toFixed(1)}%`,
          c.ytdBudget || 0,
          c.ytdVar || 0,
        ]);
      });
    };

    appendGroup("Statistic", dsrReport.statistics);
    appendGroup("Room Revenue", dsrReport.roomRevenue);
    appendGroup("Food Revenue", dsrReport.foodRevenue);
    appendGroup("Beverage Revenue", dsrReport.beverageRevenue);
    appendGroup("Other F&B Revenue", dsrReport.otherFnbRevenue);
    appendGroup("Minor Operating Revenue", dsrReport.minorOperatingRevenue);
    appendGroup("Amenities Revenue", dsrReport.amenitiesRevenue);
    appendGroup("Summary Totals", dsrReport.summaryTotals);

    // Payments
    rows.push([]);
    rows.push(["--- CREDIT / SETTLEMENTS ---"]);
    rows.push(["Payment Method", "TODAY", "", "MTD", "", "", "", "YTD", "", "", ""]);
    const p = dsrReport.payments;
    [
      p.cashFo,
      p.cashOutlet,
      p.cashRefundFo,
      p.totalCash,
      p.edcBca,
      p.edcMandiri,
      p.qris,
      p.transfer,
      p.cityLedger,
      p.totalSettlement,
    ].forEach((item) => {
      rows.push([item.label, item.today, "", item.mtd, "", "", "", item.ytd]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 32 }, // Remark
      { wch: 16 }, // TODAY Actual
      { wch: 14 }, // TODAY Var
      { wch: 18 }, // MTD Actual
      { wch: 10 }, // MTD %
      { wch: 18 }, // MTD Budget
      { wch: 18 }, // MTD Var
      { wch: 20 }, // YTD Actual
      { wch: 10 }, // YTD %
      { wch: 20 }, // YTD Budget
      { wch: 20 }, // YTD Var
    ];

    XLSX.utils.book_append_sheet(wb, ws, "DSR Report");
    XLSX.writeFile(wb, `DSR_${hotelName.replace(/\s+/g, "_")}_${dsrReport.date}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF("landscape", "mm", "a4");

    const [y, m, d] = dsrReport.date.split("-");
    const formattedDate = `${d}/${m}/${y}`;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(hotelName.toUpperCase(), 14, 13);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`DAILY SALES REPORT On ${formattedDate}`, 14, 19);
    doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 287, 19, { align: "right" });

    // Build Table Body
    const tableBody: any[] = [];

    const formatNum = (val: number, isPercent?: boolean, isCurrency?: boolean) => {
      if (isPercent) return `${val.toFixed(2)} %`;
      if (isCurrency) {
        if (val === 0) return "-";
        return formatIDR(Math.round(val));
      }
      if (val === 0) return "0";
      return Number.isInteger(val) ? val.toLocaleString("id-ID") : val.toFixed(1);
    };

    const formatVarNum = (val: number, isPercent?: boolean, isCurrency?: boolean) => {
      if (val === 0) return "-";
      const formatted = formatNum(val, isPercent, isCurrency);
      return val > 0 ? `+${formatted}` : formatted;
    };

    const addSectionHeader = (title: string, bg: [number, number, number] = [226, 232, 240], textCol: [number, number, number] = [15, 23, 42]) => {
      tableBody.push([
        {
          content: title,
          colSpan: 11,
          styles: {
            fillColor: bg,
            textColor: textCol,
            fontStyle: "bold",
            halign: "left",
            fontSize: 7.5,
          },
        },
      ]);
    };

    const addGroupRows = (rows: DSRDataRow[]) => {
      rows.forEach((r) => {
        const c = r.cells;
        const isBold = r.isTotal || r.isHighlight;
        const bg: [number, number, number] | undefined = r.isHighlight
          ? [254, 243, 199]
          : r.isTotal
          ? [241, 245, 249]
          : undefined;

        tableBody.push([
          { content: r.label, styles: { fontStyle: isBold ? "bold" : "normal", fillColor: bg } },
          { content: formatNum(c.todayActual, r.isPercent, r.isCurrency), styles: { halign: "right", fontStyle: isBold ? "bold" : "normal", fillColor: bg } },
          { content: c.todayVar !== undefined ? formatVarNum(c.todayVar, r.isPercent, r.isCurrency) : "-", styles: { halign: "right", textColor: (c.todayVar || 0) >= 0 ? [21, 128, 61] : [185, 28, 28], fillColor: bg } },
          { content: formatNum(c.mtdActual, r.isPercent, r.isCurrency), styles: { halign: "right", fontStyle: "bold", fillColor: bg } },
          { content: r.isPercent ? "-" : `${(c.mtdPercent || 0).toFixed(1)}%`, styles: { halign: "right", fillColor: bg } },
          { content: formatNum(c.mtdBudget, r.isPercent, r.isCurrency), styles: { halign: "right", textColor: [100, 116, 139], fillColor: bg } },
          { content: formatVarNum(c.mtdVar, r.isPercent, r.isCurrency), styles: { halign: "right", textColor: (c.mtdVar || 0) >= 0 ? [21, 128, 61] : [185, 28, 28], fillColor: bg } },
          { content: formatNum(c.ytdActual, r.isPercent, r.isCurrency), styles: { halign: "right", fontStyle: "bold", fillColor: bg } },
          { content: r.isPercent ? "-" : `${(c.ytdPercent || 0).toFixed(1)}%`, styles: { halign: "right", fillColor: bg } },
          { content: formatNum(c.ytdBudget, r.isPercent, r.isCurrency), styles: { halign: "right", textColor: [100, 116, 139], fillColor: bg } },
          { content: formatVarNum(c.ytdVar, r.isPercent, r.isCurrency), styles: { halign: "right", textColor: (c.ytdVar || 0) >= 0 ? [21, 128, 61] : [185, 28, 28], fillColor: bg } },
        ]);
      });
    };

    addSectionHeader("STATISTIC", [241, 245, 249], [15, 23, 42]);
    addGroupRows(dsrReport.statistics);

    addSectionHeader("DEBIT (REVENUE BREAKDOWN)", [15, 23, 42], [253, 224, 71]);
    addSectionHeader("ROOM REVENUE", [248, 250, 252], [51, 65, 85]);
    addGroupRows(dsrReport.roomRevenue);

    addSectionHeader("FOOD & BEVERAGE", [248, 250, 252], [51, 65, 85]);
    addGroupRows(dsrReport.foodRevenue);
    addGroupRows(dsrReport.beverageRevenue);
    addGroupRows(dsrReport.otherFnbRevenue);

    addSectionHeader("MINOR OPERATING", [248, 250, 252], [51, 65, 85]);
    addGroupRows(dsrReport.minorOperatingRevenue);

    addSectionHeader("AMENITIES", [248, 250, 252], [51, 65, 85]);
    addGroupRows(dsrReport.amenitiesRevenue);

    addSectionHeader("SUMMARY TOTALS", [226, 232, 240], [15, 23, 42]);
    addGroupRows(dsrReport.summaryTotals);

    addSectionHeader("CREDIT (SETTLEMENT / PAYMENTS)", [15, 23, 42], [125, 211, 252]);
    const p = dsrReport.payments;
    [
      p.cashFo,
      p.cashOutlet,
      p.cashRefundFo,
      p.totalCash,
      p.edcBca,
      p.edcMandiri,
      p.qris,
      p.transfer,
      p.cityLedger,
      p.totalSettlement,
    ].forEach((item) => {
      const isTotal = item.id.includes("total");
      const bg: [number, number, number] | undefined = isTotal ? [241, 245, 249] : undefined;
      tableBody.push([
        { content: item.label, styles: { fontStyle: isTotal ? "bold" : "normal", fillColor: bg } },
        { content: item.today > 0 ? formatIDR(item.today) : "-", styles: { halign: "right", fillColor: bg } },
        { content: "-", styles: { halign: "center", fillColor: bg } },
        { content: item.mtd > 0 ? formatIDR(item.mtd) : "-", styles: { halign: "right", fontStyle: "bold", fillColor: bg } },
        { content: "-", colSpan: 3, styles: { halign: "center", textColor: [150, 150, 150], fillColor: bg } },
        { content: item.ytd > 0 ? formatIDR(item.ytd) : "-", styles: { halign: "right", fontStyle: "bold", fillColor: bg } },
        { content: "-", colSpan: 3, styles: { halign: "center", textColor: [150, 150, 150], fillColor: bg } },
      ]);
    });

    autoTable(doc, {
      startY: 23,
      head: [
        [
          { content: "Remark", rowSpan: 2, styles: { halign: "left", valign: "middle" } },
          { content: "TODAY", colSpan: 2, styles: { halign: "center" } },
          { content: "MTD", colSpan: 4, styles: { halign: "center" } },
          { content: "YTD", colSpan: 4, styles: { halign: "center" } },
        ],
        [
          { content: "Actual", styles: { halign: "right" } },
          { content: "Var", styles: { halign: "right" } },
          { content: "Actual", styles: { halign: "right" } },
          { content: "%", styles: { halign: "right" } },
          { content: "Budget", styles: { halign: "right" } },
          { content: "Var", styles: { halign: "right" } },
          { content: "Actual", styles: { halign: "right" } },
          { content: "%", styles: { halign: "right" } },
          { content: "Budget", styles: { halign: "right" } },
          { content: "Var", styles: { halign: "right" } },
        ],
      ],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: "bold",
        cellPadding: 1.5,
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.2,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 22 },
        2: { cellWidth: 20 },
        3: { cellWidth: 24 },
        4: { cellWidth: 15 },
        5: { cellWidth: 24 },
        6: { cellWidth: 22 },
        7: { cellWidth: 26 },
        8: { cellWidth: 15 },
        9: { cellWidth: 26 },
        10: { cellWidth: 24 },
      },
      margin: { left: 9, right: 9, top: 23, bottom: 8 },
    });

    doc.save(`DSR_${hotelName.replace(/\s+/g, "_")}_${dsrReport.date}.pdf`);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return {
    exportToExcel,
    exportToPDF,
    handlePrint,
  };
};

