"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Users 
} from "lucide-react";
import { 
    format, 
    addDays, 
    subMonths, 
    addMonths, 
    isSameDay,
    startOfDay,
    isWeekend
} from "date-fns";
import styles from "./OverviewStyles.module.css";

export function InventoryCalendar({ 
    targetDate = 'today',
    data, 
    roomTypes = [], 
    totalRooms, 
    onDateSelect,
    onCellClick
}: { 
    targetDate?: 'today' | 'tomorrow',
    data: any[], 
    roomTypes?: any[], 
    totalRooms: number, 
    onDateSelect?: (date: string) => void,
    onCellClick?: (bookings: any[], date: string, typeName: string) => void
}) {
    const [viewDate, setViewDate] = React.useState(new Date());

    const [startDate, setStartDate] = React.useState<string>(() => {
        const today = new Date();
        return format(today, "yyyy-MM-dd");
    });

    const [endDate, setEndDate] = React.useState<string>(() => {
        const today = new Date();
        return format(addDays(today, 13), "yyyy-MM-dd");
    });

    const activeDate = React.useMemo(() => {
        return targetDate === 'tomorrow' ? addDays(startOfDay(new Date()), 1) : startOfDay(new Date());
    }, [targetDate]);

    React.useEffect(() => {
        const start = targetDate === 'tomorrow' ? addDays(new Date(), 1) : new Date();
        setStartDate(format(start, "yyyy-MM-dd"));
        setEndDate(format(addDays(start, 13), "yyyy-MM-dd"));
        setViewDate(start);
    }, [targetDate]);

    const days = React.useMemo(() => {
        try {
            const start = startOfDay(new Date(startDate));
            const end = startOfDay(new Date(endDate));
            
            if (start > end) {
                return Array.from({ length: 14 }, (_, i) => addDays(start, i));
            }

            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const limitDays = Math.min(60, diffDays); // cap at 60 days to prevent rendering overflow
            return Array.from({ length: limitDays }, (_, i) => addDays(start, i));
        } catch (e) {
            return Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i));
        }
    }, [startDate, endDate]);

    const handlePrevMonth = () => {
        const newStart = subMonths(new Date(startDate), 1);
        const newEnd = addDays(newStart, 13);
        setStartDate(format(newStart, "yyyy-MM-dd"));
        setEndDate(format(newEnd, "yyyy-MM-dd"));
        setViewDate(newStart);
    };

    const handleNextMonth = () => {
        const newStart = addMonths(new Date(startDate), 1);
        const newEnd = addDays(newStart, 13);
        setStartDate(format(newStart, "yyyy-MM-dd"));
        setEndDate(format(newEnd, "yyyy-MM-dd"));
        setViewDate(newStart);
    };

    const handleToday = () => {
        const today = new Date();
        setStartDate(format(today, "yyyy-MM-dd"));
        setEndDate(format(addDays(today, 13), "yyyy-MM-dd"));
        setViewDate(today);
    };

    return (
        <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header - Sage Aesthetic */}
            <div className={styles.calendarHeader} style={{ flexWrap: 'wrap', gap: '16px' }}>
                <div className={styles.cardHeaderLeft}>
                    <div className={styles.headerBadge} style={{ backgroundColor: '#788069', color: '#ffffff' }}>
                        <CalendarIcon size={15} />
                    </div>
                    <div className={styles.headerMeta}>
                        <span className={styles.headerSubtitle}>Operational Status</span>
                        <h2 className={styles.headerTitle} style={{ fontSize: '13px' }}>
                            Inventory <span style={{ color: '#788069' }}>Control</span>
                        </h2>
                    </div>
                </div>

                <div className={styles.calendarNav} style={{ flexWrap: 'wrap', gap: '8px', padding: '4px 12px' }}>
                    {/* Custom Date Range Pickers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={styles.guestSubtext} style={{ fontSize: '8px', fontWeight: 700, color: 'var(--f-light-muted)' }}>FROM</span>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => {
                                if (e.target.value) {
                                    setStartDate(e.target.value);
                                    setViewDate(new Date(e.target.value));
                                }
                            }}
                            style={{ 
                                padding: '4px 8px', 
                                border: '1px solid var(--f-hairline)', 
                                borderRadius: '6px', 
                                fontSize: '11px', 
                                fontFamily: 'var(--f-font-mono)', 
                                color: 'var(--f-body)',
                                outline: 'none',
                                height: '28px',
                                backgroundColor: 'var(--f-canvas)',
                                colorScheme: 'dark'
                            }} 
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={styles.guestSubtext} style={{ fontSize: '8px', fontWeight: 700, color: 'var(--f-light-muted)' }}>TO</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => {
                                if (e.target.value) {
                                    setEndDate(e.target.value);
                                }
                            }}
                            style={{ 
                                padding: '4px 8px', 
                                border: '1px solid var(--f-hairline)', 
                                borderRadius: '6px', 
                                fontSize: '11px', 
                                fontFamily: 'var(--f-font-mono)', 
                                color: 'var(--f-body)',
                                outline: 'none',
                                height: '28px',
                                backgroundColor: 'var(--f-canvas)',
                                colorScheme: 'inherit'
                            }} 
                        />
                    </div>

                    <div className={styles.vDivider} style={{ height: '18px', margin: '0 4px' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                        <button onClick={handlePrevMonth} className={styles.btnIcon} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', boxShadow: 'none' }} title="Previous Month">
                            <ChevronLeft size={14} />
                        </button>
                        <div style={{ textAlign: 'center', minWidth: '100px' }}>
                            <p className={styles.calendarMonthName} style={{ margin: 0, fontSize: '10px' }}>
                                {format(viewDate, 'MMMM yyyy')}
                            </p>
                        </div>
                        <button onClick={handleNextMonth} className={styles.btnIcon} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', boxShadow: 'none' }} title="Next Month">
                            <ChevronRight size={14} />
                        </button>
                        
                        <div className={styles.vDivider} style={{ height: '18px', margin: '0 8px' }} />
                        
                        <button onClick={handleToday} className={styles.btnIcon} style={{ height: '28px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, padding: '0 8px', border: 'none', boxShadow: 'none', width: 'auto' }}>
                            Today
                        </button>
                    </div>
                </div>
            </div>

            {/* Professional Inventory Grid */}
            <div className={styles.tableContainer}>
                <table className={styles.calendarGrid}>
                    <thead>
                        <tr>
                            <th className={styles.calendarTh} style={{ position: 'sticky', left: 0, zIndex: 20, backgroundColor: 'var(--f-surface)', borderRight: '1px solid var(--f-hairline)', minWidth: '180px', textAlign: 'left', padding: '16px' }}>
                                <p className={styles.headerSubtitle} style={{ margin: 0, color: 'var(--f-light-muted)' }}>Room Type</p>
                            </th>
                            {days.map((day, idx) => {
                                const isEnd = isWeekend(day);
                                const isActive = isSameDay(day, activeDate);
                                return (
                                    <th 
                                        key={idx} 
                                        className={`${styles.calendarTh} ${isActive ? styles.calendarThActive : ''} ${isEnd && !isActive ? styles.weekendHeader : ''}`}
                                    >
                                        <p className={styles.headerSubtitle} style={{ fontSize: '8px', color: isEnd && !isActive ? '#fca5a5' : 'var(--f-light-muted)', margin: 0, fontWeight: 700 }}>{format(day, 'EEE')}</p>
                                        <p className={styles.headerTitle} style={{ fontSize: '13px', color: isActive ? 'var(--f-sage)' : (isEnd ? '#ef4444' : 'var(--f-ink)'), margin: 0, fontWeight: 700, fontFamily: 'var(--f-font-mono)' }}>{format(day, 'dd')}</p>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {roomTypes.map((type: any, tIdx: number) => (
                            <tr key={tIdx} className={styles.tableRow}>
                                <td className={styles.calendarRowHeader}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <p className={styles.guestName} style={{ margin: 0, fontSize: '11px' }}>{type.name}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                            <p className={styles.guestSubtext} style={{ margin: 0, color: 'var(--f-light-muted)' }}>{type.allotment} Total</p>
                                        </div>
                                    </div>
                                </td>
                                {days.map((day, dIdx) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    
                                    const allEntries = data.flatMap(d => (d.entries || []).map((e: any) => ({ ...e, _docId: d.id })));
                                    
                                    const bookingsInCell = allEntries.filter((e: any, idx: number, self: any[]) => {
                                        const isSameBooking = self.findIndex(t => t.timestamp === e.timestamp) === idx;
                                        if (!isSameBooking) return false;

                                        const isAcc = (e.type === 'accommodation' || (!e.type && e.guestName)) && 
                                                      e.status?.toUpperCase() !== 'CANCELLED' && 
                                                      e.status?.toUpperCase() !== 'CANCEL' && 
                                                      e.status?.toUpperCase() !== 'VOID' && 
                                                      e.status?.toUpperCase() !== 'VOIDED';
                                        if (!isAcc) return false;

                                        const typeMatch = e.roomType?.trim().toLowerCase() === type.name?.trim().toLowerCase();
                                        if (!typeMatch) return false;

                                        return dateStr >= e.checkInDate && dateStr < e.checkOutDate;
                                    });

                                    const occupied = bookingsInCell.reduce((acc, curr) => acc + (Number(curr.roomCount) || 1), 0);
                                    const available = Math.max(0, type.allotment - occupied);
                                    const isActive = isSameDay(day, activeDate);
                                    const isSoldOut = available === 0;
                                    const isEnd = isWeekend(day);

                                    const handleCellClick = () => {
                                        onCellClick?.(bookingsInCell, dateStr, type.name);
                                    };

                                    return (
                                        <td 
                                            key={dIdx} 
                                            onClick={handleCellClick}
                                            className={`${styles.calendarTd} ${isActive ? styles.calendarTdActive : ''} ${isSoldOut ? styles.soldOutCell : (isEnd ? styles.weekendCell : '')}`}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <p className={styles.guestAmount} style={{ fontSize: '11px', color: isSoldOut ? '#ef4444' : 'var(--f-sage)', margin: 0 }}>
                                                        {available}
                                                    </p>
                                                    {occupied > 0 && <Users size={8} style={{ color: 'var(--f-light-muted)' }} />}
                                                </div>
                                                <div className={styles.calendarBar}>
                                                    <div 
                                                        className={styles.calendarBarFill}
                                                        style={{ 
                                                            width: `${(available / type.allotment) * 100}%`,
                                                            backgroundColor: isSoldOut ? '#f87171' : '#34d399'
                                                        }} 
                                                    />
                                                </div>
                                                <p className={styles.guestSubtext} style={{ fontSize: '7px', color: 'var(--f-light-muted)', margin: 0 }}>
                                                    {occupied > 0 ? `${occupied} Busy` : 'Left'}
                                                </p>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
