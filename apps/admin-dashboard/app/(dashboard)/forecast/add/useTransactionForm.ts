"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export interface RoomType {
    id: string;
    name: string;
}

export const SAGE = "#788069";

export const CHANNELS = [
    { name: "Traveloka", color: "#00aaf2", logo: "/channels/traveloka.png" },
    { name: "Booking.com", color: "#003580", logo: "/channels/booking_com.png" },
    { name: "Tiket.com", color: "#ff5e1a", logo: "/channels/tiket_com.png" },
    { name: "Agoda", color: "#e8173e", logo: "/channels/agoda.png" },
    { name: "Airbnb", color: "#ff5a5f", logo: "/channels/airbnb.png" },
    { name: "Trip.com", color: "#1890ff", logo: "/channels/trip.png" },
    { name: "Expedia", color: "#fbc02d", logo: "/channels/expedia.png" },
    { name: "MG Bedbank", color: "#6c3483", logo: "/channels/mg.png" },
    { name: "Walk-in", color: "#2e7d32", logo: "/channels/walk_in.png" },
    { name: "Booking Engine", color: SAGE, logo: "globe" },
];

export const OTHER_INCOME_TYPES = [
    "Breakfast",
    "Meeting Room",
    "F&B (Restaurant/Cafe)",
    "Laundry",
    "Spa & Massage",
    "Transportation / Pickup",
    "Extra Bed",
    "Other Income"
];

const INITIAL_FORM = {
    guestName: "",
    checkIn: "",
    checkOut: "",
    rooms: [{ roomTypeId: "", roomNumber: "", price: "" }],
    nightRates: [""] as any[],
    channel: "Walk-in",
    voucherCode: "",
    payHotel: "",
    payTransfer: "",
    totalAmount: "",
    incomeType: "Other",
    note: "",
    staffName: "",
    isCompliment: false,
    complimentReason: ""
};

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

