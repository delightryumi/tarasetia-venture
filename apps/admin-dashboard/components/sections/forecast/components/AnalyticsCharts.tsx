"use client";

import React from "react";
import { motion } from "framer-motion";
import { Percent, Coins, Activity } from "lucide-react";
import { 
    ResponsiveContainer, PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    CartesianGrid, AreaChart, Area
} from 'recharts';
import { SummaryCard } from "./SummaryCard";
import styles from "../ForecastStyles.module.css";

const PEACH = "#3b82f6"; // Dynamic corporate blue
const SAGE = "#181d26";  // Charcoal theme

interface AnalyticsChartsProps {
    stats: any;
    viewMode: "daily" | "monthly" | "yearly";
    formatCurrency: (val: number) => string;
}

export function AnalyticsCharts({ stats, viewMode, formatCurrency }: AnalyticsChartsProps) {
    return (
        <motion.section
            key="charts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={styles.chartsGrid}
        >
            {/* Revenue Distribution */}
            <div className={styles.chartCard}>
                <h3 className={styles.headerSubtitle} style={{ color: "var(--f-light-muted)", marginBottom: "32px" }}>Revenue Distribution</h3>
                <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Hotel Collect', value: stats.salesPayAtHotel || 0 },
                                    { name: 'Virtual / OTA', value: stats.salesPayAtTransfer || 0 },
                                    { name: 'Other Income', value: stats.otherRevenue || 0 }
                                ]}
                                cx="50%" cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={8}
                                dataKey="value"
                                animationDuration={1500}
                            >
                                <Cell fill={PEACH} />
                                <Cell fill={SAGE} />
                                <Cell fill="#a8a29e" />
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => `Rp ${formatCurrency(value)}`}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Source Performance */}
            <div className={styles.chartCard}>
                <h3 className={styles.headerSubtitle} style={{ color: "var(--f-light-muted)", marginBottom: "32px" }}>Booking Channel Performance</h3>
                <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[
                                { name: 'OTA', value: stats.otaRevenue || 0, fill: SAGE },
                                { name: 'Walk-in', value: stats.walkInRevenue || 0, fill: PEACH },
                                { name: 'Other', value: stats.otherRevenue || 0, fill: '#a8a29e' }
                            ]}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#A8A29E' }} />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => `Rp ${formatCurrency(value)}`}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={2000} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Performance Trajectory (Full Trend) */}
            <div className={`${styles.chartCard} ${styles.spanFull}`}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                    <h3 className={styles.headerSubtitle} style={{ color: "var(--f-light-muted)" }}>
                        Performance Trajectory 
                        <span style={{ marginLeft: "8px", fontSize: "9px", color: "var(--f-light-muted)", opacity: 0.6 }}>
                            ({viewMode === 'daily' ? 'Days of Month' : viewMode === 'monthly' ? 'Months of Year' : 'Multi-Year Trend'})
                        </span>
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: SAGE }}></div>
                            <span className={styles.headerSubtitle} style={{ fontSize: "8px" }}>Gross Revenue</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: PEACH }}></div>
                            <span className={styles.headerSubtitle} style={{ fontSize: "8px" }}>OCC %</span>
                        </div>
                    </div>
                </div>
                <div style={{ height: "400px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.trendData}>
                            <defs>
                                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={SAGE} stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor={SAGE} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={PEACH} stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor={PEACH} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="label" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#A8A29E' }} 
                            />
                            <YAxis yAxisId="left" hide />
                            <YAxis yAxisId="right" hide orientation="right" />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any, name: string) => {
                                    if (name === "gross") return [`Rp ${formatCurrency(value)}`, "Gross Revenue"];
                                    if (name === "occ") return [`${value.toFixed(1)}%`, "Occupancy"];
                                    if (name === "arr") return [`Rp ${formatCurrency(value)}`, "ADR"];
                                    if (name === "revPar") return [`Rp ${formatCurrency(value)}`, "RevPAR"];
                                    return [value, name];
                                }}
                            />
                            <Area 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="gross" 
                                stroke={SAGE} 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorGross)" 
                                animationDuration={2000} 
                            />
                            <Area 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="occ" 
                                stroke={PEACH} 
                                strokeWidth={2} 
                                strokeDasharray="5 5"
                                fillOpacity={1} 
                                fill="url(#colorOcc)" 
                                animationDuration={2500} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Efficiency Metrics */}
            <div className={`${styles.spanFull} ${styles.summaryCardGrid3Col}`}>
                <SummaryCard
                    label="Occupancy Rate"
                    icon={<Percent size={18} />}
                    accent="#f59e0b"
                    prefix=""
                    suffix="%"
                    value={stats.occ}
                    loading={stats.loading}
                    formatter={(v) => v.toFixed(1)}
                />
                <SummaryCard
                    label="Average Room Rate"
                    icon={<Coins size={18} />}
                    accent="#10b981"
                    value={stats.arr}
                    loading={stats.loading}
                    formatter={formatCurrency}
                />
                <SummaryCard
                    label="RevPAR (Yield)"
                    icon={<Activity size={18} />}
                    accent="#6366f1"
                    value={stats.revPar}
                    loading={stats.loading}
                    formatter={formatCurrency}
                />
            </div>
        </motion.section>
    );
}
