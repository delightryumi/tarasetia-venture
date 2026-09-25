"use client";

import React, { useState, useMemo } from "react";
import { 
    Search, 
    SlidersHorizontal,
    ArrowUpDown,
    RefreshCw,
    Download,
    AlertTriangle,
    Copy,
    Check,
    RotateCcw
} from "lucide-react";
import { resolveBookingIdentifiers, resolveChannelName, getChannelLogo } from "@/lib/channelHelper";
import styles from "./AuditLedger.module.css";
import { toast } from "sonner";

interface AuditLedgerProps {
    bookings: any[];
    title?: string;
    activeFilter?: string | null;
    onClearFilter?: () => void;
    onRefresh?: () => void;
    onView: (booking: any) => void;
    onExportExcel: () => void;
    activeHotelName?: string;
}

// Helper to determine if a booking is Pay at Hotel vs Transfer / OTA Settlement
const isTransferPayment = (b: any) => {
    const pm = (b.paymentMethod || "").toLowerCase();
    const ps = (b.paymentStatus || "").toLowerCase();
    const ch = (b.channel || "").toLowerCase();
    const payTransfer = Number(b.payTransfer || b.payNexura || b.paidTransfer || b.paidAmount2 || 0);
    const payHotel = Number(b.payHotel || b.paidCash || b.paidAmount1 || 0);

    if (payTransfer > 0 && payHotel === 0) return true;
    if (payHotel > 0 && payTransfer === 0) return false;
    
    if (
        pm.includes("transfer") || 
        ps.includes("transfer") || 
        ps.includes("nexura") || 
        pm.includes("card") || 
        pm.includes("qris") || 
        pm.includes("travel_agent") || 
        ps.includes("bank") ||
        ps.includes("virtual account")
    ) {
        return true;
    }
    if (
        pm.includes("hotel") || 
        ps.includes("hotel") || 
        pm.includes("cash") || 
        ps.includes("cash")
    ) {
        return false;
    }
    if (ch && !["direct", "walk-in", "internal", "-"].includes(ch)) {
        return true;
    }
    return false;
};

// Format date to standard: "Sep 18, 2026"
const formatDateStr = (dateStr?: string) => {
    if (!dateStr || dateStr === "---") return "---";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    } catch {
        return dateStr;
    }
};

