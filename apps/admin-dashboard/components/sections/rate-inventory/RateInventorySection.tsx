"use client";

import React, { useState } from "react";
import { useRateInventory } from "./useRateInventory";
import { RateInventoryTab, GridFeatureId } from "./RateInventoryTypes";
import { RateInventorySubTabs } from "./components/RateInventorySubTabs";
import { RateInventoryFilterBar } from "./components/RateInventoryFilterBar";
import { RateInventoryGrid } from "./components/RateInventoryGrid";
import { BulkUpdateModal } from "./components/BulkUpdateModal";
import { RateInventoryLogsTab } from "./components/RateInventoryLogsTab";
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
        isSuperadmin,
        channelConfigs
    } = useRateInventory();

    // 8 Feature matrix visibility toggles
    const [visibleFeatures, setVisibleFeatures] = useState<Record<GridFeatureId, boolean>>({
        availability: true,
        rate: false,
        minStayThrough: false,
        minStayArrival: false,
        maxStay: false,
        closedToArrival: false,
        closedToDeparture: false,
        stopSell: false
    });

    const handleTabChange = (tab: RateInventoryTab) => {
        setActiveTab(tab);
        if (tab === "inventory") {
            setVisibleFeatures({
                availability: true,
                rate: false,
                minStayThrough: false,
                minStayArrival: false,
                maxStay: false,
                closedToArrival: false,
                closedToDeparture: false,
                stopSell: false
            });
        } else if (tab === "rates") {
            setVisibleFeatures({
                availability: false,
                rate: true,
                minStayThrough: false,
                minStayArrival: false,
                maxStay: false,
                closedToArrival: false,
                closedToDeparture: false,
                stopSell: false
            });
        } else if (tab === "minstay") {
            setVisibleFeatures({
                availability: false,
                rate: false,
                minStayThrough: true,
                minStayArrival: true,
                maxStay: false,
                closedToArrival: false,
                closedToDeparture: false,
                stopSell: false
            });
        } else if (tab === "minstay_arrival") {
            setVisibleFeatures({
                availability: false,
                rate: false,
                minStayThrough: false,
                minStayArrival: true,
                maxStay: false,
                closedToArrival: false,
                closedToDeparture: false,
                stopSell: false
            });
        } else if (tab === "minstay_through") {
            setVisibleFeatures({
                availability: false,
                rate: false,
                minStayThrough: true,
                minStayArrival: false,
                maxStay: false,
                closedToArrival: false,
                closedToDeparture: false,
                stopSell: false
            });
        } else if (tab === "maxstay") {
            setVisibleFeatures({
                availability: false,
                rate: false,
                minStayThrough: false,
                minStayArrival: false,
                maxStay: true,
                closedToArrival: false,
                closedToDeparture: false,
                stopSell: false
            });
        } else if (tab === "stopsell") {
            setVisibleFeatures({
                availability: false,
                rate: false,
                minStayThrough: false,
                minStayArrival: false,
                maxStay: false,
                closedToArrival: false,
                closedToDeparture: false,
                stopSell: true
            });
        } else if (tab === "cta") {
            setVisibleFeatures({
                availability: false,
                rate: false,
                minStayThrough: false,
                minStayArrival: false,
                maxStay: false,
                closedToArrival: true,
                closedToDeparture: false,
                stopSell: false
            });
        } else if (tab === "ctd") {
            setVisibleFeatures({
                availability: false,
                rate: false,
                minStayThrough: false,
                minStayArrival: false,
                maxStay: false,
                closedToArrival: false,
                closedToDeparture: true,
                stopSell: false
            });
        }
    };

    const handleToggleFeature = (id: GridFeatureId) => {
        setVisibleFeatures(prev => {
            const next = { ...prev, [id]: !prev[id] };
            const activeCount = Object.values(next).filter(Boolean).length;
            if (activeCount === 1) {
                if (next.availability) setActiveTab("inventory");
                else if (next.rate) setActiveTab("rates");
                else if (next.maxStay) setActiveTab("maxstay");
                else if (next.stopSell) setActiveTab("stopsell");
                else if (next.closedToArrival) setActiveTab("cta");
                else if (next.closedToDeparture) setActiveTab("ctd");
                else setActiveTab("custom");
            } else if (activeCount === 2 && next.minStayArrival && next.minStayThrough) {
                setActiveTab("minstay");
            } else {
                setActiveTab("custom");
            }
            return next;
        });
    };

    const handleSelectAllFeatures = () => {
        setVisibleFeatures({
            availability: true,
            rate: true,
            minStayThrough: true,
            minStayArrival: true,
            maxStay: true,
            closedToArrival: true,
            closedToDeparture: true,
            stopSell: true
        });
        setActiveTab("custom");
    };

    const handleDeselectAllFeatures = () => {
        setVisibleFeatures({
            availability: true,
            rate: false,
            minStayThrough: false,
            minStayArrival: false,
            maxStay: false,
            closedToArrival: false,
            closedToDeparture: false,
            stopSell: false
        });
        setActiveTab("inventory");
    };

    return (
        <div className={styles.container}>
            {/* 1. Sub-Tabs Bar (Inventory, Rates, Stop Sell, Min Stay, CTA, CTD, Logs) */}
            <RateInventorySubTabs
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                visibleFeatures={visibleFeatures}
                onToggleFeature={handleToggleFeature}
                onSelectAllFeatures={handleSelectAllFeatures}
                onDeselectAllFeatures={handleDeselectAllFeatures}
                onExportCsv={exportGridToCsv}
                onOpenBulkModal={() => setBulkModalOpen(true)}
                taxInclusive={taxInclusive}
                onSyncAll={() => syncAriToChannex(undefined, 500)}
                syncingAri={syncingAri}
                isSuperadmin={isSuperadmin}
            />

            {/* 2. Content: Logs Tab (Superadmin Only) or Normal Grid View */}
            {activeTab === "logs" ? (
                <RateInventoryLogsTab hotelCode={activeHotelCode} />
            ) : (
                <>
                    {/* 3. Filter & Controls Bar */}
                    <RateInventoryFilterBar
                        activeTab={activeTab}
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

                    {/* 4. Calendar Grid Table or Loading State */}
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner} />
                            <div className={styles.loadingText}>
                                Loading Rates &amp; Inventory Matrix...
                            </div>
                            <div className={styles.loadingSubtext}>
                                Synchronizing physical room inventory and master rate plans
                            </div>
                        </div>
                    ) : (
                        <RateInventoryGrid
                            startDate={startDate}
                            setStartDate={setStartDate}
                            dateList={dateList}
                            shiftDate={shiftDate}
                            jumpToToday={jumpToToday}
                            activeTab={activeTab}
                            visibleFeatures={visibleFeatures}
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
                    )}

                    {/* 5. Bulk Update Modal */}
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
                </>
            )}
        </div>
    );
}
