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
import { BookingRecord } from "../types";
import s from "./BookingTable.module.css";

interface BookingTableProps {
    bookings: BookingRecord[];
    onSelect: (booking: BookingRecord) => void;
}

export function BookingTable({ bookings, onSelect }: BookingTableProps) {
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const handleCopyVoucher = (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopiedId(code);
        toast.success(`Voucher disalin: ${code}`);
        setTimeout(() => setCopiedId(null), 2000);
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
            return `${d}/${m}/${y?.slice(-2)}`;
        } catch {
            return dateStr;
        }
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
                        const isCopied = copiedId === (booking.voucherCode || booking.reservationId);
                        const voucherCode = booking.voucherCode || booking.reservationId || booking.bookingId;

                        return (
                            <tr 
                                key={booking.id}
                                className={`${s.row} ${booking.isCancelled ? s.rowCancelled : ""}`}
                                onClick={() => onSelect(booking)}
                            >
                                {/* Channel & Voucher */}
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
                                            <div 
                                                className={s.voucherText}
                                                onClick={(e) => handleCopyVoucher(e, voucherCode)}
                                                title="Salin voucher"
                                            >
                                                <span>{voucherCode}</span>
                                                {isCopied ? (
                                                    <Check size={11} weight="bold" color="#16a34a" />
                                                ) : (
                                                    <Copy size={11} weight="bold" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Guest Name & Contact */}
                                <td className={s.td}>
                                    <div className={s.guestCell}>
                                        <span className={s.guestName} style={{ textDecoration: booking.isCancelled ? "line-through" : "none" }}>
                                            {booking.guestName}
                                        </span>
                                        <span className={s.guestSubtext}>
                                            {booking.phone || booking.nationality || `${booking.pax || 2} Tamu`}
                                        </span>
                                    </div>
                                </td>

                                {/* Room Type & Room Number */}
                                <td className={s.td}>
                                    <div style={{ fontWeight: 600, color: "#334155" }}>
                                        {booking.roomType}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                        Kamar: <strong style={{ color: "#0f172a" }}>{booking.roomNumber || "AUTO"}</strong>
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
                                    <div className={`${s.statusBadge} ${getStatusClass(booking)}`}>
                                        {booking.isCancelled ? <WarningCircle size={12} weight="bold" /> : null}
                                        <span>{getStatusLabel(booking)}</span>
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
