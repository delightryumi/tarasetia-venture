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
    Printer,
    Lock,
    CreditCard,
    Edit3
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { VoidConfirmModal } from "./VoidConfirmModal";
import { CancelConfirmModal } from "./CancelConfirmModal";
import { GuestEditForm } from "./components/GuestEditForm";
import { GuestFolioView } from "./components/GuestFolioView";
import { PaymentMethodEditModal } from "./PaymentMethodEditModal";
import styles from "./OverviewStyles.module.css";
import footerStyles from "./GuestDetailFooter.module.css";
import "./FolioAesthetic.css";
import { resolveBookingIdentifiers } from "@/lib/channelHelper";

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
    const isSuperadmin = user?.role?.toLowerCase() === "superadmin" || user?.role?.toLowerCase() === "admin";
    const canCancel = isSuperadmin || user?.permissions?.fo_cancel === true;
    const canVoid = isSuperadmin || user?.permissions?.fo_void === true;
    const [isEditMode, setIsEditMode] = React.useState(initialEditing);
    const [showPaymentModal, setShowPaymentModal] = React.useState(false);
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

    // Lock condition: OTA / Channex bookings cannot be edited manually
    const isChannexLocked = React.useMemo(() => {
        if (!guest) return false;
        if (guest.isOTA === true) return true;
        if (guest.channexBookingId || guest.channexId) return true;
        const channel = (guest.channel || guest.source || "").toLowerCase().trim();
        const manualAllowed = [
            "walk-in",
            "walkin",
            "walk in",
            "nexura sales",
            "nexura",
            "direct",
            "manual",
            "internal"
        ];
        if (manualAllowed.includes(channel)) {
            return false;
        }
        const otaKeywords = ["traveloka", "booking.com", "agoda", "tiket", "expedia", "airbnb", "trip", "mg", "channex"];
        if (otaKeywords.some(k => channel.includes(k))) {
            return true;
        }
        if (channel && !manualAllowed.includes(channel)) {
            return true;
        }
        return false;
    }, [guest]);

    // Sync edit mode when edit/view is toggled externally
    React.useEffect(() => {
        if (initialEditing && isChannexLocked) {
            toast.warning("Reservasi OTA / Channel Manager terkunci otomatis. Data tidak dapat dimodifikasi manual.");
            setIsEditMode(false);
        } else {
            setIsEditMode(initialEditing);
        }
    }, [initialEditing, guest, isChannexLocked]);

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
        
        const gIds = resolveBookingIdentifiers(target || newTarget);
        const eIds = resolveBookingIdentifiers(e);

        // 1. Direct bookingId match or -BFT
        if (gIds.bookingId && eIds.bookingId && gIds.bookingId !== "N/A" && eIds.bookingId !== "N/A") {
            if (
                gIds.bookingId === eIds.bookingId ||
                `${gIds.bookingId}-BFT` === eIds.bookingId ||
                `${eIds.bookingId}-BFT` === gIds.bookingId
            ) {
                return true;
            }
        }

        // 2. OTA reservationId
        if (gIds.reservationId && eIds.reservationId && gIds.reservationId !== "N/A" && eIds.reservationId !== "N/A") {
            if (gIds.reservationId === eIds.reservationId) return true;
        }

        // 3. raw otaReservationId or voucherCode
        const gVoucher = String(target?.voucherCode || newTarget?.voucherCode || gIds.otaReservationId || "").trim();
        const eVoucher = String(e?.voucherCode || eIds.otaReservationId || "").trim();
        if (gVoucher && eVoucher && gVoucher !== "N/A" && eVoucher !== "N/A" && gVoucher === eVoucher) {
            return true;
        }

        // 4. Channex Booking ID
        const gChannex = String(target?.channexBookingId || target?.channexId || newTarget?.channexBookingId || "").trim();
        const eChannex = String(e?.channexBookingId || e?.channexId || "").trim();
        if (gChannex && eChannex && gChannex === eChannex) {
            return true;
        }

        // 5. Document ID or internal ID
        const targetId = (target?.id || newTarget?.id || "").trim();
        const eId = (e.id || "").trim();
        if (targetId && eId && targetId === eId) return true;

        // 6. Exact timestamp
        const targetTimestamp = target?.timestamp ? String(target.timestamp).trim() : (newTarget?.timestamp ? String(newTarget.timestamp).trim() : "");
        const eTimestamp = e.timestamp ? String(e.timestamp).trim() : "";
        if (targetTimestamp && eTimestamp && targetTimestamp === eTimestamp) return true;

        // 7. Name + Room or Checkin
        const targetGuestName = (target?.guestName || "").trim().toLowerCase();
        const newGuestName = (newTarget?.guestName || "").trim().toLowerCase();
        const eGuestName = (e.guestName || "").trim().toLowerCase();

        if ((targetGuestName || newGuestName) && eGuestName) {
            const cleanGName = (targetGuestName || newGuestName).replace(/^(mr|mrs|ms|dr|prof)\.?\s+/i, "").trim();
            const cleanEName = eGuestName.replace(/^(mr|mrs|ms|dr|prof)\.?\s+/i, "").trim();
            if (cleanGName === cleanEName || eGuestName === targetGuestName || eGuestName === newGuestName || eGuestName.startsWith(cleanGName)) {
                const targetRoom = String(target?.roomNumber || newTarget?.roomNumber || "").trim();
                const eRoom = String(e?.roomNumber || "").trim();
                if (targetRoom && eRoom && targetRoom === eRoom) {
                    return true;
                }
                const targetCheckIn = String(target?.checkInDate || target?.checkIn || newTarget?.checkIn || "").slice(0, 10);
                const eCheckIn = String(e?.checkInDate || e?.checkIn || "").slice(0, 10);
                if (targetCheckIn && eCheckIn && targetCheckIn === eCheckIn) {
                    return true;
                }
            }
        }

        // Linked pelunasan / reversal check
        if (e.isPelunasan || e.type === "pelunasan_ar" || e.type === "pelunasan_reversal" || eGuestName.startsWith("koreksi tanggal pelunasan") || eGuestName.startsWith("pelunasan piutang")) {
            const cleanEGuestName = eGuestName
                .replace(/^koreksi tanggal pelunasan\s*-\s*/i, "")
                .replace(/^pelunasan piutang\s*-\s*/i, "")
                .trim();
            if (
                (targetTimestamp && (String(e.refTimestamp) === targetTimestamp || eTimestamp === targetTimestamp)) ||
                (gIds.bookingId && (e.refBookingId === gIds.bookingId || eIds.bookingId === gIds.bookingId)) ||
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
        if (isChannexLocked) {
            toast.error("Reservasi dari Channel Manager (OTA) tidak dapat diubah manual untuk menjaga integritas data.");
            return;
        }
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
                let oldRef = doc(getHotelCollection(db, "daily_revenue", hotelId), `${hotelId}_${d}`);
                let oldSnap = await getDoc(oldRef);
                if (!oldSnap.exists()) {
                    oldRef = doc(getHotelCollection(db, "daily_revenue", hotelId), d);
                    oldSnap = await getDoc(oldRef);
                }
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
                const docRef = doc(getHotelCollection(db, "daily_revenue", hotelId), `${hotelId}_${dateStr}`);
                const docSnap = await getDoc(docRef);
                const cleanedEntry = cleanUndefined(entry);
                if (docSnap.exists()) {
                    const currentEntries = docSnap.data().entries || [];
                    const purged = currentEntries.filter((e: any) => !isBookingMatch(e, guest, formData));
                    const sanitizedEntries = [...purged, cleanedEntry].map((item: any) => cleanUndefined(item));
                    await updateDoc(docRef, { entries: sanitizedEntries, date: dateStr });
                } else {
                    await setDoc(docRef, { entries: [cleanedEntry], date: dateStr });
                }
            }

            // 4. Generate Pelunasan & Reversal entries ONLY for Walk-in AR adjustments on subsequent dates
            if (newSource === "Walk-in" && todayStr !== formData.checkIn) {
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
                        const docRef = doc(getHotelCollection(db, "daily_revenue", hotelId), `${hotelId}_${dateStr}`);
                        const docSnap = await getDoc(docRef);
                        const cleanedEntry = cleanUndefined(entry);
                        if (docSnap.exists()) {
                            const entries = docSnap.data().entries || [];
                            // CRITICAL: ONLY purge previous linked pelunasan/reversal entries, NEVER purge the main accommodation booking!
                            const purged = entries.filter((e: any) => {
                                const isPel = e.isPelunasan || e.type === "pelunasan_ar" || e.type === "pelunasan_reversal";
                                if (!isPel) return true; // KEEP accommodation and other regular bookings!
                                const isLinked = (guest.bookingId && e.refBookingId === guest.bookingId) ||
                                                 (guest.timestamp && String(e.refTimestamp) === String(guest.timestamp)) ||
                                                 (guest.id && e.refBookingId === guest.id);
                                return !isLinked;
                            });
                            const sanitizedEntries = [...purged, cleanedEntry].map((item: any) => cleanUndefined(item));
                            await updateDoc(docRef, { entries: sanitizedEntries, date: dateStr });
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
        if (!canVoid) {
            toast.error("Anda tidak memiliki izin untuk melakukan void booking.");
            setShowConfirmVoid(false);
            return;
        }
        try {
            const hotelId = activeHotelCode || localStorage.getItem("active_hotel_code") || "";
            if (!hotelId) {
                toast.error("Hotel Code is missing.");
                return;
            }
            const dates = getCascadeDates(guest);

            for (const d of dates) {
                let docRef = doc(getHotelCollection(db, "daily_revenue", hotelId), `${hotelId}_${d}`);
                let docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    docRef = doc(getHotelCollection(db, "daily_revenue", hotelId), d);
                    docSnap = await getDoc(docRef);
                }
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const remainingEntries = entries.filter((e: any) => !isBookingMatch(e, guest));
                    await updateDoc(docRef, { entries: remainingEntries, date: d });
                }
            }

            // Immediately trigger availability recalculation & push released inventory to Channex/OTAs
            if (dates.length > 0) {
                fetch("/api/channex/sync-ari", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: hotelId,
                        startDate: dates[0],
                        endDate: dates[dates.length - 1],
                        type: "availability"
                    })
                }).catch(err => console.warn("[Void Channex Sync Warning]:", err));
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
        if (!canCancel) {
            toast.error("Anda tidak memiliki izin untuk membatalkan booking.");
            setShowConfirmCancel(false);
            return;
        }
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
                let docRef = doc(getHotelCollection(db, "daily_revenue", hotelId), `${hotelId}_${d}`);
                let docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    docRef = doc(getHotelCollection(db, "daily_revenue", hotelId), d);
                    docSnap = await getDoc(docRef);
                }
                if (docSnap.exists()) {
                    const entries = docSnap.data().entries || [];
                    const mapped = entries.map((e: any) => {
                        if (isBookingMatch(e, guest)) {
                            return cleanUndefined({ 
                                ...e, 
                                status: "CANCELLED", 
                                paymentStatus: "CANCELLED",
                                roomCount: 0,
                                cancelledAt: todayStr,
                                cancelledBy: cancelledByVal
                            });
                        }
                        return cleanUndefined(e);
                    });
                    await updateDoc(docRef, { entries: mapped, date: d });
                }
            }

            // Immediately trigger availability recalculation & push released inventory to Channex/OTAs
            if (dates.length > 0) {
                fetch("/api/channex/sync-ari", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: hotelId,
                        startDate: dates[0],
                        endDate: dates[dates.length - 1],
                        type: "availability"
                    })
                }).catch(err => console.warn("[Cancel Channex Sync Warning]:", err));
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
                {/* Header ala Channex */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--f-hairline)', padding: '16px 20px', backgroundColor: 'var(--f-surface-soft, #f8fafc)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={onClose} className={styles.btnIcon} style={{ width: '32px', height: '32px', borderRadius: '6px' }} title="Close">
                            <X size={16} />
                        </button>
                        <div>
                            <h2 className={styles.headerTitle} style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{isEditMode ? "Modify Reservation" : `Booking ${resolveBookingIdentifiers(guest).reservationId}`}</span>
                            </h2>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                {isEditMode ? "Adjust room type, rate & settlement details" : "Channex Channel Manager Integrated Folio"}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isEditMode && (
                            <button
                                type="button"
                                onClick={() => {
                                    const bParam = guest.bookingId ? `&bookingId=${encodeURIComponent(guest.bookingId)}` : '';
                                    const gParam = guest.guestName ? `&guestName=${encodeURIComponent(guest.guestName)}` : '';
                                    router.push(`/digital-checkin?autoOpen=true${gParam}${bParam}`);
                                }}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 14px',
                                    borderRadius: '4px',
                                    backgroundColor: '#fff',
                                    border: '1px solid #d9d9d9',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: '#262626',
                                    cursor: 'pointer'
                                }}
                                title="Print Registration / Folio"
                            >
                                <Printer size={13} />
                                <span>Print</span>
                            </button>
                        )}
                        {!isEditMode && (
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: '#f0f9ff',
                                    border: '1px solid #bae6fd',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#0284c7',
                                    cursor: 'pointer'
                                }}
                                title="Modify folio payment method & billing channel"
                            >
                                <CreditCard size={13} />
                                <span>Modify Payment</span>
                            </button>
                        )}
                        {!isEditMode && (
                            isChannexLocked ? (
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: '#f1f5f9',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        cursor: 'not-allowed'
                                    }}
                                    title="Reservation locked by OTA Channel Manager. Date and room modifications must be handled via OTA extranet."
                                >
                                    <Lock size={12} />
                                    <span>Locked (OTA)</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsEditMode(true)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        backgroundColor: '#0284c7',
                                        border: '1px solid #0284c7',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}
                                    title="Edit Room & Folio Details"
                                >
                                    <Edit3 size={13} />
                                    <span>Edit Folio</span>
                                </button>
                            )
                        )}
                    </div>
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
                            onEditPayment={() => setShowPaymentModal(true)}
                        />
                    )}
                </div>

                {/* Footer Actions (Clean PMS Toolbar Layout with Safe Right Clearance) */}
                <div className={footerStyles.footerContainer}>
                    {isEditMode ? (
                        <div className={footerStyles.toolbarRow} style={{ justifyContent: 'flex-end' }}>
                            <button 
                                type="button" 
                                onClick={() => setIsEditMode(false)} 
                                className={`${footerStyles.btnAction} ${footerStyles.btnSecondary}`}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={handleSave} 
                                className={`${footerStyles.btnAction} ${footerStyles.btnPrimary}`}
                            >
                                <Save size={13} />
                                <span>Save Folio</span>
                            </button>
                        </div>
                    ) : (
                        <div className={footerStyles.toolbarRow}>
                            <div className={footerStyles.groupLeft}>
                                <button 
                                    type="button" 
                                    onClick={onClose} 
                                    className={`${footerStyles.btnAction} ${footerStyles.btnClose}`}
                                    title="Close reservation folio"
                                >
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const bParam = guest.bookingId ? `&bookingId=${encodeURIComponent(guest.bookingId)}` : '';
                                        const gParam = guest.guestName ? `&guestName=${encodeURIComponent(guest.guestName)}` : '';
                                        router.push(`/digital-checkin?autoOpen=true${gParam}${bParam}`);
                                    }} 
                                    className={`${footerStyles.btnAction} ${footerStyles.btnGrc}`}
                                    title="Print Guest Registration Card (GRC)"
                                >
                                    <Printer size={13} />
                                    <span>Print GRC</span>
                                </button>
                            </div>
                            <div className={footerStyles.groupRight}>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(true)}
                                    className={`${footerStyles.btnAction} ${footerStyles.btnPayment}`}
                                    title="Modify folio payment method & billing channel (Synced to Accounting)"
                                >
                                    <CreditCard size={13} />
                                    <span>Modify Payment</span>
                                </button>
                                {!isChannexLocked ? (
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditMode(true)} 
                                        className={`${footerStyles.btnAction} ${footerStyles.btnModify}`}
                                        title="Edit room and folio charges"
                                    >
                                        <Edit3 size={13} />
                                        <span>Edit Folio</span>
                                    </button>
                                ) : (
                                    <button 
                                        disabled 
                                        className={`${footerStyles.btnAction} ${footerStyles.btnReadOnly}`} 
                                        title="OTA reservation locked from Channel Manager (ReadOnly)"
                                    >
                                        <Lock size={12} />
                                        <span>Locked (OTA)</span>
                                    </button>
                                )}
                                {guest.status !== "CANCELLED" && guest.status !== "CANCEL" && guest.status !== "VOID" && guest.status !== "VOIDED" && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (!canCancel) {
                                                toast.error("You do not have permission to cancel reservations.");
                                                return;
                                            }
                                            setShowConfirmCancel(true);
                                        }} 
                                        className={`${footerStyles.btnAction} ${footerStyles.btnCancel}`}
                                        style={{ opacity: !canCancel ? 0.6 : 1, cursor: !canCancel ? 'not-allowed' : undefined }}
                                        title={!canCancel ? "No cancellation permission" : "Cancel this reservation"}
                                    >
                                        Cancel Reservation
                                    </button>
                                )}
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        if (!canVoid) {
                                            toast.error("You do not have permission to void reservations.");
                                            return;
                                        }
                                        setShowConfirmVoid(true);
                                    }} 
                                    className={`${footerStyles.btnAction} ${footerStyles.btnVoid}`}
                                    style={{ opacity: !canVoid ? 0.6 : 1, cursor: !canVoid ? 'not-allowed' : undefined }}
                                    title={!canVoid ? "No void permission" : "Void this reservation transaction"}
                                >
                                    <Trash2 size={13} />
                                    <span>Void Transaction</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PaymentMethodEditModal
                isOpen={showPaymentModal}
                guest={guest}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={() => {
                    if (onSave) onSave();
                    onClose();
                }}
            />

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
