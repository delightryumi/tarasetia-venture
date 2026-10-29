"use client";

import React, { useState, useMemo } from "react";
import { Calculator, Info, Grid3X3 } from "lucide-react";
import { formatCurrencyAmount } from "@/lib/currency-utils";
import { OtaLogo } from "./OtaLogo";
import type { ChannelMappingConfig } from "./ChannelManagerSection";
import styles from "./RateParityMatrixMobileView.module.css";

interface RateParityMatrixMobileViewProps {
    hotelCode: string;
    hotelCurrency: string;
    ratePlans: any[];
    activeChannelsList: ChannelMappingConfig[];
}

export const RateParityMatrixMobileView: React.FC<RateParityMatrixMobileViewProps> = ({
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
        <div className={styles.mobileContainer}>
            {/* Mobile Context Card */}
            <div className={styles.mobileContextCard}>
                <div className={styles.mobileContextIcon}>
                    <Calculator size={15} />
                </div>
                <p className={styles.mobileContextText}>
                    <b>Matriks Paritas Tarif Mobile:</b> Komparasi harga jual gross per saluran OTA dihitung otomatis agar margin laba bersih hotel tetap terjaga.
                </p>
            </div>

            {/* Metrics Strip */}
            <div className={styles.metricsStrip}>
                <div className={styles.metricMiniCard}>
                    <span className={styles.metricMiniLabel}>Base Net PMS</span>
                    <span className={styles.metricMiniValue}>
                        {formatPrice(minNetRate)} - {formatPrice(maxNetRate)}
                    </span>
                </div>
                <div className={styles.metricMiniCard}>
                    <span className={styles.metricMiniLabel}>Saluran OTA Aktif</span>
                    <span className={styles.metricMiniValue}>
                        {activeChannelsList.length} Saluran ({averageCommission}%)
                    </span>
                </div>
            </div>

            {/* Filter Segmented Control */}
            <div className={styles.filterBar}>
                <span className={styles.filterLabel}>Tampilan Harga:</span>
                <div className={styles.segmentWrap}>
                    <button
                        type="button"
                        onClick={() => setPricingViewMode("all")}
                        className={`${styles.segmentBtn} ${pricingViewMode === "all" ? styles.segmentBtnActive : ""}`}
                    >
                        Semua
                    </button>
                    <button
                        type="button"
                        onClick={() => setPricingViewMode("gross_only")}
                        className={`${styles.segmentBtn} ${pricingViewMode === "gross_only" ? styles.segmentBtnActive : ""}`}
                    >
                        Gross
                    </button>
                    <button
                        type="button"
                        onClick={() => setPricingViewMode("net_only")}
                        className={`${styles.segmentBtn} ${pricingViewMode === "net_only" ? styles.segmentBtnActive : ""}`}
                    >
                        Net
                    </button>
                </div>
            </div>

            {/* Empty States */}
            {activeChannelsList.length === 0 ? (
                <div className={styles.emptyState}>
                    <Info size={28} color="#a1a1aa" />
                    <div className={styles.emptyTitle}>Belum Ada Saluran OTA Terhubung</div>
                    <p className={styles.emptyDesc}>
                        Hubungkan saluran OTA pada tab Pemetaan untuk melihat paritas harga di HP.
                    </p>
                </div>
            ) : ratePlans.length === 0 ? (
                <div className={styles.emptyState}>
                    <Info size={28} color="#a1a1aa" />
                    <div className={styles.emptyTitle}>Belum Ada Master Rate Plan</div>
                    <p className={styles.emptyDesc}>
                        Tambahkan paket harga kamar dasar pada menu Rate Plan.
                    </p>
                </div>
            ) : (
                /* Card-Reflow List */
                <div className={styles.cardsList}>
                    {ratePlans.map((rp, idx) => {
                        const baseNet = Number(rp.baseRate || 0);
                        return (
                            <div key={rp.id || idx} className={styles.planCard}>
                                <div className={styles.planCardHeader}>
                                    <div className={styles.planTitleWrap}>
                                        <div className={styles.planName} title={rp.name || "Standard Rate"}>
                                            {rp.name || "Standard Rate"}
                                        </div>
                                        <div className={styles.planMeta}>
                                            Code: {rp.code || rp.id} • Meal: {rp.mealPlan || "RO"}
                                        </div>
                                    </div>
                                    <div className={styles.baseNetBadge}>
                                        <span className={styles.baseNetLabel}>Base Net PMS</span>
                                        <span className={styles.baseNetValue}>{formatPrice(baseNet)}</span>
                                    </div>
                                </div>

                                <div className={styles.channelGrid}>
                                    {activeChannelsList.map(ch => {
                                        const gross = calculateGrossRate(
                                            baseNet,
                                            ch.commissionPercent || 0,
                                            ch.markupPercent || 0,
                                            ch.pricingModel || "gross"
                                        );
                                        const netReceived = calculateNetReceived(gross, ch.commissionPercent || 0);

                                        return (
                                            <div key={ch.channelCode} className={styles.channelItem}>
                                                <div className={styles.channelIdentity}>
                                                    <OtaLogo code={ch.channelCode} name={ch.channelName} size={18} />
                                                    <div className={styles.channelNameWrap}>
                                                        <span className={styles.channelName}>{ch.channelName}</span>
                                                        <span className={styles.channelMeta}>
                                                            Komisi {ch.commissionPercent || 0}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={styles.channelPrices}>
                                                    {(pricingViewMode === "all" || pricingViewMode === "gross_only") && (
                                                        <span className={styles.grossPrice}>
                                                            {formatPrice(gross)}
                                                        </span>
                                                    )}
                                                    {(pricingViewMode === "all" || pricingViewMode === "net_only") && (
                                                        <span className={styles.netBadge}>
                                                            <span className={styles.netBadgeLabel}>Net:</span>
                                                            <span>{formatPrice(netReceived)}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
