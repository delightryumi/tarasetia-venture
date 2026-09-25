"use client";

import React, { useMemo } from "react";
import { Bed } from "lucide-react";
import { RateInventoryTab, RoomTypeInventoryRow } from "../RateInventoryTypes";
import { GridDateHeader } from "./grid/GridDateHeader";
import { GridTotalAvailableRow } from "./grid/GridTotalAvailableRow";
import { GridRoomTypeCard } from "./grid/GridRoomTypeCard";
import styles from "./RateInventoryGrid.module.css";

interface RateInventoryGridProps {
    startDate: string;
    setStartDate: (val: string) => void;
    dateList: string[];
    shiftDate: (days: number) => void;
    jumpToToday?: () => void;
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
    jumpToToday,
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

    const todayStr = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }, []);

    const totalPhysicalRooms = useMemo(() => {
        return matrix.reduce((acc, rt) => acc + (rt.totalPhysicalRooms || 1), 0);
    }, [matrix]);

    return (
        <div className={styles.gridScrollWrapper}>
            <table className={styles.gridTable}>
                {/* 1. Sticky Date Navigation Header */}
                <thead>
                    <GridDateHeader
                        startDate={startDate}
                        setStartDate={setStartDate}
                        dateList={dateList}
                        shiftDate={shiftDate}
                        jumpToToday={jumpToToday}
                        todayStr={todayStr}
                    />
                </thead>

                {/* 2. Room Categories & Rate Plans */}
                <tbody>
                    {matrix.length === 0 ? (
                        <tr>
                            <td colSpan={dateList.length + 2} className={styles.emptyStateCell}>
                                <div className={styles.emptyStateContent}>
                                    <div className={styles.emptyIconWrapper}>
                                        <Bed size={24} />
                                    </div>
                                    <div className={styles.emptyTitle}>
                                        No Room Types Configured
                                    </div>
                                    <div className={styles.emptySubtitle}>
                                        No room categories have been configured for this property yet. Please add room types in Master Rooms or Channel Manager.
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        matrix.map((rt, rtIndex) => (
                            <GridRoomTypeCard
                                key={rt.roomTypeId}
                                roomType={rt}
                                index={rtIndex}
                                dateList={dateList}
                                todayStr={todayStr}
                                activeTab={activeTab}
                                channelFilter={channelFilter}
                                channelConfigs={channelConfigs}
                                isAllotmentSeparated={isAllotmentSeparated}
                                isRateSeparated={isRateSeparated}
                                canStopSell={canStopSell}
                                canChangeRate={canChangeRate}
                                canChangeInventory={canChangeInventory}
                                stageEdit={stageEdit}
                                onSyncRoom={onSyncRoom}
                                syncingRoomTypeId={syncingRoomTypeId}
                            />
                        ))
                    )}
                </tbody>

                {/* 3. Sticky Bottom Total Available Row */}
                {matrix.length > 0 && (
                    <tfoot>
                        <GridTotalAvailableRow
                            dateList={dateList}
                            todayStr={todayStr}
                            totalDailyAvailable={totalDailyAvailable}
                            totalPhysicalRooms={totalPhysicalRooms}
                        />
                    </tfoot>
                )}
            </table>
        </div>
    );
}
