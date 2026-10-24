"use client";

import React from "react";
import { TrendingUp, RefreshCw, Sliders, ShieldCheck, Save } from "lucide-react";
import type { DynamicPricingConfig } from "@/lib/channex/types";
import styles from "./ChannelDynamicPricingDesktopView.module.css";

interface ChannelDynamicPricingDesktopViewProps {
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

export const ChannelDynamicPricingDesktopView: React.FC<ChannelDynamicPricingDesktopViewProps> = ({
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
        <div className={styles.desktopContainer}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.titleRow}>
                        <h3 className={styles.title}>
                            <TrendingUp size={16} />
                            <span>Konektor Dynamic Pricing &amp; Revenue Management System (RMS)</span>
                        </h3>
                        {config.isEnabled ? (
                            <span className={styles.badgeActive}>● AKTIF ({config.provider.toUpperCase()})</span>
                        ) : (
                            <span className={styles.badgeInactive}>○ NONAKTIF</span>
                        )}
                    </div>
                    <p className={styles.desc}>
                        Menghubungkan sistem PMS langsung dengan platform RMS internasional (PriceLabs, RoomPriceGenie, Beyond Pricing) untuk kalkulasi tarif dinamis.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onTestRmsSync}
                    disabled={syncing || !config.isEnabled}
                    className={styles.btnSecondary}
                    title="Tarik rekomendasi tarif terbaru dari RMS"
                >
                    <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
                    <span>{syncing ? "Menyelaraskan..." : "Tarik Rekomendasi Tarif"}</span>
                </button>
            </div>

            {/* Guardrails Banner */}
            <div className={styles.banner}>
                <div className={styles.bannerIconBox}>
                    <ShieldCheck size={18} />
                </div>
                <div>
                    <b>Proteksi Batas Tarif Minimal &amp; Maksimal (Guardrails):</b>
                    <p style={{ margin: "2px 0 0 0", color: "#71717a" }}>
                        Untuk mencegah lonjakan tarif yang tidak disengaja atau penurunan harga ekstrem, sistem memberlakukan batas bawah (floor) dan batas atas (ceiling) sebelum tarif dipublikasikan ke OTA.
                    </p>
                </div>
            </div>

            {/* Configuration Form */}
            <form onSubmit={onSave} className={styles.formCard}>
                <div className={styles.cardHeader}>
                    <h4 className={styles.cardTitle}>
                        <Sliders size={15} />
                        <span>Konfigurasi Penyedia RMS &amp; Batas Pengaman Tarif</span>
                    </h4>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnPrimary}
                    >
                        <Save size={13} className={saving ? "animate-spin" : ""} />
                        <span>{saving ? "Menyimpan..." : "Simpan Konfigurasi RMS"}</span>
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Penyedia RMS (Dynamic Pricing Engine)</label>
                        <select
                            value={config.provider}
                            onChange={e => setConfig(prev => ({ ...prev, provider: e.target.value as any }))}
                            className={styles.select}
                        >
                            <option value="pricelabs">PriceLabs (Hotel &amp; Vacation Rental)</option>
                            <option value="roompricegenie">RoomPriceGenie (Boutique Hotel Specialist)</option>
                            <option value="beyond">Beyond Pricing (Dynamic Yield)</option>
                            <option value="custom">Master Yield Engine / Custom Webhook</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Status Koneksi Integrasi</label>
                        <select
                            value={config.isEnabled ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="false">Nonaktifkan Integrasi</option>
                            <option value="true">Aktifkan Sinkronisasi Otomatis</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>RMS API Key / Webhook Secret</label>
                        <input
                            type="password"
                            placeholder="Kredensial API dari dashboard RMS..."
                            value={config.apiKey || ""}
                            onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Digunakan untuk mengotentikasi pembaruan tarif masuk.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>RMS Property / Listing Identifier</label>
                        <input
                            type="text"
                            placeholder="Contoh: PL-HOTEL-88912"
                            value={config.propertyId || ""}
                            onChange={e => setConfig(prev => ({ ...prev, propertyId: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>ID Properti yang terdaftar di akun PriceLabs atau RoomPriceGenie Anda.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Batas Tarif Minimal (Rate Floor) ({symbol.trim()})
                        </label>
                        <input
                            type="number"
                            min={0}
                            step={currStep}
                            value={config.minRateGuardrail || ""}
                            onChange={e => setConfig(prev => ({ ...prev, minRateGuardrail: Number(e.target.value) || 0 }))}
                            className={`${styles.input} ${styles.numericInput}`}
                        />
                        <span className={styles.hint}>
                            Tarif kamar tidak akan pernah turun di bawah batas ini ({currencyCode}).
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Batas Tarif Maksimal (Rate Ceiling) ({symbol.trim()})
                        </label>
                        <input
                            type="number"
                            min={0}
                            step={currStep}
                            value={config.maxRateGuardrail || ""}
                            onChange={e => setConfig(prev => ({ ...prev, maxRateGuardrail: Number(e.target.value) || 0 }))}
                            className={`${styles.input} ${styles.numericInput}`}
                        />
                        <span className={styles.hint}>
                            Batas atas tarif di {currencyCode} ({symbol.trim()}) untuk mencegah overpricing saat peak season.
                        </span>
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                        <label className={styles.label}>Otomatisasi Publikasi ke Seluruh Saluran OTA</label>
                        <select
                            value={config.autoPushToChannex ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, autoPushToChannex: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="true">Ya, Otomatis Publikasikan ke Seluruh OTA saat Rekomendasi Diterima</option>
                            <option value="false">Tinjau Manual Terlebih Dahulu di Matriks Tarif</option>
                        </select>
                    </div>
                </div>
            </form>
        </div>
    );
};
