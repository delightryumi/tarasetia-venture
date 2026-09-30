"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, Volume2, Smartphone, Globe, Check, AlertCircle, Send, MessageSquare, Save, ShieldCheck, Lock, Unlock, KeyRound, ExternalLink } from "lucide-react";
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

    const isGranted = permission === "granted" && isSubscribed;
    const isDenied = permission === "denied";
    const isMetaConfigured = !!ownerPhone && waEnabled && (metaAccessToken || hasMetaToken);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
            {/* CARD 1: WHATSAPP NOTIFICATION TO OWNER (META OFFICIAL CLOUD API) */}
            <div className={styles.waCard}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle} style={{ background: "#eff6ff", color: "#2563eb" }}>
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
                        <ShieldCheck size={16} color="#16a34a" />
                        <div>
                            <div style={{ fontWeight: 600, color: "#14532d" }}>
                                Master Gateway: <b>{senderDisplay}</b>
                            </div>
                            <div className={styles.metaMasterPills} style={{ marginTop: "4px" }}>
                                <span className={styles.metaPill}>WABA ID: {systemWabaId}</span>
                                <span className={styles.metaPill}>Phone ID: {systemPhoneId}</span>
                                <span className={styles.metaPill} style={{ background: "#dcfce7", borderColor: "#86efac", color: "#166534" }}>
                                    ✓ Permanent System Token Active
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
                                style={{ color: "#b45309", borderColor: "#fde68a", background: "#fef3c7" }}
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
                                        📱 Nomor WhatsApp Owner / Management (Mendukung Multi-Nomor):
                                    </span>
                                    {parsedRecipients.length > 1 && (
                                        <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                                            ✓ {parsedRecipients.length} Nomor Penerima Terdeteksi
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
                                    style={{ fontSize: "14px", fontWeight: 500 }}
                                />
                                {parsedRecipients.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                                        {parsedRecipients.map((num, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    fontSize: "11px",
                                                    padding: "3px 8px",
                                                    background: "#f8fafc",
                                                    borderRadius: "6px",
                                                    color: "#1e293b",
                                                    border: "1px solid #cbd5e1",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}
                                            >
                                                <span>👤 Penerima #{idx + 1}:</span>
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
                    <div className={styles.waInputsGrid} style={{ background: "#fffbeb", padding: "14px", borderRadius: "8px", border: "1px dashed #f59e0b" }}>
                        <div className={styles.waField}>
                            <label className={styles.waLabel} style={{ color: "#92400e" }}>
                                ⚙️ Custom Meta Phone Number ID (Optional Override):
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
                                <span className={styles.waLabel} style={{ color: "#92400e" }}>
                                    🔑 Custom Permanent Access Token (Optional Override):
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
                            <span>🛎️ Booking Baru</span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyCancellation}
                                onChange={e => setNotifyCancellation(e.target.checked)}
                                disabled={!waEnabled}
                            />
                            <span>🚨 Pembatalan OTA</span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyModification}
                                onChange={e => setNotifyModification(e.target.checked)}
                                disabled={!waEnabled}
                            />
                            <span>✏️ Perubahan / Reschedule</span>
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
                <div className={styles.metaInfoBar} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ShieldCheck size={14} color="#2563eb" />
                        <span>
                            <b>Meta Official WhatsApp Cloud API • Serverless 24/7 • Template crs_booking_notification • Tanpa Perlu HP Menyala</b>
                        </span>
                    </div>
                    <span>Multi-tenant terisolasi per properti hotel</span>
                </div>
            </div>

            {/* CARD 2: PWA WEB PUSH NOTIFICATION (BROWSER/LOCKSCREEN) */}
            <div className={styles.card}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle} style={{ background: isGranted ? "#ecfdf5" : isDenied ? "#fef2f2" : "#eff6ff", color: isGranted ? "#059669" : isDenied ? "#dc2626" : "#2563eb" }}>
                            <Bell size={18} />
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
                                Notifikasi instan di layar kunci perangkat / browser komputer dengan suara dering saat ada reservasi baru atau pembatalan masuk.
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
