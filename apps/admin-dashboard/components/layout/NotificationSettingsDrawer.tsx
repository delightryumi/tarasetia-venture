"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Bell, BellOff, X, ShieldCheck, Send, AlertCircle,
    Volume2, Check, Wifi, BedDouble,
    RefreshCw, MessageSquare, Star, CreditCard
} from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import styles from "./NotificationSettingsDrawer.module.css";

// ── Per-user notification preferences key (localStorage) ──
const PREFS_KEY = (userId: string) => `mytara_notif_prefs_${userId}`;

export interface NotificationPreferences {
    booking_new: boolean;
    booking_cancelled: boolean;
    booking_modification: boolean;
    ari_sync: boolean;
    channel_events: boolean;
    guest_reviews: boolean;
    payment_alerts: boolean;
    system_alerts: boolean;
    sound_enabled: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
    booking_new: true,
    booking_cancelled: true,
    booking_modification: true,
    ari_sync: false,
    channel_events: false,
    guest_reviews: false,
    payment_alerts: true,
    system_alerts: true,
    sound_enabled: true,
};

interface ToggleItem {
    key: keyof NotificationPreferences;
    label: string;
    description: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    priority?: "high" | "normal" | "low";
}

const NOTIFICATION_ITEMS: ToggleItem[] = [
    {
        key: "booking_new",
        label: "New Reservation",
        description: "Instant alert when a guest makes a new booking via OTA channels (Booking.com, Agoda, etc.).",
        icon: BedDouble,
        iconBg: "#ecfdf5",
        iconColor: "#059669",
        priority: "high"
    },
    {
        key: "booking_cancelled",
        label: "Reservation Cancellation",
        description: "Urgent alert when a guest cancels a confirmed booking. Dedicated vibration pattern.",
        icon: AlertCircle,
        iconBg: "#fef2f2",
        iconColor: "#dc2626",
        priority: "high"
    },
    {
        key: "booking_modification",
        label: "Reservation Modification",
        description: "Alert when a guest modifies check-in/check-out dates, room type, or booking details.",
        icon: RefreshCw,
        iconBg: "#eff6ff",
        iconColor: "#2563eb",
        priority: "normal"
    },
    {
        key: "payment_alerts",
        label: "Payment & PCI Vault",
        description: "Alerts for VCC capture, new payment tokens, failed transactions, and card vault events.",
        icon: CreditCard,
        iconBg: "#fef9c3",
        iconColor: "#b45309",
        priority: "high"
    },
    {
        key: "ari_sync",
        label: "ARI Sync Status",
        description: "Notification after availability, rates, and inventory sync to OTA channels succeeds or fails.",
        icon: Wifi,
        iconBg: "#f0f9ff",
        iconColor: "#0284c7",
        priority: "low"
    },
    {
        key: "channel_events",
        label: "Channel Manager Events",
        description: "Activity reports: Channel Activated, Deactivated, Full Sync, Mapping Updated.",
        icon: ShieldCheck,
        iconBg: "#f5f3ff",
        iconColor: "#7c3aed",
        priority: "low"
    },
    {
        key: "guest_reviews",
        label: "Guest Reviews & Ratings",
        description: "Alert when a new guest review is received from Booking.com, Agoda, or other OTA platforms.",
        icon: Star,
        iconBg: "#fff7ed",
        iconColor: "#c2410c",
        priority: "normal"
    },
    {
        key: "system_alerts",
        label: "System Alerts & Errors",
        description: "Critical alerts for webhook failures, connectivity issues, or OTA channel errors.",
        icon: MessageSquare,
        iconBg: "#f1f5f9",
        iconColor: "#64748b",
        priority: "normal"
    },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    hotelCode: string;
    userId?: string;
    userEmail?: string;
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            className={`${styles.toggleTrack} ${checked ? styles.toggleTrackOn : ""}`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled) {
                    onChange(!checked);
                }
            }}
            aria-label="Toggle preference"
        >
            <span className={`${styles.toggleThumb} ${checked ? styles.toggleThumbOn : ""}`} />
        </button>
    );
}

