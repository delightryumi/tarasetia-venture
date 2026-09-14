"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
    Trash2,
    Save,
    User,
    X,
    Printer
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

const cleanUndefined = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === undefined) {
            delete cleaned[key];
        } else if (cleaned[key] && typeof cleaned[key] === "object" && !cleaned[key].toDate) {
            cleaned[key] = cleanUndefined(cleaned[key]);
        }
    });
    return cleaned;
};

export function GuestDetailModal({ guest, isEditing: initialEditing, onClose, onSave }: GuestDetailModalProps) {
    const router = useRouter();
    const { user, activeHotelCode } = useAuth();
    const [isEditMode, setIsEditMode] = React.useState(initialEditing);
    const [showConfirmVoid, setShowConfirmVoid] = React.useState(false);
    const [showConfirmCancel, setShowConfirmCancel] = React.useState(false);
    const [formData, setFormData] = React.useState({
        guestName: '',
        totalAmount: 0,
        paidCash: 0,
        paidEdc: 0,
        paidQris: 0,
        paidTransfer: 0,
        paidOta: 0,
        payHotel: 0,
        payTransfer: 0,
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
            const checkIn = guest.checkInDate || guest.checkIn || '';
            const checkOut = guest.checkOutDate || guest.checkOut || '';
            const isAcc = guest.type === 'accommodation' || !guest.type;
            const dates = getDatesBetween(checkIn, checkOut, isAcc);
            const nights = dates.length || 1;
            
            const initTotalAmount = guest.totalAmount || (guest.amount && nights > 1 ? guest.amount * nights : (guest.amount || 0));
            const hasGranular = (guest.paidCash !== undefined || guest.paidEdc !== undefined || guest.paidQris !== undefined || guest.paidTransfer !== undefined || guest.paidOta !== undefined);
            
            const initPaidCash = guest.paidCash !== undefined ? Number(guest.paidCash) : (!hasGranular ? Number(guest.payHotel || 0) : 0);
            const initPaidEdc = Number(guest.paidEdc || 0);
            const initPaidQris = Number(guest.paidQris || 0);
            const initPaidTransfer = Number(guest.paidTransfer || 0);
            const initPaidOta = guest.paidOta !== undefined ? Number(guest.paidOta) : (!hasGranular ? Number(guest.payTransfer || guest.payNexura || 0) : 0);

            const initPayHotel = initPaidCash + initPaidEdc + initPaidQris + initPaidTransfer;
            const initPayTransfer = initPaidOta + initPaidTransfer;

            setFormData({
                ...guest,
                totalAmount: initTotalAmount,
                paidCash: initPaidCash,
                paidEdc: initPaidEdc,
                paidQris: initPaidQris,
                paidTransfer: initPaidTransfer,
                paidOta: initPaidOta,
                payHotel: initPayHotel,
                payTransfer: initPayTransfer,
                checkIn,
                checkOut,
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

    const isBookingMatch = (e: any, target: any, newTarget?: any) => {
        if (!e) return false;
        
        const targetBookingId = (target?.bookingId || newTarget?.bookingId || "").trim();
        const targetTimestamp = target?.timestamp ? String(target.timestamp).trim() : (newTarget?.timestamp ? String(newTarget.timestamp).trim() : "");
        const targetId = target?.id ? String(target.id).trim() : (newTarget?.id ? String(newTarget.id).trim() : "");
        
        const targetGuestName = (target?.guestName || "").trim().toLowerCase();
        const newGuestName = (newTarget?.guestName || "").trim().toLowerCase();
        
        const eBookingId = (e.bookingId || "").trim();
        const eTimestamp = e.timestamp ? String(e.timestamp).trim() : "";
        const eId = e.id ? String(e.id).trim() : "";
        const eGuestName = (e.guestName || "").trim().toLowerCase();

        // 1. Direct ID / Key matches
        if (targetBookingId !== "" && eBookingId !== "" && targetBookingId === eBookingId) return true;
        if (targetTimestamp !== "" && eTimestamp !== "" && targetTimestamp === eTimestamp) return true;
        if (targetId !== "" && eId !== "" && targetId === eId) return true;

        // 2. Name match (exact or matching clean name)
        if (targetGuestName !== "" && eGuestName !== "") {
            if (eGuestName === targetGuestName) return true;
        }
        if (newGuestName !== "" && eGuestName !== "") {
            if (eGuestName === newGuestName) return true;
        }

        // 3. Linked pelunasan / reversal check
        if (e.isPelunasan || e.type === "pelunasan_ar" || e.type === "pelunasan_reversal" || eGuestName.startsWith("koreksi tanggal pelunasan") || eGuestName.startsWith("pelunasan piutang")) {
            const cleanEGuestName = eGuestName
                .replace(/^koreksi tanggal pelunasan\s*-\s*/i, "")
                .replace(/^pelunasan piutang\s*-\s*/i, "")
                .trim();
            if (
                (targetTimestamp && (String(e.refTimestamp) === targetTimestamp || eTimestamp === targetTimestamp)) ||
                (targetBookingId && (e.refBookingId === targetBookingId || eBookingId === targetBookingId)) ||
                (targetGuestName && cleanEGuestName === targetGuestName) ||
                (newGuestName && cleanEGuestName === newGuestName)
            ) {
                return true;
            }
        }

        return false;
    };

    const getCascadeDates = (b: any) => {
        const dates = new Set<string>();
        const todayStr = new Date().toISOString().split('T')[0];
        dates.add(todayStr);

        const addDateRange = (cIn?: string, cOut?: string) => {
            if (cIn && typeof cIn === 'string' && cIn.includes('-')) {
                dates.add(cIn);
                if (cOut && typeof cOut === 'string' && cOut.includes('-') && cOut > cIn) {
                    let curr = new Date(cIn);
                    const end = new Date(cOut);
                    while (curr <= end) {
                        dates.add(curr.toISOString().split('T')[0]);
                        curr.setDate(curr.getDate() + 1);
                    }
                }
            }
        };

        addDateRange(b.checkInDate || b.checkIn, b.checkOutDate || b.checkOut);
        addDateRange(b.oldCheckIn, b.oldCheckOut);
        if (b.effectiveDate) dates.add(b.effectiveDate);
        if (b._docDate) dates.add(b._docDate);

        if (b.timestamp) {
            try {
                const tStr = typeof b.timestamp === 'string' && b.timestamp.includes('T')
                    ? b.timestamp.split('T')[0]
                    : new Date(b.timestamp).toISOString().split('T')[0];
                if (tStr && tStr.length === 10) dates.add(tStr);
            } catch {}
        }
        if (b.createdAt) {
            try {
                const cStr = typeof b.createdAt === 'string' && b.createdAt.includes('T')
                    ? b.createdAt.split('T')[0]
                    : new Date(b.createdAt).toISOString().split('T')[0];
                if (cStr && cStr.length === 10) dates.add(cStr);
            } catch {}
        }

        return Array.from(dates).filter(Boolean).sort();
    };

    const handleSave = async () => {
        try {
            const hotelId = activeHotelCode || localStorage.getItem("active_hotel_code") || "";
            if (!hotelId) {
                toast.error("Hotel Code is missing.");
                return;
            }
            const newSource = formData.channel === "Walk-in" ? "Walk-in" : "OTA";

            if (formData.type === "accommodation") {
                if (!formData.guestName) { toast.error("Guest Name is required"); return; }
                if (!formData.checkIn || !formData.checkOut) { toast.error("Dates are required"); return; }
                if (formData.checkOut <= formData.checkIn) { toast.error("Check-out Date must be after Check-in Date"); return; }
                if (!formData.roomTypeId) { toast.error("Room Category is required"); return; }
            }

            // 1. Cleanly delete all old nightly entries and linked entries across all possible cascade dates
            const sweepDates = getCascadeDates({
                ...guest,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                oldCheckIn: guest.checkInDate || guest.checkIn,
                oldCheckOut: guest.checkOutDate || guest.checkOut
            });
            
            for (const d of sweepDates) {
                const oldRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const oldSnap = await getDoc(oldRef);
                if (oldSnap.exists()) {
                    const oldEntries = oldSnap.data().entries || [];
                    const filtered = oldEntries.filter((e: any) => !isBookingMatch(e, guest, formData));
                    await updateDoc(oldRef, { entries: filtered });
                }
            }

            // 2. Prepare new entries
            const newDates = getDatesBetween(formData.checkIn, formData.checkOut, formData.type === "accommodation");
            const nights = newDates.length || 1;
            
            const totalAmount = Number(formData.totalAmount) || 0;
            const paidCash = Number(formData.paidCash || 0);
            const paidEdc = Number(formData.paidEdc || 0);
            const paidQris = Number(formData.paidQris || 0);
            const paidTransfer = Number(formData.paidTransfer || 0);
            const paidOta = Number(formData.paidOta || 0);
            
            const finalPayHotel = paidCash + paidEdc + paidQris + paidTransfer;
            const finalPayTransfer = paidOta + paidTransfer;

            let remCash = paidCash;
            let remEdc = paidEdc;
            let remQris = paidQris;
            let remTransfer = paidTransfer;
            let remOta = paidOta;

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
                
                let dailyCash = 0;
                let dailyEdc = 0;
                let dailyQris = 0;
                let dailyTransfer = 0;
                let dailyOta = 0;
                
                if (i === nights - 1) {
                    dailyCash = remCash;
                    dailyEdc = remEdc;
                    dailyQris = remQris;
                    dailyTransfer = remTransfer;
                    dailyOta = remOta;
                } else {
                    dailyCash = Math.round(paidCash / nights);
                    dailyEdc = Math.round(paidEdc / nights);
                    dailyQris = Math.round(paidQris / nights);
                    dailyTransfer = Math.round(paidTransfer / nights);
                    dailyOta = Math.round(paidOta / nights);

                    remCash -= dailyCash;
                    remEdc -= dailyEdc;
                    remQris -= dailyQris;
                    remTransfer -= dailyTransfer;
                    remOta -= dailyOta;
                }

                const dPayHotel = dailyCash + dailyEdc + dailyQris + dailyTransfer;
                const dPayTransfer = dailyOta + dailyTransfer;

                let pm = "Cash";
                if (dailyOta > 0 && dPayHotel === 0) pm = "OTA Virtual / City Ledger";
                else if (dailyEdc > 0 && dailyCash === 0 && dailyQris === 0 && dailyTransfer === 0) pm = "EDC BCA / Mandiri";
                else if (dailyQris > 0 && dailyCash === 0 && dailyEdc === 0 && dailyTransfer === 0) pm = "QRIS Payment";
                else if (dailyTransfer > 0 && dailyCash === 0 && dailyEdc === 0 && dailyQris === 0) pm = "Bank Transfer";
                else if ([dailyCash > 0, dailyEdc > 0, dailyQris > 0, dailyTransfer > 0, dailyOta > 0].filter(Boolean).length > 1) pm = "Split Payment";
                
                newEntries.push({
                    ...guest,
                    ...formData,
                    type: formData.type || "accommodation",
                    guestName: formData.guestName,
                    checkInDate: formData.checkIn,
                    checkOutDate: formData.checkOut,
                    effectiveDate: dateStr,
                    amount: nightlyRate,
                    totalAmount: totalAmount,
                    nights: nights,
                    paidCash: dailyCash,
                    paidEdc: dailyEdc,
                    paidQris: dailyQris,
                    paidTransfer: dailyTransfer,
                    paidOta: dailyOta,
                    payHotel: dPayHotel,
                    payTransfer: dPayTransfer,
                    paidAmount1: dPayHotel,
                    paidAmount2: dPayTransfer,
                    initialPayHotel: guest.initialPayHotel !== undefined ? Number(guest.initialPayHotel) : dPayHotel,
                    initialPayTransfer: guest.initialPayTransfer !== undefined ? Number(guest.initialPayTransfer) : dPayTransfer,
                    paymentMethod: pm,
                    paymentStatus: isNowCancelled ? "CANCELLED" : formData.paymentStatus,
                    status: isNowCancelled ? "CANCELLED" : formData.status,
                    cancelledAt: cancelledAtVal,
                    cancelledBy: cancelledByVal,
                    source: newSource,
                    timestamp: guest.timestamp || new Date().toISOString()
                });
            }

            // 3. Write new entries (with explicit purge of any remaining match)
            for (const entry of newEntries) {
                const dateStr = entry.effectiveDate || entry.checkInDate;
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${dateStr}`);
                const docSnap = await getDoc(docRef);
                const cleanedEntry = cleanUndefined(entry);
                if (docSnap.exists()) {
                    const currentEntries = docSnap.data().entries || [];
                    const purged = currentEntries.filter((e: any) => !isBookingMatch(e, guest, formData));
                    await updateDoc(docRef, { entries: [...purged, cleanedEntry], date: dateStr });
                } else {
                    await setDoc(docRef, { entries: [cleanedEntry], date: dateStr });
                }
            }

            // 4. Generate Pelunasan & Reversal entries ONLY for Walk-in AR adjustments
            if (newSource === "Walk-in") {
                const oldPayHotel = Number(guest.payHotel || guest.paidCash || 0);
                const oldPayTransfer = Number(guest.payTransfer || guest.paidTransfer || 0);
                const diffPayHotel = finalPayHotel - oldPayHotel;
                const diffPayTransfer = finalPayTransfer - oldPayTransfer;

                if (diffPayHotel > 0 || diffPayTransfer > 0) {
                    const pelunasanEntries = [];
                    // Reversal entry (backdated to checkIn date to reduce that day's cash flow)
                    pelunasanEntries.push({
                        id: `rev_${Date.now()}_1`,
                        type: "pelunasan_reversal",
                        guestName: `Koreksi Tanggal Pelunasan - ${formData.guestName}`,
                        amount: 0,
                        payHotel: -diffPayHotel,
                        payTransfer: -diffPayTransfer,
                        paidCash: -diffPayHotel,
                        paidTransfer: -diffPayTransfer,
                        effectiveDate: formData.checkIn,
                        timestamp: new Date().toISOString(),
                        refBookingId: guest.bookingId || guest.id || "",
                        refTimestamp: guest.timestamp || guest.createdAt || "",
                        isPelunasan: true,
                        isHidden: true
                    });

                    // Actual Pelunasan entry (on today's date)
                    pelunasanEntries.push({
                        id: `pel_${Date.now()}_2`,
                        type: "pelunasan_ar",
                        guestName: `Pelunasan Piutang - ${formData.guestName}`,
                        amount: 0,
                        payHotel: diffPayHotel,
                        payTransfer: diffPayTransfer,
                        paidCash: diffPayHotel,
                        paidTransfer: diffPayTransfer,
                        effectiveDate: todayStr,
                        timestamp: new Date().toISOString(),
                        refBookingId: guest.bookingId || guest.id || "",
                        refTimestamp: guest.timestamp || guest.createdAt || "",
                        isPelunasan: true,
                        isHidden: true
                    });

                    for (const entry of pelunasanEntries) {
                        const dateStr = entry.effectiveDate;
                        const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${dateStr}`);
                        const docSnap = await getDoc(docRef);
                        const cleanedEntry = cleanUndefined(entry);
                        if (docSnap.exists()) {
                            const entries = docSnap.data().entries || [];
                            const purged = entries.filter((e: any) => !isBookingMatch(e, guest, formData));
                            await updateDoc(docRef, { entries: [...purged, cleanedEntry], date: dateStr });
                        } else {
                            await setDoc(docRef, { entries: [cleanedEntry], date: dateStr }, { merge: true });
                        }
                    }
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
            const hotelId = activeHotelCode || localStorage.getItem("active_hotel_code") || "";
            if (!hotelId) {
                toast.error("Hotel Code is missing.");
                return;
            }
            const dates = getCascadeDates(guest);

            for (const d of dates) {
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const mapped = entries.map((e: any) => {
                        if (isBookingMatch(e, guest)) {
                            return cleanUndefined({ ...e, status: "VOID", paymentStatus: "VOID" });
                        }
                        return cleanUndefined(e);
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
            const hotelId = activeHotelCode || localStorage.getItem("active_hotel_code") || "";
            if (!hotelId) {
                toast.error("Hotel Code is missing.");
                return;
            }
            const dates = getCascadeDates(guest);
            const todayStr = new Date().toISOString().split('T')[0];
            const cancelledByVal = user ? `${user.displayName} (${user.role || 'user'})` : "System";

            for (const d of dates) {
                const docRef = doc(getHotelCollection(db, "daily_revenue"), `${hotelId}_${d}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const mapped = entries.map((e: any) => {
                        if (isBookingMatch(e, guest)) {
                            return cleanUndefined({ 
                                ...e, 
                                status: "CANCELLED", 
                                paymentStatus: "CANCELLED",
                                cancelledAt: todayStr,
                                cancelledBy: cancelledByVal
                            });
                        }
                        return cleanUndefined(e);
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
                            guest={guest}
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
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={onClose} className={styles.btnSecondary} style={{ height: '36px', padding: '0 16px', fontSize: '10px', borderRadius: '8px' }}>Close</button>
                                <button 
                                    onClick={() => {
                                        const bParam = guest.bookingId ? `&bookingId=${encodeURIComponent(guest.bookingId)}` : '';
                                        const gParam = guest.guestName ? `&guestName=${encodeURIComponent(guest.guestName)}` : '';
                                        router.push(`/digital-checkin?autoOpen=true${gParam}${bParam}`);
                                    }} 
                                    className={styles.btnSecondary} 
                                    style={{ height: '36px', padding: '0 14px', fontSize: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                                    title="Buka form Guest Registration Card"
                                >
                                    <Printer size={13} /> Cetak GRC
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setIsEditMode(true)} className={styles.btnSecondary} style={{ height: '36px', padding: '0 16px', fontSize: '10px', borderRadius: '8px', fontWeight: 700 }}>Modify</button>
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
