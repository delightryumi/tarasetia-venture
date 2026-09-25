"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BedDouble, Globe, Search, X } from "lucide-react";
import { RoomStatusBadge, GuestStatusBadge } from "./StatusPickers";
import { resolveBookingIdentifiers, getChannelLogo } from "@/lib/channelHelper";
import styles from "./StatCard.module.css";

export function StatCard({ icon, label, count, accent, items = [], onItemClick, onStatusUpdate }: any) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase();
        return items.filter((item: any) => {
            const ids = resolveBookingIdentifiers(item);
            return (
                (item.guestName && item.guestName.toLowerCase().includes(q)) ||
                (item.roomNumber && String(item.roomNumber).toLowerCase().includes(q)) ||
                (item.roomType && item.roomType.toLowerCase().includes(q)) ||
                (ids.channelName && ids.channelName.toLowerCase().includes(q)) ||
                (ids.reservationId && ids.reservationId.toLowerCase().includes(q)) ||
                (ids.otaReservationId && ids.otaReservationId.toLowerCase().includes(q)) ||
                (ids.bookingId && ids.bookingId.toLowerCase().includes(q))
            );
        });
    }, [items, searchQuery]);

    return (
        <motion.div 
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={styles.card}
            style={{ cursor: 'default' }}
        >
            <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                    <div className={styles.cardIconBox} style={{ color: accent }}>
                        {icon}
                    </div>
                    <p className={styles.cardLabel}>{label}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                        style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            color: '#475569',
                            fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                            fontFeatureSettings: '"tnum" 1'
                        }}
                    >
                        {items.length} {items.length === 1 ? 'record' : 'records'}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p className={styles.cardValue}>{count}</p>
            </div>

            {/* Quick in-card search if there are multiple items */}
            {items.length > 2 && (
                <div 
                    style={{ 
                        position: 'relative', 
                        display: 'flex', 
                        alignItems: 'center',
                        marginBottom: '4px'
                    }}
                >
                    <Search size={13} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                    <input 
                        type="text"
                        placeholder="Search guest or room..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            height: '30px',
                            padding: '0 28px 0 28px',
                            fontSize: '11px',
                            borderRadius: '6px',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            backgroundColor: '#ffffff',
                            color: '#1e293b',
                            outline: 'none'
                        }}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                color: '#94a3b8'
                            }}
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            )}

            <div className={styles.cardContent}>
                {filteredItems.length === 0 ? (
                    <div className={styles.noActivity}>
                        <p className={styles.noActivityText}>
                            {searchQuery ? "No matching records found" : "No activity"}
                        </p>
                    </div>
                ) : (
                    filteredItems.map((item: any, idx: number) => {
                        const ids = resolveBookingIdentifiers(item);
                        const st = String(item.status || '').toUpperCase();
                        const pst = String(item.paymentStatus || '').toUpperCase();
                        const gst = String(item.guestStatus || '').toLowerCase();
                        const isCancelled = st === 'CANCELLED' || st === 'CANCEL' || pst === 'CANCELLED' || pst === 'CANCEL' || gst === 'cancelled' || gst === 'cancel';
                        return (
                            <button 
                                key={idx}
                                onClick={() => onItemClick?.(item)}
                                className={`${styles.guestItem} ${isCancelled ? styles.cancelledItem : ''}`}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                        <div className={styles.guestAvatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, filter: isCancelled ? 'grayscale(100%)' : 'none', opacity: isCancelled ? 0.45 : 1 }}>
                                            {ids.channelName === "Booking Engine" ? (
                                                <Globe size={14} className="text-stone-400 dark:text-stone-500" />
                                            ) : (
                                                <img src={ids.channelLogo} alt={ids.channelName} className={styles.guestAvatarImg} onError={(e) => { e.currentTarget.style.display = 'none'; e.stopPropagation(); }} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className={styles.guestMainInfo}>
                                                <p 
                                                    className={styles.guestName} 
                                                    style={{ 
                                                        margin: 0, 
                                                        textOverflow: 'ellipsis', 
                                                        overflow: 'hidden', 
                                                        whiteSpace: 'nowrap',
                                                        color: isCancelled ? '#9ca3af' : undefined,
                                                        textDecoration: isCancelled ? 'line-through' : 'none'
                                                    }}
                                                >
                                                    {item.guestName || "General Sale"}
                                                </p>
                                                {ids.reservationId && ids.reservationId !== "N/A" && (
                                                    <span 
                                                        style={{
                                                            fontSize: '10px',
                                                            fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif",
                                                            fontFeatureSettings: '"tnum" 1',
                                                            fontWeight: 600,
                                                            color: '#475569',
                                                            backgroundColor: '#f1f5f9',
                                                            padding: '1px 5px',
                                                            borderRadius: '3px',
                                                            border: '1px solid #e2e8f0',
                                                            letterSpacing: '0.02em',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        {ids.reservationId}
                                                    </span>
                                                )}
                                                {item.isExtend && (
                                                    <span className={styles.extendBadge}>Extend</span>
                                                )}
                                            </div>

                                            <div className={styles.guestMetaRow}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                    <BedDouble size={11} style={{ color: '#64748b', marginTop: '1px' }} />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <p 
                                                            className={styles.guestSubtext} 
                                                            style={{ 
                                                                margin: 0, 
                                                                textOverflow: 'ellipsis', 
                                                                overflow: 'hidden', 
                                                                whiteSpace: 'nowrap',
                                                                color: isCancelled ? '#9ca3af' : undefined,
                                                                textDecoration: isCancelled ? 'line-through' : 'none'
                                                            }}
                                                        >
                                                            {item.roomType || (item.incomeCategory || '---')}
                                                        </p>
                                                        {item.roomNumber && (
                                                            <p 
                                                                className={styles.guestSubtext} 
                                                                style={{ 
                                                                    fontSize: '9px', 
                                                                    fontWeight: 700,
                                                                    color: isCancelled ? '#9ca3af' : '#2563eb', 
                                                                    textDecoration: isCancelled ? 'line-through' : 'none',
                                                                    margin: 0 
                                                                }}
                                                            >
                                                                Room {item.roomNumber}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {(item.type === 'accommodation' || (!item.type && item.guestName && !item.guestName.startsWith('POS Order') && !item.posItems && !item.revenueType)) && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isCancelled ? 0.45 : 1 }}>
                                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--f-hairline)' }} />
                                                        <RoomStatusBadge current={item.roomStatus || 'dirty'} />
                                                        <GuestStatusBadge current={item.guestStatus || 'arriving'} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <p 
                                            className={styles.guestAmount} 
                                            style={{ 
                                                margin: 0, 
                                                lineHeight: 'none',
                                                color: isCancelled ? '#9ca3af' : undefined,
                                                textDecoration: isCancelled ? 'line-through' : 'none'
                                            }}
                                        >
                                            Rp {Number(item.amount).toLocaleString('id-ID')}
                                        </p>
                                        <span 
                                            className={`${styles.paymentBadge} ${
                                                isCancelled 
                                                    ? styles.paymentCancelled 
                                                    : (item.paymentStatus?.includes('Lunas') || !item.paymentStatus ? styles.paymentLunas : styles.paymentPending)
                                            }`}
                                            style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}
                                        >
                                            {isCancelled ? 'CANCELLED' : (item.paymentStatus || 'Settled')}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </motion.div>
    );
}
