"use client";

import React from "react";
import { Calendar, ArrowRight, Clock, Info } from "lucide-react";
import styles from "./BulkDateRangeSelector.module.css";

interface BulkDateRangeSelectorProps {
    dateFrom: string;
    dateTo: string;
    daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    onDateFromChange: (val: string) => void;
    onDateToChange: (val: string) => void;
    onDaysOfWeekChange?: (days: number[]) => void;
    showDays?: boolean;
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
    daysOfWeek = [0, 1, 2, 3, 4, 5, 6],
    onDateFromChange,
    onDateToChange,
    onDaysOfWeekChange,
    showDays = false
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
            onDaysOfWeekChange?.(next.length === 0 ? [idx] : next);
        } else {
            onDaysOfWeekChange?.([...daysOfWeek, idx]);
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
        <div className={styles.slimWrapper}>
            {/* 1. Compact Date Range Inputs + Duration Pill */}
            <div className={styles.rangeInputGroup}>
                <div className={styles.singleDateField}>
                    <span className={styles.inputPrefix}>Dari</span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => onDateFromChange(e.target.value)}
                        className={styles.slimDateInput}
                        title="Tanggal Mulai"
                    />
                </div>

                <span className={styles.rangeArrow}>
                    <ArrowRight size={13} />
                </span>

                <div className={styles.singleDateField}>
                    <span className={styles.inputPrefix}>Sampai</span>
                    <input
                        type="date"
                        value={dateTo}
                        min={dateFrom}
                        onChange={e => onDateToChange(e.target.value)}
                        className={styles.slimDateInput}
                        title="Tanggal Selesai"
                    />
                </div>

                <div className={styles.slimDurationBadge} title="Durasi total hari yang dipilih">
                    <Calendar size={12} />
                    <span>{totalDays} Hari</span>
                </div>
            </div>

            {/* 2. Quick Presets Bar */}
            <div className={styles.slimPresetBar}>
                <span className={styles.presetLabel}>Preset:</span>
                <button
                    type="button"
                    onClick={() => setPresetDays(7)}
                    className={styles.slimPresetChip}
                    title="Set rentang 7 hari dari tanggal mulai"
                >
                    +7 Hari
                </button>
                <button
                    type="button"
                    onClick={() => setPresetDays(14)}
                    className={styles.slimPresetChip}
                    title="Set rentang 14 hari dari tanggal mulai"
                >
                    +14 Hari
                </button>
                <button
                    type="button"
                    onClick={() => setPresetDays(30)}
                    className={styles.slimPresetChip}
                    title="Set rentang 30 hari dari tanggal mulai"
                >
                    +30 Hari
                </button>
                <button
                    type="button"
                    onClick={() => setPresetDays(90)}
                    className={styles.slimPresetChip}
                    title="Set rentang 90 hari (3 bulan) dari tanggal mulai"
                >
                    +3 Bln
                </button>
                <button
                    type="button"
                    onClick={() => setPresetDays(180)}
                    className={styles.slimPresetChip}
                    title="Set rentang 180 hari (6 bulan) dari tanggal mulai"
                >
                    +6 Bln
                </button>
                <button
                    type="button"
                    onClick={setThisMonth}
                    className={styles.slimPresetChip}
                    title="Set rentang bulan kalender saat ini"
                >
                    Bulan Ini
                </button>
                <button
                    type="button"
                    onClick={setNextMonth}
                    className={styles.slimPresetChip}
                    title="Set rentang bulan berikutnya penuh"
                >
                    Bulan Depan
                </button>
            </div>

            {/* Optional Days Selector (if standalone) */}
            {showDays && onDaysOfWeekChange && (
                <div className={styles.embeddedDaysSection}>
                    <div className={styles.daysHeader}>
                        <span className={styles.fieldLabel}>
                            <Clock size={12} />
                            Hari Aktif:
                        </span>
                        <div className={styles.presetBar}>
                            <button
                                type="button"
                                onClick={() => onDaysOfWeekChange([0, 1, 2, 3, 4, 5, 6])}
                                className={styles.slimPresetChip}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={() => onDaysOfWeekChange([1, 2, 3, 4, 5])}
                                className={styles.slimPresetChip}
                            >
                                Weekday
                            </button>
                            <button
                                type="button"
                                onClick={() => onDaysOfWeekChange([0, 6])}
                                className={styles.slimPresetChip}
                            >
                                Weekend
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
                        <Info size={13} style={{ flexShrink: 0 }} />
                        <span>
                            Total <strong>{affectedDays} tanggal kalender</strong> aktif.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
