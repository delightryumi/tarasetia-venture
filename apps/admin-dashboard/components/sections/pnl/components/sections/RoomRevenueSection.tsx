"use client";

import React from "react";
import { motion } from "framer-motion";
import { Hotel, Store, Sparkles, MoreHorizontal, Receipt } from "lucide-react";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { SummaryCard } from "../shared/SummaryCard";

interface RoomRevenueSectionProps {
    pnlResult: GlobalPnLResult | null;
    loading: boolean;
    rise: any;
    onCardClick: (cardId: string) => void;
}

export function RoomRevenueSection({ pnlResult, loading, rise, onCardClick }: RoomRevenueSectionProps) {
    return (
        <div style={{ padding: "40px" }} className="bg-white rounded-[32px] border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500 w-full">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                    <Hotel size={28} /> Room <span style={{ color: "#788069" }}>Revenue</span>
                </h2>
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-[0.3em]">Accommodation & Misc Income</p>
            </div>
            <div style={{ padding: "40px" }} className="bg-stone-100/70 rounded-[24px] border border-stone-200/50 shadow-inner w-full">
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
                        label="Revenue Nexura Collect"
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