export function NotificationSettingsDrawer({ isOpen, onClose, hotelCode, userId = "guest", userEmail }: Props) {
    const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
    const [mounted, setMounted] = useState(false);

    const { permission, isSubscribed, loading, testing, subscribeToPush, unsubscribeFromPush, sendTestPush } = usePushNotifications(hotelCode, userEmail);

    useEffect(() => { setMounted(true); }, []);

    // Load saved prefs from localStorage (per user)
    useEffect(() => {
        if (!mounted) return;
        try {
            const stored = localStorage.getItem(PREFS_KEY(userId));
            if (stored) {
                setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
            }
        } catch {/* ignore */}
    }, [userId, mounted]);

    const togglePref = (key: keyof NotificationPreferences, value: boolean) => {
        setPrefs(prev => {
            const updated = { ...prev, [key]: value };
            try {
                localStorage.setItem(PREFS_KEY(userId), JSON.stringify(updated));
            } catch {/* ignore */}
            if (hotelCode) {
                fetch("/api/notifications/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode,
                        subscription: null,
                        userEmail: userEmail || "staff",
                        preferences: updated
                    })
                }).catch(() => {});
            }
            return updated;
        });

        const item = NOTIFICATION_ITEMS.find(i => i.key === key);
        toast.success(`"${item?.label || key}" ${value ? "enabled" : "disabled"}.`, { duration: 1800 });
    };

    const isDenied = permission === "denied";
    const isGranted = permission === "granted" && isSubscribed;

    if (!mounted || !isOpen) return null;

    return createPortal(
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.drawer}>
                {/* ── Header ── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <Bell size={20} />
                        </div>
                        <div>
                            <h2 className={styles.headerTitle}>Push Notification Settings</h2>
                            <p className={styles.headerSubtitle}>Configure alerts for this device • Per-account preferences</p>
                        </div>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose} title="Close">
                        <X size={16} />
                    </button>
                </div>

                {/* ── Device Permission Status Banner with Interactive Master Switch ── */}
                <div className={styles.statusBanner}>
                    <div className={styles.statusLeft}>
                        <span className={`${styles.statusDot} ${isGranted ? styles.statusDotGreen : isDenied ? styles.statusDotRed : styles.statusDotGray}`} />
                        <div>
                            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "12px", lineHeight: 1.2 }}>
                                {isGranted ? "Push Notifications Active on This Device" : isDenied ? "Notifications Blocked by Browser / OS" : "Push Notifications Disabled"}
                            </div>
                            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                                {isGranted ? "Receiving sound & lockscreen alerts" : "Turn on to get instant sound & lockscreen alerts"}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className={`${styles.statusBadge} ${isGranted ? styles.statusBadgeGreen : isDenied ? styles.statusBadgeRed : styles.statusBadgeGray}`}>
                            {isGranted ? "● ACTIVE" : isDenied ? "● BLOCKED" : "● OFF"}
                        </span>
                        <Toggle
                            checked={isGranted}
                            disabled={loading || isDenied}
                            onChange={(enable) => {
                                if (enable) {
                                    subscribeToPush();
                                } else {
                                    unsubscribeFromPush();
                                }
                            }}
                        />
                    </div>
                </div>

                {/* ── Body ── */}
                <div className={styles.body}>

                    {/* ── Enable / Disable Push Banner ── */}
                    {!isGranted && (
                        <div className={styles.section}>
                            {isDenied ? (
                                <div className={styles.infoCard}>
                                    <div className={styles.infoRow}>
                                        <AlertCircle size={14} color="#dc2626" />
                                        <span style={{ fontWeight: 700, color: "#b91c1c" }}>Notifications Blocked</span>
                                    </div>
                                    <p style={{ margin: "0", color: "#64748b", fontSize: "11px", lineHeight: "1.6" }}>
                                        Your browser or OS is blocking push notifications. To enable: click the lock/settings icon near your browser address bar and choose <b>Notifications &rarr; Allow</b>.
                                    </p>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.btnEnable}
                                    onClick={subscribeToPush}
                                    disabled={loading}
                                    style={{ width: "100%", justifyContent: "center" }}
                                >
                                    <Bell size={14} />
                                    <span>{loading ? "Requesting Permission..." : "Enable Push Notifications on This Device"}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Interactive Sound & Alert Simulation (Always Available) ── */}
                    <div className={styles.section}>
                        <div className={styles.simulationBox}>
                            <div className={styles.simulationHeader}>
                                <span className={styles.simulationTitle}>Test Alerts & Audio Simulation</span>
                                <span style={{ fontSize: "10px", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", color: "#475569", fontWeight: 600 }}>
                                    Local Audio & Web Push
                                </span>
                            </div>
                            <p className={styles.simulationNote}>
                                Click below to play the 5-star concierge chime and simulate an incoming transaction alert immediately.
                            </p>
                            <div className={styles.testRow}>
                                <button
                                    type="button"
                                    className={styles.btnTest}
                                    onClick={() => sendTestPush("booking_new")}
                                    disabled={testing}
                                >
                                    <Send size={12} />
                                    <span>🛎️ Simulate New Booking</span>
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.btnTest} ${styles.btnTestDanger}`}
                                    onClick={() => sendTestPush("booking_cancelled")}
                                    disabled={testing}
                                >
                                    <AlertCircle size={12} />
                                    <span>🚨 Simulate Cancellation</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Notification Type Toggles ── */}
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Alert Types</div>
                        {NOTIFICATION_ITEMS.map(item => {
                            const IconComponent = item.icon;
                            const isOn = prefs[item.key] as boolean;
                            return (
                                <div key={item.key} className={styles.toggleRow}>
                                    <div className={styles.toggleLeft}>
                                        <div
                                            className={styles.toggleIcon}
                                            style={{ background: isOn ? item.iconBg : "#f1f5f9" }}
                                        >
                                            <IconComponent size={15} color={isOn ? item.iconColor : "#94a3b8"} />
                                        </div>
                                        <div>
                                            <div className={styles.toggleLabel}>
                                                {item.label}
                                                {item.priority === "high" && (
                                                    <span style={{ marginLeft: "6px", fontSize: "9px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>
                                                        CRITICAL
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.toggleDesc}>{item.description}</div>
                                        </div>
                                    </div>
                                    <Toggle
                                        checked={isOn}
                                        onChange={v => togglePref(item.key as keyof NotificationPreferences, v)}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Sound & Vibration Toggle ── */}
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Sound & Vibration</div>
                        <div className={styles.toggleRow}>
                            <div className={styles.toggleLeft}>
                                <div className={styles.toggleIcon} style={{ background: prefs.sound_enabled ? "#f0f9ff" : "#f1f5f9" }}>
                                    <Volume2 size={15} color={prefs.sound_enabled ? "#0284c7" : "#94a3b8"} />
                                </div>
                                <div>
                                    <div className={styles.toggleLabel}>Device Default Ringtone</div>
                                    <div className={styles.toggleDesc}>Notification sound follows the default ringtone set in your Android / iOS device settings. No external audio required.</div>
                                </div>
                            </div>
                            <Toggle checked={prefs.sound_enabled} onChange={v => togglePref("sound_enabled", v)} />
                        </div>
                    </div>

                    {/* ── Disable All Button ── */}
                    {isGranted && (
                        <div className={styles.section}>
                            <button
                                type="button"
                                className={styles.btnDisable}
                                onClick={unsubscribeFromPush}
                                disabled={loading}
                            >
                                <BellOff size={13} />
                                <span>{loading ? "Disabling..." : "Disable All Notifications on This Device"}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
}
