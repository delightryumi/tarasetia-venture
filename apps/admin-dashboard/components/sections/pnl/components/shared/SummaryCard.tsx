import React from "react";
import { motion } from "framer-motion";
import classes from "./SummaryCard.module.css";

interface SummaryCardProps {
    label: string;
    icon: React.ReactNode;
    value?: number;
    loading?: boolean;
    formatter?: (v: number) => string;
    onClick?: (cardId: string) => void;
    extra?: React.ReactNode;
    variants?: any;
    accent?: string;
    bgVariant?: "neutral" | "revenue" | "expense" | "amber" | "yellow" | "pink" | "blue";
}

export function SummaryCard({
    label, icon, value = 0, loading = false,
    formatter, onClick, extra, variants, accent, bgVariant = "neutral",
}: SummaryCardProps) {
    const bgMap: Record<string, string> = {
        neutral: classes.bgNeutral,
        revenue: classes.bgRevenue,
        expense: classes.bgExpense,
        amber:   classes.bgAmber,
        yellow:  classes.bgYellow,
        pink:    classes.bgPink,
        blue:    classes.bgBlue,
    };
    const bgStyleClass = bgMap[bgVariant] ?? classes.bgNeutral;
    const isColored = bgVariant !== "neutral";
    const labelColorClass = isColored ? classes.labelColored : "";

    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -2 }}
            onClick={() => onClick && onClick(label)}
            className={`${classes.card} ${bgStyleClass} ${onClick ? classes.cardClickable : ""}`}
        >
            <div className="flex flex-col h-full justify-between gap-3 w-full">
                <div className={classes.header}>
                    <div
                        style={{ backgroundColor: accent ? `${accent}10` : undefined, color: accent || undefined }}
                        className={classes.iconBox}
                    >
                        {icon}
                    </div>
                    <span className={`${classes.label} ${labelColorClass}`}>
                        {label}
                    </span>
                </div>
                <div className={classes.valueContainer}>
                    <span className={classes.value}>
                        {loading ? "—" : (formatter ? formatter(value) : `Rp ${value.toLocaleString("id-ID")}`)}
                    </span>
                </div>
            </div>
            {extra && <div className={classes.extraContainer}>{extra}</div>}
        </motion.div>
    );
}
