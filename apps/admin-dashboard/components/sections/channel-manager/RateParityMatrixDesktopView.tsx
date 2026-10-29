"use client";

import React, { useState, useMemo } from "react";
import { Calculator, Table, Info } from "lucide-react";
import { formatCurrencyAmount } from "@/lib/currency-utils";
import { OtaLogo } from "./OtaLogo";
import type { ChannelMappingConfig } from "./ChannelManagerSection";
import styles from "./RateParityMatrixDesktopView.module.css";

interface RateParityMatrixDesktopViewProps {
    hotelCode: string;
    hotelCurrency: string;
    ratePlans: any[];
    activeChannelsList: ChannelMappingConfig[];
}

export const RateParityMatrixDesktopView: React.FC<RateParityMatrixDesktopViewProps> = ({
    hotelCode,
    hotelCurrency,
    ratePlans,
    activeChannelsList
}) => {
    const [pricingViewMode, setPricingViewMode] = useState<"all" | "gross_only" | "net_only">("all");

    const formatPrice = (val: number) => {
        return formatCurrencyAmount(Number(val || 0), hotelCurrency);
    };

    const calculateGrossRate = (
        baseNetRate: number,
        commissionPercent: number,
        markupPercent: number,
        pricingModel: "gross" | "net"
    ) => {
        if (pricingModel === "net") {
            return baseNetRate;
        }
        const effectiveMarkup = markupPercent > 0 ? markupPercent : commissionPercent;
        if (effectiveMarkup >= 100) return baseNetRate * 2;
        return Math.round(baseNetRate / (1 - effectiveMarkup / 100));
    };

    const calculateNetReceived = (grossRate: number, commissionPercent: number) => {
        return Math.round(grossRate * (1 - commissionPercent / 100));
    };

    const minNetRate = useMemo(() => {
        if (!ratePlans.length) return 0;
        return Math.min(...ratePlans.map(r => Number(r.baseRate || 0)));
    }, [ratePlans]);

    const maxNetRate = useMemo(() => {
        if (!ratePlans.length) return 0;
        return Math.max(...ratePlans.map(r => Number(r.baseRate || 0)));
    }, [ratePlans]);

    const averageCommission = useMemo(() => {
        if (!activeChannelsList.length) return 0;
        const total = activeChannelsList.reduce((acc, c) => acc + (c.commissionPercent || 0), 0);
        return Math.round(total / activeChannelsList.length);
    }, [activeChannelsList]);

    return (
        <div className={styles.desktopContainer}>
            {/* Context Educational Card */}
            <div className={styles.contextCard}>
                <div className={styles.contextIconWrap}>
                    <Calculator size={16} />
                </div>
                <div className={styles.contextContent}>
                    <h3 className={styles.contextTitle}>
                        Konsep Matriks Paritas: Net Base PMS vs. OTA Gross Retail Selling Rates
                    </h3>
                    <p className={styles.contextDesc}>
                        Sistem beroperasi pada <b>Base Net Rates</b> (pendapatan bersih hotel). Masing-masing saluran OTA memotong komisi berbeda. Matriks ini menghitung otomatis <b>Gross Selling Rates</b> yang dipublikasikan ke tiap saluran OTA agar margin pendapatan hotel tetap terlindungi.
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Rentang Base Net Rate</span>
                    <span className={styles.metricValue}>
                        {formatPrice(minNetRate)} : {formatPrice(maxNetRate)}
                    </span>
                    <span className={styles.metricSub}>
                        Dari {ratePlans.length} master rate plan aktif
                    </span>
                </div>

                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Saluran OTA Terhubung</span>
                    <span className={styles.metricValue}>
                        {activeChannelsList.length} Saluran
                    </span>
                    <span className={styles.metricSub}>
                        {activeChannelsList.length > 0 ? "Sinkronisasi paritas harga aktif" : "Belum ada saluran terhubung"}
                    </span>
                </div>

                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Rata-rata Komisi Saluran</span>
                    <span className={styles.metricValue}>
                        {averageCommission}%
                    </span>
                    <span className={styles.metricSub}>
                        Beban komisi distribusi rata-rata
                    </span>
                </div>

                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Mata Uang Distribusi</span>
                    <span className={styles.metricValue}>
                        {hotelCurrency.toUpperCase()}
                    </span>
                    <span className={styles.metricSub}>
                        Properti: {hotelCode || "Default"}
                    </span>
                </div>
            </div>

            {/* Main Interactive Parity Matrix Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableHeaderBar}>
                    <div className={styles.tableTitleWrap}>
                        <h4 className={styles.tableTitle}>
                            <Table size={16} />
                            <span>Matriks Komparasi Paritas Tarif Saluran OTA</span>
                        </h4>
                        <p className={styles.tableSubtitle}>
                            Kalkulasi otomatis harga jual gross per saluran berdasarkan model komisi dan margin hotel.
                        </p>
                    </div>

                    {/* View Mode Filter: All, Gross Only, Net Only */}
                    <div className={styles.segmentWrap}>
                        <button
                            type="button"
                            onClick={() => setPricingViewMode("all")}
                            className={`${styles.segmentBtn} ${pricingViewMode === "all" ? styles.segmentBtnActive : ""}`}
                        >
                            Gross &amp; Net
                        </button>
                        <button
                            type="button"
                            onClick={() => setPricingViewMode("gross_only")}
                            className={`${styles.segmentBtn} ${pricingViewMode === "gross_only" ? styles.segmentBtnActive : ""}`}
                        >
                            Gross Saja
                        </button>
                        <button
                            type="button"
                            onClick={() => setPricingViewMode("net_only")}
                            className={`${styles.segmentBtn} ${pricingViewMode === "net_only" ? styles.segmentBtnActive : ""}`}
                        >
                            Net Saja
                        </button>
                    </div>
                </div>

                {activeChannelsList.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Info size={32} className={styles.emptyIcon} />
                        <div className={styles.emptyTitle}>Belum Ada Saluran OTA Terhubung</div>
                        <p className={styles.emptyDesc}>
                            Hubungkan minimal satu saluran OTA pada tab Saluran &amp; Pemetaan untuk mengaktifkan kalkulasi paritas tarif.
                        </p>
                    </div>
                ) : ratePlans.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Info size={32} className={styles.emptyIcon} />
                        <div className={styles.emptyTitle}>Belum Ada Master Rate Plan</div>
                        <p className={styles.emptyDesc}>
                            Buat minimal satu rate plan dasar (misal Room Only atau Bed &amp; Breakfast) untuk melihat matriks harga.
                        </p>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.matrixTable}>
                            <thead>
                                <tr>
                                    <th className={styles.thStickyPlan}>
                                        Rate Plan Master (PMS)
                                    </th>
                                    <th className={styles.thBaseNet}>
                                        Base Net Rate
                                    </th>
                                    {activeChannelsList.map(ch => (
                                        <th key={ch.channelCode} className={styles.thChannel}>
                                            <div className={styles.channelThHeader}>
                                                <OtaLogo code={ch.channelCode} name={ch.channelName} size={16} />
                                                <span>{ch.channelName}</span>
                                            </div>
                                            <div className={styles.channelThMeta}>
                                                Komisi: {ch.commissionPercent || 0}% • {ch.pricingModel?.toUpperCase() || "GROSS"}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ratePlans.map((rp, idx) => {
                                    const baseNet = Number(rp.baseRate || 0);
                                    return (
                                        <tr key={rp.id || idx}>
                                            <td className={styles.tdStickyPlan}>
                                                <div className={styles.planName} title={rp.name || "Standard Rate"}>
                                                    {rp.name || "Standard Rate"}
                                                </div>
                                                <div className={styles.planMeta}>
                                                    Code: {rp.code || rp.id} • Meal: {rp.mealPlan || "RO"}
                                                </div>
                                            </td>
                                            <td className={styles.tdBaseNet}>
                                                {formatPrice(baseNet)}
                                            </td>
                                            {activeChannelsList.map(ch => {
                                                const gross = calculateGrossRate(
                                                    baseNet,
                                                    ch.commissionPercent || 0,
                                                    ch.markupPercent || 0,
                                                    ch.pricingModel || "gross"
                                                );
                                                const netReceived = calculateNetReceived(gross, ch.commissionPercent || 0);

                                                return (
                                                    <td key={ch.channelCode} className={styles.tdChannel}>
                                                        {(pricingViewMode === "all" || pricingViewMode === "gross_only") && (
                                                            <div className={styles.priceGross}>
                                                                {formatPrice(gross)}
                                                            </div>
                                                        )}
                                                        {(pricingViewMode === "all" || pricingViewMode === "net_only") && (
                                                            <div className={styles.priceNetBadge}>
                                                                <span className={styles.priceNetLabel}>Net:</span>
                                                                <span>{formatPrice(netReceived)}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
