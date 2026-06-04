"use client";

import React from "react";
import { Waves, Download, FileText, LayoutDashboard, TrendingUp } from "lucide-react";
import { CustomDatePicker } from "../CustomDatePicker";
import styles from "../ForecastStyles.module.css";

const PEACH = "#ffd8a6";
const SAGE = "#788069";

interface ForecastHeaderProps {
    viewMode: "daily" | "monthly" | "yearly";
    setViewMode: (mode: "daily" | "monthly" | "yearly") => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    displayMode: "cards" | "charts";
    setDisplayMode: (mode: "cards" | "charts") => void;
    handleExportExcel: () => void;
    handleExportPDF: () => void;
    formatDate: (dateStr: string) => string;
}

export function ForecastHeader({
    viewMode,
    setViewMode,
    selectedDate,
    setSelectedDate,
    displayMode,
    setDisplayMode,
    handleExportExcel,
    handleExportPDF,
    formatDate
}: ForecastHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.headerInner}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerBadge} style={{ backgroundColor: `${PEACH}30`, color: SAGE }}>
                        <Waves size={15} />
                    </div>
                    <div className={styles.headerMeta}>
                        <span className={styles.headerSubtitle}>Nexura Analytics</span>
                        <h1 className={styles.headerTitle}>
                            Forecast <span style={{ color: SAGE }}>& POS</span>
                        </h1>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    {/* View Toggle */}
                    <div className={styles.toggleWrapper}>
                        <button
                            onClick={() => setViewMode("daily")}
                            className={`${styles.toggleBtn} ${viewMode === "daily" ? styles.toggleBtnActive : ""}`}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setViewMode("monthly")}
                            className={`${styles.toggleBtn} ${viewMode === "monthly" ? styles.toggleBtnActive : ""}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setViewMode("yearly")}
                            className={`${styles.toggleBtn} ${viewMode === "yearly" ? styles.toggleBtnActive : ""}`}
                        >
                            Yearly
                        </button>
                    </div>

                    <div className={styles.vDivider} />

                    {/* Date Picker */}
                    <CustomDatePicker
                        mode={viewMode}
                        value={selectedDate}
                        onChange={setSelectedDate}
                        formatDisplay={formatDate}
                    />

                    <div className={styles.vDivider} />

                    {/* Export Dropdown */}
                    <button 
                        onClick={handleExportExcel}
                        className={styles.btnIcon}
                        style={{ height: '36px', width: '36px', borderRadius: '8px' }}
                        title="Export to Excel"
                    >
                        <Download size={16} />
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className={styles.btnIcon}
                        style={{ height: '36px', width: '36px', borderRadius: '8px' }}
                        title="Export to PDF"
                    >
                        <FileText size={16} />
                    </button>

                    <div className={styles.vDivider} />

                    {/* Display Toggle (Cards vs Charts) */}
                    <div className={styles.toggleWrapper}>
                        <button
                            onClick={() => setDisplayMode("cards")}
                            className={`${styles.toggleBtn} ${displayMode === "cards" ? styles.toggleBtnActive : ""}`}
                            style={{ padding: "0 12px", height: "36px" }}
                            title="Card View"
                        >
                            <LayoutDashboard size={16} />
                        </button>
                        <button
                            onClick={() => setDisplayMode("charts")}
                            className={`${styles.toggleBtn} ${displayMode === "charts" ? styles.toggleBtnActive : ""}`}
                            style={{ padding: "0 12px", height: "36px" }}
                            title="Analytics View"
                        >
                            <TrendingUp size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
