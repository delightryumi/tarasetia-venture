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
                <h2 className={styles.sectionTitle}>
                    <Hotel size={28} /> Room <span style={{ color: "#788069" }}>Revenue</span>
                </h2>
                <p className={styles.sectionSubtitle}>Accommodation & Misc Income</p>
            </div>
            <div className={styles.innerContainer}>
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 xl:gap-10">
                    <SummaryCard
                        label="Revenue Hotel Collect"
                        icon={<Store size={18} />}
                        accent="#3b82f6"
                        value={pnlResult?.card3_RevHotelCollect || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Revenue Online/Transfer Collect"
                        icon={<Sparkles size={18} />}
                        accent="#8b5cf6"
                        value={pnlResult?.card3_RevNexuraCollect || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Revenue Room"
                        icon={<Hotel size={18} />}
                        accent="#3b82f6"
                        value={pnlResult?.revRoom || 0}
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
