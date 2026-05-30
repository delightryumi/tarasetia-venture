"use client";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatIDR, GlobalPnLResult, PnlExpenseItem, PnLDetailedItem } from "@/lib/pnl-utils";

interface UsePnLExportOptions {
    pnlResult:    GlobalPnLResult | null;
    expenses:     PnlExpenseItem[];
    viewMode:     "monthly" | "yearly";
    month:        string;
    year:         string;
    selectedDrillDownTitle?: string;
    drillItems?:  PnLDetailedItem[];
}

export function usePnLExport({
    pnlResult, expenses, viewMode, month, year,
    selectedDrillDownTitle, drillItems,
}: UsePnLExportOptions) {

    const handleExportExcel = () => {
        if (!pnlResult) return;
        const summaryData = [
            { Category: "Total Gross Revenue",      Amount: pnlResult.card1_TotalRevenue },
            { Category: "Revenue Hotel Collect",    Amount: pnlResult.card3_RevHotelCollect },
            { Category: "Revenue Nexura Collect",   Amount: pnlResult.card3_RevNexuraCollect },
            { Category: "Other Income Total",       Amount: pnlResult.card5_OtherRevenue },
            { Category: "VAT Input",                Amount: pnlResult.card11_VAT },
            { Category: "Management Fee",           Amount: pnlResult.card9_FeeGross },
            { Category: "Total Operational Expenses", Amount: pnlResult.card8_TotalExpenses },
            { Category: "TOTAL GOP",                Amount: pnlResult.card7_TotalGOP },
        ];
        const expensesData   = expenses.map((e) => ({ Name: e.name, Amount: e.amount, Allocation: e.allocation || "SHARED" }));
        const investorData   = pnlResult.investorDistributions.map((i) => ({ Investor: i.name, Share: `${i.share}%`, Payout: i.amount }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData),  "Financial Summary");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), "Detailed Expenses");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(investorData), "Investor Shares");
        XLSX.writeFile(wb, `Nexura_PnL_Audit_${viewMode}_${month}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!pnlResult) return;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Nexura Financial Report - Global PnL", 14, 20);
        doc.setFontSize(10);
        doc.text(`Periode: ${viewMode === "monthly" ? month : year} | Exported: ${new Date().toLocaleString()}`, 14, 28);
        autoTable(doc, {
            startY: 35,
            head:   [["Financial Metric", "Value"]],
            body: [
                ["Total Gross Revenue",  formatIDR(pnlResult.card1_TotalRevenue)],
                ["Other Revenue",        formatIDR(pnlResult.card5_OtherRevenue)],
                ["Total Expenses",       formatIDR(pnlResult.card8_TotalExpenses)],
                ["VAT Input",            formatIDR(pnlResult.card11_VAT)],
                ["Management Fee",       formatIDR(pnlResult.card9_FeeGross)],
                ["NET GOP / PROFIT",     formatIDR(pnlResult.card7_TotalGOP)],
            ],
            theme: "striped",
            headStyles: { fillColor: [120, 128, 105] },
        });
        doc.text("Detailed Operational Expenses", 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head:   [["Expense Name", "Allocation", "Amount"]],
            body:   expenses.map((e) => [e.name, e.allocation || "SHARED", formatIDR(e.amount)]),
            theme: "grid",
            headStyles: { fillColor: [60, 60, 60] },
        });
        doc.save(`Nexura_PnL_Report_${month}.pdf`);
    };

    const handleExportDrillExcel = () => {
        if (!selectedDrillDownTitle || !drillItems) return;
        const rows = drillItems.map((item, idx) => ({
            "#":          idx + 1,
            Source:       item.source,
            Description:  item.description,
            Department:   item.department ?? "—",
            "Doc Type":   item.docType    ?? "—",
            Type:         item.type === "expense" ? "Expense" : "Income",
            Amount:       item.amount,
            Date:         item.date,
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), selectedDrillDownTitle.slice(0, 31));
        XLSX.writeFile(wb, `Detail_${selectedDrillDownTitle.replace(/\s+/g, "_")}_${month}.xlsx`);
    };

    return { handleExportExcel, handleExportPDF, handleExportDrillExcel };
}
