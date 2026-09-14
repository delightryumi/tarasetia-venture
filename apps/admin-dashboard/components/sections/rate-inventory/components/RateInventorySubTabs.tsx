"use client";

import React from "react";
import {
    Download,
    Upload,
    Zap,
    Info,
    Globe
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
}

const TABS_CONFIG: Array<{ id: RateInventoryTab; label: string }> = [
    { id: "inventory", label: "Inventory" },
    { id: "rates", label: "Rates" },
    { id: "stopsell", label: "Stop Sell" }
];

export function RateInventorySubTabs({
    activeTab,
    setActiveTab,
    onExportCsv,
    onOpenBulkModal,
    taxInclusive
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
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 2. Right: Action Buttons */}
            <div className={styles.subTabsActions}>
                <button
                    type="button"
                    onClick={() => toast.info("Import dari file Excel/CSV siap digunakan.")}
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

                <Link
                    href="/channel-manager?tab=golive"
                    className={styles.actionBtnSecondary}
                    style={{ textDecoration: "none", color: "#1e3a2f", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                    title="Buka Channel Manager &amp; Konfigurasi Akun Channex"
                >
                    <Globe size={13} />
                    <span>Channel Manager (Channex)</span>
                </Link>

                <span className={styles.infoBadgeText} title="Informasi tarif">
                    <Info size={13} />
                    <span>{taxInclusive ? "Tax Inclusive" : "Tax Exclusive"}</span>
                </span>
            </div>
        </div>
    );
}
