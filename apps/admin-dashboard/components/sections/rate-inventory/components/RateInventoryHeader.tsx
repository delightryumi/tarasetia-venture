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
                    <Bed size={22} />
                </div>
                <div className={styles.hotelTitleGroup}>
                    <div className={styles.hotelName}>
                        <span>{activeHotelName || "My Tara Partner"}</span>
                        <span className={styles.hotelCodeBadge}>
                            Code: {activeHotelCode || "0"}
                        </span>
                    </div>
                    <span className={styles.hotelSubtitle}>
                        Physical Inventory Control &amp; Master Rate Management (ARI)
                    </span>
                </div>
            </div>

            <div className={styles.headerRight}>
                {lastSyncedAt && (
                    <span className={styles.syncText}>
                        Last Synced: <strong>{lastSyncedAt}</strong>
                    </span>
                )}

                <button
                    type="button"
                    onClick={onSyncAri}
                    disabled={syncingAri || !activeHotelCode}
                    className={styles.btnSync}
                    title="Push active ARI matrix changes to all connected distribution channels"
                >
                    <RefreshCw size={14} className={syncingAri ? styles.spinIcon : ""} />
                    <span>{syncingAri ? "Syncing..." : "Sync ARI to OTAs"}</span>
                </button>
            </div>
        </header>
    );
}
