import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, TrendingUp, Download, FileText, Calendar, ChevronDown
} from "lucide-react";
import { MONTHS, YEARS } from "../usePnL";
import s from "./PNLHeader.module.css";

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

export const PNLHeader: React.FC<PNLHeaderProps> = ({
    viewMode, setViewMode, displayMode, setDisplayMode,
    month, setMonth, showDatePicker, setShowDatePicker,
    onExportExcel, onExportPDF, rise, hideDisplayMode = false
}) => {
    const [y, mStr] = month.split('-');
    const dateObj = new Date(parseInt(y), parseInt(mStr)-1);
    const displayMonth = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <motion.header variants={rise} className={s.headerContainer}>
            {/* Top Enterprise Ribbon */}
            <div className={s.topRibbon}>
                <div className={s.ribbonLeft}>
                    <span className={s.ribbonBadge}>
                        HOTEL ENTERPRISE PMS
                    </span>
                    <span className={s.ribbonDivider}>|</span>
                    <span className={s.ribbonTitle}>
                        FINANCIAL AUDIT CONSOLE · ACCOUNTING MODULE
                    </span>
                </div>
                <div className={s.statusLive}>
                    <span className={s.statusDot} />
                    <span>STATUS: ACTIVE AUDIT / LIVE LEDGER</span>
                </div>
            </div>

            {/* Accounting Modules Switcher Bar */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "4px 0 8px 0" }}>
                <Link
                    href="/pnl?module=accounting"
                    style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textDecoration: "none",
                        backgroundColor: "#1e4d3a",
                        color: "#ffffff",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                >
                    P&amp;L Live Ledger
                </Link>
                <Link
                    href="/pnl-budget?module=accounting"
                    style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        textDecoration: "none",
                        backgroundColor: "#f8fafc",
                        color: "#475569",
                        border: "1px solid #cbd5e1"
                    }}
                >
                    P&amp;L Actual vs Budget
                </Link>
                <Link
                    href="/budgeting?module=accounting"
                    style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        textDecoration: "none",
                        backgroundColor: "#f8fafc",
                        color: "#475569",
                        border: "1px solid #cbd5e1"
                    }}
                >
                    Budgeting &amp; DSR
                </Link>
            </div>

            {/* Main Header Title & Export Actions */}
            <div className={s.titleBar}>
                <div className={s.titleArea}>
                    <h1 className={s.mainHeading}>
                        PROFIT &amp; LOSS <span className={s.mainHeadingAccent}>{hideDisplayMode ? "FINANCIAL STATEMENTS" : "STATEMENT"}</span>
                    </h1>
                    <p className={s.subHeading}>
                        Operational Profit &amp; Loss Statement · Direct Operating Cost Ledger &amp; Departmental Audit Console
                    </p>
                </div>

                {/* Export Actions (Pinned Top-Right) */}
                <div className={s.exportGroup}>
                    <button 
                        onClick={onExportExcel}
                        className={s.exportBtn}
                        title="Export to Excel (.xlsx)"
                    >
                        <Download size={13} style={{ color: "#1e4d3a" }} />
                        <span>Excel</span>
                    </button>
                    <button 
                        onClick={onExportPDF}
                        className={`${s.exportBtn} ${s.exportBtnPDF}`}
                        title="Export to PDF (.pdf)"
                    >
                        <FileText size={13} style={{ color: "#e11d48" }} />
                        <span>PDF</span>
                    </button>
                </div>
            </div>

            {/* Dedicated Executive Filter Toolbar Strip */}
            <div className={s.filterStrip}>
                <div className={s.filterLeftGroup}>
                    {/* Monthly / Yearly Switcher */}
                    <div className={s.segmentedTrack}>
                        <button
                            onClick={() => setViewMode("monthly")}
                            className={`${s.segmentedTab} ${viewMode === "monthly" ? s.segmentedTabActive : ""}`}
                        >
                            Monthly Ledger
                        </button>
                        <button
                            onClick={() => setViewMode("yearly")}
                            className={`${s.segmentedTab} ${viewMode === "yearly" ? s.segmentedTabActive : ""}`}
                        >
                            Annual Consolidation
                        </button>
                    </div>

                    {/* Display Mode (Cards / Charts) */}
                    {!hideDisplayMode && (
                        <div className={s.modeTrack}>
                            <button
                                onClick={() => setDisplayMode("cards")}
                                className={`${s.modeBtn} ${displayMode === "cards" ? s.modeBtnActive : ""}`}
                                title="Summary Cards View"
                            >
                                <LayoutDashboard size={13} />
                                <span>Cards</span>
                            </button>
                            <button
                                onClick={() => setDisplayMode("charts")}
                                className={`${s.modeBtn} ${displayMode === "charts" ? s.modeBtnActive : ""}`}
                                title="Trend Analysis View"
                            >
                                <TrendingUp size={13} />
                                <span>Trends</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side: Period Selector / Calendar (Completely away from sidebar) */}
                <div style={{ position: "relative" }}>
                    <button 
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={s.periodBtn}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                            <Calendar size={13} className={s.periodIcon} />
                            <span>{viewMode === "monthly" ? displayMonth : `YEAR ${y}`}</span>
                        </span>
                        <ChevronDown size={13} style={{ opacity: 0.6, transform: showDatePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
