import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const useLogo = () => {
    const [lightLogo, setLightLogo] = useState("");
    const [darkLogo, setDarkLogo] = useState("");
    const [bookingEngineUrl, setBookingEngineUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchLogos = async () => {
            try {
                const docRef = doc(db, "settings", "landingPage");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setLightLogo(data.lightLogo || "");
                    setDarkLogo(data.darkLogo || "");
                    setBookingEngineUrl(data.bookingEngineUrl || "");
                }
            } catch (err) {
                console.error("Error fetching logos:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogos();
    }, []);

    const handleSave = async (overrides?: { light?: string; dark?: string }) => {
        setSaving(true);
        setMessage("");
        try {
            const finalLight = overrides?.light !== undefined ? overrides.light : lightLogo;
            const finalDark = overrides?.dark !== undefined ? overrides.dark : darkLogo;

            await setDoc(doc(db, "settings", "landingPage"), {
                lightLogo: finalLight,
                darkLogo: finalDark,
                bookingEngineUrl: bookingEngineUrl
            }, { merge: true });

            if (!overrides) {
                setMessage("Branding updated successfully!");
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (err) {
            console.error("Error saving logos:", err);
            alert("Failed to sync branding settings.");
        } finally {
            setSaving(false);
        }
    };

    return {
        lightLogo,
        setLightLogo,
        darkLogo,
        setDarkLogo,
        bookingEngineUrl,
        setBookingEngineUrl,
        loading,
        saving,
        message,
        handleSave,
    };
};
