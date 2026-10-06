import { doc, getDoc, getDocs, collection, query, orderBy, where, addDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BookingGuestDetails {
    fullName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    country?: string;
    specialRequests?: string;
    estimatedArrivalTime?: string;
}

export interface SelectedRoomCartItem {
    roomTypeId: string;
    roomTypeName: string;
    ratePlanId: string;
    ratePlanName: string;
    mealsIncluded?: boolean;
    pricePerNight: number;
    quantity: number;
    subtotal: number;
}

export interface PublicAddOnItem {
    id: string;
    name: string;
    description: string;
    price: number;
    priceType: "per_night" | "per_stay" | "per_person";
    icon?: string;
    category?: string;
}

export interface SelectedAddOnCartItem {
    id: string;
    name: string;
    price: number;
    priceType: "per_night" | "per_stay" | "per_person";
    quantity: number;
    subtotal: number;
}

export interface RatePlanCancellationPolicy {
    type: "free_cancellation" | "non_refundable" | "flexible";
    title: string;
    description: string;
    deadlineHours?: number;
}

export interface BookingSelection {
    roomTypeId: string;
    roomTypeName: string;
    ratePlanId: string;
    ratePlanName: string;
    nights: number;
    roomsCount: number;
    pricePerNight: number;
    baseTotal: number;
    taxAmount: number;
    serviceAmount: number;
    grandTotal: number;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    children: number;
    promoCode?: string;
    discountAmount?: number;
    items?: SelectedRoomCartItem[];
    addOns?: SelectedAddOnCartItem[];
}

export interface PublicRoomType {
    id: string;
    name: string;
    description: string;
    images: { url: string; isProfile?: boolean }[];
    amenities?: string[];
    bedType?: string;
    capacity?: number;
    maxChildren?: number;
    roomSizeValue?: number;
    roomSizeUnit?: string;
    basePrice: number;
    totalRooms: number;
    availableRooms: number;
    isSoldOut: boolean;
    stopSell?: boolean;
    ratePlans: Array<{
        id: string;
        name: string;
        mealsIncluded: boolean;
        price: number;
        description?: string;
        cancellationPolicy?: RatePlanCancellationPolicy;
    }>;
}

export interface BookingEnginePublicData {
    hotelCode: string;
    hotelName: string;
    hotelPhone?: string;
    hotelEmail?: string;
    hotelAddress?: string;
    hotelCity?: string;
    city?: string;
    hotelFacilities?: string[];
    starRating?: number;
    isAddonActive: boolean;
    currency: string;
    themeColor: string; // Burgundy #6D2B35 default
    logoUrl?: string;
    hotelWebsiteUrl: string; // Dynamic website back link
    termsContent?: string;
    addOns: PublicAddOnItem[];
    preferences?: {
        address?: { visible: boolean; mandatory: boolean };
        city?: { visible: boolean; mandatory: boolean };
        zipCode?: { visible: boolean; mandatory: boolean };
        country?: { visible: boolean; mandatory: boolean };
        arrivalTime?: { visible: boolean; mandatory: boolean };
        specialRequests?: { visible: boolean; mandatory: boolean };
    };
    promotions: Array<{
        id: string;
        code: string;
        name: string;
        discountPercent: number;
        isActive: boolean;
    }>;
    pricing: {
        taxRate: number;
        serviceRate: number;
        isTaxIncludedInRate: boolean;
    };
    activeProvider: "midtrans" | "xendit" | "doku" | "manual";
    midtrans?: {
        clientKey?: string;
        isProduction?: boolean;
    };
    xendit?: {
        publicKey?: string;
        isProduction?: boolean;
    };
    doku?: {
        clientId?: string;
        isProduction?: boolean;
    };
    manualTransfer?: {
        banks: Array<{
            id: string;
            bankName: string;
            accountNumber: string;
            accountHolder: string;
            branch?: string;
            instructions?: string;
        }>;
    };
    paymentSettings: {
        enabled: boolean;
        activeProvider: "midtrans" | "xendit" | "doku" | "manual";
        midtransClientKey?: string;
        midtransIsProduction?: boolean;
        xenditPublicKey?: string;
        xenditIsProduction?: boolean;
        dokuClientId?: string;
        dokuIsProduction?: boolean;
        manualBanks: Array<{
            id: string;
            bankName: string;
            accountNumber: string;
            accountHolder: string;
            branch?: string;
            instructions?: string;
        }>;
        taxRate: number;
        serviceRate: number;
        cancellationPolicy: string;
        checkInTime: string;
        checkOutTime: string;
    };
    rooms: PublicRoomType[];
}

/**
 * Loads all public booking engine data for a specific hotel tenant with real-time available inventory.
 * Utilizes indexed persistent local cache for low-cost Firestore reads.
 */
interface TenantStaticCache {
    timestamp: number;
    hotelData: any;
    pgData: any;
    roomsData: any[];
    ratePlansData: any[];
}

const tenantCacheMap: Record<string, TenantStaticCache> = {};
const TENANT_CACHE_TTL_MS = 15 * 1000; // 15 seconds in-memory cache to quickly reflect admin branding changes

/**
 * Loads all public booking engine data for a specific hotel tenant with real-time available inventory
 * and daily rate calendar overrides from Rate & Inventory (Front Office).
 * Optimized with high-efficiency in-memory caching for zero redundant Firestore reads.
 */
export async function getBookingEngineData(
    hotelCode: string,
    checkInDate?: string,
    checkOutDate?: string
): Promise<BookingEnginePublicData | null> {
    if (!hotelCode) return null;

    try {
        const ci = checkInDate || new Date().toISOString().split("T")[0];
        const co = checkOutDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];

        const now = Date.now();
        const cached = tenantCacheMap[hotelCode];
        const isCacheValid = cached && now - cached.timestamp < TENANT_CACHE_TTL_MS;

        let hotelData: any = null;
        let pgData: any = null;
        let roomsDocs: any[] = [];
        let ratePlansDocs: any[] = [];

        // 1. Fetch static tenant metadata (or serve from cache)
        if (isCacheValid) {
            hotelData = cached.hotelData;
            pgData = cached.pgData;
            roomsDocs = cached.roomsData;
            ratePlansDocs = cached.ratePlansData;
        } else {
            const hotelRef = doc(db, "hotels", hotelCode);
            const settingsRef = doc(db, "hotels", hotelCode, "settings", "payment_gateway");
            const profileRef = doc(db, "hotels", hotelCode, "settings", "profile");
            const roomsRef = query(collection(db, "hotels", hotelCode, "roomTypes"), orderBy("name"));
            const ratePlansRef = collection(db, "hotels", hotelCode, "ratePlans");

            const [hotelSnap, settingsSnap, profileSnap, roomsSnap, ratePlansSnap] = await Promise.all([
                getDoc(hotelRef),
                getDoc(settingsRef),
                getDoc(profileRef).catch(() => null),
                getDocs(roomsRef),
                getDocs(ratePlansRef),
            ]);

            if (!hotelSnap.exists()) return null;

            hotelData = hotelSnap.data();
            const profileData = profileSnap && profileSnap.exists() ? profileSnap.data() : null;
            pgData = settingsSnap.exists() ? settingsSnap.data() : null;
            roomsDocs = roomsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            ratePlansDocs = ratePlansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

            tenantCacheMap[hotelCode] = {
                timestamp: now,
                hotelData,
                profileData,
                pgData,
                roomsData: roomsDocs,
                ratePlansData: ratePlansDocs,
            };
        }

        // 2. Fetch only the specific stay-date window overrides & occupancy
        const ariRef = query(
            collection(db, "hotels", hotelCode, "ari_overrides"),
            where("date", ">=", ci),
            where("date", "<=", co)
        );

        const dailyRevRef = query(
            collection(db, "hotels", hotelCode, "daily_revenue"),
            where("date", ">=", ci),
            where("date", "<=", co)
        );

        const [ariSnap, dailyRevSnap] = await Promise.all([
            getDocs(ariRef).catch(() => ({ docs: [] })),
            getDocs(dailyRevRef).catch(() => ({ docs: [] })),
        ]);

        const activeModules: string[] = hotelData?.billing?.activeModules || hotelData?.activeModules || [];
        const isAddonActive =
            activeModules.includes("booking-engine") ||
            activeModules.includes("booking_engine") ||
            activeModules.includes("direct-booking") ||
            hotelData?.billing?.plan === "enterprise";

        // Theme and branding
        const themeColor =
            pgData?.theme?.themeColor ||
            pgData?.themeColor ||
            hotelData?.themeColor ||
            hotelData?.brandColor ||
            "#6D2B35";
        const logoUrl = pgData?.theme?.logoUrl || hotelData?.logoUrl || "";
        const hotelWebsiteUrl = pgData?.theme?.hotelWebsiteUrl || "/";
        const termsContent = pgData?.theme?.termsContent || "Tamu wajib menunjukkan identitas resmi saat check-in.";
        const preferences = pgData?.preferences || {
            address: { visible: true, mandatory: false },
            city: { visible: true, mandatory: false },
            country: { visible: true, mandatory: false },
            arrivalTime: { visible: true, mandatory: true },
            specialRequests: { visible: true, mandatory: false },
        };

        const promotions = pgData?.promotions && Array.isArray(pgData.promotions)
            ? pgData.promotions.filter((p: any) => p.isActive !== false)
            : [];

        // Build list of stay dates (nights)
        const stayDates: string[] = [];
        const startDateObj = new Date(ci);
        const endDateObj = new Date(co);
        const totalNights = Math.max(1, Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)));

        for (let i = 0; i < totalNights; i++) {
            const d = new Date(startDateObj);
            d.setDate(startDateObj.getDate() + i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            stayDates.push(`${y}-${m}-${day}`);
        }

        // ARI Overrides indexed by date
        const ariOverridesByDate: Record<string, any> = {};
        (ariSnap.docs || []).forEach((d: any) => {
            const data = d.data ? d.data() : d;
            if (data.date) {
                ariOverridesByDate[data.date] = data;
            }
        });

        // Daily Revenue Bookings indexed by date and roomTypeId/name
        const dailyBookingsMap: Record<string, Record<string, number>> = {};
        (dailyRevSnap.docs || []).forEach((d: any) => {
            const data = d.data ? d.data() : d;
            const dateStr = data.date || d.id.replace(`${hotelCode}_`, "") || d.id;
            if (!dailyBookingsMap[dateStr]) dailyBookingsMap[dateStr] = {};

            (data.entries || []).forEach((e: any) => {
                const isCancelled = ["CANCEL", "CANCELLED", "VOID", "VOIDED"].includes((e.status || "").toUpperCase()) ||
                                    ["CANCEL", "CANCELLED"].includes((e.paymentStatus || "").toUpperCase());
                if (isCancelled) return;
                const rKey = e.roomTypeId || (e.roomType || "").trim().toLowerCase();
                if (rKey) {
                    const count = Math.max(1, Number(e.roomsCount || e.roomCount) || 1);
                    dailyBookingsMap[dateStr][rKey] = (dailyBookingsMap[dateStr][rKey] || 0) + count;
                }
            });
        });

        // Rate plans list from Channel Manager tab=rateplans
        const allRatePlans = ratePlansDocs;

        // Build room types matching Channel Manager tab=rooms
        const rooms: PublicRoomType[] = roomsDocs.map((rData) => {
            const rId = rData.id;
            const rNameLower = (rData.name || "").trim().toLowerCase();

            // Match rate plans belonging to this room type
            const matchedRatePlans = allRatePlans.filter((rp) => {
                if (rp.roomTypeId === rId) return true;
                if (Array.isArray(rp.roomTypeIds) && rp.roomTypeIds.includes(rId)) return true;
                if (rp.roomRates && rp.roomRates[rId] !== undefined) return true;
                if (!rp.roomTypeId && (!rp.roomTypeIds || rp.roomTypeIds.length === 0)) return true;
                if (rp.roomTypeName && rp.roomTypeName.trim().toLowerCase() === rNameLower) return true;
                if (Array.isArray(rp.roomTypeNames) && rp.roomTypeNames.some((n: string) => n?.trim().toLowerCase() === rNameLower)) return true;
                return false;
            });

            const defaultPrice = Number(rData.basePrice || rData.price || rData.defaultRate || 0);

            // Compute total physical rooms
            const physList = Array.isArray(rData.physicalRooms)
                ? rData.physicalRooms.map((p: any) => (typeof p === "string" ? p.trim() : String(p.number || "").trim())).filter(Boolean)
                : [];

            const totalRooms = Number(
                rData.roomCount ??
                rData.totalRooms ??
                rData.roomsCount ??
                (physList.length > 0 ? physList.length : (rData.quantity ?? 1))
            );

            // Calculate min available rooms across stay dates
            let minAvailableAcrossStay = totalRooms;
            let isStopSellOnAnyNight = rData.stopSell === true;

            stayDates.forEach((dStr) => {
                const dayOverride = ariOverridesByDate[dStr];
                const bookedOnDay = (dailyBookingsMap[dStr]?.[rId] || 0) + (dailyBookingsMap[dStr]?.[rNameLower] || 0);

                let availableOnDay = totalRooms - bookedOnDay;
                if (dayOverride?.inventoryOverrides?.[rId] !== undefined) {
                    availableOnDay = Number(dayOverride.inventoryOverrides[rId]);
                }
                availableOnDay = Math.max(0, availableOnDay);

                if (availableOnDay < minAvailableAcrossStay) {
                    minAvailableAcrossStay = availableOnDay;
                }

                if (dayOverride?.stopSell?.[rId] === true) {
                    isStopSellOnAnyNight = true;
                }
            });

            const isSoldOut = minAvailableAcrossStay <= 0 || isStopSellOnAnyNight;

            // Compute actual rates per night for each rate plan using ARI overrides
            const plans =
                matchedRatePlans.length > 0
                    ? matchedRatePlans.map((rp) => {
                          const baseRpPrice = Number(rp.roomRates?.[rId] ?? rp.baseRate ?? defaultPrice);

                          let totalPriceForStay = 0;
                          let isPlanStopped = rp.stopSell === true;

                          stayDates.forEach((dStr) => {
                              const dayOverride = ariOverridesByDate[dStr];
                              let nightRate = baseRpPrice;

                              if (dayOverride?.rates?.[rp.id] !== undefined) {
                                  nightRate = Number(dayOverride.rates[rp.id]);
                              }

                              totalPriceForStay += nightRate;

                              if (dayOverride?.stopSell?.[rp.id] === true) {
                                  isPlanStopped = true;
                              }
                          });

                          const averageNightlyRate = Math.round(totalPriceForStay / stayDates.length);

                           const isNonRefundable = (rp.cancellationPolicy?.type === "non_refundable") ||
                              /promo|non-refundable|non refundable|flash/i.test(rp.name || "") ||
                              /promo|non-refundable/i.test(rp.description || "");

                          return {
                              id: rp.id,
                              name: rp.name || "Tarif Resmi",
                              mealsIncluded: rp.mealsIncluded ?? false,
                              price: averageNightlyRate,
                              description: rp.description || (rp.mealsIncluded ? "Termasuk Sarapan Pagi" : "Hanya Kamar (Room Only)"),
                              cancellationPolicy: {
                                  type: isNonRefundable ? ("non_refundable" as const) : ("free_cancellation" as const),
                                  title: isNonRefundable ? "Non-Refundable" : "Pembatalan Gratis",
                                  description: isNonRefundable
                                      ? "Pesanan ini tidak dapat diubah atau dibatalkan setelah pembayaran dikonfirmasi."
                                      : "Pembatalan tanpa biaya hingga 24 jam sebelum tanggal check-in (14:00 WIB).",
                                  deadlineHours: isNonRefundable ? 0 : 24,
                              },
                          };
                      })
                    : [
                          {
                              id: "standard-rate",
                              name: "Tarif Standar",
                              mealsIncluded: false,
                              price: defaultPrice,
                              description: "Hanya Kamar (Room Only)",
                              cancellationPolicy: {
                                  type: "free_cancellation" as const,
                                  title: "Pembatalan Gratis",
                                  description: "Pembatalan tanpa biaya hingga 24 jam sebelum tanggal check-in (14:00 WIB).",
                                  deadlineHours: 24,
                              },
                          },
                      ];

            // Bed type string from beds array or bedType string
            const bedTypeFormatted = rData.bedType || (Array.isArray(rData.beds) && rData.beds.length > 0
                ? rData.beds.map((b: any) => `${b.quantity || 1} ${b.type || "Bed"}${b.size ? ` (${b.size})` : ""}`).join(", ")
                : "");

            return {
                id: rId,
                name: rData.name || "Kamar Tamu",
                description: rData.description || "",
                images: Array.isArray(rData.images) && rData.images.length > 0 ? rData.images : [],
                amenities: Array.isArray(rData.amenities) ? rData.amenities : [],
                bedType: bedTypeFormatted,
                capacity: rData.capacity ? Number(rData.capacity) : 2,
                maxChildren: rData.maxChildren !== undefined ? Number(rData.maxChildren) : rData.childrenCapacity !== undefined ? Number(rData.childrenCapacity) : 1,
                roomSizeValue: rData.roomSizeValue ? Number(rData.roomSizeValue) : undefined,
                roomSizeUnit: rData.roomSizeUnit || "m²",
                basePrice: plans[0]?.price || defaultPrice,
                totalRooms,
                availableRooms: minAvailableAcrossStay,
                isSoldOut,
                stopSell: isStopSellOnAnyNight,
                ratePlans: plans,
            };
        });

        const manualBanks = pgData?.manualTransfer?.banks && Array.isArray(pgData.manualTransfer.banks)
            ? pgData.manualTransfer.banks
            : [];

        const taxRate = typeof pgData?.pricing?.taxRate === "number"
            ? pgData.pricing.taxRate
            : typeof hotelData?.taxRate === "number"
            ? hotelData.taxRate
            : 11;
        const serviceRate = typeof pgData?.pricing?.serviceRate === "number"
            ? pgData.pricing.serviceRate
            : typeof hotelData?.serviceRate === "number"
            ? hotelData.serviceRate
            : 0;
        const isTaxIncludedInRate = pgData?.pricing?.isTaxIncludedInRate ?? hotelData?.isTaxIncludedInRate ?? false;

        const hotelFacilities = Array.isArray(hotelData?.facilities) && hotelData.facilities.length > 0
            ? hotelData.facilities
            : Array.isArray(hotelData?.amenities) && hotelData.amenities.length > 0
            ? hotelData.amenities
            : ["WiFi Gratis", "Front Desk 24 Jam", "Parkir Area", "AC", "Restoran"];

        const profileData = isCacheValid ? cached.profileData : undefined;
        const hotelAddress = pgData?.theme?.hotelAddress ||
            profileData?.address ||
            hotelData?.address ||
            hotelData?.alamat ||
            hotelData?.location ||
            hotelData?.streetAddress ||
            "";
        const hotelCity = pgData?.theme?.hotelCity ||
            profileData?.city ||
            hotelData?.city ||
            hotelData?.kota ||
            "";

        return {
            hotelCode,
            hotelName: pgData?.theme?.headerTitle || profileData?.name || hotelData?.name || "Hotel Mitra",
            hotelPhone: pgData?.theme?.contactPhone || profileData?.phone || hotelData?.phone || hotelData?.whatsapp || "",
            hotelEmail: profileData?.email || hotelData?.email || "",
            hotelAddress,
            hotelCity,
            hotelFacilities,
            starRating: typeof hotelData?.starRating === "number" ? hotelData.starRating : 0,
            isAddonActive,
            currency: "IDR",
            themeColor,
            logoUrl,
            hotelWebsiteUrl,
            termsContent,
            addOns: Array.isArray(pgData?.addOns) && pgData.addOns.length > 0
                ? (pgData.addOns as PublicAddOnItem[]).filter((a: any) => a.isActive !== false)
                : [
                    {
                        id: "extra_bed",
                        name: "Extra Bed (Kasur Tambahan)",
                        description: "Termasuk bantal & linen premium standar hotel untuk kenyamanan ekstra.",
                        price: 150000,
                        priceType: "per_night" as const,
                        icon: "bed",
                        category: "comfort",
                    },
                    {
                        id: "airport_transfer",
                        name: "Antar-Jemput Bandara / Stasiun",
                        description: "Layanan penjemputan atau pengantaran dengan driver ramah dan mobil ber-AC.",
                        price: 250000,
                        priceType: "per_stay" as const,
                        icon: "car",
                        category: "transport",
                    },
                    {
                        id: "late_checkout",
                        name: "Late Check-Out (Hingga 16:00 WIB)",
                        description: "Waktu bersantai lebih lama di kamar hingga sore hari tanpa terburu-buru.",
                        price: 100000,
                        priceType: "per_stay" as const,
                        icon: "clock",
                        category: "flexibility",
                    },
                    {
                        id: "romantic_dinner",
                        name: "Paket Romantic Dinner",
                        description: "Makan malam romantis set menu 3-course dengan dekorasi meja cantik.",
                        price: 350000,
                        priceType: "per_stay" as const,
                        icon: "utensils",
                        category: "dining",
                    },
                ],
            preferences,
            promotions,
            pricing: {
                taxRate,
                serviceRate,
                isTaxIncludedInRate,
            },
            activeProvider: pgData?.activeProvider || "manual",
            midtrans: pgData?.midtrans || undefined,
            xendit: pgData?.xendit || undefined,
            doku: pgData?.doku || undefined,
            manualTransfer: {
                banks: manualBanks,
            },
            paymentSettings: {
                enabled: pgData?.enabled !== false,
                activeProvider: pgData?.activeProvider || "manual",
                midtransClientKey: pgData?.midtrans?.clientKey || "",
                midtransIsProduction: pgData?.midtrans?.isProduction || false,
                xenditPublicKey: pgData?.xendit?.publicKey || "",
                xenditIsProduction: pgData?.xendit?.isProduction || false,
                dokuClientId: pgData?.doku?.clientId || "",
                dokuIsProduction: pgData?.doku?.isProduction || false,
                manualBanks,
                taxRate,
                serviceRate,
                cancellationPolicy: pgData?.policies?.cancellationType || "flexible",
                checkInTime: pgData?.policies?.checkInTime || "14:00",
                checkOutTime: pgData?.policies?.checkOutTime || "12:00",
            },
            rooms,
        };
    } catch (err) {
        console.error("Error fetching booking engine data:", err);
        return null;
    }
}

