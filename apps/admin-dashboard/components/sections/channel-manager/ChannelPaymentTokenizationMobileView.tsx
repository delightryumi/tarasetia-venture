"use client";

import React from "react";
import { CreditCard, Save, Lock, ShieldCheck } from "lucide-react";
import { StripeTokenizationConfig } from "@/lib/channex/types";
import styles from "./ChannelPaymentTokenizationMobileView.module.css";

interface ChannelPaymentTokenizationMobileViewProps {
    config: StripeTokenizationConfig;
    setConfig: React.Dispatch<React.SetStateAction<StripeTokenizationConfig>>;
    saving: boolean;
    onSave: (e: React.FormEvent) => void;
    providerNames: Record<string, string>;
}

export function ChannelPaymentTokenizationMobileView({
    config,
    setConfig,
    saving,
    onSave,
    providerNames
}: ChannelPaymentTokenizationMobileViewProps) {
    return (
        <div className={styles.mobileContainer}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <CreditCard size={15} color="#09090b" />
                        <span>Card Tokenization Vault</span>
                    </div>
                    <span className={styles.desc}>
                        End-to-end PCI-DSS Level 1 encryption for OTA guest cards and VCC.
                    </span>
                </div>

                {config.accountStatus === "CONNECTED" ? (
                    <span className={styles.badgeConnected}>
                        CONNECTED ({config.provider?.toUpperCase()})
                    </span>
                ) : (
                    <span className={styles.badgeNotConfigured}>NOT CONFIGURED</span>
                )}
            </div>

            {/* PCI Security Badge Banner */}
            <div className={styles.pciBanner}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <ShieldCheck size={16} color="#09090b" />
                    <b>PCI-DSS Channex Standard</b>
                </div>
                <span>
                    Tara mematuhi standar PCI SAQ-A. Kartu tamu non-VCC diproses via secure token proxy tanpa menyimpan nomor kartu fisik di server lokal.
                </span>
            </div>

            {/* Form Mobile */}
            <form id="pci-token-mobile-form" onSubmit={onSave} className={styles.card}>
                <span className={styles.cardTitle}>
                    <Lock size={14} color="#09090b" />
                    <span>Vault Settings</span>
                </span>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Aktifkan PCI Vault</label>
                    <select
                        value={config.isEnabled ? "true" : "false"}
                        onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                        className={styles.select}
                    >
                        <option value="false">Nonaktifkan Tokenization Vault</option>
                        <option value="true">Aktifkan PCI Vault (Disarankan)</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Penyedia Proxy Token</label>
                    <select
                        value={config.provider || "vaultera"}
                        onChange={e => {
                            const p = e.target.value as any;
                            setConfig(prev => ({
                                ...prev,
                                provider: p,
                                vaultEndpoint: p === "vaultera" 
                                    ? "https://proxy.vaultera.com/v1/tokens" 
                                    : p === "pci_booking" 
                                        ? "https://service.pcibooking.net/api/v1" 
                                        : p === "tokenex" 
                                            ? "https://api.tokenex.com/v2" 
                                            : "https://api.stripe.com/v1/tokens"
                            }));
                        }}
                        className={styles.select}
                    >
                        <option value="vaultera">Vaultera PCI Proxy</option>
                        <option value="pci_booking">PCI Booking Vault</option>
                        <option value="tokenex">Tokenex Cloud Vault</option>
                        <option value="stripe">Stripe Elements Vault</option>
                    </select>
                </div>

                {config.provider === "stripe" ? (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Stripe Publishable Key</label>
                        <input
                            type="text"
                            placeholder="pk_live_... or pk_test_..."
                            value={config.stripePublishableKey || ""}
                            onChange={e => setConfig(prev => ({ ...prev, stripePublishableKey: e.target.value.trim() }))}
                            className={styles.input}
                        />
                    </div>
                ) : (
                    <>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Vault API Key</label>
                            <input
                                type="password"
                                placeholder="Masukkan Client Key..."
                                value={config.vaultApiKey || ""}
                                onChange={e => setConfig(prev => ({ ...prev, vaultApiKey: e.target.value.trim() }))}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Proxy Endpoint URL</label>
                            <input
                                type="url"
                                placeholder="https://proxy.vaultera.com/v1/tokens"
                                value={config.vaultEndpoint || ""}
                                onChange={e => setConfig(prev => ({ ...prev, vaultEndpoint: e.target.value.trim() }))}
                                className={styles.input}
                            />
                        </div>
                    </>
                )}

                <div className={styles.formGroup}>
                    <label className={styles.label}>Pre-Auth Otomatis</label>
                    <select
                        value={config.autoPreAuthOnBooking ? "true" : "false"}
                        onChange={e => setConfig(prev => ({ ...prev, autoPreAuthOnBooking: e.target.value === "true" }))}
                        className={styles.select}
                    >
                        <option value="true">Ya, Pre-Auth Malam Pertama</option>
                        <option value="false">Tidak, Simpan Token Saja</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Auto Capture Check-In</label>
                    <select
                        value={config.autoCaptureOnCheckin ? "true" : "false"}
                        onChange={e => setConfig(prev => ({ ...prev, autoCaptureOnCheckin: e.target.value === "true" }))}
                        className={styles.select}
                    >
                        <option value="true">Otomatis saat Check-In</option>
                        <option value="false">Manual di Kasir</option>
                    </select>
                </div>
            </form>

            {/* Sticky Bottom Save Action Bar */}
            <div className={styles.stickyBottomBar}>
                <button
                    type="submit"
                    form="pci-token-mobile-form"
                    disabled={saving}
                    className={styles.btnPrimarySticky}
                >
                    <Save size={15} />
                    <span>{saving ? "Saving..." : "Save Vault Settings"}</span>
                </button>
            </div>
        </div>
    );
}
