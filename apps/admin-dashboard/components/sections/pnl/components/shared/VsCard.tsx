"use client";

import React from "react";
import { motion } from "framer-motion";
import classes from "./VsCard.module.css";

interface VsCardProps {
    label: string;
    icon: React.ReactNode;
    revenue?: number;
    expenses?: number;
    loading?: boolean;
    onClick?: (cardId: string) => void;
    variants?: any;
    accent?: string;
    serviceRate?: number;
    taxRateIndividual?: number;
    lostBreakageRate?: number;
    costLabel?: string;
    healthyThreshold?: number;
    warningThreshold?: number;
}

export function VsCard({
    label, icon, revenue = 0, expenses = 0, loading = false, onClick, variants, accent,
    serviceRate = 0, taxRateIndividual = 0, lostBreakageRate = 0,
    costLabel = "COGS", healthyThreshold = 35, warningThreshold = 50,
}: VsCardProps) {
    const taxRateCombined = Number(serviceRate) + Number(taxRateIndividual) + Number(lostBreakageRate);
    const nettRevenue = taxRateCombined > 0 ? revenue / (1 + taxRateCombined / 100) : revenue;
    const costPercentage = nettRevenue > 0 ? (expenses / nettRevenue) * 100 : 0;
    const isHealthy = costPercentage <= healthyThreshold;
    const isWarning = costPercentage > healthyThreshold && costPercentage <= warningThreshold;

    const badgeClass =
        costPercentage === 0
            ? classes.badgeNeutral
            : isHealthy
            ? classes.badgeHealthy
            : isWarning
            ? classes.badgeWarning
            : classes.badgeCritical;

    const textClass =
        costPercentage === 0
            ? classes.textNeutral
            : isHealthy
            ? classes.textHealthy
            : isWarning
            ? classes.textWarning
            : classes.textCritical;

    const barColor =
        costPercentage === 0
            ? '#d4d4d4'
            : isHealthy
            ? '#006400' /* success */
            : isWarning
            ? '#d9a441' /* signature-mustard */
            : '#aa2d00'; /* signature-coral */

    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -2 }}
            onClick={() => onClick && onClick(label)}
            className={`${classes.card} ${onClick ? classes.cardClickable : ""}`}
        >
            <div className={classes.header}>
                <div className={classes.headerLeft}>
                    <div
                        style={{ backgroundColor: accent ? `${accent}10` : undefined, color: accent || undefined }}
                        className={classes.iconBox}
                    >
                        {icon}
                    </div>
                    <h3 className={classes.label}>
                        {label}
                    </h3>
                </div>
                <div className={`${classes.badge} ${badgeClass}`}>
                    {costLabel}
                </div>
            </div>

            <div className={classes.grid}>
                <div className={classes.col}>
                    <span className={classes.colLabel}>Nett Revenue</span>
                    <span className={classes.colValue}>
                        {loading ? "—" : `Rp ${Math.round(nettRevenue).toLocaleString("id-ID")}`}
                    </span>
                </div>
                <div className={`${classes.col} ${classes.borderLeft}`}>
                    <span className={classes.colLabel}>Expenses</span>
                    <span className={classes.colValue}>
                        {loading ? "—" : `Rp ${expenses.toLocaleString("id-ID")}`}
                    </span>
                </div>
            </div>

            {/* Cost Ratio Progress Bar */}
            <div className={classes.progressContainer}>
                <div className={classes.progressHeader}>
                    <span className={classes.progressLabel}>Cost Ratio</span>
                    <span className={`${classes.progressPercentage} ${textClass}`}>
                        {loading ? "—" : `${costPercentage.toFixed(1)}%`}
                    </span>
                </div>
                <div className={classes.progressBarBg}>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: loading ? 0 : `${Math.min(costPercentage, 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={classes.progressBarFill}
                        style={{ backgroundColor: barColor }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
