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

            toast.success("Konfigurasi Google Hotel Search & Free Booking Links berhasil disimpan!");
        } catch (err: any) {
            console.error("Error saving Google Hotel config:", err);
            toast.error("Gagal menyimpan konfigurasi Google Hotels.");
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
                toast.success(data.message || "Feed ARI Google Hotel berhasil disinkronkan ke Google Hotel Center!");
                setConfig(prev => ({
                    ...prev,
                    lastSyncAt: new Date().toISOString()
                }));
            } else {
                toast.error(data.error || "Gagal sinkronisasi feed Google Hotel.");
            }
        } catch (err: any) {
            toast.error(`Koneksi Feed Error: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                <span>Memuat konfigurasi Google Hotel Search...</span>
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
                            <span className={styles.statusBadgePending}>⏳ MENUNGGU ID HOTEL CENTER</span>
                        ) : (
                            <span className={styles.statusBadgeDisconnected}>○ NON-AKTIF</span>
                        )}
                    </div>
                    <span className={styles.desc}>
                        Sistem terhubung secara resmi dengan Google Hotel Ads &amp; Free Booking Links. Tamu di Google Search dapat mengklik tautan langsung untuk memesan di My Tara Booking Engine tanpa komisi OTA.
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={handleSyncFeed}
                        disabled={syncing || !config.isEnabled}
                        className={styles.btnSecondary}
                        title="Kirim Feed ARI dan Metadata Kamar ke Google Hotel Center"
                    >
                        <Zap size={14} className={syncing ? "animate-spin" : ""} color="#f59e0b" />
                        <span>{syncing ? "Mendorong Feed..." : "Sinkron ARI Feed ke Google"}</span>
                    </button>
                </div>
            </div>

            {/* Metric Overview (Zero Dummy Data: Real Counts Only) */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Status Google Hotel Center</span>
                    <span className={styles.statValue} style={{ fontSize: "16px", color: config.isEnabled ? "#16a34a" : "#64748b" }}>
                        {config.isEnabled ? (config.googleHotelCenterId ? "Terverifikasi" : "Menunggu ID") : "Belum Terhubung"}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Direct Click-Through</span>
                    <span className={styles.statValue}>
                        {Number(config.totalDirectClicks || 0).toLocaleString()}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Kebijakan Pajak Google</span>
                    <span className={styles.statValue} style={{ fontSize: "16px" }}>
                        {config.taxPolicy === "inclusive" ? "Harga Termasuk Pajak (Nett)" : "Sebelum Pajak"}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Terakhir Sinkron ARI Feed</span>
                    <span className={styles.statValue} style={{ fontSize: "14px", color: "#64748b" }}>
                        {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString("id-ID") : "Belum Pernah"}
                    </span>
                </div>
            </div>

            {/* Information Banner */}
            <div className={styles.infoBanner}>
                <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                    <b>Keuntungan Google Free Booking Links:</b>
                    <p style={{ margin: "4px 0 0 0" }}>
                        Listing hotel Anda akan muncul di hasil pencarian Google Hotel Search dengan label tautan situs resmi. Tamu yang menekan tombol pesan akan langsung diarahkan ke landing page booking engine My Tara Anda dengan harga real-time tanpa potongan komisi perantara.
                    </p>
                </div>
            </div>

            {/* Configuration Form */}
            <form onSubmit={handleSave} className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        ⚙️ Pengaturan Integrasi Google Hotel Center
                    </span>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnPrimary}
                    >
                        <Save size={14} />
                        <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Aktifkan Google Hotel Search</label>
                        <select
                            value={config.isEnabled ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="false">Nonaktifkan Saluran</option>
                            <option value="true">Aktifkan Google Free Booking Links &amp; ARI</option>
                        </select>
                        <span className={styles.hint}>Sistem akan mulai memancarkan ketersediaan dan harga kamar hotel Anda ke katalog Google.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Google Hotel Center Account ID</label>
                        <input
                            type="text"
                            placeholder="Contoh: 1234567890 (Opsional jika dikelola secara otomatis)"
                            value={config.googleHotelCenterId || ""}
                            onChange={e => setConfig(prev => ({ ...prev, googleHotelCenterId: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Jika hotel memiliki Google Business Profile/Hotel Center mandiri, cantumkan Account ID di sini.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Landing Page URL Format (Direct Engine)</label>
                        <input
                            type="url"
                            placeholder="https://setara.my.id/booking?hotel=..."
                            value={config.landingPageUrl || ""}
                            onChange={e => setConfig(prev => ({ ...prev, landingPageUrl: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>URL halaman tempat tamu mendarat setelah mengklik tautan Google.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Format Pajak Tampilan Google (Tax Policy)</label>
                        <select
                            value={config.taxPolicy}
                            onChange={e => setConfig(prev => ({ ...prev, taxPolicy: e.target.value as any }))}
                            className={styles.select}
                        >
                            <option value="inclusive">Harga Final Termasuk Pajak &amp; Layanan (Direkomendasikan di Indonesia)</option>
                            <option value="exclusive">Harga Dasar Belum Termasuk Pajak (Exclusive)</option>
                        </select>
                        <span className={styles.hint}>Sesuai standar Google Hotel Search regional Indonesia (All-Inclusive Pricing).</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Mata Uang Transmisi Google</label>
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
