"use client";

import React, { useState } from "react";
import { 
    Copy, 
    Check, 
    Coffee, 
    Calendar, 
    Clock, 
    User, 
    CreditCard, 
    Receipt,
    Building2, 
    CheckCircle2, 
    AlertCircle,
    Printer,
    FileText,
    ShieldCheck,
    Coins,
    Sparkles
} from "lucide-react";
import styles from "../OverviewStyles.module.css";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OtherIncomeFolioViewProps {
    guest: any;
    onEditPayment?: () => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat("id-ID").format(Math.floor(val || 0));

const formatLongDate = (dateStr?: string) => {
    if (!dateStr || dateStr === "---") return "---";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    } catch {
        return dateStr;
    }
};

export function OtherIncomeFolioView({ guest, onEditPayment }: OtherIncomeFolioViewProps) {
    const { activeHotelName } = useAuth();
    const router = useRouter();
    const [copiedField, setCopiedField] = useState<string | null>(null);

    if (!guest) return null;

    const voucherId = guest.bookingId || guest.voucherCode || `OTH-${guest.timestamp?.toString().slice(-6) || "INC"}`;
    const effectiveDate = guest.effectiveDate || guest.date || guest.checkInDate || guest.checkIn || (guest.timestamp ? new Date(guest.timestamp).toISOString().split("T")[0] : "---");
    const totalAmount = Number(guest.totalAmount || guest.amount || 0);

    const paidCash = Number(guest.paidCash || 0);
    const paidEdc = Number(guest.paidEdc || 0);
    const paidQris = Number(guest.paidQris || 0);
    const paidTransfer = Number(guest.paidTransfer || 0);
    const currentPaid = paidCash + paidEdc + paidQris + paidTransfer;
    const dueAmount = guest.isCompliment ? 0 : Math.max(0, totalAmount - (currentPaid > 0 ? currentPaid : Number(guest.payHotel || 0)));

    const handleCopy = (field: string, text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`Tersalin: ${text}`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const isCancelled = guest.status === "CANCELLED" || guest.status === "CANCEL";

    // Determine USALI Schedule classification
    const category = guest.category || guest.incomeCategory || guest.channel || "Other Income";
    const isSchedule4Misc = ["extra bed", "cancellation", "space rental", "meeting", "sewa"].some(k => category.toLowerCase().includes(k));
    const usaliSchedule = isSchedule4Misc 
        ? "USALI Schedule 4: Miscellaneous Income" 
        : "USALI Schedule 3: Other Operated Departments";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "24px" }}>
            {/* USALI Folio Header Card */}
            <div style={{ 
                backgroundColor: "var(--f-surface, #ffffff)", 
                border: "1px solid var(--f-hairline, #e2e8f0)", 
                borderRadius: "10px", 
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", borderBottom: "1px solid var(--f-hairline, #e2e8f0)", paddingBottom: "14px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "6px", backgroundColor: "#fef3c7", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Coffee size={15} style={{ color: "#b45309" }} />
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--f-foreground, #0f172a)", letterSpacing: "0.02em" }}>
                                {activeHotelName || "TARASÈTIA HOTEL & VENTURE"}
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {usaliSchedule}
                        </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <span style={{ 
                            fontSize: "10px", 
                            fontWeight: 800, 
                            padding: "4px 8px", 
                            borderRadius: "6px", 
                            backgroundColor: isCancelled ? "#fee2e2" : guest.isCompliment ? "#ffe4e6" : dueAmount === 0 ? "#dcfce7" : "#fef3c7",
                            color: isCancelled ? "#b91c1c" : guest.isCompliment ? "#e11d48" : dueAmount === 0 ? "#15803d" : "#b45309",
                            textTransform: "uppercase"
                        }}>
                            {isCancelled ? "Void / Cancelled" : guest.isCompliment ? "Compliment (Gratis)" : dueAmount === 0 ? "Lunas" : "Belum Lunas"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontFamily: "var(--f-font-mono, monospace)", color: "var(--f-muted, #64748b)" }}>
                            <span>{voucherId}</span>
                            <button 
                                type="button" 
                                onClick={() => handleCopy("voucherId", voucherId)} 
                                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "var(--f-muted)" }}
                                title="Salin ID Voucher"
                            >
                                {copiedField === "voucherId" ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Classification Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", paddingTop: "16px" }}>
                    <div>
                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--f-muted, #64748b)", display: "block", marginBottom: "4px" }}>
                            Kategori Pendapatan
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--f-foreground, #0f172a)" }}>
                            {category}
                        </span>
                    </div>

                    <div>
                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--f-muted, #64748b)", display: "block", marginBottom: "4px" }}>
                            Tanggal Transaksi
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--f-foreground, #0f172a)" }}>
                            {formatLongDate(effectiveDate)}
                        </span>
                    </div>

                    <div style={{ gridColumn: "span 2" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--f-muted, #64748b)", display: "block", marginBottom: "4px" }}>
                            Rincian Layanan / Deskripsi
                        </span>
                        <div style={{ padding: "8px 12px", backgroundColor: "var(--f-surface-soft, #f8fafc)", borderRadius: "6px", border: "1px solid var(--f-hairline, #e2e8f0)", fontSize: "12px", fontWeight: 600, color: "var(--f-body, #1e293b)" }}>
                            {guest.guestName || guest.description || "Layanan Pendapatan Lain-lain"}
                        </div>
                    </div>

                    <div>
                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--f-muted, #64748b)", display: "block", marginBottom: "4px" }}>
                            Kasir / Staff FO
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--f-foreground, #0f172a)" }}>
                            {guest.staffName || "Staff Kasir Front Office"}
                        </span>
                    </div>

                    <div>
                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--f-muted, #64748b)", display: "block", marginBottom: "4px" }}>
                            Referensi Tamu / Kamar
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--f-foreground, #0f172a)" }}>
                            {guest.roomNumber ? `Posting ke Kamar #${guest.roomNumber}` : "Direct Sale (Non-Guest / Kasir Luar)"}
                        </span>
                    </div>
                </div>

                {/* Compliment Banner if active */}
                {guest.isCompliment && (
                    <div style={{ 
                        marginTop: "16px", 
                        padding: "12px 14px", 
                        backgroundColor: "#fff1f2", 
                        border: "1px solid #fecdd3", 
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px"
                    }}>
                        <Sparkles size={16} style={{ color: "#e11d48", flexShrink: 0, marginTop: "2px" }} />
                        <div>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#e11d48", display: "block" }}>
                                Transaksi Kompensasi / Compliment (Bebas Biaya)
                            </span>
                            <span style={{ fontSize: "11px", color: "#9f1239" }}>
                                Alasan: {guest.complimentReason || "Fasilitas Owner / Kompensasi Tamu"}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Financial Settlement Card (DSR Ledger Breakdown) */}
            <div style={{ 
                backgroundColor: "var(--f-surface, #ffffff)", 
                border: "1px solid var(--f-hairline, #e2e8f0)", 
                borderRadius: "10px", 
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Coins size={16} style={{ color: "#059669" }} />
                        <h3 style={{ fontSize: "13px", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Pencatatan Finansial &amp; Settlement (DSR)
                        </h3>
                    </div>
                    {onEditPayment && !isCancelled && (
                        <button 
                            type="button" 
                            onClick={onEditPayment}
                            style={{ 
                                fontSize: "11px", 
                                fontWeight: 700, 
                                color: "#0284c7", 
                                background: "#f0f9ff", 
                                border: "1px solid #bae6fd", 
                                borderRadius: "6px", 
                                padding: "4px 10px",
                                cursor: "pointer" 
                            }}
                        >
                            Ubah Pembayaran
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--f-hairline)" }}>
                        <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>Total Nilai Transaksi:</span>
                        <span style={{ fontSize: "15px", fontWeight: 800, fontFamily: "var(--f-font-mono)", color: "var(--f-foreground)" }}>
                            Rp {guest.isCompliment ? "0" : formatCurrency(totalAmount)}
                        </span>
                    </div>

                    {!guest.isCompliment && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "10px 12px", backgroundColor: "var(--f-surface-soft)", borderRadius: "8px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--f-muted)", letterSpacing: "0.05em" }}>
                                Rincian Pembayaran Masuk:
                            </span>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                <span>💵 Cash FO (Tunai Kasir):</span>
                                <span style={{ fontWeight: 700, fontFamily: "var(--f-font-mono)" }}>Rp {formatCurrency(paidCash)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                <span>💳 EDC BCA / Mandiri:</span>
                                <span style={{ fontWeight: 700, fontFamily: "var(--f-font-mono)" }}>Rp {formatCurrency(paidEdc)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                <span>📱 QRIS Hotel:</span>
                                <span style={{ fontWeight: 700, fontFamily: "var(--f-font-mono)" }}>Rp {formatCurrency(paidQris)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                <span>🏦 Bank Transfer Hotel:</span>
                                <span style={{ fontWeight: 700, fontFamily: "var(--f-font-mono)" }}>Rp {formatCurrency(paidTransfer)}</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: dueAmount > 0 ? "#b45309" : "#059669" }}>
                            {dueAmount > 0 ? "Sisa Tagihan (Due Amount):" : "Status Pelunasan:"}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "var(--f-font-mono)", color: dueAmount > 0 ? "#b45309" : "#059669" }}>
                            {dueAmount > 0 ? `Rp ${formatCurrency(dueAmount)}` : "LUNAS (Rp 0)"}
                        </span>
                    </div>
                </div>
            </div>

            {/* USALI Standards Compliance Box */}
            <div style={{ 
                backgroundColor: "#f8fafc", 
                border: "1px solid #cbd5e1", 
                borderRadius: "10px", 
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={16} style={{ color: "#0284c7" }} />
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#0f172a", letterSpacing: "0.05em" }}>
                        Standar Akuntansi Perhotelan (USALI Compliance)
                    </span>
                </div>
                <div style={{ fontSize: "11px", color: "#475569", lineHeight: "1.5" }}>
                    • <b>Dampak Kamar:</b> 0 Kamar Terjual (0 Room Nights). Transaksi ini murni pendapatan tambahan dan <b>tidak mendistorsi</b> metrik okupansi (OCC), ARR, atau RevPAR kamar hotel.<br />
                    • <b>Alur Akuntansi:</b> Otomatis terintegrasi ke <b>Card 5 (Other Income)</b> pada Laporan Laba Rugi (P&amp;L), DSR Harian Kasir, dan Buku Kas Bank.
                </div>
            </div>

            {/* Audit Trail Timeline */}
            <div style={{ 
                backgroundColor: "var(--f-surface, #ffffff)", 
                border: "1px solid var(--f-hairline, #e2e8f0)", 
                borderRadius: "10px", 
                padding: "20px"
            }}>
                <h4 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--f-muted)", margin: "0 0 12px 0", letterSpacing: "0.05em" }}>
                    Jejak Audit Transaksi
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "11px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", marginTop: "4px" }} />
                        <div>
                            <span style={{ fontWeight: 700, color: "var(--f-foreground)" }}>Transaksi Dicatat di FO</span>
                            <span style={{ color: "var(--f-muted)", display: "block" }}>
                                Oleh: {guest.staffName || "Staff FO"} • Tanggal: {effectiveDate}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "11px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#0284c7", marginTop: "4px" }} />
                        <div>
                            <span style={{ fontWeight: 700, color: "var(--f-foreground)" }}>Settlement Kasir</span>
                            <span style={{ color: "var(--f-muted)", display: "block" }}>
                                {guest.isCompliment ? "Compliment / Kompensasi disetujui" : `Tercatat dibayar Rp ${formatCurrency(currentPaid > 0 ? currentPaid : totalAmount)}`}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "11px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b", marginTop: "4px" }} />
                        <div>
                            <span style={{ fontWeight: 700, color: "var(--f-foreground)" }}>Terposting ke DSR &amp; General Ledger</span>
                            <span style={{ color: "var(--f-muted)", display: "block" }}>
                                Akun USALI: {usaliSchedule} (Card 5 Other Income)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
