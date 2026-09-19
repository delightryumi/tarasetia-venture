import React from "react";
import { motion } from "framer-motion";
import { 
    ResponsiveContainer, PieChart as RePie, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, Tooltip,
    AreaChart, Area, CartesianGrid
} from 'recharts';
import { 
    TrendingUp, BarChart3, PieChart as PieChartIcon, 
    Hotel, DollarSign, Activity, Percent, ArrowUpRight, ShieldCheck
} from "lucide-react";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { TrendDataItem, MultiYearTrendDataItem } from "../types";
import styles from "./PNLCharts.module.css";

interface PNLChartsProps {
    viewMode: "monthly" | "yearly";
    pnlResult: GlobalPnLResult | null;
    yearTrendData: TrendDataItem[];
    multiYearTrendData: MultiYearTrendDataItem[];
    monthStr: string;
    yearStr: string;
    formatIDR: (v: number) => string;
}

// International Hotel Executive Palette
const HOTEL_PALETTE = {
    pine: "#1e4d3a",
    sage: "#285f47",
    amber: "#d97706",
    indigo: "#4f46e5",
    rose: "#e11d48",
    cyan: "#0891b2",
    slate: "#64748b",
    lightInactive: "#e2e8f0",
    darkInactive: "#334155",
    netGreen: "#15803d"
};