/**
 * Creates a direct booking reservation document and syncs to hotel revenue ledger (daily_revenue).
 * Ensures instant inventory reduction across the CRS and front-desk PMS visibility.
 */
export async function createDirectBookingReservation(
    hotelCode: string,
    payload: {
        guest: BookingGuestDetails;
        selection: BookingSelection;
        paymentMethod: string;
        paymentStatus: string;
    }
): Promise<{ success: boolean; bookingCode: string; error?: string }> {
    if (!hotelCode) return { success: false, bookingCode: "", error: "Kode hotel tidak valid." };

    try {
        const bookingCode = `DIR-${Date.now().toString().slice(-6)}`;
        const resRef = collection(db, "hotels", hotelCode, "reservations");

        const normalizedPaymentStatus = (payload.paymentStatus || "PENDING").toUpperCase();
        const isPaid = normalizedPaymentStatus === "PAID";

        const itemsList: SelectedRoomCartItem[] = Array.isArray(payload.selection.items) && payload.selection.items.length > 0
            ? payload.selection.items
            : [
                {
                    roomTypeId: payload.selection.roomTypeId,
                    roomTypeName: payload.selection.roomTypeName,
                    ratePlanId: payload.selection.ratePlanId,
                    ratePlanName: payload.selection.ratePlanName,
                    pricePerNight: payload.selection.pricePerNight,
                    quantity: payload.selection.roomsCount || 1,
                    subtotal: payload.selection.baseTotal,
                }
            ];

        const totalRoomsCount = itemsList.reduce((acc, it) => acc + (it.quantity || 1), 0);

        const newDoc = {
            bookingCode,
            source: "direct_engine",
            guestName: payload.guest.fullName,
            guestEmail: payload.guest.email,
            guestPhone: payload.guest.phone,
            address: payload.guest.address || "",
            city: payload.guest.city || "",
            country: payload.guest.country || "",
            specialRequests: payload.guest.specialRequests || "",
            estimatedArrivalTime: payload.guest.estimatedArrivalTime || "14:00",
            roomTypeId: payload.selection.roomTypeId,
            roomTypeName: payload.selection.roomTypeName,
            ratePlanId: payload.selection.ratePlanId,
            ratePlanName: payload.selection.ratePlanName,
            items: itemsList,
            addOns: Array.isArray(payload.selection.addOns) ? payload.selection.addOns : [],
            checkIn: payload.selection.checkInDate,
            checkOut: payload.selection.checkOutDate,
            nights: payload.selection.nights,
            roomsCount: totalRoomsCount,
            adults: payload.selection.adults,
            children: payload.selection.children,
            pricePerNight: payload.selection.pricePerNight,
            baseTotal: payload.selection.baseTotal,
            taxAmount: payload.selection.taxAmount,
            serviceAmount: payload.selection.serviceAmount,
            totalPrice: payload.selection.grandTotal,
            paymentMethod: payload.paymentMethod,
            paymentStatus: normalizedPaymentStatus,
            status: "CONFIRMED",
            createdAt: new Date().toISOString(),
        };

        await addDoc(resRef, newDoc);

        // Calculate all stay dates (nights) to deduct room inventory and register in Front Office PMS
        const stayDates: string[] = [];
        const startDateObj = new Date(payload.selection.checkInDate);
        const endDateObj = new Date(payload.selection.checkOutDate);
        const totalNights = Math.max(1, Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)));

        for (let i = 0; i < totalNights; i++) {
            const d = new Date(startDateObj);
            d.setDate(startDateObj.getDate() + i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            stayDates.push(`${y}-${m}-${day}`);
        }

        const formattedPaymentMethod = payload.paymentMethod === "midtrans"
            ? "Midtrans Payment Gateway"
            : payload.paymentMethod === "xendit"
            ? "Xendit Payment Gateway"
            : payload.paymentMethod === "doku"
            ? "DOKU Payment Gateway"
            : "Bank Transfer";

        for (const dateStr of stayDates) {
            const dailyDocRef = doc(db, "hotels", hotelCode, "daily_revenue", `${hotelCode}_${dateStr}`);
            const dailySnap = await getDoc(dailyDocRef);

            const revenueEntriesForThisBooking = itemsList.map((item, idx) => {
                const itemTotalGross = Math.round(item.subtotal * (1 + (payload.selection.taxAmount + payload.selection.serviceAmount) / (payload.selection.baseTotal || 1)));
                return {
                    bookingId: `${bookingCode}_${idx}`,
                    voucherCode: bookingCode,
                    resId: bookingCode,
                    guestName: payload.guest.fullName,
                    guestEmail: payload.guest.email,
                    guestPhone: payload.guest.phone,
                    guestAddress: payload.guest.address || "",
                    guestCity: payload.guest.city || "",
                    guestCountry: payload.guest.country || "",
                    roomType: item.roomTypeName,
                    roomTypeId: item.roomTypeId,
                    ratePlanName: item.ratePlanName,
                    ratePlanId: item.ratePlanId,
                    checkIn: payload.selection.checkInDate,
                    checkOut: payload.selection.checkOutDate,
                    nights: payload.selection.nights,
                    roomsCount: item.quantity || 1,
                    roomCount: item.quantity || 1,
                    adults: payload.selection.adults,
                    children: payload.selection.children,
                    rate: item.pricePerNight,
                    price: item.pricePerNight,
                    totalPrice: itemTotalGross,
                    payTransfer: isPaid ? itemTotalGross : 0,
                    paidAmount1: isPaid ? itemTotalGross : 0,
                    status: "CONFIRMED",
                    paymentStatus: normalizedPaymentStatus,
                    paymentMethod: formattedPaymentMethod,
                    paymentCollect: "direct",
                    paymentType: payload.paymentMethod,
                    source: "Direct Booking Engine",
                    isDirectBooking: true,
                    specialRequests: payload.guest.specialRequests || "",
                    estimatedArrivalTime: payload.guest.estimatedArrivalTime || "14:00",
                    note: `Direct Booking (${bookingCode}) - ${item.quantity}x ${item.roomTypeName} (${item.ratePlanName}) - ${payload.guest.fullName}`,
                    timestamp: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                };
            });

            if (dailySnap.exists()) {
                const existingEntries = (dailySnap.data()?.entries || []).filter(
                    (e: any) => e.voucherCode !== bookingCode && !String(e.bookingId || "").startsWith(bookingCode)
                );
                existingEntries.push(...revenueEntriesForThisBooking);
                await setDoc(dailyDocRef, {
                    ...dailySnap.data(),
                    entries: existingEntries,
                    date: dateStr,
                    hotelId: hotelCode,
                    lastUpdated: new Date().toISOString(),
                }, { merge: true });
            } else {
                await setDoc(dailyDocRef, {
                    entries: revenueEntriesForThisBooking,
                    date: dateStr,
                    hotelId: hotelCode,
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                });
            }
        }

        return { success: true, bookingCode };
    } catch (err: any) {
        console.error("Error creating direct reservation:", err);
        return { success: false, bookingCode: "", error: err.message || "Gagal membuat reservasi." };
    }
}

