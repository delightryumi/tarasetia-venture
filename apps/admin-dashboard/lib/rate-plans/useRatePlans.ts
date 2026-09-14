"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import {
    collection,
    onSnapshot,
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

export const useRatePlans = () => {
    const { activeHotelCode } = useAuth();
    const [ratePlans, setRatePlans] = useState<MyTaraRatePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setRatePlans([]);
            setLoading(false);
            return;
        }

        const q = query(getHotelCollection(db, "ratePlans", activeHotelCode), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MyTaraRatePlan[];
            setRatePlans(list);
            setLoading(false);
        }, (err) => {
            console.error("Error loading rate plans:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeHotelCode]);

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

            for (const rt of roomTypes) {
                const rtBase = Number(rt.price || rt.baseRate || 0);

                // 1. Room Only Plan
                await addDoc(getHotelCollection(db, "ratePlans", activeHotelCode), {
                    hotelCode: activeHotelCode,
                    name: `${rt.name} - Room Only`,
                    code: `${(rt.name || "RM").slice(0, 3).toUpperCase()}-RO`,
                    roomTypeId: rt.id,
                    roomTypeName: rt.name,
                    baseRate: rtBase,
                    currency: "IDR",
                    mealsIncluded: false,
                    cancellationPolicy: "FREE",
                    minStay: 1,
                    stopSell: false,
                    createdAt: new Date().toISOString()
                });

                // 2. Bed & Breakfast Plan
                await addDoc(getHotelCollection(db, "ratePlans", activeHotelCode), {
                    hotelCode: activeHotelCode,
                    name: `${rt.name} - With Breakfast`,
                    code: `${(rt.name || "RM").slice(0, 3).toUpperCase()}-BB`,
                    roomTypeId: rt.id,
                    roomTypeName: rt.name,
                    baseRate: rtBase > 0 ? rtBase + 100000 : 0,
                    currency: "IDR",
                    mealsIncluded: true,
                    cancellationPolicy: "FREE",
                    minStay: 1,
                    stopSell: false,
                    createdAt: new Date().toISOString()
                });
            }
            toast.success("Default Rate Plans berhasil dibuat.");
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
            await addDoc(getHotelCollection(db, "ratePlans", activeHotelCode), {
                ...data,
                hotelCode: activeHotelCode,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
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
            const ref = doc(getHotelCollection(db, "ratePlans", activeHotelCode), id);
            await deleteDoc(ref);
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
