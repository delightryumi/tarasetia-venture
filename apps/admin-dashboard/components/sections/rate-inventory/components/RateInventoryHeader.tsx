"use client";

import React from "react";
import { Bed, RefreshCw } from "lucide-react";
import styles from "./RateInventoryHeader.module.css";

interface RateInventoryHeaderProps {
    activeHotelCode: string | null;
    activeHotelName: string | null;
    lastSyncedAt: string | null;
    syncingAri: boolean;
    onSyncAri: () => Promise<void>;
}

export function RateInventoryHeader({
    activeHotelCode,
    activeHotelName,
    lastSyncedAt,
    syncingAri,
    onSyncAri
}: RateInventoryHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <div className={styles.iconBox}>
                    <Bed size={20} />
                </div>
                <div className={styles.hotelTitleGroup}>
                    <span className={styles.hotelName}>
                        {activeHotelName || "My Tara Hotel"}
                    </span>
                    <span className={styles.hotelCode}>
                        Code: {activeHotelCode || "0"} • Rates &amp; Inventory Management
                    </span>
                </div>
            </div>

            <div className={styles.headerRight}>
                {lastSyncedAt && (
                    <span className={styles.syncText}>
                        Last OTA Sync: <strong>{lastSyncedAt}</strong>
                    </span>
                )}

                <button
                    type="button"
                    onClick={onSyncAri}
                    disabled={syncingAri || !activeHotelCode}
                    className={styles.btnSync}
                    title="Push active ARI matrix to connected OTAs"
                >
                    <RefreshCw size={14} className={syncingAri ? "animate-spin" : ""} />
                    <span>{syncingAri ? "Syncing..." : "Sync ARI to OTAs"}</span>
                </button>
            </div>
        </header>
    );
}
