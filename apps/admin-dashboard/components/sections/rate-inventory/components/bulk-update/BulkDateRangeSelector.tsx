"use client";

import React from "react";
import { Calendar, Clock, Info, ArrowRight } from "lucide-react";
import styles from "./BulkDateRangeSelector.module.css";

interface BulkDateRangeSelectorProps {
    dateFrom: string;
    dateTo: string;
    daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    onDateFromChange: (val: string) => void;
    onDateToChange: (val: string) => void;
    onDaysOfWeekChange: (days: number[]) => void;
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

export function BulkDateRangeSelector({
    dateFrom,
    dateTo,
    daysOfWeek,
    onDateFromChange,
    onDateToChange,
    onDaysOfWeekChange
}: BulkDateRangeSelectorProps) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Presets
    const setPresetDays = (numDays: number) => {
        const from = dateFrom || todayStr;
        const d = new Date(from);
        d.setDate(d.getDate() + numDays - 1);
        onDateToChange(d.toISOString().split("T")[0]);
    };

    const setThisMonth = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const firstDay = new Date(y, m, 1).toISOString().split("T")[0];
        const lastDay = new Date(y, m + 1, 0).toISOString().split("T")[0];
        onDateFromChange(firstDay);
        onDateToChange(lastDay);
    };

    const setNextMonth = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const firstDay = new Date(y, m, 1).toISOString().split("T")[0];
        const lastDay = new Date(y, m + 1, 0).toISOString().split("T")[0];
        onDateFromChange(firstDay);
        onDateToChange(lastDay);
    };

    // Toggle day
    const toggleDay = (idx: number) => {
        if (daysOfWeek.includes(idx)) {
            const next = daysOfWeek.filter(d => d !== idx);
            onDaysOfWeekChange(next.length === 0 ? [idx] : next);
        } else {
            onDaysOfWeekChange([...daysOfWeek, idx]);
        }
    };

    // Calculate nights & affected days
    const calculateNights = () => {
        if (!dateFrom || !dateTo) return 0;
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
        const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diff;
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

    const totalDays = calculateNights();
    const affectedDays = calculateAffectedDaysCount();

    return (
        <div className={styles.container}>
            {/* 1. Date Inputs with Duration Badge */}
            <div className={styles.datePickerGrid}>
                <div className={styles.dateField}>
                    <label htmlFor="bulk-date-from" className={styles.fieldLabel}>
                        <Calendar size={13} />
                        Tanggal Mulai (Dari)
                    </label>
                    <input
                        id="bulk-date-from"
                        type="date"
                        value={dateFrom}
                        onChange={e => onDateFromChange(e.target.value)}
                        className={styles.dateInput}
                    />
                </div>

                <div className={styles.durationBadge}>
                    <ArrowRight size={12} />
                    <span>{totalDays} Hari</span>
                </div>

                <div className={styles.dateField}>
                    <label htmlFor="bulk-date-to" className={styles.fieldLabel}>
                        <Calendar size={13} />
                        Tanggal Selesai (Sampai)
                    </label>
                    <input
                        id="bulk-date-to"
                        type="date"
                        value={dateTo}
                        min={dateFrom}
                        onChange={e => onDateToChange(e.target.value)}
                        className={styles.dateInput}
                    />
                </div>
            </div>

            {/* 2. Quick Presets */}
            <div className={styles.presetBar}>
                <span className={styles.presetLabel}>Preset Rentang:</span>
                <button
                    type="button"
                    onClick={() => setPresetDays(7)}
                    className={styles.presetChip}
                >
                    7 Hari
                </button>
                <button
                    type="button"
                    onClick={() => setPresetDays(14)}
                    className={styles.presetChip}
                >
                    14 Hari
                </button>
                <button
                    type="button"
                    onClick={() => setPresetDays(30)}
                    className={styles.presetChip}
                >
                    30 Hari
                </button>
                <button
                    type="button"
                    onClick={setThisMonth}
                    className={styles.presetChip}
                >
                    Bulan Ini
                </button>
                <button
                    type="button"
                    onClick={setNextMonth}
                    className={styles.presetChip}
                >
                    Bulan Depan
                </button>
            </div>

            <div className={styles.divider} />

            {/* 3. Days of the Week Selector (Clean, NO concatenated text) */}
            <div className={styles.daysSection}>
                <div className={styles.daysHeader}>
                    <span className={styles.fieldLabel}>
                        <Clock size={13} />
                        Hari yang Berlaku dalam Seminggu
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

                <div className={styles.affectedNotice}>
                    <Info size={14} style={{ flexShrink: 0 }} />
                    <span>
                        Total <strong>{affectedDays} tanggal kalender</strong> akan diperbarui pada jadwal ini.
                    </span>
                </div>
            </div>
        </div>
    );
}
