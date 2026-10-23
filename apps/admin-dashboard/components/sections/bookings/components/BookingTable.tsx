"use client";

import React from "react";
import Image from "next/image";
import { 
    Copy, 
    Check, 
    WarningCircle, 
    Eye 
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";
import { BookingRecord } from "../types";
import s from "./BookingTable.module.css";

interface BookingTableProps {
    bookings: BookingRecord[];
}

export function BookingTable({ bookings, onSelect }: BookingTableProps) {
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
    const { formatCurrency } = useCurrency();

    const handleCopy = (e: React.MouseEvent, code: string, key: string, label: string) => {
        e.stopPropagation();
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopiedKey(key);
        toast.success(`${label} disalin: ${code}`);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return "-";
        try {
            const [y, m, d] = dateStr.split("-");
            return `${d}/${m}/${y?.slice(-2)}`;
        } catch {
            return dateStr;
        }
    };

    const getSafeDisplay = (val: any, fallback = "-"): string => {
        if (!val) return fallback;
        if (typeof val === "string") return val;
        if (typeof val === "number") return String(val);
        if (typeof val === "object") {
            return val.number || val.name || val.title || val.roomType || val.id || fallback;
        }
        return String(val);
    };

    const getStatusClass = (booking: BookingRecord) => {
        if (booking.isCancelled) return s.statusCancelled;
        if (booking.status === "CHECKED_IN" || booking.guestStatus === "in_house") return s.statusCheckedIn;
        if (booking.status === "CHECKED_OUT" || booking.guestStatus === "checked_out") return s.statusCheckedOut;
        return s.statusConfirmed;
    };

    const getStatusLabel = (booking: BookingRecord) => {
        if (booking.isCancelled) return "Cancelled";
        if (booking.status === "CHECKED_IN" || booking.guestStatus === "in_house") return "In-House";
        if (booking.status === "CHECKED_OUT" || booking.guestStatus === "checked_out") return "Checked-Out";
        return "Confirmed";
    };

    return (
        <div className={s.tableWrapper}>
            <table className={s.table}>
                <thead>
                    <tr>
                        <th className={s.th}>Channel & Ref</th>
                        <th className={s.th}>Nama Tamu</th>
                        <th className={s.th}>Tipe Kamar</th>
                        <th className={s.th}>Jadwal Menginap</th>
                        <th className={s.th}>Status</th>
                        <th className={s.th}>Metode Bayar</th>
                        <th className={s.th} style={{ textAlign: "right" }}>Total</th>
                        <th className={s.th} style={{ textAlign: "center" }}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((booking) => {
                        const resId = booking.reservationId || booking.voucherCode || booking.bookingId || "-";
                        const otaId = booking.otaReservationId;
                        const hasDiffOta = otaId && otaId !== (booking.reservationId || booking.voucherCode);

                        return (
                            <tr 
                                key={booking.id}
                                className={`${s.row} ${booking.isCancelled ? s.rowCancelled : ""}`}
                                onClick={() => onSelect(booking)}
                            >
                                {/* Channel & Reservation Identifiers */}
                                <td className={s.td}>
                                    <div className={s.channelCell}>
                                        {booking.channelLogo ? (
                                            <div className={s.otaLogo} style={{ position: "relative", width: 24, height: 24 }}>
                                                <Image 
                                                    src={booking.channelLogo} 
                                                    alt={booking.channel} 
                                                    width={24} 
                                                    height={24} 
                                                    style={{ objectFit: "contain", borderRadius: 4 }}
                                                    onError={(e: any) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        ) : null}
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                                                {booking.channel}
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
                                                {/* Primary Reservation ID (e.g. BDC-TEST) */}
                                                <div 
                                                    className={s.voucherText}
                                                    onClick={(e) => handleCopy(e, resId, `res-${booking.id}`, "Reservation ID")}
                                                    title="Salin Reservation ID"
                                                >
                                                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8" }}>RES:</span>
                                                    <span style={{ fontWeight: 700, color: "#1e293b" }}>{resId}</span>
                                                    {copiedKey === `res-${booking.id}` ? (
                                                        <Check size={10} weight="bold" color="#16a34a" />
                                                    ) : (
                                                        <Copy size={10} weight="bold" />
                                                    )}
                                                </div>

                                                {/* OTA Reservation ID (e.g. TEST) if different */}
                                                {hasDiffOta ? (
                                                    <div 
                                                        className={s.voucherText}
                                                        onClick={(e) => handleCopy(e, otaId, `ota-${booking.id}`, "OTA Reservation ID")}
                                                        title="Salin OTA Reservation ID"
                                                    >
                                                        <span style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8" }}>OTA:</span>
                                                        <span>{otaId}</span>
                                                        {copiedKey === `ota-${booking.id}` ? (
                                                            <Check size={10} weight="bold" color="#16a34a" />
                                                        ) : (
                                                            <Copy size={10} weight="bold" />
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Guest Name & Contact */}
                                <td className={s.td}>
                                    <div className={s.guestCell}>
                                        <span className={s.guestName} style={{ textDecoration: booking.isCancelled ? "line-through" : "none" }}>
                                            {getSafeDisplay(booking.guestName, "Tamu")}
                                        </span>
                                        <span className={s.guestSubtext}>
                                            {booking.phone || booking.nationality || `${booking.pax || 2} Tamu`}
                                        </span>
                                    </div>
                                </td>

                                {/* Room Type & Room Number */}
                                <td className={s.td}>
                                    <div style={{ fontWeight: 600, color: "#334155" }}>
                                        {getSafeDisplay(booking.roomType, "Standard Room")}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                        Kamar: <strong style={{ color: "#0f172a" }}>{getSafeDisplay(booking.roomNumber, "AUTO")}</strong>
                                        {booking.hasBreakfast ? " · Termasuk Sarapan" : ""}
                                    </div>
                                </td>

                                {/* Stay Timeline */}
                                <td className={s.td}>
                                    <div className={s.stayTimeline}>
                                        <span className={s.stayDates}>
                                            {formatDateDisplay(booking.checkInDate)} → {formatDateDisplay(booking.checkOutDate)}
                                        </span>
                                        <span className={s.stayNights}>
                                            {booking.nights} {booking.nights === 1 ? "Malam" : "Malam"}
                                        </span>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className={s.td}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        {booking.isModified ? (
                                            <div className={s.revisionPill} title="Reservasi mengalami revisi / perubahan">
                                                <span>Revisi</span>
                                            </div>
                                        ) : null}
                                        <div className={`${s.statusBadge} ${getStatusClass(booking)}`}>
                                            {booking.isCancelled ? <WarningCircle size={12} weight="bold" /> : null}
                                            <span>{getStatusLabel(booking)}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* Payment Method & Status */}
                                <td className={s.td}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                                        {booking.paymentMethod || "Pay at Hotel"}
                                    </div>
                                    <div style={{ 
                                        fontSize: 11, 
                                        fontWeight: 700, 
                                        color: booking.paymentStatus === "Lunas" ? "#047857" : (booking.isCancelled ? "#b91c1c" : "#b45309"),
                                        marginTop: 2
                                    }}>
                                        {booking.paymentStatus || "Belum Bayar"}
                                    </div>
                                </td>

                                {/* Total Amount */}
                                <td className={s.td} style={{ textAlign: "right" }}>
                                    <span className={`${s.amountVal} ${booking.isCancelled ? s.amountValCancelled : ""}`}>
                                        {formatCurrency(booking.totalAmount || booking.grossAmount || booking.amount)}
                                    </span>
                                </td>

                                {/* Action */}
                                <td className={s.td} style={{ textAlign: "center" }}>
                                    <button 
                                        type="button"
                                        className={s.actionBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(booking);
                                        }}
                                        title="Buka detail booking"
                                    >
                                        <Eye size={16} weight="bold" />
                                        <span>Detail</span>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
