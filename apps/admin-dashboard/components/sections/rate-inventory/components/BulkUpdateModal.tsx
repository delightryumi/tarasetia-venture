"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    SlidersHorizontal,
    Check,
    Bed,
    DollarSign,
    Plus,
    Trash2,
    Layers,
    Calendar,
    ChevronDown,
    ChevronUp,
    RotateCcw
} from "lucide-react";
import { BulkUpdateParams, BulkUpdateItem } from "../RateInventoryTypes";
import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
import { useCurrency } from "@/hooks/useCurrency";
import { getCurrencyConfig } from "@/lib/currency-utils";
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

interface MultiItemRow {
    id: string;
    roomTypeId: string;
    ratePlanId: string;
    dateFrom: string;
    dateTo: string;
    rateAction: "set" | "inc_amount" | "dec_amount" | "none";
    rateValueStr: string;
    showRestrictions: boolean;
    // Restrictions
    stopSellAction: "none" | "open" | "close";
    minStayArrivalAction: "none" | "set" | "remove";
    minStayArrivalValue: number;
    minStayThroughAction: "none" | "set" | "remove";
    minStayThroughValue: number;
    maxStayAction: "none" | "set" | "remove";
    maxStayValue: number;
    ctaAction: "none" | "open" | "close";
    ctdAction: "none" | "open" | "close";
    inventoryAction: "none" | "set";
    inventoryValue: number;
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
    const { currencyCode } = useCurrency();
    const currConfig = getCurrencyConfig(currencyCode);
    const todayStr = defaultStartDate || new Date().toISOString().split("T")[0];
    const defaultEndStr = (() => {
        const d = new Date(todayStr);
        d.setDate(d.getDate() + 30);
        return d.toISOString().split("T")[0];
    })();

    // Mode: Multi-Item (Batched) vs Single Scope
    const [mode, setMode] = useState<"multi" | "single">("multi");

    // Single Scope State
    const [dateFrom, setDateFrom] = useState<string>(todayStr);
    const [dateTo, setDateTo] = useState<string>(defaultEndStr);
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(["all"]);
    const [selectedRatePlans, setSelectedRatePlans] = useState<string[]>(["all"]);
    const [selectedChannel, setSelectedChannel] = useState<string>("all");

    const [rateAction, setRateAction] = useState<BulkUpdateParams["rateAction"]>("none");
    const [rateValue, setRateValue] = useState<number>(0);
    const [rateInputStr, setRateInputStr] = useState<string>("");

    const [inventoryAction, setInventoryAction] = useState<BulkUpdateParams["inventoryAction"]>("none");
    const [inventoryValue, setInventoryValue] = useState<number>(0);
    const [stopSellAction, setStopSellAction] = useState<BulkUpdateParams["stopSellAction"]>("none");
    const [minStayArrAction, setMinStayArrAction] = useState<"none" | "set" | "remove">("none");
    const [minStayArrValue, setMinStayArrValue] = useState<number>(1);
    const [minStayThruAction, setMinStayThruAction] = useState<"none" | "set" | "remove">("none");
    const [minStayThruValue, setMinStayThruValue] = useState<number>(1);
    const [maxStayAction, setMaxStayAction] = useState<"none" | "set" | "remove">("none");
    const [maxStayValue, setMaxStayValue] = useState<number>(14);
    const [ctaAction, setCtaAction] = useState<BulkUpdateParams["ctaAction"]>("none");
    const [ctdAction, setCtdAction] = useState<BulkUpdateParams["ctdAction"]>("none");

    // Multi-Item Rows State
    const createDefaultRow = (index: number = 0): MultiItemRow => ({
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        roomTypeId: roomTypes[index % Math.max(1, roomTypes.length)]?.id || "all",
        ratePlanId: ratePlans[0]?.id || "all",
        dateFrom: todayStr,
        dateTo: defaultEndStr,
        rateAction: "set",
        rateValueStr: "",
        showRestrictions: false,
        stopSellAction: "none",
        minStayArrivalAction: "none",
        minStayArrivalValue: 1,
        minStayThroughAction: "none",
        minStayThroughValue: 1,
        maxStayAction: "none",
        maxStayValue: 14,
        ctaAction: "none",
        ctdAction: "none",
        inventoryAction: "none",
        inventoryValue: 0
    });

