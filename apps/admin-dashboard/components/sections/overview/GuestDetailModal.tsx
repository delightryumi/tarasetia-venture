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
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { VoidConfirmModal } from "./VoidConfirmModal";
import { CancelConfirmModal } from "./CancelConfirmModal";
import { GuestEditForm } from "./components/GuestEditForm";
import { GuestFolioView } from "./components/GuestFolioView";
import styles from "./OverviewStyles.module.css";
import "./FolioAesthetic.css";

interface GuestDetailModalProps {
    guest: any;
    isEditing: boolean;
    onClose: () => void;
    onSave?: () => void;
}



export function GuestDetailModal({ guest, isEditing: initialEditing, onClose, onSave }: GuestDetailModalProps) {
    const { user } = useAuth();
    const [isEditMode, setIsEditMode] = React.useState(initialEditing);
    const [showConfirmVoid, setShowConfirmVoid] = React.useState(false);
    const [showConfirmCancel, setShowConfirmCancel] = React.useState(false);
    const [formData, setFormData] = React.useState({
        guestName: '',
        totalAmount: 0,
        payHotel: 0,
        payNexura: 0,
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
                payHotel: guest.payHotel ?? guest.paidCash ?? guest.amount ?? 0,
                payNexura: guest.payNexura ?? guest.paidTransfer ?? 0,
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
            const querySnapshot = await getDocs(getHotelCollection(db, "roomTypes"));
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

    const getDatesBetween = (checkInStr: string, checkOutStr: string, isAccommodation: boolean) => {
        if (!checkInStr) return [];
        if (!isAccommodation || !checkOutStr || new Date(checkOutStr) <= new Date(checkInStr)) {
            return [checkInStr];
        }
        const dates = [];
        let curr = new Date(checkInStr);
        const end = new Date(checkOutStr);
        while (curr < end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    };


    const handleSave = async () => {
        try {
            const hotelId = localStorage.getItem("active_hotel_code") || "87241";
            const newSource = formData.channel === "Walk-in" ? "Walk-in" : "OTA";

            if (formData.type === "accommodation") {
                if (!formData.guestName) { toast.error("Guest Name is required"); return; }
                if (!formData.checkIn || !formData.checkOut) { toast.error("Dates are required"); return; }
                if (formData.checkOut <= formData.checkIn) { toast.error("Check-out Date must be after Check-in Date"); return; }
                if (!formData.roomTypeId) { toast.error("Room Category is required"); return; }
            }

            // 1. Delete all old nightly entries
            const oldCheckIn = guest.checkInDate || guest.checkIn;
            const oldCheckOut = guest.checkOutDate || guest.checkOut;
            const oldIsAcc = guest.type === "accommodation";
            const oldDates = getDatesBetween(oldCheckIn, oldCheckOut, oldIsAcc);
            
            for (const d of oldDates) {
                const oldRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const oldSnap = await getDoc(oldRef);
                if (oldSnap.exists()) {
                    const oldEntries = oldSnap.data().entries || [];
                    const filtered = oldEntries.filter((e: any) => {
                        const isMatch = e.timestamp === guest.timestamp || 
                            (guest.type === 'accommodation' && 
                             e.guestName === guest.guestName && 
                             e.checkInDate === guest.checkInDate && 
                             e.checkOutDate === guest.checkOutDate && 
                             e.roomNumber === guest.roomNumber);
                        return !isMatch;
                    });
                    await updateDoc(oldRef, { entries: filtered });
                }
            }

            // 2. Prepare new entries
            const newDates = getDatesBetween(formData.checkIn, formData.checkOut, formData.type === "accommodation");
            const nights = newDates.length || 1;
            
            const totalAmount = Number(formData.totalAmount) || 0;
            const payHotel = Number(formData.payHotel) || 0;
            const payNexura = Number(formData.payNexura) || 0;
            
            let remainingPayHotel = payHotel;
            let remainingPayNexura = payNexura;

            const isNowCancelled = formData.status === "CANCELLED" || formData.paymentStatus === "CANCELLED" || formData.status === "CANCEL" || formData.paymentStatus === "CANCEL";
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            const cancelledAtVal = isNowCancelled ? (guest.cancelledAt || todayStr) : null;
            const cancelledByVal = isNowCancelled ? (guest.cancelledBy || (user ? `${user.displayName} (${user.role || 'user'})` : "System")) : null;

            const newEntries = [];
            for (let i = 0; i < nights; i++) {
                const dateStr = newDates[i];
                const nightlyRate = Math.round(totalAmount / nights);
                
                let dailyPayHotel = 0;
                let dailyPayNexura = 0;
                
                if (i === nights - 1) {
                    dailyPayHotel = remainingPayHotel;
                    dailyPayNexura = remainingPayNexura;
                } else {
                    dailyPayHotel = Math.round(payHotel / nights);
                    dailyPayNexura = Math.round(payNexura / nights);
                    remainingPayHotel -= dailyPayHotel;
                    remainingPayNexura -= dailyPayNexura;
                }
                
                newEntries.push({
                    ...guest,
                    ...formData,
                    type: formData.type || "accommodation",
                    guestName: formData.guestName,
                    checkInDate: formData.checkIn,
                    checkOutDate: formData.checkOut,
                    effectiveDate: dateStr,
                    amount: nightlyRate,
                    payHotel: dailyPayHotel,
                    payNexura: dailyPayNexura,
                    paidCash: dailyPayHotel,
                    paidAmount1: dailyPayHotel,
                    paidTransfer: dailyPayNexura,
                    paidAmount2: dailyPayNexura,
                    paymentStatus: isNowCancelled ? "CANCELLED" : formData.paymentStatus,
                    status: isNowCancelled ? "CANCELLED" : formData.status,
                    cancelledAt: cancelledAtVal,
                    cancelledBy: cancelledByVal,
                    source: newSource,
                    timestamp: guest.timestamp || new Date().toISOString()
                });
            }

            // 3. Write new entries
            for (const entry of newEntries) {
                const dateStr = entry.effectiveDate || entry.checkInDate;
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${dateStr}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    await updateDoc(docRef, { entries: [...entries, entry], date: dateStr });
                } else {
                    await setDoc(docRef, { entries: [entry], date: dateStr });
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

    const executeVoid = async () => {
        try {
            const hotelId = localStorage.getItem("active_hotel_code") || "87241";
            const checkInDate = guest.checkInDate || guest.checkIn;
            const checkOutDate = guest.checkOutDate || guest.checkOut;
            const isPOS = guest.guestName?.startsWith("POS Order") || !!guest.posItems || !!guest.revenueType;
            const isAcc = !isPOS && (guest.type === "accommodation" || (!guest.type && guest.guestName));
            
            const dates = getDatesBetween(checkInDate, checkOutDate, isAcc);
            for (const d of dates) {
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const mapped = entries.map((e: any) => {
                        const isMatch = e.timestamp === guest.timestamp || 
                            (isAcc && 
                             e.guestName === guest.guestName && 
                             e.checkInDate === guest.checkInDate && 
                             e.checkOutDate === guest.checkOutDate && 
                             e.roomNumber === guest.roomNumber);
                        if (isMatch) {
                            return { ...e, status: "VOID", paymentStatus: "VOID" };
                        }
                        return e;
                    });
                    await updateDoc(docRef, { entries: mapped, date: d });
                }
            }
            toast.success("Transaction voided successfully");
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error("Action Failed", error);
            toast.error("Failed to void transaction");
        } finally {
            setShowConfirmVoid(false);
        }
    };

    const executeCancel = async () => {
        try {
            const hotelId = localStorage.getItem("active_hotel_code") || "87241";
            const checkInDate = guest.checkInDate || guest.checkIn;
            const checkOutDate = guest.checkOutDate || guest.checkOut;
            const isPOS = guest.guestName?.startsWith("POS Order") || !!guest.posItems || !!guest.revenueType;
            const isAcc = !isPOS && (guest.type === "accommodation" || (!guest.type && guest.guestName));
            
            const dates = getDatesBetween(checkInDate, checkOutDate, isAcc);
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            const cancelledByVal = user ? `${user.displayName} (${user.role || 'user'})` : "System";

            for (const d of dates) {
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const mapped = entries.map((e: any) => {
                        const isMatch = e.timestamp === guest.timestamp || 
                            (isAcc && 
                             e.guestName === guest.guestName && 
                             e.checkInDate === guest.checkInDate && 
                             e.checkOutDate === guest.checkOutDate && 
                             e.roomNumber === guest.roomNumber);
                        if (isMatch) {
                            return { 
                                ...e, 
                                status: "CANCELLED", 
                                paymentStatus: "CANCELLED",
                                cancelledAt: todayStr,
                                cancelledBy: cancelledByVal
                            };
                        }
                        return e;
                    });
                    await updateDoc(docRef, { entries: mapped, date: d });
                }
            }
            toast.success("Transaction cancelled successfully");
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error("Action Failed", error);
            toast.error("Failed to cancel transaction");
        } finally {
            setShowConfirmCancel(false);
        }
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
                        <GuestEditForm 
                            formData={formData} 
                            setFormData={setFormData} 
                            roomTypes={roomTypes} 
                        />
                    ) : (
                        <GuestFolioView 
                            guest={guest} 
                        />
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
                                {guest.status !== "CANCELLED" && guest.status !== "CANCEL" && guest.status !== "VOID" && guest.status !== "VOIDED" && (
                                    <button 
                                        onClick={() => setShowConfirmCancel(true)} 
                                        className={styles.btnWarning}
                                        style={{ height: '36px', padding: '0 16px', fontSize: '10px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        Cancel Booking
                                    </button>
                                )}
                                <button 
                                    onClick={() => setShowConfirmVoid(true)} 
                                    className={styles.btnDanger}
                                    style={{ height: '36px', padding: '0 16px', fontSize: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Trash2 size={14} /> Void Entry
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <VoidConfirmModal 
                isOpen={showConfirmVoid}
                itemName={guest.guestName || guest.incomeCategory || "General Sale"}
                onConfirm={executeVoid}
                onCancel={() => setShowConfirmVoid(false)}
            />

            <CancelConfirmModal
                isOpen={showConfirmCancel}
                itemName={guest.guestName || guest.incomeCategory || "General Sale"}
                onConfirm={executeCancel}
                onCancel={() => setShowConfirmCancel(false)}
            />
        </motion.aside>
    );
}
