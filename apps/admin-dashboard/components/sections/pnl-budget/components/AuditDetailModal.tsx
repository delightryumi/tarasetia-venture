"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Filter, Layers, Receipt, Calendar, Building, Info, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatIDR } from "@/lib/pnl-utils";
import { ActualBreakdownItem } from "../hooks/usePNLBudget";
import styles from "../pnl-budget.module.css";

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  title: string;
  period: string;
  actualAmount: number;
  budgetAmount: number;
  items: ActualBreakdownItem[];
  isCostOrExpense?: boolean;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  isOpen,
  onClose,
  code,
  title,
  period,
  actualAmount,
  budgetAmount,
  items = [],
  isCostOrExpense = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        (item.docNum || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.department || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource =
        sourceFilter === "all" || item.source.toLowerCase() === sourceFilter.toLowerCase();

      return matchesSearch && matchesSource;
    });
  }, [items, searchTerm, sourceFilter]);

  const filteredTotal = useMemo(() => {
    return filteredItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [filteredItems]);

  const variance = actualAmount - budgetAmount;
  const variancePct = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;

  if (!isOpen) return null;

  const getSourceBadgeStyle = (source: string) => {
    switch (source?.toUpperCase()) {
      case "SR":
        return { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0", label: "Store Requisition (SR)" };
      case "DML":
        return { bg: "#fffbeb", color: "#92400e", border: "#fde68a", label: "Daily Market List (DML)" };
      case "PR":
        return { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", label: "Purchase Requisition (PR)" };
      case "PAYROLL":
        return { bg: "#f5f3ff", color: "#5b21b6", border: "#ddd6fe", label: "Payroll Karyawan" };
      default:
        return { bg: "#f1f5f9", color: "#334155", border: "#cbd5e1", label: source || "Expense" };
    }
  };

  return (
    <AnimatePresence>
      <div className={styles.modalBackdrop} onClick={onClose}>
        <motion.div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderTitleGroup}>
              <div className={styles.modalCodeBadge}>{code}</div>
              <div>
                <h3 className={styles.modalTitle}>{title}</h3>
                <p className={styles.modalSubtitle}>
                  Audit Rincian Transaksi • Periode: <strong>{period}</strong>
                </p>
              </div>
            </div>
            <button className={styles.modalCloseBtn} onClick={onClose} title="Tutup">
              <X size={20} />
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className={styles.modalKpiRow}>
            <div className={styles.modalKpiCard}>
              <span className={styles.modalKpiLabel}>Realisasi (Aktual)</span>
              <span className={styles.modalKpiValue} style={{ color: "#2563eb" }}>
                {formatIDR(actualAmount)}
              </span>
            </div>
            <div className={styles.modalKpiCard}>
              <span className={styles.modalKpiLabel}>Anggaran (Budget)</span>
              <span className={styles.modalKpiValue} style={{ color: "#475569" }}>
                {formatIDR(budgetAmount)}
              </span>
            </div>
            <div className={styles.modalKpiCard}>
              <span className={styles.modalKpiLabel}>Selisih (Varians)</span>
              <span
                className={styles.modalKpiValue}
                style={{
                  color:
                    variance === 0
                      ? "#64748b"
                      : isCostOrExpense
                      ? variance > 0
                        ? "#dc2626"
                        : "#16a34a"
                      : variance >= 0
                      ? "#16a34a"
                      : "#dc2626",
                }}
              >
                {variance > 0 ? `+${formatIDR(variance)}` : formatIDR(variance)}
                <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4 }}>
                  ({budgetAmount > 0 ? `${variancePct.toFixed(1)}%` : "0.0%"})
                </span>
              </span>
            </div>
            <div className={styles.modalKpiCard}>
              <span className={styles.modalKpiLabel}>Total Dokumen</span>
              <span className={styles.modalKpiValue}>{items.length} Transaksi</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className={styles.modalFilterBar}>
            <div className={styles.modalSearchBox}>
              <Search size={16} className={styles.modalSearchIcon} />
              <input
                type="text"
                placeholder="Cari no. dokumen, keterangan, departemen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.modalSearchInput}
              />
              {searchTerm && (
                <button
                  className={styles.modalClearSearch}
                  onClick={() => setSearchTerm("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={styles.modalFilterPills}>
              <button
                className={`${styles.filterPill} ${sourceFilter === "all" ? styles.filterPillActive : ""}`}
                onClick={() => setSourceFilter("all")}
              >
                Semua ({items.length})
              </button>
              {["SR", "DML", "PR", "Payroll", "Expense"].map((src) => {
                const count = items.filter((i) => i.source.toLowerCase() === src.toLowerCase()).length;
                if (count === 0) return null;
                return (
                  <button
                    key={src}
                    className={`${styles.filterPill} ${sourceFilter.toLowerCase() === src.toLowerCase() ? styles.filterPillActive : ""}`}
                    onClick={() => setSourceFilter(src)}
                  >
                    {src} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items Table */}
          <div className={styles.modalTableContainer}>
            {filteredItems.length === 0 ? (
              <div className={styles.modalEmptyState}>
                <Info size={36} color="#94a3b8" />
                <p className={styles.modalEmptyText}>
                  {items.length === 0
                    ? "Belum ada transaksi pengeluaran/biaya yang tercatat pada pos akun ini untuk periode terpilih."
                    : "Tidak ada transaksi yang cocok dengan pencarian filter Anda."}
                </p>
              </div>
            ) : (
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: "center" }}>#</th>
                    <th style={{ width: 95 }}>Tanggal</th>
                    <th style={{ width: 130 }}>Sumber</th>
                    <th style={{ width: 150 }}>No. Dokumen</th>
                    <th style={{ width: 140 }}>Departemen</th>
                    <th>Deskripsi / Item</th>
                    <th style={{ width: 120, textAlign: "right" }}>Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => {
                    const badge = getSourceBadgeStyle(item.source);
                    return (
                      <tr key={item.id || idx}>
                        <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 11 }}>{idx + 1}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 11.5 }}>
                          {typeof item.date === "string" ? item.date.slice(0, 10) : "-"}
                        </td>
                        <td>
                          <span
                            className={styles.modalSourceBadge}
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              borderColor: badge.border,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>
                          {item.docNum || "-"}
                        </td>
                        <td>
                          <span className={styles.modalDeptTag}>{item.department || "-"}</span>
                        </td>
                        <td style={{ maxWidth: 280, whiteSpace: "normal", wordBreak: "break-word" }}>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.name || "-"}</div>
                          {item.description && item.description !== item.name && (
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 800,
                            color: "#0f172a",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatIDR(item.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <div className={styles.modalFooterInfo}>
              Menampilkan <strong>{filteredItems.length}</strong> dari <strong>{items.length}</strong> transaksi •
              Subtotal Terfilter: <strong style={{ color: "#2563eb", marginLeft: 4 }}>{formatIDR(filteredTotal)}</strong>
            </div>
            <button className={styles.modalPrimaryBtn} onClick={onClose}>
              Tutup Rincian
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
