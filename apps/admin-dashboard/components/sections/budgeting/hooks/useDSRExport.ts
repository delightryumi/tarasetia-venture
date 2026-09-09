import * as XLSX from "xlsx";
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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return {
    exportToExcel,
    handlePrint,
  };
};
