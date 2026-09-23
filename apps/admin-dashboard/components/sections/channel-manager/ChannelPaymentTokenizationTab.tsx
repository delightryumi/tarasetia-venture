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
        stripePublishableKey: "",
        accountStatus: "NOT_CONFIGURED",
        autoPreAuthOnBooking: true,
        autoCaptureOnCheckin: false,
        pciComplianceLevel: "PCI-DSS Level 1 (Encrypted Vault)",
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
                        setConfig({
                            isEnabled: !!payCfg.isEnabled,
                            stripePublishableKey: payCfg.stripePublishableKey || "",
                            accountStatus: payCfg.stripePublishableKey ? "CONNECTED" : "NOT_CONFIGURED",
                            autoPreAuthOnBooking: payCfg.autoPreAuthOnBooking ?? true,
                            autoCaptureOnCheckin: !!payCfg.autoCaptureOnCheckin,
                            pciComplianceLevel: payCfg.pciComplianceLevel || "PCI-DSS Level 1 (Encrypted Vault)",
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
            const isConnected = !!config.stripePublishableKey && config.isEnabled;
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
            toast.success("Konfigurasi Pembayaran & Vault Tokenisasi Kartu berhasil disimpan!");
        } catch (err: any) {
            console.error("Error saving Payment Tokenization config:", err);
            toast.error("Gagal menyimpan konfigurasi tokenisasi.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                <span>Memuat pengaturan Vault Tokenisasi PCI...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <CreditCard size={18} color="#1e3a2f" />
                        <span>Stripe Tokenization &amp; PCI-DSS Card Vault</span>
                        {config.accountStatus === "CONNECTED" ? (
                            <span className={styles.badgeConnected}>● STRIPE VAULT TERHUBUNG</span>
                        ) : (
                            <span className={styles.badgeNotConfigured}>○ BELUM TERKONFIGURASI</span>
                        )}
                    </div>
                    <span className={styles.desc}>
                        Enkripsi nomor kartu kredit tamu OTA &amp; Virtual Credit Card (VCC) secara end-to-end tanpa pernah menyentuh server lokal hotel demi memenuhi standar audit kepatuhan PCI-DSS Level 1.
                    </span>
                </div>
            </div>

            {/* PCI Security Badge Banner */}
            <div className={styles.pciBanner}>
                <ShieldCheck size={24} style={{ flexShrink: 0, marginTop: "2px", color: "#166534" }} />
                <div>
                    <b>Jaminan Keamanan PCI DSS Level 1 Certified:</b>
                    <p style={{ margin: "4px 0 0 0" }}>
                        Saat reservasi dengan kartu kredit diterima dari OTA, nomor kartu mentah langsung diamankan dalam brankas PCI Vault berstandar enkripsi perbankan. Sistem hotel hanya memproses token aman (Stripe Token `pm_...` atau `tok_...`) untuk penagihan, sehingga hotel terbebas dari risiko kebocoran data kartu (0% PCI Liability).
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        <Lock size={16} color="#1e3a2f" />
                        <span>Kredensial Gateway Pembayaran &amp; Kebijakan Penagihan Otomatis</span>
                    </span>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnPrimary}
                    >
                        <Save size={14} />
                        <span>{saving ? "Menyimpan..." : "Simpan Pengaturan Pembayaran"}</span>
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Aktifkan Vault Tokenisasi Stripe</label>
                        <select
                            value={config.isEnabled ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="false">Nonaktifkan Tokenisasi Otomatis</option>
                            <option value="true">Aktifkan Brankas Tokenisasi Stripe</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Stripe Publishable Key (Client Token)</label>
                        <input
                            type="text"
                            placeholder="pk_live_... atau pk_test_..."
                            value={config.stripePublishableKey || ""}
                            onChange={e => setConfig(prev => ({ ...prev, stripePublishableKey: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Kunci publik Stripe hotel untuk tokenisasi elemen kartu frontend.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Otomatis Pre-Authorise Saldo saat Reservasi Diterima</label>
                        <select
                            value={config.autoPreAuthOnBooking ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, autoPreAuthOnBooking: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="true">Ya, Cek Validitas Saldo Kartu Tamu Langsung (Pre-Auth 1 Night)</option>
                            <option value="false">Jangan Pre-Auth, Simpan Token Kartu Saja</option>
                        </select>
                        <span className={styles.hint}>Mencegah reservasi palsu atau kartu tanpa saldo dari OTA.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Otomatis Potong Saldo (Capture) Saat Tamu Check-In</label>
                        <select
                            value={config.autoCaptureOnCheckin ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, autoCaptureOnCheckin: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="true">Otomatis Eksekusi Tagihan Penuh di Front Office saat Check-In</option>
                            <option value="false">Tagih Manual Lewat Terminal Kasir PMS</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Status Sertifikasi PCI</label>
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
