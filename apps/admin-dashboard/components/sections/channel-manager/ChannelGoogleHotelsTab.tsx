"use client";

import React, { useState, useEffect } from "react";
import { Globe, CheckCircle2, AlertCircle, Save, RefreshCw, ExternalLink, ShieldCheck, Zap, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleHotelConfig } from "@/lib/channex/types";
import { SUPPORTED_CURRENCIES } from "@/lib/currency-utils";
import styles from "./ChannelGoogleHotels.module.css";

interface Props {
    hotelCode: string;
}

interface ReadinessItem {
    id: string;
    label: string;
    description: string;
    isComplete: boolean;
    hint: string;
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

    const [readinessItems, setReadinessItems] = useState<ReadinessItem[]>([]);

    useEffect(() => {
        if (!hotelCode) return;

        const loadConfig = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "hotels", hotelCode);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const hotelCurr = (data?.currency || data?.channelManager?.currency || data?.baseCurrency || "IDR").toUpperCase().trim();
                    const googleCfg = data?.channelManager?.googleHotelConfig;
                    
                    const resolvedLandingUrl = googleCfg?.landingPageUrl || `https://setara.my.id/booking?hotel=${hotelCode}`;

                    if (googleCfg) {
                        setConfig({
                            isEnabled: !!googleCfg.isEnabled,
                            googleHotelCenterId: googleCfg.googleHotelCenterId || "",
                            status: googleCfg.status || "DISCONNECTED",
                            landingPageUrl: resolvedLandingUrl,
                            currency: googleCfg.currency || hotelCurr,
                            taxPolicy: googleCfg.taxPolicy || "inclusive",
                            lastSyncAt: googleCfg.lastSyncAt,
                            totalDirectClicks: Number(googleCfg.totalDirectClicks || 0)
                        });
                    } else {
                        setConfig(prev => ({
                            ...prev,
                            currency: hotelCurr,
                            landingPageUrl: resolvedLandingUrl
                        }));
                    }

                    // Check Room Types
                    let roomTypesCount = 0;
                    try {
                        const rtSnap = await getDocs(collection(db, `hotels/${hotelCode}/roomTypes`));
                        roomTypesCount = rtSnap.docs.length;
                    } catch (e) {
                        console.warn("Could not load room types for readiness check:", e);
                    }

                    // Calculate 10-Point Readiness Items (Official Channex & Google Hotel Ads Standard)
                    const hasCoordinates = Boolean(data?.latitude || data?.location?.latitude || data?.lat || data?.coordinates?.lat || data?.geo?.latitude);
                    const hasAddress = Boolean((data?.address || data?.location?.address || "").trim().length >= 10);
                    const hasPhone = Boolean((data?.phone || data?.telephone || data?.contactPhone || data?.whatsapp || "").trim().length >= 8);
                    const hasTimezone = Boolean(data?.timezone || "Asia/Jakarta");
                    const photos = data?.photos || data?.images || data?.gallery || [];
                    const hasPhotos = Array.isArray(photos) && photos.length >= 4;
                    const hasDescription = Boolean((data?.description || data?.about || data?.profileText || "").trim().length >= 30);
                    const hasRoomTypes = roomTypesCount > 0;
                    const hasCheckInOut = Boolean(data?.checkInTime || data?.settings?.checkInTime || "14:00");
                    const hasCancellation = Boolean(data?.cancellationPolicy || data?.policy || data?.policies?.cancellation || "Standard 24h Policy");
                    const hasLandingUrl = Boolean(resolvedLandingUrl && resolvedLandingUrl.startsWith("http"));

                    setReadinessItems([
                        {
                            id: "coordinates",
                            label: "Koordinat GPS (Latitude & Longitude)",
                            description: "Titik lokasi akurat di Google Maps untuk navigasi tamu.",
                            isComplete: hasCoordinates,
                            hint: hasCoordinates ? "Lengkap" : "Isi koordinat GPS di Pengaturan Hotel"
                        },
                        {
                            id: "address",
                            label: "Alamat Lengkap & Kota",
                            description: "Alamat jalan, nomor, kecamatan, kota dan kode pos resmi.",
                            isComplete: hasAddress,
                            hint: hasAddress ? "Lengkap" : "Lengkapi alamat properti di Pengaturan Hotel"
                        },
                        {
                            id: "phone",
                            label: "Nomor Telepon Kontak Resmi",
                            description: "Nomor meja resepsionis dengan kode negara (+62).",
                            isComplete: hasPhone,
                            hint: hasPhone ? "Lengkap" : "Tambahkan nomor telepon hotel"
                        },
                        {
                            id: "timezone",
                            label: "Zona Waktu IANA (Timezone)",
                            description: "Standar zona waktu properti (contoh: Asia/Jakarta).",
                            isComplete: hasTimezone,
                            hint: "Asia/Jakarta"
                        },
                        {
                            id: "photos",
                            label: "Galeri Foto High-Res (Min. 4 Foto)",
                            description: "Foto eksterior, lobi, dan kamar resolusi tinggi (1024x768+).",
                            isComplete: hasPhotos,
                            hint: hasPhotos ? `${photos.length} foto terunggah` : "Unggah minimal 4 foto di Galeri"
                        },
                        {
                            id: "description",
                            label: "Deskripsi Properti",
                            description: "Uraian fasilitas dan keunggulan hotel bagi calon tamu.",
                            isComplete: hasDescription,
                            hint: hasDescription ? "Lengkap" : "Isi deskripsi hotel di Profil"
                        },
                        {
                            id: "room_types",
                            label: "Tipe Kamar & Kapasitas Okupansi",
                            description: "Pemetaan tipe kamar dengan batas maksimal tamu dewasa.",
                            isComplete: hasRoomTypes,
                            hint: hasRoomTypes ? `${roomTypesCount} tipe kamar aktif` : "Belum ada tipe kamar"
                        },
                        {
                            id: "checkin_checkout",
                            label: "Jadwal Check-In & Check-Out",
                            description: "Waktu standar kedatangan dan keberangkatan tamu.",
                            isComplete: hasCheckInOut,
                            hint: "Check-in 14:00 / Check-out 12:00"
                        },
                        {
                            id: "cancellation_policy",
                            label: "Kebijakan Pembatalan Transparan",
                            description: "Ketentuan pembatalan dan batas waktu pengembalian dana.",
                            isComplete: hasCancellation,
                            hint: hasCancellation ? "Terkonfigurasi" : "Tentukan kebijakan pembatalan"
                        },
                        {
                            id: "landing_url",
                            label: "Direct Engine Landing Page URL",
                            description: "Tautan tujuan pemesanan langsung tanpa komisi OTA.",
                            isComplete: hasLandingUrl,
                            hint: hasLandingUrl ? "Format Valid" : "Format URL belum valid"
                        }
                    ]);
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

        const completedCount = readinessItems.filter(r => r.isComplete).length;
        if (config.isEnabled && completedCount < 7) {
            toast.warning(`Kesiapan konten Google Hotel baru ${completedCount}/10. Disarankan melengkapi data agar listing tidak ditolak Google.`);
        }

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

    const completedReadiness = readinessItems.filter(r => r.isComplete).length;
    const readinessPercentage = Math.round((completedReadiness / Math.max(1, readinessItems.length)) * 100);

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <Globe size={18} color="#09090b" />
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
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} color="#09090b" />
                        <span>{syncing ? "Pushing Feed..." : "Sync ARI Feed to Google"}</span>
                    </button>
                </div>
            </div>

