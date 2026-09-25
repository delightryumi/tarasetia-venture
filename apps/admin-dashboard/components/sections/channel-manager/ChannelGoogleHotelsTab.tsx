"use client";

import React, { useState, useEffect } from "react";
import { Globe, CheckCircle2, AlertCircle, Save, RefreshCw, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleHotelConfig } from "@/lib/channex/types";
import styles from "./ChannelGoogleHotels.module.css";

interface Props {
    hotelCode: string;
}

export function ChannelGoogleHotelsTab({ hotelCode }: Props) {
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [syncing, setSyncing] = useState<boolean>(false);

    const [config, setConfig] = useState<GoogleHotelConfig>({
        isEnabled: false,
        googleHotelCenterId: "",
        status: "DISCONNECTED",
        landingPageUrl: "",
        currency: "IDR",
        taxPolicy: "inclusive",
        totalDirectClicks: 0
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
                    const googleCfg = data?.channelManager?.googleHotelConfig;
                    if (googleCfg) {
                        setConfig({
                            isEnabled: !!googleCfg.isEnabled,
                            googleHotelCenterId: googleCfg.googleHotelCenterId || "",
                            status: googleCfg.status || "DISCONNECTED",
                            landingPageUrl: googleCfg.landingPageUrl || `https://setara.my.id/booking?hotel=${hotelCode}`,
                            currency: googleCfg.currency || "IDR",
                            taxPolicy: googleCfg.taxPolicy || "inclusive",
                            lastSyncAt: googleCfg.lastSyncAt,
                            totalDirectClicks: Number(googleCfg.totalDirectClicks || 0)
                        });
                    } else {
                        // Default real initial state
                        setConfig(prev => ({
                            ...prev,
                            landingPageUrl: `https://setara.my.id/booking?hotel=${hotelCode}`
                        }));
                    }
                }
            } catch (err: any) {
                console.error("Error loading Google Hotel config:", err);
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [hotelCode]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hotelCode) return;

        setSaving(true);
        try {
            const docRef = doc(db, "hotels", hotelCode);
            await updateDoc(docRef, {
                "channelManager.googleHotelConfig": {
                    ...config,
                    status: config.isEnabled ? (config.googleHotelCenterId ? "ACTIVE" : "PENDING") : "DISCONNECTED",
                    updatedAt: new Date().toISOString()
                }
            });

            setConfig(prev => ({
                ...prev,
                status: prev.isEnabled ? (prev.googleHotelCenterId ? "ACTIVE" : "PENDING") : "DISCONNECTED"
            }));

            toast.success("Google Hotel Search & Free Booking Links configuration saved successfully.");
        } catch (err: any) {
            console.error("Error saving Google Hotel config:", err);
            toast.error("Failed to save Google Hotels configuration.");
        } finally {
            setSaving(false);
        }
    };

    const handleSyncFeed = async () => {
        if (!hotelCode) return;
        setSyncing(true);
        try {
            const res = await fetch("/api/channex/sync-feed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    channel: "google_hotel",
                    feedType: "ari"
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Google Hotel ARI feed synchronized successfully with Google Hotel Center.");
                setConfig(prev => ({
                    ...prev,
                    lastSyncAt: new Date().toISOString()
                }));
            } else {
                toast.error(data.error || "Failed to synchronize Google Hotel feed.");
            }
        } catch (err: any) {
            toast.error(`Feed Connection Error: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                <span>Loading Google Hotel Search configuration...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <Globe size={18} color="#1e3a2f" />
                        <span>Google Hotel Search &amp; Free Booking Links (Metasearch Direct)</span>
                        {config.status === "ACTIVE" ? (
                            <span className={styles.statusBadgeActive}>● LIVE GOOGLE LINKS</span>
                        ) : config.status === "PENDING" ? (
                            <span className={styles.statusBadgePending}>⏳ PENDING HOTEL CENTER ID</span>
                        ) : (
                            <span className={styles.statusBadgeDisconnected}>○ INACTIVE</span>
                        )}
                    </div>
                    <span className={styles.desc}>
                        Direct metasearch integration with Google Hotel Ads and Free Booking Links. Guests searching on Google can click straight through to your My Tara Direct Booking Engine with zero OTA commissions.
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={handleSyncFeed}
                        disabled={syncing || !config.isEnabled}
                        className={styles.btnSecondary}
                        title="Synchronize ARI Feed and Room Metadata to Google Hotel Center"
                    >
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} color="#2563eb" />
                        <span>{syncing ? "Pushing Feed..." : "Sync ARI Feed to Google"}</span>
                    </button>
                </div>
            </div>

            {/* Metric Overview (Zero Dummy Data: Real Counts Only) */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Google Hotel Center Status</span>
                    <span className={styles.statValue} style={{ fontSize: "16px", color: config.isEnabled ? "#16a34a" : "#64748b" }}>
                        {config.isEnabled ? (config.googleHotelCenterId ? "Verified" : "Pending Account ID") : "Disconnected"}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Direct Click-Through</span>
                    <span className={styles.statValue}>
                        {Number(config.totalDirectClicks || 0).toLocaleString()}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Google Rate Tax Policy</span>
                    <span className={styles.statValue} style={{ fontSize: "16px" }}>
                        {config.taxPolicy === "inclusive" ? "Tax & Service Inclusive (Gross)" : "Tax Exclusive (Net Rate)"}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Last ARI Feed Sync</span>
                    <span className={styles.statValue} style={{ fontSize: "14px", color: "#64748b" }}>
                        {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString("en-US") : "Never"}
                    </span>
                </div>
            </div>

            {/* Information Banner */}
            <div className={styles.infoBanner}>
                <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                    <b>Benefits of Google Free Booking Links:</b>
                    <p style={{ margin: "4px 0 0 0" }}>
                        Your hotel listing will appear on Google Hotel Search labeled with an official site link badge. Travelers clicking the link are routed straight to your My Tara direct booking engine with real-time rates and live room availability.
                    </p>
                </div>
            </div>

            {/* Configuration Form */}
            <form onSubmit={handleSave} className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        Google Hotel Center Integration Settings
                    </span>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnPrimary}
                    >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Settings"}</span>
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Enable Google Hotel Search</label>
                        <select
                            value={config.isEnabled ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="false">Disable Channel</option>
                            <option value="true">Enable Google Free Booking Links &amp; ARI</option>
                        </select>
                        <span className={styles.hint}>Broadcasts room availability and rates to the global Google travel index.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Google Hotel Center Account ID</label>
                        <input
                            type="text"
                            placeholder="e.g. 1234567890 (Optional if automatically managed)"
                            value={config.googleHotelCenterId || ""}
                            onChange={e => setConfig(prev => ({ ...prev, googleHotelCenterId: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Specify your Google Hotel Center account ID if managed independently.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Direct Engine Landing Page URL Format</label>
                        <input
                            type="url"
                            placeholder="https://setara.my.id/booking?hotel=..."
                            value={config.landingPageUrl || ""}
                            onChange={e => setConfig(prev => ({ ...prev, landingPageUrl: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Target URL where guests land upon clicking the Google direct booking link.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Google Rate Display Tax Policy</label>
                        <select
                            value={config.taxPolicy}
                            onChange={e => setConfig(prev => ({ ...prev, taxPolicy: e.target.value as any }))}
                            className={styles.select}
                        >
                            <option value="inclusive">Tax &amp; Service Inclusive (All-Inclusive Pricing)</option>
                            <option value="exclusive">Tax Exclusive (Net Room Rate)</option>
                        </select>
                        <span className={styles.hint}>Complies with Google Hotel Search pricing display standards.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Transmission Currency</label>
                        <select
                            value={config.currency}
                            onChange={e => setConfig(prev => ({ ...prev, currency: e.target.value }))}
                            className={styles.select}
                        >
                            <option value="IDR">Indonesian Rupiah (IDR)</option>
                            <option value="USD">US Dollar (USD)</option>
                            <option value="SGD">Singapore Dollar (SGD)</option>
                        </select>
                    </div>
                </div>
            </form>
        </div>
    );
}
