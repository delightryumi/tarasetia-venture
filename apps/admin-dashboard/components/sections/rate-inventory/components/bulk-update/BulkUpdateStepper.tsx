"use client";

import React from "react";
import { Check } from "lucide-react";
import { BulkStepId, BulkStepConfig } from "./types";
import styles from "./BulkUpdateStepper.module.css";

export const BULK_STEPS: BulkStepConfig[] = [
    {
        id: "metrics_targets",
        stepNumber: 1,
        title: "1. Komponen & Target",
        subtitle: "",
        shortLabel: "Target"
    },
    {
        id: "dates_days",
        stepNumber: 2,
        title: "2. Periode & Hari",
        subtitle: "",
        shortLabel: "Periode"
    },
    {
        id: "values_actions",
        stepNumber: 3,
        title: "3. Atur Perubahan",
        subtitle: "",
        shortLabel: "Perubahan"
    },
    {
        id: "review_apply",
        stepNumber: 4,
        title: "4. Review & Simpan",
        subtitle: "",
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
                            className={styles.stepItem}
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
                                    <Check size={13} strokeWidth={3} />
                                ) : (
                                    <span>{step.stepNumber}</span>
                                )}
                            </div>
                            <span
                                className={`${styles.stepTitle} ${
                                    isActive ? styles.stepTitleActive : ""
                                }`}
                            >
                                {step.title}
                            </span>
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
