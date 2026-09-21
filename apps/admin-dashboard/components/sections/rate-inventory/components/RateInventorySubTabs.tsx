"use client";

import React from "react";
import {
    Download,
    Upload,
    Zap,
    Info,
    Globe,
    RefreshCw
} from "lucide-react";
import Link from "next/link";
import { RateInventoryTab } from "../RateInventoryTypes";
import styles from "./RateInventorySubTabs.module.css";
import { toast } from "sonner";

interface RateInventorySubTabsProps {
    activeTab: RateInventoryTab;
    setActiveTab: (tab: RateInventoryTab) => void;
    onExportCsv: () => void;
    onOpenBulkModal: () => void;
    taxInclusive: boolean;
    onSyncAll?: () => void;
    syncingAri?: boolean;
}

const TABS_CONFIG: Array<{ id: RateInventoryTab; label: string; title: string }> = [
    { id: "inventory", label: "Inventory", title: "Room Inventory & Allotment" },
    { id: "rates", label: "Rates", title: "Base Room Rates (IDR)" },
    { id: "stopsell", label: "Stop Sell", title: "Stop Sell Restrictions" },
    { id: "minstay", label: "Min Stay", title: "Minimum Length of Stay (MLOS in Nights)" },
    { id: "cta", label: "CTA", title: "Closed to Arrival (No Check-In Permitted)" },
    { id: "ctd", label: "CTD", title: "Closed to Departure (No Check-Out Permitted)" }
];

export function RateInventorySubTabs({
    activeTab,
    setActiveTab,
    onExportCsv,
    onOpenBulkModal,
    taxInclusive,
    onSyncAll,
    syncingAri = false
}: RateInventorySubTabsProps) {
    return (
        <div className={styles.subTabsBar}>
            {/* 1. Left: Sub-Tabs Selector */}
            <div className={styles.subTabsGroup}>
                {TABS_CONFIG.map(t => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id)}
                        className={`${styles.tabItem} ${activeTab === t.id ? styles.tabItemActive : ""}`}
                        title={t.title}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 2. Right: Action Buttons */}
            <div className={styles.subTabsActions}>
                <button
                    type="button"
                    onClick={() => toast.info("Import Excel/CSV")}
                    className={styles.actionBtnSecondary}
                >
                    <Upload size={13} />
                    <span>Import</span>
                </button>

                <button
                    type="button"
                    onClick={() => onExportCsv()}
                    className={styles.actionBtnSecondary}
                >
                    <Download size={13} />
                    <span>Export</span>
                </button>

                <button
                    type="button"
                    onClick={() => onOpenBulkModal()}
                    className={styles.actionBtnPrimary}
                >
                    <Zap size={13} style={{ color: "#fbbf24" }} />
                    <span>Bulk Update</span>
                </button>

                {onSyncAll && (
                    <button
                        type="button"
                        onClick={() => onSyncAll()}
                        disabled={syncingAri}
                        className={styles.actionBtnSecondary}
                        title="500-Day Full Property Sync to Channex (PMS Certification Standard)"
                    >
                        <RefreshCw size={13} className={syncingAri ? styles.spinIcon : ""} style={{ color: "#2563eb" }} />
                        <span>{syncingAri ? "Syncing (500d)..." : "Full Sync (500d)"}</span>
                    </button>
                )}

                <span className={styles.infoBadgeText} title={taxInclusive ? "Tax Inclusive: All rates shown include taxes & service charges" : "Tax Exclusive: All rates shown exclude taxes & service charges (calculated upon checkout)"}>
                    <Info size={12} />
                    <span>{taxInclusive ? "Tax Incl." : "Tax Excl."}</span>
                </span>
            </div>
        </div>
    );
}
