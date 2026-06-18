import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    PieChart, LayoutDashboard, TrendingUp, Download, FileText, Calendar, ChevronDown, BookOpen
} from "lucide-react";
import { MONTHS, YEARS } from "../usePnL";

interface PNLHeaderProps {
    viewMode: "monthly" | "yearly";
    setViewMode: (m: "monthly" | "yearly") => void;
    displayMode: "cards" | "charts" | "statements";
    setDisplayMode: (m: "cards" | "charts" | "statements") => void;
    month: string;
    setMonth: (m: string) => void;
    showDatePicker: boolean;
    setShowDatePicker: (s: boolean) => void;
    onExportExcel: () => void;
    onExportPDF: () => void;
    rise: any;
    hideDisplayMode?: boolean;
}

const PEACH = "var(--sidebar-link-active-bg)";
const RICH_BLACK = "var(--sidebar-link-active-text)";

export const PNLHeader: React.FC<PNLHeaderProps> = ({
    viewMode, setViewMode, displayMode, setDisplayMode,
    month, setMonth, showDatePicker, setShowDatePicker,
    onExportExcel, onExportPDF, rise, hideDisplayMode = false
}) => {
    const [y, mStr] = month.split('-');
    const dateObj = new Date(parseInt(y), parseInt(mStr)-1);
    const displayMonth = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <motion.header variants={rise} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-stone-100">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3.5 mb-1">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center transition-transform hover:rotate-12 bg-stone-100 dark:bg-[#262626] text-stone-850 dark:text-stone-100">
                        <PieChart size={14} />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-stone-400">Audit Core</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                    Global <span className="text-[var(--sage)]">{hideDisplayMode ? "Financial Statements" : "PnL Reports"}</span>
                </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex p-1 bg-stone-100 dark:bg-[#1a1a1a] rounded-xl border border-stone-200/40 dark:border-[#262626]">
                    <button
                        onClick={() => setViewMode("monthly")}
                        className={`flex items-center justify-center h-10 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap min-w-[140px] ${viewMode === "monthly" ? "shadow-sm" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 dark:hover:text-[#f4f4f5] dark:hover:bg-[#1f1f1f]"}`}
                        style={viewMode === "monthly" ? { backgroundColor: PEACH, color: RICH_BLACK } : {}}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setViewMode("yearly")}
                        className={`flex items-center justify-center h-10 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap min-w-[140px] ${viewMode === "yearly" ? "shadow-sm" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 dark:hover:text-[#f4f4f5] dark:hover:bg-[#1f1f1f]"}`}
                        style={viewMode === "yearly" ? { backgroundColor: PEACH, color: RICH_BLACK } : {}}
                    >
                        Yearly
                    </button>
                </div>

                {!hideDisplayMode && (
                    <div className="flex p-1 bg-stone-100 dark:bg-[#1a1a1a] rounded-xl border border-stone-200/40 dark:border-[#262626] ml-2">
                        <button
                            onClick={() => setDisplayMode("cards")}
                            className={`flex items-center justify-center h-10 w-10 rounded-lg transition-all ${displayMode === "cards" ? "bg-white dark:bg-[#262626] shadow-sm text-stone-900 dark:text-[#f4f4f5]" : "text-stone-400 hover:text-stone-600 dark:text-[#a1a1aa] dark:hover:text-[#f4f4f5] dark:hover:bg-[#1f1f1f]"}`}
                            title="Card View"
                        >
                            <LayoutDashboard size={16} />
                        </button>
                        <button
                            onClick={() => setDisplayMode("charts")}
                            className={`flex items-center justify-center h-10 w-10 rounded-lg transition-all ${displayMode === "charts" ? "bg-white dark:bg-[#262626] shadow-sm text-stone-900 dark:text-[#f4f4f5]" : "text-stone-400 hover:text-stone-600 dark:text-[#a1a1aa] dark:hover:text-[#f4f4f5] dark:hover:bg-[#1f1f1f]"}`}
                            title="Analytics View"
                        >
                            <TrendingUp size={16} />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2 border-l border-stone-200 dark:border-[#262626] pl-4 ml-2">
                    <button 
                        onClick={onExportExcel}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#262626] border border-stone-100 dark:border-[#262626] text-stone-400 hover:text-emerald-600 dark:text-[#a1a1aa] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#1f1f1f] transition-all shadow-sm"
                        title="Export to Excel"
                    >
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={onExportPDF}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#262626] border border-stone-100 dark:border-stone-800/50 text-stone-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all shadow-sm"
                        title="Export to PDF"
                    >
                        <FileText size={18} />
                    </button>
                </div>

                <div className="relative w-full sm:w-auto">
                    <button 
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center justify-center gap-3 h-10 px-6 rounded-xl text-[13px] font-bold tracking-widest transition-all shadow-sm border border-stone-200/40 dark:border-stone-800/50 hover:bg-white dark:hover:bg-[#262626] active:scale-95 uppercase w-full sm:min-w-[180px]"
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
                                className="datepicker-dropdown"
                            >
                                <div className={viewMode === "monthly" ? "datepicker-grid" : "block"}>
                                    <div className="datepicker-column">
                                        <p className="datepicker-header">Year</p>
                                        <div className="datepicker-list">
                                            {YEARS.map(yr => (
                                                <button 
                                                    key={yr} 
                                                    onClick={() => { setMonth(`${yr}-${mStr}`); if(viewMode === "yearly") setShowDatePicker(false); }} 
                                                    className={`datepicker-btn ${parseInt(y) === yr ? 'datepicker-btn-active' : 'datepicker-btn-inactive'}`}
                                                >
                                                    {yr}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {viewMode === "monthly" && (
                                        <div className="datepicker-column">
                                            <p className="datepicker-header">Month</p>
                                            <div className="datepicker-months-scroll custom-scrollbar">
                                                {MONTHS.map(mth => (
                                                    <button 
                                                        key={mth.v} 
                                                        onClick={() => { setMonth(`${y}-${mth.v}`); setShowDatePicker(false); }} 
                                                        className={`datepicker-btn ${mStr === mth.v ? 'datepicker-btn-active' : 'datepicker-btn-inactive'}`}
                                                    >
                                                        {mth.n}
                                                    </button>
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