export const useTransactionForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, activeHotelCode } = useAuth();
    const selectedDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const handleCancel = useCallback(() => {
        const searchMod = searchParams.get("module");
        let moduleParam = "front-office";
        if (searchMod) {
            moduleParam = searchMod;
        } else {
            const storedMod = typeof window !== "undefined" ? localStorage.getItem("active_module") : null;
            if (storedMod) {
                moduleParam = storedMod;
            } else if (user?.role) {
                const r = user.role.toLowerCase();
                if (r === "house keeping") moduleParam = "housekeeping";
                else if (r === "purchasing") moduleParam = "purchasing";
                else if (r === "kasir" || r === "kitchen") moduleParam = "food-beverage";
                else if (r === "finance") moduleParam = "accounting";
            }
        }

        let redirectPath = `/overview?module=${moduleParam}`;
        if (moduleParam === "purchasing") {
            redirectPath = "/purchasing?module=purchasing";
        } else if (moduleParam === "food-beverage") {
            redirectPath = "/food-beverage/product?module=food-beverage";
        } else if (moduleParam === "accounting") {
            redirectPath = "/pnl?module=accounting";
        } else if (moduleParam === "cpanel") {
            redirectPath = "/logo?module=cpanel";
        }
        router.push(redirectPath);
    }, [router, searchParams, user]);

    const [roomTypes, setRoomTypes] = useState<any[]>([]);
    const [occupancy, setOccupancy] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<"select" | "form">("select");
    const [revenueType, setRevenueType] = useState<"room" | "other">("room");
    const [queue, setQueue] = useState<any[]>([]);
    
    const [form, setForm] = useState({
        ...INITIAL_FORM,
        checkIn: selectedDate
    });

    const start = form.checkIn ? new Date(form.checkIn) : null;
    const end = form.checkOut ? new Date(form.checkOut) : null;
    const nights = (start && end && end > start) ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 1;

    const totalGross = revenueType === "room" 
        ? (form.nightRates || []).reduce((acc, r) => acc + (Number(r) || 0), 0)
        : (Number(form.totalAmount) || 0);
        
    const balance = totalGross - (Number(form.payHotel) || 0) - (Number(form.payTransfer) || 0);

    useEffect(() => {
        const isRestricted = !(form.channel === "Walk-in");
        if (revenueType === "room") {
            if (form.isCompliment) {
                setForm(prev => ({ 
                    ...prev, 
                    payHotel: "0",
                    payTransfer: "0"
                }));
            } else if (isRestricted) {
                setForm(prev => ({ 
                    ...prev, 
                    payHotel: "0",
                    payTransfer: totalGross.toString()
                }));
            }
        }
    }, [form.channel, revenueType, totalGross, form.isCompliment]);

    useEffect(() => {
        if (revenueType === "other") {
            if (form.isCompliment) {
                setForm(prev => ({
                    ...prev,
                    payHotel: "0",
                    payTransfer: "0"
                }));
            } else {
                setForm(prev => ({
                    ...prev,
                    payTransfer: "0"
                }));
            }
        }
    }, [revenueType, form.isCompliment]);

    // Fetch Allotment & Current Bookings
    useEffect(() => {
        const fetchData = async () => {
            try {
                const rSnap = await getDocs(getHotelCollection(db, "roomTypes"));
                const types = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setRoomTypes(types);
                
                if (types.length > 0) {
                    setForm(prev => {
                        const newRooms = [...prev.rooms];
                        if (newRooms[0] && !newRooms[0].roomTypeId) {
                            newRooms[0] = { ...newRooms[0], roomTypeId: types[0].id };
                        }
                        return { ...prev, rooms: newRooms };
                    });
                }

                const bSnap = await getDocs(getHotelCollection(db, "daily_revenue"));
                const allBookings = bSnap.docs.flatMap(d => d.data().entries || []);
                const uniqueBookings = allBookings.filter((e: any, idx: number, self: any[]) => 
                    self.findIndex(t => t.timestamp === e.timestamp) === idx
                );
                setOccupancy(uniqueBookings);
            } catch (err) {
                console.error("Error fetching inventory data:", err);
            }
        };
        fetchData();
    }, []);

    // Sync nightRates with nights
    useEffect(() => {
        if (revenueType === "room") {
            setForm(prev => {
                const currentRates = prev.nightRates || [];
                if (currentRates.length === nights) return prev;
                
                const defaultPrice = prev.rooms[0]?.price || "";
                const newRates = Array(nights).fill("").map((_, i) => {
                    if (currentRates[i] !== undefined && currentRates[i] !== "") {
                        return currentRates[i];
                    }
                    return defaultPrice;
                });
                return { ...prev, nightRates: newRates };
            });
        }
    }, [nights, revenueType]);

    const updateNightRate = (idx: number, val: string | number) => {
        let finalVal = val;
        const num = Number(val);
        if (!isNaN(num) && num < 0) {
            finalVal = 0;
        }
        setForm(prev => {
            const newRates = [...(prev.nightRates || [])];
            newRates[idx] = finalVal;
            
            const newRooms = [...prev.rooms];
            if (idx === 0 && newRooms[0]) {
                newRooms[0] = { ...newRooms[0], price: finalVal.toString() };
            }
            
            return { ...prev, nightRates: newRates, rooms: newRooms };
        });
    };

    const isAvailable = useCallback(() => {
        if (revenueType !== "room" || !form.checkIn || !form.checkOut) return true;

        const startD = new Date(form.checkIn);
        const endD = new Date(form.checkOut);
        
        // Group requested rooms by type to check aggregate allotment
        const requestedByType: Record<string, number> = {};
        form.rooms.forEach(r => {
            if (r.roomTypeId) {
                requestedByType[r.roomTypeId] = (requestedByType[r.roomTypeId] || 0) + 1;
            }
        });

        // Loop through each night of the stay
        for (let d = new Date(startD); d < endD; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            
            for (const [typeId, count] of Object.entries(requestedByType)) {
                const type = roomTypes.find(rt => rt.id === typeId);
                if (!type) continue;

                // Count existing bookings for this room type on this date
                const occupied = occupancy.filter(e => {
                    if (e.type !== 'accommodation' || e.status?.toUpperCase() === 'CANCELLED' || e.status?.toUpperCase() === 'CANCEL') return false;
                    if (e.roomType?.toLowerCase() !== type.name?.toLowerCase()) return false;
                    
                    if (e.effectiveDate) {
                        return e.effectiveDate === dateStr;
                    } else {
                        return dateStr >= e.checkInDate && dateStr < e.checkOutDate;
                    }
                }).reduce((acc, curr) => acc + (Number(curr.roomCount) || 1), 0);

                const totalAllotment = parseInt(type.roomCount) || parseInt(type.totalRooms) || 0;
                if (occupied + count > totalAllotment) return false;
            }
        }
        return true;
    }, [form.checkIn, form.checkOut, form.rooms, occupancy, roomTypes, revenueType]);

    const addRoom = () => {
        setForm(prev => ({
            ...prev,
            rooms: [...prev.rooms, { roomTypeId: "", roomNumber: "", price: "" }]
        }));
    };

    const removeRoom = (index: number) => {
        if (form.rooms.length <= 1) return;
        setForm(prev => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index)
        }));
    };

    const updateRoom = (index: number, field: string, value: any) => {
        setForm(prev => {
            const newRooms = [...prev.rooms];
            newRooms[index] = { ...newRooms[index], [field]: value };
            return { ...prev, rooms: newRooms };
        });
    };

    const prepareEntries = useCallback(() => {
        const isRoom = revenueType === "room";
        
        // 1. Core Validation
        if (isRoom) {
            if (!form.guestName) { toast.error("Guest Name is required"); return null; }
            if (!form.checkOut) { toast.error("Check-out Date is required"); return null; }
            if (form.checkOut <= form.checkIn) { toast.error("Check-out Date must be after Check-in Date"); return null; }
            if (!form.rooms[0]?.roomTypeId) { toast.error("Room Category is required"); return null; }
            if (form.isCompliment && !form.complimentReason) { toast.error("Alasan Compliment wajib diisi"); return null; }
            
            // Check for negative room rates
            const hasNegativeRate = (form.nightRates || []).some(r => Number(r) < 0);
            if (hasNegativeRate) {
                toast.error("Room rate cannot be negative");
                return null;
            }
            // Check for negative payments
            if (Number(form.payHotel) < 0 || Number(form.payTransfer) < 0) {
                toast.error("Payment amount cannot be negative");
                return null;
            }
        } else {
            const amountVal = Number(form.totalAmount);
            if (form.isCompliment && !form.complimentReason) { toast.error("Alasan Compliment wajib diisi"); return null; }
            if (!form.isCompliment && (isNaN(amountVal) || amountVal === 0 || form.totalAmount === "")) {
                toast.error("Total Amount is required");
                return null;
            }
            if (amountVal < 0) {
                toast.error("Total Amount must be greater than 0");
                return null;
            }
            if (Number(form.payHotel) < 0 || Number(form.payTransfer) < 0) {
                toast.error("Payment amount cannot be negative");
                return null;
            }
        }

        // Allow adding transactions for past dates without availability check
        const checkInDate = new Date(form.checkIn);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isFutureOrToday = checkInDate >= today;
        if (isRoom && !isAvailable() && isFutureOrToday) {
            toast.error("Requested room types are sold out for these dates");
            return null;
        }

        let transactionEntries: any[] = [];

        if (revenueType === "room") {
            const startD = new Date(form.checkIn);
            let remainingPayHotel = Number(form.payHotel) || 0;
            let remainingPayTransfer = Number(form.payTransfer) || 0;

            for (let i = 0; i < nights; i++) {
                const currentDate = new Date(startD);
                currentDate.setDate(currentDate.getDate() + i);
                const dateStr = currentDate.toISOString().split('T')[0];
                
                const nightlyRate = Number(form.nightRates[i]) || 0;
                const ratio = totalGross > 0 ? nightlyRate / totalGross : 0;
                
                let dailyPayHotel = 0;
                let dailyPayTransfer = 0;
                
                if (i === nights - 1) {
                    dailyPayHotel = remainingPayHotel;
                    dailyPayTransfer = remainingPayTransfer;
                } else {
                    dailyPayHotel = Math.round((Number(form.payHotel) || 0) * ratio);
                    dailyPayTransfer = Math.round((Number(form.payTransfer) || 0) * ratio);
                    remainingPayHotel -= dailyPayHotel;
                    remainingPayTransfer -= dailyPayTransfer;
                }
                
                const finalAmount = form.isCompliment ? 0 : nightlyRate;
                const finalPayHotel = form.isCompliment ? 0 : dailyPayHotel;
                const finalPayTransfer = form.isCompliment ? 0 : dailyPayTransfer;

                const dailyPaid = finalPayHotel + finalPayTransfer;
                const dailyBalance = Math.max(0, finalAmount - dailyPaid);
                const dailyStatus = form.isCompliment ? "Lunas" : (dailyBalance === 0 ? "Lunas" : (dailyPaid > 0 ? "DP / Partial" : "Belum Bayar"));

                transactionEntries.push({
                    type: "accommodation",
                    guestName: form.guestName,
                    checkInDate: form.checkIn,
                    checkOutDate: form.checkOut,
                    effectiveDate: dateStr,
                    roomType: roomTypes.find(rt => rt.id === form.rooms[0].roomTypeId)?.name || "",
                    roomNumber: form.rooms[0].roomNumber,
                    roomCount: 1,
                    nights: 1,
                    channel: form.channel,
                    voucherCode: form.voucherCode,
                    amount: finalAmount,
                    payHotel: finalPayHotel,
                    payTransfer: finalPayTransfer,
                    paidCash: finalPayHotel,
                    paidAmount1: finalPayHotel,
                    paidTransfer: finalPayTransfer,
                    paidAmount2: finalPayTransfer,
                    paymentStatus: dailyStatus,
                    source: form.channel === "Walk-in" ? "Walk-in" : "OTA",
                    status: form.channel === "Walk-in" ? "CONFIRMED" : "CONFIRMED", // Aligning reservation statuses
                    staffName: form.staffName,
                    note: form.note,
                    timestamp: new Date().toISOString(),
                    isCompliment: form.isCompliment,
                    complimentReason: form.isCompliment ? form.complimentReason : undefined,
                    complimentValue: form.isCompliment ? nightlyRate : undefined
                });
            }
        } else {
            const finalAmount = form.isCompliment ? 0 : Number(form.totalAmount);
            const finalPayHotel = form.isCompliment ? 0 : (Number(form.payHotel) || 0);
            const finalPayTransfer = form.isCompliment ? 0 : (Number(form.payTransfer) || 0);

            const totalPaid = finalPayHotel + finalPayTransfer;
            const incomeBalance = Math.max(0, finalAmount - totalPaid);
            const incomeStatus = form.isCompliment ? "Lunas" : (incomeBalance === 0 ? "Lunas" : (totalPaid > 0 ? "DP / Partial" : "Belum Bayar"));

            transactionEntries = [{
                type: "other_income",
                guestName: form.guestName, // This stores the description for other income
                incomeCategory: form.incomeType,
                note: form.note,
                staffName: form.staffName || "System",
                checkInDate: form.checkIn,
                checkOutDate: form.checkIn,
                amount: finalAmount,
                payHotel: finalPayHotel,
                payTransfer: finalPayTransfer,
                paidCash: finalPayHotel,
                paidAmount1: finalPayHotel,
                paidTransfer: finalPayTransfer,
                paidAmount2: finalPayTransfer,
                paymentStatus: incomeStatus,
                source: "Walk-in", // Other income is generally considered walk-in
                status: "CONFIRMED",
                timestamp: new Date().toISOString(),
                isCompliment: form.isCompliment,
                complimentReason: form.isCompliment ? form.complimentReason : undefined,
                complimentValue: form.isCompliment ? Number(form.totalAmount) : undefined
            }];
        }

        return transactionEntries;
    }, [form, revenueType, balance, isAvailable, nights, roomTypes, totalGross]);

    const addToQueue = () => {
        const entries = prepareEntries();
        if (entries) {
            setQueue(prev => [...prev, ...entries]);
            // Reset form but keep date and type
            setForm(prev => ({
                ...INITIAL_FORM,
                checkIn: prev.checkIn,
                staffName: prev.staffName,
                incomeType: prev.incomeType
            }));
            toast.success("Added to queue");
        }
    };

    const removeFromQueue = (index: number) => {
        setQueue(prev => prev.filter((_, i) => i !== index));
    };

    const commitTransactions = useCallback(async () => {
        let finalEntries = [...queue];

        // If form is dirty and queue is empty, or user just wants to process current form
        const isFormDirty = form.guestName.trim() !== "" || (revenueType === 'other' && Number(form.totalAmount) > 0);
        
        if (isFormDirty) {
            const currentEntries = prepareEntries();
            if (currentEntries) {
                finalEntries = [...finalEntries, ...currentEntries];
            } else if (queue.length === 0) {
                return; // Validation failed and nothing in queue
            }
        }

        if (finalEntries.length === 0) {
            toast.error("Queue is empty and form is not filled.");
            return;
        }

        setSaving(true);
        try {
            // Group entries by date to save to correct documents
            const entriesByDate: Record<string, any[]> = {};
            finalEntries.forEach(entry => {
                const date = entry.effectiveDate || entry.checkInDate;
                if (!entriesByDate[date]) entriesByDate[date] = [];
                entriesByDate[date].push(entry);
            });

            for (const [dateStr, transactionEntries] of Object.entries(entriesByDate)) {
                const hotelId = activeHotelCode || (typeof window !== "undefined" ? localStorage.getItem("active_hotel_code") : null) || "87241";
                const docId = `${hotelId}_${dateStr}`;
                const docRef = doc(getHotelCollection(db, "daily_revenue"), docId);
                const docSnap = await getDoc(docRef);
                const cleanedEntries = transactionEntries.map(e => cleanUndefined(e));

                if (docSnap.exists()) {
                    await updateDoc(docRef, { 
                        entries: arrayUnion(...cleanedEntries),
                        date: dateStr
                    });
                } else {
                    await setDoc(docRef, { 
                        entries: cleanedEntries,
                        date: dateStr
                    });
                }
            }

            toast.success("All transactions synchronized successfully");
            handleCancel();
        } catch (err) {
            console.error(err);
            toast.error("Synchronization failed.");
        } finally {
            setSaving(false);
        }
    }, [form, queue, prepareEntries, handleCancel, revenueType]);

    const updateForm = (field: string, value: any) => {
        let finalValue = value;
        if (["payHotel", "payTransfer", "totalAmount"].includes(field)) {
            const num = Number(value);
            if (!isNaN(num) && num < 0) {
                finalValue = 0;
            }
        }
        setForm(prev => ({ ...prev, [field]: finalValue }));
    };

    return {
        form,
        roomTypes,
        saving,
        step,
        revenueType,
        balance,
        totalGross,
        nights,
        setStep,
        setRevenueType,
        updateForm,
        updateNightRate,
        addRoom,
        removeRoom,
        updateRoom,
        isAvailable,
        router,
        handleCancel,
        queue,
        addToQueue,
        removeFromQueue,
        commitTransactions
    };
};
