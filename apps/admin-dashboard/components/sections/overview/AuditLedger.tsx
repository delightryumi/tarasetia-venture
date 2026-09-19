"use client";

import React, { useState, useMemo } from "react";
import { 
    CalendarCheck2, 
    Download, 
    RefreshCw, 
    Search, 
    SlidersHorizontal,
    ArrowUpDown,
    CheckCircle2, 
    AlertTriangle, 
    HelpCircle,
    Copy,
    Check
} from "lucide-react";
import { getChannelLogo } from "./StatCard";
import styles from "./OverviewStyles.module.css";
import { toast } from "sonner";

interface AuditLedgerProps {
    bookings: any[];
    title?: string;
    activeFilter?: string | null;
    onClearFilter?: () => void;
    onRefresh?: () => void;
    onView: (booking: any) => void;
    onEdit: (booking: any) => void;
    onDelete: (booking: any) => void;
    onCancel?: (booking: any) => void;
    onStatusUpdate: (item: any, field: string, value: string) => void;
    onExportPDF: () => void;
    onExportExcel: () => void;
    activeHotelName?: string;
}

// Format date to Channex standard: "Sep 18, 2026"
const formatChannexDate = (dateStr?: string) => {
    if (!dateStr || dateStr === '---') return '---';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

export function AuditLedger({ 
    bookings, 
    title,
    activeFilter,
    onClearFilter,
    onRefresh,
    onView, 
    onEdit, 
    onDelete, 
    onCancel,
    onStatusUpdate,
    onExportPDF,
    onExportExcel,
    activeHotelName
}: AuditLedgerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        toast.success(`Copied: ${text}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Filter and sort bookings
    const filteredBookings = useMemo(() => {
        let result = [...bookings];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b => 
                (b.guestName && b.guestName.toLowerCase().includes(q)) ||
                (b.bookingId && b.bookingId.toLowerCase().includes(q)) ||
                (b.channel && b.channel.toLowerCase().includes(q)) ||
                (b.roomType && b.roomType.toLowerCase().includes(q))
            );
        }
        result.sort((a, b) => {
            const timeA = new Date(a.checkInDate || a.timestamp || 0).getTime();
            const timeB = new Date(b.checkInDate || b.timestamp || 0).getTime();
            return sortAsc ? timeA - timeB : timeB - timeA;
        });
        return result;
    }, [bookings, searchQuery, sortAsc]);

    return (
        <section className={styles.card} style={{ overflow: 'hidden', padding: 0, backgroundColor: '#ffffff', border: '1px solid var(--f-hairline, #e2e8f0)', borderRadius: '8px' }}>
            {/* Channex-Standard Top Toolbar */}
            <div style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid var(--f-hairline, #e2e8f0)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                {/* Left Side: Title & Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {title && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em' }}>
                                {title}
                            </span>
                        </div>
                    )}
                    <div style={{ position: 'relative', minWidth: '240px' }}>
                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Confirmation No., Guest, Channel..."
                            style={{
                                padding: '6px 12px 6px 32px',
                                fontSize: '12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                width: '260px',
                                outline: 'none',
                                color: '#0f172a',
                                backgroundColor: '#ffffff'
                            }}
                        />
                    </div>
                    {activeFilter && (
                        <button
                            type="button"
                            onClick={onClearFilter}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#334155',
                                cursor: 'pointer'
                            }}
                            title="Click to clear filter"
                        >
                            <span>Filter: {activeFilter}</span>
                            <span style={{ color: '#ef4444', fontWeight: 800, marginLeft: '4px' }}>✕</span>
                        </button>
                    )}
                </div>

                {/* Right Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        type="button"
                        onClick={() => toast.info("Advanced filter active by date range & reservation status.")}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#334155',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <SlidersHorizontal size={13} />
                        <span>Advanced Filter</span>
                    </button>

                    <button 
                        type="button"
                        onClick={() => {
                            if (onRefresh) {
                                onRefresh();
                                toast.success("Ledger transactions refreshed");
                            } else {
                                window.location.reload();
                            }
                        }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#334155',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={13} />
                        <span>Refresh</span>
                    </button>

                    <button 
                        type="button"
                        onClick={onExportExcel}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#334155',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <Download size={13} />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
                <table className={styles.tableElement} style={{ minWidth: '940px', borderCollapse: 'collapse', width: '100%' }}>
                    <thead style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#595959', width: '130px' }}>
                                Reservation Status
                            </th>
                            <th 
                                onClick={() => setSortAsc(prev => !prev)}
                                style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#595959', cursor: 'pointer', width: '160px' }}
                            >
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span>Confirmation No.</span>
                                    <ArrowUpDown size={12} style={{ opacity: 0.6 }} />
                                </div>
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#595959', width: '160px' }}>
                                Property
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#595959' }}>
                                Guest Name / Account
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#595959', width: '220px' }}>
                                Stay Period
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#595959', width: '100px' }}>
                                Rooms
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#595959', width: '80px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
                                    <span>Channel ACK</span>
                                    <HelpCircle size={11} style={{ opacity: 0.6 }} />
                                </div>
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#595959', width: '140px' }}>
                                Folio Balance
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#595959', width: '90px' }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: '#8c8c8c' }}>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>No transaction records found for this period.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map((booking, idx) => {
                                const st = String(booking.status || '').toUpperCase();
                                const pst = String(booking.paymentStatus || '').toUpperCase();
                                const gst = String(booking.guestStatus || '').toLowerCase();
                                const isCancelled = st === 'CANCELLED' || st === 'CANCEL' || pst === 'CANCELLED' || pst === 'CANCEL' || gst === 'cancelled' || gst === 'cancel';
                                const isUnmapped = booking.channexRaw?.unmapped || booking.status === 'UNMAPPED' || String(booking.note || '').toLowerCase().includes('unmapped');

                                const isOther = booking.type === 'other_income';
                                const checkInFormatted = isOther 
                                    ? (booking.date ? formatChannexDate(booking.date) : (booking.timestamp ? formatChannexDate(new Date(booking.timestamp).toISOString().split('T')[0]) : '---'))
                                    : formatChannexDate(booking.checkInDate || booking.checkIn);
                                const checkOutFormatted = isOther ? '' : formatChannexDate(booking.checkOutDate || booking.checkOut);
                                const dateDisplay = isOther || !checkOutFormatted || checkOutFormatted === '---'
                                    ? checkInFormatted
                                    : `${checkInFormatted} → ${checkOutFormatted}`;

                                const uniqueId = booking.bookingId || booking.voucherCode || `MTR-${booking.timestamp?.toString().slice(-6) || idx}`;
                                const totalAmt = Number(booking.totalAmount || booking.amount || 0);

                                return (
                                    <tr 
                                        key={idx}
                                        style={{ 
                                            borderBottom: '1px solid #f0f0f0',
                                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                                            transition: 'background-color 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                                    >
                                        {/* Status */}
                                        <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                {isCancelled ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8c8c8c', fontWeight: 500 }}>
                                                        Cancelled
                                                    </span>
                                                ) : isUnmapped ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#faad14', fontWeight: 600 }}>
                                                        <AlertTriangle size={13} color="#faad14" />
                                                        <span>New</span>
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 600 }}>
                                                        <CheckCircle2 size={13} color="#16a34a" />
                                                        <span>Confirmed</span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Unique ID */}
                                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#262626' }}>
                                            <span style={{ fontFamily: 'var(--f-font-mono, monospace)', fontWeight: 500 }}>
                                                {uniqueId}
                                            </span>
                                        </td>

                                        {/* Property */}
                                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#595959' }}>
                                            {booking.propertyName || activeHotelName || "—"}
                                        </td>

                                        {/* Customer */}
                                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#262626', fontWeight: 500 }}>
                                            {booking.guestName || booking.incomeCategory || (isOther ? "Other Non-Room Income" : "Direct Guest Folio")}
                                        </td>

                                        {/* Dates */}
                                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#595959' }}>
                                            {dateDisplay}
                                        </td>

                                        {/* Rooms Count */}
                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#595959' }}>
                                            {isOther ? '—' : (booking.roomCount || 1)}
                                        </td>

                                        {/* Acked */}
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', justifyContent: 'center' }}>
                                                <HelpCircle size={14} style={{ color: '#bfbfbf' }} />
                                            </div>
                                        </td>

                                        {/* Total */}
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#262626' }}>
                                            IDR {totalAmt.toLocaleString('id-ID')}
                                        </td>

                                        {/* Actions: View text link ala Channex */}
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <button 
                                                type="button"
                                                onClick={() => onView(booking)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#0284c7',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    textDecoration: 'none'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                            >
                                                View Folio
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
