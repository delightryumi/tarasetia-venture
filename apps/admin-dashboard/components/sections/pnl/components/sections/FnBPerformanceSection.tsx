"use client";

import React from "react";
import { motion } from "framer-motion";
import { Store, Activity } from "lucide-react";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { VsCard } from "../shared/VsCard";

import styles from "./PNLSectionLayout.module.css";

interface FnBPerformanceSectionProps {
    pnlResult: GlobalPnLResult | null;
    loading: boolean;
    rise: any;
    onCardClick: (cardId: string) => void;
}

export function FnBPerformanceSection({ pnlResult, loading, rise, onCardClick }: FnBPerformanceSectionProps) {
    const serviceRate       = pnlResult?.posServiceRate       || 0;
    const taxRateIndividual = pnlResult?.posTaxRateIndividual || 0;
    const lostBreakageRate  = pnlResult?.posLostBreakageRate  || 0;

    return (
        <div className={styles.sectionWrapper}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionBadgeRow}>
                    <span className={styles.scheduleBadge}>SCHEDULE 02 · COST AUDIT</span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Cost of Sales Analysis
                    </span>
                </div>
                <h2 className={styles.sectionTitle}>
                    <Activity size={20} className="text-emerald-600 dark:text-emerald-400" />
                    F&amp;B COST OF SALES &amp; OPERATING RATIOS <span className={styles.sectionTitleHighlight}>· DEPARTMENTAL MARGIN AUDIT</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                    Food Cost %, Beverage Cost %, and Banquet Cost % Ratios Relative to Net Departmental Revenue
                </p>
            </div>

            <div className={styles.innerContainer}>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
                    <VsCard
                        label="Food A la Carte Performance"
                        icon={<Store size={16} />}
                        accent="#10b981"
                        revenue={pnlResult?.revFoodAlacarte || 0}
                        expenses={pnlResult?.expFoodAlacarte || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                        serviceRate={serviceRate}
                        taxRateIndividual={taxRateIndividual}
                        lostBreakageRate={lostBreakageRate}
                        costLabel="Food Cost"
                        healthyThreshold={30}
                        warningThreshold={40}
                    />
                    <VsCard
                        label="Banquet Performance"
                        icon={<Store size={16} />}
                        accent="#059669"
                        revenue={pnlResult?.revBanquet || 0}
                        expenses={pnlResult?.expBanquet || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                        serviceRate={serviceRate}
                        taxRateIndividual={taxRateIndividual}
                        lostBreakageRate={lostBreakageRate}
                        costLabel="Banquet Cost"
                        healthyThreshold={45}
                        warningThreshold={50}
                    />
                    <VsCard
                        label="Total F&B A la Carte Performance"
                        icon={<Store size={16} />}
                        accent="#047857"
                        revenue={pnlResult?.revAlacarte || 0}
                        expenses={pnlResult?.expAlacarte || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                        serviceRate={serviceRate}
                        taxRateIndividual={taxRateIndividual}
                        lostBreakageRate={lostBreakageRate}
                        costLabel="Total Cost"
                        healthyThreshold={30}
                        warningThreshold={40}
                    />
                    <VsCard
                        label="Beverage A la Carte Performance"
                        icon={<Store size={16} />}
                        accent="#10b981"
                        revenue={pnlResult?.revBeverageAlacarte || 0}
                        expenses={pnlResult?.expBeverageAlacarte || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                        serviceRate={serviceRate}
                        taxRateIndividual={taxRateIndividual}
                        lostBreakageRate={lostBreakageRate}
                        costLabel="Beverage Cost"
                        healthyThreshold={18}
                        warningThreshold={25}
                    />
                </motion.div>
            </div>
        </div>
    );
}
