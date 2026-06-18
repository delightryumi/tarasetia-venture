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
                <h2 className={styles.sectionTitle}>
                    <Store size={28} /> F&B <span className={styles.sectionTitleHighlight}>Ledger</span>
                </h2>
                <p className={styles.sectionSubtitle}>Food & Beverage Breakdown</p>
            </div>

            <div className={styles.innerContainer}>
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 xl:gap-10">
                    <SummaryCard
                        label="Food A La Carte Revenue"
                        icon={<Store size={18} />}
                        accent="#14b8a6"
                        value={pnlResult?.revFoodAlacarte || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Beverage A La Carte Revenue"
                        icon={<Store size={18} />}
                        accent="#f59e0b"
                        value={pnlResult?.revBeverageAlacarte || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Banquet Revenue"
                        icon={<Store size={18} />}
                        accent="#0ea5e9"
                        value={pnlResult?.revBanquetRevenue || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total F&B A la Carte Revenue"
                        icon={<Store size={18} />}
                        accent="#eab308"
                        value={pnlResult?.revTotalFnb || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />

                    {/* POS-derived deductions (display only, no click) */}
                    <SummaryCard
                        label="Compliment Deductions"
                        icon={<Gift size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.posComplimentValue || 0}
                        loading={loading}
                        variants={rise}
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label={`Service Charge (${pnlResult?.posServiceRate || 0}%)`}
                        icon={<Percent size={18} />}
                        accent="#3b82f6"
                        value={pnlResult?.posServiceCharge || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label={`Tax (${pnlResult?.posTaxRateIndividual || 0}%)`}
                        icon={<Percent size={18} />}
                        accent="#10b981"
                        value={pnlResult?.posTaxAmount || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label={`Lost & Breakage (${pnlResult?.posLostBreakageRate || 0}%)`}
                        icon={<Percent size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.posLostBreakageAmount || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label={`Total Service & Tax (${pnlResult?.posTaxRateCombined || 0}%)`}
                        icon={<Percent size={18} />}
                        accent="#f59e0b"
                        value={pnlResult?.posTotalServiceTax || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label="Gross Revenue"
                        icon={<Hotel size={18} />}
                        accent="#3b82f6"
                        value={pnlResult?.posGrossRevenue || 0}
                        loading={loading}
                        variants={rise}
                    />
                    <SummaryCard
                        label="Nett Revenue"
                        icon={<Wallet size={18} />}
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
