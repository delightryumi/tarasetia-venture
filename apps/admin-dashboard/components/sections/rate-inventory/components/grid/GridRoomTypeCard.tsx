"use client";

import React from "react";
import { Bed, RefreshCw, Check, Ban } from "lucide-react";
import { RateInventoryTab, RoomTypeInventoryRow } from "../../RateInventoryTypes";
import { GridRatePlanRow } from "./GridRatePlanRow";
import styles from "./GridRoomTypeCard.module.css";
import cellStyles from "./GridCellInput.module.css";

interface GridRoomTypeCardProps {
    roomType: RoomTypeInventoryRow;
    index: number;
    dateList: string[];
    todayStr: string;
    activeTab: RateInventoryTab;
    channelFilter: string;
    channelConfigs?: Record<string, any>;
    isAllotmentSeparated: boolean;
    isRateSeparated: boolean;
    canStopSell: boolean;
    canChangeRate: boolean;
    canChangeInventory: boolean;
    stageEdit: (key: string, value: any) => void;
    onSyncRoom?: (roomTypeId: string) => Promise<void>;
    syncingRoomTypeId?: string | null;
}

export const GridRoomTypeCard = React.memo(function GridRoomTypeCard({
    roomType: rt,
    index,
    dateList,
    todayStr,
    activeTab,
    channelFilter,
    channelConfigs = {},
    isAllotmentSeparated,
    isRateSeparated,
    canStopSell,
    canChangeRate,
    canChangeInventory,
    stageEdit,
    onSyncRoom,
    syncingRoomTypeId
}: GridRoomTypeCardProps) {
    const isChannelSpecific = channelFilter && channelFilter !== "all";
    const chConfig = isChannelSpecific && channelConfigs ? channelConfigs[channelFilter] : null;

    const formatCurrency = (val: number) => {
        return Number(val || 0).toLocaleString("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    return (
        <React.Fragment>
            {/* Visual spacer before card if not first */}
            {index > 0 && (
                <tr className={styles.cardSpacerRow}>
                    <td colSpan={dateList.length + 2} className={styles.cardSpacerCell} />
                </tr>
            )}

            {/* 1. ROOM TYPE HEADER / INVENTORY ROW */}
            <tr className={styles.roomTypeRow}>
                <td className={styles.roomTypeTitleCell}>
                    <div className={styles.roomTypeLeft}>
                        <div className={styles.roomIconBox}>
                            <Bed size={18} />
                        </div>
                        <div className={styles.roomTypeInfoCol}>
                            <div className={styles.roomTypeNameRow}>
                                <span className={styles.roomTypeNameText} title={`Room Type: ${rt.roomTypeName} (ID: ${rt.roomTypeId})`}>
                                    {rt.roomTypeName}
                                </span>
                                {rt.roomTypeCode && rt.roomTypeCode !== rt.roomTypeId && rt.roomTypeCode.length <= 8 && (
                                    <span className={styles.roomTypeCodeBadge} title={`Code: ${rt.roomTypeCode}`}>
                                        {rt.roomTypeCode}
                                    </span>
                                )}
                            </div>
                            <div className={styles.roomTypeMetaRow}>
                                <span className={styles.roomCountPill}>
                                    {rt.totalPhysicalRooms} Units
                                </span>
                                {rt.basePrice > 0 && (
                                    <span className={styles.roomBasePricePill} title="Base Net Rate">
                                        IDR {formatCurrency(rt.basePrice)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {onSyncRoom && (
                        <button
                            type="button"
                            onClick={() => {
                                onSyncRoom(rt.roomTypeId).catch(err => console.error("Error syncing room:", err));
                            }}
                            disabled={syncingRoomTypeId === rt.roomTypeId}
                            className={styles.btnSyncRoom}
                            title={`Sync ${rt.roomTypeName} inventory to connected OTAs`}
                        >
                            <RefreshCw
                                size={12}
                                className={syncingRoomTypeId === rt.roomTypeId ? styles.spinIcon : ""}
                            />
                            <span>{syncingRoomTypeId === rt.roomTypeId ? "Sync..." : "Sync"}</span>
                        </button>
                    )}
                </td>

                {/* Day Columns for Room Type */}
                {dateList.map(dateStr => {
                    const dayStat = rt.days[dateStr];
                    const avail = dayStat?.availableRooms ?? 0;
                    const isWeekend = dayStat?.isWeekend ?? false;
                    const isToday = dateStr === todayStr;
                    const isZero = avail === 0;

                    const invKey = isChannelSpecific 
                        ? `channelAllotment_${channelFilter}_${rt.roomTypeId}_${dateStr}`
                        : `inv_${rt.roomTypeId}_${dateStr}`;

                    const cellClasses = [
                        cellStyles.cell,
                        isWeekend ? cellStyles.cellWeekend : "",
                        isToday ? cellStyles.cellToday : ""
                    ].filter(Boolean).join(" ");

                    // INVENTORY TAB: Editable room allotment
                    if (activeTab === "inventory") {
                        const canEditCellInv = canChangeInventory && (!isChannelSpecific || isAllotmentSeparated);

                        return (
                            <td key={dateStr} className={cellClasses}>
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
                                    className={[
                                        cellStyles.numberInput,
                                        isZero ? cellStyles.inputZero : "",
                                        dayStat?.isCapped ? cellStyles.inputCapped : "",
                                        !canEditCellInv ? cellStyles.inputDisabled : ""
                                    ].filter(Boolean).join(" ")}
                                    title={
                                        !canChangeInventory 
                                            ? "No permission to edit inventory" 
                                            : (isChannelSpecific && !isAllotmentSeparated)
                                                ? `[Merged] Allotment for ${chConfig?.channelName || channelFilter} follows Common Pool`
                                                : (dayStat?.isCapped 
                                                    ? `[Quota Capped] ${chConfig?.channelName || channelFilter}: ${avail} units` 
                                                    : `Available Capacity: ${avail} / ${rt.totalPhysicalRooms}`)
                                    }
                                />
                            </td>
                        );
                    }

                    // STOP SELL TAB: Category Master Toggle
                    if (activeTab === "stopsell") {
                        const allStop = rt.ratePlans.length > 0 && rt.ratePlans.every(rp => !!rp.days[dateStr]?.stopSell);
                        return (
                            <td key={dateStr} className={cellClasses}>
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
                                    className={[
                                        cellStyles.toggleBtn,
                                        allStop ? cellStyles.toggleClosed : cellStyles.toggleOpen,
                                        !canStopSell ? cellStyles.inputDisabled : ""
                                    ].filter(Boolean).join(" ")}
                                    title="Toggle Stop Sell for all rate plans in this room category"
                                >
                                    {allStop ? <Ban size={12} /> : <Check size={12} />}
                                    <span>{allStop ? "CLOSED" : "OPEN"}</span>
                                </button>
                            </td>
                        );
                    }

                    // CTA TAB: Category Master Toggle
                    if (activeTab === "cta") {
                        const allCta = rt.ratePlans.length > 0 && rt.ratePlans.every(rp => !!rp.days[dateStr]?.closedToArrival);
                        return (
                            <td key={dateStr} className={cellClasses}>
                                <button
                                    type="button"
                                    disabled={!canStopSell}
                                    onClick={() => {
                                        if (!canStopSell) return;
                                        const targetState = !allCta;
                                        rt.ratePlans.forEach(rp => {
                                            stageEdit(`cta_${rp.ratePlanId}_${dateStr}`, targetState);
                                        });
                                    }}
                                    className={[
                                        cellStyles.toggleBtn,
                                        allCta ? cellStyles.toggleWarning : cellStyles.toggleOpen,
                                        !canStopSell ? cellStyles.inputDisabled : ""
                                    ].filter(Boolean).join(" ")}
                                    title="Toggle Closed to Arrival for all rate plans in this room category"
                                >
                                    {allCta ? <Ban size={12} /> : <Check size={12} />}
                                    <span>{allCta ? "CLOSED" : "OPEN"}</span>
                                </button>
                            </td>
                        );
                    }

                    // CTD TAB: Category Master Toggle
                    if (activeTab === "ctd") {
                        const allCtd = rt.ratePlans.length > 0 && rt.ratePlans.every(rp => !!rp.days[dateStr]?.closedToDeparture);
                        return (
                            <td key={dateStr} className={cellClasses}>
                                <button
                                    type="button"
                                    disabled={!canStopSell}
                                    onClick={() => {
                                        if (!canStopSell) return;
                                        const targetState = !allCtd;
                                        rt.ratePlans.forEach(rp => {
                                            stageEdit(`ctd_${rp.ratePlanId}_${dateStr}`, targetState);
                                        });
                                    }}
                                    className={[
                                        cellStyles.toggleBtn,
                                        allCtd ? cellStyles.toggleWarning : cellStyles.toggleOpen,
                                        !canStopSell ? cellStyles.inputDisabled : ""
                                    ].filter(Boolean).join(" ")}
                                    title="Toggle Closed to Departure for all rate plans in this room category"
                                >
                                    {allCtd ? <Ban size={12} /> : <Check size={12} />}
                                    <span>{allCtd ? "CLOSED" : "OPEN"}</span>
                                </button>
                            </td>
                        );
                    }

                    // RATES or MINSTAY TAB: Header shows category available count
                    return (
                        <td key={dateStr} className={cellClasses}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: isZero ? "#dc2626" : "#0f172a" }}>
                                {avail} Ready
                            </span>
                        </td>
                    );
                })}

                <td style={{ backgroundColor: "inherit" }} />
            </tr>

            {/* 2. CHILD RATE PLANS */}
            {rt.ratePlans.length === 0 ? (
                <tr>
                    <td colSpan={dateList.length + 2} className={styles.noRatePlanCell}>
                        No Rate Plans configured for this room category. Please configure Rate Plans in Channel Manager.
                    </td>
                </tr>
            ) : (
                rt.ratePlans.map(rp => (
                    <GridRatePlanRow
                        key={`${rt.roomTypeId}_${rp.ratePlanId}`}
                        roomTypeId={rt.roomTypeId}
                        ratePlan={rp}
                        dateList={dateList}
                        todayStr={todayStr}
                        activeTab={activeTab}
                        channelFilter={channelFilter}
                        isRateSeparated={isRateSeparated}
                        canStopSell={canStopSell}
                        canChangeRate={canChangeRate}
                        stageEdit={stageEdit}
                    />
                ))
            )}
        </React.Fragment>
    );
});
