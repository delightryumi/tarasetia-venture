"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { ConfirmationLetter, HotelBranding, RoomLineItem, MeetingPackageItem, ExtraChargeItem, ConfirmationLetterStatus } from "./ConfirmationLetterTypes";
import { toast } from "sonner";

const DEFAULT_TNC = [
    "Jaminan & Konfirmasi: Pemesanan mengikat resmi setelah lembar konfirmasi ditandatangani dan dicap dinas/perusahaan dengan SPK asli.",
    "Waktu CI & CO: Waktu check-in resmi pukul 14:00 WIB dan check-out pukul 12:00 WIB. Early CI / Late CO sesuai ketersediaan.",
    "Rooming List & Deposit: Diserahkan selambatnya pada tanggal cut-off. Jaminan deposit insidential Rp 200.000/kamar saat check-in.",
    "Pembatalan (Cancellation): Pembatalan H-7 dikenakan penalti 50%, pembatalan H-3 atau No-Show dikenakan biaya penuh 100%."
];

export interface AvailableRoomType {
    id: string;
    name: string;
    basePrice: number;
    bedType: string;
    beds?: any[];
    capacity?: number;
}

export const useConfirmationLetter = () => {
    const { activeHotelCode, activeHotelName } = useAuth();
    const hotelId = activeHotelCode || (typeof window !== "undefined" ? localStorage.getItem("active_hotel_code") : null) || "1";

    const [letters, setLetters] = useState<ConfirmationLetter[]>([]);
    const [activeTab, setActiveTab] = useState<"list" | "editor">("list");
    const [selectedLetter, setSelectedLetter] = useState<ConfirmationLetter | null>(null);
    const [loading, setLoading] = useState(true);
    const [availableRoomTypes, setAvailableRoomTypes] = useState<AvailableRoomType[]>([]);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);

    // Hotel Branding State
    const [branding, setBranding] = useState<HotelBranding>({
        name: activeHotelName || "Hotel Partner",
        address: "",
        phone: "",
        email: "",
        website: "",
        starRating: 4,
        logoUrl: "",
        bankName: "BCA",
        bankAccountName: "",
        bankAccountNumber: ""
    });

    // Form State for creating/editing
    const getInitialLetter = useCallback((): ConfirmationLetter => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const cutOff = new Date(today);
        cutOff.setDate(cutOff.getDate() + 3);

        const todayStr = today.toISOString().split("T")[0];
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        const cutOffStr = cutOff.toISOString().split("T")[0];

        const seq = String(letters.length + 1).padStart(3, "0");
        const letterNum = `CL/${hotelId}/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${seq}`;

        const initialRooms: RoomLineItem[] = availableRoomTypes && availableRoomTypes.length > 0 ? [
            {
                id: "room_1",
                roomTypeId: availableRoomTypes[0].id || "",
                roomTypeName: availableRoomTypes[0].name || "",
                roomCount: 1,
                quantity: 1,
                nights: 1,
                occupancyType: "Single",
                bedType: availableRoomTypes[0].bedType || "King Bed (180 x 200)",
                mealPlan: "BB",
                ratePerNight: Number(availableRoomTypes[0].basePrice) || 0,
                nightlyRate: Number(availableRoomTypes[0].basePrice) || 0,
                includesBreakfast: true,
                breakfastPax: 2,
                inclusions: "Termasuk Sarapan Pagi Buffet, Free Wi-Fi",
                subtotal: Number(availableRoomTypes[0].basePrice) || 0,
                totalAmount: Number(availableRoomTypes[0].basePrice) || 0
            }
        ] : [];

        const initialSubtotal = initialRooms.reduce((acc, r) => acc + (r.subtotal || 0), 0);

        return {
            hotelId: hotelId || "1",
            letterNumber: letterNum,
            letterDate: todayStr,
            status: "DRAFT",
            guaranteeStatus: "GUARANTEED",
            clientType: "CORPORATE",
            clientName: "",
            clientAddress: "",
            contactPerson: "",
            picName: "",
            picTitle: "",
            contactPhone: "",
            picPhone: "",
            phone: "",
            contactEmail: "",
            picEmail: "",
            email: "",
            npwp: "",
            spkNumber: "",
            eventName: "",
            checkInDate: todayStr,
            checkInTime: "14:00 WIB",
            checkOutDate: tomorrowStr,
            checkOutTime: "12:00 WIB",
            cutOffDate: cutOffStr,
            roomingListCutOff: cutOffStr,
            roomingListCutOffDate: cutOffStr,
            incidentalDepositPerRoom: 200000,
            incidentalDepositPolicy: "Rp 300.000 / Kamar / Malam",
            totalNights: 1,
            totalPax: 2,
            totalGuests: 2,
            rooms: initialRooms,
            meetingPackages: [],
            extraCharges: [],
            paymentTerms: {
                billingArrangement: "Bill to Company (BTC)",
                method: "Bill to Company (BTC)",
                masterAccountBilling: "Sewa Kamar & Paket Rapat (All Room & Banquet Charges) ditagihkan ke Rekening Instansi (Master Account BTC).",
                personalIncidentalBilling: "Pengeluaran pribadi tamu (Minibar, Laundry, Room Service, Telepon) dibayar langsung oleh masing-masing tamu saat check-out.",
                depositAmount: 0,
                depositDueDate: "",
                balanceDueDate: todayStr,
                bankName: branding.bankName || "",
                bankAccountName: branding.bankAccountName || branding.name || "",
                bankAccountNumber: branding.bankAccountNumber || "",
                billingNotes: "Faktur tagihan resmi (Invoice) beserta kelengkapan berkas SPK asli dan kuitansi bermaterai akan dikirimkan kepada bagian keuangan instansi."
            },
            termsAndConditions: DEFAULT_TNC,
            hotelSignatory: {
                name: "Director of Sales & Marketing",
                title: "Director of Sales & Marketing",
                phone: branding.phone || "",
                email: branding.email || ""
            },
            signatoryHotel: {
                name: "Director of Sales & Marketing",
                title: "Director of Sales & Marketing",
                phone: branding.phone || "",
                email: branding.email || ""
            },
            clientSignatory: {
                name: "",
                title: "Pejabat Pembuat Komitmen (PPK) / Authorized Corporate Officer"
            },
            signatoryClient: {
                name: "",
                title: "Pejabat Pembuat Komitmen (PPK) / Authorized Corporate Officer"
            },
            taxRate: 0,
            serviceRate: 0,
            subtotal: initialSubtotal,
            taxAmount: 0,
            serviceAmount: 0,
            grandTotal: initialSubtotal,
            notes: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }, [hotelId, letters.length, availableRoomTypes, branding]);

    const [formData, setFormData] = useState<ConfirmationLetter>(() => getInitialLetter());

    // 1. Fetch Hotel info & branding from CPanel settings and hotel document
    useEffect(() => {
        if (!hotelId) return;
        const fetchHotelData = async () => {
            try {
                const landingRef = doc(getHotelCollection(db, "settings", hotelId), "landingPage");
                const footerRef = doc(getHotelCollection(db, "settings", hotelId), "footer");
                const bankRef = doc(getHotelCollection(db, "settings", hotelId), "bankDetails");
                const hotelRef = doc(db, "hotels", hotelId);

                const [landingSnap, footerSnap, bankSnap, hotelSnap] = await Promise.all([
                    getDoc(landingRef).catch(() => null),
                    getDoc(footerRef).catch(() => null),
                    getDoc(bankRef).catch(() => null),
                    getDoc(hotelRef).catch(() => null)
                ]);

                const landingData = landingSnap && landingSnap.exists() ? (landingSnap.data() as any) : {};
                const footerData = footerSnap && footerSnap.exists() ? (footerSnap.data() as any) : {};
                const bankData = bankSnap && bankSnap.exists() ? (bankSnap.data() as any) : {};
                const d = hotelSnap && hotelSnap.exists() ? (hotelSnap.data() as any) : {};

                // Extract property logo from CPanel settings (lightLogo preferred for white A4 paper)
                const rawLogoUrl = landingData.lightLogo || landingData.darkLogo || landingData.logoUrl || d.logo || d.logoUrl || "";
                const logoUrlWithTs = rawLogoUrl ? `${rawLogoUrl}${rawLogoUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : "";

                // Convert image to Base64 to ensure reliable rendering in print without CORS issues
                const getBase64Image = async (url: string): Promise<string> => {
                    if (!url) return "";
                    try {
                        const response = await fetch(url, { mode: 'cors' });
                        const blob = await response.blob();
                        return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                    } catch (e) {
                        return url;
                    }
                };

                const logoBase64 = logoUrlWithTs ? await getBase64Image(logoUrlWithTs) : "";
                const effectiveLogo = logoBase64 || logoUrlWithTs || rawLogoUrl;

                const loadedBankName = d.bankDetails?.bankName || bankData.bankName || d.bankName || "BCA";
                const loadedBankAccountName = d.bankDetails?.accountName || bankData.accountName || d.bankAccountName || d.name || d.property_name || "";
                const loadedBankAccountNumber = d.bankDetails?.accountNumber || bankData.accountNumber || d.bankAccountNumber || "";

                setBranding(prev => ({
                    ...prev,
                    name: d.name || d.property_name || prev.name,
                    address: d.address || footerData.address || prev.address,
                    phone: d.phone || d.contactPhone || (footerData.phones && footerData.phones[0]) || prev.phone,
                    email: d.email || footerData.email || prev.email,
                    website: d.website || footerData.website || prev.website,
                    logoUrl: effectiveLogo,
                    lightLogo: landingData.lightLogo || effectiveLogo,
                    darkLogo: landingData.darkLogo || effectiveLogo,
                    logoLight: landingData.lightLogo || effectiveLogo,
                    logoDark: landingData.darkLogo || effectiveLogo,
                    logo: rawLogoUrl,
                    bankName: loadedBankName || prev.bankName,
                    bankAccountName: loadedBankAccountName || prev.bankAccountName,
                    bankAccountNumber: loadedBankAccountNumber || prev.bankAccountNumber
                }));

                // Auto-sync real hotel payment bank details into form data if currently empty
                setFormData(prev => ({
                    ...prev,
                    paymentTerms: {
                        ...prev.paymentTerms,
                        bankName: prev.paymentTerms?.bankName || loadedBankName || "BCA",
                        bankAccountName: prev.paymentTerms?.bankAccountName || loadedBankAccountName || d.name || "",
                        bankAccountNumber: prev.paymentTerms?.bankAccountNumber || loadedBankAccountNumber || ""
                    },
                    hotelSignatory: {
                        name: prev.hotelSignatory?.name || "Director of Sales & Marketing",
                        title: prev.hotelSignatory?.title || "Director of Sales & Marketing",
                        phone: prev.hotelSignatory?.phone || d.phone || d.contactPhone || (footerData.phones && footerData.phones[0]) || "",
                        email: prev.hotelSignatory?.email || d.email || footerData.email || ""
                    },
                    signatoryHotel: {
                        name: prev.signatoryHotel?.name || "Director of Sales & Marketing",
                        title: prev.signatoryHotel?.title || "Director of Sales & Marketing",
                        phone: prev.signatoryHotel?.phone || d.phone || d.contactPhone || (footerData.phones && footerData.phones[0]) || "",
                        email: prev.signatoryHotel?.email || d.email || footerData.email || ""
                    }
                }));
            } catch (err) {
                console.warn("Failed to load hotel branding:", err);
            }
        };
        fetchHotelData();
    }, [hotelId]);

    // 2. Fetch Room Types
    useEffect(() => {
        if (!hotelId) return;
        const fetchRoomTypes = async () => {
            try {
                const snap = await getDocs(getHotelCollection(db, "roomTypes", hotelId));
                const list: AvailableRoomType[] = snap.docs.map(d => {
                    const data = d.data();
                    let bedDescription = "";
                    if (Array.isArray(data.beds) && data.beds.length > 0) {
                        bedDescription = data.beds.map((b: any) => {
                            const qtyStr = b.quantity > 1 ? `${b.quantity}x ` : "";
                            const sizeStr = b.size ? ` (${b.size})` : "";
                            return `${qtyStr}${b.type || 'Bed'}${sizeStr}`;
                        }).join(" + ");
                    } else if (data.bedType) {
                        bedDescription = data.bedType;
                    } else {
                        bedDescription = "King Bed (180 x 200)";
                    }

                    return {
                        id: d.id,
                        name: data.name || d.id,
                        basePrice: Number(data.basePrice || data.price || 500000),
                        bedType: bedDescription,
                        beds: data.beds || [],
                        capacity: Number(data.capacity) || 2
                    };
                });
                setAvailableRoomTypes(list);

                if (list.length > 0) {
                    setFormData(prev => {
                        if (!prev.rooms || prev.rooms.length === 0) {
                            const first = list[0];
                            const defaultRoom: RoomLineItem = {
                                roomTypeId: first.id,
                                roomTypeName: first.name,
                                roomCount: 1,
                                quantity: 1,
                                nights: 1,
                                bedType: first.bedType || "King Bed (180 x 200)",
                                occupancyType: "Single",
                                mealPlan: "BB",
                                ratePerNight: Number(first.basePrice) || 0,
                                nightlyRate: Number(first.basePrice) || 0,
                                includesBreakfast: true,
                                breakfastPax: 2,
                                inclusions: "Termasuk Sarapan Pagi Buffet, Free Wi-Fi",
                                subtotal: Number(first.basePrice) || 0,
                                totalAmount: Number(first.basePrice) || 0
                            };
                            return {
                                ...prev,
                                rooms: [defaultRoom],
                                subtotal: defaultRoom.subtotal,
                                totalAmount: defaultRoom.subtotal,
                                grandTotal: defaultRoom.subtotal,
                                balanceDue: defaultRoom.subtotal
                            };
                        }
                        return prev;
                    });
                }
            } catch (err) {
                console.warn("Failed to load room types:", err);
            }
        };
        fetchRoomTypes();
    }, [hotelId]);

    // 3. Real-time subscribe to Confirmation Letters in Firestore
    useEffect(() => {
        if (!hotelId) {
            setLoading(false);
            return;
        }

        const lettersCol = collection(db, `hotels/${hotelId}/confirmation_letters`);
        const q = query(lettersCol, orderBy("createdAt", "desc"));

        const unsub = onSnapshot(q, (snapshot) => {
            const list: ConfirmationLetter[] = [];
            snapshot.forEach(docSnap => {
                list.push({ id: docSnap.id, ...(docSnap.data() as ConfirmationLetter) });
            });
            setLetters(list);
            setLoading(false);
        }, (err) => {
            console.error("Error loading confirmation letters:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [hotelId]);

    // 4. Fetch recent bookings from daily_revenue for fast import
    useEffect(() => {
        if (!hotelId) return;
        const fetchRecentBookings = async () => {
            try {
                const snap = await getDocs(getHotelCollection(db, "daily_revenue", hotelId));
                const allEntries: any[] = [];
                snap.docs.forEach(d => {
                    const data = d.data();
                    (data.entries || []).forEach((e: any) => {
                        if (e.guestName && e.type !== "other_income" && e.status !== "CANCELLED" && e.status !== "VOID") {
                            allEntries.push({
                                ...e,
                                date: data.date
                            });
                        }
                    });
                });
                setRecentBookings(allEntries.slice(0, 30));
            } catch (err) {
                console.warn("Failed to load recent bookings for CL import:", err);
            }
        };
        fetchRecentBookings();
    }, [hotelId]);

    // Recalculate Totals whenever rooms, packages, extraCharges, tax, service change
    const updateCalculations = useCallback((currentForm: ConfirmationLetter): ConfirmationLetter => {
        const nights = Math.max(1, currentForm.totalNights || 1);

        // Room subtotal & field sync
        const updatedRooms: RoomLineItem[] = (currentForm.rooms || []).map(r => {
            const qty = Number(r.roomCount) || Number(r.quantity) || 1;
            const rate = Number(r.ratePerNight) || Number(r.nightlyRate) || 0;
            const itemNights = Number(r.nights) || nights;
            const total = qty * rate * itemNights;
            return {
                ...r,
                roomCount: qty,
                quantity: qty,
                ratePerNight: rate,
                nightlyRate: rate,
                nights: itemNights,
                subtotal: total,
                totalAmount: total
            };
        });
        const roomTotal = updatedRooms.reduce((acc, r) => acc + (r.subtotal || r.totalAmount || 0), 0);

        // Meeting packages subtotal & field sync
        const updatedMeetingPackages: MeetingPackageItem[] = (currentForm.meetingPackages || []).map(mp => {
            const pax = Number(mp.pax) || 1;
            const days = Number(mp.days) || 1;
            const rate = Number(mp.ratePerPax) || 0;
            const pkgName = mp.packageName || mp.name || "Meeting Package";
            const total = pax * days * rate;
            return {
                ...mp,
                packageName: pkgName,
                name: pkgName,
                pax,
                days,
                ratePerPax: rate,
                subtotal: total,
                totalAmount: total
            };
        });
        const meetingTotal = updatedMeetingPackages.reduce((acc, mp) => acc + (mp.subtotal || mp.totalAmount || 0), 0);

        // Extra charges
        const extraTotal = (currentForm.extraCharges || []).reduce((acc, ec) => acc + (Number(ec.amount) || 0), 0);

        const subtotal = roomTotal + meetingTotal + extraTotal;
        const taxRate = Number(currentForm.taxRate) || 0;
        const serviceRate = Number(currentForm.serviceRate) || 0;

        const taxAmount = Math.round(subtotal * (taxRate / 100));
        const serviceAmount = Math.round(subtotal * (serviceRate / 100));
        const grandTotal = subtotal + taxAmount + serviceAmount;

        // Sync signatories and contact aliases
        const hotelSig = currentForm.signatoryHotel || currentForm.hotelSignatory || { name: "Sales / Front Office Manager", title: "Sales & Marketing" };
        const clientSig = currentForm.signatoryClient || currentForm.clientSignatory || { name: "", title: "" };
        const pic = currentForm.contactPerson || currentForm.picName || "";
        const phone = currentForm.contactPhone || currentForm.picPhone || "";
        const email = currentForm.contactEmail || currentForm.picEmail || "";

        return {
            ...currentForm,
            contactPerson: pic,
            picName: pic,
            contactPhone: phone,
            picPhone: phone,
            contactEmail: email,
            picEmail: email,
            signatoryHotel: hotelSig,
            hotelSignatory: hotelSig,
            signatoryClient: clientSig,
            clientSignatory: clientSig,
            rooms: updatedRooms,
            meetingPackages: updatedMeetingPackages,
            subtotal,
            taxAmount,
            serviceAmount,
            grandTotal
        };
    }, []);

    // Change field handler
    const updateFormField = (field: string, value: any) => {
        setFormData(prev => {
            const updated: any = { ...prev, [field]: value };

            if (field === "phone") {
                updated.contactPhone = value;
                updated.picPhone = value;
            }
            if (field === "email") {
                updated.contactEmail = value;
                updated.picEmail = value;
            }
            if (field === "contactPhone") updated.phone = value;
            if (field === "contactEmail") updated.email = value;
            if (field === "totalGuests") updated.totalPax = value;
            if (field === "totalPax") updated.totalGuests = value;
            if (field === "roomingListCutOffDate") {
                updated.roomingListCutOff = value;
                updated.cutOffDate = value;
            }
            if (field === "roomingListCutOff") updated.roomingListCutOffDate = value;

            // Calculate nights if dates change
            if (field === "checkInDate" || field === "checkOutDate") {
                const cIn = new Date(field === "checkInDate" ? value : prev.checkInDate);
                const cOut = new Date(field === "checkOutDate" ? value : prev.checkOutDate);
                const diffTime = cOut.getTime() - cIn.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                updated.totalNights = Math.max(1, isNaN(diffDays) ? 1 : diffDays);
            }

            return updateCalculations(updated);
        });
    };

    // Room item actions
    const addRoomItem = () => {
        const first = availableRoomTypes[0];
        const nights = formData.totalNights || 1;
        const rate = first ? first.basePrice : 500000;
        const newRoom: RoomLineItem = {
            id: `room_${Date.now()}`,
            roomTypeId: first ? first.id : "",
            roomTypeName: first ? first.name : "Deluxe Room",
            roomCount: 1,
            quantity: 1,
            nights: nights,
            occupancyType: "Single",
            bedType: first ? first.bedType : "King Bed (180 x 200)",
            mealPlan: "BB",
            ratePerNight: rate,
            nightlyRate: rate,
            includesBreakfast: true,
            breakfastPax: 2,
            inclusions: "Termasuk Sarapan Pagi Buffet, Free Wi-Fi",
            subtotal: rate * nights,
            totalAmount: rate * nights
        };
        setFormData(prev => updateCalculations({ ...prev, rooms: [...prev.rooms, newRoom] }));
    };

    const removeRoomItem = (idOrIndex: string | number) => {
        if (formData.rooms.length <= 1) {
            toast.error("Minimal harus ada 1 kamar.");
            return;
        }
        setFormData(prev => {
            const filtered = prev.rooms.filter((r, idx) => r.id !== idOrIndex && idx !== idOrIndex);
            return updateCalculations({ ...prev, rooms: filtered });
        });
    };

    const updateRoomItem = (idOrIndex: string | number, field: string, val: any) => {
        setFormData(prev => {
            const updatedRooms = prev.rooms.map((r, idx) => {
                if (r.id === idOrIndex || idx === idOrIndex) {
                    const u = { ...r, [field]: val };
                    if (field === "roomTypeId") {
                        const matched = availableRoomTypes.find(rt => rt.id === val);
                        if (matched) {
                            u.roomTypeName = matched.name;
                            u.bedType = matched.bedType || "King Bed (180 x 200)";
                            u.ratePerNight = matched.basePrice;
                            u.nightlyRate = matched.basePrice;
                            const qty = u.roomCount || u.quantity || 1;
                            const nights = u.nights || prev.totalNights || 1;
                            u.subtotal = qty * nights * matched.basePrice;
                            u.totalAmount = u.subtotal;
                        }
                    }
                    if (field === "roomCount") u.quantity = val;
                    if (field === "quantity") u.roomCount = val;
                    if (field === "ratePerNight") u.nightlyRate = val;
                    if (field === "nightlyRate") u.ratePerNight = val;
                    return u;
                }
                return r;
            });
            return updateCalculations({ ...prev, rooms: updatedRooms });
        });
    };

    // Meeting package actions
    const addMeetingPackage = () => {
        const newMp: MeetingPackageItem = {
            id: `mp_${Date.now()}`,
            packageName: "Fullboard Meeting Package",
            name: "Fullboard Meeting Package",
            roomName: "Meeting Room 1",
            pax: 20,
            days: 1,
            ratePerPax: 350000,
            inclusions: "2x Coffee Break, 1x Lunch, 1x Dinner, Sound System, Proyektor LCD, Memo & Pensil",
            subtotal: 20 * 350000,
            totalAmount: 20 * 350000
        };
        setFormData(prev => updateCalculations({ ...prev, meetingPackages: [...prev.meetingPackages, newMp] }));
    };

    const removeMeetingPackage = (idOrIndex: string | number) => {
        setFormData(prev => {
            const filtered = prev.meetingPackages.filter((m, idx) => m.id !== idOrIndex && idx !== idOrIndex);
            return updateCalculations({ ...prev, meetingPackages: filtered });
        });
    };

    const updateMeetingPackage = (idOrIndex: string | number, field: string, val: any) => {
        setFormData(prev => {
            const updatedMp = prev.meetingPackages.map((m, idx) => {
                if (m.id === idOrIndex || idx === idOrIndex) {
                    const u = { ...m, [field]: val };
                    if (field === "packageName") u.name = val;
                    if (field === "name") u.packageName = val;
                    return u;
                }
                return m;
            });
            return updateCalculations({ ...prev, meetingPackages: updatedMp });
        });
    };

    // Import from booking
    const importFromBooking = (booking: any) => {
        const cIn = booking.checkInDate || booking.date;
        const cOut = booking.checkOutDate || booking.date;
        const cInD = new Date(cIn);
        const cOutD = new Date(cOut);
        const diffDays = Math.max(1, Math.ceil((cOutD.getTime() - cInD.getTime()) / (1000 * 60 * 60 * 24)));

        setFormData(prev => {
            const updated: ConfirmationLetter = {
                ...prev,
                clientName: booking.company && booking.company !== "-" ? booking.company : booking.guestName,
                contactPerson: booking.guestName || "",
                contactPhone: booking.phone || "",
                contactEmail: booking.email || "",
                checkInDate: cIn,
                checkOutDate: cOut,
                totalNights: isNaN(diffDays) ? 1 : diffDays,
                eventName: `Reservasi Rombongan - ${booking.guestName}`,
                rooms: [
                    {
                        id: `room_${Date.now()}`,
                        roomTypeId: booking.roomTypeId || availableRoomTypes[0]?.id || "",
                        roomTypeName: booking.roomType || availableRoomTypes[0]?.name || "Standard Room",
                        roomCount: Number(booking.roomCount) || 1,
                        quantity: Number(booking.roomCount) || 1,
                        nights: isNaN(diffDays) ? 1 : diffDays,
                        occupancyType: "Double",
                        bedType: "King Bed",
                        ratePerNight: Number(booking.amount) || availableRoomTypes[0]?.basePrice || 500000,
                        nightlyRate: Number(booking.amount) || availableRoomTypes[0]?.basePrice || 500000,
                        includesBreakfast: true,
                        breakfastPax: 2,
                        inclusions: "Termasuk Sarapan Pagi, Free Wi-Fi",
                        subtotal: (Number(booking.amount) || 500000) * (isNaN(diffDays) ? 1 : diffDays),
                        totalAmount: (Number(booking.amount) || 500000) * (isNaN(diffDays) ? 1 : diffDays)
                    }
                ]
            };
            return updateCalculations(updated);
        });
        toast.success(`Data reservasi ${booking.guestName} berhasil diimpor ke Confirmation Letter!`);
    };

    // Save to Firestore (Create / Update)
    const saveLetter = async (statusOverride?: ConfirmationLetterStatus) => {
        try {
            const letterToSave: ConfirmationLetter = {
                ...formData,
                hotelId,
                status: statusOverride || formData.status || "DRAFT",
                updatedAt: new Date().toISOString()
            };

            const docId = letterToSave.id || `cl_${Date.now()}`;
            letterToSave.id = docId;

            const docRef = doc(db, `hotels/${hotelId}/confirmation_letters`, docId);
            await setDoc(docRef, letterToSave, { merge: true });

            toast.success(`Confirmation Letter ${letterToSave.letterNumber} berhasil disimpan!`);
            setSelectedLetter(letterToSave);
            setFormData(letterToSave);
            setActiveTab("list");
        } catch (err) {
            console.error("Failed to save confirmation letter:", err);
            toast.error("Gagal menyimpan Confirmation Letter.");
        }
    };

    // Delete letter
    const deleteLetter = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus Confirmation Letter ini?")) return;
        try {
            await deleteDoc(doc(db, `hotels/${hotelId}/confirmation_letters`, id));
            toast.success("Confirmation Letter berhasil dihapus.");
            if (formData.id === id) {
                setFormData(getInitialLetter());
            }
        } catch (err) {
            console.error("Failed to delete letter:", err);
            toast.error("Gagal menghapus dokumen.");
        }
    };

    // Open for edit
    const openForEdit = (letter: ConfirmationLetter) => {
        setFormData(updateCalculations(letter));
        setSelectedLetter(letter);
        setActiveTab("editor");
    };

    // Create fresh
    const openCreateNew = () => {
        const fresh = getInitialLetter();
        setFormData(updateCalculations(fresh));
        setSelectedLetter(null);
        setActiveTab("editor");
    };

    // Save hotel bank details permanently to CPanel/hotel settings
    const saveHotelBankDetails = async (bankName: string, accountName: string, accountNumber: string) => {
        if (!hotelId) return { success: false, error: "Hotel ID tidak ditemukan" };
        try {
            const hotelRef = doc(db, "hotels", hotelId);
            const settingsBankRef = doc(getHotelCollection(db, "settings", hotelId), "bankDetails");

            const bankPayload = {
                bankName,
                accountName,
                accountNumber,
                updatedAt: new Date().toISOString()
            };

            await Promise.all([
                setDoc(hotelRef, { bankDetails: bankPayload }, { merge: true }).catch(() => null),
                setDoc(settingsBankRef, bankPayload, { merge: true }).catch(() => null)
            ]);

            setBranding(prev => ({
                ...prev,
                bankName,
                bankAccountName: accountName,
                bankAccountNumber: accountNumber
            }));
            toast.success("Detail bank hotel berhasil disimpan sebagai pengaturan permanen!");
            return { success: true };
        } catch (err: any) {
            console.error("Gagal menyimpan bank hotel:", err);
            toast.error("Gagal menyimpan pengaturan bank hotel.");
            return { success: false, error: err.message };
        }
    };

    return {
        letters,
        loading,
        activeTab,
        setActiveTab,
        formData,
        branding,
        availableRoomTypes,
        recentBookings,
        updateFormField,
        addRoomItem,
        removeRoomItem,
        updateRoomItem,
        addMeetingPackage,
        removeMeetingPackage,
        updateMeetingPackage,
        importFromBooking,
        saveLetter,
        deleteLetter,
        openForEdit,
        openCreateNew,
        saveHotelBankDetails
    };
};
