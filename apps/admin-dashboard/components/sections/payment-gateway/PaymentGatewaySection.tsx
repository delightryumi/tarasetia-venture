"use client";

import React, { useState } from "react";
import { usePaymentGateway } from "./usePaymentGateway";
import { PaymentProvider, ManualBankDetail, PaymentGatewaySettings } from "./types";
import {
    CreditCard,
    CheckCircle,
    Warning,
    Bank,
    Globe,
    Lock,
    Eye,
    EyeSlash,
    Plus,
    Trash,
    FloppyDisk,
    ShieldCheck,
    Receipt,
    Info,
    ArrowSquareOut,
    Sparkle,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";

export function PaymentGatewaySection() {
    const { activeHotelCode, activeHotelName } = useAuth();
    const {
        settings,
        setSettings,
        loading,
        saving,
        error,
        successMessage,
        saveSettings,
    } = usePaymentGateway();

    const [activeTab, setActiveTab] = useState<"provider" | "midtrans" | "xendit" | "doku" | "manual" | "pricing" | "addons" | "google">("provider");
    const [showMidtransServerKey, setShowMidtransServerKey] = useState(false);
    const [showXenditSecretKey, setShowXenditSecretKey] = useState(false);
    const [showDokuSecretKey, setShowDokuSecretKey] = useState(false);

    // Form state clone for editing
    const [formData, setFormData] = useState<PaymentGatewaySettings>(settings);

    // Sync formData when settings load
    React.useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleSave = async () => {
        await saveSettings(formData);
    };

    const addCustomAddOn = () => {
        const newAddOn = {
            id: `addon-${Date.now()}`,
            name: "Layanan Tambahan Baru",
            description: "Deskripsi fasilitas atau layanan tambahan untuk kenyamanan tamu.",
            price: 50000,
            priceType: "per_stay" as const,
            icon: "sparkle",
            category: "extra",
            isActive: true,
        };
        setFormData((prev) => ({
            ...prev,
            addOns: [...(prev.addOns || []), newAddOn],
        }));
    };

    const removeAddOn = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            addOns: (prev.addOns || []).filter((a) => a.id !== id),
        }));
    };

    const updateAddOn = (id: string, field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            addOns: (prev.addOns || []).map((a) => (a.id === id ? { ...a, [field]: value } : a)),
        }));
    };

    const addBankAccount = () => {
        const newBank: ManualBankDetail = {
            id: `bank-${Date.now()}`,
            bankName: "BCA",
            accountNumber: "",
            accountHolder: "",
            branch: "",
            instructions: "Transfer sesuai total tagihan dan simpan bukti transaksi.",
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
        ? `${window.location.origin.replace(":3000", ":3002")}/book/${activeHotelCode}`
        : `/book/${activeHotelCode}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-neutral-400">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-sm font-light">Memuat pengaturan Payment Gateway...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                            Add-on Module
                        </span>
                        <h1 className="text-xl md:text-2xl font-semibold text-neutral-100">
                            Payment Gateway & Booking Engine
                        </h1>
                    </div>
                    <p className="text-sm text-neutral-400 font-light">
                        Atur saluran pembayaran online (Midtrans, Xendit, Bank Transfer) dan integrasi link Situs Resmi Google untuk properti {activeHotelName || activeHotelCode}.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium text-sm hover:from-amber-500 hover:to-amber-400 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FloppyDisk size={18} weight="bold" />
                        )}
                        <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
                    </button>
                </div>
            </div>

            {/* Alert Messages */}
            {successMessage && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm">
                    <CheckCircle size={20} weight="fill" className="shrink-0 text-emerald-400" />
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
                    <Warning size={20} weight="fill" className="shrink-0 text-red-400" />
                    <span>{error}</span>
                </div>
            )}

            {/* Tabs Bar */}
            <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-2">
                {[
                    { key: "provider", label: "Pilihan Provider Utama", icon: <CreditCard size={16} /> },
                    { key: "midtrans", label: "Midtrans Snap", icon: <ShieldCheck size={16} /> },
                    { key: "xendit", label: "Xendit Invoice", icon: <ShieldCheck size={16} /> },
                    { key: "doku", label: "DOKU Checkout", icon: <CreditCard size={16} /> },
                    { key: "manual", label: "Transfer Bank Manual", icon: <Bank size={16} /> },
                    { key: "pricing", label: "Pajak & Ketentuan", icon: <Receipt size={16} /> },
                    { key: "google", label: "Google Hotel Deep-Link", icon: <Globe size={16} /> },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                            activeTab === tab.key
                                ? "bg-neutral-800 text-amber-400 border border-amber-500/30 shadow-sm"
                                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent"
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6">
                {/* 1. Provider Utama */}
                {activeTab === "provider" && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-medium text-neutral-200 mb-1">
                                Status & Provider Pembayaran Aktif
                            </h3>
                            <p className="text-xs text-neutral-400 font-light">
                                Pilih metode pembayaran yang akan langsung digunakan tamu saat memesan kamar melalui booking engine resmi hotel.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Midtrans Card */}
                            <div
                                onClick={() => setFormData((p) => ({ ...p, activeProvider: "midtrans" }))}
                                className={`cursor-pointer p-5 rounded-xl border transition-all ${
                                    formData.activeProvider === "midtrans"
                                        ? "bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30"
                                        : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-sky-950/50 border border-sky-800/40 flex items-center justify-center text-sky-400">
                                        <CreditCard size={20} weight="bold" />
                                    </div>
                                    <input
                                        type="radio"
                                        name="activeProvider"
                                        checked={formData.activeProvider === "midtrans"}
                                        onChange={() => setFormData((p) => ({ ...p, activeProvider: "midtrans" }))}
                                        className="text-amber-500 focus:ring-amber-500"
                                    />
                                </div>
                                <h4 className="text-sm font-semibold text-neutral-100">Midtrans Payment Gateway</h4>
                                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                    Mendukung QRIS, GoPay, ShopeePay, Virtual Account BCA/BNI/BRI/Mandiri, dan Kartu Kredit dengan popup Snap modern.
                                </p>
                                <span className={`inline-block mt-3 px-2 py-0.5 text-[10px] rounded font-medium ${formData.midtrans.isProduction ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-neutral-800 text-neutral-400"}`}>
                                    {formData.midtrans.isProduction ? "Production Mode" : "Sandbox Testing"}
                                </span>
                            </div>

                            {/* Xendit Card */}
                            <div
                                onClick={() => setFormData((p) => ({ ...p, activeProvider: "xendit" }))}
                                className={`cursor-pointer p-5 rounded-xl border transition-all ${
                                    formData.activeProvider === "xendit"
                                        ? "bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30"
                                        : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-950/50 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
                                        <CreditCard size={20} weight="bold" />
                                    </div>
                                    <input
                                        type="radio"
                                        name="activeProvider"
                                        checked={formData.activeProvider === "xendit"}
                                        onChange={() => setFormData((p) => ({ ...p, activeProvider: "xendit" }))}
                                        className="text-amber-500 focus:ring-amber-500"
                                    />
                                </div>
                                <h4 className="text-sm font-semibold text-neutral-100">Xendit Invoice</h4>
                                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                    Solusi invoice pembayaran otomatis untuk QRIS, Virtual Account multi-bank, E-Wallet (OVO/Dana), dan Alfamart/Indomaret.
                                </p>
                                <span className={`inline-block mt-3 px-2 py-0.5 text-[10px] rounded font-medium ${formData.xendit.isProduction ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-neutral-800 text-neutral-400"}`}>
                                    {formData.xendit.isProduction ? "Production Mode" : "Sandbox Testing"}
                                </span>
                            </div>

                            {/* Manual Bank Transfer Card */}
                            <div
                                onClick={() => setFormData((p) => ({ ...p, activeProvider: "manual" }))}
                                className={`cursor-pointer p-5 rounded-xl border transition-all ${
                                    formData.activeProvider === "manual"
                                        ? "bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30"
                                        : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                                        <Bank size={20} weight="bold" />
                                    </div>
                                    <input
                                        type="radio"
                                        name="activeProvider"
                                        checked={formData.activeProvider === "manual"}
                                        onChange={() => setFormData((p) => ({ ...p, activeProvider: "manual" }))}
                                        className="text-amber-500 focus:ring-amber-500"
                                    />
                                </div>
                                <h4 className="text-sm font-semibold text-neutral-100">Transfer Rekening Manual</h4>
                                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                    Tamu mentransfer langsung ke rekening bank hotel, verifikasi bukti pembayaran dapat dilakukan melalui Front Office.
                                </p>
                                <span className="inline-block mt-3 px-2 py-0.5 text-[10px] rounded font-medium bg-neutral-800 text-neutral-300">
                                    {formData.manualTransfer.banks.length} Rekening Terdaftar
                                </span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-medium text-neutral-200 block">Status Booking Engine Publik</span>
                                <span className="text-[11px] text-neutral-400 font-light">
                                    Jika dinonaktifkan, halaman booking engine tidak akan menerima reservasi baru.
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.enabled}
                                    onChange={(e) => setFormData((p) => ({ ...p, enabled: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                            </label>
                        </div>
                    </div>
                )}

                {/* 2. Kredensial Midtrans */}
                {activeTab === "midtrans" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <div>
                                <h3 className="text-base font-medium text-neutral-200">Konfigurasi Kredensial Midtrans</h3>
                                <p className="text-xs text-neutral-400 font-light">
                                    Kredensial akun Midtrans milik hotel partner untuk memproses pembayaran langsung ke rekening hotel.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                <span className="text-xs text-neutral-300 font-medium">Mode Environment:</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((p) => ({
                                            ...p,
                                            midtrans: { ...p.midtrans, isProduction: !p.midtrans.isProduction },
                                        }))
                                    }
                                    className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                                        formData.midtrans.isProduction
                                            ? "bg-emerald-600 text-white"
                                            : "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                                    }`}
                                >
                                    {formData.midtrans.isProduction ? "Production (Live)" : "Sandbox (Test)"}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                    Client Key {formData.midtrans.isProduction ? "(Production)" : "(Sandbox)"}
                                </label>
                                <input
                                    type="text"
                                    value={formData.midtrans.clientKey}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            midtrans: { ...p.midtrans, clientKey: e.target.value },
                                        }))
                                    }
                                    placeholder="Contoh: SB-Mid-client-XXXXX atau Mid-client-XXXXX"
                                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-medium text-neutral-300">
                                        Server Key {formData.midtrans.isProduction ? "(Production)" : "(Sandbox)"}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowMidtransServerKey((p) => !p)}
                                        className="text-xs text-neutral-400 hover:text-neutral-200 inline-flex items-center gap-1"
                                    >
                                        {showMidtransServerKey ? <EyeSlash size={14} /> : <Eye size={14} />}
                                        <span>{showMidtransServerKey ? "Sembunyikan" : "Tampilkan"}</span>
                                    </button>
                                </div>
                                <input
                                    type={showMidtransServerKey ? "text" : "password"}
                                    value={formData.midtrans.serverKey}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            midtrans: { ...p.midtrans, serverKey: e.target.value },
                                        }))
                                    }
                                    placeholder="Contoh: SB-Mid-server-XXXXX atau Mid-server-XXXXX"
                                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                    Merchant ID (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.midtrans.merchantId || ""}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            midtrans: { ...p.midtrans, merchantId: e.target.value },
                                        }))
                                    }
                                    placeholder="Contoh: G123456789"
                                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-300 mb-2">
                                Saluran Pembayaran yang Diizinkan:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { key: "qris", label: "QRIS (Semua E-Wallet)" },
                                    { key: "gopay", label: "GoPay Direct" },
                                    { key: "bca_va", label: "BCA Virtual Account" },
                                    { key: "mandiri_va", label: "Mandiri Bill" },
                                    { key: "bni_va", label: "BNI Virtual Account" },
                                    { key: "bri_va", label: "BRI Virtual Account" },
                                    { key: "credit_card", label: "Kartu Kredit / Debit" },
                                    { key: "shopeepay", label: "ShopeePay" },
                                ].map((channel) => (
                                    <label
                                        key={channel.key}
                                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                                            (formData.midtrans.enabledChannels || []).includes(channel.key)
                                                ? "bg-amber-950/20 border-amber-500/40 text-neutral-200 font-medium"
                                                : "bg-neutral-950/40 border-neutral-800/80 text-neutral-400"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={(formData.midtrans.enabledChannels || []).includes(channel.key)}
                                            onChange={() => toggleMidtransChannel(channel.key)}
                                            className="rounded text-amber-500 focus:ring-amber-500 bg-neutral-900 border-neutral-700"
                                        />
                                        <span>{channel.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Kredensial Xendit */}
                {activeTab === "xendit" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <div>
                                <h3 className="text-base font-medium text-neutral-200">Konfigurasi Kredensial Xendit</h3>
                                <p className="text-xs text-neutral-400 font-light">
                                    Kredensial API Xendit milik hotel untuk membuat invoice checkout instan.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                <span className="text-xs text-neutral-300 font-medium">Mode Environment:</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((p) => ({
                                            ...p,
                                            xendit: { ...p.xendit, isProduction: !p.xendit.isProduction },
                                        }))
                                    }
                                    className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                                        formData.xendit.isProduction
                                            ? "bg-emerald-600 text-white"
                                            : "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                                    }`}
                                >
                                    {formData.xendit.isProduction ? "Production (Live)" : "Sandbox (Test)"}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                    Public Key
                                </label>
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
                                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-medium text-neutral-300">
                                        Secret Key
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowXenditSecretKey((p) => !p)}
                                        className="text-xs text-neutral-400 hover:text-neutral-200 inline-flex items-center gap-1"
                                    >
                                        {showXenditSecretKey ? <EyeSlash size={14} /> : <Eye size={14} />}
                                        <span>{showXenditSecretKey ? "Sembunyikan" : "Tampilkan"}</span>
                                    </button>
                                </div>
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
                                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-300 mb-2">
                                Saluran Pembayaran Xendit:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { key: "QRIS", label: "QRIS" },
                                    { key: "BCA", label: "BCA VA" },
                                    { key: "BNI", label: "BNI VA" },
                                    { key: "BRI", label: "BRI VA" },
                                    { key: "MANDIRI", label: "Mandiri VA" },
                                    { key: "CREDIT_CARD", label: "Kartu Kredit" },
                                    { key: "OVO", label: "OVO E-Wallet" },
                                    { key: "DANA", label: "DANA E-Wallet" },
                                ].map((channel) => (
                                    <label
                                        key={channel.key}
                                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                                            (formData.xendit.enabledChannels || []).includes(channel.key)
                                                ? "bg-amber-950/20 border-amber-500/40 text-neutral-200 font-medium"
                                                : "bg-neutral-950/40 border-neutral-800/80 text-neutral-400"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={(formData.xendit.enabledChannels || []).includes(channel.key)}
                                            onChange={() => toggleXenditChannel(channel.key)}
                                            className="rounded text-amber-500 focus:ring-amber-500 bg-neutral-900 border-neutral-700"
                                        />
                                        <span>{channel.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Rekening Bank Transfer Manual */}
                {activeTab === "manual" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <div>
                                <h3 className="text-base font-medium text-neutral-200">Daftar Rekening Bank Hotel</h3>
                                <p className="text-xs text-neutral-400 font-light">
                                    Rekening bank resmi atas nama hotel untuk transfer manual tamu.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addBankAccount}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition-all"
                            >
                                <Plus size={14} weight="bold" />
                                <span>Tambah Rekening</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.manualTransfer.banks.map((bank, index) => (
                                <div
                                    key={bank.id}
                                    className="p-4 rounded-xl bg-neutral-950/50 border border-neutral-800 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                                            Rekening #{index + 1}
                                        </span>
                                        {formData.manualTransfer.banks.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeBankAccount(bank.id)}
                                                className="text-neutral-500 hover:text-red-400 text-xs inline-flex items-center gap-1"
                                            >
                                                <Trash size={14} />
                                                <span>Hapus</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[11px] text-neutral-400 mb-1">Nama Bank</label>
                                            <select
                                                value={bank.bankName}
                                                onChange={(e) => updateBank(bank.id, "bankName", e.target.value)}
                                                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
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

                                        <div>
                                            <label className="block text-[11px] text-neutral-400 mb-1">Nomor Rekening</label>
                                            <input
                                                type="text"
                                                value={bank.accountNumber}
                                                onChange={(e) => updateBank(bank.id, "accountNumber", e.target.value)}
                                                placeholder="Contoh: 1234567890"
                                                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] text-neutral-400 mb-1">Atas Nama (Rekening)</label>
                                            <input
                                                type="text"
                                                value={bank.accountHolder}
                                                onChange={(e) => updateBank(bank.id, "accountHolder", e.target.value)}
                                                placeholder="Contoh: PT Hotel Nusantara Sejahtera"
                                                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] text-neutral-400 mb-1">Instruksi Khusus untuk Tamu</label>
                                        <input
                                            type="text"
                                            value={bank.instructions || ""}
                                            onChange={(e) => updateBank(bank.id, "instructions", e.target.value)}
                                            placeholder="Contoh: Cantumkan Kode Booking pada berita transfer"
                                            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                Batas Waktu Konfirmasi Pembayaran Tamu (Jam)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={48}
                                value={formData.manualTransfer.confirmationExpiryHours}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        manualTransfer: {
                                            ...p.manualTransfer,
                                            confirmationExpiryHours: parseInt(e.target.value) || 2,
                                        },
                                    }))
                                }
                                className="w-48 px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                            />
                            <p className="text-[11px] text-neutral-500 mt-1">
                                Kamar akan ditahan sementara selama durasi ini sebelum dibatalkan otomatis jika belum ada pembayaran.
                            </p>
                        </div>
                    </div>
                )}

                {/* 5. Pajak, Service & Ketentuan Booking */}
                {activeTab === "pricing" && (
                    <div className="space-y-6">
                        <div className="border-b border-neutral-800 pb-3">
                            <h3 className="text-base font-medium text-neutral-200">Pajak Daerah (PB1), Service Charge & Kebijakan</h3>
                            <p className="text-xs text-neutral-400 font-light">
                                Penentuan komponen perhitungan harga total pada booking engine resmi.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                    Pajak Daerah / PB1 (%)
                                </label>
                                <div className="relative">
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
                                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 pr-8"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-neutral-500">%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                    Service Charge Hotel (%)
                                </label>
                                <div className="relative">
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
                                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 pr-8"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-neutral-500">%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                    Kebijakan Pembatalan
                                </label>
                                <select
                                    value={formData.policies.cancellationType}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            policies: { ...p.policies, cancellationType: e.target.value as any },
                                        }))
                                    }
                                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                                >
                                    <option value="free_cancellation">Gratis Pembatalan (Free Cancellation)</option>
                                    <option value="flexible">Fleksibel (H-1 Check-in)</option>
                                    <option value="non_refundable">Non-Refundable (Tidak Dapat Dibatalkan)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg">
                            <input
                                type="checkbox"
                                id="isTaxIncludedInRate"
                                checked={formData.pricing.isTaxIncludedInRate || false}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        pricing: { ...p.pricing, isTaxIncludedInRate: e.target.checked },
                                    }))
                                }
                                className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-0 cursor-pointer"
                            />
                            <label htmlFor="isTaxIncludedInRate" className="text-xs text-neutral-300 font-medium cursor-pointer">
                                Tarif Kamar Sudah Termasuk Pajak (Tax Inclusive / PB1 Included)
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                    Waktu Check-In Standar
                                </label>
                                <input
                                    type="text"
                                    value={formData.policies.checkInTime}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            policies: { ...p.policies, checkInTime: e.target.value },
                                        }))
                                    }
                                    placeholder="14:00"
                                    className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                    Waktu Check-Out Standar
                                </label>
                                <input
                                    type="text"
                                    value={formData.policies.checkOutTime}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            policies: { ...p.policies, checkOutTime: e.target.value },
                                        }))
                                    }
                                    placeholder="12:00"
                                    className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. Integrasi Google "Situs Resmi" Link */}
                {activeTab === "google" && (
                    <div className="space-y-6">
                        <div className="border-b border-neutral-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Globe size={18} className="text-amber-400" />
                                <h3 className="text-base font-medium text-neutral-200">
                                    Format Integrasi Google Hotel Center ("Situs Resmi")
                                </h3>
                            </div>
                            <p className="text-xs text-neutral-400 font-light mt-1">
                                Standar URL deep-link untuk ditampilkan pada pencarian Google Search, Google Maps, dan Google Travel dengan lencana <strong className="text-amber-300 font-medium">Situs resmi</strong>.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                            <span className="text-xs font-semibold text-neutral-300 block">
                                Contoh Live URL Direct Booking Google:
                            </span>
                            <div className="flex items-center gap-2 bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800 text-xs font-mono text-amber-300 overflow-x-auto select-all">
                                <span>
                                    {publicBookingUrl}?checkin=2026-10-05&checkout=2026-10-06&adults=2&children=0
                                </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                                Parameter URL <code className="text-amber-400">checkin</code>, <code className="text-amber-400">checkout</code>, <code className="text-amber-400">adults</code>, dan <code className="text-amber-400">children</code> akan dibaca secara otomatis oleh Tara Booking Engine sehingga tamu tidak perlu memilih ulang tanggal saat mendarat dari Google.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
                            <Info size={18} className="shrink-0 text-amber-400 mt-0.5" />
                            <div className="leading-relaxed">
                                <strong>Keuntungan Bebas Komisi OTA:</strong> Tamu yang memesan lewat link "Situs resmi" Google langsung masuk ke sistem CRS hotel Anda dengan komisi 0% (hanya biaya transaksi payment gateway milik hotel sendiri).
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
