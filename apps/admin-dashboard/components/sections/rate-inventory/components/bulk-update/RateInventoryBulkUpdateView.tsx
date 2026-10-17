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
    BulkUpdateViewProps,
    BulkUpdateMetricType
} from "./types";
import { BulkUpdateStepper, BULK_STEPS } from "./BulkUpdateStepper";
import { BulkMetricSelector } from "./BulkMetricSelector";
import { BulkRuleCard } from "./BulkRuleCard";
import { BulkDateRangeSelector } from "./BulkDateRangeSelector";
import { BulkDaysChannelsSelector } from "./BulkDaysChannelsSelector";
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

    const [globalMetrics, setGlobalMetrics] = useState<BulkUpdateMetricType[]>([]);

    const createDefaultRule = (index: number, initialMetrics = globalMetrics): BulkRuleState => ({
        id: `rule-${Date.now()}-${index}`,
        title: `Aturan Target #${index + 1}`,
        selectedMetrics: [...initialMetrics],
        roomTypeIds: ["all"],
        ratePlanIds: ["all"],
        channelId: "all",
        dateFrom: todayStr,
        dateTo: defaultEndStr,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        rateAction: "set",
        rateValueStr: "0",
        rateValue: 0,
        inventoryAction: "set",
        inventoryValue: 5,
        stopSellAction: "close",
        minStayThroughAction: "set",
        minStayThroughValue: 1,
        minStayArrivalAction: "set",
        minStayArrivalValue: 1,
        maxStayAction: "set",
        maxStayValue: 30,
        ctaAction: "close",
        ctdAction: "close"
    });

    const [rules, setRules] = useState<BulkRuleState[]>([createDefaultRule(0)]);
    const [currentStep, setCurrentStep] = useState<BulkStepId>("metrics_select");
    const [completedSteps, setCompletedSteps] = useState<BulkStepId[]>([]);
    const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

    // Summary text of rooms and rateplans for headers in steps 3 & 4
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

    // Step 1: When user selects global metrics, update all rules
    const handleGlobalMetricsChange = (metrics: BulkUpdateMetricType[]) => {
        setGlobalMetrics(metrics);
        setRules(prev =>
            prev.map(r => ({
                ...r,
                selectedMetrics: [...metrics]
            }))
        );
    };

    // Step 2: Add new target rule
    const handleAddRule = () => {
        const newRule = createDefaultRule(rules.length, globalMetrics);
        setRules(prev => [...prev, newRule]);
        toast.success(`Aturan #${rules.length + 1} ditambahkan.`);
    };

    // Step 2: Duplicate target rule
    const handleDuplicateRule = (ruleId: string) => {
        const ruleToDuplicate = rules.find(r => r.id === ruleId);
        if (!ruleToDuplicate) return;

        const duplicated: BulkRuleState = {
            ...ruleToDuplicate,
            id: `rule-${Date.now()}-${rules.length}`,
            title: `${ruleToDuplicate.title} (Salinan)`
        };

        setRules(prev => [...prev, duplicated]);
        toast.success(`Berhasil menduplikasi ${ruleToDuplicate.title}.`);
    };

    // Step 2: Remove target rule
    const handleRemoveRule = (ruleId: string) => {
        if (rules.length <= 1) return;
        setRules(prev => prev.filter(r => r.id !== ruleId));
        toast.info("Aturan target telah dihapus.");
    };

    // Update rule state
    const handleUpdateRule = (ruleId: string, updates: Partial<BulkRuleState>) => {
        setRules(prev =>
            prev.map(r => (r.id === ruleId ? { ...r, ...updates } : r))
        );
    };

    // Step 3 convenience: Copy dates from Rule #1 to all other rules
    const handleSyncDatesFromFirst = () => {
        if (rules.length <= 1) return;
        const source = rules[0];
        setRules(prev =>
            prev.map(r => ({
                ...r,
                dateFrom: source.dateFrom,
                dateTo: source.dateTo
            }))
        );
        toast.success("Rentang tanggal dari Aturan #1 berhasil disalin ke semua aturan.");
    };

    // Step 4 convenience: Copy days & channels from Rule #1 to all other rules
    const handleSyncDaysFromFirst = () => {
        if (rules.length <= 1) return;
        const source = rules[0];
        setRules(prev =>
            prev.map(r => ({
                ...r,
                daysOfWeek: [...source.daysOfWeek],
                channelId: source.channelId
            }))
        );
        toast.success("Pilihan hari & saluran dari Aturan #1 berhasil disalin ke semua aturan.");
    };

    // Reset confirmation
    const handleConfirmReset = () => {
        const defaultRule = createDefaultRule(0, []);
        setGlobalMetrics([]);
        setRules([defaultRule]);
        setCurrentStep("metrics_select");
        setCompletedSteps([]);
        setShowResetConfirm(false);
        toast.success("Formulir bulk update telah direset.");
    };

    // 5-Step Order
    const stepOrder: BulkStepId[] = [
        "metrics_select",
        "targets_values",
        "date_ranges",
        "days_channels",
        "review_apply"
    ];
    const currentStepIndex = stepOrder.indexOf(currentStep);

    const validateStep = (step: BulkStepId): boolean => {
        if (step === "metrics_select") {
            if (globalMetrics.length === 0) {
                toast.error("Pilih minimal 1 komponen metrik untuk melanjutkan.");
                return false;
            }
            return true;
        }

        if (step === "targets_values") {
            for (let i = 0; i < rules.length; i++) {
                const r = rules[i];
                if (r.roomTypeIds.length === 0) {
                    toast.error(`Pilih minimal 1 tipe kamar pada ${r.title}.`);
                    return false;
                }
                if (r.selectedMetrics.some(m => m !== "inventory") && r.ratePlanIds.length === 0) {
                    toast.error(`Pilih minimal 1 rate plan pada ${r.title}.`);
                    return false;
                }
                if (r.selectedMetrics.includes("rate") && r.rateAction === "none") {
                    toast.error(`Pilih aksi perubahan Rate pada ${r.title}.`);
                    return false;
                }
            }
            return true;
        }

        if (step === "date_ranges") {
            for (let i = 0; i < rules.length; i++) {
                const r = rules[i];
                if (!r.dateFrom || !r.dateTo) {
                    toast.error(`Tanggal mulai dan selesai pada ${r.title} wajib diisi.`);
                    return false;
                }
                if (new Date(r.dateFrom) > new Date(r.dateTo)) {
                    toast.error(`Tanggal selesai pada ${r.title} tidak boleh lebih awal dari tanggal mulai.`);
                    return false;
                }
            }
            return true;
        }

        if (step === "days_channels") {
            for (let i = 0; i < rules.length; i++) {
                const r = rules[i];
                if (r.daysOfWeek.length === 0) {
                    toast.error(`Pilih minimal 1 hari aktif pada ${r.title}.`);
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

            {/* 2. Stepper Timeline Navigation (5 Steps) */}
            <BulkUpdateStepper
                currentStep={currentStep}
                onStepClick={handleStepClick}
                completedSteps={completedSteps}
            />

            {/* 3. Main Stepper Content */}
            <div className={styles.contentArea}>
                {/* STEP 1: PILIH KOMPONEN */}
                {currentStep === "metrics_select" && (
                    <div className={styles.stepCardContainer}>
                        <BulkMetricSelector
                            selectedMetrics={globalMetrics}
                            onChange={handleGlobalMetricsChange}
                            canChangeRate={canChangeRate}
                            canChangeInventory={canChangeInventory}
                            canStopSell={canStopSell}
                        />
                    </div>
                )}

                {/* STEP 2: TARGET & NILAI (Inline Multi-Rule Target & Input Nilai) */}
                {currentStep === "targets_values" && (
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

                        {/* "+ Tambah Target Kamar / Aturan Baru" */}
                        <div className={styles.addRuleWrapper}>
                            <button
                                type="button"
                                onClick={handleAddRule}
                                className={styles.btnAddRule}
                                title="Tambahkan target kamar / aturan lainnya"
                            >
                                <Plus size={14} />
                                <span>Tambah Target Kamar / Aturan Baru</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: RENTANG TANGGAL */}
                {currentStep === "date_ranges" && (
                    <div className={styles.rulesList}>
                        {rules.length > 1 && (
                            <div className={styles.syncScheduleBar}>
                                <span className={styles.syncText}>
                                    Terdapat <strong>{rules.length} aturan target</strong> yang dikonfigurasi.
                                </span>
                                <button
                                    type="button"
                                    onClick={handleSyncDatesFromFirst}
                                    className={styles.btnSync}
                                    title="Salin tanggal dari Aturan #1 ke semua aturan lainnya"
                                >
                                    <Link2 size={12} />
                                    <span>Samakan Tanggal Semua Aturan</span>
                                </button>
                            </div>
                        )}

                        {rules.map((rule, idx) => (
                            <div key={rule.id} className={styles.ruleStepCard}>
                                <div className={styles.ruleStepHeader}>
                                    <div className={styles.ruleStepBadge}>{idx + 1}</div>
                                    <span className={styles.ruleStepTitle}>{rule.title}</span>
                                    <span className={styles.ruleStepTargets}>
                                        ({getRuleTargetSummary(rule)})
                                    </span>
                                </div>
                                <BulkDateRangeSelector
                                    dateFrom={rule.dateFrom}
                                    dateTo={rule.dateTo}
                                    daysOfWeek={rule.daysOfWeek}
                                    onDateFromChange={from => handleUpdateRule(rule.id, { dateFrom: from })}
                                    onDateToChange={to => handleUpdateRule(rule.id, { dateTo: to })}
                                    showDays={false}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 4: HARI & SALURAN */}
                {currentStep === "days_channels" && (
                    <div className={styles.rulesList}>
                        {rules.length > 1 && (
                            <div className={styles.syncScheduleBar}>
                                <span className={styles.syncText}>
                                    Terdapat <strong>{rules.length} aturan target</strong> yang dikonfigurasi.
                                </span>
                                <button
                                    type="button"
                                    onClick={handleSyncDaysFromFirst}
                                    className={styles.btnSync}
                                    title="Salin hari & saluran dari Aturan #1 ke semua aturan lainnya"
                                >
                                    <Link2 size={12} />
                                    <span>Samakan Hari &amp; Saluran Semua Aturan</span>
                                </button>
                            </div>
                        )}

                        {rules.map((rule, idx) => (
                            <div key={rule.id} className={styles.ruleStepCard}>
                                <div className={styles.ruleStepHeader}>
                                    <div className={styles.ruleStepBadge}>{idx + 1}</div>
                                    <span className={styles.ruleStepTitle}>{rule.title}</span>
                                    <span className={styles.ruleStepTargets}>
                                        ({getRuleTargetSummary(rule)})
                                    </span>
                                </div>
                                <BulkDaysChannelsSelector
                                    daysOfWeek={rule.daysOfWeek}
                                    channelId={rule.channelId}
                                    channelConfigs={channelConfigs}
                                    dateFrom={rule.dateFrom}
                                    dateTo={rule.dateTo}
                                    onDaysOfWeekChange={days => handleUpdateRule(rule.id, { daysOfWeek: days })}
                                    onChannelChange={ch => handleUpdateRule(rule.id, { channelId: ch })}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 5: REVIEW & TERAPKAN */}
                {currentStep === "review_apply" && (
                    <BulkSummaryStep
                        rules={rules}
                        roomTypes={roomTypes}
                        ratePlans={ratePlans}
                    />
                )}
            </div>

            {/* 4. Bottom Sticky Action Navigation Bar */}
            <div className={styles.footerBar}>
                <div className={styles.footerLeft}>
                    {currentStepIndex > 0 ? (
                        <button
                            type="button"
                            onClick={handlePrev}
                            className={styles.btnPrev}
                        >
                            <ChevronLeft size={14} />
                            <span>Sebelumnya</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.btnCancel}
                        >
                            Batal
                        </button>
                    )}
                </div>

                <div className={styles.footerCenter}>
                    <span className={styles.stepInfoText}>
                        Langkah {currentStepIndex + 1} dari {stepOrder.length}:{" "}
                        <strong>{currentConfig.shortLabel}</strong>
                        {rules.length > 1 && ` (${rules.length} Aturan Target)`}
                    </span>
                </div>

                <div className={styles.footerRight}>
                    {currentStepIndex < stepOrder.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className={styles.btnNext}
                            disabled={currentStep === "metrics_select" && globalMetrics.length === 0}
                            title={
                                currentStep === "metrics_select" && globalMetrics.length === 0
                                    ? "Pilih minimal 1 komponen metrik untuk melanjutkan"
                                    : undefined
                            }
                        >
                            <span>Lanjut ke Langkah {currentStepIndex + 2}</span>
                            <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleApplyAll}
                            disabled={saving}
                            className={styles.btnApply}
                        >
                            {saving ? (
                                <>
                                    <div className={styles.btnSpinner} />
                                    <span>Menerapkan Bulk Update...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span>Terapkan Bulk Update Sekarang</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Custom CSS Reset Confirmation Modal */}
            <BulkConfirmModal
                isOpen={showResetConfirm}
                title="Reset Semua Pengaturan?"
                message="Semua perubahan metrik, tanggal, hari, dan aturan yang belum disimpan akan dikembalikan ke kondisi awal."
                confirmText="Ya, Reset Formulir"
                cancelText="Batal"
                isDanger={true}
                onConfirm={handleConfirmReset}
                onCancel={() => setShowResetConfirm(false)}
            />
        </div>
    );
}
