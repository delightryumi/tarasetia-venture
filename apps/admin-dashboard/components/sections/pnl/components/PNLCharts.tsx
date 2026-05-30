import React from "react";
import { motion } from "framer-motion";
import { 
    ResponsiveContainer, PieChart as RePie, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    AreaChart, Area, CartesianGrid
} from 'recharts';
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { TrendDataItem, MultiYearTrendDataItem } from "../types";

interface PNLChartsProps {
    viewMode: "monthly" | "yearly";
    pnlResult: GlobalPnLResult | null;
    yearTrendData: TrendDataItem[];
    multiYearTrendData: MultiYearTrendDataItem[];
    monthStr: string;
    yearStr: string;
    formatIDR: (v: number) => string;
}

const SAGE = "#788069";

export const PNLCharts: React.FC<PNLChartsProps> = ({
    viewMode, pnlResult, yearTrendData, multiYearTrendData, monthStr, yearStr, formatIDR
}) => {
    return (
        <motion.div
            key="charts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
            {/* Revenue Distribution */}
            <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-xl shadow-stone-200/20">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-8">Revenue Distribution</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePie>
                            <Pie
                                data={[
                                    { name: 'Hotel Collect', value: pnlResult?.card3_RevHotelCollect || 0 },
                                    { name: 'Nexura Collect', value: pnlResult?.card3_RevNexuraCollect || 0 },
                                    { name: 'Other Revenue', value: pnlResult?.card5_OtherRevenue || 0 }
                                ]}
                                cx="50%" cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={8}
                                dataKey="value"
                                animationBegin={0}
                                animationDuration={1500}
                            >
                                <Cell fill="#ffd8a6" />
                                <Cell fill="#788069" />
                                <Cell fill="#1A1C14" />
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
            <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-xl shadow-stone-200/20">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-8">Financial Performance Bridge</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[
                                { name: 'Gross', value: pnlResult?.card1_TotalRevenue || 0, fill: '#788069' },
                                { name: 'Expenses', value: pnlResult?.card8_TotalExpenses || 0, fill: '#ef4444' },
                                { name: 'VAT', value: pnlResult?.card11_VAT || 0, fill: '#f59e0b' },
                                { name: 'Mgmt Fee', value: pnlResult?.card9_FeeGross || 0, fill: '#6366f1' },
                                { name: 'Net GOP', value: pnlResult?.card7_TotalGOP || 0, fill: '#10b981' }
                            ]}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#A8A29E' }} />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => formatIDR(Number(value) || 0)}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={2000}>
                                {[
                                    { fill: '#788069' },
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
            <div className="lg:col-span-2 bg-white border border-stone-100 rounded-2xl p-8 shadow-xl shadow-stone-200/20">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">
                        {viewMode === "monthly" ? `Monthly Performance Analysis (${yearStr})` : "Year-over-Year Comparison"}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-stone-100 border border-stone-200"></div>
                            <span>Previous {viewMode === "monthly" ? "Months" : "Years"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-sage"></div>
                            <span>Active {viewMode === "monthly" ? "Month" : "Year"}</span>
                        </div>
                    </div>
                </div>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(viewMode === "monthly" ? yearTrendData : multiYearTrendData) as any}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                                dataKey={viewMode === "monthly" ? "month" : "year"} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#A8A29E' }} 
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
                <div className="lg:col-span-2 bg-white border border-stone-100 rounded-2xl p-8 shadow-xl shadow-stone-200/20 border-t-4 border-t-sage">
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-8">Revenue Trajectory ({yearStr})</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={yearTrendData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#788069" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#788069" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#A8A29E' }} />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => formatIDR(Number(value) || 0)}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#788069" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" animationDuration={2500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
