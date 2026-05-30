"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { X, Printer } from "lucide-react";
import { GlobalPnLResult, formatIDR, PnlExpenseItem, InvestorItem } from "@/lib/pnl-utils";
import { useReactToPrint } from "react-to-print";

interface ExtendedExpenseItem extends PnlExpenseItem {
  allocation?: "SHARED" | "MANAGEMENT"; 
}

interface StatementModalProps {
  show: boolean;
  onClose: () => void;
  month: string;
  pnlResult: GlobalPnLResult;
  expenses: ExtendedExpenseItem[];
  totalNonComm: number;
  mgmtExpensesTotal: number;
  finalMgmtNet: number;
  vatPercentage: number;
  gopPercentage: number;
  sharedExpensesTotal: number;
  investors: InvestorItem[];
  retainedPercent: number; 
}

export default function StatementModal({
  show, onClose, month, pnlResult,
  mgmtExpensesTotal, vatPercentage, sharedExpensesTotal, investors, retainedPercent
}: StatementModalProps) {
  
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Statement_PnL_${month}`,
  });

  if (!show || !pnlResult) return null;

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
  const profitNexura = pnlResult.card12_ReconOwner;

  const calculatedInvestors = pnlResult.investorDistributions?.map(inv => ({
      ...inv,
      calculatedAmount: inv.amount,
      percentage: inv.share
  })) || [];

  const mgmtShareData = calculatedInvestors.length > 0 ? calculatedInvestors[0] : null;
  const mgmtShareAmount = mgmtShareData ? mgmtShareData.calculatedAmount : 0;
  const retainedEarningsValue = mgmtShareAmount * (retainedPercent / 100);
  const totalSisaManagement = mgmtShareAmount - retainedEarningsValue - mgmtExpensesTotal;

  const [y, m] = month.split('-');
  const dateObj = new Date(parseInt(y), parseInt(m) - 1);
  const periodText = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="fixed inset-0 z-[9999] flex justify-center items-start overflow-y-auto bg-slate-900/90 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300 no-print-bg">
      <div className="print-container relative w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl flex flex-col font-outfit text-slate-900 print-area rounded-2xl overflow-hidden">
        
        <div className="no-print absolute top-6 right-6 flex gap-3 z-50">
          <button onClick={() => handlePrint()} className="px-6 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-black transition-all shadow-lg uppercase tracking-wider border border-slate-700">
            <Printer size={16} /> Print PDF
          </button>
          <button onClick={onClose} className="p-2.5 bg-white text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 border border-slate-200 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="w-full">
           <Image src="/surat/header.png" alt="Header" width={1000} height={200} className="w-full h-auto object-contain" priority />
        </div>

        <div ref={componentRef} className="flex-1 px-12 py-8 bg-white">
            
            <div className="text-center mb-10">
               <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight uppercase">Statement of Profit & Loss</h1>
               <div className="w-20 h-1 bg-emerald-500 mx-auto mb-3 rounded-full"></div>
               <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.25em]">Period: <span className="text-slate-900">{periodText}</span></p>
            </div>

            <div className="mb-8">
                <SectionHeader title="I. Revenue Breakdown" />
                <div className="mt-3 space-y-1">
                    <PrintRow label="Total Revenue Hotel Collect" sub="Gross revenue pre-deduction" value={val_Card1_Total} />
                    <PrintRow label="Revenue Hotel Collect (GOP)" sub={`Basis: ${formatIDR(val_Card3_Base)} | Mixed Rates`} value={val_CardGOP} />
                    <PrintRow label="Revenue Non Commission" sub="Direct income" value={val_Card2_NonComm} />
                    <PrintRow label="Penalty Fee" value={val_Card4_Penalty} isNegative={val_Card4_Penalty < 0} />
                    <PrintRow label="Other Revenue" value={val_Card5_Other} />
                    <TotalRow label="TOTAL GROSS OPERATING PROFIT (GOP)" value={val_Card7_TotalGOP} isMain />
                </div>
            </div>

            <div className="mb-8">
                <SectionHeader title="II. Operational Expenses" />
                <div className="mt-3 space-y-1">
                    <PrintRow label="Shared Expenses" sub="Allocated costs" value={sharedExpensesTotal} />
                    <PrintRow label="Gap Adjustment" sub="System calibration" value={-gapAmount} isNegative={gapAmount !== 0} />
                    <TotalRow label="TOTAL DEDUCTION" value={totalOperationalExpenses} isRed />
                </div>
            </div>

            <div className="mb-8">
                <SectionHeader title="III. Net Profit Calculation" />
                <div className="mt-3 space-y-1">
                    <PrintRow label="Calculation Basis (GOP)" value={val_Card7_TotalGOP} isBold />
                    <PrintRow label={`VAT Tax (${vatPercentage}%)`} value={vatAmount} isNegative />
                    <PrintRow label="Service Charge" value={pnlResult.summaryServiceCharge || 0} isNegative />
                    <PrintRow label="Lost & Breakage" value={pnlResult.summaryLostBreakage || 0} isNegative />
                    <PrintRow label="Management Fee" value={pnlResult.card9_FeeGross} isNegative />
                </div>
                <div className="mt-4 p-4 border border-slate-900 bg-slate-50 rounded-xl flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-lg text-slate-900 uppercase tracking-widest">Net Profit Nexura</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">EBITDA (Earnings Before Interest & Tax)</p>
                    </div>
                    <p className="text-2xl font-semibold text-slate-900 tracking-tighter font-mono-jb">{formatIDR(profitNexura)}</p>
                </div>
            </div>

            <div className="mb-8">
                <SectionHeader title="IV. Profit Distribution" />
                <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-[10px] uppercase text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <td className="py-2 px-4 tracking-wider">Shareholder</td>
                                <td className="py-2 px-4 text-center tracking-wider">Percentage</td>
                                <td className="py-2 px-4 text-right tracking-wider">Amount</td>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {calculatedInvestors.map((inv, i) => (
                                <tr key={i}>
                                    <td className="py-3 px-4 font-semibold text-slate-800">{inv.name}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">{inv.percentage}%</span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono-jb">{formatIDR(inv.calculatedAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {mgmtShareData && (
            <div className="mb-12 bg-slate-50 p-5 rounded-xl border border-slate-200 print-break-inside-avoid">
                <SectionHeader title="V. Management Cash Flow (Internal)" />
                <div className="mt-3 space-y-1">
                    <PrintRow label="Gross Share" sub={`Allocation ${mgmtShareData.percentage}%`} value={mgmtShareAmount} />
                    <PrintRow label={`Retained Earnings (${retainedPercent}%)`} value={retainedEarningsValue} isNegative />
                    <PrintRow label="Operational Cost" sub="Direct Expense" value={mgmtExpensesTotal} isNegative />
                    <div className="border-t border-slate-300 pt-3 flex justify-between items-center mt-3">
                        <span className="font-semibold text-slate-900 uppercase tracking-widest text-xs">Net Cash Disbursement</span>
                        <span className="font-mono-jb text-xl font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">{formatIDR(totalSisaManagement)}</span>
                    </div>
                </div>
            </div>
            )}

            <div className="grid grid-cols-2 gap-20 pt-8 mt-4 border-t border-dashed border-slate-200 print-break-inside-avoid">
                <SignatureBox title="Prepared By" role="Finance Dept." />
                <SignatureBox title="Approved By" role="General Manager" />
            </div>
        </div>

        <div className="w-full mt-auto">
             <Image src="/surat/footer.png" alt="Footer" width={1000} height={150} className="w-full h-auto object-cover" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 mb-2">
            <h3 className="text-[10px] font-semibold bg-slate-900 text-white px-3 py-1 uppercase tracking-[0.2em] rounded-md">{title}</h3>
            <div className="h-[1px] bg-slate-200 flex-1"></div>
        </div>
    );
}

function PrintRow({ label, sub, value, isNegative = false, isBold = false }: any) {
    const isMinus = isNegative || (typeof value === 'number' && value < 0);
    return (
        <div className="flex justify-between items-start py-1.5 border-b border-dashed border-slate-100 last:border-0">
            <div>
                <p className={`text-xs ${isBold ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{label}</p>
                {sub && <p className="text-[9px] text-slate-400 italic">{sub}</p>}
            </div>
            <p className={`font-mono-jb text-xs font-semibold ${isMinus ? 'text-rose-600' : 'text-slate-800'}`}>
                {isMinus && value > 0 ? "-" : ""} {formatIDR(Math.abs(value))}
            </p>
        </div>
    );
}

function TotalRow({ label, value, isMain = false, isRed = false }: any) {
    return (
        <div className={`flex justify-between items-center px-4 py-2 mt-2 rounded-lg border ${isMain ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-[10px] uppercase tracking-[0.15em] font-semibold ${isMain ? 'text-emerald-400' : 'text-slate-500'}`}>{label}</span>
            <span className={`font-mono-jb text-sm font-semibold ${isRed ? 'text-rose-600' : isMain ? 'text-white' : 'text-slate-900'}`}>
                {isRed && value > 0 ? "-" : ""} {formatIDR(Math.abs(value))}
            </span>
        </div>
    );
}

function SignatureBox({ title, role }: { title: string, role: string }) {
    return (
        <div className="text-center">
            <p className="text-[9px] uppercase font-semibold text-slate-400 tracking-[0.2em] mb-16">{title}</p>
            <div className="border-t border-slate-300 w-3/4 mx-auto pt-2">
                <p className="font-semibold text-slate-900 text-sm">{role}</p>
            </div>
        </div>
    );
}