import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export const usePromo = () => {
    const [isActive, setIsActive] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [promoCode, setPromoCode] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPromo = async () => {
            try {
                const docRef = doc(db, "sections", "promo");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setIsActive(data.isActive || false);
                    setTitle(data.title || "");
                    setDescription(data.description || "");
                    setPromoCode(data.promoCode || "");
                    setExpiryDate(data.expiryDate || "");
                    setImageUrl(data.imageUrl || "");
                }
            } catch (err) {
                console.error("Error fetching promo:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPromo();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "sections", "promo"), {
                isActive,
                title,
                description,
                promoCode,
                expiryDate,
                imageUrl,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            toast.success("Promo settings refined!");
        } catch (err) {
            console.error("Error saving promo:", err);
            toast.error("Failed to save promo updates.");
        } finally {
            setSaving(false);
        }
    };

    return {
        isActive,
        setIsActive,
        title,
        setTitle,
        description,
        setDescription,
        promoCode,
        setPromoCode,
        expiryDate,
        setExpiryDate,
        imageUrl,
        setImageUrl,
        loading,
        saving,
        handleSave,
    };
};
