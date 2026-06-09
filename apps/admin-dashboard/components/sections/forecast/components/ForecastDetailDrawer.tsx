"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Coffee, FileText, TrendingUp, X } from "lucide-react";
import styles from "../ForecastStyles.module.css";

const SAGE = "#788069";

interface ForecastDetailDrawerProps {
    title: string;
    entries: any[];
    onClose: () => void;
    formatCurrency: (v: number) => string;
}

const getChannelIcon = (channel?: string, source?: string) => {
    const c = (channel || source || "").toLowerCase();
    if (c.includes("agoda")) return "/channels/agoda.png";
    if (c.includes("airbnb")) return "/channels/airbnb.png";
    if (c.includes("booking")) return "/channels/booking_com.png";
    if (c.includes("expedia")) return "/channels/expedia.png";
    if (c.includes("mg")) return "/channels/mg.png";
    if (c.includes("tiket")) return "/channels/tiket_com.png";
    if (c.includes("traveloka")) return "/channels/traveloka.png";
    if (c.includes("trip")) return "/channels/trip.png";
    if (c.includes("walk") || c === "internal" || c.includes("front")) return "/channels/walk_in.png";
    if (c.includes("nexura")) return "/channels/nexura.png";
    return null;
};

export const ForecastDetailDrawer: React.FC<ForecastDetailDrawerProps> = ({ title, entries, summary, onClose, formatCurrency }) => {
    // Check if clicked outside
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

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
                <div className={styles.cardHeader} style={{ padding: "24px 24px 16px 24px", margin: 0 }}>
                    <div className={styles.cardHeaderLeft}>
                        <div className={styles.cardIconBox}>
                            <TrendingUp size={16} style={{ color: "var(--f-sage)" }} />
                        </div>
                        <div>
                            <h2 className={styles.headerTitle} style={{ fontSize: "12px", letterSpacing: "0.05em" }}>{title}</h2>
                            <span className={styles.headerSubtitle} style={{ fontSize: "9px" }}>{entries.length} TRANSACTIONS</span>
                        </div>
                    </div>
                    <button onClick={onClose} className={styles.btnIcon} style={{ width: "32px", height: "32px" }}>
                        <X size={16} />
                    </button>
                </div>
            
                <div style={{ flex: 1, overflowY: "auto", padding: "24px", backgroundColor: "var(--f-surface)", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {summary && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.card}
                            style={{ padding: "16px", marginBottom: "8px", backgroundColor: "var(--f-sage-bg)", borderColor: "var(--f-sage-border)" }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <span className={styles.cardLabel} style={{ color: "var(--f-sage-dark)" }}>{summary.label}</span>
                                <span className={styles.cardValue} style={{ fontSize: "16px", color: "var(--f-sage-dark)" }}>{summary.result}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", fontFamily: "var(--f-font-mono)", color: "var(--f-muted)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Formula:</span>
                                    <span>{summary.formula}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Values:</span>
                                    <span>{summary.values}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {entries.length === 0 ? (
                        <div style={{ height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--f-light-muted)", gap: "16px" }}>
                            <FileText size={32} strokeWidth={1} />
                            <p className={styles.headerSubtitle} style={{ fontSize: "8px" }}>No transactions found for this category</p>
                        </div>
                    ) : (
                        entries.map((item, i) => {
                            const channelIcon = item.type !== 'other_income' ? getChannelIcon(item.channel, item.source) : null;
                            return (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={styles.guestItem}
                                    style={{ gap: "12px", alignItems: "center" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                                        <div className={styles.guestAvatar}>
                                            {channelIcon ? (
                                                <img src={channelIcon} alt="channel" className={styles.guestAvatarImg} />
                                            ) : (
                                                item.type === 'other_income' ? <Coffee size={14} style={{ color: "var(--f-sage)" }} /> : <FileText size={14} style={{ color: "var(--f-sage)" }} />
                                            )}
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflow: "hidden" }}>
                                            <span className={styles.guestName} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "11px" }}>
                                                {item.guestName || item.incomeCategory || "Transaction"}
                                            </span>
                                            <span className={styles.guestSubtext} style={{ fontSize: "8px" }}>
                                                {item.staffName || item.channel || "System"} • {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-"}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                                        <span className={styles.guestAmount} style={{ fontSize: "11px" }}>Rp {formatCurrency(item.amount)}</span>
                                        <span className={`${styles.paymentBadge} ${item.paymentStatus?.includes('Lunas') || !item.paymentStatus ? styles.paymentLunas : styles.paymentPending}`} style={{ fontSize: "8px" }}>
                                            {item.paymentStatus || item.status}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })
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
