"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Calendar,
  BarChart3,
  FileSpreadsheet,
  Download,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import styles from "../budgeting.module.css";
import yearlyStyles from "./yearly/yearly.module.css";
import { YearlyBudgetTab } from "./yearly/YearlyBudgetTab";
import { useBudgetExport } from "../hooks/useBudgetExport";

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
  onDirtyChange?: (isDirty: boolean) => void;
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

const VALID_ADMIN_PASSWORDS = ["admin123", "owner123", "superadmin", "superadmin123", "setara123", "admin"];

type DeptTabKey = "pnl" | "room" | "fnb" | "mod" | "ag" | "hrd" | "sm" | "pomec" | "manning" | "fees";

export const BudgetInputTab: React.FC<BudgetInputTabProps> = ({
  year,
  budgetDoc,
  hotelRoomCount = 8,
  onSave,
  saving,
  saveSuccess,
  onDirtyChange,
}) => {
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [activeMonthKey, setActiveMonthKey] = useState<string>("01");
  const [activeTab, setActiveTab] = useState<DeptTabKey>("pnl");

  // Track Unsaved Edits
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Admin Auth input state
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

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

  // Sync when budgetDoc changes from server / year change
  useEffect(() => {
    if (budgetDoc) {
      setLocalDoc(JSON.parse(JSON.stringify(budgetDoc)));
      setIsDirty(false);
      onDirtyChange?.(false);
    }
  }, [budgetDoc, onDirtyChange]);

  // Focus password input when modal opens
  useEffect(() => {
    if (showPasswordModal) {
      setPasswordInput("");
      setPasswordError(null);
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 120);
    }
  }, [showPasswordModal]);

  // Browser Reload / Close Tab Guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Anda memiliki perubahan target budgeting yang belum disimpan.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // Intercept Keyboard Reload Shortcuts (F5, Ctrl+R, Cmd+R) with Custom CSS Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDirty) return;
      const isReloadKey =
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R"));
      if (isReloadKey) {
        e.preventDefault();
        e.stopPropagation();
        setPendingAction(() => {
          window.location.reload();
        });
        setShowUnsavedModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isDirty]);

  // Intercept in-app navigation (e.g. sidebar menu buttons, header navigation, links) when isDirty is true
  useEffect(() => {
    if (!isDirty) return;

    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Allow clicks inside the modals themselves (password input, cancel button, discard button, confirm button, etc.)
      if (
        target.closest(`.${styles.authModalCard}`) ||
        target.closest(`.${styles.authModalOverlay}`)
      ) {
        return;
      }

      // 2. Allow clicks inside the budgeting content area (editing inputs, subtabs, copy button, save button, excel export, etc.)
      const isInsideBudgeting =
        target.closest(`.${styles.container}`) ||
        target.closest(`.${styles.sectionGrid}`) ||
        target.closest(`.${styles.monthSelectorBar}`) ||
        target.closest(`.${styles.formCard}`);

      if (isInsideBudgeting) {
        return;
      }

      // 3. If click is on an outside navigation element (Sidebar aside, nav-item, nav-group, select-module-btn, header buttons, or any outside link/button)
      const clickable = (target.closest("button") || target.closest("a")) as HTMLElement | null;
      if (clickable) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        setPendingAction(() => () => {
          setIsDirty(false);
          onDirtyChange?.(false);
          setTimeout(() => {
            clickable.click();
          }, 60);
        });

        setShowUnsavedModal(true);
      }
    };

    document.addEventListener("click", handleCaptureClick, true);
    return () => {
      document.removeEventListener("click", handleCaptureClick, true);
    };
  }, [isDirty, onDirtyChange]);

  // Notify parent of dirty state
  const markDirty = (dirty: boolean = true) => {
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  };

  const { exportYearlyMasterExcel, exportMonthlyBudgetExcel } = useBudgetExport({
    year,
    budgetDoc: localDoc,
    hotelName: localDoc?.hotelName || "Bumi Anyom Resort",
    hotelRoomCount,
  });

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
    markDirty(true);
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
    markDirty(true);
    toast.success(`Konfigurasi bulan ${currentMonthName} berhasil disalin ke seluruh 12 bulan!`);
  };

  const updateEntireDoc = (updater: (draft: YearlyBudgetDocument) => void) => {
    if (!localDoc) return;
    const nextDoc = JSON.parse(JSON.stringify(localDoc)) as YearlyBudgetDocument;
    updater(nextDoc);
    setLocalDoc(nextDoc);
    markDirty(true);
  };

  // Guarded Navigation Helper (prompts if unsaved changes exist)
  const performGuardedAction = (action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

  // Handle Month Switch with Guard
  const handleSelectMonth = (monthKey: string) => {
    if (monthKey === activeMonthKey && viewMode === "monthly") return;
    performGuardedAction(() => {
      setActiveMonthKey(monthKey);
      setViewMode("monthly");
    });
  };

  // Handle View Mode Switch with Guard
  const handleSelectViewMode = (mode: "monthly" | "yearly") => {
    if (mode === viewMode) return;
    performGuardedAction(() => {
      setViewMode(mode);
    });
  };

  // Trigger Save (Opens Password Verification Modal)
  const handleSaveClick = () => {
    setShowPasswordModal(true);
  };

  // Verify Admin Password & Save
  const handleVerifyAndSave = async () => {
    if (!VALID_ADMIN_PASSWORDS.includes(passwordInput.trim())) {
      setPasswordError("Password Admin salah! Silakan periksa kembali sandi Anda.");
      toast.error("Password Admin salah! Penyimpanan target budgeting dibatalkan.");
      return;
    }

    try {
      setShowPasswordModal(false);
      setPasswordError(null);
      setPasswordInput("");
      
      if (localDoc) {
        await onSave(localDoc);
        markDirty(false);
        toast.success(`Target Budgeting tahun ${year} berhasil disimpan ke database!`);

        // Execute pending action if any was queued
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      }
    } catch (err: any) {
      console.error("Budget save error:", err);
      toast.error(err?.message ? `Gagal menyimpan: ${err.message}` : "Gagal menyimpan data budgeting ke server.");
    }
  };

  // Discard local changes and revert to server state
  const handleDiscardChanges = () => {
    if (budgetDoc) {
      setLocalDoc(JSON.parse(JSON.stringify(budgetDoc)));
    }
    markDirty(false);
    setShowUnsavedModal(false);
    toast.info("Perubahan target budgeting telah dibuang.");

    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
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
        {/* View Mode Toggle & Month Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Segmented Mode Switcher */}
          <div className={yearlyStyles.viewModeToggleGroup}>
            <button
              type="button"
              onClick={() => handleSelectViewMode("monthly")}
              className={`${yearlyStyles.viewModeBtn} ${viewMode === "monthly" ? yearlyStyles.viewModeBtnActive : ""}`}
            >
              <Calendar size={14} />
              <span>Bulanan (Monthly)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectViewMode("yearly")}
              className={`${yearlyStyles.viewModeBtn} ${viewMode === "yearly" ? yearlyStyles.viewModeBtnActive : ""}`}
            >
              <BarChart3 size={14} />
              <span>Tahunan (Full Year)</span>
            </button>
          </div>

          {/* Month Buttons Jan - Des (shown in Monthly mode or with direct jumper) */}
          {viewMode === "monthly" ? (
            <div className={styles.monthButtonsList}>
              {MONTH_NAMES.map((m) => {
                const isActive = m.key === activeMonthKey;
                return (
                  <button
                    key={m.key}
                    onClick={() => handleSelectMonth(m.key)}
                    className={`${styles.monthBtn} ${isActive ? styles.monthBtnActive : ""}`}
                  >
                    {m.name.slice(0, 3)}
                  </button>
                );
              })}
              <div style={{ width: "1px", height: "18px", backgroundColor: "#d4d4d8", margin: "0 2px" }} />
              <button
                type="button"
                onClick={() => handleSelectViewMode("yearly")}
                className={styles.monthBtn}
                style={{ color: "#2563eb", fontWeight: 800 }}
                title="Lihat Rekapitulasi Konsolidasi Budget Tahunan"
              >
                📊 Tahunan (12 Bulan)
              </button>
            </div>
          ) : (
            <div className={styles.monthButtonsList}>
              <button
                type="button"
                onClick={() => handleSelectViewMode("yearly")}
                className={`${styles.monthBtn} ${styles.monthBtnActive}`}
                style={{ fontWeight: 800 }}
              >
                📊 Konsolidasi 12 Bulan (Full Year)
              </button>
              <div style={{ width: "1px", height: "18px", backgroundColor: "#d4d4d8", margin: "0 2px" }} />
              {MONTH_NAMES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => handleSelectMonth(m.key)}
                  className={styles.monthBtn}
                  title={`Beralih ke mode edit bulan ${m.name}`}
                >
                  {m.name.slice(0, 3)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions & Unsaved Badge */}
        <div className={styles.toolbarActions}>
          {isDirty && (
            <div className={styles.unsavedBadge} title="Anda memiliki perubahan target budget yang belum disimpan">
              <span className={styles.unsavedDot} />
              <span>Belum Disimpan</span>
            </div>
          )}

          {viewMode === "monthly" ? (
            <>
              <button
                type="button"
                onClick={() => exportMonthlyBudgetExcel(activeMonthKey)}
                className={styles.copyBtn}
                style={{ color: "#047857", borderColor: "#a7f3d0", backgroundColor: "#ecfdf5" }}
                title={`Download Excel rincian budget bulan ${currentMonthName}`}
              >
                <FileSpreadsheet size={15} />
                <span>Excel {currentMonthName.slice(0, 3)}</span>
              </button>

              <button
                type="button"
                onClick={exportYearlyMasterExcel}
                className={styles.copyBtn}
                style={{ color: "#1d4ed8", borderColor: "#bfdbfe", backgroundColor: "#eff6ff" }}
                title="Download Master Workbook Excel Konsolidasi 12 Bulan Lengkap (7 Sheet USALI)"
              >
                <Download size={15} />
                <span>Master Excel (12 Bulan)</span>
              </button>

              <button
                onClick={copyToAllMonths}
                className={styles.copyBtn}
                title="Salin konfigurasi bulan ini ke semua bulan (Jan - Des)"
              >
                <Copy size={16} />
                <span>Salin ke Semua Bulan</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={exportYearlyMasterExcel}
              className={styles.copyBtn}
              style={{ color: "#047857", borderColor: "#a7f3d0", backgroundColor: "#ecfdf5", fontWeight: 700 }}
              title="Download Master Workbook Excel Konsolidasi 12 Bulan Lengkap (7 Sheet USALI)"
            >
              <FileSpreadsheet size={15} />
              <span>Export Master Excel (7 Sheet)</span>
            </button>
          )}

          <button
            onClick={handleSaveClick}
            disabled={saving}
            className={styles.saveBtn}
            style={isDirty ? { backgroundColor: "#059669", boxShadow: "0 0 0 2px #a7f3d0" } : {}}
          >
            {saveSuccess ? (
              <>
                <Check size={16} />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{saving ? "Menyimpan..." : isDirty ? "Simpan Budget *" : "Simpan Budget"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── CONDITIONAL RENDERING: YEARLY VIEW vs MONTHLY VIEW ── */}
      {viewMode === "yearly" ? (
        <YearlyBudgetTab
          year={year}
          budgetDoc={localDoc}
          hotelRoomCount={hotelRoomCount}
          onSelectMonth={(mKey) => handleSelectMonth(mKey)}
        />
      ) : (
        <>
          {/* Monthly KPI Summary Strip */}
          <div className={styles.monthKpiSummaryGrid}>
            <div className={styles.monthKpiCard}>
              <div className={styles.monthKpiHeader}>
                <span className={styles.monthKpiLabel}>Target Net Revenue</span>
                <span className={styles.monthKpiSub}>{currentMonthName} {year}</span>
              </div>
              <span className={styles.monthKpiValue} style={{ color: "#059669" }}>
                {formatIDR(pnl.totalNetRevenue)}
              </span>
            </div>

            <div className={styles.monthKpiCard}>
              <div className={styles.monthKpiHeader}>
                <span className={styles.monthKpiLabel}>Gross Operating Profit (GOP)</span>
                <span
                  className={styles.monthKpiSub}
                  style={{
                    color: pnl.grossOperatingProfit >= 0 ? "#059669" : "#dc2626",
                    fontWeight: 700,
                  }}
                >
                  {pnl.gopMarginPercent.toFixed(1)}% GOP Margin
                </span>
              </div>
              <span
                className={styles.monthKpiValue}
                style={{ color: pnl.grossOperatingProfit >= 0 ? "#059669" : "#dc2626" }}
              >
                {formatIDR(pnl.grossOperatingProfit)}
              </span>
            </div>

            <div className={styles.monthKpiCard}>
              <div className={styles.monthKpiHeader}>
                <span className={styles.monthKpiLabel}>Target Occupancy & ADR</span>
                <span className={styles.monthKpiSub}>
                  {currentMonthData.statistic?.occupiedRoomsPaid || 0} / {autoRoomsAvailable} RN
                </span>
              </div>
              <span className={styles.monthKpiValue} style={{ color: "#2563eb" }}>
                {(currentMonthData.statistic?.occupancyPercent || 0).toFixed(1)}% • {formatIDR(currentMonthData.statistic?.arrIdr || 0)}
              </span>
            </div>
          </div>

          {/* Departmental USALI Tabs Header */}
          <div className={styles.deptTabContainer}>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "pnl" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("pnl")}
            >
              <PieChart size={14} />
              <span>Summary P&L (Consolidated)</span>
            </button>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "room" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("room")}
            >
              <Bed size={14} />
              <span>Rooms Dept (FO & HK)</span>
            </button>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "fnb" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("fnb")}
            >
              <Utensils size={14} />
              <span>F&B Dept (Service & Culinary)</span>
            </button>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "mod" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("mod")}
            >
              <Layers size={14} />
              <span>Minor Operating (MOD)</span>
            </button>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "ag" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("ag")}
            >
              <Briefcase size={14} />
              <span>A&G (Admin & General)</span>
            </button>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "hrd" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("hrd")}
            >
              <Users size={14} />
              <span>HRD (Human Resources)</span>
            </button>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "sm" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("sm")}
            >
              <TrendingUp size={14} />
              <span>Sales & Marketing</span>
            </button>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "pomec" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("pomec")}
            >
              <Wrench size={14} />
              <span>POMEC (Engineering & Energy)</span>
            </button>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "manning" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("manning")}
            >
              <Users size={14} />
              <span>Manning & Headcount</span>
            </button>
            <button
              className={`${styles.deptTabBtn} ${activeTab === "fees" ? styles.deptTabBtnActive : ""}`}
              onClick={() => setActiveTab("fees")}
            >
              <Sparkles size={14} />
              <span>Fees & Non-Operating</span>
            </button>
          </div>

          {/* Departmental USALI Form Body */}
          <div className={styles.formCard}>
            {activeTab === "pnl" && (
              <SummaryPnlTab
                monthData={currentMonthData}
                onChange={updateMonthField}
              />
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
              <FnBDeptTab
                monthData={currentMonthData}
                onChange={updateMonthField}
              />
            )}
            {activeTab === "mod" && (
              <ModDeptTab
                monthData={currentMonthData}
                onChange={updateMonthField}
              />
            )}
            {activeTab === "ag" && (
              <AgDeptTab
                monthData={currentMonthData}
                onChange={updateMonthField}
              />
            )}
            {activeTab === "hrd" && (
              <HrdDeptTab
                monthData={currentMonthData}
                onChange={updateMonthField}
              />
            )}
            {activeTab === "sm" && (
              <SmDeptTab
                monthData={currentMonthData}
                onChange={updateMonthField}
              />
            )}
            {activeTab === "pomec" && (
              <PomecDeptTab
                monthData={currentMonthData}
                onChange={updateMonthField}
              />
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
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 1: UNSAVED CHANGES WARNING MODAL
          ═════════════════════════════════════════════════════════════════════ */}
      {showUnsavedModal && (
        <div
          className={styles.authModalOverlay}
          onClick={() => {
            setShowUnsavedModal(false);
            setPendingAction(null);
          }}
        >
          <div className={styles.authModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.authModalHeader}>
              <div className={`${styles.authModalIconBadge} ${styles.authModalIconBadgeAmber}`}>
                <AlertTriangle size={22} />
              </div>
              <div className={styles.authModalTitleGroup}>
                <h3 className={styles.authModalTitle}>Perubahan Belum Disimpan!</h3>
                <p className={styles.authModalSubtitle}>
                  Anda memiliki data target budgeting tahun <strong>{year}</strong> yang baru saja diubah namun belum disimpan ke server.
                </p>
              </div>
            </div>

            <div className={styles.authModalBody}>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Apakah Anda ingin menyimpan perubahan tersebut sekarang sebelum berpindah halaman/tampilan?
              </p>
            </div>

            <div className={styles.authModalFooterStacked}>
              <button
                type="button"
                className={styles.modalBtnConfirm}
                onClick={() => {
                  setShowUnsavedModal(false);
                  setShowPasswordModal(true);
                }}
              >
                <Save size={15} />
                <span>Simpan & Lanjutkan</span>
              </button>

              <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
                <button
                  type="button"
                  className={styles.modalBtnDiscard}
                  onClick={handleDiscardChanges}
                  style={{ flex: 1 }}
                >
                  <RotateCcw size={14} />
                  <span>Buang Perubahan</span>
                </button>

                <button
                  type="button"
                  className={styles.modalBtnCancel}
                  onClick={() => {
                    setShowUnsavedModal(false);
                    setPendingAction(null);
                  }}
                  style={{ flex: 1 }}
                >
                  <span>Batal (Tetap di Sini)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 2: ADMIN PASSWORD AUTHENTICATION MODAL
          ═════════════════════════════════════════════════════════════════════ */}
      {showPasswordModal && (
        <div
          className={styles.authModalOverlay}
          onClick={() => setShowPasswordModal(false)}
        >
          <div className={styles.authModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.authModalHeader}>
              <div className={`${styles.authModalIconBadge} ${styles.authModalIconBadgeGreen}`}>
                <ShieldCheck size={24} />
              </div>
              <div className={styles.authModalTitleGroup}>
                <h3 className={styles.authModalTitle}>Otorisasi Sandi Admin</h3>
                <p className={styles.authModalSubtitle}>
                  Menyimpan perubahan master target budgeting tahun <strong>{year}</strong> memerlukan otorisasi password admin/supervisor.
                </p>
              </div>
            </div>

            <div className={styles.authModalBody}>
              <div className={styles.passwordInputBox}>
                <input
                  ref={passwordInputRef}
                  type={showPasswordText ? "text" : "password"}
                  placeholder="Masukkan password admin..."
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleVerifyAndSave();
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.passwordToggleBtn}
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  title={showPasswordText ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {passwordError && (
                <p className={styles.passwordErrorText}>{passwordError}</p>
              )}

              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
                Gunakan sandi admin untuk mengonfirmasi penyimpanan ke database Firestore.
              </p>
            </div>

            <div className={styles.authModalFooter}>
              <button
                type="button"
                className={styles.modalBtnCancel}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(null);
                }}
              >
                Batal
              </button>

              <button
                type="button"
                className={styles.modalBtnConfirm}
                onClick={handleVerifyAndSave}
                disabled={saving || !passwordInput.trim()}
              >
                <Lock size={14} />
                <span>{saving ? "Memverifikasi..." : "Verifikasi & Simpan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
