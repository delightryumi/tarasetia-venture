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
            toast.success("Payment Gateway & Tokenization Vault configuration saved successfully.");
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

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <CreditCard size={18} color="#1e3a2f" />
                        <span>Stripe Tokenization &amp; PCI-DSS Card Vault</span>
                        {config.accountStatus === "CONNECTED" ? (
                            <span className={styles.badgeConnected}>● STRIPE VAULT CONNECTED</span>
                        ) : (
                            <span className={styles.badgeNotConfigured}>○ NOT CONFIGURED</span>
                        )}
                    </div>
                    <span className={styles.desc}>
                        End-to-end encryption for OTA guest credit cards and Virtual Credit Cards (VCC) without storing raw cardholder data on local premises, maintaining PCI-DSS Level 1 compliance.
                    </span>
                </div>
            </div>

            {/* PCI Security Badge Banner */}
            <div className={styles.pciBanner}>
                <ShieldCheck size={24} style={{ flexShrink: 0, marginTop: "2px", color: "#166534" }} />
                <div>
                    <b>PCI DSS Level 1 Certified Protection:</b>
                    <p style={{ margin: "4px 0 0 0" }}>
                        When credit card reservations are ingested from OTAs, raw card details are tokenized in a PCI-compliant vault. Hotel operations handle secure tokens (`pm_...` or `tok_...`) for settlements, eliminating merchant card liability.
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        <Lock size={16} color="#1e3a2f" />
                        <span>Payment Gateway Credentials &amp; Automated Settlement Rules</span>
                    </span>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.btnPrimary}
                    >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Payment Settings"}</span>
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Enable Stripe Tokenization Vault</label>
                        <select
                            value={config.isEnabled ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="false">Disable Automated Tokenization</option>
                            <option value="true">Enable Stripe Tokenization Vault</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Stripe Publishable Key (Client Token)</label>
                        <input
                            type="text"
                            placeholder="pk_live_... or pk_test_..."
                            value={config.stripePublishableKey || ""}
                            onChange={e => setConfig(prev => ({ ...prev, stripePublishableKey: e.target.value.trim() }))}
                            className={styles.input}
                        />
                        <span className={styles.hint}>Hotel public Stripe key for frontend payment element tokenization.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Automatic Card Pre-Authorization on Inbound Booking</label>
                        <select
                            value={config.autoPreAuthOnBooking ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, autoPreAuthOnBooking: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="true">Yes, Verify Guest Card Balance (Pre-Auth 1st Night)</option>
                            <option value="false">Do Not Pre-Auth, Store Card Token Only</option>
                        </select>
                        <span className={styles.hint}>Prevents invalid card reservations and chargebacks from OTA channels.</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Automatic Balance Capture at Guest Check-In</label>
                        <select
                            value={config.autoCaptureOnCheckin ? "true" : "false"}
                            onChange={e => setConfig(prev => ({ ...prev, autoCaptureOnCheckin: e.target.value === "true" }))}
                            className={styles.select}
                        >
                            <option value="true">Automatically Capture Full Accommodation Folio at Check-In</option>
                            <option value="false">Settle Manually via Front Office Terminal</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>PCI Compliance Certification Level</label>
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
