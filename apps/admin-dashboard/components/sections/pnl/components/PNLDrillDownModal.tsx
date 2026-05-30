"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, X, Search, TrendingUp, TrendingDown, Hash, FileDown, BarChart2, Equal } from "lucide-react";
import { formatIDR, PnLDetailedItem, DrillDownData } from "@/lib/pnl-utils";
import { SourcePill, DocTag, StatCard, MODAL_TOKENS as T } from "./shared/PnLPrimitives";

const TABS = [
    { value: "all"     as const, label: "All logs"  },
    { value: "income"  as const, label: "Incomes"   },
    { value: "expense" as const, label: "Expenses"  },
];

interface PNLDrillDownModalProps {
    isOpen:              boolean;
    onClose:             () => void;
    selectedDrillDown:   DrillDownData | null;
    modalData: {
        searched:     PnLDetailedItem[];
        filtered:     PnLDetailedItem[];
        totalIncome:  number;
        totalExpense: number;
        netFlow:      number;
    } | null;
    isFbPerformanceCard:  boolean;
    fbPerformanceData: {
        grossRevenue:       number;
        netRevenue:         number;
        serviceCharge:      number;
        serviceRate:        number;
        taxAmount:          number;
        taxRateIndividual:  number;
        lostBreakageAmount: number;
        lostBreakageRate:   number;
        expenses:           number;
        netProfit:          number;
        costPercentage:     number;
    } | null;
    costConfig:      { costLabel: string; healthyThreshold: number; warningThreshold: number };
    modalBadgeInfo:  { color: string; text: string };
    drillDownSearchQuery: string;
    setDrillDownSearchQuery: (q: string) => void;
    drillDownTab:     "all" | "income" | "expense";
    setDrillDownTab:  (t: "all" | "income" | "expense") => void;
    onExportDrillExcel: () => void;
    month: string;
}

