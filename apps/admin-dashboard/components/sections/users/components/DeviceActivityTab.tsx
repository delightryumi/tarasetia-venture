import React, { useState, useEffect } from "react";
import { 
    Laptop, Smartphone, Tablet, Globe, Clock, 
    RefreshCw, ShieldAlert, MapPin
} from "lucide-react";
import { DeviceSession } from "../types";
import styles from "./DeviceActivity.module.css";
import commonStyles from "../UsersStyles.module.css";
import { toast } from "sonner";
import { detectClientCity } from "@/lib/clientGeo";

interface DeviceActivityTabProps {
    hotelCode: string;
}

export const DeviceActivityTab: React.FC<DeviceActivityTabProps> = ({ hotelCode }) => {
    const [devices, setDevices] = useState<DeviceSession[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (hotelCode) queryParams.set("hotelCode", hotelCode);

            const res = await fetch(`/api/users/devices?${queryParams.toString()}`);
            let data: any = { success: false, devices: [] };
            try {
                data = await res.json();
            } catch {
                const text = await res.text().catch(() => "");
                data = { success: false, error: text || "Respons server tidak valid", devices: [] };
            }
            if (data.success) {
                const rawDevices: DeviceSession[] = data.devices || [];
                setDevices(rawDevices);

                // Auto-enrich any device whose location is generic or missing
                detectClientCity().then(currentCity => {
                    if (!currentCity || currentCity === "Indonesia") return;
                    setDevices(prev => prev.map(d => {
                        if (!d.location || d.location === "Indonesia" || d.location === "Indonesia (Online)") {
                            return { ...d, location: currentCity };
                        }
                        return d;
                    }));
                });
            } else {
                toast.error(data.error || "Gagal memuat perangkat aktif");
            }
        } catch (err: any) {
            console.error("Fetch devices error:", err);
            toast.error("Gagal mengambil data perangkat aktif");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, [hotelCode]);

    const handleRevokeSession = async (sessionId: string, userName: string) => {
        setRevokingId(sessionId);
        try {
            const res = await fetch(`/api/users/devices?sessionId=${encodeURIComponent(sessionId)}`, {
                method: "DELETE"
            });
            let data: any = { success: false };
            try {
                data = await res.json();
            } catch {
                const text = await res.text().catch(() => "");
                data = { success: false, error: text || "Respons server tidak valid" };
            }
            if (res.ok && data.success) {
                toast.success(`Sesi untuk ${userName} berhasil diputuskan.`);
                setDevices(prev => prev.map(d => d.id === sessionId ? { ...d, status: "revoked" } : d));
            } else {
                toast.error(data.error || "Gagal memutuskan sesi");
            }
        } catch (err: any) {
            toast.error("Error: " + err.message);
        } finally {
            setRevokingId(null);
        }
    };

    const getDeviceIcon = (type: string) => {
        if (type === "mobile") return <Smartphone size={18} style={{ color: "#2563eb" }} />;
        if (type === "tablet") return <Tablet size={18} style={{ color: "#7c3aed" }} />;
        return <Laptop size={18} style={{ color: "#059669" }} />;
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return "-";
        try {
            const date = new Date(isoString);
            return date.toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return isoString;
        }
    };

    return (
        <div className={styles.container}>
            {/* Header Toolbar */}
            <div className={styles.headerCard}>
                <div>
                    <h3 className={styles.headerTitle}>
                        🖥️ Perangkat &amp; Sesi Aktif Staf (Device Activity)
                    </h3>
                    <p className={styles.headerSubtitle}>
                        Pantau daftar perangkat, sistem operasi, browser, serta alamat IP yang sedang atau pernah digunakan staf untuk login ke My Tara.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchDevices}
                    disabled={loading}
                    className={styles.btnRefresh}
                >
                    <RefreshCw size={13} className={loading ? commonStyles.animateSpin : ""} />
                    <span>{loading ? "Menyegarkan..." : "Refresh Perangkat"}</span>
                </button>
            </div>

            {/* Devices Grid */}
            <div className={styles.devicesGrid}>
                {loading && devices.length === 0 ? (
                    <div className={styles.emptyStateContainer}>
                        <RefreshCw size={24} className={`${commonStyles.animateSpin} ${styles.emptyIcon}`} />
                        <p>Memuat daftar perangkat sesi...</p>
                    </div>
                ) : devices.length === 0 ? (
                    <div className={styles.emptyStateContainer}>
                        <Laptop size={28} className={styles.emptyIcon} />
                        <p>Belum ada sesi perangkat yang tercatat. Sesi akan otomatis muncul saat staf login.</p>
                    </div>
                ) : (
                    devices.map(device => {
                        const isActive = device.status === "active";
                        return (
                            <div 
                                key={device.id}
                                className={`${styles.deviceCard} ${isActive ? styles.deviceCardActive : styles.deviceCardRevoked}`}
                            >
                                <div>
                                    <div className={styles.cardHeaderRow}>
                                        <div className={styles.deviceMetaCluster}>
                                            <div className={styles.deviceIconBox}>
                                                {getDeviceIcon(device.deviceType)}
                                            </div>
                                            <div>
                                                <div className={styles.deviceTitle}>
                                                    {device.os} • {device.browser}
                                                </div>
                                                <div className={styles.deviceSubtitle}>
                                                    Tipe: {device.deviceType}
                                                </div>
                                            </div>
                                        </div>

                                        <span className={isActive ? styles.statusBadgeActive : styles.statusBadgeRevoked}>
                                            {isActive ? "Active Session" : "Revoked"}
                                        </span>
                                    </div>

                                    <div className={styles.sessionDetails}>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Pengguna:</span>
                                            <span className={styles.detailValueBold}>{device.userName} ({device.userEmail})</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Lokasi:</span>
                                            <span className={styles.locationTag} title={device.location || "Indonesia (Online)"}>
                                                <MapPin size={11} color="#ef4444" />
                                                <span>{device.location || "Indonesia (Online)"}</span>
                                            </span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Alamat IP:</span>
                                            <span className={styles.detailValueMono}>{device.ipAddress}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Aktif Terakhir:</span>
                                            <span>{formatTime(device.lastActive)}</span>
                                        </div>
                                    </div>
                                </div>

                                {isActive && (
                                    <div className={styles.cardFooter}>
                                        <button
                                            type="button"
                                            disabled={revokingId === device.id}
                                            onClick={() => handleRevokeSession(device.id, device.userName)}
                                            className={styles.btnRevoke}
                                        >
                                            <ShieldAlert size={12} />
                                            <span>{revokingId === device.id ? "Memutuskan..." : "Putuskan Sesi (Revoke)"}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