export function AuditLedger({ 
    bookings = [], 
    title,
    activeFilter,
    onClearFilter,
    onRefresh,
    onView, 
    onExportExcel,
    activeHotelName
}: AuditLedgerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Advanced Filter state
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [channelFilter, setChannelFilter] = useState("ALL");
    const [paymentFilter, setPaymentFilter] = useState("ALL");

    // Extract unique channel list from current bookings
    const uniqueChannels = useMemo(() => {
        const set = new Set<string>();
        bookings.forEach((b) => {
            const ch = resolveChannelName(b);
            if (ch) set.add(ch);
        });
        return Array.from(set).sort();
    }, [bookings]);

    const activeAdvancedCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== "ALL") count += 1;
        if (channelFilter !== "ALL") count += 1;
        if (paymentFilter !== "ALL") count += 1;
        return count;
    }, [statusFilter, channelFilter, paymentFilter]);

    const resetAdvancedFilters = () => {
        setStatusFilter("ALL");
        setChannelFilter("ALL");
        setPaymentFilter("ALL");
        setSearchQuery("");
    };

    const handleCopy = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        toast.success(`Copied: ${text}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Filter and sort bookings
    const filteredBookings = useMemo(() => {
        let result = [...bookings];

        // 1. Text Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b => {
                const ids = resolveBookingIdentifiers(b);
                return (
                    (b.guestName && b.guestName.toLowerCase().includes(q)) ||
                    (ids.reservationId && ids.reservationId.toLowerCase().includes(q)) ||
                    (ids.otaReservationId && ids.otaReservationId.toLowerCase().includes(q)) ||
                    (ids.bookingId && ids.bookingId.toLowerCase().includes(q)) ||
                    (ids.channelName && ids.channelName.toLowerCase().includes(q)) ||
                    (b.roomType && b.roomType.toLowerCase().includes(q))
                );
            });
        }

        // 2. Status Filter
        if (statusFilter !== "ALL") {
            result = result.filter(b => {
                const st = String(b.status || "").toUpperCase();
                const pst = String(b.paymentStatus || "").toUpperCase();
                const gst = String(b.guestStatus || "").toLowerCase();
                const isCancelled = st === "CANCELLED" || st === "CANCEL" || pst === "CANCELLED" || pst === "CANCEL" || gst === "cancelled" || gst === "cancel";
                const isUnmapped = b.channexRaw?.unmapped || b.status === "UNMAPPED" || String(b.note || "").toLowerCase().includes("unmapped");

                if (statusFilter === "CONFIRMED") return !isCancelled && !isUnmapped;
                if (statusFilter === "CANCELLED") return isCancelled;
                if (statusFilter === "UNMAPPED") return isUnmapped;
                return true;
            });
        }

        // 3. Channel Filter
        if (channelFilter !== "ALL") {
            result = result.filter(b => {
                const ch = resolveChannelName(b);
                return ch === channelFilter;
            });
        }

        // 4. Payment Type Filter
        if (paymentFilter !== "ALL") {
            result = result.filter(b => {
                const isTransfer = isTransferPayment(b);
                if (paymentFilter === "PAY_AT_HOTEL") return !isTransfer;
                if (paymentFilter === "SETTLEMENT_OTA") return isTransfer;
                return true;
            });
        }

        // 5. Sorting
        result.sort((a, b) => {
            const timeA = new Date(a.checkInDate || a.timestamp || 0).getTime();
            const timeB = new Date(b.checkInDate || b.timestamp || 0).getTime();
            return sortAsc ? timeA - timeB : timeB - timeA;
        });
        return result;
    }, [bookings, searchQuery, statusFilter, channelFilter, paymentFilter, sortAsc]);

    return (
        <section className={styles.card}>
            {/* Top Toolbar */}
            <div className={styles.toolbar}>
                {/* Left Side: Title & Search */}
                <div className={styles.toolbarLeft}>
                    {title && (
                        <div className={styles.toolbarTitle}>
                            <h4 className={styles.toolbarTitleText}>{title}</h4>
                            <span className={styles.recordBadge}>{filteredBookings.length} Records</span>
                        </div>
                    )}
                    <div className={styles.searchWrapper}>
                        <Search size={14} className={styles.searchIcon} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Confirmation No., Guest, Channel..."
                            className={styles.searchInput}
                        />
                    </div>
                    {activeFilter && (
                        <button
                            type="button"
                            onClick={onClearFilter}
                            className={styles.filterBadge}
                            title="Click to clear filter"
                        >
                            <span>Filter: {activeFilter}</span>
                            <span className={styles.filterClear}>✕</span>
                        </button>
                    )}
                </div>

                {/* Right Side Action Buttons */}
                <div className={styles.toolbarRight}>
                    <button 
                        type="button"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={`${styles.toolbarBtn} ${activeAdvancedCount > 0 || isAdvancedOpen ? styles.toolbarBtnActive : ""}`}
                        title="Toggle advanced filter panel"
                    >
                        <SlidersHorizontal size={13} />
                        <span>Advanced Filter {activeAdvancedCount > 0 ? `(${activeAdvancedCount})` : ""}</span>
                    </button>

                    <button 
                        type="button"
                        onClick={() => {
                            if (onRefresh) {
                                onRefresh();
                                toast.success("Ledger transactions refreshed");
                            } else {
                                window.location.reload();
                            }
                        }}
                        className={styles.toolbarBtn}
                    >
                        <RefreshCw size={13} />
                        <span>Refresh</span>
                    </button>

                    <button 
                        type="button"
                        onClick={onExportExcel}
                        className={styles.toolbarBtn}
                    >
                        <Download size={13} />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Functional Advanced Filter Panel */}
            {isAdvancedOpen && (
                <div className={styles.advancedPanel}>
                    {/* Status Filter */}
                    <div className={styles.filterField}>
                        <label className={styles.filterFieldLabel}>Reservation Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="ALL">All Status</option>
                            <option value="CONFIRMED">Confirmed Only</option>
                            <option value="CANCELLED">Cancelled Only</option>
                            <option value="UNMAPPED">Unmapped / New Only</option>
                        </select>
                    </div>

                    {/* Channel Filter */}
                    <div className={styles.filterField}>
                        <label className={styles.filterFieldLabel}>Channel / OTA Source</label>
                        <select
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="ALL">All Channels</option>
                            {uniqueChannels.map((ch) => (
                                <option key={ch} value={ch}>
                                    {ch}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Payment Classification Filter */}
                    <div className={styles.filterField}>
                        <label className={styles.filterFieldLabel}>Payment Settlement</label>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="ALL">All Payment Types</option>
                            <option value="PAY_AT_HOTEL">Pay at Hotel (Cash / Direct)</option>
                            <option value="SETTLEMENT_OTA">Transfer &amp; OTA (Non-Cash)</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    <div className={styles.filterActions}>
                        {(activeAdvancedCount > 0 || searchQuery) && (
                            <button
                                type="button"
                                onClick={resetAdvancedFilters}
                                className={styles.resetBtn}
                            >
                                <RotateCcw size={12} style={{ marginRight: "4px" }} />
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className={styles.tableContainer}>
                <table className={styles.tableElement}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={`${styles.tableHeadCell} ${styles.colStatus}`}>Status</th>
                            <th 
                                onClick={() => setSortAsc(prev => !prev)}
                                className={`${styles.tableHeadCell} ${styles.colResId} ${styles.thSortable}`}
                            >
                                <div className={styles.thSortInner}>
                                    <span>Reservation ID</span>
                                    <ArrowUpDown size={11} style={{ opacity: 0.6 }} />
                                </div>
                            </th>
                            <th className={`${styles.tableHeadCell} ${styles.colChannel}`}>Channel / OTA</th>
                            <th className={`${styles.tableHeadCell} ${styles.colProperty}`}>Property</th>
                            <th className={`${styles.tableHeadCell} ${styles.colGuest}`}>Guest Name</th>
                            <th className={`${styles.tableHeadCell} ${styles.colDates}`}>Dates</th>
                            <th className={`${styles.tableHeadCell} ${styles.colRooms}`}>Rooms</th>
                            <th className={`${styles.tableHeadCell} ${styles.colTotal}`}>Total (IDR)</th>
                            <th className={`${styles.tableHeadCell} ${styles.colAction}`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan={9} className={styles.emptyState}>
                                    No transaction records found matching the active filter criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map((booking, idx) => {
                                const ids = resolveBookingIdentifiers(booking);
                                const st = String(booking.status || "").toUpperCase();
                                const pst = String(booking.paymentStatus || "").toUpperCase();
                                const gst = String(booking.guestStatus || "").toLowerCase();
                                const isCancelled = st === "CANCELLED" || st === "CANCEL" || pst === "CANCELLED" || pst === "CANCEL" || gst === "cancelled" || gst === "cancel";
                                const isUnmapped = booking.channexRaw?.unmapped || booking.status === "UNMAPPED" || String(booking.note || "").toLowerCase().includes("unmapped");

                                const isOther = booking.type === "other_income";
                                const checkInFormatted = isOther 
                                    ? (booking.date ? formatDateStr(booking.date) : (booking.timestamp ? formatDateStr(new Date(booking.timestamp).toISOString().split("T")[0]) : "---"))
                                    : formatDateStr(booking.checkInDate || booking.checkIn);
                                const checkOutFormatted = isOther ? "" : formatDateStr(booking.checkOutDate || booking.checkOut);
                                const dateDisplay = isOther || !checkOutFormatted || checkOutFormatted === "---"
                                    ? checkInFormatted
                                    : `${checkInFormatted} -> ${checkOutFormatted}`;

                                const displayResId = ids.reservationId !== "N/A" ? ids.reservationId : (booking.bookingId || `MTR-${idx}`);
                                const totalAmt = Number(booking.totalAmount || booking.amount || 0);

                                return (
                                    <tr 
                                        key={idx}
                                        className={`${styles.tableRow} ${isCancelled ? styles.tableRowCancelled : ""}`}
                                    >
                                        {/* Status */}
                                        <td className={`${styles.tableCell} ${styles.colStatus}`}>
                                            {isCancelled ? (
                                                <span className={styles.badgeCancelled}>
                                                    Cancelled
                                                </span>
                                            ) : isUnmapped ? (
                                                <span className={styles.badgeNew}>
                                                    <AlertTriangle size={11} />
                                                    New
                                                </span>
                                            ) : (
                                                <span className={styles.badgeConfirmed}>
                                                    Confirmed
                                                </span>
                                            )}
                                        </td>

                                        {/* Reservation ID with Copy */}
                                        <td className={`${styles.tableCell} ${styles.colResId}`}>
                                            <div className={styles.resIdWrap}>
                                                <span className={styles.resIdText}>
                                                    {displayResId}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleCopy(e, displayResId)}
                                                    title="Copy Reservation ID"
                                                    className={styles.copyBtn}
                                                >
                                                    {copiedId === displayResId ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                        </td>

                                        {/* Channel / OTA */}
                                        <td className={`${styles.tableCell} ${styles.colChannel}`}>
                                            <div className={styles.channelWrap}>
                                                <div className={styles.channelLogoBox}>
                                                    <img 
                                                        src={ids.channelLogo} 
                                                        alt={ids.channelName} 
                                                        className={styles.channelLogoImg}
                                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                    />
                                                </div>
                                                <span className={styles.channelNameText}>
                                                    {ids.channelName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Property */}
                                        <td className={`${styles.tableCell} ${styles.colProperty}`}>
                                            <span className={styles.propertyNameText} title={booking.propertyName || activeHotelName || "-"}>
                                                {booking.propertyName || activeHotelName || "-"}
                                            </span>
                                        </td>

                                        {/* Guest Name */}
                                        <td className={`${styles.tableCell} ${styles.colGuest}`}>
                                            <p 
                                                className={styles.guestNameText} 
                                                title={booking.guestName || booking.incomeCategory || (isOther ? "Other Non-Room Income" : "Direct Guest Folio")}
                                                style={{
                                                    textDecoration: isCancelled ? "line-through" : "none",
                                                    color: isCancelled ? "#94a3b8" : "#0f172a"
                                                }}
                                            >
                                                {booking.guestName || booking.incomeCategory || (isOther ? "Other Non-Room Income" : "Direct Guest Folio")}
                                            </p>
                                        </td>

                                        {/* Dates */}
                                        <td className={`${styles.tableCell} ${styles.colDates}`}>
                                            <span className={styles.datesText}>
                                                {dateDisplay}
                                            </span>
                                        </td>

                                        {/* Rooms Count */}
                                        <td className={`${styles.tableCell} ${styles.colRooms}`}>
                                            <span className={styles.roomsText}>
                                                {isOther ? "-" : (booking.roomCount || 1)}
                                            </span>
                                        </td>

                                        {/* Total */}
                                        <td className={`${styles.tableCell} ${styles.colTotal}`}>
                                            <span 
                                                className={styles.totalAmountText}
                                                style={{
                                                    textDecoration: isCancelled ? "line-through" : "none",
                                                    color: isCancelled ? "#94a3b8" : "#0f172a"
                                                }}
                                            >
                                                Rp {totalAmt.toLocaleString("id-ID")}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className={`${styles.tableCell} ${styles.colAction}`}>
                                            <button 
                                                type="button"
                                                onClick={() => onView(booking)}
                                                className={styles.actionBtn}
                                            >
                                                View Folio
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
