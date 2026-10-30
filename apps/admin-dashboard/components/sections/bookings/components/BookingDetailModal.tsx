"use client";

import React, { useEffect, useState, useMemo } from "react";
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
    IdentificationCard,
    ArrowsLeftRight
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/context/AuthContext";
import { BookingRecord, RoomTypePhysicalConfig } from "../types";
import s from "./BookingDetailModal.module.css";

interface BookingDetailModalProps {
    booking: BookingRecord | null;
    roomTypesList?: RoomTypePhysicalConfig[];
    allBookings?: BookingRecord[];
    onClose: () => void;
    onRoomAssigned?: (updatedRoomNumber: string, updatedRoomTypeId?: string, updatedRoomTypeName?: string) => void;
}

export function BookingDetailModal({
    booking,
    roomTypesList = [],
    allBookings = [],
    onClose,
    onRoomAssigned
}: BookingDetailModalProps) {
    const router = useRouter();
    const { activeHotelCode, user } = useAuth();
    const [copied, setCopied] = useState(false);
    const { formatCurrency } = useCurrency();

    // Room Assignment / Move Room states
    const [showRoomPicker, setShowRoomPicker] = useState(false);
    const [selectedTargetRtId, setSelectedTargetRtId] = useState<string>("");
    const [selectedTargetRoomNum, setSelectedTargetRoomNum] = useState<string>("");
    const [savingRoomMove, setSavingRoomMove] = useState(false);
    const [localRoomNumber, setLocalRoomNumber] = useState<string>(booking?.roomNumber || "AUTO");
    const [localRoomType, setLocalRoomType] = useState<string>(booking?.roomType || "Standard Room");

    // Sync local room states when booking prop changes
    useEffect(() => {
        if (booking) {
            setLocalRoomNumber(booking.roomNumber || "AUTO");
            setLocalRoomType(booking.roomType || "Standard Room");
            setSelectedTargetRoomNum(booking.roomNumber && booking.roomNumber !== "OVERBOOK" ? booking.roomNumber : "");
            const matchedRt = roomTypesList.find(
                (rt) =>
                    rt.id === booking.roomTypeId ||
                    rt.name.trim().toLowerCase() === (booking.roomType || "").trim().toLowerCase()
            ) || roomTypesList[0];
            setSelectedTargetRtId(matchedRt?.id || booking.roomTypeId || "");
            setShowRoomPicker(Boolean(booking.isOverbooked || booking.hasRoomConflict));
        }
    }, [booking, roomTypesList]);

    // Compute stay dates for this booking to inspect room occupancy
    const stayDates = useMemo(() => {
        if (!booking) return [];
        if (Array.isArray(booking._datesOccurred) && booking._datesOccurred.length > 0) {
            return booking._datesOccurred;
        }
        const dates: string[] = [];
        if (booking.checkInDate) {
            const start = new Date(`${booking.checkInDate}T00:00:00Z`);
            const end = booking.checkOutDate
                ? new Date(`${booking.checkOutDate}T00:00:00Z`)
                : new Date(start.getTime() + 86400000);
            for (let d = new Date(start); d < end && dates.length < 60; d.setUTCDate(d.getUTCDate() + 1)) {
                dates.push(d.toISOString().split("T")[0]);
            }
            if (dates.length === 0) dates.push(booking.checkInDate);
        }
        return dates;
    }, [booking]);

    const currentTargetRt = useMemo(() => {
        return (
            roomTypesList.find((rt) => rt.id === selectedTargetRtId) ||
            roomTypesList.find(
                (rt) => rt.name.trim().toLowerCase() === (localRoomType || "").trim().toLowerCase()
            ) ||
            roomTypesList[0] ||
            null
        );
    }, [roomTypesList, selectedTargetRtId, localRoomType]);

    // Map each physical room number in currentTargetRt to its occupancy status across stayDates
    const physicalRoomStatuses = useMemo(() => {
        if (!booking) return [];
        const baseRooms = currentTargetRt?.physicalRooms?.length
            ? currentTargetRt.physicalRooms
            : ["101", "102", "103", "104"];

        return baseRooms.map((rNum) => {
            const rUpper = rNum.trim().toUpperCase();
            const isCurrentBookingRoom =
                rUpper === String(localRoomNumber || "").trim().toUpperCase() &&
                (!currentTargetRt ||
                    currentTargetRt.id === booking.roomTypeId ||
                    currentTargetRt.name.trim().toLowerCase() === (localRoomType || "").trim().toLowerCase());

            // Check if any OTHER active booking overlaps on stayDates with this physical room
            const conflictingBooking = allBookings.find((other) => {
                if (other.isCancelled || other.id === booking.id) return false;
                const otherRoomUpper = String(other.roomNumber || "").trim().toUpperCase();
                if (otherRoomUpper !== rUpper) return false;

                if (currentTargetRt) {
                    const otherMatchesRt =
                        other.roomTypeId === currentTargetRt.id ||
                        other.roomType.trim().toLowerCase() === currentTargetRt.name.trim().toLowerCase() ||
                        currentTargetRt.physicalRooms.some((pr) => pr.toUpperCase() === otherRoomUpper);
                    if (!otherMatchesRt) return false;
                }

                // Check date overlap
                const overlaps = stayDates.some((dStr) => {
                    if (Array.isArray(other._datesOccurred) && other._datesOccurred.includes(dStr)) {
                        return true;
                    }
                    if (other.checkInDate && other.checkOutDate) {
                        return dStr >= other.checkInDate && dStr < other.checkOutDate;
                    }
                    return other.effectiveDate === dStr;
                });

                return overlaps;
            });

            return {
                roomNumber: rNum,
                isCurrent: isCurrentBookingRoom,
                occupiedBy: conflictingBooking ? conflictingBooking.guestName : null,
                channel: conflictingBooking ? conflictingBooking.channel : null,
            };
        });
    }, [booking, currentTargetRt, localRoomNumber, localRoomType, allBookings, stayDates]);

    const handleSaveRoomAssignment = async () => {
        if (!booking) return;
        const cleanRoom = String(selectedTargetRoomNum || "").trim();
        if (!cleanRoom) {
            toast.warning("Silakan pilih atau ketik nomor kamar tujuan.");
            return;
        }
        const hotelCode = activeHotelCode || (typeof window !== "undefined" ? localStorage.getItem("active_hotel_code") || "" : "");
        if (!hotelCode) {
            toast.error("Kode hotel aktif tidak ditemukan.");
            return;
        }

        setSavingRoomMove(true);
        try {
            const res = await fetch("/api/bookings/assign-room", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    bookingId: booking.bookingId,
                    reservationId: booking.reservationId,
                    otaReservationId: booking.otaReservationId,
                    voucherCode: booking.voucherCode,
                    guestName: booking.guestName,
                    checkInDate: booking.checkInDate,
                    checkOutDate: booking.checkOutDate,
                    datesOccurred: booking._datesOccurred,
                    oldRoomNumber: localRoomNumber,
                    newRoomNumber: cleanRoom,
                    oldRoomTypeId: booking.roomTypeId,
                    newRoomTypeId: currentTargetRt?.id || booking.roomTypeId,
                    newRoomTypeName: currentTargetRt?.name || localRoomType,
                    movedBy: user?.displayName || (user as any)?.name || user?.email || "Front Desk",
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Gagal memindahkan nomor kamar.");
            }

            setLocalRoomNumber(cleanRoom);
            if (currentTargetRt?.name) {
                setLocalRoomType(currentTargetRt.name);
            }
            setShowRoomPicker(false);
            toast.success(data.message || `Nomor kamar berhasil dipindahkan ke ${cleanRoom}`);
            if (onRoomAssigned) {
                onRoomAssigned(cleanRoom, currentTargetRt?.id, currentTargetRt?.name);
            }
        } catch (err: any) {
            toast.error(err?.message || "Gagal memindahkan nomor kamar.");
        } finally {
            setSavingRoomMove(false);
        }
    };

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

    const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

    const handleCopyField = (val?: string, label?: string) => {
        if (!val) return;
        navigator.clipboard.writeText(val);
        setCopiedKey(label || val);
        toast.success(`${label || "Kode"} disalin: ${val}`);
        setTimeout(() => setCopiedKey(null), 2000);
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
                                {booking.channel} · {booking.isCancelled ? "Reservasi Dibatalkan" : (booking.isModified ? "Reservasi Diubah (Modified)" : "Reservasi Masuk")}
                            </div>
                            <div className={s.channelSubtitle}>
                                <span>Ref: {getSafeDisplay(booking.reservationId || booking.voucherCode, "-")}</span>
                                {booking.otaReservationId && booking.otaReservationId !== (booking.reservationId || booking.voucherCode) ? (
                                    <span style={{ color: "#64748b", fontSize: 11 }}>• OTA: {booking.otaReservationId}</span>
                                ) : null}
                                <button 
                                    type="button"
                                    onClick={handleCopyVoucher} 
                                    style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", color: "#2563eb", padding: 0 }}
                                    title="Salin nomor voucher / referensi"
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

                    {/* Overbooking / Room Conflict Banner */}
                    {!booking.isCancelled && (booking.isOverbooked || booking.hasRoomConflict || localRoomNumber.toUpperCase() === "OVERBOOK") && (
                        <div className={s.overbookBanner}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <WarningCircle size={20} weight="bold" style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div className={s.cancelBannerTitle}>
                                        {booking.hasRoomConflict
                                            ? `Peringatan Bentrok Kamar (${localRoomNumber})`
                                            : "Peringatan Overbooking (Kapasitas Kamar Penuh)"}
                                    </div>
                                    <div className={s.cancelBannerDesc}>
                                        {booking.hasRoomConflict
                                            ? `Nomor kamar ${localRoomNumber} juga terisi oleh tamu "${booking.conflictWithGuest || "lain"}" pada tanggal menginap yang sama. Silakan pindahkan ke nomor kamar fisik yang kosong.`
                                            : "Seluruh unit fisik pada tipe kamar ini telah terisi saat reservasi masuk. Silakan tetapkan atau pindahkan ke nomor/tipe kamar lain."}
                                    </div>
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
                                <span className={s.fieldValue}>{getSafeDisplay(booking.guestName, "Tamu")}</span>
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
                        <div className={s.sectionTitle} style={{ justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Calendar size={16} weight="bold" />
                                <span>Jadwal & Detail Kamar</span>
                            </div>
                            {!booking.isCancelled && (
                                <button
                                    type="button"
                                    className={s.roomAssignBtn}
                                    onClick={() => setShowRoomPicker((prev) => !prev)}
                                >
                                    <ArrowsLeftRight size={13} weight="bold" />
                                    <span>{showRoomPicker ? "Tutup Panel Kamar" : "Pindah Kamar"}</span>
                                </button>
                            )}
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
                                <span className={s.fieldValue}>{getSafeDisplay(localRoomType, "Standard Room")}</span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>No. Kamar Fisik</span>
                                <span
                                    className={s.fieldValue}
                                    style={{
                                        color:
                                            localRoomNumber.toUpperCase() === "OVERBOOK" || booking.hasRoomConflict
                                                ? "#b91c1c"
                                                : "#0f172a"
                                    }}
                                >
                                    {getSafeDisplay(localRoomNumber, "Belum Ditetapkan (AUTO)")}
                                </span>
                            </div>
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Paket Sarapan</span>
                                <span className={s.fieldValue}>{booking.hasBreakfast ? "Termasuk Sarapan" : "Room Only"}</span>
                            </div>
                        </div>

                        {/* Interactive Manual Room Assignment Panel */}
                        {showRoomPicker && !booking.isCancelled && (
                            <div className={s.roomAssignPanel}>
                                <div className={s.roomAssignHeader}>
                                    <span className={s.roomAssignTitle}>
                                        Pilih Nomor Kamar Fisik ({formatDateDisplay(booking.checkInDate)} - {formatDateDisplay(booking.checkOutDate)})
                                    </span>
                                    {roomTypesList.length > 1 && (
                                        <select
                                            className={s.roomTypeSelect}
                                            value={selectedTargetRtId}
                                            onChange={(e) => setSelectedTargetRtId(e.target.value)}
                                            aria-label="Pilih Tipe Kamar Tujuan"
                                        >
                                            {roomTypesList.map((rt) => (
                                                <option key={rt.id} value={rt.id}>
                                                    {rt.name} ({rt.totalRooms} Unit)
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className={s.roomPillsGrid}>
                                    {physicalRoomStatuses.map((item) => {
                                        const isSelected =
                                            String(selectedTargetRoomNum || "").trim().toUpperCase() ===
                                            item.roomNumber.trim().toUpperCase();
                                        const isOccupied = Boolean(item.occupiedBy);
                                        return (
                                            <button
                                                key={item.roomNumber}
                                                type="button"
                                                onClick={() => setSelectedTargetRoomNum(item.roomNumber)}
                                                className={[
                                                    s.roomPillBtn,
                                                    isOccupied ? s.roomPillOccupied : s.roomPillAvailable,
                                                    isSelected ? s.roomPillSelected : ""
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ")}
                                                title={
                                                    isOccupied
                                                        ? `Terisi oleh: ${item.occupiedBy} (${item.channel})`
                                                        : `Kamar ${item.roomNumber} Kosong & Tersedia`
                                                }
                                            >
                                                <span className={s.roomPillNum}>
                                                    Kamar {item.roomNumber}
                                                </span>
                                                <span
                                                    className={[
                                                        s.roomPillSub,
                                                        isOccupied ? s.subOccupied : s.subAvailable
                                                    ].join(" ")}
                                                >
                                                    {item.isCurrent
                                                        ? "Kamar Saat Ini"
                                                        : isOccupied
                                                        ? `Terisi: ${item.occupiedBy}`
                                                        : "Tersedia (Kosong)"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className={s.roomAssignFooter}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                                            Atau Ketik No. Kamar:
                                        </span>
                                        <input
                                            type="text"
                                            className={s.customRoomInput}
                                            value={selectedTargetRoomNum}
                                            onChange={(e) => setSelectedTargetRoomNum(e.target.value)}
                                            placeholder="Contoh: 101"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className={s.saveRoomBtn}
                                        disabled={savingRoomMove || !selectedTargetRoomNum.trim()}
                                        onClick={handleSaveRoomAssignment}
                                    >
                                        <Bed size={14} weight="bold" />
                                        <span>{savingRoomMove ? "Menyimpan..." : "Simpan Pindah Kamar"}</span>
                                    </button>
                                </div>
                            </div>
                        )}
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
                            {/* Reservation ID (e.g. BDC-TEST) */}
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Reservation ID</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                    <span className={s.fieldValue} style={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all", fontWeight: 700, color: "#1e293b" }}>
                                        {booking.reservationId || booking.voucherCode || "-"}
                                    </span>
                                    {(booking.reservationId || booking.voucherCode) && (
                                        <button 
                                            type="button"
                                            onClick={() => handleCopyField(booking.reservationId || booking.voucherCode, "Reservation ID")}
                                            style={{ 
                                                background: "none", 
                                                border: "none", 
                                                cursor: "pointer", 
                                                display: "inline-flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                color: "#2563eb", 
                                                padding: 2,
                                                borderRadius: 4,
                                                flexShrink: 0
                                            }}
                                            title="Salin Reservation ID"
                                        >
                                            {copiedKey === "Reservation ID" ? <Check size={14} weight="bold" color="#16a34a" /> : <Copy size={14} weight="bold" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Booking ID (Channex Booking UUID) */}
                            <div className={s.field}>
                                <span className={s.fieldLabel}>Booking ID</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                    <span className={s.fieldValue} style={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>
                                        {booking.bookingId}
                                    </span>
                                    {booking.bookingId && (
                                        <button 
                                            type="button"
                                            onClick={() => handleCopyField(booking.bookingId, "Booking ID")}
                                            style={{ 
                                                background: "none", 
                                                border: "none", 
                                                cursor: "pointer", 
                                                display: "inline-flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                color: "#2563eb", 
                                                padding: 2,
                                                borderRadius: 4,
                                                flexShrink: 0
                                            }}
                                            title="Salin Booking ID"
                                        >
                                            {copiedKey === "Booking ID" ? <Check size={14} weight="bold" color="#16a34a" /> : <Copy size={14} weight="bold" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* New Revision ID (Creation revision, always preserved) */}
                            {(booking.initialRevisionId || booking.revisionId) && (
                                <div className={s.field}>
                                    <span className={s.fieldLabel}>New Revision ID</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                        <span className={s.fieldValue} style={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>
                                            {booking.initialRevisionId || booking.revisionId}
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => handleCopyField(booking.initialRevisionId || booking.revisionId, "New Revision ID")}
                                            style={{ 
                                                background: "none", 
                                                border: "none", 
                                                cursor: "pointer", 
                                                display: "inline-flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                color: "#2563eb", 
                                                padding: 2,
                                                borderRadius: 4,
                                                flexShrink: 0
                                            }}
                                            title="Salin New Revision ID"
                                        >
                                            {copiedKey === "New Revision ID" ? <Check size={14} weight="bold" color="#16a34a" /> : <Copy size={14} weight="bold" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* OTA Reservation ID (e.g. TEST) */}
                            <div className={s.field}>
                                <span className={s.fieldLabel}>OTA Reservation ID</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                    <span className={s.fieldValue} style={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>
                                        {booking.otaReservationId || booking.voucherCode || "-"}
                                    </span>
                                    {(booking.otaReservationId || booking.voucherCode) && (
                                        <button 
                                            type="button"
                                            onClick={() => handleCopyField(booking.otaReservationId || booking.voucherCode, "OTA Reservation ID")}
                                            style={{ 
                                                background: "none", 
                                                border: "none", 
                                                cursor: "pointer", 
                                                display: "inline-flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                color: "#2563eb", 
                                                padding: 2,
                                                borderRadius: 4,
                                                flexShrink: 0
                                            }}
                                            title="Salin OTA Reservation ID"
                                        >
                                            {copiedKey === "OTA Reservation ID" ? <Check size={14} weight="bold" color="#16a34a" /> : <Copy size={14} weight="bold" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Modified Revision ID (Shown whenever modified) */}
                            {(booking.isModified || booking.modifiedRevisionId) && (
                                <div className={s.field}>
                                    <span className={s.fieldLabel} style={{ color: "#4f46e5", fontWeight: 700 }}>Modified Revision ID</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                        <span className={s.fieldValue} style={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all", color: "#4f46e5", fontWeight: 600 }}>
                                            {booking.modifiedRevisionId || booking.revisionId}
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => handleCopyField(booking.modifiedRevisionId || booking.revisionId, "Modified Revision ID")}
                                            style={{ 
                                                background: "none", 
                                                border: "none", 
                                                cursor: "pointer", 
                                                display: "inline-flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                color: "#4f46e5", 
                                                padding: 2,
                                                borderRadius: 4,
                                                flexShrink: 0
                                            }}
                                            title="Salin Modified Revision ID"
                                        >
                                            {copiedKey === "Modified Revision ID" ? <Check size={14} weight="bold" color="#16a34a" /> : <Copy size={14} weight="bold" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Cancelled Revision ID (Shown whenever cancelled) */}
                            {(booking.isCancelled || booking.cancelledRevisionId) && (
                                <div className={s.field}>
                                    <span className={s.fieldLabel} style={{ color: "#dc2626", fontWeight: 700 }}>Cancelled Revision ID</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                        <span className={s.fieldValue} style={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all", color: "#dc2626", fontWeight: 600 }}>
                                            {booking.cancelledRevisionId || booking.revisionId}
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => handleCopyField(booking.cancelledRevisionId || booking.revisionId, "Cancelled Revision ID")}
                                            style={{ 
                                                background: "none", 
                                                border: "none", 
                                                cursor: "pointer", 
                                                display: "inline-flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                color: "#dc2626", 
                                                padding: 2,
                                                borderRadius: 4,
                                                flexShrink: 0
                                            }}
                                            title="Salin Cancelled Revision ID"
                                        >
                                            {copiedKey === "Cancelled Revision ID" ? <Check size={14} weight="bold" color="#16a34a" /> : <Copy size={14} weight="bold" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className={s.field}>
                                <span className={s.fieldLabel}>Koneksi Saluran</span>
                                <span className={s.fieldValue}>{booking.connectionChannel || (booking.isOTA ? "Open Channel" : "Direct Front Office")}</span>
                            </div>
                        </div>
                        {booking.note && (
                            <div className={s.field} style={{ marginTop: 10 }}>
                                <span className={s.fieldLabel}>Catatan Khusus</span>
                                <span className={s.fieldValue} style={{ fontWeight: 500, color: "#475569" }}>
                                    {getSafeDisplay(booking.note, "")}
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
