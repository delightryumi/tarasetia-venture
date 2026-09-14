"use client";

import React from "react";
import { RotateCcw, Save } from "lucide-react";
import { RoomTypeInfo } from "@/lib/channex/types";
import styles from "./RateInventoryFilterBar.module.css";

interface RateInventoryFilterBarProps {
    channelFilter: string;
    setChannelFilter: (val: string) => void;
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
    return (
        <div className={styles.filterBar}>
            <div className={styles.filterLeftGroup}>
                {/* Channel Selector */}
                <select
                    value={channelFilter}
                    onChange={e => setChannelFilter(e.target.value)}
                    className={styles.selectDropdown}
                >
                    <option value="all">OTA Common Pool ▾</option>
                    <option value="traveloka">Traveloka</option>
                    <option value="booking_com">Booking.com</option>
                    <option value="agoda">Agoda</option>
                    <option value="tiket">Tiket.com</option>
                    <option value="direct">Direct Booking Engine</option>
                </select>

                {/* Room Type Selector */}
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

                {/* Rate Mode Radio Buttons */}
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
                        <span>Extra Adult Rates</span>
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
                        <span>Extra Child Rates</span>
                    </label>
                </div>

                {/* Checkboxes */}
                <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={hideDerived}
                            onChange={e => setHideDerived(e.target.checked)}
                            className={styles.checkboxInput}
                        />
                        <span>Hide Derived Rate Plans</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={taxInclusive}
                            onChange={e => setTaxInclusive(e.target.checked)}
                            className={styles.checkboxInput}
                        />
                        <span>Tarif Sudah Termasuk Pajak (PB1)</span>
                    </label>
                </div>
            </div>

            {/* Right Action Buttons */}
            <div className={styles.filterRightGroup}>
                {unsavedCount > 0 && (
                    <button
                        type="button"
                        onClick={() => onResetStaged()}
                        disabled={saving}
                        className={styles.btnReset}
                        title="Batalkan perubahan yang belum disimpan"
                    >
                        <RotateCcw size={13} />
                        <span>Reset ({unsavedCount})</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => {
                        onSaveAllChanges().catch(err => console.error("Error saving changes:", err));
                    }}
                    disabled={saving || unsavedCount === 0}
                    className={`${styles.btnSave} ${unsavedCount > 0 ? styles.btnSaveDirty : ""}`}
                >
                    <Save size={13} />
                    <span>{saving ? "Menyimpan..." : unsavedCount > 0 ? `Save Changes (${unsavedCount})` : "Save"}</span>
                </button>
            </div>
        </div>
    );
}
