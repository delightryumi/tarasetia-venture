"use client";

import React from "react";
import { X, User, Calendar, Home, CreditCard, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getChannelLogo } from "./StatCard";
import styles from "./OverviewStyles.module.css";

interface GuestListDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    roomType: string;
    bookings: any[];
    onAdd?: (date: string) => void;
}

export function GuestListDrawer({ isOpen, onClose, date, roomType, bookings, onAdd }: GuestListDrawerProps) {
    if (!isOpen) return null;

    return (
        <motion.aside 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={styles.rightSidebarCol}
        >
            <div className={styles.card} style={{ height: '100%', minHeight: '400px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--f-hairline)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div>
                        <h2 className={styles.headerTitle} style={{ fontSize: '13px', margin: 0 }}>{roomType}</h2>
                        <p className={styles.guestSubtext} style={{ color: 'var(--f-light-muted)', margin: '2px 0 0 0' }}>{date}</p>
                    </div>
                    <button onClick={onClose} className={styles.btnIcon} style={{ width: '32px', height: '32px', borderRadius: '6px' }} title="Tutup Detail">
                        <X size={16} />
                    </button>
                </div>

                {/* Guest List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '550px', paddingRight: '4px' }} className="custom-scrollbar">
                    <p className={styles.guestSubtext} style={{ color: 'var(--f-light-muted)', fontWeight: 700, letterSpacing: '0.1em', margin: 0 }}>
                        Occupancy Details ({bookings.length})
                    </p>
                    
                    {bookings.map((booking, idx) => (
                        <div key={idx} className={styles.card} style={{ padding: '16px', gap: '12px', border: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-surface-soft)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className={styles.guestAvatar}>
                                    <img 
                                        src={`/avatar/memo_${((((booking.guestName || "G").charCodeAt(0) || 0) + (booking.amount || 0)) % 35) + 1}.png`} 
                                        alt={booking.guestName}
                                        className={styles.guestAvatarImg}
                                        style={{ borderRadius: '4px' }}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className={styles.guestName} style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{booking.guestName || "General Sale"}</p>
                                    <p className={styles.guestSubtext} style={{ margin: 0, color: 'var(--f-light-muted)' }}>{booking.channel}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--f-hairline)' }}>
                                <div>
                                    <p className={styles.guestSubtext} style={{ fontSize: '8px', color: 'var(--f-light-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Home size={8} /> Room No
                                    </p>
                                    <p className={styles.guestSubtext} style={{ color: 'var(--f-ink)', fontWeight: 700, margin: '2px 0 0 0' }}>{booking.roomNumber || "---"}</p>
                                </div>
                                <div>
                                    <p className={styles.guestSubtext} style={{ fontSize: '8px', color: 'var(--f-light-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={8} /> Duration
                                    </p>
                                    <p className={styles.guestSubtext} style={{ color: 'var(--f-ink)', fontWeight: 700, margin: '2px 0 0 0' }}>{booking.nights} Nights</p>
                                </div>
                                <div>
                                    <p className={styles.guestSubtext} style={{ fontSize: '8px', color: 'var(--f-light-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CreditCard size={8} /> Payment
                                    </p>
                                    <p className={styles.guestAmount} style={{ margin: '2px 0 0 0', fontSize: '10px' }}>Rp {Number(booking.amount).toLocaleString('id-ID')}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p className={styles.guestSubtext} style={{ fontSize: '8px', color: 'var(--f-light-muted)', margin: 0 }}>Status</p>
                                    <p className={`${styles.paymentBadge} ${booking.paymentStatus?.includes('Lunas') || !booking.paymentStatus ? styles.paymentLunas : styles.paymentPending}`} style={{ margin: '2px 0 0 auto', width: 'fit-content' }}>{booking.paymentStatus || "Pending"}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {bookings.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px 16px' }}>
                            <div className={styles.guestAvatar} style={{ width: '48px', height: '48px' }}>
                                <PlusCircle size={24} style={{ color: 'var(--f-light-muted)' }} />
                            </div>
                            <div>
                                <p className={styles.guestSubtext} style={{ fontWeight: 700, color: 'var(--f-light-muted)' }}>No active bookings for this slot</p>
                                <p className={styles.guestSubtext} style={{ fontSize: '8px', color: 'var(--f-light-muted)', marginTop: '2px' }}>Ready for a new reservation?</p>
                            </div>
                            <button 
                                onClick={() => { onClose(); onAdd?.(date); }}
                                className={styles.btnPrimary}
                                style={{ width: 'auto', padding: '0 20px', height: '36px', borderRadius: '8px' }}
                            >
                                + New Reservation
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid var(--f-hairline)', paddingTop: '16px', marginTop: 'auto' }}>
                    <p className={styles.guestSubtext} style={{ color: 'var(--f-light-muted)', fontSize: '8px', textAlign: 'center', margin: 0 }}>
                        Operational Ledger View
                    </p>
                </div>
            </div>
        </motion.aside>
    );
}
