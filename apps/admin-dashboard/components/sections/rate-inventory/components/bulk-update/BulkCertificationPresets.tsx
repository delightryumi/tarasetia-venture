"use client";

import React from "react";
import { Plus, RotateCcw, Copy, Layers, Sparkles } from "lucide-react";
import styles from "./BulkCertificationPresets.module.css";

export type ChannexCertificationPresetKey =
    | "none"
    | "test_4_multi_rate"
    | "test_7_multi_restrictions"
    | "test_8_half_year"
    | "test_10_multi_avail";

interface BulkCertificationPresetsProps {
    onAddRule: () => void;
    onSyncDates: () => void;
    onReset: () => void;
    rulesCount: number;
    onSelectPreset?: (preset: ChannexCertificationPresetKey) => void;
}

export function BulkCertificationPresets({
    onAddRule,
    onSyncDates,
    onReset,
    rulesCount,
    onSelectPreset
}: BulkCertificationPresetsProps) {
    return (
        <div className={styles.bar}>
            <div className={styles.leftGroup}>
                <span className={styles.tagLabel}>
                    <Layers size={13} style={{ color: "#72263d" }} />
                    Daftar Target: {rulesCount} Aturan
                </span>

                {onSelectPreset && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                            <Sparkles size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 3, color: "#d97706" }} />
                            Preset Channex:
                        </span>
                        <select
                            onChange={e => {
                                const val = e.target.value as ChannexCertificationPresetKey;
                                if (val && val !== "none") {
                                    onSelectPreset(val);
                                    e.target.value = "none";
                                }
                            }}
                            defaultValue="none"
                            style={{
                                fontSize: 11.5,
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#f8fafc",
                                color: "#0f172a",
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            <option value="none" disabled>-- Pilih Preset Panduan --</option>
                            <option value="test_4_multi_rate">Test 4: Multi-Date Multi-Rate (01-20 Nov)</option>
                            <option value="test_7_multi_restrictions">Test 7: Multi-Restriksi (CTA/CTD/Min/Max)</option>
                            <option value="test_8_half_year">Test 8: Pembaruan Semester (Des 2026 - Mei 2027)</option>
                            <option value="test_10_multi_avail">Test 10: Multi-Date Availability (10-24 Nov)</option>
                        </select>
                    </div>
                )}
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
