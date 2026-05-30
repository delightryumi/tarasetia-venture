"use client";

import React from "react";
import { motion } from "framer-motion";
import { Store, Activity } from "lucide-react";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { VsCard } from "../shared/VsCard";

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
        <div style={{ padding: "40px" }} className="bg-white rounded-[32px] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500 w-full">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                    <Activity size={28} /> F&B <span style={{ color: "#788069" }}>Performance</span>
                </h2>
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.3em]">Revenue Vs Expenses Analysis</p>
            </div>

            <div style={{ padding: "40px" }} className="bg-stone-100/70 rounded-[24px] border border-stone-200/50 shadow-inner w-full">
                <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 xl:gap-10">
                    <VsCard
                        label="Food A la Carte Performance"
                        icon={<Store size={18} />}
                        accent="#14b8a6"
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
                        icon={<Store size={18} />}
                        accent="#eab308"
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
                        icon={<Store size={18} />}
                        accent="#f59e0b"
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
                        icon={<Store size={18} />}
                        accent="#0ea5e9"
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