// Custom High-Density Tooltip for Charts
const HotelChartTooltip = ({ active, payload, label, formatIDR, baseRev }: any) => {
    if (active && payload && payload.length) {
        const item = payload[0];
        const val = Number(item.value) || 0;
        const pct = baseRev && baseRev > 0 ? ((val / baseRev) * 100).toFixed(1) : null;
        
        return (
            <div style={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "8px 12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.25)",
                color: "#f8fafc",
                fontSize: "11px",
                fontFamily: "Inter, sans-serif"
            }}>
                <div style={{ fontWeight: 700, color: "#94a3b8", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "10px" }}>
                    {label || item.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ 
                        width: "8px", 
                        height: "8px", 
                        borderRadius: "2px", 
                        background: item.payload?.fill || item.color || HOTEL_PALETTE.pine 
                    }} />
                    <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#ffffff" }}>
                        {formatIDR(val)}
                    </span>
                    {pct && (
                        <span style={{ 
                            fontSize: "10px", 
                            fontWeight: 700, 
                            color: "#34d399", 
                            background: "rgba(52, 211, 153, 0.15)",
                            padding: "1px 5px",
                            borderRadius: "3px"
                        }}>
                            {pct}%
                        </span>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export const PNLCharts: React.FC<PNLChartsProps> = ({
    viewMode, pnlResult, yearTrendData, multiYearTrendData, monthStr, yearStr, formatIDR
}) => {
    // ── Hotel Accounting Revenue Centers ──
    const totalRev = pnlResult?.card1_TotalRevenue || 0;
    const roomRev = pnlResult?.revRoom || pnlResult?.ledgerRoomRevenue || 0;
    const fnbAlacarteRev = pnlResult?.revTotalFnb || ((pnlResult?.revFood || 0) + (pnlResult?.revBeverage || 0)) || 0;
    const banquetRev = pnlResult?.revBanquet || pnlResult?.revBanquetRevenue || 0;
    const otherDeptRev = pnlResult?.card5_OtherRevenue || 0;
    const nonCommRev = pnlResult?.card2_NonCommRevenue || 0;

    // Revenue Mix Data Array
    const rawRevenueMix = [
        { name: "Rooms Division", value: roomRev, color: HOTEL_PALETTE.pine, code: "ROOMS" },
        { name: "Food & Beverage (A la Carte)", value: fnbAlacarteRev, color: HOTEL_PALETTE.amber, code: "F&B" },
        { name: "Banquet & Events", value: banquetRev, color: "#b45309", code: "BANQUET" },
        { name: "Other Operated Depts (MOD)", value: otherDeptRev, color: HOTEL_PALETTE.indigo, code: "MOD" },
        { name: "Sundry & Non-Operating", value: nonCommRev, color: HOTEL_PALETTE.cyan, code: "OTHER" }
    ];
    // Filter zero slices for the donut chart display
    const activeRevenueMix = rawRevenueMix.filter(d => d.value > 0);

    // ── Profitability & Financial Flow Bridge ──
    const totalOpex = pnlResult?.card8_TotalExpenses || 0;
    const totalGOP = pnlResult?.card7_TotalGOP ?? (totalRev - totalOpex);
    const mgmtFee = pnlResult?.card9_FeeGross || 0;
    const vatAndLevies = (pnlResult?.card11_VAT || 0) 
        + (pnlResult?.summaryServiceCharge || 0) 
        + (pnlResult?.summaryLostBreakage || 0);
    const netOwnerRecon = pnlResult?.card12_ReconOwner ?? pnlResult?.netProfit ?? (totalGOP - mgmtFee - vatAndLevies);

    const bridgeData = [
        { name: "Gross Revenue", value: totalRev, fill: HOTEL_PALETTE.pine, type: "base" },
        { name: "Total Opex", value: totalOpex, fill: HOTEL_PALETTE.rose, type: "deduct" },
        { name: "Total GOP", value: Math.max(0, totalGOP), fill: HOTEL_PALETTE.sage, type: "metric" },
        { name: "Mgmt Fees", value: mgmtFee, fill: HOTEL_PALETTE.slate, type: "deduct" },
        { name: "VAT & Levies", value: vatAndLevies, fill: HOTEL_PALETTE.amber, type: "deduct" },
        { name: "Net Owner Recon", value: Math.max(0, netOwnerRecon), fill: HOTEL_PALETTE.netGreen, type: "net" }
    ];

    // ── Departmental Operating Expenses (Opex Structure) ──
    const expHK = pnlResult?.expHousekeeping || 0;
    const expFnb = (pnlResult?.expAlacarte || 0) + (pnlResult?.expBanquet || 0) 
        || ((pnlResult?.expFood || 0) + (pnlResult?.expBeverage || 0)) || 0;
    const expPomec = pnlResult?.expPomec || 0;
    const expOperational = pnlResult?.expOperational || 0;
    const expPayroll = pnlResult?.expPayroll || 0;

    const opexBreakdown = [
        { name: "Housekeeping", value: expHK, fill: HOTEL_PALETTE.sage },
        { name: "Food & Beverage", value: expFnb, fill: HOTEL_PALETTE.amber },
        { name: "POMEC / Energy", value: expPomec, fill: HOTEL_PALETTE.rose },
        { name: "Admin & Operations", value: expOperational, fill: HOTEL_PALETTE.indigo },
        { name: "Payroll & Staff", value: expPayroll, fill: HOTEL_PALETTE.pine }
    ].filter(e => e.value > 0);

    // ── Executive Hotel KPI Metrics ──
    const occRate = pnlResult?.occ || 0;
    const arrVal = pnlResult?.arr || 0;
    const revParVal = pnlResult?.revPar || pnlResult?.kpiRevPar || 0;
    const gopMargin = totalRev > 0 ? ((totalGOP / totalRev) * 100).toFixed(1) : "0.0";
    const opexRatio = totalRev > 0 ? ((totalOpex / totalRev) * 100).toFixed(1) : "0.0";
    const roomsSold = pnlResult?.roomsSold || 0;
    const roomsAvail = pnlResult?.roomsAvailable || 0;

    return (
        <motion.div 
            className={styles.container}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
        >
            {/* ── Header Toolbar Strip ── */}
            <div className={styles.headerCard}>
                <div className={styles.headerInfo}>
                    <div className={styles.headerTitleRow}>
                        <span className={styles.headerIcon}>
                            <BarChart3 size={20} />
                        </span>
                        <h2 className={styles.headerTitle}>
                            Operational Trends &amp; Departmental Analytics
                        </h2>
                    </div>
                    <p className={styles.headerSubtitle}>
                        Standardized Hotel Operating Accounts &bull; Revenue Centers, Cost Structure &amp; GOP Bridge
                    </p>
                </div>
                <div className={styles.headerBadges}>
                    <span className={styles.statusBadge}>
                        <span className={styles.statusDot} />
                        Standard Operating Accounts
                    </span>
                    <span className={styles.periodBadge}>
                        {viewMode === "monthly" ? `${monthStr} ${yearStr}` : `Year ${yearStr}`}
                    </span>
                </div>
            </div>

            {/* ── Executive Hotel KPI Strip ── */}
            <div className={styles.kpiStrip}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>
                        <span>Gross Revenue</span>
                        <DollarSign size={13} />
                    </div>
                    <div className={styles.kpiValue} title={formatIDR(totalRev)}>
                        {formatIDR(totalRev)}
                    </div>
                    <div className={styles.kpiSubtext}>
                        <TrendingUp size={11} /> 100% Base
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>
                        <span>Total GOP</span>
                        <Activity size={13} />
                    </div>
                    <div className={styles.kpiValue} title={formatIDR(totalGOP)}>
                        {formatIDR(totalGOP)}
                    </div>
                    <div className={styles.kpiSubtext}>
                        <Percent size={11} /> {gopMargin}% Margin
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>
                        <span>Occupancy (OCC)</span>
                        <Hotel size={13} />
                    </div>
                    <div className={styles.kpiValue}>
                        {occRate > 0 ? `${occRate.toFixed(1)}%` : "-"}
                    </div>
                    <div className={styles.kpiSubtextNeutral}>
                        {roomsAvail > 0 ? `${roomsSold} of ${roomsAvail} Rms` : "Standard Capacity"}
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>
                        <span>Average Room Rate</span>
                        <ArrowUpRight size={13} />
                    </div>
                    <div className={styles.kpiValue} title={formatIDR(arrVal)}>
                        {arrVal > 0 ? formatIDR(arrVal) : "-"}
                    </div>
                    <div className={styles.kpiSubtextNeutral}>
                        ADR / ARR
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>
                        <span>RevPAR</span>
                        <ShieldCheck size={13} />
                    </div>
                    <div className={styles.kpiValue} title={formatIDR(revParVal)}>
                        {revParVal > 0 ? formatIDR(revParVal) : "-"}
                    </div>
                    <div className={styles.kpiSubtextNeutral}>
                        Per Available Room
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>
                        <span>Opex Cost Ratio</span>
                        <Percent size={13} />
                    </div>
                    <div className={styles.kpiValue}>
                        {opexRatio}%
                    </div>
                    <div className={styles.kpiSubtextNeutral}>
                        {formatIDR(totalOpex)}
                    </div>
                </div>
            </div>

            {/* ── Main Analytics Grid ── */}
            <div className={styles.chartsGrid}>
                {/* 1. Operating Department Revenue Mix */}
                <div className={styles.chartCard}>
                    <div className={styles.chartCardHeader}>
                        <div className={styles.chartTitleCol}>
                            <h3 className={styles.chartTitle}>
                                <PieChartIcon size={15} /> Departmental Revenue Mix
                            </h3>
                            <p className={styles.chartSubtitle}>
                                Revenue distribution across core hotel operating departments
                            </p>
                        </div>
                    </div>

                    <div className={styles.mixLayout}>
                        {/* Donut Chart */}
                        <div className={styles.chartContainer260}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RePie>
                                    <Pie
                                        data={activeRevenueMix.length > 0 ? activeRevenueMix : [{ name: "No Revenue", value: 1, color: "#e2e8f0" }]}
                                        cx="50%" 
                                        cy="50%"
                                        innerRadius="50%"
                                        outerRadius="75%"
                                        paddingAngle={4}
                                        dataKey="value"
                                        animationDuration={1200}
                                    >
                                        {(activeRevenueMix.length > 0 ? activeRevenueMix : [{ name: "No Revenue", value: 1, color: "#e2e8f0" }]).map((entry, index) => (
                                            <Cell key={`cell-rev-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<HotelChartTooltip formatIDR={formatIDR} baseRev={totalRev} />} />
                                </RePie>
                            </ResponsiveContainer>
                        </div>

                        {/* Department Statistics List */}
                        <div className={styles.departmentStatsList}>
                            {rawRevenueMix.map((dept, idx) => {
                                const pct = totalRev > 0 ? ((dept.value / totalRev) * 100) : 0;
                                return (
                                    <div key={idx} className={styles.deptItem}>
                                        <div className={styles.deptHeader}>
                                            <span className={styles.deptNameWrap}>
                                                <span className={styles.deptDot} style={{ background: dept.color }} />
                                                {dept.name}
                                            </span>
                                            <span className={styles.deptValue}>
                                                {formatIDR(dept.value)}
                                            </span>
                                        </div>
                                        <div className={styles.deptBarContainer}>
                                            <div 
                                                className={styles.deptBarFill} 
                                                style={{ width: `${Math.min(100, pct)}%`, background: dept.color }} 
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                {dept.code}
                                            </span>
                                            <span className={styles.deptPercent}>
                                                {pct.toFixed(1)}% of Revenue
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 2. Financial Performance Flow & Profitability Bridge */}
                <div className={styles.chartCard}>
                    <div className={styles.chartCardHeader}>
                        <div className={styles.chartTitleCol}>
                            <h3 className={styles.chartTitle}>
                                <TrendingUp size={15} /> Financial Performance Bridge
                            </h3>
                            <p className={styles.chartSubtitle}>
                                Operational progression: Revenue &rarr; Opex &rarr; GOP &rarr; Deductions &rarr; Net Recon
                            </p>
                        </div>
                    </div>

                    <div className={styles.chartContainer260}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bridgeData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                                    interval={0}
                                />
                                <YAxis hide />
                                <Tooltip content={<HotelChartTooltip formatIDR={formatIDR} baseRev={totalRev} />} cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1400}>
                                    {bridgeData.map((entry, index) => (
                                        <Cell key={`bridge-cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bridge Summary Footnote Pills */}
                    <div className={styles.bridgePillList}>
                        <div className={styles.bridgePill}>
                            <span className={styles.bridgePillLabel}>Gross:</span>
                            <span className={styles.bridgePillValue}>{formatIDR(totalRev)}</span>
                        </div>
                        <div className={styles.bridgePill}>
                            <span className={styles.bridgePillLabel}>Total GOP:</span>
                            <span className={styles.bridgePillValue} style={{ color: HOTEL_PALETTE.sage }}>
                                {formatIDR(totalGOP)} ({gopMargin}%)
                            </span>
                        </div>
                        <div className={styles.bridgePill}>
                            <span className={styles.bridgePillLabel}>Net Owner:</span>
                            <span className={styles.bridgePillValue} style={{ color: HOTEL_PALETTE.netGreen }}>
                                {formatIDR(netOwnerRecon)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Departmental Operating Expenses Breakdown */}
                {opexBreakdown.length > 0 && (
                    <div className={styles.chartCard}>
                        <div className={styles.chartCardHeader}>
                            <div className={styles.chartTitleCol}>
                                <h3 className={styles.chartTitle}>
                                    <Activity size={15} /> Departmental Opex Cost Centers
                                </h3>
                                <p className={styles.chartSubtitle}>
                                    Operational expense allocation across operating divisions
                                </p>
                            </div>
                            <div className={styles.chartLegendCustom}>
                                <span className={styles.legendItem}>
                                    <span className={styles.legendChip} style={{ background: HOTEL_PALETTE.rose }} />
                                    Total Opex: {formatIDR(totalOpex)}
                                </span>
                            </div>
                        </div>

                        <div className={styles.chartContainer260}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={opexBreakdown} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                                        interval={0}
                                    />
                                    <YAxis hide />
                                    <Tooltip content={<HotelChartTooltip formatIDR={formatIDR} baseRev={totalOpex} />} cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1400}>
                                        {opexBreakdown.map((entry, index) => (
                                            <Cell key={`opex-cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* 4. Periodic Trajectory & Trend Analysis */}
                <div className={`${styles.chartCard} ${opexBreakdown.length === 0 ? styles.fullWidthCard : ''}`}>
                    <div className={styles.chartCardHeader}>
                        <div className={styles.chartTitleCol}>
                            <h3 className={styles.chartTitle}>
                                <BarChart3 size={15} /> {viewMode === "monthly" ? `Monthly Revenue Trajectory (${yearStr})` : "Multi-Year Performance Trend"}
                            </h3>
                            <p className={styles.chartSubtitle}>
                                {viewMode === "monthly" ? "12-month revenue pacing for the selected financial year" : "Historical multi-year revenue progression"}
                            </p>
                        </div>
                        <div className={styles.chartLegendCustom}>
                            <span className={styles.legendItem}>
                                <span className={styles.legendChip} style={{ background: HOTEL_PALETTE.pine }} />
                                Active Period
                            </span>
                            <span className={styles.legendItem}>
                                <span className={styles.legendChip} style={{ background: '#cbd5e1' }} />
                                Baseline
                            </span>
                        </div>
                    </div>

                    <div className={styles.chartContainer260}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={(viewMode === "monthly" ? yearTrendData : multiYearTrendData) as any} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey={viewMode === "monthly" ? "month" : "year"} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                                />
                                <YAxis hide />
                                <Tooltip content={<HotelChartTooltip formatIDR={formatIDR} />} cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                                <Bar 
                                    dataKey="revenue" 
                                    radius={[4, 4, 0, 0]} 
                                    animationDuration={1500}
                                    barSize={viewMode === "monthly" ? undefined : 48}
                                >
                                    {((viewMode === "monthly" ? yearTrendData : multiYearTrendData) as any[]).map((entry: any, index: number) => {
                                        const isActive = viewMode === "monthly" 
                                            ? entry.fullMonth === monthStr 
                                            : entry.year === yearStr;
                                        return (
                                            <Cell 
                                                key={`trend-bar-${index}`} 
                                                fill={isActive ? HOTEL_PALETTE.pine : '#e2e8f0'} 
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Trajectory Curve Area Chart (Visible in Yearly View) */}
                {viewMode === "yearly" && (
                    <div className={`${styles.chartCard} ${styles.fullWidthCard}`}>
                        <div className={styles.chartCardHeader}>
                            <div className={styles.chartTitleCol}>
                                <h3 className={styles.chartTitle}>
                                    <TrendingUp size={15} /> 12-Month Trajectory Curve ({yearStr})
                                </h3>
                                <p className={styles.chartSubtitle}>
                                    Continuous performance curve of gross operating revenue across months
                                </p>
                            </div>
                        </div>
                        <div className={styles.chartContainer300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={yearTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="hotelTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={HOTEL_PALETTE.pine} stopOpacity={0.25}/>
                                            <stop offset="95%" stopColor={HOTEL_PALETTE.pine} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                                    <YAxis hide />
                                    <Tooltip content={<HotelChartTooltip formatIDR={formatIDR} />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke={HOTEL_PALETTE.pine} 
                                        strokeWidth={2.5} 
                                        fillOpacity={1} 
                                        fill="url(#hotelTrendGrad)" 
                                        animationDuration={1800} 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
