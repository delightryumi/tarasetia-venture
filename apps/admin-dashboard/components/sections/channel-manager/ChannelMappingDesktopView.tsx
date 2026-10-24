"use client";

import React, { useState, useMemo } from "react";
import {
    Globe,
    Layers,
    Search,
    RefreshCw,
    CheckCircle2,
    Zap,
    RotateCcw,
    Trash2,
    Save,
    X,
    Key,
    BedDouble,
    Sliders
} from "lucide-react";
import { OtaLogo } from "./OtaLogo";
import type { ChannelMappingConfig } from "./ChannelManagerSection";
import styles from "./ChannelMappingDesktopView.module.css";

const PRESET_CORE_CHANNELS = [
    {
        code: "traveloka",
        name: "Traveloka",
        category: "Major OTA Indonesia & SEA",
        defaultCommission: 18,
        desc: "Saluran distribusi hotel terbesar di Indonesia dan Asia Tenggara dengan jutaan pengguna harian.",
        speed: "Instant ARI Sync",
        badge: "Paling Populer"
    },
    {
        code: "booking_com",
        name: "Booking.com",
        category: "Global Enterprise OTA",
        defaultCommission: 15,
        desc: "Jaringan distribusi akomodasi global terkemuka untuk menarik wisatawan mancanegara.",
        speed: "Real-time 2-Way",
        badge: "Global #1"
    },
    {
        code: "agoda",
        name: "Agoda",
        category: "Asia Pacific Leader",
        defaultCommission: 17,
        desc: "OTA utama untuk segmen pasar Asia Pasifik dengan program promosi andalan Agoda VIP.",
        speed: "Instant ARI Sync",
        badge: "APAC Leader"
    },
    {
        code: "tiket",
        name: "Tiket.com",
        category: "Indonesian Major OTA",
        defaultCommission: 15,
        desc: "Platform perjalanan domestik terkemuka dengan program Blibli Rewards & promo lokal.",
        speed: "2-Way Direct",
        badge: "Domestik SEA"
    },
    {
        code: "expedia",
        name: "Expedia Partner Solutions",
        category: "North America & Global",
        defaultCommission: 18,
        desc: "Jangkauan pemesanan luas mencakup Expedia, Hotels.com, Vrbo, dan corporate B2B.",
        speed: "Direct ARI",
        badge: "Global Wholesaler"
    },
    {
        code: "airbnb",
        name: "Airbnb",
        category: "Unique Stays & Vacation",
        defaultCommission: 14,
        desc: "Konektivitas langsung untuk villa, resort, boutique stays, dan apartemen.",
        speed: "2-Way Calendar",
        badge: "Vacation Rental"
    }
];

export interface ChannelMappingDesktopViewProps {
    hotelCode: string;
    hotelName?: string;
    hotelCurrency: string;
    channelConfigs: Record<string, ChannelMappingConfig>;
    activeChannelsList: ChannelMappingConfig[];
    selectedChannelCode: string;
    setSelectedChannelCode: (code: string) => void;
    roomTypes: any[];
    ratePlans: any[];
    onOpenAddChannelModal: () => void;
    onConnectPresetChannel: (presetItem: any) => void;
    onSaveAll: () => Promise<void>;
    savingSettings: boolean;
    onDisconnectChannel: (code: string, name: string) => void;
    onResetMappings: (code: string, name: string) => void;
    onClearRoomMapping: (code: string, roomTypeId: string) => void;
    onClearRateMapping: (code: string, mappingKey: string, ratePlanId?: string) => void;
    updateChannelField: (code: string, field: keyof ChannelMappingConfig, value: any) => void;
    onSyncSingleChannelToChannex: (code: string) => Promise<void>;
    syncingChannex: boolean;
    onTestOtaConnection: (code: string) => Promise<void>;
    testingOta: boolean;
    onFetchOtaMapping: (code: string) => Promise<void>;
    fetchingOtaMapping: boolean;
    onPingTest: (type: "room_type" | "rate_plan", id: string, channexId?: string, otaId?: string) => Promise<void>;
    pingingMap: Record<string, boolean>;
    otaExtranetRooms: Record<string, any[]>;
}

