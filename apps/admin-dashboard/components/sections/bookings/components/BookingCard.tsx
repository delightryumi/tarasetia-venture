"use client";

import React from "react";
import Image from "next/image";
import { 
    Bed, 
    Door, 
    Users, 
    Coffee, 
    Copy, 
    Check, 
    WarningCircle,
    Eye
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { BookingRecord } from "../types";
import s from "./BookingCard.module.css";

interface BookingCardProps {
    booking: BookingRecord;
    onSelect: (booking: BookingRecord) => void;
}

export function BookingCard({ booking, onSelect }: BookingCardProps) {
    const [copied, setCopied] = React.useState(false);

    const handleCopyVoucher = (e: React.MouseEvent) => {
        e.stopPropagation();
        const codeToCopy = booking.voucherCode || booking.reservationId || booking.bookingId;
        if (!codeToCopy) return;
        navigator.clipboard.writeText(codeToCopy);
        setCopied(true);
        toast.success(`Voucher disalin: ${codeToCopy}`);
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
            return `${d}/${m}/${y?.slice(-2)}`;
        } catch {
            return dateStr;
        }
    };

    const getStatusClass = () => {
        if (booking.isCancelled) return s.statusCancelled;
        if (booking.status === "CHECKED_IN" || booking.guestStatus === "in_house") return s.statusCheckedIn;
        if (booking.status === "CHECKED_OUT" || booking.guestStatus === "checked_out") return s.statusCheckedOut;
        return s.statusConfirmed;
    };

    const getStatusLabel = () => {
        if (booking.isCancelled) return "Cancelled";
        if (booking.status === "CHECKED_IN" || booking.guestStatus === "in_house") return "In-House";
        if (booking.status === "CHECKED_OUT" || booking.guestStatus === "checked_out") return "Checked-Out";
        return "Confirmed";
    };

    return (
        <div 
            className={`${s.card} ${booking.isCancelled ? s.cardCancelled : ""}`}
            onClick={() => onSelect(booking)}
        >
            {/* Header: OTA Logo & Status */}
            <div className={s.cardHeader}>
                <div className={s.channelBadge} title={booking.channel}>
                    {booking.channelLogo ? (
                        <div className={s.otaLogo} style={{ position: "relative", width: 18, height: 18 }}>
                            <Image 
                                src={booking.channelLogo} 
                                alt={booking.channel} 
                                width={18} 
                                height={18} 
                                style={{ objectFit: "contain", borderRadius: 3 }}
                                onError={(e: any) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    ) : null}
                    <span>{booking.channel}</span>
                </div>

                <div className={`${s.statusPill} ${getStatusClass()}`}>
                    {booking.isCancelled ? <WarningCircle size={10} weight="bold" /> : null}
                    <span>{getStatusLabel()}</span>
                </div>
            </div>

            {/* Guest Name & Voucher */}
            <div className={s.guestSection}>
                <div className={`${s.guestName} ${booking.isCancelled ? s.guestNameCancelled : ""}`}>
                    {booking.guestName}
                </div>
                
                <div 
                    className={s.voucherBar} 
                    onClick={handleCopyVoucher}
                    title="Klik untuk menyalin nomor voucher"
                >
                    <span>{booking.voucherCode || booking.reservationId}</span>
                    {copied ? (
                        <Check size={11} weight="bold" color="#16a34a" />
                    ) : (
                        <Copy size={11} weight="bold" />
                    )}
                </div>
            </div>

            {/* Stay Timeline (Check In -> Check Out) */}
            <div className={s.stayTimeline}>
                <div className={s.dateBlock}>
                    <span className={s.dateLabel}>Check-in</span>
                    <span className={s.dateVal}>{formatDateDisplay(booking.checkInDate)}</span>
                </div>

                <div className={s.nightsBadge}>
                    {booking.nights} {booking.nights === 1 ? "Mlm" : "Mlm"}
                </div>

                <div className={s.dateBlock} style={{ textAlign: "right" }}>
                    <span className={s.dateLabel}>Check-out</span>
                    <span className={s.dateVal}>{formatDateDisplay(booking.checkOutDate)}</span>
                </div>
            </div>

            {/* Room & Service Details */}
            <div className={s.detailsList}>
                <div className={s.detailItem} title={booking.roomType}>
                    <Bed size={13} className={s.detailIcon} />
                    <span>{booking.roomType}</span>
                </div>

                <div className={s.detailItem}>
                    <Door size={13} className={s.detailIcon} />
                    <span>Room: {booking.roomNumber || "AUTO"}</span>
                </div>

                <div className={s.detailItem}>
                    <Users size={13} className={s.detailIcon} />
                    <span>{booking.pax || 2} Tamu</span>
                </div>

                <div className={s.detailItem}>
                    <Coffee size={13} className={s.detailIcon} />
                    <span>{booking.hasBreakfast ? "Inc Bfast" : "Room Only"}</span>
                </div>
            </div>

            {/* Footer: Price & Action */}
            <div className={s.cardFooter}>
                <div className={s.amountBlock}>
                    <span className={s.amountLabel}>Total Tagihan</span>
                    <span className={`${s.amountVal} ${booking.isCancelled ? s.amountValCancelled : ""}`}>
                        {formatCurrency(booking.totalAmount || booking.grossAmount || booking.amount)}
                    </span>
                </div>

                <button 
                    type="button"
                    className={s.viewBtn} 
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(booking);
                    }}
                >
                    <Eye size={13} weight="bold" />
                    <span>Detail</span>
                </button>
            </div>
        </div>
    );
}
