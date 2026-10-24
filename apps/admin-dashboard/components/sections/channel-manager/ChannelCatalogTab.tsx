"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Globe,
    Search,
    Table,
    LayoutGrid,
    Check,
    Plus,
    X,
    ExternalLink,
    Radio,
    Users,
    Sparkles,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { OtaLogo } from "./OtaLogo";
import type { ChannelMappingConfig } from "./ChannelManagerSection";
import styles from "./ChannelCatalogTab.module.css";

export interface OtaCatalogItem {
    code: string;
    name: string;
    icon: string;
    defaultCommission: number;
    category: "ota" | "meta" | "wholesaler" | "vacation" | "engine" | "corporate";
}

export const CHANNEX_OTA_CATALOG: OtaCatalogItem[] = [
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

interface ChannelCatalogTabProps {
    channelConfigs: Record<string, ChannelMappingConfig>;
    onConnectChannel: (catalogItem: OtaCatalogItem) => void;
    onSelectChannel?: (channelCode: string) => void;
    onNavigateToTab?: (tab: string) => void;
}

const getCategoryBadgeClass = (category: string) => {
    switch (category) {
        case "ota":
            return styles.badgeOta;
        case "wholesaler":
            return styles.badgeWholesaler;
        case "meta":
            return styles.badgeMeta;
        case "vacation":
            return styles.badgeVacation;
        case "engine":
            return styles.badgeEngine;
        case "corporate":
            return styles.badgeCorporate;
        default:
            return styles.badgeCorporate;
    }
};

const getCategoryLabel = (category: string) => {
    switch (category) {
        case "ota":
            return "OTA Global";
        case "wholesaler":
            return "B2B Bedbank";
        case "meta":
            return "Metasearch";
        case "vacation":
            return "Vacation & Villa";
        case "engine":
            return "Direct Engine";
        case "corporate":
            return "Corporate & AI";
        default:
            return category.toUpperCase();
    }
};

export const ChannelCatalogTab: React.FC<ChannelCatalogTabProps> = ({
    channelConfigs,
    onConnectChannel,
    onSelectChannel,
    onNavigateToTab
}) => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(12);

    const categories = [
        { id: "all", label: "Semua Saluran" },
        { id: "ota", label: "OTA Populer" },
        { id: "wholesaler", label: "Bedbanks & B2B" },
        { id: "meta", label: "Metasearch" },
        { id: "vacation", label: "Vacation & Villa" },
        { id: "engine", label: "Booking Engine" },
        { id: "corporate", label: "Corporate & AI" },
        { id: "connected", label: "Terhubung" }
    ];

    const connectedCount = useMemo(() => {
        return Object.values(channelConfigs).filter(c => c.isActive).length;
    }, [channelConfigs]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {
            all: CHANNEX_OTA_CATALOG.length,
            ota: 0,
            wholesaler: 0,
            meta: 0,
            vacation: 0,
            engine: 0,
            corporate: 0,
            connected: connectedCount
        };
        CHANNEX_OTA_CATALOG.forEach(ch => {
            if (counts[ch.category] !== undefined) {
                counts[ch.category]++;
            }
        });
        return counts;
    }, [connectedCount]);

    const filteredCatalog = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return CHANNEX_OTA_CATALOG.filter(ch => {
            const matchesQuery =
                !q ||
                ch.name.toLowerCase().includes(q) ||
                ch.code.toLowerCase().includes(q) ||
                ch.category.toLowerCase().includes(q);
            if (!matchesQuery) return false;
            if (categoryFilter === "all") return true;
            if (categoryFilter === "connected") return Boolean(channelConfigs[ch.code]?.isActive);
            return ch.category === categoryFilter;
        });
    }, [searchQuery, categoryFilter, channelConfigs]);

    // Reset pagination to page 1 on filter or search changes
    useEffect(() => {
        setPage(1);
    }, [searchQuery, categoryFilter]);

    const totalPages = Math.ceil(filteredCatalog.length / pageSize) || 1;
    const paginatedCatalog = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCatalog.slice(start, start + pageSize);
    }, [filteredCatalog, page, pageSize]);

    const handleGoToTravelAgents = () => {
        if (onNavigateToTab) {
            onNavigateToTab("travel_agents");
        } else if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", "travel_agents");
            window.history.replaceState(null, "", url.toString());
            window.dispatchEvent(new CustomEvent("channel-tab-change", { detail: "travel_agents" }));
        }
    };

    return (
        <div className={styles.container}>
            {/* 1. Stat Summary Cards Strip */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statTitle}>Katalog Saluran Publik</span>
                        <div className={styles.statIconBox}>
                            <Globe size={15} />
                        </div>
                    </div>
                    <div className={styles.statValue}>
                        {CHANNEX_OTA_CATALOG.length} Saluran
                    </div>
                    <span className={styles.statSub}>
                        OTA, B2B Bedbanks &amp; Metasearch
                    </span>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statTitle}>Saluran Terhubung</span>
                        <div className={styles.statIconBoxSuccess}>
                            <Check size={16} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className={styles.statValueSuccess}>
                        {connectedCount} Saluran
                    </div>
                    <span className={styles.statSub}>
                        Live 2-Way ARI feed aktif
                    </span>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statTitle}>Protokol Sinkronisasi</span>
                        <div className={styles.statIconBox}>
                            <Radio size={15} />
                        </div>
                    </div>
                    <div className={styles.statValue}>
                        2-Way Live ARI
                    </div>
                    <span className={styles.statSub}>
                        Rates, Allotment &amp; Ingestion
                    </span>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statTitle}>Cluster Saluran</span>
                        <div className={styles.statIconBox}>
                            <Sparkles size={15} />
                        </div>
                    </div>
                    <div className={styles.statValue}>
                        6 Kategori
                    </div>
                    <span className={styles.statSub}>
                        Global, Bedbank, Direct, Corporate
                    </span>
                </div>
            </div>

            {/* 2. Main Catalog Card */}
            <div className={styles.catalogCard}>
                <div className={styles.cardHeader}>
                    <div className={styles.headerTop}>
                        <div className={styles.headerInfo}>
                            <h3 className={styles.headerTitle}>
                                <Globe size={16} className={styles.headerTitleIcon} />
                                <span>Katalog Saluran Distribusi Global (68+ OTA &amp; Wholesaler)</span>
                            </h3>
                            <p className={styles.headerDesc}>
                                Aktifkan saluran OTA, Bedbank, dan Metasearch global untuk properti Anda dengan protokol 2-Way ARI.
                            </p>
                        </div>

                        {/* View Switcher: Table View vs Grid Cards */}
                        <div className={styles.viewSwitcher}>
                            <button
                                type="button"
                                onClick={() => setViewMode("table")}
                                className={`${styles.viewBtn} ${viewMode === "table" ? styles.viewBtnActive : ""}`}
                                title="Tampilan Tabel Kompak"
                            >
                                <Table size={13} />
                                <span>Tabel</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
                                title="Tampilan Kartu Grid"
                            >
                                <LayoutGrid size={13} />
                                <span>Grid</span>
                            </button>
                        </div>
                    </div>

                    {/* Toolbar: Search input and Category pills */}
                    <div className={styles.toolbar}>
                        <div className={styles.searchWrapper}>
                            <Search size={14} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Cari nama saluran (Booking, Agoda, Traveloka, Airbnb)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className={styles.searchClearBtn}
                                    title="Bersihkan pencarian"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Category filter pills with dynamic count badges */}
                        <div className={styles.categoryPillsList}>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategoryFilter(cat.id)}
                                    className={`${styles.categoryPill} ${categoryFilter === cat.id ? styles.categoryPillActive : ""}`}
                                >
                                    <span>{cat.label}</span>
                                    <span className={`${styles.categoryCountBadge} ${categoryFilter === cat.id ? styles.categoryCountBadgeActive : ""}`}>
                                        {categoryCounts[cat.id] ?? 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filteredCatalog.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIconBox}>
                            <Globe size={22} />
                        </div>
                        <div>
                            <h4 className={styles.emptyTitle}>Tidak ada saluran ditemukan</h4>
                            <p className={styles.emptyDesc}>
                                Tidak ada saluran OTA yang cocok dengan kata kunci &quot;{searchQuery}&quot; atau filter yang dipilih.
                            </p>
                        </div>
                        <div className={styles.emptyActions}>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setCategoryFilter("all");
                                }}
                                className={styles.btnConnect}
                            >
                                Reset Filter
                            </button>
                            <button
                                type="button"
                                onClick={handleGoToTravelAgents}
                                className={styles.categoryPillActive}
                                style={{ padding: "6px 14px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", border: "none" }}
                            >
                                <Users size={12} />
                                <span>Buka Travel Agent Offline / B2B</span>
                            </button>
                        </div>
                    </div>
                ) : viewMode === "table" ? (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr className={styles.tableHeaderRow}>
                                    <th className={`${styles.th} ${styles.thDistribution}`}>Saluran Distribusi</th>
                                    <th className={styles.th}>Kategori</th>
                                    <th className={styles.th}>Komisi OTA</th>
                                    <th className={styles.th}>Protokol Transmisi</th>
                                    <th className={styles.th}>Status</th>
                                    <th className={`${styles.th} ${styles.thAction}`}>Aksi Hubungkan</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                                {paginatedCatalog.map(ch => {
                                    const isConnected = Boolean(channelConfigs[ch.code]?.isActive);
                                    return (
                                        <tr key={ch.code} className={styles.tableRow}>
                                            <td className={`${styles.td} ${styles.tdDistribution}`}>
                                                <div className={styles.channelIdentity}>
                                                    <div className={styles.channelLogoBox}>
                                                        <OtaLogo code={ch.code} name={ch.name} size={16} />
                                                    </div>
                                                    <div>
                                                        <div className={styles.channelName}>{ch.name}</div>
                                                        <div className={styles.channelCode}>
                                                            Code: {ch.code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <span className={`${styles.categoryBadgeBase} ${getCategoryBadgeClass(ch.category)}`}>
                                                    {getCategoryLabel(ch.category)}
                                                </span>
                                            </td>
                                            <td className={styles.td}>
                                                {ch.defaultCommission === 0 ? (
                                                    <span className={styles.commissionTagDirect}>
                                                        0% (Direct)
                                                    </span>
                                                ) : (
                                                    <span className={styles.commissionTag}>
                                                        {ch.defaultCommission}%
                                                    </span>
                                                )}
                                            </td>
                                            <td className={styles.td}>
                                                <span className={styles.protocolTag}>
                                                    <span className={styles.protocolDot} />
                                                    <span>2-Way Live ARI</span>
                                                </span>
                                            </td>
                                            <td className={styles.td}>
                                                {isConnected ? (
                                                    <span className={styles.statusBadgeConnected}>
                                                        <Check size={11} strokeWidth={2.5} />
                                                        <span>Terhubung</span>
                                                    </span>
                                                ) : (
                                                    <span className={styles.statusBadgeAvailable}>
                                                        Tersedia
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`${styles.td} ${styles.tdAction}`}>
                                                {isConnected ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onSelectChannel?.(ch.code)}
                                                        className={styles.btnConnected}
                                                    >
                                                        <Check size={12} strokeWidth={2.5} />
                                                        <span>Terhubung</span>
                                                        <span style={{ color: "#6ee7b7" }}>•</span>
                                                        <span className={styles.btnManageLabel}>Kelola</span>
                                                        <ExternalLink size={10} style={{ opacity: 0.8 }} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onConnectChannel(ch)}
                                                        className={styles.btnConnect}
                                                    >
                                                        <Plus size={12} style={{ color: "#71717a" }} />
                                                        <span>Hubungkan</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.gridBody}>
                        <div className={styles.cardsGrid}>
                            {paginatedCatalog.map(ch => {
                                const isConnected = Boolean(channelConfigs[ch.code]?.isActive);
                                return (
                                    <div
                                        key={ch.code}
                                        className={`${styles.cardItem} ${isConnected ? styles.cardItemConnected : ""}`}
                                    >
                                        <div>
                                            <div className={styles.cardTopRow}>
                                                <div className={styles.channelIdentity}>
                                                    <div className={styles.cardLogoBox}>
                                                        <OtaLogo code={ch.code} name={ch.name} size={18} />
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div className={styles.cardTitle} title={ch.name}>
                                                            {ch.name}
                                                        </div>
                                                        <div className={styles.channelCode}>
                                                            {ch.code}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`${styles.categoryBadgeBase} ${getCategoryBadgeClass(ch.category)}`}>
                                                    {getCategoryLabel(ch.category)}
                                                </span>
                                            </div>

                                            <div className={styles.cardMetaRow}>
                                                <span>Komisi OTA:</span>
                                                <span className={styles.cardMetaVal}>
                                                    {ch.defaultCommission === 0 ? "0% (Direct)" : `${ch.defaultCommission}%`}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            {isConnected ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectChannel?.(ch.code)}
                                                    className={styles.btnGridConnected}
                                                >
                                                    <Check size={12} strokeWidth={2.5} />
                                                    <span>Terhubung • Kelola</span>
                                                    <ExternalLink size={11} style={{ opacity: 0.8 }} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => onConnectChannel(ch)}
                                                    className={styles.btnGridConnect}
                                                >
                                                    <Plus size={12} style={{ color: "#71717a" }} />
                                                    <span>Hubungkan Saluran</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. Pagination Bar */}
                {filteredCatalog.length > 0 && (
                    <div className={styles.paginationBar}>
                        <div className={styles.paginationSummary}>
                            <span>
                                Menampilkan <b>{(page - 1) * pageSize + 1}</b> - <b>{Math.min(page * pageSize, filteredCatalog.length)}</b> dari <b>{filteredCatalog.length}</b> saluran
                            </span>
                            <span className={styles.divider}>|</span>
                            <div className={styles.pageSizeGroup}>
                                <span className={styles.pageSizeLabel}>Per halaman:</span>
                                {[12, 24, 48].map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => {
                                            setPageSize(size);
                                            setPage(1);
                                        }}
                                        className={`${styles.pageSizeBtn} ${pageSize === size ? styles.pageSizeBtnActive : ""}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.paginationControls}>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page <= 1}
                                className={styles.pageNavBtn}
                            >
                                <ChevronLeft size={13} />
                                <span>Sebelumnya</span>
                            </button>

                            <div className={styles.pageNumberGroup}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                    if (
                                        p === 1 ||
                                        p === totalPages ||
                                        (p >= page - 1 && p <= page + 1)
                                    ) {
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPage(p)}
                                                className={`${styles.pageNumberBtn} ${page === p ? styles.pageNumberBtnActive : ""}`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    } else if (p === page - 2 || p === page + 2) {
                                        return <span key={p} className={styles.pageDots}>...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={page >= totalPages}
                                className={styles.pageNavBtn}
                            >
                                <span>Selanjutnya</span>
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


