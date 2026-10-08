import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface Package {
    id: string;
    name: string;
    description: string;
    price: string;
    features: string[];
    imageUrl?: string;
    packageType?: string; // MICE, Wedding, Trip, etc.
}

// In-memory cache for landing page packages
let packagesCache: { data: Package[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

export const usePackages = () => {
    const [packages, setPackages] = useState<Package[]>(() => {
        if (packagesCache && Date.now() - packagesCache.timestamp < CACHE_TTL_MS) {
            return packagesCache.data;
        }
        return [];
    });
    const [loading, setLoading] = useState<boolean>(() => {
        return !(packagesCache && Date.now() - packagesCache.timestamp < CACHE_TTL_MS);
    });

    useEffect(() => {
        if (packagesCache && Date.now() - packagesCache.timestamp < CACHE_TTL_MS) {
            setPackages(packagesCache.data);
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchPackages = async () => {
            try {
                const { getDocs } = await import("firebase/firestore");
                const q = query(getHotelCollection(db, "packages"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Package[];

                packagesCache = { data, timestamp: Date.now() };
                if (isMounted) {
                    setPackages(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading packages:", err);
                if (isMounted) setLoading(false);
            }
        };

        fetchPackages();
        return () => {
            isMounted = false;
        };
    }, []);

    return { packages, loading };
};

export const usePackageById = (id: string) => {
    const [pkg, setPkg] = useState<Package | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchPackage = async () => {
            try {
                const { doc, getDoc } = await import("firebase/firestore");
                const docRef = doc(getHotelCollection(db, "packages"), id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPkg({ id: docSnap.id, ...docSnap.data() } as Package);
                } else {
                    setPkg(null);
                }
            } catch (err) {
                console.error("Error fetching package:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPackage();
    }, [id]);

    return { pkg, loading };
};
