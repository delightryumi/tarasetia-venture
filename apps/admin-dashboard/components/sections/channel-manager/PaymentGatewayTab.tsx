"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./PaymentGatewayTab.module.css";
import { usePaymentGateway } from "../payment-gateway/usePaymentGateway";
import {
    PaymentGatewaySettings,
    ManualBankDetail,
    BookingEnginePromoCode,
    HotelAddOnSetting,
} from "../payment-gateway/types";
import { useAuth } from "@/context/AuthContext";
import { isUserSuperadmin } from "@/lib/permissionCheck";
import { ImageUpload } from "@/components/ui/ImageUpload/ImageUpload";
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
    Gear,
    Sliders,
    ChartLineUp,
    CheckSquare,
    Tag,
    ArrowSquareOut,
    Sparkle,
    CalendarBlank,
} from "@phosphor-icons/react";

interface PaymentGatewayTabProps {
    hotelCode?: string;
}

type MainTab =
    | "settings"
    | "payment_gateway"
    | "addons"
    | "promotions"
    | "preferences"
    | "analytics"
    | "completeness";

const PRESET_THEME_COLORS = [
    { label: "Burgundy (Default)", hex: "#6D2B35" },
    { label: "Deep Crimson", hex: "#881337" },
    { label: "Emerald Luxury", hex: "#1e3a2f" },
    { label: "Sapphire Navy", hex: "#1e293b" },
    { label: "Royal Indigo", hex: "#312e81" },
    { label: "Warm Bronze", hex: "#78350f" },
];

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

    // Top Level Tabs matching user's screenshot
    const [mainTab, setMainTab] = useState<MainTab>("settings");

    // Payment Gateway Sub-Tab
    const [pgSubTab, setPgSubTab] = useState<"provider" | "midtrans" | "xendit" | "doku" | "manual" | "pricing" | "google">("provider");
    const [showMidtransServerKey, setShowMidtransServerKey] = useState(false);
    const [showXenditSecretKey, setShowXenditSecretKey] = useState(false);
    const [showDokuSecretKey, setShowDokuSecretKey] = useState(false);

    // Local editing state
    const [formData, setFormData] = useState<PaymentGatewaySettings>(settings);

    // New Promo modal or inline state
    const [newPromoCode, setNewPromoCode] = useState("");
    const [newPromoName, setNewPromoName] = useState("");
    const [newPromoPercent, setNewPromoPercent] = useState<number>(10);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get("tab");
            const subParam = params.get("sub");
            if (subParam && ["settings", "preferences", "analytics", "completeness", "promotions", "payment_gateway"].includes(subParam)) {
                setMainTab(subParam as MainTab);
            } else if (tabParam === "payment_gateway") {
                setMainTab("payment_gateway");
            }
        }
    }, []);

    // Completeness Calculations (Screenshot 5) — Must be called before any early return!
    const completenessItems = useMemo(() => {
        const themeConfigured = Boolean(formData.theme?.themeColor && formData.theme?.themeColor !== "");
        const websiteConfigured = Boolean(formData.theme?.hotelWebsiteUrl && formData.theme?.hotelWebsiteUrl !== "/");
        const pgConfigured = Boolean(
            (formData.activeProvider === "manual" && formData.manualTransfer.banks.length > 0 && formData.manualTransfer.banks[0].accountNumber) ||
            (formData.activeProvider === "midtrans" && formData.midtrans.serverKey) ||
            (formData.activeProvider === "xendit" && formData.xendit.secretKey) ||
            (formData.activeProvider === "doku" && formData.doku.secretKey)
        );
        const policyConfigured = Boolean(formData.policies?.cancellationType);
        const analyticsConfigured = Boolean(formData.analytics?.ga4Code || formData.analytics?.gtmCode);
        const promoConfigured = Boolean(formData.promotions && formData.promotions.length > 0);

        const items = [
            {
                name: "Hotel Brand & Theme Color (Burgundy)",
                category: "Basic Configuration",
                weight: 20,
                isCompleted: themeConfigured,
                why: "Membangun identitas visual resmi dan kepercayaan tamu saat memesan.",
                targetTab: "settings" as MainTab,
            },
            {
                name: "Website Return URL (Alamat Kembali)",
                category: "Basic Configuration",
                weight: 15,
                isCompleted: websiteConfigured,
                why: "Menghubungkan tombol kembali langsung ke website hotel tanpa error 3002.",
                targetTab: "settings" as MainTab,
            },
            {
                name: "Payment Gateway & Rekening Bank",
                category: "Payment Configuration",
                weight: 25,
                isCompleted: pgConfigured,
                why: "Memungkinkan pembayaran instan (QRIS, VA Bank, Kartu Kredit).",
                targetTab: "payment_gateway" as MainTab,
            },
            {
                name: "Kebijakan Pembatalan & Pajak PB1",
                category: "Room Differentiator",
                weight: 15,
                isCompleted: policyConfigured,
                why: "Memberikan kepastian aturan pembatalan dan rincian pajak resmi kepada tamu.",
                targetTab: "payment_gateway" as MainTab,
            },
            {
                name: "Promo Voucher Direct Booking Suite",
                category: "Direct Booking Optimisation",
                weight: 15,
                isCompleted: promoConfigured,
                why: "Menarik pemesanan langsung dari OTA dengan kode diskon khusus.",
                targetTab: "promotions" as MainTab,
            },
            {
                name: "Google Analytics 4 / Tag Manager",
                category: "Analytics & Tracking",
                weight: 10,
                isCompleted: analyticsConfigured,
                why: "Melacak konversi dan traffic pengunjung direct booking secara akurat.",
                targetTab: "analytics" as MainTab,
            },
        ];

        const totalScore = items.reduce((acc, it) => acc + (it.isCompleted ? it.weight : 0), 0);
        return { items, totalScore };
    }, [formData]);

    const todayDates = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;

        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        const ny = nextDay.getFullYear();
        const nm = String(nextDay.getMonth() + 1).padStart(2, "0");
        const nd = String(nextDay.getDate()).padStart(2, "0");
        const tomorrowStr = `${ny}-${nm}-${nd}`;

        return { todayStr, tomorrowStr };
    }, []);

    const publicBookingTodayUrl = useMemo(() => {
        const { todayStr, tomorrowStr } = todayDates;
        if (typeof window === "undefined") {
            return `/book/${effectiveHotelCode}?checkin=${todayStr}&checkout=${tomorrowStr}`;
        }
        const origin = window.location.origin;
        const baseOrigin = origin.includes(":3000")
            ? origin.replace(":3000", ":3002")
            : origin.includes(":3001")
            ? origin.replace(":3001", ":3002")
            : origin;
        return `${baseOrigin}/book/${effectiveHotelCode}?checkin=${todayStr}&checkout=${tomorrowStr}`;
    }, [effectiveHotelCode, todayDates]);

    const publicBookingUrl = typeof window !== "undefined"
        ? `${window.location.origin.replace(":3000", ":3002").replace(":3001", ":3002")}/book/${effectiveHotelCode}`
        : `/book/${effectiveHotelCode}`;

    // Access control: only superadmin can configure tenant payment gateways & engine
    if (!isSuperadmin) {
        return (
            <div className={styles.container}>
                <div className={styles.deniedCard}>
                    <div className={styles.deniedIcon}>
                        <Lock size={24} weight="bold" />
                    </div>
                    <h3 className={styles.deniedTitle}>Otoritas Khusus Superadmin</h3>
                    <p className={styles.deniedText}>
                        Pengaturan Direct Booking Engine (Tema Warna, Website Return URL, Kredensial Payment Gateway Midtrans / Xendit) hanya dapat diakses oleh Superadmin.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.contentCard} style={{ textAlign: "center", padding: "40px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Memuat konfigurasi Direct Booking Engine...</span>
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        await saveSettings(formData);
    };

    // Promo Code handlers
    const handleAddPromo = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = newPromoCode.trim().toUpperCase();
        if (!cleanCode) return;

        const newPromo: BookingEnginePromoCode = {
            id: `promo-${Date.now()}`,
            code: cleanCode,
            name: newPromoName.trim() || `Diskon ${newPromoPercent}%`,
            discountPercent: newPromoPercent,
            discountType: "percentage",
            isActive: true,
            description: `Voucher diskon ${newPromoPercent}% direct booking.`,
        };

        setFormData((prev) => ({
            ...prev,
            promotions: [...(prev.promotions || []), newPromo],
        }));

        setNewPromoCode("");
        setNewPromoName("");
        setNewPromoPercent(10);
    };

    const handleDeletePromo = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            promotions: (prev.promotions || []).filter((p) => p.id !== id),
        }));
    };

    const handleTogglePromo = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            promotions: (prev.promotions || []).map((p) =>
                p.id === id ? { ...p, isActive: !p.isActive } : p
            ),
        }));
    };

    // Bank Account helpers
    const addBankAccount = () => {
        const newBank: ManualBankDetail = {
            id: `bank-${Date.now()}`,
            bankName: "BCA",
            accountNumber: "",
            accountHolder: "",
            branch: "Cabang Utama",
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

    // Add-Ons & Extra Services Helpers
    const addCustomAddOn = () => {
        const newAddOn: HotelAddOnSetting = {
            id: `addon-${Date.now()}`,
            name: "Layanan Baru",
            description: "Deskripsi fasilitas tambahan atau layanan ekstra untuk tamu.",
            price: 50000,
            priceType: "per_stay",
            icon: "sparkle",
            category: "extra",
            isActive: true,
            revenueDepartment: "other",
            accountCode: "4190 - Other Operating Revenue",
            costCenter: "Front Desk",
            cogsEstimatePercent: 0,
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

    const updateAddOn = (id: string, field: keyof HotelAddOnSetting, value: any) => {
        setFormData((prev) => ({
            ...prev,
            addOns: (prev.addOns || []).map((a) => (a.id === id ? { ...a, [field]: value } : a)),
        }));
    };

    const toggleAddOnActive = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            addOns: (prev.addOns || []).map((a) => (a.id === id ? { ...a, isActive: a.isActive === false ? true : false } : a)),
        }));
    };

    return (
        <div className={styles.container}>
            {/* Header Top Card */}
            <div className={styles.headerCard}>
                <div className={styles.titleArea}>
                    <div className={styles.titleWithBadge}>
                        <h2 className={styles.mainTitle}>Direct Booking Engine Suite</h2>
                        <span className={styles.badgeSuperadmin}>
                            <Shield size={13} weight="bold" />
                            <span>Superadmin Controlled</span>
                        </span>
                    </div>
                    <p className={styles.subTitle}>
                        Kelola identitas visual, tema Burgundy, alamat website kembali, preferensi form tamu, analitik tracking, voucher promo, dan kredensial payment gateway untuk {activeHotelName || `Hotel #${effectiveHotelCode}`}.
                    </p>
                </div>

                <div className={styles.headerActions}>
                    <a
                        href={publicBookingTodayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.btnGoToBookingEngine}
                        title={`Buka Booking Engine hotel ini untuk reservasi hari ini (${todayDates.todayStr})`}
                    >
                        <CalendarBlank size={16} weight="bold" />
                        <span>Go to Booking Engine</span>
                        <span className={styles.todayTag}>Today ({todayDates.todayStr})</span>
                        <ArrowSquareOut size={13} weight="bold" />
                    </a>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className={styles.btnSave}
                    >
                        <FloppyDisk size={16} weight="bold" />
                        <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
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

            {/* ── Top Level Navigation Tabs (Matching User's Screenshot) ── */}
            <div className={styles.tabNav}>
                <button
                    type="button"
                    onClick={() => setMainTab("settings")}
                    className={`${styles.tabBtn} ${mainTab === "settings" ? styles.tabBtnActive : ""}`}
                >
                    <Gear size={16} weight={mainTab === "settings" ? "fill" : "regular"} />
                    <span>General Settings</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMainTab("payment_gateway")}
                    className={`${styles.tabBtn} ${mainTab === "payment_gateway" ? styles.tabBtnActive : ""}`}
                >
                    <CreditCard size={16} weight={mainTab === "payment_gateway" ? "fill" : "regular"} />
                    <span>Payment Gateway & Rekening Bank</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMainTab("addons")}
                    className={`${styles.tabBtn} ${mainTab === "addons" ? styles.tabBtnActive : ""}`}
                >
                    <Sparkle size={16} weight={mainTab === "addons" ? "fill" : "regular"} />
                    <span>Add-Ons & Layanan Ekstra</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMainTab("promotions")}
                    className={`${styles.tabBtn} ${mainTab === "promotions" ? styles.tabBtnActive : ""}`}
                >
                    <Tag size={16} weight={mainTab === "promotions" ? "fill" : "regular"} />
                    <span>Promo & Deals Suite</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMainTab("preferences")}
                    className={`${styles.tabBtn} ${mainTab === "preferences" ? styles.tabBtnActive : ""}`}
                >
                    <Sliders size={16} weight={mainTab === "preferences" ? "fill" : "regular"} />
                    <span>Guest Preferences</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMainTab("analytics")}
                    className={`${styles.tabBtn} ${mainTab === "analytics" ? styles.tabBtnActive : ""}`}
                >
                    <ChartLineUp size={16} weight={mainTab === "analytics" ? "fill" : "regular"} />
                    <span>Analytics & Tracking</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMainTab("completeness")}
                    className={`${styles.tabBtn} ${mainTab === "completeness" ? styles.tabBtnActive : ""}`}
                >
                    <CheckSquare size={16} weight={mainTab === "completeness" ? "fill" : "regular"} />
                    <span>Completeness ({completenessItems.totalScore}%)</span>
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════
                TAB 1: SETTINGS (Theme Burgundy, Website Return URL, Guarantees)
               ══════════════════════════════════════════════════════════ */}
            {mainTab === "settings" && (
                <div className={styles.contentCard}>
                    {/* 1. Guarantee Setting (Screenshot 1) */}
                    <div className={styles.settingGroup}>
                        <h3 className={styles.groupHeading}>Guarantee Setting</h3>
                        
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Default Reservation Guarantee:</span>
                            </div>
                            <div>
                                <select
                                    value={formData.theme?.guaranteeType || "confirm_booking"}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            theme: {
                                                ...prev.theme,
                                                guaranteeType: e.target.value as any,
                                            },
                                        }))
                                    }
                                    className={styles.formSelect}
                                >
                                    <option value="confirm_booking">Confirm Booking (Instan Tanpa Deposit Manual)</option>
                                    <option value="hold_cc">Hold Credit Card / Pre-Authorization</option>
                                    <option value="manual_approval">Manual Verification & Approval</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Payment Reservation Guarantee for incomplete booking:</span>
                                <Info size={14} color="#64748b" />
                            </div>
                            <div>
                                <select
                                    value={formData.theme?.incompleteBookingAction || "failed_booking"}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            theme: {
                                                ...prev.theme,
                                                incompleteBookingAction: e.target.value as any,
                                            },
                                        }))
                                    }
                                    className={styles.formSelect}
                                >
                                    <option value="failed_booking">Online Failed Booking (Auto Void)</option>
                                    <option value="hold_2hours">Hold Inventory for 2 Hours</option>
                                    <option value="auto_release">Auto Release Inventory Immediately</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. Theme Setting (Theme Color Default Burgundy #6D2B35 & Logo & Website Return URL) */}
                    <div className={styles.settingGroup}>
                        <h3 className={styles.groupHeading}>Theme & Branding Setting</h3>

                        {/* Theme Color */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Theme Color (Warna Utama):</span>
                            </div>
                            <div className={styles.colorPickerWrap}>
                                <div className={styles.colorInputBox}>
                                    <input
                                        type="color"
                                        value={formData.theme?.themeColor || "#6D2B35"}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                theme: {
                                                    ...prev.theme,
                                                    themeColor: e.target.value,
                                                },
                                            }))
                                        }
                                        className={styles.colorSwatch}
                                    />
                                    <input
                                        type="text"
                                        value={formData.theme?.themeColor || "#6D2B35"}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                theme: {
                                                    ...prev.theme,
                                                    themeColor: e.target.value,
                                                },
                                            }))
                                        }
                                        style={{ width: "90px", border: "none", outline: "none", fontFamily: "monospace", fontWeight: 700, fontSize: "13px" }}
                                    />
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {PRESET_THEME_COLORS.map((preset) => (
                                        <button
                                            key={preset.hex}
                                            type="button"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    theme: { ...prev.theme, themeColor: preset.hex },
                                                }))
                                            }
                                            className={styles.presetColorBtn}
                                            style={{ backgroundColor: preset.hex }}
                                            title={preset.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Hotel Website Return URL (Dynamic Back Button Link) */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Hotel Website Return URL:</span>
                                <span title="URL website utama hotel saat tamu menekan tombol kembali">
                                    <Info size={14} color="#64748b" />
                                </span>
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={formData.theme?.hotelWebsiteUrl || ""}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            theme: {
                                                ...prev.theme,
                                                hotelWebsiteUrl: e.target.value,
                                            },
                                        }))
                                    }
                                    placeholder="Contoh: https://hoteltentrem.com atau https://namahotel.com atau /"
                                    className={styles.formInput}
                                />
                                <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "4px" }}>
                                    Ketika tamu mengklik tombol <em>&quot;Kembali ke Website Hotel&quot;</em>, mereka akan diarahkan ke alamat ini secara dinamis (bebas crash).
                                </span>
                            </div>
                        </div>

                        {/* Hotel Logo File Upload */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Logo Header Hotel:</span>
                                <span title="Upload file logo resmi hotel (Format PNG transparan / SVG / JPG)">
                                    <Info size={14} color="#64748b" />
                                </span>
                            </div>
                            <div style={{ maxWidth: "420px", width: "100%" }}>
                                <ImageUpload
                                    path={`hotels/${effectiveHotelCode}/branding/logo.png`}
                                    currentUrl={formData.theme?.logoUrl || ""}
                                    label="Logo Hotel"
                                    onUploadComplete={(url) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            theme: {
                                                ...prev.theme,
                                                logoUrl: url,
                                            },
                                        }));
                                    }}
                                />
                                <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "6px" }}>
                                    Rekomendasi: File PNG transparan atau SVG dengan aspek rasio horizontal (misal 240x80px).
                                </span>
                            </div>
                        </div>

                        {/* Hotel Property Address (Displayed right below logo in booking engine header) */}
                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Alamat Properti Hotel:</span>
                                <span title="Alamat lengkap properti yang tampil tepat di bawah logo pada header Booking Engine">
                                    <Info size={14} color="#64748b" />
                                </span>
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={formData.theme?.hotelAddress || ""}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            theme: {
                                                ...prev.theme,
                                                hotelAddress: e.target.value,
                                            },
                                        }))
                                    }
                                    placeholder="Contoh: Jl. Palagan Tentara Pelajar Km. 8.1, Sariharjo, Ngaglik, Sleman, D.I. Yogyakarta"
                                    className={styles.formInput}
                                />
                                <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "4px" }}>
                                    Alamat ini akan ditampilkan tepat di bawah logo hotel pada header Booking Engine resmi.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Competitive Advantage (Screenshot 2) */}
                    <div className={styles.settingGroup}>
                        <h3 className={styles.groupHeading}>Competitive Advantage</h3>

                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Pay at Hotel:</span>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            theme: {
                                                ...prev.theme,
                                                payAtHotel: !prev.theme?.payAtHotel,
                                            },
                                        }))
                                    }
                                    className={`${styles.toggleSwitch} ${formData.theme?.payAtHotel ? styles.toggleSwitchActive : ""}`}
                                >
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Pay Directly to Hotel:</span>
                                <Info size={14} color="#64748b" />
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            theme: {
                                                ...prev.theme,
                                                payDirectlyToHotel: !prev.theme?.payDirectlyToHotel,
                                            },
                                        }))
                                    }
                                    className={`${styles.toggleSwitch} ${formData.theme?.payDirectlyToHotel ? styles.toggleSwitchActive : ""}`}
                                >
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Keep packages locked by default:</span>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            theme: {
                                                ...prev.theme,
                                                keepPackagesLocked: !prev.theme?.keepPackagesLocked,
                                            },
                                        }))
                                    }
                                    className={`${styles.toggleSwitch} ${formData.theme?.keepPackagesLocked ? styles.toggleSwitchActive : ""}`}
                                >
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 4. Guest Consent & Legal Compliance (Screenshot 2) */}
                    <div className={styles.settingGroup}>
                        <h3 className={styles.groupHeading}>Guest Consent & Legal Compliance</h3>

                        <div className={styles.fieldRow}>
                            <div className={styles.fieldLabelCol}>
                                <span>Require Hotel Policy & Terms acceptance:</span>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            theme: {
                                                ...prev.theme,
                                                requireTermsAcceptance: !prev.theme?.requireTermsAcceptance,
                                            },
                                        }))
                                    }
                                    className={`${styles.toggleSwitch} ${formData.theme?.requireTermsAcceptance ? styles.toggleSwitchActive : ""}`}
                                >
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 2: PREFERENCES (Screenshot 3 — Address Info Table)
               ══════════════════════════════════════════════════════════ */}
            {mainTab === "preferences" && (
                <div className={styles.contentCard}>
                    <div>
                        <h3 className={styles.sectionTitle}>Address Information</h3>
                        <p className={styles.sectionDesc}>
                            Set required fields to capture essential guest details during booking.
                        </p>
                    </div>

                    <table className={styles.prefTable}>
                        <thead>
                            <tr>
                                <th>Field Name</th>
                                <th style={{ textAlign: "center" }}>Visibility or Not</th>
                                <th style={{ textAlign: "center" }}>Mandatory or Not</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { key: "address", label: "Address" },
                                { key: "city", label: "City" },
                                { key: "zipCode", label: "Zip Code" },
                                { key: "state", label: "State" },
                                { key: "country", label: "Country" },
                                { key: "arrivalTime", label: "Arrival Time" },
                                { key: "specialRequests", label: "Special Requests" },
                            ].map((f) => {
                                const pref = formData.preferences?.[f.key as keyof typeof formData.preferences] || { visible: false, mandatory: false };
                                return (
                                    <tr key={f.key}>
                                        <td style={{ fontWeight: 700 }}>{f.label}</td>
                                        <td style={{ textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={pref.visible}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        preferences: {
                                                            ...prev.preferences,
                                                            [f.key]: {
                                                                ...pref,
                                                                visible: e.target.checked,
                                                            },
                                                        },
                                                    }))
                                                }
                                                className={styles.checkboxInput}
                                            />
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={pref.mandatory}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        preferences: {
                                                            ...prev.preferences,
                                                            [f.key]: {
                                                                ...pref,
                                                                mandatory: e.target.checked,
                                                            },
                                                        },
                                                    }))
                                                }
                                                className={styles.checkboxInput}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 3: ANALYTICS & TRACKING (Screenshot 4)
               ══════════════════════════════════════════════════════════ */}
            {mainTab === "analytics" && (
                <div className={styles.contentCard}>
                    <div>
                        <h3 className={styles.sectionTitle}>Google Code Setting</h3>
                        <p className={styles.sectionDesc}>
                            Configure your Google Analytics, Tag Manager, and Google Ads tracking codes to monitor visits, conversions, and campaign performance. Scripts will be applied to all relevant booking pages including the confirmation page.
                        </p>
                    </div>

                    {/* Google Analytics 4 */}
                    <div className={styles.analyticsRow}>
                        <label style={{ fontSize: "13px", fontWeight: 700 }}>Google Analytics 4 Code</label>
                        <input
                            type="text"
                            value={formData.analytics?.ga4Code || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    analytics: { ...prev.analytics, ga4Code: e.target.value },
                                }))
                            }
                            placeholder="G-XXXXXXXXXX"
                            className={styles.formInput}
                        />
                        <button type="button" className={styles.btnShowDetails}>
                            <Eye size={14} />
                            <span>Show Details</span>
                        </button>
                    </div>

                    {/* Google Tag Manager */}
                    <div className={styles.analyticsRow}>
                        <label style={{ fontSize: "13px", fontWeight: 700 }}>Google Tag Manager Code</label>
                        <input
                            type="text"
                            value={formData.analytics?.gtmCode || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    analytics: { ...prev.analytics, gtmCode: e.target.value },
                                }))
                            }
                            placeholder="GTM-XXXXXXX"
                            className={styles.formInput}
                        />
                        <button type="button" className={styles.btnShowDetails}>
                            <Eye size={14} />
                            <span>Show Details</span>
                        </button>
                    </div>

                    {/* Data Layer Script */}
                    <div className={styles.analyticsRow}>
                        <label style={{ fontSize: "13px", fontWeight: 700 }}>Select Data Layer Script</label>
                        <select
                            value={formData.analytics?.dataLayerScript || "Script 6"}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    analytics: { ...prev.analytics, dataLayerScript: e.target.value },
                                }))
                            }
                            className={styles.formSelect}
                        >
                            <option value="Script 1">Script 1 (Enhanced Ecommerce)</option>
                            <option value="Script 2">Script 2 (Standard Pageview)</option>
                            <option value="Script 6">Script 6 (Google Hotel & GTM Conversions)</option>
                        </select>
                        <button type="button" className={styles.btnShowDetails}>
                            <Eye size={14} />
                            <span>Show Details</span>
                        </button>
                    </div>

                    {/* Google Ads Code */}
                    <div className={styles.analyticsRow}>
                        <label style={{ fontSize: "13px", fontWeight: 700 }}>Google Ads Code</label>
                        <input
                            type="text"
                            value={formData.analytics?.googleAdsCode || ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    analytics: { ...prev.analytics, googleAdsCode: e.target.value },
                                }))
                            }
                            placeholder="AW-XXXXXXXXX"
                            className={styles.formInput}
                        />
                        <button type="button" className={styles.btnShowDetails}>
                            <Eye size={14} />
                            <span>Show Details</span>
                        </button>
                    </div>

                    {/* Facebook Pixel */}
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px", marginTop: "10px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "14px" }}>Setting up analytics for Facebook</h4>
                        <div className={styles.analyticsRow}>
                            <label style={{ fontSize: "13px", fontWeight: 700 }}>Facebook Meta Pixel ID</label>
                            <input
                                type="text"
                                value={formData.analytics?.facebookPixelId || ""}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        analytics: { ...prev.analytics, facebookPixelId: e.target.value },
                                    }))
                                }
                                placeholder="123456789012345"
                                className={styles.formInput}
                            />
                            <button type="button" className={styles.btnShowDetails}>
                                <Eye size={14} />
                                <span>Show Details</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 4: CONFIGURATION COMPLETENESS (Screenshot 5)
               ══════════════════════════════════════════════════════════ */}
            {mainTab === "completeness" && (
                <div className={styles.contentCard}>
                    <div className={styles.completenessLayout}>
                        {/* Circular Gauge */}
                        <div className={styles.completenessGaugeCard}>
                            <span style={{ fontSize: "14px", fontWeight: 800 }}>Configuration Completeness</span>
                            
                            <div className={styles.gaugeCircle}>
                                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#e2e8f0"
                                        strokeWidth="3.8"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke={completenessItems.totalScore >= 80 ? "#16a34a" : "#d97706"}
                                        strokeDasharray={`${completenessItems.totalScore}, 100`}
                                        strokeWidth="3.8"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className={styles.gaugePercentText}>
                                    {completenessItems.totalScore}%
                                </div>
                            </div>

                            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                                {completenessItems.totalScore >= 80
                                    ? "Luar biasa! Direct Booking Engine Anda telah terkonfigurasi secara profesional dan siap bersaing."
                                    : "Lengkapi item di samping untuk mengoptimalkan konversi direct booking hotel Anda."}
                            </p>
                        </div>

                        {/* Table Breakdown */}
                        <div>
                            <table className={styles.completenessTable}>
                                <thead>
                                    <tr>
                                        <th>Configuration Items</th>
                                        <th style={{ textAlign: "center" }}>Weightage</th>
                                        <th>Status</th>
                                        <th>Why this is needed?</th>
                                        <th style={{ textAlign: "right" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completenessItems.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 700 }}>{item.name}</td>
                                            <td style={{ textAlign: "center", fontWeight: 800 }}>{item.weight}</td>
                                            <td>
                                                {item.isCompleted ? (
                                                    <span className={styles.badgeCompleted}>
                                                        <CheckCircle size={15} weight="fill" />
                                                        <span>Completed</span>
                                                    </span>
                                                ) : (
                                                    <span className={styles.badgeNotConfigured}>
                                                        <Warning size={15} weight="fill" />
                                                        <span>Not Configured</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: "12px", color: "#64748b" }}>{item.why}</td>
                                            <td style={{ textAlign: "right" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setMainTab(item.targetTab)}
                                                    className={styles.btnConfigureNow}
                                                >
                                                    Configure Now
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 5: DIRECT BOOKING PROMOTIONS SUITE
               ══════════════════════════════════════════════════════════ */}
            {mainTab === "promotions" && (
                <div className={styles.contentCard}>
                    <div>
                        <h3 className={styles.sectionTitle}>Direct Booking Promo & Voucher Management</h3>
                        <p className={styles.sectionDesc}>
                            Buat kode voucher promo (misal: DIRECT10, STAYCATION, VIP20) untuk memberikan potongan harga otomatis di halaman booking engine.
                        </p>
                    </div>

                    {/* Create New Promo Bar */}
                    <form onSubmit={handleAddPromo} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 800, color: "#475569" }}>Kode Voucher</label>
                            <input
                                type="text"
                                required
                                value={newPromoCode}
                                onChange={(e) => setNewPromoCode(e.target.value)}
                                placeholder="DIRECT10"
                                style={{ textTransform: "uppercase", width: "140px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 800 }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "180px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 800, color: "#475569" }}>Nama Promo</label>
                            <input
                                type="text"
                                value={newPromoName}
                                onChange={(e) => setNewPromoName(e.target.value)}
                                placeholder="Direct Special 10% Off"
                                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 800, color: "#475569" }}>Diskon (%)</label>
                            <input
                                type="number"
                                min={1}
                                max={90}
                                value={newPromoPercent}
                                onChange={(e) => setNewPromoPercent(parseInt(e.target.value, 10))}
                                style={{ width: "90px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 800 }}
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.btnSave}
                            style={{ height: "40px" }}
                        >
                            <Plus size={16} weight="bold" />
                            <span>Tambah Voucher</span>
                        </button>
                    </form>

                    {/* Promo List */}
                    <div className={styles.promoListGrid}>
                        {(formData.promotions || []).map((promo) => (
                            <div key={promo.id} className={styles.promoCard}>
                                <div>
                                    <div className={styles.promoCardHeader}>
                                        <span className={styles.promoCodeBadge}>{promo.code}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleTogglePromo(promo.id)}
                                            style={{ background: promo.isActive ? "#dcfce7" : "#f1f5f9", color: promo.isActive ? "#166534" : "#64748b", border: "none", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                                        >
                                            {promo.isActive ? "● Aktif" : "Nonaktif"}
                                        </button>
                                    </div>
                                    <h4 style={{ fontSize: "14px", fontWeight: 800, margin: "10px 0 4px 0", color: "#0f172a" }}>{promo.name}</h4>
                                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{promo.description}</p>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 900, color: "#1e3a2f" }}>
                                        Diskon: {promo.discountPercent}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeletePromo(promo.id)}
                                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700 }}
                                    >
                                        <Trash size={14} />
                                        <span>Hapus</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB: ADD-ONS & LAYANAN EKSTRA (Upselling & Extra Services)
               ══════════════════════════════════════════════════════════ */}
            {mainTab === "addons" && (
                <div className={styles.contentCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <h3 className={styles.sectionTitle}>Katalog Add-Ons & Layanan Ekstra Hotel</h3>
                            <p className={styles.sectionDesc}>
                                Kelola fasilitas tambahan dan layanan upselling (Extra Bed, Antar-Jemput, Late Check-Out, Romantic Dinner) yang dapat dipilih tamu saat booking di halaman reservasi langsung.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={addCustomAddOn}
                            className={styles.btnSave}
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                        >
                            <Plus size={16} weight="bold" />
                            <span>Tambah Layanan Ekstra</span>
                        </button>
                    </div>

                    <div className={styles.addonsGrid}>
                        {(formData.addOns || []).map((addon, index) => (
                            <div
                                key={addon.id || index}
                                className={`${styles.addonCard} ${addon.isActive === false ? styles.addonCardInactive : ""}`}
                            >
                                <div className={styles.addonCardHeader}>
                                    <div className={styles.addonIconBadge}>
                                        <Sparkle size={14} weight="bold" />
                                        <span>Layanan #{index + 1}</span>
                                    </div>
                                    <div className={styles.addonActions}>
                                        <button
                                            type="button"
                                            onClick={() => toggleAddOnActive(addon.id)}
                                            className={`${styles.btnToggleAddon} ${addon.isActive !== false ? styles.btnToggleAddonActive : styles.btnToggleAddonInactive}`}
                                        >
                                            {addon.isActive !== false ? "● Aktif" : "Nonaktif"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeAddOn(addon.id)}
                                            className={styles.btnDeleteAddon}
                                            title="Hapus Layanan"
                                        >
                                            <Trash size={14} />
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.addonFieldGroup}>
                                    <label className={styles.addonFieldLabel}>Nama Layanan / Fasilitas</label>
                                    <input
                                        type="text"
                                        value={addon.name}
                                        onChange={(e) => updateAddOn(addon.id, "name", e.target.value)}
                                        placeholder="Contoh: Extra Bed (Kasur Tambahan)"
                                        className={styles.formInput}
                                        style={{ fontWeight: 700 }}
                                    />
                                </div>

                                <div className={styles.addonRowInputs}>
                                    <div className={styles.addonFieldGroup}>
                                        <label className={styles.addonFieldLabel}>Harga Nominal (Rp)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={5000}
                                            value={addon.price}
                                            onChange={(e) => updateAddOn(addon.id, "price", parseFloat(e.target.value) || 0)}
                                            className={styles.formInput}
                                        />
                                    </div>
                                    <div className={styles.addonFieldGroup}>
                                        <label className={styles.addonFieldLabel}>Tipe Perhitungan Tarif</label>
                                        <select
                                            value={addon.priceType || "per_stay"}
                                            onChange={(e) => updateAddOn(addon.id, "priceType", e.target.value as any)}
                                            className={styles.formSelect}
                                        >
                                            <option value="per_stay">Per Reservasi (Flat / Stay)</option>
                                            <option value="per_night">Per Malam Inap (x Nights)</option>
                                            <option value="per_person">Per Orang / Tamu</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.addonRowInputs}>
                                    <div className={styles.addonFieldGroup}>
                                        <label className={styles.addonFieldLabel}>Pilihan Ikon</label>
                                        <select
                                            value={addon.icon || "sparkle"}
                                            onChange={(e) => updateAddOn(addon.id, "icon", e.target.value)}
                                            className={styles.formSelect}
                                        >
                                            <option value="bed">Kasur / Extra Bed</option>
                                            <option value="car">Mobil / Airport Transfer</option>
                                            <option value="clock">Jam / Late Check-Out</option>
                                            <option value="utensils">Makan / Romantic Dinner</option>
                                            <option value="wine">Minuman / Bar</option>
                                            <option value="spa">Spa / Wellness</option>
                                            <option value="sparkle">Sparkle / Layanan Umum</option>
                                        </select>
                                    </div>
                                    <div className={styles.addonFieldGroup}>
                                        <label className={styles.addonFieldLabel}>Kategori</label>
                                        <select
                                            value={addon.category || "extra"}
                                            onChange={(e) => updateAddOn(addon.id, "category", e.target.value)}
                                            className={styles.formSelect}
                                        >
                                            <option value="comfort">Kenyamanan (Comfort)</option>
                                            <option value="transport">Transportasi</option>
                                            <option value="flexibility">Fleksibilitas</option>
                                            <option value="dining">Dining & Kuliner</option>
                                            <option value="wellness">Spa & Wellness</option>
                                            <option value="extra">Lainnya</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.addonFieldGroup}>
                                    <label className={styles.addonFieldLabel}>Deskripsi Singkat untuk Tamu</label>
                                    <textarea
                                        value={addon.description || ""}
                                        onChange={(e) => updateAddOn(addon.id, "description", e.target.value)}
                                        placeholder="Jelaskan fasilitas atau ketentuan layanan ini..."
                                        rows={2}
                                        className={styles.formInput}
                                        style={{ resize: "vertical", fontSize: "12px" }}
                                    />
                                </div>

                                {/* ── Accounting & Revenue Center Mapping (USALI) ── */}
                                <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "10px", marginTop: "4px", background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#1e3a2f", display: "block", marginBottom: "8px" }}>
                                        🏛️ Integrasi Akuntansi & Alokasi Pos Revenue
                                    </span>
                                    <div className={styles.addonRowInputs}>
                                        <div className={styles.addonFieldGroup}>
                                            <label className={styles.addonFieldLabel}>Pos Pendapatan (Revenue Dept)</label>
                                            <select
                                                value={addon.revenueDepartment || "room"}
                                                onChange={(e) => updateAddOn(addon.id, "revenueDepartment", e.target.value as any)}
                                                className={styles.formSelect}
                                                style={{ fontSize: "11px" }}
                                            >
                                                <option value="room">🛏️ Room Revenue (Pendapatan Kamar)</option>
                                                <option value="food_beverage">🍽️ Food & Beverage Revenue</option>
                                                <option value="transport">🚗 Transportation / Concierge</option>
                                                <option value="spa">💆 Spa & Wellness Revenue</option>
                                                <option value="laundry">🧺 Laundry Revenue</option>
                                                <option value="other">📦 Other Operating Dept (MOD)</option>
                                            </select>
                                        </div>
                                        <div className={styles.addonFieldGroup}>
                                            <label className={styles.addonFieldLabel}>Departemen Biaya (Cost Center)</label>
                                            <select
                                                value={addon.costCenter || "Housekeeping"}
                                                onChange={(e) => updateAddOn(addon.id, "costCenter", e.target.value)}
                                                className={styles.formSelect}
                                                style={{ fontSize: "11px" }}
                                            >
                                                <option value="Housekeeping">Housekeeping (Linen/Kasur)</option>
                                                <option value="Kitchen & F&B Service">Kitchen & F&B Product</option>
                                                <option value="Concierge & Driver">Concierge & Driver</option>
                                                <option value="Front Desk">Front Desk / Front Office</option>
                                                <option value="Spa Department">Spa & Wellness Team</option>
                                                <option value="General & Admin">General & Administration</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className={styles.addonRowInputs} style={{ marginTop: "6px" }}>
                                        <div className={styles.addonFieldGroup}>
                                            <label className={styles.addonFieldLabel}>Kode Akun COA (Ledger)</label>
                                            <input
                                                type="text"
                                                value={addon.accountCode || ""}
                                                onChange={(e) => updateAddOn(addon.id, "accountCode", e.target.value)}
                                                placeholder="Contoh: 4110 - Room Extra"
                                                className={styles.formInput}
                                                style={{ fontSize: "11px" }}
                                            />
                                        </div>
                                        <div className={styles.addonFieldGroup}>
                                            <label className={styles.addonFieldLabel}>Est. Biaya / HPP (COGS %)</label>
                                            <div style={{ position: "relative" }}>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={addon.cogsEstimatePercent ?? 0}
                                                    onChange={(e) => updateAddOn(addon.id, "cogsEstimatePercent", parseFloat(e.target.value) || 0)}
                                                    className={styles.formInput}
                                                    style={{ fontSize: "11px", paddingRight: "24px" }}
                                                />
                                                <span style={{ position: "absolute", right: "8px", top: "7px", fontSize: "11px", color: "#64748b" }}>%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 6: PAYMENT GATEWAY & TAXES (Midtrans, Xendit, Banks, PB1)
               ══════════════════════════════════════════════════════════ */}
            {mainTab === "payment_gateway" && (
                <div className={styles.contentCard}>
                    {/* Sub-nav */}
                    <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", overflowX: "auto" }}>
                        {[
                            { id: "provider", label: "Pilihan Provider Utama" },
                            { id: "midtrans", label: "Midtrans Snap" },
                            { id: "xendit", label: "Xendit Invoice" },
                            { id: "doku", label: "DOKU Checkout (Jokul)" },
                            { id: "manual", label: "Manual Bank Transfer" },
                            { id: "pricing", label: "Pajak PB1 & Service Charge" },
                        ].map((sub) => (
                            <button
                                key={sub.id}
                                type="button"
                                onClick={() => setPgSubTab(sub.id as any)}
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    borderColor: pgSubTab === sub.id ? "#1e3a2f" : "#cbd5e1",
                                    background: pgSubTab === sub.id ? "#1e3a2f" : "#ffffff",
                                    color: pgSubTab === sub.id ? "#ffffff" : "#475569",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>

                    {/* Active Provider Selector */}
                    {pgSubTab === "provider" && (
                        <div>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h3 className={styles.sectionTitle}>Pilih Metode Pembayaran Aktif</h3>
                                    <p className={styles.sectionDesc}>
                                        Tentukan gateway yang memproses transaksi checkout tamu pada direct booking engine.
                                    </p>
                                </div>
                            </div>

                            <div className={styles.providerGrid} style={{ marginTop: "16px" }}>
                                {/* Manual Bank Transfer */}
                                <div
                                    onClick={() => setFormData((p) => ({ ...p, activeProvider: "manual" }))}
                                    className={`${styles.providerCard} ${formData.activeProvider === "manual" ? styles.providerCardActive : ""}`}
                                >
                                    <div>
                                        <div className={styles.providerCardTop}>
                                            <div className={styles.providerIconWrap}>
                                                <Bank size={24} weight="bold" />
                                            </div>
                                            {formData.activeProvider === "manual" ? (
                                                <span className={styles.badgeActiveRadio}>● Terpilih</span>
                                            ) : (
                                                <span className={styles.badgeInactiveRadio}>Pilih</span>
                                            )}
                                        </div>
                                        <h4 style={{ fontSize: "15px", fontWeight: 800, margin: "12px 0 4px 0" }}>Transfer Bank Manual</h4>
                                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                                            Transfer langsung ke rekening BCA / Mandiri / BNI resmi hotel tanpa potongan fee gateway.
                                        </p>
                                    </div>
                                </div>

                                {/* Midtrans */}
                                <div
                                    onClick={() => setFormData((p) => ({ ...p, activeProvider: "midtrans" }))}
                                    className={`${styles.providerCard} ${formData.activeProvider === "midtrans" ? styles.providerCardActive : ""}`}
                                >
                                    <div>
                                        <div className={styles.providerCardTop}>
                                            <div className={styles.providerIconWrap}>
                                                <CreditCard size={24} weight="bold" />
                                            </div>
                                            {formData.activeProvider === "midtrans" ? (
                                                <span className={styles.badgeActiveRadio}>● Terpilih</span>
                                            ) : (
                                                <span className={styles.badgeInactiveRadio}>Pilih</span>
                                            )}
                                        </div>
                                        <h4 style={{ fontSize: "15px", fontWeight: 800, margin: "12px 0 4px 0" }}>Midtrans Snap Gateway</h4>
                                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                                            Didukung QRIS, GoPay, ShopeePay, Virtual Account Bank otomatis, dan Kartu Kredit Visa/Mastercard.
                                        </p>
                                    </div>
                                </div>

                                {/* Xendit */}
                                <div
                                    onClick={() => setFormData((p) => ({ ...p, activeProvider: "xendit" }))}
                                    className={`${styles.providerCard} ${formData.activeProvider === "xendit" ? styles.providerCardActive : ""}`}
                                >
                                    <div>
                                        <div className={styles.providerCardTop}>
                                            <div className={styles.providerIconWrap}>
                                                <ShieldCheck size={24} weight="bold" />
                                            </div>
                                            {formData.activeProvider === "xendit" ? (
                                                <span className={styles.badgeActiveRadio}>● Terpilih</span>
                                            ) : (
                                                <span className={styles.badgeInactiveRadio}>Pilih</span>
                                            )}
                                        </div>
                                        <h4 style={{ fontSize: "15px", fontWeight: 800, margin: "12px 0 4px 0" }}>Xendit XenInvoice</h4>
                                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                                            Invoice checkout multi-saluran dengan konfirmasi pembayaran otomatis langsung ke PMS.
                                        </p>
                                    </div>
                                </div>

                                {/* DOKU (Jokul) */}
                                <div
                                    onClick={() => setFormData((p) => ({ ...p, activeProvider: "doku" }))}
                                    className={`${styles.providerCard} ${formData.activeProvider === "doku" ? styles.providerCardActive : ""}`}
                                >
                                    <div>
                                        <div className={styles.providerCardTop}>
                                            <div className={styles.providerIconWrap} style={{ background: "#fef2f2", color: "#dc2626" }}>
                                                <CreditCard size={24} weight="bold" />
                                            </div>
                                            {formData.activeProvider === "doku" ? (
                                                <span className={styles.badgeActiveRadio}>● Terpilih</span>
                                            ) : (
                                                <span className={styles.badgeInactiveRadio}>Pilih</span>
                                            )}
                                        </div>
                                        <h4 style={{ fontSize: "15px", fontWeight: 800, margin: "12px 0 4px 0" }}>DOKU Payment Gateway (Jokul)</h4>
                                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                                            Checkout hosted DOKU dengan QRIS, Virtual Account multi-bank, Kartu Kredit, OVO, dan DOKU Wallet.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Midtrans Config */}
                    {pgSubTab === "midtrans" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Environment Mode:</span>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((p) => ({
                                                ...p,
                                                midtrans: { ...p.midtrans, isProduction: false },
                                            }))
                                        }
                                        className={`${styles.btnAuditTrail} ${!formData.midtrans.isProduction ? styles.tabBtnActive : ""}`}
                                    >
                                        Sandbox (Testing)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((p) => ({
                                                ...p,
                                                midtrans: { ...p.midtrans, isProduction: true },
                                            }))
                                        }
                                        className={`${styles.btnAuditTrail} ${formData.midtrans.isProduction ? styles.tabBtnActive : ""}`}
                                    >
                                        Production (Live Transaksi)
                                    </button>
                                </div>
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Client Key:</span>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={formData.midtrans.clientKey}
                                        onChange={(e) =>
                                            setFormData((p) => ({
                                                ...p,
                                                midtrans: { ...p.midtrans, clientKey: e.target.value },
                                            }))
                                        }
                                        placeholder="SB-Mid-client-XXXX atau Mid-client-XXXX"
                                        className={styles.formInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Server Key (Rahasia):</span>
                                </div>
                                <div>
                                    <div style={{ display: "flex", gap: "8px", maxWidth: "460px" }}>
                                        <input
                                            type={showMidtransServerKey ? "text" : "password"}
                                            value={formData.midtrans.serverKey}
                                            onChange={(e) =>
                                                setFormData((p) => ({
                                                    ...p,
                                                    midtrans: { ...p.midtrans, serverKey: e.target.value },
                                                }))
                                            }
                                            placeholder="SB-Mid-server-XXXX atau Mid-server-XXXX"
                                            className={styles.formInput}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowMidtransServerKey(!showMidtransServerKey)}
                                            className={styles.btnAuditTrail}
                                        >
                                            {showMidtransServerKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Xendit Config */}
                    {pgSubTab === "xendit" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Environment Mode:</span>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((p) => ({
                                                ...p,
                                                xendit: { ...p.xendit, isProduction: false },
                                            }))
                                        }
                                        className={`${styles.btnAuditTrail} ${!formData.xendit.isProduction ? styles.tabBtnActive : ""}`}
                                    >
                                        Development (Test Mode)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((p) => ({
                                                ...p,
                                                xendit: { ...p.xendit, isProduction: true },
                                            }))
                                        }
                                        className={`${styles.btnAuditTrail} ${formData.xendit.isProduction ? styles.tabBtnActive : ""}`}
                                    >
                                        Production (Live Mode)
                                    </button>
                                </div>
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Public API Key:</span>
                                </div>
                                <div>
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
                                        className={styles.formInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Secret API Key (Rahasia):</span>
                                </div>
                                <div>
                                    <div style={{ display: "flex", gap: "8px", maxWidth: "460px" }}>
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
                                            className={styles.formInput}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowXenditSecretKey(!showXenditSecretKey)}
                                            className={styles.btnAuditTrail}
                                        >
                                            {showXenditSecretKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DOKU Config */}
                    {pgSubTab === "doku" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Environment Mode:</span>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((p) => ({
                                                ...p,
                                                doku: { ...p.doku, isProduction: false },
                                            }))
                                        }
                                        className={`${styles.btnAuditTrail} ${!formData.doku.isProduction ? styles.tabBtnActive : ""}`}
                                    >
                                        Sandbox (Testing)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((p) => ({
                                                ...p,
                                                doku: { ...p.doku, isProduction: true },
                                            }))
                                        }
                                        className={`${styles.btnAuditTrail} ${formData.doku.isProduction ? styles.tabBtnActive : ""}`}
                                    >
                                        Production (Live Transaksi)
                                    </button>
                                </div>
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Client ID (Mall ID):</span>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={formData.doku.clientId}
                                        onChange={(e) =>
                                            setFormData((p) => ({
                                                ...p,
                                                doku: { ...p.doku, clientId: e.target.value },
                                            }))
                                        }
                                        placeholder="Contoh: MALL-ID-XXXX atau CLIENT-ID-XXXX"
                                        className={styles.formInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Secret Key / Shared Key (Rahasia):</span>
                                </div>
                                <div>
                                    <div style={{ display: "flex", gap: "8px", maxWidth: "460px" }}>
                                        <input
                                            type={showDokuSecretKey ? "text" : "password"}
                                            value={formData.doku.secretKey}
                                            onChange={(e) =>
                                                setFormData((p) => ({
                                                    ...p,
                                                    doku: { ...p.doku, secretKey: e.target.value },
                                                }))
                                            }
                                            placeholder="SK-XXXX..."
                                            className={styles.formInput}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowDokuSecretKey(!showDokuSecretKey)}
                                            className={styles.btnAuditTrail}
                                        >
                                            {showDokuSecretKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>DOKU Notification URL (Webhook):</span>
                                </div>
                                <div>
                                    <div style={{ display: "flex", gap: "8px", maxWidth: "560px", alignItems: "center" }}>
                                        <input
                                            type="text"
                                            readOnly
                                            value={
                                                typeof window !== "undefined"
                                                    ? `${window.location.origin.replace(":3000", ":3002")}/api/payment-gateway/webhook/doku?hotelCode=${effectiveHotelCode}`
                                                    : `/api/payment-gateway/webhook/doku?hotelCode=${effectiveHotelCode}`
                                            }
                                            className={styles.formInput}
                                            style={{ background: "#f8fafc", color: "#64748b" }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = `${window.location.origin.replace(":3000", ":3002")}/api/payment-gateway/webhook/doku?hotelCode=${effectiveHotelCode}`;
                                                navigator.clipboard.writeText(url);
                                                alert("Webhook URL DOKU berhasil disalin!");
                                            }}
                                            className={styles.btnAuditTrail}
                                            title="Salin Webhook URL untuk Dashboard DOKU"
                                        >
                                            Salin URL
                                        </button>
                                    </div>
                                    <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>
                                        Tempel URL ini pada kolom <strong>Notification URL</strong> di Dashboard DOKU Merchant Anda.
                                    </p>
                                </div>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569" }}>
                                <strong style={{ display: "block", marginBottom: "4px", color: "#0f172a" }}>Informasi Endpoint API DOKU (Jokul):</strong>
                                <div>• Sandbox Base URL: <code>https://api-sandbox.doku.com</code></div>
                                <div>• Production Base URL: <code>https://api.doku.com</code></div>
                                <div>• Hosted Checkout Endpoint: <code>POST /checkout/v1/payment</code></div>
                            </div>
                        </div>
                    )}

                    {/* Manual Bank Accounts */}
                    {pgSubTab === "manual" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h4 style={{ fontSize: "14px", fontWeight: 800, margin: 0 }}>Daftar Rekening Bank Resmi Properti</h4>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>Tamu akan mentransfer ke nomor rekening yang Anda cantumkan di bawah ini.</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={addBankAccount}
                                    className={styles.btnAddBank}
                                >
                                    <Plus size={14} weight="bold" />
                                    <span>Tambah Rekening</span>
                                </button>
                            </div>

                            {formData.manualTransfer.banks.map((b) => (
                                <div key={b.id} className={styles.bankCard}>
                                    <div className={styles.bankCardHeader}>
                                        <span style={{ fontWeight: 800, fontSize: "13px" }}>{b.bankName || "Bank Baru"}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeBankAccount(b.id)}
                                            className={styles.btnRemoveBank}
                                        >
                                            <Trash size={14} />
                                            <span>Hapus Rekening</span>
                                        </button>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                                        <div>
                                            <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "4px" }}>Nama Bank</label>
                                            <input
                                                type="text"
                                                value={b.bankName}
                                                onChange={(e) => updateBank(b.id, "bankName", e.target.value)}
                                                placeholder="BCA / Mandiri / BNI / BRI"
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "4px" }}>Nomor Rekening</label>
                                            <input
                                                type="text"
                                                value={b.accountNumber}
                                                onChange={(e) => updateBank(b.id, "accountNumber", e.target.value)}
                                                placeholder="1234567890"
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "monospace" }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "4px" }}>Atas Nama Rekening</label>
                                            <input
                                                type="text"
                                                value={b.accountHolder}
                                                onChange={(e) => updateBank(b.id, "accountHolder", e.target.value)}
                                                placeholder="PT Hotel Indonesia / Nama Pemilik"
                                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pricing, PB1 & Service Charges */}
                    {pgSubTab === "pricing" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Pajak Daerah PB1 (%):</span>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={formData.pricing.taxRate}
                                        onChange={(e) =>
                                            setFormData((p) => ({
                                                ...p,
                                                pricing: { ...p.pricing, taxRate: parseFloat(e.target.value) || 0 },
                                            }))
                                        }
                                        className={styles.formInput}
                                        style={{ width: "120px" }}
                                    />
                                    <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "4px" }}>
                                        Standar PB1 di Indonesia: 10%
                                    </span>
                                </div>
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.fieldLabelCol}>
                                    <span>Service Charge (%):</span>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={formData.pricing.serviceRate}
                                        onChange={(e) =>
                                            setFormData((p) => ({
                                                ...p,
                                                pricing: { ...p.pricing, serviceRate: parseFloat(e.target.value) || 0 },
                                            }))
                                        }
                                        className={styles.formInput}
                                        style={{ width: "120px" }}
                                    />
                                    <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "4px" }}>
                                        Standar Service Charge Hotel Bintang 5: 10%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
