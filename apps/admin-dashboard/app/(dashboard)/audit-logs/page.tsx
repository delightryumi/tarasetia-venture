"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { isUserSuperadmin } from "@/lib/permissionCheck";
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Download, 
  Filter, 
  Eye, 
  X, 
  Copy, 
  Check, 
  AlertTriangle, 
  FileText, 
  Lock,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { AuditLogEntry, AuditCategory } from "@/lib/auditLogger";
import styles from "./AuditLogs.module.css";

const CATEGORIES: { label: string; value: string }[] = [
  { label: "Semua Kategori", value: "ALL" },
  { label: "Reservasi", value: "RESERVATIONS" },
  { label: "POS Kasir", value: "POS" },
  { label: "Tarif & Kamar", value: "RATES" },
  { label: "Keamanan (2FA/Auth)", value: "SECURITY" },
  { label: "Pengguna & Hak Akses", value: "USERS" },
];

export default function AuditLogsPage() {
  const { user, activeHotelCode, hotelsList } = useAuth();
  const isSuperadmin = isUserSuperadmin(user);
  const userRole = (user?.role || "").toLowerCase();
  const canAccess = isSuperadmin || userRole === "admin" || userRole === "owner" || userRole === "general manager" || userRole === "gm";

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<string>(activeHotelCode || "0");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [activeLog, setActiveLog] = useState<AuditLogEntry | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Sync hotel code when switching in header
  useEffect(() => {
    if (activeHotelCode && (!selectedHotel || selectedHotel === "0")) {
      setSelectedHotel(activeHotelCode);
    }
  }, [activeHotelCode, selectedHotel]);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const targetHotel = isSuperadmin ? (selectedHotel || "all") : (activeHotelCode || "0");
      const url = new URL("/api/audit-logs", window.location.origin);
      if (targetHotel && targetHotel !== "all") {
        url.searchParams.set("hotelCode", targetHotel);
      } else {
        url.searchParams.set("hotelCode", "all");
      }
      if (categoryFilter !== "ALL") {
        url.searchParams.set("category", categoryFilter);
      }
      if (user?.email) {
        url.searchParams.set("userEmail", user.email);
      }
      url.searchParams.set("limit", "150");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat audit log.");
      }
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error("Fetch audit logs error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat memuat data audit log.");
    } finally {
      setLoading(false);
    }
  }, [canAccess, isSuperadmin, selectedHotel, activeHotelCode, categoryFilter, user?.email]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date().getTime();
      result = result.filter((item) => {
        if (!item.createdAt) return true;
        const itemTime = new Date(item.createdAt).getTime();
        const diffHours = (now - itemTime) / (1000 * 60 * 60);
        if (timeFilter === "today") return diffHours <= 24;
        if (timeFilter === "7d") return diffHours <= 24 * 7;
        if (timeFilter === "30d") return diffHours <= 24 * 30;
        return true;
      });
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        return (
          (item.action || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.actor?.name || "").toLowerCase().includes(q) ||
          (item.actor?.email || "").toLowerCase().includes(q) ||
          (item.targetId || "").toLowerCase().includes(q) ||
          (item.targetName || "").toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [logs, timeFilter, searchQuery]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const voidsAndCancels = filteredLogs.filter((l) => 
      l.action?.includes("VOID") || l.action?.includes("CANCEL")
    ).length;
    const rateChanges = filteredLogs.filter((l) => 
      l.category === "RATES" || l.category === "INVENTORY"
    ).length;
    const securityEvents = filteredLogs.filter((l) => 
      l.category === "SECURITY" || l.category === "USERS"
    ).length;
    return { total, voidsAndCancels, rateChanges, securityEvents };
  }, [filteredLogs]);

  // Export to CSV
  const handleExportCsv = () => {
    if (!filteredLogs.length) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }
    const headers = ["Waktu", "Hotel", "Aktor", "Email", "Role", "Kategori", "Tindakan", "Deskripsi", "Target ID"];
    const rows = filteredLogs.map((l) => [
      l.createdAt ? new Date(l.createdAt).toLocaleString("id-ID") : "",
      l.hotelCode || "",
      `"${(l.actor?.name || "").replace(/"/g, '""')}"`,
      `"${(l.actor?.email || "").replace(/"/g, '""')}"`,
      l.actor?.role || "",
      l.category || "",
      l.action || "",
      `"${(l.description || "").replace(/"/g, '""')}"`,
      l.targetId || "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tara-audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("File CSV berhasil diunduh.");
  };

  // Copy full JSON payload in inspector
  const handleCopyPayload = () => {
    if (!activeLog) return;
    navigator.clipboard.writeText(JSON.stringify(activeLog, null, 2));
    setCopiedPayload(true);
    toast.info("Detail payload disalin ke clipboard.");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Category badge styling helper
  const getCategoryClass = (cat: AuditCategory | string) => {
    switch (cat) {
      case "SECURITY":
        return `${styles.categoryPill} ${styles.catSecurity}`;
      case "RESERVATIONS":
        return `${styles.categoryPill} ${styles.catReservations}`;
      case "POS":
        return `${styles.categoryPill} ${styles.catPos}`;
      case "RATES":
      case "INVENTORY":
        return `${styles.categoryPill} ${styles.catRates}`;
      case "USERS":
        return `${styles.categoryPill} ${styles.catUsers}`;
      default:
        return `${styles.categoryPill} ${styles.catDefault}`;
    }
  };

  // Unauthorized view for non-admin staff
  if (!canAccess) {
    return (
      <div className={styles.stateContainer} style={{ minHeight: "70vh" }}>
        <div className={styles.metricCard} style={{ maxWidth: "26rem", textAlign: "center", padding: "2rem" }}>
          <div className={styles.modalHeaderIconBox} style={{ margin: "0 auto 1rem", backgroundColor: "#ffe4e6", color: "#e11d48" }}>
            <Lock size={24} />
          </div>
          <h2 className={styles.modalTitle} style={{ marginBottom: "0.5rem" }}>
            Akses Terbatas: Audit Log
          </h2>
          <p className={styles.stateText} style={{ margin: "0 auto 1.5rem" }}>
            Halaman Audit Log & Security Ledger dilindungi secara ketat dan hanya dapat diakses oleh peran Superadmin, Admin, atau Owner properti.
          </p>
          <button
            onClick={() => window.history.back()}
            className={styles.btnPrimary}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Kembali ke Menu Utama
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleCluster}>
          <div className={styles.badgePill}>
            <span className={styles.governanceBadge}>
              Enterprise Governance
            </span>
            <span className={styles.soc2Text}>SOC-2 & ISO 27001 Ready</span>
          </div>
          <h1 className={styles.pageTitle}>
            Audit Log Global & Security Ledger
          </h1>
          <p className={styles.pageSubtitle}>
            Pencatatan riwayat setiap void transaksi, pembatalan reservasi, perubahan harga kamar, dan aktivitas keamanan sistem.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className={styles.btnSecondary}
            title="Muat ulang audit log"
          >
            <RefreshCw className={loading ? "animate-spin text-blue-600" : ""} size={16} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={loading || !filteredLogs.length}
            className={styles.btnPrimary}
          >
            <Download size={16} />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Aktivitas</span>
          <div className={styles.metricValue}>{stats.total}</div>
          <p className={styles.metricSubtext}>Tercatat dalam rentang aktif</p>
        </div>

        <div className={styles.metricCard}>
          <span className={`${styles.metricLabel} ${styles.metricLabelDanger}`}>Void & Pembatalan</span>
          <div className={`${styles.metricValue} ${styles.metricValueDanger}`}>{stats.voidsAndCancels}</div>
          <p className={styles.metricSubtext}>Tindakan berisiko tinggi</p>
        </div>

        <div className={styles.metricCard}>
          <span className={`${styles.metricLabel} ${styles.metricLabelWarning}`}>Perubahan Tarif</span>
          <div className={`${styles.metricValue} ${styles.metricValueWarning}`}>{stats.rateChanges}</div>
          <p className={styles.metricSubtext}>Rate plan & ketersediaan</p>
        </div>

        <div className={styles.metricCard}>
          <span className={`${styles.metricLabel} ${styles.metricLabelSuccess}`}>Event Keamanan</span>
          <div className={`${styles.metricValue} ${styles.metricValueSuccess}`}>{stats.securityEvents}</div>
          <p className={styles.metricSubtext}>2FA, login & otorisasi akun</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarRow}>
          {/* Search bar */}
          <div className={styles.searchBoxContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Cari user, email, booking ID, atau order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterControlsGroup}>
            {/* Property select (superadmin only) */}
            {isSuperadmin && hotelsList && hotelsList.length > 0 && (
              <div className={styles.selectWrapper}>
                <Building2 className={styles.selectIcon} />
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className={styles.selectControl}
                >
                  <option value="all">Semua Properti (Global)</option>
                  {hotelsList.map((h: any, idx: number) => {
                    const code = h.hotelCode || h.code || h.id || `hotel-${idx}`;
                    return (
                      <option key={code} value={code}>
                        {h.name ? `${h.name} (${code})` : `Hotel #${code}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Category Select */}
            <div className={styles.selectWrapper}>
              <Filter className={styles.selectIcon} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.selectControl}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Filter Tabs */}
            <div className={styles.segmentedButtonGroup}>
              {(["today", "7d", "30d", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`${styles.segmentBtn} ${timeFilter === t ? styles.segmentBtnActive : ""}`}
                >
                  {t === "today" ? "Hari Ini" : t === "7d" ? "7 Hari" : t === "30d" ? "30 Hari" : "Semua"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.stateContainer}>
            <RefreshCw className="animate-spin text-blue-600" size={32} />
            <p className={styles.stateTitle}>Memuat Data Audit Log...</p>
          </div>
        ) : errorMsg ? (
          <div className={styles.stateContainer}>
            <AlertTriangle className="text-rose-500" size={36} />
            <p className={styles.stateTitle} style={{ color: "#e11d48" }}>{errorMsg}</p>
            <button
              onClick={fetchLogs}
              className={styles.btnSecondary}
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.stateContainer}>
            <ShieldCheck className={styles.stateIcon} />
            <h3 className={styles.stateTitle}>Belum Ada Catatan Audit Log</h3>
            <p className={styles.stateText}>
              Tidak ditemukan catatan aktivitas yang cocok dengan parameter filter saat ini.
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.thCell}>Waktu</th>
                  <th className={styles.thCell}>Aktor / User</th>
                  <th className={styles.thCell}>Kategori</th>
                  <th className={styles.thCell}>Tindakan</th>
                  <th className={styles.thCell}>Deskripsi Aktivitas</th>
                  <th className={styles.thCell}>Target ID</th>
                  <th className={`${styles.thCell} ${styles.thCenter}`}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr 
                    key={log.id || idx}
                    className={styles.tableRow}
                  >
                    {/* Timestamp */}
                    <td className={styles.tdCell}>
                      <div className={styles.timeDate}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </div>
                      <div className={styles.timeClock}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-"}
                      </div>
                    </td>

                    {/* Actor */}
                    <td className={styles.tdCell}>
                      <div className={styles.actorName}>
                        {log.actor?.name || "System"}
                      </div>
                      <div className={styles.actorEmail}>
                        {log.actor?.email || "-"}
                      </div>
                      {log.actor?.role && (
                        <span className={styles.roleBadge}>
                          {log.actor.role}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className={styles.tdCell}>
                      <span className={getCategoryClass(log.category)}>
                        {log.category}
                      </span>
                    </td>

                    {/* Action */}
                    <td className={styles.tdCell}>
                      <span className={styles.actionCode}>
                        {log.action}
                      </span>
                    </td>

                    {/* Description */}
                    <td className={styles.tdCell}>
                      <p className={styles.descriptionText}>
                        {log.description}
                      </p>
                    </td>

                    {/* Target ID */}
                    <td className={styles.tdCell}>
                      <span className={styles.targetIdText}>
                        {log.targetId || "-"}
                      </span>
                    </td>

                    {/* Detail Inspector Trigger */}
                    <td className={`${styles.tdCell} ${styles.tdCenter}`}>
                      <button
                        onClick={() => setActiveLog(log)}
                        className={styles.btnInspect}
                        title="Lihat detail audit"
                        aria-label="Lihat detail audit"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspector Modal */}
      {activeLog && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveLog(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderCluster}>
                <div className={styles.modalHeaderIconBox}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>
                    Inspeksi Audit Log
                  </h3>
                  <p className={styles.modalSubId}>
                    ID: {activeLog.id || "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className={styles.btnClose}
                aria-label="Tutup inspeksi"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              <div className={styles.modalMetaGrid}>
                <div>
                  <span className={styles.metaLabel}>Waktu Eksekusi</span>
                  <span className={styles.metaValue}>
                    {activeLog.createdAt ? new Date(activeLog.createdAt).toLocaleString("id-ID") : "-"}
                  </span>
                </div>

                <div>
                  <span className={styles.metaLabel}>Properti (Hotel Code)</span>
                  <span className={styles.metaValue} style={{ fontFamily: "monospace" }}>
                    {activeLog.hotelCode || activeHotelCode || "-"}
                  </span>
                </div>

                <div>
                  <span className={styles.metaLabel}>Aktor Pelaksana</span>
                  <span className={styles.metaValue}>
                    {activeLog.actor?.name} ({activeLog.actor?.role || "user"})
                  </span>
                </div>

                <div>
                  <span className={styles.metaLabel}>Email Aktor</span>
                  <span className={styles.metaValue} style={{ fontFamily: "monospace" }}>
                    {activeLog.actor?.email || "-"}
                  </span>
                </div>
              </div>

              <div>
                <span className={styles.metaLabel}>Deskripsi Lengkap</span>
                <div className={styles.metricCard} style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                  {activeLog.description}
                </div>
              </div>

              {/* Diff (Before vs After) */}
              {activeLog.diff && (
                <div>
                  <span className={styles.metaLabel}>Perubahan Nilai (Diff)</span>
                  <div className={styles.diffGrid}>
                    <div className={styles.diffBeforeBox}>
                      <span className={styles.diffBeforeLabel}>Sebelum (Before)</span>
                      <pre className={`${styles.diffPre} ${styles.diffBeforePre}`}>
                        {JSON.stringify(activeLog.diff.before, null, 2) || "null"}
                      </pre>
                    </div>

                    <div className={styles.diffAfterBox}>
                      <span className={styles.diffAfterLabel}>Sesudah (After)</span>
                      <pre className={`${styles.diffPre} ${styles.diffAfterPre}`}>
                        {JSON.stringify(activeLog.diff.after, null, 2) || "null"}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {activeLog.metadata && Object.keys(activeLog.metadata).length > 0 && (
                <div>
                  <span className={styles.metaLabel}>Metadata Kontekstual</span>
                  <pre className={styles.jsonBox}>
                    {JSON.stringify(activeLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                onClick={handleCopyPayload}
                className={styles.btnSecondary}
              >
                {copiedPayload ? <Check className="text-emerald-500" size={14} /> : <Copy size={14} />}
                <span>{copiedPayload ? "Tersalin" : "Salin Payload JSON"}</span>
              </button>

              <button
                onClick={() => setActiveLog(null)}
                className={styles.btnPrimary}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
