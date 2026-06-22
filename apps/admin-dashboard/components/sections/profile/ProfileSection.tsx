"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Building2, MapPin, Phone, Mail, Globe, Save, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import superadminStyles from "../../../app/(dashboard)/superadmin/superadmin.module.css";

export const ProfileSection = () => {
    const { activeHotelCode, activeHotelName } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [domain, setDomain] = useState("");
    const [subdomain, setSubdomain] = useState("");

    useEffect(() => {
        const fetchHotelProfile = async () => {
            if (!activeHotelCode || activeHotelCode === "0") {
                setLoading(false);
                return;
            }
            try {
                const hotelRef = doc(db, "hotels", activeHotelCode);
                const snap = await getDoc(hotelRef);
                if (snap.exists()) {
                    const data = snap.data();
                    setName(data.name || "");
                    setAddress(data.address || "");
                    setPhone(data.phone || "");
                    setEmail(data.email || "");
                    setDomain(data.domain || "");
                    setSubdomain(data.subdomain || "");
                }
            } catch (err) {
                console.error("Error loading hotel profile:", err);
                toast.error("Gagal memuat profil properti.");
            } finally {
                setLoading(false);
            }
        };

        fetchHotelProfile();
    }, [activeHotelCode]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeHotelCode || activeHotelCode === "0") return;

        setSaving(true);
        try {
            const hotelRef = doc(db, "hotels", activeHotelCode);
            await updateDoc(hotelRef, {
                name,
                address,
                phone,
                email,
                domain
            });
            toast.success("Profil properti berhasil diperbarui!");
        } catch (err) {
            console.error("Error saving hotel profile:", err);
            toast.error("Gagal menyimpan perubahan.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-transparent">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[var(--color-neutral-900)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[var(--f-muted)] font-semibold uppercase text-xs tracking-wider animate-pulse">Loading Profile...</p>
                </div>
            </div>
        );
    }

    if (!activeHotelCode || activeHotelCode === "0") {
        return (
            <div className="flex items-center justify-center min-h-[60vh] px-4">
                <div className="text-center max-w-md p-8 bg-[#faf8f4] dark:bg-[#262626] rounded-2xl border border-[rgba(141,122,82,0.12)]">
                    <Building2 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">No Active Partner Selected</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Anda masuk sebagai Superadmin. Silakan pilih partner properti di dropdown header untuk melihat dan mengedit profil.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={superadminStyles.page}>
            {/* Header */}
            <header className={superadminStyles.header}>
                <div className={superadminStyles.headerLeft}>
                    <h1 className={superadminStyles.title}>Profile Settings</h1>
                    <p className={superadminStyles.subtitle}>Detail profil dan konfigurasi identitas properti partner Setara Venture.</p>
                </div>
            </header>

            <div className={superadminStyles.tableCard} style={{ maxWidth: '800px', margin: '0 auto', overflow: 'visible' }}>
                <div className={superadminStyles.tableHeader}>
                    <div className={superadminStyles.tableTitle}>
                        <Sparkles size={16} className="text-[#8d7a52]" />
                        <span>Detail Registrasi Partner</span>
                    </div>
                </div>

                <form onSubmit={handleSave} className={superadminStyles.modalBody} style={{ overflow: 'visible' }}>
                    <div className={superadminStyles.formGrid}>
                        {/* Property Code (Read-Only) */}
                        <div className={superadminStyles.formField}>
                            <label className={superadminStyles.formLabel}>
                                Partner Code
                            </label>
                            <input
                                type="text"
                                value={activeHotelCode}
                                disabled
                                className={superadminStyles.formInput}
                            />
                        </div>

                        {/* Property Name */}
                        <div className={superadminStyles.formField}>
                            <label className={superadminStyles.formLabel}>
                                Nama Properti / Partner
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Masukkan nama properti..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={superadminStyles.formInput}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className={superadminStyles.formGridFull}>
                        <div className={superadminStyles.formField}>
                            <label className={superadminStyles.formLabel}>
                                Alamat Lengkap
                            </label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Masukkan alamat lengkap properti..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className={superadminStyles.formTextarea}
                                style={{ minHeight: '80px', resize: 'none' }}
                            />
                        </div>
                    </div>

                    <div className={superadminStyles.formGrid}>
                        {/* Phone */}
                        <div className={superadminStyles.formField}>
                            <label className={superadminStyles.formLabel}>
                                No. Telepon Kontak
                            </label>
                            <input
                                type="tel"
                                required
                                placeholder="0812xxxxxx"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={superadminStyles.formInput}
                            />
                        </div>

                        {/* Email */}
                        <div className={superadminStyles.formField}>
                            <label className={superadminStyles.formLabel}>
                                Email Dukungan / Kontak
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="hotel@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={superadminStyles.formInput}
                            />
                        </div>
                    </div>

                    <div className={superadminStyles.formGrid}>
                        {/* Domain Custom */}
                        <div className={superadminStyles.formField}>
                            <label className={superadminStyles.formLabel}>
                                Domain Custom
                            </label>
                            <input
                                type="text"
                                placeholder="www.propertianda.com"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className={superadminStyles.formInput}
                            />
                        </div>

                        {/* Subdomain (Read-Only) */}
                        <div className={superadminStyles.formField}>
                            <label className={superadminStyles.formLabel}>
                                Subdomain CRS
                            </label>
                            <input
                                type="text"
                                value={subdomain || `${activeHotelCode}.mytara.id`}
                                disabled
                                className={superadminStyles.formInput}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-[rgba(141,122,82,0.12)] flex justify-end" style={{ marginTop: '24px' }}>
                        <button
                            type="submit"
                            disabled={saving}
                            className={superadminStyles.btnPrimary}
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            <span>Simpan Perubahan</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
