"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Globe,
    RefreshCw,
    Plus,
    Layers,
    Sliders,
    CheckCircle2,
    AlertTriangle,
    Shield,
    TrendingUp,
    ExternalLink,
    Zap,
    Lock,
    Play,
    Terminal,
    Send,
    Check,
    Building2,
    Key,
    Settings,
    HelpCircle,
    Copy,
    Save,
    Calculator,
    ArrowRight,
    Search,
    ChevronRight,
    X,
    Radio,
    DollarSign,
    Trash2,
    Unlink,
    RotateCcw,
    BedDouble,
    Activity,
    MessageSquare,
    Star,
    CreditCard,
    Receipt,
    UploadCloud
} from "lucide-react";
import styles from "./ChannelManager.module.css";
import { OtaLogo } from "./OtaLogo";
import { useAuth } from "@/context/AuthContext";
import { useRatePlans } from "@/lib/rate-plans/useRatePlans";
import { useRoomTypes } from "@/components/sections/rooms/useRoomTypes";
import { RoomTypeSection } from "@/components/sections/rooms/RoomTypeSection";
import { RatePlanSection } from "./RatePlanSection";
import { ChannelMessagesTab } from "./ChannelMessagesTab";
import { ChannelReviewsTab } from "./ChannelReviewsTab";
import { ChannelAvailabilityRulesTab } from "./ChannelAvailabilityRulesTab";
import { ChannelVccViewerModal } from "./ChannelVccViewerModal";
import { ChannelActionLogsTab } from "./ChannelActionLogsTab";
import { ChannelTaxesModal } from "./ChannelTaxesModal";
import { ChannelContentPushTab } from "./ChannelContentPushTab";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

export interface ChannelMappingConfig {
    channelCode: string;
    channelName: string;
    icon: string;
    hotelId: string; // Extranet Hotel ID
    currency: string;
    pricingModel: "gross" | "net"; // Gross (Sell Rate) or Net Rate
    commissionPercent: number; // e.g. 18% for Traveloka, 15% for Booking.com
    markupPercent: number; // Custom markup %
    isActive: boolean;
    roomMappings: Record<string, string>; // roomTypeId -> otaRoomId
    rateMappings: Record<string, string>; // ratePlanId -> otaRateId
}

// 68+ OTA Channels Catalog supported by Channex
const CHANNEX_OTA_CATALOG: Array<{ code: string; name: string; icon: string; defaultCommission: number; category: "ota" | "meta" | "wholesaler" | "vacation" }> = [
    { code: "booking_com", name: "Booking.com", icon: "🅱️", defaultCommission: 15, category: "ota" },
    { code: "agoda", name: "Agoda", icon: "🅰️", defaultCommission: 17, category: "ota" },
    { code: "traveloka", name: "Traveloka", icon: "🕊️", defaultCommission: 18, category: "ota" },
    { code: "tiket", name: "Tiket.com", icon: "🎫", defaultCommission: 15, category: "ota" },
    { code: "expedia", name: "Expedia Partner Solutions", icon: "✈️", defaultCommission: 18, category: "ota" },
    { code: "airbnb", name: "Airbnb", icon: "🏠", defaultCommission: 14, category: "vacation" },
    { code: "trip_com", name: "Trip.com / Ctrip", icon: "🌏", defaultCommission: 15, category: "ota" },
    { code: "google_hotel", name: "Google Hotel Ads (Free & Paid)", icon: "🇬", defaultCommission: 0, category: "meta" },
    { code: "hotelbeds", name: "Hotelbeds Bedbank", icon: "🏨", defaultCommission: 20, category: "wholesaler" },
    { code: "webbeds", name: "Webbeds Global", icon: "🌐", defaultCommission: 18, category: "wholesaler" },
    { code: "mg_bedbank", name: "MG Bedbank (Indonesia / SEA)", icon: "🇲", defaultCommission: 18, category: "wholesaler" },
    { code: "dida_travel", name: "Dida Travel", icon: "🇨🇳", defaultCommission: 15, category: "wholesaler" },
    { code: "klook", name: "Klook Travel", icon: "🎟️", defaultCommission: 15, category: "ota" },
    { code: "hostelworld", name: "Hostelworld", icon: "🎒", defaultCommission: 12, category: "ota" },
    { code: "hopper", name: "Hopper", icon: "🐰", defaultCommission: 15, category: "ota" },
    { code: "hoteltonight", name: "HotelTonight", icon: "🌙", defaultCommission: 15, category: "ota" },
    { code: "hrs", name: "HRS Corporate", icon: "🏢", defaultCommission: 15, category: "ota" },
    { code: "roibos", name: "Roibos B2B", icon: "💼", defaultCommission: 16, category: "wholesaler" },
    { code: "reconline", name: "Reconline GDS", icon: "📡", defaultCommission: 12, category: "wholesaler" },
    { code: "custom_engine", name: "Direct Booking Engine / Custom OTA", icon: "⚡", defaultCommission: 0, category: "meta" }
];

