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

export const BOOKING_TYPES = [
    "Confirm Booking",
    "Tentative / Hold",
    "Inquiry",
    "Compliment / Gratis"
];

export const BUSINESS_SOURCES = [
    "Direct / Walk-in",
    "Corporate / Perusahaan",
    "Government / Dinas",
    "Travel Agent / FIT",
    "Group / MICE",
    "OTA / Online Channel",
    "Wholesaler"
];

const INITIAL_FORM = {
    salutation: "Mr.",
    guestName: "",
    checkIn: "",
    checkInTime: "02:00 PM",
    checkOut: "",
    checkOutTime: "12:00 PM",
    roomCount: 1,
    bookingType: "Confirm Booking",
    businessSource: "Direct / Walk-in",
    isContract: false,
    bookAllAvailable: false,
    rooms: [{ roomTypeId: "", roomNumber: "", ratePlanId: "", rateCode: "-", adults: 1, children: 0, price: "" }],
    nightRates: [""] as any[],
    channel: "Walk-in",
    voucherCode: "",
    bookingId: "",
    phone: "",
    nik: "",
    nationality: "INDONESIA",
    email: "",
    address: "",
    zipCode: "",
    country: "Indonesia",
    state: "",
    city: "",
    company: "-",
    rateCode: "-",
    pax: 1,
    upgradeFrom: "",
    upgradeTo: "",
    sendEmailVoucher: false,
    enableGuestPortal: true,
    paymentRecipient: "Hotel / Front Desk",
    paymentModeEnabled: true,
    paidCash: "",
    paidEdc: "",
    paidQris: "",
    paidTransfer: "",
    paidOta: "",
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
    const [ratePlans, setRatePlans] = useState<any[]>([]);
    const [selectedRatePlanId, setSelectedRatePlanId] = useState<string>("");
    const [occupancy, setOccupancy] = useState<any[]>([]);
    const [ariOverrides, setAriOverrides] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<"select" | "form">("select");
    const [revenueType, setRevenueType] = useState<"room" | "other">("room");
    const [queue, setQueue] = useState<any[]>([]);
    
    const initialCheckIn = selectedDate;
    const initialCheckOut = (() => {
        try {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 1);
            return d.toISOString().split("T")[0];
        } catch (e) {
            return "";
        }
    })();

    const [form, setForm] = useState({
        ...INITIAL_FORM,
        checkIn: initialCheckIn,
        checkOut: initialCheckOut
    });

    const start = form.checkIn ? new Date(form.checkIn) : null;
    const end = form.checkOut ? new Date(form.checkOut) : null;
    const nights = (start && end && end > start) ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 1;

    // Calculate total gross across all rooms and nights
    const totalGross = revenueType === "room" 
        ? (() => {
            if (form.isCompliment) return 0;
            const totalFromRooms = (form.rooms || []).reduce((acc: number, r: any) => {
                const p = Number(r.price) || 0;
                return acc + (p * nights);
            }, 0);
            if ((!form.rooms || form.rooms.length <= 1) && form.nightRates && form.nightRates.length > 0 && form.nightRates.some((r: any) => Number(r) > 0)) {
                return (form.nightRates || []).reduce((acc: number, r: any) => acc + (Number(r) || 0), 0);
            }
            return totalFromRooms;
        })()
        : (form.isCompliment ? 0 : (Number(form.totalAmount) || 0));
        
    const totalPaid = (Number(form.paidCash) || 0) + 
                      (Number(form.paidEdc) || 0) + 
                      (Number(form.paidQris) || 0) + 
                      (Number(form.paidTransfer) || 0) + 
                      (Number(form.paidOta) || 0) + 
                      (form.paidCash === "" && form.paidEdc === "" && form.paidQris === "" && form.paidTransfer === "" && form.paidOta === "" 
                        ? (Number(form.payHotel) || 0) + (Number(form.payTransfer) || 0) 
                        : 0);
                        
    const balance = totalGross - totalPaid;

    // Fetch Room Types, Rate Plans, & Occupancy
    useEffect(() => {
        const fetchData = async () => {
            try {
                const rSnap = await getDocs(getHotelCollection(db, "roomTypes", activeHotelCode));
                const types = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setRoomTypes(types);

                // Fetch Rate Plans
                const rpSnap = await getDocs(getHotelCollection(db, "ratePlans", activeHotelCode));
                const plans = rpSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (plans.length > 0) {
                    setRatePlans(plans);
                } else if (types.length > 0) {
                    const fallbackPlans = types.flatMap((t: any) => [
                        {
                            id: `${t.id}-bb`,
                            code: `${t.code || t.name}-BB`,
                            name: `${t.name} - With Breakfast`,
                            baseRate: t.basePrice || t.price || 650000,
                            roomTypeId: t.id
                        },
                        {
                            id: `${t.id}-ro`,
                            code: `${t.code || t.name}-RO`,
                            name: `${t.name} - Room Only`,
                            baseRate: t.basePrice || t.price || 650000,
                            roomTypeId: t.id
                        }
                    ]);
                    setRatePlans(fallbackPlans);
                }
                
                if (types.length > 0) {
                    setForm(prev => {
                        const newRooms = [...prev.rooms];
                        if (newRooms[0] && !newRooms[0].roomTypeId) {
                            newRooms[0] = { ...newRooms[0], roomTypeId: types[0].id };
                        }
                        return { ...prev, rooms: newRooms };
                    });
                }

                const bSnap = await getDocs(getHotelCollection(db, "daily_revenue", activeHotelCode));
                const allBookings = bSnap.docs.flatMap(d => d.data().entries || []);
                const uniqueBookings = allBookings.filter((e: any, idx: number, self: any[]) => 
                    self.findIndex(t => t.timestamp === e.timestamp) === idx
                );
                setOccupancy(uniqueBookings);

                // Fetch ARI Overrides for Stop Sell validation
                try {
                    const ovSnap = await getDocs(getHotelCollection(db, "ari_overrides", activeHotelCode));
                    const ovMap: Record<string, any> = {};
                    ovSnap.docs.forEach(d => {
                        const data = d.data();
                        const dateKey = data.date || d.id.replace(`${activeHotelCode}_`, "");
                        ovMap[dateKey] = data;
                    });
                    setAriOverrides(ovMap);
                } catch (ovErr) {
                    console.warn("Could not fetch ari_overrides:", ovErr);
                }
            } catch (err) {
                console.error("Error fetching inventory data:", err);
            }
        };
        fetchData();
    }, [activeHotelCode]);


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

    const checkStopSell = useCallback((roomTypeId: string, ratePlanId: string, dateStr: string) => {
        const dayOverride = ariOverrides[dateStr];
        const rp = ratePlans.find(p => p.id === ratePlanId);
        if (dayOverride?.stopSell && ratePlanId && dayOverride.stopSell[ratePlanId] !== undefined) {
            return !!dayOverride.stopSell[ratePlanId];
        }
        if (rp && rp.stopSell !== undefined) {
            return !!rp.stopSell;
        }
        const plansForRoom = ratePlans.filter(p => p.roomTypeId === roomTypeId || (p.roomTypeName && roomTypes.find(rt => rt.id === roomTypeId)?.name?.toLowerCase() === p.roomTypeName?.toLowerCase()));
        if (plansForRoom.length > 0) {
            return plansForRoom.every(p => {
                if (dayOverride?.stopSell?.[p.id] !== undefined) return !!dayOverride.stopSell[p.id];
                return !!p.stopSell;
            });
        }
        if (dayOverride?.stopSell && Object.values(dayOverride.stopSell).some(v => v === true)) {
            return true;
        }
        return false;
    }, [ariOverrides, ratePlans, roomTypes]);

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

            // 1. Check Stop Sell for each room
            for (const rm of form.rooms) {
                if (rm.roomTypeId && checkStopSell(rm.roomTypeId, rm.ratePlanId || selectedRatePlanId, dateStr)) {
                    return false;
                }
            }
            
            for (const [typeId, count] of Object.entries(requestedByType)) {
                const type = roomTypes.find(rt => rt.id === typeId);
                if (!type) continue;

                // Count existing bookings for this room type on this date
                const occupied = occupancy.filter(e => {
                    const statusUpper = e.status?.toUpperCase();
                    const paymentStatusUpper = e.paymentStatus?.toUpperCase();
                    const isCancelled = statusUpper === 'CANCELLED' || 
                                        statusUpper === 'CANCEL' || 
                                        paymentStatusUpper === 'CANCELLED' || 
                                        paymentStatusUpper === 'CANCEL' ||
                                        statusUpper === 'VOID' ||
                                        statusUpper === 'VOIDED' ||
                                        e.isHidden;
                    if (e.type !== 'accommodation' || isCancelled) return false;
                    const isMatch = (e.roomTypeId && e.roomTypeId === type.id) || 
                                    (e.roomType && type.name && e.roomType.toLowerCase() === type.name.toLowerCase());
                    if (!isMatch) return false;
                    
                    if (e.checkInDate && e.checkOutDate) {
                        return dateStr >= e.checkInDate && dateStr < e.checkOutDate;
                    } else if (e.effectiveDate) {
                        return e.effectiveDate === dateStr;
                    }
                    return false;
                }).reduce((acc, curr) => acc + (Number(curr.roomCount) || 1), 0);

                const totalAllotment = parseInt(type.roomCount) || parseInt(type.totalRooms) || parseInt(type.allotment) || parseInt(type.count_of_rooms) || (type.physicalRooms && type.physicalRooms.length > 0 ? type.physicalRooms.length : 0) || 4;
                if (occupied + count > totalAllotment) return false;
            }
        }
        return true;
    }, [form.checkIn, form.checkOut, form.rooms, occupancy, roomTypes, revenueType, checkStopSell, selectedRatePlanId]);

    const addRoom = () => {
        setForm(prev => {
            const defaultType = roomTypes[0]?.id || "";
            const defaultPrice = (roomTypes[0]?.basePrice || roomTypes[0]?.price || "").toString();
            const nextRooms = [
                ...prev.rooms,
                { 
                    roomTypeId: prev.rooms[0]?.roomTypeId || defaultType, 
                    roomNumber: "", 
                    ratePlanId: "", 
                    rateCode: "-", 
                    adults: 1, 
                    children: 0, 
                    price: prev.rooms[0]?.price || defaultPrice 
                }
            ];
            return {
                ...prev,
                rooms: nextRooms,
                roomCount: nextRooms.length
            };
        });
    };

    const removeRoom = (index: number) => {
        if (form.rooms.length <= 1) return;
        setForm(prev => {
            const nextRooms = prev.rooms.filter((_, i) => i !== index);
            return {
                ...prev,
                rooms: nextRooms,
                roomCount: nextRooms.length
            };
        });
    };

    const updateRoom = (index: number, field: string, value: any) => {
        setForm(prev => {
            const newRooms = [...prev.rooms];
            newRooms[index] = { ...newRooms[index], [field]: value };

            if (field === "roomTypeId") {
                const rt = roomTypes.find(r => r.id === value);
                if (rt && (!newRooms[index].price || newRooms[index].price === "0" || newRooms[index].price === "")) {
                    newRooms[index].price = (rt.basePrice || rt.price || "").toString();
                }
            }
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
            if (!form.rooms || form.rooms.length === 0 || !form.rooms[0]?.roomTypeId) { 
                toast.error("Silakan pilih Tipe Kamar"); 
                return null; 
            }
            if (form.isCompliment && !form.complimentReason) { toast.error("Alasan Compliment wajib diisi"); return null; }
            
            // Check for negative room rates
            const hasNegativeRate = (form.rooms || []).some(r => Number(r.price) < 0) || (form.nightRates || []).some(r => Number(r) < 0);
            if (hasNegativeRate) {
                toast.error("Tarif kamar tidak boleh bernilai negatif");
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
        }

        // Check for negative payments
        if (
            Number(form.paidCash) < 0 || 
            Number(form.paidEdc) < 0 || 
            Number(form.paidQris) < 0 || 
            Number(form.paidTransfer) < 0 || 
            Number(form.paidOta) < 0 ||
            Number(form.payHotel) < 0 || 
            Number(form.payTransfer) < 0
        ) {
            toast.error("Payment amount cannot be negative");
            return null;
        }

        // Check Stop Sell explicitly with exact date and room name
        if (isRoom) {
            const startD = new Date(form.checkIn);
            for (let i = 0; i < nights; i++) {
                const cur = new Date(startD);
                cur.setDate(cur.getDate() + i);
                const dateStr = cur.toISOString().split('T')[0];
                for (const rm of form.rooms) {
                    if (rm.roomTypeId && checkStopSell(rm.roomTypeId, rm.ratePlanId || selectedRatePlanId, dateStr)) {
                        const rtName = roomTypes.find(t => t.id === rm.roomTypeId)?.name || "Kamar";
                        toast.error(`Kamar "${rtName}" berstatus STOP SELL pada tanggal ${dateStr}. Tidak dapat melakukan booking / walk-in!`);
                        return null;
                    }
                }
            }
        }

        // Allow adding transactions for past dates without availability check
        const checkInDate = new Date(form.checkIn);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isFutureOrToday = checkInDate >= today;
        if (isRoom && !isAvailable() && isFutureOrToday) {
            toast.error("Requested room types are sold out or closed for these dates");
            return null;
        }

        let transactionEntries: any[] = [];

        // Determine granular settlement values
        const rawCash = form.paidCash !== "" ? Number(form.paidCash) || 0 : (form.paidEdc === "" && form.paidQris === "" && form.paidTransfer === "" ? Number(form.payHotel) || 0 : 0);
        const rawEdc = Number(form.paidEdc) || 0;
        const rawQris = Number(form.paidQris) || 0;
        const rawTransfer = Number(form.paidTransfer) || 0;
        const rawOta = form.paidOta !== "" ? Number(form.paidOta) || 0 : (Number(form.payTransfer) || 0);

        if (revenueType === "room") {
            const startD = new Date(form.checkIn);
            let remCash = rawCash;
            let remEdc = rawEdc;
            let remQris = rawQris;
            let remTransfer = rawTransfer;
            let remOta = rawOta;

            const roomList: any[] = form.rooms && form.rooms.length > 0 ? form.rooms : [{ roomTypeId: "", roomNumber: "", price: "" }];

            roomList.forEach((rm: any, rIdx: number) => {
                const roomTypeObj = roomTypes.find(rt => rt.id === rm.roomTypeId);
                const roomTypeName = roomTypeObj?.name || rm.roomTypeName || "Standard Room";
                const baseNightlyRate = Number(rm.price) || 0;

                for (let i = 0; i < nights; i++) {
                    const currentDate = new Date(startD);
                    currentDate.setDate(currentDate.getDate() + i);
                    const dateStr = currentDate.toISOString().split('T')[0];
                    
                    const nightlyRate = (rIdx === 0 && form.nightRates && form.nightRates[i] !== undefined && form.nightRates[i] !== "") 
                        ? (Number(form.nightRates[i]) || 0) 
                        : baseNightlyRate;

                    const ratio = totalGross > 0 ? nightlyRate / totalGross : 0;
                    
                    let dailyCash = 0;
                    let dailyEdc = 0;
                    let dailyQris = 0;
                    let dailyTransfer = 0;
                    let dailyOta = 0;
                    
                    if (i === nights - 1 && rIdx === roomList.length - 1) {
                        dailyCash = remCash;
                        dailyEdc = remEdc;
                        dailyQris = remQris;
                        dailyTransfer = remTransfer;
                        dailyOta = remOta;
                    } else {
                        dailyCash = Math.round(rawCash * ratio);
                        dailyEdc = Math.round(rawEdc * ratio);
                        dailyQris = Math.round(rawQris * ratio);
                        dailyTransfer = Math.round(rawTransfer * ratio);
                        dailyOta = Math.round(rawOta * ratio);

                        remCash -= dailyCash;
                        remEdc -= dailyEdc;
                        remQris -= dailyQris;
                        remTransfer -= dailyTransfer;
                        remOta -= dailyOta;
                    }
                    
                    const finalAmount = form.isCompliment ? 0 : nightlyRate;
                    const finalCash = form.isCompliment ? 0 : dailyCash;
                    const finalEdc = form.isCompliment ? 0 : dailyEdc;
                    const finalQris = form.isCompliment ? 0 : dailyQris;
                    const finalTransfer = form.isCompliment ? 0 : dailyTransfer;
                    const finalOta = form.isCompliment ? 0 : dailyOta;
                    
                    const finalPayHotel = finalCash + finalEdc + finalQris + finalTransfer;
                    const finalPayTransfer = finalOta + finalTransfer;

                    const dailyPaid = finalCash + finalEdc + finalQris + finalTransfer + finalOta;
                    const dailyBalance = Math.max(0, finalAmount - dailyPaid);
                    const dailyStatus = form.isCompliment ? "Lunas" : (dailyBalance === 0 ? "Lunas" : (dailyPaid > 0 ? "DP / Partial" : "Belum Bayar"));

                    let pm = "Cash";
                    if (finalOta > 0 && finalPayHotel === 0) pm = "OTA Virtual / City Ledger";
                    else if (finalEdc > 0 && finalCash === 0 && finalQris === 0 && finalTransfer === 0) pm = "EDC BCA / Mandiri";
                    else if (finalQris > 0 && finalCash === 0 && finalEdc === 0 && finalTransfer === 0) pm = "QRIS Payment";
                    else if (finalTransfer > 0 && finalCash === 0 && finalEdc === 0 && finalQris === 0) pm = "Bank Transfer";
                    else if ([finalCash > 0, finalEdc > 0, finalQris > 0, finalTransfer > 0, finalOta > 0].filter(Boolean).length > 1) pm = "Split Payment";

                    const fullGuestName = [form.salutation, form.guestName].filter(Boolean).join(" ");

                    transactionEntries.push({
                        type: "accommodation",
                        salutation: form.salutation || "Mr.",
                        guestName: fullGuestName,
                        rawGuestName: form.guestName,
                        bookingId: form.bookingId || `RES-${Date.now().toString().slice(-6)}`,
                        phone: form.phone || "",
                        nik: form.nik || "",
                        nationality: form.nationality || "INDONESIA",
                        email: form.email || "",
                        address: form.address || "",
                        zipCode: form.zipCode || "",
                        country: form.country || "Indonesia",
                        state: form.state || "",
                        city: form.city || "",
                        company: form.company || "-",
                        bookingType: form.bookingType || "Confirm Booking",
                        businessSource: form.businessSource || "Direct / Walk-in",
                        rateCode: rm.rateCode || form.rateCode || "-",
                        ratePlanId: rm.ratePlanId || "",
                        pax: Number(rm.adults || form.pax || 1),
                        adults: Number(rm.adults || 1),
                        children: Number(rm.children || 0),
                        upgradeFrom: form.upgradeFrom || "",
                        upgradeTo: form.upgradeTo || "",
                        checkInDate: form.checkIn,
                        checkInTime: form.checkInTime || "02:00 PM",
                        checkOutDate: form.checkOut,
                        checkOutTime: form.checkOutTime || "12:00 PM",
                        effectiveDate: dateStr,
                        roomType: roomTypeName,
                        roomTypeId: rm.roomTypeId || "",
                        roomNumber: rm.roomNumber || `Room ${rIdx + 1}`,
                        roomCount: 1,
                        roomIndex: rIdx,
                        totalRoomsInBooking: roomList.length,
                        nights: 1,
                        channel: form.channel,
                        voucherCode: form.voucherCode,
                        amount: finalAmount,
                        totalAmount: totalGross,
                        paidCash: finalCash,
                        paidEdc: finalEdc,
                        paidQris: finalQris,
                        paidTransfer: finalTransfer,
                        paidOta: finalOta,
                        payHotel: finalPayHotel,
                        payTransfer: finalPayTransfer,
                        paidAmount1: finalPayHotel,
                        paidAmount2: finalPayTransfer,
                        initialPayHotel: finalPayHotel,
                        initialPayTransfer: finalPayTransfer,
                        paymentMethod: pm,
                        paymentStatus: dailyStatus,
                        source: form.channel === "Walk-in" ? "Walk-in" : "OTA",
                        status: form.bookingType === "Inquiry" ? "INQUIRY" : (form.bookingType === "Tentative / Hold" ? "HOLD" : "CONFIRMED"),
                        staffName: form.staffName,
                        note: form.note,
                        timestamp: new Date().toISOString(),
                        isCompliment: form.isCompliment,
                        complimentReason: form.isCompliment ? form.complimentReason : undefined,
                        complimentValue: form.isCompliment ? nightlyRate : undefined,
                        sendEmailVoucher: form.sendEmailVoucher,
                        enableGuestPortal: form.enableGuestPortal
                    });
                }
            });
        } else {
            const finalAmount = form.isCompliment ? 0 : Number(form.totalAmount);
            const finalCash = form.isCompliment ? 0 : rawCash;
            const finalEdc = form.isCompliment ? 0 : rawEdc;
            const finalQris = form.isCompliment ? 0 : rawQris;
            const finalTransfer = form.isCompliment ? 0 : rawTransfer;
            const finalOta = form.isCompliment ? 0 : rawOta;
            
            const finalPayHotel = finalCash + finalEdc + finalQris + finalTransfer;
            const finalPayTransfer = finalOta + finalTransfer;

            const totalPaid = finalCash + finalEdc + finalQris + finalTransfer + finalOta;
            const incomeBalance = Math.max(0, finalAmount - totalPaid);
            const incomeStatus = form.isCompliment ? "Lunas" : (incomeBalance === 0 ? "Lunas" : (totalPaid > 0 ? "DP / Partial" : "Belum Bayar"));

            let pm = "Cash";
            if (finalOta > 0 && finalPayHotel === 0) pm = "OTA Virtual / City Ledger";
            else if (finalEdc > 0 && finalCash === 0 && finalQris === 0 && finalTransfer === 0) pm = "EDC BCA / Mandiri";
            else if (finalQris > 0 && finalCash === 0 && finalEdc === 0 && finalTransfer === 0) pm = "QRIS Payment";
            else if (finalTransfer > 0 && finalCash === 0 && finalEdc === 0 && finalQris === 0) pm = "Bank Transfer";
            else if ([finalCash > 0, finalEdc > 0, finalQris > 0, finalTransfer > 0, finalOta > 0].filter(Boolean).length > 1) pm = "Split Payment";

            transactionEntries = [{
                type: "other_income",
                guestName: form.guestName, // This stores the description for other income
                incomeCategory: form.incomeType,
                note: form.note,
                staffName: form.staffName || "System",
                checkInDate: form.checkIn,
                checkOutDate: form.checkIn,
                amount: finalAmount,
                paidCash: finalCash,
                paidEdc: finalEdc,
                paidQris: finalQris,
                paidTransfer: finalTransfer,
                paidOta: finalOta,
                payHotel: finalPayHotel,
                payTransfer: finalPayTransfer,
                paidAmount1: finalPayHotel,
                paidAmount2: finalPayTransfer,
                initialPayHotel: finalPayHotel,
                initialPayTransfer: finalPayTransfer,
                paymentMethod: pm,
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
                const hotelId = activeHotelCode || (typeof window !== "undefined" ? localStorage.getItem("active_hotel_code") : null) || (user as any)?.hotelId || "";
                if (!hotelId || hotelId === "0") {
                    throw new Error("Hotel Code is missing or invalid. Action denied to prevent data contamination.");
                }
                const docId = `${hotelId}_${dateStr}`;
                const docRef = doc(getHotelCollection(db, "daily_revenue", hotelId), docId);
                const docSnap = await getDoc(docRef);
                const cleanedEntries = transactionEntries.map(e => cleanUndefined({
                    ...e,
                    hotelId: hotelId,
                    hotelCode: hotelId
                }));

                if (docSnap.exists()) {
                    await updateDoc(docRef, { 
                        entries: arrayUnion(...cleanedEntries),
                        date: dateStr,
                        hotelId: hotelId,
                        hotelCode: hotelId,
                        updatedAt: new Date().toISOString()
                    });
                } else {
                    await setDoc(docRef, { 
                        entries: cleanedEntries,
                        date: dateStr,
                        hotelId: hotelId,
                        hotelCode: hotelId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            }

            // Trigger background ARI sync to Channex for all affected stay dates if room transaction
            const hotelIdForSync = activeHotelCode || (typeof window !== "undefined" ? localStorage.getItem("active_hotel_code") : null) || (user as any)?.hotelId || "";
            const affectedDates = Object.keys(entriesByDate).sort();
            const hasRoomTx = finalEntries.some(e => e.type === "accommodation");
            if (hasRoomTx && affectedDates.length > 0 && hotelIdForSync) {
                try {
                    await fetch("/api/channex/sync-ari", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            hotelCode: hotelIdForSync,
                            startDate: affectedDates[0],
                            endDate: affectedDates[affectedDates.length - 1],
                            type: "availability"
                        })
                    });
                } catch (e) {
                    console.warn("[Channex Sync Trigger Warning]:", e);
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
    }, [form, queue, prepareEntries, handleCancel, revenueType, activeHotelCode]);

    const onSelectRatePlan = (ratePlanId: string) => {
        const plan = ratePlans.find(p => p.id === ratePlanId || p.code === ratePlanId);
        if (!plan) return;
        
        setSelectedRatePlanId(ratePlanId);
        setForm(prev => {
            const baseRate = plan.baseRate || 0;
            const newRates = Array(nights).fill(baseRate);
            const newRooms = [...prev.rooms];
            if (newRooms[0]) {
                newRooms[0] = {
                    ...newRooms[0],
                    roomTypeId: plan.roomTypeId || newRooms[0].roomTypeId,
                    price: baseRate.toString()
                };
            }
            return {
                ...prev,
                rateCode: plan.code || plan.name,
                nightRates: newRates,
                rooms: newRooms
            };
        });
        toast.info(`Paket ${plan.name} terpilih: Rp ${plan.baseRate.toLocaleString("id-ID")} / malam`);
    };

    const getAvailableRoomNumbers = useCallback((roomTypeId: string) => {
        const type = roomTypes.find(rt => rt.id === roomTypeId);
        if (!type) return [];
        const allPhysicalRooms = (type.physicalRooms || []).map((r: any) => {
            if (!r) return "";
            if (typeof r === "string") return r;
            return r.number || r.name || "";
        }).filter(Boolean);

        // Pad with generic room numbers up to allotment if empty or less than allotment
        const allotment = parseInt(type.roomCount) || parseInt(type.totalRooms) || parseInt(type.allotment) || parseInt(type.count_of_rooms) || (type.physicalRooms && type.physicalRooms.length > 0 ? type.physicalRooms.length : 0) || 4;
        let genericCounter = 1;
        while (allPhysicalRooms.length < allotment) {
            let newNumber = `${genericCounter}`;
            while (allPhysicalRooms.includes(newNumber)) {
                genericCounter++;
                newNumber = `${genericCounter}`;
            }
            allPhysicalRooms.push(newNumber);
        }
        
        if (!form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) {
            return allPhysicalRooms;
        }

        const startD = new Date(form.checkIn);
        const endD = new Date(form.checkOut);

        const occupiedRooms = new Set<string>();
        
        for (let d = new Date(startD); d < endD; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            
            occupancy.forEach(e => {
                const statusUpper = e.status?.toUpperCase();
                const paymentStatusUpper = e.paymentStatus?.toUpperCase();
                const isCancelled = statusUpper === 'CANCELLED' || 
                                    statusUpper === 'CANCEL' || 
                                    paymentStatusUpper === 'CANCELLED' || 
                                    paymentStatusUpper === 'CANCEL' ||
                                    statusUpper === 'VOID' ||
                                    statusUpper === 'VOIDED' ||
                                    e.isHidden;
                if (e.type !== 'accommodation' || isCancelled) return;
                const isMatch = (e.roomTypeId && e.roomTypeId === type.id) || 
                                (e.roomType && type.name && e.roomType.toLowerCase() === type.name.toLowerCase());
                if (!isMatch) return;
                
                let isOccupiedOnDate = false;
                if (e.checkInDate && e.checkOutDate) {
                    isOccupiedOnDate = (dateStr >= e.checkInDate && dateStr < e.checkOutDate);
                } else if (e.effectiveDate) {
                    isOccupiedOnDate = (e.effectiveDate === dateStr);
                }

                if (isOccupiedOnDate && e.roomNumber) {
                    occupiedRooms.add(e.roomNumber.toString().toUpperCase().trim());
                }
            });

            queue.forEach(item => {
                const statusUpper = item.status?.toUpperCase();
                const paymentStatusUpper = item.paymentStatus?.toUpperCase();
                const isCancelled = statusUpper === 'CANCELLED' || 
                                    statusUpper === 'CANCEL' || 
                                    paymentStatusUpper === 'CANCELLED' || 
                                    paymentStatusUpper === 'CANCEL' ||
                                    statusUpper === 'VOID' ||
                                    statusUpper === 'VOIDED' ||
                                    item.isHidden;
                if (item.type !== 'accommodation' || isCancelled) return;
                const isMatch = (item.roomTypeId && item.roomTypeId === type.id) || 
                                (item.roomType && type.name && item.roomType.toLowerCase() === type.name.toLowerCase());
                if (!isMatch) return;
                
                let isOccupiedOnDate = false;
                if (item.checkInDate && item.checkOutDate) {
                    isOccupiedOnDate = (dateStr >= item.checkInDate && dateStr < item.checkOutDate);
                } else if (item.effectiveDate) {
                    isOccupiedOnDate = (item.effectiveDate === dateStr);
                }

                if (isOccupiedOnDate && item.roomNumber) {
                    occupiedRooms.add(item.roomNumber.toString().toUpperCase().trim());
                }
            });
        }

        return allPhysicalRooms.filter((r: string) => !occupiedRooms.has(r.toString().toUpperCase().trim()));
    }, [form.checkIn, form.checkOut, roomTypes, occupancy, queue]);

    const updateForm = (field: string, value: any) => {
        let finalValue = value;
        if (["paidCash", "paidEdc", "paidQris", "paidTransfer", "paidOta", "payHotel", "payTransfer", "totalAmount"].includes(field)) {
            const num = Number(value);
            if (!isNaN(num) && num < 0) {
                finalValue = 0;
            }
        }

        if (field === "bookAllAvailable") {
            const isChecked = !!value;
            setForm(prev => {
                if (isChecked && roomTypes.length > 0) {
                    const allRooms: any[] = [];
                    roomTypes.forEach((rt: any) => {
                        const availableNumbers = getAvailableRoomNumbers(rt.id);
                        const plansForType = ratePlans.filter((p: any) => 
                            (p.roomTypeId && p.roomTypeId === rt.id) ||
                            (!p.roomTypeId && p.name?.toLowerCase().includes(rt.name?.toLowerCase())) ||
                            (rt.name && p.name?.toLowerCase().includes(rt.name?.toLowerCase())) ||
                            (rt.name && rt.name?.toLowerCase().includes(p.name?.toLowerCase()))
                        );
                        const usablePlans = plansForType.length > 0 ? plansForType : ratePlans;
                        const totalAllotment = parseInt(rt.roomCount) || parseInt(rt.totalRooms) || parseInt(rt.allotment) || parseInt(rt.count_of_rooms) || (rt.physicalRooms && rt.physicalRooms.length > 0 ? rt.physicalRooms.length : 0) || 4;
                        const count = availableNumbers.length > 0 ? availableNumbers.length : totalAllotment;

                        for (let i = 0; i < count; i++) {
                            const matchedPlan = usablePlans.length > 0 ? usablePlans[i % usablePlans.length] : null;
                            const rate = matchedPlan?.baseRate || rt.basePrice || rt.price || 650000;
                            const roomNum = availableNumbers[i] || (i + 1).toString();
                            allRooms.push({
                                roomTypeId: rt.id,
                                roomNumber: roomNum,
                                ratePlanId: matchedPlan?.id || matchedPlan?.code || "",
                                rateCode: matchedPlan?.code || matchedPlan?.name || rt.code || "-",
                                adults: 1,
                                children: 0,
                                price: rate.toString()
                            });
                        }
                    });

                    if (allRooms.length === 0) {
                        toast.warning("Tidak ada kamar yang tersedia");
                        return { ...prev, bookAllAvailable: false };
                    }

                    return {
                        ...prev,
                        bookAllAvailable: true,
                        rooms: allRooms,
                        roomCount: allRooms.length
                    };
                } else if (!isChecked) {
                    const defaultType = roomTypes[0]?.id || "";
                    const plansForType = ratePlans.filter((p: any) => 
                        (p.roomTypeId && p.roomTypeId === defaultType) ||
                        (!p.roomTypeId && p.name?.toLowerCase().includes(roomTypes[0]?.name?.toLowerCase()))
                    );
                    const matchedPlan = plansForType[0] || ratePlans[0] || null;
                    const defaultRate = matchedPlan?.baseRate || roomTypes[0]?.basePrice || roomTypes[0]?.price || 650000;
                    return {
                        ...prev,
                        bookAllAvailable: false,
                        rooms: [{
                            roomTypeId: defaultType,
                            roomNumber: "",
                            ratePlanId: matchedPlan?.id || matchedPlan?.code || "",
                            rateCode: matchedPlan?.code || matchedPlan?.name || "-",
                            adults: 1,
                            children: 0,
                            price: defaultRate.toString()
                        }],
                        roomCount: 1
                    };
                }
                return { ...prev, bookAllAvailable: isChecked };
            });
            return;
        }

        setForm(prev => ({ ...prev, [field]: finalValue }));
    };

    return {
        form,
        roomTypes,
        ratePlans,
        selectedRatePlanId,
        onSelectRatePlan,
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
        getAvailableRoomNumbers,
        router,
        handleCancel,
        queue,
        addToQueue,
        removeFromQueue,
        commitTransactions
    };
};

