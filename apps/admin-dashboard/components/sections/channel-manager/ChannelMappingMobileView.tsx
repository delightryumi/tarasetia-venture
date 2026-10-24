"use client";

import React, { useMemo } from "react";
import {
    Globe,
    Layers,
    Plus,
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
import styles from "./ChannelMappingMobileView.module.css";

const PRESET_CORE_CHANNELS = [
    {
        code: "traveloka",
        name: "Traveloka",
        category: "Major OTA Indonesia & SEA",
        defaultCommission: 18,
        desc: "Saluran distribusi hotel terbesar di Indonesia dan Asia Tenggara.",
        speed: "Instant ARI Sync",
        badge: "Paling Populer"
    },
    {
        code: "booking_com",
        name: "Booking.com",
        category: "Global Enterprise OTA",
        defaultCommission: 15,
        desc: "Jaringan distribusi akomodasi global terkemuka.",
        speed: "Real-time 2-Way",
        badge: "Global #1"
    },
    {
        code: "agoda",
        name: "Agoda",
        category: "Asia Pacific Leader",
        defaultCommission: 17,
        desc: "OTA utama untuk segmen pasar Asia Pasifik.",
        speed: "Instant ARI Sync",
        badge: "APAC Leader"
    },
    {
        code: "tiket",
        name: "Tiket.com",
        category: "Indonesian Major OTA",
        defaultCommission: 15,
        desc: "Platform perjalanan domestik terkemuka.",
        speed: "2-Way Direct",
        badge: "Domestik SEA"
    },
    {
        code: "expedia",
        name: "Expedia Partner Solutions",
        category: "North America & Global",
        defaultCommission: 18,
        desc: "Jangkauan pemesanan luas mencakup Expedia, Hotels.com.",
        speed: "Direct ARI",
        badge: "Global Wholesaler"
    },
    {
        code: "airbnb",
        name: "Airbnb",
        category: "Unique Stays & Vacation",
        defaultCommission: 14,
        desc: "Konektivitas langsung untuk villa dan resort.",
        speed: "2-Way Calendar",
        badge: "Vacation Rental"
    }
];

export interface ChannelMappingMobileViewProps {
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

export const ChannelMappingMobileView: React.FC<ChannelMappingMobileViewProps> = ({
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
    const currentChannel = channelConfigs[selectedChannelCode] || (activeChannelsList.length > 0 ? activeChannelsList[0] : null);

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

    // Case 1: No connected channels yet -> Mobile Launchpad
    if (activeChannelsList.length === 0) {
        return (
            <div className={styles.mobileContainer}>
                <div className={styles.launchpadMobileBanner}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className={styles.launchpadMobileIconBox}>
                            <Globe size={16} />
                        </div>
                        <div>
                            <h3 className={styles.launchpadMobileTitle}>Distribusi Saluran OTA</h3>
                            <span style={{ fontSize: "10.5px", color: "#71717a" }}>68+ Saluran Global</span>
                        </div>
                    </div>
                    <p className={styles.launchpadMobileDesc}>
                        Hubungkan saluran OTA favorit Anda di bawah untuk mengaktifkan sinkronisasi kamar dan tarif.
                    </p>
                    <button
                        type="button"
                        onClick={onOpenAddChannelModal}
                        className={styles.btnMobileConnect}
                    >
                        <Layers size={13} style={{ marginRight: "6px" }} />
                        <span>Buka Katalog Saluran</span>
                    </button>
                </div>

                <div className={styles.launchpadMobileList}>
                    {PRESET_CORE_CHANNELS.map(ch => (
                        <div key={ch.code} className={styles.launchpadMobileCard}>
                            <div className={styles.launchpadMobileCardHeader}>
                                <div className={styles.launchpadMobileIdentity}>
                                    <OtaLogo code={ch.code} name={ch.name} size={20} />
                                    <div>
                                        <div className={styles.launchpadMobileName}>{ch.name}</div>
                                        <div className={styles.launchpadMobileMeta}>Komisi {ch.defaultCommission}% • {ch.speed}</div>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onConnectPresetChannel(ch)}
                                className={styles.btnMobileConnect}
                            >
                                <span>Aktifkan {ch.name}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.mobileContainer}>
            {/* ── Top Swipeable Channel Pills ── */}
            <div className={styles.channelSelectorBar}>
                {activeChannelsList.map(ch => {
                    const isSelected = ch.channelCode === selectedChannelCode;
                    return (
                        <button
                            key={ch.channelCode}
                            type="button"
                            onClick={() => setSelectedChannelCode(ch.channelCode)}
                            className={`${styles.channelSelectorPill} ${isSelected ? styles.channelSelectorPillActive : ""}`}
                        >
                            <OtaLogo code={ch.channelCode} name={ch.channelName} size={14} />
                            <span>{ch.channelName}</span>
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={onOpenAddChannelModal}
                    className={styles.addPillBtn}
                >
                    <Plus size={12} />
                    <span>Tambah</span>
                </button>
            </div>

            {/* ── Active Channel Card ── */}
            {currentChannel && (
                <div className={styles.channelDetailCard}>
                    {/* Header with Title and Actions */}
                    <div className={styles.channelDetailHeader}>
                        <div className={styles.channelTitleIdentity}>
                            <OtaLogo code={currentChannel.channelCode} name={currentChannel.channelName} size={22} />
                            <div>
                                <div className={styles.channelTitleName}>{currentChannel.channelName}</div>
                                <div className={styles.channelTitleCode}>
                                    Code: <code>{currentChannel.channelCode}</code> • {currentChannel.pricingModel?.toUpperCase() || "GROSS"}
                                </div>
                            </div>
                        </div>

                        <div className={styles.mobileToolbar}>
                            <button
                                type="button"
                                onClick={() => onResetMappings(currentChannel.channelCode, currentChannel.channelName)}
                                className={styles.mobileBtnIcon}
                                title="Reset pemetaan"
                                aria-label="Reset pemetaan"
                            >
                                <RotateCcw size={12} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDisconnectChannel(currentChannel.channelCode, currentChannel.channelName)}
                                className={styles.mobileBtnDangerIcon}
                                title="Putus saluran"
                                aria-label="Putus saluran"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Sync & Ping Actions */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={() => onSyncSingleChannelToChannex(currentChannel.channelCode)}
                            disabled={syncingChannex}
                            className={styles.mobileBtnAction}
                        >
                            <RefreshCw size={11} className={syncingChannex ? "animate-spin" : ""} />
                            <span>Sync ARI</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onTestOtaConnection(currentChannel.channelCode)}
                            disabled={testingOta}
                            className={styles.mobileBtnAction}
                        >
                            <CheckCircle2 size={11} color="#059669" />
                            <span>Tes Koneksi</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onFetchOtaMapping(currentChannel.channelCode)}
                            disabled={fetchingOtaMapping}
                            className={styles.mobileBtnAction}
                        >
                            <Zap size={11} color="#d97706" />
                            <span>Tarik Kamar</span>
                        </button>
                    </div>

                    {/* SECTION 1: Kredensial & Komisi Card */}
                    <div className={styles.mobileSectionCard}>
                        <div className={styles.mobileSectionTitle}>
                            <Key size={12} />
                            <span>Kredensial &amp; Komisi</span>
                        </div>

                        <div className={styles.mobileFieldRow}>
                            <label className={styles.mobileFieldLabel}>Extranet Hotel ID</label>
                            <input
                                type="text"
                                placeholder="Contoh: 1048293"
                                value={currentChannel.hotelId || ""}
                                onChange={(e) => updateChannelField(currentChannel.channelCode, "hotelId", e.target.value)}
                                className={styles.mobileInput}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div className={styles.mobileFieldRow}>
                                <label className={styles.mobileFieldLabel}>Komisi (%)</label>
                                <input
                                    type="number"
                                    value={currentChannel.commissionPercent ?? 18}
                                    onChange={(e) => updateChannelField(currentChannel.channelCode, "commissionPercent", Number(e.target.value))}
                                    className={styles.mobileInput}
                                />
                            </div>

                            <div className={styles.mobileFieldRow}>
                                <label className={styles.mobileFieldLabel}>Model Tarif</label>
                                <select
                                    value={currentChannel.pricingModel || "gross"}
                                    onChange={(e) => updateChannelField(currentChannel.channelCode, "pricingModel", e.target.value as any)}
                                    className={styles.mobileSelect}
                                >
                                    <option value="gross">Gross</option>
                                    <option value="net">Net</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Pemetaan Kamar Card-Reflow */}
                    <div className={styles.mobileSectionCard}>
                        <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between", justifyContent: "space-between" }}>
                            <div className={styles.mobileSectionTitle}>
                                <BedDouble size={12} />
                                <span>Pemetaan Kamar</span>
                            </div>
                            <span style={{ fontSize: "10.5px", color: "#71717a", fontFamily: "var(--font-geist-mono, monospace)" }}>
                                {Object.keys(currentChannel.roomMappings || {}).length} / {roomTypes.length}
                            </span>
                        </div>

                        <div className={styles.mobileMappingList}>
                            {roomTypes.map(rt => {
                                const currentOtaRoomId = currentChannel.roomMappings?.[rt.id] || "";
                                const isMapped = Boolean(currentOtaRoomId);

                                return (
                                    <div key={rt.id} className={styles.mobileMappingCard}>
                                        <div className={styles.mobileMappingHeader}>
                                            <span className={styles.mobileMappingName} title={rt.name}>{rt.name}</span>
                                            <span className={styles.mobileMappingMeta}>{rt.totalRooms || 1} Kamar</span>
                                        </div>

                                        <div className={styles.mobileMappingControls}>
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
                                                    className={styles.mobileSelect}
                                                    style={{ flex: 1 }}
                                                >
                                                    <option value="">-- Pilih Kamar OTA --</option>
                                                    {otaExtranetRooms[currentChannel.channelCode].map((otaR: any) => (
                                                        <option key={otaR.id} value={String(otaR.id)}>
                                                            {otaR.title || otaR.name}
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
                                                    className={styles.mobileInput}
                                                    style={{ flex: 1 }}
                                                />
                                            )}

                                            {isMapped && (
                                                <div style={{ display: "flex", gap: "4px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => onPingTest("room_type", rt.id, undefined, currentOtaRoomId)}
                                                        disabled={pingingMap[rt.id]}
                                                        className={styles.mobileBtnIcon}
                                                        title="Tes ping"
                                                    >
                                                        <RefreshCw size={11} className={pingingMap[rt.id] ? "animate-spin" : ""} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onClearRoomMapping(currentChannel.channelCode, rt.id)}
                                                        className={styles.mobileBtnDangerIcon}
                                                        title="Hapus pemetaan"
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

                    {/* SECTION 3: Pemetaan Rate Plan Card-Reflow */}
                    <div className={styles.mobileSectionCard}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div className={styles.mobileSectionTitle}>
                                <Sliders size={12} />
                                <span>Pemetaan Rate Plan</span>
                            </div>
                            <span style={{ fontSize: "10.5px", color: "#71717a", fontFamily: "var(--font-geist-mono, monospace)" }}>
                                {Object.keys(currentChannel.rateMappings || {}).length} / {ratePlans.length}
                            </span>
                        </div>

                        <div className={styles.mobileMappingList}>
                            {ratePlans.map(rp => {
                                const currentOtaRateId = currentChannel.rateMappings?.[rp.id] || "";
                                const isMapped = Boolean(currentOtaRateId);

                                return (
                                    <div key={rp.id} className={styles.mobileMappingCard}>
                                        <div className={styles.mobileMappingHeader}>
                                            <span className={styles.mobileMappingName} title={rp.name}>{rp.name}</span>
                                            <span className={styles.mobileMappingMeta}>Meal: {rp.mealPlan || "RO"}</span>
                                        </div>

                                        <div className={styles.mobileMappingControls}>
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
                                                    className={styles.mobileSelect}
                                                    style={{ flex: 1 }}
                                                >
                                                    <option value="">-- Pilih Rate OTA --</option>
                                                    {currentOtaRates.map(otaRate => (
                                                        <option key={otaRate.id} value={otaRate.id}>
                                                            {otaRate.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Masukkan OTA Rate ID..."
                                                    value={currentOtaRateId}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        updateChannelField(currentChannel.channelCode, "rateMappings", {
                                                            ...(currentChannel.rateMappings || {}),
                                                            [rp.id]: val
                                                        });
                                                    }}
                                                    className={styles.mobileInput}
                                                    style={{ flex: 1 }}
                                                />
                                            )}

                                            {isMapped && (
                                                <div style={{ display: "flex", gap: "4px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => onPingTest("rate_plan", rp.id, undefined, currentOtaRateId)}
                                                        disabled={pingingMap[rp.id]}
                                                        className={styles.mobileBtnIcon}
                                                        title="Tes ping"
                                                    >
                                                        <RefreshCw size={11} className={pingingMap[rp.id] ? "animate-spin" : ""} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onClearRateMapping(currentChannel.channelCode, rp.id, rp.id)}
                                                        className={styles.mobileBtnDangerIcon}
                                                        title="Hapus pemetaan"
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
                </div>
            )}

            {/* ── Sticky Bottom Save Bar (Mobile) ── */}
            <div className={styles.stickyBottomBar}>
                <span className={styles.stickyNotice}>
                    Properti: <b>{hotelCode}</b>
                </span>
                <button
                    type="button"
                    onClick={onSaveAll}
                    disabled={savingSettings}
                    className={styles.stickySaveBtn}
                >
                    <Save size={13} className={savingSettings ? "animate-spin" : ""} />
                    <span>{savingSettings ? "Menyimpan..." : "Simpan Saluran"}</span>
                </button>
            </div>
        </div>
    );
};
