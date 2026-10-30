import React, { useMemo, useState } from "react";
import { Bed, RefreshCw, Check, Ban, X, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { RateInventoryTab, RoomTypeInventoryRow, GridFeatureId, PhysicalRoomOccupant } from "../../RateInventoryTypes";
import { GridRatePlanRow } from "./GridRatePlanRow";
import { GridPhysicalRoomRows } from "./GridPhysicalRoomRows";
import styles from "./GridRoomTypeCard.module.css";
import cellStyles from "./GridCellInput.module.css";

interface GridRoomTypeCardProps {
    roomType: RoomTypeInventoryRow;
    index: number;
    dateList: string[];
    todayStr: string;
    activeTab: RateInventoryTab;
    visibleFeatures?: Record<GridFeatureId, boolean>;
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
    onUpdatePhysicalRooms?: (roomTypeId: string, newRooms: string[]) => Promise<boolean>;
    onMoveBookingRoom?: (
        occupant: PhysicalRoomOccupant,
        newRoomNumber: string,
        newRoomTypeId?: string,
        newRoomTypeName?: string
    ) => Promise<boolean>;
}

export const GridRoomTypeCard = React.memo(function GridRoomTypeCard({
    roomType: rt,
    index,
    dateList,
    todayStr,
    activeTab,
    visibleFeatures,
    channelFilter,
    channelConfigs = {},
    isAllotmentSeparated,
    isRateSeparated,
    canStopSell,
    canChangeRate,
    canChangeInventory,
    stageEdit,
    onSyncRoom,
    syncingRoomTypeId,
    onUpdatePhysicalRooms,
    onMoveBookingRoom
}: GridRoomTypeCardProps) {
    const isChannelSpecific = channelFilter && channelFilter !== "all";
    const chConfig = isChannelSpecific && channelConfigs ? channelConfigs[channelFilter] : null;
    const [showPhysicalRooms, setShowPhysicalRooms] = useState<boolean>(true);
    const [isEditingRooms, setIsEditingRooms] = useState<boolean>(false);

    const safeVisibleFeatures: Record<GridFeatureId, boolean> = useMemo(() => {
        if (visibleFeatures && typeof visibleFeatures === "object") {
            return visibleFeatures;
        }
        return {
            availability: activeTab === "inventory",
            rate: activeTab === "rates" || activeTab === "custom",
            minStayThrough: activeTab === "minstay" || activeTab === "minstay_through",
            minStayArrival: activeTab === "minstay" || activeTab === "minstay_arrival",
            maxStay: activeTab === "maxstay",
            closedToArrival: activeTab === "cta",
            closedToDeparture: activeTab === "ctd",
            stopSell: activeTab === "stopsell"
        };
    }, [visibleFeatures, activeTab]);

    const hasActiveRatePlanFeature = useMemo(() => {
        return Boolean(
            safeVisibleFeatures.rate ||
            safeVisibleFeatures.minStayThrough ||
            safeVisibleFeatures.minStayArrival ||
            safeVisibleFeatures.maxStay ||
            safeVisibleFeatures.closedToArrival ||
            safeVisibleFeatures.closedToDeparture ||
            safeVisibleFeatures.stopSell
        );
    }, [safeVisibleFeatures]);

    const isPureInventory = safeVisibleFeatures.availability && !hasActiveRatePlanFeature;


    return (
        <React.Fragment>
            {/* 1. ROOM TYPE HEADER / INVENTORY ROW */}
            <tr className={[
                styles.roomTypeRow,
                isPureInventory ? styles.roomTypeRowInventory : ""
            ].filter(Boolean).join(" ")}>
                <td className={[
                    styles.roomTypeTitleCell,
                    isPureInventory ? styles.roomTypeTitleCellInventory : ""
                ].filter(Boolean).join(" ")}>
                    <div className={styles.roomTypeTitleInner}>
                        <div className={styles.roomTypeLeft}>
                            {safeVisibleFeatures.availability && (
                                <button
                                    type="button"
                                    className={styles.expandRoomsBtn}
                                    onClick={() => setShowPhysicalRooms(prev => !prev)}
                                    title={showPhysicalRooms ? "Hide room inventory" : "Show room inventory"}
                                >
                                    {showPhysicalRooms ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            )}
                            <div className={styles.roomIconBox}>
                                <Bed size={15} />
                            </div>
                            <span className={styles.roomTypeNameText} title={`Room Type: ${rt.roomTypeName} (ID: ${rt.roomTypeId})`}>
                                {rt.roomTypeName}
                            </span>
                            <span className={styles.roomCountPill} title={`Total ${rt.totalPhysicalRooms} Rooms`}>
                                {rt.totalPhysicalRooms}
                            </span>
                        </div>

                        <div className={styles.rightActions}>
                            {safeVisibleFeatures.availability && onUpdatePhysicalRooms && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPhysicalRooms(true);
                                        setIsEditingRooms(prev => !prev);
                                    }}
                                    className={styles.btnSyncRoom}
                                    title={`Configure rooms for ${rt.roomTypeName}`}
                                >
                                    <Settings2 size={13} />
                                </button>
                            )}

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
                                        size={13}
                                        className={syncingRoomTypeId === rt.roomTypeId ? styles.spinIcon : ""}
                                    />
                                </button>
                            )}
                        </div>
                    </div>
                </td>

                {/* Day Columns for Room Type */}
                {dateList.map(dateStr => {
                    const dayStat = rt.days[dateStr];
                    const avail = dayStat?.availableRooms ?? 0;
                    const isWeekend = dayStat?.isWeekend ?? false;
                    const isToday = dateStr === todayStr;
                    const isZero = avail === 0;
                    const isNegative = avail < 0;
                    const hasConflict = Boolean(dayStat?.hasRoomConflict);

                    const invKey = isChannelSpecific 
                        ? `channelAllotment_${channelFilter}_${rt.roomTypeId}_${dateStr}`
                        : `inv_${rt.roomTypeId}_${dateStr}`;

                    const isStopSell = !!dayStat?.stopSell || (rt.ratePlans && rt.ratePlans.length > 0 && rt.ratePlans.some(rp => !!rp.days[dateStr]?.stopSell));

                    const cellClasses = [
                        cellStyles.cell,
                        isWeekend ? cellStyles.cellWeekend : "",
                        isToday ? cellStyles.cellToday : "",
                        isStopSell || isNegative || hasConflict ? cellStyles.cellStopSold : ""
                    ].filter(Boolean).join(" ");

                    // AVAILABILITY FEATURE: Editable room allotment input
                    if (safeVisibleFeatures.availability) {
                        const canEditCellInv = canChangeInventory && (!isChannelSpecific || isAllotmentSeparated);

                        return (
                            <td key={dateStr} className={cellClasses}>
                                <div className={cellStyles.rateCellWrapper}>
                                    <input
                                        type="number"
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
                                            isNegative ? cellStyles.inputNegative : "",
                                            dayStat?.isCapped ? cellStyles.inputCapped : "",
                                            !canEditCellInv ? cellStyles.inputDisabled : ""
                                        ].filter(Boolean).join(" ")}
                                        title={
                                            isNegative
                                                ? `[OVERBOOKING ${avail}] Terjual ${dayStat?.bookedRooms} dari ${rt.totalPhysicalRooms} unit`
                                                : hasConflict
                                                ? `[DOUBLE ROOM] Ada 2 tamu di nomor kamar fisik yang sama pada tanggal ini`
                                                : !canChangeInventory 
                                                    ? "No permission to edit inventory" 
                                                    : (isChannelSpecific && !isAllotmentSeparated)
                                                        ? `[Merged] Allotment for ${chConfig?.channelName || channelFilter} follows Common Pool`
                                                        : (dayStat?.isCapped 
                                                            ? `[Quota Capped] ${chConfig?.channelName || channelFilter}: ${avail} units` 
                                                            : `Available Capacity: ${avail} / ${rt.totalPhysicalRooms} (Booked: ${dayStat?.bookedRooms ?? 0})`)
                                        }
                                    />
                                    {(isNegative || hasConflict) && (
                                        <span
                                            className={cellStyles.overbookBadge}
                                            title={isNegative ? `Overbooking: ${avail} kamar` : "Bentrok Nomor Kamar Fisik"}
                                        >
                                            <span>{isNegative ? `OVER (${avail})` : "DOUBLE"}</span>
                                        </span>
                                    )}
                                    {isStopSell && (
                                        <span
                                            className={cellStyles.stopSellBadge}
                                            title="Stop Sell Aktif: Penjualan kamar ditutup pada tanggal ini"
                                        >
                                            <X size={8} strokeWidth={3} />
                                            <span>STOP</span>
                                        </span>
                                    )}
                                </div>
                            </td>
                        );
                    }

                    // STOP SELL TAB (When only Stop Sell is active): Master Category Toggle
                    if (safeVisibleFeatures.stopSell && !safeVisibleFeatures.rate && !safeVisibleFeatures.minStayThrough && !safeVisibleFeatures.minStayArrival && !safeVisibleFeatures.maxStay && !safeVisibleFeatures.closedToArrival && !safeVisibleFeatures.closedToDeparture) {
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
                                                ? `channelStopSell_${channelFilter}_${rt.roomTypeId}_${rp.ratePlanId}_${dateStr}` 
                                                : `stopSell_${rt.roomTypeId}_${rp.ratePlanId}_${dateStr}`;
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
                                    <span>{allStop ? "STOP SELL" : "OPEN"}</span>
                                </button>
                            </td>
                        );
                    }

                    // CTA TAB (When only CTA is active): Master Category Toggle
                    if (safeVisibleFeatures.closedToArrival && !safeVisibleFeatures.rate && !safeVisibleFeatures.minStayThrough && !safeVisibleFeatures.minStayArrival && !safeVisibleFeatures.maxStay && !safeVisibleFeatures.stopSell && !safeVisibleFeatures.closedToDeparture) {
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
                                            stageEdit(`cta_${rt.roomTypeId}_${rp.ratePlanId}_${dateStr}`, targetState);
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

                    // CTD TAB (When only CTD is active): Master Category Toggle
                    if (safeVisibleFeatures.closedToDeparture && !safeVisibleFeatures.rate && !safeVisibleFeatures.minStayThrough && !safeVisibleFeatures.minStayArrival && !safeVisibleFeatures.maxStay && !safeVisibleFeatures.stopSell && !safeVisibleFeatures.closedToArrival) {
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
                                            stageEdit(`ctd_${rt.roomTypeId}_${rp.ratePlanId}_${dateStr}`, targetState);
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

                    // Standard Category available count badge
                    return (
                        <td key={dateStr} className={`${styles.categoryCell} ${isStopSell ? cellStyles.cellStopSold : ""}`}>
                            <div className={cellStyles.rateCellWrapper}>
                                <span className={`${styles.categoryAvailText} ${isZero ? styles.categoryAvailZero : ""}`}>
                                    {avail}
                                </span>
                                {isStopSell && (
                                    <span
                                        className={cellStyles.stopSellBadge}
                                        title="Stop Sell Aktif: Penjualan kamar ditutup pada tanggal ini"
                                    >
                                        <X size={8} strokeWidth={3} />
                                        <span>STOP</span>
                                    </span>
                                )}
                            </div>
                        </td>
                    );
                })}

                <td className={styles.spacerCell} />
            </tr>

            {/* 1B. PHYSICAL ROOM NUMBERS SUB-ROWS (Underneath Room Type in Inventory View) */}
            {safeVisibleFeatures.availability && showPhysicalRooms && (
                <GridPhysicalRoomRows
                    roomType={rt}
                    dateList={dateList}
                    todayStr={todayStr}
                    isEditingRooms={isEditingRooms}
                    onCloseEditRooms={() => setIsEditingRooms(false)}
                    onUpdatePhysicalRooms={onUpdatePhysicalRooms}
                    onMoveBookingRoom={onMoveBookingRoom}
                />
            )}

            {/* 2. CHILD RATE PLANS (Rendered only when at least one rate plan metric is visible) */}
            {hasActiveRatePlanFeature && (
                rt.ratePlans.length === 0 ? (
                    <tr>
                        <td colSpan={dateList.length + 2} className={styles.noRatePlanCell}>
                            Belum ada Rate Plan untuk tipe kamar ini. Silakan buat Rate Plan di Channel Manager.
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
                            visibleFeatures={safeVisibleFeatures}
                            channelFilter={channelFilter}
                            isRateSeparated={isRateSeparated}
                            canStopSell={canStopSell}
                            canChangeRate={canChangeRate}
                            stageEdit={stageEdit}
                        />
                    ))
                )
            )}

        </React.Fragment>
    );
});

