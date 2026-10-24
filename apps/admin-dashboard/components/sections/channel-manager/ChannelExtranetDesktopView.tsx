"use client";

import React from "react";
import {
    LayoutGrid,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    ShieldAlert,
    AlertCircle,
    AlertTriangle,
    Lock,
    KeyRound,
    Zap,
    Info
} from "lucide-react";
import styles from "./ChannelExtranetDesktopView.module.css";

interface ChannelExtranetDesktopViewProps {
    hotelCode: string;
    hotelName?: string;
    channexEnv: "staging" | "production";
    iframeUrl: string;
    loadingIframe: boolean;
    iframeLoaded: boolean;
    authError: string | null;
    onLoadIframeUrl: () => void;
    onIframeLoad: () => void;
    onGoToGolive: () => void;
    onGoToMapping: () => void;
}

export function ChannelExtranetDesktopView({
    hotelCode,
    hotelName,
    channexEnv,
    iframeUrl,
    loadingIframe,
    iframeLoaded,
    authError,
    onLoadIframeUrl,
    onIframeLoad,
    onGoToGolive,
    onGoToMapping
}: ChannelExtranetDesktopViewProps) {
    return (
        <div className={styles.desktopContainer}>
            {/* Top Toolbar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.titleRow}>
                        <div className={styles.title}>
                            <LayoutGrid size={16} color="#09090b" />
                            <span>Global Channel Mapping Extranet (Channex Hub)</span>
                        </div>
                        <span className={channexEnv === "production" ? styles.envBadgeProd : styles.envBadgeStaging}>
                            {channexEnv === "production" ? "PRODUCTION HUB" : "SANDBOX STAGING"}
                        </span>
                    </div>
                    <span className={styles.desc}>
                        Antarmuka visual mapping extranet resmi untuk mengaktifkan saluran OTA serta memetakan tipe kamar dan rate plan secara visual.
                    </span>
                </div>

                <div className={styles.actionsGroup}>
                    {iframeUrl && (
                        <a
                            href={iframeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnPrimary}
                            title="Buka interface mapping di tab browser baru"
                        >
                            <ExternalLink size={13} />
                            <span>Buka di Tab Baru</span>
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={onLoadIframeUrl}
                        disabled={loadingIframe}
                        className={styles.btnSecondary}
                    >
                        <RefreshCw size={13} className={loadingIframe ? "animate-spin" : ""} />
                        <span>{loadingIframe ? "Menghubungkan..." : "Reload Frame"}</span>
                    </button>
                </div>
            </div>

            {/* SSO Dynamic Security Status Strip */}
            <div className={styles.ssoStrip}>
                <div className={styles.ssoStripLeft}>
                    {loadingIframe ? (
                        <span className={`${styles.statusIndicator} ${styles.statusPending}`}>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Inisialisasi Sesi SSO Terenkripsi...</span>
                        </span>
                    ) : iframeUrl ? (
                        <span className={`${styles.statusIndicator} ${styles.statusActive}`}>
                            <span className={styles.statusPulse} />
                            <ShieldCheck size={14} />
                            <span>SSO Session: Terautentikasi &amp; Terenkripsi</span>
                        </span>
                    ) : authError ? (
                        <span className={`${styles.statusIndicator} ${styles.statusError}`}>
                            <AlertCircle size={14} />
                            <span>SSO Session: Autentikasi Terkendala</span>
                        </span>
                    ) : (
                        <span className={`${styles.statusIndicator} ${styles.statusPending}`}>
                            <ShieldAlert size={14} />
                            <span>SSO Session: Belum Terhubung</span>
                        </span>
                    )}

                    <span className={styles.divider}>•</span>

                    <span className={styles.metaText}>
                        Properti: <span className={styles.metaHighlight}>{hotelCode || "Default"}</span>
                    </span>
                </div>

                <div className={styles.ssoStripRight}>
                    <span>Gateway: <b style={{ color: channexEnv === "production" ? "#15803d" : "#b45309" }}>{channexEnv.toUpperCase()}</b></span>
                    <span className={styles.divider}>•</span>
                    <span>Direct Channel Distribution Engine</span>
                </div>
            </div>

            {/* Frame Viewport Card */}
            <div className={styles.iframeCard}>
                {loadingIframe ? (
                    <div className={styles.emptyCard}>
                        <RefreshCw size={26} className="animate-spin" color="#71717a" />
                        <span className={styles.emptyTitle}>Menghubungkan ke Channel Distribution Hub...</span>
                        <p className={styles.emptyDesc}>
                            Sedang menginisialisasi sesi Single Sign-On (SSO) aman untuk properti <b>{hotelName || hotelCode || "aktif"}</b>. Antarmuka extranet Channex akan segera dimuat.
                        </p>
                    </div>
                ) : iframeUrl ? (
                    <>
                        <div className={styles.iframeWrapper}>
                            {!iframeLoaded && (
                                <div className={styles.iframeOverlay}>
                                    <RefreshCw size={22} className="animate-spin" color="#71717a" />
                                    <span className={styles.overlayTitle}>Memuat konsol Channex Visual Extranet...</span>
                                    <span className={styles.overlayDesc}>Menyinkronkan sesi SSO terenkripsi</span>
                                </div>
                            )}
                            <iframe
                                src={iframeUrl}
                                onLoad={onIframeLoad}
                                className={styles.iframe}
                                title="Global Channel Mapping Hub"
                                allow="clipboard-read; clipboard-write"
                            />
                        </div>

                        <div className={styles.iframeFooter}>
                            <div className={styles.footerSecurity}>
                                <Lock size={12} color="#15803d" />
                                <span>Sesi SSO aman dengan token sekali pakai (One-Time Access Token) berstandar AES-256.</span>
                            </div>
                            <div className={styles.footerLinks}>
                                <button
                                    type="button"
                                    onClick={onGoToMapping}
                                    className={styles.linkBtn}
                                >
                                    Pemetaan Internal Setara
                                </button>
                                <span style={{ color: "#d4d4d8" }}>•</span>
                                <button
                                    type="button"
                                    onClick={onGoToGolive}
                                    className={styles.linkBtn}
                                >
                                    Kredensial API Channex
                                </button>
                            </div>
                        </div>
                    </>
                ) : authError ? (
                    <div className={styles.errorCard}>
                        <div className={styles.errorIconWrap}>
                            <AlertTriangle size={22} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                            <span className={styles.errorTitle}>
                                {authError.toLowerCase().includes("api key")
                                    ? "Kredensial API Channex Belum Lengkap"
                                    : "Koneksi SSO Extranet Terkendala"}
                            </span>
                            <div className={styles.errorBox}>{authError}</div>
                        </div>

                        <div className={styles.troubleshootBox}>
                            <div className={styles.troubleshootTitle}>
                                <Info size={13} color="#71717a" />
                                <span>Solusi Rekomendasi:</span>
                            </div>
                            <ul className={styles.troubleshootList}>
                                <li>Buka tab <b>Konfigurasi &amp; Akun Channex</b> untuk memasukkan <b>API Key</b> atau mendaftarkan properti.</li>
                                <li>Gunakan mode <b>Sandbox Staging</b> untuk pengujian sebelum beralih ke <b>Production Hub</b>.</li>
                                <li>Anda juga dapat memetakan kamar &amp; tarif secara lokal di tab <b>Saluran &amp; Pemetaan</b>.</li>
                            </ul>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                            <button
                                type="button"
                                onClick={onGoToGolive}
                                className={styles.btnPrimary}
                            >
                                <KeyRound size={13} />
                                <span>Buka Konfigurasi API Channex</span>
                            </button>
                            <button
                                type="button"
                                onClick={onLoadIframeUrl}
                                disabled={loadingIframe}
                                className={styles.btnSecondary}
                            >
                                <RefreshCw size={13} className={loadingIframe ? "animate-spin" : ""} />
                                <span>Coba Lagi</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyCard}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#09090b" }}>
                            <Zap size={22} />
                        </div>
                        <span className={styles.emptyTitle}>Sesi Visual Mapping Extranet Siap</span>
                        <p className={styles.emptyDesc}>
                            Buat token akses sekali pakai (One-Time Token) yang aman untuk memuat konsol pemetaan visual Channex bagi properti <b>{hotelName || hotelCode || "aktif"}</b>.
                        </p>
                        <button
                            type="button"
                            onClick={onLoadIframeUrl}
                            className={styles.btnPrimary}
                        >
                            <Zap size={13} />
                            <span>Generate SSO Token &amp; Buka Mapping Hub</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
