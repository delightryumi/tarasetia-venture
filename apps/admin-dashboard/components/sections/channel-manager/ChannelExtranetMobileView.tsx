"use client";

import React, { useState } from "react";
import {
    LayoutGrid,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    ShieldAlert,
    AlertCircle,
    AlertTriangle,
    KeyRound,
    Zap,
    ChevronRight,
    SlidersHorizontal,
    Eye,
    EyeOff
} from "lucide-react";
import styles from "./ChannelExtranetMobileView.module.css";

interface ChannelExtranetMobileViewProps {
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

export function ChannelExtranetMobileView({
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
}: ChannelExtranetMobileViewProps) {
    const [showInlinePreview, setShowInlinePreview] = useState<boolean>(false);

    return (
        <div className={styles.mobileContainer}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleRow}>
                    <div className={styles.title}>
                        <LayoutGrid size={15} color="#09090b" />
                        <span>Channex Mapping Hub</span>
                    </div>
                    <span className={channexEnv === "production" ? styles.envBadgeProd : styles.envBadgeStaging}>
                        {channexEnv === "production" ? "PROD" : "STAGING"}
                    </span>
                </div>

                <span className={styles.desc}>
                    Konsol pemetaan visual resmi Channex untuk aktivasi OTA dan rate plan.
                </span>

                {/* Status Row */}
                <div className={styles.statusRow}>
                    {loadingIframe ? (
                        <span className={`${styles.statusIndicator} ${styles.statusPending}`}>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Inisialisasi SSO...</span>
                        </span>
                    ) : iframeUrl ? (
                        <span className={`${styles.statusIndicator} ${styles.statusActive}`}>
                            <span className={styles.statusPulse} />
                            <ShieldCheck size={13} />
                            <span>SSO Terautentikasi</span>
                        </span>
                    ) : authError ? (
                        <span className={`${styles.statusIndicator} ${styles.statusError}`}>
                            <AlertCircle size={13} />
                            <span>Autentikasi Kendala</span>
                        </span>
                    ) : (
                        <span className={`${styles.statusIndicator} ${styles.statusPending}`}>
                            <ShieldAlert size={13} />
                            <span>Belum Terhubung</span>
                        </span>
                    )}

                    <span className={styles.propertyPill}>
                        Hotel: <b>{hotelCode || "Default"}</b>
                    </span>
                </div>
            </div>

            {/* Error Card Mobile */}
            {authError && (
                <div className={styles.errorCard}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#b45309" }}>
                        <AlertTriangle size={18} />
                        <span className={styles.errorTitle}>Koneksi Extranet Terkendala</span>
                    </div>
                    <div className={styles.errorMsg}>{authError}</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            type="button"
                            onClick={onGoToGolive}
                            className={styles.btnSecondaryAction}
                            style={{ flex: 1 }}
                        >
                            <KeyRound size={13} />
                            <span>Kredensial</span>
                        </button>
                        <button
                            type="button"
                            onClick={onLoadIframeUrl}
                            disabled={loadingIframe}
                            className={styles.btnSecondaryAction}
                            style={{ flex: 1 }}
                        >
                            <RefreshCw size={13} className={loadingIframe ? "animate-spin" : ""} />
                            <span>Coba Lagi</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Primary Action Button */}
            {iframeUrl ? (
                <div className={styles.actionsStack}>
                    <a
                        href={iframeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.btnPrimaryLarge}
                    >
                        <ExternalLink size={15} />
                        <span>Buka Konsol di Tab Baru</span>
                    </a>

                    <button
                        type="button"
                        onClick={onLoadIframeUrl}
                        disabled={loadingIframe}
                        className={styles.btnSecondaryAction}
                    >
                        <RefreshCw size={13} className={loadingIframe ? "animate-spin" : ""} />
                        <span>{loadingIframe ? "Menyinkronkan..." : "Refresh Sesi Token"}</span>
                    </button>
                </div>
            ) : !authError && (
                <div className={styles.actionsStack}>
                    <button
                        type="button"
                        onClick={onLoadIframeUrl}
                        disabled={loadingIframe}
                        className={styles.btnPrimaryLarge}
                    >
                        <Zap size={15} />
                        <span>{loadingIframe ? "Menginisialisasi SSO..." : "Generate SSO Token"}</span>
                    </button>
                </div>
            )}

            {/* Optional Embedded Mobile Preview */}
            {iframeUrl && (
                <div className={styles.previewSection}>
                    <div className={styles.previewHeader}>
                        <span className={styles.previewTitle}>Preview Extranet Frame</span>
                        <button
                            type="button"
                            onClick={() => setShowInlinePreview(prev => !prev)}
                            className={styles.toggleBtn}
                        >
                            {showInlinePreview ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <EyeOff size={13} /> Sembunyikan
                                </span>
                            ) : (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <Eye size={13} /> Buka Preview HP
                                </span>
                            )}
                        </button>
                    </div>

                    {showInlinePreview && (
                        <>
                            <div className={styles.noticeBar}>
                                Tips: Geser ke samping jika tabel mapping melebihi lebar layar ponsel Anda.
                            </div>
                            <div className={styles.iframeWrapper}>
                                <iframe
                                    src={iframeUrl}
                                    onLoad={onIframeLoad}
                                    className={styles.iframe}
                                    title="Mobile Channel Mapping Hub"
                                    allow="clipboard-read; clipboard-write"
                                />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Quick Routing Cards */}
            <div className={styles.routingGrid}>
                <div
                    onClick={onGoToMapping}
                    className={styles.routeCard}
                    role="button"
                    tabIndex={0}
                >
                    <div className={styles.routeCardLeft}>
                        <span className={styles.routeTitle}>Pemetaan Saluran Lokal</span>
                        <span className={styles.routeDesc}>
                            Atur kamar dan rate plan langsung di dashboard Setara.
                        </span>
                    </div>
                    <ChevronRight size={16} color="#71717a" />
                </div>

                <div
                    onClick={onGoToGolive}
                    className={styles.routeCard}
                    role="button"
                    tabIndex={0}
                >
                    <div className={styles.routeCardLeft}>
                        <span className={styles.routeTitle}>Kredensial API Channex</span>
                        <span className={styles.routeDesc}>
                            Cek status API key, webhook, dan ID properti resmi.
                        </span>
                    </div>
                    <ChevronRight size={16} color="#71717a" />
                </div>
            </div>
        </div>
    );
}
