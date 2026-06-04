"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import styles from "../ForecastStyles.module.css";

const rise = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface SummaryCardProps {
    label: string;
    icon: React.ReactNode;
    accent: string;
    prefix?: string;
    suffix?: string;
    value?: number;
    loading?: boolean;
    formatter?: (val: number) => string;
    onClick?: () => void;
    active?: boolean;
}

export function SummaryCard({
    label,
    icon,
    accent,
    prefix = "Rp",
    suffix = "",
    value = 0,
    loading = false,
    formatter,
    onClick,
    active
}: SummaryCardProps) {
    return (
        <motion.div
            variants={rise}
            whileHover={{ y: -6, scale: 1.02 }}
            onClick={onClick}
            className={`${styles.summaryCard} ${onClick ? 'cursor-pointer' : 'cursor-default'} ${active ? styles.summaryCardActive : ''}`}
        >
            {/* Background Accent Glow */}
            <div 
                className={styles.summaryCardGlow} 
                style={{ backgroundColor: accent }}
            />

            {/* Top Row: Icon & Label */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative", zIndex: 10 }}>
                <div 
                    className={styles.cardIconBox} 
                    style={{ backgroundColor: `${accent}0D`, color: accent, borderColor: `${accent}1A` }}
                >
                    {icon}
                </div>
                <span className={styles.cardLabel}>
                    {label}
                </span>
            </div>

            {/* Middle: Prominent Amount */}
            <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    {prefix && (
                        <span className={styles.guestSubtext} style={{ fontSize: "12px", color: loading ? "var(--f-light-muted)" : "var(--f-muted)" }}>
                            {prefix}
                        </span>
                    )}
                    <p 
                        className={styles.cardValue} 
                        style={{ fontSize: "28px", color: loading ? "var(--f-light-muted)" : "var(--f-ink)" }}
                    >
                        {loading ? "—" : (formatter ? formatter(value) : value)}
                    </p>
                    {suffix && (
                        <span className={styles.guestSubtext} style={{ fontSize: "12px", color: loading ? "var(--f-light-muted)" : "var(--f-muted)" }}>
                            {suffix}
                        </span>
                    )}
                </div>
                <span className={styles.guestSubtext} style={{ fontSize: "7px", marginTop: "8px", opacity: loading ? 1 : 0, transition: "opacity 300ms" }}>
                    Real-time data
                </span>
                <div style={{ marginTop: "16px", width: "48px", height: "2px", borderRadius: "9px", backgroundColor: `${accent}20` }} />
            </div>

            {/* Subtle Percentage (Optional - Bottom Corner) */}
            <div style={{ position: "absolute", bottom: "16px", right: "20px", opacity: 0.4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: "bold", color: "#10b981" }}>
                    <ArrowUpRight size={10} />
                    <span>0%</span>
                </div>
            </div>
        </motion.div>
    );
}
