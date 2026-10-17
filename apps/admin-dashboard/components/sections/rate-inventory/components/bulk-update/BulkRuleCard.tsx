"use client";

import React from "react";
import { Trash2, Copy, Check, Sliders } from "lucide-react";
import { BulkRuleState, BulkStepId, BulkUpdateMetricType } from "./types";
import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
import { BulkTargetSelector } from "./BulkTargetSelector";
import { BulkRuleSchedule } from "./BulkRuleSchedule";
import { BulkValuesForm } from "./BulkValuesForm";
import styles from "./BulkRuleCard.module.css";

interface BulkRuleCardProps {
    rule: BulkRuleState;
    ruleIndex: number;
    totalRules: number;
    currentStep?: BulkStepId;
    roomTypes: RoomTypeInfo[];
    ratePlans: MyTaraRatePlan[];
    channelConfigs?: Record<string, any>;
    canChangeRate?: boolean;
    canChangeInventory?: boolean;
    canStopSell?: boolean;
    showSchedule?: boolean;
    onUpdate: (updates: Partial<BulkRuleState>) => void;
    onRemove: () => void;
    onDuplicate: () => void;
}

const ALL_METRICS: Array<{ id: BulkUpdateMetricType; label: string; short: string }> = [
    { id: "rate", label: "Harga (Rate)", short: "Rate" },
    { id: "stopsell", label: "Stop Sell (stop_sell)", short: "Stop Sell" },
    { id: "cta", label: "COA (closed_to_arrival)", short: "COA" },
    { id: "ctd", label: "COD (closed_to_departure)", short: "COD" },
    { id: "minstay_through", label: "Min Stay Through", short: "Min Stay Thru" },
    { id: "minstay_arrival", label: "Min Stay Arrival", short: "Min Stay Arr" },
    { id: "maxstay", label: "Max Stay (max_stay)", short: "Max Stay" },
    { id: "inventory", label: "Inventory (Allotment)", short: "Inventory" }
];

export function BulkRuleCard({
    rule,
    ruleIndex,
    totalRules,
    roomTypes,
    ratePlans,
    channelConfigs,
    canChangeRate,
    canChangeInventory,
    canStopSell,
    showSchedule = false,
    onUpdate,
    onRemove,
    onDuplicate
}: BulkRuleCardProps) {
    const toggleMetric = (metricId: BulkUpdateMetricType) => {
        const current = rule.selectedMetrics;
        if (current.includes(metricId)) {
            onUpdate({ selectedMetrics: current.filter(m => m !== metricId) });
        } else {
            onUpdate({ selectedMetrics: [...current, metricId] });
        }
    };

    return (
        <div className={styles.ruleCard}>
            {/* Header: Rule Title + Actions */}
            <div className={styles.ruleCardHeader}>
                <div className={styles.ruleHeaderLeft}>
                    <div className={styles.ruleNumberBadge}>{ruleIndex + 1}</div>
                    <input
                        type="text"
                        value={rule.title}
                        onChange={e => onUpdate({ title: e.target.value })}
                        placeholder={`Aturan #${ruleIndex + 1}`}
                        className={styles.ruleTitleInput}
                        title="Klik untuk mengubah nama aturan ini"
                    />
                </div>

                <div className={styles.ruleHeaderRight}>
                    <button
                        type="button"
                        onClick={onDuplicate}
                        className={styles.iconBtn}
                        title="Duplikasi aturan ini"
                    >
                        <Copy size={13} />
                        <span>Duplikasi</span>
                    </button>

                    {totalRules > 1 && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Hapus aturan ini"
                        >
                            <Trash2 size={13} />
                            <span>Hapus</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Modular Content */}
            <div className={styles.stepSection}>
                {/* 1. Target Room Types & Rate Plans */}
                <div className={styles.targetSectionWrapper}>
                    <div className={styles.sectionHeaderLine}>
                        <span className={styles.sectionHeaderTitle}>1. Target Kamar &amp; Rate Plan:</span>
                    </div>
                    <BulkTargetSelector
                        selectedMetrics={rule.selectedMetrics}
                        roomTypes={roomTypes}
                        ratePlans={ratePlans}
                        channelConfigs={channelConfigs}
                        roomTypeIds={rule.roomTypeIds}
                        ratePlanIds={rule.ratePlanIds}
                        channelId={rule.channelId}
                        onRoomTypesChange={ids => onUpdate({ roomTypeIds: ids })}
                        onRatePlansChange={ids => onUpdate({ ratePlanIds: ids })}
                        onChannelChange={ch => onUpdate({ channelId: ch })}
                        showChannel={false}
                    />
                </div>

                {/* Optional Schedule: Date Range & Days of Week */}
                {showSchedule && (
                    <div className={styles.targetSectionWrapper}>
                        <div className={styles.sectionHeaderLine}>
                            <span className={styles.sectionHeaderTitle}>2. Periode Tanggal &amp; Hari Aktif:</span>
                        </div>
                        <BulkRuleSchedule
                            dateFrom={rule.dateFrom}
                            dateTo={rule.dateTo}
                            daysOfWeek={rule.daysOfWeek}
                            onDateChange={(df, dt) => onUpdate({ dateFrom: df, dateTo: dt })}
                            onDaysChange={days => onUpdate({ daysOfWeek: days })}
                        />
                    </div>
                )}

                {/* Metric Toggles & Values */}
                <div className={styles.valuesSectionWrapper}>
                    <div className={styles.sectionHeaderLine}>
                        <span className={styles.sectionHeaderTitle}>
                            {showSchedule ? "3. Komponen Restriksi & Nilai yang Diperbarui:" : "2. Komponen Restriksi & Nilai yang Diperbarui:"}
                        </span>
                    </div>

                    {/* Metric Selector Chips for THIS rule */}
                    <div className={styles.metricsToggleRow}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Sliders size={12} />
                            Komponen:
                        </span>
                        {ALL_METRICS.map(m => {
                            const isSelected = rule.selectedMetrics.includes(m.id);
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => toggleMetric(m.id)}
                                    className={`${styles.metricChip} ${isSelected ? styles.metricChipActive : ""}`}
                                    title={`Klik untuk mengaktifkan/menonaktifkan ${m.label} pada aturan ini`}
                                >
                                    <span className={styles.metricChipLabel}>{m.short}</span>
                                    <div className={`${styles.circleIndicator} ${isSelected ? styles.circleIndicatorActive : ""}`}>
                                        {isSelected && <Check size={10} strokeWidth={3.5} />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Values Form */}
                    <BulkValuesForm
                        rule={rule}
                        onChange={onUpdate}
                    />
                </div>
            </div>
        </div>
    );
}
