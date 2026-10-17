"use client";

import React from "react";
import { Clock, Globe, Info } from "lucide-react";
import styles from "./BulkDaysChannelsSelector.module.css";

interface BulkDaysChannelsSelectorProps {
    daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    channelId: string;
    channelConfigs?: Record<string, any>;
    dateFrom: string;
    dateTo: string;
    onDaysOfWeekChange: (days: number[]) => void;
    onChannelChange: (channelId: string) => void;
}

const DAYS_ORDER = [
    { idx: 1, label: "Sen", full: "Senin" },
    { idx: 2, label: "Sel", full: "Selasa" },
    { idx: 3, label: "Rab", full: "Rabu" },
    { idx: 4, label: "Kam", full: "Kamis" },
    { idx: 5, label: "Jum", full: "Jumat" },
    { idx: 6, label: "Sab", full: "Sabtu" },
    { idx: 0, label: "Min", full: "Minggu" }
];

export function BulkDaysChannelsSelector({
    daysOfWeek,
    channelId,
    channelConfigs = {},
    dateFrom,
    dateTo,
    onDaysOfWeekChange,
    onChannelChange
}: BulkDaysChannelsSelectorProps) {
    const toggleDay = (idx: number) => {
        if (daysOfWeek.includes(idx)) {
            const next = daysOfWeek.filter(d => d !== idx);
            onDaysOfWeekChange(next.length === 0 ? [idx] : next);
        } else {
            onDaysOfWeekChange([...daysOfWeek, idx]);
        }
    };

    const calculateAffectedDaysCount = () => {
        if (!dateFrom || !dateTo) return 0;
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

        let count = 0;
        let curr = new Date(start);
        while (curr <= end) {
            if (daysOfWeek.includes(curr.getDay())) {
                count++;
            }
            curr.setDate(curr.getDate() + 1);
        }
        return count;
    };

    const affectedDays = calculateAffectedDaysCount();
    const activeChannels = Object.entries(channelConfigs).filter(([_, cfg]) => cfg?.active);

    return (
        <div className={styles.container}>
            {/* 1. Day of Week Header and Presets */}
            <div className={styles.sectionHeader}>
                <span className={styles.fieldLabel}>
                    <Clock size={13} />
                    Pilih Hari Aktif dalam Seminggu
                </span>
                <div className={styles.presetBar}>
                    <button
                        type="button"
                        onClick={() => onDaysOfWeekChange([0, 1, 2, 3, 4, 5, 6])}
                        className={styles.presetChip}
                    >
                        Semua Hari (7 Hari)
                    </button>
                    <button
                        type="button"
                        onClick={() => onDaysOfWeekChange([1, 2, 3, 4, 5])}
                        className={styles.presetChip}
                    >
                        Hari Kerja (Sen-Jum)
                    </button>
                    <button
                        type="button"
                        onClick={() => onDaysOfWeekChange([0, 6])}
                        className={styles.presetChip}
                    >
                        Akhir Pekan (Sab-Min)
                    </button>
                </div>
            </div>

            {/* 2. Days Pills (Clean buttons, zero text concatenation) */}
            <div className={styles.daysTogglesRow}>
                {DAYS_ORDER.map(day => {
                    const isSelected = daysOfWeek.includes(day.idx);
                    return (
                        <button
                            key={day.idx}
                            type="button"
                            onClick={() => toggleDay(day.idx)}
                            className={`${styles.dayPill} ${
                                isSelected ? styles.dayPillActive : ""
                            }`}
                            title={day.full}
                        >
                            {day.label}
                        </button>
                    );
                })}
            </div>

            {/* 3. Affected Days Badge */}
            <div className={styles.affectedNotice}>
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>
                    Total <strong>{affectedDays} tanggal kalender</strong> akan diperbarui pada jadwal ini.
                </span>
            </div>

            <div className={styles.divider} />

            {/* 4. Distribution Channels */}
            <div className={styles.channelRow}>
                <label className={styles.fieldLabel}>
                    <Globe size={13} />
                    Target Saluran Distribusi (OTA):
                </label>
                <select
                    value={channelId}
                    onChange={e => onChannelChange(e.target.value)}
                    className={styles.channelSelect}
                >
                    <option value="all">Semua Saluran (Direct PMS &amp; Semua OTA)</option>
                    {activeChannels.map(([chKey, cfg]) => (
                        <option key={chKey} value={chKey}>
                            Hanya {cfg.name || chKey.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
