"use client";

import React, { useState } from "react";
import {
    X,
    Calendar,
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

    // Close on Escape key press (WCAG AA Accessibility)
    React.useEffect(() => {
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
        { idx: 1, label: "Mon" },
        { idx: 2, label: "Tue" },
        { idx: 3, label: "Wed" },
        { idx: 4, label: "Thu" },
        { idx: 5, label: "Fri" },
        { idx: 6, label: "Sat" },
        { idx: 0, label: "Sun" }
    ];

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <SlidersHorizontal size={18} style={{ color: "#2563eb" }} />
                        <h3 className={styles.modalTitle}>Bulk Update: Rates, Inventory &amp; Restrictions</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeBtn}
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    {/* 1. Date Range & Days of Week */}
                    <div className={styles.sectionBox}>
                        <div className={styles.sectionTitle}>
                            <Calendar size={14} />
                            <span>1. Date Range &amp; Days of Week</span>
                        </div>

                        <div className={styles.grid2Col}>
                            <div>
                                <label className={styles.inputLabel}>
                                    From Date
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
                                    To Date
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
                                    Active Days of Week
                                </label>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setDayPreset("all")}
                                        className={styles.btnDayPreset}
                                    >
                                        All
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

                    {/* 2. Target Channel, Room Types & Rate Plans */}
                    <div className={styles.sectionBox}>
                        <div className={styles.sectionTitle}>
                            <SlidersHorizontal size={14} />
                            <span>2. Target Channel, Room Types &amp; Rate Plans</span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                            <div>
                                <label className={styles.inputLabel}>
                                    Target Distribution Channel
                                </label>
                                <select
                                    value={selectedChannel}
                                    onChange={e => setSelectedChannel(e.target.value)}
                                    className={styles.selectField}
                                    style={{ fontWeight: 600 }}
                                >
                                    <option value="all">🌐 All Channels (Common Pool)</option>
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
                                    Room Types
                                </label>
                                <select
                                    value={selectedRoomTypes[0] || "all"}
                                    onChange={e => setSelectedRoomTypes([e.target.value])}
                                    className={styles.selectField}
                                >
                                    <option value="all">All Room Types</option>
                                    {roomTypes.map(rt => (
                                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={styles.inputLabel}>
                                    Rate Plans
                                </label>
                                <select
                                    value={selectedRatePlans[0] || "all"}
                                    onChange={e => setSelectedRatePlans([e.target.value])}
                                    className={styles.selectField}
                                >
                                    <option value="all">All Rate Plans</option>
                                    {ratePlans.map(rp => (
                                        <option key={rp.id} value={rp.id}>{rp.name} ({rp.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Action Updates (Rates, StopSell, Inventory, Restrictions) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* A. Rate Adjustment */}
                        <div className={`${styles.actionCard} ${rateAction !== "none" ? styles.actionCardActive : ""}`}>
                            <div className={styles.actionCardHeader}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <DollarSign size={15} style={{ color: "#16a34a" }} />
                                    <span className={styles.actionCardTitle}>
                                        Rate Adjustment (Pricing)
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
                                    <option value="none">{!canChangeRate ? "No Permission" : "No Change"}</option>
                                    <option value="set">Set Fixed Rate (Exact Amount)</option>
                                    <option value="inc_amount">Increase by Amount (+)</option>
                                    <option value="dec_amount">Decrease by Amount (-)</option>
                                    <option value="inc_percent">Increase by Percent (+%)</option>
                                    <option value="dec_percent">Decrease by Percent (-%)</option>
                                </select>
                            </div>
                            {rateAction !== "none" && canChangeRate && (
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                                    <label style={{ fontSize: "11px", color: "#64748b" }}>
                                        Adjustment Value:
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
                                        {rateAction.includes("percent") ? "%" : "IDR"}
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
                                            Stop Sell (Open / Close Sales)
                                        </span>
                                    </div>
                                    <p className={styles.actionCardSubtitle} style={{ marginTop: "2px" }}>
                                        Open or close sales availability for the selected dates
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
                                    <option value="none">{!canStopSell ? "No Permission" : "No Change"}</option>
                                    <option value="close">🚫 Close Sales (Stop Sell ON)</option>
                                    <option value="open">✓ Open Sales (Stop Sell OFF)</option>
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
                                            Room Inventory (Availability Allotment)
                                        </span>
                                    </div>
                                    <p className={styles.actionCardSubtitle} style={{ marginTop: "2px" }}>
                                        Set physical room inventory quota for the selected dates
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
                                    <option value="none">{!canChangeInventory ? "No Permission" : "No Change"}</option>
                                    <option value="set">Set Available Units</option>
                                </select>
                            </div>
                            {inventoryAction === "set" && (
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                                    <label style={{ fontSize: "11px", color: "#64748b" }}>
                                        Available Units:
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
                                        Units
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
                                            Booking Restrictions (Min Stay, CTA, CTD)
                                        </span>
                                    </div>
                                    <p className={styles.actionCardSubtitle} style={{ marginTop: "2px" }}>
                                        Set minimum stay nights and control arrival (CTA) / departure (CTD) locks
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "12px" }}>
                                {/* Min Stay */}
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                                        Minimum Length of Stay (Nights):
                                    </label>
                                    <div style={{ display: "flex", gap: "6px" }}>
                                        <select
                                            value={minStayAction}
                                            onChange={e => setMinStayAction(e.target.value as any)}
                                            className={styles.selectField}
                                            style={{ height: "30px", fontSize: "11px" }}
                                        >
                                            <option value="none">No Change</option>
                                            <option value="set">Set Min Stay</option>
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
                                        <option value="none">No Change</option>
                                        <option value="close">🚫 Closed to Arrival (CTA ON)</option>
                                        <option value="open">✓ Open to Arrival (CTA OFF)</option>
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
                                        <option value="none">No Change</option>
                                        <option value="close">🚫 Closed to Departure (CTD ON)</option>
                                        <option value="open">✓ Open to Departure (CTD OFF)</option>
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={styles.btnSubmit}
                        >
                            <Check size={14} />
                            <span>{saving ? "Applying Updates..." : "Apply Bulk Update"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
