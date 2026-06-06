"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import styles from "../ForecastStyles.module.css";

const SAGE = "#788069";

const rise = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface ChannelPerformanceProps {
    stats: any;
    selectedDate: string;
    formatDate: (dateStr: string) => string;
    formatCurrency: (val: number) => string;
}

export function ChannelPerformance({
    stats,
    selectedDate,
    formatDate,
    formatCurrency
}: ChannelPerformanceProps) {
    const channelsData = [
        { name: "Traveloka", file: "traveloka.png", color: "#00aaf2" },
        { name: "Booking.com", file: "booking_com.png", color: "#003580" },
        { name: "Tiket.com", file: "tiket_com.png", color: "#ff5e1a" },
        { name: "Agoda", file: "agoda.png", color: "#e8173e" },
        { name: "Airbnb", file: "airbnb.png", color: "#ff5a5f" },
        { name: "Trip.com", file: "trip.png", color: "#1890ff" },
        { name: "Expedia", file: "expedia.png", color: "#fbc02d" },
        { name: "MG Bedbank", file: "mg.png", color: "#6c3483" },
        { name: "Nexura Sales", file: "nexura.png", color: SAGE },
        { name: "Walk-in", file: "walk_in.png", color: "#2e7d32" },
        { name: "Booking Engine", file: "nexura.png", color: SAGE },
    ].map((ch) => {
        const channelEntries = stats.entries.filter((e: any) => e.channel === ch.name);
        const revenue = channelEntries.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);
        const trxCount = channelEntries.length;
        const percentage = stats.totalGrossRevenue > 0 ? (revenue / stats.totalGrossRevenue) * 100 : 0;

        return { ...ch, revenue, trxCount, percentage };
    });

    return (
        <motion.section
            key="monthly-channels"
            variants={rise}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
            <div className={styles.card} style={{ overflow: "hidden", padding: 0 }}>
                <div className={styles.cardHeader} style={{ padding: "24px 24px 16px 24px", borderBottom: "1px solid var(--f-hairline)", marginBottom: 0 }}>
                    <div className={styles.cardHeaderLeft}>
                        <div className={styles.headerBadge} style={{ backgroundColor: "#dfd3b2", color: "#8d7a52" }}>
                            <Activity size={15} />
                        </div>
                        <div className={styles.headerMeta}>
                            <span className={styles.headerSubtitle}>Nexura Analytics</span>
                            <h2 className={styles.headerTitle} style={{ fontSize: "13px" }}>
                                Channel <span style={{ color: "#788069" }}>Performance</span>
                            </h2>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <span className={styles.headerSubtitle}>{formatDate(selectedDate)}</span>
                    </div>
                </div>

                <div className={styles.channelPerformanceGrid}>
                    {channelsData.map((ch, i) => (
                        <motion.div
                            key={ch.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                            whileHover={{ scale: 1.015, y: -2 }}
                            className={`${styles.channelCard} ${i === 10 ? styles.channelCardSpan : ""}`}
                        >
                            {/* Accent glow background */}
                            <div
                                className={styles.summaryCardGlow}
                                style={{ background: `radial-gradient(circle at 20% 50%, ${ch.color}, transparent 70%)`, opacity: 0.03 }}
                            />

                            {/* Channel Icon */}
                            <div
                                className={styles.cardIconBox}
                                style={{ backgroundColor: `${ch.color}10`, borderColor: `${ch.color}20`, width: "44px", height: "44px", flexShrink: 0 }}
                            >
                                <img
                                    src={`/channels/${ch.file}`}
                                    alt={ch.name}
                                    style={{ width: "28px", height: "28px", objectFit: "contain" }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                            </div>

                            {/* Content: full width, 3 rows */}
                            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                                {/* Row 1: Name + % badge */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                    <span className={styles.guestName} style={{ fontSize: "11px" }}>{ch.name}</span>
                                    <div
                                        className={styles.paymentBadge}
                                        style={{ backgroundColor: `${ch.color}15`, color: ch.color, fontSize: "9px" }}
                                    >
                                        {ch.percentage.toFixed(1)}%
                                    </div>
                                </div>

                                {/* Row 2: Progress bar */}
                                <div style={{ width: "100%", height: "4px", borderRadius: "9px", backgroundColor: "var(--f-hairline)", overflow: "hidden" }}>
                                    <motion.div
                                        style={{ height: "100%", borderRadius: "9px", backgroundColor: ch.color }}
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${ch.percentage}%` }}
                                        transition={{ duration: 1.2, delay: i * 0.07, ease: "easeOut" }}
                                    />
                                </div>

                                {/* Row 3: Trx + Nominal side by side */}
                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span className={styles.datePickerLabel} style={{ fontSize: "8px" }}>Trx</span>
                                        <span className={styles.guestSubtext} style={{ color: "var(--f-ink)", fontWeight: 700 }}>{ch.trxCount}</span>
                                    </div>
                                    <div className={styles.vDivider} style={{ height: "12px" }} />
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span className={styles.datePickerLabel} style={{ fontSize: "8px" }}>Nominal</span>
                                        <span className={styles.guestSubtext} style={{ color: "var(--f-ink)", fontWeight: 700 }}>Rp {formatCurrency(ch.revenue)}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid var(--f-hairline)", backgroundColor: "var(--f-surface)" }}>
                    <span className={styles.guestSubtext}></span>
                    <span className={styles.guestSubtext} style={{ color: SAGE, fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: SAGE, display: "inline-block", animation: "pulse 2s infinite" }} />
                        Live Analytics
                    </span>
                </div>
            </div>
        </motion.section>
    );
}
