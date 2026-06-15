"use client";

import React from "react";
import styles from "../OverviewStyles.module.css";

interface GuestEditFormProps {
    formData: any;
    setFormData: (val: any) => void;
    roomTypes: any[];
}

const CHANNELS = [
    { name: "Traveloka", logo: "/channels/traveloka.png" },
    { name: "Booking.com", logo: "/channels/booking_com.png" },
    { name: "Tiket.com", logo: "/channels/tiket_com.png" },
    { name: "Agoda", logo: "/channels/agoda.png" },
    { name: "Airbnb", logo: "/channels/airbnb.png" },
    { name: "Trip.com", logo: "/channels/trip.png" },
    { name: "Expedia", logo: "/channels/expedia.png" },
    { name: "MG Bedbank", logo: "/channels/mg.png" },
    { name: "Walk-in", logo: "/channels/walk_in.png" },
    { name: "Booking Engine", logo: "globe" },
];

export function GuestEditForm({ formData, setFormData, roomTypes }: GuestEditFormProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Section 01: Identity */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: 'rgba(120, 128, 105, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>01</span>
                    <h3 className={styles.headerTitle} style={{ fontSize: '11px', margin: 0 }}>Identity & Stay</h3>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--f-hairline)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <NexuraInputLabel label="Guest Name" value={formData.guestName} onChange={(v: string) => setFormData({...formData, guestName: v})} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <NexuraInputLabel label="Check-in" type="date" value={formData.checkIn} onChange={(v: string) => setFormData({...formData, checkIn: v})} />
                        <NexuraInputLabel label="Check-out" type="date" value={formData.checkOut} onChange={(v: string) => setFormData({...formData, checkOut: v})} />
                    </div>
                </div>
            </section>

            {/* Section 02: Assignment */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: 'rgba(120, 128, 105, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>02</span>
                    <h3 className={styles.headerTitle} style={{ fontSize: '11px', margin: 0 }}>Stay Details</h3>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--f-hairline)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>Room Category</label>
                        <select
                            value={formData.roomTypeId}
                            onChange={e => {
                                const selectedId = e.target.value;
                                const selectedRoom = roomTypes.find(r => r.id === selectedId);
                                setFormData({
                                    ...formData, 
                                    roomTypeId: selectedId,
                                    roomType: selectedRoom ? selectedRoom.name : formData.roomType
                                });
                            }}
                            style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--f-hairline)',
                                backgroundColor: 'var(--f-surface)',
                                fontSize: '11px',
                                color: 'var(--f-body)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value=""></option>
                            {roomTypes.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <NexuraInputLabel label="Room Number" value={formData.roomNumber} onChange={(v: string) => setFormData({...formData, roomNumber: v})} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>Channel Source</label>
                        <select
                            value={formData.channel}
                            onChange={e => setFormData({...formData, channel: e.target.value})}
                            style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--f-hairline)',
                                backgroundColor: 'var(--f-surface)',
                                fontSize: '11px',
                                color: 'var(--f-body)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {CHANNELS.map(c => <option key={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <NexuraInputLabel label="Staff In-Charge" value={formData.staffName} onChange={(v: string) => setFormData({...formData, staffName: v})} />
                </div>
            </section>

            {/* Section 03: Financials */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: 'rgba(120, 128, 105, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>03</span>
                    <h3 className={styles.headerTitle} style={{ fontSize: '11px', margin: 0 }}>Financials</h3>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--f-hairline)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <NexuraInputLabel label="Total Gross Amount" type="number" value={formData.totalAmount} onChange={(v: string) => setFormData({...formData, totalAmount: Number(v)})} />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <NexuraInputLabel label="Pay at Hotel (Cash/Transfer to Hotel)" type="number" value={formData.payHotel} onChange={(v: string) => setFormData({...formData, payHotel: Number(v)})} />
                        <NexuraInputLabel label="Virtual Payment / OTA" type="number" value={formData.payTransfer} onChange={(v: string) => setFormData({...formData, payTransfer: Number(v)})} />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>Payment Status</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {["Lunas", "Belum Bayar", "DP / Partial", "CANCELLED"].map(s => (
                                <button 
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({...formData, paymentStatus: s, status: s})}
                                    style={{
                                        height: '36px',
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        border: '1px solid var(--f-hairline)',
                                        backgroundColor: formData.paymentStatus === s ? 'var(--f-sage)' : 'var(--f-canvas)',
                                        color: formData.paymentStatus === s ? '#ffffff' : 'var(--f-muted)',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 04: Remarks */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: 'rgba(120, 128, 105, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>04</span>
                    <h3 className={styles.headerTitle} style={{ fontSize: '11px', margin: 0 }}>Remarks</h3>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--f-hairline)' }} />
                </div>
                <textarea
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                    rows={3}
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--f-surface)',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '11px',
                        color: 'var(--f-body)',
                        outline: 'none',
                        border: '1px solid var(--f-hairline)',
                        resize: 'none',
                        transition: 'all 0.15s'
                    }}
                    placeholder="Enter internal audit notes..."
                />
            </section>
        </div>
    );
}

function NexuraInputLabel({ label, value, onChange, type = "text" }: { label: string, value: any, onChange: any, type?: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>{label}</span>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)}
                onWheel={(e) => e.currentTarget.type === "number" && e.currentTarget.blur()}
                style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--f-hairline)',
                    backgroundColor: 'var(--f-surface)',
                    fontSize: '11px',
                    fontFamily: type === 'date' || type === 'number' ? 'var(--f-font-mono)' : 'inherit',
                    color: 'var(--f-body)',
                    outline: 'none',
                    transition: 'all 0.15s'
                }}
            />
        </div>
    );
}
