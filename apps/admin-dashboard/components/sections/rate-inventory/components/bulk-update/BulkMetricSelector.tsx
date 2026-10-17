"use client";

import { Check, AlertCircle } from "lucide-react";
import { BulkUpdateMetricType, MetricDefinition } from "./types";
import {
    Rate3DIcon,
    Inventory3DIcon,
    MinStayThrough3DIcon,
    MinStayArrival3DIcon,
    StopSell3DIcon,
    MaxStay3DIcon,
    Cta3DIcon,
    Ctd3DIcon
} from "./Bulk3DIcons";
import styles from "./BulkMetricSelector.module.css";

export const METRIC_DEFINITIONS: MetricDefinition[] = [
    {
        id: "rate",
        label: "Rates (Harga)",
        description: "Ubah harga kamar master atau rate plan turunan",
        category: "price",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "rate"
    },
    {
        id: "inventory",
        label: "Inventory (Allotment)",
        description: "Atur jumlah fisik ketersediaan unit kamar",
        category: "inventory",
        requiresRatePlan: false,
        requiresRoomType: true,
        icon: "inventory"
    },
    {
        id: "minstay_through",
        label: "Min Stay Through",
        description: "Minimal durasi malam inap yang melintasi tanggal",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "minstay_through"
    },
    {
        id: "minstay_arrival",
        label: "Min Stay Arrival",
        description: "Minimal malam jika tamu check-in di tanggal ini",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "minstay_arrival"
    },
    {
        id: "stopsell",
        label: "Stop Sell",
        description: "Buka atau tutup penjualan kamar secara menyeluruh",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "stopsell"
    },
    {
        id: "maxstay",
        label: "Maximum Stay",
        description: "Batas maksimal durasi malam pemesanan",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "maxstay"
    },
    {
        id: "cta",
        label: "Closed to Arrival (COA)",
        description: "Kunci larangan tamu check-in pada tanggal ini",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "cta"
    },
    {
        id: "ctd",
        label: "Closed to Departure (COD)",
        description: "Kunci larangan tamu check-out pada tanggal ini",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "ctd"
    }
];

interface BulkMetricSelectorProps {
    selectedMetrics: BulkUpdateMetricType[];
    onChange: (metrics: BulkUpdateMetricType[]) => void;
    canChangeRate?: boolean;
    canChangeInventory?: boolean;
    canStopSell?: boolean;
}

export function BulkMetricSelector({
    selectedMetrics,
    onChange,
    canChangeRate = true,
    canChangeInventory = true,
    canStopSell = true
}: BulkMetricSelectorProps) {
    const handleToggle = (metricId: BulkUpdateMetricType) => {
        if (selectedMetrics.includes(metricId)) {
            onChange(selectedMetrics.filter(m => m !== metricId));
        } else {
            onChange([...selectedMetrics, metricId]);
        }
    };

    const handleSelectAll = () => {
        const available = METRIC_DEFINITIONS.filter(m => {
            if (m.id === "rate" && !canChangeRate) return false;
            if (m.id === "inventory" && !canChangeInventory) return false;
            if (m.id === "stopsell" && !canStopSell) return false;
            return true;
        }).map(m => m.id);
        onChange(available);
    };

    const handleSelectRestrictionsOnly = () => {
        const restrictions: BulkUpdateMetricType[] = [
            "stopsell",
            "minstay_through",
            "minstay_arrival",
            "maxstay",
            "cta",
            "ctd"
        ];
        onChange(restrictions);
    };

    const renderIcon = (type: BulkUpdateMetricType) => {
        switch (type) {
            case "rate":
                return <Rate3DIcon size={42} />;
            case "inventory":
                return <Inventory3DIcon size={42} />;
            case "minstay_through":
                return <MinStayThrough3DIcon size={42} />;
            case "minstay_arrival":
                return <MinStayArrival3DIcon size={42} />;
            case "stopsell":
                return <StopSell3DIcon size={42} />;
            case "maxstay":
                return <MaxStay3DIcon size={42} />;
            case "cta":
                return <Cta3DIcon size={42} />;
            case "ctd":
                return <Ctd3DIcon size={42} />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.sectionHeader}>
                <div>
                    <h4 className={styles.sectionTitle}>
                        Pilih Komponen yang Ingin Diperbarui
                    </h4>
                    <p className={styles.sectionSubtitle}>
                        Klik satu atau beberapa metrik di bawah untuk menentukan target pembaruan massal.
                    </p>
                </div>

                <div className={styles.quickSelectButtons}>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className={styles.quickBtn}
                    >
                        Pilih Semua
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange(["rate"])}
                        className={styles.quickBtn}
                    >
                        Hanya Rate
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange(["inventory"])}
                        className={styles.quickBtn}
                    >
                        Hanya Inventory
                    </button>
                    <button
                        type="button"
                        onClick={handleSelectRestrictionsOnly}
                        className={styles.quickBtn}
                    >
                        Hanya Restriksi
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange([])}
                        className={`${styles.quickBtn} ${styles.quickBtnReset}`}
                        title="Kosongkan semua pilihan"
                    >
                        Kosongkan
                    </button>
                </div>
            </div>

            {selectedMetrics.length === 0 && (
                <div className={styles.infoBanner}>
                    <AlertCircle size={15} />
                    <span>Belum ada komponen yang dipilih. Silakan klik salah satu kartu di bawah untuk memulai.</span>
                </div>
            )}

            <div className={styles.metricsGrid}>
                {METRIC_DEFINITIONS.map(metric => {
                    const isSelected = selectedMetrics.includes(metric.id);
                    let isDisabled = false;
                    let disabledReason = "";

                    if (metric.id === "rate" && !canChangeRate) {
                        isDisabled = true;
                        disabledReason = "Tidak memiliki izin mengubah Rate";
                    } else if (metric.id === "inventory" && !canChangeInventory) {
                        isDisabled = true;
                        disabledReason = "Tidak memiliki izin mengubah Inventory";
                    } else if (metric.id === "stopsell" && !canStopSell) {
                        isDisabled = true;
                        disabledReason = "Tidak memiliki izin mengubah Stop Sell";
                    }

                    return (
                        <div
                            key={metric.id}
                            role="checkbox"
                            aria-checked={isSelected}
                            tabIndex={isDisabled ? -1 : 0}
                            onClick={() => !isDisabled && handleToggle(metric.id)}
                            onKeyDown={e => {
                                if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
                                    e.preventDefault();
                                    handleToggle(metric.id);
                                }
                            }}
                            title={disabledReason || undefined}
                            className={`${styles.metricCard} ${
                                isSelected ? styles.metricCardActive : ""
                            } ${isDisabled ? styles.metricCardDisabled : ""}`}
                        >
                            <div className={styles.cardTopRow}>
                                <div className={`${styles.iconBadge} ${styles[`iconBadge_${metric.id}`] || ""}`}>
                                    {renderIcon(metric.id)}
                                </div>
                                <div
                                    className={`${styles.checkboxCircle} ${
                                        isSelected ? styles.checkboxCircleActive : ""
                                    }`}
                                >
                                    {isSelected && <Check size={11} strokeWidth={3.5} />}
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <div
                                    className={`${styles.metricTitle} ${
                                        isSelected ? styles.metricTitleActive : ""
                                    }`}
                                >
                                    {metric.label}
                                </div>
                                <div className={styles.metricDesc}>
                                    {metric.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
