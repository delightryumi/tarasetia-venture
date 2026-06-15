import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface LandingSettings {
    lightLogo: string;
    darkLogo: string;
    bookingEngineUrl: string;
}

export const useLandingSettings = () => {
    const [settings, setSettings] = useState<LandingSettings>({
        lightLogo: "",
        darkLogo: "",
        bookingEngineUrl: "#",
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docSnap = await getDoc(doc(getHotelCollection(db, "settings"), "landingPage"));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setSettings({
                        lightLogo: data.lightLogo || "",
                        darkLogo: data.darkLogo || "",
                        bookingEngineUrl: data.bookingEngineUrl || "#",
                    });
                }
            } catch (err) {
                console.error("Error fetching landing settings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return { ...settings, loading };
};
