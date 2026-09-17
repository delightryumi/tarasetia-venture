"use client";

import React from "react";
import { Bell, BellOff, Volume2, Smartphone, Check, AlertCircle, RefreshCw, Send } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import styles from "./ChannelNotificationWidget.module.css";

interface Props {
    hotelCode: string;
    userEmail?: string;
}

export function ChannelNotificationWidget({ hotelCode, userEmail }: Props) {
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

    if (!isSupported) {
        return (
            <div className={styles.card}>
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconCircle} style={{ background: "#fef2f2", color: "#ef4444" }}>
                            <BellOff size={18} />
                        </div>
                        <div>
                            <h4 className={styles.titleText}>Notifikasi Push PWA</h4>
                            <p className={styles.subtitleText}>Browser ini belum mendukung Web Push Notification atau fitur Service Worker.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isGranted = permission === "granted" && isSubscribed;
    const isDenied = permission === "denied";

    return (
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
                            Peringatan instan booking baru &amp; pembatalan OTA di layar kunci HP dengan nada notifikasi bawaan ponsel Anda, meskipun layar HP sedang mati.
                        </p>
                    </div>
                </div>

                <div className={styles.btnGroup}>
                    {!isGranted && (
                        <button
                            type="button"
                            onClick={subscribeToPush}
                            disabled={loading || isDenied}
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
    );
}
