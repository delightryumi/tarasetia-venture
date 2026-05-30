"use client";

import React from "react";
import { motion } from "framer-motion";

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

    const badgeColor =
        costPercentage === 0
            ? "bg-neutral-100 text-neutral-500 border-neutral-200"
            : isHealthy
            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
            : isWarning
            ? "bg-amber-50 text-amber-600 border-amber-100"
            : "bg-rose-50 text-rose-600 border-rose-100";

    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -2 }}
            onClick={() => onClick && onClick(label)}
            style={{ padding: "24px" }}
            className={`flex flex-col justify-between rounded-[20px] bg-white border border-stone-200/60 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-300 min-h-[140px] w-full ${onClick ? "cursor-pointer" : "cursor-default"}`}
        >
            <div className="flex items-start justify-between mb-5 w-full gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                        style={{ backgroundColor: accent ? `${accent}10` : undefined, color: accent || undefined }}
                        className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 flex-shrink-0"
                    >
                        {icon}
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider line-clamp-2 leading-tight">
                        {label}
                    </span>
                </div>
                <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold border flex-shrink-0 ${badgeColor}`}>
                    {loading ? "—" : `${costPercentage.toFixed(1)}%`} {costLabel}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto w-full">
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Nett Revenue</span>
                    <span className="text-sm font-bold text-stone-800 tracking-tight">
                        {loading ? "—" : `Rp ${Math.round(nettRevenue).toLocaleString("id-ID")}`}
                    </span>
                </div>
                <div className="flex flex-col gap-1 pl-4 border-l border-neutral-100">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Expenses</span>
                    <span className="text-sm font-bold text-stone-800 tracking-tight">
                        {loading ? "—" : `Rp ${expenses.toLocaleString("id-ID")}`}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
