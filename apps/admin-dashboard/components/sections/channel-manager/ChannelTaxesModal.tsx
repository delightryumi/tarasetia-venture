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
            toast.success("Konfigurasi Pajak PB1 & Service Charge Saluran OTA Berhasil Disimpan!");
            onClose();
        } catch (err) {
            toast.error("Gagal menyimpan konfigurasi pajak.");
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
                        <span>Pengaturan Pajak &amp; Service Charge Saluran (Taxes &amp; Fees Sets)</span>
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
                                <span className={styles.taxTitle}>1. Pajak Pembangunan 1 (PB1 / PHR Daerah)</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>Standar Pemda: 10%</span>
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
                                    Diterapkan pada tarif akomodasi kamar di OTA.
                                </span>
                            </div>
                        </div>

                        <div className={styles.taxCard}>
                            <div className={styles.taxHeader}>
                                <span className={styles.taxTitle}>2. Service Charge (Biaya Layanan Hotel)</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>Standar Hotel: 5% - 10%</span>
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
                                    Didistribusikan sebagai service charge karyawan.
                                </span>
                            </div>
                        </div>

                        <div className={styles.taxCard}>
                            <div className={styles.taxHeader}>
                                <span className={styles.taxTitle}>3. Model Penayangan Harga di Ekstranet OTA</span>
                            </div>
                            <select
                                value={taxMode}
                                onChange={e => setTaxMode(e.target.value as any)}
                                className={styles.select}
                            >
                                <option value="inclusive">Inclusive (Tarif kamar yang dipush sudah termasuk PB1 &amp; Service Charge)</option>
                                <option value="exclusive">Exclusive (Pajak PB1 &amp; Service Charge ditambahkan otomatis di checkout OTA)</option>
                            </select>
                        </div>

                        <div className={styles.infoBox}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                                <Info size={14} />
                                <span>Sinkronisasi Otomatis ke Ekstranet:</span>
                            </div>
                            <div>
                                Sistem Channel Manager akan menyematkan Tax Breakdown ini saat menayangkan harga di OTA Channels dan Google Hotel Ads sesuai dengan regulasi perpajakan yang berlaku.
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.btnCancel}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={styles.btnSave}
                        >
                            {saving ? "Menyimpan..." : "Simpan Pengaturan Pajak"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
