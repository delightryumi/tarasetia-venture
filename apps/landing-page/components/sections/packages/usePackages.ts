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

export const usePackages = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(getHotelCollection(db, "packages"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Package[];
            setPackages(data);
            setLoading(false);
        });

        return () => unsubscribe();
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
