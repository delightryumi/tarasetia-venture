"use client";

import React from "react";
import { Calendar, Clock } from "lucide-react";
import styles from "./BulkRuleSchedule.module.css";

interface BulkRuleScheduleProps {
    dateFrom: string;
    dateTo: string;
    daysOfWeek: number[]; // 0=Sun..6=Sat
    onDateChange: (dateFrom: string, dateTo: string) => void;
    onDaysChange: (days: number[]) => void;
}

const DAYS = [
    { num: 1, label: "Sen" },
    { num: 2, label: "Sel" },
    { num: 3, label: "Rab" },
    { num: 4, label: "Kam" },
    { num: 5, label: "Jum" },
    { num: 6, label: "Sab" },
    { num: 0, label: "Min" }
];

export function BulkRuleSchedule({
    dateFrom,
    dateTo,
    daysOfWeek,
    onDateChange,
    onDaysChange
}: BulkRuleScheduleProps) {
    const handleQuickRange = (daysAhead: number) => {
        const start = dateFrom ? new Date(dateFrom) : new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + daysAhead);
        const y = end.getFullYear();
        const m = String(end.getMonth() + 1).padStart(2, "0");
        const d = String(end.getDate()).padStart(2, "0");
        onDateChange(dateFrom || new Date().toISOString().split("T")[0], `${y}-${m}-${d}`);
    };

    const toggleDay = (num: number) => {
        if (daysOfWeek.includes(num)) {
            if (daysOfWeek.length === 1) return; // keep at least 1 day
            onDaysChange(daysOfWeek.filter(d => d !== num));
        } else {
            onDaysChange([...daysOfWeek, num]);
        }
    };

    return (
        <div className={styles.container}>
            {/* 1. Date Inputs & Presets */}
            <div className={styles.dateRow}>
                <div className={styles.dateInputGroup}>
                    <Calendar size={13} style={{ color: "#64748b" }} />
                    <span className={styles.inputLabel}>Dari:</span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => onDateChange(e.target.value, dateTo)}
                        className={styles.dateInput}
                    />
                </div>

                <div className={styles.dateInputGroup}>
                    <span className={styles.inputLabel}>Sampai:</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => onDateChange(dateFrom, e.target.value)}
                        className={styles.dateInput}
                    />
                </div>

                <div className={styles.presetsRow}>
                    <button
                        type="button"
                        onClick={() => handleQuickRange(7)}
                        className={styles.presetBtn}
                        title="Setel 7 hari ke depan"
                    >
                        +7 Hari
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickRange(14)}
                        className={styles.presetBtn}
                        title="Setel 14 hari ke depan"
                    >
                        +14 Hari
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickRange(30)}
                        className={styles.presetBtn}
                        title="Setel 30 hari ke depan"
                    >
                        +30 Hari
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickRange(90)}
                        className={styles.presetBtn}
                        title="Setel 90 hari (3 bulan) ke depan"
                    >
                        +90 Hari (3 Bln)
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickRange(180)}
                        className={styles.presetBtn}
                        title="Setel 180 hari (6 bulan) ke depan"
                    >
                        +180 Hari (6 Bln)
                    </button>
                </div>
            </div>

            {/* 2. Days of Week Selection */}
            <div className={styles.daysRow}>
                <Clock size={12} style={{ color: "#64748b", marginRight: 2 }} />
                <span className={styles.inputLabel}>Hari Aktif:</span>

                <button
                    type="button"
                    onClick={() => onDaysChange([0, 1, 2, 3, 4, 5, 6])}
                    className={styles.quickDayBtn}
                >
                    Semua (7 Hari)
                </button>
                <button
                    type="button"
                    onClick={() => onDaysChange([1, 2, 3, 4, 5])}
                    className={styles.quickDayBtn}
                >
                    Hari Kerja
                </button>
                <button
                    type="button"
                    onClick={() => onDaysChange([6, 0])}
                    className={styles.quickDayBtn}
                >
                    Akhir Pekan
                </button>

                <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                    {DAYS.map(day => (
                        <button
                            key={day.num}
                            type="button"
                            onClick={() => toggleDay(day.num)}
                            className={`${styles.dayChip} ${
                                daysOfWeek.includes(day.num) ? styles.dayChipActive : ""
                            }`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
