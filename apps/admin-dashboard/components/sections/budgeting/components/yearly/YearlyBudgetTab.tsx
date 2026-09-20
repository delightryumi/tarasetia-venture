"use client";

import React, { useState } from "react";
import {
  YearlyBudgetDocument,
  BudgetMonthData,
  createDefaultBudgetMonthData,
  createDefaultFeesPlan,
} from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import {
  PieChart,
  Bed,
  Utensils,
  Layers,
  Briefcase,
  Users,
  TrendingUp,
  Wrench,
  Calculator,
  Printer,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Building,
  FileSpreadsheet,
} from "lucide-react";
import styles from "../../budgeting.module.css";
import yearlyStyles from "./yearly.module.css";
import { useBudgetExport } from "../../hooks/useBudgetExport";

interface YearlyBudgetTabProps {
  year: number;
  budgetDoc: YearlyBudgetDocument;
  hotelRoomCount: number;
  onSelectMonth: (monthKey: string) => void;
}

const MONTH_KEYS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MONTH_NAMES = [
  { key: "01", short: "Jan", name: "Januari", days: 31 },
  { key: "02", short: "Feb", name: "Februari", days: 28 },
  { key: "03", short: "Mar", name: "Maret", days: 31 },
  { key: "04", short: "Apr", name: "April", days: 30 },
  { key: "05", short: "Mei", name: "Mei", days: 31 },
  { key: "06", short: "Jun", name: "Juni", days: 30 },
  { key: "07", short: "Jul", name: "Juli", days: 31 },
  { key: "08", short: "Agu", name: "Agustus", days: 31 },
  { key: "09", short: "Sep", name: "September", days: 30 },
  { key: "10", short: "Okt", name: "Oktober", days: 31 },
  { key: "11", short: "Nov", name: "November", days: 30 },
  { key: "12", short: "Des", name: "Desember", days: 31 },
];

type DeptTabKey = "pnl" | "room" | "fnb" | "mod" | "ag" | "hrd" | "sm" | "pomec" | "manning" | "fees";

