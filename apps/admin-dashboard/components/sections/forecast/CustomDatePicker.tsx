"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import styles from "./ForecastStyles.module.css";

const MONTHS_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/* ── Daily Calendar ── */
function DailyCalendar({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(value ? parseInt(value.split("-")[0]) : today.getFullYear());
    const [viewMonth, setViewMonth] = useState(value ? parseInt(value.split("-")[1]) - 1 : today.getMonth());

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    const selectedStr = value;

    const handleDay = (day: number) => {
        const m = String(viewMonth + 1).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        onChange(`${viewYear}-${m}-${d}`);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const isSel = (day: number) => {
        const m = String(viewMonth + 1).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return selectedStr === `${viewYear}-${m}-${d}`;
    };
    const isToday = (day: number) => {
        return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
    };

    return (
        <div style={{ width: "300px", padding: "16px" }}>
            {/* Month/Year Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <button onClick={prevMonth} className={styles.btnIcon} style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", boxShadow: "none" }}>
                    <ChevronLeft size={14} />
                </button>
                <span className={styles.guestSubtext} style={{ fontSize: "11px", color: "var(--f-ink)", fontWeight: 700 }}>
                    {MONTHS_ID[viewMonth]} {viewYear}
                </span>
                <button onClick={nextMonth} className={styles.btnIcon} style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", boxShadow: "none" }}>
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Day Labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "4px" }}>
                {DAYS_SHORT.map(d => (
                    <div key={d} className={styles.guestSubtext} style={{ textAlign: "center", fontSize: "9px", color: "var(--f-light-muted)" }}>{d}</div>
                ))}
            </div>

            {/* Day Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                {cells.map((day, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {day ? (
                            <button
                                onClick={() => handleDay(day)}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    fontFamily: "var(--f-font-mono)",
                                    cursor: "pointer",
                                    transition: "all var(--f-duration-fast)",
                                    border: isSel(day) ? "none" : (isToday(day) ? "1px solid var(--f-light-muted)" : "none"),
                                    backgroundColor: isSel(day) ? "var(--f-sage)" : "transparent",
                                    color: isSel(day) ? "#ffffff" : (isToday(day) ? "var(--f-sage)" : "var(--f-body)")
                                }}
                            >
                                {day}
                            </button>
                        ) : <div style={{ width: "32px", height: "32px" }} />}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Monthly Calendar ── */
function MonthlyCalendar({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(value ? parseInt(value.split("-")[0]) : today.getFullYear());
    const selectedStr = value;

    const handleMonth = (monthIndex: number) => {
        const m = String(monthIndex + 1).padStart(2, "0");
        onChange(`${viewYear}-${m}`);
    };

    const isSel = (monthIndex: number) => {
        const m = String(monthIndex + 1).padStart(2, "0");
        return selectedStr === `${viewYear}-${m}`;
    };
    const isCurrentMonth = (monthIndex: number) => {
        return today.getFullYear() === viewYear && today.getMonth() === monthIndex;
    };

    return (
        <div style={{ width: "280px", padding: "16px" }}>
            {/* Year Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <button onClick={() => setViewYear(y => y - 1)} className={styles.btnIcon} style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", boxShadow: "none" }}>
                    <ChevronLeft size={14} />
                </button>
                <span className={styles.guestSubtext} style={{ fontSize: "11px", color: "var(--f-ink)", fontWeight: 700 }}>{viewYear}</span>
                <button onClick={() => setViewYear(y => y + 1)} className={styles.btnIcon} style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", boxShadow: "none" }}>
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Month Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                {MONTHS_ID.map((name, i) => (
                    <button
                        key={name}
                        onClick={() => handleMonth(i)}
                        style={{
                            padding: "8px 0",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all var(--f-duration-fast)",
                            border: isSel(i) ? "none" : (isCurrentMonth(i) ? "1px solid var(--f-light-muted)" : "none"),
                            backgroundColor: isSel(i) ? "var(--f-sage)" : "transparent",
                            color: isSel(i) ? "#ffffff" : (isCurrentMonth(i) ? "var(--f-sage)" : "var(--f-body)")
                        }}
                    >
                        {name.slice(0, 3)}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Yearly Calendar ── */
function YearlyCalendar({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const today = new Date();
    const currentYear = value ? parseInt(value.split("-")[0]) : today.getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => currentYear - 5 + i);

    return (
        <div style={{ width: "280px", padding: "16px" }}>
            <div style={{ textAlign: "center", marginBottom: "16px", padding: "4px 0" }}>
                <span className={styles.headerSubtitle} style={{ fontSize: "8px" }}>Pilih Tahun</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                {years.map((yr) => (
                    <button
                        key={yr}
                        onClick={() => onChange(`${yr}-01-01`)}
                        style={{
                            padding: "10px 0",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            fontFamily: "var(--f-font-mono)",
                            cursor: "pointer",
                            transition: "all var(--f-duration-fast)",
                            border: currentYear === yr ? "none" : (today.getFullYear() === yr ? "1px solid var(--f-light-muted)" : "none"),
                            backgroundColor: currentYear === yr ? "var(--f-sage)" : "transparent",
                            color: currentYear === yr ? "#ffffff" : (today.getFullYear() === yr ? "var(--f-sage)" : "var(--f-body)")
                        }}
                    >
                        {yr}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Main Custom Date Picker ── */
interface CustomDatePickerProps {
    mode: "daily" | "monthly" | "yearly";
    value: string;
    onChange: (v: string) => void;
    formatDisplay: (v: string) => string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ mode, value, onChange, formatDisplay }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleChange = (v: string) => {
        onChange(v);
        if (mode === "daily" || mode === "yearly") setOpen(false);
    };

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                className={styles.btnIcon}
                style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    height: "46px", 
                    padding: "0 16px", 
                    borderRadius: "10px", 
                    minWidth: "180px", 
                    justifyContent: "flex-start",
                    backgroundColor: "var(--f-surface-soft)",
                    borderColor: open ? "var(--f-light-muted)" : "var(--f-hairline)",
                    boxShadow: "none"
                }}
            >
                <Calendar size={14} style={{ color: "var(--f-light-muted)", flexShrink: 0 }} />
                <span className={styles.guestSubtext} style={{ color: "var(--f-ink)", fontSize: "11px", fontWeight: 700 }}>
                    {formatDisplay(value)}
                </span>
            </button>

            {/* Dropdown Calendar */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            right: 0,
                            top: "calc(100% + 8px)",
                            zIndex: 50,
                            backgroundColor: "var(--f-canvas)",
                            borderRadius: "var(--f-radius-lg)",
                            border: "1px solid var(--f-hairline)",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                            overflow: "hidden"
                        }}
                    >
                        {mode === "daily" ? (
                            <DailyCalendar value={value} onChange={handleChange} />
                        ) : mode === "monthly" ? (
                            <MonthlyCalendar value={value} onChange={handleChange} />
                        ) : (
                            <YearlyCalendar value={value} onChange={handleChange} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
