"use client";

import React from "react";
import styles from "../OverviewStyles.module.css";
import { getChannelLogo } from "../StatCard";
import { useAuth } from "@/context/AuthContext";

interface GuestFolioViewProps {
    guest: any;
}

export function GuestFolioView({ guest }: GuestFolioViewProps) {
    const { activeHotelName } = useAuth();
    if (!guest) return null;

    return (
        <div className="folio-container">
            {/* Watermark Seal */}
            <div className="folio-watermark-seal" />

            {/* Brand Header */}
            <div className="folio-brand-header">
                <h3 className="folio-brand-title">{activeHotelName || 'Partner Property'}</h3>
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
                    <div style={{ marginTop: '2px', padding: '2px', backgroundColor: 'var(--f-canvas)', borderRadius: '4px', border: '1px solid var(--f-hairline)', width: '40px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            {(() => {
                const totalAmount = Number(guest.totalAmount || guest.amount || 0);
                const payHotel = Number(guest.payHotel ?? guest.paidCash ?? 0);
                const payTransfer = Number(guest.payTransfer ?? guest.paidTransfer ?? 0);
                const totalPaid = payHotel + payTransfer;
                const remainingBalance = Math.max(0, totalAmount - totalPaid);

                return (
                    <>
                        <div className="folio-total-card">
                            <div>
                                <p className="folio-total-label">Settle Status</p>
                                <span className={`${styles.paymentBadge} ${guest.paymentStatus?.includes('Lunas') ? styles.paymentLunas : styles.paymentPending}`} style={{ margin: 0, padding: '2px 8px', fontSize: '9px' }}>
                                    {guest.paymentStatus || 'Pending'}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p className="folio-total-label">Grand Total</p>
                                <p className="folio-total-amount">Rp {totalAmount.toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        {/* Detailed Inline Payment Breakdown */}
                        <div style={{ marginTop: '12px', padding: '12px', border: '1px solid var(--f-hairline)', borderRadius: 'var(--f-radius-sm)', backgroundColor: 'var(--f-surface-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 600 }}>Paid at Hotel (Cash/Transfer)</span>
                                <span className="folio-mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--f-ink)' }}>
                                    Rp {payHotel.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 600 }}>Paid via OTA / Virtual</span>
                                <span className="folio-mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--f-ink)' }}>
                                    Rp {payTransfer.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div style={{ height: '1px', backgroundColor: 'var(--f-hairline)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700 }}>Total Collected</span>
                                <span className="folio-mono" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--f-ink)' }}>
                                    Rp {totalPaid.toLocaleString('id-ID')}
                                </span>
                            </div>
                            {remainingBalance > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                                    <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: '#b45309' }}>Remaining Balance (Piutang)</span>
                                    <span className="folio-mono" style={{ fontSize: '10px', fontWeight: 800, color: '#b45309' }}>
                                        Rp {remainingBalance.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                );
            })()}
            
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
