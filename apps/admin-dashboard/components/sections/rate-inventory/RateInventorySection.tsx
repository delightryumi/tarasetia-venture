"use client";

import React from "react";
import { useRateInventory } from "./useRateInventory";
import { RateInventorySubTabs } from "./components/RateInventorySubTabs";
import { RateInventoryFilterBar } from "./components/RateInventoryFilterBar";
import { RateInventoryGrid } from "./components/RateInventoryGrid";
import { BulkUpdateModal } from "./components/BulkUpdateModal";
import styles from "./rate-inventory.module.css";

export function RateInventorySection() {
    const {
        activeHotelCode,
        activeHotelName,
        activeTab,
        setActiveTab,
        startDate,
        setStartDate,
        dateList,
        shiftDate,
        jumpToToday,
        channelFilter,
        setChannelFilter,
        roomTypeFilter,
        setRoomTypeFilter,
        rateMode,
        setRateMode,
        hideDerived,
        setHideDerived,
        taxInclusive,
        setTaxInclusive,
        roomTypes,
        ratePlans,
        matrix,
        totalDailyAvailable,
        stagedUpdates,
        stageEdit,
        unsavedCount,
        saveAllChanges,
        resetStaged,
        bulkModalOpen,
        setBulkModalOpen,
        applyBulkUpdate,
        exportGridToCsv,
        syncAriToChannex,
        loading,
        saving,
        syncingAri,
        syncingRoomTypeId,
        lastSyncedAt,
        canStopSell,
        canChangeRate,
        canChangeInventory,
        channelConfigs
    } = useRateInventory();

    return (
        <div className={styles.container}>
            {/* 1. Modular Sub-Tabs Bar */}
            <RateInventorySubTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onExportCsv={exportGridToCsv}
                onOpenBulkModal={() => setBulkModalOpen(true)}
                taxInclusive={taxInclusive}
                onSyncAll={() => syncAriToChannex(undefined, 500)}
                syncingAri={syncingAri}
            />

            {/* 2. Modular Filter & Controls Bar */}
            <RateInventoryFilterBar
                channelFilter={channelFilter}
                setChannelFilter={setChannelFilter}
                channelConfigs={channelConfigs}
                roomTypeFilter={roomTypeFilter}
                setRoomTypeFilter={setRoomTypeFilter}
                roomTypes={roomTypes}
                rateMode={rateMode}
                setRateMode={setRateMode}
                hideDerived={hideDerived}
                setHideDerived={setHideDerived}
                taxInclusive={taxInclusive}
                setTaxInclusive={setTaxInclusive}
                unsavedCount={unsavedCount}
                saving={saving}
                onResetStaged={resetStaged}
                onSaveAllChanges={saveAllChanges}
            />

            {/* 3. Modular Calendar Grid Table */}
            <RateInventoryGrid
                startDate={startDate}
                setStartDate={setStartDate}
                dateList={dateList}
                shiftDate={shiftDate}
                activeTab={activeTab}
                matrix={matrix}
                totalDailyAvailable={totalDailyAvailable}
                stageEdit={stageEdit}
                onSyncRoom={syncAriToChannex}
                syncingRoomTypeId={syncingRoomTypeId}
                canStopSell={canStopSell}
                canChangeRate={canChangeRate}
                canChangeInventory={canChangeInventory}
                channelFilter={channelFilter}
                channelConfigs={channelConfigs}
            />

            {/* 4. Modular Bulk Update Modal */}
            <BulkUpdateModal
                isOpen={bulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                onApply={applyBulkUpdate}
                roomTypes={roomTypes}
                ratePlans={ratePlans}
                channelConfigs={channelConfigs}
                saving={saving}
                defaultStartDate={startDate}
                canStopSell={canStopSell}
                canChangeRate={canChangeRate}
                canChangeInventory={canChangeInventory}
            />
        </div>
    );
}
