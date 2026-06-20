"use client";

import React, { useMemo, useRef } from "react";
import { format, addDays, subMonths, addMonths, isSameDay, startOfDay, isWeekend, differenceInDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit2, Check, X, Globe, PlusCircle } from "lucide-react";
import { Broom, Wrench, Sparkle } from "@phosphor-icons/react";
import styles from "./OverviewStyles.module.css";
import "./inventory-calendar.css";

// Helper to calculate exact days diff
const getDaysDiff = (date1: Date | string, date2: Date | string) => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return differenceInDays(startOfDay(d1), startOfDay(d2));
};

export function InventoryCalendar({ 
    targetDate = 'today',
    data, 
    roomTypes = [], 
    totalRooms, 
    onDateSelect,
    onCellClick,
    onUpdatePhysicalRooms,
    onAddTransaction,
    onDateRangeChange
}: { 
    targetDate?: 'today' | 'tomorrow',
    data: any[], 
    roomTypes?: any[], 
    totalRooms: number, 
    onDateSelect?: (date: string) => void,
    onCellClick?: (bookings: any[], date: string, typeName: string) => void,
    onUpdatePhysicalRooms?: (typeId: string, physicalRooms: any[]) => void,
    onAddTransaction?: () => void,
    onDateRangeChange?: (start: string, end: string) => void
}) {
    const [viewDate, setViewDate] = React.useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Edit state
    const [editingTypeId, setEditingTypeId] = React.useState<string | null>(null);
    const [editRoomsCache, setEditRoomsCache] = React.useState<any[]>([]);

    const [startDate, setStartDate] = React.useState<string>(() => {
        const today = new Date();
        return format(subDays(today, 1), "yyyy-MM-dd"); // Start 1 day before to see context
    });

    const [endDate, setEndDate] = React.useState<string>(() => {
        const today = new Date();
        return format(addDays(today, 13), "yyyy-MM-dd"); // 14 days view
    });

    // We define subDays helper here since date-fns subDays isn't imported
    function subDays(date: Date, amount: number) {
        return addDays(date, -amount);
    }

    const activeDate = useMemo(() => {
        return targetDate === 'tomorrow' ? addDays(startOfDay(new Date()), 1) : startOfDay(new Date());
    }, [targetDate]);

    React.useEffect(() => {
        const start = targetDate === 'tomorrow' ? addDays(new Date(), 1) : new Date();
        setStartDate(format(start, "yyyy-MM-dd"));
        setEndDate(format(addDays(start, 13), "yyyy-MM-dd"));
        setViewDate(start);
    }, [targetDate]);

    React.useEffect(() => {
        if (onDateRangeChange) {
            onDateRangeChange(startDate, endDate);
        }
    }, [startDate, endDate]);

    const days = useMemo(() => {
        try {
            const start = startOfDay(new Date(startDate));
            return Array.from({ length: 14 }, (_, i) => addDays(start, i));
        } catch (e) {
            return Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i));
        }
    }, [startDate]);

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

    const handleScrollLeft = () => {
        const newStart = addDays(new Date(startDate), -14);
        const newEnd = addDays(newStart, 13);
        setStartDate(format(newStart, "yyyy-MM-dd"));
        setEndDate(format(newEnd, "yyyy-MM-dd"));
        setViewDate(newStart);
    };

    const handleScrollRight = () => {
        const newStart = addDays(new Date(startDate), 14);
        const newEnd = addDays(newStart, 13);
        setStartDate(format(newStart, "yyyy-MM-dd"));
        setEndDate(format(newEnd, "yyyy-MM-dd"));
        setViewDate(newStart);
    };

    // Pre-process all unique active accommodation bookings
    const allBookings = useMemo(() => {
        const entries = data.flatMap(d => (d.entries || []).map((e: any) => ({ ...e, _docId: d.id })));
        
        // Filter unique and valid bookings
        const uniqueBookings = [];
        const seen = new Set();
        
        for (const e of entries) {
            const key = e.timestamp || e.bookingId || `${e.guestName}_${e.checkInDate}_${e.roomNumber}`;
            if (!seen.has(key)) {
                seen.add(key);
                
                const isAcc = (e.type === 'accommodation' || (!e.type && e.guestName)) && 
                              e.status?.toUpperCase() !== 'CANCELLED' && 
                              e.status?.toUpperCase() !== 'CANCEL' && 
                              e.status?.toUpperCase() !== 'VOID' && 
                              e.status?.toUpperCase() !== 'VOIDED';
                              
                if (isAcc && e.checkInDate && e.checkOutDate) {
                    uniqueBookings.push(e);
                }
            }
        }
        
        // Sort by checkInDate
        return uniqueBookings.sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
    }, [data]);

    // Generate Rows dynamically per Room Type
    const groupedRows = useMemo(() => {
        return roomTypes.map(type => {
            const typeBookings = allBookings.filter(b => b.roomType?.trim().toLowerCase() === type.name?.trim().toLowerCase());
            const physicalRooms = type.physicalRooms || [];
            
            // Collect unique known room numbers from bookings that might not be in physicalRooms
            const bookingRooms = Array.from(new Set(typeBookings.map(b => b.roomNumber).filter(Boolean))) as string[];
            const mappedNumbers = physicalRooms.map((pr: any) => pr.number);
            const unmappedRooms = bookingRooms.filter(r => !mappedNumbers.includes(r));
            
            const allotment = parseInt(type.allotment) || 0;
            const requiredRowCount = Math.max(allotment, physicalRooms.length + unmappedRooms.length);
            
            const rows: { id: string, label: string, number: string, bookings: any[] }[] = [];
            
            // 1. Add explicitly mapped physical rooms
            physicalRooms.forEach((pr: any) => {
                const rawName = pr.name || pr.number || '';
                rows.push({ id: pr.id, label: rawName.replace(/^Room\s+/i, ''), number: pr.number, bookings: [] });
            });
            
            // 2. Add unmapped rooms found in bookings
            unmappedRooms.forEach(roomNo => {
                rows.push({ id: `unmapped-${roomNo}`, label: roomNo, number: roomNo, bookings: [] });
            });
            
            // 3. Pad with generic rooms up to allotment
            let genericCounter = 1;
            while (rows.length < requiredRowCount) {
                let newLabel = `${genericCounter}`;
                let newNumber = `${genericCounter}`;
                while(rows.some(r => r.label === newLabel || r.number === newNumber)) {
                    genericCounter++;
                    newLabel = `${genericCounter}`;
                    newNumber = `${genericCounter}`;
                }
                rows.push({ id: `generic-${genericCounter}`, label: newLabel, number: newNumber, bookings: [] });
            }
            
            // Allocate bookings to rows to avoid overlaps
            typeBookings.forEach(booking => {
                let allocated = false;
                
                // If it has a specific room number, try to put it there
                if (booking.roomNumber) {
                    const targetRow = rows.find(r => r.number === booking.roomNumber);
                    if (targetRow) {
                        // Check overlap
                        const hasOverlap = targetRow.bookings.some(b => 
                            (booking.checkInDate < b.checkOutDate) && (booking.checkOutDate > b.checkInDate)
                        );
                        if (!hasOverlap) {
                            targetRow.bookings.push(booking);
                            allocated = true;
                        }
                    }
                }
                
                // If not allocated yet (no room number, or overlap on specific room)
                if (!allocated) {
                    // Find first available row
                    for (const row of rows) {
                        const hasOverlap = row.bookings.some(b => 
                            (booking.checkInDate < b.checkOutDate) && (booking.checkOutDate > b.checkInDate)
                        );
                        if (!hasOverlap) {
                            row.bookings.push(booking);
                            allocated = true;
                            break;
                        }
                    }
                }
                
                // If STILL not allocated (overbooking), create a new overflow row
                if (!allocated) {
                    const newRow = { id: `overflow-${Date.now()}-${Math.random()}`, label: `Overbooking`, number: '', bookings: [booking] };
                    rows.push(newRow);
                }
            });
            
            return {
                typeId: type.id,
                typeName: type.name,
                allotment: type.allotment,
                rows,
                originalPhysicalRooms: type.physicalRooms || []
            };
        });
    }, [roomTypes, allBookings]);

    const handleEditStart = (group: any) => {
        setEditingTypeId(group.typeId);
        // Map current rows to editable physical rooms array
        // We only want to save the ones that are actual slots up to allotment, or let them save all mapped.
        // For simplicity, we create editable entries for all rows currently shown (excluding overbooking).
        const cache = group.rows
            .filter((r: any) => !r.id.startsWith('overflow-'))
            .map((r: any) => ({
                id: r.id.startsWith('generic-') || r.id.startsWith('unmapped-') ? `pr-${Date.now()}-${Math.random()}` : r.id,
                number: r.number,
                name: r.label
            }));
        setEditRoomsCache(cache);
    };

    const handleEditSave = () => {
        if (editingTypeId && onUpdatePhysicalRooms) {
            // Filter out empty rows if necessary, or just save them all
            const validRooms = editRoomsCache.filter(r => r.number.trim() !== '');
            onUpdatePhysicalRooms(editingTypeId, validRooms);
        }
        setEditingTypeId(null);
    };

    const handleEditCancel = () => {
        setEditingTypeId(null);
        setEditRoomsCache([]);
    };

    const CELL_WIDTH = 80; // 80px per day

    const getChannelIcon = (channel?: string, source?: string) => {
        const c = (channel || source || "").toLowerCase();
        if (c.includes("agoda")) return "/channels/agoda.png";
        if (c.includes("airbnb")) return "/channels/airbnb.png";
        if (c.includes("booking.com") || (c.includes("booking") && !c.includes("engine"))) return "/channels/booking_com.png";
        if (c.includes("expedia")) return "/channels/expedia.png";
        if (c.includes("mg")) return "/channels/mg.png";
        if (c.includes("tiket")) return "/channels/tiket_com.png";
        if (c.includes("traveloka")) return "/channels/traveloka.png";
        if (c.includes("trip")) return "/channels/trip.png";
        if (c.includes("walk") || c === "internal" || c.includes("front")) return "/channels/walk_in.png";
        return null;
    };

    const getBookingColor = (booking: any) => {
        const rs = booking.roomStatus?.toLowerCase() || '';
        const gs = booking.guestStatus?.toLowerCase() || '';
        const s = booking.status?.toUpperCase() || '';

        if (gs === 'arriving') return '#3b82f6'; // Blue
        if (gs === 'checked_in' || s === 'CHECKED_IN' || rs === 'occupied') return '#10b981'; // Green
        if (gs === 'checked_out' || s === 'CHECKED_OUT') return '#71717a'; // Gray
        if (gs === 'no_show') return '#ef4444'; // Red
        
        if (booking.paymentStatus === 'Belum Bayar' || s === 'PENDING') return '#eab308'; // Yellow

        if (rs === 'maintenance' || rs === 'out of order') return '#ef4444'; // Red

        return '#8b5cf6'; // Default Confirmed (Violet)
    };

    const getStatusLabel = (booking: any) => {
        const rs = booking.roomStatus?.toLowerCase() || '';
        const gs = booking.guestStatus?.toLowerCase() || '';
        const s = booking.status?.toUpperCase() || '';
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        if (gs === 'arriving') return 'ARRIVING';
        if (gs === 'checked_in' || s === 'CHECKED_IN' || rs === 'occupied') return 'IN HOUSE';
        if (gs === 'checked_out' || s === 'CHECKED_OUT' || (booking.paymentStatus === "Lunas" && booking.checkOutDate < todayStr)) return 'CHECKED OUT';
        if (gs === 'no_show') return 'NO SHOW';
        
        if (rs === 'maintenance' || rs === 'out of order') return 'MAINT.';

        if (booking.paymentStatus === "Belum Bayar" || s === "PENDING") return "PENDING";
        return "CONFIRMED";
    };

    return (
        <div className="gantt-container">
            {/* Header Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', zIndex: 40, borderBottom: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-surface)' }}>
                <div className={styles.calendarHeader} style={{ flexWrap: 'wrap', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--f-hairline)' }}>
                <div className={styles.cardHeaderLeft}>
                    <div className={styles.headerBadge} style={{ backgroundColor: '#788069', color: '#ffffff' }}>
                        <CalendarIcon size={15} />
                    </div>
                    <div className={styles.headerMeta}>
                        <span className={styles.headerSubtitle}>Tape Chart</span>
                        <h2 className={styles.headerTitle} style={{ fontSize: '13px' }}>
                            Inventory <span style={{ color: '#788069' }}>Gantt</span>
                        </h2>
                    </div>
                </div>

                <div className={styles.calendarNav} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={styles.guestSubtext} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--f-light-muted)' }}>FROM</span>
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
                                padding: '4px 8px', border: '1px solid var(--f-hairline)', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--f-font-mono)', outline: 'none', height: '28px', backgroundColor: 'var(--f-surface)', colorScheme: 'inherit'
                            }} 
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={styles.guestSubtext} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--f-light-muted)' }}>TO</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => {
                                if (e.target.value) {
                                    setEndDate(e.target.value);
                                    // Make sure startDate follows if it's too far
                                    const diff = getDaysDiff(e.target.value, startDate);
                                    if (diff < -13) {
                                        setStartDate(format(addDays(new Date(e.target.value), -13), "yyyy-MM-dd"));
                                    }
                                }
                            }}
                            style={{ 
                                padding: '4px 8px', border: '1px solid var(--f-hairline)', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--f-font-mono)', outline: 'none', height: '28px', backgroundColor: 'var(--f-surface)', colorScheme: 'inherit'
                            }} 
                        />
                    </div>
                    
                    <div className={styles.vDivider} style={{ height: '18px', margin: '0 4px' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={handlePrevMonth} className={styles.btnIcon} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--f-hairline)', boxShadow: 'none' }} title="Previous Month">
                            <ChevronLeft size={14} />
                        </button>
                        <div style={{ textAlign: 'center', minWidth: '100px', fontWeight: 700, letterSpacing: '0.05em' }}>
                            <span style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                                {format(viewDate, 'MMMM yyyy')}
                            </span>
                        </div>
                        <button onClick={handleNextMonth} className={styles.btnIcon} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--f-hairline)', boxShadow: 'none' }} title="Next Month">
                            <ChevronRight size={14} />
                        </button>
                        <button onClick={handleToday} className={styles.btnIcon} style={{ height: '28px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, padding: '0 12px', border: '1px solid var(--f-hairline)', boxShadow: 'none', width: 'auto', marginLeft: '4px' }}>
                            Today
                        </button>
                        
                        <div className={styles.vDivider} style={{ height: '18px', margin: '0 4px' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--f-light-muted)' }}>SCROLL</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button onClick={handleScrollLeft} className={styles.btnIcon} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--f-hairline)', boxShadow: 'none', backgroundColor: 'var(--f-surface)' }} title="Scroll Left">
                                <ChevronLeft size={14} />
                            </button>
                            <button onClick={handleScrollRight} className={styles.btnIcon} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--f-hairline)', boxShadow: 'none', backgroundColor: 'var(--f-surface)' }} title="Scroll Right">
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {onAddTransaction && (
                            <>
                                <div className={styles.vDivider} style={{ height: '18px', margin: '0 4px' }} />
                                <button 
                                    onClick={onAddTransaction} 
                                    className="gantt-btn-primary" 
                                    style={{ height: '28px', borderRadius: '6px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--foreground)', color: 'var(--f-canvas)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px' }}
                                    title="Add Transaction"
                                >
                                    <PlusCircle size={14} />
                                    <span>Add Transaction</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend Area */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '8px 20px', backgroundColor: 'var(--f-canvas)', alignItems: 'center', borderBottom: '1px solid var(--f-hairline)' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--f-muted)', letterSpacing: '0.1em', marginRight: '4px' }}>STATUS TAMU:</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#8b5cf6' }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8 }}>Confirmed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#3b82f6' }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8 }}>Arriving</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#10b981' }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8 }}>In House</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#71717a' }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8 }}>Checked Out</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#eab308' }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8 }}>Pending / DP</span>
                </div>

                <div className={styles.vDivider} style={{ height: '14px', margin: '0 4px', width: '1px', backgroundColor: 'var(--f-hairline)' }} />
                
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--f-muted)', letterSpacing: '0.1em', marginRight: '4px' }}>ROOM ICON:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Broom size={14} weight="fill" color="#f59e0b" />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8 }}>Dirty</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wrench size={14} weight="fill" color="#ef4444" />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8 }}>Maintenance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkle size={14} weight="fill" color="#10b981" />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8 }}>Clean</span>
                </div>
            </div>
            {/* End of Header Controls Wrapper */}
            </div>

            {/* Gantt Area */}
            <div className="gantt-scroll-area" ref={scrollContainerRef}>
                
                {/* Left Sidebar (Room Types & Rows) */}
                <div className="gantt-sidebar">
                    <div className="gantt-sidebar-header">
                        Room & Types
                    </div>
                    
                    {groupedRows.map(group => (
                        <div key={group.typeId} className="gantt-type-group">
                            <div className="gantt-type-header">
                                <span>{group.typeName} <span style={{ opacity: 0.5, fontWeight: 500 }}>({group.allotment})</span></span>
                                {editingTypeId === group.typeId ? (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={handleEditSave} className={styles.btnIcon} style={{ width: '24px', height: '24px', color: 'var(--sage)' }} title="Save"><Check size={14} /></button>
                                        <button onClick={handleEditCancel} className={styles.btnIcon} style={{ width: '24px', height: '24px', color: '#ef4444' }} title="Cancel"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => handleEditStart(group)} className={styles.btnIcon} style={{ width: '24px', height: '24px', border: 'none', boxShadow: 'none' }} title="Edit Rooms">
                                        <Edit2 size={12} />
                                    </button>
                                )}
                            </div>
                            
                            {editingTypeId === group.typeId ? (
                                // EDIT MODE
                                editRoomsCache.map((er, idx) => (
                                    <div key={er.id} className="gantt-room-row-label" style={{ padding: '0 20px 0 32px' }}>
                                        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                value={er.number}
                                                onChange={(e) => {
                                                    const newCache = [...editRoomsCache];
                                                    newCache[idx].number = e.target.value;
                                                    newCache[idx].name = e.target.value;
                                                    setEditRoomsCache(newCache);
                                                }}
                                                placeholder="No."
                                                className="gantt-edit-input"
                                                style={{ width: '80px', textAlign: 'center' }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // VIEW MODE
                                group.rows.map(row => (
                                    <div key={row.id} className="gantt-room-row-label">
                                        {row.label}
                                    </div>
                                ))
                            )}
                        </div>
                    ))}
                </div>

                {/* Timeline Grid */}
                <div className="gantt-timeline-container">
                    
                    <div className="gantt-timeline-header">
                        {days.map((day, idx) => {
                            const isEnd = isWeekend(day);
                            const isActive = isSameDay(day, activeDate);
                            return (
                                <div key={idx} className={`gantt-date-cell ${isActive ? 'is-today' : ''} ${isEnd && !isActive ? 'is-weekend' : ''}`}>
                                    <span className="gantt-date-day" style={{ color: isEnd && !isActive ? '#fca5a5' : '' }}>{format(day, 'EEE')}</span>
                                    <span className="gantt-date-num" style={{ color: isEnd && !isActive ? '#ef4444' : '' }}>{format(day, 'dd')}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="gantt-grid-layer" style={{ width: '100%' }}>
                        {days.map((day, idx) => {
                            const isEnd = isWeekend(day);
                            const isActive = isSameDay(day, activeDate);
                            return (
                                <div key={idx} className={`gantt-grid-col ${isActive ? 'is-today' : ''} ${isEnd && !isActive ? 'is-weekend' : ''}`} />
                            );
                        })}
                    </div>

                    <div className="gantt-rows-container" style={{ width: '100%' }}>
                        {groupedRows.map(group => (
                            <div key={group.typeId} className="gantt-type-group-bg">
                                <div className="gantt-type-header-bg" />
                                {group.rows.map(row => (
                                    <div key={row.id} className="gantt-row-bg">
                                        <div className="gantt-booking-layer">
                                            {row.bookings.map((booking, bIdx) => {
                                                // Calculate left offset based on startDate
                                                const checkInDate = new Date(booking.checkInDate);
                                                const checkOutDate = new Date(booking.checkOutDate);
                                                
                                                // If booking ends before start date, skip (shouldn't happen with proper filtering)
                                                if (checkOutDate <= new Date(startDate)) return null;
                                                // If booking starts after end date, skip
                                                if (checkInDate > new Date(endDate)) return null;

                                                const leftOffsetDays = getDaysDiff(checkInDate, new Date(startDate));
                                                const durationDays = getDaysDiff(checkOutDate, checkInDate);
                                                
                                                const pctPerDay = 100 / days.length;
                                                const leftPct = leftOffsetDays * pctPerDay;
                                                const widthPct = durationDays * pctPerDay;
                                                
                                                // Don't render if completely out of bounds
                                                if (leftPct + widthPct <= 0) return null;

                                                const statusTxt = getStatusLabel(booking);
                                                const bgColor = getBookingColor(booking);
                                                const channelIcon = getChannelIcon(booking.channel, booking.source);

                                                return (
                                                    <div 
                                                        key={`${booking.bookingId || booking.timestamp}-${bIdx}`} 
                                                        className={`gantt-booking-block`}
                                                        style={{ left: `${leftPct}%`, width: `calc(${widthPct}% - 4px)`, backgroundColor: bgColor }}
                                                        onClick={() => onCellClick && onCellClick([booking], booking.checkInDate, group.typeName)}
                                                        title={`${booking.guestName} | Status: ${statusTxt} | ${booking.checkInDate} to ${booking.checkOutDate}`}
                                                    >
                                                        <div className="gantt-booking-content">
                                                            {channelIcon ? (
                                                                <img src={channelIcon} alt="channel" style={{ width: '16px', height: '16px', borderRadius: '2px', backgroundColor: 'white', objectFit: 'contain' }} />
                                                            ) : (
                                                                <Globe size={16} style={{ opacity: 0.8 }} />
                                                            )}
                                                            {/* Housekeeping Icons */}
                                                            {booking.roomStatus?.toLowerCase() === 'dirty' && (
                                                                <Broom size={16} weight="fill" color="#fcd34d" style={{ marginLeft: '4px', flexShrink: 0 }} title="Dirty Room" />
                                                            )}
                                                            {booking.roomStatus?.toLowerCase() === 'maintenance' && (
                                                                <Wrench size={16} weight="fill" color="#fca5a5" style={{ marginLeft: '4px', flexShrink: 0 }} title="Maintenance" />
                                                            )}
                                                            {booking.roomStatus?.toLowerCase() === 'clean' && (
                                                                <Sparkle size={16} weight="fill" color="#a7f3d0" style={{ marginLeft: '4px', flexShrink: 0 }} title="Clean" />
                                                            )}

                                                            <span className="gantt-booking-name">{booking.guestName || "Guest"}</span>
                                                            <span className="gantt-booking-status">{statusTxt}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                </div>

            </div>
        </div>
    );
}