export function ChannelManagerSection() {
    const { activeHotelCode, activeHotelName, user } = useAuth();
    const { ratePlans, loading: loadingRates, saving: savingRates, updateRatePlan, seedDefaultRatePlans } = useRatePlans();
    const { roomTypes, loading: loadingRooms } = useRoomTypes();

    type ChannelTabType = "rooms" | "rateplans" | "matrix" | "mapping" | "catalog" | "rules" | "messages" | "reviews" | "logs" | "content" | "iframe" | "sandbox" | "golive" | "sync";
    const [activeTab, setActiveTab] = useState<ChannelTabType>("rooms");
    const [isVccModalOpen, setIsVccModalOpen] = useState<boolean>(false);
    const [isTaxesModalOpen, setIsTaxesModalOpen] = useState<boolean>(false);

    // Sync tab with URL query parameter ?tab=
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get("tab");
            if (tabParam && ["rooms", "rateplans", "matrix", "mapping", "catalog", "rules", "messages", "reviews", "logs", "content", "iframe", "sandbox", "golive", "sync"].includes(tabParam)) {
                setActiveTab(tabParam as any);
            }
        }
    }, []);

    const handleSelectTab = (tab: ChannelTabType) => {
        setActiveTab(tab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", tab);
            window.history.replaceState(null, "", url.toString());
        }
    };
    
    // Environment Switcher: Staging / Sandbox vs Live Production
    const [channexEnv, setChannexEnv] = useState<"staging" | "production">("staging");
    const [channexApiKey, setChannexApiKey] = useState<string>("");
    const [channexPropertyId, setChannexPropertyId] = useState<string>("");
    
    // Connected Channels Map
    const [channelConfigs, setChannelConfigs] = useState<Record<string, ChannelMappingConfig>>({});
    
    // UI state
    const [selectedChannelCode, setSelectedChannelCode] = useState<string>("booking_com");
    const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState<boolean>(false);
    const [channelSearchQuery, setChannelSearchQuery] = useState<string>("");
    const [savingSettings, setSavingSettings] = useState<boolean>(false);
    const [syncingAri, setSyncingAri] = useState<boolean>(false);
    const [syncingMaster, setSyncingMaster] = useState<boolean>(false);
    const [iframeUrl, setIframeUrl] = useState<string>("");
    const [loadingIframe, setLoadingIframe] = useState<boolean>(false);
    const [showApiKey, setShowApiKey] = useState<boolean>(false);

    // Global Display Toggle: Show Gross Price vs Net Price
    const [pricingViewMode, setPricingViewMode] = useState<"all" | "gross_only" | "net_only">("all");

    // Enterprise Hotel System Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: "disconnect" | "reset_mappings";
        channelCode: string;
        channelName: string;
    } | null>(null);

    // Live Activity Log
    const [syncLog, setSyncLog] = useState<Array<{ time: string; status: string; message: string }>>([
        {
            time: new Date().toLocaleTimeString(),
            status: "SUCCESS",
            message: "Sistem koneksi Channex 2-Way Enterprise siap melayani 68+ jaringan OTA."
        }
    ]);

    // Sandbox Simulator States
    const [simChannel, setSimChannel] = useState<string>("Booking.com");
    const [simGuestName, setSimGuestName] = useState<string>("Budi Santoso (Test Sandbox)");
    const [simGuestEmail, setSimGuestEmail] = useState<string>("budi.sandbox@test.com");
    const [simRoomTypeId, setSimRoomTypeId] = useState<string>("");
    const [simPrice, setSimPrice] = useState<number>(1250000);
    const [simCheckin, setSimCheckin] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [simCheckout, setSimCheckout] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split("T")[0];
    });
    const [simulating, setSimulating] = useState<boolean>(false);
    const [simulatedResult, setSimulatedResult] = useState<any>(null);

    // Test Ping Mapping State
    const [pingingMap, setPingingMap] = useState<Record<string, boolean>>({});

    const handlePingTest = async (type: "room_type" | "rate_plan", id: string, channexId?: string, otaId?: string) => {
        setPingingMap(prev => ({ ...prev, [id]: true }));
        try {
            const res = await fetch("/api/channex/ping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    type,
                    id,
                    channexId,
                    channelCode: selectedChannelCode,
                    otaId
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message || "Ping gagal");
            }
        } catch (err: any) {
            toast.error(`Koneksi Ping Error: ${err.message}`);
        } finally {
            setPingingMap(prev => ({ ...prev, [id]: false }));
        }
    };

    const copyText = (txt: string, label: string) => {
        if (!txt) return;
        navigator.clipboard.writeText(txt);
        toast.success(`${label} disalin ke clipboard!`);
    };

    // 1. Fetch Configuration from Firestore
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") return;

        const loadSettings = async () => {
            try {
                const docRef = doc(db, "hotels", activeHotelCode);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const cm = data.channelManager || {};
                    setChannexEnv(cm.env || "staging");
                    setChannexApiKey(cm.apiKey || "");
                    setChannexPropertyId(data.channexPropertyId || cm.channexPropertyId || "");

                    // Seed default connected channels if empty
                    const initialChannels: Record<string, ChannelMappingConfig> = {};
                    const savedChannels = cm.channels || {};

                    const defaultInitialCodes = ["booking_com", "agoda", "traveloka", "tiket", "expedia", "airbnb"];
                    defaultInitialCodes.forEach(code => {
                        const meta = CHANNEX_OTA_CATALOG.find(c => c.code === code);
                        initialChannels[code] = savedChannels[code] || {
                            channelCode: code,
                            channelName: meta?.name || code,
                            icon: meta?.icon || "🌐",
                            hotelId: "",
                            currency: "IDR",
                            pricingModel: "gross",
                            commissionPercent: meta?.defaultCommission || 15,
                            markupPercent: 0,
                            isActive: true,
                            roomMappings: {},
                            rateMappings: {}
                        };
                    });

                    // Add any other user-added channels
                    Object.keys(savedChannels).forEach(k => {
                        if (!initialChannels[k]) initialChannels[k] = savedChannels[k];
                    });

                    setChannelConfigs(initialChannels);
                }
            } catch (err) {
                console.error("Error loading channel settings:", err);
            }
        };

        loadSettings();
    }, [activeHotelCode]);

    useEffect(() => {
        if (roomTypes.length > 0 && !simRoomTypeId) {
            setSimRoomTypeId(roomTypes[0].id);
        }
    }, [roomTypes, simRoomTypeId]);

    // Active Connected Channels List
    const activeChannelsList = useMemo(() => {
        return Object.values(channelConfigs).filter(c => c.isActive);
    }, [channelConfigs]);

    // ── TWO-TIER CATEGORIZED NAVIGATION SYSTEM ──
    type ChannelCategoryType = "inventory" | "distribution" | "guest" | "system";

    const activeCategory = useMemo<ChannelCategoryType>(() => {
        if (["rooms", "rateplans", "matrix", "mapping"].includes(activeTab)) return "inventory";
        if (["catalog", "rules", "content"].includes(activeTab)) return "distribution";
        if (["messages", "reviews"].includes(activeTab)) return "guest";
        return "system";
    }, [activeTab]);

    const CATEGORY_DEFINITIONS = useMemo<Array<{
        id: ChannelCategoryType;
        label: string;
        badge?: string;
        tabs: Array<{ id: ChannelTabType; label: string }>;
    }>>(() => [
        {
            id: "inventory",
            label: "Inventori & Tarif",
            badge: "4",
            tabs: [
                { id: "rooms", label: "Kamar & Allotment" },
                { id: "rateplans", label: "Rate Plan & Paket" },
                { id: "matrix", label: "Matriks Harga (BAR)" },
                { id: "mapping", label: "Pemetaan ID Kamar" }
            ]
        },
        {
            id: "distribution",
            label: "Saluran OTA",
            badge: `${activeChannelsList.length} Aktif`,
            tabs: [
                { id: "catalog", label: `Katalog Saluran (${activeChannelsList.length})` },
                { id: "rules", label: "Aturan Yield & Alokasi" },
                { id: "content", label: "Konten Foto & Fasilitas" }
            ]
        },
        {
            id: "guest",
            label: "Layanan Tamu",
            badge: "2",
            tabs: [
                { id: "messages", label: "Pesan Tamu (Inbox)" },
                { id: "reviews", label: "Ulasan Tamu" }
            ]
        },
        {
            id: "system",
            label: "Sistem & Integrasi",
            badge: "5",
            tabs: [
                { id: "logs", label: "Audit Log Transmisi" },
                { id: "iframe", label: "Channex Hub" },
                { id: "sandbox", label: "Simulator Webhook" },
                { id: "golive", label: "Kredensial API" },
                { id: "sync", label: "Aktivitas Sinkronisasi" }
            ]
        }
    ], [activeChannelsList.length]);

    const handleSelectCategory = (catId: ChannelCategoryType) => {
        const cat = CATEGORY_DEFINITIONS.find(c => c.id === catId);
        if (cat && !cat.tabs.some(t => t.id === activeTab)) {
            handleSelectTab(cat.tabs[0].id);
        }
    };

    const activeCategoryDef = CATEGORY_DEFINITIONS.find(c => c.id === activeCategory) || CATEGORY_DEFINITIONS[0];

    // 2. Save All Settings & Mappings to Firestore
    const handleSaveAll = async () => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        setSavingSettings(true);
        try {
            const docRef = doc(db, "hotels", activeHotelCode);
            await updateDoc(docRef, {
                channexPropertyId,
                channelManager: {
                    env: channexEnv,
                    apiKey: channexApiKey,
                    channexPropertyId,
                    channels: channelConfigs,
                    isSyncActive: true,
                    updatedAt: new Date().toISOString()
                }
            });
            toast.success("Konfigurasi Komisi, Harga Net/Gross, & Pemetaan ID OTA Berhasil Disimpan!");
        } catch (err: any) {
            console.error("Error saving channels:", err);
            toast.error("Gagal menyimpan konfigurasi saluran.");
        } finally {
            setSavingSettings(false);
        }
    };

    // Helper: Update field in channel config
    const updateChannelField = (code: string, field: keyof ChannelMappingConfig, value: any) => {
        setChannelConfigs(prev => ({
            ...prev,
            [code]: {
                ...prev[code],
                [field]: value
            }
        }));
    };

    // Helper: Connect a new channel from catalog
    const handleConnectChannel = (catalogItem: typeof CHANNEX_OTA_CATALOG[0]) => {
        setChannelConfigs(prev => ({
            ...prev,
            [catalogItem.code]: {
                channelCode: catalogItem.code,
                channelName: catalogItem.name,
                icon: catalogItem.icon,
                hotelId: "",
                currency: "IDR",
                pricingModel: "gross",
                commissionPercent: catalogItem.defaultCommission,
                markupPercent: 0,
                isActive: true,
                roomMappings: {},
                rateMappings: {}
            }
        }));
        setSelectedChannelCode(catalogItem.code);
        setIsAddChannelModalOpen(false);
        toast.success(`Saluran ${catalogItem.name} berhasil ditambahkan! Silakan masukkan Hotel ID Extranet.`);
    };

    // Prompt helpers for Enterprise Confirmation Modal
    const promptDisconnectChannel = (code: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            type: "disconnect",
            channelCode: code,
            channelName: name
        });
    };

    const promptResetAllMappings = (code: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            type: "reset_mappings",
            channelCode: code,
            channelName: name
        });
    };

    // Execute the confirmed action
    const executeConfirmAction = () => {
        if (!confirmModal) return;
        const { type, channelCode, channelName } = confirmModal;

        if (type === "disconnect") {
            setChannelConfigs(prev => {
                const updated = { ...prev };
                if (updated[channelCode]) {
                    updated[channelCode] = {
                        ...updated[channelCode],
                        isActive: false
                    };
                }
                return updated;
            });

            // Switch active tab selection to another active channel if available
            const remaining = Object.values(channelConfigs).filter(c => c.channelCode !== channelCode && c.isActive);
            if (remaining.length > 0) {
                setSelectedChannelCode(remaining[0].channelCode);
            }
            toast.success(`Saluran ${channelName} berhasil diputuskan dan dinonaktifkan.`);
        } else if (type === "reset_mappings") {
            setChannelConfigs(prev => {
                const updated = { ...prev };
                if (updated[channelCode]) {
                    updated[channelCode] = {
                        ...updated[channelCode],
                        hotelId: "",
                        roomMappings: {},
                        rateMappings: {}
                    };
                }
                return updated;
            });
            toast.info(`Semua pemetaan ID untuk ${channelName} berhasil dikosongkan.`);
        }

        setConfirmModal(null);
    };

    // Helper: Clear single Room Type ID mapping
    const handleClearRoomMapping = (code: string, roomTypeId: string) => {
        setChannelConfigs(prev => {
            const updated = { ...prev };
            if (updated[code]?.roomMappings) {
                const newMappings = { ...updated[code].roomMappings };
                delete newMappings[roomTypeId];
                updated[code] = {
                    ...updated[code],
                    roomMappings: newMappings
                };
            }
            return updated;
        });
    };

    // Helper: Clear single Rate Plan ID mapping
    const handleClearRateMapping = (code: string, ratePlanId: string) => {
        setChannelConfigs(prev => {
            const updated = { ...prev };
            if (updated[code]?.rateMappings) {
                const newMappings = { ...updated[code].rateMappings };
                delete newMappings[ratePlanId];
                updated[code] = {
                    ...updated[code],
                    rateMappings: newMappings
                };
            }
            return updated;
        });
    };

    // Helper: Calculate Gross Rate from Net Rate and Commission / Markup
    const calculateGrossRate = (baseNetRate: number, commissionPercent: number, markupPercent: number, pricingModel: "gross" | "net") => {
        if (pricingModel === "net") {
            // Net Pricing: Push Net directly to OTA (OTA adds their own commission on top)
            return baseNetRate;
        }
        // Gross Pricing: Sell Rate = Net / (1 - comm%) or Net * (1 + markup%)
        const effectiveMarkup = markupPercent > 0 ? markupPercent : commissionPercent;
        if (effectiveMarkup >= 100) return baseNetRate * 2;
        return Math.round(baseNetRate / (1 - effectiveMarkup / 100));
    };

    // Helper: Calculate Net Received by Hotel from Gross Rate
    const calculateNetReceived = (grossRate: number, commissionPercent: number) => {
        return Math.round(grossRate * (1 - commissionPercent / 100));
    };

    const formatIDR = (val: number) => {
        return Number(val || 0).toLocaleString("id-ID");
    };

    // Load Iframe SSO URL
    const loadIframeUrl = async () => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        setLoadingIframe(true);
        try {
            const res = await fetch("/api/channex/auth-iframe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    username: user?.email || "Admin Setara"
                })
            });

            const data = await res.json();
            if (data.success && data.iframeUrl) {
                setIframeUrl(data.iframeUrl);
            } else {
                toast.error(data.error || "Gagal memuat layar Channel Mapping.");
            }
        } catch (err: any) {
            toast.error("Gagal menghubungkan ke Channex Channel Hub.");
        } finally {
            setLoadingIframe(false);
        }
    };

    useEffect(() => {
        if (activeTab === "iframe" && !iframeUrl) {
            loadIframeUrl();
        }
    }, [activeTab, activeHotelCode]);

    // Force Push All ARI to Channex
    const handleSyncAllAri = async () => {
        if (!activeHotelCode) return;
        setSyncingAri(true);
        try {
            const res = await fetch("/api/channex/sync-ari", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    type: "availability"
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Ketersediaan & Harga Berhasil Di-push ke Seluruh Saluran OTA!");
                setSyncLog(prev => [
                    {
                        time: new Date().toLocaleTimeString(),
                        status: "SUCCESS",
                        message: `Force Push ARI Sukses untuk Hotel [${activeHotelCode}] ke 68+ jaringan OTA.`
                    },
                    ...prev
                ]);
            } else {
                toast.error(data.error || "Gagal sinkronisasi ARI.");
            }
        } catch (err: any) {
            toast.error("Terjadi kesalahan jaringan saat sync ke Channex.");
        } finally {
            setSyncingAri(false);
        }
    };

    // Auto-Sync Room Types and Rate Plans from My Tara to Channex
    const handleSyncMasterToChannex = async () => {
        if (!activeHotelCode || activeHotelCode === "0") {
            toast.error("Pilih properti hotel terlebih dahulu.");
            return;
        }

        setSyncingMaster(true);
        const toastId = toast.loading("Mendaftarkan & menyinkronkan master tipe kamar & rate plan ke Channex...");

        try {
            const res = await fetch("/api/channex/sync-master", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hotelCode: activeHotelCode })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Gagal menyinkronkan data master ke Channex");
            }

            toast.success(data.message || "Master kamar & rate plan berhasil terdaftar di Channex!", { id: toastId });
            if (data.propertyId) {
                setChannexPropertyId(data.propertyId);
            }
            setSyncLog(prev => [{
                time: new Date().toLocaleTimeString(),
                status: "SUCCESS",
                message: `Sinkronisasi master sukses: ${data.totalLocalRooms} tipe kamar dan ${data.totalLocalRatePlans} rate plan otomatis terhubung ke Channex.`
            }, ...prev]);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Terjadi kesalahan saat menyinkronkan ke Channex", { id: toastId });
        } finally {
            setSyncingMaster(false);
        }
    };

    // Trigger Sandbox Test Booking Simulation
    const handleSimulateBooking = async (action: "create_booking" | "cancel_booking") => {
        if (!activeHotelCode) return;
        setSimulating(true);
        try {
            const res = await fetch("/api/channex/sandbox-simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    hotelCode: activeHotelCode,
                    channelName: simChannel,
                    guestName: simGuestName,
                    guestEmail: simGuestEmail,
                    roomTypeId: simRoomTypeId,
                    arrivalDate: simCheckin,
                    departureDate: simCheckout,
                    totalPrice: simPrice,
                    bookingIdToCancel: simulatedResult?.bookingId || undefined
                })
            });

            const data = await res.json();
            if (data.success) {
                setSimulatedResult(data);
                toast.success(data.message);
                setSyncLog(prev => [
                    {
                        time: new Date().toLocaleTimeString(),
                        status: "SUCCESS",
                        message: `[Sandbox Simulator] ${action === "create_booking" ? "Injeksi Reservasi Masuk" : "Pembatalan"} OTA ${simChannel} (${data.bookingId || "ACK"})`
                    },
                    ...prev
                ]);
            } else {
                toast.error(data.error || "Simulasi gagal dijalankan.");
            }
        } catch (err: any) {
            toast.error("Gagal menjalankan simulasi webhook.");
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* 1. TOP ENTERPRISE HEADER BAR */}
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h1 className={styles.systemTitle}>
                                <Globe size={18} style={{ color: "#2563eb" }} />
                                <span>Channex Channel Manager CRS</span>
                            </h1>
                            <span className={`${styles.systemBadge} ${channexEnv === "production" ? styles.systemBadgeProd : styles.systemBadgeStaging}`}>
                                {channexEnv === "production" ? "● LIVE PRODUCTION" : "● SANDBOX / STAGING"}
                            </span>
                        </div>
                        <div className={styles.systemMeta} style={{ marginTop: "3px" }}>
                            <span>Property Code: <b>{activeHotelCode}</b></span>
                            <span>•</span>
                            <span>Property UUID: <code>{channexPropertyId || "Auto-Provisioning"}</code></span>
                            <span>•</span>
                            <span>Active OTA Channels: <b>{activeChannelsList.length} Connected</b></span>
                        </div>
                    </div>
                </div>

                <div className={styles.topBarActions}>
                    <button
                        type="button"
                        onClick={() => setIsVccModalOpen(true)}
                        className={styles.btnActionSecondary}
                        style={{ borderLeft: "3px solid #0284c7" }}
                        title="Buka PCI Virtual Credit Card (VCC) Viewer untuk pencairan dana OTA"
                    >
                        <CreditCard size={14} color="#0284c7" />
                        <span>PCI VCC Viewer</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsTaxesModalOpen(true)}
                        className={styles.btnActionSecondary}
                        title="Atur Pajak PB1 & Service Charge Saluran OTA"
                    >
                        <Receipt size={14} />
                        <span>Pajak &amp; Service Charge</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsAddChannelModalOpen(true)}
                        className={styles.btnActionBlue}
                        title="Tambah koneksi saluran OTA baru dari katalog 68+ OTA Channex"
                    >
                        <Plus size={14} />
                        <span>+ Tambah Saluran OTA</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            handleSaveAll().catch(err => console.error("Error saving channels:", err));
                        }}
                        disabled={savingSettings}
                        className={styles.btnActionSecondary}
                        title="Simpan seluruh konfigurasi komisi, markup, dan mapping ke database"
                    >
                        <Save size={14} />
                        <span>{savingSettings ? "Menyimpan..." : "Simpan Semua Mapping"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSyncMasterToChannex}
                        disabled={syncingMaster}
                        className={styles.btnActionSecondary}
                        title="Otomatis daftarkan seluruh tipe kamar & rate plan My Tara ke Channex via API"
                    >
                        <RefreshCw size={14} className={syncingMaster ? "animate-spin" : ""} style={{ color: "#d97706" }} />
                        <span>{syncingMaster ? "Mendaftarkan Master..." : "Sync Kamar & Rate ke Channex"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            handleSyncAllAri().catch(err => console.error("Error syncing ARI:", err));
                        }}
                        disabled={syncingAri}
                        className={styles.btnActionPrimary}
                        title="Push seluruh ketersediaan kamar dan harga ke semua OTA"
                    >
                        <RefreshCw size={14} className={syncingAri ? "animate-spin" : ""} />
                        <span>{syncingAri ? "Menyinkronkan..." : "Force Push ARI ke OTA"}</span>
                    </button>
                </div>
            </div>

            {/* 2. ENTERPRISE NAVIGATION BAR (CLEAN TYPOGRAPHY, ZERO AI CLUTTER) */}
            <div className={styles.navContainer}>
                {/* Tier 1: Segmented Group Switcher */}
                <div className={styles.categoryNav}>
                    {CATEGORY_DEFINITIONS.map(cat => {
                        const isCatActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelectCategory(cat.id)}
                                className={`${styles.categoryTabItem} ${isCatActive ? styles.categoryTabItemActive : ""}`}
                            >
                                <span>{cat.label}</span>
                                <span className={styles.categoryBadge}>{cat.badge}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tier 2: Refined Underline Sub-Navigation */}
                <div className={styles.subTabsNav}>
                    {activeCategoryDef?.tabs.map(tabItem => {
                        const isTabActive = activeTab === tabItem.id;
                        return (
                            <button
                                key={tabItem.id}
                                type="button"
                                onClick={() => handleSelectTab(tabItem.id)}
                                className={`${styles.subTabItem} ${isTabActive ? styles.subTabItemActive : ""}`}
                            >
                                <span>{tabItem.label}</span>
                            </button>
                        );
                    })}

                    {/* Quick Jump Selector */}
                    <div className={styles.quickJumper}>
                        <span style={{ fontSize: "11px", color: "#a1a1aa" }}>Semua Modul:</span>
                        <select
                            value={activeTab}
                            onChange={e => handleSelectTab(e.target.value as ChannelTabType)}
                            className={styles.cellSelect}
                            style={{ height: "26px", fontSize: "11px", color: "#3f3f46", padding: "0 6px", background: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: "5px" }}
                        >
                            {CATEGORY_DEFINITIONS.map(cat => (
                                <optgroup key={cat.id} label={cat.label}>
                                    {cat.tabs.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* TAB 0: MASTER KATEGORI KAMAR & ALLOTMENT (ROOM TYPE INLINE SETUP) */}
            {activeTab === "rooms" && (
                <div className={styles.gridCard} style={{ padding: "20px 24px" }}>
                    <RoomTypeSection embedded={true} />
                </div>
            )}

            {/* TAB: MASTER RATE PLAN & PAKET HARGA (RATE PLAN INLINE SETUP) */}
            {activeTab === "rateplans" && (
                <div className={styles.gridCard} style={{ padding: "20px 24px" }}>
                    <RatePlanSection embedded={true} />
                </div>
            )}

            {/* TAB 1: MATRIKS DISTRIBUSI HARGA NET VS GROSS & KOMISI OTA (EXCEL / DSI / VSP GRID) */}
            {activeTab === "matrix" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                                📊 Matriks Perhitungan Harga Kamar Multi-Channel:
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                                Bandingkan harga dasar Net PMS dengan harga jual Gross di setiap OTA berdasarkan persentase komisi masing-masing saluran.
                            </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Tampilan Kolom:</span>
                            <select
                                value={pricingViewMode}
                                onChange={e => setPricingViewMode(e.target.value as any)}
                                className={styles.cellSelect}
                                style={{ height: "28px" }}
                            >
                                <option value="all">Semua (Harga Net + Komisi + Harga Gross)</option>
                                <option value="gross_only">Harga Gross Jual OTA Saja</option>
                                <option value="net_only">Harga Net Diterima Hotel Saja</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.dsiTable}>
                            <thead>
                                <tr>
                                    <th rowSpan={2} className={`${styles.dsiTh} ${styles.colStickyLeft}`} style={{ width: "240px", minWidth: "240px" }}>
                                        Tipe Kamar &amp; Rate Plan
                                    </th>
                                    <th rowSpan={2} className={styles.dsiTh} style={{ width: "130px", minWidth: "130px", backgroundColor: "#f8fafc" }}>
                                        Base Net Rate (PMS)
                                    </th>

                                    {/* Group Header for each active channel */}
                                    {activeChannelsList.map(ch => (
                                        <th
                                            key={ch.channelCode}
                                            colSpan={pricingViewMode === "all" ? 3 : 1}
                                            className={styles.dsiThGroup}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                <OtaLogo code={ch.channelCode} name={ch.channelName} size={18} />
                                                <span>{ch.channelName}</span>
                                                <span style={{ fontSize: "10px", fontWeight: 600, color: "#2563eb" }}>
                                                    ({ch.pricingModel === "gross" ? `Gross [Comm: ${ch.commissionPercent}%]` : "Net Direct"})
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>

                                <tr>
                                    {activeChannelsList.map(ch => (
                                        <React.Fragment key={`${ch.channelCode}_sub`}>
                                            {pricingViewMode === "all" && (
                                                <>
                                                    <th className={styles.dsiTh} style={{ width: "80px", minWidth: "80px" }}>Komisi %</th>
                                                    <th className={styles.dsiTh} style={{ width: "80px", minWidth: "80px" }}>Markup %</th>
                                                    <th className={styles.dsiTh} style={{ width: "130px", minWidth: "130px", color: "#16a34a" }}>Harga Jual OTA</th>
                                                </>
                                            )}
                                            {pricingViewMode === "gross_only" && (
                                                <th className={styles.dsiTh} style={{ width: "130px", minWidth: "130px", color: "#16a34a" }}>Harga Jual OTA</th>
                                            )}
                                            {pricingViewMode === "net_only" && (
                                                <th className={styles.dsiTh} style={{ width: "130px", minWidth: "130px", color: "#0f172a" }}>Net Hotel</th>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {ratePlans.length === 0 ? (
                                    <tr>
                                        <td colSpan={2 + activeChannelsList.length * 3} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                                <span>Belum ada Rate Plan yang terdaftar untuk properti ini.</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectTab("rateplans")}
                                                    style={{
                                                        padding: "7px 16px",
                                                        background: "#1e3a2f",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    + Buka Master Rate Plan &amp; Buat Paket Harga
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    ratePlans.map(rp => {
                                        const baseNet = Number(rp.baseRate || 0);

                                        return (
                                            <tr key={rp.id} className={styles.dsiRow}>
                                                <td className={`${styles.colStickyLeft}`}>
                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{rp.name}</span>
                                                        <span style={{ fontSize: "10px", color: "#64748b" }}>
                                                            {rp.roomTypeName} • {rp.mealsIncluded ? "Breakfast" : "Room Only"}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className={`${styles.cellMoney} ${styles.cellMoneyNet}`} style={{ backgroundColor: "#fafaf9" }}>
                                                    Rp {formatIDR(baseNet)}
                                                </td>

                                                {/* Calculated Channel Columns */}
                                                {activeChannelsList.map(ch => {
                                                    const comm = Number(ch.commissionPercent || 0);
                                                    const markup = Number(ch.markupPercent || 0);
                                                    const calculatedGross = calculateGrossRate(baseNet, comm, markup, ch.pricingModel);
                                                    const calculatedNet = calculateNetReceived(calculatedGross, comm);

                                                    return (
                                                        <React.Fragment key={`${rp.id}_${ch.channelCode}`}>
                                                            {pricingViewMode === "all" && (
                                                                <>
                                                                    <td className={styles.cellPercent}>
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            max={50}
                                                                            value={ch.commissionPercent}
                                                                            onChange={e => updateChannelField(ch.channelCode, "commissionPercent", Number(e.target.value) || 0)}
                                                                            className={styles.cellInput}
                                                                            style={{ width: "55px", textAlign: "center" }}
                                                                        />
                                                                        %
                                                                    </td>
                                                                    <td className={styles.cellPercent}>
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            max={100}
                                                                            value={ch.markupPercent}
                                                                            onChange={e => updateChannelField(ch.channelCode, "markupPercent", Number(e.target.value) || 0)}
                                                                            className={styles.cellInput}
                                                                            style={{ width: "55px", textAlign: "center" }}
                                                                        />
                                                                        %
                                                                    </td>
                                                                    <td className={`${styles.cellMoney} ${styles.cellMoneyGross}`} title={`Net Diterima Hotel: Rp ${formatIDR(calculatedNet)}`}>
                                                                        Rp {formatIDR(calculatedGross)}
                                                                    </td>
                                                                </>
                                                            )}
                                                            {pricingViewMode === "gross_only" && (
                                                                <td className={`${styles.cellMoney} ${styles.cellMoneyGross}`}>
                                                                    Rp {formatIDR(calculatedGross)}
                                                                </td>
                                                            )}
                                                            {pricingViewMode === "net_only" && (
                                                                <td className={`${styles.cellMoney} ${styles.cellMoneyNet}`}>
                                                                    Rp {formatIDR(calculatedNet)}
                                                                </td>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: PEMETAAN ID EXTRANET OTA (ROOM ID & RATE PLAN ID MAPPING) */}
            {activeTab === "mapping" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                🔑 Konfigurasi 1-to-1 Mapping ID Extranet OTA:
                            </span>
                            <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                Masukkan <b>Hotel ID Extranet</b>, <b>Room ID</b>, dan <b>Rate Plan ID</b> dari masing-masing OTA untuk sinkronisasi akurat 2-arah.
                            </p>
                        </div>

                        {/* Selected Channel Switcher */}
                        <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                            {activeChannelsList.map(ch => (
                                <button
                                    key={ch.channelCode}
                                    type="button"
                                    onClick={() => setSelectedChannelCode(ch.channelCode)}
                                    className={`${styles.navTabItem} ${selectedChannelCode === ch.channelCode ? styles.navTabItemActive : ""}`}
                                    style={{ border: "1px solid #cbd5e1" }}
                                >
                                    <OtaLogo code={ch.channelCode} name={ch.channelName} size={16} />
                                    <span>{ch.channelName}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mapping Form for Selected Channel */}
                    {channelConfigs[selectedChannelCode] && (
                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                            {/* Active Channel Header & Disconnect Controls */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", padding: "12px 14px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <OtaLogo code={channelConfigs[selectedChannelCode].channelCode} name={channelConfigs[selectedChannelCode].channelName} size={24} />
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                                {channelConfigs[selectedChannelCode].channelName}
                                            </span>
                                            <span className={`${styles.badge} ${styles.badgeActive}`}>Terkoneksi Aktif</span>
                                        </div>
                                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                                            Hotel ID Extranet: <b>{channelConfigs[selectedChannelCode].hotelId || "(Belum terisi)"}</b> • Komisi Standar: <b>{channelConfigs[selectedChannelCode].commissionPercent}%</b>
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => promptResetAllMappings(selectedChannelCode, channelConfigs[selectedChannelCode].channelName)}
                                        className={styles.btnActionWarning}
                                        title="Kosongkan seluruh Room ID dan Rate ID untuk saluran ini"
                                    >
                                        <RotateCcw size={13} />
                                        <span>Kosongkan Semua Pemetaan ID</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => promptDisconnectChannel(selectedChannelCode, channelConfigs[selectedChannelCode].channelName)}
                                        className={styles.btnActionDanger}
                                        title="Putuskan dan nonaktifkan saluran OTA ini"
                                    >
                                        <Trash2 size={13} />
                                        <span>Putuskan / Hapus Saluran Ini</span>
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                                        Hotel ID di Extranet {channelConfigs[selectedChannelCode].channelName}
                                    </label>
                                    <input
                                        type="text"
                                        value={channelConfigs[selectedChannelCode].hotelId}
                                        onChange={e => updateChannelField(selectedChannelCode, "hotelId", e.target.value)}
                                        placeholder="Contoh: 1084920"
                                        className={styles.cellInput}
                                        style={{ height: "32px", fontSize: "12px", textAlign: "left" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                                        Model Penetapan Harga (Pricing Mode)
                                    </label>
                                    <select
                                        value={channelConfigs[selectedChannelCode].pricingModel}
                                        onChange={e => updateChannelField(selectedChannelCode, "pricingModel", e.target.value)}
                                        className={styles.cellSelect}
                                        style={{ height: "32px", width: "100%" }}
                                    >
                                        <option value="gross">Gross Rate (Harga Jual Konsumen di OTA)</option>
                                        <option value="net">Net Rate (Harga Bersih Diterima Hotel)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                                        Komisi Standar OTA (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={channelConfigs[selectedChannelCode].commissionPercent}
                                        onChange={e => updateChannelField(selectedChannelCode, "commissionPercent", Number(e.target.value) || 0)}
                                        className={styles.cellInput}
                                        style={{ height: "32px", fontSize: "12px", textAlign: "left" }}
                                    />
                                </div>
                            </div>

                            {/* Room Mapping Sub-Table */}
                            <div>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", marginBottom: "6px", display: "block" }}>
                                    1. Pemetaan ID Tipe Kamar (Room Type ID):
                                </span>
                                <table className={styles.dsiTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.dsiTh}>Tipe Kamar & ID PMS</th>
                                            <th className={styles.dsiTh}>Channex Room UUID</th>
                                            <th className={styles.dsiTh}>Room ID di Extranet {channelConfigs[selectedChannelCode].channelName}</th>
                                            <th className={styles.dsiTh} style={{ textAlign: "center", width: "180px" }}>Status & Uji Koneksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roomTypes.map(rt => {
                                            const val = channelConfigs[selectedChannelCode]?.roomMappings?.[rt.id] || "";
                                            return (
                                                <tr key={rt.id} className={styles.dsiRow}>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{rt.name}</div>
                                                        <div className={styles.idList}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rt.id, "PMS Room ID")}
                                                                className={styles.idPill}
                                                                title="Klik untuk salin PMS Room ID"
                                                            >
                                                                <span>PMS: {rt.id}</span>
                                                                <Copy size={10} style={{ opacity: 0.6 }} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {rt.channexRoomTypeId ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rt.channexRoomTypeId!, "Channex Room UUID")}
                                                                className={`${styles.idPill} ${styles.idPillChannex}`}
                                                                title="Klik untuk salin Channex Room UUID"
                                                            >
                                                                <span>{rt.channexRoomTypeId}</span>
                                                                <Copy size={10} style={{ opacity: 0.6 }} />
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                                                                Belum disinkronkan ke Channex
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <input
                                                                type="text"
                                                                value={val}
                                                                onChange={e => {
                                                                    const newVal = e.target.value;
                                                                    setChannelConfigs(prev => ({
                                                                        ...prev,
                                                                        [selectedChannelCode]: {
                                                                            ...prev[selectedChannelCode],
                                                                            roomMappings: {
                                                                                ...(prev[selectedChannelCode]?.roomMappings || {}),
                                                                                [rt.id]: newVal
                                                                            }
                                                                        }
                                                                    }));
                                                                }}
                                                                placeholder={`Room ID di ${channelConfigs[selectedChannelCode].channelName}`}
                                                                className={styles.cellInput}
                                                                style={{ height: "28px", textAlign: "left", maxWidth: "260px", flex: 1 }}
                                                            />
                                                            {val && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleClearRoomMapping(selectedChannelCode, rt.id)}
                                                                    className={styles.btnIconClear}
                                                                    title="Hapus ID Kamar ini"
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                                                            {val ? (
                                                                <span className={`${styles.badge} ${styles.badgeActive}`}>Terpetakan</span>
                                                            ) : (
                                                                <span className={`${styles.badge} ${styles.badgeInactive}`}>Belum Ada ID</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePingTest("room_type", rt.id, rt.channexRoomTypeId, val)}
                                                                disabled={pingingMap[rt.id]}
                                                                className={styles.btnPing}
                                                                title="Uji koneksi ping ke Channex untuk Room Type ini"
                                                            >
                                                                <Activity size={12} className={pingingMap[rt.id] ? "animate-spin" : ""} />
                                                                <span>{pingingMap[rt.id] ? "Pinging..." : "Test Ping"}</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Rate Plan Mapping Sub-Table */}
                            <div>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", marginBottom: "6px", display: "block" }}>
                                    2. Pemetaan ID Rate Plan (Rate Plan ID):
                                </span>
                                <table className={styles.dsiTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.dsiTh}>Nama Rate Plan & ID PMS</th>
                                            <th className={styles.dsiTh}>Tipe Kamar & Channex UUID</th>
                                            <th className={styles.dsiTh}>Rate Plan ID di Extranet {channelConfigs[selectedChannelCode].channelName}</th>
                                            <th className={styles.dsiTh} style={{ textAlign: "center", width: "180px" }}>Status & Uji Koneksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ratePlans.map(rp => {
                                            const val = channelConfigs[selectedChannelCode]?.rateMappings?.[rp.id] || "";
                                            return (
                                                <tr key={rp.id} className={styles.dsiRow}>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{rp.name}</div>
                                                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>Kode: {rp.code}</div>
                                                        <div className={styles.idList}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rp.id, "PMS Rate Plan ID")}
                                                                className={styles.idPill}
                                                                title="Klik untuk salin PMS Rate Plan ID"
                                                            >
                                                                <span>PMS: {rp.id}</span>
                                                                <Copy size={10} style={{ opacity: 0.6 }} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 500, fontSize: "12px", color: "#334155", marginBottom: "3px" }}>
                                                            {rp.roomTypeName || rp.roomTypeId}
                                                        </div>
                                                        {rp.channexRatePlanId ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rp.channexRatePlanId!, "Channex Rate UUID")}
                                                                className={`${styles.idPill} ${styles.idPillChannex}`}
                                                                title="Klik untuk salin Channex Rate UUID"
                                                            >
                                                                <span>{rp.channexRatePlanId}</span>
                                                                <Copy size={10} style={{ opacity: 0.6 }} />
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                                                                Belum disinkronkan ke Channex
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <input
                                                                type="text"
                                                                value={val}
                                                                onChange={e => {
                                                                    const newVal = e.target.value;
                                                                    setChannelConfigs(prev => ({
                                                                        ...prev,
                                                                        [selectedChannelCode]: {
                                                                            ...prev[selectedChannelCode],
                                                                            rateMappings: {
                                                                                ...(prev[selectedChannelCode]?.rateMappings || {}),
                                                                                [rp.id]: newVal
                                                                            }
                                                                        }
                                                                    }));
                                                                }}
                                                                placeholder={`Rate ID di ${channelConfigs[selectedChannelCode].channelName}`}
                                                                className={styles.cellInput}
                                                                style={{ height: "28px", textAlign: "left", maxWidth: "260px", flex: 1 }}
                                                            />
                                                            {val && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleClearRateMapping(selectedChannelCode, rp.id)}
                                                                    className={styles.btnIconClear}
                                                                    title="Hapus ID Rate Plan ini"
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                                                            {val ? (
                                                                <span className={`${styles.badge} ${styles.badgeActive}`}>Terpetakan</span>
                                                            ) : (
                                                                <span className={`${styles.badge} ${styles.badgeInactive}`}>Belum Ada ID</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePingTest("rate_plan", rp.id, rp.channexRatePlanId, val)}
                                                                disabled={pingingMap[rp.id]}
                                                                className={styles.btnPing}
                                                                title="Uji koneksi ping ke Channex untuk Rate Plan ini"
                                                            >
                                                                <Activity size={12} className={pingingMap[rp.id] ? "animate-spin" : ""} />
                                                                <span>{pingingMap[rp.id] ? "Pinging..." : "Test Ping"}</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: KATALOG 68+ SALURAN OTA (+ TAMBAH SALURAN BARU) */}
            {activeTab === "catalog" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                🌐 Katalog Saluran OTA Global (Didukung oleh Channex):
                            </span>
                            <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                Aktifkan atau nonaktifkan saluran penjualan OTA untuk properti ini.
                            </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="text"
                                value={channelSearchQuery}
                                onChange={e => setChannelSearchQuery(e.target.value)}
                                placeholder="Cari nama OTA..."
                                className={styles.cellInput}
                                style={{ width: "200px", height: "30px", textAlign: "left" }}
                            />
                        </div>
                    </div>

                    <div className={styles.channelsGrid}>
                        {CHANNEX_OTA_CATALOG
                            .filter(ch => ch.name.toLowerCase().includes(channelSearchQuery.toLowerCase()))
                            .map(ch => {
                                const isConnected = Boolean(channelConfigs[ch.code]?.isActive);
                                const hotelId = channelConfigs[ch.code]?.hotelId || "";

                                return (
                                    <div key={ch.code} className={styles.channelCard}>
                                        <div className={styles.channelCardHeader}>
                                            <div className={styles.channelCardTitle}>
                                                <OtaLogo code={ch.code} name={ch.name} size={22} />
                                                <span>{ch.name}</span>
                                            </div>

                                            {isConnected ? (
                                                <span className={`${styles.badge} ${styles.badgeActive}`}>Terkoneksi</span>
                                            ) : (
                                                <span className={`${styles.badge} ${styles.badgeInactive}`}>Non-Aktif</span>
                                            )}
                                        </div>

                                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                                            <span>Komisi Standar: <b>{ch.defaultCommission}%</b></span>
                                            <span style={{ margin: "0 6px" }}>•</span>
                                            <span>Kategori: <b>{ch.category.toUpperCase()}</b></span>
                                        </div>

                                        {isConnected && hotelId && (
                                            <div style={{ fontSize: "11px", color: "#0f172a", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontFamily: "monospace" }}>
                                                Hotel ID: {hotelId}
                                            </div>
                                        )}

                                        <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "8px" }}>
                                            {isConnected ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedChannelCode(ch.code);
                                                            setActiveTab("mapping");
                                                        }}
                                                        className={styles.btnActionSecondary}
                                                        style={{ flex: 1, justifyContent: "center" }}
                                                    >
                                                        Kelola Pemetaan ID
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => promptDisconnectChannel(ch.code, ch.name)}
                                                        className={styles.btnActionDanger}
                                                        style={{ justifyContent: "center" }}
                                                        title="Putuskan saluran ini"
                                                    >
                                                        <Unlink size={13} />
                                                        <span>Putuskan</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleConnectChannel(ch)}
                                                    className={styles.btnActionBlue}
                                                    style={{ flex: 1, justifyContent: "center" }}
                                                >
                                                    + Hubungkan Saluran
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* TAB: ATURAN ALOKASI SALURAN (YIELD MANAGEMENT & OVERRIDES) */}
            {activeTab === "rules" && (
                <div className={styles.gridCard} style={{ padding: "20px 24px" }}>
                    <ChannelAvailabilityRulesTab hotelCode={activeHotelCode} roomTypes={roomTypes} />
                </div>
            )}

            {/* TAB: UNIFIED GUEST MESSAGING INBOX */}
            {activeTab === "messages" && (
                <div className={styles.gridCard} style={{ padding: "20px 24px" }}>
                    <ChannelMessagesTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: UNIFIED OTA GUEST REVIEWS & RATINGS */}
            {activeTab === "reviews" && (
                <div className={styles.gridCard} style={{ padding: "20px 24px" }}>
                    <ChannelReviewsTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: REAL-TIME TASK & ACTION DIAGNOSTICS LOG */}
            {activeTab === "logs" && (
                <div className={styles.gridCard} style={{ padding: "20px 24px" }}>
                    <ChannelActionLogsTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: DISTRIBUSI KONTEN & FASILITAS HOTEL */}
            {activeTab === "content" && (
                <div className={styles.gridCard} style={{ padding: "20px 24px" }}>
                    <ChannelContentPushTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB 4: CHANNEX WHITE-LABEL MAPPING HUB (IFRAME) */}
            {activeTab === "iframe" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                🖥️ Channex White-Label Mapping Hub (Embedded SSO):
                            </span>
                            <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                Antarmuka mapping visual resmi bawaan Channex untuk mengaktifkan saluran OTA secara langsung.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                loadIframeUrl().catch(err => console.error("Error loading iframe:", err));
                            }}
                            className={styles.btnActionSecondary}
                        >
                            <RefreshCw size={13} />
                            <span>Muat Ulang Layar Hub</span>
                        </button>
                    </div>

                    <div style={{ padding: "16px" }}>
                        {loadingIframe ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "480px", gap: "12px", color: "#64748b" }}>
                                <RefreshCw size={24} className="animate-spin" />
                                <span>Menghubungkan sesi aman SSO ke Channex Channel Hub...</span>
                            </div>
                        ) : iframeUrl ? (
                            <iframe
                                src={iframeUrl}
                                style={{ width: "100%", height: "720px", border: "1px solid #cbd5e1", borderRadius: "8px" }}
                                title="Channex White-Label Channel Mapping"
                            />
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", gap: "12px", textAlign: "center" }}>
                                <AlertTriangle size={32} color="#f59e0b" />
                                <span>Belum ada URL sesi mapping Channex.</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        loadIframeUrl().catch(err => console.error("Error generating token:", err));
                                    }}
                                    className={styles.btnActionPrimary}
                                >
                                    Generate Token &amp; Buka Layar Mapping
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 5: SANDBOX OTA SIMULATOR & TESTING CONSOLE */}
            {activeTab === "sandbox" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                🧪 Sandbox OTA Webhook Ingestion &amp; Anti-Overbooking Tester:
                            </span>
                            <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                Simulasikan reservasi masuk dari Traveloka, Booking.com, Agoda, Tiket.com, dan verifikasi otomatisasi pemotongan stok kamar.
                            </p>
                        </div>
                    </div>

                    <div className={styles.sandboxLayout}>
                        {/* Simulation Form */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                                1. Konfigurasi Reservasi Uji Coba:
                            </span>

                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Saluran OTA Sumber:</label>
                                <select
                                    value={simChannel}
                                    onChange={e => setSimChannel(e.target.value)}
                                    className={styles.cellSelect}
                                    style={{ width: "100%", height: "32px", marginTop: "4px" }}
                                >
                                    <option value="Booking.com">Booking.com</option>
                                    <option value="Agoda">Agoda</option>
                                    <option value="Traveloka">Traveloka</option>
                                    <option value="Tiket.com">Tiket.com</option>
                                    <option value="Expedia">Expedia</option>
                                    <option value="Airbnb">Airbnb</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Tipe Kamar yang Dipesan:</label>
                                <select
                                    value={simRoomTypeId}
                                    onChange={e => setSimRoomTypeId(e.target.value)}
                                    className={styles.cellSelect}
                                    style={{ width: "100%", height: "32px", marginTop: "4px" }}
                                >
                                    {roomTypes.map(rt => (
                                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Check-in:</label>
                                    <input
                                        type="date"
                                        value={simCheckin}
                                        onChange={e => setSimCheckin(e.target.value)}
                                        className={styles.cellInput}
                                        style={{ height: "32px", textAlign: "left", marginTop: "4px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Check-out:</label>
                                    <input
                                        type="date"
                                        value={simCheckout}
                                        onChange={e => setSimCheckout(e.target.value)}
                                        className={styles.cellInput}
                                        style={{ height: "32px", textAlign: "left", marginTop: "4px" }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Nama Tamu Uji Coba:</label>
                                <input
                                    type="text"
                                    value={simGuestName}
                                    onChange={e => setSimGuestName(e.target.value)}
                                    className={styles.cellInput}
                                    style={{ height: "32px", textAlign: "left", marginTop: "4px" }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Total Harga Reservasi (Rp):</label>
                                <input
                                    type="number"
                                    value={simPrice}
                                    onChange={e => setSimPrice(Number(e.target.value) || 0)}
                                    className={styles.cellInput}
                                    style={{ height: "32px", textAlign: "left", marginTop: "4px" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSimulateBooking("create_booking").catch(err => console.error("Simulation error:", err));
                                    }}
                                    disabled={simulating}
                                    className={styles.btnActionBlue}
                                    style={{ flex: 1, justifyContent: "center", height: "36px" }}
                                >
                                    <Send size={14} />
                                    <span>{simulating ? "Mengirim Webhook..." : "Injeksi Reservasi Baru"}</span>
                                </button>

                                {simulatedResult?.bookingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSimulateBooking("cancel_booking").catch(err => console.error("Cancel simulation error:", err));
                                        }}
                                        disabled={simulating}
                                        className={styles.btnActionSecondary}
                                        style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                                    >
                                        Simulasi Batalkan
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Diagnostics / Webhook Response Terminal */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                                2. Status Webhook &amp; Respons Sistem My Tara PMS:
                            </span>

                            {simulatedResult ? (
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: 700, marginBottom: "8px", fontSize: "12px" }}>
                                        <CheckCircle2 size={16} />
                                        <span>{simulatedResult.message}</span>
                                    </div>
                                    <div className={styles.consoleBox}>
                                        {JSON.stringify(simulatedResult, null, 2)}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.consoleBox} style={{ height: "320px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", textAlign: "center" }}>
                                    <Terminal size={32} style={{ color: "#64748b", marginBottom: "8px" }} />
                                    <span>Siap menerima simulasi webhook.</span>
                                    <span style={{ fontSize: "10px", marginTop: "4px" }}>
                                        Klik tombol "Injeksi Reservasi Baru" untuk menguji pembuatan reservasi di Front Office &amp; pemotongan stok otomatis di Rate &amp; Inventory.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: KONFIGURASI AKUN & API CHANNEX (SANDBOX & PRODUCTION) */}
            {activeTab === "golive" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                ⚙️ Konfigurasi Kredensial API &amp; Akun Channex Channel Manager:
                            </span>
                            <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                Kelola API Key, URL Webhook, serta alihkan sistem antara mode Sandbox (Pengujian) dan Production (Live 68+ OTA).
                            </p>
                        </div>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* 1. Mode Lingkungan (Environment Selector) */}
                        <div style={{ background: channexEnv === "production" ? "#f0fdf4" : "#eff6ff", border: `1px solid ${channexEnv === "production" ? "#86efac" : "#bfdbfe"}`, borderRadius: "8px", padding: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span className={`${styles.badge} ${channexEnv === "production" ? styles.badgeActive : styles.badgeInfo}`}>
                                            {channexEnv === "production" ? "PRODUCTION (LIVE)" : "SANDBOX (TESTING)"}
                                        </span>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: channexEnv === "production" ? "#15803d" : "#1d4ed8" }}>
                                            Mode Server: {channexEnv === "production" ? "https://api.channex.io (Live)" : "https://staging.channex.io (Sandbox)"}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "11px", color: "#475569", margin: "4px 0 0 0" }}>
                                        {channexEnv === "production"
                                            ? "Sistem terhubung ke server produksi Channex komersial untuk mendistribusikan harga & kamar riil."
                                            : "Sistem berada dalam mode Sandbox / Staging gratis untuk menguji pemetaan kamar dan simulasi booking tanpa biaya."}
                                    </p>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const target = channexEnv === "staging" ? "production" : "staging";
                                            setChannexEnv(target);
                                            toast.info(`Lingkungan dialihkan ke ${target.toUpperCase()}. Klik 'Simpan Konfigurasi' di bawah untuk menerapkan.`);
                                        }}
                                        className={channexEnv === "production" ? styles.btnActionSecondary : styles.btnActionPrimary}
                                        style={{ height: "34px", padding: "0 14px", fontSize: "11px" }}
                                    >
                                        <ArrowRight size={13} />
                                        <span>Alihkan ke Mode {channexEnv === "staging" ? "Production Live" : "Sandbox Staging"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. Formulir Kredensial API Key & Property ID */}
                        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                                <Key size={16} style={{ color: "#2563eb" }} />
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                    Formulir Input API Key &amp; Identitas Properti Channex
                                </span>
                            </div>

                            {/* Field A: User API Key */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                                        Channex User API Key: <span style={{ color: "#dc2626" }}>*</span>
                                    </label>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                        {channexEnv === "production" ? (
                                            <>Ambil dari: <a href="https://app.channex.io" target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>app.channex.io &gt; Settings &gt; API Keys</a></>
                                        ) : (
                                            <>Ambil dari akun sandbox gratis: <a href="https://staging.channex.io" target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>staging.channex.io &gt; Settings &gt; API Keys</a></>
                                        )}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={channexApiKey}
                                        onChange={e => setChannexApiKey(e.target.value)}
                                        placeholder="Tempelkan User API Key Anda di sini (contoh: ch_live_... atau ch_staging_...)"
                                        className={styles.cellInput}
                                        style={{ height: "38px", textAlign: "left", fontSize: "12px", flexGrow: 1, padding: "0 12px", fontFamily: "var(--font-mono-jb), monospace" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(prev => !prev)}
                                        className={styles.btnActionSecondary}
                                        style={{ height: "38px", padding: "0 12px", fontSize: "11px" }}
                                        title={showApiKey ? "Sembunyikan API Key" : "Tampilkan API Key"}
                                    >
                                        {showApiKey ? "Hide" : "Show"}
                                    </button>
                                </div>
                                {!channexApiKey && (
                                    <p style={{ fontSize: "11px", color: "#dc2626", margin: "4px 0 0 0" }}>
                                        ⚠️ API Key wajib diisi agar sistem dapat membuat properti, membuka mapping iframe, dan menarik reservasi dari OTA.
                                    </p>
                                )}
                            </div>

                            {/* Field B: Channex Property ID */}
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", display: "block", marginBottom: "4px" }}>
                                    Channex Property ID (Opsional / Otomatis):
                                </label>
                                <input
                                    type="text"
                                    value={channexPropertyId}
                                    onChange={e => setChannexPropertyId(e.target.value)}
                                    placeholder="Akan otomatis dibuatkan oleh sistem saat Anda membuka tab Mapping Hub, atau isi jika properti sudah ada di Channex"
                                    className={styles.cellInput}
                                    style={{ height: "38px", textAlign: "left", fontSize: "12px", padding: "0 12px", fontFamily: "var(--font-mono-jb), monospace" }}
                                />
                                <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>
                                    {channexPropertyId
                                        ? `✓ Properti terdaftar dengan ID: ${channexPropertyId}`
                                        : "Kosongkan saja jika belum punya. Sistem My Tara akan membuatkan properti secara otomatis begitu Anda mengisi API Key di atas."}
                                </p>
                            </div>

                            {/* Field C: Webhook Callback URL */}
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", display: "block", marginBottom: "4px" }}>
                                    Webhook Callback URL (Untuk Menerima Booking Masuk):
                                </label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={typeof window !== "undefined" ? `${window.location.origin}/api/channex/webhook` : "/api/channex/webhook"}
                                        className={styles.cellInput}
                                        style={{ height: "36px", textAlign: "left", fontSize: "12px", padding: "0 12px", backgroundColor: "#f8fafc", color: "#334155", fontFamily: "monospace", flexGrow: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = typeof window !== "undefined" ? `${window.location.origin}/api/channex/webhook` : "/api/channex/webhook";
                                            navigator.clipboard.writeText(url);
                                            toast.success("Webhook URL berhasil disalin ke clipboard!");
                                        }}
                                        className={styles.btnActionSecondary}
                                        style={{ height: "36px", padding: "0 14px", fontSize: "11px" }}
                                    >
                                        <Copy size={12} />
                                        <span>Salin URL</span>
                                    </button>
                                </div>
                                <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>
                                    Daftarkan URL di atas pada menu <b>Settings &gt; Webhooks</b> di dashboard Channex agar reservasi otomatis masuk ke Front Office &amp; Forecast.
                                </p>
                            </div>

                            {/* Tombol Simpan */}
                            <div style={{ display: "flex", gap: "10px", marginTop: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSaveAll().catch(err => console.error("Error saving:", err));
                                    }}
                                    disabled={savingSettings}
                                    className={styles.btnActionPrimary}
                                    style={{ height: "38px", padding: "0 20px" }}
                                >
                                    <Save size={14} />
                                    <span>{savingSettings ? "Menyimpan Kredensial..." : "Simpan Konfigurasi Channex"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSelectTab("iframe");
                                    }}
                                    className={styles.btnActionSecondary}
                                    style={{ height: "38px", padding: "0 16px" }}
                                >
                                    <ExternalLink size={14} />
                                    <span>Buka Channex Mapping Hub &rarr;</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Panduan 4 Langkah Integrasi */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                📋 Panduan 4 Langkah Integrasi (Sandbox &amp; Production):
                            </span>

                            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>
                                    1
                                </div>
                                <div>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>Daftar Akun Channex</span>
                                    <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                        Untuk uji coba: buat akun di <a href="https://staging.channex.io" target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 600 }}>staging.channex.io</a>. Untuk live komersial: buat akun di <a href="https://app.channex.io" target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 600 }}>app.channex.io</a>.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>
                                    2
                                </div>
                                <div>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>Salin User API Key ke Formulir di Atas</span>
                                    <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                        Buka profil Channex Anda &gt; <i>Settings &gt; API Keys</i>, buat key baru, lalu tempelkan di kolom input <b>Channex User API Key</b> di atas dan klik <b>Simpan Konfigurasi Channex</b>.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>
                                    3
                                </div>
                                <div>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>Daftarkan Webhook URL My Tara di Channex</span>
                                    <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                        Di dashboard Channex, masuk ke menu <i>Settings &gt; Webhooks</i>, klik <i>New Webhook</i>, tempelkan <b>Webhook Callback URL</b> di atas, centang event <code>*</code> (All events), dan aktifkan.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>
                                    4
                                </div>
                                <div>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>Buka Tab Mapping Hub &amp; Hubungkan Extranet OTA</span>
                                    <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                        Buka tab <b>"Channex White-Label Mapping Hub"</b> untuk menghubungkan kredensial Traveloka, Agoda, Booking.com, dan Tiket.com, kemudian klik tombol <b>Force Push ARI ke OTA</b>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 7: LIVE ACTIVITY & SYNC LOG */}
            {activeTab === "sync" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                ⚡ Live Activity Stream &amp; Audit Log:
                            </span>
                            <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                Pemantauan log pengiriman harga, stok kamar, dan penerimaan webhook reservasi OTA secara real-time.
                            </p>
                        </div>
                    </div>

                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {syncLog.map((log, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 14px",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "12px"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
                                    <span style={{ color: "#0f172a", fontFamily: "var(--font-geist-mono, monospace)" }}>{log.message}</span>
                                </div>
                                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{log.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL: TAMBAH SALURAN OTA BARU DARI KATALOG 68+ */}
            {isAddChannelModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <div className={styles.modalHeader}>
                            <div>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                                    + Hubungkan Saluran OTA Baru dari Katalog Channex
                                </span>
                                <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                    Pilih saluran OTA atau Wholesaler yang ingin diaktifkan untuk properti ini.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddChannelModalOpen(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <input
                                type="text"
                                value={channelSearchQuery}
                                onChange={e => setChannelSearchQuery(e.target.value)}
                                placeholder="Cari nama OTA (contoh: Traveloka, Tiket.com, Agoda, Expedia)..."
                                className={styles.cellInput}
                                style={{ height: "36px", textAlign: "left", fontSize: "12px" }}
                            />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                                {CHANNEX_OTA_CATALOG
                                    .filter(c => c.name.toLowerCase().includes(channelSearchQuery.toLowerCase()))
                                    .map(ch => {
                                        const isConnected = Boolean(channelConfigs[ch.code]?.isActive);
                                        return (
                                            <div
                                                key={ch.code}
                                                style={{
                                                    padding: "12px",
                                                    border: `1px solid ${isConnected ? "#86efac" : "#cbd5e1"}`,
                                                    backgroundColor: isConnected ? "#f0fdf4" : "#ffffff",
                                                    borderRadius: "8px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "6px"
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <OtaLogo code={ch.code} name={ch.name} size={20} />
                                                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                                                            {ch.name}
                                                        </span>
                                                    </div>
                                                    {isConnected ? (
                                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Aktif</span>
                                                    ) : (
                                                        <span className={`${styles.badge} ${styles.badgeInactive}`}>Tersedia</span>
                                                    )}
                                                </div>

                                                <span style={{ fontSize: "10px", color: "#64748b" }}>
                                                    Komisi Standar: {ch.defaultCommission}% • {ch.category.toUpperCase()}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={isConnected}
                                                    onClick={() => handleConnectChannel(ch)}
                                                    className={isConnected ? styles.btnActionSecondary : styles.btnActionBlue}
                                                    style={{ marginTop: "4px", fontSize: "11px", height: "28px", justifyContent: "center" }}
                                                >
                                                    {isConnected ? "Sudah Terhubung" : "+ Hubungkan Saluran"}
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={() => setIsAddChannelModalOpen(false)}
                                className={styles.btnActionSecondary}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ENTERPRISE HOTEL SYSTEM CONFIRMATION MODAL */}
            {confirmModal?.isOpen && (
                <div className={styles.modalOverlay} onClick={() => setConfirmModal(null)}>
                    <div className={styles.confirmModalCard} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={`${styles.confirmIconBox} ${confirmModal.type === "disconnect" ? styles.confirmIconDanger : styles.confirmIconWarning}`}>
                                {confirmModal.type === "disconnect" ? (
                                    <AlertTriangle size={20} />
                                ) : (
                                    <RotateCcw size={20} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                                    {confirmModal.type === "disconnect"
                                        ? "Konfirmasi Pemutusan Saluran Extranet OTA"
                                        : "Konfirmasi Reset Seluruh Pemetaan ID OTA"}
                                </h3>
                                <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                                    Sistem Manajemen Saluran CRS • Properti: <b>{activeHotelCode}</b>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Channel Identity Banner */}
                            <div className={styles.confirmChannelBanner}>
                                <OtaLogo code={confirmModal.channelCode} name={confirmModal.channelName} size={28} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                            {confirmModal.channelName}
                                        </span>
                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Status: Terkoneksi</span>
                                    </div>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                        Kode Saluran: <code>{confirmModal.channelCode}</code>
                                    </span>
                                </div>
                            </div>

                            {/* Warning Impact Box */}
                            {confirmModal.type === "disconnect" ? (
                                <div className={styles.confirmImpactList}>
                                    <span style={{ fontWeight: 700, fontSize: "12px" }}>⚠️ Konsekuensi Pemutusan Saluran:</span>
                                    <span>• Sinkronisasi otomatis Harga &amp; Ketersediaan (ARI) ke extranet <b>{confirmModal.channelName}</b> akan dihentikan.</span>
                                    <span>• Reservasi masuk dari saluran ini tidak akan otomatis memotong stok inventori kamar My Tara PMS.</span>
                                    <span>• Saluran akan dipindahkan kembali ke status 'Tersedia' di Katalog OTA.</span>
                                </div>
                            ) : (
                                <div className={`${styles.confirmImpactList} ${styles.confirmImpactListWarning}`}>
                                    <span style={{ fontWeight: 700, fontSize: "12px" }}>⚠️ Konsekuensi Reset Pemetaan ID:</span>
                                    <span>• Seluruh <b>Hotel ID Extranet</b>, <b>Room ID</b>, dan <b>Rate Plan ID</b> untuk saluran <b>{confirmModal.channelName}</b> akan dihapus dari form.</span>
                                    <span>• Anda perlu memasukkan ulang ID extranet sebelum melakukan Force Push ARI berikutnya.</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className={styles.btnActionSecondary}
                            >
                                Batalkan
                            </button>
                            <button
                                type="button"
                                onClick={executeConfirmAction}
                                className={confirmModal.type === "disconnect" ? styles.btnActionDanger : styles.btnActionWarning}
                                style={{ fontWeight: 700 }}
                            >
                                {confirmModal.type === "disconnect" ? (
                                    <>
                                        <Trash2 size={14} />
                                        <span>Ya, Putuskan Saluran Sekarang</span>
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw size={14} />
                                        <span>Ya, Kosongkan Semua Pemetaan ID</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PCI VIRTUAL CREDIT CARD (VCC) VIEWER MODAL */}
            <ChannelVccViewerModal
                isOpen={isVccModalOpen}
                onClose={() => setIsVccModalOpen(false)}
                hotelCode={activeHotelCode}
            />

            {/* TAXES & SERVICE CHARGE SETS MODAL */}
            <ChannelTaxesModal
                isOpen={isTaxesModalOpen}
                onClose={() => setIsTaxesModalOpen(false)}
                hotelCode={activeHotelCode}
            />
        </div>
    );
}
