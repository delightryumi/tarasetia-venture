"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import styles from "./superadmin.module.css";

interface BulkAlertModalProps {
  hotels: { hotelCode: string; name: string }[];
  selectedHotelCodes: string[];
  bulkAlertTarget: "selected" | "all";
  setBulkAlertTarget: (v: "selected" | "all") => void;
  bulkAlertMsg: string;
  setBulkAlertMsg: (v: string) => void;
  isSavingAlert: boolean;
  onSend: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const BulkAlertModal: React.FC<BulkAlertModalProps> = ({
  hotels,
  selectedHotelCodes,
  bulkAlertTarget,
  setBulkAlertTarget,
  bulkAlertMsg,
  setBulkAlertMsg,
  isSavingAlert,
  onSend,
  onDeactivate,
  onDelete,
  onClose,
}) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modal} style={{ maxWidth: "520px" }}>
      <header className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>Kelola Alert Kustom secara Massal (Bulk)</h3>
        <button onClick={onClose} className={styles.modalCloseBtn}>&times;</button>
      </header>

      <div className={styles.modalBody}>
        <div className={styles.formGridFull} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Target Selection */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Target Penerima</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: selectedHotelCodes.length > 0 ? "pointer" : "not-allowed", opacity: selectedHotelCodes.length > 0 ? 1 : 0.5 }}>
                <input
                  type="radio"
                  name="bulkTarget"
                  value="selected"
                  checked={bulkAlertTarget === "selected"}
                  disabled={selectedHotelCodes.length === 0}
                  onChange={() => setBulkAlertTarget("selected")}
                  style={{ width: "16px", height: "16px" }}
                />
                <span>Hanya properti terpilih di tabel ({selectedHotelCodes.length} hotel)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="bulkTarget"
                  value="all"
                  checked={bulkAlertTarget === "all"}
                  onChange={() => setBulkAlertTarget("all")}
                  style={{ width: "16px", height: "16px" }}
                />
                <span>Semua properti terdaftar ({hotels.length} hotel)</span>
              </label>
            </div>
          </div>

          {/* Message Input */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Pesan Peringatan Kustom</label>
            <textarea
              placeholder="Contoh: Tagihan langganan Anda jatuh tempo dalam 2 hari. Segera lakukan pembayaran untuk mencegah penangguhan layanan."
              value={bulkAlertMsg}
              onChange={(e) => setBulkAlertMsg(e.target.value)}
              className={styles.formTextarea}
              style={{ minHeight: "120px" }}
            />
            <p style={{ fontSize: "11px", color: "var(--s-muted)" }}>
              Catatan: Mengisi pesan ini dan mengklik &quot;Kirim Alert&quot; akan menampilkan banner pemberitahuan kustom di bagian atas dashboard hotel target.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.modalFooter} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
        <div className="flex gap-2">
          <button type="button" onClick={onDelete} className={styles.btnDanger} disabled={isSavingAlert} style={{ height: "38px", fontSize: "13px", padding: "0 16px" }}>
            Hapus Alert
          </button>
          <button type="button" onClick={onDeactivate} className={styles.btnSecondary} disabled={isSavingAlert} style={{ height: "38px", fontSize: "13px", padding: "0 16px", color: "#d97706", borderColor: "rgba(217, 119, 6, 0.2)" }}>
            Matikan Alert
          </button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={styles.btnSecondary} style={{ height: "38px", fontSize: "13px", padding: "0 16px" }}>
            Batal
          </button>
          <button type="button" onClick={onSend} className={styles.btnPrimary} style={{ height: "38px", fontSize: "13px", padding: "0 16px" }} disabled={isSavingAlert}>
            {isSavingAlert ? "Memproses..." : "Kirim Alert"}
          </button>
        </div>
      </div>
    </div>
  </div>
);
