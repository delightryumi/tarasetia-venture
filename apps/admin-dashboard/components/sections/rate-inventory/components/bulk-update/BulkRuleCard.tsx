"use client";

import React from "react";
import { Trash2, Copy } from "lucide-react";
import { BulkRuleState, BulkStepId } from "./types";
import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
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
    const isStep2 = currentStep === "targets_values";

    return (
        <div className={styles.ruleCard}>
            {/* Header: Rule Title + Duplicate & Remove actions (strictly on Step 2) */}
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

                {isStep2 && (
                    <div className={styles.ruleHeaderRight}>
                        <button
                            type="button"
                            onClick={onDuplicate}
                            className={styles.iconBtn}
                            title="Duplikasi target kamar & nilai aturan ini"
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
                )}
            </div>

            {/* Step 2: Inline Target & Values Configuration */}
            {isStep2 && (
                <div className={styles.stepSection}>
                    {/* 1. Target Room Types & Rate Plans */}
                    <div className={styles.targetSectionWrapper}>
                        <div className={styles.sectionHeaderLine}>
                            <span className={styles.sectionHeaderTitle}>1. Target Kamar & Rate Plan:</span>
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

                    {/* 2. Values & Actions connected with 3D Soft Icons */}
                    <div className={styles.valuesSectionWrapper}>
                        <div className={styles.sectionHeaderLine}>
                            <span className={styles.sectionHeaderTitle}>2. Nilai Perubahan Komponen:</span>
                        </div>
                        <BulkValuesForm
                            rule={rule}
                            onChange={onUpdate}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
