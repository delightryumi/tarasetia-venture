"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, Volume2, Smartphone, Globe, Check, AlertCircle, Send, MessageSquare, Save, ShieldCheck, ExternalLink } from "lucide-react";
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

    // ── WhatsApp Notification State ──
    const [gateway, setGateway] = useState<"meta" | "fonnte">("meta");
    const [waEnabled, setWaEnabled] = useState<boolean>(true);
    const [ownerPhone, setOwnerPhone] = useState<string>("");
    const [fonnteToken, setFonnteToken] = useState<string>("");
    const [metaPhoneNumberId, setMetaPhoneNumberId] = useState<string>("");
    const [metaAccessToken, setMetaAccessToken] = useState<string>("");
    const [notifyNewBooking, setNotifyNewBooking] = useState<boolean>(true);
    const [notifyCancellation, setNotifyCancellation] = useState<boolean>(true);
    const [loadingWa, setLoadingWa] = useState<boolean>(false);
    const [savingWa, setSavingWa] = useState<boolean>(false);
    const [testingWa, setTestingWa] = useState<boolean>(false);
    const [hasSystemToken, setHasSystemToken] = useState<boolean>(false);
    const [hasMetaToken, setHasMetaToken] = useState<boolean>(false);
    const [systemPhoneId, setSystemPhoneId] = useState<string>("");

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
                    setGateway(data.config.gateway || "meta");
                    setWaEnabled(data.config.enabled ?? true);
                    setOwnerPhone(data.config.ownerPhone || "");
                    setFonnteToken(data.config.fonnteToken || "");
                    setMetaPhoneNumberId(data.config.phoneNumberId || "");
                    setMetaAccessToken(data.config.accessToken || "");
                    setNotifyNewBooking(data.config.notifyOnNewBooking ?? true);
                    setNotifyCancellation(data.config.notifyOnCancellation ?? true);
                }
                if (data.systemDefaults?.hasFonnteToken) {
                    setHasSystemToken(true);
                }
                if (data.systemDefaults?.hasMetaToken) {
                    setHasMetaToken(true);
                }
                if (data.systemDefaults?.phoneNumberId) {
                    setSystemPhoneId(data.systemDefaults.phoneNumberId);
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
                        gateway,
                        enabled: waEnabled,
                        ownerPhone: ownerPhone.trim(),
                        fonnteToken: fonnteToken.trim(),
                        phoneNumberId: metaPhoneNumberId.trim(),
                        accessToken: metaAccessToken.trim(),
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
                        gateway,
                        ownerPhone: ownerPhone.trim(),
                        fonnteToken: fonnteToken.trim(),
                        phoneNumberId: metaPhoneNumberId.trim(),
                        accessToken: metaAccessToken.trim()
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

    const isMetaConfigured = !!ownerPhone && waEnabled && (metaAccessToken || hasMetaToken);
    const isFonnteConfigured = !!ownerPhone && waEnabled && (fonnteToken || hasSystemToken);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
            {/* ── CARD 1: WHATSAPP NOTIFICATION TO OWNER (META OFFICIAL & FONNTE) ── */}
            <div className={styles.waCard}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle} style={{ background: gateway === "meta" ? "#eff6ff" : "#ecfdf5", color: gateway === "meta" ? "#2563eb" : "#10b981" }}>
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h4 className={styles.titleText}>
                                    {gateway === "meta" ? "Notifikasi WhatsApp Owner (Meta Official Cloud API)" : "Notifikasi WhatsApp Owner (Fonnte Gateway)"}
                                </h4>
                                {(gateway === "meta" ? isMetaConfigured : isFonnteConfigured) ? (
                                    <span className={styles.badgeActive}>
                                        <span className={`${styles.dot} ${styles.dotGreen}`} />
                                        <span>{gateway === "meta" ? "Meta Cloud Aktif" : "Fonnte Siap & Aktif"}</span>
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

                {/* Gateway Switcher Tabs */}
                <div>
                    <div className={styles.gatewaySegmentedBar}>
                        <button
                            type="button"
                            onClick={() => setGateway("meta")}
                            className={`${styles.gatewayTab} ${gateway === "meta" ? styles.gatewayTabActiveMeta : ""}`}
                        >
                            <Globe size={14} />
                            <span>WhatsApp Official (Meta Cloud API)</span>
                            <span className={styles.recommendTag}>Tanpa HP</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGateway("fonnte")}
                            className={`${styles.gatewayTab} ${gateway === "fonnte" ? styles.gatewayTabActiveFonnte : ""}`}
                        >
                            <Smartphone size={14} />
                            <span>Fonnte Gateway (Scan QR Web)</span>
                        </button>
                    </div>
                </div>

                {/* Form Fields: Full Width Responsive Grid */}
                {gateway === "meta" ? (
                    /* ── META OFFICIAL 3-COLUMN FORM ── */
                    <div className={styles.waInputsGrid}>
                        <div className={styles.waField}>
                            <label className={styles.waLabel}>
                                Nomor WhatsApp Owner / GM:
                            </label>
                            <input
                                type="text"
                                value={ownerPhone}
                                onChange={e => setOwnerPhone(e.target.value)}
                                placeholder="Contoh: 08123456789 atau 628123456789"
                                className={styles.waInput}
                                disabled={loadingWa || savingWa}
                            />
                        </div>

                        <div className={styles.waField}>
                            <label className={styles.waLabel}>
                                Meta Phone Number ID:
                            </label>
                            <input
                                type="text"
                                value={metaPhoneNumberId}
                                onChange={e => setMetaPhoneNumberId(e.target.value)}
                                placeholder={systemPhoneId ? `Default Sistem (${systemPhoneId})` : "Salin Phone Number ID dari Meta"}
                                className={styles.waInput}
                                disabled={loadingWa || savingWa}
                            />
                        </div>

                        <div className={styles.waField}>
                            <div className={styles.waLabelRow}>
                                <span className={styles.waLabel}>Meta Access Token:</span>
                                <a
                                    href="https://developers.facebook.com/apps/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.waExtLink}
                                >
                                    <span>Meta Dev Portal</span>
                                    <ExternalLink size={10} />
                                </a>
                            </div>
                            <input
                                type="password"
                                value={metaAccessToken}
                                onChange={e => setMetaAccessToken(e.target.value)}
                                placeholder={hasMetaToken ? "Menggunakan Token Server (.env.local)" : "Tempel Token EAAB..."}
                                className={styles.waInput}
                                disabled={loadingWa || savingWa}
                            />
                        </div>
                    </div>
                ) : (
                    /* ── FONNTE 2-COLUMN FORM ── */
                    <div className={styles.waInputsGrid2Col}>
                        <div className={styles.waField}>
                            <label className={styles.waLabel}>
                                Nomor WhatsApp Owner / GM:
                            </label>
                            <input
                                type="text"
                                value={ownerPhone}
                                onChange={e => setOwnerPhone(e.target.value)}
                                placeholder="Contoh: 08123456789 atau 628123456789"
                                className={styles.waInput}
                                disabled={loadingWa || savingWa}
                            />
                        </div>

                        <div className={styles.waField}>
                            <div className={styles.waLabelRow}>
                                <span className={styles.waLabel}>Fonnte Device API Token:</span>
                                <a
                                    href="https://md.fonnte.com/new/device.php"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.waExtLink}
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
                                disabled={loadingWa || savingWa}
                            />
                        </div>
                    </div>
                )}

                {/* Bottom Row: Checkboxes on Left, Action Buttons on Right */}
                <div className={styles.waBottomControls}>
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

                    <div className={styles.waBtnRow}>
                        <button
                            type="button"
                            onClick={handleSaveWaConfig}
                            disabled={savingWa || loadingWa}
                            className={styles.btnSuccess}
                            title="Simpan pengaturan WhatsApp untuk hotel ini"
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

                {/* Info Bar at Bottom */}
                <div className={styles.metaInfoBar} style={{ background: gateway === "meta" ? "#eff6ff" : "#f0fdf4", border: `1px solid ${gateway === "meta" ? "#bfdbfe" : "#bbf7d0"}`, color: gateway === "meta" ? "#1e40af" : "#166534" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ShieldCheck size={14} color={gateway === "meta" ? "#2563eb" : "#10b981"} />
                        <span>
                            {gateway === "meta" 
                                ? <b>WhatsApp Cloud API Resmi (Meta) • 100% Serverless Cloud • Tanpa HP Fisik • 24/7 Selalu Aktif</b> 
                                : <b>Fonnte WhatsApp Engine • Tanpa verifikasi dokumen Meta • Pesan dikirim melalui HP pribadi</b>}
                        </span>
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
