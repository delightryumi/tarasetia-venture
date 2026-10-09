"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface LandingSettings {
    lightLogo: string;
    darkLogo: string;
    bookingEngineUrl: string;
}

// Module-level in-memory cache and promise deduplication to eliminate redundant Firestore reads across parallel components
let cachedSettings: { data: LandingSettings; timestamp: number } | null = null;
let pendingSettingsPromise: Promise<LandingSettings | null> | null = null;
const SETTINGS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const useLandingSettings = () => {
    const isCached = Boolean(cachedSettings && (Date.now() - cachedSettings.timestamp < SETTINGS_CACHE_TTL));
    const [settings, setSettings] = useState<LandingSettings>(() => {
        if (isCached && cachedSettings) {
            return cachedSettings.data;
        }
        return {
            lightLogo: "",
            darkLogo: "",
            bookingEngineUrl: "#",
        };
    });
    const [loading, setLoading] = useState(!isCached);

    useEffect(() => {
        if (cachedSettings && (Date.now() - cachedSettings.timestamp < SETTINGS_CACHE_TTL)) {
            setSettings(cachedSettings.data);
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchSettings = async () => {
            try {
                if (!pendingSettingsPromise) {
                    pendingSettingsPromise = (async () => {
                        const docSnap = await getDoc(doc(getHotelCollection(db, "settings"), "landingPage"));
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            const newSettings: LandingSettings = {
                                lightLogo: data.lightLogo || "",
                                darkLogo: data.darkLogo || "",
                                bookingEngineUrl: data.bookingEngineUrl || "#",
                            };
                            cachedSettings = { data: newSettings, timestamp: Date.now() };
                            return newSettings;
                        }
                        return null;
                    })().finally(() => {
                        pendingSettingsPromise = null;
                    });
                }

                const res = await pendingSettingsPromise;
                if (res && isMounted) {
                    setSettings(res);
                }
            } catch (err) {
                console.error("Error fetching landing settings:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    return { ...settings, loading };
};
