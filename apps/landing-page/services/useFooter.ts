"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface SocialLink {
    platform: string;
    url: string;
}

export interface FooterData {
    address: string;
    phones: string[];
    email: string;
    mapsEmbed: string;
    poweredByText: string;
    poweredByLink: string;
    socialLinks: SocialLink[];
}

export const useFooter = () => {
    const [data, setData] = useState<FooterData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFooter = async () => {
            try {
                const docRef = doc(getHotelCollection(db, "settings"), "footer");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const firestoreData = docSnap.data();
                    setData({
                        address: firestoreData.address || "",
                        phones: Array.isArray(firestoreData.phones) ? firestoreData.phones : [],
                        email: firestoreData.email || "",
                        mapsEmbed: firestoreData.mapsEmbed || "",
                        poweredByText: firestoreData.poweredByText || "",
                        poweredByLink: firestoreData.poweredByLink || "",
                        socialLinks: firestoreData.socialLinks || [],
                    });
                }
            } catch (err) {
                console.error("Error fetching footer:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFooter();
    }, []);

    return { data, loading };
};
