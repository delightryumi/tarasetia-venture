"use client";

import React, { useState } from "react";
import {
    X,
    Calendar,
    SlidersHorizontal,
    Check,
    Bed,
    DollarSign,
    Ban,
    Clock,
    Lock
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

    // 1. Date Range
    const [dateFrom, setDateFrom] = useState<string>(todayStr);
    const [dateTo, setDateTo] = useState<string>(defaultEndStr);

    // Days of Week (0=Sun, 1=Mon, ..., 6=Sat)
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

    // Target Scope
    const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(["all"]);
    const [selectedRatePlans, setSelectedRatePlans] = useState<string[]>(["all"]);
    const [selectedChannel, setSelectedChannel] = useState<string>("all");

    // All 8 Restrictions:
    // 1. Rate Action
    const [rateAction, setRateAction] = useState<BulkUpdateParams["rateAction"]>("none");
    const [rateValue, setRateValue] = useState<number>(0);

    // 2. Inventory (Availability) Action
    const [inventoryAction, setInventoryAction] = useState<BulkUpdateParams["inventoryAction"]>("none");
    const [inventoryValue, setInventoryValue] = useState<number>(0);

    // 3. Stop Sell Action
    const [stopSellAction, setStopSellAction] = useState<BulkUpdateParams["stopSellAction"]>("none");

    // 4. Min Stay Arrival Action
    const [minStayArrAction, setMinStayArrAction] = useState<"none" | "set" | "remove">("none");
    const [minStayArrValue, setMinStayArrValue] = useState<number>(1);

    // 5. Min Stay Through Action
    const [minStayThruAction, setMinStayThruAction] = useState<"none" | "set" | "remove">("none");
    const [minStayThruValue, setMinStayThruValue] = useState<number>(1);

    // 6. Max Stay Action
    const [maxStayAction, setMaxStayAction] = useState<"none" | "set" | "remove">("none");
    const [maxStayValue, setMaxStayValue] = useState<number>(14);

    // 7. Closed To Arrival (CTA) Action
    const [ctaAction, setCtaAction] = useState<BulkUpdateParams["ctaAction"]>("none");

    // 8. Closed To Departure (CTD) Action
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
            minStayArrivalAction: minStayArrAction,
            minStayArrivalValue: minStayArrAction === "set" ? minStayArrValue : undefined,
            minStayThroughAction: minStayThruAction,
            minStayThroughValue: minStayThruAction === "set" ? minStayThruValue : undefined,
            maxStayAction,
            maxStayValue: maxStayAction === "set" ? maxStayValue : undefined,
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

    const hasAnyRestrictionChange = 
        minStayArrAction !== "none" ||
        minStayThruAction !== "none" ||
        maxStayAction !== "none" ||
        ctaAction !== "none" ||
        ctdAction !== "none";

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderLeft}>
                        <SlidersHorizontal size={20} className={styles.headerIcon} />
                        <h3 className={styles.modalTitle}>Bulk Update: Rates, Inventory &amp; 8 Restrictions</h3>
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
                            <span>1. Date Range and Days of Week</span>
                        </div>

                        <div className={styles.grid2Col}>
                            <div>
                                <label className={styles.inputLabel}>From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className={styles.inputField}
                                    required
                                />
                            </div>
                            <div>
                                <label className={styles.inputLabel}>To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className={styles.inputField}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.daysControlHeader}>
                            <span className={styles.inputLabel}>Apply to Days of Week:</span>
                            <div className={styles.presetsGroup}>
                                <button
                                    type="button"
                                    onClick={() => setDayPreset("all")}
                                    className={styles.btnDayPreset}
                                >
                                    All Days
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDayPreset("weekdays")}
                                    className={styles.btnDayPreset}
                                >
                                    Weekdays Only
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDayPreset("weekends")}
                                    className={styles.btnDayPreset}
                                >
                                    Weekends Only
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
                            <span>2. Target Categories, Rate Plans &amp; Channels</span>
                        </div>

                        <div className={styles.grid2Col}>
                            <div>
                                <label className={styles.inputLabel}>Room Category Scope</label>
                                <select
                                    value={selectedRoomTypes[0] || "all"}
                                    onChange={e => setSelectedRoomTypes([e.target.value])}
                                    className={styles.selectField}
                                >
                                    <option value="all">All Room Categories</option>
                                    {roomTypes.map(rt => (
                                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={styles.inputLabel}>Rate Plan Scope</label>
                                <select
                                    value={selectedRatePlans[0] || "all"}
                                    onChange={e => setSelectedRatePlans([e.target.value])}
                                    className={styles.selectField}
                                >
                                    <option value="all">All Rate Plans</option>
                                    {ratePlans.map(rp => (
                                        <option key={rp.id} value={rp.id}>{rp.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.fieldGroupSpaced}>
                            <label className={styles.inputLabel}>Channel Pool Scope</label>
                            <select
                                value={selectedChannel}
                                onChange={e => setSelectedChannel(e.target.value)}
                                className={styles.selectField}
                            >
                                <option value="all">Common Pool (Applies to Master and Connected Channels)</option>
                                {Object.entries(channelConfigs).map(([code, cfg]: [string, any]) => (
                                    <option key={code} value={code}>
                                        {cfg.channelName || code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 3. Actions: Rates, Availability & All 8 Restrictions */}
                    <div className={styles.sectionBox}>
                        <div className={styles.sectionTitle}>
                            <SlidersHorizontal size={14} />
                            <span>3. Restriction Modifiers</span>
                        </div>

                        {/* Rate Modifier */}
                        <div className={`${styles.actionCard} ${rateAction !== "none" ? styles.actionCardActive : ""}`}>
                            <div className={styles.actionCardHeader}>
                                <div>
                                    <div className={styles.actionCardTitleRow}>
                                        <DollarSign size={15} className={styles.iconGreen} />
                                        <span className={styles.actionCardTitle}>Rate Adjustment (Room Price)</span>
                                    </div>
                                    <p className={styles.actionCardSubtitle}>
                                        Set exact rate or apply percentage / flat amount increments
                                    </p>
                                </div>
                            </div>

                            <div className={styles.inlineInputGroup}>
                                <select
                                    value={rateAction}
                                    onChange={e => setRateAction(e.target.value as any)}
                                    disabled={!canChangeRate}
                                    className={styles.selectField}
                                >
                                    <option value="none">No Change</option>
                                    <option value="set">Set Exact Rate</option>
                                    <option value="inc_amount">Increase by Amount (+)</option>
                                    <option value="dec_amount">Decrease by Amount (-)</option>
                                    <option value="inc_percent">Increase by Percentage (+%)</option>
                                    <option value="dec_percent">Decrease by Percentage (-%)</option>
                                </select>

                                {rateAction !== "none" && (
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={rateValue}
                                        onChange={e => {
                                            const parsed = parseFloat(e.target.value);
                                            setRateValue(isNaN(parsed) ? 0 : Math.max(0, Math.round((parsed + Number.EPSILON) * 100) / 100));
                                        }}
                                        onWheel={e => e.currentTarget.blur()}
                                        className={`${styles.inputField} ${styles.rateValueInput}`}
                                        placeholder="0"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Inventory Allotment */}
                        <div className={`${styles.actionCard} ${styles.actionCardSpaced} ${inventoryAction !== "none" ? styles.actionCardActive : ""}`}>
                            <div className={styles.actionCardHeader}>
                                <div>
                                    <div className={styles.actionCardTitleRow}>
                                        <Bed size={15} className={styles.iconBlue} />
                                        <span className={styles.actionCardTitle}>Availability Allotment</span>
                                    </div>
                                    <p className={styles.actionCardSubtitle}>
                                        Set total physical units available to sell across OTAs
                                    </p>
                                </div>
                            </div>

                            <div className={styles.inlineInputGroup}>
                                <select
                                    value={inventoryAction}
                                    onChange={e => setInventoryAction(e.target.value as any)}
                                    disabled={!canChangeInventory}
                                    className={styles.selectField}
                                >
                                    <option value="none">No Change</option>
                                    <option value="set">Set Fixed Allotment</option>
                                </select>

                                {inventoryAction === "set" && (
                                    <>
                                        <input
                                            type="number"
                                            min={0}
                                            value={inventoryValue}
                                            onChange={e => setInventoryValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                            onWheel={e => e.currentTarget.blur()}
                                            className={`${styles.inputField} ${styles.inventoryValueInput}`}
                                            placeholder="0"
                                        />
                                        <span className={styles.unitLabel}>Units</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stop Sell */}
                        <div className={`${styles.actionCard} ${styles.actionCardSpaced} ${stopSellAction !== "none" ? (stopSellAction === "close" ? styles.actionCardDanger : styles.actionCardActive) : ""}`}>
                            <div className={styles.actionCardHeader}>
                                <div>
                                    <div className={styles.actionCardTitleRow}>
                                        <Ban size={15} className={styles.iconRed} />
                                        <span className={styles.actionCardTitle}>Stop Sell (Sales Blackout)</span>
                                    </div>
                                    <p className={styles.actionCardSubtitle}>
                                        Block sales immediately without changing allotment count
                                    </p>
                                </div>
                            </div>

                            <div className={styles.inlineInputGroup}>
                                <select
                                    value={stopSellAction}
                                    onChange={e => setStopSellAction(e.target.value as any)}
                                    disabled={!canStopSell}
                                    className={styles.selectField}
                                >
                                    <option value="none">No Change</option>
                                    <option value="close">🚫 Close Sales (Stop Sell ON)</option>
                                    <option value="open">✓ Open Sales (Stop Sell OFF)</option>
                                </select>
                            </div>
                        </div>

                        {/* Advanced Stay & Arrival Restrictions: Min Stay Arr, Min Stay Thru, Max Stay, CTA, CTD */}
                        <div className={`${styles.actionCard} ${styles.actionCardSpaced} ${hasAnyRestrictionChange ? styles.actionCardActive : ""}`}>
                            <div className={styles.actionCardHeader}>
                                <div>
                                    <div className={styles.actionCardTitleRow}>
                                        <Clock size={15} className={styles.iconAmber} />
                                        <span className={styles.actionCardTitle}>Stay &amp; Check-in Restrictions</span>
                                    </div>
                                    <p className={styles.actionCardSubtitle}>
                                        Control Min Stay Arrival, Min Stay Through, Max Stay, CTA, and CTD locks
                                    </p>
                                </div>
                            </div>

                            <div className={styles.restrictionsGrid}>
                                {/* 4. Min Stay Arrival */}
                                <div className={styles.restrictionFieldBlock}>
                                    <label className={styles.inputLabel}>Min Stay Arrival (Nights):</label>
                                    <div className={styles.restrictionInputRow}>
                                        <select
                                            value={minStayArrAction}
                                            onChange={e => setMinStayArrAction(e.target.value as any)}
                                            className={`${styles.selectField} ${styles.compactSelect}`}
                                        >
                                            <option value="none">No Change</option>
                                            <option value="set">Set Min</option>
                                            <option value="remove">Remove (1)</option>
                                        </select>
                                        {minStayArrAction === "set" && (
                                            <input
                                                type="number"
                                                min={1}
                                                max={30}
                                                value={minStayArrValue}
                                                onChange={e => setMinStayArrValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                className={`${styles.inputField} ${styles.compactNumberInput}`}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* 5. Min Stay Through */}
                                <div className={styles.restrictionFieldBlock}>
                                    <label className={styles.inputLabel}>Min Stay Through (Nights):</label>
                                    <div className={styles.restrictionInputRow}>
                                        <select
                                            value={minStayThruAction}
                                            onChange={e => setMinStayThruAction(e.target.value as any)}
                                            className={`${styles.selectField} ${styles.compactSelect}`}
                                        >
                                            <option value="none">No Change</option>
                                            <option value="set">Set Min</option>
                                            <option value="remove">Remove (1)</option>
                                        </select>
                                        {minStayThruAction === "set" && (
                                            <input
                                                type="number"
                                                min={1}
                                                max={30}
                                                value={minStayThruValue}
                                                onChange={e => setMinStayThruValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                className={`${styles.inputField} ${styles.compactNumberInput}`}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* 6. Max Stay */}
                                <div className={styles.restrictionFieldBlock}>
                                    <label className={styles.inputLabel}>Max Stay (Nights):</label>
                                    <div className={styles.restrictionInputRow}>
                                        <select
                                            value={maxStayAction}
                                            onChange={e => setMaxStayAction(e.target.value as any)}
                                            className={`${styles.selectField} ${styles.compactSelect}`}
                                        >
                                            <option value="none">No Change</option>
                                            <option value="set">Set Max</option>
                                            <option value="remove">Remove (None)</option>
                                        </select>
                                        {maxStayAction === "set" && (
                                            <input
                                                type="number"
                                                min={1}
                                                max={365}
                                                value={maxStayValue}
                                                onChange={e => setMaxStayValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                className={`${styles.inputField} ${styles.compactNumberInput}`}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* 7. Closed to Arrival (CTA) */}
                                <div className={styles.restrictionFieldBlock}>
                                    <label className={styles.inputLabel}>Closed to Arrival (CTA):</label>
                                    <select
                                        value={ctaAction}
                                        onChange={e => setCtaAction(e.target.value as any)}
                                        className={`${styles.selectField} ${styles.compactSelect}`}
                                    >
                                        <option value="none">No Change</option>
                                        <option value="close">🚫 Closed to Arrival (CTA ON)</option>
                                        <option value="open">✓ Open to Arrival (CTA OFF)</option>
                                    </select>
                                </div>

                                {/* 8. Closed to Departure (CTD) */}
                                <div className={styles.restrictionFieldBlock}>
                                    <label className={styles.inputLabel}>Closed to Departure (CTD):</label>
                                    <select
                                        value={ctdAction}
                                        onChange={e => setCtdAction(e.target.value as any)}
                                        className={`${styles.selectField} ${styles.compactSelect}`}
                                    >
                                        <option value="none">No Change</option>
                                        <option value="close">🚫 Closed to Departure (CTD ON)</option>
                                        <option value="open">✓ Open to Departure (CTD OFF)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.btnCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={styles.btnSubmit}
                        >
                            <Check size={16} />
                            <span>{saving ? "Applying Updates..." : "Apply Bulk Update"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
