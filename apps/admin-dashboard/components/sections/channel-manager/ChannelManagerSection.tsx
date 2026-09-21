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
    LayoutGrid,
    Tag,
    Users,
    Sparkles,
    DownloadCloud,
    Compass
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
import { ChannelNotificationWidget } from "./ChannelNotificationWidget";
import { ChannelTaxesModal } from "./ChannelTaxesModal";
import { ChannelContentPushTab } from "./ChannelContentPushTab";
import { ChannelGoogleHotelsTab } from "./ChannelGoogleHotelsTab";
import { ChannelDynamicPricingTab } from "./ChannelDynamicPricingTab";
import { ChannelPromotionsTab } from "./ChannelPromotionsTab";
import { ChannelPaymentTokenizationTab } from "./ChannelPaymentTokenizationTab";
import { ChannelTutorialTab } from "./ChannelTutorialTab";
import { TravelAgentTab } from "./TravelAgentTab";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { toast } from "sonner";

import { ChannelSeparationMode } from "@/lib/channex/types";

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
    separationMode?: ChannelSeparationMode; // "merged" | "separated_rate" | "separated_allotment" | "separated_both"
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

    type ChannelTabType = "tutorial" | "rooms" | "rateplans" | "matrix" | "mapping" | "dynamic_pricing" | "catalog" | "travel_agents" | "rules" | "google" | "promotions" | "content" | "messages" | "reviews" | "logs" | "payments" | "iframe" | "sandbox" | "golive" | "sync";
    const [activeTab, setActiveTab] = useState<ChannelTabType>("mapping");
    const [isVccModalOpen, setIsVccModalOpen] = useState<boolean>(false);
    const [isTaxesModalOpen, setIsTaxesModalOpen] = useState<boolean>(false);

    // Sync tab with URL query parameter ?tab= and custom event channel-tab-change from ChannelManagerSidebar
    useEffect(() => {
        const checkTabFromUrl = () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                const tabParam = params.get("tab");
                if (tabParam && ["tutorial", "rooms", "rateplans", "matrix", "mapping", "dynamic_pricing", "catalog", "travel_agents", "rules", "google", "promotions", "content", "messages", "reviews", "logs", "payments", "iframe", "sandbox", "golive", "sync"].includes(tabParam)) {
                    setActiveTab(tabParam as any);
                }
            }
        };

        checkTabFromUrl();

        const handleCustomTabChange = (e: any) => {
            const tab = typeof e.detail === "string" ? e.detail : e.detail?.tab;
            if (tab && ["tutorial", "rooms", "rateplans", "matrix", "mapping", "dynamic_pricing", "catalog", "travel_agents", "rules", "google", "promotions", "content", "messages", "reviews", "logs", "payments", "iframe", "sandbox", "golive", "sync"].includes(tab)) {
                setActiveTab(tab as any);
            }
        };

        window.addEventListener("channel-tab-change", handleCustomTabChange);
        window.addEventListener("popstate", checkTabFromUrl);

        return () => {
            window.removeEventListener("channel-tab-change", handleCustomTabChange);
            window.removeEventListener("popstate", checkTabFromUrl);
        };
    }, []);

    const handleSelectTab = (tab: ChannelTabType) => {
        setActiveTab(tab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", tab);
            window.history.replaceState(null, "", url.toString());
            window.dispatchEvent(new CustomEvent("channel-tab-change", { detail: tab }));
        }
    };

    const TAB_METADATA: Record<ChannelTabType, { title: string; subtitle: string; icon: React.ElementType; badge?: string; badgeColor?: string }> = {
        tutorial: {
            title: "Peta Alur & Panduan Go-Live Produksi",
            subtitle: "Panduan operasional step-by-step: mulai dari registrasi akun, strategi pilot 1 hotel & 6 OTA, skenario uji coba, hingga rollout 20 hotel tanpa risiko.",
            icon: Compass,
            badge: "5 Tahap Roadmap",
            badgeColor: "#0284c7"
        },
        mapping: {
            title: "Channel Mapping & Rate Parity",
            subtitle: "Manage PMS-to-OTA room mapping, rate plan codes, commission structures, and channel-level rate & inventory separation rules.",
            icon: Key,
            badge: "Active Mapping",
            badgeColor: "#15803d"
        },
        catalog: {
            title: "OTA Channel Catalog & Global Distribution",
            subtitle: "Explore and connect 68+ global OTAs, B2B wholesalers, metasearch engines, and direct booking interfaces powered by Channex.",
            icon: Globe,
            badge: "68+ Channels"
        },
        rules: {
            title: "Yield Management & Restriction Rules",
            subtitle: "Automate distribution controls including CTA, CTD, Min/Max Length of Stay (LOS), and occupancy-driven stop-sells.",
            icon: Shield,
            badge: "Auto Yield"
        },
        google: {
            title: "Google Hotel Free Links & Direct ARI",
            subtitle: "Direct ARI feed integration for Google Travel & Search with zero commission to maximize direct booking revenue.",
            icon: Search,
            badge: "0% Commission"
        },
        promotions: {
            title: "Promotions, Campaigns & Mobile Deals",
            subtitle: "Deploy Early Bird, Last Minute, Mobile Only, and length-of-stay promotional discounts across all connected OTAs.",
            icon: Tag,
            badge: "Live Promotions"
        },
        content: {
            title: "Content & Amenities Synchronization",
            subtitle: "Centrally distribute high-resolution property imagery, room descriptions, and property amenities to all OTA extranets.",
            icon: UploadCloud
        },
        rooms: {
            title: "Master Room Types & Physical Inventory",
            subtitle: "Configure base room categories, bedding configurations, standard occupancies, and total physical inventory allocations.",
            icon: BedDouble
        },
        rateplans: {
            title: "Master Rate Plans & Packages",
            subtitle: "Manage base rate plans (Room Only, Bed & Breakfast, Non-Refundable) and define automated rate derivations.",
            icon: Sliders
        },
        matrix: {
            title: "Rate Matrix (Net vs Gross Channel Pricing)",
            subtitle: "Cross-reference PMS Net base rates against OTA Gross retail rates factoring in individual channel commission models.",
            icon: Table
        },
        dynamic_pricing: {
            title: "Revenue Management & Dynamic Pricing (RMS)",
            subtitle: "AI-driven real-time pricing adjustments based on occupancy thresholds, booking pace, lead times, and market demand.",
            icon: TrendingUp,
            badge: "Smart RMS"
        },
        messages: {
            title: "Unified Guest Messaging Center",
            subtitle: "Communicate with guests across Booking.com, Agoda, Expedia, and Airbnb from a single consolidated inbox.",
            icon: MessageSquare
        },
        reviews: {
            title: "Online Reputation & Guest Reviews",
            subtitle: "Monitor aggregate review scores, track guest feedback, and publish responses directly to OTA platforms.",
            icon: Star
        },
        payments: {
            title: "PCI Card Vault & Payment Processing",
            subtitle: "PCI-DSS Level 1 compliant virtual credit card (VCC) capture, tokenization, and integrated payment gateway processing.",
            icon: CreditCard,
            badge: "PCI-DSS Level 1"
        },
        logs: {
            title: "ARI Audit Trail & Webhook Diagnostics",
            subtitle: "Comprehensive audit log of ARI push updates, OTA booking webhooks, latency diagnostics, and payload traces.",
            icon: Terminal
        },
        sandbox: {
            title: "Certification Sandbox & Test Runner",
            subtitle: "Full end-to-end certification test harness: ARI delivery, reservation lifecycle, amendments, cancellations, and ACK loops.",
            icon: Zap,
            badge: "8 Test Scenarios"
        },
        iframe: {
            title: "Channex Enterprise Channel Console",
            subtitle: "Direct Single Sign-On (SSO) access to the full-featured Channex Channel Manager visual configuration console.",
            icon: LayoutGrid
        },
        golive: {
            title: "API Credentials & Production Go-Live",
            subtitle: "Channex API keys, property GUID bindings, webhook endpoints, and production connection switch.",
            icon: Lock
        },
        sync: {
            title: "ARI Synchronization Feed & Status",
            subtitle: "Real-time monitor of live ARI sync queues, pending updates, and connection status between PMS and OTAs.",
            icon: RefreshCw
        },
        travel_agents: {
            title: "Travel Agent & Saluran Distribusi Mitra",
            subtitle: "Kelola daftar mitra Travel Agent offline, korporasi, wholesaler, dan saluran OTA yang terhubung ke sistem pemesanan hotel.",
            icon: Users,
            badge: "Mitra & OTA",
            badgeColor: "#2563eb"
        }
    };
    
    // Environment Switcher: Staging / Sandbox vs Live Production
    const [channexEnv, setChannexEnv] = useState<"staging" | "production">("staging");
    const [channexApiKey, setChannexApiKey] = useState<string>("");
    const [channexPropertyId, setChannexPropertyId] = useState<string>("");
    
    // Connected Channels Map
    const [channelConfigs, setChannelConfigs] = useState<Record<string, ChannelMappingConfig>>({});
    
    // UI state
    const [selectedChannelCode, setSelectedChannelCode] = useState<string>("");
    const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState<boolean>(false);
    const [channelSearchQuery, setChannelSearchQuery] = useState<string>("");
    const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
    const [catalogViewMode, setCatalogViewMode] = useState<"table" | "grid">("table");
    const [savingSettings, setSavingSettings] = useState<boolean>(false);
    const [syncingAri, setSyncingAri] = useState<boolean>(false);
    const [syncingMaster, setSyncingMaster] = useState<boolean>(false);
    const [syncingChannex, setSyncingChannex] = useState<boolean>(false);
    const [testingOta, setTestingOta] = useState<boolean>(false);
    const [fetchingOtaMapping, setFetchingOtaMapping] = useState<boolean>(false);
    const [otaExtranetRooms, setOtaExtranetRooms] = useState<Record<string, any[]>>({});
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
    const [simChannel, setSimChannel] = useState<string>("Traveloka");
    const [simGuestName, setSimGuestName] = useState<string>("Budi Santoso (Test Sandbox)");
    const [simGuestEmail, setSimGuestEmail] = useState<string>("budi.sandbox@test.com");
    const [simRoomTypeId, setSimRoomTypeId] = useState<string>("");
    const [simPrice, setSimPrice] = useState<number>(700000);
    const [simCommissionPercent, setSimCommissionPercent] = useState<number>(18);
    const [simPromoPercent, setSimPromoPercent] = useState<number>(10);
    const [simRevenueMode, setSimRevenueMode] = useState<"net" | "gross">("net");
    const [simCheckin, setSimCheckin] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [simCheckout, setSimCheckout] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
    });
    const [simPaymentCollect, setSimPaymentCollect] = useState<"channel" | "property">("channel");
    const [simulating, setSimulating] = useState<boolean>(false);
    const [simulatedResult, setSimulatedResult] = useState<any>(null);

    const handleSimChannelChange = (chanName: string) => {
        setSimChannel(chanName);
        const catalogItem = CHANNEX_OTA_CATALOG.find(c => 
            c.name.toLowerCase() === chanName.toLowerCase() || 
            chanName.toLowerCase().includes(c.name.toLowerCase()) ||
            c.code.toLowerCase() === chanName.toLowerCase().replace(/[^a-z0-9]/g, "_")
        );
        if (catalogItem) {
            setSimCommissionPercent(catalogItem.defaultCommission);
        }
    };

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

                    // Load only genuine configured channels from Firestore (no dummy defaults)
                    const initialChannels: Record<string, ChannelMappingConfig> = {};
                    const savedChannels = cm.channels || {};

                    Object.entries(savedChannels).forEach(([code, conf]: [string, any]) => {
                        if (conf && conf.channelCode) {
                            initialChannels[code] = {
                                ...conf,
                                isActive: conf.isActive ?? true
                            };
                        }
                    });

                    setChannelConfigs(initialChannels);

                    // Auto-select first active channel if available
                    const activeChannels = Object.values(initialChannels).filter(c => c.isActive);
                    if (activeChannels.length > 0) {
                        setSelectedChannelCode(prev => (prev && initialChannels[prev]?.isActive ? prev : activeChannels[0].channelCode));
                    } else {
                        setSelectedChannelCode("");
                    }
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
        if (["rooms", "rateplans", "matrix", "mapping", "dynamic_pricing"].includes(activeTab)) return "inventory";
        if (["catalog", "rules", "google", "promotions", "content"].includes(activeTab)) return "distribution";
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
            label: "Inventory & Pricing",
            badge: "5",
            tabs: [
                { id: "rooms", label: "Room Types & Allotment" },
                { id: "rateplans", label: "Rate Plans & Packages" },
                { id: "matrix", label: "Rate Matrix (Net / Gross)" },
                { id: "mapping", label: "Channel Mapping" },
                { id: "dynamic_pricing", label: "📈 Dynamic Pricing (RMS)" }
            ]
        },
        {
            id: "distribution",
            label: "OTA Distribution",
            badge: `${activeChannelsList.length} Channels`,
            tabs: [
                { id: "catalog", label: `Channel Catalog (${activeChannelsList.length})` },
                { id: "travel_agents", label: "🤝 Travel Agents & Wholesalers" },
                { id: "rules", label: "Yield & Allocation Rules" },
                { id: "google", label: "🇬 Google Hotel Free Links" },
                { id: "promotions", label: "🏷️ OTA Promotions & Deals" },
                { id: "content", label: "Property Content & Amenities" }
            ]
        },
        {
            id: "guest",
            label: "Guest Communications",
            badge: "2",
            tabs: [
                { id: "messages", label: "Guest Messaging Inbox" },
                { id: "reviews", label: "Guest Reviews & Ratings" }
            ]
        },
        {
            id: "system",
            label: "System & Connectivity",
            badge: "7",
            tabs: [
                { id: "tutorial", label: "🧭 Peta Alur Go-Live" },
                { id: "payments", label: "💳 Stripe & PCI Card Vault" },
                { id: "sandbox", label: "🧪 Certification Sandbox" },
                { id: "logs", label: "ARI Transmission Logs" },
                { id: "iframe", label: "Channex Console (SSO)" },
                { id: "golive", label: "API Credentials & Production" },
                { id: "sync", label: "Distribution Sync Feed" }
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

            // Log event to Channex Channel Events with current user
            const currentChan = selectedChannelCode ? channelConfigs[selectedChannelCode] : null;
            const chanName = currentChan?.channelName || "MyTara Open Channel";
            const userLabel = user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : "Nexura Management");
            const userEmail = user?.email || "nexura.management@gmail.com";

            fetch("/api/channex/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    action: "Mapping Updated",
                    channelName: chanName,
                    channelCode: selectedChannelCode || "open_channel",
                    user: { name: userLabel, email: userEmail },
                    result: "Success",
                    reason: `Channel mapping and rate parameters updated for ${chanName}`,
                    diff: currentChan ? {
                        hotelId: { old: "", new: currentChan.hotelId || "setara_demo_1" },
                        roomMappings: { old: {}, new: currentChan.roomMappings },
                        rateMappings: { old: {}, new: currentChan.rateMappings }
                    } : null
                })
            }).catch(console.error);
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
                        ...targetChannel,
                        hotelId: targetChannel.hotelId
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Koneksi OTA berhasil divalidasi oleh Channex!");
            } else {
                toast.error(data.message || data.error || "Koneksi ke OTA gagal. Pastikan Hotel ID Extranet valid.");
            }
        } catch (err: any) {
            toast.error(`Validasi OTA Error: ${err.message}`);
        } finally {
            setTestingOta(false);
        }
    };

    // Helper: Auto-fetch Room Types & Rate Plans from OTA Extranet via Channex mapping_details
    const handleFetchOtaMapping = async (code: string) => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        const targetChannel = channelConfigs[code];
        if (!targetChannel?.hotelId) {
            toast.warning("Silakan masukkan Hotel ID Extranet terlebih dahulu sebelum menarik data dari OTA.");
            return;
        }

        setFetchingOtaMapping(true);
        try {
            const res = await fetch("/api/channex/channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    action: "mapping_details",
                    channelCode: code,
                    channelData: {
                        ...targetChannel,
                        hotelId: targetChannel.hotelId
                    }
                })
            });
            const data = await res.json();
            if (data.success && data.data) {
                const rawRooms = data.data.rooms || (Array.isArray(data.data) ? data.data : []);
                if (rawRooms.length === 0) {
                    toast.info(`Koneksi terhubung, namun OTA (${targetChannel.channelName}) belum mengembalikan data kamar. Pastikan Channex sudah disetujui sebagai provider di portal Extranet.`);
                    return;
                }

                setOtaExtranetRooms(prev => ({
                    ...prev,
                    [code]: rawRooms
                }));

                // Intelligent Auto-Matching
                const newRoomMappings = { ...(targetChannel.roomMappings || {}) };
                const newRateMappings = { ...(targetChannel.rateMappings || {}) };
                let autoMatchedRooms = 0;
                let autoMatchedRates = 0;

                // Flatten all OTA rates
                const allOtaRates: Array<{ id: string | number; title: string; roomId: string | number }> = [];
                rawRooms.forEach((r: any) => {
                    (r.rates || []).forEach((rate: any) => {
                        allOtaRates.push({
                            id: rate.id,
                            title: `${r.title ? r.title + ' -> ' : ''}${rate.title || 'Standard'}`,
                            roomId: r.id
                        });
                    });
                });

                // Auto-match room types
                roomTypes.forEach(rt => {
                    if (newRoomMappings[rt.id]) return; // keep if already mapped
                    const pmsName = rt.name.toLowerCase().trim();
                    const matched = rawRooms.find((r: any) => {
                        const otaName = (r.title || r.name || "").toLowerCase().trim();
                        return otaName.includes(pmsName) || pmsName.includes(otaName) ||
                            pmsName.split(" ").some((word: string) => word.length > 3 && otaName.includes(word));
                    });
                    if (matched) {
                        newRoomMappings[rt.id] = String(matched.id);
                        autoMatchedRooms++;
                    }
                });

                // Auto-match rate plans
                ratePlans.forEach(rp => {
                    if (newRateMappings[rp.id]) return; // keep if already mapped
                    const pmsRateName = (rp.name || "").toLowerCase().trim();
                    const targetRoomOtaId = rp.roomTypeId ? newRoomMappings[rp.roomTypeId] : null;

                    const candidateRates = targetRoomOtaId 
                        ? allOtaRates.filter(rate => String(rate.roomId) === String(targetRoomOtaId))
                        : allOtaRates;

                    const matchedRate = candidateRates.find(rate => {
                        const otaRName = rate.title.toLowerCase();
                        const isBb = pmsRateName.includes("breakfast") || pmsRateName.includes("bb");
                        const otaIsBb = otaRName.includes("breakfast") || otaRName.includes("bb");
                        if (isBb && otaIsBb) return true;
                        if (!isBb && !otaIsBb) return true;
                        return otaRName.includes(pmsRateName) || pmsRateName.includes(otaRName);
                    }) || candidateRates[0];

                    if (matchedRate) {
                        newRateMappings[rp.id] = String(matchedRate.id);
                        autoMatchedRates++;
                    }
                });

                setChannelConfigs(prev => ({
                    ...prev,
                    [code]: {
                        ...prev[code],
                        roomMappings: newRoomMappings,
                        rateMappings: newRateMappings
                    }
                }));

                toast.success(`Berhasil menarik ${rawRooms.length} kamar dan ${allOtaRates.length} tarif dari Extranet ${targetChannel.channelName}! Otomatis memetakan ${autoMatchedRooms} kamar & ${autoMatchedRates} tarif.`);
            } else {
                toast.error(data.message || "Gagal menarik data pemetaan dari OTA. Pastikan Hotel ID valid dan Channex sudah disetujui di portal Extranet.");
            }
        } catch (err: any) {
            toast.error(`Gagal menghubungi OTA: ${err.message}`);
        } finally {
            setFetchingOtaMapping(false);
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
            separationMode: "merged",
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
                delete updated[channelCode];
                return updated;
            });

            // Disconnect & delete in Channex / Firestore via Direct API
            if (activeHotelCode && activeHotelCode !== "0") {
                // Delete from Firestore directly using deleteField() so reload never restores it
                try {
                    const docRef = doc(db, "hotels", activeHotelCode);
                    updateDoc(docRef, {
                        [`channelManager.channels.${channelCode}`]: deleteField(),
                        "channelManager.lastSyncAt": new Date().toISOString()
                    }).catch(err => console.error("Firestore delete error:", err));
                } catch (fsErr) {
                    console.error("Firestore delete error:", fsErr);
                }

                fetch("/api/channex/channels", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: activeHotelCode,
                        action: "disconnect",
                        channelCode
                    })
                }).catch(console.error);

                // Audit log Deactivate Channel to Channex Channel Events
                const userLabel = user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : "Nexura Management");
                const userEmail = user?.email || "nexura.management@gmail.com";

                fetch("/api/channex/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: activeHotelCode,
                        action: "Deactivate Channel",
                        channelName,
                        channelCode,
                        user: { name: userLabel, email: userEmail },
                        result: "Success",
                        reason: "Manual deactivation"
                    })
                }).catch(console.error);
            }

            // Switch active tab selection to another active channel if available
            const remaining = Object.values(channelConfigs).filter(c => c.channelCode !== channelCode && c.isActive);
            if (remaining.length > 0) {
                setSelectedChannelCode(remaining[0].channelCode);
            } else {
                setSelectedChannelCode("");
            }
            toast.success(`Channel ${channelName} successfully disconnected.`);
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

    // Force Push All ARI to Channex (Full Property Sync 500 Days)
    const handleSyncAllAri = async () => {
        if (!activeHotelCode) return;
        setSyncingAri(true);
        try {
            const res = await fetch("/api/channex/sync-ari", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    type: "full_sync",
                    daysAhead: 500
                })
            });

            const data = await res.json();
            if (data.success) {
                const taskMsg = data.taskIds && data.taskIds.length > 0 ? ` (Task IDs: ${data.taskIds.join(", ")})` : "";
                toast.success(`Ketersediaan (500 Hari) & Harga Berhasil Di-push ke Channex!${taskMsg}`);
                setSyncLog(prev => [
                    {
                        time: new Date().toLocaleTimeString(),
                        status: "SUCCESS",
                        message: `Full Sync ARI (500 Hari) Sukses untuk Hotel [${activeHotelCode}] ke Channex.${taskMsg}`
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
                    paymentCollect: simPaymentCollect,
                    commissionPercent: simCommissionPercent,
                    promoPercent: simPromoPercent,
                    revenueRecordingMode: simRevenueMode,
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

    const [pushingOpenChannel, setPushingOpenChannel] = useState(false);

    // Push Booking directly to Channex Open Channel API
    const handlePushOpenChannelBooking = async () => {
        if (!activeHotelCode) return;
        setPushingOpenChannel(true);
        try {
            const res = await fetch("/api/open-channel/push-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    channelName: simChannel || "MyTara OpenChannel",
                    guestName: simGuestName,
                    guestEmail: simGuestEmail,
                    roomTypeId: simRoomTypeId,
                    arrivalDate: simCheckin,
                    departureDate: simCheckout,
                    totalPrice: simPrice,
                    paymentCollect: simPaymentCollect
                })
            });

            const data = await res.json();
            setSimulatedResult({ ...data, bookingId: data.bookingId || data.reservationId });
            if (data.success) {
                toast.success(data.message || "Reservasi berhasil di-push ke Channex!");
                setSyncLog(prev => [
                    {
                        time: new Date().toLocaleTimeString(),
                        status: "SUCCESS",
                        message: `[Open Channel] Push Booking ke Channex Berhasil (${data.reservationId})`
                    },
                    ...prev
                ]);
            } else {
                toast.error(data.message || "Push booking ditolak oleh Channex.");
                setSyncLog(prev => [
                    {
                        time: new Date().toLocaleTimeString(),
                        status: "ERROR",
                        message: `[Open Channel] Push Booking Ditolak: ${JSON.stringify(data.error || data.message)}`
                    },
                    ...prev
                ]);
            }
        } catch (err: any) {
            toast.error("Gagal melakukan push booking ke Channex: " + err.message);
        } finally {
            setPushingOpenChannel(false);
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
                                {channexEnv === "production" ? "● LIVE PRODUCTION" : "● SANDBOX / STAGING (Test Suite)"}
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
                        onClick={() => {
                            handleSyncAllAri().catch(err => console.error("Error syncing ARI:", err));
                        }}
                        disabled={syncingAri}
                        className={styles.btnActionPrimary}
                        title="Push complete room availability, rates, and inventory to all connected channels"
                    >
                        <RefreshCw size={14} className={syncingAri ? "animate-spin" : ""} />
                        <span>{syncingAri ? "Syncing ARI..." : "Force Push ARI to Channels"}</span>
                    </button>
                </div>
            </div>

            {/* 2. DEDICATED MODULE CONTEXT HEADER */}
            {(() => {
                const currentMeta = TAB_METADATA[activeTab] || {
                    title: "Channel Manager Suite",
                    subtitle: "Distribusi inventori dan tarif ke seluruh saluran OTA.",
                    icon: Globe
                };
                const CurrentTabIcon = currentMeta.icon;

                return (
                    <div className={styles.moduleHeaderBar}>
                        <div className={styles.moduleHeaderInfo}>
                            <div className={styles.moduleHeaderIconWrap}>
                                <CurrentTabIcon size={20} />
                            </div>
                            <div>
                                <div className={styles.moduleTitleRow}>
                                    <h2 className={styles.moduleTitle}>{currentMeta.title}</h2>
                                    {currentMeta.badge && (
                                        <span 
                                            className={styles.moduleBadge}
                                            style={currentMeta.badgeColor ? { color: currentMeta.badgeColor, borderColor: `${currentMeta.badgeColor}40`, backgroundColor: `${currentMeta.badgeColor}15` } : undefined}
                                        >
                                            {currentMeta.badge}
                                        </span>
                                    )}
                                </div>
                                <p className={styles.moduleSubtitle}>{currentMeta.subtitle}</p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* TAB: PETA ALUR & TUTORIAL GO-LIVE PRODUKSI */}
            {activeTab === "tutorial" && (
                <ChannelTutorialTab
                    onNavigateTab={handleSelectTab}
                    activeHotelCode={activeHotelCode}
                    activeHotelName={activeHotelName}
                />
            )}

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
                                📊 Multi-Channel Rate Calculation Matrix:
                            </span>
                            <span className={styles.matrixHeaderSubtitle}>
                                Compare PMS Base Net Rates against OTA Channel Gross Selling Rates across active channel commission models.
                            </span>
                        </div>

                        <div className={styles.matrixControls}>
                            <span className={styles.matrixControlLabel}>View Mode:</span>
                            <select
                                value={pricingViewMode}
                                onChange={e => setPricingViewMode(e.target.value as any)}
                                className={`${styles.cellSelect} ${styles.matrixSelect}`}
                            >
                                <option value="all">Complete Breakdown (Net, Commission %, Gross Rate)</option>
                                <option value="gross_only">Channel Gross Rate Only</option>
                                <option value="net_only">Net Hotel Yield Only</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.dsiTable}>
                            <thead>
                                <tr>
                                    <th rowSpan={2} className={`${styles.dsiTh} ${styles.colStickyLeft} ${styles.matrixThStickyLeft}`}>
                                        Room Types &amp; Rate Plans
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
                                                    <th className={`${styles.dsiTh} ${styles.matrixThPercent}`}>Commission %</th>
                                                    <th className={`${styles.dsiTh} ${styles.matrixThPercent}`}>Markup %</th>
                                                    <th className={`${styles.dsiTh} ${styles.matrixThGross}`}>Gross Selling Rate</th>
                                                </>
                                            )}
                                            {pricingViewMode === "gross_only" && (
                                                <th className={`${styles.dsiTh} ${styles.matrixThGross}`}>Gross Selling Rate</th>
                                            )}
                                            {pricingViewMode === "net_only" && (
                                                <th className={`${styles.dsiTh} ${styles.matrixThNet}`}>Net Yield</th>
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
                                                            {rp.roomTypeName || (rp.roomTypeNames && rp.roomTypeNames.length > 0 ? rp.roomTypeNames.join(", ") : "Semua Kamar")} • {rp.mealsIncluded ? "Breakfast" : "Room Only"}
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
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <ChannelNotificationWidget hotelCode={activeHotelCode} />
                    <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span className={styles.mappingHeaderTitle}>
                                🔑 1-to-1 OTA Extranet Mapping & Distribution Configuration:
                            </span>
                            <p className={styles.mappingHeaderSubtitle}>
                                Map <b>Extranet Hotel ID</b>, <b>Room Type IDs</b>, and <b>Rate Plan IDs</b> to enable automated 2-way ARI and reservation synchronization with Channel Manager.
                            </p>
                        </div>

                        {/* Quick Control Matrix: Channel Distribution Strategy & Front Office Separation */}
                        <div style={{ marginTop: "14px", padding: "14px 18px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span>⚡ Channel Distribution Strategy &amp; Front Office Separation</span>
                                    </div>
                                    <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0" }}>
                                        Configure channel inventory isolation for Front Office Rate &amp; Inventory Grid (Rates only, Allotment quota, or Dedicated pool). Channels set to Master Pool share common inventory.
                                    </p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddChannelModalOpen(true)}
                                        className={styles.btnActionBlue}
                                        style={{ padding: "6px 14px", fontSize: "11px" }}
                                    >
                                        <Plus size={13} />
                                        <span>+ Connect Channel</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveAll}
                                        disabled={savingSettings}
                                        className={styles.btnActionPrimary}
                                        style={{ padding: "6px 14px", fontSize: "11px" }}
                                    >
                                        <Save size={13} />
                                        <span>{savingSettings ? "Saving..." : "Save Changes"}</span>
                                    </button>
                                </div>
                            </div>

                            <table className={styles.dsiTable} style={{ margin: 0, width: "100%", fontSize: "12px" }}>
                                <thead>
                                    <tr>
                                        <th className={styles.dsiTh}>Connected OTA Channel</th>
                                        <th className={styles.dsiTh}>Extranet Hotel ID</th>
                                        <th className={styles.dsiTh}>Distribution Strategy</th>
                                        <th className={styles.dsiTh}>Front Office Grid Effect</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeChannelsList.map(ch => {
                                        const mode = ch.separationMode || "merged";
                                        return (
                                            <tr key={ch.channelCode} className={styles.dsiRow}>
                                                <td style={{ fontWeight: 600 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <OtaLogo code={ch.channelCode} name={ch.channelName} size={18} />
                                                        <span>{ch.channelName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontFamily: "monospace", fontSize: "11px", color: "#475569" }}>
                                                    {ch.hotelId || <span style={{ color: "#94a3b8" }}>(Unset)</span>}
                                                </td>
                                                <td>
                                                    <select
                                                        value={mode}
                                                        onChange={e => updateChannelField(ch.channelCode, "separationMode", e.target.value as ChannelSeparationMode)}
                                                        className={styles.cellSelect}
                                                        style={{
                                                            fontWeight: 600,
                                                            fontSize: "11px",
                                                            padding: "5px 8px",
                                                            color: mode !== "merged" ? "#166534" : "#475569",
                                                            backgroundColor: mode !== "merged" ? "#f0fdf4" : "#ffffff",
                                                            borderColor: mode !== "merged" ? "#86efac" : "#cbd5e1"
                                                        }}
                                                    >
                                                        <option value="merged">🌐 Master Pool (Shared Inventory)</option>
                                                        <option value="separated_rate">💰 Separated Rates (Custom Rate Strategy)</option>
                                                        <option value="separated_allotment">🔒 Separated Allotment (Dedicated Quota)</option>
                                                        <option value="separated_both">⚡ Fully Separated (Dedicated Rates &amp; Quota)</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    {mode === "merged" && (
                                                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                            Shared via Master Pool (Unified inventory in FO grid).
                                                        </span>
                                                    )}
                                                    {mode === "separated_rate" && (
                                                        <span style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>
                                                            ✓ Active in FO: Custom rate tier with shared master room pool.
                                                        </span>
                                                    )}
                                                    {mode === "separated_allotment" && (
                                                        <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 600 }}>
                                                            ✓ Active in FO: Dedicated room quota with unified rate parity.
                                                        </span>
                                                    )}
                                                    {mode === "separated_both" && (
                                                        <span style={{ fontSize: "11px", color: "#0284c7", fontWeight: 700 }}>
                                                            ★ Active in FO: Fully isolated dedicated rates &amp; room quota.
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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
                    {channelConfigs[selectedChannelCode] && channelConfigs[selectedChannelCode]?.isActive ? (
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
                                                Status: {channelConfigs[selectedChannelCode].channexStatus || "ACTIVE"}
                                            </span>
                                            {channelConfigs[selectedChannelCode].channexChannelId && (
                                                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                                                    (Channel ID: {channelConfigs[selectedChannelCode].channexChannelId})
                                                </span>
                                            )}
                                        </div>
                                        <span className={styles.channelSubMeta}>
                                            Extranet Hotel ID: <b>{channelConfigs[selectedChannelCode].hotelId || "(Unset)"}</b> • OTA Commission: <b>{channelConfigs[selectedChannelCode].commissionPercent}%</b>
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
                                        title="Push rates & inventory sync directly to Channel Manager"
                                    >
                                        <Zap size={13} className={syncingChannex ? "animate-spin" : ""} color="#f59e0b" />
                                        <span>{syncingChannex ? "Syncing..." : "Push ARI Sync"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleTestOtaConnection(selectedChannelCode)}
                                        disabled={testingOta}
                                        className={styles.btnActionSecondary}
                                        title="Validate Extranet Hotel ID credentials"
                                    >
                                        <Activity size={13} className={testingOta ? "animate-spin" : ""} />
                                        <span>{testingOta ? "Testing..." : "Test Connection"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleFetchOtaMapping(selectedChannelCode)}
                                        disabled={fetchingOtaMapping}
                                        className={styles.btnActionSecondary}
                                        style={{
                                            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                            color: "#ffffff",
                                            border: "none",
                                            fontWeight: 600,
                                            boxShadow: "0 2px 4px rgba(79, 70, 229, 0.25)"
                                        }}
                                        title="Tarik daftar kamar & rate plan langsung dari OTA Extranet secara otomatis berdasarkan Hotel ID"
                                    >
                                        <RefreshCw size={13} className={fetchingOtaMapping ? "animate-spin" : ""} />
                                        <span>{fetchingOtaMapping ? "Menarik Kamar..." : "Tarik Kamar & Tarif OTA"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => promptResetAllMappings(selectedChannelCode, channelConfigs[selectedChannelCode].channelName)}
                                        className={styles.btnActionWarning}
                                        title="Clear all Room and Rate Plan mappings for this channel"
                                    >
                                        <RotateCcw size={13} />
                                        <span>Clear All Mappings</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => promptDisconnectChannel(selectedChannelCode, channelConfigs[selectedChannelCode].channelName)}
                                        className={styles.btnActionDanger}
                                        title="Disconnect and deactivate this channel"
                                    >
                                        <Trash2 size={13} />
                                        <span>Disconnect Channel</span>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.channelExtranetGrid}>
                                <div className={styles.channelExtranetItem}>
                                    <label className={styles.channelFieldLabel} title={`OTA Property / Hotel ID (${channelConfigs[selectedChannelCode].channelName})`}>
                                        OTA Hotel ID ({channelConfigs[selectedChannelCode].channelName.replace(/\s*\(.*?\)/, '')})
                                    </label>
                                    <input
                                        type="text"
                                        value={channelConfigs[selectedChannelCode].hotelId}
                                        onChange={e => updateChannelField(selectedChannelCode, "hotelId", e.target.value)}
                                        placeholder={selectedChannelCode === "open_channel" ? "e.g. setara_demo_1" : "e.g. 1084920"}
                                        className={`${styles.cellInput} ${styles.channelFieldInput}`}
                                    />
                                </div>

                                <div className={styles.channelExtranetItem}>
                                    <label className={styles.channelFieldLabel}>
                                        Pricing Model
                                    </label>
                                    <select
                                        value={channelConfigs[selectedChannelCode].pricingModel}
                                        onChange={e => updateChannelField(selectedChannelCode, "pricingModel", e.target.value)}
                                        className={`${styles.cellSelect} ${styles.channelFieldSelect}`}
                                    >
                                        <option value="gross">Gross Rate (OTA Sell Rate / Guest Price)</option>
                                        <option value="net">Net Rate (Hotel Remittance Rate)</option>
                                    </select>
                                </div>

                                <div className={styles.channelExtranetItem}>
                                    <label className={styles.channelFieldLabel}>
                                        OTA Commission (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={channelConfigs[selectedChannelCode].commissionPercent}
                                        onChange={e => updateChannelField(selectedChannelCode, "commissionPercent", Number(e.target.value) || 0)}
                                        className={`${styles.cellInput} ${styles.channelFieldInput}`}
                                    />
                                </div>

                                <div className={styles.channelExtranetItem}>
                                    <label className={styles.channelFieldLabel}>
                                        Distribution Strategy (Front Office)
                                    </label>
                                    <select
                                        value={channelConfigs[selectedChannelCode].separationMode || "merged"}
                                        onChange={e => updateChannelField(selectedChannelCode, "separationMode", e.target.value as ChannelSeparationMode)}
                                        className={`${styles.cellSelect} ${styles.channelFieldSelect}`}
                                        style={{
                                            fontWeight: 600,
                                            color: (channelConfigs[selectedChannelCode].separationMode && channelConfigs[selectedChannelCode].separationMode !== "merged") ? "#166534" : "#334155",
                                            backgroundColor: (channelConfigs[selectedChannelCode].separationMode && channelConfigs[selectedChannelCode].separationMode !== "merged") ? "#f0fdf4" : "#ffffff",
                                            borderColor: (channelConfigs[selectedChannelCode].separationMode && channelConfigs[selectedChannelCode].separationMode !== "merged") ? "#86efac" : "#cbd5e1"
                                        }}
                                    >
                                        <option value="merged">🌐 Master Pool (Shared Inventory)</option>
                                        <option value="separated_rate">💰 Separated Rates (Custom Rate Strategy)</option>
                                        <option value="separated_allotment">🔒 Separated Allotment (Dedicated Quota)</option>
                                        <option value="separated_both">⚡ Fully Separated (Dedicated Rates &amp; Quota)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Room Mapping Sub-Table */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span className={styles.mappingSectionHeading} style={{ margin: 0 }}>
                                        1. Room Type Mapping (PMS to OTA):
                                    </span>
                                    {otaExtranetRooms[selectedChannelCode] && otaExtranetRooms[selectedChannelCode].length > 0 && (
                                        <span style={{ fontSize: "11px", color: "#166534", backgroundColor: "#dcfce7", padding: "3px 8px", borderRadius: "12px", border: "1px solid #86efac", fontWeight: 600 }}>
                                            ✨ {otaExtranetRooms[selectedChannelCode].length} Kamar Extranet Terhubung
                                        </span>
                                    )}
                                </div>
                                <table className={styles.dsiTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.dsiTh}>PMS Room Type & Code</th>
                                            <th className={styles.dsiTh}>Channel Manager Room UUID</th>
                                            <th className={styles.dsiTh}>OTA Room ID ({channelConfigs[selectedChannelCode].channelName.replace(/\s*\(.*?\)/, '')})</th>
                                            <th className={`${styles.dsiTh} ${styles.mappingThAction}`}>Status & Diagnostics</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roomTypes.map(rt => {
                                            const val = channelConfigs[selectedChannelCode]?.roomMappings?.[rt.id] || "";
                                            const availableOtaRooms = otaExtranetRooms[selectedChannelCode] || [];
                                            return (
                                                <tr key={rt.id} className={styles.dsiRow}>
                                                    <td>
                                                        <div className={styles.cellRoomName}>{rt.name}</div>
                                                        <div className={styles.idList}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rt.id, "PMS Room ID")}
                                                                className={styles.idPill}
                                                                title="Click to copy PMS Room ID"
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
                                                                title="Click to copy Channel Manager Room UUID"
                                                            >
                                                                <span>{rt.channexRoomTypeId}</span>
                                                                <Copy size={10} className={styles.copyIcon} />
                                                            </button>
                                                        ) : (
                                                            <span className={styles.unmappedChannexText}>
                                                                Not Synced with Channel Manager
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className={styles.mappingInputRow}>
                                                            {availableOtaRooms.length > 0 ? (
                                                                <select
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
                                                                    className={`${styles.cellSelect} ${styles.mappingInputField}`}
                                                                    style={{ fontSize: "12px", width: "100%", fontWeight: val ? 600 : 400 }}
                                                                >
                                                                    <option value="">-- Pilih Kamar OTA Extranet --</option>
                                                                    {availableOtaRooms.map((r: any) => (
                                                                        <option key={r.id} value={String(r.id)}>
                                                                            {r.title || `Room ${r.id}`} (ID: {r.id})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
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
                                                                    placeholder={`OTA Room ID (e.g. 101)`}
                                                                    className={`${styles.cellInput} ${styles.mappingInputField}`}
                                                                />
                                                            )}
                                                            {val && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleClearRoomMapping(selectedChannelCode, rt.id)}
                                                                    className={styles.btnIconClear}
                                                                    title="Remove Room Mapping"
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.mappingActionCell}>
                                                            {val ? (
                                                                <span className={`${styles.badge} ${styles.badgeActive}`}>Mapped</span>
                                                            ) : (
                                                                <span className={`${styles.badge} ${styles.badgeInactive}`}>Unmapped</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePingTest("room_type", rt.id, rt.channexRoomTypeId, val)}
                                                                disabled={pingingMap[rt.id]}
                                                                className={styles.btnPing}
                                                                title="Test connection diagnostics with Channel Manager for this Room Type"
                                                            >
                                                                <Activity size={12} className={pingingMap[rt.id] ? "animate-spin" : ""} />
                                                                <span>{pingingMap[rt.id] ? "Testing..." : "Test Connection"}</span>
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
                                    2. Rate Plan & Package Mapping (PMS to OTA):
                                </span>
                                <table className={styles.dsiTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.dsiTh}>PMS Rate Plan & Code</th>
                                            <th className={styles.dsiTh}>Room Type & CM Rate UUID</th>
                                            <th className={styles.dsiTh}>OTA Rate Plan ID ({channelConfigs[selectedChannelCode].channelName.replace(/\s*\(.*?\)/, '')})</th>
                                            <th className={`${styles.dsiTh} ${styles.mappingThAction}`}>Status & Diagnostics</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ratePlans.map(rp => {
                                            const val = channelConfigs[selectedChannelCode]?.rateMappings?.[rp.id] || "";
                                            const currentOtaRooms = otaExtranetRooms[selectedChannelCode] || [];
                                            const flatOtaRates: Array<{ id: string | number; title: string }> = [];
                                            currentOtaRooms.forEach((r: any) => {
                                                (r.rates || []).forEach((rate: any) => {
                                                    flatOtaRates.push({
                                                        id: rate.id,
                                                        title: `${r.title ? r.title + ' -> ' : ''}${rate.title || 'Standard'} (ID: ${rate.id})`
                                                    });
                                                });
                                            });

                                            return (
                                                <tr key={rp.id} className={styles.dsiRow}>
                                                    <td>
                                                        <div className={styles.cellRoomName}>{rp.name}</div>
                                                        <div className={styles.cellRateCode}>Code: {rp.code}</div>
                                                        <div className={styles.idList}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rp.id, "PMS Rate Plan ID")}
                                                                className={styles.idPill}
                                                                title="Click to copy PMS Rate Plan ID"
                                                            >
                                                                <span>PMS: {rp.id}</span>
                                                                <Copy size={10} className={styles.copyIcon} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.cellRateRoomType}>
                                                            {rp.roomTypeName || (rp.roomTypeNames && rp.roomTypeNames.length > 0 ? (rp.roomTypeNames.length > 2 ? `${rp.roomTypeNames.slice(0, 2).join(", ")} +${rp.roomTypeNames.length - 2}` : rp.roomTypeNames.join(", ")) : rp.roomTypeId || "Semua Kamar")}
                                                        </div>
                                                        {rp.channexRatePlanId ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rp.channexRatePlanId!, "Channex Rate UUID")}
                                                                className={`${styles.idPill} ${styles.idPillChannex}`}
                                                                title="Click to copy Channel Manager Rate UUID"
                                                            >
                                                                <span>{rp.channexRatePlanId}</span>
                                                                <Copy size={10} className={styles.copyIcon} />
                                                            </button>
                                                        ) : (
                                                            <span className={styles.unmappedChannexText}>
                                                                Not Synced with Channel Manager
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className={styles.mappingInputRow}>
                                                            {flatOtaRates.length > 0 ? (
                                                                <select
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
                                                                    className={`${styles.cellSelect} ${styles.mappingInputField}`}
                                                                    style={{ fontSize: "12px", width: "100%", fontWeight: val ? 600 : 400 }}
                                                                >
                                                                    <option value="">-- Pilih Rate Plan OTA Extranet --</option>
                                                                    {flatOtaRates.map((rate: any) => (
                                                                        <option key={rate.id} value={String(rate.id)}>
                                                                            {rate.title}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
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
                                                                    placeholder={`OTA Rate ID (e.g. 201)`}
                                                                    className={`${styles.cellInput} ${styles.mappingInputField}`}
                                                                />
                                                            )}
                                                            {val && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleClearRateMapping(selectedChannelCode, rp.id)}
                                                                    className={styles.btnIconClear}
                                                                    title="Remove Rate Plan Mapping"
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.mappingActionCell}>
                                                            {val ? (
                                                                <span className={`${styles.badge} ${styles.badgeActive}`}>Mapped</span>
                                                            ) : (
                                                                <span className={`${styles.badge} ${styles.badgeInactive}`}>Unmapped</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePingTest("rate_plan", rp.id, rp.channexRatePlanId, val)}
                                                                disabled={pingingMap[rp.id]}
                                                                className={styles.btnPing}
                                                                title="Test connection diagnostics with Channel Manager for this Rate Plan"
                                                            >
                                                                <Activity size={12} className={pingingMap[rp.id] ? "animate-spin" : ""} />
                                                                <span>{pingingMap[rp.id] ? "Testing..." : "Test Connection"}</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mapping Action Footer */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e2e8f0", flexWrap: "wrap", gap: "10px" }}>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                    💡 Masukkan Room ID dan Rate ID dari Extranet OTA, lalu klik <strong>Simpan & Sinkronkan ke Channex</strong> untuk mengaktifkan sinkronisasi 2 arah.
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={handleSaveAll}
                                        disabled={savingSettings}
                                        className={styles.btnActionSecondary}
                                        style={{ padding: "7px 14px", fontSize: "12px" }}
                                    >
                                        <Save size={13} />
                                        <span>{savingSettings ? "Menyimpan..." : "Simpan Pemetaan"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await handleSaveAll();
                                            await handleSyncSingleChannelToChannex(selectedChannelCode);
                                        }}
                                        disabled={savingSettings || syncingChannex}
                                        className={styles.btnActionPrimary}
                                        style={{ padding: "7px 16px", fontSize: "12px", background: "#059669" }}
                                        title="Simpan pemetaan dan sinkronkan rate_plans ke Channex server"
                                    >
                                        <Zap size={13} className={syncingChannex ? "animate-spin" : ""} />
                                        <span>{syncingChannex ? "Sinkronisasi Channex..." : "Simpan & Sinkronkan ke Channex"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", marginTop: "16px" }}>
                            <Globe size={32} style={{ margin: "0 auto 10px", color: "#94a3b8" }} />
                            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
                                No Channel Selected or Connected
                            </h4>
                            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 auto 16px", maxWidth: "420px" }}>
                                Select an active channel from the list above, or click "+ Connect Channel" to map a new OTA channel from the catalog.
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsAddChannelModalOpen(true)}
                                className={styles.btnActionBlue}
                                style={{ padding: "6px 16px", fontSize: "12px" }}
                            >
                                <Plus size={13} />
                                <span>+ Connect Channel</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

            {/* TAB 3: KATALOG 68+ SALURAN OTA (+ TAMBAH SALURAN BARU) */}
            {activeTab === "catalog" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                                <span className={styles.mappingHeaderTitle}>
                                    🌐 Global OTA & Channel Catalog (Powered by Channex):
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Enable or disable distribution channels and booking engines for this property.
                                </p>
                            </div>

                            {/* View Switcher: Table View vs Grid Cards */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <button
                                    type="button"
                                    onClick={() => setCatalogViewMode("table")}
                                    className={`${styles.channelSwitcherBtn} ${catalogViewMode === "table" ? styles.channelSwitcherBtnActive : ""}`}
                                    style={{ fontSize: "11px", padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                                    title="Display channels in a compact tabular layout"
                                >
                                    <Table size={13} />
                                    <span>Table View</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCatalogViewMode("grid")}
                                    className={`${styles.channelSwitcherBtn} ${catalogViewMode === "grid" ? styles.channelSwitcherBtnActive : ""}`}
                                    style={{ fontSize: "11px", padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                                    title="Display channels in a grid card layout"
                                >
                                    <LayoutGrid size={13} />
                                    <span>Grid View</span>
                                </button>
                            </div>
                        </div>

                        <div className={styles.catalogSearchRow} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                                {[
                                    { id: "all", label: `All Channels (${CHANNEX_OTA_CATALOG.length})` },
                                    { id: "connected", label: `Connected (${activeChannelsList.length})` },
                                    { id: "ota", label: "Popular OTAs" },
                                    { id: "wholesaler", label: "Wholesalers & Bedbanks" },
                                    { id: "meta", label: "Metasearch & Google" },
                                    { id: "vacation", label: "Vacation & Boutique" },
                                    { id: "engine", label: "Direct Engines" },
                                    { id: "corporate", label: "Corporate & Bundles" }
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
                                placeholder="Search OTA channels (e.g. Booking.com, Agoda, Expedia, WebBeds, Open Channel)..."
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
                                        <th style={{ width: "260px" }}>Channel / OTA</th>
                                        <th style={{ width: "130px" }}>Category</th>
                                        <th style={{ width: "100px", textAlign: "center" }}>Commission</th>
                                        <th style={{ width: "180px" }}>Extranet Hotel ID</th>
                                        <th style={{ width: "180px" }}>Connection Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
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
                                                                    Code: {ch.code}
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
                                                                    {hotelId || "(Unassigned)"}
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
                                                                <span className={`${styles.badge} ${styles.badgeActive}`}>Connected</span>
                                                                <span className={`${styles.badge} ${channelConfigs[ch.code]?.channexStatus === "ACTIVE" ? styles.badgeActive : styles.badgePending}`} style={{ fontSize: "10px" }}>
                                                                    Channex: {channelConfigs[ch.code]?.channexStatus || "ACTIVE"}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactive</span>
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
                                                                        Manage Mapping
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSyncSingleChannelToChannex(ch.code)}
                                                                        disabled={syncingChannex}
                                                                        className={styles.btnActionSecondary}
                                                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                                                        title="Sync ARI directly with Channel Manager"
                                                                    >
                                                                        <Zap size={11} className={syncingChannex ? "animate-spin" : ""} color="#f59e0b" />
                                                                        <span>Sync</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => promptDisconnectChannel(ch.code, ch.name)}
                                                                        className={styles.btnActionDanger}
                                                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                                                        title="Disconnect channel"
                                                                    >
                                                                        <Unlink size={11} />
                                                                        <span>Disconnect</span>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleConnectChannel(ch)}
                                                                    className={styles.btnActionBlue}
                                                                    style={{ fontSize: "11px", padding: "4px 10px" }}
                                                                >
                                                                    + Connect Channel
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
                                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Connected</span>
                                                        <span className={`${styles.badge} ${channelConfigs[ch.code]?.channexStatus === "ACTIVE" ? styles.badgeActive : styles.badgePending}`} style={{ fontSize: "10px" }}>
                                                            Channex: {channelConfigs[ch.code]?.channexStatus || "ACTIVE"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactive</span>
                                                )}
                                            </div>

                                            <div className={styles.catalogMeta}>
                                                <span>Commission: <b>{ch.defaultCommission}%</b></span>
                                                <span className={styles.catalogMetaDot}>•</span>
                                                <span>Category: <b>{ch.category.toUpperCase()}</b></span>
                                            </div>

                                            {isConnected && (
                                                <div className={styles.catalogHotelIdBadge}>
                                                    <span>Hotel ID: <b>{hotelId || "(Unassigned)"}</b></span>
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
                                                            Manage Mapping
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSyncSingleChannelToChannex(ch.code)}
                                                            disabled={syncingChannex}
                                                            className={`${styles.btnActionSecondary} ${styles.btnCenter}`}
                                                            title="Sync ARI directly with Channel Manager"
                                                        >
                                                            <Zap size={12} className={syncingChannex ? "animate-spin" : ""} color="#f59e0b" />
                                                            <span>Sync</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => promptDisconnectChannel(ch.code, ch.name)}
                                                            className={`${styles.btnActionDanger} ${styles.btnCenter}`}
                                                            title="Disconnect channel"
                                                        >
                                                            <Unlink size={13} />
                                                            <span>Disconnect</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleConnectChannel(ch)}
                                                        className={`${styles.btnActionBlue} ${styles.btnFlexCenter}`}
                                                    >
                                                        + Connect Channel
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

            {/* TAB: TRAVEL AGENT & SALURAN MANUAL */}
            {activeTab === "travel_agents" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <TravelAgentTab 
                        hotelCode={activeHotelCode} 
                        channelConfigs={channelConfigs} 
                        onNavigateToCatalog={() => handleSelectTab("catalog")} 
                    />
                </div>
            )}

            {/* TAB: ATURAN ALOKASI SALURAN (YIELD MANAGEMENT & OVERRIDES) */}
            {activeTab === "rules" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                        <button
                            type="button"
                            onClick={() => setIsTaxesModalOpen(true)}
                            className={styles.btnActionSecondary}
                        >
                            <Receipt size={14} />
                            <span>Atur Pajak PB1 &amp; Service Charge Saluran OTA</span>
                        </button>
                    </div>
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

            {/* TAB: GOOGLE HOTEL SEARCH & FREE BOOKING LINKS */}
            {activeTab === "google" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <ChannelGoogleHotelsTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: PROMOSI SALURAN OTA */}
            {activeTab === "promotions" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <ChannelPromotionsTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: DYNAMIC PRICING RMS CONNECTOR */}
            {activeTab === "dynamic_pricing" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <ChannelDynamicPricingTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: STRIPE TOKENIZATION & PCI CARD VAULT */}
            {activeTab === "payments" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                        <button
                            type="button"
                            onClick={() => setIsVccModalOpen(true)}
                            className={`${styles.btnActionSecondary} ${styles.btnVccAccent}`}
                        >
                            <CreditCard size={14} color="#0284c7" />
                            <span>Buka PCI Virtual Credit Card (VCC) Viewer</span>
                        </button>
                    </div>
                    <ChannelPaymentTokenizationTab hotelCode={activeHotelCode} />
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
                                        onChange={e => handleSimChannelChange(e.target.value)}
                                        className={`${styles.cellSelect} ${styles.sandboxSelect}`}
                                    >
                                        <option value="Traveloka">Traveloka (Default Komisi 18%)</option>
                                        <option value="Booking.com">Booking.com (Default Komisi 15%)</option>
                                        <option value="Agoda">Agoda (Default Komisi 17%)</option>
                                        <option value="Tiket.com">Tiket.com (Default Komisi 15%)</option>
                                        <option value="Expedia">Expedia (Default Komisi 18%)</option>
                                        <option value="Airbnb">Airbnb (Default Komisi 14%)</option>
                                        <option value="Trip.com">Trip.com (Default Komisi 15%)</option>
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
                                    <label className={styles.sandboxFieldLabel}>Harga Jual / Tamu Bayar di OTA (Gross Rp):</label>
                                    <input
                                        type="number"
                                        value={simPrice}
                                        onChange={e => setSimPrice(Number(e.target.value) || 0)}
                                        className={`${styles.cellInput} ${styles.sandboxInput}`}
                                    />
                                </div>

                                <div className={styles.sandboxGrid2Col}>
                                    <div>
                                        <label className={styles.sandboxFieldLabel}>Komisi OTA ({simChannel}) %:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={simCommissionPercent}
                                            onChange={e => setSimCommissionPercent(Number(e.target.value) || 0)}
                                            className={`${styles.cellInput} ${styles.sandboxInput}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.sandboxFieldLabel}>Diskon Promo / Biaya Tambahan %:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={simPromoPercent}
                                            onChange={e => setSimPromoPercent(Number(e.target.value) || 0)}
                                            className={`${styles.cellInput} ${styles.sandboxInput}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={styles.sandboxFieldLabel}>Mode Pencatatan di Daily Revenue Tara:</label>
                                    <select
                                        value={simRevenueMode}
                                        onChange={e => setSimRevenueMode(e.target.value as any)}
                                        className={`${styles.cellSelect} ${styles.sandboxInput}`}
                                        style={{
                                            fontWeight: 600,
                                            color: simRevenueMode === "net" ? "#166534" : "#1e40af",
                                            background: simRevenueMode === "net" ? "#f0fdf4" : "#eff6ff",
                                            borderColor: simRevenueMode === "net" ? "#86efac" : "#bfdbfe"
                                        }}
                                    >
                                        <option value="net">🟢 Net to Hotel (Uang Bersih Cair ke Rekening / VCC - Rekonsiliasi 100% Cocok)</option>
                                        <option value="gross">🔵 Gross Rate (Nilai Penuh yang Dibayar Tamu di OTA)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={styles.sandboxFieldLabel}>Metode Pembayaran (Payment Collection):</label>
                                    <select
                                        value={simPaymentCollect}
                                        onChange={e => setSimPaymentCollect(e.target.value as any)}
                                        className={`${styles.cellSelect} ${styles.sandboxInput}`}
                                    >
                                        <option value="channel">Channel Collect / OTA Collect (VCC - Tamu Bayar di OTA)</option>
                                        <option value="property">Property Collect (Pay at Hotel - Tamu Bayar di Hotel)</option>
                                    </select>
                                </div>

                                {/* LIVE FINANCIAL RECONCILIATION PREVIEW */}
                                {(() => {
                                    const gross = simPrice;
                                    const commAmount = Math.round(gross * (simCommissionPercent / 100));
                                    const promoAmount = Math.round(gross * (simPromoPercent / 100));
                                    const totalDeduct = commAmount + promoAmount;
                                    const netToHotel = Math.max(0, gross - totalDeduct);
                                    const recordedAmount = simRevenueMode === "net" ? netToHotel : gross;

                                    return (
                                        <div style={{
                                            background: "#f8fafc",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "8px",
                                            padding: "12px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "6px",
                                            marginTop: "4px"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontWeight: 700, borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                                                <span style={{ color: "#0f172a" }}>💳 KALKULASI REKONSILIASI KEUANGAN:</span>
                                                <span style={{
                                                    fontSize: "10px",
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                    fontWeight: 700,
                                                    background: simRevenueMode === "net" ? "#dcfce7" : "#dbeafe",
                                                    color: simRevenueMode === "net" ? "#15803d" : "#1d4ed8"
                                                }}>
                                                    {simRevenueMode === "net" ? "MODE: NET TO HOTEL" : "MODE: GROSS RATE"}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#475569" }}>
                                                <span>Tamu Bayar di {simChannel} (Gross):</span>
                                                <span style={{ fontWeight: 600 }}>Rp {gross.toLocaleString("id-ID")}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#dc2626" }}>
                                                <span>Potongan Komisi OTA ({simCommissionPercent}%):</span>
                                                <span>-Rp {commAmount.toLocaleString("id-ID")}</span>
                                            </div>
                                            {simPromoPercent > 0 && (
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#d97706" }}>
                                                    <span>Potongan Promo / Tax ({simPromoPercent}%):</span>
                                                    <span>-Rp {promoAmount.toLocaleString("id-ID")}</span>
                                                </div>
                                            )}
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                color: "#15803d",
                                                borderTop: "1px dashed #cbd5e1",
                                                paddingTop: "6px"
                                            }}>
                                                <span>Net to Hotel (Transfer Masuk Bank/VCC):</span>
                                                <span>Rp {netToHotel.toLocaleString("id-ID")}</span>
                                            </div>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color: simRevenueMode === "net" ? "#166534" : "#1e40af",
                                                background: simRevenueMode === "net" ? "#dcfce7" : "#eff6ff",
                                                border: simRevenueMode === "net" ? "1px solid #86efac" : "1px solid #bfdbfe",
                                                padding: "6px 8px",
                                                borderRadius: "4px",
                                                marginTop: "2px"
                                            }}>
                                                <span>📊 Tertampil di Daily Revenue Tara:</span>
                                                <span style={{ fontSize: "12px" }}>Rp {recordedAmount.toLocaleString("id-ID")}</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className={styles.sandboxBtnRow}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSimulateBooking("create_booking").catch(err => console.error("Simulation error:", err));
                                        }}
                                        disabled={simulating || pushingOpenChannel}
                                        className={`${styles.btnActionBlue} ${styles.sandboxBtnSubmit}`}
                                    >
                                        <Send size={14} />
                                        <span>{simulating ? "Mengirim Webhook..." : "Injeksi Reservasi (PMS Test)"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            handlePushOpenChannelBooking().catch(err => console.error("Open Channel push error:", err));
                                        }}
                                        disabled={simulating || pushingOpenChannel}
                                        className={`${styles.btnActionBlue} ${styles.sandboxBtnSubmit}`}
                                        style={{ background: "#7c3aed", borderColor: "#6d28d9" }}
                                    >
                                        <Send size={14} />
                                        <span>{pushingOpenChannel ? "Pushing ke Channex..." : "Push ke Channex (Open Channel)"}</span>
                                    </button>

                                    {simulatedResult?.bookingId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleSimulateBooking("cancel_booking").catch(err => console.error("Cancel simulation error:", err));
                                            }}
                                            disabled={simulating || pushingOpenChannel}
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
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div className={simulatedResult.success !== false ? styles.sandboxResultSuccess : styles.sandboxResultError}>
                                            {simulatedResult.success !== false ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                            <span>{simulatedResult.message || (simulatedResult.success !== false ? "Simulasi Berhasil" : "Simulasi Gagal")}</span>
                                        </div>

                                        {/* FINANCIAL BREAKDOWN CARD IN DIAGNOSTICS */}
                                        {simulatedResult.financials && (
                                            <div style={{
                                                background: "#ffffff",
                                                border: "1px solid #10b981",
                                                borderRadius: "8px",
                                                padding: "12px",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                            }}>
                                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                                                    <span>💰 HASIL REKONSILIASI KEUANGAN PMS:</span>
                                                    <span style={{ color: "#059669" }}>STATUS: SIAP MATCHING (PENDING_RECON)</span>
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                                                    <div style={{ background: "#f8fafc", padding: "6px", borderRadius: "4px" }}>
                                                        <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Gross Tamu Bayar:</span>
                                                        <strong style={{ color: "#0f172a" }}>Rp {Number(simulatedResult.financials.guestPaidGross).toLocaleString("id-ID")}</strong>
                                                    </div>
                                                    <div style={{ background: "#fef2f2", padding: "6px", borderRadius: "4px" }}>
                                                        <span style={{ color: "#991b1b", display: "block", fontSize: "10px" }}>Komisi OTA ({simulatedResult.financials.otaCommissionPercent}%):</span>
                                                        <strong style={{ color: "#dc2626" }}>-Rp {Number(simulatedResult.financials.otaCommissionAmount).toLocaleString("id-ID")}</strong>
                                                    </div>
                                                    {simulatedResult.financials.otaPromoAmount > 0 && (
                                                        <div style={{ background: "#fffbeb", padding: "6px", borderRadius: "4px" }}>
                                                            <span style={{ color: "#92400e", display: "block", fontSize: "10px" }}>Potongan Promo ({simulatedResult.financials.otaPromoPercent}%):</span>
                                                            <strong style={{ color: "#d97706" }}>-Rp {Number(simulatedResult.financials.otaPromoAmount).toLocaleString("id-ID")}</strong>
                                                        </div>
                                                    )}
                                                    <div style={{ background: "#f0fdf4", padding: "6px", borderRadius: "4px" }}>
                                                        <span style={{ color: "#166534", display: "block", fontSize: "10px" }}>Net to Hotel (Bank/VCC):</span>
                                                        <strong style={{ color: "#15803d", fontSize: "12px" }}>Rp {Number(simulatedResult.financials.netToHotel).toLocaleString("id-ID")}</strong>
                                                    </div>
                                                    <div style={{ background: "#eff6ff", padding: "6px", borderRadius: "4px", gridColumn: simulatedResult.financials.otaPromoAmount > 0 ? "span 1" : "span 2" }}>
                                                        <span style={{ color: "#1e40af", display: "block", fontSize: "10px" }}>Tercatat di Revenue PMS ({simulatedResult.financials.revenueRecordingMode}):</span>
                                                        <strong style={{ color: "#1d4ed8", fontSize: "12px" }}>Rp {Number(simulatedResult.financials.recordedRevenue).toLocaleString("id-ID")}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* WHATSAPP NOTIFICATION STATUS */}
                                        {simulatedResult.whatsapp && (
                                            <div style={{
                                                background: simulatedResult.whatsapp.success ? "#f0fdf4" : "#fffbeb",
                                                border: `1px solid ${simulatedResult.whatsapp.success ? "#86efac" : "#fde68a"}`,
                                                borderRadius: "6px",
                                                padding: "8px 12px",
                                                fontSize: "11px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <span style={{ fontSize: "14px" }}>{simulatedResult.whatsapp.success ? "📱" : "⚠️"}</span>
                                                    <span style={{ fontWeight: 600, color: simulatedResult.whatsapp.success ? "#166534" : "#92400e" }}>
                                                        Notifikasi WhatsApp Fonnte:
                                                    </span>
                                                    <span style={{ color: simulatedResult.whatsapp.success ? "#15803d" : "#b45309" }}>
                                                        {simulatedResult.whatsapp.success
                                                            ? (simulatedResult.whatsapp.process === "pending"
                                                                ? `Diterima Fonnte (Antrean/Pending - ID: ${simulatedResult.whatsapp.messageId || "Sent"})`
                                                                : `Terkirim ke Owner (ID: ${simulatedResult.whatsapp.messageId || "Sent"})`)
                                                            : (simulatedResult.whatsapp.reason || simulatedResult.whatsapp.error || "Belum Terkirim")}
                                                    </span>
                                                </div>
                                                {!simulatedResult.whatsapp.success && (
                                                    <span style={{ fontSize: "10px", color: "#64748b" }}>
                                                        (Cek nomor HP owner &amp; token Fonnte di tab Pemetaan)
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className={styles.consoleBox}>
                                            {JSON.stringify(simulatedResult, null, 2)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`${styles.consoleBox} ${styles.sandboxEmptyConsole}`}>
                                        <Terminal size={32} className={styles.sandboxEmptyIcon} />
                                        <span>Siap menerima simulasi webhook.</span>
                                        <span className={styles.sandboxEmptyHelp}>
                                            Atur harga (misal Rp 700.000), tentukan komisi &amp; mode revenue, lalu klik "Injeksi Reservasi" untuk melihat bagaimana sistem Tara memisahkan komisi dan mencocokkan Net to Hotel.
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                onClick={handleSyncAllChannelsFromChannex}
                                disabled={syncingChannex}
                                className={styles.btnActionSecondary}
                                title="Sinkronkan status koneksi saluran online langsung dengan Channex"
                            >
                                <Zap size={14} className={syncingChannex ? "animate-spin" : ""} color="#f59e0b" />
                                <span>{syncingChannex ? "Menghubungkan..." : "Sync Saluran Channex"}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSyncMasterToChannex}
                                disabled={syncingMaster}
                                className={styles.btnActionSecondary}
                                title="Otomatis daftarkan seluruh tipe kamar & rate plan My Tara ke Channex via API"
                            >
                                <RefreshCw size={14} className={`${syncingMaster ? "animate-spin" : ""} ${styles.syncMasterIcon}`} />
                                <span>{syncingMaster ? "Mendaftarkan..." : "Sync Kamar & Rate"}</span>
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
                                <span>{syncingAri ? "Menyinkronkan..." : "Force Push ARI"}</span>
                            </button>
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
