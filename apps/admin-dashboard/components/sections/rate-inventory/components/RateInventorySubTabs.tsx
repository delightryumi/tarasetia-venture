"use client";

import React from "react";
import { Download, Upload, SlidersHorizontal, Info, RefreshCw, PanelLeft } from "lucide-react";
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
    { id: "inventory", label: "Inventory", title: "Room Allotment & Physical Inventory" },
    { id: "rates", label: "Rates", title: "Base Room Rates (IDR)" },
    { id: "stopsell", label: "Stop Sell", title: "Sales Restrictions & Stop Sell" },
    { id: "minstay", label: "Min Stay", title: "Minimum Length of Stay (MLOS in Nights)" },
    { id: "cta", label: "CTA", title: "Closed to Arrival (No Check-in Allowed)" },
    { id: "ctd", label: "CTD", title: "Closed to Departure (No Check-out Allowed)" }
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
    const handleToggleSidebar = () => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("toggle-sidebar"));
        }
    };

    return (
        <div className={styles.subTabsBar}>
            {/* 1. Left: Sub-Tabs Selector */}
            <div className={styles.subTabsGroup}>
                <button
                    type="button"
                    onClick={handleToggleSidebar}
                    className={styles.actionBtnSecondary}
                    title="Toggle Full View / Navigation Sidebar"
                    style={{ marginRight: "4px" }}
                >
                    <PanelLeft size={14} />
                    <span>Sidebar</span>
                </button>

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
                    onClick={() => toast.info("Excel/CSV import feature is in preparation.")}
                    className={styles.actionBtnSecondary}
                >
                    <Upload size={14} />
                    <span>Import</span>
                </button>

                <button
                    type="button"
                    onClick={() => onExportCsv()}
                    className={styles.actionBtnSecondary}
                >
                    <Download size={14} />
                    <span>Export CSV</span>
                </button>

                <button
                    type="button"
                    onClick={() => onOpenBulkModal()}
                    className={styles.actionBtnPrimary}
                >
                    <SlidersHorizontal size={14} />
                    <span>Bulk Update</span>
                </button>

                {onSyncAll && (
                    <button
                        type="button"
                        onClick={() => onSyncAll()}
                        disabled={syncingAri}
                        className={styles.actionBtnSecondary}
                        title="Push full 500-day ARI matrix to Channel Manager (Channex Certification Standard)"
                    >
                        <RefreshCw size={14} className={syncingAri ? styles.spinIcon : ""} style={{ color: "#2563eb" }} />
                        <span>{syncingAri ? "Syncing (500d)..." : "Full Sync (500d)"}</span>
                    </button>
                )}

                <span className={styles.infoBadgeText} title={taxInclusive ? "Tax Inclusive: All rates shown include taxes & service charges (PB1 / VAT)" : "Tax Exclusive: All rates shown exclude taxes & service charges"}>
                    <Info size={13} />
                    <span>{taxInclusive ? "Tax Incl." : "Tax Excl."}</span>
                </span>
            </div>
        </div>
    );
}
