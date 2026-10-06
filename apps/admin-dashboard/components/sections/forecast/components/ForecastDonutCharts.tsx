"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Globe, CreditCard, Percent } from "lucide-react";
import { resolveChannelName, getChannelLogo } from "@/lib/channelHelper";
import s from "./ForecastDonutCharts.module.css";

interface ForecastDonutChartsProps {
    stats: any;
    formatCurrency: (val: number) => string;
}

const CHANNEL_COLORS: Record<string, string> = {
    "Traveloka": "#00aaf2",
    "Booking.com": "#003580",
    "Tiket.com": "#ff5e1a",
    "Agoda": "#e8173e",
    "Airbnb": "#ff5a5f",
    "Trip.com": "#1890ff",
    "Expedia": "#fbc02d",
    "MG Bedbank": "#6c3483",
    "Hotelbeds": "#d97706",
    "WebBeds": "#059669",
    "Klook": "#ea580c",
    "Walk-in": "#10b981",
    "Direct": "#3b82f6",
    "Booking Engine": "#6366f1",
    "Other Income": "#ec4899",
};

const FALLBACK_PALETTE = ["#06b6d4", "#8b5cf6", "#f59e0b", "#14b8a6", "#64748b", "#a855f7", "#3b82f6", "#ef4444"];

