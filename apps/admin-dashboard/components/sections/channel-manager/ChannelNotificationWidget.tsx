"use client";

import React, { useState, useEffect } from "react";
import {
    Bell,
    BellOff,
    Smartphone,
    Globe,
    Check,
    AlertCircle,
    Send,
    MessageSquare,
    Save,
    ShieldCheck,
    Lock,
    Unlock,
    KeyRound,
    ExternalLink,
    Mail,
    CheckCircle2,
    CalendarCheck,
    CalendarClock,
    XCircle,
    Radio
} from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import styles from "./ChannelNotificationWidget.module.css";

interface Props {
    hotelCode: string;
    userEmail?: string;
    onClose?: () => void;
}

export function ChannelNotificationWidget({ hotelCode, userEmail }: Props) {
    // ── Active Navigation Sub-Tab State ──
    const [activeSubTab, setActiveSubTab] = useState<"all" | "whatsapp" | "email" | "push">("all");

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
    const [brevoSenderEmail, setBrevoSenderEmail] = useState<string>("reservation@mytara.id");
    const [customSenderEmail, setCustomSenderEmail] = useState<string>("");

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
                    setCustomSenderEmail(data.config.senderEmail || "");
                    setNotifyEmailNewBooking(data.config.notifyOnNewBooking ?? true);
                    setNotifyEmailCancellation(data.config.notifyOnCancellation ?? true);
                    setNotifyEmailModification(data.config.notifyOnModification ?? true);
                }
                if (data.systemDefaults) {
                    setHasBrevoKey(Boolean(data.systemDefaults.hasBrevoKey));
                    setBrevoSenderEmail(data.systemDefaults.senderEmail || "reservation@mytara.id");
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
                        senderEmail: customSenderEmail.trim() || undefined,
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
                toast.success(data.message || `Email uji coba Brevo berhasil dikirim. Periksa inbox.`);
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

    // Recipient parsers
    const parsedPhoneRecipients = ownerPhone
        .split(/[,;\n\r]+/)
        .map(p => p.trim())
        .filter(p => p.length >= 8);

    const parsedEmailRecipients = ownerEmail
        .split(/[,;\s\n\r]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 5 && e.includes("@"));

    return (
        <div className={styles.container}>
            {/* 1. TOP CHANNEL STATUS SUMMARY OVERVIEW STRIP */}
            <div className={styles.overviewStrip}>
                <div
                    className={`${styles.overviewCard} ${activeSubTab === "whatsapp" ? styles.overviewCardActive : ""}`}
                    onClick={() => setActiveSubTab("whatsapp")}
                    title="Klik untuk konfigurasi notifikasi WhatsApp"
                >
                    <div className={styles.overviewLeft}>
                        <div className={`${styles.overviewIconBox} ${isMetaConfigured ? styles.overviewIconBoxActive : ""}`}>
                            <MessageSquare size={16} />
                        </div>
                        <div className={styles.overviewMeta}>
                            <h4 className={styles.overviewTitle}>WhatsApp Cloud API</h4>
                            <p className={styles.overviewSubtitle}>
                                {isMetaConfigured
                                    ? `${parsedPhoneRecipients.length || 1} Nomor Penerima Aktif`
                                    : "Perlu Nomor WhatsApp"}
                            </p>
                        </div>
                    </div>
                    {isMetaConfigured ? (
                        <span className={styles.badgeActive}>
                            <span className={`${styles.dot} ${styles.dotGreen}`} />
                            <span>Aktif</span>
                        </span>
                    ) : (
                        <span className={styles.badgeInactive}>
                            <span className={`${styles.dot} ${styles.dotGray}`} />
                            <span>Pending</span>
                        </span>
                    )}
                </div>

                <div
                    className={`${styles.overviewCard} ${activeSubTab === "email" ? styles.overviewCardActive : ""}`}
                    onClick={() => setActiveSubTab("email")}
                    title="Klik untuk konfigurasi notifikasi Email Brevo"
                >
                    <div className={styles.overviewLeft}>
                        <div className={`${styles.overviewIconBox} ${isEmailConfigured ? styles.overviewIconBoxActive : ""}`}>
                            <Mail size={16} />
                        </div>
                        <div className={styles.overviewMeta}>
                            <h4 className={styles.overviewTitle}>Email Brevo Relay</h4>
                            <p className={styles.overviewSubtitle}>
                                {isEmailConfigured
                                    ? `${parsedEmailRecipients.length || 1} Alamat Email Aktif`
                                    : "Perlu Alamat Email"}
                            </p>
                        </div>
                    </div>
                    {isEmailConfigured ? (
                        <span className={styles.badgeActive}>
                            <span className={`${styles.dot} ${styles.dotGreen}`} />
                            <span>Aktif</span>
                        </span>
                    ) : (
                        <span className={styles.badgeInactive}>
                            <span className={`${styles.dot} ${styles.dotGray}`} />
                            <span>Pending</span>
                        </span>
                    )}
                </div>

                <div
                    className={`${styles.overviewCard} ${activeSubTab === "push" ? styles.overviewCardActive : ""}`}
                    onClick={() => setActiveSubTab("push")}
                    title="Klik untuk konfigurasi Web Push Notification"
                >
                    <div className={styles.overviewLeft}>
                        <div className={`${styles.overviewIconBox} ${isGranted ? styles.overviewIconBoxActive : ""}`}>
                            <Bell size={16} />
                        </div>
                        <div className={styles.overviewMeta}>
                            <h4 className={styles.overviewTitle}>Web Push PWA</h4>
                            <p className={styles.overviewSubtitle}>
                                {isGranted
                                    ? "Layar Kunci & Audio Aktif"
                                    : isDenied
                                    ? "Izin Browser Diblokir"
                                    : "Belum Diaktifkan"}
                            </p>
                        </div>
                    </div>
                    {isGranted ? (
                        <span className={styles.badgeActive}>
                            <span className={`${styles.dot} ${styles.dotGreen}`} />
                            <span>Aktif</span>
                        </span>
                    ) : isDenied ? (
                        <span className={styles.badgeDenied}>
                            <span className={`${styles.dot} ${styles.dotRed}`} />
                            <span>Diblokir</span>
                        </span>
                    ) : (
                        <span className={styles.badgeInactive}>
                            <span className={`${styles.dot} ${styles.dotGray}`} />
                            <span>Nonaktif</span>
                        </span>
                    )}
                </div>
            </div>

            {/* 2. EXECUTIVE SEGMENTED NAVIGATION TABS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div className={styles.navTabBar}>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("all")}
                        className={`${styles.navTabBtn} ${activeSubTab === "all" ? styles.navTabBtnActive : ""}`}
                    >
                        <span>Semua Saluran</span>
                        <span className={styles.navTabBadge}>3</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("whatsapp")}
                        className={`${styles.navTabBtn} ${activeSubTab === "whatsapp" ? styles.navTabBtnActive : ""}`}
                    >
                        <MessageSquare size={13} />
                        <span>WhatsApp (Meta)</span>
                        {isMetaConfigured && <span className={`${styles.navTabBadge} ${styles.navTabBadgeActive}`}>✓</span>}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("email")}
                        className={`${styles.navTabBtn} ${activeSubTab === "email" ? styles.navTabBtnActive : ""}`}
                    >
                        <Mail size={13} />
                        <span>Email (Brevo)</span>
                        {isEmailConfigured && <span className={`${styles.navTabBadge} ${styles.navTabBadgeActive}`}>✓</span>}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("push")}
                        className={`${styles.navTabBtn} ${activeSubTab === "push" ? styles.navTabBtnActive : ""}`}
                    >
                        <Bell size={13} />
                        <span>Web Push PWA</span>
                        {isGranted && <span className={`${styles.navTabBadge} ${styles.navTabBadgeActive}`}>✓</span>}
                    </button>
                </div>

                <div style={{ fontSize: "11px", color: "#71717a", fontFamily: "var(--font-geist-mono, monospace)" }}>
                    Hotel Code: <b>{hotelCode}</b>
                </div>
            </div>

            {/* 3. CARD 1: WHATSAPP NOTIFICATION TO OWNER (META OFFICIAL CLOUD API) */}
            {(activeSubTab === "all" || activeSubTab === "whatsapp") && (
                <div className={styles.waCard}>
                    <div className={styles.topRow}>
                        <div className={styles.titleArea}>
                            <div className={`${styles.iconCircle} ${isMetaConfigured ? styles.iconCircleSuccess : styles.iconCircleMeta}`}>
                                <MessageSquare size={18} />
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                                            <span>Nomor Penerima Diperlukan</span>
                                        </span>
                                    )}
                                </div>
                                <p className={styles.subtitleText}>
                                    Kirim notifikasi WhatsApp resmi instan ke Owner dan General Manager untuk Reservasi Baru, Pembatalan, dan Perubahan Jadwal OTA (Booking.com, Agoda, Traveloka, Expedia, dll).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Master System Credentials Banner (Locked / Semi-Dynamic) */}
                    <div className={styles.metaMasterBanner}>
                        <div className={styles.metaMasterLeft}>
                            <ShieldCheck size={16} color="#059669" />
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
                                    title="Buka untuk ubah kredensial Phone ID atau Token khusus"
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
                            <span style={{ fontSize: "12px", color: "#92400e", fontWeight: 600 }}>
                                Masukkan Sandi Admin untuk mengubah Phone ID atau Token khusus:
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
                                style={{ padding: "6px 12px", fontSize: "11px" }}
                            >
                                {verifyingPin ? "Memverifikasi..." : "Buka Kunci"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowPinPrompt(false); setAdminPinInput(""); }}
                                className={styles.btnSecondary}
                                style={{ padding: "6px 10px", fontSize: "11px" }}
                            >
                                Batal
                            </button>
                        </div>
                    )}

                    {/* Form Fields: Owner Phone Number (Multi-Recipient Capable) */}
                    <div style={{ width: "100%" }}>
                        <div className={styles.waField}>
                            <div className={styles.waLabelRow}>
                                <span className={styles.waLabel}>
                                    <Smartphone size={14} style={{ color: "#2563eb" }} />
                                    <span>Nomor WhatsApp Penerima Notifikasi:</span>
                                </span>
                                {parsedPhoneRecipients.length > 0 && (
                                    <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600 }}>
                                        {parsedPhoneRecipients.length} Nomor Penerima Terdeteksi
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={ownerPhone}
                                onChange={e => setOwnerPhone(e.target.value)}
                                placeholder="Contoh: 08813794763, 081234567890 (pisahkan dengan tanda koma untuk multi-nomor)"
                                className={styles.waInput}
                                disabled={loadingWa || savingWa}
                            />
                            {parsedPhoneRecipients.length > 0 && (
                                <div className={styles.recipientTagList}>
                                    {parsedPhoneRecipients.map((num, idx) => (
                                        <span key={idx} className={styles.recipientTag}>
                                            <span style={{ color: "#71717a" }}>Penerima {idx + 1}:</span>
                                            <b>{num}</b>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Advanced Fields: Unlocked Only with Admin PIN */}
                    {isAdvancedUnlocked && (
                        <div className={styles.waInputsGrid} style={{ background: "#fafafa", padding: "14px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
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

                    {/* Notification Trigger Event Matrix */}
                    <div className={styles.triggerSection}>
                        <div className={styles.triggerSectionHeader}>
                            <span>Pemicu Notifikasi WhatsApp (Event Triggers):</span>
                            <span style={{ fontSize: "11px", color: "#71717a", fontWeight: 400 }}>
                                Pilih kejadian reservasi yang dikirimkan via WhatsApp
                            </span>
                        </div>

                        <div className={styles.triggerGrid}>
                            <div
                                className={`${styles.triggerCard} ${notifyNewBooking ? styles.triggerCardActive : ""}`}
                                onClick={() => waEnabled && setNotifyNewBooking(!notifyNewBooking)}
                                style={{ opacity: waEnabled ? 1 : 0.6 }}
                            >
                                <div className={styles.triggerTop}>
                                    <div className={styles.triggerTitleRow}>
                                        <CalendarCheck size={14} style={{ color: "#059669" }} />
                                        <span>Reservasi Baru</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifyNewBooking}
                                        onChange={e => setNotifyNewBooking(e.target.checked)}
                                        disabled={!waEnabled}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                                <p className={styles.triggerDesc}>
                                    Notifikasi instan saat ada tamu baru memesan kamar dari saluran OTA.
                                </p>
                            </div>

                            <div
                                className={`${styles.triggerCard} ${notifyCancellation ? styles.triggerCardActive : ""}`}
                                onClick={() => waEnabled && setNotifyCancellation(!notifyCancellation)}
                                style={{ opacity: waEnabled ? 1 : 0.6 }}
                            >
                                <div className={styles.triggerTop}>
                                    <div className={styles.triggerTitleRow}>
                                        <XCircle size={14} style={{ color: "#dc2626" }} />
                                        <span>Pembatalan OTA</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifyCancellation}
                                        onChange={e => setNotifyCancellation(e.target.checked)}
                                        disabled={!waEnabled}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                                <p className={styles.triggerDesc}>
                                    Pemberitahuan darurat saat tamu membatalkan kamar via OTA.
                                </p>
                            </div>

                            <div
                                className={`${styles.triggerCard} ${notifyModification ? styles.triggerCardActive : ""}`}
                                onClick={() => waEnabled && setNotifyModification(!notifyModification)}
                                style={{ opacity: waEnabled ? 1 : 0.6 }}
                            >
                                <div className={styles.triggerTop}>
                                    <div className={styles.triggerTitleRow}>
                                        <CalendarClock size={14} style={{ color: "#d97706" }} />
                                        <span>Perubahan Jadwal</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifyModification}
                                        onChange={e => setNotifyModification(e.target.checked)}
                                        disabled={!waEnabled}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                                <p className={styles.triggerDesc}>
                                    Pemberitahuan perubahan tanggal menginap atau modifikasi data tamu.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className={styles.waBottomControls}>
                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={waEnabled}
                                onChange={e => setWaEnabled(e.target.checked)}
                            />
                            <span><b>Aktifkan Notifikasi WhatsApp untuk Properti Ini</b></span>
                        </label>

                        <div className={styles.waBtnRow}>
                            <button
                                type="button"
                                onClick={handleTestWa}
                                disabled={testingWa || !ownerPhone.trim()}
                                className={styles.btnSecondary}
                                title="Kirim pesan uji coba ke nomor WhatsApp di atas"
                            >
                                <Send size={13} className={testingWa ? "animate-spin" : ""} />
                                <span>{testingWa ? "Mengirim..." : "Kirim Uji Coba WA"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveWaConfig}
                                disabled={savingWa || loadingWa}
                                className={styles.btnSuccess}
                                title="Simpan konfigurasi WhatsApp untuk properti ini"
                            >
                                <Save size={14} className={savingWa ? "animate-spin" : ""} />
                                <span>{savingWa ? "Menyimpan..." : "Simpan Pengaturan WA"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Info Bar at Bottom */}
                    <div className={styles.metaInfoBar}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <ShieldCheck size={14} style={{ color: "#059669" }} />
                            <span>
                                <b>Meta Official WhatsApp Cloud API: 24/7 Serverless • Template crs_booking_notification</b>
                            </span>
                        </div>
                        <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "10.5px" }}>Multi-tenant terisolasi per properti hotel</span>
                    </div>
                </div>
            )}

            {/* 4. CARD 2: EMAIL NOTIFICATIONS TO OWNER & MANAGEMENT (BREVO CLOUD RELAY) */}
            {(activeSubTab === "all" || activeSubTab === "email") && (
                <div className={styles.waCard}>
                    <div className={styles.topRow}>
                        <div className={styles.titleArea}>
                            <div className={`${styles.iconCircle} ${isEmailConfigured ? styles.iconCircleSuccess : ""}`}>
                                <Mail size={18} />
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                                            <span>Email Penerima Diperlukan</span>
                                        </span>
                                    )}
                                </div>
                                <p className={styles.subtitleText}>
                                    Kirim notifikasi email format HTML resmi dan detail secara instan ke Owner, GM, dan Front Desk untuk Reservasi Baru, Pembatalan, dan Perubahan Jadwal OTA.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Brevo Gateway Banner */}
                    <div className={styles.metaMasterBanner}>
                        <div className={styles.metaMasterLeft}>
                            <ShieldCheck size={16} color="#059669" />
                            <div>
                                <div style={{ fontWeight: 600, color: "#09090b" }}>
                                    Brevo Verified Relay: <b>{brevoSenderEmail}</b>
                                </div>
                                <div className={styles.metaMasterPills} style={{ marginTop: "4px" }}>
                                    <span className={styles.metaPill}>Service: Brevo REST API v3</span>
                                    <span className={hasBrevoKey ? styles.metaPillActive : styles.metaPill}>
                                        {hasBrevoKey ? "API Key Connected & Active" : "API Key Missing"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields: Owner & Management Email */}
                    <div style={{ width: "100%" }}>
                        <div className={styles.waField}>
                            <div className={styles.waLabelRow}>
                                <span className={styles.waLabel}>
                                    <Mail size={14} style={{ color: "#059669" }} />
                                    <span>Alamat Email Penerima Notifikasi:</span>
                                </span>
                                {parsedEmailRecipients.length > 0 && (
                                    <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>
                                        {parsedEmailRecipients.length} Alamat Email Terdeteksi
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={ownerEmail}
                                onChange={e => setOwnerEmail(e.target.value)}
                                placeholder="Contoh: owner@hotel.com, gm@hotel.com (pisahkan dengan koma untuk multi-email)"
                                className={styles.waInput}
                                disabled={loadingEmail || savingEmail}
                            />
                            {parsedEmailRecipients.length > 0 && (
                                <div className={styles.recipientTagList}>
                                    {parsedEmailRecipients.map((email, idx) => (
                                        <span key={idx} className={styles.recipientTag}>
                                            <span style={{ color: "#71717a" }}>Penerima {idx + 1}:</span>
                                            <b>{email}</b>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Field: Custom Sender Email */}
                    <div style={{ width: "100%", marginTop: "2px" }}>
                        <div className={styles.waField}>
                            <div className={styles.waLabelRow}>
                                <span className={styles.waLabel}>
                                    <Send size={13} style={{ color: "#71717a" }} />
                                    <span>Email Pengirim Khusus (Custom Sender Email):</span>
                                </span>
                                <span style={{ fontSize: "11px", color: "#71717a" }}>
                                    Opsional (Wajib verifikasi domain di Brevo)
                                </span>
                            </div>
                            <input
                                type="email"
                                value={customSenderEmail}
                                onChange={e => setCustomSenderEmail(e.target.value)}
                                placeholder={`Default: ${brevoSenderEmail || "reservation@mytara.id"} (contoh: reservation@domainhotel.com)`}
                                className={styles.waInput}
                                disabled={loadingEmail || savingEmail}
                            />
                            <div style={{ fontSize: "11px", color: "#71717a", lineHeight: 1.45, marginTop: "3px" }}>
                                Default pengirim menggunakan <b>My Tara</b> resmi. Jika menggunakan email domain hotel sendiri, pastikan alamat tersebut sudah diverifikasi di menu Senders Brevo.
                            </div>
                        </div>
                    </div>

                    {/* Email Notification Trigger Event Matrix */}
                    <div className={styles.triggerSection}>
                        <div className={styles.triggerSectionHeader}>
                            <span>Pemicu Notifikasi Email (Event Triggers):</span>
                            <span style={{ fontSize: "11px", color: "#71717a", fontWeight: 400 }}>
                                Pilih kejadian reservasi yang dikirimkan via Email
                            </span>
                        </div>

                        <div className={styles.triggerGrid}>
                            <div
                                className={`${styles.triggerCard} ${notifyEmailNewBooking ? styles.triggerCardActive : ""}`}
                                onClick={() => emailEnabled && setNotifyEmailNewBooking(!notifyEmailNewBooking)}
                                style={{ opacity: emailEnabled ? 1 : 0.6 }}
                            >
                                <div className={styles.triggerTop}>
                                    <div className={styles.triggerTitleRow}>
                                        <CalendarCheck size={14} style={{ color: "#059669" }} />
                                        <span>Reservasi Baru</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifyEmailNewBooking}
                                        onChange={e => setNotifyEmailNewBooking(e.target.checked)}
                                        disabled={!emailEnabled}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                                <p className={styles.triggerDesc}>
                                    Email invoice &amp; detail pesanan saat tamu memesan via OTA.
                                </p>
                            </div>

                            <div
                                className={`${styles.triggerCard} ${notifyEmailCancellation ? styles.triggerCardActive : ""}`}
                                onClick={() => emailEnabled && setNotifyEmailCancellation(!notifyEmailCancellation)}
                                style={{ opacity: emailEnabled ? 1 : 0.6 }}
                            >
                                <div className={styles.triggerTop}>
                                    <div className={styles.triggerTitleRow}>
                                        <XCircle size={14} style={{ color: "#dc2626" }} />
                                        <span>Pembatalan OTA</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifyEmailCancellation}
                                        onChange={e => setNotifyEmailCancellation(e.target.checked)}
                                        disabled={!emailEnabled}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                                <p className={styles.triggerDesc}>
                                    Laporan pembatalan kamar OTA lengkap dengan alasan pembatalan.
                                </p>
                            </div>

                            <div
                                className={`${styles.triggerCard} ${notifyEmailModification ? styles.triggerCardActive : ""}`}
                                onClick={() => emailEnabled && setNotifyEmailModification(!notifyEmailModification)}
                                style={{ opacity: emailEnabled ? 1 : 0.6 }}
                            >
                                <div className={styles.triggerTop}>
                                    <div className={styles.triggerTitleRow}>
                                        <CalendarClock size={14} style={{ color: "#d97706" }} />
                                        <span>Perubahan Jadwal</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifyEmailModification}
                                        onChange={e => setNotifyEmailModification(e.target.checked)}
                                        disabled={!emailEnabled}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                                <p className={styles.triggerDesc}>
                                    Rangkuman perubahan tanggal menginap atau tipe kamar tamu.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className={styles.waBottomControls}>
                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={emailEnabled}
                                onChange={e => setEmailEnabled(e.target.checked)}
                            />
                            <span><b>Aktifkan Notifikasi Email untuk Properti Ini</b></span>
                        </label>

                        <div className={styles.waBtnRow}>
                            <button
                                type="button"
                                onClick={handleTestEmail}
                                disabled={testingEmail || !ownerEmail.trim()}
                                className={styles.btnSecondary}
                                title="Kirim email uji coba Brevo ke alamat email di atas"
                            >
                                <Send size={13} className={testingEmail ? "animate-spin" : ""} />
                                <span>{testingEmail ? "Mengirim..." : "Kirim Uji Coba Email"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveEmailConfig}
                                disabled={savingEmail || loadingEmail}
                                className={styles.btnSuccess}
                                title="Simpan konfigurasi email untuk properti ini"
                            >
                                <Save size={14} className={savingEmail ? "animate-spin" : ""} />
                                <span>{savingEmail ? "Menyimpan..." : "Simpan Pengaturan Email"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Info Bar at Bottom */}
                    <div className={styles.metaInfoBar}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <ShieldCheck size={14} style={{ color: "#059669" }} />
                            <span>
                                <b>Brevo Official Cloud Relay: High Deliverability (DKIM/SPF) • Sender: {brevoSenderEmail}</b>
                            </span>
                        </div>
                        <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "10.5px" }}>Multi-recipient safe • Isolated per tenant</span>
                    </div>
                </div>
            )}

            {/* 5. CARD 3: PWA WEB PUSH NOTIFICATION (BROWSER/LOCKSCREEN) */}
            {(activeSubTab === "all" || activeSubTab === "push") && (
                <div className={styles.card}>
                    <div className={styles.topRow}>
                        <div className={styles.titleArea}>
                            <div className={`${styles.iconCircle} ${isGranted ? styles.iconCircleSuccess : ""}`}>
                                <Bell size={18} />
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                                            <span>Belum Diaktifkan</span>
                                        </span>
                                    )}
                                </div>
                                <p className={styles.subtitleText}>
                                    Notifikasi instan di layar kunci perangkat dan browser komputer dengan nada dering saat reservasi baru atau pembatalan masuk dari seluruh OTA.
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

                    <div className={styles.bottomRow}>
                        <div className={styles.featureList}>
                            <span className={styles.featureItem}>
                                <Check size={12} color="#059669" />
                                <span>Nada dering kasir &amp; front desk otomatis</span>
                            </span>
                            <span className={styles.featureItem}>
                                <Check size={12} color="#059669" />
                                <span>Bekerja di latar belakang saat layar terkunci</span>
                            </span>
                            <span className={styles.featureItem}>
                                <Check size={12} color="#059669" />
                                <span>Kompatibel Android, iOS Safari PWA, Chrome &amp; Edge</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
