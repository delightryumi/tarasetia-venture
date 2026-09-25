"use client";

import React from "react";
import { RotateCcw, Save } from "lucide-react";
import { RoomTypeInfo } from "@/lib/channex/types";
import styles from "./RateInventoryFilterBar.module.css";

interface RateInventoryFilterBarProps {
    channelFilter: string;
    setChannelFilter: (val: string) => void;
    channelConfigs?: Record<string, any>;
    roomTypeFilter: string;
    setRoomTypeFilter: (val: string) => void;
    roomTypes: RoomTypeInfo[];
    rateMode: "base" | "extra_adult" | "extra_child";
    setRateMode: (val: "base" | "extra_adult" | "extra_child") => void;
    hideDerived: boolean;
    setHideDerived: (val: boolean) => void;
    taxInclusive: boolean;
    setTaxInclusive: (val: boolean) => void;
    unsavedCount: number;
    saving: boolean;
    onResetStaged: () => void;
    onSaveAllChanges: () => Promise<void>;
}

export function RateInventoryFilterBar({
    channelFilter,
    setChannelFilter,
    channelConfigs = {},
    roomTypeFilter,
    setRoomTypeFilter,
    roomTypes,
    rateMode,
    setRateMode,
    hideDerived,
    setHideDerived,
    taxInclusive,
    setTaxInclusive,
    unsavedCount,
    saving,
    onResetStaged,
    onSaveAllChanges
}: RateInventoryFilterBarProps) {
    const separatedChannels = Object.entries(channelConfigs || {}).filter(([_, cfg]: [string, any]) => {
        if (!cfg || cfg.isActive === false) return false;
        const isMapped = !!cfg.hotelId || Object.keys(cfg.roomMappings || {}).length > 0;
        if (!isMapped) return false;
        return cfg.separationMode === "separated_rate" || cfg.separationMode === "separated_allotment" || cfg.separationMode === "separated_both";
    });

    React.useEffect(() => {
        if (channelFilter !== "all" && !separatedChannels.some(([code]) => code === channelFilter)) {
            setChannelFilter("all");
        }
    }, [channelFilter, separatedChannels, setChannelFilter]);

    return (
        <div className={styles.filterBar}>
            <div className={styles.filterLeftGroup}>
                {/* 1. Channel Selector */}
                <select
                    value={channelFilter}
                    onChange={e => setChannelFilter(e.target.value)}
                    className={styles.selectDropdown}
                    style={{ minWidth: "230px" }}
                >
                    <option value="all">🌐 All Channels (Common Pool)</option>
                    {separatedChannels.map(([code, cfg]: [string, any]) => {
                        const modeBadge = 
                            cfg.separationMode === "separated_rate" ? "• [Separate Rates]" :
                            cfg.separationMode === "separated_allotment" ? "• [Separate Allotment]" :
                            "• [Separate Rates & Allotment]";
                        return (
                            <option key={code} value={code}>
                                {cfg.icon || "🏨"} {cfg.channelName || code} {modeBadge}
                            </option>
                        );
                    })}
                </select>

                {/* 2. Room Type Selector */}
                <select
                    value={roomTypeFilter}
                    onChange={e => setRoomTypeFilter(e.target.value)}
                    className={styles.selectDropdown}
                >
                    <option value="all">All Room Types ▾</option>
                    {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                </select>

                {/* 3. Rate Mode Radios */}
                <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="rateMode"
                            value="base"
                            checked={rateMode === "base"}
                            onChange={() => setRateMode("base")}
                            className={styles.radioInput}
                        />
                        <span>Base Rates</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="rateMode"
                            value="extra_adult"
                            checked={rateMode === "extra_adult"}
                            onChange={() => setRateMode("extra_adult")}
                            className={styles.radioInput}
                        />
                        <span>Extra Adult</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="rateMode"
                            value="extra_child"
                            checked={rateMode === "extra_child"}
                            onChange={() => setRateMode("extra_child")}
                            className={styles.radioInput}
                        />
                        <span>Extra Child</span>
                    </label>
                </div>

                {/* 4. Toggles */}
                <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={hideDerived}
                            onChange={e => setHideDerived(e.target.checked)}
                            className={styles.checkboxInput}
                        />
                        <span>Hide Derived Rates</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={taxInclusive}
                            onChange={e => setTaxInclusive(e.target.checked)}
                            className={styles.checkboxInput}
                        />
                        <span>Tax Inclusive (PB1 / VAT)</span>
                    </label>
                </div>
            </div>

            {/* 5. Right Action Buttons */}
            <div className={styles.filterRightGroup}>
                {unsavedCount > 0 && (
                    <button
                        type="button"
                        onClick={() => onResetStaged()}
                        disabled={saving}
                        className={styles.btnReset}
                        title="Discard all unsaved edits"
                    >
                        <RotateCcw size={14} />
                        <span>Discard ({unsavedCount})</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => {
                        onSaveAllChanges().catch(err => console.error("Error saving changes:", err));
                    }}
                    disabled={saving || unsavedCount === 0}
                    className={[styles.btnSave, unsavedCount > 0 ? styles.btnSaveDirty : ""].filter(Boolean).join(" ")}
                >
                    <Save size={14} />
                    <span>{saving ? "Saving Changes..." : unsavedCount > 0 ? `Save Changes (${unsavedCount})` : "Save Changes"}</span>
                </button>
            </div>
        </div>
    );
}
