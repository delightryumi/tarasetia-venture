"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, BedDouble, Calendar as CalendarIcon, Package } from "lucide-react";
import { CHANNELS } from "./useTransactionForm";
import styles from "./TransactionFormStyles.module.css";

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void, active: boolean) {
    React.useEffect(() => {
        if (!active) return;
        const listener = (event: Event) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler, active]);
}

export const SectionTitle = ({ number, label }: { number: string; label: string }) => (
    <div className={styles.sectionTitle}>
        <div className={styles.sectionTitleInner}>
            <span className={styles.sectionNumber}>{number}.</span>
            <h2 className={styles.sectionLabel}>{label}</h2>
        </div>
    </div>
);

// --- Custom Calendar Component ---
const CustomCalendar = ({ value, onChange, onClose, accentColor }: any) => {
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const days = [];
    // Pad for first day of week
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const changeMonth = (offset: number) => {
        setViewDate(new Date(year, month + offset, 1));
    };

    const isToday = (d: number) => {
        const today = new Date();
        return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
    };

    const isSelected = (d: number) => {
        if (!value) return false;
        const sel = new Date(value);
        return sel.getDate() === d && sel.getMonth() === month && sel.getFullYear() === year;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={styles.calendarContainer}
        >
            <div className={styles.calendarHeader}>
                <button type="button" onClick={() => changeMonth(-1)} className={`${styles.btnIcon} !w-7 !h-7`} style={{ borderRadius: '6px' }}><ChevronLeft size={14} /></button>
                <div className={styles.calendarTitle}>
                    <span className={styles.calendarMonth}>{monthNames[month]}</span>
                    <span className={styles.calendarYear}>{year}</span>
                </div>
                <button type="button" onClick={() => changeMonth(1)} className={`${styles.btnIcon} !w-7 !h-7`} style={{ borderRadius: '6px' }}><ChevronRight size={14} /></button>
            </div>

            <div className={styles.calendarGridHead}>
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                    <div key={d} className={styles.calendarDayName}>{d}</div>
                ))}
            </div>

            <div className={styles.calendarGridDays}>
                {days.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} />;
                    const selected = isSelected(day);
                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => {
                                const newDate = new Date(year, month, day);
                                newDate.setMinutes(newDate.getMinutes() - newDate.getTimezoneOffset());
                                onChange(newDate.toISOString().split('T')[0]);
                                onClose();
                            }}
                            className={styles.calendarDay}
                            style={{
                                backgroundColor: selected ? (accentColor === 'var(--f-sage)' ? 'var(--f-sage)' : 'var(--f-terracotta)') : '',
                                color: selected ? '#ffffff' : '',
                                border: isToday(day) && !selected ? '1px solid var(--f-hairline)' : 'none',
                                fontWeight: selected || isToday(day) ? '700' : '500'
                            }}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
};

