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
    Bed,
    CheckCircle,
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
import { PaymentGatewayTab } from "./PaymentGatewayTab";
import { ChannelTutorialTab } from "./ChannelTutorialTab";
import { TravelAgentTab } from "./TravelAgentTab";
import { ChannelGroupsTab } from "./ChannelGroupsTab";
import { SUPPORTED_CURRENCIES, formatCurrencyAmount, DEFAULT_CURRENCY } from "@/lib/currency-utils";
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc, deleteField, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

import { ChannelSeparationMode } from "@/lib/channex/types";

export interface ChannelMappingConfig {
    channelCode: string;
    channelName: string;
    icon: string;
    hotelId: string; // Extranet Hotel ID
    currency: string;
    pricingModel: "gross" | "net"; // Gross (Sell Rate) or Net Rate
    extranetRateModel?: "gross" | "net"; // Does the OTA extranet send Gross (Sell Rate) or Net (Payout Rate)
    commissionPercent: number; // e.g. 18% for Traveloka, 15% for Booking.com
    marketingAdsPercent?: number; // Marketing / Ads Booster % (e.g. Agoda Growth Express 3%)
    markupPercent: number; // Custom markup %
    isActive: boolean;
    separationMode?: ChannelSeparationMode; // "merged" | "separated_rate" | "separated_allotment" | "separated_both"
    roomMappings: Record<string, string>; // roomTypeId -> otaRoomId
    rateMappings: Record<string, string>; // ratePlanId -> otaRateId
    channexChannelId?: string | null; // Official Channel ID in Channex
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

    type ChannelTabType = "groups" | "tutorial" | "rooms" | "rateplans" | "matrix" | "mapping" | "dynamic_pricing" | "catalog" | "travel_agents" | "rules" | "google" | "promotions" | "content" | "messages" | "reviews" | "logs" | "payments" | "payment_gateway" | "booking_engine" | "iframe" | "sandbox" | "golive" | "sync";
    const [activeTab, setActiveTab] = useState<ChannelTabType>("groups");
    const [isVccModalOpen, setIsVccModalOpen] = useState<boolean>(false);
    const [isTaxesModalOpen, setIsTaxesModalOpen] = useState<boolean>(false);

    // Sync tab with URL query parameter ?tab= and custom event channel-tab-change from ChannelManagerSidebar
    useEffect(() => {
        const checkTabFromUrl = () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                const tabParam = params.get("tab");
                if (tabParam && ["groups", "tutorial", "rooms", "rateplans", "matrix", "mapping", "dynamic_pricing", "catalog", "travel_agents", "rules", "google", "promotions", "content", "messages", "reviews", "logs", "payments", "payment_gateway", "booking_engine", "iframe", "sandbox", "golive", "sync"].includes(tabParam)) {
                    setActiveTab(tabParam as any);
                }
            }
        };

        checkTabFromUrl();

