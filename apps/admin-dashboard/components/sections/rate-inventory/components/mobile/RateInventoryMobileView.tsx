"use client";

import React, { useState, useMemo } from "react";
import { 
    ChevronLeft, ChevronRight, Calendar, SlidersHorizontal, 
    Save, RotateCcw, Bed, DollarSign, Ban, Check, Sparkles, X, Edit3, ShieldAlert
} from "lucide-react";
import s from "./RateInventoryMobileView.module.css";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

interface RateInventoryMobileViewProps {
    hotelName?: string;
    matrix: any[];
    dateList: string[];
    startDate: string;
    setStartDate: (d: string) => void;
    shiftDate: (days: number) => void;
    jumpToToday: () => void;
    stageEdit: (key: string, value: any) => void;
    stagedUpdates: Record<string, any>;
    unsavedCount: number;
    saveAllChanges: () => Promise<void>;
    resetStaged: () => void;
    saving: boolean;
    openBulkModal: () => void;
    canStopSell: boolean;
    canChangeRate: boolean;
    canChangeInventory: boolean;
    channelFilter: string;
}

export function RateInventoryMobileView({
    hotelName,
    matrix,
    dateList,
    startDate,
    setStartDate,
    shiftDate,
    jumpToToday,
    stageEdit,
    stagedUpdates,
    unsavedCount,
    saveAllChanges,
    resetStaged,
    saving,
    openBulkModal,
    canStopSell,
    canChangeRate,
    canChangeInventory,
    channelFilter
}: RateInventoryMobileViewProps) {
    const { currencyCode, formatCurrency, config: currConfig } = useCurrency();
    // Current selected date inside the mobile strip
    const [selectedDate, setSelectedDate] = useState<string>(() => dateList[0] || startDate);
    
    // Make sure selectedDate stays in range or updates when dateList shifts
    React.useEffect(() => {
        if (!dateList.includes(selectedDate)) {
            setSelectedDate(dateList[0] || startDate);
        }
    }, [dateList, selectedDate, startDate]);

    // Active sub-mode in mobile: "allotment" | "rate" | "restrictions"
    const [mobileMode, setMobileMode] = useState<"allotment" | "rate" | "restrictions">("allotment");

    // Quick Price edit modal state
    const [priceModalData, setPriceModalData] = useState<{
        roomTypeId: string;
        ratePlanId: string;
        ratePlanName: string;
        currentRate: number;
        dateStr: string;
    } | null>(null);
    const [priceInputValue, setPriceInputValue] = useState<string>("");

    const openPriceModal = (roomTypeId: string, ratePlanId: string, ratePlanName: string, currentRate: number, dateStr: string) => {
        if (!canChangeRate) {
            toast.error("You do not have permission to edit rates.");
            return;
        }
        setPriceModalData({ roomTypeId, ratePlanId, ratePlanName, currentRate, dateStr });
        setPriceInputValue(String(currentRate));
    };

    const handleSavePriceModal = () => {
        if (!priceModalData) return;
        const val = currConfig.decimals === 0
            ? parseInt(priceInputValue.replace(/\D/g, ""), 10)
            : parseFloat(priceInputValue.replace(/[^0-9.]/g, ""));
        if (isNaN(val) || val < 0) {
            toast.error("Please enter a valid price amount");
            return;
        }
        const key = channelFilter && channelFilter !== "all"
            ? `channelRate_${channelFilter}_${priceModalData.roomTypeId}_${priceModalData.ratePlanId}_${priceModalData.dateStr}`
            : `rate_${priceModalData.roomTypeId}_${priceModalData.ratePlanId}_${priceModalData.dateStr}`;
        stageEdit(key, val);
        setPriceModalData(null);
        toast.success(`Rate updated to ${currConfig.code} ${formatCurrency(val)}`);
    };

    // Format selected date header in standard English
    const selectedDateObj = useMemo(() => {
        try {
            const [y, m, d] = selectedDate.split("-").map(Number);
            return new Date(y, m - 1, d);
        } catch {
            return new Date();
        }
    }, [selectedDate]);

    const formattedMonth = useMemo(() => {
        return selectedDateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }, [selectedDateObj]);

    return (
        <div className={s.mobileRoot}>
            {/* ── 1. 3D Top Hotel Info Card ── */}
            <div className={s.topBarCard}>
                <div className={s.hotelMeta}>
                    <h2 className={s.hotelTitle}>{hotelName || "Hotel Property"}</h2>
                    <div className={s.hotelSub}>
                        <span className={s.liveDot} />
                        <span>Rate &amp; Inventory Control</span>
                    </div>
                </div>

                <div className={s.topActions}>
                    <button 
                        type="button"
                        onClick={openBulkModal}
                        className={s.iconBtn3D}
                        title="Bulk Update"
                        aria-label="Bulk Update"
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* ── 2. 3D Mode Selector Pills ── */}
            <div className={s.modeSelector}>
                <button
                    type="button"
                    onClick={() => setMobileMode("allotment")}
                    className={`${s.modeTabBtn} ${mobileMode === "allotment" ? s.modeTabBtnActive : ""}`}
                >
                    <Bed size={15} />
                    <span>Inventory</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMobileMode("rate")}
                    className={`${s.modeTabBtn} ${mobileMode === "rate" ? s.modeTabBtnActive : ""}`}
                >
                    <DollarSign size={15} />
                    <span>Rates</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMobileMode("restrictions")}
                    className={`${s.modeTabBtn} ${mobileMode === "restrictions" ? s.modeTabBtnActive : ""}`}
                >
                    <Ban size={15} />
                    <span>Stop Sell</span>
                </button>
            </div>

            {/* ── 3. Date Navigator Header & Today Button ── */}
            <div className={s.dateNavHeader}>
                <span className={s.dateMonthLabel}>{formattedMonth}</span>
                <button 
                    type="button" 
                    onClick={jumpToToday} 
                    className={s.todayBtn3D}
                >
                    Today
                </button>
            </div>

            {/* ── 4. Horizontal 3D Date Strip ── */}
            <div className={s.dateStripWrapper}>
                <button 
                    type="button" 
                    onClick={() => shiftDate(-7)} 
                    className={s.dateStepperEdgeBtn}
                    title="Previous 7 days"
                    aria-label="Previous 7 days"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className={s.dateStripScroll}>
                    {dateList.map((dStr) => {
                        const [y, m, d] = dStr.split("-").map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                        const isSelected = dStr === selectedDate;

                        // Check if any room or rate plan in hotel has stop sell on this date
                        const isDateStopSell = matrix.some((rt: any) => {
                            if (rt.days?.[dStr]?.stopSell) return true;
                            return (rt.ratePlans || []).some((rp: any) => !!rp.days?.[dStr]?.stopSell);
                        });

                        return (
                            <button
                                key={dStr}
                                type="button"
                                onClick={() => setSelectedDate(dStr)}
                                className={`${s.datePill} ${isSelected ? s.datePillActive : ""}`}
                            >
                                <span className={s.datePillDay}>{dayName}</span>
                                <span className={s.datePillNum}>{d}</span>
                                {isDateStopSell ? (
                                    <span className={`${s.datePillDot} ${s.datePillStopDot}`}>STOP</span>
                                ) : (
                                    <span className={s.datePillDot}>Active</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <button 
                    type="button" 
                    onClick={() => shiftDate(7)} 
                    className={s.dateStepperEdgeBtn}
                    title="Next 7 days"
                    aria-label="Next 7 days"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* ── 5. 3D Room Cards List for Selected Date ── */}
            <div className={s.roomListContainer}>
                {matrix.map((rt) => {
                    const dayData = rt.days?.[selectedDate] || {};
                    const availableRooms = dayData.availableRooms ?? (rt.totalPhysicalRooms || 1);
                    const isSoldOut = availableRooms <= 0;
                    const isStopSell = !!dayData.stopSell || (rt.ratePlans || []).some((rp: any) => !!rp.days?.[selectedDate]?.stopSell);

                    const invKey = channelFilter && channelFilter !== "all"
                        ? `channelAllotment_${channelFilter}_${rt.roomTypeId}_${selectedDate}`
                        : `inv_${rt.roomTypeId}_${selectedDate}`;

                    const handleIncrementInv = () => {
                        if (!canChangeInventory) {
                            toast.error("You do not have permission to modify inventory.");
                            return;
                        }
                        const nextVal = availableRooms + 1;
                        stageEdit(invKey, nextVal);
                    };

                    const handleDecrementInv = () => {
                        if (!canChangeInventory) {
                            toast.error("You do not have permission to modify inventory.");
                            return;
                        }
                        if (availableRooms <= 0) return;
                        const nextVal = Math.max(0, availableRooms - 1);
                        stageEdit(invKey, nextVal);
                    };

                    return (
                        <div key={rt.roomTypeId} className={s.room3DCard}>
                            {/* Card Header */}
                            <div className={s.roomCardHeader}>
                                <div>
                                    <span className={s.roomMetaTag}>{rt.roomTypeCode || "ROOM"}</span>
                                    <h3 className={s.roomName}>{rt.roomTypeName}</h3>
                                </div>
                                <div className={s.badgeGroup}>
                                    {isStopSell && (
                                        <span className={`${s.roomBadge3D} ${s.badgeStopSell}`}>
                                            <Ban size={11} strokeWidth={2.5} />
                                            <span>Stop Sell</span>
                                        </span>
                                    )}
                                    <span className={`${s.roomBadge3D} ${isSoldOut ? s.badgeSoldOut : s.badgeAvailable}`}>
                                        {isSoldOut ? "Sold Out" : `${availableRooms} Available`}
                                    </span>
                                </div>
                            </div>

                            {/* Section: Allotment Stepper (Mode 1) */}
                            {mobileMode === "allotment" && (
                                <div className={s.stepperWrapper}>
                                    {isStopSell && (
                                        <div className={s.stopSellNoticeBanner}>
                                            <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                                            <span>Stop Sell Aktif: Kamar ini ditutup untuk penjualan pada tanggal ini</span>
                                        </div>
                                    )}
                                    <div className={s.stepperSection}>
                                        <div className={s.stepperLabelGroup}>
                                            <span className={s.stepperLabel}>Room Inventory</span>
                                            <span className={s.stepperSub}>Sellable allotment</span>
                                        </div>
                                        <div className={s.stepperControl}>
                                            <button 
                                                type="button" 
                                                onClick={handleDecrementInv} 
                                                className={s.stepBtn3D}
                                                disabled={availableRooms <= 0}
                                                aria-label="Decrease allotment"
                                            >
                                                -
                                            </button>
                                            <span className={s.stepValue}>{availableRooms}</span>
                                            <button 
                                                type="button" 
                                                onClick={handleIncrementInv} 
                                                className={s.stepBtn3D}
                                                aria-label="Increase allotment"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section: Rate Plans (Mode 2) */}
                            {mobileMode === "rate" && (
                                <div className={s.ratePlansList}>
                                    {(rt.ratePlans || []).map((rp: any) => {
                                        const rpDay = rp.days?.[selectedDate] || {};
                                        const currentPrice = rpDay.rate || rt.basePrice || 0;
                                        const rpStopSell = !!rpDay.stopSell;

                                        return (
                                            <div key={rp.ratePlanId} className={`${s.ratePlanRow} ${rpStopSell ? s.ratePlanRowStopSell : ""}`}>
                                                <div className={s.ratePlanInfo}>
                                                    <span className={s.ratePlanName}>{rp.ratePlanName}</span>
                                                    {rpStopSell && (
                                                        <span className={s.stopSellInlineTag}>
                                                            <Ban size={10} strokeWidth={2.5} /> STOP SELL
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={s.ratePriceBox}>
                                                    <span className={`${s.priceTag3D} ${rpStopSell ? s.priceTagStopSell : ""}`}>
                                                        {currConfig.code} {formatCurrency(currentPrice)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => openPriceModal(rt.roomTypeId, rp.ratePlanId, rp.ratePlanName, currentPrice, selectedDate)}
                                                        className={s.priceEditBtn}
                                                        title="Edit Rate"
                                                        aria-label={`Edit Rate for ${rp.ratePlanName}`}
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Section: Stop Sell / Restrictions (Mode 3) */}
                            {mobileMode === "restrictions" && (
                                <div className={s.ratePlansList}>
                                    {(rt.ratePlans || []).map((rp: any) => {
                                        const rpDay = rp.days?.[selectedDate] || {};
                                        const rpStopSell = !!rpDay.stopSell;
                                        const stopKey = channelFilter && channelFilter !== "all"
                                            ? `channelStopSell_${channelFilter}_${rt.roomTypeId}_${rp.ratePlanId}_${selectedDate}`
                                            : `stopSell_${rt.roomTypeId}_${rp.ratePlanId}_${selectedDate}`;

                                        const handleToggleStopSell = () => {
                                            if (!canStopSell) {
                                                toast.error("You do not have permission to toggle Stop Sell.");
                                                return;
                                            }
                                            stageEdit(stopKey, !rpStopSell);
                                        };

                                        return (
                                            <div key={rp.ratePlanId} className={s.toggleRow}>
                                                <span className={s.toggleLabel}>{rp.ratePlanName}</span>
                                                <button
                                                    type="button"
                                                    onClick={handleToggleStopSell}
                                                    className={`${s.stopSellToggleBtn} ${rpStopSell ? s.stopSellActive : ""}`}
                                                    aria-label={`Toggle Stop Sell for ${rp.ratePlanName}`}
                                                >
                                                    <Ban size={14} />
                                                    <span>{rpStopSell ? "Stop Sell (Closed)" : "Open Sell"}</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── 6. Sticky Bottom 3D Action Save Dock ── */}
            {unsavedCount > 0 && (
                <div className={s.stickySaveDock}>
                    <div className={s.dockCountText}>
                        <span className={s.dockCountTitle}>{unsavedCount} Unsaved Changes</span>
                        <span className={s.dockCountSub}>Pending synchronization</span>
                    </div>

                    <div className={s.dockActions}>
                        <button
                            type="button"
                            onClick={resetStaged}
                            disabled={saving}
                            className={s.dockResetBtn}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={saveAllChanges}
                            disabled={saving}
                            className={s.dockSaveBtn}
                        >
                            <Save size={15} />
                            <span>{saving ? "Saving..." : "Save Changes"}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── 7. Quick Price Edit Bottom Sheet Modal ── */}
            {priceModalData && (
                <div className={s.modalBackdrop} onClick={() => setPriceModalData(null)}>
                    <div className={s.modalSheet} onClick={(e) => e.stopPropagation()}>
                        <div className={s.sheetHandle} />
                        <h4 className={s.sheetTitle}>Edit Rate - {priceModalData.ratePlanName}</h4>
                        
                        <input
                            type="tel"
                            className={s.sheetInput}
                            value={priceInputValue}
                            onChange={(e) => setPriceInputValue(e.target.value)}
                            placeholder={`${currConfig.code} 0`}
                            autoFocus
                        />

                        {/* Quick increment pills */}
                        <div className={s.sheetQuickPills}>
                            {(currConfig.decimals === 0 ? [50000, 100000, 200000] : [10, 25, 50]).map((inc) => (
                                <button
                                    key={inc}
                                    type="button"
                                    onClick={() => {
                                        const cur = parseFloat(priceInputValue.replace(/[^0-9.]/g, "")) || 0;
                                        setPriceInputValue(String(cur + inc));
                                    }}
                                    className={s.quickPillBtn}
                                >
                                    +{currConfig.symbol}{currConfig.decimals === 0 ? inc.toLocaleString("en-US") : inc.toFixed(currConfig.decimals)}
                                </button>
                            ))}
                        </div>

                        <div className={s.sheetActions}>
                            <button
                                type="button"
                                onClick={() => setPriceModalData(null)}
                                className={s.sheetCancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSavePriceModal}
                                className={s.sheetSaveBtn}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
