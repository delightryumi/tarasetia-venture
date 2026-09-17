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
            toast.error("Batas harga minimum tidak boleh lebih besar dari batas maksimum!");
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

            toast.success("Konfigurasi Dynamic Pricing RMS berhasil disimpan!");
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
                toast.success(data.message || "Pembaruan rekomendasi harga RMS berhasil diterima!");
                setConfig(prev => ({
                    ...prev,
                    lastSyncAt: new Date().toISOString(),
                    lastSyncStatus: "SUCCESS"
                }));
            } else {
                toast.error(data.error || "Gagal sinkronisasi rekomendasi harga RMS.");
            }
        } catch (err: any) {
            toast.error(`Error koneksi RMS: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                <span>Memuat pengaturan Dynamic Pricing RMS...</span>
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
                            <span className={styles.badgeActive}>● AKTIF ({config.provider.toUpperCase()})</span>
                        ) : (
                            <span className={styles.badgeInactive}>○ NON-AKTIF</span>
                        )}
                    </div>
                    <span className={styles.desc}>
                        Channex menghubungkan PMS My Tara secara 2-arah dengan engine AI yield &amp; dynamic pricing internasional (PriceLabs, Beyond Pricing, RoomPriceGenie).
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={handleTestRmsSync}
                        disabled={syncing || !config.isEnabled}
                        className={styles.btnSecondary}
                        title="Tarik rekomendasi harga terbaru dari RMS"
                    >
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                        <span>{syncing ? "Sinkronisasi..." : "Tarik Rekomendasi Tarif"}</span>
                    </button>
                </div>
            </div>

            {/* Banner */}
            <div className={styles.banner}>
                <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                    <b>Keamanan Batasan Tarif (Rate Floor &amp; Ceiling Guardrails):</b>
                    <p style={{ margin: "4px 0 0 0" }}>
                        Untuk mencegah *pricing glitch* atau harga jual terlalu murah / terlalu mahal yang diajukan AI RMS, My Tara menerapkan filter batas atas dan batas bawah absolut sebelum diteruskan ke saluran OTA Channex.
                    </p>
                </div>
            </div>

            {/* Configuration Form */}
            <form onSubmit={handleSave} className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        <Sliders size={16} color="#1e3a2f" />
                        <span>Konfigurasi Penyedia RMS &amp; Proteksi Tarif</span>
                    </span>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnPrimary}
                    >
                        <Save size={14} />
                        <span>{saving ? "Menyimpan..." : "Simpan Pengaturan RMS"}</span>
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Penyedia RMS (Dynamic Pricing Engine)</label>
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
                        <label className={styles.label}>Status Koneksi Integrasi</label>
                        <select
                            value={config.isEnabled ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="false">Nonaktifkan Integrasi</option>
                            <option value="true">Aktifkan Sinkronisasi Otomatis</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>API Key / Webhook Token RMS</label>
                        <input
                            type="password"
                            placeholder="Kredensial API dari dashboard RMS..."
                            value={config.apiKey || ""}
                            onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Digunakan untuk otorisasi webhook pembaruan harga harian.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>RMS Property / Listing Identifier</label>
                        <input
                            type="text"
                            placeholder="Contoh: PL-HOTEL-88912"
                            value={config.propertyId || ""}
                            onChange={e => setConfig(prev => ({ ...prev, propertyId: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>ID Properti yang terdaftar di akun PriceLabs atau RoomPriceGenie Anda.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Batas Tarif Minimum (Rate Floor Guardrail)</label>
                        <input
                            type="number"
                            min={50000}
                            step={10000}
                            value={config.minRateGuardrail || ""}
                            onChange={e => setConfig(prev => ({ ...prev, minRateGuardrail: Number(e.target.value) || 0 }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Tarif tidak akan pernah turun di bawah nominal ini apapun rekomendasi AI.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Batas Tarif Maksimum (Rate Ceiling Guardrail)</label>
                        <input
                            type="number"
                            min={100000}
                            step={50000}
                            value={config.maxRateGuardrail || ""}
                            onChange={e => setConfig(prev => ({ ...prev, maxRateGuardrail: Number(e.target.value) || 0 }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Tarif tertinggi yang diizinkan untuk mencegah overpricing saat peak season.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Otomatis Dorong ke Saluran Channex</label>
                        <select
                            value={config.autoPushToChannex ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, autoPushToChannex: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="true">Ya, Otomatis Push ke Seluruh OTA saat Rekomendasi Masuk</option>
                            <option value="false">Tinjau Manual di Matriks Terlebih Dahulu</option>
                        </select>
                    </div>
                </div>
            </form>
        </div>
    );
}
