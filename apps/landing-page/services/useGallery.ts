"use client";

import { useState, useEffect } from "react";
import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface GalleryItem {
    id: string;
    url: string;
    order: number;
    storagePath: string;
    category?: string;
}

export const useGallery = () => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(getHotelCollection(db, "gallery"), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GalleryItem[];
            setItems(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching gallery:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return {
        items,
        loading
    };
};
