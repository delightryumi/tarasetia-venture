"use client";

import React, { useState } from "react";
import { Receipt, X, ShieldCheck, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import styles from "./ChannelTaxes.module.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    hotelCode: string;
    initialPb1?: number;
    initialService?: number;
    initialTaxMode?: "inclusive" | "exclusive";
}

export function ChannelTaxesModal({
    isOpen,
    onClose,
    hotelCode,
    initialPb1 = 10,
    initialService = 10,
    initialTaxMode = "inclusive"
}: Props) {
    const [pb1Percent, setPb1Percent] = useState<number>(initialPb1);
    const [servicePercent, setServicePercent] = useState<number>(initialService);
    const [taxMode, setTaxMode] = useState<"inclusive" | "exclusive">(initialTaxMode);
    const [saving, setSaving] = useState<boolean>(false);

    // Load actual saved taxes from hotel document
    React.useEffect(() => {
        if (!isOpen || !hotelCode) return;
        const loadSavedTaxes = async () => {
            try {
                const { getDoc } = await import("firebase/firestore");
                const snap = await getDoc(doc(db, "hotels", hotelCode));
                if (snap.exists()) {
                    const savedTaxes = snap.data()?.channelManager?.taxes;
                    if (savedTaxes) {
                        if (savedTaxes.pb1Percent !== undefined) setPb1Percent(Number(savedTaxes.pb1Percent));
                        if (savedTaxes.servicePercent !== undefined) setServicePercent(Number(savedTaxes.servicePercent));
                        if (savedTaxes.taxMode) setTaxMode(savedTaxes.taxMode);
                    }
                }
            } catch (err) {
                console.warn("Could not load saved taxes:", err);
            }
        };
        loadSavedTaxes();
    }, [isOpen, hotelCode]);

    if (!isOpen) return null;

    const handleSaveTaxes = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const hotelRef = doc(db, "hotels", hotelCode);
            await updateDoc(hotelRef, {
                "channelManager.taxes": {
                    pb1Percent: Number(pb1Percent) || 0,
                    servicePercent: Number(servicePercent) || 0,
                    taxMode,
                    updatedAt: new Date().toISOString()
                }
            });
            toast.success("Taxes & Service Charge configuration saved successfully.");
            onClose();
        } catch (err) {
            toast.error("Failed to save tax configuration.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.backdrop}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        <Receipt size={16} color="#1e3a2f" />
                        <span>Distribution Tax &amp; Service Charge Policy (Taxes &amp; Fees Sets)</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSaveTaxes}>
                    <div className={styles.body}>
                        <div className={styles.taxCard}>
                            <div className={styles.taxHeader}>
                                <span className={styles.taxTitle}>1. Local Government Accommodation Tax (PB1 / City Tax)</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>Standard: 10%</span>
                            </div>
                            <div className={styles.taxInputRow}>
                                <input
                                    type="number"
                                    min={0}
                                    max={25}
                                    value={pb1Percent}
                                    onChange={e => setPb1Percent(Number(e.target.value) || 0)}
                                    className={styles.input}
                                />
                                <span style={{ fontSize: "13px", fontWeight: 700 }}>%</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                    Applied to room accommodation rates distributed to channels.
                                </span>
                            </div>
                        </div>

                        <div className={styles.taxCard}>
                            <div className={styles.taxHeader}>
                                <span className={styles.taxTitle}>2. Hotel Service Charge</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>Standard: 5% - 10%</span>
                            </div>
                            <div className={styles.taxInputRow}>
                                <input
                                    type="number"
                                    min={0}
                                    max={25}
                                    value={servicePercent}
                                    onChange={e => setServicePercent(Number(e.target.value) || 0)}
                                    className={styles.input}
                                />
                                <span style={{ fontSize: "13px", fontWeight: 700 }}>%</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                    Distributed towards staff service fund.
                                </span>
                            </div>
                        </div>

                        <div className={styles.taxCard}>
                            <div className={styles.taxHeader}>
                                <span className={styles.taxTitle}>3. Channel Extranet Price Presentation Model</span>
                            </div>
                            <select
                                value={taxMode}
                                onChange={e => setTaxMode(e.target.value as any)}
                                className={styles.select}
                            >
                                <option value="inclusive">Inclusive (Pushed rates already include tax &amp; service charge - Gross Pricing)</option>
                                <option value="exclusive">Exclusive (Tax &amp; service charge calculated and added at OTA checkout - Net Pricing)</option>
                            </select>
                        </div>

                        <div className={styles.infoBox}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                                <Info size={14} />
                                <span>Automated Extranet Tax Synchronization:</span>
                            </div>
                            <div>
                                The Channel Manager embeds this tax policy when publishing rates to connected OTA channels and Google Hotel Ads in compliance with regional tax regulations.
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.btnCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={styles.btnSave}
                        >
                            {saving ? "Saving..." : "Save Tax Policy"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
