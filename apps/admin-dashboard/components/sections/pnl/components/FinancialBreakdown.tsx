"use client";

import React from "react";
import { 
  TrendingUp, Receipt, PieChart, 
  Calculator, Wallet, Percent, Sparkles, ArrowRight
} from "lucide-react";
import { formatIDR, GlobalPnLResult, PnlIncomeItem, PnlExpenseItem } from "@/lib/pnl-utils";

// --- INTERFACES ---
interface FinancialBreakdownProps {
  pnlResult: GlobalPnLResult;
  customIncomes: PnlIncomeItem[];
  nonCommissionRevenue: PnlIncomeItem[];
  expenses: any[];
  sharedExpensesTotal: number;
  mgmtExpensesTotal: number;
  totalNonComm: number;
  finalMgmtNet: number;
  vatPercentage: number;
  gopPercentage: number;
  totalRevenueHotelCollect: number;
  retainedPercent: number;
  setRetainedPercent: (val: number) => void;
}

const EmptyDash = () => <span className="text-zinc-300 font-mono-jb text-lg opacity-50">--</span>;

const SectionHeader = ({ icon: Icon, title, subtitle, themeColor }: any) => {
  const colors: any = {
      emerald: "text-emerald-600", 
      rose: "text-rose-600",
      blue: "text-blue-600",
      zinc: "text-zinc-900"
  };
  const activeColor = colors[themeColor] || colors.zinc;

  return (
      <div className="flex items-center gap-4 mb-6">
          <div className={`p-2.5 rounded-lg bg-slate-50 border border-slate-100 ${activeColor}`}>
              <Icon size={18} strokeWidth={2} />
          </div>
          <div>
              <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">{title}</h3>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest mt-0.5">{subtitle}</p>
          </div>
          <div className="flex-1 h-px bg-slate-100 ml-4"></div>
      </div>
  );
};

const RowItem = ({ label, subLabel, value, isNegative, isTotal, highlight }: any) => (
  <div className={`
      relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 px-2
      transition-all duration-300 border-b border-slate-50 last:border-0
      ${isTotal ? 'bg-slate-900 py-6 px-6 rounded-xl my-4 text-white' : highlight ? 'bg-emerald-50/30 rounded-lg' : 'hover:bg-slate-50/50'}
  `}>
      <div className="flex items-start gap-4">
           <div>
              <p className={`text-xs ${isTotal ? 'font-semibold uppercase tracking-widest' : highlight ? 'font-semibold text-emerald-900' : 'font-semibold text-slate-700'} uppercase tracking-wider`}>
                {label}
              </p>
              {subLabel && <p className={`text-[10px] mt-0.5 font-semibold ${isTotal ? 'text-slate-400' : 'text-slate-400'} uppercase tracking-widest`}>{subLabel}</p>}
           </div>
      </div>
      
      <div className="flex items-center justify-end">
           <span className={`
              font-mono-jb font-semibold text-base sm:text-lg tracking-tight text-right
              ${isTotal ? 'text-emerald-400' : isNegative ? 'text-rose-500' : highlight ? 'text-slate-900' : 'text-slate-500'}
           `}>
              {value !== null && value !== 0 ? formatIDR(value) : <EmptyDash/>}
           </span>
      </div>
  </div>
);

