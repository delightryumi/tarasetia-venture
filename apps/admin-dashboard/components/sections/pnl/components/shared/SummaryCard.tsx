"use client";

import React from "react";
import { motion } from "framer-motion";

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
        neutral: "bg-white border-stone-200/60 hover:border-stone-300",
        revenue: "bg-emerald-50/60 border-emerald-100/80 hover:border-emerald-200",
        expense: "bg-rose-50/60 border-rose-100/80 hover:border-rose-200",
        amber:   "bg-amber-50/60 border-amber-100/80 hover:border-amber-200",
        yellow:  "bg-amber-50/60 border-amber-100/80 hover:border-amber-200",
        pink:    "bg-pink-50/60 border-pink-100/80 hover:border-pink-200",
        blue:    "bg-sky-50/60 border-sky-100/80 hover:border-sky-200",
    };
    const bgStyleClass = bgMap[bgVariant] ?? bgMap.neutral;
    const isColored = bgVariant !== "neutral";
    const labelColor = isColored ? "text-stone-900" : "text-neutral-500";
    const valueColor = isColored ? "text-stone-900" : "text-stone-800";

    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -2 }}
            onClick={() => onClick && onClick(label)}
            style={{ padding: "24px" }}
            className={`group flex flex-col justify-between rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300 min-h-[110px] w-full border ${bgStyleClass} ${onClick ? "cursor-pointer" : "cursor-default"}`}
        >
            <div className="flex flex-col h-full justify-between gap-3 w-full">
                <div className="flex items-center gap-3 w-full">
                    <div
                        style={{ backgroundColor: accent ? `${accent}10` : undefined, color: accent || undefined }}
                        className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors flex-shrink-0"
                    >
                        {icon}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider line-clamp-2 leading-tight flex-1 ${labelColor}`}>
                        {label}
                    </span>
                </div>
                <div className="flex flex-col w-full">
                    <span className={`text-sm font-bold tracking-tight ${valueColor}`}>
                        {loading ? "—" : (formatter ? formatter(value) : `Rp ${value.toLocaleString("id-ID")}`)}
                    </span>
                </div>
            </div>
            {extra && <div className="mt-3 w-full">{extra}</div>}
        </motion.div>
    );
}
