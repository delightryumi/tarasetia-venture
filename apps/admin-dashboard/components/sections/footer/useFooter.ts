import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export interface SocialLink {
    platform: string;
    url: string;
}

export const useFooter = () => {
    const [address, setAddress] = useState("");
    const [phones, setPhones] = useState<string[]>([]);
    const [email, setEmail] = useState("");
    const [mapsEmbed, setMapsEmbed] = useState("");
    const [poweredByText, setPoweredByText] = useState("");
    const [poweredByLink, setPoweredByLink] = useState("");
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [newPhone, setNewPhone] = useState("");
    const [newPlatform, setNewPlatform] = useState("");
    const [newUrl, setNewUrl] = useState("");

    useEffect(() => {
        const fetchFooter = async () => {
            try {
                const docRef = doc(db, "settings", "footer");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setAddress(data.address || "");
                    // Handle migration or default empty array
                    if (Array.isArray(data.phones)) {
                        setPhones(data.phones);
                    } else if (typeof data.phone === "string" && data.phone) {
                        setPhones([data.phone]);
                    } else {
                        setPhones([]);
                    }
                    setEmail(data.email || "");
                    setMapsEmbed(data.mapsEmbed || "");
                    setPoweredByText(data.poweredByText || "");
                    setPoweredByLink(data.poweredByLink || "");
                    setSocialLinks(data.socialLinks || []);
                }
            } catch (err) {
                console.error("Error fetching footer:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFooter();
    }, []);

    const addPhone = () => {
        if (!newPhone) return;
        if (phones.includes(newPhone)) {
            toast.error("This phone number is already added.");
            return;
        }
        setPhones([...phones, newPhone]);
        setNewPhone("");
    };

    const removePhone = (index: number) => {
        setPhones(phones.filter((_, i) => i !== index));
    };

    const addSocial = () => {
        if (!newPlatform || !newUrl) return;
        setSocialLinks([...socialLinks, { platform: newPlatform, url: newUrl }]);
        setNewPlatform("");
        setNewUrl("");
    };

    const removeSocial = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "settings", "footer"), {
                address,
                phones,
                email,
                mapsEmbed,
                poweredByText,
                poweredByLink,
                socialLinks,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            toast.success("Footer settings synchronized successfully.");
        } catch (err) {
            console.error("Error saving footer:", err);
            toast.error("Failed to save footer updates.");
        } finally {
            setSaving(false);
        }
    };

    return {
        address,
        setAddress,
        phones,
        addPhone,
        removePhone,
        newPhone,
        setNewPhone,
        email,
        setEmail,
        mapsEmbed,
        setMapsEmbed,
        poweredByText,
        setPoweredByText,
        poweredByLink,
        setPoweredByLink,
        socialLinks,
        addSocial,
        removeSocial,
        newPlatform,
        setNewPlatform,
        newUrl,
        setNewUrl,
        loading,
        saving,
        handleSave,
    };
};
