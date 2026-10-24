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
    Radio,
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
    Compass,
    Bell,
    SlidersHorizontal,
    Grid3X3,
    Unlink
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
import { ChannelWebhooksTab } from "./ChannelWebhooksTab";
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

// Newly Extracted Modular Tab Components
import { ChannelMappingTab } from "./ChannelMappingTab";
import { RateParityMatrixTab } from "./RateParityMatrixTab";
import { ChannelCatalogTab, CHANNEX_OTA_CATALOG, type OtaCatalogItem } from "./ChannelCatalogTab";
import { ChannelExtranetTab } from "./ChannelExtranetTab";
import { ChannelCredentialsTab } from "./ChannelCredentialsTab";
import { ChannelSandboxTab } from "./ChannelSandboxTab";
import { ChannelAriSyncFeedTab } from "./ChannelAriSyncFeedTab";

import { DEFAULT_CURRENCY } from "@/lib/currency-utils";
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc, deleteField, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ChannelMappingConfig {
    channelCode: string;
    channelName: string;
    icon: string;
    hotelId: string;
    currency: string;
    pricingModel: "gross" | "net";
    extranetRateModel?: "gross" | "net";
    commissionPercent: number;
    marketingAdsPercent?: number;
    markupPercent: number;
    isActive: boolean;
    separationMode?: "merged" | "separated_rate" | "separated_allotment" | "separated_both";
    roomMappings: Record<string, string>;
    rateMappings: Record<string, string>;
    channexChannelId?: string | null;
    channexStatus?: string;
    channexSyncNote?: string;
    lastChannexSync?: string;
}

export type ChannelTabType =
    | "mapping"
    | "matrix"
    | "catalog"
    | "travel_agents"
    | "iframe"
    | "rules"
    | "dynamic_pricing"
    | "promotions"
    | "google"
    | "content"
    | "messages"
    | "reviews"
    | "payments"
    | "payment_gateway"
    | "booking_engine"
    | "rooms"
    | "rateplans"
    | "groups"
    | "tutorial"
    | "sync"
    | "logs"
    | "webhooks"
    | "sandbox"
    | "golive";

