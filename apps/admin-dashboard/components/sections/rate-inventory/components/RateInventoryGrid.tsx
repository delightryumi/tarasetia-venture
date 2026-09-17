"use client";

import React from "react";
import {
    Bed,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    Info,
    RefreshCw
} from "lucide-react";
import {
    RateInventoryTab,
    RoomTypeInventoryRow
} from "../RateInventoryTypes";
import styles from "./RateInventoryGrid.module.css";

interface RateInventoryGridProps {
    startDate: string;
    setStartDate: (val: string) => void;
    dateList: string[];
    shiftDate: (days: number) => void;
    activeTab: RateInventoryTab;
    matrix: RoomTypeInventoryRow[];
    totalDailyAvailable: Record<string, number>;
    stageEdit: (key: string, value: any) => void;
    onSyncRoom?: (roomTypeId: string) => Promise<void>;
    syncingRoomTypeId?: string | null;
    canStopSell?: boolean;
    canChangeRate?: boolean;
    canChangeInventory?: boolean;
    channelFilter?: string;
    channelConfigs?: Record<string, any>;
}

export function RateInventoryGrid({
    startDate,
    setStartDate,
    dateList,
    shiftDate,
    activeTab,
    matrix,
    totalDailyAvailable,
    stageEdit,
    onSyncRoom,
    syncingRoomTypeId,
    canStopSell = true,
    canChangeRate = true,
    canChangeInventory = true,
    channelFilter = "all",
    channelConfigs = {}
}: RateInventoryGridProps) {
    const isChannelSpecific = channelFilter !== "all";
    const chConfig = isChannelSpecific && channelConfigs ? channelConfigs[channelFilter] : null;
    const chSeparationMode = chConfig?.separationMode || "merged";
    const isAllotmentSeparated = isChannelSpecific && (chSeparationMode === "separated_allotment" || chSeparationMode === "separated_both");
    const isRateSeparated = isChannelSpecific && (chSeparationMode === "separated_rate" || chSeparationMode === "separated_both");

    const formatCurrencyDisplay = (val: number) => {
        return Number(val || 0).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    return (
        <div className={styles.gridScrollWrapper}>
            <table className={styles.gridTable}>
                {/* Header Row: Date Navigation & Day Columns */}
                <thead>
                    <tr className={styles.headerRow}>
                        <th className={styles.colTitle}>
                            <div className={styles.dateNavControl}>
                                <button
                                    type="button"
                                    onClick={() => shiftDate(-14)}
                                    className={styles.dateStepperBtn}
                                    title="14 Hari Mundur"
                                >
                                    <ChevronLeft size={15} />
                                </button>

                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className={styles.datePickerInput}
                                />

                                <button
                                    type="button"
                                    onClick={() => shiftDate(14)}
                                    className={styles.dateStepperBtn}
                                    title="14 Hari Maju"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </th>

                        {dateList.map(dateStr => {
                            const dObj = new Date(dateStr);
                            const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dObj.getDay()];
                            const dayNum = String(dObj.getDate()).padStart(2, "0");
                            const monthName = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"][dObj.getMonth()];
                            const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;

                            return (
                                <th
                                    key={dateStr}
                                    className={`${styles.colDay} ${styles.dayHeaderCell} ${isWeekend ? styles.colWeekend : ""}`}
                                >
                                    <div className={styles.dayOfWeek}>{dayName}</div>
                                    <div className={styles.dayNumber}>{dayNum}</div>
                                    <div className={styles.monthLabel}>{monthName}</div>
                                </th>
                            );
                        })}

                        <th style={{ width: "40px", minWidth: "40px", textAlign: "center" }}>
                            <button
                                type="button"
                                onClick={() => shiftDate(14)}
                                className={styles.jumpForwardBtn}
                                title="Lompat 14 Hari ke Depan"
                            >
                                <ChevronsRight size={14} />
                            </button>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {matrix.length === 0 ? (
                        <tr>
                            <td colSpan={dateList.length + 2} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                Belum ada data tipe kamar untuk hotel ini.
                            </td>
                        </tr>
                    ) : (
                        matrix.map(rt => {
                            return (
                                <React.Fragment key={rt.roomTypeId}>
                                    {/* 1. ROOM TYPE INVENTORY ROW */}
                                    <tr className={styles.roomTypeRow}>
                                        <td className={`${styles.colTitle} ${styles.roomTypeTitleCell}`}>
                                            <div className={styles.roomTypeBadge}>
                                                <Bed size={15} style={{ color: "#2563eb", flexShrink: 0 }} />
                                                <span className={styles.roomTypeNameText}>{rt.roomTypeName}</span>
                                                <span className={styles.roomCountPill} title="Total kamar fisik">
                                                    {rt.totalPhysicalRooms}
                                                </span>
                                            </div>

                                            {onSyncRoom && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onSyncRoom(rt.roomTypeId).catch(err => console.error("Error syncing room:", err));
                                                    }}
                                                    disabled={syncingRoomTypeId === rt.roomTypeId}
                                                    className={styles.btnSyncRoom}
                                                    title={`Sync ketersediaan kamar ${rt.roomTypeName} ke seluruh OTA`}
                                                >
                                                    <RefreshCw size={11} className={syncingRoomTypeId === rt.roomTypeId ? "animate-spin" : ""} />
                                                    <span>{syncingRoomTypeId === rt.roomTypeId ? "Syncing..." : "Sync"}</span>
                                                </button>
                                            )}
                                        </td>

                                        {dateList.map(dateStr => {
                                            const dayStat = rt.days[dateStr];
                                            const avail = dayStat?.availableRooms ?? 0;
                                            const isWeekend = dayStat?.isWeekend;
                                            const isZero = avail === 0;
                                            const isChannelSpecific = channelFilter && channelFilter !== "all";
                                            const invKey = isChannelSpecific 
                                                ? `channelAllotment_${channelFilter}_${rt.roomTypeId}_${dateStr}`
                                                : `inv_${rt.roomTypeId}_${dateStr}`;

                                            // 1. INVENTORY TAB: Editable room type allotment
                                            if (activeTab === "inventory") {
                                                const canEditCellInv = canChangeInventory && (!isChannelSpecific || isAllotmentSeparated);
                                                return (
                                                    <td
                                                        key={dateStr}
                                                        className={`${styles.colDay} ${styles.dataCell} ${isWeekend ? styles.colWeekend : ""}`}
                                                    >
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={avail}
                                                            disabled={!canEditCellInv}
                                                            onChange={e => {
                                                                if (!canEditCellInv) return;
                                                                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                                stageEdit(invKey, val);
                                                            }}
                                                            onWheel={e => e.currentTarget.blur()}
                                                            className={`${styles.invInput} ${isZero ? styles.invInputZero : ""}`}
                                                            style={{
                                                                ...(!canEditCellInv ? { cursor: "not-allowed", opacity: 0.65, backgroundColor: "#f8fafc" } : {}),
                                                                ...(dayStat?.isCapped ? { borderColor: "#8b5cf6", backgroundColor: "#f5f3ff", fontWeight: 700 } : {})
                                                            }}
                                                            title={
                                                                !canChangeInventory 
                                                                    ? "Anda tidak memiliki izin untuk merubah inventory" 
                                                                    : (isChannelSpecific && !isAllotmentSeparated)
                                                                        ? `[Tergabung] Allotment ${chConfig?.channelName || channelFilter} mengikuti Common Pool fisik`
                                                                        : (dayStat?.isCapped 
                                                                            ? `[Capped OTA] Batas kuota ${chConfig?.channelName || channelFilter}: ${avail} unit` 
                                                                            : `Kapasitas fisik tersedia: ${avail} / ${rt.totalPhysicalRooms}`)
                                                            }
                                                        />
                                                    </td>
                                                );
                                            }

                                            // 2. STOP SELL TAB: Room Type Master Toggle
                                            if (activeTab === "stopsell") {
                                                const allStop = rt.ratePlans.length > 0 && rt.ratePlans.every(rp => !!rp.days[dateStr]?.stopSell);
                                                return (
                                                    <td
                                                        key={dateStr}
                                                        className={`${styles.colDay} ${styles.dataCell} ${isWeekend ? styles.colWeekend : ""}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            disabled={!canStopSell}
                                                            onClick={() => {
                                                                if (!canStopSell) return;
                                                                const targetState = !allStop;
                                                                rt.ratePlans.forEach(rp => {
                                                                    const rpStopKey = isChannelSpecific 
                                                                        ? `channelStopSell_${channelFilter}_${rp.ratePlanId}_${dateStr}` 
                                                                        : `stopSell_${rp.ratePlanId}_${dateStr}`;
                                                                    stageEdit(rpStopKey, targetState);
                                                                });
                                                            }}
                                                            className={allStop ? styles.badgeClosed : styles.badgeOpen}
                                                            style={!canStopSell ? { cursor: "not-allowed", opacity: 0.6 } : undefined}
                                                            title={!canStopSell ? "Anda tidak memiliki izin untuk merubah Stop Sell" : `Klik untuk toggle Stop Sell seluruh rate plan (${channelFilter})`}
                                                        >
                                                            {allStop ? "🚫 CLOSED" : "OPEN"}
                                                        </button>
                                                    </td>
                                                );
                                            }

                                            // 3. RATES TAB: Read-only inventory available count indicator
                                            return (
                                                <td
                                                    key={dateStr}
                                                    className={`${styles.colDay} ${styles.roomTypeInvCell} ${isWeekend ? styles.colWeekend : ""}`}
                                                    style={{
                                                        color: isZero ? "#dc2626" : (avail <= 2 ? "#d97706" : "#0f172a"),
                                                        backgroundColor: isZero ? "#fee2e2" : undefined
                                                    }}
                                                    title={`Ketersediaan: ${avail} kamar`}
                                                >
                                                    {avail}
                                                </td>
                                            );
                                        })}

                                        <td style={{ borderRight: "none" }} />
                                    </tr>

                                    {/* 2. RATE PLANS CHILD ROWS (Visible on Rates & Stop Sell tabs) */}
                                    {activeTab !== "inventory" && (
                                        rt.ratePlans.length === 0 ? (
                                            <tr className={styles.ratePlanRow}>
                                                <td
                                                    colSpan={dateList.length + 2}
                                                    style={{
                                                        padding: "8px 16px",
                                                        fontSize: "11px",
                                                        color: "#94a3b8",
                                                        backgroundColor: "#f8fafc",
                                                        borderBottom: "1px solid var(--grid-border, #e2e8f0)"
                                                    }}
                                                >
                                                    ℹ️ Belum ada Rate Plan untuk tipe kamar ini. Tambahkan Rate Plan di menu Channel Manager Superadmin.
                                                </td>
                                            </tr>
                                        ) : (
                                            rt.ratePlans.map(rp => {
                                                return (
                                                    <tr key={rp.ratePlanId} className={styles.ratePlanRow}>
                                                        <td className={`${styles.colTitle} ${styles.ratePlanTitleCell}`}>
                                                            <div className={styles.ratePlanNameGroup}>
                                                                <span className={styles.ratePlanTreePrefix}>└─</span>
                                                                <span className={styles.ratePlanName}>
                                                                    {rp.ratePlanName}
                                                                </span>
                                                                <span className={styles.ratePlanCodePill}>{rp.ratePlanCode}</span>
                                                                <span className={styles.infoIcon} title={`${rp.ratePlanCode} • Base Net: Rp ${rp.baseRate?.toLocaleString()}`}>
                                                                    <Info size={11} />
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {dateList.map(dateStr => {
                                                            const dayStat = rp.days[dateStr];
                                                            const isWeekend = dayStat?.isWeekend;
                                                            const isStopSell = !!dayStat?.stopSell;

                                                            const isChannelSpecific = channelFilter && channelFilter !== "all";
                                                            const rateKey = isChannelSpecific 
                                                                ? `channelRate_${channelFilter}_${rp.ratePlanId}_${dateStr}` 
                                                                : `rate_${rp.ratePlanId}_${dateStr}`;
                                                            const stopSellKey = isChannelSpecific 
                                                                ? `channelStopSell_${channelFilter}_${rp.ratePlanId}_${dateStr}` 
                                                                : `stopSell_${rp.ratePlanId}_${dateStr}`;

                                                            // Rates Tab Render
                                                            if (activeTab === "rates") {
                                                                const currentRate = dayStat?.rate ?? rp.baseRate;
                                                                const canEditCellRate = canChangeRate && (!isChannelSpecific || isRateSeparated);
                                                                return (
                                                                    <td
                                                                        key={dateStr}
                                                                        className={`${styles.colDay} ${styles.dataCell} ${isStopSell ? styles.cellStopSell : ""} ${isWeekend ? styles.colWeekend : ""}`}
                                                                    >
                                                                        <input
                                                                            type="text"
                                                                            value={formatCurrencyDisplay(currentRate)}
                                                                            disabled={!canEditCellRate}
                                                                            onChange={e => {
                                                                                if (!canEditCellRate) return;
                                                                                const rawNum = Number(e.target.value.replace(/[^0-9.-]+/g, "")) || 0;
                                                                                stageEdit(rateKey, rawNum);
                                                                            }}
                                                                            onWheel={e => e.currentTarget.blur()}
                                                                            className={`${styles.rateInput} ${isStopSell ? styles.rateInputStopSell : ""}`}
                                                                            style={{
                                                                                ...(!canEditCellRate ? { cursor: "not-allowed", opacity: 0.65, backgroundColor: "#f8fafc" } : {}),
                                                                                ...(dayStat?.isChannelCustom ? { borderColor: "#10b981", backgroundColor: "#ecfdf5", fontWeight: 700 } : {})
                                                                            }}
                                                                            title={
                                                                                !canChangeRate 
                                                                                    ? "Anda tidak memiliki izin untuk merubah rate" 
                                                                                    : (isChannelSpecific && !isRateSeparated)
                                                                                        ? `[Tergabung] Tarif ${chConfig?.channelName || channelFilter} mengikuti tarif dasar Common Pool`
                                                                                        : (dayStat?.isChannelCustom 
                                                                                            ? `[Custom OTA Rate] Rp ${currentRate.toLocaleString()}` 
                                                                                            : `Rp ${currentRate.toLocaleString()}`)
                                                                            }
                                                                        />
                                                                    </td>
                                                                );
                                                            }

                                                            // Stop Sell Tab Render
                                                            if (activeTab === "stopsell") {
                                                                return (
                                                                    <td
                                                                        key={dateStr}
                                                                        className={`${styles.colDay} ${styles.dataCell} ${isStopSell ? styles.cellStopSell : ""} ${isWeekend ? styles.colWeekend : ""}`}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            disabled={!canStopSell}
                                                                            onClick={() => {
                                                                                if (!canStopSell) return;
                                                                                stageEdit(stopSellKey, !isStopSell);
                                                                            }}
                                                                            className={isStopSell ? styles.badgeClosed : styles.badgeOpen}
                                                                            style={!canStopSell ? { cursor: "not-allowed", opacity: 0.6 } : undefined}
                                                                            title={!canStopSell ? "Anda tidak memiliki izin untuk merubah Stop Sell" : (isStopSell ? "🚫 STOP SELL" : "OPEN")}
                                                                        >
                                                                            {isStopSell ? "🚫 STOP SELL" : "OPEN"}
                                                                        </button>
                                                                    </td>
                                                                );
                                                            }

                                                            return null;
                                                        })}

                                                        <td style={{ borderRight: "none" }} />
                                                    </tr>
                                                );
                                            })
                                        )
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}

                    {/* 3. BOTTOM SUMMARY ROW: Available Inventory (Total Hotel) */}
                    <tr className={styles.totalAvailableRow}>
                        <td className={`${styles.colTitle} ${styles.totalAvailableTitleCell}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>TOTAL AVAILABLE</span>
                                <span className={styles.infoIcon} title="Total kuota kamar fisik yang masih tersedia untuk seluruh hotel">
                                    <Info size={12} />
                                </span>
                            </div>
                        </td>

                        {dateList.map(dateStr => {
                            const totalAvail = totalDailyAvailable[dateStr] ?? 0;
                            const isZero = totalAvail === 0;
                            const isLow = totalAvail > 0 && totalAvail <= 2;

                            return (
                                <td
                                    key={dateStr}
                                    className={`${styles.colDay} ${styles.totalAvailableCell} ${isZero ? styles.totalAvailZero : isLow ? styles.totalAvailLow : styles.totalAvailGood}`}
                                >
                                    <span className={styles.totalAvailBadge}>
                                        {totalAvail}
                                    </span>
                                </td>
                            );
                        })}

                        <td style={{ borderRight: "none", backgroundColor: "#181d26" }} />
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
