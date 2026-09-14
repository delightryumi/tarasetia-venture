"use client";

import React, { useState } from "react";
import {
    X,
    Calendar,
    Zap,
    SlidersHorizontal,
    Check,
    Bed,
    DollarSign,
    Ban
} from "lucide-react";
import { BulkUpdateParams } from "../RateInventoryTypes";
import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
import styles from "./BulkUpdateModal.module.css";

interface BulkUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (params: BulkUpdateParams) => Promise<void>;
    roomTypes: RoomTypeInfo[];
    ratePlans: MyTaraRatePlan[];
    saving: boolean;
    defaultStartDate?: string;
}

export function BulkUpdateModal({
    isOpen,
    onClose,
    onApply,
    roomTypes,
    ratePlans,
    saving,
    defaultStartDate
}: BulkUpdateModalProps) {
    const todayStr = defaultStartDate || new Date().toISOString().split("T")[0];
    const defaultEndStr = (() => {
        const d = new Date(todayStr);
        d.setDate(d.getDate() + 30);
        return d.toISOString().split("T")[0];
    })();

    // Date range
    const [dateFrom, setDateFrom] = useState<string>(todayStr);
    const [dateTo, setDateTo] = useState<string>(defaultEndStr);

    // Days of week (0=Sun, 1=Mon, ..., 6=Sat)
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

    // Target Room Types & Rate Plans
    const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(["all"]);
    const [selectedRatePlans, setSelectedRatePlans] = useState<string[]>(["all"]);
    const [selectedChannel, setSelectedChannel] = useState<string>("all");

    // Actions
    const [rateAction, setRateAction] = useState<BulkUpdateParams["rateAction"]>("none");
    const [rateValue, setRateValue] = useState<number>(0);
    const [stopSellAction, setStopSellAction] = useState<BulkUpdateParams["stopSellAction"]>("none");
    const [inventoryAction, setInventoryAction] = useState<BulkUpdateParams["inventoryAction"]>("none");
    const [inventoryValue, setInventoryValue] = useState<number>(0);

    if (!isOpen) return null;

    const toggleDay = (dayIndex: number) => {
        setDaysOfWeek(prev =>
            prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
        );
    };

    const setDayPreset = (preset: "all" | "weekdays" | "weekends") => {
        if (preset === "all") setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
        else if (preset === "weekdays") setDaysOfWeek([1, 2, 3, 4, 5]);
        else if (preset === "weekends") setDaysOfWeek([0, 6]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onApply({
            dateFrom,
            dateTo,
            daysOfWeek,
            roomTypeIds: selectedRoomTypes,
            ratePlanIds: selectedRatePlans,
            channelId: selectedChannel,
            rateAction,
            rateValue: rateAction !== "none" ? rateValue : undefined,
            stopSellAction,
            inventoryAction,
            inventoryValue: inventoryAction === "set" ? inventoryValue : undefined
        });
    };

    const DAYS_CONFIG = [
        { label: "Mon", idx: 1 },
        { label: "Tue", idx: 2 },
        { label: "Wed", idx: 3 },
        { label: "Thu", idx: 4 },
        { label: "Fri", idx: 5 },
        { label: "Sat", idx: 6 },
        { label: "Sun", idx: 0 }
    ];

    return (
        <div className={styles.overlay}>
            <div className={styles.modalCard}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitleGroup}>
                        <div className={styles.headerIcon}>
                            <Zap size={18} />
                        </div>
                        <div>
                            <h2 className={styles.title}>
                                Bulk Update Rates &amp; Inventory
                            </h2>
                            <p className={styles.subtitle}>
                                Perbarui harga kamar, ketersediaan kamar, dan status stop sell sekaligus
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeBtn}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className={styles.formBody}>
                    {/* 1. Date Range & Days of Week */}
                    <div className={styles.sectionBox}>
                        <div className={styles.sectionTitle}>
                            <Calendar size={14} />
                            <span>1. Periode Tanggal &amp; Pilihan Hari</span>
                        </div>

                        <div className={styles.grid2Col}>
                            <div>
                                <label className={styles.inputLabel}>
                                    Dari Tanggal (From Date)
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    required
                                    className={styles.inputField}
                                />
                            </div>
                            <div>
                                <label className={styles.inputLabel}>
                                    Sampai Tanggal (To Date)
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    required
                                    className={styles.inputField}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                <label className={styles.inputLabel} style={{ margin: 0 }}>
                                    Hari Berlaku (Days of Week)
                                </label>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setDayPreset("all")}
                                        className={styles.btnDayPreset}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDayPreset("weekdays")}
                                        className={styles.btnDayPreset}
                                    >
                                        Weekdays
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDayPreset("weekends")}
                                        className={styles.btnDayPreset}
                                    >
                                        Weekends
                                    </button>
                                </div>
                            </div>

                            <div className={styles.daysBtnGroup}>
                                {DAYS_CONFIG.map(d => {
                                    const active = daysOfWeek.includes(d.idx);
                                    return (
                                        <button
                                            key={d.idx}
                                            type="button"
                                            onClick={() => toggleDay(d.idx)}
                                            className={`${styles.dayPillBtn} ${active ? styles.dayPillBtnActive : ""}`}
                                        >
                                            {d.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 2. Target Selection */}
                    <div className={styles.sectionBox}>
                        <div className={styles.sectionTitle}>
                            <SlidersHorizontal size={14} />
                            <span>2. Target Tipe Kamar &amp; Rate Plan</span>
                        </div>

                        <div className={styles.grid2Col}>
                            <div>
                                <label className={styles.inputLabel}>
                                    Tipe Kamar (Room Types)
                                </label>
                                <select
                                    value={selectedRoomTypes[0] || "all"}
                                    onChange={e => setSelectedRoomTypes([e.target.value])}
                                    className={styles.selectField}
                                >
                                    <option value="all">Semua Tipe Kamar (All Room Types)</option>
                                    {roomTypes.map(rt => (
                                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={styles.inputLabel}>
                                    Rate Plan
                                </label>
                                <select
                                    value={selectedRatePlans[0] || "all"}
                                    onChange={e => setSelectedRatePlans([e.target.value])}
                                    className={styles.selectField}
                                >
                                    <option value="all">Semua Rate Plan (All Plans)</option>
                                    {ratePlans.map(rp => (
                                        <option key={rp.id} value={rp.id}>{rp.name} ({rp.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Action Updates (Rates, StopSell, Inventory) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* A. Rate Adjustment */}
                        <div className={`${styles.actionCard} ${rateAction !== "none" ? styles.actionCardActive : ""}`}>
                            <div className={styles.actionCardHeader}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <DollarSign size={15} style={{ color: "#16a34a" }} />
                                    <span className={styles.actionCardTitle}>
                                        Perubahan Harga Kamar (Rate Adjustment)
                                    </span>
                                </div>
                                <select
                                    value={rateAction}
                                    onChange={e => setRateAction(e.target.value as any)}
                                    className={styles.selectField}
                                    style={{ width: "auto", height: "30px" }}
                                >
                                    <option value="none">Tidak Diubah</option>
                                    <option value="set">Tetapkan Harga Pasti (Set Fixed Rp)</option>
                                    <option value="inc_amount">Naikkan Sebesar (+Rp)</option>
                                    <option value="dec_amount">Turunkan Sebesar (-Rp)</option>
                                    <option value="inc_percent">Naikkan Persen (+%)</option>
                                    <option value="dec_percent">Turunkan Persen (-%)</option>
                                </select>
                            </div>
                            {rateAction !== "none" && (
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                                    <label style={{ fontSize: "11px", color: "#64748b" }}>
                                        Nilai Penyesuaian:
                                    </label>
                                    <input
                                        type="number"
                                        value={rateValue}
                                        onChange={e => setRateValue(Number(e.target.value) || 0)}
                                        onWheel={e => e.currentTarget.blur()}
                                        className={styles.inputField}
                                        style={{ width: "160px", height: "32px", fontWeight: 700 }}
                                        placeholder="0"
                                    />
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                        {rateAction.includes("percent") ? "%" : "IDR (Rp)"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* B. Stop Sell */}
                        <div className={`${styles.actionCard} ${stopSellAction !== "none" ? styles.actionCardDanger : ""}`}>
                            <div className={styles.actionCardHeader}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Ban size={15} style={{ color: "#dc2626" }} />
                                        <span className={styles.actionCardTitle}>
                                            Stop Sell (Buka / Tutup Penjualan)
                                        </span>
                                    </div>
                                    <p className={styles.actionCardSubtitle} style={{ marginTop: "2px" }}>
                                        Buka atau tutup ketersediaan booking untuk tanggal yang dipilih
                                    </p>
                                </div>
                                <select
                                    value={stopSellAction}
                                    onChange={e => setStopSellAction(e.target.value as any)}
                                    className={styles.selectField}
                                    style={{ width: "auto", height: "30px" }}
                                >
                                    <option value="none">Tidak Diubah</option>
                                    <option value="close">🚫 Tutup Penjualan (Stop Sell ON)</option>
                                    <option value="open">✓ Buka Penjualan (Stop Sell OFF)</option>
                                </select>
                            </div>
                        </div>

                        {/* C. Inventory Adjustment */}
                        <div className={`${styles.actionCard} ${inventoryAction !== "none" ? styles.actionCardActive : ""}`}>
                            <div className={styles.actionCardHeader}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Bed size={15} style={{ color: "#2563eb" }} />
                                        <span className={styles.actionCardTitle}>
                                            Ketersediaan Kamar (Inventory Quota)
                                        </span>
                                    </div>
                                    <p className={styles.actionCardSubtitle} style={{ marginTop: "2px" }}>
                                        Tetapkan jumlah kuota kamar yang tersedia untuk tanggal yang dipilih
                                    </p>
                                </div>
                                <select
                                    value={inventoryAction}
                                    onChange={e => setInventoryAction(e.target.value as any)}
                                    className={styles.selectField}
                                    style={{ width: "auto", height: "30px" }}
                                >
                                    <option value="none">Tidak Diubah</option>
                                    <option value="set">Tetapkan Kuota (Set Availability)</option>
                                </select>
                            </div>
                            {inventoryAction === "set" && (
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                                    <label style={{ fontSize: "11px", color: "#64748b" }}>
                                        Jumlah Kamar Tersedia:
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={inventoryValue}
                                        onChange={e => setInventoryValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                        onWheel={e => e.currentTarget.blur()}
                                        className={styles.inputField}
                                        style={{ width: "120px", height: "32px", fontWeight: 700 }}
                                        placeholder="0"
                                    />
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                        Kamar
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className={styles.footer}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className={styles.btnCancel}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={styles.btnSubmit}
                        >
                            <Check size={14} />
                            <span>{saving ? "Menerapkan..." : "Terapkan Bulk Update"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
