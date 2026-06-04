"use client";

import React from "react";
import styles from "../OverviewStyles.module.css";
import { getChannelLogo } from "../StatCard";

interface GuestFolioViewProps {
    guest: any;
}

export function GuestFolioView({ guest }: GuestFolioViewProps) {
    if (!guest) return null;

    return (
        <div className="folio-container">
            {/* Watermark Seal */}
            <div className="folio-watermark-seal" />

            {/* Brand Header */}
            <div className="folio-brand-header">
                <h3 className="folio-brand-title">Bumi Anyom Resort</h3>
                <p className="folio-brand-subtitle">Integrated PMS Folio v3.0</p>
            </div>

            {/* Section 1: Guest & Stay Details */}
            <div className="folio-section-title">Folio Information</div>
            
            <div className="folio-info-grid">
                <div className="folio-info-item">
                    <span className="folio-info-label">Guest Name</span>
                    <span className="folio-info-value">{guest.guestName || "General Sale"}</span>
                </div>
                <div className="folio-info-item" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                    <span className="folio-info-label">Source Channel</span>
                    <div style={{ marginTop: '2px', padding: '2px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid var(--f-hairline)', width: '40px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                            src={getChannelLogo(guest.channel)} 
                            alt={guest.channel} 
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', opacity: 0.6 }} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.stopPropagation(); }} 
                        />
                    </div>
                </div>
                <div className="folio-info-item">
                    <span className="folio-info-label">Stay Period</span>
                    <span className="folio-info-value folio-mono" style={{ fontSize: '10px' }}>
                        {guest.checkInDate || "---"} → {guest.checkOutDate || "---"}
                    </span>
                </div>
                <div className="folio-info-item" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                    <span className="folio-info-label">Room Assignment</span>
                    <span className="folio-info-value" style={{ fontSize: '10px' }}>
                        {guest.roomType || "Service"} {guest.roomNumber ? `| RM ${guest.roomNumber}` : ""}
                    </span>
                </div>
            </div>

            {/* Section 2: Audit Breakdown */}
            <div className="folio-section-title">Audit Ledger Summary</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--f-hairline)' }}>
                    <span className={styles.guestSubtext} style={{ fontSize: '10px', fontWeight: 600 }}>Reference Code</span>
                    <span className="folio-mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--f-ink)' }}>
                        {guest.bookingId || `TRX-${guest.timestamp?.toString().slice(-6)}`}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--f-hairline)' }}>
                    <span className={styles.guestSubtext} style={{ fontSize: '10px', fontWeight: 600 }}>Classification</span>
                    <span className={styles.guestSubtext} style={{ color: 'var(--f-ink)', fontWeight: 700 }}>
                        {guest.type === 'accommodation' ? 'Accommodation Revenue' : (guest.incomeCategory || 'Other Income')}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--f-hairline)' }}>
                    <span className={styles.guestSubtext} style={{ fontSize: '10px', fontWeight: 600 }}>Audited By</span>
                    <span className={styles.guestSubtext} style={{ color: 'var(--f-ink)', fontWeight: 700 }}>
                        {guest.staffName || "System Agent"}
                    </span>
                </div>
                {guest.status === "CANCELLED" && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--f-hairline)' }}>
                        <span className={styles.guestSubtext} style={{ fontSize: '10px', fontWeight: 600 }}>Cancelled By</span>
                        <span className={styles.guestSubtext} style={{ color: '#ef4444', fontWeight: 700 }}>
                            {guest.cancelledBy || "System"}
                        </span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
                    <span className={styles.guestSubtext} style={{ fontSize: '10px', fontWeight: 600 }}>Timestamp</span>
                    <span className="folio-mono" style={{ fontSize: '9px', color: 'var(--f-muted)' }}>
                        {new Date(guest.timestamp).toLocaleString('id-ID')}
                    </span>
                </div>
            </div>

            {/* Section 3: Financial Summary Card */}
            <div className="folio-total-card">
                <div>
                    <p className="folio-total-label">Settle Status</p>
                    <span className={`${styles.paymentBadge} ${guest.paymentStatus?.includes('Lunas') || !guest.paymentStatus ? styles.paymentLunas : styles.paymentPending}`} style={{ margin: 0, padding: '2px 8px', fontSize: '9px' }}>
                        {guest.paymentStatus || 'Pending'}
                    </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p className="folio-total-label">Grand Total</p>
                    <p className="folio-total-amount">Rp {Number(guest.amount).toLocaleString('id-ID')}</p>
                </div>
            </div>
            
            {/* Section 4: Remarks & Audit Notes */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="folio-info-label" style={{ fontStyle: 'italic', borderLeft: '2px solid var(--f-sage)', paddingLeft: '8px' }}>Audit Remark</span>
                <p className={styles.guestSubtext} style={{ margin: 0, fontStyle: 'italic', color: 'var(--f-muted)', lineHeight: '1.5', backgroundColor: 'var(--f-surface-soft)', padding: '12px', borderRadius: 'var(--f-radius-sm)', border: '1px solid var(--f-hairline)' }}>
                    {guest.note || "No remarks or audit adjustments recorded for this folio."}
                </p>
            </div>
        </div>
    );
}
