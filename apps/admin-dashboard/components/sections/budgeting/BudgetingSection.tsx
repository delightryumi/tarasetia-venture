"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building,
  Bed,
  ZoomIn,
  ZoomOut,
  Maximize2,
  History,
  Clock,
} from "lucide-react";
import { useBudgeting } from "./hooks/useBudgeting";
import { BudgetInputTab } from "./components/BudgetInputTab";
import styles from "./budgeting.module.css";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export const BudgetingSection: React.FC = () => {
  const {
    selectedYear,
    setSelectedDate,
    selectedDate,
    hotelName,
    hotelRoomCount,
    loadingBudget,
    savingBudget,
    saveSuccess,
    budgetDoc,
    saveBudgetDoc,
  } = useBudgeting();

  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("crs_budget_zoom");
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
    localStorage.setItem("crs_budget_zoom", String(clamped));
  };

  const changeYear = (delta: number) => {
    const nextYr = selectedYear + delta;
    setSelectedDate(`${nextYr}-01-01`);
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className={styles.container}
    >
      {/* Header */}
      <motion.header variants={rise} className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeCategory}>
            <div className={styles.badgeIcon}>
              <FileSpreadsheet size={15} />
            </div>
            <span>Accounting & Planning</span>
          </div>
          <h1 className={styles.title}>
            All-In <span className={styles.titleAccent}>Hotel Budgeting</span>
          </h1>
          <p className={styles.subTitle} style={{ marginTop: "4px" }}>
            {hotelName} • {hotelRoomCount} Kamar Fisik (CPanel) • Target Revenue, COGS, Expenses & GOP
          </p>

          {/* Audit Log Badge */}
          {budgetDoc?.lastUpdatedBy && (
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "6px",
                padding: "4px 12px",
                borderRadius: "8px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                width: "fit-content",
                textAlign: "left",
              }}
              onClick={() => setShowAuditModal(true)}
              title="Klik untuk melihat riwayat audit log perubahan budget"
            >
              <History size={13} style={{ color: "#059669" }} />
              <span>
                Terakhir diubah: <strong>{budgetDoc.lastUpdatedBy}</strong> ({budgetDoc.lastUpdatedByRole || "Staff"})
                {budgetDoc.updatedAt && (
                  <span style={{ color: "#047857", marginLeft: "4px" }}>
                    • {new Date(budgetDoc.updatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                )}
              </span>
              <span style={{ fontSize: "10px", textDecoration: "underline", marginLeft: "4px", color: "#059669", fontWeight: 700 }}>
                Lihat Log ({budgetDoc.auditLogs?.length || 1})
              </span>
            </button>
          )}
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
              title="Set ke Fit Screen (85%)"
            >
              Fit
            </button>
          </div>

          {/* Year Selector */}
          <div className={styles.datePickerWrapper}>
            <button
              onClick={() => changeYear(-1)}
              className={styles.iconBtn}
              title="Tahun Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 800, fontSize: "14px", minWidth: "46px", textAlign: "center" }}>
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
        </div>
      </motion.header>

      {/* Main Budget Input View with Zoom Wrapper */}
      <div style={{ zoom: zoomLevel, width: "100%" }}>
        <BudgetInputTab
          year={selectedYear}
          budgetDoc={budgetDoc}
          hotelRoomCount={hotelRoomCount}
          onSave={saveBudgetDoc}
          saving={savingBudget}
          saveSuccess={saveSuccess}
        />
      </div>

      {/* Audit Log History Modal */}
      {showAuditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowAuditModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              width: "560px",
              maxWidth: "92vw",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <History size={18} color="#059669" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                  Audit Log & Riwayat Perubahan Budget
                </h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  borderRadius: "6px",
                  cursor: "pointer",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#64748b", marginTop: 0, marginBottom: "16px", lineHeight: 1.5 }}>
              Riwayat akun yang menyimpan atau memperbarui data master target budgeting tahun {selectedYear}.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(budgetDoc?.auditLogs && budgetDoc.auditLogs.length > 0) ? (
                budgetDoc.auditLogs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: idx === 0 ? "#f0fdf4" : "#f8fafc",
                      border: `1px solid ${idx === 0 ? "#bbf7d0" : "#e2e8f0"}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "12.5px", color: "#0f172a" }}>
                        {log.userName}{" "}
                        <span style={{ fontWeight: 500, fontSize: "11px", color: "#64748b" }}>
                          ({log.userEmail})
                        </span>
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: idx === 0 ? "#16a34a" : "#64748b" }}>
                        {new Date(log.timestamp).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#334155" }}>
                      {log.action} • Role: <strong style={{ color: "#0f172a" }}>{log.userRole || "Staff"}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                    {budgetDoc?.lastUpdatedBy || "Admin"} ({budgetDoc?.lastUpdatedByRole || "Staff"})
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px" }}>
                    Terakhir disimpan pada: {budgetDoc?.updatedAt ? new Date(budgetDoc.updatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
