import React from "react";
import { GlobalPnLResult, PnlExpenseItem } from "@/lib/pnl-utils";
import styles from "./statements.module.css";

interface CashFlowProps {
    pnlResult: GlobalPnLResult;
    startingBalance: number;
    formatIDR: (val: number) => string;
    rawTransactions: any[];
    expenses: PnlExpenseItem[];
    fixedAssetsValue: number;
    vatPaid: number;
    feePaid: number;
    scPaid: number;
    lbPaid: number;
}

export const CashFlow: React.FC<CashFlowProps> = ({ 
    pnlResult, 
    startingBalance, 
    formatIDR,
    rawTransactions,
    expenses,
    fixedAssetsValue,
    vatPaid,
    feePaid,
    scPaid,
    lbPaid
}) => {
    const accountsReceivable = (rawTransactions || []).filter(t => {
        if (t.isDeleted || t.status === "cancelled" || t.status === "no-show") return false;
        const status = (t.paymentStatus || "").toLowerCase();
        return !status.includes("lunas") && !status.includes("paid");
    }).reduce((sum, t) => {
        const paidCash = Number(t.paidCash || t.paidAmount1 || t.payHotel || 0);
        const paidTransfer = Number(t.paidTransfer || t.paidAmount2 || t.payTransfer || 0);
        const unpaid = Math.max(0, (t.amount || 0) - paidCash - paidTransfer);
        return sum + unpaid;
    }, 0);

    const accountsPayable = (expenses || []).filter((e: any) => {
        const status = (e.paymentStatus || "").toLowerCase();
        return status === "tempo" || status === "pending";
    }).reduce((sum, e) => sum + (e.amount || 0), 0);

    const investorPayouts = (pnlResult?.investorDistributions || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalPaid = vatPaid + feePaid + scPaid + lbPaid;
    
    const revenueReceived = (pnlResult?.card1_TotalRevenue || 0) - accountsReceivable;
    const expensesPaid = (pnlResult?.card8_TotalExpenses || 0) - accountsPayable + totalPaid;
    const netOperatingCash = revenueReceived - expensesPaid;

    
    const netInvestingCash = -fixedAssetsValue;
    const netFinancingCash = -investorPayouts;
    const netCashIncrease = netOperatingCash + netInvestingCash + netFinancingCash;
    const endingBalance = startingBalance + netCashIncrease;

    return (
        <div className={styles.cardSurface} style={{ maxWidth: "896px", margin: "0 auto", width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <h3 className={styles.displayMd}>Laporan Arus Kas</h3>
                <p className={styles.captionText} style={{ marginTop: "4px" }}>Cash Flow Statement (Metode Langsung)</p>
            </div>

            <div className={styles.flexColumn} style={{ gap: "24px" }}>
                {/* Operating Activities */}
                <div>
                    <h4 className={`${styles.titleLg} ${styles.bgSoftDarkToLight} ${styles.borderDarkToLight}`} style={{ fontSize: "14px", fontWeight: 500, textTransform: "uppercase", padding: "12px 16px", borderRadius: "10px 10px 0 0", borderBottomWidth: "1px", borderBottomStyle: "solid", letterSpacing: "1px" }}>
                        Arus Kas dari Aktivitas Operasional
                    </h4>
                    <div className={styles.flexColumn} style={{ padding: "16px", borderLeft: "1px solid var(--sidebar-border)", borderRight: "1px solid var(--sidebar-border)", borderBottom: "1px solid var(--sidebar-border)", borderRadius: "0 0 10px 10px", gap: "12px" }}>
                        <div className={styles.flexBetween}>
                            <span className={styles.bodyText}>Penerimaan Kas dari Pelanggan (Revenue Net of Receivables)</span>
                            <span className={styles.excelBalance}>{formatIDR(revenueReceived)}</span>
                        </div>
                        <div className={styles.flexBetween}>
                            <span className={styles.bodyText}>Pembayaran Kas untuk Beban Operasional & Kewajiban</span>
                            <span className={`${styles.fontMono} ${styles.textDanger}`}>-{formatIDR(expensesPaid)}</span>
                        </div>
                        <div className={`${styles.flexBetween} ${styles.divider}`} style={{ paddingTop: "12px", marginTop: "8px" }}>
                            <span className={styles.bodyText} style={{ fontWeight: 500 }}>Kas Bersih dari Aktivitas Operasi</span>
                            <span className={`${styles.fontMono} ${netOperatingCash < 0 ? styles.textDanger : styles.textSuccess}`} style={{ fontWeight: 500 }}>
                                {netOperatingCash < 0 ? "-" : ""}{formatIDR(Math.abs(netOperatingCash))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Investing Activities */}
                <div>
                    <h4 className={`${styles.titleLg} ${styles.bgSoftDarkToLight} ${styles.borderDarkToLight}`} style={{ fontSize: "14px", fontWeight: 500, textTransform: "uppercase", padding: "12px 16px", borderRadius: "10px 10px 0 0", borderBottomWidth: "1px", borderBottomStyle: "solid", letterSpacing: "1px" }}>
                        Arus Kas dari Aktivitas Investasi
                    </h4>
                    <div className={styles.flexColumn} style={{ padding: "16px", borderLeft: "1px solid var(--sidebar-border)", borderRight: "1px solid var(--sidebar-border)", borderBottom: "1px solid var(--sidebar-border)", borderRadius: "0 0 10px 10px", gap: "12px" }}>
                        {fixedAssetsValue > 0 ? (
                            <div className={styles.flexBetween}>
                                <span className={styles.bodyText}>Pembayaran Kas untuk Aset Tetap (Inventaris & Peralatan)</span>
                                <span className={`${styles.fontMono} ${styles.textDanger}`}>-{formatIDR(fixedAssetsValue)}</span>
                            </div>
                        ) : (
                            <div className={styles.flexBetween}>
                                <span className={styles.captionText} style={{ fontStyle: "italic" }}>Tidak ada aktivitas investasi dicatat periode ini</span>
                                <span className={styles.captionText}>Rp 0</span>
                            </div>
                        )}
                        <div className={`${styles.flexBetween} ${styles.divider}`} style={{ paddingTop: "12px", marginTop: "8px" }}>
                            <span className={styles.bodyText} style={{ fontWeight: 500 }}>Kas Bersih dari Aktivitas Investasi</span>
                            <span className={`${styles.fontMono} ${fixedAssetsValue > 0 ? styles.textDanger : ""}`} style={{ fontWeight: 500 }}>
                                {fixedAssetsValue > 0 ? `-${formatIDR(fixedAssetsValue)}` : "Rp 0"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Financing Activities */}
                <div>
                    <h4 className={`${styles.titleLg} ${styles.bgSoftDarkToLight} ${styles.borderDarkToLight}`} style={{ fontSize: "14px", fontWeight: 500, textTransform: "uppercase", padding: "12px 16px", borderRadius: "10px 10px 0 0", borderBottomWidth: "1px", borderBottomStyle: "solid", letterSpacing: "1px" }}>
                        Arus Kas dari Aktivitas Pendanaan
                    </h4>
                    <div className={styles.flexColumn} style={{ padding: "16px", borderLeft: "1px solid var(--sidebar-border)", borderRight: "1px solid var(--sidebar-border)", borderBottom: "1px solid var(--sidebar-border)", borderRadius: "0 0 10px 10px", gap: "12px" }}>
                        {investorPayouts > 0 ? (
                            <div className={styles.flexBetween}>
                                <span className={styles.bodyText}>Pembayaran Dividen / Distribusi Laba Investor</span>
                                <span className={`${styles.fontMono} ${styles.textDanger}`}>-{formatIDR(investorPayouts)}</span>
                            </div>
                        ) : (
                            <div className={styles.flexBetween}>
                                <span className={styles.captionText} style={{ fontStyle: "italic" }}>Tidak ada aktivitas pendanaan dicatat periode ini</span>
                                <span className={styles.captionText}>Rp 0</span>
                            </div>
                        )}
                        <div className={`${styles.flexBetween} ${styles.divider}`} style={{ paddingTop: "12px", marginTop: "8px" }}>
                            <span className={styles.bodyText} style={{ fontWeight: 500 }}>Kas Bersih dari Aktivitas Pendanaan</span>
                            <span className={`${styles.fontMono} ${investorPayouts > 0 ? styles.textDanger : ""}`} style={{ fontWeight: 500 }}>
                                {investorPayouts > 0 ? `-${formatIDR(investorPayouts)}` : "Rp 0"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className={`${styles.flexColumn} ${styles.bgSoftDarkToLight} ${styles.borderDarkToLight}`} style={{ marginTop: "16px", borderStyle: "solid", borderWidth: "2px", borderRadius: "10px", padding: "20px", gap: "12px" }}>
                    <div className={styles.flexBetween}>
                        <span className={styles.bodyText} style={{ fontWeight: 500 }}>Kenaikan (Penurunan) Kas Bersih</span>
                        <span className={`${styles.fontMono} ${netCashIncrease < 0 ? styles.textDanger : styles.textSuccess}`} style={{ fontWeight: 500 }}>
                            {netCashIncrease < 0 ? "-" : ""}{formatIDR(Math.abs(netCashIncrease))}
                        </span>
                    </div>
                    <div className={styles.flexBetween}>
                        <span className={styles.bodyText} style={{ fontWeight: 500 }}>Saldo Kas Awal Periode</span>
                        <span className={styles.excelBalance}>{formatIDR(startingBalance)}</span>
                    </div>
                    <div className={`${styles.flexBetween} ${styles.dividerStrong}`} style={{ paddingTop: "12px", marginTop: "8px" }}>
                        <span className={styles.titleLg} style={{ fontSize: "16px", fontWeight: 500, textTransform: "uppercase" }}>Saldo Kas Akhir Periode</span>
                        <span className={styles.excelBalance} style={{ fontSize: "16px" }}>{formatIDR(endingBalance)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
