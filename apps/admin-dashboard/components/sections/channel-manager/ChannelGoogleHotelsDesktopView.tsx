"use client";

import React from "react";
import { Globe, CheckCircle2, AlertCircle, Save, RefreshCw, ShieldCheck, Check, AlertTriangle } from "lucide-react";
import { GoogleHotelConfig } from "@/lib/channex/types";
import { SUPPORTED_CURRENCIES } from "@/lib/currency-utils";
import styles from "./ChannelGoogleHotelsDesktopView.module.css";

export interface ReadinessItem {
    id: string;
    label: string;
    description: string;
    isComplete: boolean;
    hint: string;
}

interface ChannelGoogleHotelsDesktopViewProps {
    config: GoogleHotelConfig;
    setConfig: React.Dispatch<React.SetStateAction<GoogleHotelConfig>>;
    readinessItems: ReadinessItem[];
    saving: boolean;
    syncing: boolean;
    onSave: (e: React.FormEvent) => void;
    onSyncFeed: () => void;
}

export function ChannelGoogleHotelsDesktopView({
    config,
    setConfig,
    readinessItems,
    saving,
    syncing,
    onSave,
    onSyncFeed
}: ChannelGoogleHotelsDesktopViewProps) {
    const completedReadiness = readinessItems.filter(r => r.isComplete).length;
    const readinessPercentage = Math.round((completedReadiness / Math.max(1, readinessItems.length)) * 100);

    return (
        <div className={styles.desktopContainer}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <Globe size={16} color="#09090b" />
                        <span>Google Hotel Search &amp; Free Booking Links (Metasearch Direct)</span>
                        {config.status === "ACTIVE" ? (
                            <span className={styles.statusBadgeActive}>LIVE GOOGLE LINKS</span>
                        ) : config.status === "PENDING" ? (
                            <span className={styles.statusBadgePending}>PENDING HOTEL CENTER ID</span>
                        ) : (
                            <span className={styles.statusBadgeDisconnected}>INACTIVE</span>
                        )}
                    </div>
                    <span className={styles.desc}>
                        Direct metasearch integration with Google Hotel Ads and Free Booking Links. Direct zero-commission bookings routed to My Tara engine.
                    </span>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={onSyncFeed}
                        disabled={syncing || !config.isEnabled}
                        className={styles.btnSecondary}
                        title="Synchronize ARI Feed and Room Metadata to Google Hotel Center"
                    >
                        <RefreshCw size={13} className={syncing ? "animate-spin" : ""} color="#09090b" />
                        <span>{syncing ? "Pushing Feed..." : "Sync ARI Feed to Google"}</span>
                    </button>
                </div>
            </div>

            {/* Metric Strip */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Google Hotel Center</span>
                    <span className={styles.statValue} style={{ fontSize: "15px", color: config.isEnabled ? "#2563eb" : "#71717a" }}>
                        {config.isEnabled ? (config.googleHotelCenterId ? "Verified" : "Pending ID") : "Disconnected"}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Direct Click-Through</span>
                    <span className={styles.statValue}>
                        {Number(config.totalDirectClicks || 0).toLocaleString()}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Rate Tax Policy</span>
                    <span className={styles.statValue} style={{ fontSize: "14px" }}>
                        {config.taxPolicy === "inclusive" ? "Gross (Tax Inclusive)" : "Net Rate (Exclusive)"}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Last ARI Feed Sync</span>
                    <span className={styles.statValue} style={{ fontSize: "13px", color: "#71717a" }}>
                        {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString("en-US") : "Never"}
                    </span>
                </div>
            </div>

            {/* 10-Point Pre-Flight Readiness Checklist */}
            <div className={styles.checklistCard}>
                <div className={styles.checklistHeader}>
                    <div className={styles.checklistTitle}>
                        <ShieldCheck size={16} color="#09090b" />
                        <span>10-Point Google Hotel Content Readiness Audit</span>
                    </div>
                    <span className={`${styles.readinessScoreBadge} ${completedReadiness >= 8 ? styles.scoreReady : styles.scoreWarning}`}>
                        {completedReadiness >= 8 ? <Check size={13} /> : <AlertTriangle size={13} />}
                        <span>{completedReadiness}/10 Data Complete ({readinessPercentage}%)</span>
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

                <div className={styles.checklistGrid}>
                    {readinessItems.map(item => (
                        <div key={item.id} className={styles.checklistItem}>
                            {item.isComplete ? (
                                <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                            ) : (
                                <AlertCircle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
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

            {/* Information Banner */}
            <div className={styles.infoBanner}>
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#09090b" }} />
                <div>
                    <b>Benefits of Google Free Booking Links:</b>
                    <p style={{ margin: "3px 0 0 0" }}>
                        Your hotel listing will appear on Google Hotel Search labeled with an official site link badge. Travelers clicking the link are routed straight to your My Tara direct booking engine with real-time rates and live room availability.
                    </p>
                </div>
            </div>

            {/* Configuration Form Card */}
            <form onSubmit={onSave} className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        Google Hotel Center Integration Settings
                    </span>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnPrimary}
                    >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Settings"}</span>
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Enable Google Hotel Search</label>
                        <select
                            value={config.isEnabled ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="false">Disable Channel</option>
                            <option value="true">Enable Google Free Booking Links &amp; ARI</option>
                        </select>
                        <span className={styles.hint}>Broadcasts room availability and rates to the global Google travel index.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Google Hotel Center Account ID</label>
                        <input
                            type="text"
                            placeholder="e.g. 1234567890 (Optional if automatically managed)"
                            value={config.googleHotelCenterId || ""}
                            onChange={e => setConfig(prev => ({ ...prev, googleHotelCenterId: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Specify your Google Hotel Center account ID if managed independently.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Direct Engine Landing Page URL Format</label>
                        <input
                            type="url"
                            placeholder="https://setara.my.id/booking?hotel=..."
                            value={config.landingPageUrl || ""}
                            onChange={e => setConfig(prev => ({ ...prev, landingPageUrl: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Target URL where guests land upon clicking the Google direct booking link.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Google Rate Display Tax Policy</label>
                        <select
                            value={config.taxPolicy}
                            onChange={e => setConfig(prev => ({ ...prev, taxPolicy: e.target.value as any }))}
                            className={styles.select}
                        >
                            <option value="inclusive">Tax &amp; Service Inclusive (All-Inclusive Pricing)</option>
                            <option value="exclusive">Tax Exclusive (Net Room Rate)</option>
                        </select>
                        <span className={styles.hint}>Complies with Google Hotel Search pricing display standards.</span>
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                        <label className={styles.label}>Transmission Currency</label>
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
                        <span className={styles.hint}>Feed transmission currency. Aligns with proper base currency configuration.</span>
                    </div>
                </div>
            </form>
        </div>
    );
}
