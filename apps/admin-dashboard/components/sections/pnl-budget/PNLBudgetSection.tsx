"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PieChart,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { formatIDR } from "@/lib/pnl-utils";
import { usePNLBudget } from "./hooks/usePNLBudget";
import { MonthlyActualVsBudgetTab } from "./components/MonthlyActualVsBudgetTab";
import { QuarterlyReviewTab } from "./components/QuarterlyReviewTab";
import { AnnualSummaryTab } from "./components/AnnualSummaryTab";
import { MultiYearAnalysisTab } from "./components/MultiYearAnalysisTab";
import styles from "./pnl-budget.module.css";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

const MONTH_OPTIONS = [
  { key: "01", name: "Jan" },
  { key: "02", name: "Feb" },
  { key: "03", name: "Mar" },
  { key: "04", name: "Apr" },
  { key: "05", name: "Mei" },
  { key: "06", name: "Jun" },
  { key: "07", name: "Jul" },
  { key: "08", name: "Agu" },
  { key: "09", name: "Sep" },
  { key: "10", name: "Okt" },
  { key: "11", name: "Nov" },
  { key: "12", name: "Des" },
];

export const PNLBudgetSection: React.FC = () => {
  const {
    hotelName,
    hotelRoomCount,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    activeView,
    setActiveView,
    loading,
    budgetDoc,
    actualMonthlyData,
    reloadData,
  } = usePNLBudget();

  const [zoomLevel, setZoomLevel] = useState<number>(0.85);

  useEffect(() => {
    const saved = localStorage.getItem("crs_pnl_budget_zoom");
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.6 && parsed <= 1.2) {
        setZoomLevel(parsed);
      }
    }
  }, []);

  const changeZoom = (newZoom: number) => {
    const clamped = Math.min(1.2, Math.max(0.65, Number(newZoom.toFixed(2))));
    setZoomLevel(clamped);
    localStorage.setItem("crs_pnl_budget_zoom", String(clamped));
  };

  const changeYear = (delta: number) => {
    setSelectedYear(selectedYear + delta);
  };

  // KPIs for the selected month
  const mActual = actualMonthlyData[selectedMonth] || {};
  const mBudget = budgetDoc?.months?.[selectedMonth]?.summaryPnl || {};

  const actRev = (mActual.roomRevenue || 0) + (mActual.fnbRevenue || 0) + (mActual.modRevenue || 0) + (mActual.otherIncome || 0);
  const budRev = mBudget.totalNetRevenue || 0;
  const revVar = actRev - budRev;
  const revVarPct = budRev > 0 ? (revVar / budRev) * 100 : 0;

  const actCogs = (mActual.roomCogs || 0) + (mActual.fnbCogs || 0) + (mActual.modCogs || 0);
  const actOpex = mActual.totalOpex || 0;
  const actGop = actRev - actCogs - actOpex;
  const budGop = mBudget.grossOperatingProfit || 0;
  const gopVar = actGop - budGop;
  const gopVarPct = budGop !== 0 ? (gopVar / Math.abs(budGop)) * 100 : 0;

  const daysInMonth = new Date(selectedYear, parseInt(selectedMonth, 10), 0).getDate();
  const roomsAvail = hotelRoomCount * daysInMonth;
  const actRoomsSold = mActual.occupiedRooms || 0;
  const budRoomsSold = budgetDoc?.months?.[selectedMonth]?.statistic?.occupiedRoomsPaid || 0;
  const actOcc = roomsAvail > 0 ? (actRoomsSold / roomsAvail) * 100 : 0;
  const budOcc = budgetDoc?.months?.[selectedMonth]?.statistic?.occupancyPercent || 0;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className={styles.container}
    >
      {/* 1. Header */}
      <motion.header variants={rise} className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeCategory}>
            <div className={styles.badgeIcon}>
              <FileSpreadsheet size={15} />
            </div>
            <span>USALI Accounting & Performance Review</span>
          </div>
          <h1 className={styles.title}>
            P&L Statement <span className={styles.titleAccent}>Actual vs Budget</span>
          </h1>
          <p className={styles.subTitle}>
            {hotelName} • Komparasi Laba Rugi Operasional Realisasi vs Perencanaan Target USALI
          </p>
        </div>

        <div className={styles.toolbar}>
          {/* Zoom / Scale Controller */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              backgroundColor: "#ffffff",
              border: "1px solid #e7e5e4",
              borderRadius: "10px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <button
              onClick={() => changeZoom(zoomLevel - 0.05)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                color: "#71717a",
              }}
              title="Perkecil Ukuran Tampilan (Zoom Out)"
            >
              <ZoomOut size={14} />
            </button>
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 800,
                color: "#27272a",
                minWidth: "40px",
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => changeZoom(zoomLevel === 0.85 ? 1 : 0.85)}
              title="Klik untuk reset (Fit Screen / 100%)"
            >
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => changeZoom(zoomLevel + 0.05)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                color: "#71717a",
              }}
              title="Perbesar Ukuran Tampilan (Zoom In)"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => changeZoom(0.85)}
              style={{
                border: "none",
                background: zoomLevel === 0.85 ? "#18181b" : "#f4f4f5",
                color: zoomLevel === 0.85 ? "#ffffff" : "#52525b",
                cursor: "pointer",
                padding: "3px 7px",
                borderRadius: "6px",
                fontSize: "10.5px",
                fontWeight: 800,
                marginLeft: "2px",
                transition: "all 0.15s ease",
              }}
              title="Fit to Screen (85%)"
            >
              Fit
            </button>
          </div>

          <div className={styles.datePickerWrapper}>
            <button
              onClick={() => changeYear(-1)}
              className={styles.iconBtn}
              title="Tahun Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 800, fontSize: "15px", minWidth: "50px", textAlign: "center" }}>
              {selectedYear}
            </span>
            <button
              onClick={() => changeYear(1)}
              className={styles.iconBtn}
              title="Tahun Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={reloadData}
            className={styles.iconBtn}
            style={{ width: "36px", height: "36px", background: "#ffffff", border: "1px solid #e7e5e4", borderRadius: "10px" }}
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </motion.header>

      {/* 2. Top Metric Cards */}
      <motion.div variants={rise} className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Operating Revenue</span>
          <span className={styles.kpiValue} style={{ color: "#0284c7" }}>
            {formatIDR(actRev)}
          </span>
          <div className={styles.kpiComparison}>
            <span style={{ color: "#78716c" }}>Target: {formatIDR(budRev)}</span>
            <span className={revVar >= 0 ? styles.variancePositive : styles.varianceNegative}>
              {revVar >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {revVarPct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Gross Operating Profit (GOP)</span>
          <span className={styles.kpiValue} style={{ color: actGop >= 0 ? "#16a34a" : "#dc2626" }}>
            {formatIDR(actGop)}
          </span>
          <div className={styles.kpiComparison}>
            <span style={{ color: "#78716c" }}>Target: {formatIDR(budGop)}</span>
            <span className={gopVar >= 0 ? styles.variancePositive : styles.varianceNegative}>
              {gopVar >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {gopVarPct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Occupancy Rate</span>
          <span className={styles.kpiValue} style={{ color: "#2563eb" }}>
            {actOcc.toFixed(1)}%
          </span>
          <div className={styles.kpiComparison}>
            <span style={{ color: "#78716c" }}>Target: {budOcc.toFixed(1)}% ({budRoomsSold} Rms)</span>
            <span className={actOcc >= budOcc ? styles.variancePositive : styles.varianceNegative}>
              {actOcc >= budOcc ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {(actOcc - budOcc).toFixed(1)}% pts
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Rooms Sold (Kamar Terjual)</span>
          <span className={styles.kpiValue}>
            {actRoomsSold} <span style={{ fontSize: "14px", fontWeight: 600, color: "#78716c" }}>/ {roomsAvail}</span>
          </span>
          <div className={styles.kpiComparison}>
            <span style={{ color: "#78716c" }}>Target: {budRoomsSold} Kamar</span>
            <span className={actRoomsSold >= budRoomsSold ? styles.variancePositive : styles.varianceNegative}>
              {actRoomsSold >= budRoomsSold ? "+" : ""}{actRoomsSold - budRoomsSold} Rms
            </span>
          </div>
        </div>
      </motion.div>

      {/* 3. View Switcher Tabs */}
      <motion.div variants={rise} className={styles.viewTabsNav}>
        <button
          onClick={() => setActiveView("monthly")}
          className={`${styles.viewTabBtn} ${activeView === "monthly" ? styles.viewTabBtnActive : ""}`}
        >
          <Calendar size={16} />
          <span>Monthly P&L Variance</span>
        </button>

        <button
          onClick={() => setActiveView("quarterly")}
          className={`${styles.viewTabBtn} ${activeView === "quarterly" ? styles.viewTabBtnActive : ""}`}
        >
          <Layers size={16} />
          <span>Quarterly Review</span>
        </button>

        <button
          onClick={() => setActiveView("annual")}
          className={`${styles.viewTabBtn} ${activeView === "annual" ? styles.viewTabBtnActive : ""}`}
        >
          <TrendingUp size={16} />
          <span>Annual Summary</span>
        </button>

        <button
          onClick={() => setActiveView("multiyear")}
          className={`${styles.viewTabBtn} ${activeView === "multiyear" ? styles.viewTabBtnActive : ""}`}
        >
          <PieChart size={16} />
          <span>Multi-Year Analysis</span>
        </button>
      </motion.div>

      {/* Subheader Month Selector when Monthly View is Active */}
      {activeView === "monthly" && (
        <motion.div variants={rise} className={styles.monthBar}>
          {MONTH_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMonth(m.key)}
              className={`${styles.monthPill} ${selectedMonth === m.key ? styles.monthPillActive : ""}`}
            >
              {m.name}
            </button>
          ))}
        </motion.div>
      )}

      {/* 4. Active View Rendering with Zoom / Fit Page Scale */}
      <motion.div variants={rise} style={{ zoom: zoomLevel, width: "100%" }}>
        {activeView === "monthly" && (
          <MonthlyActualVsBudgetTab
            year={selectedYear}
            monthKey={selectedMonth}
            budgetDoc={budgetDoc}
            actualData={actualMonthlyData[selectedMonth]}
            allActualMonthlyData={actualMonthlyData}
            hotelRoomCount={hotelRoomCount}
          />
        )}

        {activeView === "quarterly" && (
          <QuarterlyReviewTab
            year={selectedYear}
            budgetDoc={budgetDoc}
            actualMonthlyData={actualMonthlyData}
            hotelRoomCount={hotelRoomCount}
          />
        )}

        {activeView === "annual" && (
          <AnnualSummaryTab
            year={selectedYear}
            budgetDoc={budgetDoc}
            actualMonthlyData={actualMonthlyData}
            hotelRoomCount={hotelRoomCount}
          />
        )}

        {activeView === "multiyear" && (
          <MultiYearAnalysisTab
            currentYear={selectedYear}
            budgetDoc={budgetDoc}
            actualMonthlyData={actualMonthlyData}
            hotelRoomCount={hotelRoomCount}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
