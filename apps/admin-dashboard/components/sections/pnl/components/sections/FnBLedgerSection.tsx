"use client";

import React from "react";
import { motion } from "framer-motion";
import { Store, Percent, Hotel, Wallet } from "lucide-react";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { SummaryCard } from "../shared/SummaryCard";

interface FnBLedgerSectionProps {
    pnlResult: GlobalPnLResult | null;
    loading: boolean;
    rise: any;
    onCardClick: (cardId: string) => void;
}

export function FnBLedgerSection({ pnlResult, loading, rise, onCardClick }: FnBLedgerSectionProps) {
    return (
        <div style={{ padding: "40px" }} className="bg-white rounded-[32px] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500 w-full">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                    <Store size={28} /> F&B <span style={{ color: "#788069" }}>Ledger</span>
                </h2>
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.3em]">Food & Beverage Breakdown</p>
            </div>

            <div style={{ padding: "40px" }} className="bg-stone-100/70 rounded-[24px] border border-stone-200/50 shadow-inner w-full">
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
