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
    rawTransactions?: any[];
    posOrders?: any[];
    payrollDetails?: any[];
    startingBalance?: number;
    fixedAssetsValue?: number;
    customIncomes?: any[];
    nonCommissionRevenue?: any[];
}

const isTxIgnored = (tx: any) => {
    if (!tx) return true;
    if (tx.isDeleted) return true;
    const status = (tx.status || "").toUpperCase();
    const payStatus = (tx.paymentStatus || "").toUpperCase();
    return (
        status === "VOID" || 
        status === "VOIDED" || 
        status === "CANCEL" || 
        status === "CANCELLED" || 
        status === "NO-SHOW" ||
        payStatus === "VOID" ||
        payStatus === "VOIDED" ||
        payStatus === "CANCEL" ||
        payStatus === "CANCELLED"
    );
};

export function usePnLExport({
    pnlResult, expenses, viewMode, month, year,
    selectedDrillDownTitle, drillItems,
    rawTransactions = [],
    posOrders = [],
    payrollDetails = [],
    startingBalance = 0,
    fixedAssetsValue = 0,
    customIncomes = [],
    nonCommissionRevenue = [],
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
            { "Section / Metric": "Management Fee", Description: "Hotel management fee", Amount: -pnlResult.card9_FeeGross },
            { "Section / Metric": "NET PROFIT", Description: "Earnings Before Interest & Tax (EBITDA)", Amount: pnlResult.card12_ReconOwner },
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

        // Compute General Ledger data
        const formatRef = (prefix: string, rawRef: string) => {
            if (!rawRef) return `${prefix}-GEN`;
            const clean = rawRef.trim();
            if (clean.length >= 20 && !clean.includes('/') && !clean.includes('-')) {
                return `${prefix}-${clean.slice(0, 7).toUpperCase()}`;
            }
            if (clean.includes('-')) {
                const parts = clean.split('-');
                const docId = parts[0];
                if (docId.length >= 20) {
                    return `${prefix}-${docId.slice(0, 7).toUpperCase()}`;
                }
            }
            return clean.toUpperCase();
        };

        const startingBal = startingBalance || 0;
        const list: any[] = [];
        const [yStr, mStr] = month.split('-');
        const firstDay = new Date(parseInt(yStr), parseInt(mStr) - 1, 1, 0, 0, 0);

        list.push({
            date: firstDay,
            description: "Saldo Awal (Modal / Kas & Bank)",
            ref: "BAL-START",
            coa: "301-000",
            type: "debit",
            amount: startingBal,
            isStartingBalance: true
        });

        (rawTransactions || []).forEach(t => {
            if (isTxIgnored(t)) return;
            const amt = t.totalPrice || t.amount || 0;
            if (amt > 0) {
                list.push({
                    date: new Date(t.createdAt || t.date || new Date()),
                    description: `Penerimaan Kamar - ${t.guestName || "Tamu"}`,
                    ref: formatRef("FO", t.bookingId || t.id),
                    coa: "401-000",
                    type: "debit",
                    amount: amt
                });
            }
        });

        (posOrders || []).forEach(o => {
            const amt = o.amount || 0;
            if (amt > 0) {
                list.push({
                    date: new Date(o.date || new Date()),
                    description: `Penerimaan POS - ${o.description || "Penjualan F&B"}`,
                    ref: formatRef("POS", o.id),
                    coa: "402-000",
                    type: "debit",
                    amount: amt
                });
            }
        });

        (customIncomes || []).forEach(ci => {
            if (ci.amount > 0) {
                list.push({
                    date: new Date(ci.date || new Date()),
                    description: ci.description || "Pendapatan Lainnya",
                    ref: "INC-CUST",
                    coa: "409-000",
                    type: "debit",
                    amount: ci.amount
                });
            }
        });

        (nonCommissionRevenue || []).forEach(nc => {
            if (nc.amount > 0) {
                list.push({
                    date: new Date(nc.date || new Date()),
                    description: nc.description || "Pendapatan Non-Komisi",
                    ref: "INC-NC",
                    coa: "408-000",
                    type: "debit",
                    amount: nc.amount
                });
            }
        });

        (expenses || []).forEach(ex => {
            if (ex.amount > 0) {
                list.push({
                    date: new Date(ex.date || new Date()),
                    description: `Beban Operasional - ${ex.category || "Biaya"} (${ex.description || "Pengeluaran"})`,
                    ref: "EXP-" + (ex.id?.slice(0,5) || "MANUAL"),
                    coa: "502-000",
                    type: "credit",
                    amount: ex.amount
                });
            }
        });

        const payrollSum = (payrollDetails || []).reduce((sum, p) => sum + (p.totalPay || p.totalPayrollExpense || p.amount || 0), 0);
        if (payrollSum > 0) {
            const lastDay = new Date(parseInt(yStr), parseInt(mStr), 0).getDate();
            const dateVal = new Date(parseInt(yStr), parseInt(mStr) - 1, lastDay, 23, 59, 59);
            
            if (payrollDetails && payrollDetails.length > 0) {
                payrollDetails.forEach(p => {
                    const amt = p.totalPay || p.totalPayrollExpense || p.amount || 0;
                    if (amt > 0) {
                        list.push({
                            date: dateVal,
                            description: `Beban Gaji Karyawan - ${p.name || p.staffName || "Karyawan"}`,
                            ref: `PAY-${p.staffId || "STAFF"}`,
                            coa: "501-000",
                            type: "credit",
                            amount: amt
                        });
                    }
                });
            } else {
                list.push({
                    date: dateVal,
                    description: "Beban Gaji Karyawan (Total)",
                    ref: "PAY-TOTAL",
                    coa: "501-000",
                    type: "credit",
                    amount: payrollSum
                });
            }
        }

        list.sort((a, b) => {
            if (a.isStartingBalance) return -1;
            if (b.isStartingBalance) return 1;
            return a.date.getTime() - b.date.getTime();
        });

        let balanceAccum = 0;
        const entriesWithBalance = list.map(e => {
            if (e.type === "debit") balanceAccum += e.amount;
            else balanceAccum -= e.amount;
            return { ...e, balance: balanceAccum };
        });

        const ledgerExcelData = entriesWithBalance.map((e) => ({
            Tanggal: e.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            "Kode Akun (COA)": e.coa,
            Ref: e.ref,
            Keterangan: e.description,
            "Debit (Masuk)": e.isStartingBalance ? null : (e.type === "debit" ? e.amount : null),
            "Kredit (Keluar)": e.isStartingBalance ? null : (e.type === "credit" ? e.amount : null),
            Saldo: e.balance
        }));

        const investorPayouts = (pnlResult.investorDistributions || []).reduce((sum, i) => sum + (i.amount || 0), 0);
        const netIncome = pnlResult.card12_ReconOwner || 0;

        const accountsReceivable = (rawTransactions || []).filter(t => {
            if (isTxIgnored(t)) return false;
            const status = (t.paymentStatus || "").toLowerCase();
            return !status.includes("lunas") && !status.includes("paid");
        }).reduce((sum, t) => sum + (t.amount || 0), 0);

        // Kewajiban (Liabilities)
        const vatLiability = pnlResult.card11_VAT || 0;
        const scLiability = pnlResult.summaryServiceCharge || 0;
        const lbLiability = pnlResult.summaryLostBreakage || 0;
        const feeLiability = pnlResult.card9_FeeGross || 0;

        // Remaining Liabilities (Sisa Kewajiban setelah Pelunasan)
        const sisaVat = Math.max(0, vatLiability - vatPaid);
        const sisaFee = Math.max(0, feeLiability - feePaid);
        const sisaSc = Math.max(0, scLiability - scPaid);
        const sisaLb = Math.max(0, lbLiability - lbPaid);
        const totalLiabilities = sisaVat + sisaFee + sisaSc + sisaLb;

        const gop = pnlResult.card7_TotalGOP || 0;
        const totalPaid = vatPaid + feePaid + scPaid + lbPaid;

        // Cash and Bank
        const cashAndBank = startingBal + gop - investorPayouts - accountsReceivable - fixedAssetsValue - totalPaid;
        
        const totalAssetsLancar = cashAndBank + accountsReceivable;
        const totalAssets = totalAssetsLancar + fixedAssetsValue;
        
        const equity = startingBal + netIncome - investorPayouts;
        const totalLiabilitiesEquity = totalLiabilities + equity;
        const endingBalance = cashAndBank;

        const balanceSheetAOA = [
            ["NERACA (BALANCE SHEET)"],
            [`Periode Akhir: ${month}`],
            [],
            ["AKTIVA (ASSETS)", "", "", "KEWAJIBAN & EKUITAS (LIABILITIES & EQUITY)"],
            ["Aktiva Lancar", "", "", "Kewajiban (Liabilities)"],
            ["  Kas & Bank", cashAndBank, "", "  Hutang Operasional (Management Fee)", sisaFee],
            ["  Piutang Usaha", accountsReceivable, "", "  Pajak Terhutang (VAT / PB1)", sisaVat],
            ["Total Aktiva Lancar", totalAssetsLancar, "", "  Hutang Service Charge Karyawan", sisaSc],
            ["", "", "", "  Cadangan Kehilangan & Kerusakan", sisaLb],
            ["Aktiva Tetap", "", "", "Total Kewajiban", totalLiabilities],
            ["  Inventaris & Peralatan", fixedAssetsValue, "", ""],
            ["", "", "", "Ekuitas (Equity)"],
            ["", "", "", "  Modal Awal / Saldo Laba Bulan Lalu", startingBal],
            ["", "", "", "  Laba (Rugi) Tahun Berjalan", netIncome],
            ["", "", "", "  Distribusi Laba Investor (Dividen)", -investorPayouts],
            ["", "", "", "Total Ekuitas", equity],
            ["TOTAL AKTIVA", totalAssets, "", "TOTAL KEWAJIBAN & EKUITAS", totalLiabilitiesEquity]
        ];
        const balanceSheetSheet = XLSX.utils.aoa_to_sheet(balanceSheetAOA);

        const cashFlowAOA = [
            ["LAPORAN ARUS KAS (CASH FLOW)"],
            ["Cash Flow Statement (Metode Langsung)"],
            [`Periode Akhir: ${month}`],
            [],
            ["Arus Kas dari Aktivitas Operasional"],
            ["  Penerimaan Kas dari Pelanggan (Total Revenue - Piutang)", (pnlResult.totalRevenue || 0) - accountsReceivable],
            ["  Pembayaran Kas untuk Beban Operasional", -(pnlResult.card8_TotalExpenses || 0)],
            ["Kas Bersih dari Aktivitas Operasi", gop - accountsReceivable],
            [],
            ["Arus Kas dari Aktivitas Investasi"],
            ["  Pembelian Inventaris & Peralatan (Aktiva Tetap)", -fixedAssetsValue],
            ["Kas Bersih dari Aktivitas Investasi", -fixedAssetsValue],
            [],
            ["Arus Kas dari Aktivitas Pendanaan"],
            ["  Pembayaran Dividen / Distribusi Investor", -investorPayouts],
            ["Kas Bersih dari Aktivitas Pendanaan", -investorPayouts],
            [],
            ["Ringkasan Arus Kas"],
            ["  Kenaikan (Penurunan) Kas Bersih", (gop - accountsReceivable) - fixedAssetsValue - investorPayouts],
            ["  Saldo Kas Awal Periode", startingBal],
            ["Saldo Kas Akhir Periode", endingBalance]
        ];
        const cashFlowSheet = XLSX.utils.aoa_to_sheet(cashFlowAOA);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData),  "Financial Summary");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), "Detailed Expenses");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(investorData), "Investor Shares");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ledgerExcelData), "Buku Besar (Ledger)");
        XLSX.utils.book_append_sheet(wb, balanceSheetSheet, "Neraca (Balance Sheet)");
        XLSX.utils.book_append_sheet(wb, cashFlowSheet, "Arus Kas (Cash Flow)");
        XLSX.writeFile(wb, `PnL_Audit_${viewMode}_${month}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!pnlResult) return;
        const sharedExpensesTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const gapAmount = pnlResult.totalGap || 0;

        const doc = new jsPDF();
        
        // Title block
        doc.setFontSize(18);
        doc.text("Financial Report - Statement of Profit & Loss", 14, 20);
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
                ["NET PROFIT",        formatIDR(pnlResult.card12_ReconOwner)],
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

        // Compute data for Ledger, Balance Sheet, Cash Flow
        const formatRef = (prefix: string, rawRef: string) => {
            if (!rawRef) return `${prefix}-GEN`;
            const clean = rawRef.trim();
            if (clean.length >= 20 && !clean.includes('/') && !clean.includes('-')) {
                return `${prefix}-${clean.slice(0, 7).toUpperCase()}`;
            }
            if (clean.includes('-')) {
                const parts = clean.split('-');
                const docId = parts[0];
                if (docId.length >= 20) {
                    return `${prefix}-${docId.slice(0, 7).toUpperCase()}`;
                }
            }
            return clean.toUpperCase();
        };

        const startingBal = startingBalance || 0;
        const list: any[] = [];
        const [yStr, mStr] = month.split('-');
        const firstDay = new Date(parseInt(yStr), parseInt(mStr) - 1, 1, 0, 0, 0);

        list.push({
            date: firstDay,
            description: "Saldo Awal (Modal / Kas & Bank)",
            ref: "BAL-START",
            coa: "301-000",
            type: "debit",
            amount: startingBal,
            isStartingBalance: true
        });

        (rawTransactions || []).forEach(t => {
            if (isTxIgnored(t)) return;
            const amt = t.totalPrice || t.amount || 0;
            if (amt > 0) {
                list.push({
                    date: new Date(t.createdAt || t.date || new Date()),
                    description: `Penerimaan Kamar - ${t.guestName || "Tamu"}`,
                    ref: formatRef("FO", t.bookingId || t.id),
                    coa: "401-000",
                    type: "debit",
                    amount: amt
                });
            }
        });

        (posOrders || []).forEach(o => {
            const amt = o.amount || 0;
            if (amt > 0) {
                list.push({
                    date: new Date(o.date || new Date()),
                    description: `Penerimaan POS - ${o.description || "Penjualan F&B"}`,
                    ref: formatRef("POS", o.id),
                    coa: "402-000",
                    type: "debit",
                    amount: amt
                });
            }
        });

        (customIncomes || []).forEach(ci => {
            if (ci.amount > 0) {
                list.push({
                    date: new Date(ci.date || new Date()),
                    description: ci.description || "Pendapatan Lainnya",
                    ref: "INC-CUST",
                    coa: "409-000",
                    type: "debit",
                    amount: ci.amount
                });
            }
        });

        (nonCommissionRevenue || []).forEach(nc => {
            if (nc.amount > 0) {
                list.push({
                    date: new Date(nc.date || new Date()),
                    description: nc.description || "Pendapatan Non-Komisi",
                    ref: "INC-NC",
                    coa: "408-000",
                    type: "debit",
                    amount: nc.amount
                });
            }
        });

        (expenses || []).forEach(ex => {
            if (ex.amount > 0) {
                list.push({
                    date: new Date(ex.date || new Date()),
                    description: `Beban Operasional - ${ex.category || "Biaya"} (${ex.description || "Pengeluaran"})`,
                    ref: "EXP-" + (ex.id?.slice(0,5) || "MANUAL"),
                    coa: "502-000",
                    type: "credit",
                    amount: ex.amount
                });
            }
        });

        const payrollSum = (payrollDetails || []).reduce((sum, p) => sum + (p.totalPay || p.totalPayrollExpense || p.amount || 0), 0);
        if (payrollSum > 0) {
            const lastDay = new Date(parseInt(yStr), parseInt(mStr), 0).getDate();
            const dateVal = new Date(parseInt(yStr), parseInt(mStr) - 1, lastDay, 23, 59, 59);
            
            if (payrollDetails && payrollDetails.length > 0) {
                payrollDetails.forEach(p => {
                    const amt = p.totalPay || p.totalPayrollExpense || p.amount || 0;
                    if (amt > 0) {
                        list.push({
                            date: dateVal,
                            description: `Beban Gaji Karyawan - ${p.name || p.staffName || "Karyawan"}`,
                            ref: `PAY-${p.staffId || "STAFF"}`,
                            coa: "501-000",
                            type: "credit",
                            amount: amt
                        });
                    }
                });
            } else {
                list.push({
                    date: dateVal,
                    description: "Beban Gaji Karyawan (Total)",
                    ref: "PAY-TOTAL",
                    coa: "501-000",
                    type: "credit",
                    amount: payrollSum
                });
            }
        }

        list.sort((a, b) => {
            if (a.isStartingBalance) return -1;
            if (b.isStartingBalance) return 1;
            return a.date.getTime() - b.date.getTime();
        });

        let balanceAccum = 0;
        const entriesWithBalance = list.map(e => {
            if (e.type === "debit") balanceAccum += e.amount;
            else balanceAccum -= e.amount;
            return { ...e, balance: balanceAccum };
        });

        const investorPayouts = (pnlResult.investorDistributions || []).reduce((sum, i) => sum + (i.amount || 0), 0);
        const netIncome = pnlResult.card12_ReconOwner || 0;
        const cashAndBank = startingBal + netIncome - investorPayouts;
        const totalAssets = cashAndBank;
        const equity = startingBal + netIncome - investorPayouts;
        const totalLiabilitiesEquity = equity;
        const endingBalance = startingBal + netIncome - investorPayouts;

        // Section VI: Buku Besar (General Ledger)
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("Helvetica", "bold");
        doc.text("VI. Buku Besar (General Ledger)", 14, 20);
        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(`Periode: ${month}`, 14, 26);

        autoTable(doc, {
            startY: 30,
            head:   [["Tanggal", "COA", "Ref", "Keterangan", "Debit", "Kredit", "Saldo"]],
            body:   entriesWithBalance.map((e) => [
                e.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                e.coa,
                e.ref,
                e.description,
                e.isStartingBalance ? "-" : (e.type === "debit" ? formatIDR(e.amount) : "-"),
                e.isStartingBalance ? "-" : (e.type === "credit" ? formatIDR(e.amount) : "-"),
                formatIDR(e.balance)
            ]),
            theme: "striped",
            headStyles: { fillColor: [24, 29, 38] },
        });

        // Section VII: Neraca (Balance Sheet)
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("Helvetica", "bold");
        doc.text("VII. Neraca (Balance Sheet)", 14, 20);
        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(`Periode Akhir: ${month}`, 14, 26);

        autoTable(doc, {
            startY: 32,
            head: [["Aktiva (Assets)", "Jumlah"]],
            body: [
                ["Aktiva Lancar", ""],
                ["  Kas & Bank", formatIDR(cashAndBank)],
                ["  Piutang Usaha", formatIDR(accountsReceivable)],
                ["Total Aktiva Lancar", formatIDR(totalAssetsLancar)],
                ["Aktiva Tetap", ""],
                ["  Inventaris & Peralatan", formatIDR(fixedAssetsValue)],
                ["TOTAL AKTIVA", formatIDR(totalAssets)]
            ],
            theme: "grid",
            headStyles: { fillColor: [24, 29, 38] },
            columnStyles: { 1: { halign: "right" } }
        });

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [["Kewajiban & Ekuitas (Liabilities & Equity)", "Jumlah"]],
            body: [
                ["Kewajiban (Liabilities)", ""],
                ["  Hutang Operasional (Management Fee)", formatIDR(sisaFee)],
                ["  Pajak Terhutang (VAT / PB1)", formatIDR(sisaVat)],
                ["  Hutang Service Charge Karyawan", formatIDR(sisaSc)],
                ["  Cadangan Kehilangan & Kerusakan", formatIDR(sisaLb)],
                ["Total Kewajiban", formatIDR(totalLiabilities)],
                ["Ekuitas (Equity)", ""],
                ["  Modal Awal / Saldo Laba Bulan Lalu", formatIDR(startingBal)],
                ["  Laba (Rugi) Tahun Berjalan", formatIDR(netIncome)],
                ["  Distribusi Laba Investor (Dividen)", `-${formatIDR(investorPayouts)}`],
                ["Total Ekuitas", formatIDR(equity)],
                ["TOTAL KEWAJIBAN & EKUITAS", formatIDR(totalLiabilitiesEquity)]
            ],
            theme: "grid",
            headStyles: { fillColor: [24, 29, 38] },
            columnStyles: { 1: { halign: "right" } }
        });

        // Section VIII: Laporan Arus Kas (Cash Flow)
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("Helvetica", "bold");
        doc.text("VIII. Laporan Arus Kas (Cash Flow)", 14, 20);
        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(`Periode: ${month} (Metode Langsung)`, 14, 26);

        autoTable(doc, {
            startY: 32,
            head: [["Aktivitas / Deskripsi", "Jumlah"]],
            body: [
                ["Arus Kas dari Aktivitas Operasional", ""],
                ["  Penerimaan Kas dari Pelanggan (Total Revenue - Piutang)", formatIDR((pnlResult?.totalRevenue || 0) - accountsReceivable)],
                ["  Pembayaran Kas untuk Beban Operasional", `-${formatIDR(pnlResult?.card8_TotalExpenses || 0)}`],
                ["Kas Bersih dari Aktivitas Operasi", formatIDR(gop - accountsReceivable)],
                ["Arus Kas dari Aktivitas Investasi", ""],
                ["  Pembelian Inventaris & Peralatan (Aktiva Tetap)", `-${formatIDR(fixedAssetsValue)}`],
                ["Kas Bersih dari Aktivitas Investasi", `-${formatIDR(fixedAssetsValue)}`],
                ["Arus Kas dari Aktivitas Pendanaan", ""],
                ["  Pembayaran Dividen / Distribusi Investor", `-${formatIDR(investorPayouts)}`],
                ["Kas Bersih dari Aktivitas Pendanaan", `-${formatIDR(investorPayouts)}`],
                ["Ringkasan", ""],
                ["  Kenaikan (Penurunan) Kas Bersih", formatIDR((gop - accountsReceivable) - fixedAssetsValue - investorPayouts)],
                ["  Saldo Kas Awal Periode", formatIDR(startingBal)],
                ["Saldo Kas Akhir Periode", formatIDR(endingBalance)]
            ],
            theme: "grid",
            headStyles: { fillColor: [24, 29, 38] },
            columnStyles: { 1: { halign: "right" } }
        });

        doc.save(`PnL_Report_${month}.pdf`);
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
