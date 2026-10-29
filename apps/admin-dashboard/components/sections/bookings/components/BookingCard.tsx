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
import { useCurrency } from "@/hooks/useCurrency";
import { BookingRecord } from "../types";
import s from "./BookingCard.module.css";

interface BookingCardProps {
    booking: BookingRecord;
    onSelect: (booking: BookingRecord) => void;
}

export function BookingCard({ booking, onSelect }: BookingCardProps) {
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
    const { formatCurrency } = useCurrency();

    const handleCopy = (e: React.MouseEvent, text: string, key: string, label: string) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success(`${label} disalin: ${text}`);
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
            className={`${s.card} ${booking.isCancelled ? s.cardCancelled : ""} ${!booking.isCancelled && (booking.isOverbooked || booking.hasRoomConflict) ? s.cardConflict : ""}`}
            onClick={() => onSelect(booking)}
        >
            {/* Header: OTA Logo & Status */}
            <div className={s.cardHeader}>
                <div className={s.channelBadge} title={booking.channel}>
                    {booking.channelLogo ? (
                        <div className={s.otaLogo} style={{ position: "relative", width: 22, height: 22 }}>
                            <Image 
                                src={booking.channelLogo} 
                                alt={booking.channel} 
                                width={22} 
                                height={22} 
                                style={{ objectFit: "contain", borderRadius: 4 }}
                                onError={(e: any) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    ) : (
                        <span>{booking.channel}</span>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {!booking.isCancelled && (booking.isOverbooked || booking.hasRoomConflict) ? (
                        <div
                            className={s.overbookPill}
                            title={
                                booking.hasRoomConflict
                                    ? `Bentrok Nomor Kamar dengan ${booking.conflictWithGuest || "tamu lain"}`
                                    : "Kapasitas kamar fisik penuh (Overbooking) - silakan pilih kamar manual"
                            }
                        >
                            <WarningCircle size={10} weight="bold" />
                            <span>{booking.hasRoomConflict ? "Double Room" : "Overbook"}</span>
                        </div>
                    ) : null}
                    {booking.isModified ? (
                        <div className={s.revisionPill} title="Reservasi mengalami revisi / perubahan">
                            <span>Revisi</span>
                        </div>
                    ) : null}
                    <div className={`${s.statusPill} ${getStatusClass()}`}>
                        {booking.isCancelled ? <WarningCircle size={10} weight="bold" /> : null}
                        <span>{getStatusLabel()}</span>
                    </div>
                </div>
            </div>

            {/* Guest Name & Reservation IDs */}
            <div className={s.guestSection}>
                <div className={`${s.guestName} ${booking.isCancelled ? s.guestNameCancelled : ""}`}>
                    {getSafeDisplay(booking.guestName, "Tamu")}
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 4 }}>
                    {/* Primary Reservation ID (e.g. BDC-TEST) */}
                    <div 
                        className={s.voucherBar} 
                        onClick={(e) => handleCopy(e, booking.reservationId || booking.voucherCode || booking.bookingId, "res", "Reservation ID")}
                        title="Klik untuk menyalin Reservation ID"
                    >
                        <span style={{ fontSize: 9.5, opacity: 0.7, fontWeight: 700 }}>RES:</span>
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>
                            {getSafeDisplay(booking.reservationId || booking.voucherCode || booking.bookingId, "-")}
                        </span>
                        {copiedKey === "res" ? (
                            <Check size={11} weight="bold" color="#16a34a" />
                        ) : (
                            <Copy size={11} weight="bold" />
                        )}
                    </div>

                    {/* OTA Reservation ID (e.g. TEST) if different from Reservation ID */}
                    {booking.otaReservationId && booking.otaReservationId !== (booking.reservationId || booking.voucherCode) ? (
                        <div 
                            className={s.voucherBar}
                            onClick={(e) => handleCopy(e, booking.otaReservationId, "ota", "OTA Reservation ID")}
                            title="Klik untuk menyalin OTA Reservation ID"
                            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                        >
                            <span style={{ fontSize: 9.5, opacity: 0.7, fontWeight: 700 }}>OTA:</span>
                            <span>{booking.otaReservationId}</span>
                            {copiedKey === "ota" ? (
                                <Check size={11} weight="bold" color="#16a34a" />
                            ) : (
                                <Copy size={11} weight="bold" />
                            )}
                        </div>
                    ) : null}
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
                <div className={s.detailItem} title={getSafeDisplay(booking.roomType, "Standard Room")}>
                    <Bed size={13} className={s.detailIcon} />
                    <span>{getSafeDisplay(booking.roomType, "Standard Room")}</span>
                </div>

                <div className={s.detailItem}>
                    <Door size={13} className={s.detailIcon} />
                    <span className={!booking.isCancelled && (booking.isOverbooked || booking.hasRoomConflict) ? s.roomDangerText : ""}>
                        Room: {getSafeDisplay(booking.roomNumber, "AUTO")}
                    </span>
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
