"use client";

import React, { useState } from "react";
import {
    ChevronRight,
    ChevronLeft,
    SlidersHorizontal,
    Building2,
    RotateCcw,
    X,
    Send,
    Plus,
    Copy,
    Calendar,
    Clock,
    Layers,
    Info,
    Check
} from "lucide-react";
import { toast } from "sonner";
import {
    BulkRuleState,
    BulkStepId,
    BulkUpdateViewProps,
    BulkUpdateMetricType
} from "./types";
import { BulkUpdateStepper, BULK_STEPS } from "./BulkUpdateStepper";
import { BulkRuleCard } from "./BulkRuleCard";
import { BulkDateRangeSelector } from "./BulkDateRangeSelector";
import { BulkDaysChannelsSelector } from "./BulkDaysChannelsSelector";
import { BulkSummaryStep } from "./BulkSummaryStep";
import { BulkConfirmModal } from "./BulkConfirmModal";
import { BulkCertificationPresets } from "./BulkCertificationPresets";
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

    const createDefaultRule = (index: number, initialMetrics?: BulkUpdateMetricType[]): BulkRuleState => ({
        id: `rule-${Date.now()}-${index}`,
        title: `Aturan Target #${index + 1}`,
        selectedMetrics: initialMetrics || [],
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
        stopSellAction: "false",
        stopSell: false,
        minStayThroughAction: "set",
        minStayThroughValue: 1,
        minStayArrivalAction: "set",
        minStayArrivalValue: 1,
        maxStayAction: "none",
        maxStayValue: 30,
        ctaAction: "false",
        closedToArrival: false,
        ctdAction: "false",
        closedToDeparture: false
    });

    const [rules, setRules] = useState<BulkRuleState[]>([
        createDefaultRule(0, [])
    ]);
    const [currentStep, setCurrentStep] = useState<BulkStepId>("targets_values");
    const [completedSteps, setCompletedSteps] = useState<BulkStepId[]>([]);
    const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

    // Add new target rule
    const handleAddRule = () => {
        const newRule = createDefaultRule(rules.length, []);
        setRules(prev => [...prev, newRule]);
        toast.success(`Aturan #${rules.length + 1} ditambahkan.`);
    };

    // Duplicate target rule
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

    // Remove target rule
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

    // Convenience: Copy dates from Rule #1 to all other rules (Step 2)
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
        toast.success("Rentang tanggal dari Aturan #1 berhasil disalin ke semua target.");
    };

    // Convenience: Copy days & channels from Rule #1 to all other rules (Step 3)
    const handleSyncDaysChannelsFromFirst = () => {
        if (rules.length <= 1) return;
        const source = rules[0];
        setRules(prev =>
            prev.map(r => ({
                ...r,
                daysOfWeek: [...source.daysOfWeek],
                channelId: source.channelId
            }))
        );
        toast.success("Pengaturan hari & saluran dari Aturan #1 berhasil disalin ke semua target.");
    };

    // Reset confirmation
    const handleConfirmReset = () => {
        setRules([createDefaultRule(0, [])]);
        setCurrentStep("targets_values");
        setCompletedSteps([]);
        setShowResetConfirm(false);
        toast.success("Formulir bulk update telah direset.");
    };


    // Step validation helpers
    const validateStep = (step: BulkStepId): boolean => {
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
                if (r.selectedMetrics.length === 0) {
                    toast.error(`Aktifkan minimal 1 komponen pada ${r.title}.`);
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

    const markStepCompleted = (step: BulkStepId) => {
        setCompletedSteps(prev => (prev.includes(step) ? prev : [...prev, step]));
    };

    // Navigation handlers
    const goToNextStep = () => {
        if (!validateStep(currentStep)) return;

        markStepCompleted(currentStep);

        if (currentStep === "targets_values") {
            setCurrentStep("date_ranges");
        } else if (currentStep === "date_ranges") {
            setCurrentStep("days_channels");
        } else if (currentStep === "days_channels") {
            setCurrentStep("review_apply");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goToPrevStep = () => {
        if (currentStep === "date_ranges") {
            setCurrentStep("targets_values");
        } else if (currentStep === "days_channels") {
            setCurrentStep("date_ranges");
        } else if (currentStep === "review_apply") {
            setCurrentStep("days_channels");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleStepClick = (stepId: BulkStepId) => {
        const stepOrder: BulkStepId[] = [
            "targets_values",
            "date_ranges",
            "days_channels",
            "review_apply"
        ];
        const targetIdx = stepOrder.indexOf(stepId);
        const currentIdx = stepOrder.indexOf(currentStep);

        if (targetIdx <= currentIdx || completedSteps.includes(stepId)) {
            setCurrentStep(stepId);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (targetIdx === currentIdx + 1) {
            goToNextStep();
        }
    };

    // Human-readable target labels for Step 2 & 3
    const getRuleTargetLabel = (rule: BulkRuleState) => {
        const roomLabels = rule.roomTypeIds.includes("all")
            ? "Semua Tipe Kamar"
            : rule.roomTypeIds
                  .map(id => roomTypes.find(rt => rt.id === id)?.name || id)
                  .join(", ");

        const rateLabels = rule.ratePlanIds.includes("all")
            ? "Semua Rate Plan"
            : rule.ratePlanIds
                  .map(id => ratePlans.find(rp => rp.id === id)?.name || id)
                  .join(", ");

        return `${roomLabels} • ${rateLabels}`;
    };

    // Apply execution
    const handleApplyAll = async () => {
        for (const step of ["targets_values", "date_ranges", "days_channels"] as BulkStepId[]) {
            if (!validateStep(step)) {
                setCurrentStep(step);
                return;
            }
        }

        const itemsToApply: BulkUpdateItem[] = [];

        rules.forEach(rule => {
            const roomTargetList = rule.roomTypeIds.includes("all")
                ? ["all"]
                : rule.roomTypeIds;
            const ratePlanTargetList = rule.ratePlanIds.includes("all")
                ? ["all"]
                : rule.ratePlanIds;

            const isStopSellActive = rule.stopSell === true || rule.stopSellAction === "close" || rule.stopSellAction === "true";
            const isStopSellInactive = rule.stopSell === false || rule.stopSellAction === "open" || rule.stopSellAction === "false";

            const isCtaActive = rule.closedToArrival === true || rule.ctaAction === "close" || rule.ctaAction === "true";
            const isCtaInactive = rule.closedToArrival === false || rule.ctaAction === "open" || rule.ctaAction === "false";

            const isCtdActive = rule.closedToDeparture === true || rule.ctdAction === "close" || rule.ctdAction === "true";
            const isCtdInactive = rule.closedToDeparture === false || rule.ctdAction === "open" || rule.ctdAction === "false";

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
                        stopSellAction: rule.selectedMetrics.includes("stopsell") ? (isStopSellActive ? "true" : (isStopSellInactive ? "false" : "none")) : "none",
                        stopSell: rule.selectedMetrics.includes("stopsell") ? (isStopSellActive ? true : (isStopSellInactive ? false : undefined)) : undefined,
                        minStayThroughAction: rule.selectedMetrics.includes("minstay_through") ? rule.minStayThroughAction : "none",
                        minStayThroughValue: rule.selectedMetrics.includes("minstay_through") ? rule.minStayThroughValue : undefined,
                        minStayArrivalAction: rule.selectedMetrics.includes("minstay_arrival") ? rule.minStayArrivalAction : "none",
                        minStayArrivalValue: rule.selectedMetrics.includes("minstay_arrival") ? rule.minStayArrivalValue : undefined,
                        maxStayAction: rule.selectedMetrics.includes("maxstay") ? rule.maxStayAction : "none",
                        maxStayValue: rule.selectedMetrics.includes("maxstay") ? rule.maxStayValue : undefined,
                        ctaAction: rule.selectedMetrics.includes("cta") ? (isCtaActive ? "true" : (isCtaInactive ? "false" : "none")) : "none",
                        closedToArrival: rule.selectedMetrics.includes("cta") ? (isCtaActive ? true : (isCtaInactive ? false : undefined)) : undefined,
                        ctdAction: rule.selectedMetrics.includes("ctd") ? (isCtdActive ? "true" : (isCtdInactive ? "false" : "none")) : "none",
                        closedToDeparture: rule.selectedMetrics.includes("ctd") ? (isCtdActive ? true : (isCtdInactive ? false : undefined)) : undefined
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
            onClose();
        } catch (err: any) {
            console.error("Bulk update apply error:", err);
        }
    };

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

            {/* 2. Stepper Navigation (Streamlined 4-Step Stepper) */}
            <BulkUpdateStepper
                currentStep={currentStep}
                onStepClick={handleStepClick}
                completedSteps={completedSteps}
            />

            {/* 3. Main Content Area */}
            <div className={styles.contentArea}>
                {/* STEP 1: Target, Komponen & Nilai (Unified & Dynamic Per Target) */}
                {currentStep === "targets_values" && (
                    <div className={styles.rulesList}>
                        <BulkCertificationPresets
                            onAddRule={handleAddRule}
                            onSyncDates={handleSyncDatesFromFirst}
                            onReset={() => setShowResetConfirm(true)}
                            rulesCount={rules.length}
                        />

                        {/* Target Rule Cards: Dynamic Components & Values */}
                        {rules.map((rule, idx) => (
                            <BulkRuleCard
                                key={rule.id}
                                rule={rule}
                                ruleIndex={idx}
                                totalRules={rules.length}
                                roomTypes={roomTypes}
                                ratePlans={ratePlans}
                                channelConfigs={channelConfigs}
                                canChangeRate={canChangeRate}
                                canChangeInventory={canChangeInventory}
                                canStopSell={canStopSell}
                                showSchedule={false}
                                onUpdate={updates => handleUpdateRule(rule.id, updates)}
                                onRemove={() => handleRemoveRule(rule.id)}
                                onDuplicate={() => handleDuplicateRule(rule.id)}
                            />
                        ))}

                        {/* Add Rule Quick Button */}
                        <div className={styles.addRuleWrapper}>
                            <button
                                type="button"
                                onClick={handleAddRule}
                                className={styles.btnAddRule}
                            >
                                <Plus size={15} />
                                <span>Tambah Aturan Target Lainnya</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Rentang Tanggal (Dynamic Per Target - Slim & Compact) */}
                {currentStep === "date_ranges" && (
                    <div className={styles.rulesList}>
                        {/* Info & Sync Toolbar */}
                        {rules.length > 1 && (
                            <div className={styles.syncScheduleBar}>
                                <div className={styles.syncText}>
                                    <strong>💡 Tips Efisiensi:</strong> Setiap target dapat memiliki rentang tanggal berbeda, atau salin tanggal Aturan #1 ke semua target dengan satu klik.
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSyncDatesFromFirst}
                                    className={styles.btnSync}
                                    title="Salin tanggal mulai & selesai dari Aturan #1 ke semua aturan lainnya"
                                >
                                    <Copy size={12} />
                                    <span>Salin Tanggal #1 ke Semua</span>
                                </button>
                            </div>
                        )}

                        {rules.map((rule, idx) => (
                            <div key={rule.id} className={styles.ruleStepCard}>
                                <div className={styles.ruleStepHeader}>
                                    <div className={styles.ruleStepHeaderLeft}>
                                        <div className={styles.ruleStepBadge}>{idx + 1}</div>
                                        <span className={styles.ruleStepTitle}>{rule.title}</span>
                                        <span className={styles.ruleStepTargets}>{getRuleTargetLabel(rule)}</span>
                                    </div>
                                </div>

                                <BulkDateRangeSelector
                                    dateFrom={rule.dateFrom}
                                    dateTo={rule.dateTo}
                                    daysOfWeek={rule.daysOfWeek}
                                    onDateFromChange={val => handleUpdateRule(rule.id, { dateFrom: val })}
                                    onDateToChange={val => handleUpdateRule(rule.id, { dateTo: val })}
                                    showDays={false}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 3: Hari & Saluran (Dynamic Per Target - Slim & Compact) */}
                {currentStep === "days_channels" && (
                    <div className={styles.rulesList}>
                        {/* Info & Sync Toolbar */}
                        {rules.length > 1 && (
                            <div className={styles.syncScheduleBar}>
                                <div className={styles.syncText}>
                                    <strong>💡 Tips Efisiensi:</strong> Setiap target dapat memilih hari aktif dan channel OTA sendiri, atau salin pengaturan Aturan #1 ke semua target.
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSyncDaysChannelsFromFirst}
                                    className={styles.btnSync}
                                    title="Salin hari aktif dan saluran dari Aturan #1 ke semua aturan lainnya"
                                >
                                    <Copy size={12} />
                                    <span>Salin Hari &amp; Saluran #1 ke Semua</span>
                                </button>
                            </div>
                        )}

                        {rules.map((rule, idx) => (
                            <div key={rule.id} className={styles.ruleStepCard}>
                                <div className={styles.ruleStepHeader}>
                                    <div className={styles.ruleStepHeaderLeft}>
                                        <div className={styles.ruleStepBadge}>{idx + 1}</div>
                                        <span className={styles.ruleStepTitle}>{rule.title}</span>
                                        <span className={styles.ruleStepTargets}>{getRuleTargetLabel(rule)}</span>
                                        <span className={styles.ruleStepDatePill}>
                                            {rule.dateFrom} s/d {rule.dateTo}
                                        </span>
                                    </div>
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

                {/* STEP 4: Review & Simpan (Channex Format) */}
                {currentStep === "review_apply" && (
                    <div className={styles.stepCardContainer}>
                        <BulkSummaryStep
                            rules={rules}
                            roomTypes={roomTypes}
                            ratePlans={ratePlans}
                        />
                    </div>
                )}
            </div>

            {/* 4. Action Footer */}
            <div className={styles.footerBar}>
                <div className={styles.footerLeft}>
                    {currentStep === "targets_values" ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.btnCancel}
                        >
                            Batal
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={goToPrevStep}
                            className={styles.btnPrev}
                        >
                            <ChevronLeft size={13} />
                            <span>Kembali</span>
                        </button>
                    )}
                </div>

                <div className={styles.footerCenter}>
                    <span className={styles.stepInfoText}>
                        Langkah{" "}
                        <strong>
                            {BULK_STEPS.find(s => s.id === currentStep)?.stepNumber || 1} dari 4
                        </strong>
                        : {BULK_STEPS.find(s => s.id === currentStep)?.shortLabel}
                    </span>
                </div>

                <div className={styles.footerRight}>
                    {currentStep !== "review_apply" ? (
                        <button
                            type="button"
                            onClick={goToNextStep}
                            className={styles.btnNext}
                        >
                            <span>Lanjut</span>
                            <ChevronRight size={13} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleApplyAll}
                            disabled={saving}
                            className={styles.btnApply}
                        >
                            <Send size={13} />
                            <span>{saving ? "Menerapkan Pembaruan..." : "Terapkan Pembaruan Massal"}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 5. Reset Confirmation Modal */}
            <BulkConfirmModal
                isOpen={showResetConfirm}
                title="Reset Formulir Bulk Update?"
                message="Semua aturan target dan konfigurasi restriksi yang telah Anda buat akan dikembalikan ke kondisi awal."
                confirmText="Ya, Reset Formulir"
                cancelText="Batal"
                onConfirm={handleConfirmReset}
                onCancel={() => setShowResetConfirm(false)}
            />
        </div>
    );
}
