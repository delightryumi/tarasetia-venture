"use client";

import React from "react";
import { Globe, CheckCircle2, AlertCircle, Save, RefreshCw, ShieldCheck, Check, AlertTriangle } from "lucide-react";
import { GoogleHotelConfig } from "@/lib/channex/types";
import { SUPPORTED_CURRENCIES } from "@/lib/currency-utils";
import { ReadinessItem } from "./ChannelGoogleHotelsDesktopView";
import styles from "./ChannelGoogleHotelsMobileView.module.css";

interface ChannelGoogleHotelsMobileViewProps {
    config: GoogleHotelConfig;
    setConfig: React.Dispatch<React.SetStateAction<GoogleHotelConfig>>;
    readinessItems: ReadinessItem[];
    saving: boolean;
    syncing: boolean;
    onSave: (e: React.FormEvent) => void;
    onSyncFeed: () => void;
}

export function ChannelGoogleHotelsMobileView({
    config,
    setConfig,
    readinessItems,
    saving,
    syncing,
    onSave,
    onSyncFeed
}: ChannelGoogleHotelsMobileViewProps) {
    const completedReadiness = readinessItems.filter(r => r.isComplete).length;
    const readinessPercentage = Math.round((completedReadiness / Math.max(1, readinessItems.length)) * 100);

    return (
        <div className={styles.mobileContainer}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <Globe size={15} color="#09090b" />
                        <span>Google Free Links</span>
                    </div>
                    <span className={styles.desc}>
                        Direct metasearch zero-commission bookings routed to My Tara engine.
                    </span>
                </div>

                <div className={styles.statusRow}>
                    {config.status === "ACTIVE" ? (
                        <span className={styles.statusBadgeActive}>LIVE LINKS</span>
                    ) : config.status === "PENDING" ? (
                        <span className={styles.statusBadgePending}>PENDING ID</span>
                    ) : (
                        <span className={styles.statusBadgeDisconnected}>INACTIVE</span>
                    )}

                    <button
                        type="button"
                        onClick={onSyncFeed}
                        disabled={syncing || !config.isEnabled}
                        className={styles.btnSecondary}
                    >
                        <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
                        <span>{syncing ? "Syncing..." : "Sync ARI"}</span>
                    </button>
                </div>
            </div>

            {/* Metrics 2x2 */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Status</span>
                    <span className={styles.statValue} style={{ fontSize: "13px", color: config.isEnabled ? "#2563eb" : "#71717a" }}>
                        {config.isEnabled ? (config.googleHotelCenterId ? "Verified" : "Pending ID") : "Disconnected"}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Direct Clicks</span>
                    <span className={styles.statValue}>
                        {Number(config.totalDirectClicks || 0).toLocaleString()}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Tax Policy</span>
                    <span className={styles.statValue} style={{ fontSize: "12px" }}>
                        {config.taxPolicy === "inclusive" ? "Gross (Inclusive)" : "Net (Exclusive)"}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Last Sync</span>
                    <span className={styles.statValue} style={{ fontSize: "11px", color: "#71717a" }}>
                        {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleDateString() : "Never"}
                    </span>
                </div>
            </div>

            {/* 10-Point Readiness */}
            <div className={styles.checklistCard}>
                <div className={styles.checklistHeader}>
                    <div className={styles.checklistTitle}>
                        <ShieldCheck size={15} color="#09090b" />
                        <span>Readiness Audit</span>
                    </div>
                    <span className={`${styles.readinessScoreBadge} ${completedReadiness >= 8 ? styles.scoreReady : styles.scoreWarning}`}>
                        {completedReadiness >= 8 ? <Check size={11} /> : <AlertTriangle size={11} />}
                        <span>{completedReadiness}/10 ({readinessPercentage}%)</span>
                    </span>
                </div>

                <div className={styles.progressBarContainer}>
                    <div
                        className={styles.progressBarFill}
                        style={{
                            width: `${readinessPercentage}%`,
                            backgroundColor: completedReadiness >= 8 ? "#10b981" : completedReadiness >= 5 ? "#f59e0b" : "#ef4444"
                        }}
                    />
                </div>

                <div className={styles.checklistStream}>
                    {readinessItems.map(item => (
                        <div key={item.id} className={styles.checklistItem}>
                            {item.isComplete ? (
                                <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                            ) : (
                                <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
                            )}
                            <div className={styles.itemContent}>
                                <span className={styles.itemLabel}>{item.label}</span>
                                <span className={styles.itemDesc}>{item.description}</span>
                                <span
                                    className={styles.itemHint}
                                    style={{ color: item.isComplete ? "#059669" : "#d97706" }}
                                >
                                    {item.hint}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Settings Mobile */}
            <form id="google-hotel-mobile-form" onSubmit={onSave} className={styles.card}>
                <span className={styles.cardTitle}>Integration Settings</span>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Google Hotel Search Status</label>
                    <select
                        value={config.isEnabled ? "true" : "false"}
                        onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                        className={styles.select}
                    >
                        <option value="false">Disable Channel</option>
                        <option value="true">Enable Free Booking Links &amp; ARI</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Hotel Center Account ID</label>
                    <input
                        type="text"
                        placeholder="e.g. 1234567890 (Optional)"
                        value={config.googleHotelCenterId || ""}
                        onChange={e => setConfig(prev => ({ ...prev, googleHotelCenterId: e.target.value.trim() }))}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Landing Page URL Format</label>
                    <input
                        type="url"
                        placeholder="https://setara.my.id/booking?hotel=..."
                        value={config.landingPageUrl || ""}
                        onChange={e => setConfig(prev => ({ ...prev, landingPageUrl: e.target.value.trim() }))}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Tax Policy</label>
                    <select
                        value={config.taxPolicy}
                        onChange={e => setConfig(prev => ({ ...prev, taxPolicy: e.target.value as any }))}
                        className={styles.select}
                    >
                        <option value="inclusive">Tax &amp; Service Inclusive</option>
                        <option value="exclusive">Tax Exclusive (Net Rate)</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Currency</label>
                    <select
                        value={config.currency}
                        onChange={e => setConfig(prev => ({ ...prev, currency: e.target.value }))}
                        className={styles.select}
                    >
                        {SUPPORTED_CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>
                                {c.flag} {c.code} : {c.name} ({c.symbol})
                            </option>
                        ))}
                    </select>
                </div>
            </form>

            {/* Sticky Bottom Save Action Bar */}
            <div className={styles.stickyBottomBar}>
                <button
                    type="submit"
                    form="google-hotel-mobile-form"
                    disabled={saving}
                    className={styles.btnPrimarySticky}
                >
                    <Save size={15} />
                    <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
                </button>
            </div>
        </div>
    );
}
