import React from "react";
import { 
  TrendingUp, Coins, MinusCircle, Wallet, 
  Building2, ArrowUpRight, Percent, Gem, 
  Receipt, Activity, DollarSign, Store,
  ArrowRight
} from "lucide-react";
import { formatIDR, GlobalPnLResult } from "@/lib/pnl-utils";

interface SummaryGridProps {
  pnlResult: GlobalPnLResult;
  totalGOP: number;
  sharedExpensesTotal: number;
  mgmtExpensesTotal: number;
  totalNonComm: number;
  totalRevenueHotelCollect: number;
  vatPercentage: number;
  setVatPercentage: (val: number) => void;
  onCardClick: (cardId: string) => void; 
}

export function SummaryGrid({
  pnlResult,
  vatPercentage,
  setVatPercentage,
  onCardClick 
}: SummaryGridProps) {
  
  if (!pnlResult) return null;

  return (
    <div className="flex flex-col gap-6 mb-12">
      
      {/* PRIMARY KPI ROW - 3 MAJOR METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TOTAL REVENUE - MAIN FOCUS */}
        <div 
          onClick={() => onCardClick('TOTAL_REVENUE')}
          className="lg:col-span-1 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-blue-400 transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-blue-600 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={200} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <TrendingUp size={24} />
                </div>
                <span className="text-[10px] font-semibold bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">Main Income</span>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Gross Revenue</p>
            <h2 className="text-2xl sm:text-3xl lg:text-2xl xl:text-3xl font-bold text-slate-900 tracking-tight font-mono-jb mb-4 truncate" title={formatIDR(pnlResult.card1_TotalRevenue)}>
              {formatIDR(pnlResult.card1_TotalRevenue)}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                <span className="text-[10px] font-semibold uppercase tracking-widest">View Details</span>
                <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* TOTAL GOP - PROFITABILITY FOCUS */}
        <div 
          onClick={() => onCardClick('TOTAL_GOP')}
          className="lg:col-span-1 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-emerald-400 transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-emerald-600 group-hover:scale-110 transition-transform duration-700">
            <Gem size={200} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Gem size={24} />
                </div>
                <span className="text-[10px] font-semibold bg-emerald-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">Gross Profit</span>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Operating Profit</p>
            <h2 className="text-2xl sm:text-3xl lg:text-2xl xl:text-3xl font-bold text-slate-900 tracking-tight font-mono-jb mb-4 truncate" title={formatIDR(pnlResult.card7_TotalGOP)}>
              {formatIDR(pnlResult.card7_TotalGOP)}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-600 transition-colors">
                <span className="text-[10px] font-semibold uppercase tracking-widest">Efficiency Metrics</span>
                <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* NET RECON OWNER - SETTLEMENT FOCUS */}
        <div 
          onClick={() => onCardClick('RECON_OWNER')}
          className="lg:col-span-1 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl hover:border-white/20 transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 opacity-[0.1] text-white group-hover:scale-110 transition-transform duration-700">
            <Building2 size={200} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-white/10 text-white rounded-xl border border-white/10 backdrop-blur-md">
                    <Building2 size={24} />
                </div>
                <span className="text-[10px] font-semibold bg-white text-slate-900 px-3 py-1 rounded-full uppercase tracking-widest">Owner Net</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2">Reconciliation Settlement</p>
            <h2 className="text-2xl sm:text-3xl lg:text-2xl xl:text-3xl font-bold text-white tracking-tight font-mono-jb mb-4 truncate" title={formatIDR(pnlResult.card12_ReconOwner)}>
              {formatIDR(pnlResult.card12_ReconOwner)}
            </h2>
            <div className="flex items-center gap-2 text-slate-500 group-hover:text-white transition-colors">
                <span className="text-[10px] font-semibold uppercase tracking-widest">Audit Balance</span>
                <ArrowRight size={14} />
            </div>
          </div>
        </div>

      </div>

      {/* SECONDARY METRICS - BENTO GRID STYLE */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* COMPACT METRICS */}
        {[
          { label: "Non-Comm", val: pnlResult.card2_NonCommRevenue, icon: DollarSign, id: 'NON_COMM', color: 'indigo' },
          { label: "Hotel Collect", val: pnlResult.card3_RevHotelCollect, icon: Store, id: 'REV_HOTEL_COLLECT', color: 'violet' },
          { label: "Other Income", val: pnlResult.card5_OtherRevenue, icon: Coins, id: 'OTHER_REVENUE', color: 'cyan' },
          { label: "Penalty", val: pnlResult.card4_PenaltyFee, icon: MinusCircle, id: 'PENALTY', color: 'rose', neg: true },
          { label: "Opr. Exp", val: pnlResult.card8_TotalExpenses, icon: Receipt, id: 'EXPENSES', color: 'orange', neg: true },
          { label: "Management Fee", val: pnlResult.card9_FeeGross, icon: Wallet, id: 'FEE_GROSS', color: 'amber' },
        ].map((item, idx) => (
          <div 
            key={idx}
            onClick={() => onCardClick(item.id)}
            className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className={`p-2 w-8 h-8 rounded-lg mb-3 flex items-center justify-center ${
              item.color === 'indigo' ? 'bg-indigo-50 text-indigo-500' :
              item.color === 'violet' ? 'bg-violet-50 text-violet-500' :
              item.color === 'cyan' ? 'bg-cyan-50 text-cyan-500' :
              item.color === 'rose' ? 'bg-rose-50 text-rose-500' :
              item.color === 'orange' ? 'bg-orange-50 text-orange-500' :
              'bg-amber-50 text-amber-500'
            }`}>
              <item.icon size={16} />
            </div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
            <p className={`text-sm font-semibold font-mono-jb tracking-tight ${item.neg ? 'text-rose-500' : 'text-slate-900'}`}>
              {item.neg && item.val > 0 ? "-" : ""}{formatIDR(Math.abs(item.val)).replace("Rp ", "")}
            </p>
          </div>
        ))}

      </div>

      {/* FINAL ROW - SYSTEM CONTROLS & GAPS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GOP EFFICIENCY */}
        <div 
          onClick={() => onCardClick('GOP')}
          className="lg:col-span-4 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between group cursor-pointer hover:bg-emerald-50 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">GOP</p>
              <h4 className="text-xl font-semibold text-slate-900 font-mono-jb">{formatIDR(pnlResult.card6_GOP)}</h4>
            </div>
          </div>
          <div className="text-right">
             <span className="text-[9px] font-semibold bg-white px-2 py-1 rounded-lg border border-emerald-200 text-emerald-600">
               {pnlResult.gopBasis > 0 ? `${((pnlResult.gopFee / pnlResult.gopBasis) * 100).toFixed(1)}% RATE` : "MIXED"}
             </span>
          </div>
        </div>

        {/* GAP STATUS */}
        <div 
          onClick={() => onCardClick('GAP')}
          className={`lg:col-span-4 p-6 rounded-2xl border flex items-center justify-between group cursor-pointer transition-all ${
            pnlResult.card10_GAP !== 0 
            ? 'bg-rose-50/50 border-rose-100 hover:bg-rose-50' 
            : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${pnlResult.card10_GAP !== 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-widest ${pnlResult.card10_GAP !== 0 ? 'text-rose-600' : 'text-slate-500'}`}>System Gap</p>
              <h4 className="text-xl font-semibold text-slate-900 font-mono-jb">{formatIDR(pnlResult.card10_GAP)}</h4>
            </div>
          </div>
          <span className={`text-[9px] font-semibold px-2 py-1 rounded-lg border ${
            pnlResult.card10_GAP !== 0 ? 'bg-white border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-400'
          }`}>
            {pnlResult.card10_GAP === 0 ? "BALANCED" : "DISCREPANCY"}
          </span>
        </div>

        {/* VAT INPUT BOX */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 text-slate-500 rounded-xl">
                <Percent size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">VAT Input</span>
                <div className="flex items-center gap-1">
                   <input 
                      type="number" 
                      value={vatPercentage} 
                      onChange={(e) => setVatPercentage(Number(e.target.value))}
                      className="w-12 text-xl font-semibold text-slate-900 bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none p-0"
                   />
                   <span className="text-sm font-semibold text-slate-400">%</span>
                </div>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-1">Tax Amount</p>
              <p className="text-sm font-semibold text-slate-900 font-mono-jb">{formatIDR(pnlResult.card11_VAT)}</p>
           </div>
        </div>

      </div>

    </div>
  );
}