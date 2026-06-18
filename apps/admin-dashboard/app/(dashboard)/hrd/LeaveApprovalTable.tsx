"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import type { LeaveRequest } from "./types";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
}

const TYPE_LABEL: Record<string, string> = {
  izin: "Izin",
  sakit: "Sakit",
  cuti: "Cuti",
};

const TYPE_BADGE: Record<string, string> = {
  izin: styles.badgeIzin,
  sakit: styles.badgeSakit,
  cuti: styles.badgeCuti,
};

export function LeaveApprovalTable({ hotelCode }: Props) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelCode) return;
    const colRef = collection(db, `hotels/${hotelCode}/leave_requests`);
    const q = query(colRef, where("status", "==", filter), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaveRequest)));
      setLoading(false);
    });
    return () => unsub();
  }, [hotelCode, filter]);

  const handleReview = async (req: LeaveRequest, status: "approved" | "rejected") => {
    setProcessing(req.id);
    try {
      await fetch("/api/leave", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: req.id,
          hotelCode,
          status,
          reviewedBy: (user as any)?.name || user?.email || "HRD",
        }),
      });
    } catch (err) {
      alert("Gagal memproses pengajuan. Coba lagi.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className={styles.loading}>Memuat pengajuan...</div>;

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.cardTitle}>Pengajuan Karyawan</p>
          <div style={{ display: "flex", gap: 4 }}>
            {(["pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`${styles.btnSecondary} ${filter === f ? styles.btnPrimary : ""}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
              >
                {f === "pending" ? "Pending" : f === "approved" ? "Disetujui" : "Ditolak"}
              </button>
            ))}
          </div>
        </div>

        {requests.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📋</div>
            <p className={styles.emptyStateText}>
              {filter === "pending" ? "Tidak ada pengajuan pending saat ini." : `Tidak ada pengajuan ${filter}.`}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Jenis</th>
                  <th>Tanggal</th>
                  <th>Alasan</th>
                  <th>Surat</th>
                  {filter === "pending" && <th>Aksi</th>}
                  {filter !== "pending" && <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 500 }}>{req.staffName}</td>
                    <td>
                      <span className={`${styles.badge} ${TYPE_BADGE[req.type] || ""}`}>
                        {TYPE_LABEL[req.type] || req.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {req.date}{req.dateEnd && req.dateEnd !== req.date ? ` s/d ${req.dateEnd}` : ""}
                    </td>
                    <td style={{ maxWidth: 200, fontSize: 12, color: "var(--s-muted)" }}>{req.reason}</td>
                    <td>
                      {req.attachmentUrl ? (
                        <button
                          onClick={() => setSelectedDoc(req.attachmentUrl)}
                          style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                        >
                          Lihat Surat
                        </button>
                      ) : "—"}
                    </td>
                    {filter === "pending" && (
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className={styles.btnApprove}
                            disabled={processing === req.id}
                            onClick={() => handleReview(req, "approved")}
                          >
                            ✅ Setuju
                          </button>
                          <button
                            className={styles.btnReject}
                            disabled={processing === req.id}
                            onClick={() => handleReview(req, "rejected")}
                          >
                            ❌ Tolak
                          </button>
                        </div>
                      </td>
                    )}
                    {filter !== "pending" && (
                      <td>
                        <span className={`${styles.badge} ${filter === "approved" ? styles.badgeHadir : styles.badgeAlpa}`}>
                          {filter === "approved" ? "Disetujui" : "Ditolak"}
                        </span>
                        <div style={{ fontSize: 11, color: "var(--s-muted)", marginTop: 2 }}>{req.reviewedBy}</div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Viewer Inline Card */}
      {selectedDoc && (
        <div className={styles.card} style={{ marginTop: 20, padding: 20, maxWidth: "480px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid var(--s-hairline)", paddingBottom: 8 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "var(--s-ink)" }}>Lampiran Terlampir</p>
            <button 
              style={{ background: "none", border: "none", fontSize: 12, cursor: "pointer", color: "var(--s-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontWeight: 600 }} 
              onClick={() => setSelectedDoc(null)}
            >
              ✕ Tutup
            </button>
          </div>
          <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(120, 128, 105, 0.05)", border: "1px solid var(--s-hairline)", borderRadius: 8, padding: 12 }}>
            {(() => {
              const cleanUrl = selectedDoc.split("?")[0];
              const isPdf = cleanUrl.toLowerCase().endsWith(".pdf");
              if (isPdf) {
                return <iframe src={selectedDoc} style={{ width: "100%", height: "400px", border: "none", borderRadius: 6 }} />;
              }
              return <img src={selectedDoc} alt="Lampiran Pengajuan" style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain", display: "block", borderRadius: 6 }} />;
            })()}
          </div>
        </div>
      )}
    </>
  );
}