    const [multiItems, setMultiItems] = useState<MultiItemRow[]>([createDefaultRow(0)]);

    // Initialize or re-sync defaults when modal opens
    useEffect(() => {
        if (isOpen && multiItems.length === 0) {
            setMultiItems([createDefaultRow(0)]);
        }
    }, [isOpen]);

    // Close on Escape key press (WCAG AA Accessibility)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Single mode day toggle
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

    // Multi-item handlers
    const addMultiRow = () => {
        setMultiItems(prev => [...prev, createDefaultRow(prev.length)]);
    };

    const removeMultiRow = (id: string) => {
        setMultiItems(prev => {
            const filtered = prev.filter(it => it.id !== id);
            return filtered.length > 0 ? filtered : [createDefaultRow(0)];
        });
    };

    const updateMultiRow = (id: string, updates: Partial<MultiItemRow>) => {
        setMultiItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === "multi") {
            const items: BulkUpdateItem[] = multiItems.map(item => ({
                id: item.id,
                roomTypeId: item.roomTypeId,
                ratePlanId: item.ratePlanId,
                dateFrom: item.dateFrom,
                dateTo: item.dateTo,
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                rateAction: item.rateAction,
                rateValue: item.rateAction !== "none" && item.rateValueStr !== "" ? parseFloat(item.rateValueStr) : undefined,
                stopSellAction: item.stopSellAction,
                minStayArrivalAction: item.minStayArrivalAction,
                minStayArrivalValue: item.minStayArrivalAction === "set" ? item.minStayArrivalValue : undefined,
                minStayThroughAction: item.minStayThroughAction,
                minStayThroughValue: item.minStayThroughAction === "set" ? item.minStayThroughValue : undefined,
                maxStayAction: item.maxStayAction,
                maxStayValue: item.maxStayAction === "set" ? item.maxStayValue : undefined,
                ctaAction: item.ctaAction,
                ctdAction: item.ctdAction,
                inventoryAction: item.inventoryAction,
                inventoryValue: item.inventoryAction === "set" ? item.inventoryValue : undefined
            }));

            await onApply({
                mode: "multi",
                items
            });
        } else {
            const parsedRate = parseFloat(rateInputStr);
            const finalRateValue = !isNaN(parsedRate) ? parsedRate : rateValue;

            await onApply({
                mode: "single",
                dateFrom,
                dateTo,
                daysOfWeek,
                roomTypeIds: selectedRoomTypes,
                ratePlanIds: selectedRatePlans,
                channelId: selectedChannel,
                rateAction,
                rateValue: rateAction !== "none" ? finalRateValue : undefined,
                stopSellAction,
                inventoryAction,
                inventoryValue: inventoryAction === "set" ? inventoryValue : undefined,
                minStayArrivalAction: minStayArrAction,
                minStayArrivalValue: minStayArrAction === "set" ? minStayArrValue : undefined,
                minStayThroughAction: minStayThruAction,
                minStayThroughValue: minStayThruAction === "set" ? minStayThruValue : undefined,
                maxStayAction,
                maxStayValue: maxStayAction === "set" ? maxStayValue : undefined,
                ctaAction,
                ctdAction
            });
        }
    };

    const DAYS_CONFIG = [
        { idx: 1, label: "Mon" },
        { idx: 2, label: "Tue" },
        { idx: 3, label: "Wed" },
        { idx: 4, label: "Thu" },
        { idx: 5, label: "Fri" },
        { idx: 6, label: "Sat" },
        { idx: 0, label: "Sun" }
    ];

    const ratePlaceholder = currConfig.decimals > 0 ? "0.00" : "0";

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderLeft}>
                        <SlidersHorizontal size={18} className={styles.headerIcon} />
                        <h3 className={styles.modalTitle}>Bulk Update: Rates, Inventory &amp; Restriksi</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeBtn}
                        aria-label="Tutup modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.modalBody}>
                        {/* Mode Switcher Tabs */}
                        <div className={styles.modeSwitcher}>
                            <button
                                type="button"
                                onClick={() => setMode("multi")}
                                className={`${styles.modeTabBtn} ${mode === "multi" ? styles.modeTabBtnActive : ""}`}
                            >
                                <Layers size={15} />
                                <span>Multi-Room &amp; Rate Plan (Batch)</span>
                                <span className={styles.modeBadge}>Batched Sync</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("single")}
                                className={`${styles.modeTabBtn} ${mode === "single" ? styles.modeTabBtnActive : ""}`}
                            >
                                <Calendar size={15} />
                                <span>Single Scope Update</span>
                            </button>
                        </div>

                        {/* MODE: MULTI-ITEM BATCH */}
                        {mode === "multi" && (
                            <div className={styles.sectionBox}>
                                <div className={styles.multiTopActions}>
                                    <div className={styles.sectionTitle} style={{ margin: 0 }}>
                                        <Layers size={14} />
                                        <span>Daftar Entri Pembaruan ARI (Multi-Category)</span>
                                    </div>
                                    <div className={styles.presetGroup}>
                                        <button
                                            type="button"
                                            onClick={addMultiRow}
                                            className={styles.btnPresetAction}
                                            title="Tambah entri pembaruan baru"
                                        >
                                            <Plus size={13} />
                                            <span>Tambah Entri</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMultiItems([createDefaultRow(0)])}
                                            className={styles.btnPresetAction}
                                            title="Reset seluruh entri ke pengaturan awal"
                                        >
                                            <RotateCcw size={12} />
                                            <span>Reset</span>
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.multiItemList} style={{ marginTop: 12 }}>
                                    {multiItems.map((item, index) => {
                                        const rtObj = roomTypes.find(rt => rt.id === item.roomTypeId);
                                        const rpObj = ratePlans.find(rp => rp.id === item.ratePlanId);

                                        return (
                                            <div key={item.id} className={styles.multiItemCard}>
                                                <div className={styles.multiItemHeader}>
                                                    <div className={styles.multiItemHeaderLeft}>
                                                        <span className={styles.multiItemBadge}>Entri #{index + 1}</span>
                                                        <span className={styles.multiItemSummary}>
                                                            {rtObj ? rtObj.name : "Semua Tipe Kamar"} : {rpObj ? rpObj.name : "Semua Rate Plan"}
                                                        </span>
                                                    </div>
                                                    {multiItems.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMultiRow(item.id)}
                                                            className={styles.btnRemoveItem}
                                                            title="Hapus entri ini"
                                                        >
                                                            <Trash2 size={13} />
                                                            <span>Hapus</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Baris 1: Ruang Lingkup (Tipe Kamar & Rate Plan) */}
                                                <div className={styles.multiItemRow1}>
                                                    <div className={styles.fieldCol}>
                                                        <label className={styles.inputLabel}>Tipe Kamar</label>
                                                        <select
                                                            value={item.roomTypeId}
                                                            onChange={e => updateMultiRow(item.id, { roomTypeId: e.target.value })}
                                                            className={styles.selectField}
                                                            required
                                                        >
                                                            <option value="all">Semua Tipe Kamar</option>
                                                            {roomTypes.map(rt => (
                                                                <option key={rt.id} value={rt.id}>{rt.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className={styles.fieldCol}>
                                                        <label className={styles.inputLabel}>Rate Plan</label>
                                                        <select
                                                            value={item.ratePlanId}
                                                            onChange={e => updateMultiRow(item.id, { ratePlanId: e.target.value })}
                                                            className={styles.selectField}
                                                            required
                                                        >
                                                            <option value="all">Semua Rate Plan</option>
                                                            {ratePlans.map(rp => (
                                                                <option key={rp.id} value={rp.id}>{rp.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Baris 2: Parameter Operasional (Card Tanggal & Penyesuaian Tarif) */}
                                                <div className={styles.multiItemRow2}>
                                                    {/* Card Tanggal Wrapper */}
                                                    <div className={styles.dateCardWrapper}>
                                                        <div className={styles.dateCardHeader}>
                                                            <div className={styles.dateCardTitle}>
                                                                <Calendar size={13} className={styles.dateCardIcon} />
                                                                <span>Rentang Tanggal (Periode)</span>
                                                            </div>
                                                            <span className={styles.dateCardSub}>Dari - Sampai</span>
                                                        </div>
                                                        <div className={styles.dateCardBody}>
                                                            <div className={styles.dateFieldGroup}>
                                                                <span className={styles.dateLabelPrefix}>Dari</span>
                                                                <input
                                                                    type="date"
                                                                    value={item.dateFrom}
                                                                    onChange={e => updateMultiRow(item.id, { dateFrom: e.target.value })}
                                                                    className={styles.dateInputBox}
                                                                    required
                                                                />
                                                            </div>
                                                            <span className={styles.dateRangeDivider}>→</span>
                                                            <div className={styles.dateFieldGroup}>
                                                                <span className={styles.dateLabelPrefix}>Sampai</span>
                                                                <input
                                                                    type="date"
                                                                    value={item.dateTo}
                                                                    onChange={e => updateMultiRow(item.id, { dateTo: e.target.value })}
                                                                    className={styles.dateInputBox}
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Penyesuaian Tarif */}
                                                    <div className={styles.rateCardWrapper}>
                                                        <div className={styles.rateCardHeader}>
                                                            <div className={styles.rateCardTitle}>
                                                                <DollarSign size={13} className={styles.rateCardIcon} />
                                                                <span>Penyesuaian Tarif ({currConfig.code})</span>
                                                            </div>
                                                        </div>
                                                        <div className={styles.rateCardBody}>
                                                            <select
                                                                value={item.rateAction}
                                                                onChange={e => updateMultiRow(item.id, { rateAction: e.target.value as any })}
                                                                className={styles.rateActionSelect}
                                                            >
                                                                <option value="set">Set Tarif</option>
                                                                <option value="inc_amount">+ Nominal</option>
                                                                <option value="dec_amount">- Nominal</option>
                                                                <option value="none">Tanpa Tarif</option>
                                                            </select>
                                                            {item.rateAction !== "none" ? (
                                                                <div className={styles.currencyInputWrap}>
                                                                    <span className={styles.currencyPrefix}>{currConfig.symbol}</span>
                                                                    <input
                                                                        type="number"
                                                                        step={currConfig.step}
                                                                        min={0}
                                                                        value={item.rateValueStr}
                                                                        onChange={e => updateMultiRow(item.id, { rateValueStr: e.target.value })}
                                                                        placeholder={ratePlaceholder}
                                                                        className={styles.currencyInputField}
                                                                        required={item.rateAction !== "none"}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className={styles.rateNoneBadge}>
                                                                    Tarif tidak diubah
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Collapsible Restrictions toggle */}
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateMultiRow(item.id, { showRestrictions: !item.showRestrictions })}
                                                        className={styles.btnToggleRestrictions}
                                                    >
                                                        <span>Restriksi Tambahan (Min Stay, Stop Sell, CTA, CTD, Kuota)</span>
                                                        {item.showRestrictions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>

                                                    {item.showRestrictions && (
                                                        <div className={styles.restrictionsDrawer} style={{ marginTop: 8 }}>
                                                            {/* Min Stay Through */}
                                                            <div>
                                                                <label className={styles.inputLabel}>Min Stay Through (Malam)</label>
                                                                <div style={{ display: "flex", gap: 6 }}>
                                                                    <select
                                                                        value={item.minStayThroughAction}
                                                                        onChange={e => updateMultiRow(item.id, { minStayThroughAction: e.target.value as any })}
                                                                        className={styles.selectField}
                                                                    >
                                                                        <option value="none">Tidak Ada</option>
                                                                        <option value="set">Set Min</option>
                                                                        <option value="remove">Hapus</option>
                                                                    </select>
                                                                    {item.minStayThroughAction === "set" && (
                                                                        <input
                                                                            type="number"
                                                                            min={1}
                                                                            max={30}
                                                                            value={item.minStayThroughValue}
                                                                            onChange={e => updateMultiRow(item.id, { minStayThroughValue: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                                                            className={styles.inputField}
                                                                            style={{ width: "70px" }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Max Stay */}
                                                            <div>
                                                                <label className={styles.inputLabel}>Max Stay (Malam)</label>
                                                                <div style={{ display: "flex", gap: 6 }}>
                                                                    <select
                                                                        value={item.maxStayAction}
                                                                        onChange={e => updateMultiRow(item.id, { maxStayAction: e.target.value as any })}
                                                                        className={styles.selectField}
                                                                    >
                                                                        <option value="none">Tidak Ada</option>
                                                                        <option value="set">Set Max</option>
                                                                        <option value="remove">Hapus</option>
                                                                    </select>
                                                                    {item.maxStayAction === "set" && (
                                                                        <input
                                                                            type="number"
                                                                            min={1}
                                                                            max={365}
                                                                            value={item.maxStayValue}
                                                                            onChange={e => updateMultiRow(item.id, { maxStayValue: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                                                            className={styles.inputField}
                                                                            style={{ width: "70px" }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Stop Sell */}
                                                            <div>
                                                                <label className={styles.inputLabel}>Stop Sell</label>
                                                                <select
                                                                    value={item.stopSellAction}
                                                                    onChange={e => updateMultiRow(item.id, { stopSellAction: e.target.value as any })}
                                                                    className={styles.selectField}
                                                                >
                                                                    <option value="none">Tidak Ada</option>
                                                                    <option value="close">Tutup Penjualan (Stop Sell ON)</option>
                                                                    <option value="open">Buka Penjualan (Stop Sell OFF)</option>
                                                                </select>
                                                            </div>

                                                            {/* CTA */}
                                                            <div>
                                                                <label className={styles.inputLabel}>Closed to Arrival (CTA)</label>
                                                                <select
                                                                    value={item.ctaAction}
                                                                    onChange={e => updateMultiRow(item.id, { ctaAction: e.target.value as any })}
                                                                    className={styles.selectField}
                                                                >
                                                                    <option value="none">Tidak Ada</option>
                                                                    <option value="close">CTA ON (Tutup Kedatangan)</option>
                                                                    <option value="open">CTA OFF (Buka Kedatangan)</option>
                                                                </select>
                                                            </div>

                                                            {/* CTD */}
                                                            <div>
                                                                <label className={styles.inputLabel}>Closed to Departure (CTD)</label>
                                                                <select
                                                                    value={item.ctdAction}
                                                                    onChange={e => updateMultiRow(item.id, { ctdAction: e.target.value as any })}
                                                                    className={styles.selectField}
                                                                >
                                                                    <option value="none">Tidak Ada</option>
                                                                    <option value="close">CTD ON (Tutup Keberangkatan)</option>
                                                                    <option value="open">CTD OFF (Buka Keberangkatan)</option>
                                                                </select>
                                                            </div>

                                                            {/* Inventory Allotment */}
                                                            <div>
                                                                <label className={styles.inputLabel}>Alokasi Kuota Kamar</label>
                                                                <div style={{ display: "flex", gap: 6 }}>
                                                                    <select
                                                                        value={item.inventoryAction}
                                                                        onChange={e => updateMultiRow(item.id, { inventoryAction: e.target.value as any })}
                                                                        className={styles.selectField}
                                                                    >
                                                                        <option value="none">Tidak Ada</option>
                                                                        <option value="set">Set Kuota</option>
                                                                    </select>
                                                                    {item.inventoryAction === "set" && (
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            value={item.inventoryValue}
                                                                            onChange={e => updateMultiRow(item.id, { inventoryValue: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                                                            className={styles.inputField}
                                                                            style={{ width: "70px" }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        onClick={addMultiRow}
                                        className={styles.btnAddRow}
                                    >
                                        <Plus size={15} />
                                        <span>Tambah Entri Baru (+ Add Entry)</span>
                                    </button>
                                </div>

                                <div className={styles.batchSummaryBar} style={{ marginTop: 14 }}>
                                    <span>
                                        Ringkasan: {multiItems.length} entri pembaruan siap disinkronkan dalam 1 batched API payload.
                                    </span>
                                    <span className={styles.batchSummaryBadge}>1 Batched API Sync</span>
                                </div>
                            </div>
                        )}

                        {/* MODE: SINGLE SCOPE */}
                        {mode === "single" && (
                            <>
                                {/* 1. Date Range & Days of Week */}
                                <div className={styles.sectionBox}>
                                    <div className={styles.sectionTitle}>
                                        <Calendar size={14} />
                                        <span>1. Rentang Tanggal &amp; Hari Aktif</span>
                                    </div>

                                    <div className={styles.grid2Col}>
                                        <div>
                                            <label className={styles.inputLabel}>Dari Tanggal</label>
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={e => setDateFrom(e.target.value)}
                                                className={styles.inputField}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={styles.inputLabel}>Sampai Tanggal</label>
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={e => setDateTo(e.target.value)}
                                                className={styles.inputField}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.daysControlHeader} style={{ marginTop: 12 }}>
                                        <span className={styles.inputLabel}>Terapkan pada Hari:</span>
                                        <div className={styles.presetsGroup}>
                                            <button
                                                type="button"
                                                onClick={() => setDayPreset("all")}
                                                className={styles.btnDayPreset}
                                            >
                                                Semua Hari
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDayPreset("weekdays")}
                                                className={styles.btnDayPreset}
                                            >
                                                Hari Kerja
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDayPreset("weekends")}
                                                className={styles.btnDayPreset}
                                            >
                                                Akhir Pekan
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

                                {/* 2. Target Scope */}
                                <div className={styles.sectionBox}>
                                    <div className={styles.sectionTitle}>
                                        <Bed size={14} />
                                        <span>2. Lingkup Kategori &amp; Rate Plan</span>
                                    </div>

                                    <div className={styles.grid2Col}>
                                        <div>
                                            <label className={styles.inputLabel}>Tipe Kamar</label>
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
                                            <label className={styles.inputLabel}>Rate Plan</label>
                                            <select
                                                value={selectedRatePlans[0] || "all"}
                                                onChange={e => setSelectedRatePlans([e.target.value])}
                                                className={styles.selectField}
                                            >
                                                <option value="all">Semua Rate Plan</option>
                                                {ratePlans.map(rp => (
                                                    <option key={rp.id} value={rp.id}>{rp.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroupSpaced}>
                                        <label className={styles.inputLabel}>Saluran Distribusi (Channel)</label>
                                        <select
                                            value={selectedChannel}
                                            onChange={e => setSelectedChannel(e.target.value)}
                                            className={styles.selectField}
                                        >
                                            <option value="all">Common Pool (Semua Saluran Terhubung &amp; Master)</option>
                                            {Object.entries(channelConfigs).map(([code, cfg]: [string, any]) => (
                                                <option key={code} value={code}>
                                                    {cfg.channelName || code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* 3. Actions: Rate, Inventory, Restrictions */}
                                <div className={styles.sectionBox}>
                                    <div className={styles.sectionTitle}>
                                        <SlidersHorizontal size={14} />
                                        <span>3. Modifikasi Tarif, Kuota &amp; Restriksi</span>
                                    </div>

                                    {/* Rate Action */}
                                    <div className={`${styles.actionCard} ${rateAction !== "none" ? styles.actionCardActive : ""}`}>
                                        <div className={styles.actionCardHeader}>
                                            <div className={styles.actionCardTitleRow}>
                                                <DollarSign size={15} className={styles.iconGreen} />
                                                <span className={styles.actionCardTitle}>Penyesuaian Tarif Kamar</span>
                                            </div>
                                        </div>

                                        <div className={styles.inlineInputGroup}>
                                            <select
                                                value={rateAction}
                                                onChange={e => setRateAction(e.target.value as any)}
                                                disabled={!canChangeRate}
                                                className={styles.selectField}
                                            >
                                                <option value="none">Tidak Ada Perubahan</option>
                                                <option value="set">Set Nilai Tarif Pasti</option>
                                                <option value="inc_amount">Tambah Nominal (+)</option>
                                                <option value="dec_amount">Kurangi Nominal (-)</option>
                                                <option value="inc_percent">Tambah Persentase (+%)</option>
                                                <option value="dec_percent">Kurangi Persentase (-%)</option>
                                            </select>

                                            {rateAction !== "none" && (
                                                <>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={rateAction.includes("percent") ? "1" : currConfig.step}
                                                        value={rateInputStr}
                                                        onChange={e => {
                                                            setRateInputStr(e.target.value);
                                                            const parsed = parseFloat(e.target.value);
                                                            if (!isNaN(parsed) && parsed >= 0) {
                                                                setRateValue(parsed);
                                                            }
                                                        }}
                                                        className={`${styles.inputField} ${styles.rateValueInput}`}
                                                        placeholder={ratePlaceholder}
                                                        required
                                                    />
                                                    <span className={styles.unitLabel}>
                                                        {rateAction.includes("percent") ? "%" : `${currConfig.code} (${currConfig.symbol})`}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inventory Allotment */}
                                    <div className={`${styles.actionCard} ${styles.actionCardSpaced} ${inventoryAction !== "none" ? styles.actionCardActive : ""}`}>
                                        <div className={styles.actionCardHeader}>
                                            <div className={styles.actionCardTitleRow}>
                                                <Bed size={15} className={styles.iconBlue} />
                                                <span className={styles.actionCardTitle}>Alokasi Kuota Kamar (Allotment)</span>
                                            </div>
                                        </div>

                                        <div className={styles.inlineInputGroup}>
                                            <select
                                                value={inventoryAction}
                                                onChange={e => setInventoryAction(e.target.value as any)}
                                                disabled={!canChangeInventory}
                                                className={styles.selectField}
                                            >
                                                <option value="none">Tidak Ada Perubahan</option>
                                                <option value="set">Set Kuota Tersedia</option>
                                            </select>

                                            {inventoryAction === "set" && (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={inventoryValue}
                                                    onChange={e => setInventoryValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                                    className={`${styles.inputField} ${styles.inventoryValueInput}`}
                                                    placeholder="0"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Stop Sell */}
                                    <div className={`${styles.actionCard} ${styles.actionCardSpaced} ${stopSellAction !== "none" ? styles.actionCardDanger : ""}`}>
                                        <div className={styles.actionCardHeader}>
                                            <div className={styles.actionCardTitleRow}>
                                                <span className={styles.actionCardTitle}>Status Stop Sell (Buka / Tutup)</span>
                                            </div>
                                        </div>

                                        <div className={styles.inlineInputGroup}>
                                            <select
                                                value={stopSellAction}
                                                onChange={e => setStopSellAction(e.target.value as any)}
                                                disabled={!canStopSell}
                                                className={styles.selectField}
                                            >
                                                <option value="none">Tidak Ada Perubahan</option>
                                                <option value="close">Tutup Penjualan (Stop Sell ON)</option>
                                                <option value="open">Buka Penjualan (Stop Sell OFF)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Additional Single Restrictions */}
                                    <div className={`${styles.actionCard} ${styles.actionCardSpaced}`}>
                                        <div className={styles.grid2Col}>
                                            <div>
                                                <label className={styles.inputLabel}>Min Stay Arrival</label>
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <select
                                                        value={minStayArrAction}
                                                        onChange={e => setMinStayArrAction(e.target.value as any)}
                                                        className={styles.selectField}
                                                    >
                                                        <option value="none">Tidak Ada</option>
                                                        <option value="set">Set Min</option>
                                                        <option value="remove">Hapus</option>
                                                    </select>
                                                    {minStayArrAction === "set" && (
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={30}
                                                            value={minStayArrValue}
                                                            onChange={e => setMinStayArrValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                            className={styles.inputField}
                                                            style={{ width: "70px" }}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className={styles.inputLabel}>Min Stay Through</label>
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <select
                                                        value={minStayThruAction}
                                                        onChange={e => setMinStayThruAction(e.target.value as any)}
                                                        className={styles.selectField}
                                                    >
                                                        <option value="none">Tidak Ada</option>
                                                        <option value="set">Set Min</option>
                                                        <option value="remove">Hapus</option>
                                                    </select>
                                                    {minStayThruAction === "set" && (
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={30}
                                                            value={minStayThruValue}
                                                            onChange={e => setMinStayThruValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                            className={styles.inputField}
                                                            style={{ width: "70px" }}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className={styles.inputLabel}>Closed to Arrival (CTA)</label>
                                                <select
                                                    value={ctaAction}
                                                    onChange={e => setCtaAction(e.target.value as any)}
                                                    className={styles.selectField}
                                                >
                                                    <option value="none">Tidak Ada</option>
                                                    <option value="close">CTA ON (Tutup)</option>
                                                    <option value="open">CTA OFF (Buka)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className={styles.inputLabel}>Closed to Departure (CTD)</label>
                                                <select
                                                    value={ctdAction}
                                                    onChange={e => setCtdAction(e.target.value as any)}
                                                    className={styles.selectField}
                                                >
                                                    <option value="none">Tidak Ada</option>
                                                    <option value="close">CTD ON (Tutup)</option>
                                                    <option value="open">CTD OFF (Buka)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.btnCancel}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={styles.btnSubmit}
                        >
                            <Check size={16} />
                            <span>
                                {saving
                                    ? "Menyimpan & Menyinkronkan..."
                                    : mode === "multi"
                                        ? `Terapkan Pembaruan Batch (${multiItems.length} Entri)`
                                        : "Terapkan Pembaruan ARI"}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
