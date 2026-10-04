import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { toast } from "sonner";

export interface SocialLink {
    platform: string;
    url: string;
}

let cachedFooterData: any = null;

export const useFooter = () => {
    const [address, setAddress] = useState(cachedFooterData?.address || "");
    const [phones, setPhones] = useState<string[]>(cachedFooterData?.phones || []);
    const [email, setEmail] = useState(cachedFooterData?.email || "");
    const [mapsEmbed, setMapsEmbed] = useState(cachedFooterData?.mapsEmbed || "");
    const [poweredByText, setPoweredByText] = useState(cachedFooterData?.poweredByText || "");
    const [poweredByLink, setPoweredByLink] = useState(cachedFooterData?.poweredByLink || "");
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>(cachedFooterData?.socialLinks || []);
    const [loading, setLoading] = useState(!cachedFooterData);
    const [saving, setSaving] = useState(false);

    const [newPhone, setNewPhone] = useState("");
    const [newPlatform, setNewPlatform] = useState("");
    const [newUrl, setNewUrl] = useState("");

    useEffect(() => {
        if (cachedFooterData) {
            setLoading(false);
            return;
        }

        const fetchFooter = async () => {
            try {
                const docRef = doc(getHotelCollection(db, "settings"), "footer");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const addr = data.address || "";
                    const ph = Array.isArray(data.phones) ? data.phones : (typeof data.phone === "string" && data.phone ? [data.phone] : []);
                    const em = data.email || "";
                    const maps = data.mapsEmbed || "";
                    const pText = data.poweredByText || "";
                    const pLink = data.poweredByLink || "";
                    const soc = data.socialLinks || [];

                    cachedFooterData = { address: addr, phones: ph, email: em, mapsEmbed: maps, poweredByText: pText, poweredByLink: pLink, socialLinks: soc };

                    setAddress(addr);
                    setPhones(ph);
                    setEmail(em);
                    setMapsEmbed(maps);
                    setPoweredByText(pText);
                    setPoweredByLink(pLink);
                    setSocialLinks(soc);
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
            await setDoc(doc(getHotelCollection(db, "settings"), "footer"), {
                address,
                phones,
                email,
                mapsEmbed,
                poweredByText,
                poweredByLink,
                socialLinks,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            cachedFooterData = { address, phones, email, mapsEmbed, poweredByText, poweredByLink, socialLinks };
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
