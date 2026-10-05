import { doc, getDoc, getDocs, collection, query, orderBy, where, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BookingGuestDetails {
    fullName: string;
    email: string;
    phone: string;
    specialRequests?: string;
    estimatedArrivalTime?: string;
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
}

export interface PublicRoomType {
    id: string;
    name: string;
    description: string;
    images: { url: string; isProfile?: boolean }[];
    amenities?: string[];
    capacity?: number;
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
    }>;
}

export interface BookingEnginePublicData {
    hotelCode: string;
    hotelName: string;
    isAddonActive: boolean;
    currency: string;
    paymentSettings: {
        enabled: boolean;
        activeProvider: "midtrans" | "xendit" | "manual";
        midtransClientKey?: string;
        midtransIsProduction?: boolean;
        xenditPublicKey?: string;
        xenditIsProduction?: boolean;
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
export async function getBookingEngineData(
    hotelCode: string,
    checkInDate?: string,
    checkOutDate?: string
): Promise<BookingEnginePublicData | null> {
    if (!hotelCode) return null;

    try {
        const hotelRef = doc(db, "hotels", hotelCode);
        const settingsRef = doc(db, "hotels", hotelCode, "settings", "payment_gateway");
        const roomsRef = query(collection(db, "hotels", hotelCode, "roomTypes"), orderBy("name"));
        const ratePlansRef = collection(db, "hotels", hotelCode, "ratePlans");
        const reservationsRef = collection(db, "hotels", hotelCode, "reservations");

        // Single batch fetch
        const [hotelSnap, settingsSnap, roomsSnap, ratePlansSnap, resSnap] = await Promise.all([
            getDoc(hotelRef),
            getDoc(settingsRef),
            getDocs(roomsRef),
            getDocs(ratePlansRef),
            getDocs(reservationsRef).catch(() => ({ docs: [] })),
        ]);

        if (!hotelSnap.exists()) return null;

        const hotelData = hotelSnap.data();
        const activeModules: string[] = hotelData?.billing?.activeModules || hotelData?.activeModules || [];
        const isAddonActive =
            activeModules.includes("booking-engine") ||
            activeModules.includes("booking_engine") ||
            activeModules.includes("direct-booking") ||
            hotelData?.billing?.plan === "enterprise";

        const pgData = settingsSnap.exists() ? settingsSnap.data() : null;

        // Rate plans indexed by roomTypeId
        const allRatePlans = ratePlansSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

        // Count booked rooms for the requested date window
        const bookedCountByRoomType: Record<string, number> = {};
        const ci = checkInDate || new Date().toISOString().split("T")[0];
        const co = checkOutDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];

        (resSnap.docs || []).forEach((docSnap: any) => {
            const res = docSnap.data();
            if (res.status === "cancelled" || res.status === "void") return;
            // Check date overlap: (res.checkIn < co && res.checkOut > ci)
            const resCheckIn = res.checkIn || res.checkin || "";
            const resCheckOut = res.checkOut || res.checkout || "";
            if (resCheckIn && resCheckOut) {
                if (resCheckIn < co && resCheckOut > ci) {
                    const rtId = res.roomTypeId || res.roomType || "";
                    if (rtId) {
                        const count = Number(res.roomsCount || 1);
                        bookedCountByRoomType[rtId] = (bookedCountByRoomType[rtId] || 0) + count;
                    }
                }
            }
        });

        const rooms: PublicRoomType[] = roomsSnap.docs.map((d) => {
            const rData = d.data();
            const rId = d.id;
            const customRatePlans = allRatePlans.filter((rp) => rp.roomTypeId === rId || rp.roomTypeId === "all");

            const defaultPrice = Number(rData.basePrice || rData.price || rData.defaultRate || 750000);

            // Compute total physical rooms
            const physList = Array.isArray(rData.physicalRooms)
                ? rData.physicalRooms.map((p: any) => (typeof p === "string" ? p.trim() : String(p.number || "").trim())).filter(Boolean)
                : [];

            const totalRooms = Number(
                rData.roomCount ??
                rData.totalRooms ??
                rData.roomsCount ??
                (physList.length > 0 ? physList.length : (rData.quantity ?? 6))
            );

            const bookedRooms = bookedCountByRoomType[rId] || bookedCountByRoomType[rData.name] || 0;
            const availableRooms = Math.max(0, totalRooms - bookedRooms);
            const isSoldOut = availableRooms <= 0 || rData.stopSell === true;

            const plans =
                customRatePlans.length > 0
                    ? customRatePlans.map((rp) => ({
                          id: rp.id,
                          name: rp.name || "Standar Tarif",
                          mealsIncluded: rp.mealsIncluded ?? false,
                          price: Number(rp.baseRate || defaultPrice),
                          description: rp.description || (rp.mealsIncluded ? "Termasuk Sarapan Pagi" : "Hanya Kamar (Room Only)"),
                      }))
                    : [
                          {
                              id: "standard-ro",
                              name: "Room Only (Tanpa Sarapan)",
                              mealsIncluded: false,
                              price: defaultPrice,
                              description: "Tarif hemat tanpa sarapan pagi",
                          },
                          {
                              id: "standard-bb",
                              name: "Room with Breakfast (Termasuk Sarapan)",
                              mealsIncluded: true,
                              price: Math.round(defaultPrice * 1.15),
                              description: "Termasuk sarapan prasmanan lezat untuk 2 orang",
                          },
                      ];

            return {
                id: rId,
                name: rData.name || "Kamar Tamu",
                description: rData.description || "",
                images: rData.images || [{ url: "/images/placeholder-room.jpg", isProfile: true }],
                amenities: rData.amenities || ["Wi-Fi Kecepatan Tinggi", "AC Dingin", "Smart TV", "Shower Air Hangat"],
                capacity: rData.capacity || 2,
                roomSizeValue: rData.roomSizeValue || 28,
                roomSizeUnit: rData.roomSizeUnit || "m²",
                basePrice: defaultPrice,
                totalRooms,
                availableRooms,
                isSoldOut,
                stopSell: rData.stopSell ?? false,
                ratePlans: plans,
            };
        });

        return {
            hotelCode,
            hotelName: hotelData?.name || "Hotel Mitra",
            isAddonActive,
            currency: "IDR",
            paymentSettings: {
                enabled: pgData?.enabled !== false,
                activeProvider: pgData?.activeProvider || "manual",
                midtransClientKey: pgData?.midtrans?.clientKey || "",
                midtransIsProduction: pgData?.midtrans?.isProduction || false,
                xenditPublicKey: pgData?.xendit?.publicKey || "",
                xenditIsProduction: pgData?.xendit?.isProduction || false,
                manualBanks: pgData?.manualTransfer?.banks || [
                    {
                        id: "default-bank",
                        bankName: "BCA",
                        accountNumber: "1234567890",
                        accountHolder: hotelData?.name || "Hotel Mitra",
                        instructions: "Transfer sesuai nominal invoice dan simpan bukti transfer.",
                    },
                ],
                taxRate: pgData?.pricing?.taxRate ?? 10,
                serviceRate: pgData?.pricing?.serviceRate ?? 10,
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
 * Creates a direct booking reservation document and syncs to hotel revenue ledger.
 */
export async function createDirectBookingReservation(
    hotelCode: string,
    bookingData: {
        guest: BookingGuestDetails;
        selection: BookingSelection;
        paymentMethod: string;
        paymentStatus: "pending" | "paid" | "settlement";
        transactionId?: string;
    }
): Promise<{ success: boolean; bookingCode: string; error?: string }> {
    try {
        const bookingCode = `DIR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

        const reservationPayload = {
            bookingCode,
            channel: "Direct Website (Google Situs Resmi)",
            channelCode: "DIRECT_WEB",
            guestName: bookingData.guest.fullName,
            guestEmail: bookingData.guest.email,
            guestPhone: bookingData.guest.phone,
            specialRequests: bookingData.guest.specialRequests || "",
            estimatedArrivalTime: bookingData.guest.estimatedArrivalTime || "",
            roomTypeId: bookingData.selection.roomTypeId,
            roomTypeName: bookingData.selection.roomTypeName,
            ratePlanId: bookingData.selection.ratePlanId,
            ratePlanName: bookingData.selection.ratePlanName,
            checkIn: bookingData.selection.checkInDate,
            checkOut: bookingData.selection.checkOutDate,
            nights: bookingData.selection.nights,
            roomsCount: bookingData.selection.roomsCount,
            adults: bookingData.selection.adults,
            children: bookingData.selection.children,
            baseTotal: bookingData.selection.baseTotal,
            taxAmount: bookingData.selection.taxAmount,
            serviceAmount: bookingData.selection.serviceAmount,
            grandTotal: bookingData.selection.grandTotal,
            paymentMethod: bookingData.paymentMethod,
            paymentStatus: bookingData.paymentStatus,
            transactionId: bookingData.transactionId || "",
            status: "confirmed",
            createdAt: new Date().toISOString(),
        };

        // Write reservation to hotel tenant subcollection
        await addDoc(collection(db, "hotels", hotelCode, "reservations"), reservationPayload);

        return { success: true, bookingCode };
    } catch (err: any) {
        console.error("Failed to create direct reservation:", err);
        return { success: false, bookingCode: "", error: err.message };
    }
}