export function ForecastDonutCharts({ stats, formatCurrency }: ForecastDonutChartsProps) {
    // 1. Channel Revenue Breakdown (Granular per OTA / Channel)
    const channelMap: Record<string, number> = {};
    if (Array.isArray(stats?.entries) && stats.entries.length > 0) {
        stats.entries.forEach((e: any) => {
            const isCancelled = e.status === "CANCELLED" || e.status === "CANCEL" || e.paymentStatus === "CANCELLED" || e.paymentStatus === "CANCEL";
            if (isCancelled) return;
            const chName = resolveChannelName(e) || (e.type === "other_income" ? "Other Income" : "Walk-in");
            const val = Number(e.amount) || Number(e.ratePerNight) || 0;
            channelMap[chName] = (channelMap[chName] || 0) + val;
        });
    }

    let channelData = Object.entries(channelMap)
        .map(([name, value], idx) => ({
            name,
            value,
            color: CHANNEL_COLORS[name] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
            logo: getChannelLogo(name),
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);

    // Fallback if entries not populated yet but aggregate stats are available
    if (channelData.length === 0 && (stats?.otaRevenue > 0 || stats?.walkInRevenue > 0 || stats?.otherRevenue > 0)) {
        channelData = [
            { name: "OTA Channels", value: stats.otaRevenue || 0, color: "#00aaf2", logo: "/channels/traveloka.png" },
            { name: "Walk-in", value: stats.walkInRevenue || 0, color: "#10b981", logo: "/channels/walk_in.png" },
            { name: "Other Income", value: stats.otherRevenue || 0, color: "#ec4899", logo: "/channels/other_income.svg" },
        ].filter((item) => item.value > 0);
    }

    const totalChannelRevenue = channelData.reduce((acc, curr) => acc + curr.value, 0) || stats?.totalGrossRevenue || 0;

    // 2. Room vs Non-Room Revenue Stream
    const revenueTypeData = [
        { name: "Pendapatan Kamar (Room)", value: stats.totalRoomRevenue || (stats.totalGrossRevenue - (stats.otherRevenue || 0)) || 0, color: "#3b82f6" },
        { name: "Pendapatan Lain (Non-Room)", value: stats.otherRevenue || 0, color: "#ec4899" },
    ].filter((item) => item.value > 0);

    const totalRevTypeAmount = (stats.totalRoomRevenue || (stats.totalGrossRevenue - (stats.otherRevenue || 0)) || 0) + (stats.otherRevenue || 0) || stats?.totalGrossRevenue || 0;

    // 3. Room Inventory & Occupancy
    const roomsSold = stats.roomsSold || 0;
    const totalRooms = stats.totalPossibleRoomNights || Math.max(roomsSold, 1);
    const roomsAvailable = Math.max(0, totalRooms - roomsSold);

    const occupancyData = [
        { name: "Terisi (Sold)", value: roomsSold, color: "#10b981" },
        { name: "Tersedia (Vacant)", value: roomsAvailable, color: "#cbd5e1" },
    ];

    return (
        <div className={s.gridContainer}>
            {/* Donut 1: Komposisi Saluran Pemesanan */}
            <div className={s.donutCard}>
                <div className={s.cardHeader}>
                    <div className={s.cardTitleWrap}>
                        <div className={s.cardIconBadge} style={{ background: "rgba(6, 182, 212, 0.12)", color: "#0891b2" }}>
                            <Globe size={18} />
                        </div>
                        <div>
                            <h4 className={s.cardTitle}>Komposisi Saluran OTA & Walk-in</h4>
                            <p className={s.cardSubtitle}>Distribusi sumber pendapatan reservasi</p>
                        </div>
                    </div>
                </div>

                <div className={s.chartWrapper}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={channelData.length > 0 ? channelData : [{ name: "Belum Ada Data", value: 1, color: "#e2e8f0" }]}
                                cx="50%"
                                cy="50%"
                                innerRadius={58}
                                outerRadius={85}
                                paddingAngle={channelData.length > 1 ? 4 : 0}
                                dataKey="value"
                                animationDuration={1000}
                            >
                                {(channelData.length > 0 ? channelData : [{ color: "#e2e8f0" }]).map((entry, idx) => (
                                    <Cell key={`cell-ch-${idx}`} fill={entry.color} />
                                ))}
                            </Pie>
                            {channelData.length > 0 && (
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                    }}
                                    formatter={(val: any) => `Rp ${formatCurrency(Number(val) || 0)}`}
                                />
                            )}
                        </PieChart>
                    </ResponsiveContainer>
                    <div className={s.centerLabel}>
                        <span className={s.centerValue}>Rp {formatCurrency(totalChannelRevenue || stats.totalGrossRevenue || 0)}</span>
                        <span className={s.centerSub}>Total Revenue</span>
                    </div>
                </div>

                <div className={s.legendList}>
                    {channelData.map((item) => {
                        const pct = totalChannelRevenue > 0 ? ((item.value / totalChannelRevenue) * 100).toFixed(1) : "0";
                        return (
                            <div key={item.name} className={s.legendItem}>
                                <div className={s.legendLeft}>
                                    {item.logo ? (
                                        <img
                                            src={item.logo}
                                            alt={item.name}
                                            className={s.channelLogo}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                             }}
                                        />
                                    ) : (
                                        <span className={s.legendDot} style={{ background: item.color }} />
                                    )}
                                    <span className={s.legendName}>{item.name}</span>
                                </div>
                                <div className={s.legendRight}>
                                    <span className={s.legendValue}>Rp {formatCurrency(item.value)}</span>
                                    <span className={s.legendPct}>{pct}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Donut 2: Pendapatan Kamar vs Non-Kamar */}
            <div className={s.donutCard}>
                <div className={s.cardHeader}>
                    <div className={s.cardTitleWrap}>
                        <div className={s.cardIconBadge} style={{ background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
                            <CreditCard size={18} />
                        </div>
                        <div>
                            <h4 className={s.cardTitle}>Pendapatan Kamar vs Non-Kamar</h4>
                            <p className={s.cardSubtitle}>Room Revenue vs Non-Room Income</p>
                        </div>
                    </div>
                </div>

                <div className={s.chartWrapper}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={revenueTypeData.length > 0 ? revenueTypeData : [{ name: "Belum Ada Data", value: 1, color: "#e2e8f0" }]}
                                cx="50%"
                                cy="50%"
                                innerRadius={58}
                                outerRadius={85}
                                paddingAngle={revenueTypeData.length > 1 ? 4 : 0}
                                dataKey="value"
                                animationDuration={1000}
                            >
                                {(revenueTypeData.length > 0 ? revenueTypeData : [{ color: "#e2e8f0" }]).map((entry, idx) => (
                                    <Cell key={`cell-rev-${idx}`} fill={entry.color} />
                                ))}
                            </Pie>
                            {revenueTypeData.length > 0 && (
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                    }}
                                    formatter={(val: any) => `Rp ${formatCurrency(Number(val) || 0)}`}
                                />
                            )}
                        </PieChart>
                    </ResponsiveContainer>
                    <div className={s.centerLabel}>
                        <span className={s.centerValue}>Rp {formatCurrency(totalRevTypeAmount)}</span>
                        <span className={s.centerSub}>Total Gross</span>
                    </div>
                </div>

                <div className={s.legendList}>
                    {revenueTypeData.map((item) => {
                        const pct = totalRevTypeAmount > 0 ? ((item.value / totalRevTypeAmount) * 100).toFixed(1) : "0";
                        return (
                            <div key={item.name} className={s.legendItem}>
                                <div className={s.legendLeft}>
                                    <span className={s.legendDot} style={{ background: item.color }} />
                                    <span className={s.legendName}>{item.name}</span>
                                </div>
                                <div className={s.legendRight}>
                                    <span className={s.legendValue}>Rp {formatCurrency(item.value)}</span>
                                    <span className={s.legendPct}>{pct}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Donut 3: Okupansi & Ketersediaan Kamar */}
            <div className={s.donutCard}>
                <div className={s.cardHeader}>
                    <div className={s.cardTitleWrap}>
                        <div className={s.cardIconBadge} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
                            <Percent size={18} />
                        </div>
                        <div>
                            <h4 className={s.cardTitle}>Rasio Okupansi Kamar (OCC)</h4>
                            <p className={s.cardSubtitle}>Kamar terisi berbanding total ketersediaan</p>
                        </div>
                    </div>
                </div>

                <div className={s.chartWrapper}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={occupancyData}
                                cx="50%"
                                cy="50%"
                                innerRadius={58}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                                animationDuration={1000}
                            >
                                {occupancyData.map((entry, idx) => (
                                    <Cell key={`cell-occ-${idx}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}
                                formatter={(val: any, name: any) => [`${val} Kamar`, name]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className={s.centerLabel}>
                        <span className={s.centerValue}>{(stats.occ || 0).toFixed(1)}%</span>
                        <span className={s.centerSub}>Okupansi</span>
                    </div>
                </div>

                <div className={s.legendList}>
                    {occupancyData.map((item) => {
                        const pct = totalRooms > 0 ? ((item.value / totalRooms) * 100).toFixed(1) : "0";
                        return (
                            <div key={item.name} className={s.legendItem}>
                                <div className={s.legendLeft}>
                                    <span className={s.legendDot} style={{ background: item.color }} />
                                    <span className={s.legendName}>{item.name}</span>
                                </div>
                                <div className={s.legendRight}>
                                    <span className={s.legendValue}>{item.value} Kamar</span>
                                    <span className={s.legendPct}>{pct}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
