"use client";

import { useState, useEffect } from "react";
import {
    query,
    orderBy,
    getDocs
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

// In-memory cache across landing page navigation to eliminate redundant Firestore reads
let galleryCache: { data: GalleryItem[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const useGallery = () => {
    const [items, setItems] = useState<GalleryItem[]>(() => {
        if (galleryCache && Date.now() - galleryCache.timestamp < CACHE_TTL_MS) {
            return galleryCache.data;
        }
        return [];
    });
    const [loading, setLoading] = useState<boolean>(() => {
        return !(galleryCache && Date.now() - galleryCache.timestamp < CACHE_TTL_MS);
    });

    useEffect(() => {
        if (galleryCache && Date.now() - galleryCache.timestamp < CACHE_TTL_MS) {
            setItems(galleryCache.data);
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchGallery = async () => {
            try {
                const q = query(getHotelCollection(db, "gallery"), orderBy("order", "asc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as GalleryItem[];

                galleryCache = { data, timestamp: Date.now() };
                if (isMounted) {
                    setItems(data);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching gallery:", error);
                if (isMounted) setLoading(false);
            }
        };

        fetchGallery();
        return () => {
            isMounted = false;
        };
    }, []);

    return {
        items,
        loading
    };
};
