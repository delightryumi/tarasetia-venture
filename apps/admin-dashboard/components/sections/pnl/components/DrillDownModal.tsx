import React from "react";
import { X, Calendar, Layers, Info, Clock, Building2, Hash, ChevronRight, FileText, Calculator, Save } from "lucide-react";
import { formatIDR } from "@/lib/pnl-utils";

export type DrillDownItem = {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  tag?: string;
  date?: string;
  amount: number;
  isNegative?: boolean;
  isTotal?: boolean;
  excludeFromTotal?: boolean;
  metaData?: any; 
};

interface DrillDownModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  items: DrillDownItem[]; 
  totalLabel?: string;
  detailTitle?: string;
  detailItems?: DrillDownItem[];
  onItemSelect?: (item: DrillDownItem) => void;
  onGopChange?: (id: string, value: number, category?: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  selectedId?: string | null;
}

const getBadgeColor = (text: string = "") => {
  const t = text.toUpperCase();
  if (t.includes("EXCLUDED") || t.includes("INFO") || t.includes("ACTIVE")) return "bg-slate-100 text-slate-400 border-slate-200";
  if (t.includes("FEE") || t.includes("PENALTY") || t.includes("DEDUCTION") || t.includes("EXPENSE")) return "bg-rose-50 text-rose-600 border-rose-100";
  if (t.includes("INCOME") || t.includes("RESULT") || t.includes("ADDITION") || t.includes("GROSS") || t.includes("GOP")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (t.includes("REVENUE")) return "bg-blue-50 text-blue-600 border-blue-100";
  if (t.includes("PROPERTY")) return "bg-violet-50 text-violet-600 border-violet-100";
  return "bg-slate-50 text-slate-500 border-slate-100";
};

export default function DrillDownModal({ 
  show, onClose, title, items, totalLabel = "TOTAL NET", 
  detailTitle, detailItems, onItemSelect, onGopChange, onSave, isSaving, selectedId 
}: DrillDownModalProps) {
  
  if (!show) return null;

  const activeItem = items.find(i => i.id === selectedId);
  let finalDetailItems: DrillDownItem[] = [];
  let finalDetailTotal = 0;

  if (detailItems && detailItems.length > 0) {
      finalDetailItems = detailItems;
      finalDetailTotal = detailItems
          .filter(i => !i.isTotal && !i.excludeFromTotal)
          .reduce((acc, item) => acc + (item.isNegative ? -item.amount : item.amount), 0);
  } else if (activeItem?.metaData) {
      const m = activeItem.metaData;
      if (m.transaction) {
          const t = m.transaction;
          const isGrouped = m.isGrouped;
          const totals = m.groupTotals || {
              gross: Number(t.amount) || 0,
              fee: (Number(t.amount) * (Number(t.feePercentage) || 0)) / 100,
              paidCash: Number(t.paidCash) || 0,
              paidTransfer: Number(t.paidTransfer) || 0,
              gap: (Number(t.paidCash) + Number(t.paidTransfer)) - Number(t.amount)
          };
          finalDetailItems = [
              { id: 't-property', title: m.propertyName || 'Unknown Hotel', subtitle: 'Property Location', amount: 0, tag: 'PROPERTY', category: 'META', excludeFromTotal: true },
              { id: 't-stay', title: `${t.checkInDate} — ${t.checkOutDate}`, subtitle: 'Stay Duration', amount: 0, tag: 'DATES', category: 'META', excludeFromTotal: true },
              { id: 't-info', title: `${t.channel} Details`, subtitle: `Booking ID: ${t.bookingId || 'N/A'} | Room: ${t.roomType || 'N/A'}`, amount: 0, tag: 'INFO', category: 'META', excludeFromTotal: true },
              { id: 't-gross', title: isGrouped ? 'Total Gross Amount' : 'Gross Amount (Tagihan)', subtitle: 'Original booking price', amount: totals.gross, tag: 'EXPECTED', category: 'FINANCE' },
              { id: 't-fee', title: `Management Fee (${t.feePercentage || 0}%)`, subtitle: 'Service Fee', amount: totals.fee, isNegative: true, tag: 'DEDUCTION', category: 'FINANCE', excludeFromTotal: true },
              { id: 't-cash', title: 'Payment: Cash (Hotel)', subtitle: 'Received directly by hotel', amount: totals.paidCash, tag: 'PAYMENT', category: 'FINANCE', isNegative: false },
              { id: 't-trf', title: 'Payment: Transfer (Virtual / OTA)', subtitle: 'Received via Virtual Desk', amount: totals.paidTransfer, tag: 'PAYMENT', category: 'FINANCE', isNegative: false },
              { id: 't-gap', title: 'Resulting GAP', subtitle: totals.gap === 0 ? 'Matched Perfectly' : 'Discrepancy Found', amount: totals.gap, isNegative: totals.gap < 0, tag: 'RESULT', category: 'FINANCE', excludeFromTotal: true },
          ];
          finalDetailTotal = totals.paidCash + totals.paidTransfer;
      } else if (m.gross !== undefined) {
          finalDetailItems = [
              { id: 'd-gross', title: 'Total Gross Revenue', subtitle: 'Active Transactions', amount: m.gross, tag: 'GROSS INCOME', category: 'SYSTEM' },
              { id: 'd-fee', title: 'Management Fee', subtitle: 'Deduction from Active Trx', amount: m.fee, isNegative: true, tag: 'FEE DEDUCTION', category: 'SYSTEM' },
              { id: 'd-pen', title: 'Penalty Owner', subtitle: 'Cancellation Deductions', amount: m.penalty, isNegative: true, tag: 'PENALTY', category: 'SYSTEM' },
              { id: 'd-cash', title: 'Pay At Hotel (Cash)', subtitle: 'Retained by Owner', amount: m.payAtHotel || m.cash, isNegative: true, tag: 'CASH DEDUCTION', category: 'SYSTEM' },
          ].filter(i => i.amount !== 0);
          finalDetailTotal = activeItem.amount;
      } else if (m.breakdown !== undefined) {
          const b = m.breakdown;
          finalDetailItems = [
              { id: 'g-header', title: 'Total Revenue Basis', subtitle: `Total POS Gross Revenue (100%)`, amount: b.gross, tag: 'BASIS TOTAL', category: 'META', excludeFromTotal: true },
              { id: 'g-cash', title: 'Sales Pay at Hotel (Cash)', subtitle: `POS Card 2 Basis: ${formatIDR(b.cash)}`, amount: b.gopCash, tag: 'GOP SHARE', category: 'GOP_CONFIG', metaData: { isEditableGOP: true, gopCategory: 'cash', pct: b.pctCash } },
              { id: 'g-trf', title: 'Sales Virtual Payment (Trf)', subtitle: `POS Card 3 Basis: ${formatIDR(b.transfer)}`, amount: b.gopTrf, tag: 'GOP SHARE', category: 'GOP_CONFIG', metaData: { isEditableGOP: true, gopCategory: 'transfer', pct: b.pctTrf } },
              { id: 'g-walk', title: 'Walk-in Revenue', subtitle: `POS Card 4 Basis: ${formatIDR(b.walkIn)}`, amount: b.gopWalkIn, tag: 'GOP SHARE', category: 'GOP_CONFIG', metaData: { isEditableGOP: true, gopCategory: 'walkIn', pct: b.pctWalkIn } },
              { id: 'g-ota', title: 'OTA Revenue (Net)', subtitle: `POS Card 5 Basis: ${formatIDR(b.ota)}`, amount: b.gopOTA, tag: 'GOP SHARE', category: 'GOP_CONFIG', metaData: { isEditableGOP: true, gopCategory: 'ota', pct: b.pctOTA } },
          ];
          finalDetailTotal = b.hotelGop;
      }
  }

  const calcTotalMain = items
    .filter(i => !i.isTotal && !i.excludeFromTotal)
    .reduce((acc, item) => acc + (item.isNegative ? -item.amount : item.amount), 0);

  const today = new Date();
  const dateStr = today.toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = today.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });

  const isSplitView = !!onItemSelect;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#111310]/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className={`bg-white w-full ${isSplitView ? 'max-w-7xl' : 'max-w-3xl'} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-pnl-entry ring-1 ring-white/10 transition-all ease-out font-outfit`}>
        <div className="relative px-8 py-6 bg-[#111310] text-white shrink-0 overflow-hidden flex justify-between items-center border-b border-white/10">
            <div className="relative z-10 flex gap-4 items-center">
                <div className="w-11 h-11 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                    <Layers size={22} className="text-white"/>
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-0.5">
                        <span className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono-jb font-semibold uppercase tracking-[0.2em]">
                            <Clock size={10} className="text-white"/> {dateStr} • {timeStr}
                        </span>
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-white uppercase">{title}</h3>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/10">
                <X size={20} />
            </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div className={`flex-1 flex flex-col bg-white overflow-hidden ${isSplitView ? 'border-r border-slate-100' : ''}`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-1 pnl-scrollbar">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                            <Info size={40} strokeWidth={1.5}/>
                            <span className="text-xs font-semibold uppercase tracking-widest">No data available</span>
                        </div>
                    ) : (
                        items.map((item) => {
                            const isActive = selectedId === item.id;
                            const isClickable = !!onItemSelect && !item.isTotal;
                            if (item.isTotal) {
                                return (
                                    <div key={item.id} className="mt-4 px-6 py-5 bg-[#F8F9FC] border border-slate-200 rounded-xl flex items-center justify-between">
                                        <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest">{item.title}</span>
                                        <span className={`text-xl font-semibold font-mono-jb ${item.isNegative ? 'text-rose-600' : 'text-slate-900'}`}>{formatIDR(item.amount)}</span>
                                    </div>
                                )
                            }
                            return (
                                <div 
                                    key={item.id}
                                    onClick={() => isClickable && onItemSelect && onItemSelect(item)}
                                    className={`
                                        group relative flex items-center justify-between px-6 py-4 rounded-xl border transition-all duration-300
                                        ${isActive 
                                            ? 'bg-slate-900 border-slate-900 shadow-xl z-10' 
                                            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}
                                        ${isClickable ? 'cursor-pointer' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-4 w-full overflow-hidden">
                                        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-xs font-semibold transition-all
                                            ${isActive ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}
                                        `}>
                                            {item.category === "PROPERTY" ? <Building2 size={16}/> : <Hash size={16}/>}
                                        </div>
                                        <div className="flex flex-col min-w-0 pr-4">
                                            <span className={`text-xs font-semibold truncate uppercase tracking-wider transition-colors ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                                {item.title}
                                            </span>
                                            <span className={`text-[10px] font-semibold truncate flex items-center gap-1.5 uppercase tracking-widest ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {item.subtitle}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0 pl-2">
                                        <span className={`text-sm font-semibold font-mono-jb ${isActive ? 'text-white' : (item.isNegative ? 'text-rose-600' : 'text-slate-900')}`}>
                                            {item.isNegative && "- "}{formatIDR(item.amount)}
                                        </span>
                                        {isActive && <ChevronRight size={14} className="text-white absolute -right-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-white/20 rounded-full" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="px-8 py-6 bg-white border-t border-slate-100 flex justify-between items-center shadow-lg z-10">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{totalLabel}</span>
                        <span className={`text-2xl font-semibold tracking-tighter ${calcTotalMain < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatIDR(calcTotalMain)}</span>
                    </div>
                    {onSave && (
                        <button 
                            onClick={onSave} disabled={isSaving}
                            className="flex items-center gap-3 px-8 py-3 bg-[#111310] hover:bg-black text-white rounded-lg text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-slate-200"
                        >
                            {isSaving ? (
                                <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> PROCESSING</>
                            ) : (
                                <><Save size={14} /> SAVE CHANGES</>
                            )}
                        </button>
                    )}
                </div>
            </div>
            {isSplitView && (
                <div className="hidden md:flex md:w-[55%] lg:w-[60%] bg-[#F8F9FC] flex-col border-l border-slate-100 relative">
                    {selectedId && activeItem ? (
                        <>
                            <div className="px-10 py-7 border-b border-slate-200 bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold bg-slate-900 text-white uppercase tracking-[0.2em]">Detailed Record</span>
                                </div>
                                <h4 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{detailTitle || activeItem.title}</h4>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 pnl-scrollbar">
                                {finalDetailItems.map((dItem, idx) => (
                                    <div key={idx} className={`relative pl-8 border-l-[3px] ${dItem.id === 'g-header' ? 'border-slate-900 mb-6' : dItem.excludeFromTotal ? 'border-slate-200 opacity-60' : 'border-slate-900'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="max-w-[70%]">
                                                <h5 className={`font-semibold uppercase tracking-wide ${dItem.id === 'g-header' ? 'text-lg text-slate-900' : 'text-xs text-slate-800'}`}>{dItem.title}</h5>
                                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1">{dItem.subtitle}</p>
                                                <div className="mt-3">
                                                    {dItem.metaData?.isEditableGOP && onGopChange ? (
                                                        <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 shadow-sm inline-flex rounded-lg">
                                                            <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">GOP RATE:</span>
                                                            <div className="flex items-center gap-1">
                                                                <input 
                                                                    type="number" 
                                                                    min="0"
                                                                    onWheel={(e) => e.currentTarget.blur()}
                                                                    onKeyDown={(e) => {
                                                                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                                                        e.preventDefault();
                                                                      }
                                                                    }}
                                                                    value={dItem.metaData.pct}
                                                                    onChange={(e) => onGopChange(activeItem!.id, Number(e.target.value), dItem.metaData.gopCategory)}
                                                                    className="w-12 bg-slate-50 border border-slate-200 rounded-md text-center text-xs font-semibold text-slate-900 outline-none focus:border-slate-900 py-1"
                                                                />
                                                                <span className="text-xs font-semibold text-slate-400">%</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded-full text-[8px] font-semibold uppercase border tracking-widest ${getBadgeColor(dItem.tag)}`}>
                                                            {dItem.tag || dItem.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-mono-jb font-semibold ${dItem.id === 'g-header' ? 'text-2xl text-slate-900' : 'text-lg ' + (dItem.isNegative ? 'text-rose-600' : 'text-slate-900')}`}>
                                                    {dItem.isNegative && "- "}{formatIDR(dItem.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-10 py-8 bg-[#111310] text-white mt-auto">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white text-slate-900 flex items-center justify-center rounded-xl shadow-lg">
                                            <Calculator size={24}/>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-semibold">Total Value (Audit)</p>
                                            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mt-0.5">Verified Calculation</p>
                                        </div>
                                    </div>
                                    <span className="text-4xl font-semibold font-mono-jb tracking-tighter">{formatIDR(finalDetailTotal)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                            <div className="w-24 h-24 bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-xl rounded-full">
                                <FileText size={40} className="text-slate-200"/>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.2em]">Record Summary</h4>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-3 max-w-[200px] leading-loose">Select a property record to begin detailed audit review.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}