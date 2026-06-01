"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
    Trash2,
    Save,
    User,
    X
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { getChannelLogo } from "./StatCard";
import styles from "./OverviewStyles.module.css";
import "./FolioAesthetic.css";

interface GuestDetailModalProps {
    guest: any;
    isEditing: boolean;
    onClose: () => void;
    onSave?: () => void;
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
    { name: "Nexura Sales", logo: "/channels/nexura.png" },
    { name: "Walk-in", logo: "/channels/walk_in.png" },
    { name: "Booking Engine", logo: "/channels/nexura.png" },
];

export function GuestDetailModal({ guest, isEditing: initialEditing, onClose, onSave }: GuestDetailModalProps) {
    const [isEditMode, setIsEditMode] = React.useState(initialEditing);
    const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
    const [formData, setFormData] = React.useState({
        guestName: '',
        totalAmount: 0,
        paidAmount1: 0,
        paidAmount2: 0,
        isSplitBill: false,
        checkIn: '',
        checkOut: '',
        roomTypeId: '',
        roomNumber: '',
        channel: 'Walk-in',
        staffName: '',
        note: '',
        type: 'accommodation',
        paymentStatus: 'Pending',
        status: 'Pending',
        bookingId: '',
        timestamp: 0,
        roomType: '',
        _docId: '',
    });

    const [roomTypes, setRoomTypes] = React.useState<any[]>([]);

    // Sync edit mode when edit/view is toggled externally
    React.useEffect(() => {
        setIsEditMode(initialEditing);
    }, [initialEditing, guest]);

    // Populate and sync form data when selected guest changes
    React.useEffect(() => {
        if (guest) {
            setFormData({
                ...guest,
                totalAmount: guest.totalAmount || guest.amount || 0,
                paidAmount1: guest.paidAmount1 || guest.amount || 0,
                paidAmount2: guest.paidAmount2 || 0,
                isSplitBill: guest.isSplitBill || false,
                checkIn: guest.checkInDate || guest.checkIn || '',
                checkOut: guest.checkOutDate || guest.checkOut || '',
                roomTypeId: guest.roomTypeId || '',
                roomNumber: guest.roomNumber || '',
                channel: guest.channel || 'Walk-in',
                staffName: guest.staffName || '',
                note: guest.note || '',
                type: guest.type || 'accommodation',
                paymentStatus: guest.paymentStatus || 'Pending',
                status: guest.status || 'Pending',
                bookingId: guest.bookingId || '',
                timestamp: guest.timestamp || 0,
                roomType: guest.roomType || '',
                _docId: guest._docId || '',
            });
        }
    }, [guest]);

    React.useEffect(() => {
        const fetchRoomTypes = async () => {
            const querySnapshot = await getDocs(collection(db, "roomTypes"));
            const fetchedTypes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoomTypes(fetchedTypes);
            
            if (guest && !formData.roomTypeId && guest.roomType) {
                const matched = fetchedTypes.find((r: any) => r.name?.toLowerCase() === guest.roomType.toLowerCase());
                if (matched) {
                    setFormData(prev => ({ ...prev, roomTypeId: matched.id }));
                }
            }
        };
        fetchRoomTypes();
    }, [guest?.roomType]);

    const handleSave = async () => {
        try {
            const hotelId = "bumi-anyom-resort";
            const oldDate = guest.checkInDate || guest.checkIn || new Date(guest.timestamp).toISOString().split('T')[0];
            const newDate = formData.checkIn;
            const oldDocId = guest._docId || `${hotelId}_${oldDate}`;
            const newDocId = `${hotelId}_${newDate}`;
            const newSource = (formData.channel === "Walk-in" || formData.channel === "Nexura Sales" || formData.channel === "Booking Engine") ? "Walk-in" : "OTA";

            const updatedEntry = {
                ...guest,
                ...formData,
                source: newSource,
                checkInDate: newDate,
                checkOutDate: formData.checkOut,
                amount: formData.isSplitBill ? (Number(formData.paidAmount1) + Number(formData.paidAmount2)) : Number(formData.paidAmount1),
            };

            if (oldDocId !== newDocId) {
                const oldRef = doc(db, "daily_revenue", oldDocId);
                const oldSnap = await getDoc(oldRef);
                if (oldSnap.exists()) {
                    const oldEntries = oldSnap.data().entries || [];
                    const filtered = oldEntries.filter((e: any) => e.timestamp !== guest.timestamp);
                    await updateDoc(oldRef, { entries: filtered });
                }
                const newRef = doc(db, "daily_revenue", newDocId);
                const newSnap = await getDoc(newRef);
                if (newSnap.exists()) {
                    const newEntries = newSnap.data().entries || [];
                    await updateDoc(newRef, { entries: [...newEntries, updatedEntry], date: newDate });
                } else {
                    await setDoc(newRef, { entries: [updatedEntry], date: newDate });
                }
            } else {
                const docRef = doc(db, "daily_revenue", oldDocId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const updatedEntries = entries.map((e: any) => e.timestamp === guest.timestamp ? updatedEntry : e);
                    await updateDoc(docRef, { entries: updatedEntries, date: oldDate });
                }
            }
            toast.success("Transaction updated successfully");
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update transaction");
        }
    };

    const executeDelete = async () => {
        try {
            const docRef = doc(db, "daily_revenue", guest._docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const entries = docSnap.data().entries || [];
                const filtered = entries.filter((e: any) => e.timestamp !== guest.timestamp);
                await updateDoc(docRef, { entries: filtered });
                toast.success("Transaction archived successfully");
                if (onSave) onSave();
                onClose();
            }
        } catch (error) {
            console.error("Action Failed", error);
            toast.error("Failed to archive transaction");
        } finally {
            setShowConfirmDelete(false);
        }
    };

    const getChannelIcon = (name: string) => {
        const ch = CHANNELS.find(c => c.name === name);
        return ch ? ch.logo : "/channels/walk_in.png";
    };

    if (!guest) return null;

    return (
        <motion.aside 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={styles.rightDrawer}
        >
            <div className={styles.card} style={{ height: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column', padding: 0, border: 'none', borderRadius: 0, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--f-hairline)', padding: '16px', backgroundColor: 'var(--f-surface-soft)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <div style={{ width: '6px', height: '1px', backgroundColor: 'var(--f-sage)' }} />
                            <span className={styles.guestSubtext} style={{ fontSize: '8px', fontWeight: 700, color: 'var(--f-sage)', letterSpacing: '0.2em' }}>
                                {isEditMode ? "Adjustment Mode" : "Digital Folio"}
                            </span>
                        </div>
                        <h2 className={styles.headerTitle} style={{ fontSize: '13px', margin: 0 }}>
                            {isEditMode ? "Modify" : "Review"} <span style={{ color: 'var(--f-sage)' }}>{guest.type === 'accommodation' ? 'Entry' : 'Income'}</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className={styles.btnIcon} style={{ width: '32px', height: '32px', borderRadius: '6px' }} title="Close">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="custom-scrollbar">
                    {isEditMode ? (
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
                                    <NexuraInputLabel label="Total Gross Amount" type="number" value={formData.totalAmount} onChange={(v: string) => setFormData({...formData, totalAmount: v})} />
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--f-surface-soft)', borderRadius: '8px', border: '1px solid var(--f-hairline)' }}>
                                        <div>
                                            <p className={styles.guestName} style={{ margin: 0, fontSize: '11px' }}>Split Settlement</p>
                                            <p className={styles.guestSubtext} style={{ margin: '2px 0 0 0', color: 'var(--f-light-muted)', fontSize: '8px' }}>Enable dual payment methods</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, isSplitBill: !formData.isSplitBill})} 
                                            style={{ 
                                                width: '36px', 
                                                height: '18px', 
                                                position: 'relative', 
                                                borderRadius: '999px', 
                                                border: 'none', 
                                                cursor: 'pointer',
                                                backgroundColor: formData.isSplitBill ? 'var(--f-sage)' : 'var(--f-light-muted)',
                                                transition: 'all 0.2s' 
                                            }}
                                        >
                                            <div 
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: '1px', 
                                                    width: '16px', 
                                                    height: '16px', 
                                                    backgroundColor: '#ffffff', 
                                                    borderRadius: '50%', 
                                                    left: formData.isSplitBill ? '19px' : '1px', 
                                                    transition: 'all 0.2s' 
                                                }} 
                                            />
                                        </button>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: formData.isSplitBill ? '1fr 1fr' : '1fr', gap: '12px' }}>
                                        <NexuraInputLabel label={formData.isSplitBill ? "Payment A" : "Amount Paid"} type="number" value={formData.paidAmount1} onChange={(v: string) => setFormData({...formData, paidAmount1: v})} />
                                        {formData.isSplitBill && (
                                            <NexuraInputLabel label="Payment B" type="number" value={formData.paidAmount2} onChange={(v: string) => setFormData({...formData, paidAmount2: v})} />
                                        )}
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
                    ) : (
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
                                        <img src={getChannelIcon(guest.channel)} alt={guest.channel} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', opacity: 0.6 }} onError={(e) => { e.currentTarget.style.display = 'none'; e.stopPropagation(); }} />
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
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '16px', borderTop: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-canvas)' }}>
                    {isEditMode ? (
                        <>
                            <button onClick={() => setIsEditMode(false)} className={styles.btnSecondary} style={{ height: '36px', padding: '0 16px', fontSize: '10px', borderRadius: '8px' }}>Abort</button>
                            <button onClick={handleSave} className={styles.btnPrimary} style={{ width: 'auto', padding: '0 20px', height: '36px', borderRadius: '8px' }}>
                                <Save size={14} /> Save Folio
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <button onClick={onClose} className={styles.btnSecondary} style={{ height: '36px', padding: '0 16px', fontSize: '10px', borderRadius: '8px' }}>Close</button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setIsEditMode(true)} className={styles.btnIcon} style={{ height: '36px', padding: '0 16px', width: 'auto', fontSize: '10px', borderRadius: '8px', fontWeight: 700 }}>Modify</button>
                                <button onClick={() => setShowConfirmDelete(true)} className="flex items-center justify-center gap-2 h-9 px-4 text-[10px] font-medium uppercase tracking-[0.1em] transition-all text-white bg-red-500 hover:bg-red-600 active:scale-95 rounded-lg border-none cursor-pointer">
                                    <Trash2 size={14} /> Archive Entry
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showConfirmDelete && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[400] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(false); }}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl border border-stone-100"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-stone-900 font-outfit uppercase tracking-tight mb-2">Confirm Archival</h3>
                            <p className="text-[11px] text-stone-500 uppercase tracking-widest leading-relaxed mb-8">
                                Are you sure you want to permanently delete the transaction for <span className="font-bold text-stone-900">{guest.guestName || guest.incomeCategory}</span>?
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowConfirmDelete(false)} className="flex-1 h-12 rounded-xl border border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-widest hover:bg-stone-50 transition-colors cursor-pointer bg-white">Cancel</button>
                                <button onClick={executeDelete} className="flex-1 h-12 rounded-xl bg-red-500 text-[11px] font-bold text-white uppercase tracking-widest hover:bg-red-600 transition-colors cursor-pointer border-none">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.aside>
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
