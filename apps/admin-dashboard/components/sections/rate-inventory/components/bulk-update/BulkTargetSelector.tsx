"use client";

import React from "react";
import { Bed, Tag, Globe, Check, Info } from "lucide-react";
import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
import { BulkUpdateMetricType } from "./types";
import styles from "./BulkTargetSelector.module.css";

interface BulkTargetSelectorProps {
    selectedMetrics: BulkUpdateMetricType[];
    roomTypes: RoomTypeInfo[];
    ratePlans: MyTaraRatePlan[];
    channelConfigs?: Record<string, any>;
    roomTypeIds: string[];
    ratePlanIds: string[];
    channelId: string;
    onRoomTypesChange: (ids: string[]) => void;
    onRatePlansChange: (ids: string[]) => void;
    onChannelChange: (channelId: string) => void;
}

export function BulkTargetSelector({
    selectedMetrics,
    roomTypes,
    ratePlans,
    channelConfigs = {},
    roomTypeIds,
    ratePlanIds,
    channelId,
    onRoomTypesChange,
    onRatePlansChange,
    onChannelChange
}: BulkTargetSelectorProps) {
    const hasRate = selectedMetrics.includes("rate");
    const hasInventory = selectedMetrics.includes("inventory");
    const hasRestrictions = selectedMetrics.some(m =>
        ["stopsell", "minstay_through", "minstay_arrival", "maxstay", "cta", "ctd"].includes(m)
    );

    // Rate plan selector is needed when Rate or Restrictions are selected
    const showRatePlanSelector = hasRate || hasRestrictions;
    // Room type selector is needed whenever any metric is selected
    const showRoomTypeSelector = selectedMetrics.length > 0;

    // Toggle Room Type
    const toggleRoomType = (id: string) => {
        if (id === "all") {
            onRoomTypesChange(["all"]);
            return;
        }

        const isCurrentlyAll = roomTypeIds.includes("all");
        let next: string[];

        if (isCurrentlyAll) {
            next = [id];
        } else if (roomTypeIds.includes(id)) {
            next = roomTypeIds.filter(x => x !== id);
            if (next.length === 0) next = ["all"];
        } else {
            next = [...roomTypeIds, id];
            if (next.length === roomTypes.length) {
                next = ["all"];
            }
        }
        onRoomTypesChange(next);
    };

    // Toggle Rate Plan
    const toggleRatePlan = (id: string) => {
        if (id === "all") {
            onRatePlansChange(["all"]);
            return;
        }

        const isCurrentlyAll = ratePlanIds.includes("all");
        let next: string[];

        if (isCurrentlyAll) {
            next = [id];
        } else if (ratePlanIds.includes(id)) {
            next = ratePlanIds.filter(x => x !== id);
            if (next.length === 0) next = ["all"];
        } else {
            next = [...ratePlanIds, id];
            if (next.length === ratePlans.length) {
                next = ["all"];
            }
        }
        onRatePlansChange(next);
    };

    const isAllRoomTypes = roomTypeIds.includes("all");
    const isAllRatePlans = ratePlanIds.includes("all");

    // Channels
    const activeChannels = Object.entries(channelConfigs).filter(([_, cfg]) => cfg?.active);

    return (
        <div className={styles.container}>
            <div className={styles.selectorGrid}>
                {/* 1. Room Type Target Selector */}
                {showRoomTypeSelector && (
                    <div className={styles.targetCard}>
                        <div className={styles.targetCardHeader}>
                            <div className={styles.targetTitleGroup}>
                                <span className={styles.targetIcon}>
                                    <Bed size={16} />
                                </span>
                                <div>
                                    <div className={styles.targetTitle}>Target Tipe Kamar</div>
                                    <div className={styles.targetSubtitle}>
                                        {isAllRoomTypes
                                            ? "Semua Tipe Kamar"
                                            : `${roomTypeIds.length} dari ${roomTypes.length} dipilih`}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.quickToggleGroup}>
                                <button
                                    type="button"
                                    onClick={() => onRoomTypesChange(["all"])}
                                    className={styles.quickToggleBtn}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        onRoomTypesChange(roomTypes.length > 0 ? [roomTypes[0].id] : ["all"])
                                    }
                                    className={styles.quickToggleBtn}
                                >
                                    Pilih 1
                                </button>
                            </div>
                        </div>

                        <div className={styles.chipsContainer}>
                            <button
                                type="button"
                                onClick={() => toggleRoomType("all")}
                                className={`${styles.chip} ${isAllRoomTypes ? styles.chipSelected : ""}`}
                            >
                                {isAllRoomTypes && <Check size={12} strokeWidth={3} />}
                                <span>Semua Tipe Kamar ({roomTypes.length})</span>
                            </button>

                            {roomTypes.map(rt => {
                                const isSelected = !isAllRoomTypes && roomTypeIds.includes(rt.id);
                                return (
                                    <button
                                        key={rt.id}
                                        type="button"
                                        onClick={() => toggleRoomType(rt.id)}
                                        className={`${styles.chip} ${
                                            isSelected ? styles.chipSelected : ""
                                        }`}
                                    >
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                        <span>{rt.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 2. Rate Plan Target Selector (Conditional based on Rate/Restrictions) */}
                {showRatePlanSelector ? (
                    <div className={styles.targetCard}>
                        <div className={styles.targetCardHeader}>
                            <div className={styles.targetTitleGroup}>
                                <span className={styles.targetIcon}>
                                    <Tag size={16} />
                                </span>
                                <div>
                                    <div className={styles.targetTitle}>Target Rate Plan</div>
                                    <div className={styles.targetSubtitle}>
                                        {isAllRatePlans
                                            ? "Semua Rate Plan"
                                            : `${ratePlanIds.length} dari ${ratePlans.length} dipilih`}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.quickToggleGroup}>
                                <button
                                    type="button"
                                    onClick={() => onRatePlansChange(["all"])}
                                    className={styles.quickToggleBtn}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        onRatePlansChange(ratePlans.length > 0 ? [ratePlans[0].id] : ["all"])
                                    }
                                    className={styles.quickToggleBtn}
                                >
                                    Pilih 1
                                </button>
                            </div>
                        </div>

                        <div className={styles.chipsContainer}>
                            <button
                                type="button"
                                onClick={() => toggleRatePlan("all")}
                                className={`${styles.chip} ${isAllRatePlans ? styles.chipSelected : ""}`}
                            >
                                {isAllRatePlans && <Check size={12} strokeWidth={3} />}
                                <span>Semua Rate Plan ({ratePlans.length})</span>
                            </button>

                            {ratePlans.map(rp => {
                                const isSelected = !isAllRatePlans && ratePlanIds.includes(rp.id);
                                return (
                                    <button
                                        key={rp.id}
                                        type="button"
                                        onClick={() => toggleRatePlan(rp.id)}
                                        className={`${styles.chip} ${
                                            isSelected ? styles.chipSelected : ""
                                        }`}
                                    >
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                        <span>{rp.name || rp.code}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : hasInventory ? (
                    <div className={styles.infoNote}>
                        <Info size={16} />
                        <span>
                            Inventory kamar dialokasikan pada tingkat <strong>Tipe Kamar Fisik</strong> (tanpa perlu memilih Rate Plan).
                        </span>
                    </div>
                ) : null}
            </div>

            {/* 3. Optional Channel Manager Selection */}
            {activeChannels.length > 0 && hasRate && (
                <div className={styles.channelSelectWrapper}>
                    <label htmlFor="bulk-channel-select" className={styles.channelSelectLabel}>
                        <Globe size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                        Target Distribusi Channel (Opsional):
                    </label>
                    <select
                        id="bulk-channel-select"
                        value={channelId}
                        onChange={e => onChannelChange(e.target.value)}
                        className={styles.selectInput}
                    >
                        <option value="all">Semua Saluran (Direct PMS &amp; Semua OTA)</option>
                        {activeChannels.map(([chKey, cfg]) => (
                            <option key={chKey} value={chKey}>
                                Hanya {cfg.name || chKey.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
