"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import styles from "./SummaryCard.module.css";

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
            whileHover={{ y: -2 }}
            onClick={onClick}
            className={`${styles.summaryCard} ${onClick ? 'cursor-pointer' : 'cursor-default'} ${active ? styles.summaryCardActive : ''}`}
            style={{
                minHeight: "110px"
            }}
        >
            {/* Header: Label (Left) and Icon (Right) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 10, backgroundColor: "transparent" }}>
                <span className={styles.cardLabel} style={{ backgroundColor: "transparent" }}>
                    {label}
                </span>
                <div 
                    className={styles.cardIconBox} 
                    style={{ 
                        backgroundColor: `${accent}0D`, 
                        color: accent, 
                        borderColor: `${accent}1A`,
                    }}
                >
                    {icon}
                </div>
            </div>

            {/* Body: Prominent Amount (Left-aligned) */}
            <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start", marginTop: "8px", backgroundColor: "transparent" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", backgroundColor: "transparent" }}>
                    {prefix && (
                        <span className={styles.guestSubtext} style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "transparent" }}>
                            {prefix}
                        </span>
                    )}
                    <p 
                        className={styles.cardValue} 
                        style={{ color: loading ? "var(--f-light-muted)" : "var(--f-ink)", backgroundColor: "transparent" }}
                    >
                        {loading ? "—" : (formatter ? formatter(value) : value)}
                    </p>
                    {suffix && (
                        <span className={styles.guestSubtext} style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "transparent" }}>
                            {suffix}
                        </span>
                    )}
                </div>
                {loading && (
                    <span className={styles.guestSubtext} style={{ fontSize: "8px", color: "var(--f-light-muted)", backgroundColor: "transparent" }}>
                        Loading real-time data...
                    </span>
                )}
            </div>
        </motion.div>
    );
}
