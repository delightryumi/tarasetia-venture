import React from "react";
import { motion } from "framer-motion";
import { 
    ResponsiveContainer, PieChart as RePie, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    AreaChart, Area, CartesianGrid
} from 'recharts';
import { BarChart3 } from "lucide-react";
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

const SAGE = "var(--sage)";

export const PNLCharts: React.FC<PNLChartsProps> = ({
    viewMode, pnlResult, yearTrendData, multiYearTrendData, monthStr, yearStr, formatIDR
}) => {
    return (
        <div className={`${styles.outerCard} ${styles.fontInstrument}`}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <BarChart3 size={28} /> Analytics <span className={styles.titleAccent}>Charts</span>
                </h2>
                <p className={styles.subtitle}>Visual Data & Trends Audit</p>
            </div>

            <div className={styles.innerTray}>
                <motion.div
                    key="charts"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8"
                >
                    {/* Revenue Distribution */}
                    <div className={styles.chartCard}>
                        <h3 className={styles.chartTitleWithMargin}>Revenue Distribution</h3>
                        <div className={styles.chartContainer300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RePie>
                                    <Pie
                                        data={[
                                            { name: 'Hotel Collect', value: pnlResult?.card3_RevHotelCollect || 0 },
                                            { name: 'Online/Transfer Collect', value: pnlResult?.card3_RevNexuraCollect || 0 },
                                            { name: 'Other Revenue', value: pnlResult?.card5_OtherRevenue || 0 }
                                        ]}
                                        cx="50%" cy="50%"
                                        innerRadius="45%"
                                        outerRadius="70%"
                                        paddingAngle={8}
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        <Cell fill="var(--peach, #3b82f6)" />
                                        <Cell fill="var(--sage, #181d26)" />
                                        <Cell fill="var(--foreground, #1c1917)" />
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => formatIDR(Number(value) || 0)}
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </RePie>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Profitability Bridge */}
                    <div className={styles.chartCard}>
                        <h3 className={styles.chartTitleWithMargin}>Financial Performance Bridge</h3>
                        <div className={styles.chartContainer300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { name: 'Gross', value: pnlResult?.card1_TotalRevenue || 0, fill: 'var(--sage, #181d26)' },
                                        { name: 'Expenses', value: pnlResult?.card8_TotalExpenses || 0, fill: '#ef4444' },
                                        { name: 'VAT', value: pnlResult?.card11_VAT || 0, fill: '#f59e0b' },
                                        { name: 'Mgmt Fee', value: pnlResult?.card9_FeeGross || 0, fill: '#6366f1' },
                                        { name: 'Net GOP', value: pnlResult?.card7_TotalGOP || 0, fill: '#10b981' }
                                    ]}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#A8A29E' }} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => formatIDR(Number(value) || 0)}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={2000}>
                                        {[
                                            { fill: 'var(--sage, #181d26)' },
                                            { fill: '#ef4444' },
                                            { fill: '#f59e0b' },
                                            { fill: '#6366f1' },
                                            { fill: '#10b981' }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Context-Aware Versus Analysis */}
                    <div className={`${styles.chartCard} lg:col-span-2`}>
                        <div className={styles.chartHeader}>
                            <h3 className={styles.chartTitle}>
                                {viewMode === "monthly" ? `Monthly Performance Analysis (${yearStr})` : "Year-over-Year Comparison"}
                            </h3>
                            <div className={styles.chartLegend}>
                                <div className={styles.legendItem}>
                                    <div className={`${styles.legendDot} ${styles.legendDotPrev}`}></div>
                                    <span>Previous {viewMode === "monthly" ? "Months" : "Years"}</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={`${styles.legendDot} ${styles.legendDotActive}`}></div>
                                    <span>Active {viewMode === "monthly" ? "Month" : "Year"}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.chartContainer350}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(viewMode === "monthly" ? yearTrendData : multiYearTrendData) as any}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey={viewMode === "monthly" ? "month" : "year"} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 9, fontWeight: 600, fill: '#A8A29E' }} 
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => formatIDR(Number(value) || 0)}
                                    />
                                    <Bar 
                                        dataKey="revenue" 
                                        radius={[6, 6, 0, 0]} 
                                        animationDuration={2000}
                                        barSize={viewMode === "monthly" ? undefined : 60}
                                    >
                                        {((viewMode === "monthly" ? yearTrendData : multiYearTrendData) as any[]).map((entry: any, index: number) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={ (viewMode === "monthly" ? entry.fullMonth === monthStr : entry.year === yearStr) ? SAGE : '#f3f4f6'} 
                                                stroke={ (viewMode === "monthly" ? entry.fullMonth === monthStr : entry.year === yearStr) ? SAGE : '#e5e7eb'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Trajectory Analysis (Monthly Trajectory in Yearly Mode) */}
                    {viewMode === "yearly" && (
                        <div className={`${styles.chartCard} lg:col-span-2`} style={{ borderTop: `4px solid ${SAGE}` }}>
                            <h3 className={styles.chartTitleWithMargin}>Revenue Trajectory ({yearStr})</h3>
                            <div className={styles.chartContainer350}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={yearTrendData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={SAGE} stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor={SAGE} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#A8A29E' }} />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any) => formatIDR(Number(value) || 0)}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke={SAGE} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" animationDuration={2500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
