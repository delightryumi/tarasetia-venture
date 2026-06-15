import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { toast } from "sonner";

export interface SEOData {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
    ogTitle?: string;
    ogDescription?: string;
    dashboardFavicon?: string;
    landingFavicon?: string;
    twitterCard?: "summary" | "summary_large_image";
    twitterHandle?: string;
    canonicalUrl?: string;
    googleSiteVerification?: string;
    author?: string;
}

export const useSEO = () => {
    const [seo, setSeo] = useState<SEOData>({
        title: "",
        description: "",
        keywords: "",
        ogImage: "",
        ogTitle: "",
        ogDescription: "",
        dashboardFavicon: "",
        landingFavicon: "",
        twitterCard: "summary_large_image",
        twitterHandle: "",
        canonicalUrl: "",
        googleSiteVerification: "",
        author: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(getHotelCollection(db, "settings"), "seo"), (snapshot) => {
            if (snapshot.exists()) {
                setSeo((prev) => ({ ...prev, ...snapshot.data() }));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setSaving(true);
        try {
            await setDoc(doc(getHotelCollection(db, "settings"), "seo"), seo);
            toast.success("SEO settings secured.");
        } catch (err) {
            console.error("Error saving SEO:", err);
            toast.error("Failed to save metadata.");
        } finally {
            setSaving(false);
        }
    };

    const updateSEO = (key: keyof SEOData, value: string) => {
        setSeo((prev) => ({ ...prev, [key]: value }));
    };

    return { seo, loading, saving, updateSEO, handleSave };
};
