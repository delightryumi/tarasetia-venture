"use client";

import React from "react";
import { Check } from "lucide-react";
import { BulkStepId, BulkStepConfig } from "./types";
import styles from "./BulkUpdateStepper.module.css";

export const BULK_STEPS: BulkStepConfig[] = [
    {
        id: "metrics_select",
        stepNumber: 1,
        title: "1. Pilih Komponen",
        subtitle: "Metrik update",
        shortLabel: "Komponen"
    },
    {
        id: "targets_values",
        stepNumber: 2,
        title: "2. Target & Nilai",
        subtitle: "Kamar, rate plan & angka",
        shortLabel: "Target & Nilai"
    },
    {
        id: "date_ranges",
        stepNumber: 3,
        title: "3. Rentang Tanggal",
        subtitle: "Kalender periode",
        shortLabel: "Tanggal"
    },
    {
        id: "days_channels",
        stepNumber: 4,
        title: "4. Hari & Saluran",
        subtitle: "Hari aktif & OTA",
        shortLabel: "Hari & Saluran"
    },
    {
        id: "review_apply",
        stepNumber: 5,
        title: "5. Review & Simpan",
        subtitle: "Konfirmasi eksekusi",
        shortLabel: "Simpan"
    }
];

interface BulkUpdateStepperProps {
    currentStep: BulkStepId;
    onStepClick: (stepId: BulkStepId) => void;
    completedSteps: BulkStepId[];
}

export function BulkUpdateStepper({
    currentStep,
    onStepClick,
    completedSteps
}: BulkUpdateStepperProps) {
    const currentIndex = BULK_STEPS.findIndex(s => s.id === currentStep);

    return (
        <nav aria-label="Progress Stepper" className={styles.stepperContainer}>
            {BULK_STEPS.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isCompleted = completedSteps.includes(step.id) && !isActive;
                const isClickable = idx <= currentIndex || isCompleted;
                const isLineCompleted = idx < currentIndex;

                return (
                    <React.Fragment key={step.id}>
                        <button
                            type="button"
                            onClick={() => onStepClick(step.id)}
                            disabled={!isClickable}
                            className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ""}`}
                            aria-current={isActive ? "step" : undefined}
                        >
                            <div
                                className={`${styles.stepBadge} ${
                                    isActive
                                        ? styles.stepBadgeActive
                                        : isCompleted
                                        ? styles.stepBadgeCompleted
                                        : ""
                                }`}
                            >
                                {isCompleted ? (
                                    <Check size={13} strokeWidth={3.5} />
                                ) : (
                                    <span>{step.stepNumber}</span>
                                )}
                            </div>

                            <div className={styles.stepInfo}>
                                <span
                                    className={`${styles.stepTitle} ${
                                        isActive ? styles.stepTitleActive : ""
                                    }`}
                                >
                                    {step.title}
                                </span>
                                {step.subtitle && (
                                    <span className={styles.stepSubtitle}>
                                        {step.subtitle}
                                    </span>
                                )}
                            </div>
                        </button>

                        {idx < BULK_STEPS.length - 1 && (
                            <div
                                className={`${styles.stepLine} ${
                                    isLineCompleted ? styles.stepLineCompleted : ""
                                }`}
                                aria-hidden="true"
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
