import React, { useMemo, useState, useEffect } from "react";
import { PnlExpenseItem, PnlIncomeItem } from "@/lib/pnl-utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import styles from "./statements.module.css";

interface GeneralLedgerProps {
    rawTransactions: any[];
    expenses: PnlExpenseItem[];
    customIncomes: PnlIncomeItem[];
    nonCommissionRevenue: PnlIncomeItem[];
    posOrders: any[];
    payrollDetails: any[];
    month: string;
    startingBalance: number;
    formatIDR: (val: number) => string;
    formatIDR: (val: number) => string;
    pnlResult?: any;
}

interface LedgerEntry {
    date: Date;
    description: string;
    ref: string;
    coa: string;
    type: "debit" | "credit";
    amount: number;
    isStartingBalance?: boolean;
}

export const GeneralLedger: React.FC<GeneralLedgerProps> = ({
    rawTransactions, expenses, customIncomes, nonCommissionRevenue, posOrders, payrollDetails, month, startingBalance, formatIDR, pnlResult
}) => {
    const [selectedCoa, setSelectedCoa] = useState<string>("ALL");
    const [page, setPage] = useState(1);
    const limit = 50;

    useEffect(() => {
        setSelectedCoa("ALL");
        setPage(1);
    }, [month]);

    const coaNames: Record<string, string> = {
        "101-000": "Kas & Bank",
        "201-000": "Hutang Dagang (Accounts Payable)",
        "301-000": "Modal / Ekuitas",
        "401-000": "Pendapatan Kamar",
        "402-000": "Pendapatan POS (F&B)",
        "408-000": "Pendapatan Non-Komisi",
        "409-000": "Pendapatan Lainnya",
        "501-000": "Beban Gaji Karyawan",
        "502-000": "Beban Operasional"
    };

    const isNormalDebit = (coa: string) => {
        return coa.startsWith("1") || coa.startsWith("5");
    };


    const entries = useMemo(() => {
        const list: LedgerEntry[] = [];

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

        // 1. Opening Balance (Saldo Awal)
        const [y, m] = month.split('-');
        const firstDay = new Date(parseInt(y), parseInt(m) - 1, 1, 0, 0, 0);
        if (startingBalance > 0) {
            // Debit: Kas & Bank
            list.push({
                date: firstDay,
                description: "Saldo Awal (Kas & Bank)",
                ref: "BAL-START",
                coa: "101-000",
                type: "debit",
                amount: startingBalance,
                isStartingBalance: true
            });
            // Credit: Modal / Ekuitas
            list.push({
                date: firstDay,
                description: "Saldo Awal (Modal / Ekuitas)",
                ref: "BAL-START",
                coa: "301-000",
                type: "credit",
                amount: startingBalance,
                isStartingBalance: true
            });
        }

        // 2. Room Revenue & Other FO Incomes (including Compliment)
        rawTransactions.forEach(t => {
            if (t.isDeleted || t.status === "cancelled" || t.status === "no-show") return;
            const refCode = formatRef("FO", t.bookingId || t.id);
            const dateVal = new Date(t.createdAt || t.date || new Date());
            const isRoom = t.type === "accommodation" || (!t.type && !t.incomeCategory);
            const isPelunasan = t.type === "pelunasan_ar" || t.isPelunasan;
            const revenueCoa = isRoom ? "401-000" : "409-000";
            const revenueLabel = isRoom ? "Kamar" : "Lainnya";

            if (t.isCompliment) {
                const compVal = Number(t.complimentValue) || 0;
                if (compVal > 0) {
                    // Debit: Beban Operasional (Beban Compliment)
                    list.push({
                        date: dateVal,
                        description: `Beban Compliment - ${t.guestName || "Tamu"} (${revenueLabel})`,
                        ref: refCode,
                        coa: "502-000",
                        type: "debit",
                        amount: compVal
                    });
                    // Credit: Pendapatan Kamar / Lainnya
                    list.push({
                        date: dateVal,
                        description: `Pendapatan Compliment - ${t.guestName || "Tamu"}`,
                        ref: refCode,
                        coa: revenueCoa,
                        type: "credit",
                        amount: compVal
                    });
                }
            } else if (isPelunasan) {
                const payAmt = (Number(t.payHotel) || 0) + (Number(t.payTransfer) || 0) + (Number(t.paidCash) || 0) + (Number(t.paidTransfer) || 0);
                if (payAmt > 0) {
                    // Debit: Kas & Bank
                    list.push({
                        date: dateVal,
                        description: `Kas Masuk - ${t.guestName || "Pelunasan Tagihan"}`,
                        ref: refCode,
                        coa: "101-000",
                        type: "debit",
                        amount: payAmt
                    });
                    // Credit: Piutang Tamu
                    list.push({
                        date: dateVal,
                        description: `${t.guestName || "Pelunasan Tagihan"}`,
                        ref: refCode,
                        coa: "102-000",
                        type: "credit",
                        amount: payAmt
                    });
                } else if (payAmt < 0) {
                    // Reversal (Negative payment to correct check-in date)
                    // Credit: Kas & Bank
                    list.push({
                        date: dateVal,
                        description: `Koreksi Tanggal Pelunasan - ${t.guestName || "Tamu"}`,
                        ref: refCode,
                        coa: "101-000",
                        type: "credit",
                        amount: Math.abs(payAmt)
                    });
                    // Debit: Piutang Tamu
                    list.push({
                        date: dateVal,
                        description: `Koreksi Tanggal Pelunasan - ${t.guestName || "Tamu"}`,
                        ref: refCode,
                        coa: "102-000",
                        type: "debit",
                        amount: Math.abs(payAmt)
                    });
                }
            } else {
                const totalRev = t.totalPrice || t.amount || 0;
                const payAmt = (Number(t.payHotel) || 0) + (Number(t.payTransfer) || 0) + (Number(t.paidCash) || 0) + (Number(t.paidTransfer) || 0);
                const arAmt = Math.max(0, totalRev - payAmt);

                if (payAmt > 0) {
                    // Debit: Kas & Bank (Hanya yang dibayar / DP)
                    list.push({
                        date: dateVal,
                        description: `Kas Masuk - Penerimaan ${revenueLabel} (${t.guestName || "Tamu"})`,
                        ref: refCode,
                        coa: "101-000",
                        type: "debit",
                        amount: payAmt
                    });
                }

                if (arAmt > 0) {
                    // Debit: Piutang Tamu (Belum dibayar)
                    list.push({
                        date: dateVal,
                        description: `Piutang Tamu - ${revenueLabel} (${t.guestName || "Tamu"})`,
                        ref: refCode,
                        coa: "102-000",
                        type: "debit",
                        amount: arAmt
                    });
                }

                if (totalRev > 0) {
                    // Credit: Pendapatan Kamar / Lainnya (Diakui full)
                    list.push({
                        date: dateVal,
                        description: `Penerimaan ${revenueLabel} - ${t.guestName || "Tamu"}`,
                        ref: refCode,
                        coa: revenueCoa,
                        type: "credit",
                        amount: totalRev
                    });
                }
            }
        });

        // 3. POS Orders (F&B Sales)
        (posOrders || []).forEach(o => {
            const amt = o.amount || 0;
            if (amt > 0) {
                const refCode = formatRef("POS", o.id);
                // Debit: Kas & Bank
                list.push({
                    date: new Date(o.date || new Date()),
                    description: `Kas Masuk - POS (${o.description || "Penjualan F&B"})`,
                    ref: refCode,
                    coa: "101-000",
                    type: "debit",
                    amount: amt
                });
                // Credit: Pendapatan POS
                list.push({
                    date: new Date(o.date || new Date()),
                    description: `Penerimaan POS - ${o.description || "Penjualan F&B"}`,
                    ref: refCode,
                    coa: "402-000",
                    type: "credit",
                    amount: amt
                });
            }
        });

        // 4. Custom Incomes
        customIncomes.forEach(ci => {
            if (ci.amount > 0) {
                // Debit: Kas & Bank
                list.push({
                    date: new Date(ci.date || new Date()),
                    description: `Kas Masuk - ${ci.description || "Pendapatan Lainnya"}`,
                    ref: "INC-CUST",
                    coa: "101-000",
                    type: "debit",
                    amount: ci.amount
                });
                // Credit: Pendapatan Lainnya
                list.push({
                    date: new Date(ci.date || new Date()),
                    description: ci.description || "Pendapatan Lainnya",
                    ref: "INC-CUST",
                    coa: "409-000",
                    type: "credit",
                    amount: ci.amount
                });
            }
        });

        // 5. Non Commission
        nonCommissionRevenue.forEach(nc => {
            if (nc.amount > 0) {
                // Debit: Kas & Bank
                list.push({
                    date: new Date(nc.date || new Date()),
                    description: `Kas Masuk - ${nc.description || "Pendapatan Non-Komisi"}`,
                    ref: "INC-NC",
                    coa: "101-000",
                    type: "debit",
                    amount: nc.amount
                });
                // Credit: Pendapatan Non-Komisi
                list.push({
                    date: new Date(nc.date || new Date()),
                    description: nc.description || "Pendapatan Non-Komisi",
                    ref: "INC-NC",
                    coa: "408-000",
                    type: "credit",
                    amount: nc.amount
                });
            }
        });

        // 6. Manual Expenses
        expenses.forEach(ex => {
            if (ex.amount > 0) {
                const refCode = "EXP-" + (ex.id?.slice(0,5) || "MANUAL");
                const status = (ex.paymentStatus || "").toLowerCase();
                const isTempo = status === "tempo" || status === "pending";

                // Debit: Beban Operasional
                list.push({
                    date: new Date(ex.date || new Date()),
                    description: `Beban Operasional - ${ex.category || "Biaya"} (${ex.description || "Pengeluaran"})`,
                    ref: refCode,
                    coa: "502-000",
                    type: "debit",
                    amount: ex.amount
                });

                if (isTempo) {
                    // Credit: Hutang Dagang (Accounts Payable)
                    list.push({
                        date: new Date(ex.date || new Date()),
                        description: `Hutang Dagang - Pengakuan Beban Tempo`,
                        ref: refCode,
                        coa: "201-000",
                        type: "credit",
                        amount: ex.amount
                    });

                    // If paid on paymentDate, add settlement legs
                    if (ex.paymentDate) {
                        const payDate = new Date(ex.paymentDate);
                        // Debit: Hutang Dagang (Pelunasan)
                        list.push({
                            date: payDate,
                            description: `Pelunasan Hutang Dagang - ${ex.category || "Biaya"}`,
                            ref: refCode + "-PAY",
                            coa: "201-000",
                            type: "debit",
                            amount: ex.amount
                        });
                        // Credit: Kas & Bank
                        list.push({
                            date: payDate,
                            description: `Kas Keluar - Pelunasan Hutang Dagang`,
                            ref: refCode + "-PAY",
                            coa: "101-000",
                            type: "credit",
                            amount: ex.amount
                        });
                    }
                } else {
                    // Credit: Kas & Bank
                    list.push({
                        date: new Date(ex.date || new Date()),
                        description: `Kas Keluar - Pembayaran Beban Operasional`,
                        ref: refCode,
                        coa: "101-000",
                        type: "credit",
                        amount: ex.amount
                    });
                }
            }
        });

        // 7. Payroll Expenses (Salaries)
        const payrollSum = (payrollDetails || []).reduce((sum, p) => sum + (p.totalPay || p.totalPayrollExpense || p.amount || 0), 0);
        if (payrollSum > 0) {
            const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
            const dateVal = new Date(parseInt(y), parseInt(m) - 1, lastDay, 23, 59, 59);
            
            if (payrollDetails && payrollDetails.length > 0) {
                payrollDetails.forEach(p => {
                    const amt = p.totalPay || p.totalPayrollExpense || p.amount || 0;
                    if (amt > 0) {
                        const refCode = `PAY-${p.staffId || "STAFF"}`;
                        // Debit: Beban Gaji
                        list.push({
                            date: dateVal,
                            description: `Beban Gaji Karyawan - ${p.name || p.staffName || "Karyawan"}`,
                            ref: refCode,
                            coa: "501-000",
                            type: "debit",
                            amount: amt
                        });
                        // Credit: Kas & Bank
                        list.push({
                            date: dateVal,
                            description: `Kas Keluar - Pembayaran Gaji Karyawan (${p.name || p.staffName || "Karyawan"})`,
                            ref: refCode,
                            coa: "101-000",
                            type: "credit",
                            amount: amt
                        });
                    }
                });
            } else {
                // Debit: Beban Gaji Total
                list.push({
                    date: dateVal,
                    description: "Beban Gaji Karyawan (Total)",
                    ref: "PAY-TOTAL",
                    coa: "501-000",
                    type: "debit",
                    amount: payrollSum
                });
                // Credit: Kas & Bank
                list.push({
                    date: dateVal,
                    description: "Kas Keluar - Pembayaran Gaji Karyawan (Total)",
                    ref: "PAY-TOTAL",
                    coa: "101-000",
                    type: "credit",
                    amount: payrollSum
                });
            }
        }

        // 8. Tax / Fee Payments (Dinamis dari P&L)
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
        const paymentDate = new Date(parseInt(y), parseInt(m) - 1, lastDay, 23, 59, 58);

        const vatLiab = pnlResult?.card11_VAT || 0;
        if (vatLiab > 0) {
            list.push({
                date: paymentDate,
                description: "Beban Pajak PPN (Dinamis P&L)",
                ref: "TAX-VAT",
                coa: "502-000",
                type: "debit",
                amount: vatLiab
            });
            list.push({
                date: paymentDate,
                description: "Kas Keluar - Pajak PPN",
                ref: "TAX-VAT",
                coa: "101-000",
                type: "credit",
                amount: vatLiab
            });
        }

        const feeLiab = pnlResult?.card9_FeeGross || 0;
        if (feeLiab > 0) {
            list.push({
                date: paymentDate,
                description: "Beban Management Fee (Dinamis P&L)",
                ref: "PAY-MGMT",
                coa: "502-000",
                type: "debit",
                amount: feeLiab
            });
            list.push({
                date: paymentDate,
                description: "Kas Keluar - Management Fee",
                ref: "PAY-MGMT",
                coa: "101-000",
                type: "credit",
                amount: feeLiab
            });
        }

        const scLiab = pnlResult?.summaryServiceCharge || 0;
        if (scLiab > 0) {
            list.push({
                date: paymentDate,
                description: "Beban Service Charge (Dinamis P&L)",
                ref: "PAY-SC",
                coa: "502-000",
                type: "debit",
                amount: scLiab
            });
            list.push({
                date: paymentDate,
                description: "Kas Keluar - Service Charge",
                ref: "PAY-SC",
                coa: "101-000",
                type: "credit",
                amount: scLiab
            });
        }

        const lbLiab = pnlResult?.summaryLostBreakage || 0;
        if (lbLiab > 0) {
            list.push({
                date: paymentDate,
                description: "Beban Lost & Breakage (Dinamis P&L)",
                ref: "PAY-LB",
                coa: "502-000",
                type: "debit",
                amount: lbLiab
            });
            list.push({
                date: paymentDate,
                description: "Kas Keluar - Lost & Breakage",
                ref: "PAY-LB",
                coa: "101-000",
                type: "credit",
                amount: lbLiab
            });
        }

        // Sort by Date (ascending for running balance)
        list.sort((a, b) => {
            const timeA = a.date.getTime();
            const timeB = b.date.getTime();
            if (timeA !== timeB) return timeA - timeB;
            
            // Group by transaction reference
            if (a.ref !== b.ref) return a.ref.localeCompare(b.ref);
            
            // Debit first, credit second
            if (a.type !== b.type) {
                return a.type === "debit" ? -1 : 1;
            }
            return 0;
        });
        return list;
    }, [rawTransactions, expenses, customIncomes, nonCommissionRevenue, posOrders, payrollDetails, month, startingBalance, pnlResult]);

    // Running Balance Calculation per COA
    const { entriesWithBalance, runningBalances } = useMemo(() => {
        const balances: Record<string, number> = {};
        const result = entries.map(e => {
            const coa = e.coa ? e.coa.trim() : "";
            if (balances[coa] === undefined) {
                balances[coa] = 0;
            }
            const amtVal = Number(e.amount) || 0;
            const normalDebit = isNormalDebit(coa);
            if (e.type === "debit") {
                balances[coa] += normalDebit ? amtVal : -amtVal;
            } else {
                balances[coa] += normalDebit ? -amtVal : amtVal;
            }
            return { ...e, coa, amount: amtVal, balance: balances[coa] };
        });
        return { entriesWithBalance: result, runningBalances: balances };
    }, [entries]);

    const filteredEntries = useMemo(() => {
        if (!selectedCoa || selectedCoa === "ALL") return entriesWithBalance;
        const targetCoa = selectedCoa.trim();
        return entriesWithBalance.filter(e => e.coa === targetCoa);
    }, [entriesWithBalance, selectedCoa]);

    const totalPages = Math.ceil(filteredEntries.length / limit);
    const paginatedEntries = filteredEntries.slice((page - 1) * limit, page * limit);


    // Calculate dynamic border grouping for "Semua Akun (Jurnal Umum)"
    const getRowStyle = (idx: number, entry: any) => {
        if (selectedCoa !== "ALL") return undefined;
        if (idx > 0 && paginatedEntries[idx - 1].ref !== entry.ref) {
            return { borderTop: "2px solid #cbd5e1" }; // Light mode border
        }
        return undefined;
    };

    return (
        <div className={styles.cardSurface}>
            <div className={`${styles.flexBetween} ${styles.gapLg}`} style={{ marginBottom: "32px", flexWrap: "wrap" }}>
                <div>
                    <h3 className={styles.titleLg}>Buku Besar</h3>
                    <p className={styles.captionText}>General Ledger - Rincian Transaksi Debet & Kredit</p>
                </div>

                {/* COA Filter Dropdown */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <label className={styles.captionText} style={{ fontSize: "12px", textTransform: "uppercase" }}>Filter Akun:</label>
                    <select
                        value={selectedCoa}
                        onChange={(e) => {
                            setSelectedCoa(e.target.value);
                            setPage(1);
                        }}
                        className={styles.inputField}
                        style={{ width: "240px", cursor: "pointer" }}
                    >
                        <option value="ALL">Semua Akun (Jurnal Umum)</option>
                        {Object.entries(coaNames).map(([code, name]) => (
                            <option key={code} value={code}>{code} - {name}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.cardSurfaceSoft} style={{ padding: "12px 24px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span className={styles.captionText} style={{ textTransform: "uppercase", fontSize: "11px" }}>
                        {selectedCoa === "ALL" ? "Total Saldo Kas" : `Saldo Akhir ${coaNames[selectedCoa] || ""}`}
                    </span>
                    <span className={styles.displayMd} style={{ fontSize: "24px" }}>
                        {formatIDR(
                            selectedCoa === "ALL" 
                                ? (runningBalances["101-000"] || 0)
                                : (runningBalances[selectedCoa] || 0)
                        )}
                    </span>
                </div>
            </div>

            <div className={styles.excelTableWrapper}>
                <table className={styles.excelTable}>
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Kode Akun (COA)</th>
                            <th>Ref</th>
                            <th>Keterangan</th>
                            <th style={{ textAlign: "right" }}>Debit (Masuk)</th>
                            <th style={{ textAlign: "right" }}>Kredit (Keluar)</th>
                            {selectedCoa !== "ALL" && <th style={{ textAlign: "right" }}>Saldo</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEntries.length > 0 ? paginatedEntries.map((entry, idx) => (
                            <tr key={idx} style={getRowStyle(idx, entry)}>
                                <td>{entry.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className={styles.fontMono} style={{ opacity: 0.8 }}>{entry.coa}</td>
                                <td className={styles.fontMono} style={{ opacity: 0.8 }}>{entry.ref}</td>
                                <td style={{ paddingLeft: entry.type === "credit" && selectedCoa === "ALL" ? "24px" : "8px" }}>
                                    {entry.type === "credit" && selectedCoa === "ALL" ? `↳ ${entry.description}` : entry.description}
                                </td>
                                <td className={styles.excelAmountDebit}>
                                    {entry.type === "debit" ? formatIDR(entry.amount) : "-"}
                                </td>
                                <td className={styles.excelAmountCredit}>
                                    {entry.type === "credit" ? formatIDR(entry.amount) : "-"}
                                </td>
                                {selectedCoa !== "ALL" && (
                                    <td style={{ textAlign: "right", fontWeight: 500 }}>
                                        {formatIDR(entry.balance)}
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className={styles.captionText} style={{ padding: "48px 0", textAlign: "center" }}>Tidak ada data transaksi.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles.flexBetween} style={{ marginTop: "24px" }}>
                    <span className={styles.captionText}>
                        Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, filteredEntries.length)} dari {filteredEntries.length} baris
                    </span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={styles.buttonSecondary}
                            style={{ padding: "8px 16px", borderRadius: "6px" }}
                        >
                            Prev
                        </button>
                        <span className={styles.bodyText} style={{ fontWeight: 500, width: "32px", textAlign: "center" }}>{page}</span>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className={styles.buttonSecondary}
                            style={{ padding: "8px 16px", borderRadius: "6px" }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
