"use client";

import React, { useState, useMemo } from "react";
import { 
    LogIn, Calendar, XCircle, PlusCircle, Download, FileText, 
    Search, User, CreditCard, ChevronRight, BedDouble, ShieldCheck
} from "lucide-react";
import s from "./OverviewMobileView.module.css";
import { resolveBookingIdentifiers } from "@/lib/channelHelper";
import { EmptyStateExecutive } from "@/components/shared/EmptyStateExecutive";
import { useCurrency } from "@/hooks/useCurrency";

interface OverviewMobileViewProps {
    hotelName?: string;
    startDate: string;
    endDate: string;
    setStartDate: (d: string) => void;
    setEndDate: (d: string) => void;
    todayStr: string;
    tomorrowStr: string;
    last7DaysStr: string;
    monthStartStr: string;
    monthEndStr: string;
    checkInCount: number | string;
    checkOutCount: number | string;
    cancelCount: number | string;
    todayCheckIns: any[];
    todayCheckOuts: any[];
    todayCanceled: any[];
    latestBookings: any[];
    onSelectBooking: (b: any) => void;
    onAddTransaction: () => void;
    onExportExcel: () => void;
    onExportPDF: () => void;
}

export function OverviewMobileView({
    hotelName,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    todayStr,
    tomorrowStr,
    last7DaysStr,
    monthStartStr,
    monthEndStr,
    checkInCount,
    checkOutCount,
    cancelCount,
    todayCheckIns,
    todayCheckOuts,
    todayCanceled,
    latestBookings,
    onSelectBooking,
    onAddTransaction,
    onExportExcel,
    onExportPDF
}: OverviewMobileViewProps) {
    const { formatCurrency } = useCurrency();
    // Active KPI tab to show guests: "checkin" | "checkout" | "cancel" | "all"
    const [activeListTab, setActiveListTab] = useState<"checkin" | "checkout" | "cancel" | "all">("checkin");
    const [searchQuery, setSearchQuery] = useState("");

    const isTodayActive = startDate === todayStr && endDate === todayStr;
    const isTomorrowActive = startDate === tomorrowStr && endDate === tomorrowStr;
    const is7DaysActive = startDate === last7DaysStr && endDate === todayStr;
    const isMonthActive = startDate === monthStartStr && endDate === monthEndStr;

    // Filter guests based on active tab and search query
    const displayedBookings = useMemo(() => {
        let baseList: any[] = [];
        if (activeListTab === "checkin") {
            baseList = todayCheckIns;
        } else if (activeListTab === "checkout") {
            baseList = todayCheckOuts;
        } else if (activeListTab === "cancel") {
            baseList = todayCanceled;
        } else {
            baseList = latestBookings;
        }

        if (!searchQuery.trim()) return baseList;
        const q = searchQuery.toLowerCase();
        return baseList.filter((b) => {
            const guestName = (b.guestName || "").toLowerCase();
            const roomNo = String(b.roomNumber || "").toLowerCase();
            const bookingId = (b.bookingId || b.voucherCode || "").toLowerCase();
            return guestName.includes(q) || roomNo.includes(q) || bookingId.includes(q);
        });
    }, [activeListTab, todayCheckIns, todayCheckOuts, todayCanceled, latestBookings, searchQuery]);

    const getStatusClass = (status?: string) => {
        const sUpper = (status || "").toUpperCase();
        if (sUpper === "CHECKED_IN" || sUpper === "IN_HOUSE") return s.statusCheckedIn;
        if (sUpper === "CHECKED_OUT") return s.statusCheckedOut;
        if (sUpper === "CANCELLED" || sUpper === "CANCEL" || sUpper === "VOID") return s.statusCancelled;
        return s.statusConfirmed;
    };

    return (
        <div className={s.mobileRoot}>
            {/* ── 1. Top 3D Header Card ── */}
            <div className={s.headerCard}>
                <div className={s.headerTopRow}>
                    <div className={s.hotelBadgeGroup}>
                        <h2 className={s.hotelTitle}>{hotelName || "Hotel Property"}</h2>
                        <div className={s.hotelSub}>
                            <span className={s.liveDot} />
                            <span>Front Office Operations</span>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        onClick={onAddTransaction}
                        className={s.addTxBtn3D}
                    >
                        <PlusCircle size={15} />
                        <span>Walk-In</span>
                    </button>
                </div>

                {/* 3D Period Filter Pills */}
                <div className={s.periodPillsWrapper}>
                    <button
                        type="button"
                        onClick={() => {
                            setStartDate(todayStr);
                            setEndDate(todayStr);
                        }}
                        className={`${s.periodPillBtn} ${isTodayActive ? s.periodPillActive : ""}`}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStartDate(tomorrowStr);
                            setEndDate(tomorrowStr);
                        }}
                        className={`${s.periodPillBtn} ${isTomorrowActive ? s.periodPillActive : ""}`}
                    >
                        Tomorrow
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStartDate(last7DaysStr);
                            setEndDate(todayStr);
                        }}
                        className={`${s.periodPillBtn} ${is7DaysActive ? s.periodPillActive : ""}`}
                    >
                        7 Days
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStartDate(monthStartStr);
                            setEndDate(monthEndStr);
                        }}
                        className={`${s.periodPillBtn} ${isMonthActive ? s.periodPillActive : ""}`}
                    >
                        Month
                    </button>
                </div>
            </div>

            {/* ── 2. 3D KPI Operational Movement Cards ── */}
            <div className={s.kpiGrid}>
                {/* Check In Card */}
                <div 
                    onClick={() => setActiveListTab("checkin")}
                    className={`${s.kpiCard3D} ${activeListTab === "checkin" ? s.kpiSelected : ""}`}
                >
                    <div className={s.kpiIconWrap} style={{ background: "#ecfdf5", color: "#059669" }}>
                        <LogIn size={16} />
                    </div>
                    <span className={s.kpiCount}>{checkInCount}</span>
                    <span className={s.kpiLabel}>Check In</span>
                </div>

                {/* Check Out Card */}
                <div 
                    onClick={() => setActiveListTab("checkout")}
                    className={`${s.kpiCard3D} ${activeListTab === "checkout" ? s.kpiSelected : ""}`}
                >
                    <div className={s.kpiIconWrap} style={{ background: "#fffbeb", color: "#d97706" }}>
                        <Calendar size={16} />
                    </div>
                    <span className={s.kpiCount}>{checkOutCount}</span>
                    <span className={s.kpiLabel}>Check Out</span>
                </div>

                {/* Cancel Card */}
                <div 
                    onClick={() => setActiveListTab("cancel")}
                    className={`${s.kpiCard3D} ${activeListTab === "cancel" ? s.kpiSelected : ""}`}
                >
                    <div className={s.kpiIconWrap} style={{ background: "#fef2f2", color: "#dc2626" }}>
                        <XCircle size={16} />
                    </div>
                    <span className={s.kpiCount}>{cancelCount}</span>
                    <span className={s.kpiLabel}>Cancelled</span>
                </div>
            </div>

            {/* ── 3. List Header & Export Actions ── */}
            <div className={s.sectionHeader}>
                <h3 className={s.sectionTitle}>
                    <span>
                        {activeListTab === "checkin" ? "Today's Check Ins" : 
                         activeListTab === "checkout" ? "Today's Check Outs" : 
                         activeListTab === "cancel" ? "Today's Cancellations" : "Recent Bookings"}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                        ({displayedBookings.length})
                    </span>
                </h3>

                <div className={s.exportButtonGroup}>
                    <button 
                        type="button" 
                        onClick={onExportExcel} 
                        className={s.exportBtn3D}
                        title="Export Excel"
                    >
                        <Download size={13} />
                        <span>Excel</span>
                    </button>
                    <button 
                        type="button" 
                        onClick={onExportPDF} 
                        className={s.exportBtn3D}
                        title="Export PDF"
                    >
                        <FileText size={13} />
                        <span>PDF</span>
                    </button>
                </div>
            </div>

            {/* ── 4. 3D Guest / Transaction Cards List ── */}
            <div className={s.guestCardsList}>
                {displayedBookings.length === 0 ? (
                    <div className={s.emptyStateCard} style={{ padding: 0, overflow: "hidden" }}>
                        <EmptyStateExecutive
                            illustrationSrc="/images/illustrations-3d/3d-biz-04.webp"
                            illustrationAlt="Data Reservasi Belum Ditemukan"
                            title="Data Reservasi Belum Ditemukan"
                            description="Belum ada pergerakan tamu yang tercatat untuk parameter filter saat ini."
                            compact
                        />
                    </div>
                ) : (
                    displayedBookings.map((b, idx) => {
                        const { reservationId, otaReservationId, bookingId } = resolveBookingIdentifiers(b);
                        const displayId = reservationId || otaReservationId || bookingId || b.id || "Direct FO";
                        const amount = Number(b.amount || b.totalAmount || 0);
                        const guestName = b.guestName || "General Guest";
                        const roomNumber = b.roomNumber || "-";
                        const roomType = b.roomType || b.type || "Room";
                        const channel = b.channel || "Walk-In";
                        const status = b.guestStatus || b.status || "CONFIRMED";

                        return (
                            <div 
                                key={`${b.id || b.bookingId || "res"}-${b.roomNumber || ""}-${idx}`}
                                onClick={() => onSelectBooking(b)}
                                className={s.guestCard3D}
                            >
                                <div className={s.cardTopRow}>
                                    <div className={s.guestInfo}>
                                        <h4 className={s.guestName}>{guestName}</h4>
                                        <span className={s.bookingIdCode}>{displayId}</span>
                                    </div>
                                    <div className={s.roomBadge3D}>
                                        <span className={s.roomNumberText}>{roomNumber}</span>
                                        <span className={s.roomLabelText}>Room No.</span>
                                    </div>
                                </div>

                                <div className={s.cardMidRow}>
                                    <span className={s.channelTag}>{channel}</span>
                                    <span className={s.roomTypeTag}>{roomType}</span>
                                </div>

                                <div className={s.cardBottomRow}>
                                    <span className={s.priceTag}>
                                        {formatCurrency(amount)}
                                    </span>
                                    <span className={`${s.statusPill3D} ${getStatusClass(status)}`}>
                                        {status.replace("_", " ")}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
