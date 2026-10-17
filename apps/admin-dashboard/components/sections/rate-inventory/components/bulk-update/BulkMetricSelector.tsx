"use client";

import React from "react";
import {
    DollarSign,
    Bed,
    Ban,
    Clock,
    LogIn,
    LogOut,
    Calendar,
    Check,
    AlertCircle
} from "lucide-react";
import { BulkUpdateMetricType, MetricDefinition } from "./types";
import styles from "./BulkMetricSelector.module.css";

export const METRIC_DEFINITIONS: MetricDefinition[] = [
    {
        id: "rate",
        label: "Rates (Harga)",
        description: "Ubah harga kamar master atau rate plan",
        category: "price",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "rate"
    },
    {
        id: "inventory",
        label: "Inventory (Allotment)",
        description: "Ubah jumlah fisik ketersediaan unit kamar",
        category: "inventory",
        requiresRatePlan: false,
        requiresRoomType: true,
        icon: "inventory"
    },
    {
        id: "stopsell",
        label: "Stop Sell",
        description: "Buka atau tutup penjualan",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "stopsell"
    },
    {
        id: "minstay_through",
        label: "Min Stay Through",
        description: "Minimal durasi malam menginap",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "minstay_through"
    },
    {
        id: "minstay_arrival",
        label: "Min Stay Arrival",
        description: "Minimal malam jika check-in",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "minstay_arrival"
    },
    {
        id: "maxstay",
        label: "Maximum Stay",
        description: "Batas maksimal malam menginap",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "maxstay"
    },
    {
        id: "cta",
        label: "Closed to Arrival (COA)",
        description: "Larang check-in pada hari tersebut",
        category: "restriction",
        requiresRatePlan: true,
        requiresRoomType: true,
        icon: "cta"
    },
    {
        id: "ctd",
        label: "Closed to Departure (COD)",
        description: "Larang check-out pada hari tersebut",
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
                return <DollarSign size={14} />;
            case "inventory":
                return <Bed size={14} />;
            case "stopsell":
                return <Ban size={14} />;
            case "minstay_through":
            case "minstay_arrival":
                return <Clock size={14} />;
            case "maxstay":
                return <Calendar size={14} />;
            case "cta":
                return <LogIn size={14} />;
            case "ctd":
                return <LogOut size={14} />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>
                    Pilih Komponen yang Ingin Diperbarui
                </h4>

                <div className={styles.quickSelectButtons}>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className={styles.quickBtn}
                    >
                        Semua
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
                        className={styles.quickBtn}
                    >
                        Reset
                    </button>
                </div>
            </div>

            {selectedMetrics.length === 0 && (
                <div className={styles.errorBanner} role="alert">
                    <AlertCircle size={14} />
                    <span>Pilih minimal 1 komponen metrik untuk melanjutkan.</span>
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
                            <div
                                className={`${styles.checkboxVisual} ${
                                    isSelected ? styles.checkboxChecked : ""
                                }`}
                            >
                                {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>

                            <div className={styles.metricIcon}>
                                {renderIcon(metric.id)}
                            </div>
                            <span
                                className={`${styles.metricLabel} ${
                                    isSelected ? styles.metricLabelActive : ""
                                }`}
                            >
                                {metric.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
