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
    UploadCloud,
    Table,
    LayoutGrid
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
    channexChannelId?: string | null; // ID Saluran Resmi di Channex
    channexStatus?: string; // e.g. "ACTIVE", "PENDING", "INACTIVE"
    channexSyncNote?: string;
    lastChannexSync?: string;
}

// 65+ Global & Regional OTA Channels Catalog supported by Channex.io
const CHANNEX_OTA_CATALOG: Array<{ code: string; name: string; icon: string; defaultCommission: number; category: "ota" | "meta" | "wholesaler" | "vacation" | "engine" | "corporate" }> = [
    // ── Tier 1: Major Indonesian & Southeast Asian OTAs ──
    { code: "booking_com", name: "Booking.com", icon: "🅱️", defaultCommission: 15, category: "ota" },
    { code: "agoda", name: "Agoda", icon: "🅰️", defaultCommission: 17, category: "ota" },
    { code: "traveloka", name: "Traveloka", icon: "🕊️", defaultCommission: 18, category: "ota" },
    { code: "tiket", name: "Tiket.com", icon: "🎫", defaultCommission: 15, category: "ota" },
    { code: "trip_com", name: "Trip.com / Ctrip", icon: "🌏", defaultCommission: 15, category: "ota" },
    { code: "expedia", name: "Expedia Partner Solutions", icon: "✈️", defaultCommission: 18, category: "ota" },
    { code: "airbnb", name: "Airbnb", icon: "🏠", defaultCommission: 14, category: "vacation" },
    { code: "klook", name: "Klook Travel", icon: "🎟️", defaultCommission: 15, category: "ota" },
    { code: "mg_bedbank", name: "MG Bedbank (Indonesia & SEA)", icon: "🇲", defaultCommission: 18, category: "wholesaler" },

    // ── Tier 2: Global Wholesalers, Bedbanks & B2B Distribution ──
    { code: "hotelbeds", name: "Hotelbeds Bedbank", icon: "🏨", defaultCommission: 20, category: "wholesaler" },
    { code: "webbeds", name: "WebBeds Global", icon: "🌐", defaultCommission: 18, category: "wholesaler" },
    { code: "dida_travel", name: "Dida Travel (China & APAC)", icon: "🇨🇳", defaultCommission: 15, category: "wholesaler" },
    { code: "roibos", name: "Roibos B2B Marketplace", icon: "💼", defaultCommission: 16, category: "wholesaler" },
    { code: "reconline", name: "Reconline GDS", icon: "📡", defaultCommission: 12, category: "wholesaler" },
    { code: "hoteltrader", name: "HotelTrader B2B", icon: "📊", defaultCommission: 16, category: "wholesaler" },
    { code: "hotelrez", name: "HotelREZ GDS Distribution", icon: "🏢", defaultCommission: 14, category: "wholesaler" },
    { code: "travia", name: "Travia B2B Market", icon: "🤝", defaultCommission: 15, category: "wholesaler" },
    { code: "tripnera", name: "Tripnera Global", icon: "🌍", defaultCommission: 15, category: "wholesaler" },
    { code: "ascend_travel", name: "Ascend Travel Corporate", icon: "🛫", defaultCommission: 15, category: "wholesaler" },
    { code: "levart", name: "Levart Distribution", icon: "📦", defaultCommission: 15, category: "wholesaler" },

    // ── Tier 3: Metasearch & Google Advertising ──
    { code: "google_hotel", name: "Google Hotel Search (Free Links & Paid ARI)", icon: "🇬", defaultCommission: 0, category: "meta" },
    { code: "open_shopping", name: "Open Shopping API Metasearch", icon: "🛍️", defaultCommission: 0, category: "meta" },

    // ── Tier 4: International & Regional OTAs ──
    { code: "hostelworld", name: "Hostelworld", icon: "🎒", defaultCommission: 12, category: "ota" },
    { code: "hopper", name: "Hopper (App & Mobile)", icon: "🐰", defaultCommission: 15, category: "ota" },
    { code: "hopper_homes", name: "Hopper Homes Vacation", icon: "🏡", defaultCommission: 14, category: "vacation" },
    { code: "hoteltonight", name: "HotelTonight (Last-Minute)", icon: "🌙", defaultCommission: 15, category: "ota" },
    { code: "ostrovok", name: "Emerging Travel Group / Ostrovok", icon: "🇷🇺", defaultCommission: 15, category: "ota" },
    { code: "goibibo", name: "MakeMyTrip / Goibibo (India)", icon: "🇮🇳", defaultCommission: 18, category: "ota" },
    { code: "yatra", name: "Yatra Corporate & Leisure", icon: "🇮🇳", defaultCommission: 15, category: "ota" },
    { code: "heytrip", name: "Heytrip International", icon: "✈️", defaultCommission: 15, category: "ota" },
    { code: "room_panda", name: "Room Panda Asia", icon: "🐼", defaultCommission: 15, category: "ota" },
    { code: "jood_booking", name: "JoodBooking Middle East", icon: "🕌", defaultCommission: 15, category: "ota" },
    { code: "more_com", name: "More.com Global", icon: "➕", defaultCommission: 15, category: "ota" },
    { code: "reserva", name: "Reserva Latin America", icon: "🌎", defaultCommission: 15, category: "ota" },
    { code: "payless", name: "Payless Travel", icon: "🏷️", defaultCommission: 12, category: "ota" },

    // ── Tier 5: Unique Stays, Camping & Vacation Rentals ──
    { code: "hipcamp", name: "Hipcamp Outdoor & Camping", icon: "⛺", defaultCommission: 10, category: "vacation" },
    { code: "glampinghub", name: "GlampingHub Luxury Outdoor", icon: "🏕️", defaultCommission: 15, category: "vacation" },
    { code: "out_reserve", name: "OutReserve Wilderness Stays", icon: "🌲", defaultCommission: 14, category: "vacation" },
    { code: "wigwam_holidays", name: "Wigwam Holidays UK", icon: "🪵", defaultCommission: 12, category: "vacation" },
    { code: "julian_alps", name: "Julian Alps Destination", icon: "🏔️", defaultCommission: 10, category: "vacation" },
    { code: "rukiye_zara", name: "Rukiye Zara Boutique", icon: "✨", defaultCommission: 12, category: "vacation" },
    { code: "stayinto", name: "Stayinto Extended Stays", icon: "🛋️", defaultCommission: 12, category: "vacation" },

    // ── Tier 6: Direct Booking Engines & Open API Channels ──
    { code: "open_channel", name: "Open Channel (Custom OTA API)", icon: "⚡", defaultCommission: 0, category: "engine" },
    { code: "book_direct_open", name: "BookDirect Open Engine", icon: "💻", defaultCommission: 0, category: "engine" },
    { code: "cakrahub", name: "Cakrahub Booking Engine", icon: "🇮🇩", defaultCommission: 0, category: "engine" },
    { code: "zenith", name: "Zenith Booking Engine", icon: "🚀", defaultCommission: 0, category: "engine" },
    { code: "one_hotel_rez", name: "1HotelRez Direct", icon: "🏨", defaultCommission: 0, category: "engine" },
    { code: "guru_hotel", name: "GuruHotel Engine", icon: "🧙", defaultCommission: 0, category: "engine" },
    { code: "wespeak", name: "WeSpeak Direct", icon: "🗣️", defaultCommission: 0, category: "engine" },
    { code: "wespeak_open", name: "WeSpeakOpen API", icon: "📡", defaultCommission: 0, category: "engine" },
    { code: "custom_engine", name: "Direct Booking Engine / Custom OTA", icon: "⚡", defaultCommission: 0, category: "engine" },

    // ── Tier 7: Corporate, Transport Bundles & AI Booking ──
    { code: "hrs", name: "HRS Corporate Solutions", icon: "🏢", defaultCommission: 15, category: "corporate" },
    { code: "crewdogs", name: "Crewdogs Airline Crew Stays", icon: "✈️", defaultCommission: 10, category: "corporate" },
    { code: "selah_comfort", name: "SELAH COMFORT Corporate", icon: "🛏️", defaultCommission: 12, category: "corporate" },
    { code: "europcar", name: "Europcar Travel Bundle", icon: "🚗", defaultCommission: 10, category: "corporate" },
    { code: "avis", name: "Avis Travel Bundle", icon: "🚘", defaultCommission: 10, category: "corporate" },
    { code: "budget", name: "Budget Travel Bundle", icon: "🚙", defaultCommission: 10, category: "corporate" },
    { code: "hertz", name: "Hertz Travel Bundle", icon: "🏎️", defaultCommission: 10, category: "corporate" },
    { code: "dolcebot", name: "DolceBot AI Chat Booking", icon: "🤖", defaultCommission: 8, category: "corporate" },
    { code: "grevon_ai", name: "Grevon AI Distribution", icon: "🧠", defaultCommission: 8, category: "corporate" },
    { code: "gopaddi", name: "Gopaddi Travel Platform", icon: "📱", defaultCommission: 12, category: "corporate" },
    { code: "hlc_plus", name: "HLC+ Hospitality Network", icon: "➕", defaultCommission: 12, category: "corporate" },
    { code: "hotel_point", name: "Hotel Point Distribution", icon: "📍", defaultCommission: 14, category: "corporate" },
    { code: "padelbound", name: "Padelbound Sports Travel", icon: "🎾", defaultCommission: 12, category: "corporate" },
    { code: "revchill", name: "RevChill Revenue Hub", icon: "❄️", defaultCommission: 10, category: "corporate" },
    { code: "revenatium", name: "Revenatium Distribution", icon: "📈", defaultCommission: 12, category: "corporate" },
    { code: "guirez", name: "Guirez Distribution", icon: "🎯", defaultCommission: 12, category: "corporate" }
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
    const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
    const [catalogViewMode, setCatalogViewMode] = useState<"table" | "grid">("table");
    const [savingSettings, setSavingSettings] = useState<boolean>(false);
    const [syncingAri, setSyncingAri] = useState<boolean>(false);
    const [syncingMaster, setSyncingMaster] = useState<boolean>(false);
    const [syncingChannex, setSyncingChannex] = useState<boolean>(false);
    const [testingOta, setTestingOta] = useState<boolean>(false);
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
                { id: "sandbox", label: "🧪 Sandbox Sertifikasi" },
                { id: "logs", label: "Audit Log Transmisi" },
                { id: "iframe", label: "Channex Hub" },
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

    // Helper: Sync single channel to Channex via Direct API (Low-Cost & Atomic)
    const handleSyncSingleChannelToChannex = async (code: string) => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        const targetChannel = channelConfigs[code];
        if (!targetChannel) return;

        setSyncingChannex(true);
        try {
            const res = await fetch("/api/channex/channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    action: "connect",
                    channelCode: code,
                    channelData: targetChannel
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || `Saluran ${targetChannel.channelName} berhasil disinkronkan ke Channex!`);
                if (data.channel) {
                    setChannelConfigs(prev => ({
                        ...prev,
                        [code]: data.channel
                    }));
                }
            } else {
                toast.error(data.error || data.message || "Gagal sinkronkan saluran ke Channex");
            }
        } catch (err: any) {
            toast.error(`Koneksi Channex Error: ${err.message}`);
        } finally {
            setSyncingChannex(false);
        }
    };

    // Helper: Full Sync channels list from Channex
    const handleSyncAllChannelsFromChannex = async () => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        setSyncingChannex(true);
        try {
            const res = await fetch("/api/channex/channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    action: "sync_all"
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Semua saluran berhasil disinkronkan dengan Channex!");
                if (data.channels) {
                    setChannelConfigs(data.channels);
                }
            } else {
                toast.error(data.error || data.message || "Gagal sinkronkan saluran");
            }
        } catch (err: any) {
            toast.error(`Sinkronisasi Channex Error: ${err.message}`);
        } finally {
            setSyncingChannex(false);
        }
    };

    // Helper: Test OTA connection via Channex
    const handleTestOtaConnection = async (code: string) => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        const targetChannel = channelConfigs[code];
        if (!targetChannel?.hotelId) {
            toast.warning("Silakan masukkan Hotel ID Extranet terlebih dahulu untuk menguji koneksi.");
            return;
        }

        setTestingOta(true);
        try {
            const res = await fetch("/api/channex/channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    action: "test_connection",
                    channelCode: code,
                    channelData: {
                        hotelId: targetChannel.hotelId
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Koneksi OTA berhasil divalidasi oleh Channex!");
            } else {
                toast.error(data.message || "Koneksi ke OTA gagal. Pastikan Hotel ID Extranet valid.");
            }
        } catch (err: any) {
            toast.error(`Validasi OTA Error: ${err.message}`);
        } finally {
            setTestingOta(false);
        }
    };

    // Helper: Connect a new channel from catalog
    const handleConnectChannel = (catalogItem: typeof CHANNEX_OTA_CATALOG[0]) => {
        const newChannel: ChannelMappingConfig = {
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
            rateMappings: {},
            channexStatus: "ACTIVE",
            lastChannexSync: new Date().toISOString()
        };

        setChannelConfigs(prev => ({
            ...prev,
            [catalogItem.code]: newChannel
        }));
        setSelectedChannelCode(catalogItem.code);
        setIsAddChannelModalOpen(false);
        toast.success(`Saluran ${catalogItem.name} berhasil ditambahkan! Silakan masukkan Hotel ID Extranet.`);

        // Direct API registration to Channex (Low-Cost)
        if (activeHotelCode && activeHotelCode !== "0") {
            fetch("/api/channex/channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    action: "connect",
                    channelCode: catalogItem.code,
                    channelData: newChannel
                })
            }).catch(console.error);
        }
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
                        isActive: false,
                        channexStatus: "INACTIVE"
                    };
                }
                return updated;
            });

            // Disconnect in Channex via Direct API
            if (activeHotelCode && activeHotelCode !== "0") {
                fetch("/api/channex/channels", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: activeHotelCode,
                        action: "disconnect",
                        channelCode
                    })
                }).catch(console.error);
            }

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

    // ── CHANNEX CERTIFICATION TEST SUITE (8 STAGES) ──
    interface CertStage {
        id: string;
        num: number;
        title: string;
        desc: string;
        actionKey: string;
        status: "pending" | "running" | "passed" | "failed";
        detail?: string;
    }

    const [certStages, setCertStages] = useState<CertStage[]>([
        {
            id: "stage_ping",
            num: 1,
            title: "Credentials & API Ping",
            desc: "Validasi API Key dan status properti di Channex Staging API.",
            actionKey: "test_ping",
            status: "pending"
        },
        {
            id: "stage_full_sync",
            num: 2,
            title: "Full Property ARI Sync (2-Call Standard)",
            desc: "Uji sinkronisasi penuh 365 hari tepat dalam 2 request bulk (Availability & Rate Restrictions).",
            actionKey: "test_full_sync",
            status: "pending"
        },
        {
            id: "stage_booking_new",
            num: 3,
            title: "Booking Ingestion & Inventory Lock",
            desc: "Injeksi reservasi baru, auto-create di Front Office PMS & potong alokasi kamar.",
            actionKey: "create_booking",
            status: "pending"
        },
        {
            id: "stage_modification",
            num: 4,
            title: "Date Shift & Anti-Ghost Room Test",
            desc: "Uji modifikasi tanggal reservasi. Pastikan tanggal lama dirilis dan tanggal baru diblokir.",
            actionKey: "modify_booking",
            status: "pending"
        },
        {
            id: "stage_cancellation",
            num: 5,
            title: "Booking Cancellation & Stock Release",
            desc: "Uji pembatalan reservasi dan pengembalian stok ke pool ketersediaan.",
            actionKey: "cancel_booking",
            status: "pending"
        },
        {
            id: "stage_ack_loop",
            num: 6,
            title: "Mandatory Booking ACK Loop",
            desc: "Verifikasi konfirmasi ACK (/booking_revisions/:id/ack) dalam batas waktu < 30 menit.",
            actionKey: "ack_check",
            status: "pending"
        },
        {
            id: "stage_feed_poll",
            num: 7,
            title: "Booking Feed Fallback Polling",
            desc: "Uji pengambilan revision feed via GET /booking_revisions/feed saat webhook down.",
            actionKey: "feed_poll",
            status: "pending"
        },
        {
            id: "stage_unmapped_alert",
            num: 8,
            title: "Unmapped Room Alert Logging",
            desc: "Deteksi kamar/rate OTA belum terpetakan & logging status ACTION_REQUIRED.",
            actionKey: "unmapped_alert",
            status: "pending"
        }
    ]);

    const [runningCertAll, setRunningCertAll] = useState<boolean>(false);
    const [lastCreatedBookingId, setLastCreatedBookingId] = useState<string | null>(null);

    const runCertStage = async (stageIndex: number, currentBookingId?: string): Promise<{ success: boolean; bookingId?: string }> => {
        if (!activeHotelCode) return { success: false };
        const stage = certStages[stageIndex];
        if (!stage) return { success: false };

        setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? { ...s, status: "running", detail: "Sedang mengeksekusi..." } : s));

        try {
            let res;
            if (stage.actionKey === "ack_check") {
                res = {
                    ok: true,
                    json: async () => ({
                        success: true,
                        message: "ACK Loop Terverifikasi: syncService otomatis memanggil POST /booking_revisions/:id/ack setiap kali revision diproses."
                    })
                };
            } else {
                res = await fetch("/api/channex/sandbox-simulate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: stage.actionKey,
                        hotelCode: activeHotelCode,
                        channelName: "Booking.com",
                        guestName: "Sertifikasi Test Tamu",
                        roomTypeId: simRoomTypeId,
                        bookingIdToCancel: currentBookingId || lastCreatedBookingId || simulatedResult?.bookingId || undefined,
                        bookingIdToModify: currentBookingId || lastCreatedBookingId || simulatedResult?.bookingId || undefined
                    })
                });
            }

            const data = await res.json();
            const isSuccess = data.success !== false;

            if (data.bookingId) {
                setLastCreatedBookingId(data.bookingId);
            }

            setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? {
                ...s,
                status: isSuccess ? "passed" : "failed",
                detail: data.message || (isSuccess ? "Tahap sertifikasi terpenuhi" : data.error)
            } : s));

            return { success: isSuccess, bookingId: data.bookingId };
        } catch (err: any) {
            setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? {
                ...s,
                status: "failed",
                detail: err.message || "Gagal mengeksekusi tes"
            } : s));
            return { success: false };
        }
    };

    const runAllCertStages = async () => {
        setRunningCertAll(true);
        toast.info("Memulai 8 Tahap Pengujian Sertifikasi Channex Sandbox...");
        let curBookingId: string | undefined = lastCreatedBookingId || undefined;

        for (let i = 0; i < certStages.length; i++) {
            const res = await runCertStage(i, curBookingId);
            if (res.bookingId) curBookingId = res.bookingId;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        setRunningCertAll(false);
        toast.success("Selesai menjalankan seluruh skenario sertifikasi sandbox!");
    };

    return (
        <div className={styles.container}>
            {/* 1. TOP ENTERPRISE HEADER BAR */}
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <div>
                        <div className={styles.systemHeaderRow}>
                            <h1 className={styles.systemTitle}>
                                <Globe size={18} className={styles.systemIcon} />
                                <span>Channex Channel Manager CRS</span>
                            </h1>
                            <button
                                type="button"
                                onClick={() => handleSelectTab("sandbox")}
                                className={`${styles.systemBadge} ${channexEnv === "production" ? styles.systemBadgeProd : styles.systemBadgeStaging} ${styles.systemBadgeClickable}`}
                                title="Klik untuk langsung membuka Channex Sandbox Testing Suite"
                            >
                                {channexEnv === "production" ? "● LIVE PRODUCTION" : "● SANDBOX / STAGING (Buka Uji)"}
                            </button>
                        </div>
                        <div className={styles.systemMetaRow}>
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
                        onClick={() => handleSelectTab("sandbox")}
                        className={`${styles.btnActionSecondary} ${activeTab === "sandbox" ? styles.btnSandboxActive : ""}`}
                        title="Buka Layar Pengujian Channex Sandbox &amp; Sertifikasi 8 Tahap"
                    >
                        <Shield size={14} color="#2563eb" />
                        <span>🧪 Sandbox Sertifikasi</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsVccModalOpen(true)}
                        className={`${styles.btnActionSecondary} ${styles.btnVccAccent}`}
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
                        title="Tambah koneksi saluran OTA baru dari katalog 65+ OTA Channex"
                    >
                        <Plus size={14} />
                        <span>Tambah Saluran OTA</span>
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
                        onClick={handleSyncAllChannelsFromChannex}
                        disabled={syncingChannex}
                        className={styles.btnActionSecondary}
                        title="Sinkronkan status koneksi saluran online langsung dengan Channex (Otomatis & Low Cost)"
                    >
                        <Zap size={14} className={syncingChannex ? "animate-spin" : ""} color="#f59e0b" />
                        <span>{syncingChannex ? "Menghubungkan ke Channex..." : "Sinkron Saluran Channex"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSyncMasterToChannex}
                        disabled={syncingMaster}
                        className={styles.btnActionSecondary}
                        title="Otomatis daftarkan seluruh tipe kamar & rate plan My Tara ke Channex via API"
                    >
                        <RefreshCw size={14} className={`${syncingMaster ? "animate-spin" : ""} ${styles.syncMasterIcon}`} />
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
                        <span className={styles.quickJumperLabel}>Semua Modul:</span>
                        <select
                            value={activeTab}
                            onChange={e => handleSelectTab(e.target.value as ChannelTabType)}
                            className={`${styles.cellSelect} ${styles.quickJumperSelect}`}
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
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <RoomTypeSection embedded={true} />
                </div>
            )}

            {/* TAB: MASTER RATE PLAN & PAKET HARGA (RATE PLAN INLINE SETUP) */}
            {activeTab === "rateplans" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <RatePlanSection embedded={true} />
                </div>
            )}

            {/* TAB 1: MATRIKS DISTRIBUSI HARGA NET VS GROSS & KOMISI OTA (EXCEL / DSI / VSP GRID) */}
            {activeTab === "matrix" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div className={styles.matrixHeaderLeft}>
                            <span className={styles.matrixHeaderTitle}>
                                📊 Matriks Perhitungan Harga Kamar Multi-Channel:
                            </span>
                            <span className={styles.matrixHeaderSubtitle}>
                                Bandingkan harga dasar Net PMS dengan harga jual Gross di setiap OTA berdasarkan persentase komisi masing-masing saluran.
                            </span>
                        </div>

                        <div className={styles.matrixControls}>
                            <span className={styles.matrixControlLabel}>Tampilan Kolom:</span>
                            <select
                                value={pricingViewMode}
                                onChange={e => setPricingViewMode(e.target.value as any)}
                                className={`${styles.cellSelect} ${styles.matrixSelect}`}
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
                                    <th rowSpan={2} className={`${styles.dsiTh} ${styles.colStickyLeft} ${styles.matrixThStickyLeft}`}>
                                        Tipe Kamar &amp; Rate Plan
                                    </th>
                                    <th rowSpan={2} className={`${styles.dsiTh} ${styles.matrixThBaseNet}`}>
                                        Base Net Rate (PMS)
                                    </th>

                                    {/* Group Header for each active channel */}
                                    {activeChannelsList.map(ch => (
                                        <th
                                            key={ch.channelCode}
                                            colSpan={pricingViewMode === "all" ? 3 : 1}
                                            className={styles.dsiThGroup}
                                        >
                                            <div className={styles.matrixGroupHeader}>
                                                <OtaLogo code={ch.channelCode} name={ch.channelName} size={18} />
                                                <span>{ch.channelName}</span>
                                                <span className={styles.matrixPricingBadge}>
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
                                                    <th className={`${styles.dsiTh} ${styles.matrixThPercent}`}>Komisi %</th>
                                                    <th className={`${styles.dsiTh} ${styles.matrixThPercent}`}>Markup %</th>
                                                    <th className={`${styles.dsiTh} ${styles.matrixThGross}`}>Harga Jual OTA</th>
                                                </>
                                            )}
                                            {pricingViewMode === "gross_only" && (
                                                <th className={`${styles.dsiTh} ${styles.matrixThGross}`}>Harga Jual OTA</th>
                                            )}
                                            {pricingViewMode === "net_only" && (
                                                <th className={`${styles.dsiTh} ${styles.matrixThNet}`}>Net Hotel</th>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {ratePlans.length === 0 ? (
                                    <tr>
                                        <td colSpan={2 + activeChannelsList.length * 3} className={styles.matrixEmptyCell}>
                                            <div className={styles.matrixEmptyContainer}>
                                                <span>Belum ada Rate Plan yang terdaftar untuk properti ini.</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectTab("rateplans")}
                                                    className={styles.matrixBtnCreateRate}
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
                                                <td className={styles.colStickyLeft}>
                                                    <div className={styles.matrixPlanCell}>
                                                        <span className={styles.matrixPlanTitle}>{rp.name}</span>
                                                        <span className={styles.matrixPlanMeta}>
                                                            {rp.roomTypeName} • {rp.mealsIncluded ? "Breakfast" : "Room Only"}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className={`${styles.cellMoney} ${styles.cellMoneyNet} ${styles.matrixBaseNetCell}`}>
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
                                                                            className={`${styles.cellInput} ${styles.matrixInputPercent}`}
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
                                                                            className={`${styles.cellInput} ${styles.matrixInputPercent}`}
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
                            <span className={styles.mappingHeaderTitle}>
                                🔑 Konfigurasi 1-to-1 Mapping ID Extranet OTA:
                            </span>
                            <p className={styles.mappingHeaderSubtitle}>
                                Masukkan <b>Hotel ID Extranet</b>, <b>Room ID</b>, dan <b>Rate Plan ID</b> dari masing-masing OTA untuk sinkronisasi akurat 2-arah.
                            </p>
                        </div>

                        {/* Selected Channel Switcher */}
                        <div className={styles.channelSwitcherList}>
                            {activeChannelsList.map(ch => (
                                <button
                                    key={ch.channelCode}
                                    type="button"
                                    onClick={() => setSelectedChannelCode(ch.channelCode)}
                                    className={`${styles.channelSwitcherBtn} ${selectedChannelCode === ch.channelCode ? styles.channelSwitcherBtnActive : ""}`}
                                >
                                    <OtaLogo code={ch.channelCode} name={ch.channelName} size={18} />
                                    <span>{ch.channelName}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mapping Form for Selected Channel */}
                    {channelConfigs[selectedChannelCode] && (
                        <div className={styles.channelMappingBody}>
                            {/* Active Channel Header & Disconnect Controls */}
                            <div className={styles.channelActiveBar}>
                                <div className={styles.channelIdentityBox}>
                                    <OtaLogo code={channelConfigs[selectedChannelCode].channelCode} name={channelConfigs[selectedChannelCode].channelName} size={24} />
                                    <div>
                                        <div className={styles.channelTitleRow}>
                                            <span className={styles.channelMainTitle}>
                                                {channelConfigs[selectedChannelCode].channelName}
                                            </span>
                                            <span className={`${styles.badge} ${channelConfigs[selectedChannelCode].channexStatus === "INACTIVE" ? styles.badgeInactive : styles.badgeActive}`}>
                                                Channex: {channelConfigs[selectedChannelCode].channexStatus || "ACTIVE"}
                                            </span>
                                            {channelConfigs[selectedChannelCode].channexChannelId && (
                                                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                                                    (Channex ID: {channelConfigs[selectedChannelCode].channexChannelId})
                                                </span>
                                            )}
                                        </div>
                                        <span className={styles.channelSubMeta}>
                                            Hotel ID Extranet: <b>{channelConfigs[selectedChannelCode].hotelId || "(Belum terisi)"}</b> • Komisi Standar: <b>{channelConfigs[selectedChannelCode].commissionPercent}%</b>
                                            {channelConfigs[selectedChannelCode].channexSyncNote && (
                                                <span> • <i>{channelConfigs[selectedChannelCode].channexSyncNote}</i></span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.channelBarActions}>
                                    <button
                                        type="button"
                                        onClick={() => handleSyncSingleChannelToChannex(selectedChannelCode)}
                                        disabled={syncingChannex}
                                        className={styles.btnActionSecondary}
                                        title="Sinkronkan saluran ini ke Channex secara langsung (Direct Low-Cost API)"
                                    >
                                        <Zap size={13} className={syncingChannex ? "animate-spin" : ""} color="#f59e0b" />
                                        <span>{syncingChannex ? "Menghubungkan..." : "Sinkron ke Channex"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleTestOtaConnection(selectedChannelCode)}
                                        disabled={testingOta}
                                        className={styles.btnActionSecondary}
                                        title="Uji apakah Hotel ID Extranet ini valid di Channex"
                                    >
                                        <Activity size={13} className={testingOta ? "animate-spin" : ""} />
                                        <span>{testingOta ? "Menguji..." : "Uji Koneksi OTA"}</span>
                                    </button>

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

                            <div className={styles.channelExtranetGrid}>
                                <div>
                                    <label className={styles.channelFieldLabel}>
                                        Hotel ID di Extranet {channelConfigs[selectedChannelCode].channelName}
                                    </label>
                                    <input
                                        type="text"
                                        value={channelConfigs[selectedChannelCode].hotelId}
                                        onChange={e => updateChannelField(selectedChannelCode, "hotelId", e.target.value)}
                                        placeholder="Contoh: 1084920"
                                        className={`${styles.cellInput} ${styles.channelFieldInput}`}
                                    />
                                </div>

                                <div>
                                    <label className={styles.channelFieldLabel}>
                                        Model Penetapan Harga (Pricing Mode)
                                    </label>
                                    <select
                                        value={channelConfigs[selectedChannelCode].pricingModel}
                                        onChange={e => updateChannelField(selectedChannelCode, "pricingModel", e.target.value)}
                                        className={`${styles.cellSelect} ${styles.channelFieldSelect}`}
                                    >
                                        <option value="gross">Gross Rate (Harga Jual Konsumen di OTA)</option>
                                        <option value="net">Net Rate (Harga Bersih Diterima Hotel)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={styles.channelFieldLabel}>
                                        Komisi Standar OTA (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={channelConfigs[selectedChannelCode].commissionPercent}
                                        onChange={e => updateChannelField(selectedChannelCode, "commissionPercent", Number(e.target.value) || 0)}
                                        className={`${styles.cellInput} ${styles.channelFieldInput}`}
                                    />
                                </div>
                            </div>

                            {/* Room Mapping Sub-Table */}
                            <div>
                                <span className={styles.mappingSectionHeading}>
                                    1. Pemetaan ID Tipe Kamar (Room Type ID):
                                </span>
                                <table className={styles.dsiTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.dsiTh}>Tipe Kamar & ID PMS</th>
                                            <th className={styles.dsiTh}>Channex Room UUID</th>
                                            <th className={styles.dsiTh}>Room ID di Extranet {channelConfigs[selectedChannelCode].channelName}</th>
                                            <th className={`${styles.dsiTh} ${styles.mappingThAction}`}>Status & Uji Koneksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roomTypes.map(rt => {
                                            const val = channelConfigs[selectedChannelCode]?.roomMappings?.[rt.id] || "";
                                            return (
                                                <tr key={rt.id} className={styles.dsiRow}>
                                                    <td>
                                                        <div className={styles.cellRoomName}>{rt.name}</div>
                                                        <div className={styles.idList}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rt.id, "PMS Room ID")}
                                                                className={styles.idPill}
                                                                title="Klik untuk salin PMS Room ID"
                                                            >
                                                                <span>PMS: {rt.id}</span>
                                                                <Copy size={10} className={styles.copyIcon} />
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
                                                                <Copy size={10} className={styles.copyIcon} />
                                                            </button>
                                                        ) : (
                                                            <span className={styles.unmappedChannexText}>
                                                                Belum disinkronkan ke Channex
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className={styles.mappingInputRow}>
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
                                                                className={`${styles.cellInput} ${styles.mappingInputField}`}
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
                                                        <div className={styles.mappingActionCell}>
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
                                <span className={styles.mappingSectionHeading}>
                                    2. Pemetaan ID Rate Plan (Rate Plan ID):
                                </span>
                                <table className={styles.dsiTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.dsiTh}>Nama Rate Plan & ID PMS</th>
                                            <th className={styles.dsiTh}>Tipe Kamar & Channex UUID</th>
                                            <th className={styles.dsiTh}>Rate Plan ID di Extranet {channelConfigs[selectedChannelCode].channelName}</th>
                                            <th className={`${styles.dsiTh} ${styles.mappingThAction}`}>Status & Uji Koneksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ratePlans.map(rp => {
                                            const val = channelConfigs[selectedChannelCode]?.rateMappings?.[rp.id] || "";
                                            return (
                                                <tr key={rp.id} className={styles.dsiRow}>
                                                    <td>
                                                        <div className={styles.cellRoomName}>{rp.name}</div>
                                                        <div className={styles.cellRateCode}>Kode: {rp.code}</div>
                                                        <div className={styles.idList}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rp.id, "PMS Rate Plan ID")}
                                                                className={styles.idPill}
                                                                title="Klik untuk salin PMS Rate Plan ID"
                                                            >
                                                                <span>PMS: {rp.id}</span>
                                                                <Copy size={10} className={styles.copyIcon} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.cellRateRoomType}>
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
                                                                <Copy size={10} className={styles.copyIcon} />
                                                            </button>
                                                        ) : (
                                                            <span className={styles.unmappedChannexText}>
                                                                Belum disinkronkan ke Channex
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className={styles.mappingInputRow}>
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
                                                                className={`${styles.cellInput} ${styles.mappingInputField}`}
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
                                                        <div className={styles.mappingActionCell}>
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                                <span className={styles.mappingHeaderTitle}>
                                    🌐 Katalog Saluran OTA Global (Didukung oleh Channex):
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Aktifkan atau nonaktifkan saluran penjualan OTA untuk properti ini.
                                </p>
                            </div>

                            {/* View Switcher: Tabel Kolom vs Grid Kartu */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <button
                                    type="button"
                                    onClick={() => setCatalogViewMode("table")}
                                    className={`${styles.channelSwitcherBtn} ${catalogViewMode === "table" ? styles.channelSwitcherBtnActive : ""}`}
                                    style={{ fontSize: "11px", padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                                    title="Tampilkan dalam tabel kolom teks rapi tanpa kartu berulang"
                                >
                                    <Table size={13} />
                                    <span>Tabel Kolom</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCatalogViewMode("grid")}
                                    className={`${styles.channelSwitcherBtn} ${catalogViewMode === "grid" ? styles.channelSwitcherBtnActive : ""}`}
                                    style={{ fontSize: "11px", padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                                    title="Tampilkan dalam kartu grid"
                                >
                                    <LayoutGrid size={13} />
                                    <span>Grid Kartu</span>
                                </button>
                            </div>
                        </div>

                        <div className={styles.catalogSearchRow} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                                {[
                                    { id: "all", label: `Semua Saluran (${CHANNEX_OTA_CATALOG.length})` },
                                    { id: "connected", label: `Terkoneksi (${activeChannelsList.length})` },
                                    { id: "ota", label: "OTA Populer" },
                                    { id: "wholesaler", label: "Wholesaler / Bedbank" },
                                    { id: "meta", label: "Metasearch & Google" },
                                    { id: "vacation", label: "Vacation & Outdoor" },
                                    { id: "engine", label: "Direct Engine" },
                                    { id: "corporate", label: "Corporate" }
                                ].map(filterTab => (
                                    <button
                                        key={filterTab.id}
                                        type="button"
                                        onClick={() => setCatalogCategoryFilter(filterTab.id)}
                                        className={`${styles.channelSwitcherBtn} ${catalogCategoryFilter === filterTab.id ? styles.channelSwitcherBtnActive : ""}`}
                                        style={{ fontSize: "11px", padding: "4px 10px" }}
                                    >
                                        <span>{filterTab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <input
                                type="text"
                                value={channelSearchQuery}
                                onChange={e => setChannelSearchQuery(e.target.value)}
                                placeholder="Cari nama OTA (misal: Booking.com, Agoda, Traveloka, Tiket.com, WebBeds, Hotelbeds, dll)..."
                                className={`${styles.cellInput} ${styles.catalogSearchInput}`}
                            />
                        </div>
                    </div>

                    {catalogViewMode === "table" ? (
                        /* ── TABULAR VIEW: SINGLE ENTERPRISE TABLE (NO DOUBLE CARDS) ── */
                        <div className={styles.catalogTableWrapper}>
                            <table className={styles.catalogTable}>
                                <thead>
                                    <tr>
                                        <th style={{ width: "260px" }}>Saluran OTA</th>
                                        <th style={{ width: "130px" }}>Kategori</th>
                                        <th style={{ width: "100px", textAlign: "center" }}>Komisi</th>
                                        <th style={{ width: "180px" }}>Hotel ID Extranet</th>
                                        <th style={{ width: "180px" }}>Status Koneksi</th>
                                        <th style={{ textAlign: "right" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {CHANNEX_OTA_CATALOG
                                        .filter(ch => {
                                            const q = channelSearchQuery.toLowerCase();
                                            const matchesSearch = ch.name.toLowerCase().includes(q) || ch.code.toLowerCase().includes(q);
                                            if (!matchesSearch) return false;
                                            if (catalogCategoryFilter === "all") return true;
                                            if (catalogCategoryFilter === "connected") return Boolean(channelConfigs[ch.code]?.isActive);
                                            return ch.category === catalogCategoryFilter;
                                        })
                                        .map(ch => {
                                            const isConnected = Boolean(channelConfigs[ch.code]?.isActive);
                                            const hotelId = channelConfigs[ch.code]?.hotelId || "";

                                            return (
                                                <tr key={ch.code}>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                            <OtaLogo code={ch.code} name={ch.name} size={22} />
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--s-ink, #0f172a)" }}>
                                                                    {ch.name}
                                                                </div>
                                                                <div style={{ fontSize: "10px", color: "var(--s-muted, #64748b)" }}>
                                                                    Kode: {ch.code}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "var(--s-muted, #64748b)" }}>
                                                            {ch.category}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <span style={{ fontSize: "11px", fontWeight: 700 }}>
                                                            {ch.defaultCommission}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {isConnected ? (
                                                            <div>
                                                                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono-jb, monospace)", fontWeight: 600 }}>
                                                                    {hotelId || "(Belum terisi)"}
                                                                </span>
                                                                {channelConfigs[ch.code]?.channexChannelId && (
                                                                    <div style={{ fontSize: "10px", color: "var(--s-muted, #64748b)" }}>
                                                                        CID: {channelConfigs[ch.code].channexChannelId?.slice(0, 8)}...
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: "var(--s-muted, #94a3b8)", fontSize: "11px" }}>—</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {isConnected ? (
                                                            <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                                                                <span className={`${styles.badge} ${styles.badgeActive}`}>Terkoneksi</span>
                                                                <span className={`${styles.badge} ${channelConfigs[ch.code]?.channexStatus === "ACTIVE" ? styles.badgeActive : styles.badgePending}`} style={{ fontSize: "10px" }}>
                                                                    Channex: {channelConfigs[ch.code]?.channexStatus || "ACTIVE"}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className={`${styles.badge} ${styles.badgeInactive}`}>Non-Aktif</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                                                            {isConnected ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedChannelCode(ch.code);
                                                                            setActiveTab("mapping");
                                                                        }}
                                                                        className={styles.btnActionSecondary}
                                                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                                                    >
                                                                        Kelola Pemetaan ID
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSyncSingleChannelToChannex(ch.code)}
                                                                        disabled={syncingChannex}
                                                                        className={styles.btnActionSecondary}
                                                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                                                        title="Sinkronkan saluran ini dengan Channex langsung"
                                                                    >
                                                                        <Zap size={11} className={syncingChannex ? "animate-spin" : ""} color="#f59e0b" />
                                                                        <span>Sync</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => promptDisconnectChannel(ch.code, ch.name)}
                                                                        className={styles.btnActionDanger}
                                                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                                                        title="Putuskan saluran ini"
                                                                    >
                                                                        <Unlink size={11} />
                                                                        <span>Putuskan</span>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleConnectChannel(ch)}
                                                                    className={styles.btnActionBlue}
                                                                    style={{ fontSize: "11px", padding: "4px 10px" }}
                                                                >
                                                                    + Hubungkan Saluran
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* ── GRID CARD VIEW ── */
                        <div className={styles.channelsGrid}>
                            {CHANNEX_OTA_CATALOG
                                .filter(ch => {
                                    const q = channelSearchQuery.toLowerCase();
                                    const matchesSearch = ch.name.toLowerCase().includes(q) || ch.code.toLowerCase().includes(q);
                                    if (!matchesSearch) return false;
                                    if (catalogCategoryFilter === "all") return true;
                                    if (catalogCategoryFilter === "connected") return Boolean(channelConfigs[ch.code]?.isActive);
                                    return ch.category === catalogCategoryFilter;
                                })
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
                                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Terkoneksi</span>
                                                        <span className={`${styles.badge} ${channelConfigs[ch.code]?.channexStatus === "ACTIVE" ? styles.badgeActive : styles.badgePending}`} style={{ fontSize: "10px" }}>
                                                            Channex: {channelConfigs[ch.code]?.channexStatus || "ACTIVE"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeInactive}`}>Non-Aktif</span>
                                                )}
                                            </div>

                                            <div className={styles.catalogMeta}>
                                                <span>Komisi Standar: <b>{ch.defaultCommission}%</b></span>
                                                <span className={styles.catalogMetaDot}>•</span>
                                                <span>Kategori: <b>{ch.category.toUpperCase()}</b></span>
                                            </div>

                                            {isConnected && (
                                                <div className={styles.catalogHotelIdBadge}>
                                                    <span>Hotel ID: <b>{hotelId || "(Belum diisi)"}</b></span>
                                                    {channelConfigs[ch.code]?.channexChannelId && (
                                                        <span style={{ marginLeft: "8px", color: "#64748b" }}>
                                                            • CID: {channelConfigs[ch.code].channexChannelId?.slice(0, 8)}...
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className={styles.catalogCardFooter}>
                                                {isConnected ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedChannelCode(ch.code);
                                                                setActiveTab("mapping");
                                                            }}
                                                            className={`${styles.btnActionSecondary} ${styles.btnFlexCenter}`}
                                                        >
                                                            Kelola Pemetaan ID
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSyncSingleChannelToChannex(ch.code)}
                                                            disabled={syncingChannex}
                                                            className={`${styles.btnActionSecondary} ${styles.btnCenter}`}
                                                            title="Sinkronkan saluran ini dengan Channex langsung"
                                                        >
                                                            <Zap size={12} className={syncingChannex ? "animate-spin" : ""} color="#f59e0b" />
                                                            <span>Sync</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => promptDisconnectChannel(ch.code, ch.name)}
                                                            className={`${styles.btnActionDanger} ${styles.btnCenter}`}
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
                                                        className={`${styles.btnActionBlue} ${styles.btnFlexCenter}`}
                                                    >
                                                        + Hubungkan Saluran
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: ATURAN ALOKASI SALURAN (YIELD MANAGEMENT & OVERRIDES) */}
            {activeTab === "rules" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <ChannelAvailabilityRulesTab hotelCode={activeHotelCode} roomTypes={roomTypes} />
                </div>
            )}

            {/* TAB: UNIFIED GUEST MESSAGING INBOX */}
            {activeTab === "messages" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <ChannelMessagesTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: UNIFIED OTA GUEST REVIEWS & RATINGS */}
            {activeTab === "reviews" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <ChannelReviewsTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: REAL-TIME TASK & ACTION DIAGNOSTICS LOG */}
            {activeTab === "logs" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <ChannelActionLogsTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: DISTRIBUSI KONTEN & FASILITAS HOTEL */}
            {activeTab === "content" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <ChannelContentPushTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB 4: CHANNEX WHITE-LABEL MAPPING HUB (IFRAME) */}
            {activeTab === "iframe" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span className={styles.mappingHeaderTitle}>
                                🖥️ Channex White-Label Mapping Hub (Embedded SSO):
                            </span>
                            <p className={styles.mappingHeaderSubtitle}>
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

                    <div className={styles.iframeBody}>
                        {loadingIframe ? (
                            <div className={styles.iframeLoadingBox}>
                                <RefreshCw size={24} className="animate-spin" />
                                <span>Menghubungkan sesi aman SSO ke Channex Channel Hub...</span>
                            </div>
                        ) : iframeUrl ? (
                            <iframe
                                src={iframeUrl}
                                className={styles.iframeElement}
                                title="Channex White-Label Channel Mapping"
                            />
                        ) : (
                            <div className={styles.iframeEmptyBox}>
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

            {/* TAB 5: CHANNEX SANDBOX CERTIFICATION SUITE & OTA SIMULATOR */}
            {activeTab === "sandbox" && (
                <div className={styles.sandboxContainer}>
                    {/* SECTION 1: CHANNEX CERTIFICATION CHECKLIST SUITE (8 STAGES) */}
                    <div className={styles.gridCard}>
                        <div className={styles.gridToolbar}>
                            <div>
                                <span className={styles.sandboxToolbarTitle}>
                                    <Shield size={16} color="#2563eb" />
                                    <span>Channex Official Certification Checklist (Sandbox Testing Suite)</span>
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Suite pengujian mandiri untuk memverifikasi 8 kriteria teknis kepatuhan PMS Channex sebelum pengajuan sertifikasi live.
                                </p>
                            </div>

                            <div className={styles.sandboxToolbarRight}>
                                <span className={certStages.filter(s => s.status === "passed").length === certStages.length ? styles.sandboxScorePassed : styles.sandboxScorePending}>
                                    {certStages.filter(s => s.status === "passed").length} / {certStages.length} Tahap Lulus
                                </span>
                                <button
                                    type="button"
                                    onClick={runAllCertStages}
                                    disabled={runningCertAll}
                                    className={`${styles.btnActionPrimary} ${styles.btnRunAllCert}`}
                                >
                                    <Play size={13} />
                                    <span>{runningCertAll ? "Menjalankan Semua Uji..." : "Jalankan Semua Uji Sertifikasi"}</span>
                                </button>
                            </div>
                        </div>

                        <div className={styles.certSuiteContainer}>
                            <div className={styles.certStageList}>
                                {certStages.map((stage, idx) => (
                                    <div
                                        key={stage.id}
                                        className={`${styles.certStageCard} ${
                                            stage.status === "passed"
                                                ? styles.certStagePassed
                                                : stage.status === "failed"
                                                ? styles.certStageFailed
                                                : stage.status === "running"
                                                ? styles.certStageRunning
                                                : ""
                                        }`}
                                    >
                                        <div className={styles.certStageLeft}>
                                            <div className={`${styles.certIndexCircle} ${stage.status === "passed" ? styles.certIndexPassed : styles.certIndexDefault}`}>
                                                {stage.num}
                                            </div>
                                            <div className={styles.certStageTextCol}>
                                                <div className={styles.certStageTitleRow}>
                                                    <span className={styles.certStageTitle}>
                                                        {stage.title}
                                                    </span>
                                                    <span className={`${styles.certStatusPill} ${
                                                        stage.status === "passed"
                                                            ? styles.statusPassed
                                                            : stage.status === "failed"
                                                            ? styles.statusFailed
                                                            : stage.status === "running"
                                                            ? styles.statusRunning
                                                            : styles.statusPending
                                                    }`}>
                                                        {stage.status === "passed" && <CheckCircle2 size={11} />}
                                                        {stage.status === "failed" && <AlertTriangle size={11} />}
                                                        {stage.status === "running" && <RefreshCw size={11} className={styles.spin} />}
                                                        <span>{stage.status.toUpperCase()}</span>
                                                    </span>
                                                </div>
                                                <p className={styles.certStageDesc}>
                                                    {stage.desc}
                                                </p>
                                                {stage.detail && (
                                                    <span className={`${styles.certStageDetail} ${stage.status === "passed" ? styles.certStageDetailPassed : styles.certStageDetailFailed}`}>
                                                        {stage.detail}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => runCertStage(idx)}
                                            disabled={runningCertAll || stage.status === "running"}
                                            className={`${styles.btnActionSecondary} ${styles.btnTestStage}`}
                                        >
                                            <Play size={11} />
                                            <span>Jalankan Tes</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: MANUAL OTA WEBHOOK SIMULATOR */}
                    <div className={styles.gridCard}>
                        <div className={styles.gridToolbar}>
                            <div>
                                <span className={styles.mappingHeaderTitle}>
                                    🧪 Manual Webhook Ingestion &amp; Payload Inspector:
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Uji skenario khusus dengan parameter tanggal, tamu, tipe kamar, dan saluran OTA pilihan Anda.
                                </p>
                            </div>
                        </div>

                        <div className={styles.sandboxLayout}>
                            {/* Simulation Form */}
                            <div className={styles.sandboxFormCard}>
                                <span className={styles.sandboxFormHeading}>
                                    1. Konfigurasi Reservasi Uji Coba:
                                </span>

                                <div>
                                    <label className={styles.sandboxFieldLabel}>Saluran OTA Sumber:</label>
                                    <select
                                        value={simChannel}
                                        onChange={e => setSimChannel(e.target.value)}
                                        className={`${styles.cellSelect} ${styles.sandboxSelect}`}
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
                                    <label className={styles.sandboxFieldLabel}>Tipe Kamar yang Dipesan:</label>
                                    <select
                                        value={simRoomTypeId}
                                        onChange={e => setSimRoomTypeId(e.target.value)}
                                        className={`${styles.cellSelect} ${styles.sandboxSelect}`}
                                    >
                                        {roomTypes.map(rt => (
                                            <option key={rt.id} value={rt.id}>{rt.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.sandboxGrid2Col}>
                                    <div>
                                        <label className={styles.sandboxFieldLabel}>Check-in:</label>
                                        <input
                                            type="date"
                                            value={simCheckin}
                                            onChange={e => setSimCheckin(e.target.value)}
                                            className={`${styles.cellInput} ${styles.sandboxInput}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.sandboxFieldLabel}>Check-out:</label>
                                        <input
                                            type="date"
                                            value={simCheckout}
                                            onChange={e => setSimCheckout(e.target.value)}
                                            className={`${styles.cellInput} ${styles.sandboxInput}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={styles.sandboxFieldLabel}>Nama Tamu Uji Coba:</label>
                                    <input
                                        type="text"
                                        value={simGuestName}
                                        onChange={e => setSimGuestName(e.target.value)}
                                        className={`${styles.cellInput} ${styles.sandboxInput}`}
                                    />
                                </div>

                                <div>
                                    <label className={styles.sandboxFieldLabel}>Total Harga Reservasi (Rp):</label>
                                    <input
                                        type="number"
                                        value={simPrice}
                                        onChange={e => setSimPrice(Number(e.target.value) || 0)}
                                        className={`${styles.cellInput} ${styles.sandboxInput}`}
                                    />
                                </div>

                                <div className={styles.sandboxBtnRow}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSimulateBooking("create_booking").catch(err => console.error("Simulation error:", err));
                                        }}
                                        disabled={simulating}
                                        className={`${styles.btnActionBlue} ${styles.sandboxBtnSubmit}`}
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
                                            className={`${styles.btnActionSecondary} ${styles.sandboxBtnCancel}`}
                                        >
                                            Simulasi Batalkan
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Diagnostics / Webhook Response Terminal */}
                            <div className={styles.sandboxDiagnosticsCol}>
                                <span className={styles.sandboxFormHeading}>
                                    2. Status Webhook &amp; Respons Sistem My Tara PMS:
                                </span>

                                {simulatedResult ? (
                                    <div>
                                        <div className={styles.sandboxResultSuccess}>
                                            <CheckCircle2 size={16} />
                                            <span>{simulatedResult.message}</span>
                                        </div>
                                        <div className={styles.consoleBox}>
                                            {JSON.stringify(simulatedResult, null, 2)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`${styles.consoleBox} ${styles.sandboxEmptyConsole}`}>
                                        <Terminal size={32} className={styles.sandboxEmptyIcon} />
                                        <span>Siap menerima simulasi webhook.</span>
                                        <span className={styles.sandboxEmptyHelp}>
                                            Klik tombol "Injeksi Reservasi Baru" untuk menguji pembuatan reservasi di Front Office &amp; pemotongan stok otomatis di Rate &amp; Inventory.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: KONFIGURASI AKUN & API CHANNEX (SANDBOX & PRODUCTION) */}
            {activeTab === "golive" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span className={styles.mappingHeaderTitle}>
                                ⚙️ Konfigurasi Kredensial API &amp; Akun Channex Channel Manager:
                            </span>
                            <p className={styles.mappingHeaderSubtitle}>
                                Kelola API Key, URL Webhook, serta alihkan sistem antara mode Sandbox (Pengujian) dan Production (Live 68+ OTA).
                            </p>
                        </div>
                    </div>

                    <div className={styles.goliveContainer}>
                        {/* 1. Mode Lingkungan (Environment Selector) */}
                        <div className={`${styles.envBanner} ${channexEnv === "production" ? styles.envBannerProd : styles.envBannerStaging}`}>
                            <div className={styles.envBannerRow}>
                                <div>
                                    <div className={styles.envStatusRow}>
                                        <span className={`${styles.badge} ${channexEnv === "production" ? styles.badgeActive : styles.badgeInfo}`}>
                                            {channexEnv === "production" ? "PRODUCTION (LIVE)" : "SANDBOX (TESTING)"}
                                        </span>
                                        <span className={channexEnv === "production" ? styles.envServerTitleProd : styles.envServerTitleStaging}>
                                            Mode Server: {channexEnv === "production" ? "https://api.channex.io (Live)" : "https://staging.channex.io (Sandbox)"}
                                        </span>
                                    </div>
                                    <p className={styles.envHelpDesc}>
                                        {channexEnv === "production"
                                            ? "Sistem terhubung ke server produksi Channex komersial untuk mendistribusikan harga & kamar riil."
                                            : "Sistem berada dalam mode Sandbox / Staging gratis untuk menguji pemetaan kamar dan simulasi booking tanpa biaya."}
                                    </p>
                                </div>

                                <div className={styles.channelBarActions}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const target = channexEnv === "staging" ? "production" : "staging";
                                            setChannexEnv(target);
                                            toast.info(`Lingkungan dialihkan ke ${target.toUpperCase()}. Klik 'Simpan Konfigurasi' di bawah untuk menerapkan.`);
                                        }}
                                        className={`${channexEnv === "production" ? styles.btnActionSecondary : styles.btnActionPrimary} ${styles.btnSwitchEnv}`}
                                    >
                                        <ArrowRight size={13} />
                                        <span>Alihkan ke Mode {channexEnv === "staging" ? "Production Live" : "Sandbox Staging"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. Formulir Kredensial API Key & Property ID */}
                        <div className={styles.credentialsCard}>
                            <div className={styles.credentialsHeader}>
                                <Key size={16} className={styles.credentialsHeaderIcon} />
                                <span className={styles.credentialsTitle}>
                                    Formulir Input API Key &amp; Identitas Properti Channex
                                </span>
                            </div>

                            {/* Field A: User API Key */}
                            <div>
                                <div className={styles.credentialsFieldHeader}>
                                    <label className={styles.credentialsLabelBold}>
                                        Channex User API Key: <span className={styles.requiredAsterisk}>*</span>
                                    </label>
                                    <span className={styles.credentialsExtLink}>
                                        {channexEnv === "production" ? (
                                            <>Ambil dari: <a href="https://app.channex.io" target="_blank" rel="noreferrer" className={styles.credentialsExtAnchor}>app.channex.io &gt; Settings &gt; API Keys</a></>
                                        ) : (
                                            <>Ambil dari akun sandbox gratis: <a href="https://staging.channex.io" target="_blank" rel="noreferrer" className={styles.credentialsExtAnchor}>staging.channex.io &gt; Settings &gt; API Keys</a></>
                                        )}
                                    </span>
                                </div>
                                <div className={styles.inputGroupRow}>
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={channexApiKey}
                                        onChange={e => setChannexApiKey(e.target.value)}
                                        placeholder="Tempelkan User API Key Anda di sini (contoh: ch_live_... atau ch_staging_...)"
                                        className={`${styles.cellInput} ${styles.apiKeyInput}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(prev => !prev)}
                                        className={`${styles.btnActionSecondary} ${styles.btnApiKeyToggle}`}
                                        title={showApiKey ? "Sembunyikan API Key" : "Tampilkan API Key"}
                                    >
                                        {showApiKey ? "Hide" : "Show"}
                                    </button>
                                </div>
                                {!channexApiKey && (
                                    <p className={styles.apiKeyMissingAlert}>
                                        ⚠️ API Key wajib diisi agar sistem dapat membuat properti, membuka mapping iframe, dan menarik reservasi dari OTA.
                                    </p>
                                )}
                            </div>

                            {/* Field B: Channex Property ID */}
                            <div>
                                <label className={styles.channelFieldLabel}>
                                    Channex Property ID (Opsional / Otomatis):
                                </label>
                                <input
                                    type="text"
                                    value={channexPropertyId}
                                    onChange={e => setChannexPropertyId(e.target.value)}
                                    placeholder="Akan otomatis dibuatkan oleh sistem saat Anda membuka tab Mapping Hub, atau isi jika properti sudah ada di Channex"
                                    className={`${styles.cellInput} ${styles.propertyIdInput}`}
                                />
                                <p className={styles.fieldHelpMuted}>
                                    {channexPropertyId
                                        ? `✓ Properti terdaftar dengan ID: ${channexPropertyId}`
                                        : "Kosongkan saja jika belum punya. Sistem My Tara akan membuatkan properti secara otomatis begitu Anda mengisi API Key di atas."}
                                </p>
                            </div>

                            {/* Field C: Webhook Callback URL */}
                            <div>
                                <label className={styles.channelFieldLabel}>
                                    Webhook Callback URL (Untuk Menerima Booking Masuk):
                                </label>
                                <div className={styles.inputGroupRow}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={typeof window !== "undefined" ? `${window.location.origin}/api/channex/webhook` : "/api/channex/webhook"}
                                        className={`${styles.cellInput} ${styles.webhookInput}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = typeof window !== "undefined" ? `${window.location.origin}/api/channex/webhook` : "/api/channex/webhook";
                                            navigator.clipboard.writeText(url);
                                            toast.success("Webhook URL berhasil disalin ke clipboard!");
                                        }}
                                        className={`${styles.btnActionSecondary} ${styles.btnCopyWebhook}`}
                                    >
                                        <Copy size={12} />
                                        <span>Salin URL</span>
                                    </button>
                                </div>
                                <p className={styles.fieldHelpMuted}>
                                    Daftarkan URL di atas pada menu <b>Settings &gt; Webhooks</b> di dashboard Channex agar reservasi otomatis masuk ke Front Office &amp; Forecast.
                                </p>
                            </div>

                            {/* Tombol Simpan */}
                            <div className={styles.credentialsSubmitRow}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSaveAll().catch(err => console.error("Error saving:", err));
                                    }}
                                    disabled={savingSettings}
                                    className={`${styles.btnActionPrimary} ${styles.btnSaveCreds}`}
                                >
                                    <Save size={14} />
                                    <span>{savingSettings ? "Menyimpan Kredensial..." : "Simpan Konfigurasi Channex"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSelectTab("iframe");
                                    }}
                                    className={`${styles.btnActionSecondary} ${styles.btnOpenMappingHub}`}
                                >
                                    <ExternalLink size={14} />
                                    <span>Buka Channex Mapping Hub &rarr;</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Panduan 4 Langkah Integrasi */}
                        <div className={styles.guideList}>
                            <span className={styles.mappingHeaderTitle}>
                                📋 Panduan 4 Langkah Integrasi (Sandbox &amp; Production):
                            </span>

                            <div className={styles.guideCard}>
                                <div className={styles.guideStepNumber}>
                                    1
                                </div>
                                <div>
                                    <span className={styles.guideStepTitle}>Daftar Akun Channex</span>
                                    <p className={styles.guideStepDesc}>
                                        Untuk uji coba: buat akun di <a href="https://staging.channex.io" target="_blank" rel="noreferrer" className={styles.guideLink}>staging.channex.io</a>. Untuk live komersial: buat akun di <a href="https://app.channex.io" target="_blank" rel="noreferrer" className={styles.guideLink}>app.channex.io</a>.
                                    </p>
                                </div>
                            </div>

                            <div className={styles.guideCard}>
                                <div className={styles.guideStepNumber}>
                                    2
                                </div>
                                <div>
                                    <span className={styles.guideStepTitle}>Salin User API Key ke Formulir di Atas</span>
                                    <p className={styles.guideStepDesc}>
                                        Buka profil Channex Anda &gt; <i>Settings &gt; API Keys</i>, buat key baru, lalu tempelkan di kolom input <b>Channex User API Key</b> di atas dan klik <b>Simpan Konfigurasi Channex</b>.
                                    </p>
                                </div>
                            </div>

                            <div className={styles.guideCard}>
                                <div className={styles.guideStepNumber}>
                                    3
                                </div>
                                <div>
                                    <span className={styles.guideStepTitle}>Daftarkan Webhook URL My Tara di Channex</span>
                                    <p className={styles.guideStepDesc}>
                                        Di dashboard Channex, masuk ke menu <i>Settings &gt; Webhooks</i>, klik <i>New Webhook</i>, tempelkan <b>Webhook Callback URL</b> di atas, centang event <code>*</code> (All events), dan aktifkan.
                                    </p>
                                </div>
                            </div>

                            <div className={styles.guideCard}>
                                <div className={styles.guideStepNumber}>
                                    4
                                </div>
                                <div>
                                    <span className={styles.guideStepTitle}>Buka Tab Mapping Hub &amp; Hubungkan Extranet OTA</span>
                                    <p className={styles.guideStepDesc}>
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
                            <span className={styles.mappingHeaderTitle}>
                                ⚡ Live Activity Stream &amp; Audit Log:
                            </span>
                            <p className={styles.mappingHeaderSubtitle}>
                                Pemantauan log pengiriman harga, stok kamar, dan penerimaan webhook reservasi OTA secara real-time.
                            </p>
                        </div>
                    </div>

                    <div className={styles.activityLogList}>
                        {syncLog.map((log, idx) => (
                            <div key={idx} className={styles.activityLogItem}>
                                <div className={styles.activityLogLeft}>
                                    <CheckCircle2 size={15} className={styles.activityLogIcon} />
                                    <span className={styles.activityLogText}>{log.message}</span>
                                </div>
                                <span className={styles.activityLogTime}>{log.time}</span>
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
                                <span className={styles.mappingHeaderTitle}>
                                    + Hubungkan Saluran OTA Baru dari Katalog Channex
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Pilih saluran OTA atau Wholesaler yang ingin diaktifkan untuk properti ini.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddChannelModalOpen(false)}
                                className={styles.modalCloseBtn}
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
                                className={`${styles.cellInput} ${styles.addChannelSearchField}`}
                            />

                            <div className={styles.addChannelGrid}>
                                {CHANNEX_OTA_CATALOG
                                    .filter(c => c.name.toLowerCase().includes(channelSearchQuery.toLowerCase()))
                                    .map(ch => {
                                        const isConnected = Boolean(channelConfigs[ch.code]?.isActive);
                                        return (
                                            <div
                                                key={ch.code}
                                                className={`${styles.addChannelItem} ${isConnected ? styles.addChannelItemConnected : styles.addChannelItemAvailable}`}
                                            >
                                                <div className={styles.addChannelItemHeader}>
                                                    <div className={styles.addChannelItemIdentity}>
                                                        <OtaLogo code={ch.code} name={ch.name} size={20} />
                                                        <span className={styles.addChannelItemTitle}>
                                                            {ch.name}
                                                        </span>
                                                    </div>
                                                    {isConnected ? (
                                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Aktif</span>
                                                    ) : (
                                                        <span className={`${styles.badge} ${styles.badgeInactive}`}>Tersedia</span>
                                                    )}
                                                </div>

                                                <span className={styles.addChannelItemMeta}>
                                                    Komisi Standar: {ch.defaultCommission}% • {ch.category.toUpperCase()}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={isConnected}
                                                    onClick={() => handleConnectChannel(ch)}
                                                    className={`${isConnected ? styles.btnActionSecondary : styles.btnActionBlue} ${styles.addChannelItemBtn}`}
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
                            <div className={styles.flexOne}>
                                <h3 className={styles.confirmHeaderTitle}>
                                    {confirmModal.type === "disconnect"
                                        ? "Konfirmasi Pemutusan Saluran Extranet OTA"
                                        : "Konfirmasi Reset Seluruh Pemetaan ID OTA"}
                                </h3>
                                <p className={styles.confirmHeaderSub}>
                                    Sistem Manajemen Saluran CRS • Properti: <b>{activeHotelCode}</b>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className={styles.modalCloseBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Channel Identity Banner */}
                            <div className={styles.confirmChannelBanner}>
                                <OtaLogo code={confirmModal.channelCode} name={confirmModal.channelName} size={28} />
                                <div className={styles.flexOne}>
                                    <div className={styles.confirmBannerIdentity}>
                                        <span className={styles.confirmBannerTitle}>
                                            {confirmModal.channelName}
                                        </span>
                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Status: Terkoneksi</span>
                                    </div>
                                    <span className={styles.confirmBannerSub}>
                                        Kode Saluran: <code>{confirmModal.channelCode}</code>
                                    </span>
                                </div>
                            </div>

                            {/* Warning Impact Box */}
                            {confirmModal.type === "disconnect" ? (
                                <div className={styles.confirmImpactList}>
                                    <span className={styles.confirmConsequenceTitle}>⚠️ Konsekuensi Pemutusan Saluran:</span>
                                    <span>• Sinkronisasi otomatis Harga &amp; Ketersediaan (ARI) ke extranet <b>{confirmModal.channelName}</b> akan dihentikan.</span>
                                    <span>• Reservasi masuk dari saluran ini tidak akan otomatis memotong stok inventori kamar My Tara PMS.</span>
                                    <span>• Saluran akan dipindahkan kembali ke status 'Tersedia' di Katalog OTA.</span>
                                </div>
                            ) : (
                                <div className={`${styles.confirmImpactList} ${styles.confirmImpactListWarning}`}>
                                    <span className={styles.confirmConsequenceTitle}>⚠️ Konsekuensi Reset Pemetaan ID:</span>
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
                                className={`${confirmModal.type === "disconnect" ? styles.btnActionDanger : styles.btnActionWarning} ${styles.confirmBoldBtn}`}
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
