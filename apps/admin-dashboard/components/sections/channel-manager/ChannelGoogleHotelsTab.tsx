"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleHotelConfig } from "@/lib/channex/types";
import { ChannelGoogleHotelsDesktopView, ReadinessItem } from "./ChannelGoogleHotelsDesktopView";
import { ChannelGoogleHotelsMobileView } from "./ChannelGoogleHotelsMobileView";
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

    const sharedProps = {
        config,
        setConfig,
        readinessItems,
        saving,
        syncing,
        onSave: handleSave,
        onSyncFeed: handleSyncFeed
    };

    return (
        <div className={styles.container}>
            <div className={styles.desktopOnly}>
                <ChannelGoogleHotelsDesktopView {...sharedProps} />
            </div>
            <div className={styles.mobileOnly}>
                <ChannelGoogleHotelsMobileView {...sharedProps} />
            </div>
        </div>
    );
}
