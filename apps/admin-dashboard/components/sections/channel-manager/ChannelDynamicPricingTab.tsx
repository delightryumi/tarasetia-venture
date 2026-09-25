"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, CheckCircle2, AlertTriangle, Save, RefreshCw, Sliders, ShieldCheck, Key } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DynamicPricingConfig } from "@/lib/channex/types";
import styles from "./ChannelDynamicPricing.module.css";

interface Props {
    hotelCode: string;
}

export function ChannelDynamicPricingTab({ hotelCode }: Props) {
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
                            isEnabled: !!rmsCfg.isEnabled,
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
            toast.error("Minimum rate guardrail cannot exceed maximum rate guardrail!");
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

            toast.success("Dynamic Pricing RMS configuration saved successfully.");
        } catch (err: any) {
            console.error("Error saving Dynamic Pricing config:", err);
            toast.error("Failed to save Dynamic Pricing configuration.");
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
                toast.success(data.message || "RMS rate recommendations received and applied successfully.");
                setConfig(prev => ({
                    ...prev,
                    lastSyncAt: new Date().toISOString(),
                    lastSyncStatus: "SUCCESS"
                }));
            } else {
                toast.error(data.error || "Failed to synchronize RMS rate recommendations.");
            }
        } catch (err: any) {
            toast.error(`RMS connection error: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                <span>Loading Dynamic Pricing RMS configuration...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <TrendingUp size={18} color="#1e3a2f" />
                        <span>Dynamic Pricing &amp; Revenue Management System (RMS) Connector</span>
                        {config.isEnabled ? (
                            <span className={styles.badgeActive}>● ACTIVE ({config.provider.toUpperCase()})</span>
                        ) : (
                            <span className={styles.badgeInactive}>○ INACTIVE</span>
                        )}
                    </div>
                    <span className={styles.desc}>
                        Connects My Tara PMS directly with international revenue management systems (PriceLabs, RoomPriceGenie, Beyond Pricing) for dynamic rate yield management.
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={handleTestRmsSync}
                        disabled={syncing || !config.isEnabled}
                        className={styles.btnSecondary}
                        title="Fetch latest rate recommendations from RMS"
                    >
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                        <span>{syncing ? "Synchronizing..." : "Fetch Rate Recommendations"}</span>
                    </button>
                </div>
            </div>

            {/* Banner */}
            <div className={styles.banner}>
                <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                    <b>Rate Floor &amp; Ceiling Guardrails:</b>
                    <p style={{ margin: "4px 0 0 0" }}>
                        To protect against inadvertent pricing spikes or severe rate drops, My Tara enforces strict rate floor and ceiling guardrails before publishing rates to connected OTA channels.
                    </p>
                </div>
            </div>

            {/* Configuration Form */}
            <form onSubmit={handleSave} className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        <Sliders size={16} color="#1e3a2f" />
                        <span>RMS Provider Configuration &amp; Rate Guardrails</span>
                    </span>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnPrimary}
                    >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save RMS Configuration"}</span>
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>RMS Provider (Dynamic Pricing Engine)</label>
                        <select
                            value={config.provider}
                            onChange={e => setConfig(prev => ({ ...prev, provider: e.target.value as any }))}
                            className={styles.select}
                        >
                            <option value="pricelabs">PriceLabs (Hotel &amp; Vacation Rental)</option>
                            <option value="roompricegenie">RoomPriceGenie (Boutique Hotel Specialist)</option>
                            <option value="beyond">Beyond Pricing (Dynamic Yield)</option>
                            <option value="custom">Channex Built-in Pricing Engine / Custom Webhook</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Integration Connection Status</label>
                        <select
                            value={config.isEnabled ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="false">Disable Integration</option>
                            <option value="true">Enable Automated Synchronization</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>RMS API Key / Webhook Secret</label>
                        <input
                            type="password"
                            placeholder="API credentials from RMS dashboard..."
                            value={config.apiKey || ""}
                            onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Used to authenticate inbound rate recommendation updates.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>RMS Property / Listing Identifier</label>
                        <input
                            type="text"
                            placeholder="e.g. PL-HOTEL-88912"
                            value={config.propertyId || ""}
                            onChange={e => setConfig(prev => ({ ...prev, propertyId: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Property or listing ID configured in your PriceLabs or RoomPriceGenie account.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Minimum Rate (Rate Floor Guardrail)</label>
                        <input
                            type="number"
                            min={50000}
                            step={10000}
                            value={config.minRateGuardrail || ""}
                            onChange={e => setConfig(prev => ({ ...prev, minRateGuardrail: Number(e.target.value) || 0 }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Rates will never drop below this threshold regardless of dynamic pricing models.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Maximum Rate (Rate Ceiling Guardrail)</label>
                        <input
                            type="number"
                            min={100000}
                            step={50000}
                            value={config.maxRateGuardrail || ""}
                            onChange={e => setConfig(prev => ({ ...prev, maxRateGuardrail: Number(e.target.value) || 0 }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Maximum allowable rate to prevent overpricing during peak occupancy dates.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Automatic Push to Distribution Channels</label>
                        <select
                            value={config.autoPushToChannex ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, autoPushToChannex: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="true">Yes, Automatically Push to All OTAs upon Recommendation Receipt</option>
                            <option value="false">Review Manually in Rate Matrix First</option>
                        </select>
                    </div>
                </div>
            </form>
        </div>
    );
}
