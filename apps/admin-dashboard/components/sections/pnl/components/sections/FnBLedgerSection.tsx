"use client";

import React from "react";
import { motion } from "framer-motion";
import { Store, Percent, Hotel, Wallet, Gift } from "lucide-react";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { SummaryCard } from "../shared/SummaryCard";

import styles from "./PNLSectionLayout.module.css";

interface FnBLedgerSectionProps {
    pnlResult: GlobalPnLResult | null;
    loading: boolean;
    rise: any;
    onCardClick: (cardId: string) => void;
}

export function FnBLedgerSection({ pnlResult, loading, rise, onCardClick }: FnBLedgerSectionProps) {
    return (
        <div className={styles.sectionWrapper}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionBadgeRow}>
                    <span className={styles.scheduleBadge}>SCHEDULE 02 · F&amp;B</span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Operated Department
                    </span>
                </div>
                <h2 className={styles.sectionTitle}>
                    <Store size={20} className="text-emerald-600 dark:text-emerald-400" />
                    FOOD &amp; BEVERAGE DIVISION <span className={styles.sectionTitleHighlight}>· OUTLET REVENUE &amp; POS AUDIT</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                    Food &amp; Beverage Outlets Sales, POS Terminal Audit, Deductions, Restaurant Tax &amp; Service Charge
                </p>
            </div>

            <div className={styles.innerContainer}>
                <motion.div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                    <SummaryCard
                        label="Food A La Carte Revenue"
                        icon={<Store size={16} />}
                        accent="#10b981"
                        value={pnlResult?.revFoodAlacarte || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Beverage A La Carte Revenue"
                        icon={<Store size={16} />}
                        accent="#f59e0b"
                        value={pnlResult?.revBeverageAlacarte || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Banquet Revenue"
                        icon={<Store size={16} />}
                        accent="#059669"
                        value={pnlResult?.revBanquetRevenue || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total F&B A la Carte Revenue"
                        icon={<Store size={16} />}
                        accent="#eab308"
                        value={pnlResult?.revTotalFnb || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />

                    {/* POS-derived deductions (display only, no click) */}
                    <SummaryCard
                        label="Compliment Deductions"
                        icon={<Gift size={16} />}
                        accent="#ef4444"
                        value={pnlResult?.posComplimentValue || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label={`Service Charge (${pnlResult?.posServiceRate || 0}%)`}
                        icon={<Percent size={16} />}
                        accent="#059669"
                        value={pnlResult?.posServiceCharge || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label={`Tax (${pnlResult?.posTaxRateIndividual || 0}%)`}
                        icon={<Percent size={16} />}
                        accent="#10b981"
                        value={pnlResult?.posTaxAmount || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label={`Lost & Breakage (${pnlResult?.posLostBreakageRate || 0}%)`}
                        icon={<Percent size={16} />}
                        accent="#ef4444"
                        value={pnlResult?.posLostBreakageAmount || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label={`Total Service & Tax (${pnlResult?.posTaxRateCombined || 0}%)`}
                        icon={<Percent size={16} />}
                        accent="#f59e0b"
                        value={pnlResult?.posTotalServiceTax || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label="Gross Revenue"
                        icon={<Hotel size={16} />}
                        accent="#059669"
                        value={pnlResult?.posGrossRevenue || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label="Net Revenue"
                        icon={<Wallet size={16} />}
                        accent="#10b981"
                        value={pnlResult?.posNettRevenue || 0}
                        loading={loading}
                        variants={rise}
                    />
                </motion.div>
            </div>
        </div>
    );
}