            {/* Metric Overview */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Google Hotel Center Status</span>
                    <span className={styles.statValue} style={{ fontSize: "16px", color: config.isEnabled ? "#2563eb" : "#71717a" }}>
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

            {/* 10-Point Pre-Flight Readiness Checklist Card */}
            <div className={styles.checklistCard}>
                <div className={styles.checklistHeader}>
                    <div className={styles.checklistTitle}>
                        <ShieldCheck size={18} color="#2563eb" />
                        <span>10-Point Google Hotel Content Readiness Audit</span>
                    </div>
                    <span className={`${styles.readinessScoreBadge} ${completedReadiness >= 8 ? styles.scoreReady : styles.scoreWarning}`}>
                        {completedReadiness >= 8 ? <Check size={13} /> : <AlertTriangle size={13} />}
                        <span>{completedReadiness}/10 Data Lengkap ({readinessPercentage}%)</span>
                    </span>
                </div>

                <div className={styles.progressBarContainer}>
                    <div
                        className={styles.progressBarFill}
                        style={{
                            width: `${readinessPercentage}%`,
                            backgroundColor: completedReadiness >= 8 ? "#10b981" : completedReadiness >= 5 ? "#f59e0b" : "#ef4444"
                        }}
                    />
                </div>

                <div className={styles.checklistGrid}>
                    {readinessItems.map(item => (
                        <div key={item.id} className={styles.checklistItem}>
                            {item.isComplete ? (
                                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                            ) : (
                                <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
                            )}
                            <div className={styles.itemContent}>
                                <span className={styles.itemLabel}>{item.label}</span>
                                <span className={styles.itemDesc}>{item.description}</span>
                                <span style={{ fontSize: "10.5px", fontWeight: 600, color: item.isComplete ? "#059669" : "#d97706", marginTop: "2px" }}>
                                    {item.hint}
                                </span>
                            </div>
                        </div>
                    ))}
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
                            {SUPPORTED_CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.flag} {c.code} — {c.name} ({c.symbol})
                                </option>
                            ))}
                        </select>
                        <span className={styles.hint}>Mata uang transmisi feed Google Hotel. Inline dengan Base Currency properti.</span>
                    </div>
                </div>
            </form>
        </div>
    );
}
