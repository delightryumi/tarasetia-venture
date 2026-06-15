"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import styles from "./superadmin.module.css";
import { HotelMasterDoc } from "./types";

interface DeleteConfirmModalProps {
  hotelToDelete: HotelMasterDoc;
  deleteConfirmInput: string;
  setDeleteConfirmInput: (v: string) => void;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  hotelToDelete,
  deleteConfirmInput,
  setDeleteConfirmInput,
  isDeleting,
  onConfirm,
  onClose,
}) => {
  const isConfirmed = deleteConfirmInput === hotelToDelete.hotelCode;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: "480px" }}>
        <header className={styles.modalHeader} style={{ backgroundColor: "#fef2f2" }}>
          <h3 className={styles.modalTitle} style={{ color: "#991b1b", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={20} />
            Tindakan Sangat Destruktif!
          </h3>
          <button onClick={onClose} className={styles.modalCloseBtn}>&times;</button>
        </header>

        <div className={styles.modalBody} style={{ padding: "24px" }}>
          <p className="text-sm font-semibold text-neutral-800 dark:text-white mb-2">
            Apakah Anda benar-benar yakin ingin menghapus hotel secara permanen?
          </p>

          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl p-4 mb-4 text-xs text-rose-800 dark:text-rose-450 space-y-1">
            <p className="font-bold">Hotel yang akan dihapus:</p>
            <p className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
              [{hotelToDelete.hotelCode}] {hotelToDelete.name}
            </p>
            <p className="mt-2 text-rose-700 dark:text-rose-400">
              Tindakan ini akan menghapus secara permanen seluruh database transaksi operasional, POS orders, data user admin, stok barang, tipe kamar, serta konfigurasi landing page dari database Firestore. Tindakan ini <strong>TIDAK DAPAT DIBATALKAN</strong>.
            </p>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel} style={{ textTransform: "none", fontSize: "11px", fontWeight: "bold", color: "#991b1b" }}>
              Ketik kode hotel <span className="font-mono font-bold">&quot;{hotelToDelete.hotelCode}&quot;</span> untuk mengonfirmasi:
            </label>
            <input
              type="text"
              placeholder="Masukkan kode hotel di sini"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              disabled={isDeleting}
              className={styles.formInput}
              style={{ borderColor: isConfirmed ? "#22c55e" : "var(--s-hairline)" }}
            />
          </div>
        </div>

        <div className={styles.modalFooter} style={{ padding: "16px 24px" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={styles.btnSecondary}
            style={{ height: "38px" }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting || !isConfirmed}
            className={styles.btnPrimary}
            style={{
              height: "38px",
              backgroundColor: isConfirmed ? "#dc2626" : "rgba(220, 38, 38, 0.4)",
              color: "#ffffff",
              cursor: isConfirmed ? "pointer" : "not-allowed",
            }}
          >
            {isDeleting ? "Menghapus Database..." : "Hapus Permanen"}
          </button>
        </div>
      </div>
    </div>
  );
};
