"use client";

import React, { useState } from "react";
import {
    Plus,
    Check,
    ChevronRight,
    ChevronLeft,
    SlidersHorizontal,
    Building2,
    RotateCcw,
    X,
    Link2
} from "lucide-react";
import { toast } from "sonner";
import {
    BulkRuleState,
    BulkStepId,
    BulkUpdateViewProps
} from "./types";
import { BulkUpdateStepper, BULK_STEPS } from "./BulkUpdateStepper";
import { BulkRuleCard } from "./BulkRuleCard";
import { BulkDateRangeSelector } from "./BulkDateRangeSelector";
import { BulkValuesForm } from "./BulkValuesForm";
import { BulkSummaryStep } from "./BulkSummaryStep";
import { BulkConfirmModal } from "./BulkConfirmModal";
import { BulkUpdateItem } from "../../RateInventoryTypes";
import styles from "./RateInventoryBulkUpdateView.module.css";

export function RateInventoryBulkUpdateView({
    onClose,
    onApply,
    roomTypes,
    ratePlans,
    channelConfigs = {},
    saving,
    defaultStartDate,
    canStopSell = true,
    canChangeRate = true,
    canChangeInventory = true,
    activeHotelName,
    activeHotelCode
}: BulkUpdateViewProps) {
    const todayStr = defaultStartDate || new Date().toISOString().split("T")[0];
    const defaultEndStr = (() => {
        const d = new Date(todayStr);
        d.setDate(d.getDate() + 30);
        return d.toISOString().split("T")[0];
    })();

    const createDefaultRule = (index: number): BulkRuleState => ({
        id: `rule-${Date.now()}-${index}`,
        title: `Aturan Target #${index + 1}`,
        selectedMetrics: ["rate"],
        roomTypeIds: ["all"],
        ratePlanIds: ["all"],
        channelId: "all",
        dateFrom: todayStr,
        dateTo: defaultEndStr,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        rateAction: "set",
        rateValueStr: "",
        rateValue: 0,
        inventoryAction: "set",
        inventoryValue: 0,
        stopSellAction: "none",
        minStayThroughAction: "none",
        minStayThroughValue: 1,
        minStayArrivalAction: "none",
        minStayArrivalValue: 1,
        maxStayAction: "none",
        maxStayValue: 30,
        ctaAction: "none",
        ctdAction: "none"
    });

    const [rules, setRules] = useState<BulkRuleState[]>([createDefaultRule(0)]);
    const [currentStep, setCurrentStep] = useState<BulkStepId>("metrics_targets");
    const [completedSteps, setCompletedSteps] = useState<BulkStepId[]>([]);
    const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

    // Summary text of rooms and rateplans for headers in steps 2 & 3
    const getRuleTargetSummary = (rule: BulkRuleState) => {
        const parts: string[] = [];
        if (rule.roomTypeIds.includes("all")) {
            parts.push("Semua Kamar");
        } else {
            const names = rule.roomTypeIds
                .map(id => roomTypes.find(rt => rt.id === id)?.name || id)
                .join(", ");
            parts.push(names);
        }

        if (rule.selectedMetrics.some(m => m !== "inventory")) {
            if (rule.ratePlanIds.includes("all")) {
                parts.push("Semua Rate Plan");
            } else {
                const names = rule.ratePlanIds
                    .map(id => {
                        const rp = ratePlans.find(r => r.id === id);
                        return rp?.name || rp?.code || id;
                    })
                    .join(", ");
                parts.push(names);
            }
        }
        return parts.join(" • ");
    };

    // Step 1: Add new target rule
    const handleAddRule = () => {
        setRules(prev => [...prev, createDefaultRule(prev.length)]);
        toast.info(`Aturan Target #${rules.length + 1} ditambahkan.`);
    };

    // Step 1: Remove rule
    const handleRemoveRule = (id: string) => {
        if (rules.length <= 1) return;
        setRules(prev => prev.filter(r => r.id !== id));
        toast.success("Aturan berhasil dihapus.");
    };

    // Step 1: Duplicate rule
    const handleDuplicateRule = (id: string) => {
        const target = rules.find(r => r.id === id);
        if (!target) return;
        const duplicated: BulkRuleState = {
            ...target,
            id: `rule-${Date.now()}-${rules.length}`,
            title: `${target.title} (Salinan)`
        };
        setRules(prev => [...prev, duplicated]);
        toast.success(`Aturan target diduplikasi.`);
    };

    const handleUpdateRule = (id: string, updates: Partial<BulkRuleState>) => {
        setRules(prev =>
            prev.map(r => (r.id === id ? { ...r, ...updates } : r))
        );
    };

    // Step 2 convenience: Copy schedule from Rule #1 to all other rules
    const handleSyncDatesFromFirst = () => {
        if (rules.length <= 1) return;
        const source = rules[0];
        setRules(prev =>
            prev.map(r => ({
                ...r,
                dateFrom: source.dateFrom,
                dateTo: source.dateTo,
                daysOfWeek: [...source.daysOfWeek]
            }))
        );
        toast.success("Jadwal dari Aturan #1 berhasil disalin ke semua aturan.");
    };

    // Reset confirmation
    const handleConfirmReset = () => {
        setRules([createDefaultRule(0)]);
        setCurrentStep("metrics_targets");
        setCompletedSteps([]);
        setShowResetConfirm(false);
        toast.success("Formulir bulk update telah direset.");
    };

    // Step flow
    const stepOrder: BulkStepId[] = [
        "metrics_targets",
        "dates_days",
        "values_actions",
        "review_apply"
    ];
    const currentStepIndex = stepOrder.indexOf(currentStep);

    const validateStep = (step: BulkStepId): boolean => {
        if (step === "metrics_targets") {
            const hasEmpty = rules.some(r => r.selectedMetrics.length === 0);
            if (hasEmpty) {
                toast.error("Setiap aturan harus memiliki minimal 1 komponen yang dipilih.");
                return false;
            }
            return true;
        }

        if (step === "dates_days") {
            for (let i = 0; i < rules.length; i++) {
                const r = rules[i];
                if (!r.dateFrom || !r.dateTo) {
                    toast.error(`Tanggal mulai dan selesai pada Aturan #${i + 1} wajib diisi.`);
                    return false;
                }
                if (new Date(r.dateFrom) > new Date(r.dateTo)) {
                    toast.error(`Tanggal selesai pada Aturan #${i + 1} tidak boleh lebih awal dari tanggal mulai.`);
                    return false;
                }
                if (r.daysOfWeek.length === 0) {
                    toast.error(`Pilih minimal 1 hari aktif pada Aturan #${i + 1}.`);
                    return false;
                }
            }
            return true;
        }

        if (step === "values_actions") {
            for (let i = 0; i < rules.length; i++) {
                const r = rules[i];
                if (r.selectedMetrics.includes("rate")) {
                    if (r.rateAction === "none") {
                        toast.error(`Pilih aksi perubahan Rate pada ${r.title}.`);
                        return false;
                    }
                    if (r.rateValueStr === "" && r.rateValue === 0) {
                        toast.error(`Masukkan nominal atau persentase Rate pada ${r.title}.`);
                        return false;
                    }
                }
                if (r.selectedMetrics.includes("inventory")) {
                    if (r.inventoryAction === "none") {
                        toast.error(`Pilih aksi Inventory pada ${r.title}.`);
                        return false;
                    }
                }
                if (r.selectedMetrics.includes("stopsell") && r.stopSellAction === "none") {
                    toast.error(`Pilih status Stop Sell (Buka / Tutup) pada ${r.title}.`);
                    return false;
                }
            }
            return true;
        }

        return true;
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) return;

        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps(prev => [...prev, currentStep]);
        }

        if (currentStepIndex < stepOrder.length - 1) {
            setCurrentStep(stepOrder[currentStepIndex + 1]);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(stepOrder[currentStepIndex - 1]);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleStepClick = (stepId: BulkStepId) => {
        const targetIdx = stepOrder.indexOf(stepId);
        if (targetIdx < currentStepIndex || completedSteps.includes(stepId)) {
            setCurrentStep(stepId);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            handleNext();
        }
    };

    // Apply execution
    const handleApplyAll = async () => {
        if (!validateStep("values_actions")) return;

        const itemsToApply: BulkUpdateItem[] = [];

        rules.forEach(rule => {
            const roomTargetList = rule.roomTypeIds.includes("all")
                ? ["all"]
                : rule.roomTypeIds;
            const ratePlanTargetList = rule.ratePlanIds.includes("all")
                ? ["all"]
                : rule.ratePlanIds;

            roomTargetList.forEach(rId => {
                ratePlanTargetList.forEach(rpId => {
                    itemsToApply.push({
                        id: `${rule.id}-${rId}-${rpId}`,
                        roomTypeId: rId,
                        ratePlanId: rpId,
                        dateFrom: rule.dateFrom,
                        dateTo: rule.dateTo,
                        daysOfWeek: rule.daysOfWeek,
                        channelId: rule.channelId,
                        rateAction: rule.selectedMetrics.includes("rate") ? rule.rateAction : "none",
                        rateValue: rule.selectedMetrics.includes("rate") ? rule.rateValue : undefined,
                        inventoryAction: rule.selectedMetrics.includes("inventory") ? rule.inventoryAction : "none",
                        inventoryValue: rule.selectedMetrics.includes("inventory") ? rule.inventoryValue : undefined,
                        stopSellAction: rule.selectedMetrics.includes("stopsell") ? rule.stopSellAction : "none",
                        minStayThroughAction: rule.selectedMetrics.includes("minstay_through") ? rule.minStayThroughAction : "none",
                        minStayThroughValue: rule.selectedMetrics.includes("minstay_through") ? rule.minStayThroughValue : undefined,
                        minStayArrivalAction: rule.selectedMetrics.includes("minstay_arrival") ? rule.minStayArrivalAction : "none",
                        minStayArrivalValue: rule.selectedMetrics.includes("minstay_arrival") ? rule.minStayArrivalValue : undefined,
                        maxStayAction: rule.selectedMetrics.includes("maxstay") ? rule.maxStayAction : "none",
                        maxStayValue: rule.selectedMetrics.includes("maxstay") ? rule.maxStayValue : undefined,
                        ctaAction: rule.selectedMetrics.includes("cta") ? rule.ctaAction : "none",
                        ctdAction: rule.selectedMetrics.includes("ctd") ? rule.ctdAction : "none"
                    });
                });
            });
        });

        if (itemsToApply.length === 0) {
            toast.error("Tidak ada item pembaruan yang dapat diproses.");
            return;
        }

        try {
            await onApply({
                mode: "multi",
                items: itemsToApply
            });
            // Redirect immediately back to inventory tab
            onClose();
        } catch (err: any) {
            console.error("Bulk update apply error:", err);
        }
    };

    const currentConfig = BULK_STEPS[currentStepIndex];

    return (
        <div className={styles.pageContainer}>
            {/* 1. Header Bar */}
            <div className={styles.headerBar}>
                <div className={styles.headerLeft}>
                    <SlidersHorizontal size={14} className={styles.headerIcon} />
                    <span className={styles.headerTitle}>Bulk Update</span>
                    {activeHotelName && (
                        <span className={styles.hotelBadge}>
                            <Building2 size={11} />
                            {activeHotelName}
                        </span>
                    )}
                </div>

                <div className={styles.headerRight}>
                    <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className={styles.btnSmall}
                        title="Reset formulir bulk update"
                    >
                        <RotateCcw size={11} />
                        <span>Reset</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.btnSmallDanger}
                        title="Tutup & kembali ke inventory"
                    >
                        <X size={12} />
                        <span>Tutup</span>
                    </button>
                </div>
            </div>

            {/* 2. Stepper Timeline Navigation */}
            <BulkUpdateStepper
                currentStep={currentStep}
                onStepClick={handleStepClick}
                completedSteps={completedSteps}
            />

            {/* 3. Main Stepper Content */}
            <div className={styles.contentArea}>
                {/* STEP 1: KOMPONEN & TARGET */}
                {currentStep === "metrics_targets" && (
                    <div className={styles.rulesList}>
                        {rules.map((rule, idx) => (
                            <BulkRuleCard
                                key={rule.id}
                                rule={rule}
                                ruleIndex={idx}
                                totalRules={rules.length}
                                currentStep={currentStep}
                                roomTypes={roomTypes}
                                ratePlans={ratePlans}
                                channelConfigs={channelConfigs}
                                canChangeRate={canChangeRate}
                                canChangeInventory={canChangeInventory}
                                canStopSell={canStopSell}
                                onUpdate={updates => handleUpdateRule(rule.id, updates)}
                                onRemove={() => handleRemoveRule(rule.id)}
                                onDuplicate={() => handleDuplicateRule(rule.id)}
                            />
                        ))}

                        {/* "+ Tambah Aturan Target Baru" only in Step 1 */}
                        <div className={styles.addRuleWrapper}>
                            <button
                                type="button"
                                onClick={handleAddRule}
                                className={styles.btnAddRule}
                                title="Tambahkan grup target kamar/aturan lainnya"
                            >
                                <Plus size={14} />
                                <span>+ Tambah Grup Target Kamar Lainnya</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: PERIODE & HARI - Fully mirrors rules from Step 1 */}
                {currentStep === "dates_days" && (
                    <div className={styles.rulesList}>
                        {rules.length > 1 && (
                            <div className={styles.syncScheduleBar}>
                                <span className={styles.syncText}>
                                    Terdapat <strong>{rules.length} aturan target</strong> yang dikonfigurasi dari Langkah 1.
                                </span>
                                <button
                                    type="button"
                                    onClick={handleSyncDatesFromFirst}
                                    className={styles.btnSync}
                                    title="Salin tanggal & hari dari Aturan #1 ke semua aturan lainnya"
                                >
                                    <Link2 size={12} />
                                    <span>Samakan Jadwal Semua Aturan</span>
                                </button>
                            </div>
                        )}

                        {rules.map((rule, idx) => (
                            <div key={rule.id} className={styles.ruleStepCard}>
                                {rules.length > 1 && (
                                    <div className={styles.ruleStepHeader}>
                                        <div className={styles.ruleStepBadge}>{idx + 1}</div>
                                        <span className={styles.ruleStepTitle}>{rule.title}</span>
                                        <span className={styles.ruleStepTargets}>
                                            ({getRuleTargetSummary(rule)})
                                        </span>
                                    </div>
                                )}
                                <BulkDateRangeSelector
                                    dateFrom={rule.dateFrom}
                                    dateTo={rule.dateTo}
                                    daysOfWeek={rule.daysOfWeek}
                                    onDateFromChange={from => handleUpdateRule(rule.id, { dateFrom: from })}
                                    onDateToChange={to => handleUpdateRule(rule.id, { dateTo: to })}
                                    onDaysOfWeekChange={days => handleUpdateRule(rule.id, { daysOfWeek: days })}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 3: ATUR PERUBAHAN NILAI - Fully mirrors rules from Step 1 */}
                {currentStep === "values_actions" && (
                    <div className={styles.rulesList}>
                        {rules.map((rule, idx) => (
                            <div key={rule.id} className={styles.ruleStepCard}>
                                {rules.length > 1 && (
                                    <div className={styles.ruleStepHeader}>
                                        <div className={styles.ruleStepBadge}>{idx + 1}</div>
                                        <span className={styles.ruleStepTitle}>{rule.title}</span>
                                        <span className={styles.ruleStepTargets}>
                                            ({getRuleTargetSummary(rule)})
                                        </span>
                                    </div>
                                )}
                                <BulkValuesForm
                                    rule={rule}
                                    onChange={updates => handleUpdateRule(rule.id, updates)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 4: REVIEW & EKSEKUSI */}
                {currentStep === "review_apply" && (
                    <BulkSummaryStep
                        rules={rules}
                        roomTypes={roomTypes}
                        ratePlans={ratePlans}
                    />
                )}
            </div>

            {/* 4. Bottom Action Bar */}
            <div className={styles.bottomNavFixed}>
                <div className={styles.bottomNavLeft}>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.btnNavCancel}
                    >
                        Batal
                    </button>
                    {currentStepIndex > 0 && (
                        <button
                            type="button"
                            onClick={handlePrev}
                            disabled={saving}
                            className={styles.btnNavSecondary}
                        >
                            <ChevronLeft size={13} />
                            <span>Sebelumnya</span>
                        </button>
                    )}
                </div>

                <div className={styles.stepIndicatorText}>
                    Langkah {currentConfig.stepNumber} dari {BULK_STEPS.length}:{" "}
                    <strong>{currentConfig.shortLabel}</strong> ({rules.length} Aturan Target)
                </div>

                {currentStep === "review_apply" ? (
                    <button
                        type="button"
                        onClick={handleApplyAll}
                        disabled={saving}
                        className={styles.btnNavPrimary}
                    >
                        {saving ? (
                            <>
                                <div className={styles.spinner} />
                                <span>Menerapkan...</span>
                            </>
                        ) : (
                            <>
                                <Check size={14} strokeWidth={2.8} />
                                <span>Terapkan {rules.length} Bulk Update</span>
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={saving}
                        className={styles.btnNavPrimary}
                    >
                        <span>Lanjut ke Langkah {currentStepIndex + 2}</span>
                        <ChevronRight size={13} />
                    </button>
                )}
            </div>

            {/* Custom Styled Confirm Dialog */}
            <BulkConfirmModal
                isOpen={showResetConfirm}
                title="Reset Formulir Bulk Update"
                message="Apakah Anda yakin ingin mereset seluruh formulir bulk update ini? Semua pengaturan yang telah dimasukkan akan dikembalikan ke kondisi awal."
                confirmText="Ya, Reset Formulir"
                cancelText="Batal"
                onConfirm={handleConfirmReset}
                onCancel={() => setShowResetConfirm(false)}
            />
        </div>
    );
}