export default function FinancialBreakdown({
  pnlResult, sharedExpensesTotal, mgmtExpensesTotal, vatPercentage,
  retainedPercent, setRetainedPercent
}: FinancialBreakdownProps) {
  
  if (!pnlResult) return null;

  const val_Card1_Total = pnlResult.card1_TotalRevenue; 
  const val_CardGOP = pnlResult.card6_GOP;
  const val_Card3_Base = pnlResult.card3_RevHotelCollect; 
  const val_Card2_NonComm = pnlResult.card2_NonCommRevenue;
  const val_Card4_Penalty = pnlResult.card4_PenaltyFee;
  const val_Card5_Other = pnlResult.card5_OtherRevenue;
  const val_Card7_TotalGOP = pnlResult.card7_TotalGOP;

  const gapAmount = pnlResult.totalGap; 
  const totalOperationalExpenses = pnlResult.card8_TotalExpenses || 0;
  const vatAmount = pnlResult.card11_VAT || 0;
  const mgmtFeeAmount = pnlResult.card9_FeeGross || 0;
  const profitNexura = pnlResult.card12_ReconOwner;

  const calculatedInvestors = pnlResult.investorDistributions?.map(inv => ({
    ...inv,
    calculatedAmount: inv.amount
  })) || [];
  
  const mgmtShareData = calculatedInvestors.length > 0 ? calculatedInvestors[0] : null;
  const mgmtShareAmount = mgmtShareData ? mgmtShareData.calculatedAmount : 0;
  
  const retainedEarningsValue = mgmtShareAmount * (retainedPercent / 100);
  const totalSisaManagement = mgmtShareAmount - retainedEarningsValue - mgmtExpensesTotal;

  return (
    <div className="w-full font-outfit text-zinc-800">
      
      <div className="space-y-10">

        {/* SECTION 1: REVENUE */}
        <div className="animate-in slide-in-from-bottom-2 duration-500">
            <SectionHeader icon={TrendingUp} title="I. Revenue Ledger" subtitle="Income sources audit" themeColor="emerald" />
            <div className="space-y-1">
                <RowItem label="Gross Revenue Hotel Collect" subLabel="Total direct billings" value={val_Card1_Total} />
                <RowItem label="Revenue Hotel Collect (GOP)" subLabel={`Basis: ${formatIDR(val_Card3_Base)}`} value={val_CardGOP} highlight={true} />
                <RowItem label="Revenue Non Commission" subLabel="Secondary income" value={val_Card2_NonComm} />
                <RowItem label="Penalty Fee" value={val_Card4_Penalty} isNegative={val_Card4_Penalty < 0} />
                <RowItem label="Other Revenue" value={val_Card5_Other} />
                <RowItem label="Total Gross Operating Profit (GOP)" value={val_Card7_TotalGOP} isTotal={true} />
            </div>
        </div>

        {/* SECTION 2: OPERATIONAL */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
            <SectionHeader icon={Receipt} title="II. Operational Deductions" subtitle="Shared costs & adjustments" themeColor="rose" />
            <div className="space-y-1">
                 <RowItem label="Shared Expenses" subLabel="Operational spendings" value={sharedExpensesTotal} />
                 <RowItem label="Gap Adjustment" subLabel="System calibration" value={-gapAmount} isNegative={gapAmount !== 0} />
                 <RowItem label="Total Operational Deduction" value={totalOperationalExpenses} isNegative={true} />
            </div>
        </div>

        {/* SECTION 3: NET PROFIT */}
        <div className="animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/10 rounded-lg"><Calculator size={18} className="text-emerald-400"/></div>
                            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.2em]">Net Profit Flow</h4>
                        </div>
                        <div className="space-y-3 border-l border-white/10 pl-6">
                            <div className="flex items-center gap-10 justify-between">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Base GOP</span>
                                <span className="font-mono-jb text-sm font-semibold">{formatIDR(val_Card7_TotalGOP)}</span>
                            </div>
                            <div className="flex items-center gap-10 justify-between">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">VAT ({vatPercentage}%) <Sparkles size={10} className="text-yellow-400"/></span>
                                <span className="font-mono-jb text-sm font-semibold text-rose-400">-{formatIDR(vatAmount)}</span>
                            </div>
                            <div className="flex items-center gap-10 justify-between">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Service Charge</span>
                                <span className="font-mono-jb text-sm font-semibold text-rose-400">-{formatIDR(pnlResult.summaryServiceCharge || 0)}</span>
                            </div>
                            <div className="flex items-center gap-10 justify-between">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Lost & Breakage</span>
                                <span className="font-mono-jb text-sm font-semibold text-rose-400">-{formatIDR(pnlResult.summaryLostBreakage || 0)}</span>
                            </div>
                            <div className="flex items-center gap-10 justify-between">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Management Fee</span>
                                <span className="font-mono-jb text-sm font-semibold text-rose-400">-{formatIDR(mgmtFeeAmount)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-left md:text-right pt-6 md:pt-0 border-t md:border-t-0 border-white/10 w-full md:w-auto">
                        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-[0.3em] mb-2">Net Profit Result</p>
                        <p className="font-mono-jb font-semibold text-4xl sm:text-5xl tracking-tighter">
                            {formatIDR(profitNexura)}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* SECTION 4: DISTRIBUTION */}
        <div className="animate-in slide-in-from-bottom-8 duration-500">
            <SectionHeader icon={PieChart} title="III. Distribution Audit" subtitle="Shareholder allocation" themeColor="blue" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {calculatedInvestors.map((inv, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all shadow-sm">
                         <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-xs border border-blue-100">
                                {inv.share}%
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Equity Allocation</span>
                         </div>
                         <p className="font-semibold text-zinc-800 text-sm uppercase tracking-tight mb-1">{inv.name}</p>
                         <p className="font-mono-jb font-semibold text-xl text-zinc-900 tracking-tight">
                            {formatIDR(inv.calculatedAmount)}
                         </p>
                    </div>
                ))}
            </div>
        </div>

        {/* SECTION 5: MGMT CASHFLOW */}
        {mgmtShareData && (
        <div className="animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-emerald-50/30 rounded-2xl border border-emerald-100 overflow-hidden">
                <div className="p-8 border-b border-emerald-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg shadow-sm"><Wallet size={18}/></div>
                        <div>
                            <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-widest">Management Cash Flow</h3>
                            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-widest mt-0.5">Internal Audit</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 md:p-8 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Gross Management Share</p>
                            <p className="font-mono-jb font-semibold text-lg text-slate-900">{formatIDR(mgmtShareAmount)}</p>
                        </div>
                        <div className="flex-1 p-5 bg-white rounded-xl border border-slate-100 shadow-sm relative group">
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Retained Earnings</p>
                            <div className="flex justify-between items-center">
                                <p className="font-mono-jb font-semibold text-lg text-rose-500">-{formatIDR(retainedEarningsValue)}</p>
                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                    <input 
                                        type="number" min="0" max="100"
                                        value={retainedPercent}
                                        onChange={(e) => setRetainedPercent(Number(e.target.value))}
                                        className="w-6 bg-transparent text-center font-semibold text-slate-800 outline-none text-[10px]"
                                    />
                                    <Percent size={8} className="text-slate-400"/>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Operational Cost</p>
                            <p className="font-mono-jb font-semibold text-lg text-rose-500">-{formatIDR(mgmtExpensesTotal)}</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 p-10 rounded-2xl text-center shadow-2xl mt-8">
                         <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.4em] mb-4">Net Cash Disbursement</p>
                         <p className="font-mono-jb font-semibold text-5xl text-emerald-400 tracking-tighter mb-8">{formatIDR(totalSisaManagement)}</p>
                         <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-10 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 mx-auto active:scale-95">
                            Process Settlement <ArrowRight size={14}/>
                         </button>
                    </div>
                </div>
            </div>
        </div>
        )}

      </div>
    </div>
  );
}