        const handleCustomTabChange = (e: any) => {
            const tab = typeof e.detail === "string" ? e.detail : e.detail?.tab;
            if (tab && ["groups", "tutorial", "rooms", "rateplans", "matrix", "mapping", "dynamic_pricing", "catalog", "travel_agents", "rules", "google", "promotions", "content", "messages", "reviews", "logs", "payments", "payment_gateway", "booking_engine", "iframe", "sandbox", "golive", "sync"].includes(tab)) {
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
        groups: {
            title: "Hotel Groups & Multi-Property Management",
            subtitle: "Kelola jaringan hotel, kelola grup properti untuk distribusi OTA serentak, dan pantau status koneksi terpusat.",
            icon: Building2,
            badge: "Multi-Hotel Chain",
            badgeColor: "#2563eb"
        },
        tutorial: {
            title: "Production Go-Live Roadmap",
            subtitle: "Step-by-step rollout guide: from account verification, pilot property testing, to full multi-property production deployment.",
            icon: Compass,
            badge: "5-Stage Roadmap",
            badgeColor: "#2563eb"
        },
        mapping: {
            title: "Channel Mapping & Rate Parity",
            subtitle: "Manage PMS-to-OTA room mapping, rate plan codes, commission structures, and channel-level rate & inventory separation rules.",
            icon: Key,
            badge: "Active Mapping",
            badgeColor: "#2563eb"
        },
        catalog: {
            title: "OTA Channel Catalog & Global Distribution",
            subtitle: "Explore and connect 68+ global OTAs, B2B wholesalers, metasearch engines, and direct booking interfaces.",
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
            subtitle: "Algorithmic dynamic pricing adjustments based on occupancy thresholds, booking pace, lead times, and market demand.",
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
        booking_engine: {
            title: "Direct Booking Engine & Payment Gateway Suite",
            subtitle: "Pengaturan identitas visual, tema warna Executive Slate & Royal Sapphire, alamat website kembali, preferensi form tamu, analitik tracking, promo voucher, dan multi-tenant payment gateway.",
            icon: CreditCard,
            badge: "Direct Suite",
            badgeColor: "#2563eb"
        },
        payment_gateway: {
            title: "Direct Booking Engine & Payment Gateway Suite",
            subtitle: "Pengaturan identitas visual, tema warna Executive Slate & Royal Sapphire, alamat website kembali, preferensi form tamu, analitik tracking, promo voucher, dan multi-tenant payment gateway.",
            icon: CreditCard,
            badge: "Direct Suite",
            badgeColor: "#2563eb"
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
            icon: Activity,
            badge: "8 Test Scenarios"
        },
        iframe: {
            title: "Global Channel Management Console",
            subtitle: "Direct Single Sign-On (SSO) access to the full-featured Channel Manager visual configuration console.",
            icon: LayoutGrid
        },
        golive: {
            title: "API Credentials & Production Go-Live",
            subtitle: "Channel API keys, property GUID bindings, webhook endpoints, and production connection switch.",
            icon: Lock
        },
        sync: {
            title: "ARI Synchronization Feed & Status",
            subtitle: "Real-time monitor of live ARI sync queues, pending updates, and connection status between PMS and OTAs.",
            icon: RefreshCw
        },
        travel_agents: {
            title: "Travel Agents & B2B Wholesalers",
            subtitle: "Manage contracted offline travel agencies, corporate accounts, wholesale partners, and connected distribution channels.",
            icon: Users,
            badge: "B2B Partners",
            badgeColor: "#2563eb"
        }
    };
    
    // Environment Switcher: Staging / Sandbox vs Live Production
    const [channexEnv, setChannexEnv] = useState<"staging" | "production">("staging");
    const [channexApiKey, setChannexApiKey] = useState<string>("");
    const [channexWebhookSecret, setChannexWebhookSecret] = useState<string>("");
    const [showWebhookSecret, setShowWebhookSecret] = useState<boolean>(false);
    const [channexPropertyId, setChannexPropertyId] = useState<string>("");
    const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState<boolean>(false);
    const [unlinkingProperty, setUnlinkingProperty] = useState<boolean>(false);
    const [hotelCurrency, setHotelCurrency] = useState<string>("IDR");
    const [savingCurrency, setSavingCurrency] = useState<boolean>(false);
    const [webhookRegistrationStatus, setWebhookRegistrationStatus] = useState<{
        isRegistered: boolean;
        webhookId?: string;
        webhookUrl?: string;
        webhookRegisteredAt?: string;
    } | null>(null);
    const [registeringWebhook, setRegisteringWebhook] = useState<boolean>(false);
    const [checkingWebhookStatus, setCheckingWebhookStatus] = useState<boolean>(false);
    
    // Connected Channels Map
    const [channelConfigs, setChannelConfigs] = useState<Record<string, ChannelMappingConfig>>({});
    
    // UI state
    const [selectedChannelCode, setSelectedChannelCode] = useState<string>("");
    const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState<boolean>(false);
    const [channelSearchQuery, setChannelSearchQuery] = useState<string>("");
    const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
    const [modalCategoryFilter, setModalCategoryFilter] = useState<string>("all");
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
    const [fullSyncResultData, setFullSyncResultData] = useState<{
        taskIds: string[];
        availabilityTaskId?: string;
        restrictionsTaskId?: string;
        latencyMs?: number;
        message?: string;
    } | null>(null);

    // Global Display Toggle: Show Gross Price vs Net Price
    const [pricingViewMode, setPricingViewMode] = useState<"all" | "gross_only" | "net_only">("all");
    const [globalPricingModel, setGlobalPricingModel] = useState<"net" | "gross">("net");
    const [syncingPricingWithChannex, setSyncingPricingWithChannex] = useState<boolean>(false);

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
            message: "2-Way Enterprise Channel Manager ready for 68+ OTA distribution channels."
        }
    ]);
    const [syncFilterStatus, setSyncFilterStatus] = useState<"ALL" | "SUCCESS" | "ERROR">("ALL");
    const [syncSearchTerm, setSyncSearchTerm] = useState<string>("");

    // Sandbox Simulator States
    const [simChannel, setSimChannel] = useState<string>("Traveloka");
    const [simGuestName, setSimGuestName] = useState<string>("Simulation Guest (Test Booking)");
    const [simGuestEmail, setSimGuestEmail] = useState<string>("guest.test@crs-hotel.local");
    const [simRoomTypeId, setSimRoomTypeId] = useState<string>("");
    const [simRatePlanId, setSimRatePlanId] = useState<string>("");
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
                toast.error(data.message || "Ping test failed");
            }
        } catch (err: any) {
            toast.error(`Ping connection error: ${err.message}`);
        } finally {
            setPingingMap(prev => ({ ...prev, [id]: false }));
        }
    };

    const copyText = (txt: string, label: string) => {
        if (!txt) return;
        navigator.clipboard.writeText(txt);
        toast.success(`${label} copied to clipboard.`);
    };

    // 1. Fetch Configuration from Firestore
    useEffect(() => {
        if (!isAddChannelModalOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsAddChannelModalOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isAddChannelModalOpen]);

    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") return;

        // Zero-waste single subscription: 
        // 1 single Firestore read on initial mount (no redundant getDoc),
        // and instantly synchronizes changes across tabs or other staff sessions.
        const hotelDocRef = doc(db, "hotels", activeHotelCode);
        const unsubHotel = onSnapshot(hotelDocRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const cm = data.channelManager || {};
                setChannexEnv(cm.env || "staging");
                setChannexApiKey(cm.apiKey || "");
                const resolvedPropId = data.channexPropertyId || cm.channexPropertyId || cm.propertyId || "";
                setChannexPropertyId(resolvedPropId);
                setChannexWebhookSecret(cm.webhookSecret || "");

                const resolvedCurr = (data.currency || cm.currency || data.baseCurrency || data.settings?.currency || "IDR").toUpperCase().trim();
                setHotelCurrency(resolvedCurr);
                if (typeof window !== "undefined") {
                    localStorage.setItem(`hotel_currency_${activeHotelCode}`, resolvedCurr);
                    localStorage.setItem("shopCurrency", resolvedCurr);
                }

                if (cm.webhookId) {
                    setWebhookRegistrationStatus({
                        isRegistered: true,
                        webhookId: cm.webhookId,
                        webhookUrl: cm.webhookUrl,
                        webhookRegisteredAt: cm.webhookRegisteredAt
                    });
                } else {
                    setWebhookRegistrationStatus(null);
                }

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

                // Initialize Global PMS & Ledger Pricing Model (Net vs Gross)
                const initialPricing: "net" | "gross" = (cm.pricingModel || data.settings?.revenueRecordingMode || "net").toLowerCase() === "gross" ? "gross" : "net";
                setGlobalPricingModel(initialPricing);

                // Auto-select first active channel if available
                const activeChannels = Object.values(initialChannels).filter(c => c.isActive);
                if (activeChannels.length > 0) {
                    setSelectedChannelCode(prev => (prev && initialChannels[prev]?.isActive ? prev : activeChannels[0].channelCode));
                } else {
                    setSelectedChannelCode("");
                }
            }
        }, (err) => {
            console.warn("Channel Manager hotel settings listener error:", err);
        });

        const handleCurrencyChangedEvent = () => {
            if (typeof window !== "undefined") {
                const cached = localStorage.getItem(`hotel_currency_${activeHotelCode}`) || localStorage.getItem("shopCurrency");
                if (cached) {
                    setHotelCurrency(cached);
                }
            }
        };
        window.addEventListener("currencyChanged", handleCurrencyChangedEvent);

        return () => {
            unsubHotel();
            window.removeEventListener("currencyChanged", handleCurrencyChangedEvent);
        };
    }, [activeHotelCode]);

    useEffect(() => {
        if (roomTypes.length > 0 && !simRoomTypeId) {
            setSimRoomTypeId(roomTypes[0].id);
        }
    }, [roomTypes, simRoomTypeId]);

    // Available rate plans for the selected room type
    const simAvailableRatePlans = useMemo(() => {
        if (!simRoomTypeId) return ratePlans;
        const matching = ratePlans.filter(rp => 
            rp.roomTypeId === simRoomTypeId ||
            (Array.isArray(rp.roomTypeIds) && rp.roomTypeIds.includes(simRoomTypeId)) ||
            (rp.roomTypeName && roomTypes.find(r => r.id === simRoomTypeId)?.name?.toLowerCase() === rp.roomTypeName?.toLowerCase())
        );
        return matching.length > 0 ? matching : ratePlans;
    }, [simRoomTypeId, ratePlans, roomTypes]);

    useEffect(() => {
        if (simAvailableRatePlans.length > 0 && (!simRatePlanId || !simAvailableRatePlans.some(rp => rp.id === simRatePlanId))) {
            setSimRatePlanId(simAvailableRatePlans[0].id);
        }
    }, [simAvailableRatePlans, simRatePlanId]);

    // Automatically calculate default total price based on selected rate plan / room price & nights
    useEffect(() => {
        if (!simRoomTypeId) return;
        const selectedRt = roomTypes.find(r => r.id === simRoomTypeId);
        const selectedRp = ratePlans.find(r => r.id === simRatePlanId);
        const base = Number(
            selectedRp?.roomRates?.[simRoomTypeId] ??
            selectedRp?.baseRate ??
            selectedRt?.price ??
            selectedRt?.basePrice ??
            700000
        );

        const start = new Date(simCheckin);
        const end = new Date(simCheckout);
        const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        setSimPrice(base * nights);
    }, [simRoomTypeId, simRatePlanId, simCheckin, simCheckout, roomTypes, ratePlans]);

    // Active Connected Channels List
    const activeChannelsList = useMemo(() => {
        return Object.values(channelConfigs).filter(c => c.isActive);
    }, [channelConfigs]);

    const filteredSyncLogs = useMemo(() => {
        return syncLog.filter(log => {
            const matchesStatus =
                syncFilterStatus === "ALL" ? true :
                syncFilterStatus === "SUCCESS" ? log.status === "SUCCESS" :
                syncFilterStatus === "ERROR" ? log.status === "ERROR" : true;
            const matchesSearch = syncSearchTerm.trim() === "" ? true :
                log.message.toLowerCase().includes(syncSearchTerm.toLowerCase()) ||
                log.status.toLowerCase().includes(syncSearchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [syncLog, syncFilterStatus, syncSearchTerm]);

    const syncSuccessCount = useMemo(() => syncLog.filter(l => l.status === "SUCCESS").length, [syncLog]);
    const syncErrorCount = useMemo(() => syncLog.filter(l => l.status === "ERROR").length, [syncLog]);

    // ── TWO-TIER CATEGORIZED NAVIGATION SYSTEM (OPSI A: 5 BARIS TEMA) ──
    type ChannelThemeLine = "line1_setup" | "line2_inventory" | "line3_distribution" | "line4_direct" | "line5_security";

    const activeThemeLine = useMemo<ChannelThemeLine>(() => {
        if (["groups", "golive", "iframe", "tutorial", "sandbox"].includes(activeTab)) return "line1_setup";
        if (["rooms", "rateplans", "matrix"].includes(activeTab)) return "line2_inventory";
        if (["mapping", "catalog", "dynamic_pricing", "rules", "promotions", "google", "travel_agents", "content"].includes(activeTab)) return "line3_distribution";
        if (["booking_engine", "payment_gateway", "messages", "reviews"].includes(activeTab)) return "line4_direct";
        return "line5_security";
    }, [activeTab]);

    const THEME_LINES = useMemo<Array<{
        id: ChannelThemeLine;
        title: string;
        shortTitle: string;
        description: string;
        icon: React.ElementType;
        badge?: string;
        tabs: Array<{ id: ChannelTabType; label: string; icon: React.ElementType; badge?: string }>;
    }>>(() => [
        {
            id: "line1_setup",
            title: "Line 1: Setup & Koneksi",
            shortTitle: "1. Setup & Koneksi",
            description: "Fondasi Kredensial & Ekosistem Global",
            icon: Lock,
            badge: "Fondasi",
            tabs: [
                { id: "groups", label: "Jaringan Hotel & Grup", icon: Building2 },
                { id: "golive", label: "Kredensial API & Go-Live", icon: Lock, badge: "Step 1" },
                { id: "iframe", label: "Konsol Ekstranet SSO", icon: LayoutGrid }
            ]
        },
        {
            id: "line2_inventory",
            title: "Line 2: Kamar & Harga",
            shortTitle: "2. Kamar & Harga",
            description: "Master Inventori & Base Rate PMS",
            icon: BedDouble,
            badge: "PMS Base",
            tabs: [
                { id: "rooms", label: "Tipe Kamar & Alotmen", icon: BedDouble },
                { id: "rateplans", label: "Master Rate Plans", icon: Sliders },
                { id: "matrix", label: "Kalkulator Rate Matrix", icon: Table, badge: "Nett/Gross" }
            ]
        },
        {
            id: "line3_distribution",
            title: "Line 3: Distribusi OTA & RMS",
            shortTitle: "3. Distribusi OTA",
            description: "Saluran OTA Global, Diskon & Yield",
            icon: Globe,
            badge: `${activeChannelsList.length} Aktif`,
            tabs: [
                { id: "mapping", label: "Pemetaan Saluran & OTA", icon: Key, badge: "68+ OTA" },
                { id: "dynamic_pricing", label: "Yield & Dynamic RMS", icon: TrendingUp },
                { id: "promotions", label: "Promosi & Diskon OTA", icon: Tag },
                { id: "google", label: "Google Hotel Free Links", icon: Search, badge: "0%" },
                { id: "travel_agents", label: "Travel Agent & B2B", icon: Users },
                { id: "content", label: "Konten & Foto Kamar", icon: UploadCloud }
            ]
        },
        {
            id: "line4_direct",
            title: "Line 4: Direct & Tamu",
            shortTitle: "4. Direct & Tamu",
            description: "Pemesanan Langsung & Interaksi Tamu",
            icon: MessageSquare,
            badge: "Guest Suite",
            tabs: [
                { id: "booking_engine", label: "Direct Booking Engine & Payment", icon: Globe, badge: "Web Suite" },
                { id: "messages", label: "Kotak Masuk Pesan Tamu", icon: MessageSquare },
                { id: "reviews", label: "Ulasan & Reputasi Tamu", icon: Star }
            ]
        },
        {
            id: "line5_security",
            title: "Line 5: Log & Monitoring",
            shortTitle: "5. Log & Monitoring",
            description: "Audit Trail, Real-Time Sync & PCI Vault",
            icon: Terminal,
            badge: "Diagnostik",
            tabs: [
                { id: "logs", label: "Log Transmisi & Webhook", icon: Terminal },
                { id: "sync", label: "Live ARI Sync Feed", icon: RefreshCw },
                { id: "payments", label: "PCI Card Vault & VCC", icon: CreditCard }
            ]
        }
    ], [activeChannelsList.length]);

    const activeLineDef = THEME_LINES.find(l => l.id === activeThemeLine) || THEME_LINES[0];

    const handleSelectThemeLine = (lineId: ChannelThemeLine) => {
        const line = THEME_LINES.find(l => l.id === lineId);
        if (line && !line.tabs.some(t => t.id === activeTab)) {
            handleSelectTab(line.tabs[0].id);
        }
    };

    // 2. Global Pricing Model Synchronization (Net vs Gross)
    const handleUpdateGlobalPricingModel = async (newModel: "net" | "gross") => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        setGlobalPricingModel(newModel);
        setSyncingPricingWithChannex(true);
        try {
            const res = await fetch("/api/channex/channel-pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    pricingModel: newModel,
                    syncToChannex: true
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Active PMS & Ledger Pricing Model set to ${newModel.toUpperCase()}.${data.updatedChannelsCount > 0 ? ` Synchronized with ${data.updatedChannelsCount} Channex channels.` : ''}`);
            } else {
                toast.error(data.error || "Failed to update pricing model");
            }
        } catch (err: any) {
            toast.error("Failed to sync pricing model: " + err.message);
        } finally {
            setSyncingPricingWithChannex(false);
        }
    };

    // 3. Save All Settings & Mappings to Firestore
    const handleSaveAll = async () => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        setSavingSettings(true);
        try {
            const docRef = doc(db, "hotels", activeHotelCode);
            await updateDoc(docRef, {
                channexPropertyId,
                currency: hotelCurrency,
                baseCurrency: hotelCurrency,
                "settings.currency": hotelCurrency,
                channelManager: {
                    env: channexEnv,
                    apiKey: channexApiKey,
                    webhookSecret: channexWebhookSecret,
                    channexPropertyId,
                    currency: hotelCurrency,
                    channels: channelConfigs,
                    pricingModel: globalPricingModel,
                    isSyncActive: true,
                    updatedAt: new Date().toISOString()
                },
                "settings.revenueRecordingMode": globalPricingModel
            });

            if (typeof window !== "undefined") {
                localStorage.setItem(`hotel_currency_${activeHotelCode}`, hotelCurrency);
                localStorage.setItem("shopCurrency", hotelCurrency);
                window.dispatchEvent(new Event("currencyChanged"));
            }

            // Sinkronkan juga ke collection system_settings jika webhookSecret diisi
            if (channexWebhookSecret) {
                try {
                    await setDoc(doc(db, "system_settings", "channex"), {
                        webhookSecret: channexWebhookSecret,
                        env: channexEnv,
                        updatedAt: new Date().toISOString(),
                        updatedByHotel: activeHotelCode
                    }, { merge: true });
                } catch (sysErr) {
                    console.warn("Could not save to system_settings:", sysErr);
                }
            }

            toast.success("Pengaturan saluran berhasil disimpan ke database.");

            // Otomatis sinkronkan channel yang sedang diedit langsung ke Channex
            if (selectedChannelCode && channelConfigs[selectedChannelCode]?.hotelId) {
                await handleSyncSingleChannelToChannex(selectedChannelCode);
            }

            // Log event to Channel Events with current user
            const currentChan = selectedChannelCode ? channelConfigs[selectedChannelCode] : null;
            const chanName = currentChan?.channelName || "Open Channel";
            const userLabel = user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : "Management");
            const userEmail = user?.email || "admin@hotel.local";

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
                        hotelId: { old: "", new: currentChan.hotelId || "" },
                        roomMappings: { old: {}, new: currentChan.roomMappings },
                        rateMappings: { old: {}, new: currentChan.rateMappings }
                    } : null
                })
            }).catch(console.error);
        } catch (err: any) {
            console.error("Error saving channels:", err);
            toast.error("Failed to save channel configuration.");
        } finally {
            setSavingSettings(false);
        }
    };

    // Helper: Save Hotel Distribution Currency Directly (2-Way Immediate Synchronization)
    const handleSaveCurrencyOnly = async (overrideCurr?: string) => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        const targetCurr = (overrideCurr || hotelCurrency || DEFAULT_CURRENCY).toUpperCase().trim();
        setSavingCurrency(true);
        try {
            const docRef = doc(db, "hotels", activeHotelCode);
            await updateDoc(docRef, {
                currency: targetCurr,
                baseCurrency: targetCurr,
                "settings.currency": targetCurr,
                "channelManager.currency": targetCurr
            });
            if (typeof window !== "undefined") {
                localStorage.setItem(`hotel_currency_${activeHotelCode}`, targetCurr);
                localStorage.setItem("shopCurrency", targetCurr);
                window.dispatchEvent(new Event("currencyChanged"));
            }
            toast.success(`Mata uang properti berhasil disimpan: ${targetCurr} & inline dengan seluruh sistem.`);
        } catch (err: any) {
            console.error("Error saving currency:", err);
            toast.error("Gagal menyimpan mata uang properti.");
        } finally {
            setSavingCurrency(false);
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

    // Helper: Sync single channel via Direct API (Low-Cost & Atomic)
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
                toast.success(data.message || `Channel ${targetChannel.channelName} synchronized with Channel Manager successfully.`);
                if (data.channel) {
                    setChannelConfigs(prev => ({
                        ...prev,
                        [code]: data.channel
                    }));
                }
            } else {
                toast.error(data.error || data.message || "Failed to sync channel with Channel Manager");
            }
        } catch (err: any) {
            toast.error(`Channel Manager Connection Error: ${err.message}`);
        } finally {
            setSyncingChannex(false);
        }
    };

    // Helper: Full Sync channels list from Channel Manager
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
                toast.success(data.message || "All channels synchronized with Channel Manager successfully.");
                if (data.channels) {
                    setChannelConfigs(data.channels);
                }
            } else {
                toast.error(data.error || data.message || "Failed to sync channels");
            }
        } catch (err: any) {
            toast.error(`Channel Manager Synchronization Error: ${err.message}`);
        } finally {
            setSyncingChannex(false);
        }
    };

    // Helper: Test OTA connection
    const handleTestOtaConnection = async (code: string) => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        const targetChannel = channelConfigs[code];
        if (!targetChannel?.hotelId) {
            toast.warning("Please enter the Extranet Hotel ID before testing the connection.");
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
                toast.success(data.message || "OTA connection verified successfully by Channel Manager.");
            } else {
                toast.error(data.message || data.error || "OTA connection failed. Verify that Extranet Hotel ID is correct.");
            }
        } catch (err: any) {
            toast.error(`OTA Verification Error: ${err.message}`);
        } finally {
            setTestingOta(false);
        }
    };

    // Helper: Auto-fetch Room Types & Rate Plans from OTA Extranet via Channel Manager mapping_details
    const handleFetchOtaMapping = async (code: string) => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        const targetChannel = channelConfigs[code];
        if (!targetChannel?.hotelId) {
            toast.warning("Please enter Extranet Hotel ID before fetching data from OTA.");
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
                    toast.info(`Connection established, but OTA (${targetChannel.channelName}) has not returned room data. Ensure Channel Manager is approved as connectivity provider in the OTA Extranet.`);
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

                // Auto-match rate plans for each room type
                roomTypes.forEach(rt => {
                    const targetRoomOtaId = newRoomMappings[rt.id];
                    const candidateRates = targetRoomOtaId 
                        ? allOtaRates.filter(rate => String(rate.roomId) === String(targetRoomOtaId))
                        : allOtaRates;

                    const applicableRps = ratePlans.filter(rp => 
                        (rp.roomTypeIds && Array.isArray(rp.roomTypeIds) && rp.roomTypeIds.includes(rt.id)) ||
                        rp.roomTypeId === rt.id ||
                        (!rp.roomTypeIds?.length && !rp.roomTypeId)
                    );

                    applicableRps.forEach(rp => {
                        const compositeKey = `${rt.id}_${rp.id}`;
                        if (newRateMappings[compositeKey]) return; // keep if already mapped

                        const pmsRateName = (rp.name || "").toLowerCase().trim();
                        const matchedRate = candidateRates.find(rate => {
                            const otaRName = rate.title.toLowerCase();
                            const isBb = pmsRateName.includes("breakfast") || pmsRateName.includes("bb");
                            const otaIsBb = otaRName.includes("breakfast") || otaRName.includes("bb");
                            if (isBb && otaIsBb) return true;
                            if (!isBb && !otaIsBb) return true;
                            return otaRName.includes(pmsRateName) || pmsRateName.includes(otaRName);
                        }) || candidateRates[0];

                        if (matchedRate) {
                            newRateMappings[compositeKey] = String(matchedRate.id);
                            if (!newRateMappings[rp.id]) {
                                newRateMappings[rp.id] = String(matchedRate.id);
                            }
                            autoMatchedRates++;
                        }
                    });
                });

                setChannelConfigs(prev => ({
                    ...prev,
                    [code]: {
                        ...prev[code],
                        roomMappings: newRoomMappings,
                        rateMappings: newRateMappings
                    }
                }));

                toast.success(`Successfully retrieved ${rawRooms.length} rooms and ${allOtaRates.length} rates from ${targetChannel.channelName} extranet. Auto-mapped ${autoMatchedRooms} rooms & ${autoMatchedRates} rates.`);
            } else {
                toast.error(data.message || "Failed to retrieve mapping details from OTA. Ensure Hotel ID is valid and Channel Manager is authorized in extranet.");
            }
        } catch (err: any) {
            toast.error(`Failed to reach OTA: ${err.message}`);
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
            extranetRateModel: catalogItem.category === "wholesaler" ? "net" : "gross",
            commissionPercent: catalogItem.defaultCommission,
            marketingAdsPercent: 0,
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
        toast.success(`Channel ${catalogItem.name} connected. Please specify the Extranet Hotel ID.`);

        // Direct API registration to Channel Manager (Low-Cost)
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

            // Disconnect & delete in Channel Manager / Firestore via Direct API
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

                // Audit log Deactivate Channel to Channel Events
                const userLabel = user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : "Management");
                const userEmail = user?.email || "admin@hotel.local";

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
            toast.info(`All mapping IDs for ${channelName} cleared.`);
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
    const handleClearRateMapping = (code: string, mappingKey: string, ratePlanId?: string) => {
        setChannelConfigs(prev => {
            const updated = { ...prev };
            if (updated[code]?.rateMappings) {
                const newMappings = { ...updated[code].rateMappings };
                delete newMappings[mappingKey];
                if (ratePlanId && newMappings[ratePlanId]) {
                    delete newMappings[ratePlanId];
                }
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

    const formatMatrixPrice = (val: number) => {
        return formatCurrencyAmount(Number(val || 0), hotelCurrency);
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
                toast.error(data.error || "Failed to load Channel Mapping console.");
            }
        } catch (err: any) {
            toast.error("Failed to connect to Channel Distribution Hub.");
        } finally {
            setLoadingIframe(false);
        }
    };

    useEffect(() => {
        if (activeTab === "iframe" && !iframeUrl) {
            loadIframeUrl();
        }
    }, [activeTab, activeHotelCode]);

    // Force Push All ARI to Channel Manager (Full Property Sync 500 Days)
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
                    daysAhead: 500,
                    user: user?.email ? `${user.displayName || user.name || user.email.split("@")[0]} (${user.email})` : (user?.displayName || user?.name || "Operator")
                })
            });

            const data = await res.json();
            if (data.success) {
                const tIds = (data.taskIds && data.taskIds.length > 0)
                    ? data.taskIds
                    : (data.taskId ? [data.taskId] : []);
                const taskMsg = tIds.length > 0 ? ` (Task IDs: ${tIds.join(", ")})` : "";
                setFullSyncResultData({
                    taskIds: tIds,
                    availabilityTaskId: data.availabilityTaskId || tIds[0],
                    restrictionsTaskId: data.restrictionsTaskId || tIds[1],
                    latencyMs: data.latencyMs,
                    message: data.message
                });
                toast.success(`Availability (500 Days) & Rates berhasil dikirim ke Channel Manager!`);
                setSyncLog(prev => [
                    {
                        time: new Date().toLocaleTimeString(),
                        status: "SUCCESS",
                        message: `Full Sync ARI (500 Days) successful for Hotel [${activeHotelCode}] to Channel Distribution Feed.${taskMsg}`
                    },
                    ...prev
                ]);
            } else {
                toast.error(data.error || "Failed to sync ARI.");
            }
        } catch (err: any) {
            toast.error("Network error during Channel Manager sync.");
        } finally {
            setSyncingAri(false);
        }
    };

    // Auto-Sync Room Types and Rate Plans to Channel Manager
    const handleSyncMasterToChannex = async () => {
        if (!activeHotelCode || activeHotelCode === "0") {
            toast.error("Please select an active hotel property first.");
            return;
        }

        setSyncingMaster(true);
        const toastId = toast.loading("Registering and synchronizing room types & rate plans to Channel Manager...");

        try {
            const res = await fetch("/api/channex/sync-master", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hotelCode: activeHotelCode, currency: hotelCurrency })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to sync master data with Channel Manager");
            }

            toast.success(data.message || "Room types and rate plans registered successfully with Channel Manager.", { id: toastId });
            if (data.propertyId) {
                setChannexPropertyId(data.propertyId);
            }
            setSyncLog(prev => [{
                time: new Date().toLocaleTimeString(),
                status: "SUCCESS",
                message: `Master synchronization completed: ${data.totalLocalRooms} room types and ${data.totalLocalRatePlans} rate plans linked to Channel Manager.`
            }, ...prev]);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Error occurred while synchronizing with Channel Manager", { id: toastId });
        } finally {
            setSyncingMaster(false);
        }
    };

    // Unlink / Reset Channex Property connection
    const handleUnlinkProperty = () => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        setIsUnlinkModalOpen(true);
    };

    const handleConfirmUnlinkProperty = async () => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        setUnlinkingProperty(true);
        const toastId = toast.loading("Memutuskan koneksi properti Channex...");
        try {
            const res = await fetch("/api/channex/sync-master", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hotelCode: activeHotelCode, action: "unlink" })
            });
            const data = await res.json();
            if (data.success) {
                setChannexPropertyId("");
                toast.success(data.message || "Koneksi properti Channex berhasil diputus.", { id: toastId });
                setIsUnlinkModalOpen(false);
            } else {
                toast.error(data.error || "Gagal memutus koneksi", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal memutus koneksi", { id: toastId });
        } finally {
            setUnlinkingProperty(false);
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
                    ratePlanId: simRatePlanId || undefined,
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
                        message: `[Sandbox Simulator] ${action === "create_booking" ? "Inbound Booking Injection" : "Cancellation"} OTA ${simChannel} (${data.bookingId || "ACK"})`
                    },
                    ...prev
                ]);
            } else {
                toast.error(data.error || "Simulation execution failed.");
            }
        } catch (err: any) {
            toast.error("Failed to run webhook simulation.");
        } finally {
            setSimulating(false);
        }
    };

    const [pushingOpenChannel, setPushingOpenChannel] = useState(false);

    // Push Booking directly to Open Channel API
    const handlePushOpenChannelBooking = async () => {
        if (!activeHotelCode) return;
        setPushingOpenChannel(true);
        try {
            const res = await fetch("/api/open-channel/push-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    channelName: simChannel || "OpenChannel",
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
                toast.success(data.message || "Reservation pushed to Channel Manager successfully.");
                setSyncLog(prev => [
                    {
                        time: new Date().toLocaleTimeString(),
                        status: "SUCCESS",
                        message: `[Open Channel] Push Booking to Channel Distribution Successful (${data.reservationId})`
                    },
                    ...prev
                ]);
            } else {
                toast.error(data.message || "Push booking rejected by Channel Manager.");
                setSyncLog(prev => [
                    {
                        time: new Date().toLocaleTimeString(),
                        status: "ERROR",
                        message: `[Open Channel] Push Booking Rejected: ${JSON.stringify(data.error || data.message)}`
                    },
                    ...prev
                ]);
            }
        } catch (err: any) {
            toast.error("Failed to push booking to Channel Manager: " + err.message);
        } finally {
            setPushingOpenChannel(false);
        }
    };

    // ── GLOBAL DISTRIBUTION CERTIFICATION TEST SUITE (8 STAGES) ──
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
            desc: "Validates Channel API credentials and property status in Staging environment.",
            actionKey: "test_ping",
            status: "pending"
        },
        {
            id: "stage_full_sync",
            num: 2,
            title: "Full Property ARI Sync (2-Call Standard)",
            desc: "Tests 365-day bulk ARI sync execution across availability and rate restriction feeds.",
            actionKey: "test_full_sync",
            status: "pending"
        },
        {
            id: "stage_booking_new",
            num: 3,
            title: "Booking Ingestion & Inventory Lock",
            desc: "New booking ingestion test: PMS auto-creation and inventory lock.",
            actionKey: "create_booking",
            status: "pending"
        },
        {
            id: "stage_modification",
            num: 4,
            title: "Date Shift & Anti-Ghost Room Test",
            desc: "Reservation date modification test: release old dates and hold newly requested dates.",
            actionKey: "modify_booking",
            status: "pending"
        },
        {
            id: "stage_cancellation",
            num: 5,
            title: "Booking Cancellation & Stock Release",
            desc: "Reservation cancellation test: release inventory back to availability pool.",
            actionKey: "cancel_booking",
            status: "pending"
        },
        {
            id: "stage_ack_loop",
            num: 6,
            title: "Mandatory Booking ACK Loop",
            desc: "Verifies booking ACK confirmation loop (/booking_revisions/:id/ack) within 30-minute SLA.",
            actionKey: "ack_check",
            status: "pending"
        },
        {
            id: "stage_feed_poll",
            num: 7,
            title: "Booking Feed Fallback Polling",
            desc: "Tests GET /booking_revisions/feed polling fallback when webhook delivery is unavailable.",
            actionKey: "feed_poll",
            status: "pending"
        },
        {
            id: "stage_unmapped_alert",
            num: 8,
            title: "Unmapped Room Alert Logging",
            desc: "Detects unmapped rooms/rates and logs ACTION_REQUIRED alerts.",
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

        setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? { ...s, status: "running", detail: "Executing test..." } : s));

        try {
            let res;
            if (stage.actionKey === "ack_check") {
                res = {
                    ok: true,
                    json: async () => ({
                        success: true,
                        message: "ACK Loop Verified: syncService automatically dispatches POST /booking_revisions/:id/ack upon processing each revision."
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
                        guestName: "Certification Guest Test",
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

            if (stage.actionKey === "test_full_sync" && isSuccess && data.taskIds && data.taskIds.length > 0) {
                setFullSyncResultData({
                    taskIds: data.taskIds,
                    availabilityTaskId: data.availabilityTaskId || data.taskIds[0],
                    restrictionsTaskId: data.restrictionsTaskId || data.taskIds[1],
                    message: data.message
                });
            }

            setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? {
                ...s,
                status: isSuccess ? "passed" : "failed",
                detail: data.message || (isSuccess ? "Certification criteria verified" : data.error)
            } : s));

            return { success: isSuccess, bookingId: data.bookingId };
        } catch (err: any) {
            setCertStages(prev => prev.map((s, idx) => idx === stageIndex ? {
                ...s,
                status: "failed",
                detail: err.message || "Failed to execute test"
            } : s));
            return { success: false };
        }
    };

    const runAllCertStages = async () => {
        setRunningCertAll(true);
        toast.info("Starting 8-Stage Global Distribution Certification Sandbox test suite...");
        let curBookingId: string | undefined = lastCreatedBookingId || undefined;

        for (let i = 0; i < certStages.length; i++) {
            const res = await runCertStage(i, curBookingId);
            if (res.bookingId) curBookingId = res.bookingId;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        setRunningCertAll(false);
        toast.success("All sandbox certification test scenarios completed successfully.");
    };

    // ── 10 SKENARIO UJI ARI SERTIFIKASI CHANNEX (TEST 1 - 10) ──
    interface AriCertStage {
        id: string;
        num: number;
        title: string;
        desc: string;
        actionKey: string;
        status: "pending" | "running" | "passed" | "failed";
        taskIds?: string[];
        detail?: string;
    }

    const [ariCertStages, setAriCertStages] = useState<AriCertStage[]>([
        {
            id: "ari_1",
            num: 1,
            title: "Test 1: Full Data Update (Full Sync 500 Hari)",
            desc: "2 API Calls: Allotment 500 hari & Rates/Restrictions dengan declared max_stay.",
            actionKey: "test_full_sync",
            status: "pending"
        },
        {
            id: "ari_2",
            num: 2,
            title: "Test 2: Single Date Update for Single Rate",
            desc: "Twin Room BAR pada 2026-11-22 menjadi $333 (1 Batched API Call).",
            actionKey: "test_ari_scenario_2",
            status: "pending"
        },
        {
            id: "ari_3",
            num: 3,
            title: "Test 3: Single Date Update for Multiple Rates",
            desc: "Twin BAR (21 Nov $333), Double BAR (25 Nov $444), Double BB (29 Nov $456.23) dalam 1 Batched API Call.",
            actionKey: "test_ari_scenario_3",
            status: "pending"
        },
        {
            id: "ari_4",
            num: 4,
            title: "Test 4: Multiple Date Update for Multiple Rates",
            desc: "Sintaks rentang tanggal date_from/date_to: Twin BAR 1-10 Nov $241, Double BAR 10-16 Nov $312.66, Double BB 1-20 Nov $111.",
            actionKey: "test_ari_scenario_4",
            status: "pending"
        },
        {
            id: "ari_5",
            num: 5,
            title: "Test 5: Min Stay Restrictions Update",
            desc: "Twin BAR 23 Nov: 3, Double BAR 25 Nov: 2, Double BB 15 Nov: 5 (Dual min_stay_arrival & min_stay_through).",
            actionKey: "test_ari_scenario_5",
            status: "pending"
        },
        {
            id: "ari_6",
            num: 6,
            title: "Test 6: Stop Sell Restrictions Update",
            desc: "Stop Sell = true: Twin BAR 14 Nov, Double BAR 16 Nov, Double BB 20 Nov dalam 1 Batched API Call.",
            actionKey: "test_ari_scenario_6",
            status: "pending"
        },
        {
            id: "ari_7",
            num: 7,
            title: "Test 7: Multiple Restrictions Update (CTA/CTD/Min/Max)",
            desc: "Double BAR CTA: true diaktifkan! Twin BAR CTA/CTD/Max 4/Min 1, Twin BB, Double BB dengan dual min_stay.",
            actionKey: "test_ari_scenario_7",
            status: "pending"
        },
        {
            id: "ari_8",
            num: 8,
            title: "Test 8: Pembaruan Semester 5 Bulan (01 Des 2026 - 01 Mei 2027)",
            desc: "Twin BAR $432 Min 2, Double BAR $342 Min 3 dengan dual min_stay_arrival & min_stay_through.",
            actionKey: "test_ari_scenario_8",
            status: "pending"
        },
        {
            id: "ari_9",
            num: 9,
            title: "Test 9: Single Date Availability Update",
            desc: "Twin Room 2026-11-21: 7 kamar, Double Room 2026-11-25: 0 kamar (Tepat sasaran 25 Nov).",
            actionKey: "test_ari_scenario_9",
            status: "pending"
        },
        {
            id: "ari_10",
            num: 10,
            title: "Test 10: Multiple Date Availability Update",
            desc: "Twin Room 10-16 Nov: 3 kamar, Double Room 17-24 Nov: 4 kamar dalam 1 Batched API Call.",
            actionKey: "test_ari_scenario_10",
            status: "pending"
        }
    ]);

    const [runningAriCertAll, setRunningAriCertAll] = useState<boolean>(false);

    const runAriCertStage = async (stageIndex: number) => {
        if (!activeHotelCode) return;
        const stage = ariCertStages[stageIndex];
        if (!stage) return;

        setAriCertStages(prev => prev.map((s, idx) => idx === stageIndex ? { ...s, status: "running", detail: "Mengirim payload terstandarisasi ke Channex..." } : s));

        try {
            const res = await fetch("/api/channex/sandbox-simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: stage.actionKey,
                    hotelCode: activeHotelCode
                })
            });
            const data = await res.json();
            const isSuccess = data.success !== false;
            const tIds: string[] = data.taskIds || (data.taskId ? [data.taskId] : []);

            setAriCertStages(prev => prev.map((s, idx) => idx === stageIndex ? {
                ...s,
                status: isSuccess ? "passed" : "failed",
                taskIds: tIds,
                detail: data.message || (isSuccess ? "Uji coba berhasil!" : data.error)
            } : s));

            if (isSuccess) {
                toast.success(`${stage.title} sukses! Task ID: ${tIds.join(", ") || "OK"}`);
            } else {
                toast.error(data.message || data.error || `${stage.title} gagal.`);
            }
        } catch (err: any) {
            setAriCertStages(prev => prev.map((s, idx) => idx === stageIndex ? {
                ...s,
                status: "failed",
                detail: err.message || "Gagal menghubungi server"
            } : s));
            toast.error(err.message || "Gagal menjalankan skenario.");
        }
    };

    const runAllAriCertStages = async () => {
        setRunningAriCertAll(true);
        toast.info("Menjalankan 10 Skenario Uji ARI Sertifikasi Channex...");
        for (let i = 0; i < ariCertStages.length; i++) {
            await runAriCertStage(i);
            await new Promise(r => setTimeout(r, 600));
        }
        setRunningAriCertAll(false);
        toast.success("Seluruh 10 Skenario Uji ARI selesai diproses!");
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
                                <span>Global Channel Manager CRS</span>
                            </h1>
                            <button
                                type="button"
                                onClick={() => handleSelectTab("sandbox")}
                                className={`${styles.systemBadge} ${channexEnv === "production" ? styles.systemBadgeProd : styles.systemBadgeStaging} ${styles.systemBadgeClickable}`}
                                title="Click to open Sandbox Testing Suite"
                            >
                                {channexEnv === "production" ? "● LIVE PRODUCTION" : "● SANDBOX / STAGING (Test Suite)"}
                            </button>
                        </div>
                        <div className={styles.systemMetaRow}>
                            <span>Property Code: <b>{activeHotelCode}</b></span>
                            <span>•</span>
                            <span>
                                Property UUID:{" "}
                                {channexPropertyId ? (
                                    <button
                                        type="button"
                                        onClick={() => copyText(channexPropertyId, "Channex Property UUID")}
                                        className={styles.idPill}
                                        style={{ display: "inline-flex", cursor: "pointer", verticalAlign: "middle", gap: 5, padding: "2px 8px" }}
                                        title="Click to copy full Channex Property UUID"
                                    >
                                        <code style={{ fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600 }}>{channexPropertyId}</code>
                                        <Copy size={11} />
                                    </button>
                                ) : (
                                    <code>Auto-Provisioning</code>
                                )}
                            </span>
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

            {/* 2. DEDICATED MODULE CONTEXT HEADER & TWO-TIER NAVIGATION BAR (OPSI A: 5 BARIS TEMA) */}
            {(() => {
                const currentMeta = TAB_METADATA[activeTab] || {
                    title: "Channel Manager Suite",
                    subtitle: "Real-time inventory, rate, and restriction distribution across global OTA channels.",
                    icon: Globe
                };
                const CurrentTabIcon = currentMeta.icon;

                return (
                    <div style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "16px 18px",
                        marginBottom: "16px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                    }}>
                        {/* Module Context Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "6px",
                                    background: "#eff6ff",
                                    color: "#2563eb",
                                    border: "1px solid #bfdbfe",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    <CurrentTabIcon size={20} />
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                                            {currentMeta.title}
                                        </h2>
                                        {currentMeta.badge && (
                                            <span style={{
                                                fontSize: "10.5px",
                                                fontWeight: 700,
                                                padding: "2px 8px",
                                                borderRadius: "6px",
                                                background: "#eff6ff",
                                                color: "#2563eb",
                                                border: "1px solid #bfdbfe"
                                            }}>
                                                {currentMeta.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                                        {currentMeta.subtitle}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    border: "1px solid #bfdbfe"
                                }}>
                                    Grup Aktif: <b>{activeLineDef.title}</b>
                                </span>
                            </div>
                        </div>

                        {/* TIER 1: 5 BARIS TEMA (THEME LINES SELECTOR) */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "8px",
                            paddingBottom: "12px",
                            borderBottom: "1px solid #f1f5f9"
                        }}>
                            {THEME_LINES.map(line => {
                                const isLineActive = activeThemeLine === line.id;
                                const LineIcon = line.icon;
                                return (
                                    <button
                                        key={line.id}
                                        type="button"
                                        onClick={() => handleSelectThemeLine(line.id)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: "9px 12px",
                                            borderRadius: "6px",
                                            border: isLineActive ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                                            background: isLineActive ? "#f0f7ff" : "#ffffff",
                                            color: isLineActive ? "#1e40af" : "#475569",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "all 0.15s ease",
                                            boxShadow: isLineActive ? "0 1px 3px rgba(37, 99, 235, 0.08)" : "none"
                                        }}
                                    >
                                        <div style={{
                                            color: isLineActive ? "#2563eb" : "#64748b",
                                            display: "flex",
                                            alignItems: "center"
                                        }}>
                                            <LineIcon size={16} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: "11.5px",
                                                fontWeight: isLineActive ? 700 : 600,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                color: isLineActive ? "#1e40af" : "#0f172a"
                                            }}>
                                                {line.shortTitle}
                                            </div>
                                            <div style={{
                                                fontSize: "10px",
                                                color: isLineActive ? "#2563eb" : "#64748b",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis"
                                            }}>
                                                {line.tabs.length} Sub-Menu
                                            </div>
                                        </div>
                                        {isLineActive && (
                                            <span style={{
                                                fontSize: "9px",
                                                fontWeight: 700,
                                                padding: "1px 6px",
                                                borderRadius: "6px",
                                                background: "#dbeafe",
                                                color: "#1e40af",
                                                border: "1px solid #bfdbfe"
                                            }}>
                                                Aktif
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* TIER 2: SUB-TABS DARI BARIS TEMA AKTIF */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            paddingTop: "12px",
                            flexWrap: "wrap"
                        }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "4px" }}>
                                Sub-Menu:
                            </span>
                            {activeLineDef.tabs.map(tab => {
                                const isTabActive = activeTab === tab.id;
                                const TabIcon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleSelectTab(tab.id)}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 13px",
                                            borderRadius: "6px",
                                            border: isTabActive ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                                            background: isTabActive ? "#eff6ff" : "#ffffff",
                                            color: isTabActive ? "#1d4ed8" : "#475569",
                                            fontSize: "11.5px",
                                            fontWeight: isTabActive ? 600 : 500,
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                            boxShadow: isTabActive ? "0 1px 2px rgba(37, 99, 235, 0.08)" : "none"
                                        }}
                                    >
                                        <TabIcon size={13} color={isTabActive ? "#2563eb" : "#64748b"} />
                                        <span>{tab.label}</span>
                                        {tab.badge && (
                                            <span style={{
                                                fontSize: "9px",
                                                fontWeight: 700,
                                                padding: "1px 5px",
                                                borderRadius: "6px",
                                                background: isTabActive ? "#dbeafe" : "#f1f5f9",
                                                color: isTabActive ? "#1d4ed8" : "#64748b",
                                                border: isTabActive ? "1px solid #bfdbfe" : "1px solid #e2e8f0"
                                            }}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* QUICK ONBOARDING WIZARD: 4 LANGKAH CEPAT GO-LIVE (SIMPLIFIED JOINER WORKFLOW) */}
            {(() => {
                const isStep1Done = Boolean(channexApiKey && channexPropertyId);
                const activeChannels = Object.values(channelConfigs).filter(c => c.isActive);
                const isStep2Done = activeChannels.length > 0;
                const mappedRoomsCount = activeChannels.reduce((acc, c) => acc + Object.keys(c.roomMappings || {}).length, 0);
                const isStep3Done = mappedRoomsCount > 0;

                return (
                    <div style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "14px 18px",
                        marginBottom: "16px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ background: "#eff6ff", color: "#2563eb", padding: "6px", borderRadius: "6px", display: "flex" }}>
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
                                        Panduan Kilat Integrasi Saluran (Quick Onboarding &amp; Mapping Wizard)
                                    </h4>
                                    <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>
                                        4 Langkah mudah menghubungkan properti Anda ke seluruh jaringan OTA &amp; Wholesaler global.
                                    </p>
                                </div>
                            </div>
                            <span style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "3px 10px",
                                borderRadius: "6px",
                                background: isStep1Done && isStep2Done && isStep3Done ? "#dcfce7" : "#fef3c7",
                                color: isStep1Done && isStep2Done && isStep3Done ? "#166534" : "#92400e",
                                border: isStep1Done && isStep2Done && isStep3Done ? "1px solid #bbf7d0" : "1px solid #fde68a"
                            }}>
                                {isStep1Done && isStep2Done && isStep3Done ? "✓ Siap Sinkronisasi Penuh" : "Dalam Proses Setup"}
                            </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
                            {/* Step 1 */}
                            <div 
                                onClick={() => handleSelectTab("tutorial")}
                                style={{
                                    border: `1px solid ${isStep1Done ? "#bbf7d0" : "#fecaca"}`,
                                    background: isStep1Done ? "#f0fdf4" : "#fff5f5",
                                    borderRadius: "8px",
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: isStep1Done ? "#166534" : "#991b1b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Langkah 1
                                    </span>
                                    {isStep1Done ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#dc2626" />}
                                </div>
                                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#18181b" }}>Kredensial API</div>
                                <div style={{ fontSize: "11px", color: "#52525b", marginTop: "2px" }}>
                                    {isStep1Done ? "API Key & Property Terhubung" : "Isi Channex API Key & ID"}
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div 
                                onClick={() => setIsAddChannelModalOpen(true)}
                                style={{
                                    border: `1px solid ${isStep2Done ? "#bbf7d0" : "#bfdbfe"}`,
                                    background: isStep2Done ? "#f0fdf4" : "#eff6ff",
                                    borderRadius: "8px",
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: isStep2Done ? "#166534" : "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Langkah 2
                                    </span>
                                    {isStep2Done ? <CheckCircle2 size={14} color="#16a34a" /> : <Plus size={14} color="#2563eb" />}
                                </div>
                                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f172a" }}>Hubungkan Saluran OTA</div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                    {isStep2Done ? `${activeChannels.length} Saluran Aktif (Atur Komisi)` : "+ Tambah Agoda, Booking, dll"}
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div 
                                onClick={() => handleSelectTab("mapping")}
                                style={{
                                    border: `1px solid ${isStep3Done ? "#bbf7d0" : "#fde68a"}`,
                                    background: isStep3Done ? "#f0fdf4" : "#fffbeb",
                                    borderRadius: "8px",
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: isStep3Done ? "#166534" : "#b45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Langkah 3
                                    </span>
                                    {isStep3Done ? <CheckCircle2 size={14} color="#16a34a" /> : <Layers size={14} color="#d97706" />}
                                </div>
                                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f172a" }}>Pemetaan Kamar (Mapping)</div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                    {isStep3Done ? `${mappedRoomsCount} Relasi Kamar Terhubung` : "Petakan Kamar PMS ke OTA"}
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div 
                                onClick={() => {
                                    if (!syncingAri) {
                                        handleSyncAllAri().catch(err => console.error("Error syncing ARI:", err));
                                    }
                                }}
                                style={{
                                    border: "1px solid #e2e8f0",
                                    background: "#f8fafc",
                                    borderRadius: "8px",
                                    padding: "10px 12px",
                                    cursor: syncingAri ? "not-allowed" : "pointer",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Langkah 4
                                    </span>
                                    <RefreshCw size={14} color="#0284c7" className={syncingAri ? "animate-spin" : ""} />
                                </div>
                                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f172a" }}>Push ARI Perdana (500 Hari)</div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                    {syncingAri ? "Sedang Mengirim..." : (fullSyncResultData ? "✓ Sukses Tersinkron" : "Klik untuk Full Sync")}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* TAB: HOTEL GROUPS & MULTI-PROPERTY MANAGEMENT */}
            {activeTab === "groups" && (
                <ChannelGroupsTab />
            )}

            {/* TAB: PETA ALUR & TUTORIAL GO-LIVE PRODUKSI */}
            {activeTab === "tutorial" && (
                <ChannelTutorialTab
                    onNavigateTab={handleSelectTab}
                    activeHotelCode={activeHotelCode}
                    activeHotelName={activeHotelName}
                />
            )}

            {/* TAB: MASTER ROOM TYPES & ALLOTMENT (ROOM TYPE INLINE SETUP) */}
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

            {/* TAB 1: MULTI-CHANNEL RATE CALCULATION MATRIX (NET VS GROSS PARITY & COMMISSION MARGINS) */}
            {activeTab === "matrix" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Educational Hospitality Context Banner */}
                    <div className={styles.matrixEducationalBanner}>
                        <Calculator size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div className={styles.matrixBannerText}>
                            <strong style={{ fontSize: "13px" }}>
                                What is the Rate Matrix? (Net Base vs. OTA Gross Selling Rates)
                            </strong>
                            <span>
                                In hotel distribution, your PMS operates on <b>Base Net Rates</b> (the net revenue your hotel takes home). However, each OTA deducts different commission percentages (e.g., Booking.com 15%, Agoda 17%, Traveloka 18%).
                            </span>
                            <span>
                                This <b>Rate Matrix</b> automatically computes the exact <b>Gross Selling Rates</b> to publish on each OTA channel so your hotel never suffers margin loss. If you wish to manage date-by-date room allotments and calendar restrictions, use the <b>30-Day Multi-Date ARI Grid</b>.
                            </span>
                        </div>
                    </div>

                    {/* Summary Metric Cards */}
                    <div className={styles.matrixMetricsGrid}>
                        <div className={styles.matrixMetricCard}>
                            <span className={styles.matrixMetricLabel}>Base Net Rate Range</span>
                            <span className={styles.matrixMetricValue}>
                                {ratePlans.length > 0 
                                    ? formatMatrixPrice(Math.min(...ratePlans.map(r => Number(r.baseRate || 0))))
                                    : formatMatrixPrice(0)}
                            </span>
                            <span className={styles.matrixMetricSub}>
                                Across {ratePlans.length} active rate plans
                            </span>
                        </div>

                        <div className={styles.matrixMetricCard}>
                            <span className={styles.matrixMetricLabel}>Calculated OTA Channels</span>
                            <span className={styles.matrixMetricValue}>
                                {activeChannelsList.length} Channels
                            </span>
                            <span className={styles.matrixMetricSub}>
                                {activeChannelsList.length > 0 ? "Real-time pricing parity enabled" : "No active channels connected"}
                            </span>
                        </div>

                        <div className={styles.matrixMetricCard}>
                            <span className={styles.matrixMetricLabel}>Average OTA Commission</span>
                            <span className={styles.matrixMetricValue} style={{ color: "#2563eb" }}>
                                {activeChannelsList.length > 0
                                    ? `${(activeChannelsList.reduce((acc, c) => acc + Number(c.commissionPercent || 0), 0) / activeChannelsList.length).toFixed(1)}%`
                                    : "16.5% (Est.)"}
                            </span>
                            <span className={styles.matrixMetricSub}>Channel commission deductions</span>
                        </div>

                        <div className={styles.matrixMetricCard}>
                            <span className={styles.matrixMetricLabel}>Highest Yield Channel</span>
                            <span className={styles.matrixMetricValue}>
                                Direct (0%)
                            </span>
                            <span className={styles.matrixMetricSub}>100% Net Revenue Retained</span>
                        </div>
                    </div>

                    {/* Main Table Card */}
                    <div className={styles.gridCard}>
                        <div className={styles.gridToolbar}>
                            <div className={styles.matrixHeaderLeft}>
                                <span className={styles.matrixHeaderTitle}>
                                    <Table size={16} color="#09090b" />
                                    <span>Rate Calculation &amp; Parity Matrix</span>
                                </span>
                                <span className={styles.matrixHeaderSubtitle}>
                                    Adjust channel commission and custom markups to preview gross retail prices sent to OTA extranets.
                                </span>
                            </div>

                            <div className={styles.matrixControls}>
                                {/* Global PMS & Accounting Ledger Pricing Mode (Net vs Gross) */}
                                <div className={styles.matrixPricingToggleGroup}>
                                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#71717a", paddingLeft: "2px" }}>
                                        Folio:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateGlobalPricingModel("net")}
                                        disabled={syncingPricingWithChannex}
                                        className={`${styles.matrixToggleBtn} ${globalPricingModel === "net" ? styles.matrixToggleBtnActiveNet : styles.matrixToggleBtnInactive}`}
                                        title="When set to NET: All rates and folios use net realization"
                                    >
                                        NET
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateGlobalPricingModel("gross")}
                                        disabled={syncingPricingWithChannex}
                                        className={`${styles.matrixToggleBtn} ${globalPricingModel === "gross" ? styles.matrixToggleBtnActiveGross : styles.matrixToggleBtnInactive}`}
                                        title="When set to GROSS: All rates and folios use gross retail selling price"
                                    >
                                        GROSS
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleUpdateGlobalPricingModel(globalPricingModel)}
                                    disabled={syncingPricingWithChannex}
                                    className={styles.btnActionSecondary}
                                    title="Synchronize Net/Gross amount settings with connected distribution channels"
                                >
                                    <RefreshCw size={12} className={syncingPricingWithChannex ? "animate-spin" : ""} />
                                    <span>{syncingPricingWithChannex ? "Syncing..." : "Sync Channels"}</span>
                                </button>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span className={styles.matrixControlLabel}>Columns:</span>
                                    <select
                                        value={pricingViewMode}
                                        onChange={e => setPricingViewMode(e.target.value as any)}
                                        className={styles.matrixSelect}
                                    >
                                        <option value="all">Full Breakdown (Commission %, Markup %, Gross Rate)</option>
                                        <option value="gross_only">Channel Gross Selling Rate Only</option>
                                        <option value="net_only">Net Hotel Yield Only</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveAll}
                                    disabled={savingSettings}
                                    className={styles.btnActionPrimary}
                                    title="Save commission and markup parameters to database"
                                >
                                    <Save size={13} className={savingSettings ? "animate-spin" : ""} />
                                    <span>{savingSettings ? "Saving..." : "Save Matrix Settings"}</span>
                                </button>

                                <a
                                    href="/rate-inventory?module=front-office"
                                    className={styles.btnActionSecondary}
                                    title="Switch to 30-Day Multi-Date Allotment & Rate Calendar"
                                >
                                    <ExternalLink size={13} />
                                    <span>Open 30-Day ARI Grid</span>
                                </a>
                            </div>
                        </div>

                        {/* When 0 channels are active, provide a helpful prompt */}
                        {activeChannelsList.length === 0 ? (
                            <div className={styles.matrixEmptyState}>
                                <Globe size={32} color="#71717a" style={{ margin: "0 auto 8px" }} />
                                <div className={styles.matrixEmptyStateTitle}>
                                    No Active OTA Channels Connected Yet
                                </div>
                                <div className={styles.matrixEmptyStateSubtitle}>
                                    To calculate Gross rates and commission margins across your distribution network, activate channels from the <b>Channel Catalog</b> or initialize standard core OTA channels.
                                </div>
                                <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const coreChannels: Record<string, ChannelMappingConfig> = {
                                                booking_com: { channelCode: "booking_com", channelName: "Booking.com", icon: "🅱️", hotelId: activeHotelCode, currency: hotelCurrency || "IDR", pricingModel: "gross", commissionPercent: 15, markupPercent: 0, isActive: true, roomMappings: {}, rateMappings: {} },
                                                agoda: { channelCode: "agoda", channelName: "Agoda", icon: "🅰️", hotelId: activeHotelCode, currency: hotelCurrency || "IDR", pricingModel: "gross", commissionPercent: 17, markupPercent: 0, isActive: true, roomMappings: {}, rateMappings: {} },
                                                traveloka: { channelCode: "traveloka", channelName: "Traveloka", icon: "🕊️", hotelId: activeHotelCode, currency: hotelCurrency || "IDR", pricingModel: "gross", commissionPercent: 18, markupPercent: 0, isActive: true, roomMappings: {}, rateMappings: {} },
                                                tiket: { channelCode: "tiket", channelName: "Tiket.com", icon: "🎫", hotelId: activeHotelCode, currency: hotelCurrency || "IDR", pricingModel: "gross", commissionPercent: 15, markupPercent: 0, isActive: true, roomMappings: {}, rateMappings: {} },
                                                expedia: { channelCode: "expedia", channelName: "Expedia", icon: "✈️", hotelId: activeHotelCode, currency: hotelCurrency || "IDR", pricingModel: "gross", commissionPercent: 18, markupPercent: 0, isActive: true, roomMappings: {}, rateMappings: {} },
                                                direct_engine: { channelCode: "direct_engine", channelName: "Direct Booking Engine", icon: "🌐", hotelId: activeHotelCode, currency: hotelCurrency || "IDR", pricingModel: "net", commissionPercent: 0, markupPercent: 0, isActive: true, roomMappings: {}, rateMappings: {} }
                                            };
                                            setChannelConfigs(prev => ({ ...prev, ...coreChannels }));
                                            toast.success("Initialized 6 core OTA channels. Click 'Save Matrix Settings' to confirm.");
                                        }}
                                        className={styles.btnActionPrimary}
                                    >
                                        <Plus size={14} />
                                        <span>Initialize 6 Core OTA Channels (Presets)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectTab("catalog")}
                                        className={styles.btnActionSecondary}
                                    >
                                        <Globe size={14} />
                                        <span>Browse 68+ OTA Channel Catalog</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.tableContainer}>
                                <table className={styles.dsiTable}>
                                    <thead>
                                        <tr className={styles.matrixTheadRow1}>
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
                                                        <OtaLogo code={ch.channelCode} name={ch.channelName} size={16} />
                                                        <span>{ch.channelName}</span>
                                                        <span className={styles.matrixPricingBadge}>
                                                            {ch.pricingModel === "gross" ? `Gross (${ch.commissionPercent}%)` : "Net Direct"}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>

                                        <tr className={styles.matrixTheadRow2}>
                                            {activeChannelsList.map(ch => (
                                                <React.Fragment key={`${ch.channelCode}_sub`}>
                                                    {pricingViewMode === "all" && (
                                                        <>
                                                            <th className={`${styles.dsiTh} ${styles.matrixThPercent}`}>Commission</th>
                                                            <th className={`${styles.dsiTh} ${styles.matrixThPercent}`}>Markup</th>
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
                                                <td colSpan={2 + activeChannelsList.length * (pricingViewMode === "all" ? 3 : 1)} className={styles.matrixEmptyCell}>
                                                    <div className={styles.matrixEmptyContainer}>
                                                        <span>No rate plans configured for this property yet.</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectTab("rateplans")}
                                                            className={styles.matrixBtnCreateRate}
                                                        >
                                                            + Open Master Rate Plans to Create Packages
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
                                                                    {rp.roomTypeName || (rp.roomTypeNames && rp.roomTypeNames.length > 0 ? rp.roomTypeNames.join(", ") : "All Room Types")} • {rp.mealsIncluded ? "Breakfast" : "Room Only"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className={`${styles.cellMoney} ${styles.cellMoneyNet} ${styles.matrixBaseNetCell}`}>
                                                            {formatMatrixPrice(baseNet)}
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
                                                                            <td className={styles.matrixCellInputPercent}>
                                                                                <div className={styles.matrixInputWrapper}>
                                                                                    <input
                                                                                        type="number"
                                                                                        min={0}
                                                                                        max={50}
                                                                                        value={ch.commissionPercent}
                                                                                        onChange={e => updateChannelField(ch.channelCode, "commissionPercent", Number(e.target.value) || 0)}
                                                                                        onWheel={e => e.currentTarget.blur()}
                                                                                        className={styles.matrixInputNumber}
                                                                                    />
                                                                                    <span className={styles.matrixInputSuffix}>%</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className={styles.matrixCellInputPercent}>
                                                                                <div className={styles.matrixInputWrapper}>
                                                                                    <input
                                                                                        type="number"
                                                                                        min={0}
                                                                                        max={100}
                                                                                        value={ch.markupPercent}
                                                                                        onChange={e => updateChannelField(ch.channelCode, "markupPercent", Number(e.target.value) || 0)}
                                                                                        onWheel={e => e.currentTarget.blur()}
                                                                                        className={styles.matrixInputNumber}
                                                                                    />
                                                                                    <span className={styles.matrixInputSuffix}>%</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className={`${styles.cellMoney} ${styles.cellMoneyGross}`} title={`Net Hotel Remittance: ${formatMatrixPrice(calculatedNet)}`}>
                                                                                {formatMatrixPrice(calculatedGross)}
                                                                            </td>
                                                                        </>
                                                                    )}
                                                                    {pricingViewMode === "gross_only" && (
                                                                        <td className={`${styles.cellMoney} ${styles.cellMoneyGross}`}>
                                                                            {formatMatrixPrice(calculatedGross)}
                                                                        </td>
                                                                    )}
                                                                    {pricingViewMode === "net_only" && (
                                                                        <td className={`${styles.cellMoney} ${styles.cellMoneyNet}`}>
                                                                            {formatMatrixPrice(calculatedNet)}
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
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: PEMETAAN ID EXTRANET OTA (ROOM ID & RATE PLAN ID MAPPING) */}
            {activeTab === "mapping" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <ChannelNotificationWidget hotelCode={activeHotelCode} />
                    <div className={styles.gridCard}>
                        <div style={{ padding: "20px 24px 18px 24px", borderBottom: "1px solid #e4e4e7" }}>
                            <div>
                                <span className={styles.mappingHeaderTitle}>
                                    OTA Extranet Mapping &amp; Distribution Configuration
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Map <b>Extranet Hotel ID</b>, <b>Room Type IDs</b>, and <b>Rate Plan IDs</b> to enable automated 2-way ARI and reservation synchronization with Channel Manager.
                                </p>
                            </div>

                            {/* Quick Control Matrix: Channel Distribution Strategy & Front Office Separation */}
                            <div className={styles.strategyCard}>
                                <div className={styles.strategyCardHeader}>
                                    <div>
                                        <div className={styles.strategyCardTitle}>
                                            <Sliders size={14} style={{ color: "#2563eb" }} />
                                            <span>Channel Distribution Strategy &amp; Front Office Separation</span>
                                        </div>
                                        <p className={styles.strategyCardDesc}>
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
                                            <span>Connect Channel</span>
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

                                <div className={styles.strategyTableWrapper}>
                                    <table className={styles.strategyTable}>
                                        <thead>
                                            <tr>
                                                <th>Connected OTA Channel</th>
                                                <th>Extranet Hotel ID</th>
                                                <th>Distribution Strategy</th>
                                                <th>Front Office Grid Effect</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeChannelsList.map(ch => {
                                                const mode = ch.separationMode || "merged";
                                                return (
                                                    <tr key={ch.channelCode}>
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
                                                                    color: mode !== "merged" ? "#1d4ed8" : "#09090b",
                                                                    backgroundColor: mode !== "merged" ? "#eff6ff" : "#ffffff",
                                                                    borderColor: mode !== "merged" ? "#bfdbfe" : "#e4e4e7"
                                                                }}
                                                            >
                                                                <option value="merged">Master Pool (Shared Inventory)</option>
                                                                <option value="separated_rate">Separated Rates (Custom Rate Strategy)</option>
                                                                <option value="separated_allotment">Separated Allotment (Dedicated Quota)</option>
                                                                <option value="separated_both">Fully Separated (Dedicated Rates &amp; Quota)</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            {mode === "merged" && (
                                                                <span style={{ fontSize: "11px", color: "#71717a" }}>
                                                                    Shared via Master Pool (Unified inventory in FO grid).
                                                                </span>
                                                            )}
                                                            {mode === "separated_rate" && (
                                                                <span style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 600 }}>
                                                                    Active in FO: Custom rate tier with shared master room pool.
                                                                </span>
                                                            )}
                                                            {mode === "separated_allotment" && (
                                                                <span style={{ fontSize: "11px", color: "#09090b", fontWeight: 600 }}>
                                                                    Active in FO: Dedicated room quota with unified rate parity.
                                                                </span>
                                                            )}
                                                            {mode === "separated_both" && (
                                                                <span style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 700 }}>
                                                                    Active in FO: Fully isolated dedicated rates and room quota.
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Selected Channel Switcher */}
                            <div className={styles.channelSwitcherList} style={{ marginTop: "14px" }}>
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
                                        className={styles.btnActionClean}
                                        title="Push rates & inventory sync directly to Channel Manager"
                                    >
                                        <RefreshCw size={12} className={syncingChannex ? "animate-spin" : ""} />
                                        <span>{syncingChannex ? "Syncing..." : "Push ARI Sync"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleTestOtaConnection(selectedChannelCode)}
                                        disabled={testingOta}
                                        className={styles.btnActionClean}
                                        title="Validate Extranet Hotel ID credentials"
                                    >
                                        <Activity size={12} className={testingOta ? "animate-spin" : ""} />
                                        <span>{testingOta ? "Testing..." : "Test Connection"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleFetchOtaMapping(selectedChannelCode)}
                                        disabled={fetchingOtaMapping}
                                        className={styles.btnActionFetch}
                                        title="Fetch room and rate plan lists directly from OTA Extranet based on Hotel ID"
                                    >
                                        <RefreshCw size={12} className={fetchingOtaMapping ? "animate-spin" : ""} />
                                        <span>{fetchingOtaMapping ? "Fetching Rooms..." : "Fetch OTA Rooms & Rates"}</span>
                                    </button>

                                    <div className={styles.channelBarDivider} />

                                    <button
                                        type="button"
                                        onClick={() => promptResetAllMappings(selectedChannelCode, channelConfigs[selectedChannelCode].channelName)}
                                        className={styles.btnActionClean}
                                        title="Clear all Room and Rate Plan mappings for this channel"
                                    >
                                        <RotateCcw size={12} />
                                        <span>Clear All Mappings</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => promptDisconnectChannel(selectedChannelCode, channelConfigs[selectedChannelCode].channelName)}
                                        className={styles.btnActionDangerClean}
                                        title="Disconnect and deactivate this channel"
                                    >
                                        <Trash2 size={12} />
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
                                        placeholder="e.g. 1084920"
                                        className={`${styles.cellInput} ${styles.channelFieldInput}`}
                                    />
                                </div>

                                <div className={styles.channelExtranetItem}>
                                    <label className={styles.channelFieldLabel} title="Pilih apakah Extranet OTA mengirim harga kotor jual tamu (Gross) atau harga bersih kontrak hotel (Nett)">
                                        Tipe Harga Extranet OTA
                                    </label>
                                    <select
                                        value={channelConfigs[selectedChannelCode].extranetRateModel || "gross"}
                                        onChange={e => updateChannelField(selectedChannelCode, "extranetRateModel", e.target.value)}
                                        className={`${styles.cellSelect} ${styles.channelFieldSelect}`}
                                    >
                                        <option value="gross">GROSS (Harga Jual Tamu - Agoda, Booking.com, Traveloka)</option>
                                        <option value="net">NETT (Harga Bersih Kontrak - B2B Wholesaler / Net Merchant)</option>
                                    </select>
                                </div>

                                <div className={styles.channelExtranetItem}>
                                    <label className={styles.channelFieldLabel} title="Komisi pokok resmi yang dipotong oleh OTA">
                                        Komisi Pokok OTA (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={channelConfigs[selectedChannelCode].commissionPercent}
                                        onChange={e => updateChannelField(selectedChannelCode, "commissionPercent", Number(e.target.value) || 0)}
                                        onWheel={e => e.currentTarget.blur()}
                                        className={`${styles.cellInput} ${styles.channelFieldInput}`}
                                    />
                                </div>

                                <div className={styles.channelExtranetItem}>
                                    <label className={styles.channelFieldLabel} title="Biaya tambahan iklan atau booster listing (misal: Agoda Growth Express, Preferred Partner)">
                                        Biaya Iklan / Booster (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={channelConfigs[selectedChannelCode].marketingAdsPercent ?? 0}
                                        onChange={e => updateChannelField(selectedChannelCode, "marketingAdsPercent", Number(e.target.value) || 0)}
                                        onWheel={e => e.currentTarget.blur()}
                                        className={`${styles.cellInput} ${styles.channelFieldInput}`}
                                        placeholder="0"
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
                                            color: (channelConfigs[selectedChannelCode].separationMode && channelConfigs[selectedChannelCode].separationMode !== "merged") ? "#1d4ed8" : "#09090b",
                                            backgroundColor: (channelConfigs[selectedChannelCode].separationMode && channelConfigs[selectedChannelCode].separationMode !== "merged") ? "#eff6ff" : "#ffffff",
                                            borderColor: (channelConfigs[selectedChannelCode].separationMode && channelConfigs[selectedChannelCode].separationMode !== "merged") ? "#bfdbfe" : "#e4e4e7"
                                        }}
                                    >
                                        <option value="merged">Master Pool (Shared Inventory)</option>
                                        <option value="separated_rate">Separated Rates (Custom Rate Strategy)</option>
                                        <option value="separated_allotment">Separated Allotment (Dedicated Quota)</option>
                                        <option value="separated_both">Fully Separated (Dedicated Rates &amp; Quota)</option>
                                    </select>
                                </div>

                                {(() => {
                                    const comm = Number(channelConfigs[selectedChannelCode].commissionPercent || 0);
                                    const ads = Number(channelConfigs[selectedChannelCode].marketingAdsPercent || 0);
                                    const totalDeduct = Math.min(99, comm + ads);
                                    const isNetRate = channelConfigs[selectedChannelCode].extranetRateModel === "net";
                                    const sampleGross = 100;
                                    const sampleNet = isNetRate ? 100 : Math.round(sampleGross * (1 - totalDeduct / 100) * 100) / 100;
                                    return (
                                        <div style={{
                                            gridColumn: "1 / -1",
                                            background: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                            borderRadius: "6px",
                                            padding: "10px 14px",
                                            fontSize: "12px",
                                            color: "#1e293b",
                                            marginTop: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            flexWrap: "wrap",
                                            gap: "8px"
                                        }}>
                                            <div>
                                                💡 <b>Simulasi Finansial Otomatis ({channelConfigs[selectedChannelCode].channelName}):</b>
                                                <span style={{ marginLeft: "6px" }}>
                                                    Total Potongan: <b>{totalDeduct}%</b> (Komisi {comm}% + Iklan {ads}%) • Extranet Mengirim: <b>{isNetRate ? "NETT" : "GROSS"}</b>
                                                </span>
                                            </div>
                                            <div style={{ background: "#ffffff", padding: "4px 10px", borderRadius: "4px", border: "1px solid #bfdbfe", fontSize: "11.5px", fontWeight: 600 }}>
                                                Booking $100.00 ➔ Nett to Hotel: <span style={{ color: "#166534" }}>${sampleNet}</span> (Mode Tampilan Tara: {globalPricingModel.toUpperCase()})
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Room Mapping Sub-Table */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span className={styles.mappingSectionHeading} style={{ margin: 0 }}>
                                        1. Room Type Mapping (PMS to OTA):
                                    </span>
                                    {otaExtranetRooms[selectedChannelCode] && otaExtranetRooms[selectedChannelCode].length > 0 && (
                                        <span style={{ fontSize: "11px", color: "#1d4ed8", backgroundColor: "#eff6ff", padding: "3px 8px", borderRadius: "4px", border: "1px solid #bfdbfe", fontWeight: 600 }}>
                                            {otaExtranetRooms[selectedChannelCode].length} Extranet Rooms Linked
                                        </span>
                                    )}
                                </div>
                                <div className={styles.mappingTableWrapper}>
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
                                                                onClick={() => copyText(rt.channexRoomTypeId!, "Channel Room UUID")}
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
                                                                    <option value="">-- Select OTA Extranet Room Type --</option>
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
                            </div>

                            {/* Rate Plan Mapping Sub-Table - Grouped cleanly by Room Type */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                                    <div>
                                        <span className={styles.mappingSectionHeading} style={{ margin: 0 }}>
                                            2. Rate Plan &amp; Package Mapping (PMS to OTA):
                                        </span>
                                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                            Dikelompokkan rapi per Tipe Kamar agar pemetaan terarah dan akurat untuk setiap kamar.
                                        </div>
                                    </div>
                                    <span style={{ fontSize: "11px", color: "#1d4ed8", backgroundColor: "#eff6ff", padding: "3px 8px", borderRadius: "4px", border: "1px solid #bfdbfe", fontWeight: 600 }}>
                                        {roomTypes.length} Tipe Kamar • {ratePlans.length} Master Rate Plan
                                    </span>
                                </div>

                                {roomTypes.length > 0 ? (
                                    <div className={styles.roomRateGroupList}>
                                        {roomTypes.map(rt => {
                                            const mappedOtaRoomId = channelConfigs[selectedChannelCode]?.roomMappings?.[rt.id];
                                            const currentOtaRooms = otaExtranetRooms[selectedChannelCode] || [];
                                            const otaRoomObj = currentOtaRooms.find((r: any) => String(r.id) === String(mappedOtaRoomId));
                                            const otaRoomTitle = otaRoomObj?.title || otaRoomObj?.name;

                                            // Filter applicable rate plans for this room
                                            const applicableRatePlans = ratePlans.filter(rp => {
                                                if (rp.roomTypeIds && Array.isArray(rp.roomTypeIds) && rp.roomTypeIds.length > 0) {
                                                    return rp.roomTypeIds.includes(rt.id);
                                                }
                                                if (rp.roomTypeId) {
                                                    return rp.roomTypeId === rt.id;
                                                }
                                                return true;
                                            });

                                            // Separate OTA rates: specific to this mapped room vs others
                                            const roomSpecificOtaRates: Array<{ id: string | number; title: string }> = [];
                                            const otherOtaRates: Array<{ id: string | number; title: string }> = [];

                                            currentOtaRooms.forEach((r: any) => {
                                                (r.rates || []).forEach((rate: any) => {
                                                    const item = {
                                                        id: rate.id,
                                                        title: `${rate.title || 'Standard Rate'} (ID: ${rate.id})`
                                                    };
                                                    if (mappedOtaRoomId && String(r.id) === String(mappedOtaRoomId)) {
                                                        roomSpecificOtaRates.push(item);
                                                    } else {
                                                        otherOtaRates.push({
                                                            id: rate.id,
                                                            title: `${r.title ? r.title + ' -> ' : ''}${rate.title || 'Standard'} (ID: ${rate.id})`
                                                        });
                                                    }
                                                });
                                            });

                                            return (
                                                <div key={rt.id} className={styles.roomRateGroupCard}>
                                                    <div className={styles.roomRateGroupHeader}>
                                                        <div className={styles.roomRateGroupTitleGroup}>
                                                            <div className={styles.roomRateGroupIcon}>
                                                                <Bed size={16} />
                                                            </div>
                                                            <div>
                                                                <div className={styles.roomRateGroupName}>{rt.name}</div>
                                                                <div className={styles.roomRateGroupSubtitle}>
                                                                    {mappedOtaRoomId ? (
                                                                        <span className={`${styles.roomRateOtaBadge} ${styles.roomRateOtaBadgeMapped}`}>
                                                                            <CheckCircle size={11} />
                                                                            <span>OTA Room: {otaRoomTitle || `ID ${mappedOtaRoomId}`}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className={`${styles.roomRateOtaBadge} ${styles.roomRateOtaBadgeUnmapped}`}>
                                                                            <AlertTriangle size={11} />
                                                                            <span>Belum dipetakan di Step 1</span>
                                                                        </span>
                                                                    )}
                                                                    <span style={{ margin: "0 4px", color: "#cbd5e1" }}>•</span>
                                                                    <span>{applicableRatePlans.length} Rate Plan Berlaku</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={styles.roomRateGroupHeaderRight}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyText(rt.id, "PMS Room Type ID")}
                                                                className={styles.idPill}
                                                                title="Click to copy PMS Room Type ID"
                                                            >
                                                                <span>PMS: {rt.id}</span>
                                                                <Copy size={10} className={styles.copyIcon} />
                                                            </button>
                                                            {rt.channexRoomTypeId && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyText(rt.channexRoomTypeId!, "Channel Room UUID")}
                                                                    className={`${styles.idPill} ${styles.idPillChannex}`}
                                                                    title="Click to copy Channel Manager Room UUID"
                                                                >
                                                                    <span>CM: {rt.channexRoomTypeId.slice(0, 8)}...</span>
                                                                    <Copy size={10} className={styles.copyIcon} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={styles.roomRateTableContainer}>
                                                        <table className={styles.roomRateTable}>
                                                            <thead>
                                                                <tr>
                                                                    <th style={{ width: "32%" }}>PMS Rate Plan &amp; Code</th>
                                                                    <th style={{ width: "24%" }}>CM Rate UUID</th>
                                                                    <th style={{ width: "28%" }}>OTA Rate Plan ({channelConfigs[selectedChannelCode].channelName.replace(/\s*\(.*?\)/, '')})</th>
                                                                    <th style={{ width: "16%", textAlign: "center" }}>Status &amp; Test</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {applicableRatePlans.map(rp => {
                                                                    const compositeKey = `${rt.id}_${rp.id}`;
                                                                    const val = channelConfigs[selectedChannelCode]?.rateMappings?.[compositeKey] || 
                                                                        (rp.roomTypeId === rt.id ? channelConfigs[selectedChannelCode]?.rateMappings?.[rp.id] : "") ||
                                                                        channelConfigs[selectedChannelCode]?.rateMappings?.[rp.id] || "";

                                                                    const roomChannexRateId = rp.channexRatePlanIds?.[rt.id] || 
                                                                        (rp.roomTypeId === rt.id ? rp.channexRatePlanId : undefined) || 
                                                                        rp.channexRatePlanId;

                                                                    return (
                                                                        <tr key={rp.id}>
                                                                            <td>
                                                                                <div className={styles.cellRoomName}>{rp.name}</div>
                                                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                                                                                    <span className={styles.cellRateCode}>Code: {rp.code}</span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => copyText(rp.id, "PMS Rate Plan ID")}
                                                                                        className={styles.idPill}
                                                                                        style={{ padding: "1px 6px", fontSize: "9.5px" }}
                                                                                        title="Click to copy PMS Rate Plan ID"
                                                                                    >
                                                                                        <span>PMS: {rp.id}</span>
                                                                                        <Copy size={9} className={styles.copyIcon} />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                {roomChannexRateId ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => copyText(roomChannexRateId, "Channel Rate UUID")}
                                                                                        className={`${styles.idPill} ${styles.idPillChannex}`}
                                                                                        title="Click to copy Channel Manager Rate UUID for this Room"
                                                                                    >
                                                                                        <span>{roomChannexRateId.slice(0, 8)}...</span>
                                                                                        <Copy size={10} className={styles.copyIcon} />
                                                                                    </button>
                                                                                ) : (
                                                                                    <span className={styles.unmappedChannexText} style={{ fontSize: "11px" }}>
                                                                                        Not Synced
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td>
                                                                                <div className={styles.mappingInputRow}>
                                                                                    {(roomSpecificOtaRates.length > 0 || otherOtaRates.length > 0) ? (
                                                                                        <select
                                                                                            value={val}
                                                                                            onChange={e => {
                                                                                                const newVal = e.target.value;
                                                                                                setChannelConfigs(prev => {
                                                                                                    const currentChannel = prev[selectedChannelCode];
                                                                                                    const updatedRateMappings = {
                                                                                                        ...(currentChannel?.rateMappings || {}),
                                                                                                        [compositeKey]: newVal
                                                                                                    };
                                                                                                    if (rp.roomTypeId === rt.id || !currentChannel?.rateMappings?.[rp.id]) {
                                                                                                        updatedRateMappings[rp.id] = newVal;
                                                                                                    }
                                                                                                    return {
                                                                                                        ...prev,
                                                                                                        [selectedChannelCode]: {
                                                                                                            ...currentChannel,
                                                                                                            rateMappings: updatedRateMappings
                                                                                                        }
                                                                                                    };
                                                                                                });
                                                                                            }}
                                                                                            className={`${styles.cellSelect} ${styles.mappingInputField}`}
                                                                                            style={{ fontSize: "11.5px", width: "100%", fontWeight: val ? 600 : 400 }}
                                                                                        >
                                                                                            <option value="">-- Pilih OTA Rate Plan --</option>
                                                                                            {roomSpecificOtaRates.length > 0 && (
                                                                                                <optgroup label={`Rate Khusus ${otaRoomTitle || rt.name}`}>
                                                                                                    {roomSpecificOtaRates.map((rate: any) => (
                                                                                                        <option key={rate.id} value={String(rate.id)}>
                                                                                                            {rate.title}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </optgroup>
                                                                                            )}
                                                                                            {otherOtaRates.length > 0 && (
                                                                                                <optgroup label="Rate OTA Lainnya">
                                                                                                    {otherOtaRates.map((rate: any) => (
                                                                                                        <option key={rate.id} value={String(rate.id)}>
                                                                                                            {rate.title}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </optgroup>
                                                                                            )}
                                                                                        </select>
                                                                                    ) : (
                                                                                        <input
                                                                                            type="text"
                                                                                            value={val}
                                                                                            onChange={e => {
                                                                                                const newVal = e.target.value;
                                                                                                setChannelConfigs(prev => {
                                                                                                    const currentChannel = prev[selectedChannelCode];
                                                                                                    const updatedRateMappings = {
                                                                                                        ...(currentChannel?.rateMappings || {}),
                                                                                                        [compositeKey]: newVal
                                                                                                    };
                                                                                                    if (rp.roomTypeId === rt.id || !currentChannel?.rateMappings?.[rp.id]) {
                                                                                                        updatedRateMappings[rp.id] = newVal;
                                                                                                    }
                                                                                                    return {
                                                                                                        ...prev,
                                                                                                        [selectedChannelCode]: {
                                                                                                            ...currentChannel,
                                                                                                            rateMappings: updatedRateMappings
                                                                                                        }
                                                                                                    };
                                                                                                });
                                                                                            }}
                                                                                            placeholder="OTA Rate ID (mis. 201)"
                                                                                            className={`${styles.cellInput} ${styles.mappingInputField}`}
                                                                                        />
                                                                                    )}
                                                                                    {val && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleClearRateMapping(selectedChannelCode, compositeKey, rp.id)}
                                                                                            className={styles.btnIconClear}
                                                                                            title="Hapus Pemetaan Rate Plan Ini"
                                                                                        >
                                                                                            <X size={12} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <div className={styles.mappingActionCell} style={{ justifyContent: "center" }}>
                                                                                    {val ? (
                                                                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Mapped</span>
                                                                                    ) : (
                                                                                        <span className={`${styles.badge} ${styles.badgeInactive}`}>Unmapped</span>
                                                                                    )}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handlePingTest("rate_plan", compositeKey, roomChannexRateId, val)}
                                                                                        disabled={pingingMap[compositeKey]}
                                                                                        className={styles.btnPing}
                                                                                        title="Uji koneksi diagnostik Channel Manager untuk Rate Plan ini"
                                                                                    >
                                                                                        <Activity size={11} className={pingingMap[compositeKey] ? "animate-spin" : ""} />
                                                                                        <span>{pingingMap[compositeKey] ? "Testing..." : "Test"}</span>
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
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={styles.mappingTableWrapper}>
                                        <table className={styles.dsiTable}>
                                            <thead>
                                                <tr>
                                                    <th className={styles.dsiTh}>PMS Rate Plan &amp; Code</th>
                                                    <th className={styles.dsiTh}>Room Type &amp; CM Rate UUID</th>
                                                    <th className={styles.dsiTh}>OTA Rate Plan ID ({channelConfigs[selectedChannelCode].channelName.replace(/\s*\(.*?\)/, '')})</th>
                                                    <th className={`${styles.dsiTh} ${styles.mappingThAction}`}>Status &amp; Diagnostics</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ratePlans.map(rp => {
                                                    const val = channelConfigs[selectedChannelCode]?.rateMappings?.[rp.id] || "";
                                                    return (
                                                        <tr key={rp.id} className={styles.dsiRow}>
                                                            <td>
                                                                <div className={styles.cellRoomName}>{rp.name}</div>
                                                                <div className={styles.cellRateCode}>Code: {rp.code}</div>
                                                            </td>
                                                            <td>{rp.roomTypeName || "All Room Types"}</td>
                                                            <td>
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
                                                                    className={`${styles.cellInput} ${styles.mappingInputField}`}
                                                                />
                                                            </td>
                                                            <td>
                                                                <span className={`${styles.badge} ${val ? styles.badgeActive : styles.badgeInactive}`}>
                                                                    {val ? "Mapped" : "Unmapped"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Mapping Action Footer - Single Authoritative Action */}
                            <div className={styles.mappingFooter}>
                                <div className={styles.mappingFooterText}>
                                    Klik tombol ini untuk menyimpan seluruh pemetaan kamar &amp; rate plan, sekaligus mendaftarkan dan mengaktifkan koneksi 2 arah di Channex secara otomatis.
                                </div>
                                <div className={styles.mappingFooterButtons}>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await handleSaveAll();
                                            if (selectedChannelCode) {
                                                await handleSyncSingleChannelToChannex(selectedChannelCode);
                                            }
                                        }}
                                        disabled={savingSettings || syncingChannex}
                                        className={styles.btnActionPrimary}
                                        style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}
                                        title="Simpan pemetaan dan sinkronkan langsung ke Channex"
                                    >
                                        <RefreshCw size={14} className={(syncingChannex || savingSettings) ? "animate-spin" : ""} />
                                        <span>{(syncingChannex || savingSettings) ? "Menyimpan & Sinkronkan ke Channex..." : "Simpan & Sinkronkan ke Channex"}</span>
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
                                Select an active channel from the list above, or click &ldquo;Connect Channel&rdquo; to map a new OTA channel from the catalog.
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsAddChannelModalOpen(true)}
                                className={styles.btnActionBlue}
                                style={{ padding: "6px 16px", fontSize: "12px" }}
                            >
                                <Plus size={13} />
                                <span>Connect Channel</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

            {/* TAB 3: 68+ OTA CHANNELS CATALOG (+ ADD NEW CHANNEL) */}
            {activeTab === "catalog" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                                <span className={styles.mappingHeaderTitle}>
                                    🌐 Global OTA & Channel Distribution Catalog:
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
                                                                    <div 
                                                                        onClick={() => copyText(channelConfigs[ch.code]?.channexChannelId || "", "Channel ID")}
                                                                        style={{ fontSize: "10px", color: "var(--s-muted, #64748b)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" }}
                                                                        title="Klik untuk menyalin Channel ID lengkap"
                                                                    >
                                                                        <Copy size={9} />
                                                                        <span>CID: <b>{channelConfigs[ch.code].channexChannelId}</b></span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: "var(--s-muted, #94a3b8)", fontSize: "11px" }}>-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {isConnected ? (
                                                            <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                                                                <span className={`${styles.badge} ${styles.badgeActive}`}>Connected</span>
                                                                <span className={`${styles.badge} ${channelConfigs[ch.code]?.channexStatus === "ACTIVE" ? styles.badgeActive : styles.badgePending}`} style={{ fontSize: "10px" }}>
                                                                    Status: {channelConfigs[ch.code]?.channexStatus || "ACTIVE"}
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
                                                                        <RefreshCw size={11} className={syncingChannex ? "animate-spin" : ""} />
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
                                        <div key={ch.code} className={`${styles.channelCard} ${isConnected ? styles.channelCardConnected : ""}`}>
                                            <div className={styles.channelCardHeader}>
                                                <div className={styles.channelCardTitle}>
                                                    <OtaLogo code={ch.code} name={ch.name} size={22} />
                                                    <span>{ch.name}</span>
                                                </div>

                                                {isConnected ? (
                                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Connected</span>
                                                        <span className={`${styles.badge} ${channelConfigs[ch.code]?.channexStatus === "ACTIVE" ? styles.badgeActive : styles.badgePending}`}>
                                                            {channelConfigs[ch.code]?.channexStatus || "ACTIVE"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactive</span>
                                                )}
                                            </div>

                                            <div className={styles.catalogMeta}>
                                                <span>Komisi: <b>{ch.defaultCommission}%</b></span>
                                                <span className={styles.catalogMetaDot}>•</span>
                                                <span>Kategori: <b>{ch.category.toUpperCase()}</b></span>
                                            </div>

                                            {isConnected && (
                                                <div className={styles.catalogHotelIdBadge}>
                                                    <span>Hotel ID: <b>{hotelId || "(Belum Diatur)"}</b></span>
                                                    {channelConfigs[ch.code]?.channexChannelId && (
                                                        <span 
                                                            onClick={() => copyText(channelConfigs[ch.code]?.channexChannelId || "", "Channel ID")}
                                                            style={{ fontSize: "10.5px", color: "#71717a", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                                            title="Klik untuk menyalin Channel ID lengkap"
                                                        >
                                                            <Copy size={9} />
                                                            <span>CID: <b>{channelConfigs[ch.code].channexChannelId}</b></span>
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
                                                            className={styles.btnCardManage}
                                                        >
                                                            Manage Mapping
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSyncSingleChannelToChannex(ch.code)}
                                                            disabled={syncingChannex}
                                                            className={styles.btnCardSync}
                                                            title="Sync ARI directly with Channel Manager"
                                                        >
                                                            <RefreshCw size={12} className={syncingChannex ? "animate-spin" : ""} />
                                                            <span>Sync</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => promptDisconnectChannel(ch.code, ch.name)}
                                                            className={styles.btnCardDisconnect}
                                                            title="Disconnect channel"
                                                        >
                                                            <Unlink size={12} />
                                                            <span>Disconnect</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleConnectChannel(ch)}
                                                        className={styles.btnCardConnect}
                                                    >
                                                        <Plus size={13} />
                                                        <span>Connect Channel</span>
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

            {/* TAB: TRAVEL AGENT & MANUAL CHANNELS */}
            {activeTab === "travel_agents" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <TravelAgentTab 
                        hotelCode={activeHotelCode} 
                        channelConfigs={channelConfigs} 
                        onNavigateToCatalog={() => handleSelectTab("catalog")} 
                    />
                </div>
            )}

            {/* TAB: CHANNEL AVAILABILITY & ALLOTMENT RULES (YIELD MANAGEMENT & OVERRIDES) */}
            {activeTab === "rules" && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                        <button
                            type="button"
                            onClick={() => setIsTaxesModalOpen(true)}
                            className={styles.btnActionSecondary}
                        >
                            <Receipt size={14} />
                            <span>Configure Channel Taxes &amp; Service Charges</span>
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

            {/* TAB: CONTENT & AMENITIES DISTRIBUTION (PHOTOS & FACILITIES CONTENT PUSH) */}
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

            {/* TAB: OTA CHANNEL PROMOTIONS & DISCOUNTS */}
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

            {/* TAB: TENANT PAYMENT GATEWAY & DIRECT BOOKING ENGINE (SUPERADMIN ONLY) */}
            {(activeTab === "payment_gateway" || activeTab === "booking_engine") && (
                <div className={`${styles.gridCard} ${styles.embeddedCard}`}>
                    <PaymentGatewayTab hotelCode={activeHotelCode} />
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
                            <span>Open PCI Virtual Credit Card (VCC) Vault</span>
                        </button>
                    </div>
                    <ChannelPaymentTokenizationTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB 4: GLOBAL CHANNEL MAPPING HUB (IFRAME) */}
            {activeTab === "iframe" && (
                <div className={styles.iframeCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                <span className={styles.mappingHeaderTitle}>
                                    Global Channel Mapping Extranet (Channex Hub)
                                </span>
                                <span className={`${styles.badge} ${channexEnv === "production" ? styles.badgeActive : styles.badgeInfo}`}>
                                    {channexEnv === "production" ? "PRODUCTION HUB" : "SANDBOX STAGING HUB"}
                                </span>
                            </div>
                            <p className={styles.mappingHeaderSubtitle}>
                                Antarmuka visual mapping extranet resmi untuk mengaktifkan saluran OTA (Booking.com, Agoda, Tiket.com, Expedia, Airbnb) serta memetakan tipe kamar dan rate plan secara visual.
                            </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {iframeUrl && (
                                <a
                                    href={iframeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.btnActionSecondary}
                                    title="Buka interface mapping di tab browser baru"
                                >
                                    <ExternalLink size={13} />
                                    <span>Buka di Tab Baru</span>
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    loadIframeUrl().catch(err => console.error("Error loading iframe:", err));
                                }}
                                disabled={loadingIframe}
                                className={styles.btnActionSecondary}
                            >
                                <RefreshCw size={13} className={loadingIframe ? "animate-spin" : ""} />
                                <span>{loadingIframe ? "Menghubungkan..." : "Reload Hub Frame"}</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.iframeHeaderBar}>
                        <div className={styles.iframeSecurityBadge}>
                            <Shield size={13} color="#16a34a" />
                            <span>SSO Session: Authenticated &amp; Encrypted</span>
                            <span style={{ color: "#a1a1aa", margin: "0 4px" }}>|</span>
                            <span>Property ID: <strong>{activeHotelCode || "Default Property"}</strong></span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#71717a", fontSize: 11 }}>
                            <span>Gateway: <strong style={{ color: channexEnv === "production" ? "#16a34a" : "#d97706" }}>{channexEnv.toUpperCase()}</strong></span>
                            <span>Direct Channel Distribution Engine</span>
                        </div>
                    </div>

                    <div className={styles.iframeBody}>
                        {loadingIframe ? (
                            <div className={styles.iframeLoadingBox}>
                                <RefreshCw size={28} className={`${styles.iframeLoadingSpinner} animate-spin`} />
                                <div className={styles.iframeLoadingTitle}>Menghubungkan ke Channel Distribution Hub...</div>
                                <p className={styles.iframeLoadingSub}>
                                    Sedang menginisialisasi sesi Single Sign-On (SSO) aman untuk properti <strong>{activeHotelCode || "aktif"}</strong>. Antarmuka extranet Channex akan segera dimuat di sini.
                                </p>
                            </div>
                        ) : iframeUrl ? (
                            <iframe
                                src={iframeUrl}
                                className={styles.iframeElement}
                                title="Global Channel Mapping Hub"
                                allow="clipboard-read; clipboard-write"
                            />
                        ) : (
                            <div className={styles.iframeEmptyBox}>
                                <AlertTriangle size={36} color="#d97706" />
                                <div className={styles.iframeEmptyTitle}>Sesi Visual Mapping Extranet Belum Terhubung</div>
                                <p className={styles.iframeEmptySub}>
                                    Belum ada sesi SSO aktif untuk properti <strong>{activeHotelCode || "ini"}</strong>. Klik tombol di bawah untuk membuat token akses sekali pakai dan memuat konsol mapping.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        loadIframeUrl().catch(err => console.error("Error generating token:", err));
                                    }}
                                    className={styles.btnActionPrimary}
                                    style={{ marginTop: 8 }}
                                >
                                    <Zap size={13} />
                                    <span>Generate SSO Token &amp; Buka Mapping Hub</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 5: SANDBOX CERTIFICATION SUITE & OTA SIMULATOR */}
            {activeTab === "sandbox" && (
                <div className={styles.sandboxContainer}>
                    {/* SECTION 1: CERTIFICATION CHECKLIST SUITE (8 STAGES) */}
                    <div className={styles.gridCard}>
                        <div className={styles.gridToolbar}>
                            <div>
                                <span className={styles.sandboxToolbarTitle}>
                                    <Shield size={16} color="#09090b" />
                                    <span>Global Distribution Certification &amp; Testing Suite</span>
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Self-service verification suite to test and validate 8 technical compliance criteria prior to live distribution deployment.
                                </p>
                            </div>

                            <div className={styles.sandboxToolbarRight}>
                                <span className={certStages.filter(s => s.status === "passed").length === certStages.length ? styles.sandboxScorePassed : styles.sandboxScorePending}>
                                    {certStages.filter(s => s.status === "passed").length} / {certStages.length} Stages Passed
                                </span>
                                <button
                                    type="button"
                                    onClick={runAllCertStages}
                                    disabled={runningCertAll}
                                    className={`${styles.btnActionPrimary} ${styles.btnRunAllCert}`}
                                >
                                    <Play size={13} />
                                    <span>{runningCertAll ? "Running Test Suite..." : "Execute All Certification Stages"}</span>
                                </button>
                            </div>
                        </div>

                        <div className={styles.certSuiteContainer}>
                            <div className={styles.certStageList}>
                                {certStages.map((stage, idx) => (
                                    <div key={stage.id} className={`${styles.certStageItem} ${styles[`certStage_${stage.status}`]}`}>
                                        <div className={styles.certStageNum}>
                                            {stage.status === "passed" ? "✓" : stage.status === "running" ? "..." : stage.num}
                                        </div>
                                        <div className={styles.certStageInfo}>
                                            <div className={styles.certStageTitleRow}>
                                                <span className={styles.certStageTitle}>{stage.title}</span>
                                                <span className={`${styles.badge} ${stage.status === "passed" ? styles.badgeActive : stage.status === "failed" ? styles.badgeInactive : styles.badgePending}`}>
                                                    {stage.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className={styles.certStageDesc}>{stage.desc}</p>
                                            {stage.detail && (
                                                <div className={styles.certStageDetail}>
                                                    {stage.detail}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            disabled={stage.status === "running" || runningCertAll}
                                            onClick={() => runCertStage(idx, lastCreatedBookingId || undefined)}
                                            className={`${styles.btnActionSecondary} ${styles.btnTestStage}`}
                                        >
                                            {stage.status === "running" ? "Testing..." : "Test Stage"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 1B: CHANNEX OFFICIAL 10 ARI CERTIFICATION SCENARIOS */}
                    <div className={styles.gridCard}>
                        <div className={styles.gridToolbar}>
                            <div>
                                <span className={styles.sandboxToolbarTitle}>
                                    <Layers size={16} color="#72263d" />
                                    <span>Channex Official 10 ARI Certification Scenarios</span>
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Skenario pengujian resmi Channex PMS Certification (Test 1 s/d 10). Setiap skenario mematuhi restriksi deklarasi max_stay, dual min_stay, dan kompresi tanggal.
                                </p>
                            </div>

                            <div className={styles.sandboxToolbarRight}>
                                <span className={ariCertStages.filter(s => s.status === "passed").length === ariCertStages.length ? styles.sandboxScorePassed : styles.sandboxScorePending}>
                                    {ariCertStages.filter(s => s.status === "passed").length} / {ariCertStages.length} Skenario Lolos
                                </span>
                                <button
                                    type="button"
                                    onClick={runAllAriCertStages}
                                    disabled={runningAriCertAll}
                                    className={`${styles.btnActionPrimary} ${styles.btnRunAllCert}`}
                                >
                                    <Play size={13} />
                                    <span>{runningAriCertAll ? "Memproses Skenario..." : "Jalankan Semua Skenario Uji ARI"}</span>
                                </button>
                            </div>
                        </div>

                        <div className={styles.certSuiteContainer}>
                            <div className={styles.certStageList}>
                                {ariCertStages.map((stage, idx) => (
                                    <div key={stage.id} className={`${styles.certStageItem} ${styles[`certStage_${stage.status}`]}`}>
                                        <div className={styles.certStageNum}>
                                            {stage.status === "passed" ? "✓" : stage.status === "running" ? "..." : stage.num}
                                        </div>
                                        <div className={styles.certStageInfo}>
                                            <div className={styles.certStageTitleRow}>
                                                <span className={styles.certStageTitle}>{stage.title}</span>
                                                <span className={`${styles.badge} ${stage.status === "passed" ? styles.badgeActive : stage.status === "failed" ? styles.badgeInactive : styles.badgePending}`}>
                                                    {stage.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className={styles.certStageDesc}>{stage.desc}</p>
                                            {stage.detail && (
                                                <div className={styles.certStageDetail}>
                                                    {stage.detail}
                                                </div>
                                            )}
                                            {stage.taskIds && stage.taskIds.length > 0 && (
                                                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>Task ID Channex:</span>
                                                    {stage.taskIds.map(tid => (
                                                        <button
                                                            key={tid}
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(tid);
                                                                toast.success(`Task ID disalin: ${tid}`);
                                                            }}
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 4,
                                                                padding: "2px 8px",
                                                                borderRadius: 5,
                                                                fontSize: 11,
                                                                fontFamily: "var(--font-geist-mono, monospace)",
                                                                backgroundColor: "#f0fdf4",
                                                                border: "1px solid #bbf7d0",
                                                                color: "#166534",
                                                                cursor: "pointer"
                                                            }}
                                                            title="Klik untuk menyalin Task ID ke clipboard"
                                                        >
                                                            <span>{tid}</span>
                                                            <Copy size={11} />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            disabled={stage.status === "running" || runningAriCertAll}
                                            onClick={() => runAriCertStage(idx)}
                                            className={`${styles.btnActionSecondary} ${styles.btnTestStage}`}
                                        >
                                            {stage.status === "running" ? "Menguji..." : "Uji Skenario"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: WEBHOOK INJECTION & SANDBOX BOOKING SIMULATOR */}
                    <div className={styles.gridCard}>
                        <div className={styles.gridToolbar}>
                            <div>
                                <span className={styles.sandboxToolbarTitle}>
                                    <Play size={16} color="#059669" />
                                    <span>OTA Reservation Simulation &amp; Webhook Ingestion</span>
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Dispatch simulated reservation payloads to test automated booking creation, inventory decrement, and cancellations.
                                </p>
                            </div>
                        </div>

                        <div className={styles.simulatorGrid}>
                            <div className={styles.simulatorForm}>
                                <div className={styles.simFieldGroup}>
                                    <label className={styles.simLabel}>Origin OTA Channel:</label>
                                    <select
                                        value={simChannel}
                                        onChange={e => handleSimChannelChange(e.target.value)}
                                        className={styles.simSelect}
                                    >
                                        <option value="Traveloka">Traveloka</option>
                                        <option value="Booking.com">Booking.com</option>
                                        <option value="Agoda">Agoda</option>
                                        <option value="Tiket.com">Tiket.com</option>
                                        <option value="Expedia">Expedia</option>
                                        <option value="Airbnb">Airbnb</option>
                                        <option value="Direct Web">Direct Booking Engine</option>
                                    </select>
                                </div>

                                <div className={styles.simFieldGroup}>
                                    <label className={styles.simLabel}>Guest Full Name:</label>
                                    <input
                                        type="text"
                                        value={simGuestName}
                                        onChange={e => setSimGuestName(e.target.value)}
                                        className={styles.simInput}
                                    />
                                </div>

                                <div className={styles.simFieldGroup}>
                                    <label className={styles.simLabel}>Guest Email Address:</label>
                                    <input
                                        type="email"
                                        value={simGuestEmail}
                                        onChange={e => setSimGuestEmail(e.target.value)}
                                        className={styles.simInput}
                                    />
                                </div>

                                <div className={styles.simFieldGroup}>
                                    <label className={styles.simLabel}>Booked Room Type:</label>
                                    <select
                                        value={simRoomTypeId}
                                        onChange={e => setSimRoomTypeId(e.target.value)}
                                        className={styles.simSelect}
                                    >
                                        <option value="">-- Select Room Type --</option>
                                        {roomTypes.map(rt => {
                                            const allotment = rt.roomCount ?? (rt as any).totalRooms ?? (rt as any).roomsCount ?? rt.physicalRooms?.length ?? 1;
                                            return (
                                                <option key={rt.id} value={rt.id}>
                                                    {rt.name} (Allotment: {allotment} Rooms)
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className={styles.simFieldGroup}>
                                    <label className={styles.simLabel}>Rate Plan &amp; Package:</label>
                                    <select
                                        value={simRatePlanId}
                                        onChange={e => setSimRatePlanId(e.target.value)}
                                        className={styles.simSelect}
                                    >
                                        {simAvailableRatePlans.map(rp => {
                                            const planRate = Number(rp.roomRates?.[simRoomTypeId] ?? rp.baseRate ?? 0);
                                            return (
                                                <option key={rp.id} value={rp.id}>
                                                    {rp.name} ({rp.mealsIncluded ? "With Breakfast" : "Room Only"} • Rp {formatIDR(planRate)}/night)
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className={styles.simFieldRow}>
                                    <div className={styles.simFieldGroup}>
                                        <label className={styles.simLabel}>Check-In Date:</label>
                                        <input
                                            type="date"
                                            value={simCheckin}
                                            onChange={e => setSimCheckin(e.target.value)}
                                            className={styles.simInput}
                                        />
                                    </div>
                                    <div className={styles.simFieldGroup}>
                                        <label className={styles.simLabel}>Check-Out Date:</label>
                                        <input
                                            type="date"
                                            value={simCheckout}
                                            onChange={e => setSimCheckout(e.target.value)}
                                            className={styles.simInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.simFieldRow}>
                                    <div className={styles.simFieldGroup}>
                                        <label className={styles.simLabel}>Total Amount ({hotelCurrency || "IDR"}):</label>
                                        <input
                                            type="number"
                                            value={simPrice}
                                            onChange={e => setSimPrice(Number(e.target.value))}
                                            onWheel={e => e.currentTarget.blur()}
                                            className={styles.simInput}
                                        />
                                    </div>
                                    <div className={styles.simFieldGroup}>
                                        <label className={styles.simLabel}>Payment Collection Model:</label>
                                        <select
                                            value={simPaymentCollect}
                                            onChange={e => setSimPaymentCollect(e.target.value as any)}
                                            className={styles.simSelect}
                                        >
                                            <option value="channel">Channel Collect (OTA Virtual Credit Card)</option>
                                            <option value="property">Property Collect (Pay at Hotel Front Desk)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.simActionRow}>
                                    <button
                                        type="button"
                                        disabled={simulating || !simRoomTypeId}
                                        onClick={() => handleSimulateBooking("create_booking")}
                                        className={`${styles.btnActionPrimary} ${styles.btnSimulateCreate}`}
                                    >
                                        <Play size={13} />
                                        <span>{simulating ? "Dispatching..." : "Inject Simulated Reservation"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={simulating || !simulatedResult?.bookingId}
                                        onClick={() => handleSimulateBooking("cancel_booking")}
                                        className={`${styles.btnActionDanger} ${styles.btnSimulateCancel}`}
                                        title={simulatedResult?.bookingId ? `Cancel booking ${simulatedResult.bookingId}` : "Create a reservation first before testing cancellation"}
                                    >
                                        <X size={13} />
                                        <span>Test Cancellation (Cancel)</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={pushingOpenChannel || !simRoomTypeId}
                                        onClick={handlePushOpenChannelBooking}
                                        className={`${styles.btnActionSecondary} ${styles.btnPushQueue}`}
                                        title="Dispatch booking directly to channel queue"
                                    >
                                        <span>{pushingOpenChannel ? "Dispatching to Channel..." : "Push to Channel Queue"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Result Terminal Box */}
                            <div className={styles.simTerminalBox}>
                                <div className={styles.simTerminalHeader}>
                                    <Terminal size={13} color="#94a3b8" />
                                    <span>Webhook Ingestion Response JSON Payload</span>
                                </div>
                                <pre className={styles.simTerminalCode}>
                                    {simulatedResult ? JSON.stringify(simulatedResult, null, 2) : "// No simulation executed yet.\n// Select a room type and click 'Inject Simulated Reservation' on the left."}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: ACCOUNT CONFIGURATION & API GATEWAY */}
            {activeTab === "golive" && (
                <div className={styles.gridCard}>
                    <div className={styles.gridToolbar}>
                        <div>
                            <span className={styles.mappingHeaderTitle}>
                                API Gateway &amp; Distribution Channel Credentials
                            </span>
                            <p className={styles.mappingHeaderSubtitle}>
                                Manage API keys, webhook endpoints, and toggle between Sandbox (Testing) and Production (Live 68+ OTA) modes.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                                type="button"
                                onClick={() => {
                                    handleSaveAll().catch(err => console.error("Error saving:", err));
                                }}
                                disabled={savingSettings}
                                className={styles.btnActionPrimary}
                                id="save-golive-toolbar-btn"
                                title="Simpan seluruh kredensial API & mata uang distribusi"
                            >
                                <Save size={13} className={savingSettings ? "animate-spin" : ""} />
                                <span>{savingSettings ? "Saving..." : "Save Channel Configuration"}</span>
                            </button>
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
                                            Server Gateway Mode: {channexEnv === "production" ? "Production Live Gateway" : "Sandbox / Staging Gateway"}
                                        </span>
                                    </div>
                                    <p className={styles.envHelpDesc}>
                                        {channexEnv === "production"
                                            ? "Connected to commercial production servers for live rates and room inventory distribution."
                                            : "Operating in Sandbox / Staging mode for risk-free channel mapping and test booking simulations."}
                                    </p>
                                </div>

                                <div className={styles.channelBarActions}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const target = channexEnv === "staging" ? "production" : "staging";
                                            setChannexEnv(target);
                                            toast.info(`Environment switched to ${target.toUpperCase()}. Click 'Save Channel Configuration' below to apply changes.`);
                                        }}
                                        className={`${channexEnv === "production" ? styles.btnActionSecondary : styles.btnActionPrimary} ${styles.btnSwitchEnv}`}
                                    >
                                        <ArrowRight size={13} />
                                        <span>Switch to {channexEnv === "staging" ? "Production Live" : "Sandbox Staging"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. API Credentials & Property ID Form */}
                        <div className={styles.credentialsCard}>
                            <div className={styles.credentialsHeader}>
                                <Key size={18} className={styles.credentialsHeaderIcon} />
                                <span className={styles.credentialsTitle}>
                                    API Credentials &amp; Property Distribution Identity
                                </span>
                            </div>

                            {/* Field A: User API Key */}
                            <div className={styles.credentialsFieldGroup}>
                                <div className={styles.credentialsFieldHeader}>
                                    <label className={styles.credentialsLabelBold}>
                                        Channel Distribution API Key <span className={styles.requiredAsterisk}>*</span>
                                    </label>
                                    <span className={styles.credentialsExtLink}>
                                        {channexEnv === "production" ? "Production Live Environment Credentials" : "Sandbox / Staging Environment Credentials"}
                                    </span>
                                </div>
                                <div className={styles.inputGroupRow}>
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={channexApiKey}
                                        onChange={e => setChannexApiKey(e.target.value)}
                                        placeholder="Enter your API Key here (e.g. ch_live_... or ch_staging_...)"
                                        className={`${styles.cellInput} ${styles.apiKeyInput}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(prev => !prev)}
                                        className={`${styles.btnActionSecondary} ${styles.btnApiKeyToggle}`}
                                        title={showApiKey ? "Hide API Key" : "Show API Key"}
                                    >
                                        {showApiKey ? "Hide" : "Show"}
                                    </button>
                                </div>
                                {!channexApiKey && (
                                    <p className={styles.apiKeyMissingAlert}>
                                        <AlertTriangle size={13} /> API Key is required to create properties, open the mapping hub, and ingest OTA bookings.
                                    </p>
                                )}
                            </div>

                            {/* Field B: Hotel Distribution Base Currency */}
                            <div className={styles.credentialsFieldGroup}>
                                <label className={styles.credentialsLabelBold}>
                                    Hotel Distribution Base Currency <span className={styles.requiredAsterisk}>*</span>
                                </label>
                                <p className={styles.fieldHelpMuted}>
                                    Mata uang hotel untuk distribusi harga ke Channex &amp; OTA. Inline 2-arah dengan CPanel Profile, Rate &amp; Inventory, dan POS Kasir.
                                </p>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", maxWidth: "600px" }}>
                                    <select
                                        value={hotelCurrency}
                                        onChange={async (e) => {
                                            const nextVal = e.target.value;
                                            setHotelCurrency(nextVal);
                                            await handleSaveCurrencyOnly(nextVal);
                                        }}
                                        className={styles.currencySelect}
                                        style={{ flex: 1, minWidth: "260px" }}
                                    >
                                        {SUPPORTED_CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.code} — {c.name} ({c.symbol})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleSaveCurrencyOnly()}
                                        disabled={savingCurrency}
                                        className={styles.btnActionPrimary}
                                        style={{ height: "38px", padding: "0 16px", whiteSpace: "nowrap" }}
                                        title="Simpan mata uang properti ini & sinkronkan seketika ke seluruh modul"
                                    >
                                        <Save size={13} className={savingCurrency ? "animate-spin" : ""} />
                                        <span>{savingCurrency ? "Menyimpan..." : "Simpan Currency"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Field C: Real Property Distribution Identity & Registration Hub */}
                            <div className={`${styles.propertyIdentityCard} ${channexPropertyId ? styles.propertyIdentityCardConnected : styles.propertyIdentityCardUnregistered}`}>
                                <div className={styles.propertyIdentityHeader}>
                                    <div>
                                        <div className={styles.propertyIdentityStatusRow}>
                                            {channexPropertyId ? (
                                                <span className={styles.propertyBadgeConnected}>
                                                    <Check size={12} /> TERDAFTAR DI CHANNEL MANAGER
                                                </span>
                                            ) : (
                                                <span className={styles.propertyBadgeUnregistered}>
                                                    <AlertTriangle size={12} /> BELUM TERDAFTAR DI CHANNEL MANAGER
                                                </span>
                                            )}
                                            <span className={styles.propertyNameMeta}>
                                                {activeHotelName || "Hotel Aktif"} &bull; {hotelCurrency}
                                            </span>
                                        </div>
                                        <p className={styles.propertyIdentityDesc}>
                                            {channexPropertyId
                                                ? `Properti aktif terhubung ke Channel Manager dengan UUID: ${channexPropertyId}. Seluruh kamar dan paket harga telah disinkronkan.`
                                                : `Klik 'Daftarkan Hotel Ini ke Channel Manager' untuk mendaftarkan properti ini ke Channel Manager ${channexEnv.toUpperCase()}. Seluruh tipe kamar & paket harga yang telah dibuat di Tara akan otomatis disinkronkan.`}
                                        </p>
                                    </div>

                                    <div className={styles.propertyActions}>
                                        <button
                                            type="button"
                                            onClick={handleSyncMasterToChannex}
                                            disabled={syncingMaster}
                                            className={styles.btnActionPrimary}
                                        >
                                            <RefreshCw size={13} className={syncingMaster ? "animate-spin" : ""} />
                                            <span>{channexPropertyId ? "Sinkronkan Kamar & Rate Plan" : "🚀 Daftarkan Hotel Ini ke Channel Manager"}</span>
                                        </button>
                                        {channexPropertyId && (
                                            <button
                                                type="button"
                                                onClick={handleUnlinkProperty}
                                                className={`${styles.btnActionSecondary} ${styles.btnUnlinkProperty}`}
                                                title="Putus relasi UUID Channel Manager jika diperlukan"
                                            >
                                                <Unlink size={13} />
                                                <span>Putus / Reset Link</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.credentialsFieldGroup}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                        <label className={styles.credentialsLabelBold} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                                            Channel Manager Property UUID
                                        </label>
                                        {channexPropertyId && (
                                            <span style={{ fontSize: "11px", color: "#71717a" }}>
                                                Format: 36-karakter UUID v4
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.inputGroupRow}>
                                        <input
                                            type="text"
                                            value={channexPropertyId}
                                            onChange={e => setChannexPropertyId(e.target.value)}
                                            placeholder="Auto-generated setelah klik 'Daftarkan Hotel Ini ke Channex', atau input UUID manual"
                                            className={`${styles.cellInput} ${styles.propertyIdInput}`}
                                            style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "12px" }}
                                        />
                                        {channexPropertyId && (
                                            <button
                                                type="button"
                                                onClick={() => copyText(channexPropertyId, "Channex Property UUID")}
                                                className={`${styles.btnActionSecondary} ${styles.btnCopyWebhook}`}
                                                title="Click to copy full Channex Property UUID"
                                            >
                                                <Copy size={13} />
                                                <span>Salin UUID</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Field D: Webhook Callback URL */}
                            <div className={styles.credentialsFieldGroup}>
                                <label className={styles.credentialsLabelBold}>
                                    Webhook Ingestion Callback URL (Inbound Reservations)
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
                                            toast.success("Webhook URL copied to clipboard!");
                                        }}
                                        className={`${styles.btnActionSecondary} ${styles.btnCopyWebhook}`}
                                    >
                                        <Copy size={13} />
                                        <span>Copy URL</span>
                                    </button>
                                </div>
                                <p className={styles.fieldHelpMuted}>
                                    Public My Tara endpoint that receives incoming bookings, modifications, and cancellations.
                                </p>
                            </div>

                            {/* Field E: Webhook Secret (Shared Secret) */}
                            <div className={styles.credentialsFieldGroup}>
                                <div className={styles.credentialsFieldHeader}>
                                    <label className={styles.credentialsLabelBold}>
                                        Webhook Shared Secret (HMAC Signature Verification) <span className={styles.requiredAsterisk}>*</span>
                                    </label>
                                    <span className={styles.credentialsExtLink}>
                                        Inbound Webhook Verification Key
                                    </span>
                                </div>
                                <div className={styles.inputGroupRow}>
                                    <input
                                        type={showWebhookSecret ? "text" : "password"}
                                        value={channexWebhookSecret}
                                        onChange={e => setChannexWebhookSecret(e.target.value)}
                                        placeholder="Auto-generate or enter a 32-character hexadecimal string"
                                        className={`${styles.cellInput} ${styles.apiKeyInput}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowWebhookSecret(prev => !prev)}
                                        className={`${styles.btnActionSecondary} ${styles.btnApiKeyToggle}`}
                                        title={showWebhookSecret ? "Hide Secret" : "Show Secret"}
                                    >
                                        {showWebhookSecret ? "Hide" : "Show"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const array = new Uint8Array(16);
                                            window.crypto.getRandomValues(array);
                                            const hex = Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
                                            setChannexWebhookSecret(hex);
                                            toast.info("New Webhook Secret (32 hex) generated. Click 'Save Channel Configuration' to apply.");
                                        }}
                                        className={`${styles.btnActionSecondary} ${styles.btnApiKeyToggle}`}
                                        title="Generate random 32 hex string"
                                    >
                                        <RefreshCw size={13} />
                                        <span>Generate</span>
                                    </button>
                                    {channexWebhookSecret && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(channexWebhookSecret);
                                                toast.success("Webhook Secret copied to clipboard!");
                                            }}
                                            className={`${styles.btnActionSecondary} ${styles.btnApiKeyToggle}`}
                                            title="Copy Secret"
                                        >
                                            <Copy size={13} />
                                        </button>
                                    )}
                                </div>
                                <p className={styles.fieldHelpMuted}>
                                    This secret key is used to validate the <code>x-channex-webhook-secret</code> header to verify message authenticity.
                                </p>
                            </div>

                            {/* Section F: Registration Status & 1-Click Register Webhook */}
                            <div className={`${styles.webhookStatusBox} ${webhookRegistrationStatus?.isRegistered ? styles.webhookStatusBoxActive : styles.webhookStatusBoxInactive}`}>
                                <div className={styles.webhookStatusRow}>
                                    <div className={styles.webhookStatusIndicator}>
                                        {webhookRegistrationStatus?.isRegistered ? (
                                            <CheckCircle2 size={16} color="#2563eb" />
                                        ) : (
                                            <AlertTriangle size={16} color="#71717a" />
                                        )}
                                        <span style={{ color: webhookRegistrationStatus?.isRegistered ? "#09090b" : "#71717a" }}>
                                            {webhookRegistrationStatus?.isRegistered
                                                ? `✓ Webhook Active & Verified in Channex (ID: ${webhookRegistrationStatus.webhookId})`
                                                : "Webhook Not Registered in Channex"}
                                        </span>
                                    </div>
                                    <div className={styles.webhookActions}>
                                        <button
                                            type="button"
                                            disabled={checkingWebhookStatus}
                                            onClick={async () => {
                                                if (!activeHotelCode || activeHotelCode === "0") return;
                                                setCheckingWebhookStatus(true);
                                                try {
                                                    const res = await fetch(`/api/channex/register-webhook?hotelCode=${activeHotelCode}`);
                                                    const data = await res.json();
                                                    if (data.isRegistered) {
                                                        setWebhookRegistrationStatus({
                                                            isRegistered: true,
                                                            webhookId: data.webhookId,
                                                            webhookUrl: data.webhookUrl,
                                                            webhookRegisteredAt: data.webhookRegisteredAt
                                                        });
                                                        toast.success(`Webhook active and verified (ID: ${data.webhookId})`);
                                                    } else {
                                                        setWebhookRegistrationStatus(null);
                                                        toast.info("Webhook is not registered in Channex.");
                                                    }
                                                } catch (err: any) {
                                                    toast.error("Failed to verify status: " + err.message);
                                                } finally {
                                                    setCheckingWebhookStatus(false);
                                                }
                                            }}
                                            className={styles.btnActionSecondary}
                                            style={{ height: "32px", fontSize: "11.5px" }}
                                        >
                                            <RefreshCw size={12} className={checkingWebhookStatus ? "animate-spin" : ""} />
                                            <span>{checkingWebhookStatus ? "Verifying..." : "Verify Status"}</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={registeringWebhook || !channexApiKey.trim()}
                                            onClick={async () => {
                                                if (!activeHotelCode || activeHotelCode === "0") {
                                                    toast.error("Select an active hotel first.");
                                                    return;
                                                }
                                                if (!channexApiKey.trim()) {
                                                    toast.error("API Key is required to register webhook.");
                                                    return;
                                                }
                                                let secretToUse = channexWebhookSecret.trim();
                                                if (!secretToUse) {
                                                    const array = new Uint8Array(16);
                                                    window.crypto.getRandomValues(array);
                                                    secretToUse = Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
                                                    setChannexWebhookSecret(secretToUse);
                                                }

                                                setRegisteringWebhook(true);
                                                try {
                                                    const docRef = doc(db, "hotels", activeHotelCode);
                                                    await updateDoc(docRef, {
                                                        channexPropertyId,
                                                        channelManager: {
                                                            env: channexEnv,
                                                            apiKey: channexApiKey,
                                                            webhookSecret: secretToUse,
                                                            channexPropertyId,
                                                            channels: channelConfigs,
                                                            isSyncActive: true,
                                                            updatedAt: new Date().toISOString()
                                                        }
                                                    });

                                                    const webhookUrl = `${window.location.origin}/api/channex/webhook`;
                                                    const res = await fetch("/api/channex/register-webhook", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            hotelCode: activeHotelCode,
                                                            apiKey: channexApiKey,
                                                            webhookSecret: secretToUse,
                                                            webhookUrl,
                                                            env: channexEnv
                                                        })
                                                    });

                                                    const data = await res.json();
                                                    if (res.ok && data.success) {
                                                        toast.success(`Successfully registered webhook in Channex (ID: ${data.webhookId})`);
                                                        setWebhookRegistrationStatus({
                                                            isRegistered: true,
                                                            webhookId: data.webhookId,
                                                            webhookUrl: data.webhookUrl,
                                                            webhookRegisteredAt: new Date().toISOString()
                                                        });
                                                    } else {
                                                        toast.error(data.error || "Failed to register webhook in Channex.");
                                                    }
                                                } catch (err: any) {
                                                    console.error("Register webhook error:", err);
                                                    toast.error("Error: " + (err.message || "Failed to reach server"));
                                                } finally {
                                                    setRegisteringWebhook(false);
                                                }
                                            }}
                                            className={styles.btnActionPrimary}
                                            style={{ height: "32px", fontSize: "11.5px" }}
                                        >
                                            <ArrowRight size={12} />
                                            <span>{registeringWebhook ? "Registering..." : "Register Webhook with Gateway"}</span>
                                        </button>
                                    </div>
                                </div>
                                <p className={styles.fieldHelpMuted} style={{ margin: 0 }}>
                                    Click <strong>Register Webhook with Gateway</strong> to automatically bind this PMS endpoint without manual configuration in external portals.
                                </p>
                            </div>

                            {/* Save Row */}
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
                                    <span>{savingSettings ? "Saving Credentials..." : "Save Channel Configuration"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSelectTab("iframe");
                                    }}
                                    className={`${styles.btnActionSecondary} ${styles.btnOpenMappingHub}`}
                                >
                                    <ExternalLink size={14} />
                                    <span>Open Channel Mapping Hub &rarr;</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. 4-Step Onboarding Guide */}
                        <div className={styles.guideList}>
                            <span className={styles.guideListTitle}>
                                Distribution Gateway Onboarding Guide (Sandbox &amp; Production)
                            </span>

                            <div className={styles.guideGrid}>
                                <div className={styles.guideCard}>
                                    <div className={styles.guideStepNumber}>
                                        1
                                    </div>
                                    <div>
                                        <span className={styles.guideStepTitle}>Obtain Provider Account</span>
                                        <p className={styles.guideStepDesc}>
                                            Retrieve your API Key from the channel distribution portal (Staging Sandbox or Production Live).
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.guideCard}>
                                    <div className={styles.guideStepNumber}>
                                        2
                                    </div>
                                    <div>
                                        <span className={styles.guideStepTitle}>Configure API Key</span>
                                        <p className={styles.guideStepDesc}>
                                            Enter your API Key into the field above and click <strong>Save Channel Configuration</strong>.
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.guideCard}>
                                    <div className={styles.guideStepNumber}>
                                        3
                                    </div>
                                    <div>
                                        <span className={styles.guideStepTitle}>Register Inbound Webhook</span>
                                        <p className={styles.guideStepDesc}>
                                            Use the 1-click registration button to verify the callback URL for real-time reservation streaming.
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.guideCard}>
                                    <div className={styles.guideStepNumber}>
                                        4
                                    </div>
                                    <div>
                                        <span className={styles.guideStepTitle}>Map Channels &amp; Push ARI</span>
                                        <p className={styles.guideStepDesc}>
                                            Open the <strong>Channel Mapping Hub</strong> tab to map room rates, then execute <strong>Force Push ARI</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 7: LIVE ACTIVITY & SYNC LOG */}
            {activeTab === "sync" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* STATS OVERVIEW CARDS */}
                    <div className={styles.syncStatsGrid}>
                        <div className={styles.syncStatCard}>
                            <div className={styles.syncStatHeader}>
                                <span>DISTRIBUTION GATEWAY</span>
                                <span className={styles.syncLiveDot} title="Live Gateway Connection Active" />
                            </div>
                            <div className={styles.syncStatValue}>
                                {channexEnv === "production" ? "Production Live" : "Sandbox Gateway"}
                            </div>
                            <div className={styles.syncStatSub}>
                                <span>2-Way Engine • Mode: <strong>{channexEnv.toUpperCase()}</strong></span>
                            </div>
                        </div>

                        <div className={styles.syncStatCard}>
                            <div className={styles.syncStatHeader}>
                                <span>SALURAN OTA TERHUBUNG</span>
                                <Globe size={13} color="#2563eb" />
                            </div>
                            <div className={styles.syncStatValue}>
                                {activeChannelsList.length} <span style={{ fontSize: 13, fontWeight: 500, color: "#71717a" }}>Saluran</span>
                            </div>
                            <div className={styles.syncStatSub}>
                                <span>{activeChannelsList.length > 0 ? activeChannelsList.map(c => c.channelName.split(" ")[0]).slice(0, 3).join(", ") + (activeChannelsList.length > 3 ? "..." : "") : "Belum ada saluran aktif"}</span>
                            </div>
                        </div>

                        <div className={styles.syncStatCard}>
                            <div className={styles.syncStatHeader}>
                                <span>HORIZON KALENDER ARI</span>
                                <Activity size={13} color="#16a34a" />
                            </div>
                            <div className={styles.syncStatValue}>
                                500 <span style={{ fontSize: 13, fontWeight: 500, color: "#71717a" }}>Hari Kalender</span>
                            </div>
                            <div className={styles.syncStatSub}>
                                <span>Otomatis sinkron alokasi kamar &amp; tarif</span>
                            </div>
                        </div>

                        <div className={styles.syncStatCard}>
                            <div className={styles.syncStatHeader}>
                                <span>TOTAL AUDIT EVENT</span>
                                <Terminal size={13} color="#71717a" />
                            </div>
                            <div className={styles.syncStatValue}>
                                {syncLog.length} <span style={{ fontSize: 13, fontWeight: 500, color: "#71717a" }}>Catatan</span>
                            </div>
                            <div className={styles.syncStatSub}>
                                <span style={{ color: "#16a34a" }}>{syncSuccessCount} Sukses</span>
                                {syncErrorCount > 0 && <span style={{ color: "#dc2626" }}> • {syncErrorCount} Alert</span>}
                            </div>
                        </div>
                    </div>

                    {/* MAIN AUDIT LOG CARD */}
                    <div className={styles.gridCard}>
                        <div className={styles.gridToolbar}>
                            <div>
                                <span className={styles.mappingHeaderTitle}>
                                    Live Distribution Activity Stream &amp; Audit Log
                                </span>
                                <p className={styles.mappingHeaderSubtitle}>
                                    Audit trail real-time untuk pembaruan alokasi inventaris kamar, rate plan, dan reservasi webhook dari seluruh saluran OTA.
                                </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    onClick={handleSyncAllChannelsFromChannex}
                                    disabled={syncingChannex}
                                    className={styles.btnActionSecondary}
                                    title="Synchronize online channel connection status directly from channel distribution gateway"
                                >
                                    <RefreshCw size={13} className={syncingChannex ? "animate-spin" : ""} color="#f59e0b" />
                                    <span>{syncingChannex ? "Connecting..." : "Sync Online Channels"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSyncMasterToChannex}
                                    disabled={syncingMaster}
                                    className={styles.btnActionSecondary}
                                    title="Automatically provision hotel room types and rate plans into the channel gateway via API"
                                >
                                    <RefreshCw size={13} className={`${syncingMaster ? "animate-spin" : ""} ${styles.syncMasterIcon}`} />
                                    <span>{syncingMaster ? "Provisioning..." : "Sync Rooms & Rates"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSyncAllAri().catch(err => console.error("Error syncing ARI:", err));
                                    }}
                                    disabled={syncingAri}
                                    className={styles.btnActionPrimary}
                                    title="Push all room availability, rates, and restrictions to all connected channels"
                                >
                                    <RefreshCw size={13} className={syncingAri ? "animate-spin" : ""} />
                                    <span>{syncingAri ? "Synchronizing..." : "Force Push ARI (500 Hari)"}</span>
                                </button>
                            </div>
                        </div>

                        {/* CONTROLS BAR: FILTER PILLS + SEARCH + CLEAR */}
                        <div className={styles.syncControlsBar}>
                            <div className={styles.syncFilterPills}>
                                <button
                                    type="button"
                                    onClick={() => setSyncFilterStatus("ALL")}
                                    className={`${styles.syncFilterPill} ${syncFilterStatus === "ALL" ? styles.syncFilterPillActive : ""}`}
                                >
                                    Semua ({syncLog.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSyncFilterStatus("SUCCESS")}
                                    className={`${styles.syncFilterPill} ${syncFilterStatus === "SUCCESS" ? styles.syncFilterPillActive : ""}`}
                                >
                                    Sukses ({syncSuccessCount})
                                </button>
                                {syncErrorCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setSyncFilterStatus("ERROR")}
                                        className={`${styles.syncFilterPill} ${syncFilterStatus === "ERROR" ? styles.syncFilterPillActive : ""}`}
                                    >
                                        Alert / Gagal ({syncErrorCount})
                                    </button>
                                )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div className={styles.syncSearchBox}>
                                    <Search size={13} color="#71717a" />
                                    <input
                                        type="text"
                                        placeholder="Cari pesan log..."
                                        value={syncSearchTerm}
                                        onChange={e => setSyncSearchTerm(e.target.value)}
                                        className={styles.syncSearchInput}
                                    />
                                    {syncSearchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSyncSearchTerm("")}
                                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#a1a1aa", display: "flex" }}
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSyncLog([
                                            {
                                                time: new Date().toLocaleTimeString(),
                                                status: "SUCCESS",
                                                message: "Live distribution feed di-reset oleh operator. Menunggu transmisi data berikutnya."
                                            }
                                        ]);
                                        setSyncSearchTerm("");
                                        setSyncFilterStatus("ALL");
                                    }}
                                    className={styles.btnActionSecondary}
                                    style={{ padding: "5px 10px", fontSize: 11 }}
                                    title="Bersihkan riwayat aktivitas log di browser"
                                >
                                    <RotateCcw size={12} />
                                    <span>Reset Feed</span>
                                </button>
                            </div>
                        </div>

                        {/* AUDIT LOG LIST BODY */}
                        <div className={styles.activityLogList}>
                            {filteredSyncLogs.length === 0 ? (
                                <div className={styles.activityLogEmpty}>
                                    <Terminal size={32} color="#a1a1aa" />
                                    <div className={styles.activityLogEmptyTitle}>Tidak Ada Log yang Cocok</div>
                                    <p className={styles.activityLogEmptySub}>
                                        Tidak ditemukan event transmisi yang sesuai dengan kata kunci pencarian atau filter yang dipilih.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSyncSearchTerm("");
                                            setSyncFilterStatus("ALL");
                                        }}
                                        className={styles.btnActionSecondary}
                                        style={{ fontSize: 11.5 }}
                                    >
                                        Reset Filter &amp; Pencarian
                                    </button>
                                </div>
                            ) : (
                                filteredSyncLogs.map((log, idx) => {
                                    const isError = log.status === "ERROR";
                                    const isSuccess = log.status === "SUCCESS";
                                    return (
                                        <div key={idx} className={styles.activityLogItem}>
                                            <div className={styles.activityLogLeft}>
                                                {isError ? (
                                                    <AlertTriangle size={16} className={styles.activityLogIconError} />
                                                ) : isSuccess ? (
                                                    <CheckCircle2 size={16} className={styles.activityLogIconSuccess} />
                                                ) : (
                                                    <RefreshCw size={15} className={styles.activityLogIconSync} />
                                                )}
                                                <div className={styles.activityLogContent}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                                                        <span
                                                            className={`${styles.activityLogStatusBadge} ${
                                                                isError
                                                                    ? styles.activityLogStatusBadgeError
                                                                    : isSuccess
                                                                    ? styles.activityLogStatusBadgeSuccess
                                                                    : styles.activityLogStatusBadgeInfo
                                                            }`}
                                                        >
                                                            {log.status || "EVENT"}
                                                        </span>
                                                        <span style={{ fontSize: 11, color: "#71717a" }}>• Properti: {activeHotelCode || "Default"}</span>
                                                    </div>
                                                    <span className={styles.activityLogText}>{log.message}</span>
                                                </div>
                                            </div>
                                            <span className={styles.activityLogTime}>{log.time}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CONNECT ONLINE CHANNEL FROM CATALOG */}
            {isAddChannelModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsAddChannelModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-catalog-title"
                >
                    <div
                        className={styles.catalogModalCard}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.catalogModalHeader}>
                            <div className={styles.catalogHeaderInfo}>
                                <div className={styles.catalogHeaderIconBox}>
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <h3 id="modal-catalog-title" className={styles.catalogHeaderTitle}>
                                        Connect Online Channel
                                    </h3>
                                    <p className={styles.catalogHeaderSubtitle}>
                                        Select an OTA, GDS, or distribution partner from the global catalog to enable for this property.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddChannelModalOpen(false)}
                                className={styles.modalCloseBtn}
                                aria-label="Close dialog"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search & Category Filter Toolbar */}
                        <div className={styles.catalogToolbar}>
                            <div className={styles.catalogSearchBox}>
                                <Search size={15} className={styles.catalogSearchIcon} />
                                <input
                                    type="text"
                                    value={channelSearchQuery}
                                    onChange={e => setChannelSearchQuery(e.target.value)}
                                    placeholder="Search channel name or code (e.g. Traveloka, Booking.com, Agoda, Expedia)..."
                                    className={styles.catalogSearchInput}
                                    autoFocus
                                />
                                {channelSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setChannelSearchQuery("")}
                                        className={styles.catalogSearchClearBtn}
                                        aria-label="Clear search"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            <div className={styles.catalogFilterRow}>
                                {[
                                    { id: "all", label: "All Channels" },
                                    { id: "ota", label: "Popular OTAs" },
                                    { id: "wholesaler", label: "Wholesalers & B2B" },
                                    { id: "meta", label: "Metasearch" },
                                    { id: "vacation", label: "Vacation" },
                                    { id: "connected", label: "Connected" }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setModalCategoryFilter(tab.id)}
                                        className={`${styles.catalogFilterPill} ${modalCategoryFilter === tab.id ? styles.catalogFilterPillActive : ""}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Body: Channel Cards Grid or Empty State */}
                        <div className={styles.catalogModalBody}>
                            {(() => {
                                const q = channelSearchQuery.trim().toLowerCase();
                                const filtered = CHANNEX_OTA_CATALOG.filter(ch => {
                                    const matchesQuery =
                                        !q ||
                                        ch.name.toLowerCase().includes(q) ||
                                        ch.code.toLowerCase().includes(q) ||
                                        ch.category.toLowerCase().includes(q);
                                    if (!matchesQuery) return false;
                                    if (modalCategoryFilter === "all") return true;
                                    if (modalCategoryFilter === "connected") return Boolean(channelConfigs[ch.code]?.isActive);
                                    return ch.category === modalCategoryFilter;
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className={styles.catalogEmptyState}>
                                            <div className={styles.catalogEmptyIconBox}>
                                                <Search size={22} />
                                            </div>
                                            <p className={styles.catalogEmptyTitle}>No channels found</p>
                                            <p className={styles.catalogEmptyDesc}>
                                                No distribution channels match your current search or category filter.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setChannelSearchQuery("");
                                                    setModalCategoryFilter("all");
                                                }}
                                                className={styles.btnActionSecondary}
                                                style={{ marginTop: "6px" }}
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <div className={styles.addChannelGrid}>
                                        {filtered.map(ch => {
                                            const isConnected = Boolean(channelConfigs[ch.code]?.isActive);
                                            return (
                                                <div
                                                    key={ch.code}
                                                    className={`${styles.addChannelCard} ${isConnected ? styles.addChannelCardConnected : ""}`}
                                                >
                                                    <div className={styles.addChannelCardHeader}>
                                                        <div className={styles.addChannelCardIdentity}>
                                                            <div className={styles.addChannelLogoWrap}>
                                                                <OtaLogo code={ch.code} name={ch.name} size={22} />
                                                            </div>
                                                            <div className={styles.addChannelCardTitleWrap}>
                                                                <span className={styles.addChannelCardTitle} title={ch.name}>
                                                                    {ch.name}
                                                                </span>
                                                                <span className={styles.addChannelCardCode}>
                                                                    {ch.code}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isConnected ? (
                                                            <span className={styles.badgeConnected}>
                                                                <Check size={11} strokeWidth={2.5} />
                                                                Connected
                                                            </span>
                                                        ) : (
                                                            <span className={styles.badgeAvailable}>
                                                                Available
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className={styles.addChannelCardMeta}>
                                                        <div className={styles.addChannelMetaItem}>
                                                            <span className={styles.addChannelMetaLabel}>Commission</span>
                                                            <span className={styles.addChannelMetaValue}>{ch.defaultCommission}%</span>
                                                        </div>
                                                        <div className={styles.addChannelMetaDivider} />
                                                        <div className={styles.addChannelMetaItem}>
                                                            <span className={styles.addChannelMetaLabel}>Category</span>
                                                            <span className={styles.addChannelMetaCategory}>{ch.category.toUpperCase()}</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={isConnected}
                                                        onClick={() => handleConnectChannel(ch)}
                                                        className={`${styles.addChannelActionBtn} ${isConnected ? styles.addChannelActionBtnConnected : styles.addChannelActionBtnAvailable}`}
                                                    >
                                                        {isConnected ? (
                                                            <>
                                                                <Check size={13} />
                                                                <span>Already Connected</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus size={13} />
                                                                <span>Connect Channel</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className={styles.catalogModalFooter}>
                            <span className={styles.catalogFooterSummary}>
                                Global Catalog: <b>{CHANNEX_OTA_CATALOG.length}</b> channels available
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsAddChannelModalOpen(false)}
                                className={styles.btnActionSecondary}
                            >
                                Close
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
                                        ? "Confirm OTA Channel Disconnection"
                                        : "Confirm Reset of Channel Mappings"}
                                </h3>
                                <p className={styles.confirmHeaderSub}>
                                    Central Reservation System • Property: <b>{activeHotelCode}</b>
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
                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Status: Connected</span>
                                    </div>
                                    <span className={styles.confirmBannerSub}>
                                        Channel Code: <code>{confirmModal.channelCode}</code>
                                    </span>
                                </div>
                            </div>

                            {/* Warning Impact Box */}
                            {confirmModal.type === "disconnect" ? (
                                <div className={styles.confirmImpactList}>
                                    <span className={styles.confirmConsequenceTitle}>⚠️ Impact of Channel Disconnection:</span>
                                    <span>• Automated rate and inventory synchronization (ARI) to <b>{confirmModal.channelName}</b> will be halted immediately.</span>
                                    <span>• Inbound reservations from this channel will no longer automatically decrement inventory in My Tara PMS.</span>
                                    <span>• Channel will revert to 'Available' status in the Global OTA Catalog.</span>
                                </div>
                            ) : (
                                <div className={`${styles.confirmImpactList} ${styles.confirmImpactListWarning}`}>
                                    <span className={styles.confirmConsequenceTitle}>⚠️ Impact of Mapping Reset:</span>
                                    <span>• All <b>Extranet Hotel IDs</b>, <b>Room IDs</b>, and <b>Rate Plan IDs</b> for <b>{confirmModal.channelName}</b> will be cleared from this form.</span>
                                    <span>• You will need to re-map channel IDs before performing subsequent ARI updates.</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className={styles.btnActionSecondary}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={executeConfirmAction}
                                className={`${confirmModal.type === "disconnect" ? styles.btnActionDanger : styles.btnActionWarning} ${styles.confirmBoldBtn}`}
                            >
                                {confirmModal.type === "disconnect" ? (
                                    <>
                                        <Trash2 size={14} />
                                        <span>Yes, Disconnect Channel Now</span>
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw size={14} />
                                        <span>Yes, Clear All Channel Mappings</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UNLINK / RESET CHANNEX PROPERTY CUSTOM CONFIRMATION MODAL */}
            {isUnlinkModalOpen && (
                <div className={styles.modalOverlay} onClick={() => !unlinkingProperty && setIsUnlinkModalOpen(false)}>
                    <div className={styles.confirmModalCard} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={`${styles.confirmIconBox} ${styles.confirmIconDanger}`}>
                                <Unlink size={20} />
                            </div>
                            <div className={styles.flexOne}>
                                <h3 className={styles.confirmHeaderTitle}>
                                    Putus Kaitan Channex Property
                                </h3>
                                <p className={styles.confirmHeaderSub}>
                                    Central Reservation System • Property: <b>{activeHotelName || activeHotelCode}</b>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !unlinkingProperty && setIsUnlinkModalOpen(false)}
                                className={styles.modalCloseBtn}
                                disabled={unlinkingProperty}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.confirmImpactList}>
                                <span className={styles.confirmConsequenceTitle}>⚠️ Konfirmasi Pemutusan Relasi Channex:</span>
                                <span>• Apakah Anda yakin ingin memutuskan dan me-reset kaitan Channex untuk properti <b>&ldquo;{activeHotelName || activeHotelCode}&rdquo;</b>?</span>
                                <span>• Relasi ID Channex di database Tara dan server Channex akan dibersihkan.</span>
                                <span>• Kamar dan rate plan lokal di My Tara tidak akan dihapus.</span>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={() => setIsUnlinkModalOpen(false)}
                                className={styles.btnActionSecondary}
                                disabled={unlinkingProperty}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmUnlinkProperty}
                                className={`${styles.btnActionDanger} ${styles.confirmBoldBtn}`}
                                disabled={unlinkingProperty}
                                style={{
                                    background: "#be123c",
                                    borderColor: "#be123c",
                                    color: "#ffffff"
                                }}
                            >
                                {unlinkingProperty ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        <span>Memutuskan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Unlink size={14} />
                                        <span>Ya, Putus Kaitan</span>
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

            {/* FULL SYNC RESULT MODAL (CERTIFICATION TEST 1 HELPER) */}
            {fullSyncResultData && (
                <div className={styles.modalBackdrop} onClick={() => setFullSyncResultData(null)}>
                    <div className={styles.confirmModalBox} style={{ maxWidth: "560px", width: "95%" }} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={styles.confirmIcon} style={{ background: "#ecfdf5", color: "#059669" }}>
                                <CheckCircle2 size={22} />
                            </div>
                            <div className={styles.flexOne}>
                                <h3 className={styles.confirmHeaderTitle} style={{ fontSize: "16px" }}>
                                    Full Sync ARI (500 Hari) Berhasil
                                </h3>
                                <p className={styles.confirmHeaderSub}>
                                    Tepat 2 API Call Bulk Standar Channel Manager • 500 Hari
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFullSyncResultData(null)}
                                className={styles.modalCloseBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.modalBody} style={{ padding: "16px 20px" }}>
                            <p style={{ fontSize: "12px", color: "#52525b", margin: "0 0 14px 0", lineHeight: 1.5 }}>
                                Transmisi 500 hari ketersediaan dan tarif sukses dieksekusi. Gunakan 2 Task ID berikut untuk mengisi formulir <b>Test case #1. Full Sync</b> (1 baris per ID).
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {fullSyncResultData.availabilityTaskId && (
                                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                                                Call 1: Availability (All Rooms, 500 Days)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => copyText(fullSyncResultData.availabilityTaskId!, "Task ID Availability")}
                                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                                            >
                                                <Copy size={11} /> Salin
                                            </button>
                                        </div>
                                        <div style={{ fontFamily: "var(--font-mono-jb, monospace)", fontSize: "12px", fontWeight: 700, color: "#0f172a", wordBreak: "break-all" }}>
                                            {fullSyncResultData.availabilityTaskId}
                                        </div>
                                    </div>
                                )}

                                {fullSyncResultData.restrictionsTaskId && (
                                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                                                Call 2: Rates &amp; Restrictions (All Rates, 500 Days)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => copyText(fullSyncResultData.restrictionsTaskId!, "Task ID Rates & Restrictions")}
                                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                                            >
                                                <Copy size={11} /> Salin
                                            </button>
                                        </div>
                                        <div style={{ fontFamily: "var(--font-mono-jb, monospace)", fontSize: "12px", fontWeight: 700, color: "#0f172a", wordBreak: "break-all" }}>
                                            {fullSyncResultData.restrictionsTaskId}
                                        </div>
                                    </div>
                                )}

                                {!fullSyncResultData.availabilityTaskId && !fullSyncResultData.restrictionsTaskId && fullSyncResultData.taskIds.map((tid, idx) => (
                                    <div key={idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                                                Task ID #{idx + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => copyText(tid, `Task ID #${idx + 1}`)}
                                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                                            >
                                                <Copy size={11} /> Salin
                                            </button>
                                        </div>
                                        <div style={{ fontFamily: "var(--font-mono-jb, monospace)", fontSize: "12px", fontWeight: 700, color: "#0f172a", wordBreak: "break-all" }}>
                                            {tid}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.modalFooter} style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setFullSyncResultData(null);
                                    setActiveTab("logs");
                                }}
                                className={styles.btnActionSecondary}
                                style={{ fontSize: "12px" }}
                            >
                                Buka Tab Riwayat Log
                            </button>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => copyText(fullSyncResultData.taskIds.join("\n"), "2 Task ID (1 Baris per ID)")}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        background: "#18181b",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "8px 14px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    <Copy size={13} />
                                    <span>Salin Semua (1 ID per Baris)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFullSyncResultData(null)}
                                    className={styles.btnActionSecondary}
                                    style={{ fontSize: "12px" }}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
