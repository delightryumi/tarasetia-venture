import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Store, Sparkles, MoreHorizontal, Receipt, Percent, Activity, Wallet, ArrowUpRight } from "lucide-react";
import { GlobalPnLResult } from "@/lib/pnl-utils";

interface PNLSummaryCardsProps {
    pnlResult: GlobalPnLResult | null;
    loading: boolean;
    vatPercentage: number;
    mgmtFeePercentage: number;
    onVatChange: (v: number) => void;
    onFeeChange: (v: number) => void;
    rise: any;
    formatIDR: (v: number) => string;
}

function SummaryCard({ 
    label, icon, accent, prefix = "Rp", suffix = "", value = 0, loading = false, formatter, onClick, extra, variants 
}: { 
    label: string, icon: React.ReactNode, accent: string, prefix?: string, suffix?: string, value?: number, loading?: boolean, formatter?: (val: number) => string, onClick?: () => void, extra?: React.ReactNode, variants: any
}) {
    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -6, scale: 1.02 }}
            onClick={onClick}
            className={`group relative flex flex-col gap-4 md:gap-6 p-4 sm:p-5 md:p-5 rounded-xl bg-white border shadow-xl shadow-stone-200/20 hover:shadow-2xl transition-all duration-500 overflow-hidden ${
                onClick ? 'cursor-pointer' : 'cursor-default'
            } border-stone-100 hover:border-stone-300`}
        >
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.04] blur-2xl group-hover:scale-150 transition-transform duration-1000 pointer-events-none" style={{ backgroundColor: accent }}></div>

            <div className="flex items-center justify-between relative z-10 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-all group-hover:rotate-6 duration-500 flex-shrink-0"
                        style={{ backgroundColor: `${accent}0D`, color: accent, borderColor: `${accent}1A` }}>
                        {icon}
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400 leading-tight truncate">
                        {label}
                    </span>
                </div>
                {extra && <div className="relative z-20 flex-shrink-0">{extra}</div>}
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center py-3 sm:py-4 text-center w-full min-w-0">
                <div className="flex items-baseline justify-center gap-1 sm:gap-1.5 w-full min-w-0 px-1 overflow-hidden">
                    {prefix && (
                        <span className={`text-xs md:text-sm font-medium transition-colors flex-shrink-0 ${loading ? 'text-stone-300' : 'text-stone-400'}`}>
                            {prefix}
                        </span>
                    )}
                    <p className={`text-base sm:text-lg md:text-xl lg:text-xl xl:text-xl 2xl:text-2xl font-bold tracking-tight transition-all duration-500 truncate max-w-full ${loading ? 'text-stone-200 animate-pulse' : 'text-stone-900'}`} title={loading ? "Calculating..." : (formatter ? formatter(value) : `${prefix} ${value.toLocaleString('id-ID')}`)}>
                        {loading ? "—" : (formatter ? formatter(value) : value.toLocaleString('id-ID'))}
                    </p>
                    {suffix && (
                        <span className={`text-xs md:text-sm font-medium transition-colors flex-shrink-0 ${loading ? 'text-stone-300' : 'text-stone-400'}`}>
                            {suffix}
                        </span>
                    )}
                </div>
                <span className={`mt-2 text-[8px] font-medium uppercase tracking-[0.2em] transition-opacity duration-500 ${loading ? 'text-stone-300 opacity-100' : 'text-stone-400 opacity-0 group-hover:opacity-100'}`}>
                    {loading ? "Calculating..." : "Real-time audit"}
                </span>
                <div className="mt-4 w-12 h-0.5 rounded-full bg-stone-100 group-hover:w-20 transition-all duration-700" style={{ backgroundColor: `${accent}20` }} />
            </div>

            <div className="absolute bottom-4 right-5 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 text-[9px] font-medium text-emerald-500">
                    <ArrowUpRight size={10} />
                    <span>0%</span>
                </div>
            </div>
        </motion.div>
    );
}

export const PNLSummaryCards: React.FC<PNLSummaryCardsProps> = ({
    pnlResult, loading, vatPercentage, mgmtFeePercentage, onVatChange, onFeeChange, rise, formatIDR
}) => {
    return (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            <SummaryCard
                label="Total Gross Revenue"
                icon={<TrendingUp size={18} />}
                accent="#4ade80"
                value={pnlResult?.card1_TotalRevenue || 0}
                loading={loading}
                variants={rise}
            />
            <SummaryCard
                label="Revenue Hotel Collect"
                icon={<Store size={18} />}
                accent="#3b82f6"
                value={pnlResult?.card3_RevHotelCollect || 0}
                loading={loading}
                variants={rise}
            />
            <SummaryCard
                label="Revenue Nexura Collect"
                icon={<Sparkles size={18} />}
                accent="#8b5cf6"
                value={pnlResult?.card3_RevNexuraCollect || 0}
                loading={loading}
                variants={rise}
            />
            <SummaryCard
                label="Other Revenue"
                icon={<MoreHorizontal size={18} />}
                accent="#ec4899"
                value={pnlResult?.card5_OtherRevenue || 0}
                loading={loading}
                variants={rise}
            />
            <SummaryCard
                label="Total Operational Expenses"
                icon={<Receipt size={18} />}
                accent="#ef4444"
                value={pnlResult?.card8_TotalExpenses || 0}
                loading={loading}
                variants={rise}
            />
            <SummaryCard
                label={`VAT Input (${vatPercentage}%)`}
                icon={<Percent size={18} />}
                accent="#64748b"
                value={pnlResult?.card11_VAT || 0}
                loading={loading}
                variants={rise}
                extra={
                    <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 border border-stone-100 group-hover:border-stone-200 transition-colors">
                        <input 
                          type="number"
                          className="w-8 bg-transparent outline-none text-[10px] font-medium text-stone-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                          value={vatPercentage}
                          onChange={(e) => onVatChange(Number(e.target.value))}
                        />
                        <span className="text-[9px] font-medium text-stone-300 uppercase">%</span>
                    </div>
                }
            />
            <SummaryCard
                label="Total GOP"
                icon={<Activity size={18} />}
                accent="#6366f1"
                value={pnlResult?.card7_TotalGOP || 0}
                loading={loading}
                variants={rise}
            />
            <SummaryCard
                label={`Management Fee (${mgmtFeePercentage}%)`}
                icon={<Wallet size={18} />}
                accent="#f59e0b"
                value={pnlResult?.card9_FeeGross || 0}
                loading={loading}
                variants={rise}
                extra={
                    <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 border border-stone-100 group-hover:border-stone-200 transition-colors">
                        <input 
                          type="number"
                          className="w-8 bg-transparent outline-none text-[10px] font-medium text-stone-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                          value={mgmtFeePercentage}
                          onChange={(e) => onFeeChange(Number(e.target.value))}
                        />
                        <span className="text-[9px] font-medium text-stone-300 uppercase">%</span>
                    </div>
                }
            />
            <SummaryCard
                label="Net Profit (Recon Owner)"
                icon={<ArrowUpRight size={18} />}
                accent="#10b981"
                value={pnlResult?.card12_ReconOwner || 0}
                loading={loading}
                variants={rise}
            />
        </motion.div>
    );
};
