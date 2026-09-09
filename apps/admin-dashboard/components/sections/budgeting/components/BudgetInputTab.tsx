"use client";

import React, { useState, useEffect } from "react";
import {
  YearlyBudgetDocument,
  BudgetMonthData,
  createDefaultBudgetMonthData,
  createDefaultManningPlan,
  createDefaultFeesPlan,
  recalculateBudgetMonthData,
} from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import {
  Save,
  Copy,
  Check,
  Bed,
  Utensils,
  Briefcase,
  Layers,
  PieChart,
  Users,
  TrendingUp,
  Wrench,
  Sparkles,
  Calculator,
} from "lucide-react";
import styles from "../budgeting.module.css";

// Departmental Sub-components mirroring all 26 sheets of Excel USALI standard
import { SummaryPnlTab } from "./departments/SummaryPnlTab";
import { RoomDeptTab } from "./departments/RoomDeptTab";
import { FnBDeptTab } from "./departments/FnBDeptTab";
import { ModDeptTab } from "./departments/ModDeptTab";
import { AgDeptTab } from "./departments/AgDeptTab";
import { HrdDeptTab } from "./departments/HrdDeptTab";
import { SmDeptTab } from "./departments/SmDeptTab";
import { PomecDeptTab } from "./departments/PomecDeptTab";
import { ManningTab } from "./departments/ManningTab";
import { FeesTab } from "./departments/FeesTab";

interface BudgetInputTabProps {
  year: number;
  budgetDoc: YearlyBudgetDocument | null;
  hotelRoomCount?: number;
  onSave: (doc: YearlyBudgetDocument) => Promise<void>;
  saving: boolean;
  saveSuccess: boolean;
}

const MONTH_NAMES = [
  { key: "01", name: "Januari" },
  { key: "02", name: "Februari" },
  { key: "03", name: "Maret" },
  { key: "04", name: "April" },
  { key: "05", name: "Mei" },
  { key: "06", name: "Juni" },
  { key: "07", name: "Juli" },
  { key: "08", name: "Agustus" },
  { key: "09", name: "September" },
  { key: "10", name: "Oktober" },
  { key: "11", name: "November" },
  { key: "12", name: "Desember" },
];

type DeptTabKey = "pnl" | "room" | "fnb" | "mod" | "ag" | "hrd" | "sm" | "pomec" | "manning" | "fees";