export function ChannelManagerSection() {
    const { activeHotelCode, activeHotelName, user } = useAuth();
    const { ratePlans, loading: loadingRates } = useRatePlans();
    const { roomTypes, loading: loadingRooms } = useRoomTypes();

    const [activeTab, setActiveTab] = useState<ChannelTabType>("mapping");
    const [isVccModalOpen, setIsVccModalOpen] = useState<boolean>(false);
    const [isTaxesModalOpen, setIsTaxesModalOpen] = useState<boolean>(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);

    // Universal modal states defined below

    // Environment & Credentials State
    const [channexEnv, setChannexEnv] = useState<"staging" | "production">("staging");
    const [channexApiKey, setChannexApiKey] = useState<string>("");
    const [channexWebhookSecret, setChannexWebhookSecret] = useState<string>("");
    const [channexPropertyId, setChannexPropertyId] = useState<string>("");
    const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState<boolean>(false);
    const [unlinkingProperty, setUnlinkingProperty] = useState<boolean>(false);
    const [hotelCurrency, setHotelCurrency] = useState<string>("IDR");

    // Connected Channels Map
    const [channelConfigs, setChannelConfigs] = useState<Record<string, ChannelMappingConfig>>({});
    const [selectedChannelCode, setSelectedChannelCode] = useState<string>("");

    // Modals & UI States
    const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState<boolean>(false);
    const [channelSearchQuery, setChannelSearchQuery] = useState<string>("");
    const [modalCategoryFilter, setModalCategoryFilter] = useState<string>("all");
    const [savingSettings, setSavingSettings] = useState<boolean>(false);
    const [syncingAri, setSyncingAri] = useState<boolean>(false);
    const [syncingMaster, setSyncingMaster] = useState<boolean>(false);
    const [syncingChannex, setSyncingChannex] = useState<boolean>(false);
    const [testingOta, setTestingOta] = useState<boolean>(false);
    const [fetchingOtaMapping, setFetchingOtaMapping] = useState<boolean>(false);
    const [otaExtranetRooms, setOtaExtranetRooms] = useState<Record<string, any[]>>({});
    const [pingingMap, setPingingMap] = useState<Record<string, boolean>>({});

    const [fullSyncResultData, setFullSyncResultData] = useState<{
        taskIds: string[];
        availabilityTaskId?: string;
        restrictionsTaskId?: string;
        latencyMs?: number;
        message?: string;
    } | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: "disconnect" | "reset_mappings";
        channelCode: string;
        channelName: string;
    } | null>(null);

    // Universal Keyboard accessibility: dismiss any active modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isNotificationModalOpen) {
                    setIsNotificationModalOpen(false);
                } else if (isAddChannelModalOpen) {
                    setIsAddChannelModalOpen(false);
                } else if (confirmModal) {
                    setConfirmModal(null);
                } else if (isUnlinkModalOpen) {
                    if (!unlinkingProperty) setIsUnlinkModalOpen(false);
                } else if (fullSyncResultData) {
                    setFullSyncResultData(null);
                } else if (isVccModalOpen) {
                    setIsVccModalOpen(false);
                } else if (isTaxesModalOpen) {
                    setIsTaxesModalOpen(false);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        isNotificationModalOpen,
        isAddChannelModalOpen,
        confirmModal,
        isUnlinkModalOpen,
        unlinkingProperty,
        fullSyncResultData,
        isVccModalOpen,
        isTaxesModalOpen
    ]);

    // Live Activity Log
    const [syncLog, setSyncLog] = useState<Array<{ time: string; status: string; message: string }>>([
        {
            time: new Date().toLocaleTimeString(),
            status: "SUCCESS",
            message: "2-Way Enterprise Channel Manager ready for 68+ OTA distribution channels."
        }
    ]);

    // Active Connected Channels List
    const activeChannelsList = useMemo(() => {
        return Object.values(channelConfigs).filter(c => c.isActive);
    }, [channelConfigs]);

    const TAB_GROUP_MAP: Record<string, string> = {
        mapping: "Distribusi Saluran",
        matrix: "Distribusi Saluran",
        catalog: "Distribusi Saluran",
        travel_agents: "Distribusi Saluran",
        iframe: "Distribusi Saluran",
        rules: "Yield & Revenue",
        dynamic_pricing: "Yield & Revenue",
        promotions: "Yield & Revenue",
        google: "Yield & Revenue",
        content: "Yield & Revenue",
        messages: "Komunikasi & Tamu",
        reviews: "Komunikasi & Tamu",
        payments: "Finansial & Booking",
        payment_gateway: "Finansial & Booking",
        booking_engine: "Finansial & Booking",
        rooms: "Master Data Properti",
        rateplans: "Master Data Properti",
        groups: "Master Data Properti",
        tutorial: "Master Data Properti",
        sync: "Log & Audit",
        logs: "Log & Audit",
        webhooks: "Log & Audit",
        sandbox: "Sertifikasi & Gateway",
        golive: "Sertifikasi & Gateway",
    };

    // Metadata for the 22 tabs
    const TAB_METADATA: Record<ChannelTabType, { title: string; subtitle: string; icon: React.ElementType }> = {
        mapping: {
            title: "Saluran & Pemetaan",
            subtitle: "Kelola pemetaan kamar PMS ke OTA, kode rate plan, dan aturan pemisahan alokasi inventaris.",
            icon: Layers
        },
        matrix: {
            title: "Matriks Paritas Tarif",
            subtitle: "Komparasi Base Net Rate PMS terhadap Gross Retail Selling Rate tiap saluran OTA secara presisi.",
            icon: Grid3X3
        },
        catalog: {
            title: "Katalog Saluran OTA (68+ Saluran)",
            subtitle: "Jelajahi dan hubungkan 68+ OTA global, bedbank, metasearch engine, dan booking engine.",
            icon: Globe
        },
        travel_agents: {
            title: "Travel Agent & B2B Wholesaler",
            subtitle: "Kelola biro perjalanan offline rekanan, akun korporat B2B, dan saluran distribusi wholesale.",
            icon: Users
        },
        iframe: {
            title: "Ekstranet Visual Channex SSO",
            subtitle: "Akses konsol pemetaan visual resmi Channex via sesi Single Sign-On (SSO) terenkripsi.",
            icon: ExternalLink
        },
        rules: {
            title: "Aturan Yield & Restriksi ARI",
            subtitle: "Otomasi kontrol distribusi termasuk CTA, CTD, Min/Max LOS, dan stop-sell berbasis okupansi.",
            icon: Shield
        },
        dynamic_pricing: {
            title: "Dynamic Pricing RMS Connector",
            subtitle: "Penyesuaian tarif dinamis otomatis berdasarkan ambang batas okupansi dan booking pace.",
            icon: TrendingUp
        },
        promotions: {
            title: "Promo & Diskon OTA",
            subtitle: "Sebarkan promo Early Bird, Last Minute, Mobile Deals, dan diskon ke seluruh saluran OTA.",
            icon: Tag
        },
        google: {
            title: "Google Hotel Free Links",
            subtitle: "Integrasi ARI langsung ke Google Travel & Search dengan komisi 0% untuk reservasi direct.",
            icon: Search
        },
        content: {
            title: "Konten & Foto Kamar",
            subtitle: "Distribusi terpusat foto resolusi tinggi, deskripsi tipe kamar, dan fasilitas hotel ke OTA.",
            icon: UploadCloud
        },
        messages: {
            title: "Pusat Pesan Tamu Terpadu",
            subtitle: "Kotak masuk terpusat untuk komunikasi dengan tamu dari Booking.com, Agoda, Expedia, dan Airbnb.",
            icon: MessageSquare
        },
        reviews: {
            title: "Ulasan & Reputasi Tamu",
            subtitle: "Pantau skor ulasan agregat, baca feedback tamu, dan balas review langsung ke platform OTA.",
            icon: Star
        },
        payments: {
            title: "PCI Card Vault & Virtual CC (VCC)",
            subtitle: "Penyimpanan kartu kredit virtual tamu berstandar PCI-DSS Level 1 dan tokenisasi pembayaran.",
            icon: CreditCard
        },
        payment_gateway: {
            title: "Direct Booking Engine Gateway",
            subtitle: "Pengaturan payment gateway direct booking multi-tenant, visual identitas, dan tracking tamu.",
            icon: Receipt
        },
        booking_engine: {
            title: "Direct Booking Engine Gateway",
            subtitle: "Pengaturan payment gateway direct booking multi-tenant, visual identitas, dan tracking tamu.",
            icon: Receipt
        },
        rooms: {
            title: "Master Tipe Kamar Fisik",
            subtitle: "Konfigurasi kategori kamar dasar, tata letak tempat tidur, okupansi standar, dan total fisik.",
            icon: BedDouble
        },
        rateplans: {
            title: "Master Rate Plan & Paket",
            subtitle: "Kelola rate plan utama (Room Only, Bed & Breakfast) serta kalkulasi turunan tarif otomatis.",
            icon: SlidersHorizontal
        },
        groups: {
            title: "Grup Hotel & Multi-Properti",
            subtitle: "Kelola rantai hotel, grup properti untuk distribusi serentak, dan pantau status koneksi terpusat.",
            icon: Building2
        },
        tutorial: {
            title: "Roadmap Go-Live Produksi",
            subtitle: "Panduan terstruktur 5 tahap: verifikasi akun, uji sandbox properti pilot, hingga go-live live.",
            icon: Compass
        },
        sync: {
            title: "Live ARI Sync Feed (500 Hari)",
            subtitle: "Monitor antrian sinkronisasi ARI real-time, status pengiriman 500 hari, dan koneksi saluran.",
            icon: RefreshCw
        },
        logs: {
            title: "Audit Log Sistem",
            subtitle: "Riwayat lengkap mutasi sistem, perubahan tarif & ketersediaan, serta log aktivitas pengguna.",
            icon: Terminal
        },
        webhooks: {
            title: "Webhook Traces & Inbound Monitor",
            subtitle: "Pemantauan real-time transmisi webhook dari OTA/Channex, payload reservasi masuk, dan status verifikasi ACK.",
            icon: Radio
        },
        sandbox: {
            title: "Skenario Sertifikasi & Simulator",
            subtitle: "Harness pengujian sertifikasi: 10 skenario ARI Channex dan simulator injeksi reservasi OTA.",
            icon: Activity
        },
        golive: {
            title: "Kredensial API Gateway & Webhook",
            subtitle: "Pengaturan API Key Channex, GUID properti, webhook secret, dan switch server produksi.",
            icon: Lock
        }
    };

    // Synchronize tab with URL query parameter ?tab= and custom event channel-tab-change
    useEffect(() => {
        const syncFromUrl = () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                const tabParam = params.get("tab") as ChannelTabType;
                if (tabParam && Object.keys(TAB_METADATA).includes(tabParam)) {
                    setActiveTab(tabParam);
                }
            }
        };

        syncFromUrl();

        const handleCustomTabChange = (e: any) => {
            const tab = typeof e.detail === "string" ? e.detail : e.detail?.tab;
            if (tab && Object.keys(TAB_METADATA).includes(tab)) {
                setActiveTab(tab as ChannelTabType);
            }
        };

        window.addEventListener("channel-tab-change", handleCustomTabChange);
        window.addEventListener("popstate", syncFromUrl);

        return () => {
            window.removeEventListener("channel-tab-change", handleCustomTabChange);
            window.removeEventListener("popstate", syncFromUrl);
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

    // 1. Subscribe to Firestore Hotel Channel Manager Configuration
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") return;

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

        return () => unsubHotel();
    }, [activeHotelCode]);

    // Save All Settings to Firestore
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
                    isSyncActive: true,
                    updatedAt: new Date().toISOString()
                }
            });

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

            if (selectedChannelCode && channelConfigs[selectedChannelCode]?.hotelId) {
                await handleSyncSingleChannelToChannex(selectedChannelCode);
            }
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

    // Helper: Sync single channel via API
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
                toast.success(data.message || `Saluran ${targetChannel.channelName} tersinkronisasi dengan Channex.`);
                if (data.channel) {
                    setChannelConfigs(prev => ({ ...prev, [code]: data.channel }));
                }
            } else {
                toast.error(data.error || data.message || "Gagal sinkronisasi saluran dengan Channex");
            }
        } catch (err: any) {
            toast.error(`Kesalahan koneksi Channex: ${err.message}`);
        } finally {
            setSyncingChannex(false);
        }
    };

    // Helper: Test OTA connection
    const handleTestOtaConnection = async (code: string) => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        const targetChannel = channelConfigs[code];
        if (!targetChannel?.hotelId) {
            toast.warning("Masukkan Extranet Hotel ID terlebih dahulu sebelum tes koneksi.");
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
                    channelData: { ...targetChannel, hotelId: targetChannel.hotelId }
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Koneksi OTA berhasil diverifikasi oleh Channex.");
            } else {
                toast.error(data.message || data.error || "Koneksi OTA gagal. Periksa kembali Extranet Hotel ID.");
            }
        } catch (err: any) {
            toast.error(`Kesalahan verifikasi OTA: ${err.message}`);
        } finally {
            setTestingOta(false);
        }
    };

    // Helper: Auto-fetch rooms and rate plans from OTA Extranet
    const handleFetchOtaMapping = async (code: string) => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        const targetChannel = channelConfigs[code];
        if (!targetChannel?.hotelId) {
            toast.warning("Masukkan Extranet Hotel ID sebelum menarik data dari OTA.");
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
                    channelData: { ...targetChannel, hotelId: targetChannel.hotelId }
                })
            });
            const data = await res.json();
            if (data.success && data.data) {
                const rawRooms = data.data.rooms || (Array.isArray(data.data) ? data.data : []);
                if (rawRooms.length === 0) {
                    toast.info(`Koneksi terhubung, namun OTA (${targetChannel.channelName}) belum mengembalikan data kamar. Pastikan Channex telah di-approve di extranet OTA.`);
                    return;
                }

                setOtaExtranetRooms(prev => ({ ...prev, [code]: rawRooms }));

                const newRoomMappings = { ...(targetChannel.roomMappings || {}) };
                const newRateMappings = { ...(targetChannel.rateMappings || {}) };

                roomTypes.forEach(rt => {
                    if (newRoomMappings[rt.id]) return;
                    const pmsName = rt.name.toLowerCase().trim();
                    const matched = rawRooms.find((r: any) => {
                        const otaName = (r.title || r.name || "").toLowerCase().trim();
                        return otaName.includes(pmsName) || pmsName.includes(otaName);
                    });
                    if (matched) newRoomMappings[rt.id] = String(matched.id);
                });

                setChannelConfigs(prev => ({
                    ...prev,
                    [code]: {
                        ...prev[code],
                        roomMappings: newRoomMappings,
                        rateMappings: newRateMappings
                    }
                }));

                toast.success(`Berhasil mengambil ${rawRooms.length} kamar dari ${targetChannel.channelName}.`);
            } else {
                toast.error(data.message || "Gagal menarik data pemetaan dari OTA.");
            }
        } catch (err: any) {
            toast.error(`Gagal menghubungi OTA: ${err.message}`);
        } finally {
            setFetchingOtaMapping(false);
        }
    };

    // Helper: Test Ping Mapping
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

    // Connect a new channel from Catalog or Preset
    const handleConnectChannel = (catalogItem: OtaCatalogItem | any) => {
        const newChannel: ChannelMappingConfig = {
            channelCode: catalogItem.code,
            channelName: catalogItem.name,
            icon: catalogItem.icon || "🌐",
            hotelId: "",
            currency: "IDR",
            pricingModel: "gross",
            extranetRateModel: catalogItem.category === "wholesaler" ? "net" : "gross",
            commissionPercent: catalogItem.defaultCommission || 15,
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
        toast.success(`Saluran ${catalogItem.name} berhasil terhubung. Masukkan Extranet Hotel ID.`);

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

    const executeConfirmAction = () => {
        if (!confirmModal) return;
        const { type, channelCode, channelName } = confirmModal;

        if (type === "disconnect") {
            setChannelConfigs(prev => {
                const updated = { ...prev };
                delete updated[channelCode];
                return updated;
            });

            if (activeHotelCode && activeHotelCode !== "0") {
                try {
                    const docRef = doc(db, "hotels", activeHotelCode);
                    updateDoc(docRef, {
                        [`channelManager.channels.${channelCode}`]: deleteField(),
                        "channelManager.lastSyncAt": new Date().toISOString()
                    }).catch(console.error);
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
            }

            const remaining = Object.values(channelConfigs).filter(c => c.channelCode !== channelCode && c.isActive);
            setSelectedChannelCode(remaining.length > 0 ? remaining[0].channelCode : "");
            toast.success(`Saluran ${channelName} berhasil diputuskan.`);
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
            toast.info(`Semua pemetaan untuk ${channelName} telah dibersihkan.`);
        }

        setConfirmModal(null);
    };

    // Clear single Room or Rate Mapping
    const handleClearRoomMapping = (code: string, roomTypeId: string) => {
        setChannelConfigs(prev => {
            const updated = { ...prev };
            if (updated[code]?.roomMappings) {
                const newMappings = { ...updated[code].roomMappings };
                delete newMappings[roomTypeId];
                updated[code] = { ...updated[code], roomMappings: newMappings };
            }
            return updated;
        });
    };

    const handleClearRateMapping = (code: string, mappingKey: string, ratePlanId?: string) => {
        setChannelConfigs(prev => {
            const updated = { ...prev };
            if (updated[code]?.rateMappings) {
                const newMappings = { ...updated[code].rateMappings };
                delete newMappings[mappingKey];
                if (ratePlanId && newMappings[ratePlanId]) delete newMappings[ratePlanId];
                updated[code] = { ...updated[code], rateMappings: newMappings };
            }
            return updated;
        });
    };

    // Force Push All ARI to Channel Manager
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
                    user: user?.displayName || user?.name || "Operator"
                })
            });

            const data = await res.json();
            if (data.success) {
                const tIds = (data.taskIds && data.taskIds.length > 0)
                    ? data.taskIds
                    : (data.taskId ? [data.taskId] : []);
                setFullSyncResultData({
                    taskIds: tIds,
                    availabilityTaskId: data.availabilityTaskId || tIds[0],
                    restrictionsTaskId: data.restrictionsTaskId || tIds[1],
                    latencyMs: data.latencyMs,
                    message: data.message
                });
                toast.success(`Availability (500 Hari) & Rates berhasil dikirim ke Channex!`);
                setSyncLog(prev => [
                    {
                        time: new Date().toLocaleTimeString(),
                        status: "SUCCESS",
                        message: `Full Sync ARI (500 Hari) sukses untuk Hotel [${activeHotelCode}] ke feed distribusi.`
                    },
                    ...prev
                ]);
            } else {
                toast.error(data.error || "Gagal sinkronisasi ARI.");
            }
        } catch (err: any) {
            toast.error("Network error during Channel Manager sync.");
        } finally {
            setSyncingAri(false);
        }
    };

    // Auto-Sync Master Data to Channex
    const handleSyncMasterToChannex = async () => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        setSyncingMaster(true);
        const toastId = toast.loading("Mendaftarkan kamar & rate plan ke Channex...");
        try {
            const res = await fetch("/api/channex/sync-master", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hotelCode: activeHotelCode, currency: hotelCurrency })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Gagal sinkronisasi");

            toast.success(data.message || "Kamar & rate plan berhasil didaftarkan ke Channex.", { id: toastId });
            if (data.propertyId) setChannexPropertyId(data.propertyId);
        } catch (err: any) {
            toast.error(err.message || "Error saat sinkronisasi ke Channex", { id: toastId });
        } finally {
            setSyncingMaster(false);
        }
    };

    // Unlink Channex Property
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

    const copyText = (txt: string, label: string) => {
        if (!txt) return;
        navigator.clipboard.writeText(txt);
        toast.success(`${label} disalin ke clipboard.`);
    };

    return (
        <div className={styles.container}>
            {/* 1. TOP ENTERPRISE HEADER BAR */}
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    {/* Breadcrumbs with Category Group */}
                    <nav className={styles.breadcrumbNav}>
                        <span>CRS</span>
                        <ChevronRight size={11} className="text-zinc-400" />
                        <span>Channel Manager</span>
                        <ChevronRight size={11} className="text-zinc-400" />
                        <span className={styles.breadcrumbGroup}>{TAB_GROUP_MAP[activeTab] || "Distribusi Saluran"}</span>
                        <ChevronRight size={11} className="text-zinc-400" />
                        <span className={styles.breadcrumbActive}>{TAB_METADATA[activeTab]?.title || "Saluran & Pemetaan"}</span>
                    </nav>

                    <div className={styles.systemHeaderRow}>
                        <h1 className={styles.systemTitle}>
                            {TAB_METADATA[activeTab]?.title || "Saluran & Pemetaan"}
                        </h1>
                        <span className={cn(
                            styles.systemBadge,
                            channexEnv === "production" ? styles.systemBadgeProd : styles.systemBadgeStaging
                        )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", channexEnv === "production" ? "bg-emerald-500" : "bg-amber-500")} />
                            <span>{channexEnv === "production" ? "Live Production" : "Staging / Sandbox"}</span>
                        </span>
                        <span className={styles.launchpadSpecChip}>
                            Properti: {activeHotelName || activeHotelCode || "0"}
                        </span>
                        {channexPropertyId && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200/80 rounded-md px-2 py-0.5 font-mono">
                                <span className="text-[10px] text-zinc-400 uppercase font-semibold">UUID</span>
                                <code>{channexPropertyId.slice(0, 8)}...</code>
                                <button
                                    type="button"
                                    onClick={() => copyText(channexPropertyId, "Channex Property UUID")}
                                    className={styles.btnIconClear}
                                    style={{ width: 18, height: 18 }}
                                    title="Salin UUID Channex"
                                >
                                    <Copy size={10} />
                                </button>
                            </span>
                        )}
                    </div>
                    <div className={styles.systemMetaRow}>
                        <span>{TAB_METADATA[activeTab]?.subtitle || "Hub Pemetaan Kamar, Rate Plans, dan Sinkronisasi ARI ke Channex CRS."}</span>
                    </div>
                </div>

                {/* Contextual Top Action Buttons */}
                <div className={styles.topBarActions}>
                    <button
                        type="button"
                        onClick={() => setIsNotificationModalOpen(true)}
                        className={styles.btnActionSecondary}
                        title="Buka Pusat Notifikasi WhatsApp & Email"
                    >
                        <Bell size={13} />
                        <span>Notifikasi OTA</span>
                    </button>

                    {activeTab === "mapping" && (
                        <>
                            <button
                                type="button"
                                onClick={handleSyncAllAri}
                                disabled={syncingAri}
                                className={styles.btnActionSecondary}
                            >
                                <RefreshCw size={13} className={cn(syncingAri && "animate-spin")} />
                                <span>{syncingAri ? "Syncing ARI..." : "Force Push ARI"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsAddChannelModalOpen(true)}
                                className={styles.btnActionPrimary}
                            >
                                <Plus size={13} />
                                <span>Tambah Saluran</span>
                            </button>
                        </>
                    )}

                    {activeTab === "matrix" && (
                        <button
                            type="button"
                            onClick={handleSyncAllAri}
                            disabled={syncingAri}
                            className={styles.btnActionSecondary}
                        >
                            <RefreshCw size={13} className={cn(syncingAri && "animate-spin")} />
                            <span>{syncingAri ? "Syncing ARI..." : "Force Push ARI"}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 2. MODULAR TAB VIEW ROUTER */}
            {/* TAB: SALURAN & PEMETAAN */}
            {activeTab === "mapping" && (
                <ChannelMappingTab
                    hotelCode={activeHotelCode}
                    hotelName={activeHotelName}
                    hotelCurrency={hotelCurrency}
                    channelConfigs={channelConfigs}
                    activeChannelsList={activeChannelsList}
                    selectedChannelCode={selectedChannelCode}
                    setSelectedChannelCode={setSelectedChannelCode}
                    roomTypes={roomTypes}
                    ratePlans={ratePlans}
                    onOpenAddChannelModal={() => setIsAddChannelModalOpen(true)}
                    onConnectPresetChannel={handleConnectChannel}
                    onSaveAll={handleSaveAll}
                    savingSettings={savingSettings}
                    onDisconnectChannel={promptDisconnectChannel}
                    onResetMappings={promptResetAllMappings}
                    onClearRoomMapping={handleClearRoomMapping}
                    onClearRateMapping={handleClearRateMapping}
                    updateChannelField={updateChannelField}
                    onSyncSingleChannelToChannex={handleSyncSingleChannelToChannex}
                    syncingChannex={syncingChannex}
                    onTestOtaConnection={handleTestOtaConnection}
                    testingOta={testingOta}
                    onFetchOtaMapping={handleFetchOtaMapping}
                    fetchingOtaMapping={fetchingOtaMapping}
                    onPingTest={handlePingTest}
                    pingingMap={pingingMap}
                    otaExtranetRooms={otaExtranetRooms}
                    onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
                />
            )}

            {/* TAB: MATRIKS PARITAS TARIF */}
            {activeTab === "matrix" && (
                <RateParityMatrixTab
                    hotelCode={activeHotelCode}
                    hotelCurrency={hotelCurrency}
                    ratePlans={ratePlans}
                    activeChannelsList={activeChannelsList}
                />
            )}

            {/* TAB: KATALOG SALURAN OTA */}
            {activeTab === "catalog" && (
                <ChannelCatalogTab
                    channelConfigs={channelConfigs}
                    onConnectChannel={handleConnectChannel}
                    onSelectChannel={(code) => {
                        setSelectedChannelCode(code);
                        handleSelectTab("mapping");
                    }}
                    onNavigateToTab={handleSelectTab}
                />
            )}

            {/* TAB: TRAVEL AGENT & B2B */}
            {activeTab === "travel_agents" && (
                <TravelAgentTab
                    hotelCode={activeHotelCode}
                    channelConfigs={channelConfigs}
                    onNavigateToCatalog={() => handleSelectTab("catalog")}
                />
            )}

            {/* TAB: EKSTRANET VISUAL CHANNEX SSO */}
            {activeTab === "iframe" && (
                <ChannelExtranetTab
                    hotelCode={activeHotelCode}
                    hotelName={activeHotelName}
                    channexEnv={channexEnv}
                    userEmail={user?.email || undefined}
                    onNavigateToTab={handleSelectTab}
                />
            )}

            {/* TAB: ATURAN YIELD & RESTRIKSI */}
            {activeTab === "rules" && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsTaxesModalOpen(true)}
                            className="h-8 text-xs border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-xs cursor-pointer"
                        >
                            <Receipt size={13} className="mr-1.5" />
                            <span>Konfigurasi Pajak &amp; Service Charge Saluran</span>
                        </Button>
                    </div>
                    <ChannelAvailabilityRulesTab hotelCode={activeHotelCode} roomTypes={roomTypes} />
                </div>
            )}

            {/* TAB: DYNAMIC PRICING RMS */}
            {activeTab === "dynamic_pricing" && (
                <ChannelDynamicPricingTab hotelCode={activeHotelCode} />
            )}

            {/* TAB: PROMO & DISKON OTA */}
            {activeTab === "promotions" && (
                <ChannelPromotionsTab hotelCode={activeHotelCode} />
            )}

            {/* TAB: GOOGLE HOTEL FREE LINKS */}
            {activeTab === "google" && (
                <ChannelGoogleHotelsTab hotelCode={activeHotelCode} />
            )}

            {/* TAB: KONTEN & FOTO KAMAR */}
            {activeTab === "content" && (
                <ChannelContentPushTab hotelCode={activeHotelCode} />
            )}

            {/* TAB: PUSAT PESAN TAMU */}
            {activeTab === "messages" && (
                <ChannelMessagesTab hotelCode={activeHotelCode} />
            )}

            {/* TAB: ULASAN & REPUTASI */}
            {activeTab === "reviews" && (
                <ChannelReviewsTab hotelCode={activeHotelCode} />
            )}

            {/* TAB: PCI CARD VAULT & VCC */}
            {activeTab === "payments" && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsVccModalOpen(true)}
                            className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 shadow-xs cursor-pointer"
                        >
                            <CreditCard size={13} className="mr-1.5 text-blue-600" />
                            <span>Buka PCI Virtual Credit Card (VCC) Vault</span>
                        </Button>
                    </div>
                    <ChannelPaymentTokenizationTab hotelCode={activeHotelCode} />
                </div>
            )}

            {/* TAB: DIRECT BOOKING ENGINE GATEWAY */}
            {(activeTab === "payment_gateway" || activeTab === "booking_engine") && (
                <PaymentGatewayTab hotelCode={activeHotelCode} />
            )}

            {/* TAB: MASTER ROOM TYPES */}
            {activeTab === "rooms" && (
                <RoomTypeSection embedded={true} />
            )}

            {/* TAB: MASTER RATE PLANS */}
            {activeTab === "rateplans" && (
                <RatePlanSection embedded={true} />
            )}

            {/* TAB: GRUP HOTEL & MULTI-PROPERTI */}
            {activeTab === "groups" && (
                <ChannelGroupsTab />
            )}

            {/* TAB: ROADMAP GO-LIVE */}
            {activeTab === "tutorial" && (
                <ChannelTutorialTab
                    onNavigateTab={handleSelectTab}
                    activeHotelCode={activeHotelCode}
                    activeHotelName={activeHotelName}
                />
            )}

            {/* TAB: LIVE ARI SYNC FEED */}
            {activeTab === "sync" && (
                <ChannelAriSyncFeedTab
                    hotelCode={activeHotelCode}
                    syncingAri={syncingAri}
                    onSyncAllAri={handleSyncAllAri}
                    syncLog={syncLog}
                    onNavigateToLogs={() => handleSelectTab("logs")}
                />
            )}

            {/* TAB: AUDIT LOG */}
            {activeTab === "logs" && (
                <ChannelActionLogsTab hotelCode={activeHotelCode} />
            )}

            {/* TAB: WEBHOOK TRACES & INBOUND MONITOR */}
            {activeTab === "webhooks" && (
                <ChannelWebhooksTab hotelCode={activeHotelCode} />
            )}

            {/* TAB: SKENARIO SERTIFIKASI & SIMULATOR */}
            {activeTab === "sandbox" && (
                <ChannelSandboxTab
                    hotelCode={activeHotelCode}
                    roomTypes={roomTypes}
                    ratePlans={ratePlans}
                    channexEnv={channexEnv}
                />
            )}

            {/* TAB: KREDENSIAL API GATEWAY & WEBHOOK */}
            {activeTab === "golive" && (
                <ChannelCredentialsTab
                    hotelCode={activeHotelCode}
                    hotelName={activeHotelName}
                    channexEnv={channexEnv}
                    setChannexEnv={setChannexEnv}
                    channexApiKey={channexApiKey}
                    setChannexApiKey={setChannexApiKey}
                    channexWebhookSecret={channexWebhookSecret}
                    setChannexWebhookSecret={setChannexWebhookSecret}
                    channexPropertyId={channexPropertyId}
                    setChannexPropertyId={setChannexPropertyId}
                    hotelCurrency={hotelCurrency}
                    setHotelCurrency={setHotelCurrency}
                    savingSettings={savingSettings}
                    onSave={handleSaveAll}
                    onSyncMasterToChannex={handleSyncMasterToChannex}
                    syncingMaster={syncingMaster}
                    onUnlinkProperty={() => setIsUnlinkModalOpen(true)}
                    onNavigateToTab={handleSelectTab}
                />
            )}

            {/* ── SHARED GLOBAL MODALS ── */}
            {/* Modal 1: Connect Online Channel Modal */}
            {isAddChannelModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsAddChannelModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className={styles.catalogModalCard} onClick={e => e.stopPropagation()}>
                        <div className={styles.catalogModalHeader}>
                            <div className={styles.catalogHeaderInfo}>
                                <div className={styles.catalogHeaderIconBox}>
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <h3 className={styles.catalogHeaderTitle}>Hubungkan Saluran OTA Baru</h3>
                                    <p className={styles.catalogHeaderSubtitle}>
                                        Pilih saluran OTA, Bedbank, atau mitra distribusi dari katalog global 68+ saluran.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddChannelModalOpen(false)}
                                className={styles.modalCloseBtn}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search & Filter Toolbar */}
                        <div className={styles.catalogToolbar}>
                            <div className={styles.catalogSearchBox}>
                                <Search size={15} className={styles.catalogSearchIcon} />
                                <input
                                    type="text"
                                    value={channelSearchQuery}
                                    onChange={e => setChannelSearchQuery(e.target.value)}
                                    placeholder="Cari nama saluran (misal: Traveloka, Booking.com, Agoda, Expedia)..."
                                    className={styles.catalogSearchInput}
                                    autoFocus
                                />
                                {channelSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setChannelSearchQuery("")}
                                        className={styles.catalogSearchClearBtn}
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            <div className={styles.catalogFilterRow}>
                                {[
                                    { id: "all", label: "Semua" },
                                    { id: "ota", label: "OTA" },
                                    { id: "wholesaler", label: "B2B" },
                                    { id: "meta", label: "Metasearch" },
                                    { id: "vacation", label: "Vacation" }
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

                        {/* Modal Body */}
                        <div className={styles.catalogModalBody}>
                            {(() => {
                                const q = channelSearchQuery.trim().toLowerCase();
                                const filtered = CHANNEX_OTA_CATALOG.filter(ch => {
                                    const match = !q || ch.name.toLowerCase().includes(q) || ch.code.toLowerCase().includes(q);
                                    if (!match) return false;
                                    if (modalCategoryFilter === "all") return true;
                                    return ch.category === modalCategoryFilter;
                                });

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
                                                                Terhubung
                                                            </span>
                                                        ) : (
                                                            <span className={styles.badgeAvailable}>Tersedia</span>
                                                        )}
                                                    </div>

                                                    <div className={styles.addChannelCardMeta}>
                                                        <div className={styles.addChannelMetaItem}>
                                                            <span className={styles.addChannelMetaLabel}>Komisi</span>
                                                            <span className={styles.addChannelMetaValue}>{ch.defaultCommission}%</span>
                                                        </div>
                                                        <div className={styles.addChannelMetaDivider} />
                                                        <div className={styles.addChannelMetaItem}>
                                                            <span className={styles.addChannelMetaLabel}>Kategori</span>
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
                                                                <span>Sudah Terhubung</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus size={13} />
                                                                <span>Hubungkan Saluran</span>
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

                        <div className={styles.catalogModalFooter}>
                            <span className={styles.catalogFooterSummary}>
                                Total Katalog Global: <b>{CHANNEX_OTA_CATALOG.length}</b> saluran
                            </span>
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

            {/* Modal 2: Enterprise Disconnect / Reset Confirmation */}
            {confirmModal?.isOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setConfirmModal(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-modal-title"
                >
                    <div className={styles.confirmModalCard} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={`${styles.confirmIconBox} ${confirmModal.type === "disconnect" ? styles.confirmIconDanger : styles.confirmIconWarning}`}>
                                {confirmModal.type === "disconnect" ? <AlertTriangle size={20} /> : <RotateCcw size={20} />}
                            </div>
                            <div className={styles.flexOne}>
                                <h3 id="confirm-modal-title" className={styles.confirmHeaderTitle}>
                                    {confirmModal.type === "disconnect"
                                        ? "Konfirmasi Pemutusan Saluran OTA"
                                        : "Konfirmasi Reset Pemetaan Saluran"}
                                </h3>
                                <p className={styles.confirmHeaderSub}>
                                    Properti: <b>{activeHotelName || activeHotelCode}</b>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup jendela konfirmasi"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.confirmChannelBanner}>
                                <OtaLogo code={confirmModal.channelCode} name={confirmModal.channelName} size={28} />
                                <div className={styles.flexOne}>
                                    <span className={styles.confirmBannerTitle}>{confirmModal.channelName}</span>
                                    <span className={styles.confirmBannerSub}>Code: <code>{confirmModal.channelCode}</code></span>
                                </div>
                            </div>

                            {confirmModal.type === "disconnect" ? (
                                <div className={styles.confirmImpactList}>
                                    <span className={styles.confirmConsequenceTitle}>Dampak Pemutusan Saluran:</span>
                                    <span>• Sinkronisasi tarif dan inventaris (ARI) ke <b>{confirmModal.channelName}</b> akan dihentikan segera.</span>
                                    <span>• Reservasi masuk dari saluran ini tidak akan otomatis memotong ketersediaan kamar di PMS.</span>
                                </div>
                            ) : (
                                <div className={`${styles.confirmImpactList} ${styles.confirmImpactListWarning}`}>
                                    <span className={styles.confirmConsequenceTitle}>Dampak Reset Pemetaan:</span>
                                    <span>• Seluruh Extranet Hotel ID, Room ID, dan Rate Plan ID untuk <b>{confirmModal.channelName}</b> akan dikosongkan.</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className={styles.btnActionSecondary}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={executeConfirmAction}
                                className={`${confirmModal.type === "disconnect" ? styles.btnActionDanger : styles.btnActionWarning} ${styles.confirmBoldBtn}`}
                            >
                                {confirmModal.type === "disconnect" ? "Ya, Putuskan Saluran" : "Ya, Kosongkan Pemetaan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 3: Unlink Channex Property Confirmation */}
            {isUnlinkModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => !unlinkingProperty && setIsUnlinkModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="unlink-modal-title"
                >
                    <div className={styles.confirmModalCard} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={`${styles.confirmIconBox} ${styles.confirmIconDanger}`}>
                                <Unlink size={20} />
                            </div>
                            <div className={styles.flexOne}>
                                <h3 id="unlink-modal-title" className={styles.confirmHeaderTitle}>Putus Kaitan Channex Property</h3>
                                <p className={styles.confirmHeaderSub}>Properti: <b>{activeHotelName || activeHotelCode}</b></p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !unlinkingProperty && setIsUnlinkModalOpen(false)}
                                className={styles.modalCloseBtn}
                                disabled={unlinkingProperty}
                                aria-label="Tutup konfirmasi unlink"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.confirmImpactList}>
                                <span className={styles.confirmConsequenceTitle}>Konfirmasi Pemutusan Relasi Channex:</span>
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
                            >
                                {unlinkingProperty ? "Memutuskan..." : "Ya, Putus Kaitan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 4: Full Sync Result Dialog */}
            {fullSyncResultData && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setFullSyncResultData(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="sync-result-title"
                >
                    <div className={styles.confirmModalCard} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={styles.confirmIconBox} style={{ background: "#ecfdf5", color: "#059669" }}>
                                <CheckCircle2 size={22} />
                            </div>
                            <div className={styles.flexOne}>
                                <h3 id="sync-result-title" className={styles.confirmHeaderTitle}>
                                    Full Sync ARI (500 Hari) Berhasil
                                </h3>
                                <p className={styles.confirmHeaderSub}>Transmisi Bulk Standar Channel Manager • 500 Hari</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFullSyncResultData(null)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup jendela hasil sinkronisasi"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <p style={{ fontSize: "12px", color: "#71717a", marginBottom: "12px" }}>
                                Transmisi 500 hari ketersediaan dan tarif sukses dieksekusi ke jaringan Channex OTA. Task IDs:
                            </p>
                            <div className={styles.syncTaskIdList}>
                                {fullSyncResultData.availabilityTaskId && (
                                    <div className={styles.syncTaskIdCard}>
                                        <div style={{ minWidth: 0 }}>
                                            <span className={styles.syncTaskIdLabel}>Availability Task ID</span>
                                            <code className={styles.syncTaskIdCode}>{fullSyncResultData.availabilityTaskId}</code>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => copyText(fullSyncResultData.availabilityTaskId!, "Task ID Availability")}
                                            className={styles.syncTaskIdCopyBtn}
                                        >
                                            <Copy size={11} /> Salin
                                        </button>
                                    </div>
                                )}
                                {fullSyncResultData.restrictionsTaskId && (
                                    <div className={styles.syncTaskIdCard}>
                                        <div style={{ minWidth: 0 }}>
                                            <span className={styles.syncTaskIdLabel}>Restrictions Task ID</span>
                                            <code className={styles.syncTaskIdCode}>{fullSyncResultData.restrictionsTaskId}</code>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => copyText(fullSyncResultData.restrictionsTaskId!, "Task ID Restrictions")}
                                            className={styles.syncTaskIdCopyBtn}
                                        >
                                            <Copy size={11} /> Salin
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={() => {
                                    setFullSyncResultData(null);
                                    handleSelectTab("sync");
                                }}
                                className={styles.btnActionSecondary}
                            >
                                Buka Live Sync Feed
                            </button>
                            <button
                                type="button"
                                onClick={() => setFullSyncResultData(null)}
                                className={styles.btnActionPrimary}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 5: Virtual CC Viewer Modal */}
            <ChannelVccViewerModal
                isOpen={isVccModalOpen}
                onClose={() => setIsVccModalOpen(false)}
                hotelCode={activeHotelCode}
            />

            {/* Modal 6: Channel Taxes Modal */}
            <ChannelTaxesModal
                isOpen={isTaxesModalOpen}
                onClose={() => setIsTaxesModalOpen(false)}
                hotelCode={activeHotelCode}
            />

            {/* Modal 7: Push Notification Center Modal */}
            {isNotificationModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsNotificationModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="notification-modal-title"
                >
                    <div
                        className={styles.catalogModalCard}
                        style={{ maxWidth: "900px", maxHeight: "min(92vh, 860px)", display: "flex", flexDirection: "column" }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.modalHeader} style={{ padding: "16px 24px", borderBottom: "1px solid #e4e4e7" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "9px",
                                    backgroundColor: "#09090b",
                                    color: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    <Bell size={18} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{
                                            fontSize: "10px",
                                            fontWeight: 700,
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                            color: "#71717a"
                                        }}>
                                            Pusat Notifikasi Channel &amp; OTA
                                        </span>
                                        <span style={{
                                            fontSize: "10px",
                                            fontWeight: 600,
                                            color: "#059669",
                                            backgroundColor: "#ecfdf5",
                                            border: "1px solid #a7f3d0",
                                            padding: "1px 6px",
                                            borderRadius: "9999px"
                                        }}>
                                            Real-Time Alerts
                                        </span>
                                    </div>
                                    <h3 id="notification-modal-title" className={styles.modalTitle} style={{ fontSize: "16px" }}>
                                        Pusat Notifikasi Channel &amp; Reservasi OTA
                                    </h3>
                                    <p style={{ fontSize: "12px", color: "#71717a", margin: 0 }}>
                                        Konfigurasi notifikasi instan WhatsApp resmi (Meta Cloud API), Email (Brevo Relay), dan Web Push PWA.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsNotificationModalOpen(false)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup jendela notifikasi"
                                style={{ width: "32px", height: "32px" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
                            <ChannelNotificationWidget
                                hotelCode={activeHotelCode}
                                userEmail={user?.email || undefined}
                                onClose={() => setIsNotificationModalOpen(false)}
                            />
                        </div>

                        {/* Footer */}
                        <div className={styles.modalFooter} style={{ padding: "12px 24px", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "#71717a" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block" }} />
                                <span>Multi-tenant terisolasi untuk Properti Hotel <b>{activeHotelName || activeHotelCode}</b></span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsNotificationModalOpen(false)}
                                className={styles.btnActionSecondary}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
