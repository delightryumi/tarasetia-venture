"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Hotel, Store, Receipt, Percent, Wallet, Activity, ArrowUpRight } from "lucide-react";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { SummaryCard } from "../shared/SummaryCard";

interface ExecutiveSummarySectionProps {
    pnlResult: GlobalPnLResult | null;
    loading: boolean;
    rise: any;
    vatPercentage: number;
    mgmtFeeRoomPercentage: number;
    mgmtFeeFnbPercentage: number;
    serviceChargePercentage: number;
    lostBreakagePercentage: number;
    onVatChange: (v: number) => void;
    onFeeRoomChange: (v: number) => void;
    onFeeFnbChange: (v: number) => void;
    onServiceChange: (v: number) => void;
    onLostChange: (v: number) => void;
    onCardClick: (cardId: string) => void;
}

/** Inline percentage rate input rendered inside a card's `extra` slot */
function RateInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex items-center gap-2 bg-stone-50 dark:bg-[#1c1917] rounded-lg px-2 border border-stone-100 dark:border-stone-800 group-hover:border-stone-200 dark:group-hover:border-stone-700 transition-colors">
            <input
                type="number"
                min="0"
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                    }
                }}
                className="w-8 bg-transparent outline-none text-[10px] font-bold text-stone-900 dark:text-stone-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
            <span className="text-[9px] font-bold text-stone-600 dark:text-stone-400 uppercase">%</span>
        </div>
    );
}

import styles from "./PNLSectionLayout.module.css";

export function ExecutiveSummarySection({
    pnlResult, loading, rise,
    vatPercentage, mgmtFeeRoomPercentage, mgmtFeeFnbPercentage, serviceChargePercentage, lostBreakagePercentage,
    onVatChange, onFeeRoomChange, onFeeFnbChange, onServiceChange, onLostChange,
    onCardClick,
}: ExecutiveSummarySectionProps) {
    return (
        <div className={styles.sectionWrapper}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                    <TrendingUp size={28} /> Executive <span className={styles.sectionTitleHighlight}>Summary</span>
                </h2>
                <p className={styles.sectionSubtitle}>Overall PnL Conclusion</p>
            </div>

            <div className={styles.innerContainer}>
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 xl:gap-10">

                    {/* ── REVENUES ── */}
                    <SummaryCard
                        label="Room Revenue"
                        icon={<Hotel size={18} />}
                        accent="#10b981"
                        value={pnlResult?.revRoom || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="revenue"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total F&B A la Carte Revenue"
                        icon={<Store size={18} />}
                        accent="#10b981"
                        value={pnlResult?.revTotalFnb || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="revenue"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total Banquet Revenue"
                        icon={<Store size={18} />}
                        accent="#10b981"
                        value={pnlResult?.revBanquet || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="revenue"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total Gross Revenue"
                        icon={<TrendingUp size={18} />}
                        accent="#10b981"
                        value={pnlResult?.card1_TotalRevenue || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="revenue"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total GOP"
                        icon={<Activity size={18} />}
                        accent="#10b981"
                        value={pnlResult?.card7_TotalGOP || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="revenue"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Net Profit (Recon Owner)"
                        icon={<ArrowUpRight size={18} />}
                        accent="#10b981"
                        value={pnlResult?.card12_ReconOwner || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="revenue"
                        onClick={onCardClick}
                    />

                    {/* ── EXPENSES ── */}
                    <SummaryCard
                        label="Housekeeping Expenses"
                        icon={<Receipt size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.expHousekeeping || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="expense"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total F&B A la Carte Expenses"
                        icon={<Receipt size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.expAlacarte || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="expense"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total Banquet Expenses"
                        icon={<Receipt size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.expBanquet || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="expense"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Operational Expenses"
                        icon={<Receipt size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.expOperational || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="expense"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Payroll Expenses"
                        icon={<Receipt size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.expPayroll || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="expense"
                        onClick={onCardClick}
                    />
                    <SummaryCard
                        label="Total Operational Expenses"
                        icon={<Receipt size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.card8_TotalExpenses || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="expense"
                        onClick={onCardClick}
                    />

                    {/* ── DEDUCTIONS (amber / pink) ── */}
                    <SummaryCard
                        label={`VAT Input (${vatPercentage}%)`}
                        icon={<Percent size={18} />}
                        accent="#ef4444"
                        value={pnlResult?.card11_VAT || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="expense"
                        extra={<RateInput value={vatPercentage} onChange={onVatChange} />}
                    />
                    <SummaryCard
                        label={`Service Charge (${serviceChargePercentage}%)`}
                        icon={<Percent size={18} />}
                        accent="#f59e0b"
                        value={pnlResult?.summaryServiceCharge || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="amber"
                        extra={<RateInput value={serviceChargePercentage} onChange={onServiceChange} />}
                    />
                    <SummaryCard
                        label={`Lost & Breakage (${lostBreakagePercentage}%)`}
                        icon={<Percent size={18} />}
                        accent="#ec4899"
                        value={pnlResult?.summaryLostBreakage || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="pink"
                        extra={<RateInput value={lostBreakagePercentage} onChange={onLostChange} />}
                    />
                    <SummaryCard
                        label={`Management Fee - Room (${mgmtFeeRoomPercentage}%)`}
                        icon={<Wallet size={18} />}
                        accent="#0ea5e9"
                        value={pnlResult?.card9_FeeGrossRoom || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="blue"
                        extra={<RateInput value={mgmtFeeRoomPercentage} onChange={onFeeRoomChange} />}
                    />
                    <SummaryCard
                        label={`Management Fee - F&B (${mgmtFeeFnbPercentage}%)`}
                        icon={<Wallet size={18} />}
                        accent="#0ea5e9"
                        value={pnlResult?.card9_FeeGrossFnb || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="blue"
                        extra={<RateInput value={mgmtFeeFnbPercentage} onChange={onFeeFnbChange} />}
                    />
                </motion.div>
            </div>
        </div>
    );
}