export function ChannelSelect({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, () => setIsOpen(false), isOpen);
    const selectedChannel = CHANNELS.find(c => c.name === value) || CHANNELS[CHANNELS.length - 1];

    return (
        <div className="relative" ref={containerRef}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={styles.inputWrapper}
                style={{ width: '100%', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}
            >
                <div className="flex items-center gap-3 flex-1">
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={selectedChannel.logo} alt="" className="max-w-[14px] max-h-[14px] object-contain" />
                    </div>
                    <span className={styles.popoverItemText} style={{ color: 'var(--f-body)' }}>{selectedChannel.name}</span>
                </div>
                <ChevronRight size={14} className={`text-stone-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className={styles.popover}
                    >
                        {CHANNELS.map((channel) => (
                            <button
                                key={channel.name}
                                type="button"
                                onClick={() => {
                                    onChange(channel.name);
                                    setIsOpen(false);
                                }}
                                className={styles.popoverItem}
                                style={{
                                    backgroundColor: value === channel.name ? 'var(--f-sage)' : '',
                                    color: value === channel.name ? '#ffffff' : 'var(--f-body)'
                                }}
                            >
                                <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={channel.logo} alt="" className="max-w-[14px] max-h-[14px] object-contain" style={{ filter: value === channel.name ? 'brightness(10)' : 'none' }} />
                                </div>
                                <span className={styles.popoverItemText}>{channel.name}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function RoomTypeSelect({ value, options, onChange }: { value: string, options: any[], onChange: (v: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, () => setIsOpen(false), isOpen);
    const selected = options.find(o => o.id === value);

    return (
        <div className="relative" ref={containerRef}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={styles.inputWrapper}
                style={{ width: '100%', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}
            >
                <div className="flex items-center gap-3 flex-1">
                    <BedDouble size={16} className="text-stone-400" />
                    <span className={styles.popoverItemText} style={{ color: 'var(--f-body)' }}>
                        {selected?.name || 'Pilih Tipe Kamar'}
                    </span>
                </div>
                <ChevronRight size={14} className={`text-stone-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className={styles.popover}
                    >
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onChange(option.id);
                                    setIsOpen(false);
                                }}
                                className={styles.popoverItem}
                                style={{
                                    backgroundColor: value === option.id ? 'var(--f-sage)' : '',
                                    color: value === option.id ? '#ffffff' : 'var(--f-body)'
                                }}
                            >
                                <BedDouble size={16} style={{ color: value === option.id ? '#ffffff' : 'var(--f-muted)' }} />
                                <span className={styles.popoverItemText}>{option.name}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function OtherIncomeTypeSelect({ value, options, onChange }: { value: string, options: string[], onChange: (v: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, () => setIsOpen(false), isOpen);
    return (
        <div className="relative" ref={containerRef}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={styles.inputWrapper}
                style={{ width: '100%', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}
            >
                <div className="flex items-center gap-3 flex-1">
                    <Package size={16} className="text-stone-400" />
                    <span className={styles.popoverItemText} style={{ color: 'var(--f-body)' }}>
                        {value || 'Pilih Tipe Transaksi'}
                    </span>
                </div>
                <ChevronRight size={14} className={`text-stone-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className={styles.popover}
                    >
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={styles.popoverItem}
                                style={{
                                    backgroundColor: value === option ? 'var(--f-sage)' : '',
                                    color: value === option ? '#ffffff' : 'var(--f-body)'
                                }}
                            >
                                <Package size={16} style={{ color: value === option ? '#ffffff' : 'var(--f-muted)' }} />
                                <span className={styles.popoverItemText}>{option}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export const NexuraInput = ({ label, value, onChange, placeholder, type = "text", isAmount = false, icon: Icon, disabled = false }: any) => {
    return (
        <div className={styles.formGroup} style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
            {label && <label className={styles.inputLabel}>{label}</label>}
            <div className={styles.inputWrapper}>
                <div className={styles.inputInner}>
                    {Icon && <Icon size={15} className="text-stone-400" />}
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                        {isAmount && <span className={styles.amountPrefix}>RP</span>}
                        <input
                            type={type}
                            value={value ?? ""}
                            onChange={e => {
                                let val = e.target.value;
                                if (type === "number" || isAmount) {
                                    // Strip negative sign if pasted or manually entered
                                    if (val.startsWith("-")) {
                                        val = val.replace("-", "");
                                    }
                                    const num = Number(val);
                                    if (!isNaN(num) && num < 0) {
                                        val = "0";
                                    }
                                }
                                onChange(val);
                            }}
                            onKeyDown={e => {
                                if (type === "number" || isAmount) {
                                    // Block keys: '-', '+', 'e', 'E'
                                    if (["-", "+", "e", "E"].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }
                            }}
                            min={(type === "number" || isAmount) ? "0" : undefined}
                            onWheel={(e) => (e.target as HTMLElement).blur()}
                            placeholder={placeholder}
                            disabled={disabled}
                            className={styles.inputField}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TypeCard = ({ label, description, icon: Icon, onClick }: any) => {
    const isRoom = label.toLowerCase().includes("room");
    const activeColor = isRoom ? '#5c6351' : '#b35e46';
    
    return (
        <button 
            onClick={onClick} 
            className={styles.typeCard}
            style={{
                backgroundColor: isRoom ? 'var(--f-sage-bg)' : 'var(--f-terracotta-bg)',
                borderColor: isRoom ? 'var(--f-sage-border)' : 'var(--f-terracotta-border)',
            }}
        >
            <div className="flex flex-col items-center gap-4 mt-2">
                <div 
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isRoom ? '#e2e6dd' : '#f7eae5',
                        color: activeColor
                    }}
                >
                    <Icon size={20} strokeWidth={1.5} />
                </div>
                
                <div className="space-y-1">
                    <h3 className="text-[16px] font-semibold text-stone-900 tracking-tight leading-none" style={{ margin: 0 }}>{label}</h3>
                    <p className="text-stone-500 text-[11px] font-normal tracking-wide" style={{ margin: '4px 0 0 0', lineHeight: '1.4' }}>
                        {description}
                    </p>
                </div>
            </div>

            <div style={{ width: '100%', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <div className={styles.typeCardActiveText}>
                    <span>Open Terminal</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </button>
    );
};

export const DateCard = ({ label, value, onChange, type }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, () => setIsOpen(false), isOpen);
    const isCheckIn = type === "check-in";
    const colorClass = isCheckIn ? "var(--f-sage-dark)" : "var(--f-terracotta)";
    const bgClass = isCheckIn ? "var(--f-sage-bg)" : "var(--f-terracotta-bg)";
    const borderClass = isCheckIn ? "var(--f-sage-border)" : "var(--f-terracotta-border)";
    const accentClass = isCheckIn ? "var(--f-sage)" : "var(--f-terracotta)";

    const formattedDate = value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Set Date';

    return (
        <div className={styles.formGroup} style={{ flex: 1, position: 'relative' }} ref={containerRef}>
            <label className={styles.inputLabel}>{label}</label>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={styles.dateCardBtn}
                style={{
                    backgroundColor: bgClass,
                    borderColor: borderClass
                }}
            >
                <div className={styles.dateCardAccent} style={{ backgroundColor: accentClass }} />
                <div className={styles.dateCardInner}>
                    <CalendarIcon size={14} style={{ color: colorClass }} />
                    <div className={styles.dateCardValue} style={{ color: colorClass }}>
                        {formattedDate}
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <CustomCalendar 
                        value={value} 
                        onChange={onChange} 
                        onClose={() => setIsOpen(false)}
                        accentColor={accentClass}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
