"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DynamicPricingConfig } from "@/lib/channex/types";
import { useCurrency } from "@/hooks/useCurrency";
import { ChannelDynamicPricingDesktopView } from "./ChannelDynamicPricingDesktopView";
import { ChannelDynamicPricingMobileView } from "./ChannelDynamicPricingMobileView";
import styles from "./ChannelDynamicPricing.module.css";

interface Props {
    hotelCode: string;
}

export function ChannelDynamicPricingTab({ hotelCode }: Props) {
    const { currencyCode, symbol, config: currConfig } = useCurrency(hotelCode);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [syncing, setSyncing] = useState<boolean>(false);

    const [config, setConfig] = useState<DynamicPricingConfig>({
        provider: "pricelabs",
        isEnabled: false,
        apiKey: "",
        propertyId: "",
        minRateGuardrail: 350000,
        maxRateGuardrail: 2500000,
        autoPushToChannex: true
    });

    useEffect(() => {
        if (!hotelCode) return;

        const loadConfig = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "hotels", hotelCode);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const rmsCfg = data?.channelManager?.dynamicPricingConfig;
                    if (rmsCfg) {
                        setConfig({
                            provider: rmsCfg.provider || "pricelabs",
                            isEnabled: Boolean(rmsCfg.isEnabled),
                            apiKey: rmsCfg.apiKey || "",
                            propertyId: rmsCfg.propertyId || "",
                            minRateGuardrail: Number(rmsCfg.minRateGuardrail) || 350000,
                            maxRateGuardrail: Number(rmsCfg.maxRateGuardrail) || 2500000,
                            autoPushToChannex: rmsCfg.autoPushToChannex ?? true,
                            lastSyncAt: rmsCfg.lastSyncAt,
                            lastSyncStatus: rmsCfg.lastSyncStatus,
                            syncNotes: rmsCfg.syncNotes
                        });
                    }
                }
            } catch (err: any) {
                console.error("Error loading Dynamic Pricing config:", err);
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [hotelCode]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hotelCode) return;

        if (config.minRateGuardrail && config.maxRateGuardrail && config.minRateGuardrail > config.maxRateGuardrail) {
            toast.error("Batas tarif minimal tidak boleh melebihi batas tarif maksimal.");
            return;
        }

        setSaving(true);
        try {
            const docRef = doc(db, "hotels", hotelCode);
            await updateDoc(docRef, {
                "channelManager.dynamicPricingConfig": {
                    ...config,
                    updatedAt: new Date().toISOString()
                }
            });

            toast.success("Konfigurasi Dynamic Pricing RMS berhasil disimpan.");
        } catch (err: any) {
            console.error("Error saving Dynamic Pricing config:", err);
            toast.error("Gagal menyimpan konfigurasi Dynamic Pricing.");
        } finally {
            setSaving(false);
        }
    };

    const handleTestRmsSync = async () => {
        if (!hotelCode) return;
        setSyncing(true);
        try {
            const res = await fetch("/api/channex/sync-feed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    channel: "dynamic_pricing",
                    feedType: "rms_rates"
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Rekomendasi tarif RMS berhasil diterima.");
                setConfig(prev => ({
                    ...prev,
                    lastSyncAt: new Date().toISOString(),
                    lastSyncStatus: "SUCCESS"
                }));
            } else {
                toast.error(data.error || "Gagal menyelaraskan rekomendasi tarif RMS.");
            }
        } catch (err: any) {
            toast.error(`Koneksi RMS bermasalah: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#71717a" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                <span>Memuat konfigurasi Dynamic Pricing RMS...</span>
            </div>
        );
    }

    const sharedProps = {
        hotelCode,
        config,
        setConfig,
        saving,
        syncing,
        currencyCode,
        symbol,
        currStep: currConfig.step,
        onSave: handleSave,
        onTestRmsSync: handleTestRmsSync
    };

    return (
        <div className={styles.container}>
            {/* Desktop View */}
            <div className={styles.desktopOnly}>
                <ChannelDynamicPricingDesktopView {...sharedProps} />
            </div>

            {/* Mobile View */}
            <div className={styles.mobileOnly}>
                <ChannelDynamicPricingMobileView {...sharedProps} />
            </div>
        </div>
    );
}
