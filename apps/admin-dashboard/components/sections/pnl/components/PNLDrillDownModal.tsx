"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, X, Search, TrendingUp, TrendingDown, Hash, FileDown, BarChart2, Equal } from "lucide-react";
import { formatIDR, PnLDetailedItem, DrillDownData } from "@/lib/pnl-utils";
import { SourcePill, DocTag, StatCard, MODAL_TOKENS as T } from "./shared/PnLPrimitives";
import styles from "./PNLDrillDownModal.module.css";

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
        totalDiscount:      number;
        subtotal:           number;
    } | null;
    costConfig:      { costLabel: string; healthyThreshold: number; warningThreshold: number };
    modalBadgeInfo:  { color: string; text: string };
    isKpiCard?: boolean;
    kpiData?: {
        occ: number;
        arr: number;
        revPar: number;
        roomsAvailable: number;
        roomsSold: number;
        totalRooms: number;
        daysInPeriod: number;
        ledgerRoomRevenue: number;
    } | null;
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
    isKpiCard, kpiData,
    drillDownSearchQuery, setDrillDownSearchQuery,
    drillDownTab, setDrillDownTab,
    onExportDrillExcel, month,
}: PNLDrillDownModalProps) {
    const isOtaCard = selectedDrillDown?.title === "OTA Revenue";
    const otaBreakdown = React.useMemo(() => {
        if (!isOtaCard || !selectedDrillDown?.items) return [];
        const map = new Map<string, { channel: string; total: number; count: number }>();
        let grandTotal = 0;
        selectedDrillDown.items.forEach(item => {
            const ch = (item.docType || item.source || "Other OTA").trim();
            const amt = Number(item.amount || 0);
            grandTotal += amt;
            const cur = map.get(ch) || { channel: ch, total: 0, count: 0 };
            cur.total += amt;
            cur.count += 1;
            map.set(ch, cur);
        });
        return Array.from(map.values())
            .map(i => ({
                ...i,
                percent: grandTotal > 0 ? (i.total / grandTotal) * 100 : 0
            }))
            .sort((a, b) => b.total - a.total);
    }, [isOtaCard, selectedDrillDown]);

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
                        zIndex: 100, padding: 16,
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
                            width: "95vw", maxWidth: 1260, maxHeight: "90vh",
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
                                        <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 9px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--f-income-bg)", color: "var(--f-income-color)", border: T.border }}>
                                            Audit
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

                        {/* ── SCROLLABLE BODY ── */}
                        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>

                        {/* ── STATS STRIP ── */}
                        {isFbPerformanceCard && fbPerformanceData ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, padding: "18px 28px", background: T.surface2, borderBottom: T.border, flexShrink: 0 }}>
                                {/* Revenue Breakdown card */}
                                <div style={{ background: T.surface, border: T.border, borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <TrendingUp size={16} className="text-emerald-600" />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>Revenue Breakdown</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textPri }}>
                                        <span className="flex-1">Subtotal (Base Price)</span>
                                        <span style={{ fontFamily: T.mono }}>{formatIDR(fbPerformanceData.subtotal)}</span>
                                    </div>
                                    {fbPerformanceData.totalDiscount > 0 && (
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--f-expense-color)" }}>
                                            <span className="flex-1">Discount</span>
                                            <span style={{ fontFamily: T.mono }}>−{formatIDR(fbPerformanceData.totalDiscount)}</span>
                                        </div>
                                    )}
                                    <div style={{ borderTop: "1px dashed var(--f-hairline)", margin: "4px 0" }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--f-income-color)" }}>
                                        <span className="flex-1">Net Revenue</span>
                                        <span style={{ fontFamily: T.mono }}>{formatIDR(fbPerformanceData.netRevenue)}</span>
                                    </div>
                                    {[
                                        [`Service Charge (${fbPerformanceData.serviceRate}%)`,       `+${formatIDR(fbPerformanceData.serviceCharge)}`,   true],
                                        [`Tax/VAT (${fbPerformanceData.taxRateIndividual}%)`,        `+${formatIDR(fbPerformanceData.taxAmount)}`,        true],
                                        [`Lost & Breakage (${fbPerformanceData.lostBreakageRate}%)`, `+${formatIDR(fbPerformanceData.lostBreakageAmount)}`,true],
                                    ].map(([label, val, dimmed]) => (
                                        <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: dimmed ? T.textSec : T.textPri }}>
                                            <span className="flex-1">{label}</span>
                                            <span style={{ fontFamily: T.mono }}>{val}</span>
                                        </div>
                                    ))}
                                    <div style={{ borderTop: "1px dashed var(--f-hairline)", margin: "4px 0" }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: T.textPri }}>
                                        <span className="flex-1">Gross Revenue</span>
                                        <span style={{ fontFamily: T.mono }}>{formatIDR(fbPerformanceData.grossRevenue)}</span>
                                    </div>
                                </div>

                                {/* Profitability & Expenses card */}
                                <div style={{ background: T.surface, border: T.border, borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <TrendingDown size={16} className="text-rose-600" />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profitability & Expenses</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textPri }}>
                                        <span className="flex-1">Net Revenue</span>
                                        <span style={{ fontFamily: T.mono }}>{formatIDR(fbPerformanceData.netRevenue)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--f-expense-color)" }}>
                                        <span className="flex-1">Expenses (Cost)</span>
                                        <span style={{ fontFamily: T.mono }}>−{formatIDR(fbPerformanceData.expenses)}</span>
                                    </div>
                                    <div style={{ borderTop: "1px dashed var(--f-hairline)", margin: "4px 0", marginTop: "auto" }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: fbPerformanceData.netProfit >= 0 ? "var(--f-income-color)" : "var(--f-expense-color)" }}>
                                        <span className="flex-1">Net Profit</span>
                                        <span style={{ fontFamily: T.mono }}>{formatIDR(fbPerformanceData.netProfit)}</span>
                                    </div>
                                </div>

                                {/* COGS badge card */}
                                <div style={{ background: T.surface, border: T.border, borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.08em" }}>{costConfig.costLabel} Percentage</span>
                                    <span style={{ fontSize: 32, fontWeight: 900, color: T.textPri, fontFamily: T.mono, letterSpacing: "-0.02em" }}>
                                        {fbPerformanceData.costPercentage.toFixed(1)}%
                                    </span>
                                    <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }} className={modalBadgeInfo.color}>
                                        {modalBadgeInfo.text}
                                    </div>
                                </div>
                            </div>
                        ) : isKpiCard && kpiData ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, padding: "18px 28px", background: T.surface2, borderBottom: T.border, flexShrink: 0 }}>
                                {/* Formula Card */}
                                <div style={{ background: T.surface, border: T.border, borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <TrendingUp size={16} className="text-blue-600" />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>{selectedDrillDown.title} Formula</span>
                                    </div>
                                    
                                    {selectedDrillDown.title === "OCC" && (
                                        <>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textPri }}>
                                                <span className="flex-1">Rooms Sold</span>
                                                <span style={{ fontFamily: T.mono }}>{kpiData.roomsSold}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSec }}>
                                                <span className="flex-1">Rooms Available</span>
                                                <span style={{ fontFamily: T.mono }}>÷ {kpiData.roomsAvailable}</span>
                                            </div>
                                            <div style={{ borderTop: "1px dashed var(--f-hairline)", margin: "4px 0" }} />
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--f-income-color)" }}>
                                                <span className="flex-1">Occupancy Rate</span>
                                                <span style={{ fontFamily: T.mono }}>{kpiData.occ.toFixed(1)}%</span>
                                            </div>
                                        </>
                                    )}

                                    {selectedDrillDown.title === "ARR" && (
                                        <>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textPri }}>
                                                <span className="flex-1">Total Room Revenue</span>
                                                <span style={{ fontFamily: T.mono }}>{formatIDR(kpiData.ledgerRoomRevenue)}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSec }}>
                                                <span className="flex-1">Rooms Sold</span>
                                                <span style={{ fontFamily: T.mono }}>÷ {kpiData.roomsSold}</span>
                                            </div>
                                            <div style={{ borderTop: "1px dashed var(--f-hairline)", margin: "4px 0" }} />
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--f-income-color)" }}>
                                                <span className="flex-1">Average Room Rate</span>
                                                <span style={{ fontFamily: T.mono }}>{formatIDR(kpiData.arr)}</span>
                                            </div>
                                        </>
                                    )}

                                    {selectedDrillDown.title === "RevPAR" && (
                                        <>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textPri }}>
                                                <span className="flex-1">Total Room Revenue</span>
                                                <span style={{ fontFamily: T.mono }}>{formatIDR(kpiData.ledgerRoomRevenue)}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSec }}>
                                                <span className="flex-1">Rooms Available</span>
                                                <span style={{ fontFamily: T.mono }}>÷ {kpiData.roomsAvailable}</span>
                                            </div>
                                            <div style={{ borderTop: "1px dashed var(--f-hairline)", margin: "4px 0" }} />
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--f-income-color)" }}>
                                                <span className="flex-1">RevPAR</span>
                                                <span style={{ fontFamily: T.mono }}>{formatIDR(kpiData.revPar)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Period Details Card */}
                                <div style={{ background: T.surface, border: T.border, borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <Hash size={16} className="text-indigo-600" />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>Period Variables</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textPri }}>
                                        <span className="flex-1">Total Physical Rooms</span>
                                        <span style={{ fontFamily: T.mono }}>{kpiData.totalRooms}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSec }}>
                                        <span className="flex-1">Days in Period</span>
                                        <span style={{ fontFamily: T.mono }}>× {kpiData.daysInPeriod}</span>
                                    </div>
                                    <div style={{ borderTop: "1px dashed var(--f-hairline)", margin: "4px 0" }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: T.textPri }}>
                                        <span className="flex-1">Total Rooms Available</span>
                                        <span style={{ fontFamily: T.mono }}>{kpiData.roomsAvailable}</span>
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

                        {/* ── OTA REVENUE CHANNEL BREAKDOWN ── */}
                        {isOtaCard && otaBreakdown.length > 0 && (
                            <div style={{ padding: "14px 28px", background: T.surface2, borderBottom: T.border, flexShrink: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            Breakdown Revenue per Channel OTA
                                        </span>
                                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", fontWeight: 700, fontFamily: T.mono }}>
                                            {otaBreakdown.length} Channels
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, color: T.textSec }}>
                                        Klik kartu channel untuk memfilter data transaksi
                                    </span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                                    {otaBreakdown.map((ch) => {
                                        const isActive = drillDownSearchQuery.toLowerCase() === ch.channel.toLowerCase();
                                        return (
                                            <button
                                                key={ch.channel}
                                                type="button"
                                                onClick={() => setDrillDownSearchQuery(isActive ? "" : ch.channel)}
                                                style={{
                                                    padding: "10px 14px",
                                                    borderRadius: 10,
                                                    border: isActive ? "2px solid #8b5cf6" : T.border,
                                                    background: isActive ? "rgba(139, 92, 246, 0.1)" : T.surface,
                                                    boxShadow: isActive ? "0 0 0 1px #8b5cf6" : "none",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 4,
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: T.textPri, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {ch.channel}
                                                    </span>
                                                    <span style={{ fontSize: 10, fontFamily: T.mono, color: "#8b5cf6", fontWeight: 700 }}>
                                                        {ch.percent.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--f-income-color, #059669)", fontFamily: T.mono }}>
                                                    {formatIDR(ch.total)}
                                                </div>
                                                <div style={{ fontSize: 10, color: T.textSec, display: "flex", justifyContent: "space-between" }}>
                                                    <span>{ch.count} {ch.count === 1 ? "booking" : "bookings"}</span>
                                                    {isActive && <span style={{ color: "#8b5cf6", fontWeight: 600 }}>Active Filter ✕</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
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
                        <div style={{ flex: 1 }}>
                            {/* Desktop */}
                            <div className={styles.desktopView}>
                                {(() => {
                                    const titleStr = (selectedDrillDown?.title || "").toLowerCase();
                                    const isRoomSection = titleStr.includes("room") || 
                                                          titleStr.includes("cash in hotel") || 
                                                          titleStr.includes("ota revenue") ||
                                                          titleStr.includes("direct cashless") ||
                                                          titleStr.includes("occ") ||
                                                          titleStr.includes("arr") ||
                                                          titleStr.includes("revpar") ||
                                                          (modalData?.filtered || []).some(i => i.department === "Rooms" || !!i.ratePlan || !!i.breakfastAmount);
                                    const deductionColLabel = isRoomSection ? "Breakfast Allocation" : "Deduction";
                                    const fourthColLabel = isRoomSection ? "Rate Plan" : "Dept";
                                    const amountColLabel = isRoomSection ? "Net Room Rev" : "Amount";

                                    return (
                                        <table style={{ width: "100%", minWidth: 1060, borderCollapse: "collapse", tableLayout: "fixed" }}>
                                            <colgroup>
                                                <col style={{ width: 44 }} />
                                                <col style={{ width: 140 }} />
                                                <col />
                                                <col style={{ width: 140 }} />
                                                <col style={{ width: 155 }} />
                                                <col style={{ width: 155 }} />
                                                <col style={{ width: 150 }} />
                                                <col style={{ width: 105 }} />
                                            </colgroup>
                                            <thead>
                                                <tr style={{ background: T.surface2, borderBottom: T.border, position: "sticky", top: 0, zIndex: 1 }}>
                                                    {[
                                                        { label: "#", align: "left" },
                                                        { label: "Source", align: "left" },
                                                        { label: "Description", align: "left" },
                                                        { label: fourthColLabel, align: "left" },
                                                        { label: "Document", align: "left" },
                                                        { label: deductionColLabel, align: "right" },
                                                        { label: amountColLabel, align: "right" },
                                                        { label: "Date", align: "left" },
                                                    ].map((col) => (
                                                        <th key={col.label} style={{ padding: "10px 14px", fontSize: 10, fontWeight: 600, color: T.textSec, textAlign: col.align as any, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                                                            {col.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {modalData.filtered.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} style={{ textAlign: "center", padding: "64px 16px", color: T.textSec, fontSize: 13 }}>
                                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                                                <Receipt size={28} style={{ opacity: 0.3 }} />
                                                                <span>No transaction logs matching filters</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    modalData.filtered.map((item: PnLDetailedItem, index: number) => {
                                                        const isExpense = item.type === "expense";
                                                        const isCancelled = !!(item as any).isCancelled;
                                                        const deductionAmount = (item.breakfastAmount && item.breakfastAmount > 0)
                                                            ? item.breakfastAmount
                                                            : (item.discount && item.discount > 0 ? item.discount : 0);

                                                        return (
                                                            <tr
                                                                key={`${item.id || 'item'}-${item.date || ''}-${index}`}
                                                                style={{
                                                                    borderBottom: T.border,
                                                                    ...(isCancelled ? { textDecoration: 'line-through', opacity: 0.45 } : {})
                                                                }}
                                                                onMouseEnter={(e) => (e.currentTarget.style.background = T.surface2)}
                                                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                            >
                                                                <td style={{ padding: "12px 14px", fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{index + 1}</td>
                                                                <td style={{ padding: "12px 14px", overflow: "hidden", maxWidth: 145 }}>
                                                                    <SourcePill label={item.source ?? "—"} />
                                                                </td>
                                                                <td style={{ padding: "12px 14px", fontSize: 13, color: T.textPri, overflow: "hidden" }}>
                                                                    <div style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontWeight: 500 }} title={item.description}>
                                                                        {item.description}
                                                                        {isCancelled && <span style={{ marginLeft: 6, fontSize: 10, color: '#ef4444', fontWeight: 700, textDecoration: 'none' }}>[CANCEL]</span>}
                                                                    </div>
                                                                    {!isCancelled && item.taxAmount !== undefined && item.taxAmount > 0 && (
                                                                        <div style={{ fontSize: 10, color: T.textSec, marginTop: 4, display: "flex", gap: 6, alignItems: "center" }}>
                                                                            <span>Net: {formatIDR(item.nettAmount || 0)}</span>
                                                                            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "currentColor", opacity: 0.4 }} />
                                                                            <span>Tax &amp; Serv: {formatIDR(item.taxAmount)}</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: "12px 14px", overflow: "hidden", maxWidth: 140 }}>
                                                                    {isRoomSection ? (
                                                                        item.ratePlan ? (
                                                                            <span
                                                                                style={{
                                                                                    display: "inline-block",
                                                                                    maxWidth: "100%",
                                                                                    fontSize: 10.5,
                                                                                    fontWeight: 600,
                                                                                    padding: "2px 8px",
                                                                                    borderRadius: 5,
                                                                                    background: item.ratePlan.toLowerCase().includes("bb") || item.ratePlan.toLowerCase().includes("breakfast")
                                                                                        ? "rgba(245, 158, 11, 0.12)"
                                                                                        : "rgba(59, 130, 246, 0.1)",
                                                                                    color: item.ratePlan.toLowerCase().includes("bb") || item.ratePlan.toLowerCase().includes("breakfast")
                                                                                        ? "#b45309"
                                                                                        : "#1d4ed8",
                                                                                    border: item.ratePlan.toLowerCase().includes("bb") || item.ratePlan.toLowerCase().includes("breakfast")
                                                                                        ? "1px solid rgba(245, 158, 11, 0.3)"
                                                                                        : "1px solid rgba(59, 130, 246, 0.22)",
                                                                                    whiteSpace: "nowrap",
                                                                                    overflow: "hidden",
                                                                                    textOverflow: "ellipsis",
                                                                                    boxSizing: "border-box",
                                                                                }}
                                                                                title={`Rate Plan: ${item.ratePlan}`}
                                                                            >
                                                                                {item.ratePlan}
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ color: T.textSec, fontSize: 12 }}>—</span>
                                                                        )
                                                                    ) : (
                                                                        <span style={{ fontSize: 12, color: T.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block", maxWidth: "100%" }} title={item.department ?? ""}>
                                                                            {item.department ?? "—"}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: "12px 14px", overflow: "hidden", maxWidth: 160 }}>
                                                                    {item.docType ? <DocTag label={item.docType} /> : <span style={{ color: T.textSec, fontSize: 12 }}>—</span>}
                                                                </td>
                                                                <td style={{ padding: "12px 14px", fontSize: 12, textAlign: "right", fontFamily: T.mono, whiteSpace: "nowrap" }}>
                                                                    {deductionAmount > 0 ? (
                                                                        <span
                                                                            style={{
                                                                                color: item.breakfastAmount && item.breakfastAmount > 0 ? "#dc2626" : "var(--f-expense-color)",
                                                                                fontWeight: 600,
                                                                            }}
                                                                            title={item.breakfastAmount && item.breakfastAmount > 0 ? "Alokasi Sarapan (Masuk Pendapatan F&B)" : "Discount / Deduction"}
                                                                        >
                                                                            −{formatIDR(deductionAmount)}
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ color: T.textSec }}>—</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, textAlign: "right", fontFamily: T.mono, color: isCancelled ? T.textSec : (isExpense ? "var(--f-expense-color)" : "var(--f-income-color)") }}>
                                                                    <div>{isCancelled ? "—" : (isExpense ? "−" : "+")}{!isCancelled && formatIDR(item.amount)}</div>
                                                                </td>
                                                                <td style={{ padding: "12px 14px", fontSize: 11, color: T.textSec, fontFamily: T.mono, whiteSpace: "nowrap" }}>{item.date ?? "N/A"}</td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    );
                                })()}
                            </div>

                            {/* Mobile cards */}
                            <div className={styles.mobileView}>
                                {modalData.filtered.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "60px 16px", color: T.textSec, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                        <Receipt size={28} style={{ opacity: 0.3 }} />
                                        <span>No transaction logs found</span>
                                    </div>
                                ) : (
                                    modalData.filtered.map((item: PnLDetailedItem, index: number) => {
                                        const isExpense = item.type === "expense";
                                        const isCancelled = !!(item as any).isCancelled;
                                        return (
                                            <motion.div
                                                key={`${item.id || 'item'}-${item.date || ''}-${index}`}
                                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.18, delay: Math.min(index * 0.012, 0.25) }}
                                                style={{
                                                    background: T.surface,
                                                    border: T.border,
                                                    borderRadius: T.radius,
                                                    padding: 16,
                                                    ...(isCancelled ? { textDecoration: 'line-through', opacity: 0.45 } : {})
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                                    <SourcePill label={item.source ?? "—"} />
                                                    <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{item.date ?? "N/A"}</span>
                                                </div>
                                                <p style={{ fontSize: 13, fontWeight: 500, color: T.textPri, marginBottom: 8, lineHeight: 1.4 }}>
                                                    {item.description}
                                                    {isCancelled && <span style={{ marginLeft: 6, fontSize: 10, color: '#ef4444', fontWeight: 700, textDecoration: 'none' }}>[CANCEL]</span>}
                                                </p>
                                                {(item.ratePlan || (item.breakfastAmount && item.breakfastAmount > 0)) && (
                                                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                                                        {item.ratePlan && (
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 600,
                                                                    padding: "1.5px 7px",
                                                                    borderRadius: 4,
                                                                    background: item.ratePlan.toLowerCase().includes("bb") || item.ratePlan.toLowerCase().includes("breakfast")
                                                                        ? "rgba(245, 158, 11, 0.12)"
                                                                        : "rgba(59, 130, 246, 0.1)",
                                                                    color: item.ratePlan.toLowerCase().includes("bb") || item.ratePlan.toLowerCase().includes("breakfast")
                                                                        ? "#b45309"
                                                                        : "#1d4ed8",
                                                                    border: item.ratePlan.toLowerCase().includes("bb") || item.ratePlan.toLowerCase().includes("breakfast")
                                                                        ? "1px solid rgba(245, 158, 11, 0.28)"
                                                                        : "1px solid rgba(59, 130, 246, 0.22)"
                                                                }}
                                                            >
                                                                Plan: {item.ratePlan}
                                                            </span>
                                                        )}
                                                        {item.breakfastAmount && item.breakfastAmount > 0 ? (
                                                             <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 500,
                                                                    padding: "1.5px 7px",
                                                                    borderRadius: 4,
                                                                    background: "rgba(239, 68, 68, 0.08)",
                                                                    color: "#dc2626",
                                                                    border: "1px solid rgba(239, 68, 68, 0.2)"
                                                                }}
                                                                title="Alokasi Sarapan (Masuk Pendapatan F&B)"
                                                            >
                                                                Breakfast Allocation: −{formatIDR(item.breakfastAmount)}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                )}
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: T.border }}>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.textSec, marginBottom: 2 }}>Department</p>
                                                        <p style={{ fontSize: 12, fontWeight: 500, color: T.textPri }}>{item.department ?? "—"}</p>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <p style={{ fontSize: 10, color: T.textSec, marginBottom: 2 }}>Amount</p>
                                                        <p style={{ fontSize: 14, fontWeight: 500, fontFamily: T.mono, color: isCancelled ? T.textSec : (isExpense ? "var(--f-expense-color)" : "var(--f-income-color)") }}>
                                                            {isCancelled ? "—" : (isExpense ? "−" : "+")}{!isCancelled && formatIDR(item.amount)}
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
                        </div>{/* end scrollable body */}
                        {modalData.filtered.length > 0 && (
                            <div style={{ padding: "14px 28px", borderTop: T.border, background: T.surface2, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                                <span style={{ fontSize: 12, color: T.textSec }}>
                                    Summary · {modalData.filtered.length} records
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 12, color: T.textSec }}>
                                        {isFbPerformanceCard ? "Net Profit" : "Net flow"}
                                    </span>
                                    <span style={{ fontSize: 16, fontWeight: 500, fontFamily: T.mono, color: (isFbPerformanceCard ? (fbPerformanceData?.netProfit ?? 0) : modalData.netFlow) >= 0 ? "var(--f-income-color)" : "var(--f-expense-color)" }}>
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
