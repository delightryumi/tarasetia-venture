"use client";

import React, { useState, useEffect } from "react";
import { Receipt, X, ShieldCheck, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc, getDoc } from "firebase/firestore";
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

    // Keyboard accessibility: close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Load actual saved taxes from hotel document
    useEffect(() => {
        if (!isOpen || !hotelCode) return;
        const loadSavedTaxes = async () => {
            try {
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
            toast.success("Kebijakan Pajak PB1 & Service Charge berhasil disimpan.");
            onClose();
        } catch (err) {
            toast.error("Gagal menyimpan konfigurasi pajak distribusi.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className={styles.backdrop}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="taxes-modal-title"
        >
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIconBox}>
                            <Receipt size={16} />
                        </div>
                        <div>
                            <div className={styles.headerTag}>Kebijakan Fiskal Distribusi</div>
                            <h3 id="taxes-modal-title" className={styles.title}>
                                Pajak Akomodasi &amp; Service Charge (Taxes &amp; Fees Sets)
                            </h3>
                            <p className={styles.subtitle}>
                                Properti: <b>{hotelCode}</b> • Diintegrasikan ke seluruh saluran OTA dan Google Hotel Ads.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeBtn}
                        aria-label="Tutup jendela pengaturan pajak"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSaveTaxes}>
                    <div className={styles.body}>
                        {/* Tax Card 1: PB1 */}
                        <div className={styles.taxCard}>
                            <div className={styles.taxHeader}>
                                <div>
                                    <span className={styles.taxTitle}>1. Pajak Pembangunan Daerah (PB1 / City Tax)</span>
                                    <span className={styles.taxSubtitle}>Tarif standar hotel daerah: 10%</span>
                                </div>
                                <span className={styles.badgeStandard}>Standar Wajib</span>
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
                                <span className={styles.percentSymbol}>%</span>
                                <span className={styles.inputHint}>
                                    Dikenakan pada harga sewa kamar yang didistribusikan ke OTA.
                                </span>
                            </div>
                        </div>

                        {/* Tax Card 2: Service Charge */}
                        <div className={styles.taxCard}>
                            <div className={styles.taxHeader}>
                                <div>
                                    <span className={styles.taxTitle}>2. Service Charge Hotel</span>
                                    <span className={styles.taxSubtitle}>Standar operasional: 5% - 10%</span>
                                </div>
                                <span className={styles.badgeOptional}>Operasional</span>
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
                                <span className={styles.percentSymbol}>%</span>
                                <span className={styles.inputHint}>
                                    Alokasi dana pelayanan staf perhotelan sesuai kesepakatan kerja.
                                </span>
                            </div>
                        </div>

                        {/* Tax Card 3: Presentation Model */}
                        <div className={styles.taxCard}>
                            <div className={styles.taxHeader}>
                                <div>
                                    <span className={styles.taxTitle}>3. Model Presentasi Harga di Extranet OTA</span>
                                    <span className={styles.taxSubtitle}>Metode perhitungan saat tamu checkout</span>
                                </div>
                            </div>
                            <select
                                value={taxMode}
                                onChange={e => setTaxMode(e.target.value as any)}
                                className={styles.select}
                            >
                                <option value="inclusive">
                                    Inclusive: Tarif yang dikirimkan sudah termasuk PB1 &amp; Service Charge (Gross Pricing)
                                </option>
                                <option value="exclusive">
                                    Exclusive: PB1 &amp; Service Charge ditambahkan saat rincian checkout OTA (Net Pricing)
                                </option>
                            </select>
                        </div>

                        {/* Educational Information Box */}
                        <div className={styles.infoBox}>
                            <div className={styles.infoBoxHeader}>
                                <Info size={14} className={styles.infoIcon} />
                                <span>Sinkronisasi Otomatis Kebijakan Pajak:</span>
                            </div>
                            <p className={styles.infoBoxText}>
                                Channel Manager menyematkan metadata pajak ini pada seluruh transmisi ARI ke OTA dan Google Hotel Ads untuk kepatuhan regulasi perpajakan konsumen.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
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
                            {saving ? "Menyimpan..." : "Simpan Kebijakan Pajak"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
