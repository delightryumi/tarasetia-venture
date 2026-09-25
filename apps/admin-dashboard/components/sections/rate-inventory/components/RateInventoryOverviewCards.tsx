"use client";

import React from "react";
import { Bed, DollarSign, CalendarCheck, RefreshCw, SlidersHorizontal } from "lucide-react";
import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
import styles from "./RateInventoryOverviewCards.module.css";

interface RateInventoryOverviewCardsProps {
    roomTypes: RoomTypeInfo[];
    ratePlans: MyTaraRatePlan[];
    totalDailyAvailable: Record<string, number>;
    lastSyncedAt: string | null;
    syncingAri: boolean;
    onSyncAll: () => void;
}

export function RateInventoryOverviewCards({
    roomTypes,
    ratePlans,
    totalDailyAvailable,
    lastSyncedAt,
    syncingAri,
    onSyncAll
}: RateInventoryOverviewCardsProps) {
    const totalPhysicalRooms = roomTypes.reduce((acc, rt) => acc + (rt.totalRooms || 1), 0);

    const todayStr = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    })();

    const todayAvail = totalDailyAvailable[todayStr] ?? totalPhysicalRooms;
    const todayBooked = Math.max(0, totalPhysicalRooms - todayAvail);
    const todayOccPercent = totalPhysicalRooms > 0 
        ? Math.min(100, Math.round((todayBooked / totalPhysicalRooms) * 100))
        : 0;

    return (
        <div className={styles.overviewGrid}>
            {/* Card 1: Total Kategori & Fisik Kamar */}
            <div className={styles.kpiCard}>
                <div className={styles.kpiLeft}>
                    <div className={styles.kpiLabel}>
                        <Bed size={14} style={{ color: "#2563eb" }} />
                        <span>Categories &amp; Units</span>
                    </div>
                    <div className={styles.kpiValueRow}>
                        <span className={styles.kpiValue}>{roomTypes.length}</span>
                        <span className={styles.kpiSubtext}>Room Categories</span>
                    </div>
                    <div>
                        <span className={`${styles.kpiBadge} ${styles.badgeBlue}`}>
                            Total {totalPhysicalRooms} Physical Rooms
                        </span>
                    </div>
                </div>
                <div className={`${styles.kpiIconWrapper} ${styles.iconRooms}`}>
                    <Bed size={22} />
                </div>
            </div>

            {/* Card 2: Master Rate Plans Terdaftar */}
            <div className={styles.kpiCard}>
                <div className={styles.kpiLeft}>
                    <div className={styles.kpiLabel}>
                        <DollarSign size={14} style={{ color: "#059669" }} />
                        <span>Master Rate Plans</span>
                    </div>
                    <div className={styles.kpiValueRow}>
                        <span className={styles.kpiValue}>{ratePlans.length}</span>
                        <span className={styles.kpiSubtext}>Active Plans</span>
                    </div>
                    <div>
                        <span className={`${styles.kpiBadge} ${styles.badgeGreen}`}>
                            {ratePlans.filter(p => p.mealsIncluded).length} Breakfast (BB), {ratePlans.filter(p => !p.mealsIncluded).length} Room Only (RO)
                        </span>
                    </div>
                </div>
                <div className={`${styles.kpiIconWrapper} ${styles.iconRates}`}>
                    <DollarSign size={22} />
                </div>
            </div>

            {/* Card 3: Ketersediaan Hari Ini */}
            <div className={styles.kpiCard}>
                <div className={styles.kpiLeft}>
                    <div className={styles.kpiLabel}>
                        <CalendarCheck size={14} style={{ color: "#d97706" }} />
                        <span>Today's Availability</span>
                    </div>
                    <div className={styles.kpiValueRow}>
                        <span className={styles.kpiValue}>{todayAvail}</span>
                        <span className={styles.kpiSubtext}>/ {totalPhysicalRooms} Ready Rooms</span>
                    </div>
                    <div>
                        <span className={`${styles.kpiBadge} ${todayOccPercent > 70 ? styles.badgeAmber : styles.badgeGreen}`}>
                            Occupancy: {todayOccPercent}% ({todayBooked} Booked)
                        </span>
                    </div>
                </div>
                <div className={`${styles.kpiIconWrapper} ${styles.iconToday}`}>
                    <CalendarCheck size={22} />
                </div>
            </div>

            {/* Card 4: Status Integrasi ARI & OTAs */}
            <div className={styles.kpiCard}>
                <div className={styles.kpiLeft}>
                    <div className={styles.kpiLabel}>
                        <RefreshCw size={14} style={{ color: "#7c3aed" }} />
                        <span>Channel Sync Status</span>
                    </div>
                    <div className={styles.kpiValueRow}>
                        <span className={styles.kpiValue} style={{ fontSize: "16px" }}>
                            {lastSyncedAt ? `Synced ${lastSyncedAt}` : "Ready to Sync"}
                        </span>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={onSyncAll}
                            disabled={syncingAri}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                border: "none",
                                background: "none",
                                padding: 0,
                                cursor: syncingAri ? "not-allowed" : "pointer"
                            }}
                        >
                            <span className={`${styles.kpiBadge} ${styles.badgePurple}`}>
                                <SlidersHorizontal size={10} />
                                {syncingAri ? "Syncing..." : "Push 500 Days to OTAs"}
                            </span>
                        </button>
                    </div>
                </div>
                <div className={`${styles.kpiIconWrapper} ${styles.iconSync}`}>
                    <RefreshCw size={22} className={syncingAri ? styles.spinIcon : ""} />
                </div>
            </div>
        </div>
    );
}
