"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Shield, CheckCircle2, AlertTriangle, Save, RefreshCw, Lock, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StripeTokenizationConfig } from "@/lib/channex/types";
import styles from "./ChannelPaymentTokenization.module.css";

interface Props {
    hotelCode: string;
}

export function ChannelPaymentTokenizationTab({ hotelCode }: Props) {
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

    const [config, setConfig] = useState<StripeTokenizationConfig>({
        isEnabled: false,
        provider: "vaultera",
        stripePublishableKey: "",
        vaultApiKey: "",
        vaultEndpoint: "https://proxy.vaultera.com/v1/tokens",
        tokenizationMode: "headless_proxy",
        accountStatus: "NOT_CONFIGURED",
        autoPreAuthOnBooking: true,
        autoCaptureOnCheckin: false,
        pciComplianceLevel: "PCI-DSS Level 1 (Encrypted Token Vault)",
        lastTokenizedAt: undefined
    });

    useEffect(() => {
        if (!hotelCode) return;

        const loadConfig = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "hotels", hotelCode);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const payCfg = data?.channelManager?.stripeTokenizationConfig;
                    if (payCfg) {
                        const hasKeys = Boolean(payCfg.stripePublishableKey || payCfg.vaultApiKey);
                        setConfig({
                            isEnabled: !!payCfg.isEnabled,
                            provider: payCfg.provider || (payCfg.stripePublishableKey ? "stripe" : "vaultera"),
                            stripePublishableKey: payCfg.stripePublishableKey || "",
                            vaultApiKey: payCfg.vaultApiKey || "",
                            vaultEndpoint: payCfg.vaultEndpoint || "https://proxy.vaultera.com/v1/tokens",
                            tokenizationMode: payCfg.tokenizationMode || "headless_proxy",
                            accountStatus: hasKeys && payCfg.isEnabled ? "CONNECTED" : "NOT_CONFIGURED",
                            autoPreAuthOnBooking: payCfg.autoPreAuthOnBooking ?? true,
                            autoCaptureOnCheckin: !!payCfg.autoCaptureOnCheckin,
                            pciComplianceLevel: payCfg.pciComplianceLevel || "PCI-DSS Level 1 (Encrypted Token Vault)",
                            lastTokenizedAt: payCfg.lastTokenizedAt
                        });
                    }
                }
            } catch (err: any) {
                console.error("Error loading Payment Tokenization config:", err);
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [hotelCode]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hotelCode) return;

        setSaving(true);
        try {
            const hasKeys = Boolean(config.stripePublishableKey || config.vaultApiKey);
            const isConnected = hasKeys && config.isEnabled;
            const newStatus: "CONNECTED" | "NOT_CONFIGURED" = isConnected ? "CONNECTED" : "NOT_CONFIGURED";
            const updatedConfig: StripeTokenizationConfig = {
                ...config,
                accountStatus: newStatus
            };

            const docRef = doc(db, "hotels", hotelCode);
            await updateDoc(docRef, {
                "channelManager.stripeTokenizationConfig": updatedConfig
            });

            setConfig(updatedConfig);
            toast.success("PCI Tokenization Vault configuration saved successfully.");
        } catch (err: any) {
            console.error("Error saving Payment Tokenization config:", err);
            toast.error("Failed to save tokenization configuration.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                <span>Loading PCI Tokenization Vault configuration...</span>
            </div>
        );
    }

    const providerNames: Record<string, string> = {
        vaultera: "Vaultera PCI Proxy (Channex Official Partner)",
        pci_booking: "PCI Booking Vault (Channex Integrated)",
        tokenex: "Tokenex Cloud PCI Vault",
        stripe: "Stripe Elements Vault"
    };

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <CreditCard size={18} color="#09090b" />
                        <span>PCI-DSS Card Tokenization &amp; Proxy Vault</span>
                        {config.accountStatus === "CONNECTED" ? (
                            <span className={styles.badgeConnected}>● VAULT CONNECTED ({config.provider?.toUpperCase()})</span>
                        ) : (
                            <span className={styles.badgeNotConfigured}>○ NOT CONFIGURED</span>
                        )}
                    </div>
                    <span className={styles.desc}>
                        End-to-end encryption for OTA guest credit cards and Virtual Credit Cards (VCC) complying with Channex PCI Guidelines and PCI-DSS Level 1 standards without storing raw PAN in local premises.
                    </span>
                </div>
            </div>

            {/* PCI Security Badge Banner */}
            <div className={styles.pciBanner}>
                <ShieldCheck size={24} style={{ flexShrink: 0, marginTop: "2px", color: "#2563eb" }} />
                <div>
                    <b>Panduan Kepatuhan PCI-DSS Channex (Official Standard):</b>
                    <div style={{ margin: "6px 0 0 0", fontSize: "12px", lineHeight: "1.6", color: "#334155" }}>
                        <div><b>1. Virtual Credit Cards (OTA VCC):</b> Data saldo, tanggal aktif, dan CVV dari Booking.com/Agoda diekstrak langsung melalui <code>guarantee.meta</code> di Tara tanpa memicu beban audit penyimpanan nomor kartu mentah.</div>
                        <div style={{ marginTop: 4 }}><b>2. Kartu Fisik Tamu Non-VCC:</b> Sesuai aturan Channex, nomor kartu fisik tamu tidak diserahkan dalam bentuk teks biasa. Transaksi didelegasikan melalui Proxy Token eksternal di bawah (Vaultera / PCI Booking / Tokenex), sehingga sistem Tara memenuhi standar <b>PCI SAQ-A</b> secara mutlak.</div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        <Lock size={16} color="#09090b" />
                        <span>PCI Vault Provider &amp; Tokenization Credentials</span>
                    </span>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnPrimary}
                    >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Vault Settings"}</span>
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Aktifkan PCI Tokenization Vault</label>
                        <select
                            value={config.isEnabled ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="false">Nonaktifkan Tokenization Vault</option>
                            <option value="true">Aktifkan PCI Vault (Disarankan untuk OTA Card Guarantee)</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Penyedia PCI Tokenization Proxy (Channex Partner)</label>
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
                            <option value="vaultera">Vaultera PCI Proxy (Channex Official Partner)</option>
                            <option value="pci_booking">PCI Booking Vault (Channex Integrated)</option>
                            <option value="tokenex">Tokenex Cloud PCI Vault</option>
                            <option value="stripe">Stripe Elements Vault</option>
                        </select>
                        <span className={styles.hint}>Layanan vault terakreditasi PCI Level 1 yang memproses token kartu tanpa risiko liabilitas merchant.</span>
                    </div>

                    {config.provider === "stripe" ? (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Stripe Publishable Key (Client Token)</label>
                            <input
                                type="text"
                                placeholder="pk_live_... or pk_test_..."
                                value={config.stripePublishableKey || ""}
                                onChange={e => setConfig(prev => ({ ...prev, stripePublishableKey: e.target.value.trim() }))}
                                className={styles.input}
                            />
                            <span className={styles.hint}>Kunci publik Stripe hotel untuk tokenisasi elemen pembayaran frontend.</span>
                        </div>
                    ) : (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Vault API Key / Merchant Token</label>
                                <input
                                    type="password"
                                    placeholder="Masukkan Vault Client Key..."
                                    value={config.vaultApiKey || ""}
                                    onChange={e => setConfig(prev => ({ ...prev, vaultApiKey: e.target.value.trim() }))}
                                    className={styles.input}
                                />
                                <span className={styles.hint}>Kredensial API dari dashboard {providerNames[config.provider || "vaultera"]}.</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>PCI Proxy Endpoint URL</label>
                                <input
                                    type="url"
                                    placeholder="https://proxy.vaultera.com/v1/tokens"
                                    value={config.vaultEndpoint || ""}
                                    onChange={e => setConfig(prev => ({ ...prev, vaultEndpoint: e.target.value.trim() }))}
                                    className={styles.input}
                                />
                                <span className={styles.hint}>URL proxy gateway resmi untuk pertukaran token tokenized cardholder.</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Metode Tokenisasi Kartu</label>
                                <select
                                    value={config.tokenizationMode || "headless_proxy"}
                                    onChange={e => setConfig(prev => ({ ...prev, tokenizationMode: e.target.value as any }))}
                                    className={styles.select}
                                >
                                    <option value="headless_proxy">Headless Token Proxy (Channex Direct API)</option>
                                    <option value="hosted_iframe">Hosted IFrame Container (PCI SAQ-A)</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Pre-Authorization Otomatis saat Booking Masuk</label>
                        <select
                            value={config.autoPreAuthOnBooking ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, autoPreAuthOnBooking: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="true">Ya, Validasi Saldo Kartu Tamu (Pre-Auth Malam Pertama)</option>
                            <option value="false">Tidak, Simpan Token Kartu Saja</option>
                        </select>
                        <span className={styles.hint}>Mencegah reservasi kartu palsu atau tidak bersaldo dari kanal OTA.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Penyelesaian Tagihan (Capture) saat Check-In</label>
                        <select
                            value={config.autoCaptureOnCheckin ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, autoCaptureOnCheckin: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="true">Otomatis Eksekusi Tagihan Kamar saat Check-In</option>
                            <option value="false">Selesaikan Manual via Terminal Kasir Front Desk</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Level Sertifikasi Kepatuhan PCI</label>
                        <input
                            type="text"
                            disabled
                            value={config.pciComplianceLevel}
                            className={styles.input}
                            style={{ background: "#f8fafc", color: "#64748b" }}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}

