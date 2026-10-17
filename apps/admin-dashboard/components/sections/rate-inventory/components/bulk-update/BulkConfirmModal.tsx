"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import styles from "./BulkConfirmModal.module.css";

interface BulkConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function BulkConfirmModal({
    isOpen,
    title,
    message,
    confirmText = "Ya, Reset Formulir",
    cancelText = "Batal",
    onConfirm,
    onCancel
}: BulkConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={onCancel} role="dialog" aria-modal="true">
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.warningIconWrapper}>
                        <AlertTriangle size={18} />
                    </div>
                    <h3 className={styles.modalTitle}>{title}</h3>
                </div>

                <div className={styles.modalBody}>
                    <p style={{ margin: 0 }}>{message}</p>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        onClick={onCancel}
                        className={styles.btnCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={styles.btnConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