export const BudgetInputTab: React.FC<BudgetInputTabProps> = ({
  year,
  budgetDoc,
  hotelRoomCount = 39,
  onSave,
  saving,
  saveSuccess,
}) => {
  const [activeMonthKey, setActiveMonthKey] = useState<string>("01");
  const [activeTab, setActiveTab] = useState<DeptTabKey>("pnl");
  const [localDoc, setLocalDoc] = useState<YearlyBudgetDocument | null>(() => {
    if (budgetDoc) return JSON.parse(JSON.stringify(budgetDoc));
    const emptyMonths: Record<string, BudgetMonthData> = {};
    for (let m = 1; m <= 12; m++) {
      const k = String(m).padStart(2, "0");
      const daysInM = new Date(year, m, 0).getDate();
      const defaultData = createDefaultBudgetMonthData();
      defaultData.statistic.roomsAvailable = hotelRoomCount * daysInM;
      emptyMonths[k] = defaultData;
    }
    return {
      year,
      hotelCode: "default",
      hotelName: "Bumi Anyom Resort",
      months: emptyMonths,
      manning: createDefaultManningPlan(hotelRoomCount, year),
      fees: createDefaultFeesPlan(),
    };
  });

  useEffect(() => {
    if (budgetDoc) {
      setLocalDoc(JSON.parse(JSON.stringify(budgetDoc)));
    }
  }, [budgetDoc]);

  if (!localDoc) {
    return (
      <div className={styles.formCard} style={{ textAlign: "center", padding: "48px" }}>
        <p style={{ color: "#78716c", fontWeight: 600 }}>
          Memuat data budgeting departemen tahun {year}...
        </p>
      </div>
    );
  }

  const currentMonthNum = parseInt(activeMonthKey, 10);
  const currentMonthName = MONTH_NAMES.find((m) => m.key === activeMonthKey)?.name || "Januari";
  const daysInCurrentMonth = new Date(year, currentMonthNum, 0).getDate();
  const autoRoomsAvailable = hotelRoomCount * daysInCurrentMonth;

  // Retrieve or initialize month data
  const currentMonthData: BudgetMonthData =
    localDoc.months?.[activeMonthKey] || createDefaultBudgetMonthData();

  // Centralized updater with USALI roll-up recalculation
  const updateMonthField = (updater: (draft: BudgetMonthData) => void) => {
    const nextDoc = JSON.parse(JSON.stringify(localDoc)) as YearlyBudgetDocument;
    if (!nextDoc.months) nextDoc.months = {};
    if (!nextDoc.months[activeMonthKey]) {
      nextDoc.months[activeMonthKey] = createDefaultBudgetMonthData();
    }

    const draft = nextDoc.months[activeMonthKey];
    updater(draft);

    // Run complete roll-up recalculation across all departments & master summary P&L
    recalculateBudgetMonthData(draft);

    setLocalDoc(nextDoc);
  };

  // Copy active month's entire departmental configuration across all 12 months
  const copyToAllMonths = () => {
    if (!localDoc) return;
    const nextDoc = JSON.parse(JSON.stringify(localDoc)) as YearlyBudgetDocument;
    const src = nextDoc.months[activeMonthKey] || createDefaultBudgetMonthData();

    for (let m = 1; m <= 12; m++) {
      const k = String(m).padStart(2, "0");
      const daysInM = new Date(year, m, 0).getDate();
      const monthAvail = hotelRoomCount * daysInM;

      const copied = JSON.parse(JSON.stringify(src)) as BudgetMonthData;
      copied.statistic.roomsAvailable = monthAvail;

      if (copied.statistic.occupancyPercent > 0) {
        copied.statistic.occupiedRoomsPaid = Math.round(
          (monthAvail * copied.statistic.occupancyPercent) / 100
        );
        copied.statistic.totalPax = Math.round(copied.statistic.occupiedRoomsPaid * 1.2);
        copied.statistic.payingPax = copied.statistic.totalPax;
        if (copied.statistic.arrIdr > 0) {
          copied.deptRooms.revenue.lodging = copied.statistic.occupiedRoomsPaid * copied.statistic.arrIdr;
          copied.roomRevenue.lodging = copied.deptRooms.revenue.lodging;
        }
      }

      recalculateBudgetMonthData(copied);
      nextDoc.months[k] = copied;
    }
    setLocalDoc(nextDoc);
  };

  const updateEntireDoc = (updater: (draft: YearlyBudgetDocument) => void) => {
    if (!localDoc) return;
    const nextDoc = JSON.parse(JSON.stringify(localDoc)) as YearlyBudgetDocument;
    updater(nextDoc);
    setLocalDoc(nextDoc);
  };

  const handleSave = () => {
    if (localDoc) {
      onSave(localDoc);
    }
  };

  const pnl = currentMonthData.summaryPnl || {
    totalGrossRevenue: 0,
    totalNetRevenue: 0,
    grossProfit: 0,
    grossOperatingProfit: 0,
    gopMarginPercent: 0,
    netOperatingIncome: 0,
  };

  return (
    <div className={styles.sectionGrid}>
      {/* Top Toolbar */}
      <div className={styles.monthSelectorBar}>
        {/* Month Buttons Jan - Des */}
        <div className={styles.monthButtonsList}>
          {MONTH_NAMES.map((m) => {
            const isActive = m.key === activeMonthKey;
            return (
              <button
                key={m.key}
                onClick={() => setActiveMonthKey(m.key)}
                className={`${styles.monthBtn} ${isActive ? styles.monthBtnActive : ""}`}
              >
                {m.name.slice(0, 3)}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className={styles.toolbarActions}>
          <button
            onClick={copyToAllMonths}
            className={styles.copyBtn}
            title="Salin konfigurasi bulan ini ke semua bulan (Jan - Des)"
          >
            <Copy size={16} />
            <span>Salin ke Semua Bulan</span>
          </button>

          <button
            onClick={() => onSave(localDoc)}
            disabled={saving}
            className={styles.saveBtn}
          >
            {saveSuccess ? (
              <>
                <Check size={16} />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{saving ? "Menyimpan..." : "Simpan Budget"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Active Month KPI Cards */}
      <div className={styles.monthKpiSummaryGrid}>
        <div className={styles.monthKpiCard}>
          <div className={styles.monthKpiHeader}>
            <span className={styles.monthKpiLabel}>Target Net Revenue</span>
            <span className={styles.monthKpiSub}>{currentMonthName}</span>
          </div>
          <span className={styles.monthKpiValue} style={{ color: "#059669" }}>
            {formatIDR(pnl.totalNetRevenue || 0)}
          </span>
        </div>

        <div className={styles.monthKpiCard}>
          <div className={styles.monthKpiHeader}>
            <span className={styles.monthKpiLabel}>Cost of Sales (COGS)</span>
            <span className={styles.monthKpiSub}>
              {pnl.totalNetRevenue > 0 ? `${(((pnl.totalCogs || 0) / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
            </span>
          </div>
          <span className={styles.monthKpiValue} style={{ color: "#b91c1c" }}>
            {formatIDR(pnl.totalCogs || 0)}
          </span>
        </div>

        <div className={styles.monthKpiCard}>
          <div className={styles.monthKpiHeader}>
            <span className={styles.monthKpiLabel}>Gross Operating Profit</span>
            <span
              className={styles.monthKpiSub}
              style={{
                color: (pnl.grossOperatingProfit || 0) >= 0 ? "#059669" : "#b91c1c",
                fontWeight: 800,
              }}
            >
              GOP {(pnl.gopMarginPercent || 0).toFixed(1)}%
            </span>
          </div>
          <span
            className={styles.monthKpiValue}
            style={{
              color: (pnl.grossOperatingProfit || 0) >= 0 ? "#18181b" : "#b91c1c",
            }}
          >
            {formatIDR(pnl.grossOperatingProfit || 0)}
          </span>
        </div>

        <div className={styles.monthKpiCard}>
          <div className={styles.monthKpiHeader}>
            <span className={styles.monthKpiLabel}>Net Operating Income</span>
            <span
              className={styles.monthKpiSub}
              style={{
                color: (pnl.netOperatingIncome || 0) >= 0 ? "#2563eb" : "#b91c1c",
                fontWeight: 800,
              }}
            >
              NOI {(pnl.noiMarginPercent || 0).toFixed(1)}%
            </span>
          </div>
          <span
            className={styles.monthKpiValue}
            style={{
              color: (pnl.netOperatingIncome || 0) >= 0 ? "#2563eb" : "#b91c1c",
            }}
          >
            {formatIDR(pnl.netOperatingIncome || 0)}
          </span>
        </div>
      </div>

      {/* USALI Departmental Navigation Bar (Mirroring Excel 26 Sheets) */}
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
          <span>Manning</span>
        </button>

        <button
          onClick={() => setActiveTab("fees")}
          className={`${styles.sectionNavBtn} ${activeTab === "fees" ? styles.sectionNavBtnActive : ""}`}
        >
          <Calculator size={16} />
          <span>Fees</span>
        </button>
      </div>

      {/* DEPARTMENTAL CONTENT RENDERING */}
      {activeTab === "pnl" && (
        <SummaryPnlTab monthData={currentMonthData} onChange={updateMonthField} />
      )}

      {activeTab === "room" && (
        <RoomDeptTab
          monthData={currentMonthData}
          hotelRoomCount={hotelRoomCount}
          daysInMonth={daysInCurrentMonth}
          onChange={updateMonthField}
        />
      )}

      {activeTab === "fnb" && (
        <FnBDeptTab monthData={currentMonthData} onChange={updateMonthField} />
      )}

      {activeTab === "mod" && (
        <ModDeptTab monthData={currentMonthData} onChange={updateMonthField} />
      )}

      {activeTab === "ag" && (
        <AgDeptTab monthData={currentMonthData} onChange={updateMonthField} />
      )}

      {activeTab === "hrd" && (
        <HrdDeptTab monthData={currentMonthData} onChange={updateMonthField} />
      )}

      {activeTab === "sm" && (
        <SmDeptTab monthData={currentMonthData} onChange={updateMonthField} />
      )}

      {activeTab === "pomec" && (
        <PomecDeptTab monthData={currentMonthData} onChange={updateMonthField} />
      )}

      {activeTab === "manning" && (
        <ManningTab
          budgetDoc={localDoc}
          hotelRoomCount={hotelRoomCount}
          onDocChange={updateEntireDoc}
        />
      )}

      {activeTab === "fees" && (
        <FeesTab
          budgetDoc={localDoc}
          onDocChange={updateEntireDoc}
        />
      )}
    </div>
  );
};
