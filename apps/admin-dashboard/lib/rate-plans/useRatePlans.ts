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
     * Auto-seeds standard rate plans for all room types if none exist
     */
    const seedDefaultRatePlans = async (roomTypes: any[]) => {
        if (!activeHotelCode || roomTypes.length === 0) return;
        setSaving(true);
        try {
            const existingSnap = await getDocs(getHotelCollection(db, "ratePlans", activeHotelCode));
            if (!existingSnap.empty) {
                toast.info("Rate plans sudah ada.");
                return;
            }

            const allRoomTypeIds = roomTypes.map(r => r.id);
            const allRoomTypeNames = roomTypes.map(r => r.name);

            const roRates: Record<string, number> = {};
            const bbRates: Record<string, number> = {};

            roomTypes.forEach(rt => {
                const rtBase = Number(rt.price || rt.baseRate || 500000);
                roRates[rt.id] = rtBase;
                bbRates[rt.id] = rtBase + 100000;
            });

            const primaryBaseRate = Number(roomTypes[0]?.price || roomTypes[0]?.baseRate || 500000);

            // 1. Master Room Only Plan (RO)
            await addDoc(getHotelCollection(db, "ratePlans", activeHotelCode), {
                hotelCode: activeHotelCode,
                name: "Room Only (RO)",
                code: "RO",
                roomTypeId: roomTypes[0]?.id || "",
                roomTypeName: roomTypes[0]?.name || "",
                roomTypeIds: allRoomTypeIds,
                roomTypeNames: allRoomTypeNames,
                roomRates: roRates,
                baseRate: primaryBaseRate,
                currency: "IDR",
                mealsIncluded: false,
                cancellationPolicy: "FREE",
                minStay: 1,
                stopSell: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // 2. Master Bed & Breakfast Plan (BB)
            await addDoc(getHotelCollection(db, "ratePlans", activeHotelCode), {
                hotelCode: activeHotelCode,
                name: "With Breakfast (BB)",
                code: "BB",
                roomTypeId: roomTypes[0]?.id || "",
                roomTypeName: roomTypes[0]?.name || "",
                roomTypeIds: allRoomTypeIds,
                roomTypeNames: allRoomTypeNames,
                roomRates: bbRates,
                baseRate: primaryBaseRate + 100000,
                currency: "IDR",
                mealsIncluded: true,
                breakfastRate: 75000,
                cancellationPolicy: "FREE",
                minStay: 1,
                stopSell: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            ratePlansCache.delete(activeHotelCode);
            await fetchRatePlans(true);
            toast.success("Default Master Rate Plans (RO & BB) berhasil dibuat untuk semua kamar.");
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
