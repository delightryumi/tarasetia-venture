"use client";

import React from "react";
import { Activity, Download, FileText, Eye, Pencil, Trash2, CalendarX } from "lucide-react";
import { getChannelLogo } from "./StatCard";
import { RoomStatusPicker, GuestStatusPicker } from "./StatusPickers";
import styles from "./OverviewStyles.module.css";

interface AuditLedgerProps {
    bookings: any[];
    onView: (booking: any) => void;
    onEdit: (booking: any) => void;
    onDelete: (booking: any) => void;
    onCancel?: (booking: any) => void;
    onStatusUpdate: (item: any, field: string, value: string) => void;
    onExportPDF: () => void;
    onExportExcel: () => void;
}

export function AuditLedger({ 
    bookings, 
    onView, 
    onEdit, 
    onDelete, 
    onCancel,
    onStatusUpdate,
    onExportPDF,
    onExportExcel
}: AuditLedgerProps) {
    return (
        <section className={styles.card} style={{ overflow: 'hidden', padding: 0 }}>
            <div className={styles.cardHeader} style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--f-hairline)', marginBottom: 0 }}>
                <div className={styles.cardHeaderLeft}>
                    <div className={styles.headerBadge} style={{ backgroundColor: 'var(--color-neutral-200, rgba(141, 122, 82, 0.12))', color: 'var(--color-neutral-900, #212121)' }}>
                        <Activity size={15} />
                    </div>
                    <div className={styles.headerMeta}>
                        <span className={styles.headerSubtitle}>Setara Operational</span>
                        <h2 className={styles.headerTitle} style={{ fontSize: '13px' }}>
                            Detail <span style={{ color: 'var(--color-neutral-900, #212121)' }}>Transaksi</span>
                        </h2>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <div style={{ textAlign: 'right', marginRight: '16px', borderRight: '1px solid var(--f-hairline)', paddingRight: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className={styles.headerSubtitle} style={{ fontSize: '8px' }}>Ledger Status</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-neutral-900, #212121)' }} />
                            <span className={styles.guestSubtext} style={{ color: 'var(--f-ink)', fontSize: '9px', fontWeight: 700 }}>{bookings.length} Active Entries</span>
                        </div>
                    </div>
                    <button 
                        onClick={onExportExcel} 
                        className={styles.btnIcon}
                        style={{ width: '36px', height: '36px', borderRadius: '8px' }}
                        title="Export to Excel"
                    >
                        <Download size={16} />
                    </button>
                    <button 
                        onClick={onExportPDF} 
                        className={styles.btnIcon}
                        style={{ width: '36px', height: '36px', borderRadius: '8px' }}
                        title="Export to PDF"
                    >
                        <FileText size={16} />
                    </button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.tableElement}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.tableHeadCell}>Guest Name</th>
                            <th className={styles.tableHeadCell}>Stay Period</th>
                            <th className={styles.tableHeadCell}>Room & Remarks</th>
                            <th className={styles.tableHeadCell}>Channel</th>
                            <th className={styles.tableHeadCell}>Financials</th>
                            <th className={styles.tableHeadCell} style={{ textAlign: 'center' }}>Status</th>
                            <th className={styles.tableHeadCell} style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking, idx) => {
                            const isAcc = booking.type === 'accommodation' || (!booking.type && booking.guestName && !booking.guestName.startsWith('POS Order') && !booking.posItems && !booking.revenueType);
                            const isCancelled = booking.status === 'CANCELLED' || booking.status === 'CANCEL';
                            return (
                                <tr 
                                    key={idx} 
                                    className={`${styles.tableRow} ${isCancelled ? styles.cancelledRow : ''}`}
                                    style={idx % 2 === 0 ? { backgroundColor: 'var(--f-canvas)' } : { backgroundColor: 'var(--f-surface)' }}
                                >
                                    <td className={styles.tableCell}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                            <div 
                                                style={{ 
                                                    width: "40px", 
                                                    height: "40px", 
                                                    borderRadius: "50%", 
                                                    overflow: "hidden", 
                                                    border: "1px solid var(--f-hairline)", 
                                                    display: "flex", 
                                                    alignItems: "center", 
                                                    justifyContent: "center", 
                                                    padding: 0,
                                                    flexShrink: 0,
                                                    backgroundColor: ['rgba(141, 122, 82, 0.15)', 'rgba(120, 128, 105, 0.15)', 'rgba(141, 122, 82, 0.08)', 'rgba(120, 128, 105, 0.08)', 'var(--f-surface-soft)', 'rgba(0, 0, 0, 0.04)', 'rgba(0, 0, 0, 0.02)'][((((booking.guestName || "O").charCodeAt(0) || 0) + (booking.amount || 0)) % 7)] 
                                                }}
                                            >
                                                <img 
                                                    src={`/avatar/memo_${((((booking.guestName || "O").charCodeAt(0) || 0) + (booking.amount || 0)) % 35) + 1}.png`} 
                                                    alt={booking.guestName || "Guest"} 
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <p className={styles.guestName} style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                                                    {booking.guestName || "General Sale"}
                                                </p>
                                                <p className={styles.guestSubtext} style={{ fontSize: '8px', color: 'var(--f-light-muted)', margin: 0, fontFamily: 'var(--f-font-mono)' }}>{booking.bookingId || "Walk-In"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <p className={styles.guestSubtext} style={{ color: 'var(--f-body)', fontWeight: 700, margin: 0 }}>
                                                {booking.checkInDate || "---"}
                                            </p>
                                            <p className={styles.guestSubtext} style={{ fontSize: '8px', color: 'var(--f-light-muted)', margin: 0 }}>Until {booking.checkOutDate || "---"}</p>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell} style={{ padding: '20px 16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex' }}>
                                                <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: 'var(--f-surface-soft)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--f-hairline)', fontSize: '9px', letterSpacing: '0.05em' }}>
                                                    {(booking.roomType || "Service").toUpperCase()}
                                                </span>
                                            </div>
                                            {booking.roomNumber && (
                                                <span className={styles.guestSubtext} style={{ color: 'var(--f-sage)', fontWeight: 800, fontSize: '10px', letterSpacing: '0.05em', marginLeft: '2px' }}>
                                                    {booking.roomNumber.toUpperCase().startsWith('ROOM') ? booking.roomNumber.toUpperCase() : `ROOM ${booking.roomNumber.toUpperCase()}`}
                                                </span>
                                            )}
                                            {isAcc && (
                                                <RoomStatusPicker 
                                                    current={booking.roomStatus || 'dirty'} 
                                                    onChange={(val) => onStatusUpdate(booking, 'roomStatus', val)} 
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--f-canvas)', border: '1px solid var(--f-hairline)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <img src={getChannelLogo(booking.channel)} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', opacity: 0.6 }} onError={(e) => { e.currentTarget.style.display = 'none'; e.stopPropagation(); }} />
                                            </div>
                                            <p className={styles.guestSubtext} style={{ margin: 0, fontWeight: 700, color: 'var(--f-light-muted)' }}>{booking.channel}</p>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <p className={styles.guestAmount} style={{ margin: 0 }}>Rp {Number(booking.amount).toLocaleString('id-ID')}</p>
                                            <p className={`${styles.paymentBadge} ${booking.paymentStatus?.includes('Lunas') ? styles.paymentLunas : styles.paymentPending}`} style={{ margin: 0, width: 'fit-content' }}>
                                                {booking.paymentStatus || 'Pending'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            {isAcc ? (
                                                <GuestStatusPicker 
                                                    current={booking.guestStatus || 'arriving'} 
                                                    onChange={(val) => onStatusUpdate(booking, 'guestStatus', val)}
                                                />
                                            ) : (
                                                <span className={styles.guestSubtext} style={{ color: 'var(--f-light-muted)', fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em' }}>Service</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <button onClick={() => onView(booking)} className={styles.btnIcon} style={{ width: '32px', height: '32px', borderRadius: '6px' }} title="View Details"><Eye size={14} /></button>
                                            <button onClick={() => onEdit(booking)} className={styles.btnIcon} style={{ width: '32px', height: '32px', borderRadius: '6px' }} title="Edit"><Pencil size={14} /></button>
                                            {!isCancelled && (
                                                <button 
                                                    onClick={() => onCancel?.(booking)} 
                                                    className={`${styles.btnIcon} ${styles.btnIconWarning}`} 
                                                    style={{ width: '32px', height: '32px', borderRadius: '6px' }} 
                                                    title="Cancel Booking"
                                                >
                                                    <CalendarX size={14} />
                                                </button>
                                            )}
                                            <button onClick={() => onDelete(booking)} className={`${styles.btnIcon} ${styles.btnIconDanger}`} style={{ width: '32px', height: '32px', borderRadius: '6px' }} title="Void Entry"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
