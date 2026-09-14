"use client";

import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Wifi, CheckCircle2, UploadCloud, RefreshCw, Sparkles, Building2, Coffee, Car, Waves, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { collection, doc, getDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import styles from "./ChannelContentPush.module.css";

interface Props {
    hotelCode: string;
}

interface RealPhotoItem {
    id: string;
    title: string;
    url: string;
    tag: string;
}

export function ChannelContentPushTab({ hotelCode }: Props) {
    const [pushing, setPushing] = useState<boolean>(false);
    const [loadingPhotos, setLoadingPhotos] = useState<boolean>(true);
    const [photos, setPhotos] = useState<RealPhotoItem[]>([]);

    // Standard hotel facilities checklist
    const [facilities, setFacilities] = useState<Record<string, boolean>>({
        wifi: true,
        air_conditioning: true,
        swimming_pool: false,
        breakfast: false,
        free_parking: true,
        restaurant: false,
        twenty_four_hour_front_desk: true,
        room_service: false,
        water_heater: true,
        tv_cable: true,
        daily_housekeeping: true,
        elevator: false
    });

    const facilityLabels: Record<string, string> = {
        wifi: "WiFi Kecepatan Tinggi (Gratis)",
        air_conditioning: "Pendingin Ruangan (AC)",
        swimming_pool: "Kolam Renang Hotel",
        breakfast: "Sarapan Pagi Buffet",
        free_parking: "Area Parkir Kendaraan Gratis",
        restaurant: "Restoran & Kafe",
        twenty_four_hour_front_desk: "Resepsionis 24 Jam",
        room_service: "Layanan Kamar (Room Service)",
        water_heater: "Pemanas Air Panas (Water Heater)",
        tv_cable: "Smart TV & Saluran Kabel",
        daily_housekeeping: "Pembersihan Kamar Harian",
        elevator: "Akses Lift Penumpang"
    };

    // Load real hotel photos & saved facilities from Firestore
    useEffect(() => {
        if (!hotelCode) return;

        const loadRealData = async () => {
            setLoadingPhotos(true);
            try {
                const loadedPhotos: RealPhotoItem[] = [];

                // 1. Fetch from Gallery collection
                const gallerySnap = await getDocs(
                    query(getHotelCollection(db, "gallery", hotelCode), orderBy("order", "asc"))
                );
                gallerySnap.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.url) {
                        loadedPhotos.push({
                            id: `gal-${docSnap.id}`,
                            title: data.category || "Foto Galeri",
                            url: data.url,
                            tag: (data.category || "GALERI").toUpperCase()
                        });
                    }
                });

                // 2. Fetch room images from RoomTypes collection
                const roomSnap = await getDocs(getHotelCollection(db, "roomTypes", hotelCode));
                roomSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.images && Array.isArray(data.images)) {
                        data.images.forEach((img: any, idx: number) => {
                            const imgUrl = typeof img === "string" ? img : img.url;
                            if (imgUrl) {
                                loadedPhotos.push({
                                    id: `rm-${docSnap.id}-${idx}`,
                                    title: `${data.name || "Kamar"} (Foto ${idx + 1})`,
                                    url: imgUrl,
                                    tag: "KAMAR"
                                });
                            }
                        });
                    }
                });

                setPhotos(loadedPhotos);

                // 3. Load saved facilities from Hotel doc
                const hotelDocSnap = await getDoc(doc(db, "hotels", hotelCode));
                if (hotelDocSnap.exists()) {
                    const hData = hotelDocSnap.data();
                    if (hData.channelFacilities) {
                        setFacilities(prev => ({ ...prev, ...hData.channelFacilities }));
                    }
                }
            } catch (err) {
                console.error("Error loading real photos/facilities:", err);
            } finally {
                setLoadingPhotos(false);
            }
        };

        loadRealData();
    }, [hotelCode]);

    const toggleFacility = (key: string) => {
        setFacilities(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePushAll = async () => {
        setPushing(true);
        try {
            const res = await fetch("/api/channex/content/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    facilities,
                    photosCount: photos.length
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.error || "Gagal mendistribusikan konten.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan saat mendistribusikan konten.");
        } finally {
            setPushing(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <UploadCloud size={16} color="#1e3a2f" />
                        <span>Distribusi Konten &amp; Fasilitas Hotel (Photos &amp; Facilities Content Push)</span>
                    </div>
                    <span className={styles.desc}>
                        Sinkronkan foto-foto asli hotel dan checklist fasilitas langsung ke ekstranet Airbnb dan Google Hotel Ads melalui Channex Content API.
                    </span>
                </div>

                <button
                    type="button"
                    onClick={handlePushAll}
                    disabled={pushing}
                    className={styles.btnPushAll}
                >
                    <UploadCloud size={14} className={pushing ? "animate-spin" : ""} />
                    <span>{pushing ? "Mendistribusikan..." : "Dorong Konten ke Semua OTA"}</span>
                </button>
            </div>

            {/* Content Grid */}
            <div className={styles.contentGrid}>
                {/* 1. Real Photos Section */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>
                            <ImageIcon size={15} color="#1e3a2f" />
                            <span>Galeri Foto Asli Hotel &amp; Kamar ({photos.length} Foto Aktif)</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 700 }}>
                            {loadingPhotos ? "Memuat..." : `${photos.length} Terunggah`}
                        </span>
                    </div>

                    {loadingPhotos ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                            Memuat foto properti dari Galeri dan Master Kamar...
                        </div>
                    ) : photos.length > 0 ? (
                        <div className={styles.photosGrid}>
                            {photos.map(photo => (
                                <div key={photo.id} className={styles.photoItem}>
                                    <img src={photo.url} alt={photo.title} className={styles.photoImg} />
                                    <span className={styles.photoTag}>{photo.tag}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: "36px 20px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                            <ImageIcon size={32} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                                Belum ada foto yang diunggah
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", maxWidth: "360px", margin: "4px auto 0" }}>
                                Silakan unggah foto di menu <b>Galeri Hotel</b> atau <b>Tipe Kamar</b> agar otomatis disinkronkan ke seluruh listing OTA.
                            </div>
                        </div>
                    )}

                    <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
                        💡 Foto bersumber dari Galeri Hotel dan Master Kamar aktif properti Anda, siap didistribusikan ke listing Airbnb, Google Hotel Ads, dan OTA saat Anda menekan tombol di atas.
                    </div>
                </div>

                {/* 2. Facilities Section */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>
                            <Wifi size={15} color="#1e3a2f" />
                            <span>Checklist Fasilitas &amp; Amenitas Hotel</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Klik untuk Mengubah</span>
                    </div>

                    <div className={styles.facilitiesGrid}>
                        {Object.keys(facilities).map(key => {
                            const isActive = facilities[key];
                            return (
                                <div
                                    key={key}
                                    onClick={() => toggleFacility(key)}
                                    className={`${styles.facilityItem} ${isActive ? styles.facilityItemActive : ""}`}
                                >
                                    <CheckCircle2 size={14} color={isActive ? "#166534" : "#cbd5e1"} />
                                    <span>{facilityLabels[key] || key}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
                        Checklist fasilitas yang Anda aktifkan akan disinkronkan ke badge fasilitas OTA, meningkatkan visibilitas dan konversi pemesanan tamu (*OTA Ranking Booster*).
                    </div>
                </div>
            </div>
        </div>
    );
}
