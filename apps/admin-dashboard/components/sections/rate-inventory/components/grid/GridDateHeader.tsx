"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import styles from "./GridDateHeader.module.css";

interface GridDateHeaderProps {
    startDate: string;
    setStartDate: (val: string) => void;
    dateList: string[];
    shiftDate: (days: number) => void;
    jumpToToday?: () => void;
    todayStr: string;
}

export const GridDateHeader = React.memo(function GridDateHeader({
    startDate,
    setStartDate,
    dateList,
    shiftDate,
    todayStr
}: GridDateHeaderProps) {
    return (
        <tr className={styles.headerRow}>
            {/* 1. Left Sticky Navigation Controls */}
            <th className={styles.colTitle}>
                <div className={styles.dateNavControl}>
                    <button
                        type="button"
                        onClick={() => shiftDate(-13)}
                        className={styles.dateStepperBtn}
                        title="13 Hari Sebelumnya"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className={styles.datePickerInput}
                        title="Pilih Tanggal Kalender"
                    />

                    <button
                        type="button"
                        onClick={() => shiftDate(13)}
                        className={styles.dateStepperBtn}
                        title="13 Hari Berikutnya"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </th>

            {/* 2. Date Columns (13 Days) */}
            {dateList.map(dateStr => {
                const dObj = new Date(dateStr);
                const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dObj.getDay()];
                const dayNum = String(dObj.getDate()).padStart(2, "0");
                const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dObj.getMonth()];
                const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
                const isToday = dateStr === todayStr;

                return (
                    <th
                        key={dateStr}
                        className={[
                            styles.colDay,
                            isWeekend ? styles.colWeekend : "",
                            isToday ? styles.colToday : ""
                        ].filter(Boolean).join(" ")}
                        title={`${dayName}, ${dayNum} ${monthName}`}
                    >
                        <div className={styles.dayOfWeek}>
                            {dayName}
                        </div>
                        <div className={styles.dayNumber}>{dayNum}</div>
                        <div className={styles.monthLabel}>{monthName}</div>
                    </th>
                );
            })}

            {/* 3. Fast Forward Stepper Button */}
            <th className={styles.jumpForwardTh}>
                <button
                    type="button"
                    onClick={() => shiftDate(13)}
                    className={styles.jumpForwardBtn}
                    title="Lompat 13 Hari ke Depan"
                >
                    <ChevronsRight size={15} />
                </button>
            </th>
        </tr>
    );
});
