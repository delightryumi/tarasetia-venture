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
    channelConfigs?: Record<string, any>;
    saving: boolean;
    defaultStartDate?: string;
    canStopSell?: boolean;
    canChangeRate?: boolean;
    canChangeInventory?: boolean;
}

export function BulkUpdateModal({
    isOpen,
    onClose,
    onApply,
    roomTypes,
    ratePlans,
    channelConfigs = {},
    saving,
    defaultStartDate,
    canStopSell = true,
    canChangeRate = true,
    canChangeInventory = true
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

    // Target Room Types & Rate Plans & Channel
    const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(["all"]);
    const [selectedRatePlans, setSelectedRatePlans] = useState<string[]>(["all"]);
    const [selectedChannel, setSelectedChannel] = useState<string>("all");

    // Actions
    const [rateAction, setRateAction] = useState<BulkUpdateParams["rateAction"]>("none");
    const [rateValue, setRateValue] = useState<number>(0);
    const [stopSellAction, setStopSellAction] = useState<BulkUpdateParams["stopSellAction"]>("none");
    const [inventoryAction, setInventoryAction] = useState<BulkUpdateParams["inventoryAction"]>("none");
    const [inventoryValue, setInventoryValue] = useState<number>(0);
    const [minStayAction, setMinStayAction] = useState<BulkUpdateParams["minStayAction"]>("none");
    const [minStayValue, setMinStayValue] = useState<number>(1);
    const [ctaAction, setCtaAction] = useState<BulkUpdateParams["ctaAction"]>("none");
    const [ctdAction, setCtdAction] = useState<BulkUpdateParams["ctdAction"]>("none");

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
            inventoryValue: inventoryAction === "set" ? inventoryValue : undefined,
            minStayAction,
            minStayValue: minStayAction === "set" ? minStayValue : undefined,
            ctaAction,
            ctdAction
        });
    };

    const DAYS_CONFIG = [
        { idx: 1, label: "Sen" },
        { idx: 2, label: "Sel" },
        { idx: 3, label: "Rab" },
        { idx: 4, label: "Kam" },
        { idx: 5, label: "Jum" },
        { idx: 6, label: "Sab" },
        { idx: 0, label: "Min" }
    ];

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Zap size={18} style={{ color: "#2563eb" }} />
                        <h3 className={styles.modalTitle}>Bulk Update: Tarif, Allotment &amp; Stop Sell</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeBtn}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    {/* 1. Periode Tanggal & Hari */}
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

                    {/* 2. Target Saluran (OTA), Tipe Kamar & Rate Plan */}
                    <div className={styles.sectionBox}>
                        <div className={styles.sectionTitle}>
                            <SlidersHorizontal size={14} />
                            <span>2. Target Saluran (OTA), Tipe Kamar &amp; Rate Plan</span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                            <div>
                                <label className={styles.inputLabel}>
                                    Target Saluran Distribusi
                                </label>
                                <select
                                    value={selectedChannel}
                                    onChange={e => setSelectedChannel(e.target.value)}
                                    className={styles.selectField}
                                    style={{ fontWeight: 600 }}
                                >
                                    <option value="all">🌐 Semua Saluran (Common Pool)</option>
                                    {channelConfigs && Object.keys(channelConfigs).length > 0 ? (
                                        Object.entries(channelConfigs).map(([code, cfg]: [string, any]) => (
                                            <option key={code} value={code}>
                                                {cfg.icon || "🏨"} {cfg.channelName || code}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="traveloka">🕊️ Traveloka</option>
                                            <option value="booking_com">🅱️ Booking.com</option>
                                            <option value="agoda">🅰️ Agoda</option>
                                            <option value="tiket">🎫 Tiket.com</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className={styles.inputLabel}>
                                    Tipe Kamar (Room Types)
                                </label>
                                <select
                                    value={selectedRoomTypes[0] || "all"}
                                    onChange={e => setSelectedRoomTypes([e.target.value])}
                                    className={styles.selectField}
                                >
                                    <option value="all">Semua Tipe Kamar</option>
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
                                    <option value="all">Semua Rate Plan</option>
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
                                    disabled={!canChangeRate}
                                    onChange={e => {
                                        if (!canChangeRate) return;
                                        setRateAction(e.target.value as any);
                                    }}
                                    className={styles.selectField}
                                    style={{ width: "auto", height: "30px", opacity: !canChangeRate ? 0.6 : 1, cursor: !canChangeRate ? "not-allowed" : undefined }}
                                >
                                    <option value="none">{!canChangeRate ? "Tidak Diizinkan (No Permission)" : "Tidak Diubah"}</option>
                                    <option value="set">Tetapkan Harga Pasti (Set Fixed Rp)</option>
                                    <option value="inc_amount">Naikkan Sebesar (+Rp)</option>
                                    <option value="dec_amount">Turunkan Sebesar (-Rp)</option>
                                    <option value="inc_percent">Naikkan Persen (+%)</option>
                                    <option value="dec_percent">Turunkan Persen (-%)</option>
                                </select>
                            </div>
                            {rateAction !== "none" && canChangeRate && (
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
                                    disabled={!canStopSell}
                                    onChange={e => {
                                        if (!canStopSell) return;
                                        setStopSellAction(e.target.value as any);
                                    }}
                                    className={styles.selectField}
                                    style={{ width: "auto", height: "30px", opacity: !canStopSell ? 0.6 : 1, cursor: !canStopSell ? "not-allowed" : undefined }}
                                >
                                    <option value="none">{!canStopSell ? "Tidak Diizinkan (No Permission)" : "Tidak Diubah"}</option>
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
                                    disabled={!canChangeInventory}
                                    onChange={e => {
                                        if (!canChangeInventory) return;
                                        setInventoryAction(e.target.value as any);
                                    }}
                                    className={styles.selectField}
                                    style={{ width: "auto", height: "30px", opacity: !canChangeInventory ? 0.6 : 1, cursor: !canChangeInventory ? "not-allowed" : undefined }}
                                >
                                    <option value="none">{!canChangeInventory ? "Tidak Diizinkan (No Permission)" : "Tidak Diubah"}</option>
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

                        {/* D. Restrictions Adjustment (Min Stay, CTA, CTD) */}
                        <div className={`${styles.actionCard} ${(minStayAction !== "none" || ctaAction !== "none" || ctdAction !== "none") ? styles.actionCardActive : ""}`}>
                            <div className={styles.actionCardHeader}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <SlidersHorizontal size={15} style={{ color: "#d97706" }} />
                                        <span className={styles.actionCardTitle}>
                                            Pembatasan Reservasi (Min Stay, CTA, CTD)
                                        </span>
                                    </div>
                                    <p className={styles.actionCardSubtitle} style={{ marginTop: "2px" }}>
                                        Atur syarat minimal menginap dan kunci check-in (CTA) / check-out (CTD)
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "12px" }}>
                                {/* Min Stay */}
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                                        Minimum Stay (Malam):
                                    </label>
                                    <div style={{ display: "flex", gap: "6px" }}>
                                        <select
                                            value={minStayAction}
                                            onChange={e => setMinStayAction(e.target.value as any)}
                                            className={styles.selectField}
                                            style={{ height: "30px", fontSize: "11px" }}
                                        >
                                            <option value="none">Tidak Diubah</option>
                                            <option value="set">Tetapkan Min Stay</option>
                                        </select>
                                        {minStayAction === "set" && (
                                            <input
                                                type="number"
                                                min={1}
                                                max={30}
                                                value={minStayValue}
                                                onChange={e => setMinStayValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                className={styles.inputField}
                                                style={{ width: "60px", height: "30px", fontSize: "11px", fontWeight: 700 }}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* CTA */}
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                                        Closed to Arrival (CTA):
                                    </label>
                                    <select
                                        value={ctaAction}
                                        onChange={e => setCtaAction(e.target.value as any)}
                                        className={styles.selectField}
                                        style={{ height: "30px", fontSize: "11px" }}
                                    >
                                        <option value="none">Tidak Diubah</option>
                                        <option value="close">🚫 Tutup Check-in (CTA ON)</option>
                                        <option value="open">✓ Buka Check-in (CTA OFF)</option>
                                    </select>
                                </div>

                                {/* CTD */}
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                                        Closed to Departure (CTD):
                                    </label>
                                    <select
                                        value={ctdAction}
                                        onChange={e => setCtdAction(e.target.value as any)}
                                        className={styles.selectField}
                                        style={{ height: "30px", fontSize: "11px" }}
                                    >
                                        <option value="none">Tidak Diubah</option>
                                        <option value="close">🚫 Tutup Check-out (CTD ON)</option>
                                        <option value="open">✓ Buka Check-out (CTD OFF)</option>
                                    </select>
                                </div>
                            </div>
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
