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
        const sharedExpensesTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const gapAmount = pnlResult.totalGap || 0;

        const summaryData = [
            // I. Revenue Breakdown
            { "Section / Metric": "I. Revenue Breakdown", Description: "Categorized revenue streams", Amount: null },
            { "Section / Metric": "Total Revenue Hotel Collect", Description: "Gross revenue pre-deduction", Amount: pnlResult.card1_TotalRevenue },
            { "Section / Metric": "Revenue Hotel Collect (GOP)", Description: "Basis for share calculations", Amount: pnlResult.card6_GOP },
            { "Section / Metric": "Revenue Non Commission", Description: "Direct income streams", Amount: pnlResult.card2_NonCommRevenue },
            { "Section / Metric": "Penalty Fee", Description: "Penalties / adjustments", Amount: pnlResult.card4_PenaltyFee },
            { "Section / Metric": "Other Revenue", Description: "Sundry income", Amount: pnlResult.card5_OtherRevenue },
            { "Section / Metric": "TOTAL GROSS OPERATING PROFIT (GOP)", Description: "Sum of operating revenue", Amount: pnlResult.card7_TotalGOP },
            { "Section / Metric": "", Description: "", Amount: null },
            
            // II. Operational Expenses
            { "Section / Metric": "II. Operational Expenses", Description: "Deductions & operational costs", Amount: null },
            { "Section / Metric": "Shared Expenses", Description: "Accumulated operational costs", Amount: sharedExpensesTotal },
            { "Section / Metric": "Gap Adjustment", Description: "System calibration discrepancy", Amount: -gapAmount },
            { "Section / Metric": "TOTAL DEDUCTION (OPERATIONAL EXPENSES)", Description: "Total operational expense deductions", Amount: pnlResult.card8_TotalExpenses },
            { "Section / Metric": "", Description: "", Amount: null },

            // III. Net Profit Calculation
            { "Section / Metric": "III. Net Profit Calculation", Description: "Tax, fee, and net earnings", Amount: null },
            { "Section / Metric": "Calculation Basis (GOP)", Description: "Total GOP baseline", Amount: pnlResult.card7_TotalGOP },
            { "Section / Metric": "VAT Input", Description: "Value Added Tax input", Amount: -pnlResult.card11_VAT },
            { "Section / Metric": "Service Charge", Description: "F&B service charge collection", Amount: -(pnlResult.summaryServiceCharge || 0) },
            { "Section / Metric": "Lost & Breakage", Description: "F&B lost & breakage deduction", Amount: -(pnlResult.summaryLostBreakage || 0) },
            { "Section / Metric": "Management Fee", Description: "Nexura management fee", Amount: -pnlResult.card9_FeeGross },
            { "Section / Metric": "NET PROFIT NEXURA", Description: "Earnings Before Interest & Tax (EBITDA)", Amount: pnlResult.card12_ReconOwner },
        ];

        const expensesData = expenses.map((e) => ({
            Date: e.date || "—",
            Category: e.category || e.name || "Other",
            Department: e.department || "SHARED",
            Description: e.description || "—",
            Amount: e.amount
        }));

        const investorData = (pnlResult.investorDistributions || []).map((i) => ({
            Investor: i.name,
            Share: `${i.share}%`,
            Payout: i.amount
        }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData),  "Financial Summary");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), "Detailed Expenses");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(investorData), "Investor Shares");
        XLSX.writeFile(wb, `Nexura_PnL_Audit_${viewMode}_${month}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!pnlResult) return;
        const sharedExpensesTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const gapAmount = pnlResult.totalGap || 0;

        const doc = new jsPDF();
        
        // Title block
        doc.setFontSize(18);
        doc.text("Nexura Financial Report - Statement of Profit & Loss", 14, 20);
        doc.setFontSize(10);
        doc.text(`Periode: ${viewMode === "monthly" ? month : year} | Exported: ${new Date().toLocaleString()}`, 14, 28);

        // Section I: Revenue Breakdown
        doc.setFontSize(12);
        doc.text("I. Revenue Breakdown", 14, 38);
        autoTable(doc, {
            startY: 42,
            head:   [["Revenue Line Item", "Amount"]],
            body: [
                ["Total Revenue Hotel Collect",  formatIDR(pnlResult.card1_TotalRevenue)],
                ["Revenue Hotel Collect (GOP)",  formatIDR(pnlResult.card6_GOP)],
                ["Revenue Non Commission",       formatIDR(pnlResult.card2_NonCommRevenue)],
                ["Penalty Fee",                  formatIDR(pnlResult.card4_PenaltyFee)],
                ["Other Revenue",                formatIDR(pnlResult.card5_OtherRevenue)],
                ["TOTAL GROSS OPERATING PROFIT (GOP)", formatIDR(pnlResult.card7_TotalGOP)],
            ],
            theme: "striped",
            headStyles: { fillColor: [120, 128, 105] },
        });

        // Section II: Operational Expenses
        doc.setFontSize(12);
        doc.text("II. Operational Expenses", 14, (doc as any).lastAutoTable.finalY + 12);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 16,
            head:   [["Expense Line Item", "Amount"]],
            body: [
                ["Shared Expenses",   formatIDR(sharedExpensesTotal)],
                ["Gap Adjustment",   formatIDR(-gapAmount)],
                ["TOTAL DEDUCTION (OPERATIONAL EXPENSES)", formatIDR(pnlResult.card8_TotalExpenses)],
            ],
            theme: "striped",
            headStyles: { fillColor: [120, 128, 105] },
        });

        // Section III: Net Profit Calculation
        doc.setFontSize(12);
        doc.text("III. Net Profit Calculation", 14, (doc as any).lastAutoTable.finalY + 12);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 16,
            head:   [["Calculation Metric", "Amount"]],
            body: [
                ["Calculation Basis (GOP)", formatIDR(pnlResult.card7_TotalGOP)],
                ["VAT Tax",                  formatIDR(-pnlResult.card11_VAT)],
                ["Service Charge",           formatIDR(-(pnlResult.summaryServiceCharge || 0))],
                ["Lost & Breakage",          formatIDR(-(pnlResult.summaryLostBreakage || 0))],
                ["Management Fee",           formatIDR(-pnlResult.card9_FeeGross)],
                ["NET PROFIT NEXURA",        formatIDR(pnlResult.card12_ReconOwner)],
            ],
            theme: "striped",
            headStyles: { fillColor: [120, 128, 105] },
        });

        // Section IV: Profit Distribution
        doc.setFontSize(12);
        doc.text("IV. Profit Distribution", 14, (doc as any).lastAutoTable.finalY + 12);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 16,
            head:   [["Shareholder", "Percentage", "Amount"]],
            body:   (pnlResult.investorDistributions || []).map((i) => [
                i.name,
                `${i.share}%`,
                formatIDR(i.amount)
            ]),
            theme: "grid",
            headStyles: { fillColor: [120, 128, 105] },
        });

        // Section V: Detailed Operational Expenses
        doc.setFontSize(12);
        doc.text("V. Detailed Operational Expenses", 14, (doc as any).lastAutoTable.finalY + 12);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 16,
            head:   [["Date", "Category", "Department", "Description", "Amount"]],
            body:   expenses.map((e) => [
                e.date || "—",
                e.category || e.name || "Other",
                e.department || "SHARED",
                e.description || "—",
                formatIDR(e.amount)
            ]),
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
