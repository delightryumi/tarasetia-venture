"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

interface LuxuryCalendarProps {
    selectedDate: Date | null;
    onSelect: (date: Date) => void;
    minDate?: Date;
    onClose: () => void;
    /** Position the calendar on the right side of the trigger */
    alignRight?: boolean;
}

export const LuxuryCalendar = ({
    selectedDate, onSelect, minDate, onClose, alignRight = false,
}: LuxuryCalendarProps) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [viewMonth, setViewMonth] = useState(
        selectedDate?.getMonth() ?? today.getMonth()
    );
    const [viewYear, setViewYear] = useState(
        selectedDate?.getFullYear() ?? today.getFullYear()
    );
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const isSelected = (day: number) =>
        !!selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getFullYear() === viewYear;

    const isToday = (day: number) =>
        today.getDate() === day &&
        today.getMonth() === viewMonth &&
        today.getFullYear() === viewYear;

    const isDisabled = (day: number) => {
        if (!minDate) return false;
        const d = new Date(viewYear, viewMonth, day);
        return d < minDate;
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-full mt-3 z-50 bg-white rounded-xl shadow-2xl shadow-[#788069]/10 border border-gray-100 p-5 w-[310px] ${alignRight ? "right-0" : "left-0"}`}
        >
            {/* Month header */}
            <div className="flex items-center justify-between mb-5">
                <button
                    onClick={prevMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-[#1a1a1a]"
                >
                    <ChevronLeft size={15} />
                </button>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#1a1a1a]">
                    {MONTHS[viewMonth]} {viewYear}
                </p>
                <button
                    onClick={nextMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-[#1a1a1a]"
                >
                    <ChevronRight size={15} />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-[#788069] py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, i) => (
                    <div key={i} className="flex items-center justify-center">
                        {day !== null ? (
                            <motion.button
                                disabled={isDisabled(day)}
                                whileHover={!isDisabled(day) && !isSelected(day) ? { scale: 1.1 } : {}}
                                whileTap={!isDisabled(day) ? { scale: 0.95 } : {}}
                                onClick={() => {
                                    if (!isDisabled(day)) {
                                        onSelect(new Date(viewYear, viewMonth, day));
                                        onClose();
                                    }
                                }}
                                className={[
                                    "w-9 h-9 rounded-md text-sm font-medium transition-colors duration-150 flex items-center justify-center",
                                    isSelected(day)
                                        ? "bg-[#788069] text-white shadow-md shadow-[#788069]/20"
                                        : isToday(day)
                                            ? "border border-[#788069] text-[#788069] bg-[#788069]/5"
                                            : isDisabled(day)
                                                ? "text-gray-300 cursor-not-allowed"
                                                : "text-[#1a1a1a] hover:bg-[#f9f8f6] cursor-pointer",
                                ].join(" ")}
                            >
                                {day}
                            </motion.button>
                        ) : (
                            <div className="w-9 h-9" />
                        )}
                    </div>
                ))}
            </div>

            {/* Clear */}
            {selectedDate && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={() => { onSelect(null as any); onClose(); }}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#788069] transition-colors"
                    >
                        Clear
                    </button>
                </div>
            )}
        </motion.div>
    );
};
