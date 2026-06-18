"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, deleteDoc } from "firebase/firestore";
import type { Announcement } from "./types";
import { AnnouncementFormModal } from "./AnnouncementFormModal";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
}

export function AnnouncementSettingCard({ hotelCode }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, `hotels/${hotelCode}/announcements`));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(data);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [hotelCode]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengumuman ini secara permanen?")) return;
    try {
      await deleteDoc(doc(db, `hotels/${hotelCode}/announcements/${id}`));
      fetchAnnouncements();
    } catch (error) {
      alert("Gagal menghapus.");
    }
  };

  return (
    <div className={styles.card} style={{ marginTop: 20 }}>
      <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className={styles.cardTitle}>📢 Pengumuman & Attention Karyawan</p>
        <button className={styles.btnPrimary} onClick={() => { setEditTarget(null); setModalOpen(true); }} style={{ padding: "6px 12px", fontSize: 13 }}>
          + Buat Pengumuman
        </button>
      </div>
      <div className={styles.cardBody}>
        <p style={{ fontSize: 13, color: "var(--s-muted)", marginBottom: 20, lineHeight: 1.5 }}>
          Kelola notifikasi dan pengumuman untuk ditampilkan di portal absensi. Anda bisa mengirim pesan massal atau spesifik ke karyawan tertentu.
        </p>

        {loading ? (
          <div className={styles.loading}>Memuat data...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Judul</th>
                  <th>Tipe</th>
                  <th>Target</th>
                  <th>Dibuat Oleh</th>
                  <th align="right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "20px 0" }}>Belum ada pengumuman.</td>
                  </tr>
                ) : (
                  announcements.map(ann => (
                    <tr key={ann.id}>
                      <td>
                        <span className={styles.badge} style={{ backgroundColor: ann.active ? "#d1fae5" : "#f3f4f6", color: ann.active ? "#065f46" : "#4b5563" }}>
                          {ann.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <p style={{ margin: 0, fontWeight: 500, color: "var(--s-ink)" }}>{ann.title}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--s-muted)", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ann.text}
                        </p>
                      </td>
                      <td>
                        <span className={styles.badge} style={{ 
                          backgroundColor: ann.type === "warning" ? "#fee2e2" : ann.type === "success" ? "#dcfce7" : "#dbeafe",
                          color: ann.type === "warning" ? "#991b1b" : ann.type === "success" ? "#166534" : "#1e40af"
                        }}>
                          {ann.type.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {ann.target === "all" ? "Semua Karyawan" : `${ann.targetStaffIds.length} Karyawan`}
                      </td>
                      <td>
                        <p style={{ margin: 0 }}>{ann.createdBy}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--s-muted)" }}>
                          {new Date(ann.createdAt).toLocaleDateString("id-ID")}
                        </p>
                      </td>
                      <td align="right">
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button className={styles.btnSecondary} onClick={() => { setEditTarget(ann); setModalOpen(true); }} style={{ padding: "4px 8px", fontSize: 12 }}>Edit</button>
                          <button className={styles.btnDanger} onClick={() => handleDelete(ann.id)} style={{ padding: "4px 8px", fontSize: 12 }}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {modalOpen && (
          <AnnouncementFormModal
            hotelCode={hotelCode}
            editTarget={editTarget}
            onClose={() => setModalOpen(false)}
            onSuccess={() => {
              setModalOpen(false);
              fetchAnnouncements();
            }}
          />
        )}
      </div>
    </div>
  );
}
