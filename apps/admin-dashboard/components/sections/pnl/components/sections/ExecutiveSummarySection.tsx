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
    mgmtFeePercentage: number;
    serviceChargePercentage: number;
    lostBreakagePercentage: number;
    onVatChange: (v: number) => void;
    onFeeChange: (v: number) => void;
    onServiceChange: (v: number) => void;
    onLostChange: (v: number) => void;
    onCardClick: (cardId: string) => void;
}

/** Inline percentage rate input rendered inside a card's `extra` slot */
function RateInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 border border-stone-100 group-hover:border-stone-200 transition-colors">
            <input
                type="number"
                className="w-8 bg-transparent outline-none text-[10px] font-bold text-stone-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
            <span className="text-[9px] font-bold text-stone-600 uppercase">%</span>
        </div>
    );
}

export function ExecutiveSummarySection({
    pnlResult, loading, rise,
    vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage,
    onVatChange, onFeeChange, onServiceChange, onLostChange,
    onCardClick,
}: ExecutiveSummarySectionProps) {
    return (
        <div style={{ padding: "40px" }} className="bg-white rounded-[32px] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500 w-full">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                    <TrendingUp size={28} /> Executive <span style={{ color: "#788069" }}>Summary</span>
                </h2>
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.3em]">Overall PnL Conclusion</p>
            </div>

            <div style={{ padding: "40px" }} className="bg-stone-100/70 rounded-[24px] border border-stone-200/50 shadow-inner w-full">
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
                        onClick={onCardClick}
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
                        onClick={onCardClick}
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
                        onClick={onCardClick}
                        extra={<RateInput value={lostBreakagePercentage} onChange={onLostChange} />}
                    />
                    <SummaryCard
                        label={`Management Fee (${mgmtFeePercentage}%)`}
                        icon={<Wallet size={18} />}
                        accent="#f59e0b"
                        value={pnlResult?.card9_FeeGross || 0}
                        loading={loading}
                        variants={rise}
                        bgVariant="amber"
                        onClick={onCardClick}
                        extra={<RateInput value={mgmtFeePercentage} onChange={onFeeChange} />}
                    />
                </motion.div>
            </div>
        </div>
    );
}
