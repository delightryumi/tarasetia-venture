"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { 
    X, 
    User, 
    Calendar, 
    Bed, 
    CreditCard, 
    FileText, 
    Copy, 
    Check, 
    WarningCircle,
    Printer,
    IdentificationCard
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BookingRecord } from "../types";
import s from "./BookingDetailModal.module.css";

interface BookingDetailModalProps {
    booking: BookingRecord | null;
    onClose: () => void;
}

export function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
    const router = useRouter();
    const [copied, setCopied] = React.useState(false);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!booking) return null;

    const handleCopyVoucher = () => {
        const code = booking.voucherCode || booking.reservationId || booking.bookingId;
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success(`Voucher disalin: ${code}`);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return "-";
        try {
            const [y, m, d] = dateStr.split("-");
            return `${d}/${m}/${y}`;
        } catch {
            return dateStr;
        }
    };

    return (
        <div className={s.overlay} onClick={onClose}>
            <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={s.header}>
                    <div className={s.channelInfo}>
                        {booking.channelLogo ? (
                            <div className={s.channelLogo} style={{ position: "relative" }}>
                                <Image 
                                    src={booking.channelLogo} 
                                    alt={booking.channel} 
                                    width={28} 
                                    height={28} 
                                    style={{ objectFit: "contain" }}
                                    onError={(e: any) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        ) : null}
                        <div>
                            <div className={s.channelTitle}>
                                {booking.channel} · Reservasi Masuk
                            </div>
                            <div className={s.channelSubtitle}>
                                <span>Ref: {booking.voucherCode || booking.reservationId}</span>
                                <button 
                                    type="button"
                                    onClick={handleCopyVoucher} 
                                    style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", color: "#2563eb", padding: 0 }}
                                    title="Salin nomor voucher"
                                >
                                    {copied ? <Check size={14} weight="bold" color="#16a34a" /> : <Copy size={14} weight="bold" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Tutup">
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* Body Content */}
                <div className={s.body}>
                    {/* Cancellation Banner if cancelled */}
                    {booking.isCancelled && (
                        <div className={s.cancelBanner}>
                            <WarningCircle size={20} weight="bold" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div className={s.cancelBannerTitle}>Status: Reservasi Dibatalkan</div>
                                <div className={s.cancelBannerDesc}>
                                    {booking.cancelReason || "Pemesanan ini telah dibatalkan oleh tamu atau channel OTA terkait."}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guest Profile Section */}
                    <div className={s.section}>
                        <div className={s.sectionTitle}>
                            <User size={16} weight="bold" />
                            <span>Profil Tamu</span>
                        </div>
                        <div className={s.grid2}>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Nama Lengkap</span>
                                <span className={s.fieldValue}>{booking.guestName}</span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>No. Telepon / WhatsApp</span>
                                <span className={s.fieldValue}>{booking.phone || "-"}</span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Email</span>
                                <span className={s.fieldValue}>{booking.email || "-"}</span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Kewarganegaraan</span>
                                <span className={s.fieldValue}>{booking.nationality || "Indonesia"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stay & Room Details */}
                    <div className={s.section}>
                        <div className={s.sectionTitle}>
                            <Calendar size={16} weight="bold" />
                            <span>Jadwal & Detail Kamar</span>
                        </div>
                        <div className={s.grid3}>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Tanggal Check-In</span>
                                <span className={s.fieldValue}>{formatDateDisplay(booking.checkInDate)}</span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Tanggal Check-Out</span>
                                <span className={s.fieldValue}>{formatDateDisplay(booking.checkOutDate)}</span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Durasi Menginap</span>
                                <span className={s.fieldValue}>{booking.nights} Malam</span>
                            </div>
                        </div>

                        <div className={s.grid3} style={{ marginTop: 14 }}>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Tipe Kamar</span>
                                <span className={s.fieldValue}>{booking.roomType}</span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>No. Kamar Fisik</span>
                                <span className={s.fieldValue}>{booking.roomNumber || "Belum Ditetapkan (AUTO)"}</span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Paket Sarapan</span>
                                <span className={s.fieldValue}>{booking.hasBreakfast ? "Termasuk Sarapan" : "Room Only"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Financials & Settlement */}
                    <div className={s.section}>
                        <div className={s.sectionTitle}>
                            <CreditCard size={16} weight="bold" />
                            <span>Rincian Finansial & Tagihan</span>
                        </div>
                        <div className={s.financialRow}>
                            <span style={{ color: "#64748b" }}>Metode Penagihan (Payment Collect)</span>
                            <span style={{ fontWeight: 700, color: "#1e293b" }}>{booking.paymentMethod}</span>
                        </div>
                        <div className={s.financialRow}>
                            <span style={{ color: "#64748b" }}>Status Pembayaran</span>
                            <span style={{ 
                                fontWeight: 800, 
                                color: booking.paymentStatus === "Lunas" ? "#047857" : (booking.isCancelled ? "#b91c1c" : "#b45309") 
                            }}>
                                {booking.paymentStatus}
                            </span>
                        </div>
                        <div className={s.financialRow}>
                            <span style={{ color: "#64748b" }}>Total Harga Tamu (Gross)</span>
                            <span className={s.totalHighlight}>
                                {formatCurrency(booking.totalAmount || booking.grossAmount || booking.amount)}
                            </span>
                        </div>
                    </div>

                    {/* Technical / OTA Audit Info */}
                    <div className={s.section}>
                        <div className={s.sectionTitle}>
                            <FileText size={16} weight="bold" />
                            <span>Catatan & Audit Sistem</span>
                        </div>
                        <div className={s.grid2}>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>OTA Booking ID / Channex UUID</span>
                                <span className={s.fieldValue} style={{ fontSize: 11, fontFamily: "monospace" }}>
                                    {booking.bookingId}
                                </span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Koneksi Saluran</span>
                                <span className={s.fieldValue}>{booking.connectionChannel || "Direct Front Office"}</span>
                            </div>
                        </div>
                        {booking.note && (
                            <div className={s.field} style={{ marginTop: 10 }}>
                                <span className={s.fieldLabel}>Catatan Khusus</span>
                                <span className={s.fieldValue} style={{ fontWeight: 500, color: "#475569" }}>
                                    {booking.note}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className={s.footer}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button 
                            type="button"
                            className={`${s.actionButton} ${s.btnSecondary}`}
                            onClick={() => {
                                router.push(`/digital-checkin?module=front-office&bookingRef=${encodeURIComponent(booking.voucherCode || booking.reservationId)}`);
                                onClose();
                            }}
                        >
                            <IdentificationCard size={18} weight="bold" />
                            <span>Buka GRC</span>
                        </button>

                        <button 
                            type="button"
                            className={`${s.actionButton} ${s.btnSecondary}`}
                            onClick={() => {
                                router.push(`/invoice?module=front-office&bookingRef=${encodeURIComponent(booking.voucherCode || booking.reservationId)}`);
                                onClose();
                            }}
                        >
                            <Printer size={18} weight="bold" />
                            <span>Invoice</span>
                        </button>
                    </div>

                    <button 
                        type="button"
                        className={`${s.actionButton} ${s.btnPrimary}`}
                        onClick={onClose}
                    >
                        <span>Selesai</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