export const ChannelMappingDesktopView: React.FC<ChannelMappingDesktopViewProps> = ({
    hotelCode,
    hotelName,
    hotelCurrency,
    channelConfigs,
    activeChannelsList,
    selectedChannelCode,
    setSelectedChannelCode,
    roomTypes,
    ratePlans,
    onOpenAddChannelModal,
    onConnectPresetChannel,
    onSaveAll,
    savingSettings,
    onDisconnectChannel,
    onResetMappings,
    onClearRoomMapping,
    onClearRateMapping,
    updateChannelField,
    onSyncSingleChannelToChannex,
    syncingChannex,
    onTestOtaConnection,
    testingOta,
    onFetchOtaMapping,
    fetchingOtaMapping,
    onPingTest,
    pingingMap,
    otaExtranetRooms
}) => {
    const [searchMaster, setSearchMaster] = useState<string>("");

    const currentChannel = channelConfigs[selectedChannelCode] || (activeChannelsList.length > 0 ? activeChannelsList[0] : null);

    const filteredMasterChannels = useMemo(() => {
        const q = searchMaster.trim().toLowerCase();
        if (!q) return activeChannelsList;
        return activeChannelsList.filter(c =>
            c.channelName.toLowerCase().includes(q) ||
            c.channelCode.toLowerCase().includes(q)
        );
    }, [activeChannelsList, searchMaster]);

    const currentOtaRates = useMemo(() => {
        if (!selectedChannelCode || !otaExtranetRooms[selectedChannelCode]) return [];
        const rates: Array<{ id: string; title: string; roomId: string }> = [];
        otaExtranetRooms[selectedChannelCode].forEach(r => {
            (r.rates || []).forEach((rate: any) => {
                rates.push({
                    id: String(rate.id),
                    title: `${r.title ? r.title + " : " : ""}${rate.title || "Standard"}`,
                    roomId: String(r.id)
                });
            });
        });
        return rates;
    }, [selectedChannelCode, otaExtranetRooms]);

    // Case 1: No connected channels yet -> Launchpad
    if (activeChannelsList.length === 0) {
        return (
            <div className={styles.launchpadContainer}>
                <div className={styles.launchpadBanner}>
                    <div className={styles.launchpadBannerInfo}>
                        <div className={styles.launchpadBannerIconBox}>
                            <Globe size={18} />
                        </div>
                        <div className={styles.launchpadBannerText}>
                            <div className={styles.launchpadBannerHeader}>
                                <h3 className={styles.launchpadBannerTitle}>
                                    Hub Distribusi Saluran OTA (Channex CRS)
                                </h3>
                                <span className={styles.launchpadPill}>68+ Saluran Tersedia</span>
                            </div>
                            <p className={styles.launchpadBannerDesc}>
                                Belum ada saluran aktif. Hubungkan saluran favorit Anda di bawah untuk mengaktifkan sinkronisasi kamar, rate plan, dan paritas tarif instan.
                            </p>
                        </div>
                    </div>
                    <div className={styles.launchpadBannerActions}>
                        <button
                            type="button"
                            onClick={onOpenAddChannelModal}
                            className={styles.btnPrimaryAction}
                        >
                            <Layers size={13} />
                            <span>Buka Katalog Saluran</span>
                        </button>
                    </div>
                </div>

                <div className={styles.launchpadGrid}>
                    {PRESET_CORE_CHANNELS.map(ch => (
                        <div key={ch.code} className={styles.launchpadCard}>
                            <div className={styles.launchpadCardTop}>
                                <div className={styles.launchpadCardHeader}>
                                    <div className={styles.launchpadBrandLockup}>
                                        <div className={styles.launchpadLogoBox}>
                                            <OtaLogo code={ch.code} name={ch.name} size={22} />
                                        </div>
                                        <div>
                                            <h4 className={styles.launchpadChannelName}>{ch.name}</h4>
                                            <span className={styles.launchpadChannelCategory}>{ch.category}</span>
                                        </div>
                                    </div>
                                    <span className={styles.launchpadBadge}>{ch.badge}</span>
                                </div>
                                <p style={{ fontSize: "11.5px", color: "#52525b", lineHeight: 1.45, margin: 0 }}>
                                    {ch.desc}
                                </p>
                                <div className={styles.launchpadMetricsGrid}>
                                    <div className={styles.launchpadMetricItem}>
                                        <span className={styles.launchpadMetricLabel}>Standar Komisi</span>
                                        <span className={styles.launchpadMetricValue}>{ch.defaultCommission}%</span>
                                    </div>
                                    <div className={styles.launchpadMetricItem}>
                                        <span className={styles.launchpadMetricLabel}>Kecepatan ARI</span>
                                        <span className={styles.launchpadMetricValue}>{ch.speed}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.launchpadCardFooter}>
                                <button
                                    type="button"
                                    onClick={() => onConnectPresetChannel(ch)}
                                    className={styles.btnLaunchpadConnect}
                                >
                                    <span>Aktifkan {ch.name}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.desktopContainer}>
            <div className={styles.masterDetailLayout}>
                {/* ── LEFT PANEL: CHANNELS LIST ── */}
                <div className={styles.masterPanel}>
                    <div className={styles.masterHeader}>
                        <div className={styles.masterHeaderTop}>
                            <div className={styles.masterTitleWrap}>
                                <span>Saluran Terhubung</span>
                                <span className={styles.channelBadgeCount}>{activeChannelsList.length}</span>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenAddChannelModal}
                                className={styles.btnPrimaryAction}
                                style={{ height: "28px", padding: "0 10px", fontSize: "11px" }}
                            >
                                + Tambah
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari saluran..."
                            value={searchMaster}
                            onChange={(e) => setSearchMaster(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.channelList}>
                        {filteredMasterChannels.map(ch => {
                            const isSelected = ch.channelCode === selectedChannelCode;
                            const roomCount = Object.keys(ch.roomMappings || {}).length;
                            const rateCount = Object.keys(ch.rateMappings || {}).length;

                            return (
                                <button
                                    key={ch.channelCode}
                                    type="button"
                                    onClick={() => setSelectedChannelCode(ch.channelCode)}
                                    className={`${styles.channelItemBtn} ${isSelected ? styles.channelItemBtnActive : ""}`}
                                >
                                    <div className={styles.channelItemLogoWrap}>
                                        <OtaLogo code={ch.channelCode} name={ch.channelName} size={16} />
                                    </div>
                                    <div className={styles.channelItemInfo}>
                                        <span className={styles.channelItemName}>{ch.channelName}</span>
                                        <span className={styles.channelItemMeta}>{roomCount} kamar • {rateCount} rate</span>
                                    </div>
                                    {ch.hotelId ? (
                                        <span className={styles.statusDotGreen} title="Hotel ID Terisi" />
                                    ) : (
                                        <span className={styles.statusDotAmber} title="Hotel ID Belum Diisi" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── RIGHT PANEL: DETAILS & MAPPINGS ── */}
                {currentChannel ? (
                    <div className={styles.detailPanel}>
                        {/* Header Banner */}
                        <div className={styles.detailHeader}>
                            <div className={styles.detailTitleLockup}>
                                <div className={styles.detailLogoBox}>
                                    <OtaLogo code={currentChannel.channelCode} name={currentChannel.channelName} size={24} />
                                </div>
                                <div>
                                    <h3 className={styles.detailChannelName}>{currentChannel.channelName}</h3>
                                    <div className={styles.detailChannelMeta}>
                                        <span>Code: <code className={styles.channelCodeBadge}>{currentChannel.channelCode}</code></span>
                                        <span>•</span>
                                        <span className={styles.pricingModelTag}>
                                            {currentChannel.pricingModel?.toUpperCase() || "GROSS"} PRICING
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.actionsToolbar}>
                                <button
                                    type="button"
                                    onClick={() => onSyncSingleChannelToChannex(currentChannel.channelCode)}
                                    disabled={syncingChannex}
                                    className={styles.btnPrimaryAction}
                                >
                                    <RefreshCw size={12} className={syncingChannex ? "animate-spin" : ""} />
                                    <span>Sync Saluran</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onTestOtaConnection(currentChannel.channelCode)}
                                    disabled={testingOta}
                                    className={styles.btnSecondaryAction}
                                >
                                    <CheckCircle2 size={12} color="#059669" />
                                    <span>Tes Koneksi</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onFetchOtaMapping(currentChannel.channelCode)}
                                    disabled={fetchingOtaMapping}
                                    className={styles.btnSecondaryAction}
                                    title="Tarik data kamar dan rate langsung dari OTA Extranet"
                                >
                                    <Zap size={12} color="#d97706" />
                                    <span>Tarik Kamar OTA</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onResetMappings(currentChannel.channelCode, currentChannel.channelName)}
                                    className={styles.btnIconAction}
                                    title="Bersihkan pemetaan kamar dan rate plan"
                                    aria-label="Bersihkan pemetaan"
                                >
                                    <RotateCcw size={12} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onDisconnectChannel(currentChannel.channelCode, currentChannel.channelName)}
                                    className={styles.btnDangerIconAction}
                                    title="Putuskan saluran ini"
                                    aria-label="Putuskan saluran"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        {/* SECTION 1: Credentials & Commission */}
                        <div className={styles.configSectionCard}>
                            <div className={styles.sectionHeader}>
                                <Key size={13} />
                                <span>Kredensial &amp; Konfigurasi Komisi</span>
                            </div>

                            <div className={styles.configFieldsGrid}>
                                <div className={styles.fieldItem}>
                                    <label className={styles.fieldLabel}>Extranet Hotel ID</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 1048293"
                                        value={currentChannel.hotelId || ""}
                                        onChange={(e) => updateChannelField(currentChannel.channelCode, "hotelId", e.target.value)}
                                        className={styles.fieldInput}
                                    />
                                    <span className={styles.fieldHint}>ID Properti di extranet OTA</span>
                                </div>

                                <div className={styles.fieldItem}>
                                    <label className={styles.fieldLabel}>Model Tarif Saluran</label>
                                    <select
                                        value={currentChannel.pricingModel || "gross"}
                                        onChange={(e) => updateChannelField(currentChannel.channelCode, "pricingModel", e.target.value as any)}
                                        className={styles.fieldSelect}
                                    >
                                        <option value="gross">Gross Rate (Harga Jual Konsumen)</option>
                                        <option value="net">Net Rate (Harga Bersih Hotel)</option>
                                    </select>
                                    <span className={styles.fieldHint}>Format harga yang dikirim ke OTA</span>
                                </div>

                                <div className={styles.fieldItem}>
                                    <label className={styles.fieldLabel}>Komisi OTA (%)</label>
                                    <input
                                        type="number"
                                        value={currentChannel.commissionPercent ?? 18}
                                        onChange={(e) => updateChannelField(currentChannel.channelCode, "commissionPercent", Number(e.target.value))}
                                        className={styles.fieldInput}
                                    />
                                    <span className={styles.fieldHint}>Persentase komisi pemotongan</span>
                                </div>

                                <div className={styles.fieldItem}>
                                    <label className={styles.fieldLabel}>Custom Markup (%)</label>
                                    <input
                                        type="number"
                                        value={currentChannel.markupPercent ?? 0}
                                        onChange={(e) => updateChannelField(currentChannel.channelCode, "markupPercent", Number(e.target.value))}
                                        className={styles.fieldInput}
                                    />
                                    <span className={styles.fieldHint}>Markup harga tambahan hotel</span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Room Type Mapping */}
                        <div className={styles.mappingBlock}>
                            <div className={styles.mappingBlockHeader}>
                                <div className={styles.sectionHeader}>
                                    <BedDouble size={13} />
                                    <span>Pemetaan Tipe Kamar (PMS : {currentChannel.channelName})</span>
                                </div>
                                <span className={styles.mappingCount}>
                                    {Object.keys(currentChannel.roomMappings || {}).length} / {roomTypes.length} Kamar Terpetakan
                                </span>
                            </div>

                            <div className={styles.mappingListWrap}>
                                {roomTypes.map(rt => {
                                    const currentOtaRoomId = currentChannel.roomMappings?.[rt.id] || "";
                                    const isMapped = Boolean(currentOtaRoomId);

                                    return (
                                        <div key={rt.id} className={styles.mappingRow}>
                                            <div className={styles.mappingIdentity}>
                                                <div className={styles.mappingItemName} title={rt.name}>{rt.name}</div>
                                                <div className={styles.mappingItemMeta}>
                                                    ID: {rt.id?.slice(0, 8)} • Allotment: {rt.totalRooms || 1} Kamar
                                                </div>
                                            </div>

                                            <div className={styles.mappingControlWrap}>
                                                {otaExtranetRooms[currentChannel.channelCode]?.length ? (
                                                    <select
                                                        value={currentOtaRoomId}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            updateChannelField(currentChannel.channelCode, "roomMappings", {
                                                                ...(currentChannel.roomMappings || {}),
                                                                [rt.id]: val
                                                            });
                                                        }}
                                                        className={styles.mappingSelect}
                                                    >
                                                        <option value="">-- Pilih Kamar OTA Extranet --</option>
                                                        {otaExtranetRooms[currentChannel.channelCode].map((otaR: any) => (
                                                            <option key={otaR.id} value={String(otaR.id)}>
                                                                {otaR.title || otaR.name} (ID: {otaR.id})
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="Masukkan OTA Room ID..."
                                                        value={currentOtaRoomId}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            updateChannelField(currentChannel.channelCode, "roomMappings", {
                                                                ...(currentChannel.roomMappings || {}),
                                                                [rt.id]: val
                                                            });
                                                        }}
                                                        className={styles.fieldInput}
                                                        style={{ height: "32px", width: "100%" }}
                                                    />
                                                )}

                                                {isMapped && (
                                                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => onPingTest("room_type", rt.id, undefined, currentOtaRoomId)}
                                                            disabled={pingingMap[rt.id]}
                                                            className={styles.btnIconAction}
                                                            title="Tes ping mapping kamar ini"
                                                            aria-label="Tes ping mapping kamar ini"
                                                        >
                                                            <RefreshCw size={11} className={pingingMap[rt.id] ? "animate-spin" : ""} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => onClearRoomMapping(currentChannel.channelCode, rt.id)}
                                                            className={styles.btnDangerIconAction}
                                                            title="Hapus pemetaan kamar ini"
                                                            aria-label="Hapus pemetaan kamar ini"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION 3: Rate Plan Mapping */}
                        <div className={styles.mappingBlock}>
                            <div className={styles.mappingBlockHeader}>
                                <div className={styles.sectionHeader}>
                                    <Sliders size={13} />
                                    <span>Pemetaan Rate Plan (PMS : {currentChannel.channelName})</span>
                                </div>
                                <span className={styles.mappingCount}>
                                    {Object.keys(currentChannel.rateMappings || {}).length} Rate Terpetakan
                                </span>
                            </div>

                            <div className={styles.mappingListWrap}>
                                {ratePlans.map(rp => {
                                    const currentOtaRateId = currentChannel.rateMappings?.[rp.id] || "";
                                    const isMapped = Boolean(currentOtaRateId);

                                    return (
                                        <div key={rp.id} className={styles.mappingRow}>
                                            <div className={styles.mappingIdentity}>
                                                <div className={styles.mappingItemName} title={rp.name}>{rp.name}</div>
                                                <div className={styles.mappingItemMeta}>
                                                    Code: {rp.code || rp.id?.slice(0, 8)} • Meal: {rp.mealPlan || "RO"}
                                                </div>
                                            </div>

                                            <div className={styles.mappingControlWrap}>
                                                {currentOtaRates.length > 0 ? (
                                                    <select
                                                        value={currentOtaRateId}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            updateChannelField(currentChannel.channelCode, "rateMappings", {
                                                                ...(currentChannel.rateMappings || {}),
                                                                [rp.id]: val
                                                            });
                                                        }}
                                                        className={styles.mappingSelect}
                                                    >
                                                        <option value="">-- Pilih Rate OTA Extranet --</option>
                                                        {currentOtaRates.map(otaRate => (
                                                            <option key={otaRate.id} value={otaRate.id}>
                                                                {otaRate.title} (ID: {otaRate.id})
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="Masukkan OTA Rate Plan ID..."
                                                        value={currentOtaRateId}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            updateChannelField(currentChannel.channelCode, "rateMappings", {
                                                                ...(currentChannel.rateMappings || {}),
                                                                [rp.id]: val
                                                            });
                                                        }}
                                                        className={styles.fieldInput}
                                                        style={{ height: "32px", width: "100%" }}
                                                    />
                                                )}

                                                {isMapped && (
                                                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => onPingTest("rate_plan", rp.id, undefined, currentOtaRateId)}
                                                            disabled={pingingMap[rp.id]}
                                                            className={styles.btnIconAction}
                                                            title="Tes ping mapping rate ini"
                                                            aria-label="Tes ping mapping rate ini"
                                                        >
                                                            <RefreshCw size={11} className={pingingMap[rp.id] ? "animate-spin" : ""} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => onClearRateMapping(currentChannel.channelCode, rp.id, rp.id)}
                                                            className={styles.btnDangerIconAction}
                                                            title="Hapus pemetaan rate ini"
                                                            aria-label="Hapus pemetaan rate ini"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Save Changes Footer */}
                        <div className={styles.saveBottomBar}>
                            <span className={styles.saveNotice}>
                                Pastikan klik <b>Simpan Konfigurasi Saluran</b> agar perubahan tersimpan ke Firestore &amp; Channel Manager.
                            </span>
                            <button
                                type="button"
                                onClick={onSaveAll}
                                disabled={savingSettings}
                                className={styles.btnPrimaryAction}
                                style={{ height: "36px", padding: "0 18px" }}
                            >
                                <Save size={13} className={savingSettings ? "animate-spin" : ""} />
                                <span>{savingSettings ? "Menyimpan..." : "Simpan Konfigurasi Saluran"}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: "48px", textAlign: "center", fontSize: "12px", color: "#71717a", background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px" }}>
                        Pilih saluran di sebelah kiri untuk melihat dan mengelola pemetaan.
                    </div>
                )}
            </div>
        </div>
    );
};