/**
 * Updates payment status and reservation lifecycle across reservations and daily_revenue.
 * Triggered by Payment Gateway Webhooks (Midtrans / Xendit) or manual confirmations.
 */
export async function updateReservationPaymentStatus(
    hotelCode: string,
    bookingCode: string,
    newPaymentStatus: "PAID" | "PENDING" | "CANCELLED",
    newBookingStatus: "CONFIRMED" | "CANCELLED" = "CONFIRMED"
): Promise<{ success: boolean; error?: string }> {
    if (!hotelCode || !bookingCode) return { success: false, error: "Parameter tidak lengkap." };

    try {
        const resQuery = query(
            collection(db, "hotels", hotelCode, "reservations"),
            where("bookingCode", "==", bookingCode)
        );
        const resSnap = await getDocs(resQuery);

        let checkIn = "";
        let checkOut = "";

        if (!resSnap.empty) {
            const rDoc = resSnap.docs[0];
            const rData = rDoc.data();
            checkIn = rData.checkIn;
            checkOut = rData.checkOut;
            await setDoc(rDoc.ref, {
                paymentStatus: newPaymentStatus,
                status: newBookingStatus,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        }

        if (checkIn && checkOut) {
            const stayDates: string[] = [];
            const startDateObj = new Date(checkIn);
            const endDateObj = new Date(checkOut);
            const totalNights = Math.max(1, Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)));

            for (let i = 0; i < totalNights; i++) {
                const d = new Date(startDateObj);
                d.setDate(startDateObj.getDate() + i);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                stayDates.push(`${y}-${m}-${day}`);
            }

            for (const dateStr of stayDates) {
                const dailyDocRef = doc(db, "hotels", hotelCode, "daily_revenue", `${hotelCode}_${dateStr}`);
                const dailySnap = await getDoc(dailyDocRef);
                if (dailySnap.exists()) {
                    const entries = (dailySnap.data()?.entries || []).map((e: any) => {
                        if (e.bookingId === bookingCode || e.voucherCode === bookingCode) {
                            return {
                                ...e,
                                paymentStatus: newPaymentStatus,
                                status: newBookingStatus,
                                lastUpdated: new Date().toISOString(),
                            };
                        }
                        return e;
                    });
                    await setDoc(dailyDocRef, {
                        ...dailySnap.data(),
                        entries,
                        lastUpdated: new Date().toISOString(),
                    }, { merge: true });
                }
            }
        }

        return { success: true };
    } catch (err: any) {
        console.error("Error updating reservation payment status:", err);
        return { success: false, error: err.message || "Gagal update status pembayaran." };
    }
}
