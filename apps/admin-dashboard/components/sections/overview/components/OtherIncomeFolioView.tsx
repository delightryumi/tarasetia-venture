"use client";

import React, { useState } from "react";
import { 
    Copy, 
    Check, 
    Receipt, 
    Calendar, 
    Clock, 
    User, 
    CreditCard, 
    Building2, 
    CheckCircle2, 
    AlertCircle,
    Printer,
    FileText,
    Coins,
    Sparkles,
    Shield
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

const formatAuditTimestamp = (raw?: any, fallbackDate?: string) => {
    if (!raw && !fallbackDate) return "-";
    try {
        const d = new Date(raw || fallbackDate);
        if (isNaN(d.getTime())) return String(raw || fallbackDate);
        
        // If it was just a YYYY-MM-DD date string without time
        const hasTime = typeof raw === "string" && (raw.includes("T") || raw.includes(":"));
        const datePart = d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
        
        if (hasTime) {
            const timePart = d.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
            return `${datePart}, ${timePart} WIB`;
        }
        return datePart;
    } catch {
        return String(raw || fallbackDate);
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
    const category = guest.category || guest.incomeCategory || guest.channel || "Other Income";
    const staffName = guest.staffName || guest.createdBy || guest.inputBy || "Staff Front Desk";
    const staffDisplay = guest.staffEmail ? `${staffName} (${guest.staffEmail})` : staffName;
    const creationTimeStr = formatAuditTimestamp(guest.timestamp || guest.createdAt || guest.insertedAt, effectiveDate);

    // Active settlement items
    const paymentBreakdown: { label: string; amount: number; method: string }[] = [];
    if (paidCash > 0) paymentBreakdown.push({ label: "Tunai / Cash Kasir FO", amount: paidCash, method: "Cash" });
    if (paidEdc > 0) paymentBreakdown.push({ label: "EDC Kartu Debit / Kredit", amount: paidEdc, method: "EDC" });
    if (paidQris > 0) paymentBreakdown.push({ label: "QRIS Kasir Hotel", amount: paidQris, method: "QRIS" });
    if (paidTransfer > 0) paymentBreakdown.push({ label: "Transfer Rekening Bank Hotel", amount: paidTransfer, method: "Bank Transfer" });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "24px" }}>
            {/* Voucher Header Card */}
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
                                <Receipt size={15} style={{ color: "#b45309" }} />
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--f-foreground, #0f172a)", letterSpacing: "0.02em" }}>
                                {activeHotelName || "TARASÈTIA HOTEL & VENTURE"}
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Voucher Pendapatan Kasir Non-Kamar
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
                            {isCancelled ? "Void / Cancelled" : guest.isCompliment ? "Compliment" : dueAmount === 0 ? "Lunas" : "Belum Lunas"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontFamily: "var(--f-font-mono, monospace)", color: "var(--f-muted, #64748b)" }}>
                            <span>{voucherId}</span>
                            <button 
                                type="button" 
                                onClick={() => handleCopy("voucherId", voucherId)} 
                                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "var(--f-muted)" }}
                                title="Salin Nomor Voucher"
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
                            Petugas / Kasir FO
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--f-foreground, #0f172a)" }}>
                            {staffDisplay}
                        </span>
                    </div>

                    <div>
                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--f-muted, #64748b)", display: "block", marginBottom: "4px" }}>
                            Referensi Tamu / Kamar
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--f-foreground, #0f172a)" }}>
                            {guest.roomNumber ? `Posting ke Kamar #${guest.roomNumber}` : "Direct Sale (Non-Kamar / Transaksi Langsung)"}
                        </span>
                    </div>
                </div>

                {/* Compliment Details */}
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
                                Alasan: {guest.complimentReason || "Kompensasi Layanan / Kebijakan Operasional Hotel"}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Financial Settlement Card */}
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
                            Rincian Pembayaran (Settlement)
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
                                Metode Pembayaran Tercatat:
                            </span>

                            {paymentBreakdown.length > 0 ? (
                                paymentBreakdown.map((item, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                        <span>{item.label}:</span>
                                        <span style={{ fontWeight: 700, fontFamily: "var(--f-font-mono)" }}>Rp {formatCurrency(item.amount)}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                                    <span>{guest.paymentMethod || "Tunai / Cash Kasir"}:</span>
                                    <span style={{ fontWeight: 700, fontFamily: "var(--f-font-mono)" }}>
                                        Rp {formatCurrency(Number(guest.payHotel || totalAmount))}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: dueAmount > 0 ? "#b45309" : "#059669" }}>
                            {dueAmount > 0 ? "Sisa Tagihan (Due Amount):" : "Status Pembayaran:"}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "var(--f-font-mono)", color: dueAmount > 0 ? "#b45309" : "#059669" }}>
                            {dueAmount > 0 ? `Rp ${formatCurrency(dueAmount)}` : "LUNAS (Rp 0)"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Audit Trail / Log Transaksi (Standard Hotel System) */}
            <div style={{ 
                backgroundColor: "var(--f-surface, #ffffff)", 
                border: "1px solid var(--f-hairline, #e2e8f0)", 
                borderRadius: "10px", 
                padding: "20px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <FileText size={15} style={{ color: "var(--f-muted)" }} />
                    <h4 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--f-muted)", margin: 0, letterSpacing: "0.05em" }}>
                        Audit Trail / Log Transaksi
                    </h4>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Event 1: Creation & Revenue Posting */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "11px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", marginTop: "4px", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontWeight: 700, color: "var(--f-foreground)" }}>Posting Pendapatan (Revenue Posting)</span>
                                <span style={{ color: "var(--f-muted)", fontSize: "10px" }}>{creationTimeStr}</span>
                            </div>
                            <span style={{ color: "var(--f-muted)", display: "block", marginTop: "2px" }}>
                                Operator: {staffDisplay} • No. Voucher: <b style={{ fontFamily: "var(--f-font-mono)" }}>{voucherId}</b>
                            </span>
                            <span style={{ color: "var(--f-muted)", display: "block" }}>
                                Item: {category} ({guest.guestName || guest.description || "Pendapatan Lain"}) • Nominal: <b>Rp {formatCurrency(totalAmount)}</b>
                            </span>
                        </div>
                    </div>

                    {/* Event 2: Settlement / Payment Recording */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "11px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: guest.isCompliment ? "#e11d48" : dueAmount === 0 ? "#059669" : "#d97706", marginTop: "4px", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontWeight: 700, color: "var(--f-foreground)" }}>
                                    {guest.isCompliment ? "Otorisasi Compliment" : "Penerimaan Pembayaran (Settlement)"}
                                </span>
                                <span style={{ color: "var(--f-muted)", fontSize: "10px" }}>{creationTimeStr}</span>
                            </div>
                            <span style={{ color: "var(--f-muted)", display: "block", marginTop: "2px" }}>
                                {guest.isCompliment 
                                    ? `Compliment disetujui: ${guest.complimentReason || "Kompensasi Layanan"}`
                                    : `Metode: ${guest.paymentMethod || "Cash"} • Status: ${dueAmount === 0 ? "Lunas" : "Belum Lunas"}`
                                }
                            </span>
                            {paymentBreakdown.length > 0 && (
                                <span style={{ color: "var(--f-muted)", display: "block", fontSize: "10px" }}>
                                    Rincian: {paymentBreakdown.map(p => `${p.method}: Rp ${formatCurrency(p.amount)}`).join(" | ")}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Event 3: Cancellation / Void (if applicable) */}
                    {isCancelled && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "11px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444", marginTop: "4px", flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <span style={{ fontWeight: 700, color: "#b91c1c" }}>Transaksi Dibatalkan (Void)</span>
                                </div>
                                <span style={{ color: "#ef4444", display: "block", marginTop: "2px" }}>
                                    Status transaksi telah diubah menjadi CANCELLED / VOID.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Event 4: Modification Event (Only if real update metadata exists) */}
                    {Boolean(guest.updatedAt || guest.modifiedAt) && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "11px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#6366f1", marginTop: "4px", flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <span style={{ fontWeight: 700, color: "var(--f-foreground)" }}>Pembaruan Transaksi</span>
                                    <span style={{ color: "var(--f-muted)", fontSize: "10px" }}>
                                        {formatAuditTimestamp(guest.updatedAt || guest.modifiedAt)}
                                    </span>
                                </div>
                                <span style={{ color: "var(--f-muted)", display: "block", marginTop: "2px" }}>
                                    Operator: {guest.updatedBy || staffDisplay}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
