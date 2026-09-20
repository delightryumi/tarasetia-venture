"use client";

import React from "react";
import { motion } from "framer-motion";
import { Hotel, Store, Sparkles, MoreHorizontal, Receipt, Percent, Target, TrendingUp } from "lucide-react";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { SummaryCard } from "../shared/SummaryCard";

import styles from "./PNLSectionLayout.module.css";

interface RoomRevenueSectionProps {
    pnlResult: GlobalPnLResult | null;
    loading: boolean;
    rise: any;
    onCardClick: (cardId: string) => void;
}

export function RoomRevenueSection({ pnlResult, loading, rise, onCardClick }: RoomRevenueSectionProps) {
    return (
        <div className={styles.sectionWrapper}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionBadgeRow}>
                    <span className={styles.scheduleBadge}>SCHEDULE 01 · ROOMS</span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Operated Department
                    </span>
                </div>
                <h2 className={styles.sectionTitle}>
                    <Hotel size={20} className="text-emerald-600 dark:text-emerald-400" />
                    ROOMS DIVISION <span className={styles.sectionTitleHighlight}>· ROOM REVENUE &amp; OCCUPANCY METRICS</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                    Accommodation Revenue, Operating Ratios (OCC, ARR, RevPAR) &amp; Direct Housekeeping Operating Expenses
                </p>
            </div>
            <div className={styles.innerContainer}>
                <motion.div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                    <SummaryCard
                        label="Revenue Cash in Hotel"
                        icon={<Store size={16} />}
                        accent="#059669"
                        value={pnlResult?.revCashHotel ?? 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Room Revenue Transfer/EDC/QRIS"
                        icon={<Sparkles size={16} />}
                        accent="#0284c7"
                        value={pnlResult?.revDirectCashless ?? 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="OTA Revenue"
                        icon={<TrendingUp size={16} />}
                        accent="#8b5cf6"
                        value={pnlResult?.revOta ?? 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total Room Revenue"
                        icon={<Hotel size={16} />}
                        accent="#059669"
                        value={pnlResult?.revRoom || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Room Compliment"
                        icon={<Hotel size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.foComplimentValue || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="OCC"
                        icon={<Percent size={18} />}
                        accent="#f59e0b"
                        value={pnlResult?.occ || 0}
                        loading={loading}
                        formatter={(v) => `${v.toFixed(1)}%`}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="ARR"
                        icon={<Target size={18} />}
                        accent="#10b981"
                        value={pnlResult?.arr || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="RevPAR"
                        icon={<TrendingUp size={18} />}
                        accent="#6366f1"
                        value={pnlResult?.revPar || 0}
                        loading={loading}
                        formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Other Revenue"
                        icon={<MoreHorizontal size={18} />}
                        accent="#ec4899"
                        value={pnlResult?.card5_OtherRevenue || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Housekeeping Expenses"
                        icon={<Receipt size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.expHousekeeping || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                </motion.div>
            </div>
        </div>
    );
}
