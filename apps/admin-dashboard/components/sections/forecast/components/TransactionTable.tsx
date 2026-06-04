"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, Search, Coffee, ChevronDown, Eye, Pencil, Trash2, CalendarX } from "lucide-react";
import { RoomStatusPicker } from "./RoomStatusPicker";
import { GuestStatusPicker } from "./GuestStatusPicker";
import styles from "../ForecastStyles.module.css";

const SAGE = "#788069";

const rise = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface TransactionTableProps {
    stats: any;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeFilter: string | null;
    setActiveFilter: (filter: string | null) => void;
    handleStatusUpdate: (booking: any, field: string, value: string) => void;
    setSelectedGuest: (guest: any) => void;
    handleEdit: (booking: any) => void;
    handleDeleteClick: (booking: any) => void;
    handleCancelClick?: (booking: any) => void;
    formatCurrency: (val: number) => string;
}

export function TransactionTable({
    stats,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    handleStatusUpdate,
    setSelectedGuest,
    handleEdit,
    handleDeleteClick,
    handleCancelClick,
    formatCurrency
}: TransactionTableProps) {
    const filteredEntries = stats.entries.filter((e: any) => 
        (!activeFilter || e.type === activeFilter) && 
        ((e.guestName || e.incomeCategory || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
         (e.bookingId || "").toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <motion.section
            key="daily-table"
            variants={rise}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
            <div className={styles.card} style={{ overflow: "hidden", padding: 0 }}>
                <div className={styles.cardHeader} style={{ padding: "24px 24px 16px 24px", borderBottom: "1px solid var(--f-hairline)", marginBottom: 0 }}>
                    <div className={styles.cardHeaderLeft}>
                        <div className={styles.headerBadge} style={{ backgroundColor: "#ffd8a6", color: "#788069" }}>
                            <Activity size={15} />
                        </div>
                        <div className={styles.headerMeta}>
                            <span className={styles.headerSubtitle}>Nexura Analytics</span>
                            <h2 className={styles.headerTitle} style={{ fontSize: "13px" }}>
                                Detail <span style={{ color: "#788069" }}>Transaksi</span>
                            </h2>
                            {activeFilter && (
                                <button 
                                    onClick={() => setActiveFilter(null)}
                                    className={styles.guestSubtext}
                                    style={{ color: SAGE, cursor: "pointer", border: "none", background: "transparent", padding: 0, textDecoration: "underline", textAlign: "left", fontWeight: "bold" }}
                                >
                                    Showing {activeFilter === 'other_income' ? 'Other Revenue' : activeFilter} — Clear Filter
                                </button>
                            )}
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className={styles.tableContainer}>
                    <table className={styles.tableElement}>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th className={styles.tableHeadCell}>Detail Tamu</th>
                                <th className={styles.tableHeadCell}>Channel</th>
                                <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Room & Notes</th>
                                <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Tagihan / Info</th>
                                <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Status</th>
                                <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Sumber</th>
                                <th className={styles.tableHeadCell} style={{ textAlign: "center" }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className={styles.tableRow}>
                                        <td colSpan={7} className={styles.tableCell} style={{ padding: "24px" }}>
                                            <div style={{ height: "40px", width: "100%", backgroundColor: "var(--f-surface-soft)", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className={styles.tableCell} style={{ padding: "80px 0", textAlign: "center" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--f-surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--f-light-muted)" }}>
                                                <Search size={24} />
                                            </div>
                                            <span className={styles.headerSubtitle} style={{ color: "var(--f-light-muted)" }}>
                                                {activeFilter ? `No ${activeFilter.replace('_', ' ')} found` : "No transactions found for this period"}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry: any, i: number) => {
                                    const isCancelled = entry.status === "CANCELLED" || entry.status === "CANCEL";
                                    return (
                                        <tr 
                                            key={i} 
                                            className={`${styles.tableRow} ${isCancelled ? styles.cancelledRow : ""}`}
                                            style={i % 2 === 0 ? { backgroundColor: "#ffffff" } : { backgroundColor: "#fffbf9" }}
                                        >
                                            {/* Detail Tamu */}
                                            <td className={styles.tableCell}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                                    <div 
                                                        style={{ 
                                                            width: "40px", 
                                                            height: "40px", 
                                                            borderRadius: "50%", 
                                                            overflow: "hidden", 
                                                            border: "1px solid var(--f-hairline)", 
                                                            display: "flex", 
                                                            alignItems: "center", 
                                                            justifyContent: "center", 
                                                            padding: 0,
                                                            flexShrink: 0,
                                                            backgroundColor: ['#ffd8a630', '#78806930', '#f3e8ff', '#e0e7ff', '#dcfce7', '#fee2e2', '#fef3c7'][((((entry.guestName || entry.incomeCategory || "O").charCodeAt(0) || 0) + (entry.amount || 0)) % 7)] 
                                                        }}
                                                    >
                                                        <img 
                                                            src={`/avatar/memo_${((((entry.guestName || entry.incomeCategory || "O").charCodeAt(0) || 0) + (entry.amount || 0)) % 35) + 1}.png`} 
                                                            alt={entry.guestName || "Guest"} 
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                        <p className={styles.guestName} style={{ margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "150px" }}>
                                                            {entry.guestName || entry.incomeCategory}
                                                        </p>
                                                        <p className={styles.guestSubtext} style={{ fontSize: "8px", color: "var(--f-light-muted)", margin: 0, fontFamily: "var(--f-font-mono)" }}>
                                                            {entry.checkInDate ? `${entry.checkInDate} — ${entry.checkOutDate || entry.checkInDate}` : (entry.bookingId || (entry.type === 'other_income' ? `By: ${entry.staffName}` : "—"))}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Channel */}
                                            <td className={styles.tableCell}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "#ffffff", border: "1px solid var(--f-hairline)", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        {entry.type === 'other_income' ? (
                                                            <Coffee size={14} style={{ color: "var(--f-light-muted)" }} />
                                                        ) : (
                                                            <img 
                                                                src={
                                                                    (() => {
                                                                        const c = entry.channel || "";
                                                                        const lower = c.toLowerCase();
                                                                        if (lower.includes("traveloka")) return "/channels/traveloka.png";
                                                                        if (lower.includes("booking.com")) return "/channels/booking_com.png";
                                                                        if (lower.includes("tiket")) return "/channels/tiket_com.png";
                                                                        if (lower.includes("agoda")) return "/channels/agoda.png";
                                                                        if (lower.includes("airbnb")) return "/channels/airbnb.png";
                                                                        if (lower.includes("trip")) return "/channels/trip.png";
                                                                        if (lower.includes("expedia")) return "/channels/expedia.png";
                                                                        if (lower.includes("mg")) return "/channels/mg.png";
                                                                        if (lower.includes("walk")) return "/channels/walk_in.png";
                                                                        return "/channels/nexura.png";
                                                                    })()
                                                                } 
                                                                style={{ width: "20px", height: "20px", objectFit: "contain", opacity: 0.6 }}
                                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                            />
                                                        )}
                                                    </div>
                                                    <span className={styles.guestSubtext} style={{ margin: 0, fontWeight: 700, color: "var(--f-light-muted)" }}>{entry.channel || "Internal"}</span>
                                                </div>
                                            </td>
                                            {/* Room & Notes */}
                                            <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                                                    <div style={{ display: "flex" }}>
                                                        <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: "var(--f-surface-soft)", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--f-hairline)" }}>
                                                            {entry.roomType || (entry.type === 'other_income' ? 'OTHER INCOME' : '—')}
                                                        </span>
                                                    </div>
                                                    {entry.roomNumber && (
                                                        <span className={styles.guestSubtext} style={{ color: "var(--f-sage)", fontWeight: 700, fontSize: "9px" }}>
                                                            Room {entry.roomNumber}
                                                        </span>
                                                    )}
                                                    {entry.type !== 'other_income' && (
                                                        <RoomStatusPicker 
                                                            current={entry.roomStatus || 'dirty'} 
                                                            onChange={(val) => handleStatusUpdate(entry, 'roomStatus', val)} 
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            {/* Tagihan / Info */}
                                            <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                                                    <p className={styles.guestAmount} style={{ margin: 0 }}>Rp {formatCurrency(entry.amount)}</p>
                                                    <span className={`${styles.paymentBadge} ${entry.paymentStatus?.includes('Lunas') || !entry.paymentStatus ? styles.paymentLunas : styles.paymentPending}`}>
                                                        {entry.paymentStatus || 'Pending'}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Status */}
                                            <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                                                    <div className={`${styles.paymentBadge} ${entry.status === 'CONFIRMED' ? styles.paymentLunas : styles.paymentPending}`} style={{ margin: 0, fontSize: "8px" }}>
                                                        {entry.status}
                                                    </div>
                                                    {entry.type !== 'other_income' ? (
                                                        <GuestStatusPicker 
                                                            current={entry.guestStatus || 'arriving'} 
                                                            onChange={(val) => handleStatusUpdate(entry, 'guestStatus', val)}
                                                        />
                                                    ) : (
                                                        <span className={styles.guestSubtext} style={{ color: "var(--f-light-muted)", fontSize: "8px", fontWeight: 700, letterSpacing: "0.1em" }}>Service</span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Sumber */}
                                            <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                <span className={styles.guestSubtext} style={{ color: "var(--f-light-muted)", fontSize: "9px", fontWeight: 700 }}>{entry.source}</span>
                                            </td>
                                            {/* Aksi */}
                                            <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                    <button onClick={() => setSelectedGuest(entry)} className={styles.btnIcon} style={{ width: "32px", height: "32px", borderRadius: "6px" }} title="View Details"><Eye size={14} /></button>
                                                    <button onClick={() => handleEdit(entry)} className={styles.btnIcon} style={{ width: "32px", height: "32px", borderRadius: "6px" }} title="Edit"><Pencil size={14} /></button>
                                                    {!isCancelled && (
                                                        <button 
                                                            onClick={() => handleCancelClick?.(entry)} 
                                                            className={`${styles.btnIcon} ${styles.btnIconWarning}`} 
                                                            style={{ width: "32px", height: "32px", borderRadius: "6px" }} 
                                                            title="Cancel Booking"
                                                        >
                                                            <CalendarX size={14} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteClick(entry)} className={`${styles.btnIcon} ${styles.btnIconDanger}`} style={{ width: "32px", height: "32px", borderRadius: "6px" }} title="Void Entry"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid var(--f-hairline)", backgroundColor: "var(--f-surface)" }}>
                    <span className={styles.guestSubtext} style={{ fontSize: "9px", fontWeight: 700 }}>{filteredEntries.length} transaksi ditemukan</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button className={styles.btnIcon} style={{ width: "28px", height: "28px", borderRadius: "6px", cursor: "not-allowed", opacity: 0.5 }} disabled>
                            <ChevronDown className="rotate-90" size={13} />
                        </button>
                        <button className={styles.btnIcon} style={{ width: "28px", height: "28px", borderRadius: "6px", cursor: "not-allowed", opacity: 0.5 }} disabled>
                            <ChevronDown className="-rotate-90" size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
