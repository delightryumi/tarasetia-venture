"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { PaymentGatewaySettings, DEFAULT_PAYMENT_GATEWAY_SETTINGS } from "./types";

export function usePaymentGateway() {
    const { activeHotelCode, user } = useAuth();
    const [settings, setSettings] = useState<PaymentGatewaySettings>(DEFAULT_PAYMENT_GATEWAY_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch settings on mount or when activeHotelCode changes (single getDoc, 0 idle stream reads)
    const fetchSettings = useCallback(async () => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const docRef = doc(db, "hotels", activeHotelCode, "settings", "payment_gateway");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as Partial<PaymentGatewaySettings>;
                setSettings({
                    ...DEFAULT_PAYMENT_GATEWAY_SETTINGS,
                    ...data,
                    theme: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.theme,
                        ...(data.theme || {}),
                    },
                    preferences: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.preferences,
                        ...(data.preferences || {}),
                    },
                    analytics: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.analytics,
                        ...(data.analytics || {}),
                    },
                    promotions: Array.isArray(data.promotions) ? data.promotions : [],
                    directPerks: Array.isArray(data.directPerks) && data.directPerks.length > 0
                        ? data.directPerks
                        : DEFAULT_PAYMENT_GATEWAY_SETTINGS.directPerks,
                    addOns: Array.isArray(data.addOns) && data.addOns.length > 0
                        ? data.addOns
                        : DEFAULT_PAYMENT_GATEWAY_SETTINGS.addOns,
                    midtrans: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.midtrans,
                        ...(data.midtrans || {}),
                    },
                    xendit: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.xendit,
                        ...(data.xendit || {}),
                    },
                    doku: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.doku,
                        ...(data.doku || {}),
                    },
                    manualTransfer: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.manualTransfer,
                        ...(data.manualTransfer || {}),
                    },
                    pricing: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.pricing,
                        ...(data.pricing || {}),
                    },
                    policies: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.policies,
                        ...(data.policies || {}),
                    },
                    googleHotelCenter: {
                        ...DEFAULT_PAYMENT_GATEWAY_SETTINGS.googleHotelCenter,
                        ...(data.googleHotelCenter || {}),
                    },
                });
            } else {
                setSettings(DEFAULT_PAYMENT_GATEWAY_SETTINGS);
            }
        } catch (err: any) {
            console.error("Error loading payment gateway settings:", err);
            setError(err.message || "Gagal memuat konfigurasi payment gateway.");
        } finally {
            setLoading(false);
        }
    }, [activeHotelCode]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Save settings (writes to Firestore and updates state)
    const saveSettings = async (newSettings: PaymentGatewaySettings) => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setError("Kode hotel tidak valid.");
            return false;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const docRef = doc(db, "hotels", activeHotelCode, "settings", "payment_gateway");
            const payload = {
                ...newSettings,
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || user?.name || "admin",
            };

            await setDoc(docRef, payload, { merge: true });
            setSettings(newSettings);
            setSuccessMessage("Pengaturan Direct Booking Engine & Payment Gateway berhasil disimpan.");
            return true;
        } catch (err: any) {
            console.error("Error saving payment gateway settings:", err);
            setError(err.message || "Gagal menyimpan konfigurasi.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    return {
        settings,
        setSettings,
        loading,
        saving,
        error,
        successMessage,
        saveSettings,
        refetch: fetchSettings,
    };
}