export const YearlyBudgetTab: React.FC<YearlyBudgetTabProps> = ({
  year,
  budgetDoc,
  hotelRoomCount = 8,
  onSelectMonth,
}) => {
  const [activeTab, setActiveTab] = useState<DeptTabKey>("pnl");

  const { exportYearlyMasterExcel } = useBudgetExport({
    year,
    budgetDoc,
    hotelName: budgetDoc?.hotelName || "Bumi Anyom Resort",
    hotelRoomCount,
  });

  // Helper to get 12 month array of data safely
  const monthsData: { key: string; name: string; short: string; data: BudgetMonthData; days: number }[] =
    MONTH_NAMES.map((m) => {
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const days = m.key === "02" && isLeap ? 29 : m.days;
      const d = budgetDoc?.months?.[m.key] || createDefaultBudgetMonthData();
      return {
        key: m.key,
        name: m.name,
        short: m.short,
        data: d,
        days,
      };
    });

  // ── 1. AGGREGATE ANNUAL TOTALS (12 MONTHS) ──
  let totalRoomsAvail = 0;
  let totalRoomsSold = 0;
  let totalGuestPax = 0;
  let totalRoomRev = 0;
  let totalFnbRev = 0;
  let totalModRev = 0;
  let totalNetRevenue = 0;
  let totalSvcCharge = 0;
  let totalGovTax = 0;
  let totalGrossRevenue = 0;

  let totalRoomCogs = 0;
  let totalFnbCogs = 0;
  let totalModCogs = 0;
  let totalCogs = 0;
  let totalGrossProfit = 0;

  let totalRoomExp = 0;
  let totalFnbExp = 0;
  let totalModExp = 0;
  let totalDeptExp = 0;
  let totalDeptProfit = 0;

  let totalAgExp = 0;
  let totalHrdExp = 0;
  let totalSmExp = 0;
  let totalPomecExp = 0;
  let totalUoe = 0;

  let totalGop = 0;
  let totalNonOp = 0;
  let totalNoi = 0;

  monthsData.forEach(({ key, data, days }) => {
    const avail = (data.statistic?.roomsAvailable && data.statistic.roomsAvailable > 0)
      ? data.statistic.roomsAvailable
      : hotelRoomCount * days;
    totalRoomsAvail += avail;
    totalRoomsSold += data.statistic?.occupiedRoomsPaid || 0;
    totalGuestPax += data.statistic?.totalPax || data.statistic?.payingPax || 0;

    const pnl = data.summaryPnl || {
      roomRevenue: 0,
      fnbRevenue: 0,
      modRevenue: 0,
      totalNetRevenue: 0,
      serviceCharge: 0,
      governmentTax: 0,
      totalGrossRevenue: 0,
      roomCogs: 0,
      fnbCogs: 0,
      modCogs: 0,
      totalCogs: 0,
      grossProfit: 0,
      roomExpenses: 0,
      fnbExpenses: 0,
      modExpenses: 0,
      totalDepartmentalExpenses: 0,
      totalDepartmentalProfit: 0,
      agExpenses: 0,
      hrdExpenses: 0,
      smExpenses: 0,
      pomecExpenses: 0,
      totalUndistributedExpenses: 0,
      grossOperatingProfit: 0,
      nonOperatingExpenses: 0,
      netOperatingIncome: 0,
    };

    totalRoomRev += pnl.roomRevenue || 0;
    totalFnbRev += pnl.fnbRevenue || 0;
    totalModRev += pnl.modRevenue || 0;
    totalNetRevenue += pnl.totalNetRevenue || 0;
    totalSvcCharge += pnl.serviceCharge || 0;
    totalGovTax += pnl.governmentTax || 0;
    totalGrossRevenue += pnl.totalGrossRevenue || 0;

    totalRoomCogs += pnl.roomCogs || 0;
    totalFnbCogs += pnl.fnbCogs || 0;
    totalModCogs += pnl.modCogs || 0;
    totalCogs += pnl.totalCogs || 0;
    totalGrossProfit += pnl.grossProfit || 0;

    totalRoomExp += pnl.roomExpenses || 0;
    totalFnbExp += pnl.fnbExpenses || 0;
    totalModExp += pnl.modExpenses || 0;
    totalDeptExp += pnl.totalDepartmentalExpenses || 0;
    totalDeptProfit += pnl.totalDepartmentalProfit || 0;

    totalAgExp += pnl.agExpenses || 0;
    totalHrdExp += pnl.hrdExpenses || 0;
    totalSmExp += pnl.smExpenses || 0;
    totalPomecExp += pnl.pomecExpenses || 0;
    totalUoe += pnl.totalUndistributedExpenses || 0;

    totalGop += pnl.grossOperatingProfit || 0;
    totalNonOp += pnl.nonOperatingExpenses || (data.deptNonOp?.total || 0);
    totalNoi += pnl.netOperatingIncome || 0;
  });

  const annualOccPct = totalRoomsAvail > 0 ? (totalRoomsSold / totalRoomsAvail) * 100 : 0;
  const annualArr = totalRoomsSold > 0 ? Math.round(totalRoomRev / totalRoomsSold) : 0;
  const annualRevPar = totalRoomsAvail > 0 ? Math.round(totalRoomRev / totalRoomsAvail) : 0;
  const annualGopPct = totalNetRevenue > 0 ? (totalGop / totalNetRevenue) * 100 : 0;
  const annualNoiPct = totalNetRevenue > 0 ? (totalNoi / totalNetRevenue) * 100 : 0;
  const annualCogsPct = totalNetRevenue > 0 ? (totalCogs / totalNetRevenue) * 100 : 0;

  // ── 2. QUARTERLY SUMMARIES ──
  const quarters = [
    { name: "Q1", label: "Kuartal 1", months: ["01", "02", "03"], text: "Jan - Mar" },
    { name: "Q2", label: "Kuartal 2", months: ["04", "05", "06"], text: "Apr - Jun" },
    { name: "Q3", label: "Kuartal 3", months: ["07", "08", "09"], text: "Jul - Sep" },
    { name: "Q4", label: "Kuartal 4", months: ["10", "11", "12"], text: "Okt - Des" },
  ].map((q) => {
    let qRev = 0;
    let qCogs = 0;
    let qExp = 0;
    let qGop = 0;
    let qRoomsSold = 0;

    q.months.forEach((k) => {
      const m = budgetDoc?.months?.[k];
      if (m) {
        qRev += m.summaryPnl?.totalNetRevenue || 0;
        qCogs += m.summaryPnl?.totalCogs || 0;
        qExp += (m.summaryPnl?.totalDepartmentalExpenses || 0) + (m.summaryPnl?.totalUndistributedExpenses || 0);
        qGop += m.summaryPnl?.grossOperatingProfit || 0;
        qRoomsSold += m.statistic?.occupiedRoomsPaid || 0;
      }
    });

    const qGopMargin = qRev > 0 ? (qGop / qRev) * 100 : 0;
    return {
      ...q,
      rev: qRev,
      cogs: qCogs,
      exp: qExp,
      gop: qGop,
      gopMargin: qGopMargin,
      roomsSold: qRoomsSold,
    };
  });

  // Table Row Renderer Helper for 12 months + Total + % of Rev
  const renderMatrixRow = ({
    code,
    description,
    values,
    total,
    isCurrency = true,
    totalRevenue = totalNetRevenue,
    isSubtotal = false,
    isHighlight = false,
    customPct,
    indent = false,
  }: {
    code: string;
    description: string;
    values: number[];
    total: number;
    isCurrency?: boolean;
    totalRevenue?: number;
    isSubtotal?: boolean;
    isHighlight?: boolean;
    customPct?: string;
    indent?: boolean;
  }) => {
    const pct = customPct
      ? customPct
      : totalRevenue > 0
      ? `${((total / totalRevenue) * 100).toFixed(1)}%`
      : "0.0%";

    const rowClass = isHighlight
      ? yearlyStyles.matrixHighlightRow
      : isSubtotal
      ? yearlyStyles.matrixSubtotalRow
      : yearlyStyles.matrixRow;

    return (
      <tr className={rowClass}>
        <td className={yearlyStyles.tdStickyCode}>{code}</td>
        <td
          className={yearlyStyles.tdStickyDesc}
          style={{ paddingLeft: indent ? "22px" : "10px", fontWeight: (isSubtotal || isHighlight) ? 800 : 500 }}
          title={description}
        >
          {description}
        </td>
        {values.map((v, idx) => (
          <td
            key={idx}
            className={yearlyStyles.tdMonthCell}
            style={{ fontWeight: (isSubtotal || isHighlight) ? 800 : 500 }}
          >
            {isCurrency ? formatIDR(v) : v.toLocaleString("id-ID")}
          </td>
        ))}
        <td className={yearlyStyles.tdTotalCell}>
          {isCurrency ? formatIDR(total) : total.toLocaleString("id-ID")}
        </td>
        <td className={yearlyStyles.tdPercentCell}>{pct}</td>
      </tr>
    );
  };

  const renderSectionHeader = (title: string, colSpan: number = 15) => (
    <tr className={yearlyStyles.matrixCategoryRow}>
      <td className={yearlyStyles.matrixCategoryCell} colSpan={colSpan}>
        {title}
      </td>
    </tr>
  );

  return (
    <div className={yearlyStyles.yearlyContainer}>
      {/* ── Annual Banner & Action Bar ── */}
      <div className={yearlyStyles.annualBanner}>
        <div className={yearlyStyles.bannerLeft}>
          <div className={yearlyStyles.bannerIconBox}>
            <Calendar size={22} />
          </div>
          <div>
            <h2 className={yearlyStyles.bannerTitle}>
              Konsolidasi Target Budget Tahunan — {year}
            </h2>
            <p className={yearlyStyles.bannerSubtitle}>
              Rekapitulasi 12 bulan target revenue, COGS, departmental expenses, GOP & NOI sesuai standar USALI
            </p>
          </div>
        </div>

        <div className={yearlyStyles.bannerActions}>
          <button
            type="button"
            onClick={exportYearlyMasterExcel}
            className={yearlyStyles.bannerActionBtn}
            style={{ backgroundColor: "#047857", borderColor: "#059669", color: "#ffffff" }}
            title="Download Master Workbook Excel Lengkap (7 Sheet USALI)"
          >
            <FileSpreadsheet size={15} />
            <span>Export Master Excel (7 Sheet)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className={yearlyStyles.bannerActionBtn}
            title="Cetak / Simpan Ringkasan Tahunan sebagai PDF"
          >
            <Printer size={15} />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* ── Annual Master KPI Cards ── */}
      <div className={styles.monthKpiSummaryGrid}>
        <div className={styles.monthKpiCard}>
          <div className={styles.monthKpiHeader}>
            <span className={styles.monthKpiLabel}>Target Net Revenue Tahunan</span>
            <span className={styles.monthKpiSub} style={{ color: "#059669", fontWeight: 700 }}>
              Full Year {year}
            </span>
          </div>
          <span className={styles.monthKpiValue} style={{ color: "#059669" }}>
            {formatIDR(totalNetRevenue)}
          </span>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px", fontSize: "10.5px", color: "#64748b" }}>
            <span>Room: {totalNetRevenue > 0 ? ((totalRoomRev / totalNetRevenue) * 100).toFixed(0) : 0}%</span>
            <span>•</span>
            <span>F&B: {totalNetRevenue > 0 ? ((totalFnbRev / totalNetRevenue) * 100).toFixed(0) : 0}%</span>
            <span>•</span>
            <span>MOD: {totalNetRevenue > 0 ? ((totalModRev / totalNetRevenue) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>

        <div className={styles.monthKpiCard}>
          <div className={styles.monthKpiHeader}>
            <span className={styles.monthKpiLabel}>Cost of Sales (COGS)</span>
            <span className={styles.monthKpiSub} style={{ color: "#b91c1c", fontWeight: 700 }}>
              {annualCogsPct.toFixed(1)}% of Revenue
            </span>
          </div>
          <span className={styles.monthKpiValue} style={{ color: "#b91c1c" }}>
            {formatIDR(totalCogs)}
          </span>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px", fontSize: "10.5px", color: "#64748b" }}>
            <span>Gross Profit: {formatIDR(totalGrossProfit)}</span>
          </div>
        </div>

        <div className={styles.monthKpiCard}>
          <div className={styles.monthKpiHeader}>
            <span className={styles.monthKpiLabel}>Gross Operating Profit (GOP)</span>
            <span
              className={styles.monthKpiSub}
              style={{
                color: totalGop >= 0 ? "#059669" : "#b91c1c",
                fontWeight: 800,
              }}
            >
              GOP Margin {annualGopPct.toFixed(1)}%
            </span>
          </div>
          <span
            className={styles.monthKpiValue}
            style={{
              color: totalGop >= 0 ? "#18181b" : "#b91c1c",
            }}
          >
            {formatIDR(totalGop)}
          </span>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px", fontSize: "10.5px", color: "#64748b" }}>
            <span>TDP: {formatIDR(totalDeptProfit)}</span>
            <span>•</span>
            <span>UOE: {formatIDR(totalUoe)}</span>
          </div>
        </div>

        <div className={styles.monthKpiCard}>
          <div className={styles.monthKpiHeader}>
            <span className={styles.monthKpiLabel}>Net Operating Income (NOI)</span>
            <span
              className={styles.monthKpiSub}
              style={{
                color: totalNoi >= 0 ? "#2563eb" : "#b91c1c",
                fontWeight: 800,
              }}
            >
              NOI Margin {annualNoiPct.toFixed(1)}%
            </span>
          </div>
          <span
            className={styles.monthKpiValue}
            style={{
              color: totalNoi >= 0 ? "#2563eb" : "#b91c1c",
            }}
          >
            {formatIDR(totalNoi)}
          </span>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px", fontSize: "10.5px", color: "#64748b" }}>
            <span>Non-Op Fees: {formatIDR(totalNonOp)}</span>
          </div>
        </div>
      </div>

      {/* ── Hotel Operational Statistics Summary ── */}
      <div className={yearlyStyles.annualStatsGrid}>
        <div className={yearlyStyles.statCard}>
          <span className={yearlyStyles.statLabel}>Rooms Available</span>
          <span className={yearlyStyles.statValue}>{totalRoomsAvail.toLocaleString("id-ID")}</span>
          <span className={yearlyStyles.statSub}>{hotelRoomCount} Kamar Fisik</span>
        </div>

        <div className={yearlyStyles.statCard}>
          <span className={yearlyStyles.statLabel}>Rooms Sold</span>
          <span className={yearlyStyles.statValue}>{totalRoomsSold.toLocaleString("id-ID")}</span>
          <span className={yearlyStyles.statSub}>Target Terjual</span>
        </div>

        <div className={yearlyStyles.statCard}>
          <span className={yearlyStyles.statLabel}>Avg. Occupancy</span>
          <span className={yearlyStyles.statValue} style={{ color: "#2563eb" }}>
            {annualOccPct.toFixed(1)}%
          </span>
          <span className={yearlyStyles.statSub}>Rata-rata 12 Bulan</span>
        </div>

        <div className={yearlyStyles.statCard}>
          <span className={yearlyStyles.statLabel}>Average Room Rate</span>
          <span className={yearlyStyles.statValue}>{formatIDR(annualArr)}</span>
          <span className={yearlyStyles.statSub}>ARR / ADR Target</span>
        </div>

        <div className={yearlyStyles.statCard}>
          <span className={yearlyStyles.statLabel}>RevPAR</span>
          <span className={yearlyStyles.statValue}>{formatIDR(annualRevPar)}</span>
          <span className={yearlyStyles.statSub}>Revenue / Avail Room</span>
        </div>

        <div className={yearlyStyles.statCard}>
          <span className={yearlyStyles.statLabel}>Total Guest Pax</span>
          <span className={yearlyStyles.statValue}>{totalGuestPax.toLocaleString("id-ID")}</span>
          <span className={yearlyStyles.statSub}>Estimasi Tamu</span>
        </div>
      </div>

      {/* ── Quarterly Performance Highlights ── */}
      <div className={yearlyStyles.quarterGrid}>
        {quarters.map((q) => (
          <div key={q.name} className={yearlyStyles.quarterCard}>
            <div className={yearlyStyles.quarterHeader}>
              <span className={yearlyStyles.quarterBadge}>{q.name} ({q.text})</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: q.gop >= 0 ? "#059669" : "#b91c1c",
                }}
              >
                GOP {q.gopMargin.toFixed(1)}%
              </span>
            </div>
            <div className={yearlyStyles.quarterRow}>
              <span className={yearlyStyles.quarterRowLabel}>Net Revenue</span>
              <span className={yearlyStyles.quarterRowValue} style={{ color: "#059669" }}>
                {formatIDR(q.rev)}
              </span>
            </div>
            <div className={yearlyStyles.quarterRow}>
              <span className={yearlyStyles.quarterRowLabel}>GOP Amount</span>
              <span className={yearlyStyles.quarterRowValue} style={{ color: q.gop >= 0 ? "#0f172a" : "#b91c1c" }}>
                {formatIDR(q.gop)}
              </span>
            </div>
            <div className={yearlyStyles.quarterRow}>
              <span className={yearlyStyles.quarterRowLabel}>Rooms Sold</span>
              <span className={yearlyStyles.quarterRowValue}>{q.roomsSold.toLocaleString("id-ID")}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── USALI Department Navigation Tabs ── */}
      <div className={styles.sectionTabsNav}>
        <button
          onClick={() => setActiveTab("pnl")}
          className={`${styles.sectionNavBtn} ${activeTab === "pnl" ? styles.sectionNavBtnActive : ""}`}
        >
          <PieChart size={16} />
          <span>IS Summary (P&L)</span>
        </button>

        <button
          onClick={() => setActiveTab("room")}
          className={`${styles.sectionNavBtn} ${activeTab === "room" ? styles.sectionNavBtnActive : ""}`}
        >
          <Bed size={16} />
          <span>ROOM (FO & HK)</span>
        </button>

        <button
          onClick={() => setActiveTab("fnb")}
          className={`${styles.sectionNavBtn} ${activeTab === "fnb" ? styles.sectionNavBtnActive : ""}`}
        >
          <Utensils size={16} />
          <span>F&B (Rest, Kitchen, Lounge, BQ, RS)</span>
        </button>

        <button
          onClick={() => setActiveTab("mod")}
          className={`${styles.sectionNavBtn} ${activeTab === "mod" ? styles.sectionNavBtnActive : ""}`}
        >
          <Layers size={16} />
          <span>MOD (Laundry, Spa, OI)</span>
        </button>

        <button
          onClick={() => setActiveTab("ag")}
          className={`${styles.sectionNavBtn} ${activeTab === "ag" ? styles.sectionNavBtnActive : ""}`}
        >
          <Briefcase size={16} />
          <span>A&G</span>
        </button>

        <button
          onClick={() => setActiveTab("hrd")}
          className={`${styles.sectionNavBtn} ${activeTab === "hrd" ? styles.sectionNavBtnActive : ""}`}
        >
          <Users size={16} />
          <span>HRD</span>
        </button>

        <button
          onClick={() => setActiveTab("sm")}
          className={`${styles.sectionNavBtn} ${activeTab === "sm" ? styles.sectionNavBtnActive : ""}`}
        >
          <TrendingUp size={16} />
          <span>SM</span>
        </button>

        <button
          onClick={() => setActiveTab("pomec")}
          className={`${styles.sectionNavBtn} ${activeTab === "pomec" ? styles.sectionNavBtnActive : ""}`}
        >
          <Wrench size={16} />
          <span>POMEC</span>
        </button>

        <button
          onClick={() => setActiveTab("manning")}
          className={`${styles.sectionNavBtn} ${activeTab === "manning" ? styles.sectionNavBtnActive : ""}`}
        >
          <Users size={16} />
          <span>Manning Plan</span>
        </button>

        <button
          onClick={() => setActiveTab("fees")}
          className={`${styles.sectionNavBtn} ${activeTab === "fees" ? styles.sectionNavBtnActive : ""}`}
        >
          <Calculator size={16} />
          <span>Fees & Non-Op</span>
        </button>
      </div>

      {/* ── 12-MONTH MATRIX TABLE CONTAINER ── */}
      <div className={yearlyStyles.matrixWrapper}>
        <table className={yearlyStyles.matrixTable}>
          <thead>
            <tr>
              <th className={yearlyStyles.thStickyCode}>KODE</th>
              <th className={yearlyStyles.thStickyDesc}>DESKRIPSI AKUN USALI</th>
              {MONTH_NAMES.map((m) => (
                <th
                  key={m.key}
                  className={yearlyStyles.thMonth}
                  onClick={() => onSelectMonth(m.key)}
                  title={`Klik untuk mengedit target bulan ${m.name} di mode Bulanan`}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "2px" }}>
                    <span>{m.short}</span>
                    <ExternalLink size={10} style={{ opacity: 0.6 }} />
                  </div>
                </th>
              ))}
              <th className={yearlyStyles.thTotal}>TOTAL {year}</th>
              <th className={yearlyStyles.thPercent}>% REV</th>
            </tr>
          </thead>
          <tbody>
            {/* ══════════════ TAB 1: SUMMARY P&L ══════════════ */}
            {activeTab === "pnl" && (
              <>
                {/* 1. REVENUE */}
                {renderSectionHeader("1. REVENUE (PENDAPATAN DEPARTEMEN)")}
                {renderMatrixRow({
                  code: "3013",
                  description: "Rooms Revenue",
                  values: monthsData.map((m) => m.data.summaryPnl?.roomRevenue || 0),
                  total: totalRoomRev,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "3023",
                  description: "Food & Beverage Revenue",
                  values: monthsData.map((m) => m.data.summaryPnl?.fnbRevenue || 0),
                  total: totalFnbRev,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "3323",
                  description: "Minor Operating Departments (MOD & OI)",
                  values: monthsData.map((m) => m.data.summaryPnl?.modRevenue || 0),
                  total: totalModRev,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL",
                  description: "TOTAL NET REVENUE",
                  values: monthsData.map((m) => m.data.summaryPnl?.totalNetRevenue || 0),
                  total: totalNetRevenue,
                  isSubtotal: true,
                })}
                {renderMatrixRow({
                  code: "SVC",
                  description: "Service Charge (10%)",
                  values: monthsData.map((m) => m.data.summaryPnl?.serviceCharge || 0),
                  total: totalSvcCharge,
                  customPct: "10.0%",
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TAX",
                  description: "Government Tax (PB1 - 10%)",
                  values: monthsData.map((m) => m.data.summaryPnl?.governmentTax || 0),
                  total: totalGovTax,
                  customPct: "10.0%",
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "GROSS",
                  description: "TOTAL GROSS REVENUE (Inc. Tax & Service)",
                  values: monthsData.map((m) => m.data.summaryPnl?.totalGrossRevenue || 0),
                  total: totalGrossRevenue,
                  isSubtotal: true,
                  customPct: "120.0%",
                })}

                {/* 2. COST OF SALES */}
                {renderSectionHeader("2. COST OF SALES (COGS)")}
                {renderMatrixRow({
                  code: "4013",
                  description: "Rooms Cost of Sales",
                  values: monthsData.map((m) => m.data.summaryPnl?.roomCogs || 0),
                  total: totalRoomCogs,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "4023",
                  description: "Food & Beverage Cost of Sales",
                  values: monthsData.map((m) => m.data.summaryPnl?.fnbCogs || 0),
                  total: totalFnbCogs,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "4323",
                  description: "Minor Operating Departments Cost",
                  values: monthsData.map((m) => m.data.summaryPnl?.modCogs || 0),
                  total: totalModCogs,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "COGS",
                  description: "TOTAL COST OF SALES",
                  values: monthsData.map((m) => m.data.summaryPnl?.totalCogs || 0),
                  total: totalCogs,
                  isSubtotal: true,
                })}
                {renderMatrixRow({
                  code: "GP",
                  description: "GROSS PROFIT",
                  values: monthsData.map((m) => m.data.summaryPnl?.grossProfit || 0),
                  total: totalGrossProfit,
                  isHighlight: true,
                })}

                {/* 3. DEPARTMENTAL EXPENSES */}
                {renderSectionHeader("3. DEPARTMENTAL OPERATING EXPENSES")}
                {renderMatrixRow({
                  code: "5013",
                  description: "Rooms Department Expenses (FO & HK)",
                  values: monthsData.map((m) => m.data.summaryPnl?.roomExpenses || 0),
                  total: totalRoomExp,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "5023",
                  description: "Food & Beverage Expenses",
                  values: monthsData.map((m) => m.data.summaryPnl?.fnbExpenses || 0),
                  total: totalFnbExp,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "5323",
                  description: "Minor Operating Departments Expenses",
                  values: monthsData.map((m) => m.data.summaryPnl?.modExpenses || 0),
                  total: totalModExp,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "DEP-EXP",
                  description: "TOTAL DEPARTMENTAL EXPENSES",
                  values: monthsData.map((m) => m.data.summaryPnl?.totalDepartmentalExpenses || 0),
                  total: totalDeptExp,
                  isSubtotal: true,
                })}
                {renderMatrixRow({
                  code: "TDP",
                  description: "TOTAL DEPARTMENTAL PROFIT (TDP)",
                  values: monthsData.map((m) => m.data.summaryPnl?.totalDepartmentalProfit || 0),
                  total: totalDeptProfit,
                  isHighlight: true,
                })}

                {/* 4. UNDISTRIBUTED OPERATING EXPENSES */}
                {renderSectionHeader("4. UNDISTRIBUTED OPERATING EXPENSES (UOE)")}
                {renderMatrixRow({
                  code: "6013",
                  description: "Administrative & General (A&G)",
                  values: monthsData.map((m) => m.data.summaryPnl?.agExpenses || 0),
                  total: totalAgExp,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "6023",
                  description: "Human Resources Department (HRD)",
                  values: monthsData.map((m) => m.data.summaryPnl?.hrdExpenses || 0),
                  total: totalHrdExp,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "6033",
                  description: "Sales & Marketing (S&M)",
                  values: monthsData.map((m) => m.data.summaryPnl?.smExpenses || 0),
                  total: totalSmExp,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "6043",
                  description: "Property Operations, Maintenance & Energy (POMEC)",
                  values: monthsData.map((m) => m.data.summaryPnl?.pomecExpenses || 0),
                  total: totalPomecExp,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "UOE",
                  description: "TOTAL UNDISTRIBUTED EXPENSES",
                  values: monthsData.map((m) => m.data.summaryPnl?.totalUndistributedExpenses || 0),
                  total: totalUoe,
                  isSubtotal: true,
                })}

                {/* 5. GOP */}
                {renderMatrixRow({
                  code: "GOP",
                  description: `GROSS OPERATING PROFIT (GOP ${annualGopPct.toFixed(1)}%)`,
                  values: monthsData.map((m) => m.data.summaryPnl?.grossOperatingProfit || 0),
                  total: totalGop,
                  isHighlight: true,
                })}

                {/* 6. NON-OPERATING EXPENSES */}
                {renderSectionHeader("5. NON-OPERATING EXPENSES & FEES")}
                {renderMatrixRow({
                  code: "7000",
                  description: "Management Fees, Insurance, PBB & Interest",
                  values: monthsData.map((m) => m.data.summaryPnl?.nonOperatingExpenses || m.data.deptNonOp?.total || 0),
                  total: totalNonOp,
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "NOI",
                  description: `NET OPERATING INCOME (NOI ${annualNoiPct.toFixed(1)}%)`,
                  values: monthsData.map((m) => m.data.summaryPnl?.netOperatingIncome || 0),
                  total: totalNoi,
                  isHighlight: true,
                })}
              </>
            )}

            {/* ══════════════ TAB 2: ROOM DEPT ══════════════ */}
            {activeTab === "room" && (
              <>
                {/* 1. ROOM STATISTIC */}
                {renderSectionHeader("1. ROOM OPERATIONAL STATISTICS")}
                {renderMatrixRow({
                  code: "STAT-01",
                  description: "Rooms Available",
                  values: monthsData.map((m) => m.data.statistic?.roomsAvailable || (hotelRoomCount * m.days)),
                  total: totalRoomsAvail,
                  isCurrency: false,
                  customPct: "-",
                })}
                {renderMatrixRow({
                  code: "STAT-02",
                  description: "Rooms Sold (Occupied Paid)",
                  values: monthsData.map((m) => m.data.statistic?.occupiedRoomsPaid || 0),
                  total: totalRoomsSold,
                  isCurrency: false,
                  customPct: `${annualOccPct.toFixed(1)}%`,
                })}
                {renderMatrixRow({
                  code: "STAT-03",
                  description: "Occupancy Rate (%)",
                  values: monthsData.map((m) => m.data.statistic?.occupancyPercent || 0),
                  total: Number(annualOccPct.toFixed(1)),
                  isCurrency: false,
                  customPct: `${annualOccPct.toFixed(1)}%`,
                })}
                {renderMatrixRow({
                  code: "STAT-04",
                  description: "Average Room Rate (ARR/ADR)",
                  values: monthsData.map((m) => m.data.statistic?.arrIdr || 0),
                  total: annualArr,
                  isCurrency: true,
                  customPct: "-",
                })}
                {renderMatrixRow({
                  code: "STAT-05",
                  description: "Total Guest Pax",
                  values: monthsData.map((m) => m.data.statistic?.totalPax || m.data.statistic?.payingPax || 0),
                  total: totalGuestPax,
                  isCurrency: false,
                  customPct: "-",
                })}

                {/* 2. REVENUE */}
                {renderSectionHeader("2. ROOMS REVENUE")}
                {renderMatrixRow({
                  code: "3011",
                  description: "Lodging (Room Sales)",
                  values: monthsData.map((m) => m.data.deptRooms?.revenue?.lodging || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptRooms?.revenue?.lodging || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "3012",
                  description: "Extra Bed",
                  values: monthsData.map((m) => m.data.deptRooms?.revenue?.extraBed || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptRooms?.revenue?.extraBed || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "3013",
                  description: "Other Room Revenue",
                  values: monthsData.map((m) => m.data.deptRooms?.revenue?.otherRoomRevenue || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptRooms?.revenue?.otherRoomRevenue || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL-RM",
                  description: "TOTAL ROOM REVENUE",
                  values: monthsData.map((m) => m.data.deptRooms?.revenue?.total || 0),
                  total: totalRoomRev,
                  isSubtotal: true,
                })}

                {/* 3. COGS */}
                {renderSectionHeader("3. ROOMS COST OF SALES (COGS)")}
                {renderMatrixRow({
                  code: "4011",
                  description: "Room Supplies Cost",
                  values: monthsData.map((m) => m.data.deptRooms?.cogs?.roomSupplies || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptRooms?.cogs?.roomSupplies || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "4012",
                  description: "Linen Replacement Cost",
                  values: monthsData.map((m) => m.data.deptRooms?.cogs?.linenReplacement || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptRooms?.cogs?.linenReplacement || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "COGS-RM",
                  description: "TOTAL ROOM COGS",
                  values: monthsData.map((m) => m.data.deptRooms?.cogs?.total || 0),
                  total: totalRoomCogs,
                  isSubtotal: true,
                })}

                {/* 4. EXPENSES */}
                {renderSectionHeader("4. ROOMS OPERATING EXPENSES (FO & HK)")}
                {renderMatrixRow({
                  code: "FO-SAL",
                  description: "Front Office Salary & Wages",
                  values: monthsData.map((m) => m.data.deptRooms?.frontOffice?.salary?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptRooms?.frontOffice?.salary?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FO-EXP",
                  description: "Front Office Other Operating Expenses",
                  values: monthsData.map((m) => m.data.deptRooms?.frontOffice?.expenses?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptRooms?.frontOffice?.expenses?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "HK-SAL",
                  description: "Housekeeping Salary & Wages",
                  values: monthsData.map((m) => m.data.deptRooms?.housekeeping?.salary?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptRooms?.housekeeping?.salary?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "HK-EXP",
                  description: "Housekeeping Other Operating Expenses",
                  values: monthsData.map((m) => m.data.deptRooms?.housekeeping?.expenses?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptRooms?.housekeeping?.expenses?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL-EXP",
                  description: "TOTAL ROOM DEPARTMENT EXPENSES",
                  values: monthsData.map((m) => m.data.deptRooms?.totalExpenses || 0),
                  total: totalRoomExp,
                  isSubtotal: true,
                })}
                {renderMatrixRow({
                  code: "PROFIT-RM",
                  description: "ROOM DEPARTMENT PROFIT",
                  values: monthsData.map((m) => m.data.deptRooms?.departmentProfit || 0),
                  total: totalRoomRev - totalRoomCogs - totalRoomExp,
                  isHighlight: true,
                })}
              </>
            )}

            {/* ══════════════ TAB 3: F&B DEPT ══════════════ */}
            {activeTab === "fnb" && (
              <>
                {renderSectionHeader("1. F&B REVENUE BY OUTLET & STREAM")}
                {renderMatrixRow({
                  code: "FB-01",
                  description: "Restaurant (Food & Beverage)",
                  values: monthsData.map((m) => m.data.deptFnB?.revenue?.restaurant?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptFnB?.revenue?.restaurant?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FB-02",
                  description: "Sky Lounge & Bar",
                  values: monthsData.map((m) => m.data.deptFnB?.revenue?.lounge?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptFnB?.revenue?.lounge?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FB-03",
                  description: "Banquet & Meeting",
                  values: monthsData.map((m) => m.data.deptFnB?.revenue?.banquet?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptFnB?.revenue?.banquet?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FB-04",
                  description: "Room Service",
                  values: monthsData.map((m) => m.data.deptFnB?.revenue?.roomService?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptFnB?.revenue?.roomService?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL-FNB",
                  description: "TOTAL F&B NET REVENUE",
                  values: monthsData.map((m) => m.data.deptFnB?.revenue?.total || 0),
                  total: totalFnbRev,
                  isSubtotal: true,
                })}

                {renderSectionHeader("2. F&B COST OF SALES (COGS)")}
                {renderMatrixRow({
                  code: "4021",
                  description: "Food Cost",
                  values: monthsData.map((m) => {
                    const c = m.data.deptFnB?.cogs;
                    return (
                      (c?.restaurant?.costFood || 0) +
                      (c?.kitchen?.costFood || 0) +
                      (c?.lounge?.costFood || 0) +
                      (c?.banquet?.costFood || 0) +
                      (c?.roomService?.costFood || 0) || ((c as any)?.foodCost || 0)
                    );
                  }),
                  total: monthsData.reduce((acc, m) => {
                    const c = m.data.deptFnB?.cogs;
                    return (
                      acc +
                      ((c?.restaurant?.costFood || 0) +
                        (c?.kitchen?.costFood || 0) +
                        (c?.lounge?.costFood || 0) +
                        (c?.banquet?.costFood || 0) +
                        (c?.roomService?.costFood || 0) || ((c as any)?.foodCost || 0))
                    );
                  }, 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "4022",
                  description: "Beverage Cost",
                  values: monthsData.map((m) => {
                    const c = m.data.deptFnB?.cogs;
                    return (
                      (c?.restaurant?.costBeverage || 0) +
                      (c?.kitchen?.costBeverage || 0) +
                      (c?.lounge?.costBeverage || 0) +
                      (c?.banquet?.costBeverage || 0) +
                      (c?.roomService?.costBeverage || 0) || ((c as any)?.beverageCost || 0)
                    );
                  }),
                  total: monthsData.reduce((acc, m) => {
                    const c = m.data.deptFnB?.cogs;
                    return (
                      acc +
                      ((c?.restaurant?.costBeverage || 0) +
                        (c?.kitchen?.costBeverage || 0) +
                        (c?.lounge?.costBeverage || 0) +
                        (c?.banquet?.costBeverage || 0) +
                        (c?.roomService?.costBeverage || 0) || ((c as any)?.beverageCost || 0))
                    );
                  }, 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "COGS-FNB",
                  description: "TOTAL F&B COGS",
                  values: monthsData.map((m) => m.data.deptFnB?.cogs?.total || 0),
                  total: totalFnbCogs,
                  isSubtotal: true,
                })}

                {renderSectionHeader("3. F&B PAYROLL & OPERATING EXPENSES")}
                {renderMatrixRow({
                  code: "FNB-SAL",
                  description: "F&B Salary & Wages (All Outlets)",
                  values: monthsData.map((m) => {
                    const f = m.data.deptFnB;
                    return (
                      (f?.restaurant?.salary?.total || 0) +
                      (f?.kitchen?.salary?.total || 0) +
                      (f?.lounge?.salary?.total || 0) +
                      (f?.banquet?.salary?.total || 0) +
                      (f?.roomService?.salary?.total || 0)
                    );
                  }),
                  total: monthsData.reduce((acc, m) => {
                    const f = m.data.deptFnB;
                    return (
                      acc +
                      (f?.restaurant?.salary?.total || 0) +
                      (f?.kitchen?.salary?.total || 0) +
                      (f?.lounge?.salary?.total || 0) +
                      (f?.banquet?.salary?.total || 0) +
                      (f?.roomService?.salary?.total || 0)
                    );
                  }, 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FNB-EXP",
                  description: "F&B Other Operating Expenses",
                  values: monthsData.map((m) => {
                    const f = m.data.deptFnB;
                    return (
                      (f?.restaurant?.expenses?.total || 0) +
                      (f?.kitchen?.expenses?.total || 0) +
                      (f?.lounge?.expenses?.total || 0) +
                      (f?.banquet?.expenses?.total || 0) +
                      (f?.roomService?.expenses?.total || 0)
                    );
                  }),
                  total: monthsData.reduce((acc, m) => {
                    const f = m.data.deptFnB;
                    return (
                      acc +
                      (f?.restaurant?.expenses?.total || 0) +
                      (f?.kitchen?.expenses?.total || 0) +
                      (f?.lounge?.expenses?.total || 0) +
                      (f?.banquet?.expenses?.total || 0) +
                      (f?.roomService?.expenses?.total || 0)
                    );
                  }, 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL-FNB-EXP",
                  description: "TOTAL F&B DEPARTMENT EXPENSES",
                  values: monthsData.map((m) => m.data.deptFnB?.totalExpenses || 0),
                  total: totalFnbExp,
                  isSubtotal: true,
                })}
                {renderMatrixRow({
                  code: "PROFIT-FNB",
                  description: "F&B DEPARTMENT PROFIT",
                  values: monthsData.map((m) => m.data.deptFnB?.departmentProfit || 0),
                  total: totalFnbRev - totalFnbCogs - totalFnbExp,
                  isHighlight: true,
                })}
              </>
            )}

            {/* ══════════════ TAB 4: MOD DEPT ══════════════ */}
            {activeTab === "mod" && (
              <>
                {renderSectionHeader("1. LAUNDRY DEPARTMENT")}
                {renderMatrixRow({
                  code: "3311",
                  description: "Laundry Revenue",
                  values: monthsData.map((m) => m.data.deptMod?.laundry?.revenue?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptMod?.laundry?.revenue?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "4311",
                  description: "Laundry Cost & Expenses",
                  values: monthsData.map((m) => (m.data.deptMod?.laundry?.cogs?.total || 0) + (m.data.deptMod?.laundry?.totalExpenses || 0)),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptMod?.laundry?.cogs?.total || 0) + (m.data.deptMod?.laundry?.totalExpenses || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "PROFIT-LAU",
                  description: "Laundry Department Profit",
                  values: monthsData.map((m) => m.data.deptMod?.laundry?.departmentProfit || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptMod?.laundry?.departmentProfit || 0), 0),
                  isSubtotal: true,
                })}

                {renderSectionHeader("2. SPA & FITNESS DEPARTMENT")}
                {renderMatrixRow({
                  code: "3321",
                  description: "Spa & Fitness Revenue",
                  values: monthsData.map((m) => m.data.deptMod?.spaFitness?.revenue?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptMod?.spaFitness?.revenue?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "4321",
                  description: "Spa Cost & Expenses",
                  values: monthsData.map((m) => (m.data.deptMod?.spaFitness?.cogs?.total || 0) + (m.data.deptMod?.spaFitness?.totalExpenses || 0)),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptMod?.spaFitness?.cogs?.total || 0) + (m.data.deptMod?.spaFitness?.totalExpenses || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "PROFIT-SPA",
                  description: "Spa Department Profit",
                  values: monthsData.map((m) => m.data.deptMod?.spaFitness?.departmentProfit || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptMod?.spaFitness?.departmentProfit || 0), 0),
                  isSubtotal: true,
                })}

                {renderSectionHeader("3. OTHER INCOME (OI)")}
                {renderMatrixRow({
                  code: "3331",
                  description: "Space Rental, Tour, Transport & Other Income",
                  values: monthsData.map((m) => m.data.deptMod?.otherIncome?.revenue?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptMod?.otherIncome?.revenue?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "PROFIT-MOD",
                  description: "TOTAL MINOR OPERATING PROFIT",
                  values: monthsData.map((m) => m.data.deptMod?.departmentProfit || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptMod?.departmentProfit || 0), 0),
                  isHighlight: true,
                })}
              </>
            )}

            {/* ══════════════ TAB 5: A&G DEPT ══════════════ */}
            {activeTab === "ag" && (
              <>
                {renderSectionHeader("ADMINISTRATIVE & GENERAL (A&G)")}
                {renderMatrixRow({
                  code: "AG-SAL",
                  description: "A&G Salary & Wages",
                  values: monthsData.map((m) => m.data.deptAg?.salary?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptAg?.salary?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "AG-EXP",
                  description: "A&G Other Operating Expenses",
                  values: monthsData.map((m) => m.data.deptAg?.expenses?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptAg?.expenses?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL-AG",
                  description: "TOTAL A&G EXPENSES",
                  values: monthsData.map((m) => m.data.deptAg?.totalExpenses || 0),
                  total: totalAgExp,
                  isHighlight: true,
                })}
              </>
            )}

            {/* ══════════════ TAB 6: HRD DEPT ══════════════ */}
            {activeTab === "hrd" && (
              <>
                {renderSectionHeader("HUMAN RESOURCES DEPARTMENT (HRD)")}
                {renderMatrixRow({
                  code: "HRD-SAL",
                  description: "HRD Salary & Wages",
                  values: monthsData.map((m) => m.data.deptHrd?.salary?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptHrd?.salary?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "HRD-EXP",
                  description: "Training, Medical, Outing & HR Expenses",
                  values: monthsData.map((m) => m.data.deptHrd?.expenses?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptHrd?.expenses?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL-HRD",
                  description: "TOTAL HRD EXPENSES",
                  values: monthsData.map((m) => m.data.deptHrd?.totalExpenses || 0),
                  total: totalHrdExp,
                  isHighlight: true,
                })}
              </>
            )}

            {/* ══════════════ TAB 7: SM DEPT ══════════════ */}
            {activeTab === "sm" && (
              <>
                {renderSectionHeader("SALES & MARKETING (S&M)")}
                {renderMatrixRow({
                  code: "SM-SAL",
                  description: "Sales & Marketing Salary & Wages",
                  values: monthsData.map((m) => m.data.deptSm?.salary?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptSm?.salary?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "SM-ADV",
                  description: "Advertising OTA, Social Media & Marketing Expenses",
                  values: monthsData.map((m) => m.data.deptSm?.expenses?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptSm?.expenses?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL-SM",
                  description: "TOTAL SALES & MARKETING EXPENSES",
                  values: monthsData.map((m) => m.data.deptSm?.totalExpenses || 0),
                  total: totalSmExp,
                  isHighlight: true,
                })}
              </>
            )}

            {/* ══════════════ TAB 8: POMEC DEPT ══════════════ */}
            {activeTab === "pomec" && (
              <>
                {renderSectionHeader("POMEC (PROPERTY OPS, MAINTENANCE & ENERGY)")}
                {renderMatrixRow({
                  code: "POM-SAL",
                  description: "Engineering Salary & Wages",
                  values: monthsData.map((m) => m.data.deptPomec?.salary?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptPomec?.salary?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "ENG-UTL",
                  description: "Energy & Utilities (PLN, PDAM, LPG Gas, Solar)",
                  values: monthsData.map((m) => m.data.deptPomec?.energy?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptPomec?.energy?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "ENG-MNT",
                  description: "Maintenance & Repairs (AC, Generator, Building, Pool)",
                  values: monthsData.map((m) => m.data.deptPomec?.maintenance?.total || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptPomec?.maintenance?.total || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL-POM",
                  description: "TOTAL POMEC EXPENSES",
                  values: monthsData.map((m) => m.data.deptPomec?.totalExpenses || 0),
                  total: totalPomecExp,
                  isHighlight: true,
                })}
              </>
            )}

            {/* ══════════════ TAB 9: MANNING ══════════════ */}
            {activeTab === "manning" && (
              <>
                {renderSectionHeader("MANNING PLAN & PAYROLL CONSOLIDATION")}
                {[
                  { key: "gmExcom" as const, label: "Executive Committee (EXCOM / GM)", code: "GM", getPayroll: (m: BudgetMonthData) => m.deptAg?.salary?.total || 0 },
                  { key: "frontOffice" as const, label: "Front Office (FO)", code: "FO", getPayroll: (m: BudgetMonthData) => m.deptRooms?.frontOffice?.salary?.total || 0 },
                  { key: "housekeeping" as const, label: "Housekeeping (HK)", code: "HK", getPayroll: (m: BudgetMonthData) => m.deptRooms?.housekeeping?.salary?.total || 0 },
                  { key: "fnbKitchen" as const, label: "F&B Kitchen (Prod)", code: "FB-K", getPayroll: (m: BudgetMonthData) => m.deptFnB?.kitchen?.salary?.total || 0 },
                  { key: "fnbService" as const, label: "F&B Service (Rest & Bar)", code: "FB-S", getPayroll: (m: BudgetMonthData) => (m.deptFnB?.restaurant?.salary?.total || 0) + (m.deptFnB?.lounge?.salary?.total || 0) + (m.deptFnB?.banquet?.salary?.total || 0) + (m.deptFnB?.roomService?.salary?.total || 0) },
                  { key: "salesMarketing" as const, label: "Sales & Marketing (SM)", code: "SM", getPayroll: (m: BudgetMonthData) => m.deptSm?.salary?.total || 0 },
                  { key: "accounting" as const, label: "Accounting & Admin (AG)", code: "AG", getPayroll: (m: BudgetMonthData) => m.deptAg?.salary?.total || 0 },
                  { key: "hrd" as const, label: "Human Resources (HRD)", code: "HRD", getPayroll: (m: BudgetMonthData) => m.deptHrd?.salary?.total || 0 },
                  { key: "engineering" as const, label: "Engineering & Maintenance (POMEC)", code: "ENG", getPayroll: (m: BudgetMonthData) => m.deptPomec?.salary?.total || 0 },
                  { key: "spaFitness" as const, label: "Spa & Minor Operating (MOD)", code: "MOD", getPayroll: (m: BudgetMonthData) => (m.deptMod?.laundry?.salary?.total || 0) + (m.deptMod?.spaFitness?.salary?.total || 0) },
                ].map((item) => {
                  const headcount = budgetDoc.manning?.departments?.[item.key]?.total || 0;
                  const monthlySeries = monthsData.map((m) => item.getPayroll(m.data));
                  const totalPayroll = monthlySeries.reduce((acc, v) => acc + v, 0);

                  return renderMatrixRow({
                    code: item.code,
                    description: `${item.label} — (${headcount} Staff)`,
                    values: monthlySeries,
                    total: totalPayroll,
                    indent: true,
                  });
                })}
              </>
            )}

            {/* ══════════════ TAB 10: FEES ══════════════ */}
            {activeTab === "fees" && (
              <>
                {renderSectionHeader("FEES & NON-OPERATING EXPENSES")}
                {renderMatrixRow({
                  code: "FEE-01",
                  description: "Management Base Fee",
                  values: monthsData.map((m) => m.data.deptNonOp?.managementBaseFee || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptNonOp?.managementBaseFee || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FEE-02",
                  description: "Management Incentive Fee",
                  values: monthsData.map((m) => m.data.deptNonOp?.managementIncentiveFee || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptNonOp?.managementIncentiveFee || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FEE-03",
                  description: "Building Insurance",
                  values: monthsData.map((m) => m.data.deptNonOp?.buildingInsurance || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptNonOp?.buildingInsurance || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FEE-04",
                  description: "Property Tax (PBB)",
                  values: monthsData.map((m) => m.data.deptNonOp?.propertyTaxPbb || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptNonOp?.propertyTaxPbb || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FEE-05",
                  description: "Bank Interest Charges",
                  values: monthsData.map((m) => m.data.deptNonOp?.bankInterestCharges || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptNonOp?.bankInterestCharges || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "FEE-06",
                  description: "Depreciation & Amortization",
                  values: monthsData.map((m) => m.data.deptNonOp?.depreciationAmortization || 0),
                  total: monthsData.reduce((acc, m) => acc + (m.data.deptNonOp?.depreciationAmortization || 0), 0),
                  indent: true,
                })}
                {renderMatrixRow({
                  code: "TOTAL-NONOP",
                  description: "TOTAL NON-OPERATING EXPENSES",
                  values: monthsData.map((m) => m.data.deptNonOp?.total || 0),
                  total: totalNonOp,
                  isHighlight: true,
                })}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
