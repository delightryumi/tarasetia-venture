"use client";

import React from "react";
import { TrendingUp, RefreshCw, Sliders, ShieldCheck, Save, Key } from "lucide-react";
import type { DynamicPricingConfig } from "@/lib/channex/types";
import styles from "./ChannelDynamicPricingMobileView.module.css";

interface ChannelDynamicPricingMobileViewProps {
    hotelCode: string;
    config: DynamicPricingConfig;
    setConfig: React.Dispatch<React.SetStateAction<DynamicPricingConfig>>;
    saving: boolean;
    syncing: boolean;
    currencyCode: string;
    symbol: string;
    currStep?: number;
    onSave: (e: React.FormEvent) => Promise<void>;
    onTestRmsSync: () => Promise<void>;
}

export const ChannelDynamicPricingMobileView: React.FC<ChannelDynamicPricingMobileViewProps> = ({
    hotelCode,
    config,
    setConfig,
    saving,
    syncing,
    currencyCode,
    symbol,
    currStep = 10000,
    onSave,
    onTestRmsSync
}) => {
    return (
        <form onSubmit={onSave} className={styles.mobileContainer}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.topBarHeader}>
                    <h3 className={styles.title}>
                        <TrendingUp size={15} />
                        <span>Dynamic Pricing RMS</span>
                    </h3>
                    {config.isEnabled ? (
                        <span className={styles.badgeActive}>● AKTIF</span>
                    ) : (
                        <span className={styles.badgeInactive}>○ NONAKTIF</span>
                    )}
                </div>
                <p className={styles.desc}>
                    Koneksi PMS langsung ke platform RMS global (PriceLabs, RoomPriceGenie, Beyond Pricing).
                </p>
                <button
                    type="button"
                    onClick={onTestRmsSync}
                    disabled={syncing || !config.isEnabled}
                    className={styles.btnSyncMobile}
                >
                    <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                    <span>{syncing ? "Menyelaraskan..." : "Tarik Rekomendasi Tarif"}</span>
                </button>
            </div>

            {/* Guardrails Notice */}
            <div className={styles.bannerCard}>
                <div className={styles.bannerIcon}>
                    <ShieldCheck size={16} />
                </div>
                <p className={styles.bannerText}>
                    <b>Rate Guardrails:</b> Sistem memproteksi tarif batas bawah dan batas atas agar harga di OTA selalu berada dalam batas aman margin hotel.
                </p>
            </div>

            {/* Provider Section */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>
                    <Sliders size={13} />
                    <span>Penyedia &amp; Status Koneksi</span>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Penyedia RMS</label>
                    <select
                        value={config.provider}
                        onChange={e => setConfig(prev => ({ ...prev, provider: e.target.value as any }))}
                        className={styles.select}
                    >
                        <option value="pricelabs">PriceLabs</option>
                        <option value="roompricegenie">RoomPriceGenie</option>
                        <option value="beyond">Beyond Pricing</option>
                        <option value="custom">Custom Webhook</option>
                    </select>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Status Integrasi</label>
                    <select
                        value={config.isEnabled ? "true" : "false"}
                        onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                        className={styles.select}
                    >
                        <option value="false">Nonaktifkan Integrasi</option>
                        <option value="true">Aktifkan Sinkronisasi Otomatis</option>
                    </select>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>RMS API Key / Secret</label>
                    <input
                        type="password"
                        placeholder="Kredensial API..."
                        value={config.apiKey || ""}
                        onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value.trim() }))}
                        className={styles.input}
                    />
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Listing / Property ID</label>
                    <input
                        type="text"
                        placeholder="Contoh: PL-HOTEL-88912"
                        value={config.propertyId || ""}
                        onChange={e => setConfig(prev => ({ ...prev, propertyId: e.target.value.trim() }))}
                        className={styles.input}
                    />
                </div>
            </div>

            {/* Rate Guardrails Section */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>
                    <Key size={13} />
                    <span>Batas Pengaman Tarif ({currencyCode})</span>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Batas Bawah (Rate Floor) ({symbol.trim()})</label>
                    <input
                        type="number"
                        min={0}
                        step={currStep}
                        value={config.minRateGuardrail || ""}
                        onChange={e => setConfig(prev => ({ ...prev, minRateGuardrail: Number(e.target.value) || 0 }))}
                        className={`${styles.input} ${styles.numericInput}`}
                    />
                    <span className={styles.hint}>Tarif kamar tidak akan pernah lebih rendah dari nilai ini.</span>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Batas Atas (Rate Ceiling) ({symbol.trim()})</label>
                    <input
                        type="number"
                        min={0}
                        step={currStep}
                        value={config.maxRateGuardrail || ""}
                        onChange={e => setConfig(prev => ({ ...prev, maxRateGuardrail: Number(e.target.value) || 0 }))}
                        className={`${styles.input} ${styles.numericInput}`}
                    />
                    <span className={styles.hint}>Batas harga tertinggi yang diizinkan untuk mencegah overpricing.</span>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Otomatisasi Publikasi OTA</label>
                    <select
                        value={config.autoPushToChannex ? "true" : "false"}
                        onChange={e => setConfig(prev => ({ ...prev, autoPushToChannex: e.target.value === "true" }))}
                        className={styles.select}
                    >
                        <option value="true">Otomatis Publikasikan ke OTA</option>
                        <option value="false">Tinjau Manual di Matriks</option>
                    </select>
                </div>
            </div>

            {/* Sticky Save Bar */}
            <div className={styles.stickyBottomBar}>
                <span className={styles.stickyNotice}>Properti: <b>{hotelCode}</b></span>
                <button
                    type="submit"
                    disabled={saving}
                    className={styles.stickySaveBtn}
                >
                    <Save size={13} className={saving ? "animate-spin" : ""} />
                    <span>{saving ? "Menyimpan..." : "Simpan RMS"}</span>
                </button>
            </div>
        </form>
    );
};