export function PNLDrillDownModal({
    isOpen, onClose, selectedDrillDown, modalData,
    isFbPerformanceCard, fbPerformanceData, costConfig, modalBadgeInfo,
    drillDownSearchQuery, setDrillDownSearchQuery,
    drillDownTab, setDrillDownTab,
    onExportDrillExcel, month,
}: PNLDrillDownModalProps) {
    return (
        <AnimatePresence>
            {isOpen && selectedDrillDown && modalData && (
                <motion.div
                    key="dd-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={onClose}
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 50, padding: 16,
                    }}
                >
                    <motion.div
                        key="dd-panel"
                        initial={{ opacity: 0, scale: 0.97, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 20 }}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: T.surface, border: T.borderSm, borderRadius: 14,
                            width: "100%", maxWidth: 900, maxHeight: "90vh",
                            display: "flex", flexDirection: "column", overflow: "hidden",
                        }}
                    >
                        {/* ── HEADER ── */}
                        <div style={{ padding: "22px 28px 18px", borderBottom: T.border, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 42, height: 42, background: T.surface2, border: T.border, borderRadius: T.radius, display: "flex", alignItems: "center", justifyContent: "center", color: T.textSec, flexShrink: 0 }}>
                                    <BarChart2 size={20} />
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                                        <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 9px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em", background: "#E1F5EE", color: "#0F6E56", border: "0.5px solid #9FE1CB" }}>
                                            Nexura Audit
                                        </span>
                                        <span style={{ fontSize: 10, fontWeight: 400, padding: "2px 9px", borderRadius: 99, fontFamily: T.mono, background: T.surface2, color: T.textSec, border: T.border }}>
                                            {month}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: 16, fontWeight: 500, color: T.textPri, lineHeight: 1.3 }}>
                                        {selectedDrillDown.title}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Tutup modal"
                                style={{ width: 32, height: 32, background: T.surface2, border: T.border, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textSec, flexShrink: 0 }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* ── STATS STRIP ── */}
                        {isFbPerformanceCard && fbPerformanceData ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, padding: "18px 28px", background: T.surface2, borderBottom: T.border, flexShrink: 0 }}>
                                {/* Revenue Breakdown card */}
                                <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <TrendingUp size={16} className="text-emerald-600" />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>Revenue Breakdown</span>
                                    </div>
                                    {[
                                        ["Gross Revenue",                          formatIDR(fbPerformanceData.grossRevenue),       false],
                                        [`Service Charge (${fbPerformanceData.serviceRate}%)`,       `−${formatIDR(fbPerformanceData.serviceCharge)}`,   true],
                                        [`Tax/VAT (${fbPerformanceData.taxRateIndividual}%)`,        `−${formatIDR(fbPerformanceData.taxAmount)}`,        true],
                                        [`Lost & Breakage (${fbPerformanceData.lostBreakageRate}%)`, `−${formatIDR(fbPerformanceData.lostBreakageAmount)}`,true],
                                    ].map(([label, val, dimmed]) => (
                                        <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: dimmed ? "#666" : "#444" }}>
                                            <span className="flex-1">{label}</span>
                                            <span style={{ fontFamily: T.mono }}>{val}</span>
                                        </div>
                                    ))}
                                    <div style={{ borderTop: "1px dashed rgba(0,0,0,0.1)", margin: "4px 0" }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#0F6E56" }}>
                                        <span className="flex-1">Nett Revenue</span>
                                        <span style={{ fontFamily: T.mono }}>{formatIDR(fbPerformanceData.netRevenue)}</span>
                                    </div>
                                </div>

                                {/* Profitability & Expenses card */}
                                <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <TrendingDown size={16} className="text-rose-600" />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profitability & Expenses</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#444" }}>
                                        <span className="flex-1">Nett Revenue</span>
                                        <span style={{ fontFamily: T.mono }}>{formatIDR(fbPerformanceData.netRevenue)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#A32D2D" }}>
                                        <span className="flex-1">Expenses (Cost)</span>
                                        <span style={{ fontFamily: T.mono }}>−{formatIDR(fbPerformanceData.expenses)}</span>
                                    </div>
                                    <div style={{ borderTop: "1px dashed rgba(0,0,0,0.1)", margin: "4px 0", marginTop: "auto" }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: fbPerformanceData.netProfit >= 0 ? "#0F6E56" : "#A32D2D" }}>
                                        <span className="flex-1">Net Profit</span>
                                        <span style={{ fontFamily: T.mono }}>{formatIDR(fbPerformanceData.netProfit)}</span>
                                    </div>
                                </div>

                                {/* COGS badge card */}
                                <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>{costConfig.costLabel} Percentage</span>
                                    <span style={{ fontSize: 32, fontWeight: 900, color: "#1c1917", fontFamily: T.mono, letterSpacing: "-0.02em" }}>
                                        {fbPerformanceData.costPercentage.toFixed(1)}%
                                    </span>
                                    <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }} className={modalBadgeInfo.color}>
                                        {modalBadgeInfo.text}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${
                                        modalData.totalIncome > 0 && modalData.totalExpense > 0 ? 4
                                        : modalData.totalIncome > 0 || modalData.totalExpense > 0 ? 3
                                        : 2
                                    }, 1fr)`,
                                    gap: 10, padding: "14px 28px",
                                    background: T.surface2, borderBottom: T.border, flexShrink: 0,
                                }}
                            >
                                <StatCard icon={Hash} label="Total records" value={String(modalData.searched.length)} />
                                {modalData.totalIncome > 0  && <StatCard icon={TrendingUp}   label="Gross income"      value={formatIDR(modalData.totalIncome)}  variant="income"  />}
                                {modalData.totalExpense > 0 && <StatCard icon={TrendingDown}  label="Total expenses"    value={formatIDR(modalData.totalExpense)} variant="expense" />}
                                <StatCard
                                    icon={Equal}
                                    label="Net dynamic payout"
                                    value={
                                        modalData.totalIncome > 0
                                            ? `${formatIDR(Math.abs(modalData.netFlow))} (${modalData.netFlow >= 0 ? "+" : "-"}${Math.abs((modalData.netFlow / modalData.totalIncome) * 100).toFixed(1)}%)`
                                            : formatIDR(Math.abs(modalData.netFlow))
                                    }
                                    variant={modalData.netFlow >= 0 ? "income" : "expense"}
                                />
                            </div>
                        )}

                        {/* ── CONTROLS ── */}
                        <div style={{ padding: "12px 28px", borderBottom: T.border, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
                            {/* Tabs */}
                            <div style={{ display: "flex", gap: 3, background: T.surface2, padding: 3, borderRadius: T.radius, border: T.border }}>
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setDrillDownTab(tab.value)}
                                        style={{
                                            padding: "5px 14px", fontSize: 12, fontWeight: 500,
                                            border: drillDownTab === tab.value ? T.border : "none",
                                            background: drillDownTab === tab.value ? T.surface : "transparent",
                                            color: drillDownTab === tab.value ? T.textPri : T.textSec,
                                            borderRadius: 7, cursor: "pointer", transition: "all .15s",
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Search + Export */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                                    <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.textSec, flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        placeholder="Filter description, source, dept…"
                                        value={drillDownSearchQuery}
                                        onChange={(e) => setDrillDownSearchQuery(e.target.value)}
                                        aria-label="Search transactions"
                                        style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 34, paddingRight: 12, fontSize: 12, width: 240, borderRadius: 8, border: T.borderSm, background: T.surface, color: T.textPri, outline: "none", fontFamily: "inherit" }}
                                    />
                                </div>
                                <button
                                    onClick={onExportDrillExcel}
                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 12, fontWeight: 500, background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                    <FileDown size={13} /> Export
                                </button>
                            </div>
                        </div>

                        {/* ── TABLE ── */}
                        <div style={{ overflowY: "auto", flex: 1 }}>
                            {/* Desktop */}
                            <div className="hidden md:block">
                                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                                    <colgroup>
                                        <col style={{ width: 44 }} /><col style={{ width: 114 }} />
                                        <col /><col style={{ width: 94 }} />
                                        <col style={{ width: 128 }} /><col style={{ width: 138 }} />
                                        <col style={{ width: 72 }} />
                                    </colgroup>
                                    <thead>
                                        <tr style={{ background: T.surface2, borderBottom: T.border, position: "sticky", top: 0, zIndex: 1 }}>
                                            {(["#", "Source", "Description", "Dept", "Document", "Amount", "Date"] as const).map((col, i) => (
                                                <th key={col} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 500, color: T.textSec, textAlign: i === 5 ? "right" : "left", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalData.filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} style={{ textAlign: "center", padding: "64px 16px", color: T.textSec, fontSize: 13 }}>
                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                                        <Receipt size={28} style={{ opacity: 0.3 }} />
                                                        <span>No transaction logs matching filters</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            modalData.filtered.map((item: PnLDetailedItem, index: number) => {
                                                const isExpense = item.type === "expense";
                                                return (
                                                    <motion.tr
                                                        key={item.id ?? index}
                                                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.18, delay: Math.min(index * 0.012, 0.25) }}
                                                        style={{ borderBottom: T.border }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
                                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                    >
                                                        <td style={{ padding: "13px 16px", fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{index + 1}</td>
                                                        <td style={{ padding: "13px 16px" }}><SourcePill label={item.source ?? "—"} /></td>
                                                        <td title={item.description} style={{ padding: "13px 16px", fontSize: 13, color: T.textPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</td>
                                                        <td style={{ padding: "13px 16px", fontSize: 12, color: T.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.department ?? "—"}</td>
                                                        <td style={{ padding: "13px 16px" }}>
                                                            {item.docType ? <DocTag label={item.docType} /> : <span style={{ color: T.textSec, fontSize: 12 }}>—</span>}
                                                        </td>
                                                        <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 500, textAlign: "right", fontFamily: T.mono, color: isExpense ? "#A32D2D" : "#0F6E56" }}>
                                                            {isExpense ? "−" : "+"}{formatIDR(item.amount)}
                                                        </td>
                                                        <td style={{ padding: "13px 16px", fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{item.date ?? "N/A"}</td>
                                                    </motion.tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                                {modalData.filtered.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "60px 16px", color: T.textSec, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                        <Receipt size={28} style={{ opacity: 0.3 }} />
                                        <span>No transaction logs found</span>
                                    </div>
                                ) : (
                                    modalData.filtered.map((item: PnLDetailedItem, index: number) => {
                                        const isExpense = item.type === "expense";
                                        return (
                                            <motion.div
                                                key={item.id ?? index}
                                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.18, delay: Math.min(index * 0.012, 0.25) }}
                                                style={{ background: T.surface, border: T.border, borderRadius: T.radius, padding: 16 }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                                    <SourcePill label={item.source ?? "—"} />
                                                    <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{item.date ?? "N/A"}</span>
                                                </div>
                                                <p style={{ fontSize: 13, fontWeight: 500, color: T.textPri, marginBottom: 12, lineHeight: 1.4 }}>{item.description}</p>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: T.border }}>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.textSec, marginBottom: 2 }}>Department</p>
                                                        <p style={{ fontSize: 12, fontWeight: 500, color: T.textPri }}>{item.department ?? "—"}</p>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <p style={{ fontSize: 10, color: T.textSec, marginBottom: 2 }}>Net amount</p>
                                                        <p style={{ fontSize: 14, fontWeight: 500, fontFamily: T.mono, color: isExpense ? "#A32D2D" : "#0F6E56" }}>
                                                            {isExpense ? "−" : "+"}{formatIDR(item.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* ── FOOTER ── */}
                        {modalData.filtered.length > 0 && (
                            <div style={{ padding: "14px 28px", borderTop: T.border, background: T.surface2, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                                <span style={{ fontSize: 12, color: T.textSec }}>
                                    Summary · {modalData.filtered.length} records
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 12, color: T.textSec }}>
                                        {isFbPerformanceCard ? "Net Profit" : "Net flow"}
                                    </span>
                                    <span style={{ fontSize: 16, fontWeight: 500, fontFamily: T.mono, color: (isFbPerformanceCard ? (fbPerformanceData?.netProfit ?? 0) : modalData.netFlow) >= 0 ? "#0F6E56" : "#A32D2D" }}>
                                        {formatIDR(Math.abs(isFbPerformanceCard ? (fbPerformanceData?.netProfit ?? 0) : modalData.netFlow))}
                                    </span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
