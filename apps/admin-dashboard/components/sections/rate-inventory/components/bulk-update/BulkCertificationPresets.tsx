"use client";

import React from "react";
import { Plus, RotateCcw, Copy, Layers } from "lucide-react";
import styles from "./BulkCertificationPresets.module.css";

interface BulkCertificationPresetsProps {
    onAddRule: () => void;
    onSyncDates: () => void;
    onReset: () => void;
    rulesCount: number;
}

export function BulkCertificationPresets({
    onAddRule,
    onSyncDates,
    onReset,
    rulesCount
}: BulkCertificationPresetsProps) {
    return (
        <div className={styles.bar}>
            <div className={styles.leftGroup}>
                <span className={styles.tagLabel}>
                    <Layers size={13} style={{ color: "#72263d" }} />
                    Daftar Target: {rulesCount} Aturan
                </span>
            </div>

            <div className={styles.rightGroup}>
                {rulesCount > 1 && (
                    <button
                        type="button"
                        onClick={onSyncDates}
                        className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                        title="Salin rentang tanggal & hari dari Aturan #1 ke semua aturan lainnya"
                    >
                        <Copy size={12} />
                        <span>Salin Tanggal #1 ke Semua</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={onAddRule}
                    className={styles.actionBtn}
                    title="Tambah target kamar / aturan pembaruan baru"
                >
                    <Plus size={13} />
                    <span>Tambah Aturan Target</span>
                </button>

                <button
                    type="button"
                    onClick={onReset}
                    className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                    title="Kosongkan dan reset formulir ke awal"
                >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                </button>
            </div>
        </div>
    );
}
