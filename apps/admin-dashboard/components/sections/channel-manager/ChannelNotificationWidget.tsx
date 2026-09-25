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
                toast.success(data.message || "Owner WhatsApp settings saved successfully.");
            } else {
                toast.error(data.error || "Failed to save WhatsApp settings.");
            }
        } catch (err: any) {
            toast.error("Failed to connect to server: " + err.message);
        } finally {
            setSavingWa(false);
        }
    };

    // Test send WhatsApp notification
    const handleTestWa = async () => {
        if (!hotelCode) return;
        if (!ownerPhone.trim()) {
            toast.warning("Please enter an Owner WhatsApp number before sending a test message.");
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
                toast.success(data.message || `Test message sent successfully to ${ownerPhone}!`);
            } else {
                toast.error(`WhatsApp Test: ${data.error || "Failed to send message."}`);
            }
        } catch (err: any) {
            toast.error("Test execution failed: " + err.message);
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
            {/* CARD 1: WHATSAPP NOTIFICATION TO OWNER (META OFFICIAL & FONNTE) */}
            <div className={styles.waCard}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle} style={{ background: gateway === "meta" ? "#eff6ff" : "#ecfdf5", color: gateway === "meta" ? "#2563eb" : "#10b981" }}>
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h4 className={styles.titleText}>
                                    {gateway === "meta" ? "Owner WhatsApp Notifications (Meta Official Cloud API)" : "Owner WhatsApp Notifications (Fonnte Gateway)"}
                                </h4>
                                {(gateway === "meta" ? isMetaConfigured : isFonnteConfigured) ? (
                                    <span className={styles.badgeActive}>
                                        <span className={`${styles.dot} ${styles.dotGreen}`} />
                                        <span>{gateway === "meta" ? "Meta Cloud Active" : "Fonnte Active"}</span>
                                    </span>
                                ) : (
                                    <span className={styles.badgeInactive}>
                                        <span className={`${styles.dot} ${styles.dotGray}`} />
                                        <span>Not Configured</span>
                                    </span>
                                )}
                            </div>
                            <p className={styles.subtitleText}>
                                Automatically dispatch WhatsApp notifications to Owner / GM for incoming reservations and cancellations from connected OTAs (Booking.com, Agoda, etc.).
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
                            <span className={styles.recommendTag}>Serverless</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGateway("fonnte")}
                            className={`${styles.gatewayTab} ${gateway === "fonnte" ? styles.gatewayTabActiveFonnte : ""}`}
                        >
                            <Smartphone size={14} />
                            <span>Fonnte Gateway (Web QR Device)</span>
                        </button>
                    </div>
                </div>

                {/* Form Fields: Full Width Responsive Grid */}
                {gateway === "meta" ? (
                    /* META OFFICIAL 3-COLUMN FORM */
                    <div className={styles.waInputsGrid}>
                        <div className={styles.waField}>
                            <label className={styles.waLabel}>
                                Owner / GM WhatsApp Number:
                            </label>
                            <input
                                type="text"
                                value={ownerPhone}
                                onChange={e => setOwnerPhone(e.target.value)}
                                placeholder="e.g. +628123456789 or 08123456789"
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
                                placeholder={systemPhoneId ? `System Default (${systemPhoneId})` : "Copy Phone Number ID from Meta Dev Console"}
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
                                placeholder={hasMetaToken ? "Using Server Environment Token" : "Paste EAAB... token"}
                                className={styles.waInput}
                                disabled={loadingWa || savingWa}
                            />
                        </div>
                    </div>
                ) : (
                    /* FONNTE 2-COLUMN FORM */
                    <div className={styles.waInputsGrid2Col}>
                        <div className={styles.waField}>
                            <label className={styles.waLabel}>
                                Owner / GM WhatsApp Number:
                            </label>
                            <input
                                type="text"
                                value={ownerPhone}
                                onChange={e => setOwnerPhone(e.target.value)}
                                placeholder="e.g. +628123456789 or 08123456789"
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
                                    <span>Get via Fonnte</span>
                                    <ExternalLink size={10} />
                                </a>
                            </div>
                            <input
                                type="password"
                                value={fonnteToken}
                                onChange={e => setFonnteToken(e.target.value)}
                                placeholder="Copy Token from Fonnte Device Settings"
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
                            <span>Enable WhatsApp Alerts</span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyNewBooking}
                                onChange={e => setNotifyNewBooking(e.target.checked)}
                                disabled={!waEnabled}
                            />
                            <span>Notify on New Reservation</span>
                        </label>

                        <label className={styles.waCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={notifyCancellation}
                                onChange={e => setNotifyCancellation(e.target.checked)}
                                disabled={!waEnabled}
                            />
                            <span>Notify on OTA Cancellation</span>
                        </label>
                    </div>

                    <div className={styles.waBtnRow}>
                        <button
                            type="button"
                            onClick={handleSaveWaConfig}
                            disabled={savingWa || loadingWa}
                            className={styles.btnSuccess}
                            title="Save WhatsApp settings for this property"
                        >
                            <Save size={14} className={savingWa ? "animate-spin" : ""} />
                            <span>{savingWa ? "Saving..." : "Save WA Settings"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleTestWa}
                            disabled={testingWa || !ownerPhone}
                            className={styles.btnSecondary}
                            title="Send test message to specified WhatsApp number"
                        >
                            <Send size={13} className={testingWa ? "animate-spin" : ""} />
                            <span>{testingWa ? "Sending..." : "Send Test WhatsApp"}</span>
                        </button>
                    </div>
                </div>

                {/* Info Bar at Bottom */}
                <div className={styles.metaInfoBar} style={{ background: gateway === "meta" ? "#eff6ff" : "#f0fdf4", border: `1px solid ${gateway === "meta" ? "#bfdbfe" : "#bbf7d0"}`, color: gateway === "meta" ? "#1e40af" : "#166534" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ShieldCheck size={14} color={gateway === "meta" ? "#2563eb" : "#10b981"} />
                        <span>
                            {gateway === "meta" 
                                ? <b>Official WhatsApp Cloud API (Meta) • Serverless • No Physical Phone Required • 24/7 Availability</b> 
                                : <b>Fonnte WhatsApp Engine • Self-hosted device bridge • Messages dispatched through linked mobile device</b>}
                        </span>
                    </div>
                    <span>Multi-tenant isolated per hotel property</span>
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
                                Instant alerts for new reservations and cancellations displayed on lockscreen with native sound notifications when supported by your browser.
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
                                title="Enable push notifications on this device"
                            >
                                <Bell size={14} className={loading ? "animate-spin" : ""} />
                                <span>{loading ? "Requesting Permission..." : "Enable Alerts on This Device"}</span>
                            </button>
                        )}

                        {isGranted && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => sendTestPush("booking_new")}
                                    disabled={testing}
                                    className={styles.btnSecondary}
                                    title="Send simulation notification for new reservation"
                                >
                                    <Send size={13} className={testing ? "animate-spin" : ""} />
                                    <span>Test New Booking Alert</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => sendTestPush("booking_cancelled")}
                                    disabled={testing}
                                    className={styles.btnSecondary}
                                    title="Send simulation notification for reservation cancellation"
                                >
                                    <AlertCircle size={13} color="#dc2626" />
                                    <span>Test Cancellation Alert</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={unsubscribeFromPush}
                                    disabled={loading}
                                    className={styles.btnDangerOutline}
                                    title="Disable alerts on this device"
                                >
                                    <BellOff size={13} />
                                    <span>Disable Alerts</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.bottomRow}>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <Check size={13} color="#10b981" />
                            <span>Lockscreen &amp; Banner Notification Support</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Volume2 size={13} color="#2563eb" />
                            <span>Native Device Sound &amp; Vibration</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Smartphone size={13} color="#059669" />
                            <span>Zero Infrastructure Cost Web Push</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
