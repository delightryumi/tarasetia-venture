"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, Volume2, Smartphone, Check, AlertCircle, Send, MessageSquare, Save, ShieldCheck, ExternalLink } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import styles from "./ChannelNotificationWidget.module.css";

interface Props {
    hotelCode: string;
    userEmail?: string;
}

export function ChannelNotificationWidget({ hotelCode, userEmail }: Props) {
    // ── Web Push PWA State ──
    const {
        isSupported,
        permission,
        isSubscribed,
        loading,
        testing,
        subscribeToPush,
        unsubscribeFromPush,
        sendTestPush
    } = usePushNotifications(hotelCode, userEmail);

    // ── WhatsApp Fonnte State ──
    const [waEnabled, setWaEnabled] = useState<boolean>(true);
    const [ownerPhone, setOwnerPhone] = useState<string>("");
    const [fonnteToken, setFonnteToken] = useState<string>("");
    const [notifyNewBooking, setNotifyNewBooking] = useState<boolean>(true);
    const [notifyCancellation, setNotifyCancellation] = useState<boolean>(true);
    const [loadingWa, setLoadingWa] = useState<boolean>(false);
    const [savingWa, setSavingWa] = useState<boolean>(false);
    const [testingWa, setTestingWa] = useState<boolean>(false);
    const [hasSystemToken, setHasSystemToken] = useState<boolean>(false);

    // Fetch hotel-specific WhatsApp notification settings
    useEffect(() => {
        if (!hotelCode || hotelCode === "0") return;

        let isMounted = true;
        setLoadingWa(true);

        fetch(`/api/notifications/whatsapp?hotelCode=${encodeURIComponent(hotelCode)}`)
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                if (data.success && data.config) {
                    setWaEnabled(data.config.enabled ?? true);
                    setOwnerPhone(data.config.ownerPhone || "");
                    setFonnteToken(data.config.fonnteToken || "");
                    setNotifyNewBooking(data.config.notifyOnNewBooking ?? true);
                    setNotifyCancellation(data.config.notifyOnCancellation ?? true);
                }
                if (data.systemDefaults?.hasFonnteToken) {
                    setHasSystemToken(true);
                }
            })
            .catch(err => {
                console.warn("[WhatsApp Notification Settings Fetch Error]:", err);
            })
            .finally(() => {
                if (isMounted) setLoadingWa(false);
            });

        return () => {
            isMounted = false;
        };
    }, [hotelCode]);

    // Save WhatsApp settings for this hotel
    const handleSaveWaConfig = async () => {
        if (!hotelCode) return;
        setSavingWa(true);
        try {
            const res = await fetch("/api/notifications/whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    action: "save_config",
                    config: {
                        gateway: "fonnte",
                        enabled: waEnabled,
                        ownerPhone: ownerPhone.trim(),
                        fonnteToken: fonnteToken.trim(),
                        notifyOnNewBooking: notifyNewBooking,
                        notifyOnCancellation: notifyCancellation
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Pengaturan WhatsApp Owner berhasil disimpan!");
            } else {
                toast.error(data.error || "Gagal menyimpan pengaturan WhatsApp.");
            }
        } catch (err: any) {
            toast.error("Gagal menghubungi server: " + err.message);
        } finally {
            setSavingWa(false);
        }
    };

    // Test send WhatsApp notification
    const handleTestWa = async () => {
        if (!hotelCode) return;
        if (!ownerPhone.trim()) {
            toast.warning("Silakan masukkan Nomor WhatsApp Owner terlebih dahulu sebelum melakukan tes.");
            return;
        }

        setTestingWa(true);
        try {
            const res = await fetch("/api/notifications/whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    action: "test_send",
                    testRecipient: ownerPhone.trim(),
                    config: {
                        gateway: "fonnte",
                        ownerPhone: ownerPhone.trim(),
                        fonnteToken: fonnteToken.trim()
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || `Pesan tes WhatsApp berhasil dikirim ke nomor ${ownerPhone}!`);
            } else {
                toast.error(`Tes WhatsApp: ${data.error || "Gagal mengirim pesan."}`);
            }
        } catch (err: any) {
            toast.error("Gagal melakukan tes: " + err.message);
        } finally {
            setTestingWa(false);
        }
    };

    const isGranted = permission === "granted" && isSubscribed;
    const isDenied = permission === "denied";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
            {/* ── CARD 1: WHATSAPP NOTIFICATION TO OWNER (FONNTE GATEWAY) ── */}
            <div className={styles.waCard}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle} style={{ background: "#ecfdf5", color: "#10b981" }}>
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h4 className={styles.titleText}>Notifikasi WhatsApp Owner (Fonnte Gateway)</h4>
                                {ownerPhone && waEnabled && (fonnteToken || hasSystemToken) ? (
                                    <span className={styles.badgeActive}>
                                        <span className={`${styles.dot} ${styles.dotGreen}`} />
                                        <span>Fonnte Siap &amp; Aktif</span>
                                    </span>
                                ) : (
                                    <span className={styles.badgeInactive}>
                                        <span className={`${styles.dot} ${styles.dotGray}`} />
                                        <span>Belum Dikonfigurasi</span>
                                    </span>
                                )}
                            </div>
                            <p className={styles.subtitleText}>
                                Otomatis mengirim pesan chat WhatsApp ke nomor pribadi Owner / GM setiap kali ada reservasi baru atau pembatalan dari OTA (Booking.com, Agoda, dsb).
                            </p>
                        </div>
                    </div>
                </div>

                <div className={styles.waFormGrid}>
                    <div className={styles.waInputGroup}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <label className={styles.waLabel}>
                                    Nomor WhatsApp Owner / Penerima Notifikasi:
                                </label>
                                <input
                                    type="text"
                                    value={ownerPhone}
                                    onChange={e => setOwnerPhone(e.target.value)}
                                    placeholder="Contoh: 08123456789 atau 628123456789"
                                    className={styles.waInput}
                                    style={{ width: "100%", marginTop: "4px" }}
                                    disabled={loadingWa || savingWa}
                                />
                            </div>

                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <label className={styles.waLabel}>
                                        Fonnte Device API Token:
                                    </label>
                                    <a
                                        href="https://md.fonnte.com/new/device.php"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: "11px", color: "#2563eb", display: "inline-flex", alignItems: "center", gap: "2px", textDecoration: "none" }}
                                    >
                                        <span>Ambil di Fonnte</span>
                                        <ExternalLink size={10} />
                                    </a>
                                </div>
                                <input
                                    type="password"
                                    value={fonnteToken}
                                    onChange={e => setFonnteToken(e.target.value)}
                                    placeholder="Salin Token dari menu Device di Fonnte"
                                    className={styles.waInput}
                                    style={{ width: "100%", marginTop: "4px" }}
                                    disabled={loadingWa || savingWa}
                                />
                            </div>
                        </div>

                        <div className={styles.waCheckboxes}>
                            <label className={styles.waCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={waEnabled}
                                    onChange={e => setWaEnabled(e.target.checked)}
                                />
                                <span>Aktifkan Notifikasi WhatsApp</span>
                            </label>

                            <label className={styles.waCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={notifyNewBooking}
                                    onChange={e => setNotifyNewBooking(e.target.checked)}
                                    disabled={!waEnabled}
                                />
                                <span>Notif Booking Baru Masuk</span>
                            </label>

                            <label className={styles.waCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={notifyCancellation}
                                    onChange={e => setNotifyCancellation(e.target.checked)}
                                    disabled={!waEnabled}
                                />
                                <span>Notif Pembatalan OTA</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                            type="button"
                            onClick={handleSaveWaConfig}
                            disabled={savingWa || loadingWa}
                            className={styles.btnSuccess}
                            title="Simpan nomor WhatsApp dan token Fonnte untuk hotel ini"
                        >
                            <Save size={14} className={savingWa ? "animate-spin" : ""} />
                            <span>{savingWa ? "Menyimpan..." : "Simpan Pengaturan WA"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleTestWa}
                            disabled={testingWa || !ownerPhone}
                            className={styles.btnSecondary}
                            title="Kirim pesan uji coba ke nomor WhatsApp yang dimasukkan"
                        >
                            <Send size={13} className={testingWa ? "animate-spin" : ""} />
                            <span>{testingWa ? "Mengirim..." : "Kirim Tes WhatsApp"}</span>
                        </button>
                    </div>
                </div>

                <div className={styles.metaInfoBar}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ShieldCheck size={14} color="#10b981" />
                        <span><b>Fonnte WhatsApp Engine</b> • Tanpa verifikasi dokumen Meta • Pesan langsung terkirim secara instan</span>
                    </div>
                    <span>🔒 Multi-tenant terisolasi per hotel</span>
                </div>
            </div>

            {/* ── CARD 2: PWA WEB PUSH NOTIFICATION (BROWSER/LOCKSCREEN) ── */}
            <div className={styles.card}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle} style={{ background: isGranted ? "#ecfdf5" : isDenied ? "#fef2f2" : "#eff6ff", color: isGranted ? "#059669" : isDenied ? "#dc2626" : "#2563eb" }}>
                            <Bell size={18} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h4 className={styles.titleText}>Notifikasi Layar &amp; Suara HP (PWA Push)</h4>
                                {isGranted ? (
                                    <span className={styles.badgeActive}>
                                        <span className={`${styles.dot} ${styles.dotGreen}`} />
                                        <span>Aktif di Perangkat Ini</span>
                                    </span>
                                ) : isDenied ? (
                                    <span className={styles.badgeDenied}>
                                        <span className={`${styles.dot} ${styles.dotRed}`} />
                                        <span>Izin Diblokir di Browser</span>
                                    </span>
                                ) : (
                                    <span className={styles.badgeInactive}>
                                        <span className={`${styles.dot} ${styles.dotGray}`} />
                                        <span>Belum Diaktifkan</span>
                                    </span>
                                )}
                            </div>
                            <p className={styles.subtitleText}>
                                Peringatan instan booking baru &amp; pembatalan OTA di layar kunci HP dengan nada notifikasi bawaan ponsel Anda, jika browser HP mendukung Web Push.
                            </p>
                        </div>
                    </div>

                    <div className={styles.btnGroup}>
                        {!isGranted && (
                            <button
                                type="button"
                                onClick={subscribeToPush}
                                disabled={loading || isDenied || !isSupported}
                                className={styles.btnPrimary}
                                title="Izinkan notifikasi push di ponsel atau browser ini"
                            >
                                <Bell size={14} className={loading ? "animate-spin" : ""} />
                                <span>{loading ? "Memproses Izin..." : "Aktifkan Notifikasi di HP Ini"}</span>
                            </button>
                        )}

                        {isGranted && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => sendTestPush("booking_new")}
                                    disabled={testing}
                                    className={styles.btnSecondary}
                                    title="Kirim notifikasi simulasi booking baru ke layar HP"
                                >
                                    <Send size={13} className={testing ? "animate-spin" : ""} />
                                    <span>Tes Notif Booking</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => sendTestPush("booking_cancelled")}
                                    disabled={testing}
                                    className={styles.btnSecondary}
                                    title="Kirim notifikasi simulasi pembatalan booking ke layar HP"
                                >
                                    <AlertCircle size={13} color="#dc2626" />
                                    <span>Tes Notif Pembatalan</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={unsubscribeFromPush}
                                    disabled={loading}
                                    className={styles.btnDangerOutline}
                                    title="Matikan notifikasi di perangkat ini"
                                >
                                    <BellOff size={13} />
                                    <span>Nonaktifkan</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.bottomRow}>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <Check size={13} color="#10b981" />
                            <span>Layar Kunci (Lockscreen) &amp; Banner Pop-up</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Volume2 size={13} color="#2563eb" />
                            <span>Nada Notifikasi Default Bawaan HP</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Smartphone size={13} color="#059669" />
                            <span>Serverless Scale-to-Zero (Biaya Server $0 / Gratis)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
