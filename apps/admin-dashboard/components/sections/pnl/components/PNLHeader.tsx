import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    PieChart, LayoutDashboard, TrendingUp, Download, FileText, Calendar, ChevronDown 
} from "lucide-react";
import { MONTHS, YEARS } from "../usePnL";

interface PNLHeaderProps {
    viewMode: "monthly" | "yearly";
    setViewMode: (m: "monthly" | "yearly") => void;
    displayMode: "cards" | "charts";
    setDisplayMode: (m: "cards" | "charts") => void;
    month: string;
    setMonth: (m: string) => void;
    showDatePicker: boolean;
    setShowDatePicker: (s: boolean) => void;
    onExportExcel: () => void;
    onExportPDF: () => void;
    rise: any;
}

const PEACH = "#ffd8a6";
const SAGE = "#788069";
const RICH_BLACK = "#1A1C14";

export const PNLHeader: React.FC<PNLHeaderProps> = ({
    viewMode, setViewMode, displayMode, setDisplayMode,
    month, setMonth, showDatePicker, setShowDatePicker,
    onExportExcel, onExportPDF, rise
}) => {
    const [y, mStr] = month.split('-');
    const dateObj = new Date(parseInt(y), parseInt(mStr)-1);
    const displayMonth = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <motion.header variants={rise} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-stone-100">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3.5 mb-1">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center transition-transform hover:rotate-12" style={{ backgroundColor: `${PEACH}30`, color: SAGE }}>
                        <PieChart size={14} />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-stone-400">Nexura Audit Core</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
                    Global <span style={{ color: SAGE }}>PnL Reports</span>
                </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200/40">
                    <button
                        onClick={() => setViewMode("monthly")}
                        className={`flex items-center justify-center h-10 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap min-w-[140px] ${viewMode === "monthly" ? "shadow-sm" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"}`}
                        style={viewMode === "monthly" ? { backgroundColor: PEACH, color: RICH_BLACK } : {}}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setViewMode("yearly")}
                        className={`flex items-center justify-center h-10 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap min-w-[140px] ${viewMode === "yearly" ? "shadow-sm" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"}`}
                        style={viewMode === "yearly" ? { backgroundColor: PEACH, color: RICH_BLACK } : {}}
                    >
                        Yearly
                    </button>
                </div>

                <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200/40 ml-2">
                    <button
                        onClick={() => setDisplayMode("cards")}
                        className={`flex items-center justify-center h-10 w-10 rounded-lg transition-all ${displayMode === "cards" ? "bg-white shadow-sm text-stone-900" : "text-stone-400 hover:text-stone-600"}`}
                        title="Card View"
                    >
                        <LayoutDashboard size={16} />
                    </button>
                    <button
                        onClick={() => setDisplayMode("charts")}
                        className={`flex items-center justify-center h-10 w-10 rounded-lg transition-all ${displayMode === "charts" ? "bg-white shadow-sm text-stone-900" : "text-stone-400 hover:text-stone-600"}`}
                        title="Analytics View"
                    >
                        <TrendingUp size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-2 border-l border-stone-200 pl-4 ml-2">
                    <button 
                        onClick={onExportExcel}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-stone-100 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                        title="Export to Excel"
                    >
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={onExportPDF}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-stone-100 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                        title="Export to PDF"
                    >
                        <FileText size={18} />
                    </button>
                </div>

                <div className="relative w-full sm:w-auto">
                    <button 
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center justify-center gap-3 h-10 px-6 rounded-xl text-[13px] font-bold tracking-widest transition-all shadow-sm border border-stone-200/40 hover:bg-white active:scale-95 uppercase w-full sm:min-w-[180px]"
                        style={{ backgroundColor: PEACH, color: RICH_BLACK }}
                    >
                        <Calendar size={16} />
                        {viewMode === "monthly" ? displayMonth : y}
                        <ChevronDown size={14} className={`transition-transform duration-300 ${showDatePicker ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showDatePicker && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full mt-4 right-0 w-80 bg-white rounded-2xl border border-stone-100 shadow-2xl p-6 z-[100]"
                            >
                                <div className={viewMode === "monthly" ? "grid grid-cols-2 gap-6" : "block"}>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Year</p>
                                        <div className="space-y-1">
                                            {YEARS.map(yr => (
                                                <button key={yr} onClick={() => { setMonth(`${yr}-${mStr}`); if(viewMode === "yearly") setShowDatePicker(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${parseInt(y) === yr ? 'bg-stone-900 text-white' : 'hover:bg-stone-50 text-stone-600'}`}>{yr}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {viewMode === "monthly" && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Month</p>
                                            <div className="grid grid-cols-1 max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                                                {MONTHS.map(mth => (
                                                    <button key={mth.v} onClick={() => { setMonth(`${y}-${mth.v}`); setShowDatePicker(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-colors ${mStr === mth.v ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-50 text-stone-500'}`}>{mth.n}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.header>
    );
};
