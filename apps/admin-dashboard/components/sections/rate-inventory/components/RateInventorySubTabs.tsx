"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, Upload, Info, ChevronLeft, Menu, Check, SlidersHorizontal, Coins } from "lucide-react";
import { RateInventoryTab, GridFeatureId, GRID_FEATURES } from "../RateInventoryTypes";
import styles from "./RateInventorySubTabs.module.css";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

interface RateInventorySubTabsProps {
    activeTab: RateInventoryTab;
    setActiveTab: (tab: RateInventoryTab) => void;
    visibleFeatures: Record<GridFeatureId, boolean>;
    onToggleFeature: (id: GridFeatureId) => void;
    onSelectAllFeatures: () => void;
    onDeselectAllFeatures: () => void;
    onExportCsv: () => void;
    onOpenBulkModal: () => void;
    taxInclusive: boolean;
    onSyncAll?: () => void;
    syncingAri?: boolean;
    isSuperadmin?: boolean;
}

const TABS_CONFIG: Array<{ id: RateInventoryTab; label: string; title: string }> = [
    { id: "inventory", label: "Inventory", title: "Room Allotment and Physical Inventory (Availability)" },
    { id: "rates", label: "Rates", title: "Room Rate Plans (Rate)" },
    { id: "minstay_through", label: "Min Stay Through", title: "Minimum Stay Through (Min Nights required across stay)" },
    { id: "minstay_arrival", label: "Min Stay Arrival", title: "Minimum Stay Arrival (Min Nights required for check-in)" },
    { id: "maxstay", label: "Maximum Nights", title: "Maximum Stay (Maximum Allowed Nights)" },
    { id: "stopsell", label: "Stopsells", title: "Sales Restrictions and Stop Sell Blackout" },
    { id: "cta", label: "COA", title: "Closed to Arrival (No Check-in Allowed)" },
    { id: "ctd", label: "COD", title: "Closed to Departure (No Check-out Allowed)" }
];

export function RateInventorySubTabs({
    activeTab,
    setActiveTab,
    visibleFeatures,
    onToggleFeature,
    onSelectAllFeatures,
    onDeselectAllFeatures,
    onExportCsv,
    onOpenBulkModal,
    taxInclusive,
    onSyncAll,
    syncingAri = false,
    isSuperadmin = false
}: RateInventorySubTabsProps) {
    const { config: currConfig } = useCurrency();
    const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setFeaturesMenuOpen(false);
            }
        }
        if (featuresMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [featuresMenuOpen]);

    const handleToggleSidebar = () => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("toggle-sidebar"));
        }
    };

    // Exactly 8 ARI Features + Logs Tab
    const tabsToRender: Array<{ id: RateInventoryTab; label: string; title: string }> = [
        ...TABS_CONFIG,
        { id: "logs" as RateInventoryTab, label: "Logs", title: "Inventory and Rate Changes Audit Trail" }
    ];


    return (
        <div className={styles.subTabsBar}>
            {/* 1. Left: Navigation Stepper and Sub-Tabs */}
            <div className={styles.subTabsGroup}>
                <button
                    type="button"
                    onClick={handleToggleSidebar}
                    className={styles.stepperBtnLeft}
                    title="Toggle Navigation Sidebar"
                >
                    <ChevronLeft size={16} />
                </button>

                {tabsToRender.map(t => {
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`${styles.tabItem} ${isActive ? styles.tabItemActive : ""}`}
                            title={t.title}
                        >
                            {isActive && <span className={styles.activeIndicator} />}
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* 2. Right: Action Controls matching Screenshot */}
            {activeTab !== "logs" && (
                <div className={styles.subTabsActions}>
                    {/* Active Property Currency Badge */}
                    <div
                        className={styles.currencyBadge}
                        title={`Mata Uang Aktif Properti: ${currConfig.name} (${currConfig.code}) • Tersinkronisasi Inline`}
                        onClick={() => toast.info(`Mata uang aktif properti: ${currConfig.name} (${currConfig.code}). Diatur di Pengaturan Hotel & POS.`)}
                        role="button"
                        tabIndex={0}
                    >
                        <Coins size={12} className={styles.currencyIcon} />
                        <span className={styles.currencyFlag}>{currConfig.flag}</span>
                        <span className={styles.currencyCode}>{currConfig.code}</span>
                        <span className={styles.currencySymbol}>({currConfig.symbol})</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => toast.info("Fitur Import CSV/Excel sedang disiapkan.")}
                        className={styles.actionBtnSecondary}
                        title="Import CSV Rates & Inventory"
                    >
                        <Upload size={13} />
                        <span>Import</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onExportCsv()}
                        className={styles.actionBtnSecondary}
                        title="Export Grid Table to CSV"
                    >
                        <Download size={13} />
                        <span>Export</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenBulkModal()}
                        className={styles.actionBtnSecondary}
                        title="Buka Stepper Pembaruan Massal (Bulk Update)"
                    >
                        <SlidersHorizontal size={13} />
                        <span>Bulk Update</span>
                    </button>

                    {/* 3-Line Menu with 8 Feature Toggles Popover */}
                    <div className={styles.menuWrapper} ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setFeaturesMenuOpen(prev => !prev)}
                            className={`${styles.menuBtn} ${featuresMenuOpen ? styles.menuBtnActive : ""}`}
                            title="Tampilkan 8 Pilihan Metrik & Bulk Update"
                        >
                            <Menu size={16} />
                        </button>

                        {featuresMenuOpen && (
                            <div className={styles.featuresPopover}>
                                {/* Popover Header with Quick Select Actions */}
                                <div className={styles.popoverHeader}>
                                    <span className={styles.popoverTitle}>Metrik Tampilan</span>
                                    <div className={styles.popoverQuickActions}>
                                        <button
                                            type="button"
                                            onClick={onSelectAllFeatures}
                                            className={styles.quickActionBtn}
                                            title="Pilih Semua 8 Metrik"
                                        >
                                            Semua
                                        </button>
                                        <span className={styles.quickActionDot}>•</span>
                                        <button
                                            type="button"
                                            onClick={onDeselectAllFeatures}
                                            className={styles.quickActionBtn}
                                            title="Kembalikan ke Inventory Standar"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>

                                {/* The 8 Feature Checkboxes Matching User's Screenshot */}
                                <div className={styles.featureList}>
                                    {GRID_FEATURES.map(feat => {
                                        const isChecked = !!visibleFeatures[feat.id];
                                        return (
                                            <div
                                                key={feat.id}
                                                className={styles.featureItem}
                                                onClick={() => onToggleFeature(feat.id)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        onToggleFeature(feat.id);
                                                    }
                                                }}
                                            >
                                                <div className={`${styles.customCheckbox} ${isChecked ? styles.checkboxChecked : ""}`}>
                                                    {isChecked && <Check size={12} strokeWidth={3} />}
                                                </div>
                                                <span className={styles.featureLabel}>{feat.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={styles.popoverDivider} />

                                {/* Bulk Update Modal Trigger inside the Menu */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFeaturesMenuOpen(false);
                                        onOpenBulkModal();
                                    }}
                                    className={styles.btnBulkUpdateInMenu}
                                    title="Pembaruan Massal Allotment & Restriksi"
                                >
                                    <SlidersHorizontal size={13} />
                                    <span>Bulk Update...</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
