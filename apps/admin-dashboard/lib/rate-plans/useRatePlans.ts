"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    getDocs
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { MyTaraRatePlan } from "../channex/types";
import { logAuditEvent } from "../auditLogger";

const ratePlansCache = new Map<string, { list: MyTaraRatePlan[]; timestamp: number }>();
const RATE_PLANS_CACHE_TTL = 5 * 60 * 1000;

export const useRatePlans = () => {
    const { user, activeHotelCode, activeHotelName } = useAuth();
    const [ratePlans, setRatePlans] = useState<MyTaraRatePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchRatePlans = useCallback(async (forceRefresh = false) => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setRatePlans([]);
            setLoading(false);
            return;
        }

        const cached = ratePlansCache.get(activeHotelCode);
        if (!forceRefresh && cached && Date.now() - cached.timestamp < RATE_PLANS_CACHE_TTL) {
            setRatePlans(cached.list);
            setLoading(false);
            return;
        }

        try {
            const q = query(getHotelCollection(db, "ratePlans", activeHotelCode), orderBy("name"));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MyTaraRatePlan[];
            ratePlansCache.set(activeHotelCode, { list, timestamp: Date.now() });
            setRatePlans(list);
        } catch (err) {
            console.error("Error loading rate plans:", err);
        } finally {
            setLoading(false);
        }
    }, [activeHotelCode]);

    useEffect(() => {
        fetchRatePlans();
    }, [fetchRatePlans]);

    /**
     * Auto-seeds standard rate plans matching Channex certification standard:
     * Room 1: Twin Room -> 1. Best Available Rate ($100 / Rp 1.000.000)
     *                      2. Bed & Breakfast Rate ($120 / Rp 1.200.000)
     * Room 2: Double Room -> 1. Best Available Rate ($100 / Rp 1.000.000)
     *                        2. Bed & Breakfast Rate ($120 / Rp 1.200.000)
     */
    const seedDefaultRatePlans = async (existingRoomTypes: any[] = [], targetCurrency: string = "USD") => {
        if (!activeHotelCode) return;
        setSaving(true);
        try {
            const existingSnap = await getDocs(getHotelCollection(db, "ratePlans", activeHotelCode));
            if (!existingSnap.empty) {
                toast.info("Rate plans sudah ada.");
                return;
            }

            const curr = (targetCurrency || "USD").toUpperCase();
            const isIDR = curr === "IDR";
            const isUSD = curr === "USD";
            const defaultBarPrice = isUSD ? 100 : (isIDR ? 1000000 : 100);
            const defaultBbPrice = isUSD ? 120 : (isIDR ? 1200000 : 120);
            const defaultBreakfastFee = isUSD ? 20 : (isIDR ? 100000 : 20);

            let effectiveRoomTypes = Array.isArray(existingRoomTypes) ? [...existingRoomTypes] : [];

            // Jika belum ada room types sama sekali di properti, buatkan 2 tipe kamar standar: Twin Room & Double Room
            if (effectiveRoomTypes.length === 0) {
                const rtCollection = getHotelCollection(db, "roomTypes", activeHotelCode);
                
                // 1. Twin Room (Max Occupancy: 2 Dewasa)
                const twinDoc = await addDoc(rtCollection, {
                    name: "Twin Room",
                    description: "Kamar standard twin dengan 2 single bed nyaman dan fasilitas lengkap.",
                    capacity: 2,
                    bedType: "Twin Bed",
                    beds: [{ type: "Single", quantity: 2, size: "100x200" }],
                    roomCount: 5,
                    roomSizeValue: 32,
                    roomSizeUnit: "m²",
                    price: defaultBarPrice,
                    amenities: ["wifi", "ac", "tv", "shower"],
                    physicalRooms: [
                        { id: "101", number: "101" },
                        { id: "102", number: "102" },
                        { id: "103", number: "103" },
                        { id: "104", number: "104" },
                        { id: "105", number: "105" }
                    ],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // 2. Double Room (Max Occupancy: 2 Dewasa)
                const doubleDoc = await addDoc(rtCollection, {
                    name: "Double Room",
                    description: "Kamar standard double dengan 1 king bed luas cocok untuk pasangan dan traveler.",
                    capacity: 2,
                    bedType: "King Bed",
                    beds: [{ type: "King", quantity: 1, size: "180x200" }],
                    roomCount: 5,
                    roomSizeValue: 32,
                    roomSizeUnit: "m²",
                    price: defaultBarPrice,
                    amenities: ["wifi", "ac", "tv", "shower"],
                    physicalRooms: [
                        { id: "201", number: "201" },
                        { id: "202", number: "202" },
                        { id: "203", number: "203" },
                        { id: "204", number: "204" },
                        { id: "205", number: "205" }
                    ],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                effectiveRoomTypes = [
                    { id: twinDoc.id, name: "Twin Room", price: defaultBarPrice },
                    { id: doubleDoc.id, name: "Double Room", price: defaultBarPrice }
                ];
            }

            // Buat Rate Plan terpisah untuk tiap tipe kamar (Best Available Rate & Bed & Breakfast Rate)
            const ratePlansCollection = getHotelCollection(db, "ratePlans", activeHotelCode);

            for (const rt of effectiveRoomTypes) {
                const rtBarRate = Number(rt.price || rt.baseRate || defaultBarPrice);
                const rtBbRate = isUSD ? (rtBarRate + 20) : (isIDR ? rtBarRate + 200000 : rtBarRate + 20);

                // 1. Best Available Rate (BAR)
                await addDoc(ratePlansCollection, {
                    hotelCode: activeHotelCode,
                    name: effectiveRoomTypes.length > 1 ? `Best Available Rate (${rt.name})` : "Best Available Rate",
                    code: "BAR",
                    roomTypeId: rt.id,
                    roomTypeName: rt.name,
                    roomTypeIds: [rt.id],
                    roomTypeNames: [rt.name],
                    roomRates: { [rt.id]: rtBarRate },
                    baseRate: rtBarRate,
                    currency: curr,
                    mealsIncluded: false,
                    cancellationPolicy: "FREE",
                    minStay: 1,
                    stopSell: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // 2. Bed & Breakfast Rate (BB)
                await addDoc(ratePlansCollection, {
                    hotelCode: activeHotelCode,
                    name: effectiveRoomTypes.length > 1 ? `Bed & Breakfast Rate (${rt.name})` : "Bed & Breakfast Rate",
                    code: "BB",
                    roomTypeId: rt.id,
                    roomTypeName: rt.name,
                    roomTypeIds: [rt.id],
                    roomTypeNames: [rt.name],
                    roomRates: { [rt.id]: rtBbRate },
                    baseRate: rtBbRate,
                    currency: curr,
                    mealsIncluded: true,
                    breakfastRate: defaultBreakfastFee,
                    cancellationPolicy: "FREE",
                    minStay: 1,
                    stopSell: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            ratePlansCache.delete(activeHotelCode);
            await fetchRatePlans(true);
            toast.success("Standard Rate Plans (Best Available Rate & Bed & Breakfast) berhasil digenerate.");
        } catch (err: any) {
            console.error("Error seeding rate plans:", err);
            toast.error(`Gagal membuat default rate plans: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const addRatePlan = async (data: Omit<MyTaraRatePlan, "id">) => {
        if (!activeHotelCode) return;
        setSaving(true);
        try {
            const docRef = await addDoc(getHotelCollection(db, "ratePlans", activeHotelCode), {
                ...data,
                hotelCode: activeHotelCode,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            ratePlansCache.delete(activeHotelCode);
            logAuditEvent({
                hotelCode: activeHotelCode,
                actor: {
                    uid: user?.uid || "unknown",
                    name: user?.displayName || user?.email || "Unknown",
                    email: user?.email || "",
                    role: user?.role || "admin",
                },
                category: "RATES",
                action: "CREATE_RATE_PLAN",
                description: `Membuat rate plan baru: ${data.name} (Base: Rp ${Number(data.baseRate || 0).toLocaleString()})`,
                targetId: docRef.id,
                targetName: data.name,
                diff: { after: data }
            });
            await fetchRatePlans(true);
            toast.success("Rate Plan berhasil ditambahkan.");
        } catch (err: any) {
            console.error("Error adding rate plan:", err);
            toast.error(`Gagal menambah Rate Plan: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const updateRatePlan = async (id: string, data: Partial<MyTaraRatePlan>) => {
        if (!activeHotelCode || !id) return;
        setSaving(true);
        try {
            const ref = doc(getHotelCollection(db, "ratePlans", activeHotelCode), id);
            await updateDoc(ref, {
                ...data,
                updatedAt: new Date().toISOString()
            });
            ratePlansCache.delete(activeHotelCode);
            logAuditEvent({
                hotelCode: activeHotelCode,
                actor: {
                    uid: user?.uid || "unknown",
                    name: user?.displayName || user?.email || "Unknown",
                    email: user?.email || "",
                    role: user?.role || "admin",
                },
                category: "RATES",
                action: "UPDATE_RATE_PLAN",
                description: `Mengubah rate plan: ${data.name || id}`,
                targetId: id,
                targetName: data.name || id,
                diff: { after: data }
            });
            await fetchRatePlans(true);
            toast.success("Rate Plan berhasil diperbarui.");
        } catch (err: any) {
            console.error("Error updating rate plan:", err);
            toast.error(`Gagal memperbarui Rate Plan: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const deleteRatePlan = async (id: string) => {
        if (!activeHotelCode || !id) return;
        setSaving(true);
        try {
            const existing = ratePlans.find(r => r.id === id);
            const ref = doc(getHotelCollection(db, "ratePlans", activeHotelCode), id);
            await deleteDoc(ref);
            ratePlansCache.delete(activeHotelCode);
            logAuditEvent({
                hotelCode: activeHotelCode,
                actor: {
                    uid: user?.uid || "unknown",
                    name: user?.displayName || user?.email || "Unknown",
                    email: user?.email || "",
                    role: user?.role || "admin",
                },
                category: "RATES",
                action: "DELETE_RATE_PLAN",
                description: `Menghapus rate plan: ${existing?.name || id}`,
                targetId: id,
                targetName: existing?.name || id,
                diff: { before: existing }
            });
            await fetchRatePlans(true);
            toast.success("Rate Plan berhasil dihapus.");
        } catch (err: any) {
            console.error("Error deleting rate plan:", err);
            toast.error(`Gagal menghapus Rate Plan: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return {
        ratePlans,
        loading,
        saving,
        addRatePlan,
        updateRatePlan,
        deleteRatePlan,
        seedDefaultRatePlans
    };
};
