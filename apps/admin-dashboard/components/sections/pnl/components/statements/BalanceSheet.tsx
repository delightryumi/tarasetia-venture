import React, { useState } from "react";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { GlobalPnLResult, PnlExpenseItem } from "@/lib/pnl-utils";
import styles from "./statements.module.css";

interface BalanceSheetProps {
    pnlResult: GlobalPnLResult;
    startingBalance: number;
    updateStartingBalance: (val: number) => void;
    fixedAssetsValue: number;
    updateFixedAssetsValue: (val: number) => void;
    vatPaid: number;
    updateVatPaid: (val: number) => void;
    feePaid: number;
    updateFeePaid: (val: number) => void;
    scPaid: number;
    updateScPaid: (val: number) => void;
    lbPaid: number;
    updateLbPaid: (val: number) => void;
    rawTransactions: any[];
    expenses: PnlExpenseItem[];
    formatIDR: (val: number) => string;
    month: string;
}

export const BalanceSheet: React.FC<BalanceSheetProps> = ({
    pnlResult, startingBalance, updateStartingBalance, fixedAssetsValue, updateFixedAssetsValue,
    vatPaid, updateVatPaid, feePaid, updateFeePaid, scPaid, updateScPaid, lbPaid, updateLbPaid,
    rawTransactions, expenses, formatIDR, month
}) => {
    const [editBalance, setEditBalance] = useState(startingBalance.toString());
    const [editFixedAssets, setEditFixedAssets] = useState(fixedAssetsValue.toString());
    
    const [editVatPaid, setEditVatPaid] = useState(vatPaid.toString());
    const [editFeePaid, setEditFeePaid] = useState(feePaid.toString());
    const [editScPaid, setEditScPaid] = useState(scPaid.toString());
    const [editLbPaid, setEditLbPaid] = useState(lbPaid.toString());
    
    const [isSaving, setIsSaving] = useState(false);

    // Sync input states when props change
    React.useEffect(() => {
        setEditBalance(startingBalance.toString());
    }, [startingBalance]);

    React.useEffect(() => {
        setEditFixedAssets(fixedAssetsValue.toString());
    }, [fixedAssetsValue]);

    React.useEffect(() => {
        setEditVatPaid(editVatPaid); // Keep input intact during editing
    }, [vatPaid]);

    React.useEffect(() => {
        setEditFeePaid(editFeePaid);
    }, [feePaid]);

    React.useEffect(() => {
        setEditScPaid(editScPaid);
    }, [scPaid]);

    React.useEffect(() => {
        setEditLbPaid(editLbPaid);
    }, [lbPaid]);

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

    // Accounts Receivable (Piutang Usaha): Net unpaid portion of bookings that are not fully paid
    const accountsReceivable = (rawTransactions || []).filter(t => {
        if (isTxIgnored(t)) return false;
        const status = (t.paymentStatus || "").toLowerCase();
        return !status.includes("lunas") && !status.includes("paid");
    }).reduce((sum, t) => {
        const isPelunasan = t.type === "pelunasan_ar" || t.isPelunasan;
        if (isPelunasan) return sum; // Ignore pelunasan_ar in AR calculation
        const paidCash = Number(t.paidCash || t.paidAmount1 || t.payHotel || 0);
        const paidTransfer = Number(t.paidTransfer || t.paidAmount2 || t.payTransfer || 0);
        const unpaid = Math.max(0, (t.amount || 0) - paidCash - paidTransfer);
        return sum + unpaid;
    }, 0);

    // Accounts Payable (Hutang Dagang): Sum of amount for expenses with tempo status
    const accountsPayable = (expenses || []).filter((e: any) => {
        const status = (e.paymentStatus || "").toLowerCase();
        return status === "tempo" || status === "pending";
    }).reduce((sum, e) => sum + (e.amount || 0), 0);

    const investorPayouts = (pnlResult?.investorDistributions || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    const netIncome = pnlResult?.card12_ReconOwner || 0;
    
    // Accrued Liabilities (Kewajiban Akrual Periode Ini) - Dinamis dari PnL
    const vatLiability = pnlResult?.card11_VAT || 0;
    const scLiability = pnlResult?.summaryServiceCharge || 0;
    const lbLiability = pnlResult?.summaryLostBreakage || 0;
    const feeLiability = pnlResult?.card9_FeeGross || 0;

    // Karena di-setting dinamis mengikuti PnL, asumsikan sudah diselesaikan (tercermin di Arus Kas otomatis)
    const sisaVat = 0;
    const sisaFee = 0;
    const sisaSc = 0;
    const sisaLb = 0;
    const totalLiabilities = accountsPayable;

    const gop = pnlResult?.card7_TotalGOP || 0;
    const totalDynamicPaid = vatLiability + feeLiability + scLiability + lbLiability;

    // Cash and Bank calculation: startingBalance + GOP - investorPayouts - accountsReceivable - fixedAssetsValue - totalDynamicPaid + accountsPayable
    const cashAndBank = startingBalance + gop - investorPayouts - accountsReceivable - fixedAssetsValue - totalDynamicPaid + accountsPayable;
    
    const totalAssetsLancar = cashAndBank + accountsReceivable;
    const totalAssets = totalAssetsLancar + fixedAssetsValue;
    
    const equity = startingBalance + netIncome - investorPayouts;
    const totalLiabilitiesEquity = totalLiabilities + equity;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                updateStartingBalance(Number(editBalance) || 0),
                updateFixedAssetsValue(Number(editFixedAssets) || 0)
            ]);
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = 
        Number(editBalance) !== startingBalance || 
        Number(editFixedAssets) !== fixedAssetsValue ||
        Number(editVatPaid) !== vatPaid ||
        Number(editFeePaid) !== feePaid ||
        Number(editScPaid) !== scPaid ||
        Number(editLbPaid) !== lbPaid;

    return (
        <div className={styles.flexColumn} style={{ gap: "24px" }}>
            {/* CONFIGURATION CARD */}
            <div className={`${styles.flexColumn} ${styles.cardSurfaceSoft}`} style={{ gap: "24px", padding: "24px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <AlertCircle className={styles.textDarkToLight} size={20} style={{ marginTop: "4px" }} />
                    <div>
                        <h4 className={styles.titleLg} style={{ fontSize: "16px", fontWeight: 500 }}>Konfigurasi Saldo & Aktiva Tetap</h4>
                        <p className={styles.captionText} style={{ marginTop: "4px", maxWidth: "800px" }}>
                            Gunakan panel ini untuk mencatat <b>Saldo Awal</b> dan <b>Nilai Inventaris</b>. Pengeluaran dinamis (PPN, Management Fee, dll) akan otomatis dicatat berdasarkan pengaturan persentase di menu P&L.
                        </p>
                    </div>
                </div>
                
                {/* Balances configuration */}
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", borderBottom: "1px dashed var(--f-border-soft)", paddingBottom: "20px" }}>
                    <div className={styles.flexColumn} style={{ gap: "6px" }}>
                        <label className={styles.captionText} style={{ fontWeight: 500, color: "var(--f-muted)" }}>Saldo Awal (Modal / Kas Awal)</label>
                        <input 
                            type="number"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                            min="0"
                            onWheel={(e) => e.currentTarget.blur()}
                            onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                    e.preventDefault();
                                }
                            }}
                            className={styles.inputField}
                            style={{ width: "220px", fontFamily: '"Inter Display", monospace' }}
                            placeholder="0"
                        />
                    </div>

                    <div className={styles.flexColumn} style={{ gap: "6px" }}>
                        <label className={styles.captionText} style={{ fontWeight: 500, color: "var(--f-muted)" }}>Nilai Inventaris & Peralatan (Aktiva Tetap)</label>
                        <input 
                            type="number"
                            value={editFixedAssets}
                            onChange={(e) => setEditFixedAssets(e.target.value)}
                            min="0"
                            onWheel={(e) => e.currentTarget.blur()}
                            onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                    e.preventDefault();
                                }
                            }}
                            className={styles.inputField}
                            style={{ width: "220px", fontFamily: '"Inter Display", monospace' }}
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Note: Liability Settlements removed to follow dynamic P&L mode */}
                <div className={styles.flexColumn} style={{ gap: "12px", borderBottom: "1px dashed var(--f-border-soft)", paddingBottom: "20px" }}>
                    <h5 className={styles.titleLg} style={{ fontSize: "14px", fontWeight: 500 }}>Catatan Realisasi Kewajiban Dinamis</h5>
                    <p className={styles.captionText} style={{ fontStyle: "italic", color: "var(--f-sage)" }}>
                        Sistem kini berjalan dalam mode dinamis (100% otomatis menyesuaikan persentase di P&L). Beban PPN, Management Fee, Service Charge, & Lost/Breakage otomatis mengurangi kas berjalan.
                    </p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className={styles.buttonPrimary}
                        style={{ padding: "12px 24px", height: "44px" }}
                    >
                        <Save size={16} />
                        {isSaving ? "..." : "Simpan Semua Perubahan"}
                    </button>
                </div>
            </div>

            {/* BALANCE SHEET SHEET */}
            <div className={styles.cardSurface}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h3 className={styles.displayMd}>Neraca (Balance Sheet)</h3>
                    <p className={styles.captionText} style={{ marginTop: "4px" }}>Periode Akhir: {month}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px" }}>
                    {/* ASSETS */}
                    <div>
                        <div style={{ borderBottom: "2px solid #181d26", paddingBottom: "8px", marginBottom: "16px" }}>
                            <h4 className={styles.titleLg} style={{ fontSize: "18px", fontWeight: 500, textTransform: "uppercase" }}>Aktiva (Assets)</h4>
                        </div>
                        
                        <div className={styles.flexColumn} style={{ gap: "12px" }}>
                            <h5 className={styles.captionText} style={{ textTransform: "uppercase", letterSpacing: "1px", marginTop: "8px" }}>Aktiva Lancar</h5>
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <span className={styles.bodyText} style={{ fontWeight: 500 }}>Kas & Bank</span>
                                <span className={styles.excelBalance}>{formatIDR(cashAndBank)}</span>
                            </div>
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <span className={styles.bodyText} style={{ fontWeight: 500 }}>Piutang Usaha</span>
                                <span className={styles.excelBalance}>{formatIDR(accountsReceivable)}</span>
                            </div>

                            <div className={`${styles.flexBetween} ${styles.divider}`} style={{ paddingTop: "8px", marginTop: "8px" }}>
                                <span className={styles.bodyText} style={{ fontWeight: 500 }}>Total Aktiva Lancar</span>
                                <span className={styles.excelBalance}>{formatIDR(totalAssetsLancar)}</span>
                            </div>

                            <h5 className={styles.captionText} style={{ textTransform: "uppercase", letterSpacing: "1px", marginTop: "24px" }}>Aktiva Tetap</h5>
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <span className={styles.bodyText} style={{ fontWeight: 500 }}>Inventaris & Peralatan</span>
                                <span className={styles.excelBalance}>{formatIDR(fixedAssetsValue)}</span>
                            </div>

                            <div className={`${styles.flexBetween} ${styles.cardSurfaceSoft} ${styles.dividerStrong}`} style={{ paddingTop: "16px", marginTop: "32px", padding: "16px" }}>
                                <span className={styles.titleLg} style={{ fontSize: "16px", fontWeight: 500, textTransform: "uppercase" }}>Total Aktiva</span>
                                <span className={styles.excelBalance} style={{ fontSize: "16px" }}>{formatIDR(totalAssets)}</span>
                            </div>
                        </div>
                    </div>

                    {/* LIABILITIES & EQUITY */}
                    <div>
                        <div className={styles.borderDarkToLight} style={{ borderBottomWidth: "2px", borderBottomStyle: "solid", paddingBottom: "8px", marginBottom: "16px" }}>
                            <h4 className={styles.titleLg} style={{ fontSize: "18px", fontWeight: 500, textTransform: "uppercase" }}>Kewajiban & Ekuitas</h4>
                        </div>

                        <div className={styles.flexColumn} style={{ gap: "12px" }}>
                            <h5 className={styles.captionText} style={{ textTransform: "uppercase", letterSpacing: "1px", marginTop: "8px" }}>Kewajiban (Liabilities)</h5>
                            
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <div>
                                    <span className={styles.bodyText} style={{ fontWeight: 500, display: "block" }}>Hutang Dagang (Pembelian Tempo)</span>
                                </div>
                                <span className={styles.excelBalance}>{formatIDR(accountsPayable)}</span>
                            </div>

                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <div>
                                    <span className={styles.bodyText} style={{ fontWeight: 500, display: "block" }}>Hutang Operasional (Management Fee)</span>
                                    <span className={styles.captionText} style={{ color: "var(--f-sage)" }}>Otomatis Diselesaikan (Dinamis)</span>
                                </div>
                                <span className={styles.excelBalance}>{formatIDR(0)}</span>
                            </div>
                            
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <div>
                                    <span className={styles.bodyText} style={{ fontWeight: 500, display: "block" }}>Pajak Terhutang (VAT / PB1)</span>
                                    <span className={styles.captionText} style={{ color: "var(--f-sage)" }}>Otomatis Diselesaikan (Dinamis)</span>
                                </div>
                                <span className={styles.excelBalance}>{formatIDR(0)}</span>
                            </div>
                            
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <div>
                                    <span className={styles.bodyText} style={{ fontWeight: 500, display: "block" }}>Hutang Service Charge Karyawan</span>
                                    <span className={styles.captionText} style={{ color: "var(--f-sage)" }}>Otomatis Diselesaikan (Dinamis)</span>
                                </div>
                                <span className={styles.excelBalance}>{formatIDR(0)}</span>
                            </div>
                            
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <div>
                                    <span className={styles.bodyText} style={{ fontWeight: 500, display: "block" }}>Cadangan Kehilangan & Kerusakan</span>
                                    <span className={styles.captionText} style={{ color: "var(--f-sage)" }}>Otomatis Diselesaikan (Dinamis)</span>
                                </div>
                                <span className={styles.excelBalance}>{formatIDR(0)}</span>
                            </div>
                            
                            <div className={`${styles.flexBetween} ${styles.divider}`} style={{ paddingTop: "8px", marginTop: "8px" }}>
                                <span className={styles.bodyText} style={{ fontWeight: 500 }}>Total Kewajiban</span>
                                <span className={styles.excelBalance}>{formatIDR(totalLiabilities)}</span>
                            </div>

                            <h5 className={styles.captionText} style={{ textTransform: "uppercase", letterSpacing: "1px", marginTop: "24px" }}>Ekuitas (Equity)</h5>
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <span className={styles.bodyText} style={{ fontWeight: 500 }}>Modal Awal / Saldo Laba Bulan Lalu</span>
                                <span className={styles.excelBalance}>{formatIDR(startingBalance)}</span>
                            </div>
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <span className={styles.bodyText} style={{ fontWeight: 500 }}>Laba (Rugi) Tahun Berjalan</span>
                                <span className={`${styles.fontMono} ${netIncome < 0 ? styles.textDanger : styles.textSuccess}`} style={{ fontWeight: 500 }}>
                                    {formatIDR(netIncome)}
                                </span>
                            </div>
                            {investorPayouts > 0 && (
                                <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                    <span className={styles.bodyText} style={{ fontWeight: 500 }}>Distribusi Laba Investor (Dividen)</span>
                                    <span className={`${styles.fontMono} ${styles.textDanger}`} style={{ fontWeight: 500 }}>
                                        -{formatIDR(investorPayouts)}
                                    </span>
                                </div>
                            )}

                            <div className={`${styles.flexBetween} ${styles.divider}`} style={{ paddingTop: "8px", marginTop: "8px" }}>
                                <span className={styles.bodyText} style={{ fontWeight: 500 }}>Total Ekuitas</span>
                                <span className={styles.excelBalance}>{formatIDR(equity)}</span>
                            </div>

                            <div className={`${styles.flexBetween} ${styles.cardSurfaceSoft} ${styles.dividerStrong}`} style={{ paddingTop: "16px", marginTop: "32px", padding: "16px" }}>
                                <span className={styles.titleLg} style={{ fontSize: "16px", fontWeight: 500, textTransform: "uppercase" }}>Total Kewajiban & Ekuitas</span>
                                <span className={styles.excelBalance} style={{ fontSize: "16px" }}>{formatIDR(totalLiabilitiesEquity)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {Math.abs(totalAssets - totalLiabilitiesEquity) < 1 && (
                    <div className={styles.textSuccess} style={{ marginTop: "32px", textAlign: "center", fontSize: "14px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>
                        ✅ Balance
                    </div>
                )}
                {Math.abs(totalAssets - totalLiabilitiesEquity) >= 1 && (
                    <div className={styles.textDanger} style={{ marginTop: "32px", textAlign: "center", fontSize: "14px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>
                        ❌ Unbalanced (Selisih: {formatIDR(Math.abs(totalAssets - totalLiabilitiesEquity))})
                    </div>
                )}
            </div>
        </div>
    );
};
