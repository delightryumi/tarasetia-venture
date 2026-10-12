"use client";

import React from "react";
import { RotateCcw, Save, Info } from "lucide-react";
import { RoomTypeInfo } from "@/lib/channex/types";
import { RateInventoryTab } from "../RateInventoryTypes";
import styles from "./RateInventoryFilterBar.module.css";
import { toast } from "sonner";

interface RateInventoryFilterBarProps {
    activeTab?: RateInventoryTab;
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
    activeTab,
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
                {/* 1. Channel Pool Selector */}
                <select
                    value={channelFilter}
                    onChange={e => setChannelFilter(e.target.value)}
                    className={`${styles.selectDropdown} ${styles.channelSelectDropdown}`}
                    title="Pilih Channel Distribution Scope"
                >
                    <option value="all">OTA Common Pool ▾</option>
                    {separatedChannels.map(([code, cfg]: [string, any]) => (
                        <option key={code} value={code}>
                            {cfg.channelName || code}
                        </option>
                    ))}
                </select>

                {/* 2. Room Type Selector */}
                <select
                    value={roomTypeFilter}
                    onChange={e => setRoomTypeFilter(e.target.value)}
                    className={`${styles.selectDropdown} ${styles.roomTypeSelectDropdown}`}
                    title="Pilih Filter Tipe Kamar"
                >
                    <option value="all">Room Type ▾</option>
                    {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                </select>

                {/* 3. Rate Mode Radios (Only for Rates Tab) */}
                {activeTab === "rates" && (
                    <div className={styles.radioGroup}>
                        <label className={styles.radioLabel} title="Tampilkan Tarif Dasar Kamar (Base Rate)">
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
                        <label className={styles.radioLabel} title="Tampilkan Biaya Tambahan Dewasa (Extra Adult)">
                            <input
                                type="radio"
                                name="rateMode"
                                value="extra_adult"
                                checked={rateMode === "extra_adult"}
                                onChange={() => setRateMode("extra_adult")}
                                className={styles.radioInput}
                            />
                            <span>Extra Adult Rates</span>
                        </label>
                        <label className={styles.radioLabel} title="Tampilkan Biaya Tambahan Anak (Extra Child)">
                            <input
                                type="radio"
                                name="rateMode"
                                value="extra_child"
                                checked={rateMode === "extra_child"}
                                onChange={() => setRateMode("extra_child")}
                                className={styles.radioInput}
                            />
                            <span>Extra Child Rates</span>
                        </label>
                    </div>
                )}

                {/* 4. Toggles / Checkboxes (Only for Rates Tab) */}
                {activeTab === "rates" && (
                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel} title="Sembunyikan rate plan turunan otomatis">
                            <input
                                type="checkbox"
                                checked={hideDerived}
                                onChange={e => setHideDerived(e.target.checked)}
                                className={styles.checkboxInput}
                            />
                            <span>Hide Derived Rate Plans</span>
                        </label>

                        <label className={styles.checkboxLabel} title="Peralihan tampilan harga sudah/belum termasuk pajak (PB1/PPN)">
                            <input
                                type="checkbox"
                                checked={taxInclusive}
                                onChange={e => setTaxInclusive(e.target.checked)}
                                className={styles.checkboxInput}
                            />
                            <span>Tarif Sudah Termasuk Pajak</span>
                        </label>
                    </div>
                )}
            </div>

            {/* 5. Right Action Buttons */}
            <div className={styles.filterRightGroup}>
                {unsavedCount > 0 && (
                    <button
                        type="button"
                        onClick={() => onResetStaged()}
                        disabled={saving}
                        className={styles.btnReset}
                        title="Batalkan semua perubahan yang belum disimpan"
                    >
                        <RotateCcw size={13} />
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
                    title={unsavedCount > 0 ? `Simpan ${unsavedCount} perubahan ke database dan sinkronkan ke OTA` : "Belum ada perubahan yang disunting"}
                >
                    <Save size={14} />
                    <span>{saving ? "Saving..." : unsavedCount > 0 ? `Save (${unsavedCount})` : "Save"}</span>
                </button>

                {activeTab === "rates" && (
                    <button
                        type="button"
                        onClick={() => {
                            toast.info("Gunakan filter di atas untuk menyaring saluran OTA atau tipe kamar tertentu. Perubahan harga/allotment akan ditandai dan disimpan sekaligus.");
                        }}
                        className={styles.infoIconBtn}
                        title="Petunjuk Penggunaan Filter Bar"
                    >
                        <Info size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
