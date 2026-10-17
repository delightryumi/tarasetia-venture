"use client";

import React from "react";
import { Trash2, Copy, Bed } from "lucide-react";
import { BulkRuleState, BulkStepId } from "./types";
import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
import { BulkMetricSelector } from "./BulkMetricSelector";
import { BulkTargetSelector } from "./BulkTargetSelector";
import { BulkValuesForm } from "./BulkValuesForm";
import styles from "./BulkRuleCard.module.css";

interface BulkRuleCardProps {
    rule: BulkRuleState;
    ruleIndex: number;
    totalRules: number;
    currentStep: BulkStepId;
    roomTypes: RoomTypeInfo[];
    ratePlans: MyTaraRatePlan[];
    channelConfigs?: Record<string, any>;
    canChangeRate?: boolean;
    canChangeInventory?: boolean;
    canStopSell?: boolean;
    onUpdate: (updates: Partial<BulkRuleState>) => void;
    onRemove: () => void;
    onDuplicate: () => void;
}

export function BulkRuleCard({
    rule,
    ruleIndex,
    totalRules,
    currentStep,
    roomTypes,
    ratePlans,
    channelConfigs,
    canChangeRate,
    canChangeInventory,
    canStopSell,
    onUpdate,
    onRemove,
    onDuplicate
}: BulkRuleCardProps) {
    const showHeader = totalRules > 1 || currentStep === "metrics_targets";

    // Summary of selected room types for Step 3 title
    const selectedRoomsSummary = () => {
        if (rule.roomTypeIds.includes("all")) {
            return "Semua Tipe Kamar";
        }
        return rule.roomTypeIds
            .map(id => roomTypes.find(rt => rt.id === id)?.name || id)
            .join(", ");
    };

    return (
        <div className={styles.ruleCard}>
            {/* Header: Only shown if multiple rules or on Step 1. Duplicate & Remove ONLY on Step 1! */}
            {showHeader && (
                <div className={styles.ruleCardHeader}>
                    <div className={styles.ruleHeaderLeft}>
                        {totalRules > 1 && (
                            <div className={styles.ruleNumberBadge}>{ruleIndex + 1}</div>
                        )}
                        <input
                            type="text"
                            value={rule.title}
                            onChange={e => onUpdate({ title: e.target.value })}
                            placeholder={`Aturan #${ruleIndex + 1}`}
                            className={styles.ruleTitleInput}
                            title="Klik untuk mengubah nama aturan ini"
                        />
                        {currentStep === "values_actions" && totalRules > 1 && (
                            <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
                                ({selectedRoomsSummary()})
                            </span>
                        )}
                    </div>

                    {/* Duplicate & Remove ONLY on Step 1! */}
                    {currentStep === "metrics_targets" && (
                        <div className={styles.ruleHeaderRight}>
                            <button
                                type="button"
                                onClick={onDuplicate}
                                className={styles.iconBtn}
                                title="Duplikasi aturan target ini"
                            >
                                <Copy size={12} />
                                <span>Duplikasi</span>
                            </button>

                            {totalRules > 1 && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                    title="Hapus aturan ini"
                                >
                                    <Trash2 size={12} />
                                    <span>Hapus</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Step 1: Metrics & Target Selection */}
            {currentStep === "metrics_targets" && (
                <div className={styles.stepSection}>
                    <BulkMetricSelector
                        selectedMetrics={rule.selectedMetrics}
                        onChange={metrics => onUpdate({ selectedMetrics: metrics })}
                        canChangeRate={canChangeRate}
                        canChangeInventory={canChangeInventory}
                        canStopSell={canStopSell}
                    />

                    {rule.selectedMetrics.length > 0 && (
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
                        />
                    )}
                </div>
            )}

            {/* Step 3: Values & Actions Form */}
            {currentStep === "values_actions" && (
                <div className={styles.stepSection}>
                    <BulkValuesForm
                        rule={rule}
                        onChange={onUpdate}
                    />
                </div>
            )}
        </div>
    );
}
