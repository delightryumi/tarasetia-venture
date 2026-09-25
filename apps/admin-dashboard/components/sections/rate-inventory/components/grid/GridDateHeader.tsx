"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsRight, Calendar } from "lucide-react";
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
    jumpToToday,
    todayStr
}: GridDateHeaderProps) {
    return (
        <tr className={styles.headerRow}>
            {/* 1. Left Sticky Navigation Controls */}
            <th className={styles.colTitle}>
                <div className={styles.dateNavControl}>
                    <div className={styles.navBtnGroup}>
                        <button
                            type="button"
                            onClick={() => shiftDate(-14)}
                            className={styles.dateStepperBtn}
                            title="14 Days Previous"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {jumpToToday && (
                            <button
                                type="button"
                                onClick={jumpToToday}
                                className={styles.btnToday}
                                title="Jump to Today"
                            >
                                <Calendar size={13} />
                                <span>Today</span>
                            </button>
                        )}
                    </div>

                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className={styles.datePickerInput}
                        title="Select Calendar Start Date"
                    />

                    <div className={styles.navBtnGroup}>
                        <button
                            type="button"
                            onClick={() => shiftDate(14)}
                            className={styles.dateStepperBtn}
                            title="14 Days Forward"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </th>

            {/* 2. Date Columns (14 Days) */}
            {dateList.map(dateStr => {
                const dObj = new Date(dateStr);
                const dayName = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dObj.getDay()];
                const dayNum = String(dObj.getDate()).padStart(2, "0");
                const monthName = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][dObj.getMonth()];
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
                    >
                        <div className={[styles.dayOfWeek, isWeekend ? styles.dayOfWeekWeekend : ""].filter(Boolean).join(" ")}>
                            {dayName}
                        </div>
                        <div className={styles.dayNumber}>{dayNum}</div>
                        <div className={styles.monthLabel}>{monthName}</div>
                        {isToday && <span className={styles.todayTag}>TODAY</span>}
                    </th>
                );
            })}

            {/* 3. Fast Forward Button */}
            <th className={styles.jumpForwardTh}>
                <button
                    type="button"
                    onClick={() => shiftDate(14)}
                    className={styles.jumpForwardBtn}
                    title="Jump 14 Days Ahead"
                >
                    <ChevronsRight size={16} />
                </button>
            </th>
        </tr>
    );
});
