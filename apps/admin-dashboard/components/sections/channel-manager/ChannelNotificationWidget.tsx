"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, Volume2, Smartphone, Globe, Check, AlertCircle, Send, MessageSquare, Save, ShieldCheck, Lock, Unlock, KeyRound, ExternalLink, Mail } from "lucide-react";
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
    const [waEnabled, setWaEnabled] = useState<boolean>(true);
    const [ownerPhone, setOwnerPhone] = useState<string>("");
    const [metaPhoneNumberId, setMetaPhoneNumberId] = useState<string>("");
    const [metaAccessToken, setMetaAccessToken] = useState<string>("");
    const [notifyNewBooking, setNotifyNewBooking] = useState<boolean>(true);
    const [notifyCancellation, setNotifyCancellation] = useState<boolean>(true);
    const [notifyModification, setNotifyModification] = useState<boolean>(true);
    const [loadingWa, setLoadingWa] = useState<boolean>(false);
    const [savingWa, setSavingWa] = useState<boolean>(false);
    const [testingWa, setTestingWa] = useState<boolean>(false);
    const [hasMetaToken, setHasMetaToken] = useState<boolean>(false);
    const [systemPhoneId, setSystemPhoneId] = useState<string>("1330469396819460");
    const [systemWabaId, setSystemWabaId] = useState<string>("2318352782319691");
    const [senderDisplay, setSenderDisplay] = useState<string>("+62 856-4536-5440 (Tara Official Cloud API)");

    // ── Admin Security Lock State for Advanced Meta Settings ──
    const [isAdvancedUnlocked, setIsAdvancedUnlocked] = useState<boolean>(false);
    const [showPinPrompt, setShowPinPrompt] = useState<boolean>(false);
    const [adminPinInput, setAdminPinInput] = useState<string>("");
    const [verifyingPin, setVerifyingPin] = useState<boolean>(false);

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
                    setMetaPhoneNumberId(data.config.phoneNumberId || "");
                    setMetaAccessToken(data.config.accessToken || "");
                    setNotifyNewBooking(data.config.notifyOnNewBooking ?? true);
                    setNotifyCancellation(data.config.notifyOnCancellation ?? true);
                    setNotifyModification(data.config.notifyOnModification ?? true);
                }
                if (data.systemDefaults) {
                    setHasMetaToken(Boolean(data.systemDefaults.hasMetaToken));
                    if (data.systemDefaults.phoneNumberId) setSystemPhoneId(data.systemDefaults.phoneNumberId);
                    if (data.systemDefaults.wabaId) setSystemWabaId(data.systemDefaults.wabaId);
                    if (data.systemDefaults.senderDisplay) setSenderDisplay(data.systemDefaults.senderDisplay);
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

    // ── Email Notification State (Brevo Official Cloud Relay) ──
    const [emailEnabled, setEmailEnabled] = useState<boolean>(true);
    const [ownerEmail, setOwnerEmail] = useState<string>("");
    const [notifyEmailNewBooking, setNotifyEmailNewBooking] = useState<boolean>(true);
    const [notifyEmailCancellation, setNotifyEmailCancellation] = useState<boolean>(true);
    const [notifyEmailModification, setNotifyEmailModification] = useState<boolean>(true);
    const [loadingEmail, setLoadingEmail] = useState<boolean>(false);
    const [savingEmail, setSavingEmail] = useState<boolean>(false);
    const [testingEmail, setTestingEmail] = useState<boolean>(false);
    const [hasBrevoKey, setHasBrevoKey] = useState<boolean>(false);
    const [brevoSenderEmail, setBrevoSenderEmail] = useState<string>("delightryumi@gmail.com");

    // Fetch hotel-specific Email notification settings
    useEffect(() => {
        if (!hotelCode || hotelCode === "0") return;

        let isMounted = true;
        setLoadingEmail(true);

        fetch(`/api/notifications/email?hotelCode=${encodeURIComponent(hotelCode)}`)
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                if (data.success && data.config) {
                    setEmailEnabled(data.config.enabled ?? true);
                    setOwnerEmail(data.config.ownerEmail || "");
                    setNotifyEmailNewBooking(data.config.notifyOnNewBooking ?? true);
                    setNotifyEmailCancellation(data.config.notifyOnCancellation ?? true);
                    setNotifyEmailModification(data.config.notifyOnModification ?? true);
                }
                if (data.systemDefaults) {
                    setHasBrevoKey(Boolean(data.systemDefaults.hasBrevoKey));
                    setBrevoSenderEmail(data.systemDefaults.senderEmail || "delightryumi@gmail.com");
                }
            })
            .catch(err => {
                console.warn("[Email Notification Settings Fetch Error]:", err);
            })
            .finally(() => {
                if (isMounted) setLoadingEmail(false);
            });

        return () => {
            isMounted = false;
        };
    }, [hotelCode]);

    // Verify Admin PIN to unlock custom credentials
    const handleVerifyAdminPin = async () => {
        if (!adminPinInput.trim()) {
            toast.warning("Masukkan sandi admin / PIN terlebih dahulu.");
            return;
        }

        setVerifyingPin(true);
        try {
            const res = await fetch("/api/notifications/whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    action: "verify_admin_pin",
                    pin: adminPinInput.trim()
                })
            });

            const data = await res.json();
            if (data.success && data.authorized) {
                setIsAdvancedUnlocked(true);
                setShowPinPrompt(false);
                setAdminPinInput("");
                toast.success("Kredensial Meta API berhasil dibuka.");
            } else {
                toast.error(data.error || "Sandi admin salah.");
            }
        } catch (err: any) {
            toast.error("Gagal memverifikasi sandi: " + err.message);
        } finally {
            setVerifyingPin(false);
        }
    };

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
                        gateway: "meta",
                        enabled: waEnabled,
                        ownerPhone: ownerPhone.trim(),
                        phoneNumberId: metaPhoneNumberId.trim(),
                        accessToken: metaAccessToken.trim(),
                        notifyOnNewBooking: notifyNewBooking,
                        notifyOnCancellation: notifyCancellation,
                        notifyOnModification: notifyModification
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Pengaturan WhatsApp Owner berhasil disimpan.");
            } else {
                toast.error(data.error || "Gagal menyimpan pengaturan WhatsApp.");
            }
        } catch (err: any) {
            toast.error("Koneksi server gagal: " + err.message);
        } finally {
            setSavingWa(false);
        }
    };

    // Test send WhatsApp notification
    const handleTestWa = async () => {
        if (!hotelCode) return;
        if (!ownerPhone.trim()) {
            toast.warning("Harap isi Nomor WhatsApp Owner terlebih dahulu untuk uji coba.");
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
                        gateway: "meta",
                        ownerPhone: ownerPhone.trim(),
                        phoneNumberId: metaPhoneNumberId.trim(),
                        accessToken: metaAccessToken.trim()
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || `Pesan uji coba WhatsApp resmi Meta berhasil dikirim ke ${ownerPhone}!`);
            } else {
                toast.error(`Uji Coba WhatsApp: ${data.error || "Gagal mengirim pesan."}`);
            }
        } catch (err: any) {
            toast.error("Eksekusi tes gagal: " + err.message);
        } finally {
            setTestingWa(false);
        }
    };

    // Save Email settings for this hotel
    const handleSaveEmailConfig = async () => {
        if (!hotelCode) return;
        setSavingEmail(true);
        try {
            const res = await fetch("/api/notifications/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    action: "save_config",
                    config: {
                        enabled: emailEnabled,
                        ownerEmail: ownerEmail.trim(),
                        notifyOnNewBooking: notifyEmailNewBooking,
                        notifyOnCancellation: notifyEmailCancellation,
                        notifyOnModification: notifyEmailModification
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Pengaturan Email Notifikasi Brevo berhasil disimpan.");
            } else {
                toast.error(data.error || "Gagal menyimpan pengaturan email.");
            }
        } catch (err: any) {
            toast.error("Koneksi server gagal: " + err.message);
        } finally {
            setSavingEmail(false);
        }
    };

    // Test send Brevo Email notification
    const handleTestEmail = async () => {
        if (!hotelCode) return;
        if (!ownerEmail.trim()) {
            toast.warning("Harap isi Alamat Email Penerima terlebih dahulu untuk uji coba.");
            return;
        }

        setTestingEmail(true);
        try {
            const res = await fetch("/api/notifications/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    action: "test_send",
                    testRecipient: ownerEmail.trim(),
                    config: {
                        ownerEmail: ownerEmail.trim()
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || `Email uji coba Brevo berhasil dikirim! Periksa inbox.`);
            } else {
                toast.error(`Uji Coba Email: ${data.error || "Gagal mengirim email."}`);
            }
        } catch (err: any) {
            toast.error("Eksekusi tes gagal: " + err.message);
        } finally {
            setTestingEmail(false);
        }
    };

    const isGranted = permission === "granted" && isSubscribed;
    const isDenied = permission === "denied";
    const isMetaConfigured = !!ownerPhone && waEnabled && (metaAccessToken || hasMetaToken);
    const isEmailConfigured = !!ownerEmail && emailEnabled && hasBrevoKey;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
            {/* CARD 1: WHATSAPP NOTIFICATION TO OWNER (META OFFICIAL CLOUD API) */}
            <div className={styles.waCard}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle} style={{ background: "#fdf2f4", color: "#5c0f1e" }}>
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h4 className={styles.titleText}>
                                    Owner WhatsApp Notifications (Meta Official Cloud API)
                                </h4>
                                {isMetaConfigured ? (
                                    <span className={styles.badgeActive}>
                                        <span className={`${styles.dot} ${styles.dotGreen}`} />
                                        <span>Official Meta Cloud Active</span>
                                    </span>
                                ) : (
                                    <span className={styles.badgeInactive}>
                                        <span className={`${styles.dot} ${styles.dotGray}`} />
                                        <span>Owner Phone Needed</span>
                                    </span>
                                )}
                            </div>
                            <p className={styles.subtitleText}>
                                Mengirimkan notifikasi WhatsApp resmi instan ke Owner / General Manager untuk Reservasi Baru, Pembatalan, dan Perubahan Jadwal OTA (Booking.com, Agoda, Traveloka, dll).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Master System Credentials Banner (Locked & Semi-Dynamic) */}
                <div className={styles.metaMasterBanner}>
                    <div className={styles.metaMasterLeft}>
                        <ShieldCheck size={16} color="#5c0f1e" />
                        <div>
                            <div style={{ fontWeight: 600, color: "#09090b" }}>
                                Master Gateway: <b>{senderDisplay}</b>
                            </div>
                            <div className={styles.metaMasterPills} style={{ marginTop: "4px" }}>
                                <span className={styles.metaPill}>WABA ID: {systemWabaId}</span>
                                <span className={styles.metaPill}>Phone ID: {systemPhoneId}</span>
                                <span className={styles.metaPillActive}>
                                    Permanent System Token Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.metaMasterRight}>
                        {!isAdvancedUnlocked ? (
                            <button
                                type="button"
                                onClick={() => setShowPinPrompt(!showPinPrompt)}
                                className={styles.btnLockToggle}
                                title="Buka untuk ubah kredensial khusus"
                            >
                                <Lock size={12} />
                                <span>Kredensial Terkunci</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAdvancedUnlocked(false)}
                                className={styles.btnLockToggle}
                            >
                                <Unlock size={12} />
                                <span>Kunci Kembali</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Admin PIN Verification Prompt */}
                {showPinPrompt && !isAdvancedUnlocked && (
                    <div className={styles.metaUnlockBox}>
                        <KeyRound size={16} color="#d97706" />
                        <span style={{ fontSize: "12px", color: "#92400e", fontWeight: 500 }}>
                            Masukkan Sandi Admin untuk mengubah Phone Number ID atau Access Token khusus:
                        </span>
                        <input
                            type="password"
                            placeholder="Sandi Admin / PIN"
                            value={adminPinInput}
                            onChange={e => setAdminPinInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleVerifyAdminPin(); }}
                            className={styles.pinInput}
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleVerifyAdminPin}
                            disabled={verifyingPin}
                            className={styles.btnSuccess}
                            style={{ padding: "5px 12px", fontSize: "11px" }}
                        >
                            {verifyingPin ? "Memverifikasi..." : "Buka Kunci"}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowPinPrompt(false); setAdminPinInput(""); }}
                            className={styles.btnSecondary}
                            style={{ padding: "5px 10px", fontSize: "11px" }}
                        >
                            Batal
                        </button>
                    </div>
                )}

                {/* Form Fields: Owner Phone Number (Always Visible, Multi-Recipient Capable) */}
                {(() => {
                    const parsedRecipients = ownerPhone
                        .split(/[,;\n\r]+/)
                        .map(p => p.trim())
                        .filter(p => p.length >= 8);

                    return (
                        <div style={{ width: "100%" }}>
                            <div className={styles.waField}>
                                <div className={styles.waLabelRow}>
                                    <span className={styles.waLabel}>
                                        <Smartphone size={13} style={{ color: "#5c0f1e" }} />
                                        <span>Nomor WhatsApp Owner / Management (Mendukung Multi-Nomor):</span>
                                    </span>
                                    {parsedRecipients.length > 1 && (
                                        <span style={{ fontSize: "11px", color: "#5c0f1e", fontWeight: 600 }}>
                                            {parsedRecipients.length} Nomor Penerima Terdeteksi
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={ownerPhone}
                                    onChange={e => setOwnerPhone(e.target.value)}
                                    placeholder="Contoh: 08813794763, 081234567890, 085645365440 (pisahkan dengan koma)"
                                    className={styles.waInput}
                                    disabled={loadingWa || savingWa}
                                    style={{ fontSize: "13px", fontWeight: 500 }}
                                />
                                {parsedRecipients.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                                        {parsedRecipients.map((num, idx) => (
                                            <span
                                                key={idx}
                                                className={styles.recipientTag}
                                            >
                                                <span style={{ color: "#71717a" }}>Penerima #{idx + 1}:</span>
                                                <b>{num}</b>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Advanced Fields: Unlocked Only with Admin PIN */}
                {isAdvancedUnlocked && (
                    <div className={styles.waInputsGrid} style={{ background: "#fafafa", padding: "14px", borderRadius: "6px", border: "1px dashed #e4e4e7" }}>
                        <div className={styles.waField}>
                            <label className={styles.waLabel}>
                                Custom Meta Phone Number ID (Optional Override):
                            </label>
                            <input
                                type="text"
                                value={metaPhoneNumberId}
                                onChange={e => setMetaPhoneNumberId(e.target.value)}
                                placeholder={`Default: ${systemPhoneId}`}
                                className={styles.waInput}
                                disabled={loadingWa || savingWa}
                            />
                        </div>

                        <div className={styles.waField} style={{ gridColumn: "span 2" }}>
                            <div className={styles.waLabelRow}>
                                <span className={styles.waLabel}>
                                    Custom Permanent Access Token (Optional Override):
                                </span>
                                <a
                                    href="https://developers.facebook.com/apps/922508960562373"
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
                                placeholder={hasMetaToken ? "Menggunakan Token Master Server (System Master Active)" : "Paste EAAB... token"}
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
                            <span><b>Aktifkan Notifikasi WhatsApp</b></span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyNewBooking}
                                onChange={e => setNotifyNewBooking(e.target.checked)}
                                disabled={!waEnabled}
                            />
                            <span>Booking Baru</span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyCancellation}
                                onChange={e => setNotifyCancellation(e.target.checked)}
                                disabled={!waEnabled}
                            />
                            <span>Pembatalan OTA</span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyModification}
                                onChange={e => setNotifyModification(e.target.checked)}
                                disabled={!waEnabled}
                            />
                            <span>Perubahan / Reschedule</span>
                        </label>
                    </div>

                    <div className={styles.waBtnRow}>
                        <button
                            type="button"
                            onClick={handleSaveWaConfig}
                            disabled={savingWa || loadingWa}
                            className={styles.btnSuccess}
                            title="Simpan pengaturan WhatsApp untuk properti ini"
                        >
                            <Save size={14} className={savingWa ? "animate-spin" : ""} />
                            <span>{savingWa ? "Menyimpan..." : "Simpan Pengaturan WA"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleTestWa}
                            disabled={testingWa || !ownerPhone}
                            className={styles.btnSecondary}
                            title="Kirim pesan uji coba ke nomor WhatsApp di atas"
                        >
                            <Send size={13} className={testingWa ? "animate-spin" : ""} />
                            <span>{testingWa ? "Mengirim..." : "Kirim Uji Coba WA"}</span>
                        </button>
                    </div>
                </div>

                {/* Info Bar at Bottom */}
                <div className={styles.metaInfoBar}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ShieldCheck size={14} style={{ color: "#5c0f1e" }} />
                        <span>
                            <b>Meta Official WhatsApp Cloud API • Serverless 24/7 • Template crs_booking_notification</b>
                        </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "10.5px" }}>Multi-tenant terisolasi per properti hotel</span>
                </div>
            </div>

            {/* CARD 1B: EMAIL NOTIFICATIONS TO OWNER & MANAGEMENT (BREVO CLOUD RELAY) */}
            <div className={styles.waCard}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle} style={{ background: "#f0fdf4", color: "#166534" }}>
                            <Mail size={18} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h4 className={styles.titleText}>
                                    Owner &amp; Management Email Alerts (Brevo Cloud Relay)
                                </h4>
                                {isEmailConfigured ? (
                                    <span className={styles.badgeActive}>
                                        <span className={`${styles.dot} ${styles.dotGreen}`} />
                                        <span>Brevo Relay Active</span>
                                    </span>
                                ) : (
                                    <span className={styles.badgeInactive}>
                                        <span className={`${styles.dot} ${styles.dotGray}`} />
                                        <span>Email Needed</span>
                                    </span>
                                )}
                            </div>
                            <p className={styles.subtitleText}>
                                Mengirimkan notifikasi email HTML resmi &amp; detail secara instan ke Owner, GM, dan Front Desk untuk Reservasi Baru, Pembatalan, dan Perubahan Jadwal OTA.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Brevo Gateway Banner */}
                <div className={styles.metaMasterBanner}>
                    <div className={styles.metaMasterLeft}>
                        <ShieldCheck size={16} color="#166534" />
                        <div>
                            <div style={{ fontWeight: 600, color: "#09090b" }}>
                                Brevo Verified Relay: <b>{brevoSenderEmail}</b>
                            </div>
                            <div className={styles.metaMasterPills} style={{ marginTop: "4px" }}>
                                <span className={styles.metaPill}>Service: Brevo REST API v3</span>
                                <span className={hasBrevoKey ? styles.metaPillActive : styles.metaPill} style={hasBrevoKey ? { background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" } : {}}>
                                    {hasBrevoKey ? "API Key Connected & Active" : "API Key Missing"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Fields: Owner & Management Email (Supports Multi-Email) */}
                {(() => {
                    const parsedEmailRecipients = ownerEmail
                        .split(/[,;\s\n\r]+/)
                        .map(e => e.trim().toLowerCase())
                        .filter(e => e.length > 5 && e.includes("@"));

                    return (
                        <div style={{ width: "100%" }}>
                            <div className={styles.waField}>
                                <div className={styles.waLabelRow}>
                                    <span className={styles.waLabel}>
                                        <Mail size={13} style={{ color: "#166534" }} />
                                        <span>Alamat Email Penerima Notifikasi (Mendukung Multi-Email):</span>
                                    </span>
                                    {parsedEmailRecipients.length > 1 && (
                                        <span style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>
                                            {parsedEmailRecipients.length} Alamat Email Terdeteksi
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={ownerEmail}
                                    onChange={e => setOwnerEmail(e.target.value)}
                                    placeholder="Contoh: owner@hotel.com, gm@hotel.com, reservation@hotel.com (pisahkan dengan koma)"
                                    className={styles.waInput}
                                    disabled={loadingEmail || savingEmail}
                                    style={{ fontSize: "13px", fontWeight: 500 }}
                                />
                                {parsedEmailRecipients.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                                        {parsedEmailRecipients.map((email, idx) => (
                                            <span
                                                key={idx}
                                                className={styles.recipientTag}
                                            >
                                                <span style={{ color: "#71717a" }}>Penerima #{idx + 1}:</span>
                                                <b>{email}</b>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Bottom Row: Checkboxes on Left, Action Buttons on Right */}
                <div className={styles.waBottomControls}>
                    <div className={styles.waCheckboxes}>
                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={emailEnabled}
                                onChange={e => setEmailEnabled(e.target.checked)}
                            />
                            <span><b>Aktifkan Notifikasi Email</b></span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyEmailNewBooking}
                                onChange={e => setNotifyEmailNewBooking(e.target.checked)}
                                disabled={!emailEnabled}
                            />
                            <span>Booking Baru</span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyEmailCancellation}
                                onChange={e => setNotifyEmailCancellation(e.target.checked)}
                                disabled={!emailEnabled}
                            />
                            <span>Pembatalan OTA</span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyEmailModification}
                                onChange={e => setNotifyEmailModification(e.target.checked)}
                                disabled={!emailEnabled}
                            />
                            <span>Perubahan / Reschedule</span>
                        </label>
                    </div>

                    <div className={styles.waBtnRow}>
                        <button
                            type="button"
                            onClick={handleSaveEmailConfig}
                            disabled={savingEmail || loadingEmail}
                            className={styles.btnSuccess}
                            title="Simpan pengaturan email notifikasi untuk properti ini"
                        >
                            <Save size={14} className={savingEmail ? "animate-spin" : ""} />
                            <span>{savingEmail ? "Menyimpan..." : "Simpan Pengaturan Email"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleTestEmail}
                            disabled={testingEmail || !ownerEmail}
                            className={styles.btnSecondary}
                            title="Kirim email uji coba Brevo ke alamat email di atas"
                        >
                            <Send size={13} className={testingEmail ? "animate-spin" : ""} />
                            <span>{testingEmail ? "Mengirim..." : "Kirim Uji Coba Email"}</span>
                        </button>
                    </div>
                </div>

                {/* Info Bar at Bottom */}
                <div className={styles.metaInfoBar}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ShieldCheck size={14} style={{ color: "#166534" }} />
                        <span>
                            <b>Brevo Official Cloud Relay • High Deliverability (DKIM/SPF) • Sender: {brevoSenderEmail}</b>
                        </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "10.5px" }}>Multi-recipient safe • Isolated per tenant</span>
                </div>
            </div>

            {/* CARD 2: PWA WEB PUSH NOTIFICATION (BROWSER/LOCKSCREEN) */}
            <div className={styles.card}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle}>
                            <Bell size={16} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h4 className={styles.titleText}>Device Screen &amp; Audio Alerts (PWA Push Notifications)</h4>
                                {isGranted ? (
                                    <span className={styles.badgeActive}>
                                        <span className={`${styles.dot} ${styles.dotGreen}`} />
                                        <span>Active on This Device</span>
                                    </span>
                                ) : isDenied ? (
                                    <span className={styles.badgeDenied}>
                                        <span className={`${styles.dot} ${styles.dotRed}`} />
                                        <span>Permission Blocked in Browser</span>
                                    </span>
                                ) : (
                                    <span className={styles.badgeInactive}>
                                        <span className={`${styles.dot} ${styles.dotGray}`} />
                                        <span>Not Enabled</span>
                                    </span>
                                )}
                            </div>
                            <p className={styles.subtitleText}>
                                Notifikasi instan di layar kunci perangkat / browser komputer dengan nada dering saat reservasi baru atau pembatalan masuk.
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
                                title="Aktifkan push notifikasi di perangkat ini"
                            >
                                <Bell size={14} className={loading ? "animate-spin" : ""} />
                                <span>{loading ? "Meminta Izin..." : "Aktifkan di Perangkat Ini"}</span>
                            </button>
                        )}

                        {isGranted && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => sendTestPush("booking_new")}
                                    disabled={testing}
                                    className={styles.btnSecondary}
                                    title="Kirim simulasi notifikasi reservasi baru"
                                >
                                    <Send size={13} className={testing ? "animate-spin" : ""} />
                                    <span>{testing ? "Mengirim..." : "Tes Reservasi"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => sendTestPush("booking_cancelled")}
                                    disabled={testing}
                                    className={styles.btnSecondary}
                                    title="Kirim simulasi notifikasi pembatalan"
                                >
                                    <Send size={13} className={testing ? "animate-spin" : ""} />
                                    <span>{testing ? "Mengirim..." : "Tes Pembatalan"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={unsubscribeFromPush}
                                    disabled={loading}
                                    className={styles.btnDangerOutline}
                                    title="Nonaktifkan notifikasi di perangkat ini"
                                >
                                    <BellOff size={13} />
                                    <span>Nonaktifkan</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
