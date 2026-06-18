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

    // Accounts Receivable (Piutang Usaha): Net unpaid portion of bookings that are not fully paid
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

    // Accounts Payable (Hutang Dagang): Sum of amount for expenses with tempo status
    const accountsPayable = (expenses || []).filter((e: any) => {
        const status = (e.paymentStatus || "").toLowerCase();
        return status === "tempo" || status === "pending";
    }).reduce((sum, e) => sum + (e.amount || 0), 0);

    const investorPayouts = (pnlResult?.investorDistributions || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    const netIncome = pnlResult?.card12_ReconOwner || 0;
    
    // Accrued Liabilities (Kewajiban Akrual Periode Ini)
    const vatLiability = pnlResult?.card11_VAT || 0;
    const scLiability = pnlResult?.summaryServiceCharge || 0;
    const lbLiability = pnlResult?.summaryLostBreakage || 0;
    const feeLiability = pnlResult?.card9_FeeGross || 0;

    // Remaining Liabilities (Sisa Kewajiban setelah Pelunasan)
    const sisaVat = Math.max(0, vatLiability - vatPaid);
    const sisaFee = Math.max(0, feeLiability - feePaid);
    const sisaSc = Math.max(0, scLiability - scPaid);
    const sisaLb = Math.max(0, lbLiability - lbPaid);
    const totalLiabilities = sisaVat + sisaFee + sisaSc + sisaLb + accountsPayable;

    const gop = pnlResult?.card7_TotalGOP || 0;
    const totalPaid = vatPaid + feePaid + scPaid + lbPaid;

    // Cash and Bank calculation: startingBalance + GOP - investorPayouts - accountsReceivable - fixedAssetsValue - totalPaid + accountsPayable
    const cashAndBank = startingBalance + gop - investorPayouts - accountsReceivable - fixedAssetsValue - totalPaid + accountsPayable;
    
    const totalAssetsLancar = cashAndBank + accountsReceivable;
    const totalAssets = totalAssetsLancar + fixedAssetsValue;
    
    const equity = startingBalance + netIncome - investorPayouts;
    const totalLiabilitiesEquity = totalLiabilities + equity;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                updateStartingBalance(Number(editBalance) || 0),
                updateFixedAssetsValue(Number(editFixedAssets) || 0),
                updateVatPaid(Number(editVatPaid) || 0),
                updateFeePaid(Number(editFeePaid) || 0),
                updateScPaid(Number(editScPaid) || 0),
                updateLbPaid(Number(editLbPaid) || 0)
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
                        <h4 className={styles.titleLg} style={{ fontSize: "16px", fontWeight: 500 }}>Konfigurasi Saldo & Pelunasan Kewajiban</h4>
                        <p className={styles.captionText} style={{ marginTop: "4px", maxWidth: "800px" }}>
                            Gunakan panel ini untuk mencatat <b>Saldo Awal</b>, <b>Nilai Inventaris</b>, dan <b>Pelunasan Riil Pajak/Operasional</b>. Pembayaran kewajiban akan otomatis mengurangi kas hotel dan sisa hutang pada laporan Neraca periode <b>{month}</b> ini secara berpasangan (balance).
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

                {/* Liability Settlements configuration */}
                <div className={styles.flexColumn} style={{ gap: "12px" }}>
                    <h5 className={styles.titleLg} style={{ fontSize: "14px", fontWeight: 500 }}>Catatan Realisasi / Pelunasan Kewajiban Bulan Ini</h5>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                        
                        {/* VAT Paid */}
                        <div className={styles.flexColumn} style={{ gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label className={styles.captionText} style={{ fontWeight: 500, color: "var(--f-muted)" }}>Pajak VAT Disetor</label>
                                <button 
                                    onClick={() => setEditVatPaid(Math.floor(vatLiability).toString())}
                                    className={styles.captionText} 
                                    style={{ color: "var(--f-sage)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Setor Penuh
                                </button>
                            </div>
                            <input 
                                type="number"
                                value={editVatPaid}
                                onChange={(e) => setEditVatPaid(e.target.value)}
                                min="0"
                                onWheel={(e) => e.currentTarget.blur()}
                                onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                        e.preventDefault();
                                    }
                                }}
                                className={styles.inputField}
                                style={{ fontFamily: '"Inter Display", monospace' }}
                                placeholder="0"
                            />
                        </div>

                        {/* Fee Paid */}
                        <div className={styles.flexColumn} style={{ gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label className={styles.captionText} style={{ fontWeight: 500, color: "var(--f-muted)" }}>Management Fee Dibayar</label>
                                <button 
                                    onClick={() => setEditFeePaid(Math.floor(feeLiability).toString())}
                                    className={styles.captionText} 
                                    style={{ color: "var(--f-sage)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Setor Penuh
                                </button>
                            </div>
                            <input 
                                type="number"
                                value={editFeePaid}
                                onChange={(e) => setEditFeePaid(e.target.value)}
                                min="0"
                                onWheel={(e) => e.currentTarget.blur()}
                                onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                        e.preventDefault();
                                    }
                                }}
                                className={styles.inputField}
                                style={{ fontFamily: '"Inter Display", monospace' }}
                                placeholder="0"
                            />
                        </div>

                        {/* SC Paid */}
                        <div className={styles.flexColumn} style={{ gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label className={styles.captionText} style={{ fontWeight: 500, color: "var(--f-muted)" }}>Service Charge Dibagikan</label>
                                <button 
                                    onClick={() => setEditScPaid(Math.floor(scLiability).toString())}
                                    className={styles.captionText} 
                                    style={{ color: "var(--f-sage)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Setor Penuh
                                </button>
                            </div>
                            <input 
                                type="number"
                                value={editScPaid}
                                onChange={(e) => setEditScPaid(e.target.value)}
                                min="0"
                                onWheel={(e) => e.currentTarget.blur()}
                                onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                        e.preventDefault();
                                    }
                                }}
                                className={styles.inputField}
                                style={{ fontFamily: '"Inter Display", monospace' }}
                                placeholder="0"
                            />
                        </div>

                        {/* LB Paid */}
                        <div className={styles.flexColumn} style={{ gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label className={styles.captionText} style={{ fontWeight: 500, color: "var(--f-muted)" }}>Realisasi Lost/Breakage</label>
                                <button 
                                    onClick={() => setEditLbPaid(Math.floor(lbLiability).toString())}
                                    className={styles.captionText} 
                                    style={{ color: "var(--f-sage)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Setor Penuh
                                </button>
                            </div>
                            <input 
                                type="number"
                                value={editLbPaid}
                                onChange={(e) => setEditLbPaid(e.target.value)}
                                min="0"
                                onWheel={(e) => e.currentTarget.blur()}
                                onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                        e.preventDefault();
                                    }
                                }}
                                className={styles.inputField}
                                style={{ fontFamily: '"Inter Display", monospace' }}
                                placeholder="0"
                            />
                        </div>

                    </div>
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
                                    {feePaid > 0 && <span className={styles.captionText} style={{ color: "var(--f-sage)" }}>Disetor: {formatIDR(feePaid)}</span>}
                                </div>
                                <span className={styles.excelBalance}>{formatIDR(sisaFee)}</span>
                            </div>
                            
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <div>
                                    <span className={styles.bodyText} style={{ fontWeight: 500, display: "block" }}>Pajak Terhutang (VAT / PB1)</span>
                                    {vatPaid > 0 && <span className={styles.captionText} style={{ color: "var(--f-sage)" }}>Disetor: {formatIDR(vatPaid)}</span>}
                                </div>
                                <span className={styles.excelBalance}>{formatIDR(sisaVat)}</span>
                            </div>
                            
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <div>
                                    <span className={styles.bodyText} style={{ fontWeight: 500, display: "block" }}>Hutang Service Charge Karyawan</span>
                                    {scPaid > 0 && <span className={styles.captionText} style={{ color: "var(--f-sage)" }}>Disetor: {formatIDR(scPaid)}</span>}
                                </div>
                                <span className={styles.excelBalance}>{formatIDR(sisaSc)}</span>
                            </div>
                            
                            <div className={styles.flexBetween} style={{ padding: "8px 0" }}>
                                <div>
                                    <span className={styles.bodyText} style={{ fontWeight: 500, display: "block" }}>Cadangan Kehilangan & Kerusakan</span>
                                    {lbPaid > 0 && <span className={styles.captionText} style={{ color: "var(--f-sage)" }}>Direalisasikan: {formatIDR(lbPaid)}</span>}
                                </div>
                                <span className={styles.excelBalance}>{formatIDR(sisaLb)}</span>
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
