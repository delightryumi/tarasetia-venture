"use client";

import React, { useState, useEffect } from "react";
import styles from "./PaymentGatewayTab.module.css";
import { usePaymentGateway } from "../payment-gateway/usePaymentGateway";
import { PaymentGatewaySettings, ManualBankDetail } from "../payment-gateway/types";
import { useAuth } from "@/context/AuthContext";
import { isUserSuperadmin } from "@/lib/permissionCheck";
import {
    CreditCard,
    ShieldCheck,
    Bank,
    Receipt,
    Globe,
    Lock,
    Eye,
    EyeSlash,
    Plus,
    Trash,
    FloppyDisk,
    CheckCircle,
    Warning,
    Info,
    Shield,
} from "@phosphor-icons/react";

interface PaymentGatewayTabProps {
    hotelCode?: string;
}

export function PaymentGatewayTab({ hotelCode }: PaymentGatewayTabProps) {
    const { user, activeHotelCode, activeHotelName } = useAuth();
    const effectiveHotelCode = hotelCode || activeHotelCode;
    const isSuperadmin = isUserSuperadmin(user);

    const {
        settings,
        loading,
        saving,
        error,
        successMessage,
        saveSettings,
    } = usePaymentGateway();

    const [activeTab, setActiveTab] = useState<"provider" | "midtrans" | "xendit" | "manual" | "pricing" | "google">("provider");
    const [showMidtransServerKey, setShowMidtransServerKey] = useState(false);
    const [showXenditSecretKey, setShowXenditSecretKey] = useState(false);

    // Local state for editing
    const [formData, setFormData] = useState<PaymentGatewaySettings>(settings);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    // Access control: only superadmin can configure tenant payment gateways
    if (!isSuperadmin) {
        return (
            <div className={styles.container}>
                <div className={styles.deniedCard}>
                    <div className={styles.deniedIcon}>
                        <Lock size={24} weight="bold" />
                    </div>
                    <h3 className={styles.deniedTitle}>Otoritas Khusus Superadmin</h3>
                    <p className={styles.deniedText}>
                        Pengaturan kredensial Payment Gateway (Midtrans, Xendit, Rekening Bank) dan Direct Booking Engine hanya dapat dikonfigurasi oleh Superadmin untuk menjaga keamanan data finansial properti.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.contentCard} style={{ textAlign: "center", padding: "40px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Memuat konfigurasi Payment Gateway...</span>
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        await saveSettings(formData);
    };

    const addBankAccount = () => {
        const newBank: ManualBankDetail = {
            id: `bank-${Date.now()}`,
            bankName: "BCA",
            accountNumber: "",
            accountHolder: "",
            branch: "",
            instructions: "Transfer sesuai nominal invoice reservasi.",
        };
        setFormData((prev) => ({
            ...prev,
            manualTransfer: {
                ...prev.manualTransfer,
                banks: [...prev.manualTransfer.banks, newBank],
            },
        }));
    };

    const removeBankAccount = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            manualTransfer: {
                ...prev.manualTransfer,
                banks: prev.manualTransfer.banks.filter((b) => b.id !== id),
            },
        }));
    };

    const updateBank = (id: string, field: keyof ManualBankDetail, value: string) => {
        setFormData((prev) => ({
            ...prev,
            manualTransfer: {
                ...prev.manualTransfer,
                banks: prev.manualTransfer.banks.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
            },
        }));
    };

    const toggleMidtransChannel = (channel: string) => {
        setFormData((prev) => {
            const current = prev.midtrans.enabledChannels || [];
            const updated = current.includes(channel)
                ? current.filter((c) => c !== channel)
                : [...current, channel];
            return {
                ...prev,
                midtrans: {
                    ...prev.midtrans,
                    enabledChannels: updated,
                },
            };
        });
    };

    const toggleXenditChannel = (channel: string) => {
        setFormData((prev) => {
            const current = prev.xendit.enabledChannels || [];
            const updated = current.includes(channel)
                ? current.filter((c) => c !== channel)
                : [...current, channel];
            return {
                ...prev,
                xendit: {
                    ...prev.xendit,
                    enabledChannels: updated,
                },
            };
        });
    };

    const publicBookingUrl = typeof window !== "undefined"
        ? `${window.location.origin.replace(":3000", ":3002")}/book/${effectiveHotelCode}`
        : `/book/${effectiveHotelCode}`;

    return (
        <div className={styles.container}>
            {/* Header Top Card */}
            <div className={styles.headerCard}>
                <div className={styles.titleArea}>
                    <div className={styles.titleWithBadge}>
                        <h2 className={styles.mainTitle}>Tenant Payment Gateway & Booking Engine</h2>
                        <span className={styles.badgeSuperadmin}>
                            <Shield size={13} weight="bold" />
                            <span>Superadmin Access</span>
                        </span>
                    </div>
                    <p className={styles.subTitle}>
                        Kelola kredensial Midtrans, Xendit, Transfer Bank, dan aturan pajak direct booking hotel {activeHotelName || effectiveHotelCode}.
                    </p>
                </div>

                <div className={styles.headerActions}>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className={styles.btnSave}
                    >
                        <FloppyDisk size={16} weight="bold" />
                        <span>{saving ? "Menyimpan..." : "Simpan Konfigurasi"}</span>
                    </button>
                </div>
            </div>

            {/* Status Alerts */}
            {successMessage && (
                <div className={styles.alertSuccess}>
                    <CheckCircle size={18} weight="fill" />
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className={styles.alertError}>
                    <Warning size={18} weight="fill" />
                    <span>{error}</span>
                </div>
            )}

            {/* Sub-Tab Navigation */}
            <div className={styles.tabNav}>
                {[
                    { key: "provider", label: "Pilihan Provider Utama", icon: <CreditCard size={15} weight="bold" /> },
                    { key: "midtrans", label: "Midtrans Snap", icon: <ShieldCheck size={15} weight="bold" /> },
                    { key: "xendit", label: "Xendit Invoice", icon: <ShieldCheck size={15} weight="bold" /> },
                    { key: "manual", label: "Rekening Bank Manual", icon: <Bank size={15} weight="bold" /> },
                    { key: "pricing", label: "Pajak & Ketentuan", icon: <Receipt size={15} weight="bold" /> },
                    { key: "google", label: "Google Hotel Links", icon: <Globe size={15} weight="bold" /> },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ""}`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* TAB 1: PROVIDER UTAMA */}
            {activeTab === "provider" && (
                <div className={styles.contentCard}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>Metode Pembayaran Aktif untuk Tamu</h3>
                            <p className={styles.sectionDesc}>
                                Pilih gateway yang akan digunakan pada checkout booking engine resmi.
                            </p>
                        </div>
                    </div>

                    <div className={styles.providerGrid}>
                        {/* Midtrans */}
                        <div
                            onClick={() => setFormData((p) => ({ ...p, activeProvider: "midtrans" }))}
                            className={`${styles.providerCard} ${formData.activeProvider === "midtrans" ? styles.providerCardActive : ""}`}
                        >
                            <div className={styles.providerCardTop}>
                                <div className={styles.providerIconWrap}>
                                    <CreditCard size={20} weight="bold" />
                                </div>
                                <input
                                    type="radio"
                                    name="activeProvider"
                                    checked={formData.activeProvider === "midtrans"}
                                    onChange={() => setFormData((p) => ({ ...p, activeProvider: "midtrans" }))}
                                />
                            </div>
                            <div>
                                <h4 className={styles.providerName}>Midtrans Payment Gateway</h4>
                                <p className={styles.providerDesc}>
                                    Mendukung QRIS, GoPay, ShopeePay, Virtual Account BCA/BNI/BRI/Mandiri, dan Kartu Kredit.
                                </p>
                            </div>
                            <div>
                                <span className={`${styles.envTag} ${formData.midtrans.isProduction ? styles.envProduction : styles.envSandbox}`}>
                                    {formData.midtrans.isProduction ? "Production Mode" : "Sandbox Testing"}
                                </span>
                            </div>
                        </div>

                        {/* Xendit */}
                        <div
                            onClick={() => setFormData((p) => ({ ...p, activeProvider: "xendit" }))}
                            className={`${styles.providerCard} ${formData.activeProvider === "xendit" ? styles.providerCardActive : ""}`}
                        >
                            <div className={styles.providerCardTop}>
                                <div className={styles.providerIconWrap}>
                                    <CreditCard size={20} weight="bold" />
                                </div>
                                <input
                                    type="radio"
                                    name="activeProvider"
                                    checked={formData.activeProvider === "xendit"}
                                    onChange={() => setFormData((p) => ({ ...p, activeProvider: "xendit" }))}
                                />
                            </div>
                            <div>
                                <h4 className={styles.providerName}>Xendit Invoice Checkout</h4>
                                <p className={styles.providerDesc}>
                                    Solusi invoice otomatis multi-bank VA, QRIS, E-Wallet (OVO/DANA), dan gerai retail.
                                </p>
                            </div>
                            <div>
                                <span className={`${styles.envTag} ${formData.xendit.isProduction ? styles.envProduction : styles.envSandbox}`}>
                                    {formData.xendit.isProduction ? "Production Mode" : "Sandbox Testing"}
                                </span>
                            </div>
                        </div>

                        {/* Transfer Bank */}
                        <div
                            onClick={() => setFormData((p) => ({ ...p, activeProvider: "manual" }))}
                            className={`${styles.providerCard} ${formData.activeProvider === "manual" ? styles.providerCardActive : ""}`}
                        >
                            <div className={styles.providerCardTop}>
                                <div className={styles.providerIconWrap}>
                                    <Bank size={20} weight="bold" />
                                </div>
                                <input
                                    type="radio"
                                    name="activeProvider"
                                    checked={formData.activeProvider === "manual"}
                                    onChange={() => setFormData((p) => ({ ...p, activeProvider: "manual" }))}
                                />
                            </div>
                            <div>
                                <h4 className={styles.providerName}>Transfer Rekening Manual</h4>
                                <p className={styles.providerDesc}>
                                    Tamu mentransfer langsung ke rekening bank hotel, verifikasi bukti dilakukan di Front Desk.
                                </p>
                            </div>
                            <div>
                                <span className={`${styles.envTag} ${styles.envProduction}`}>
                                    {formData.manualTransfer.banks.length} Rekening Aktif
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: MIDTRANS CONFIG */}
            {activeTab === "midtrans" && (
                <div className={styles.contentCard}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>Kredensial API Midtrans Tenant</h3>
                            <p className={styles.sectionDesc}>
                                Masukkan kunci API dari dashboard Midtrans resmi milik partner hotel.
                            </p>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((p) => ({
                                        ...p,
                                        midtrans: { ...p.midtrans, isProduction: !p.midtrans.isProduction },
                                    }))
                                }
                                className={`${styles.envTag} ${formData.midtrans.isProduction ? styles.envProduction : styles.envSandbox}`}
                                style={{ cursor: "pointer" }}
                            >
                                Mode: {formData.midtrans.isProduction ? "Production (Live)" : "Sandbox (Test)"} (Klik untuk ubah)
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Client Key ({formData.midtrans.isProduction ? "Production" : "Sandbox"})</label>
                            <input
                                type="text"
                                value={formData.midtrans.clientKey}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        midtrans: { ...p.midtrans, clientKey: e.target.value },
                                    }))
                                }
                                placeholder="SB-Mid-client-... atau Mid-client-..."
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Server Key ({formData.midtrans.isProduction ? "Production" : "Sandbox"})</label>
                            <div className={styles.inputPasswordWrap}>
                                <input
                                    type={showMidtransServerKey ? "text" : "password"}
                                    value={formData.midtrans.serverKey}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            midtrans: { ...p.midtrans, serverKey: e.target.value },
                                        }))
                                    }
                                    placeholder="SB-Mid-server-... atau Mid-server-..."
                                    className={styles.input}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowMidtransServerKey((p) => !p)}
                                    className={styles.eyeBtn}
                                >
                                    {showMidtransServerKey ? <EyeSlash size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Merchant ID (Opsional)</label>
                            <input
                                type="text"
                                value={formData.midtrans.merchantId || ""}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        midtrans: { ...p.midtrans, merchantId: e.target.value },
                                    }))
                                }
                                placeholder="G123456789"
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Saluran Pembayaran yang Diaktifkan:</label>
                        <div className={styles.channelGrid}>
                            {[
                                { key: "qris", label: "QRIS (Semua E-Wallet)" },
                                { key: "gopay", label: "GoPay Direct" },
                                { key: "bca_va", label: "BCA Virtual Account" },
                                { key: "mandiri_va", label: "Mandiri Bill" },
                                { key: "bni_va", label: "BNI Virtual Account" },
                                { key: "bri_va", label: "BRI Virtual Account" },
                                { key: "credit_card", label: "Kartu Kredit / Debit" },
                                { key: "shopeepay", label: "ShopeePay" },
                            ].map((ch) => {
                                const active = (formData.midtrans.enabledChannels || []).includes(ch.key);
                                return (
                                    <label
                                        key={ch.key}
                                        className={`${styles.channelItem} ${active ? styles.channelItemActive : ""}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={active}
                                            onChange={() => toggleMidtransChannel(ch.key)}
                                        />
                                        <span>{ch.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: XENDIT CONFIG */}
            {activeTab === "xendit" && (
                <div className={styles.contentCard}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>Kredensial API Xendit Tenant</h3>
                            <p className={styles.sectionDesc}>
                                Kunci API Xendit akun hotel untuk integrasi invoice pembayaran online.
                            </p>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((p) => ({
                                        ...p,
                                        xendit: { ...p.xendit, isProduction: !p.xendit.isProduction },
                                    }))
                                }
                                className={`${styles.envTag} ${formData.xendit.isProduction ? styles.envProduction : styles.envSandbox}`}
                                style={{ cursor: "pointer" }}
                            >
                                Mode: {formData.xendit.isProduction ? "Production (Live)" : "Sandbox (Test)"} (Klik untuk ubah)
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Public Key</label>
                            <input
                                type="text"
                                value={formData.xendit.publicKey}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        xendit: { ...p.xendit, publicKey: e.target.value },
                                    }))
                                }
                                placeholder="xnd_public_..."
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Secret Key</label>
                            <div className={styles.inputPasswordWrap}>
                                <input
                                    type={showXenditSecretKey ? "text" : "password"}
                                    value={formData.xendit.secretKey}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            xendit: { ...p.xendit, secretKey: e.target.value },
                                        }))
                                    }
                                    placeholder="xnd_development_... atau xnd_production_..."
                                    className={styles.input}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowXenditSecretKey((p) => !p)}
                                    className={styles.eyeBtn}
                                >
                                    {showXenditSecretKey ? <EyeSlash size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Saluran Pembayaran Xendit:</label>
                        <div className={styles.channelGrid}>
                            {[
                                { key: "QRIS", label: "QRIS" },
                                { key: "BCA", label: "BCA VA" },
                                { key: "BNI", label: "BNI VA" },
                                { key: "BRI", label: "BRI VA" },
                                { key: "MANDIRI", label: "Mandiri VA" },
                                { key: "CREDIT_CARD", label: "Kartu Kredit" },
                                { key: "OVO", label: "OVO" },
                                { key: "DANA", label: "DANA" },
                            ].map((ch) => {
                                const active = (formData.xendit.enabledChannels || []).includes(ch.key);
                                return (
                                    <label
                                        key={ch.key}
                                        className={`${styles.channelItem} ${active ? styles.channelItemActive : ""}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={active}
                                            onChange={() => toggleXenditChannel(ch.key)}
                                        />
                                        <span>{ch.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: MANUAL BANK TRANSFER */}
            {activeTab === "manual" && (
                <div className={styles.contentCard}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>Rekening Bank Resmi Hotel</h3>
                            <p className={styles.sectionDesc}>
                                Rekening bank tujuan transfer untuk tamu yang memilih pembayaran manual.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={addBankAccount}
                            className={styles.btnAddBank}
                        >
                            <Plus size={14} weight="bold" />
                            <span>Tambah Rekening Bank</span>
                        </button>
                    </div>

                    <div className={styles.bankList}>
                        {formData.manualTransfer.banks.map((bank, index) => (
                            <div key={bank.id} className={styles.bankCard}>
                                <div className={styles.bankCardHeader}>
                                    <span className={styles.bankCardIndex}>Rekening #{index + 1}</span>
                                    {formData.manualTransfer.banks.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeBankAccount(bank.id)}
                                            className={styles.btnDeleteBank}
                                        >
                                            <Trash size={13} />
                                            <span>Hapus</span>
                                        </button>
                                    )}
                                </div>

                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Nama Bank</label>
                                        <select
                                            value={bank.bankName}
                                            onChange={(e) => updateBank(bank.id, "bankName", e.target.value)}
                                            className={styles.input}
                                        >
                                            <option value="BCA">BCA (Bank Central Asia)</option>
                                            <option value="Mandiri">Bank Mandiri</option>
                                            <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                                            <option value="BNI">BNI (Bank Negara Indonesia)</option>
                                            <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                                            <option value="CIMB">CIMB Niaga</option>
                                            <option value="Permata">Bank Permata</option>
                                            <option value="Lainnya">Bank Lainnya</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Nomor Rekening</label>
                                        <input
                                            type="text"
                                            value={bank.accountNumber}
                                            onChange={(e) => updateBank(bank.id, "accountNumber", e.target.value)}
                                            placeholder="Contoh: 1234567890"
                                            className={styles.input}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Atas Nama Rekening</label>
                                        <input
                                            type="text"
                                            value={bank.accountHolder}
                                            onChange={(e) => updateBank(bank.id, "accountHolder", e.target.value)}
                                            placeholder="PT Hotel Sejahtera Abadi"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Instruksi Khusus untuk Tamu</label>
                                    <input
                                        type="text"
                                        value={bank.instructions || ""}
                                        onChange={(e) => updateBank(bank.id, "instructions", e.target.value)}
                                        placeholder="Cantumkan Kode Booking pada berita transfer."
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 5: PRICING & POLICIES */}
            {activeTab === "pricing" && (
                <div className={styles.contentCard}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>Pajak Daerah (PB1), Service Charge & Kebijakan</h3>
                            <p className={styles.sectionDesc}>
                                Parameter perhitungan tarif akhir dan aturan pembatalan kamar booking engine.
                            </p>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Pajak Daerah PB1 (%)</label>
                            <input
                                type="number"
                                min={0}
                                max={25}
                                value={formData.pricing.taxRate}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        pricing: { ...p.pricing, taxRate: parseFloat(e.target.value) || 0 },
                                    }))
                                }
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Service Charge Hotel (%)</label>
                            <input
                                type="number"
                                min={0}
                                max={25}
                                value={formData.pricing.serviceRate}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        pricing: { ...p.pricing, serviceRate: parseFloat(e.target.value) || 0 },
                                    }))
                                }
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Kebijakan Pembatalan</label>
                            <select
                                value={formData.policies.cancellationType}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        policies: { ...p.policies, cancellationType: e.target.value as any },
                                    }))
                                }
                                className={styles.input}
                            >
                                <option value="free_cancellation">Gratis Pembatalan (Free Cancellation)</option>
                                <option value="flexible">Fleksibel (H-1 Check-in)</option>
                                <option value="non_refundable">Non-Refundable (Tidak Dapat Dibatalkan)</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Waktu Check-In Standar</label>
                            <input
                                type="text"
                                value={formData.policies.checkInTime}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        policies: { ...p.policies, checkInTime: e.target.value },
                                    }))
                                }
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Waktu Check-Out Standar</label>
                            <input
                                type="text"
                                value={formData.policies.checkOutTime}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        policies: { ...p.policies, checkOutTime: e.target.value },
                                    }))
                                }
                                className={styles.input}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: GOOGLE HOTEL DEEP LINK */}
            {activeTab === "google" && (
                <div className={styles.contentCard}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>Integrasi Google Hotel Center ("Situs Resmi")</h3>
                            <p className={styles.sectionDesc}>
                                URL parameter terintegrasi untuk kampanye Google Free Booking Links.
                            </p>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Contoh Live Direct URL Google:</label>
                        <div className={styles.codeBox}>
                            {publicBookingUrl}?checkin=2026-10-05&checkout=2026-10-06&adults=2&children=0
                        </div>
                    </div>

                    <div className={styles.infoBanner}>
                        <Info size={20} style={{ flexShrink: 0, color: "#15803d" }} />
                        <div>
                            <strong>Kompatibilitas Otomatis:</strong> Calon tamu yang mengklik lencana "Situs resmi" pada Google Search / Maps akan langsung mendarat di halaman booking hotel dengan tanggal dan kuantitas tamu yang sudah terisi otomatis tanpa komisi OTA.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
