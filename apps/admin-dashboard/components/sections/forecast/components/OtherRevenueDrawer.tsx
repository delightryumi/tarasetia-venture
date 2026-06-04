"use client";

import React from "react";
import { motion } from "framer-motion";
import { LogOut, Coffee } from "lucide-react";
import styles from "../ForecastStyles.module.css";

const SAGE = "#788069";

interface OtherRevenueDrawerProps {
    entries: any[];
    onClose: () => void;
    formatCurrency: (v: number) => string;
}

export function OtherRevenueDrawer({ entries, onClose, formatCurrency }: OtherRevenueDrawerProps) {
    return (
        <>
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className={styles.sidebarBackdrop}
            />
            
            {/* Drawer */}
            <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={styles.rightDrawer}
            >
                <header style={{ padding: "24px", borderBottom: "1px solid var(--f-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <span className={styles.headerSubtitle} style={{ fontSize: "8px" }}>Nexura Detail</span>
                        <h2 className={styles.headerTitle} style={{ fontSize: "13px", marginTop: "2px" }}>Other <span style={{ color: SAGE }}>Revenue</span></h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className={styles.btnIcon} 
                        style={{ width: "36px", height: "36px", borderRadius: "8px" }}
                    >
                        <LogOut size={16} style={{ transform: "rotate(180deg)" }} />
                    </button>
                </header>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {entries.length === 0 ? (
                        <div style={{ height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--f-light-muted)", gap: "16px" }}>
                            <Coffee size={32} strokeWidth={1} />
                            <p className={styles.headerSubtitle} style={{ fontSize: "8px" }}>No additional income today</p>
                        </div>
                    ) : (
                        entries.map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={styles.channelCard}
                                style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "stretch" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div className={styles.guestAvatar}>
                                            <Coffee size={14} style={{ color: "var(--f-sage)" }} />
                                        </div>
                                        <div>
                                            <h3 className={styles.guestName} style={{ margin: 0, fontSize: "11px" }}>{item.incomeCategory}</h3>
                                            <p className={styles.guestSubtext} style={{ margin: 0, fontSize: "8px" }}>{item.staffName}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p className={styles.guestAmount} style={{ margin: 0 }}>Rp {formatCurrency(item.amount)}</p>
                                        <span className={`${styles.paymentBadge} ${item.paymentStatus?.includes('Lunas') || !item.paymentStatus ? styles.paymentLunas : styles.paymentPending}`} style={{ fontSize: "8px" }}>
                                            {item.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                                
                                {item.note && (
                                    <div style={{ paddingTop: "8px", borderTop: "1px solid var(--f-hairline)", fontSize: "10px", color: "var(--f-muted)", fontStyle: "italic" }}>
                                        "{item.note}"
                                    </div>
                                )}
                                
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span className={styles.guestSubtext} style={{ fontSize: "8px", color: "var(--f-light-muted)" }}>
                                        {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                <footer style={{ padding: "24px", backgroundColor: "var(--f-surface)", borderTop: "1px solid var(--f-hairline)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 700, color: "var(--f-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <span>Total Items</span>
                        <span style={{ color: "var(--f-ink)" }}>{entries.length}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: 800, marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <span>Grand Total</span>
                        <span style={{ color: SAGE }}>
                            Rp {formatCurrency(entries.reduce((acc, e) => acc + (Number(e.amount) || 0), 0))}
                        </span>
                    </div>
                </footer>
            </motion.div>
        </>
    );
}
