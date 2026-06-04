"use client";

import React from "react";
import { motion } from "framer-motion";
import { BedDouble } from "lucide-react";
import { RoomStatusBadge, GuestStatusBadge } from "./StatusPickers";
import styles from "./OverviewStyles.module.css";

const CHANNELS = [
    { name: "Traveloka", logo: "/channels/traveloka.png" },
    { name: "Booking.com", logo: "/channels/booking_com.png" },
    { name: "Tiket.com", logo: "/channels/tiket_com.png" },
    { name: "Agoda", logo: "/channels/agoda.png" },
    { name: "Airbnb", logo: "/channels/airbnb.png" },
    { name: "Trip.com", logo: "/channels/trip.png" },
    { name: "Expedia", logo: "/channels/expedia.png" },
    { name: "MG Bedbank", logo: "/channels/mg.png" },
    { name: "Nexura Sales", logo: "/channels/nexura.png" },
    { name: "Walk-in", logo: "/channels/walk_in.png" },
    { name: "Booking Engine", logo: "/channels/nexura.png" },
];

export const getChannelLogo = (name: string) => {
    return CHANNELS.find(c => c.name === name)?.logo || "/channels/walk_in.png";
};

export function StatCard({ icon, label, count, accent, items = [], onItemClick, onStatusUpdate }: any) {
    return (
        <motion.div 
            whileHover={{ y: -8, scale: 1.01 }}
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
            </div>

            <div>
                <p className={styles.cardValue}>{count}</p>
            </div>

            <div className={styles.cardContent}>
                {items.length === 0 ? (
                    <div className={styles.noActivity}>
                        <p className={styles.noActivityText}>No activity</p>
                    </div>
                ) : (
                    items.slice(0, 5).map((item: any, idx: number) => (
                        <button 
                            key={idx}
                            onClick={() => onItemClick?.(item)}
                            className={styles.guestItem}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                                    <div className={styles.guestAvatar}>
                                        <img src={getChannelLogo(item.channel)} alt="" className={styles.guestAvatarImg} onError={(e) => { e.currentTarget.style.display = 'none'; e.stopPropagation(); }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className={styles.guestMainInfo}>
                                            <p className={styles.guestName} style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.guestName || "General Sale"}</p>
                                            {item.isExtend && (
                                                <span className={styles.extendBadge}>Extend</span>
                                            )}
                                        </div>

                                        <div className={styles.guestMetaRow}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                <BedDouble size={10} style={{ color: 'var(--f-light-muted)', marginTop: '2px' }} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <p className={styles.guestSubtext} style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                        {item.roomType || (item.incomeCategory || '---')}
                                                    </p>
                                                    {item.roomNumber && (
                                                        <p className={styles.guestSubtext} style={{ fontSize: '8px', color: 'var(--f-light-muted)', margin: 0 }}>
                                                            Room {item.roomNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {(item.type === 'accommodation' || (!item.type && item.guestName && !item.guestName.startsWith('POS Order') && !item.posItems && !item.revenueType)) && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--f-hairline)' }} />
                                                    <RoomStatusBadge current={item.roomStatus || 'dirty'} />
                                                    <GuestStatusBadge current={item.guestStatus || 'arriving'} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <p className={styles.guestAmount} style={{ margin: 0, lineHeight: 'none' }}>Rp {Number(item.amount).toLocaleString('id-ID')}</p>
                                    <span className={`${styles.paymentBadge} ${item.paymentStatus?.includes('Lunas') || !item.paymentStatus ? styles.paymentLunas : styles.paymentPending}`}>
                                        {item.paymentStatus || 'Settled'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </motion.div>
    );
}
