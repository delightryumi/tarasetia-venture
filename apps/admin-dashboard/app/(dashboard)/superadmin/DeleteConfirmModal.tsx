"use client";

import React from "react";
import { ShieldAlert, X, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import styles from "./DeleteConfirmModal.module.css";
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
  const isConfirmed = deleteConfirmInput.trim() === hotelToDelete.hotelCode.trim();

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <header className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBadge}>
              <ShieldAlert size={18} strokeWidth={2.2} />
            </div>
            <div className={styles.headerText}>
              <h3 className={styles.title}>Tindakan Sangat Destruktif</h3>
              <p className={styles.subtitle}>Konfirmasi penghapusan permanen hotel</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isDeleting}
            className={styles.closeBtn}
            title="Tutup dialog"
            aria-label="Tutup dialog"
          >
            <X size={16} />
          </button>
        </header>

        {/* Body */}
        <div className={styles.modalBody}>
          <p className={styles.primaryPrompt}>
            Apakah Anda yakin ingin menghapus data hotel ini secara permanen dari server?
          </p>

          {/* Hotel Spec Card */}
          <div className={styles.targetCard}>
            <div className={styles.targetCardTop}>
              <span className={styles.targetCardLabel}>Hotel Target</span>
              <span className={styles.targetCodePill}>Kode: {hotelToDelete.hotelCode}</span>
            </div>
            
            <h4 className={styles.targetHotelName}>
              {hotelToDelete.name}
            </h4>

            <div className={styles.targetWarningRow}>
              <AlertTriangle size={15} className={styles.warningIcon} />
              <span>
                Menghapus seluruh database transaksi, POS orders, inventori kamar, akun kasir, dan integrasi channel. Tindakan ini <strong className={styles.warningHighlight}>TIDAK BISA DIBATALKAN</strong>.
              </span>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className={styles.confirmSection}>
            <div className={styles.confirmLabelRow}>
              <label htmlFor="confirm-code-input" className={styles.confirmLabel}>
                Ketik kode <span className={styles.codeHighlight}>&quot;{hotelToDelete.hotelCode}&quot;</span>:
              </label>
              {isConfirmed && (
                <span className={styles.matchBadge}>
                  <CheckCircle2 size={13} /> Kode cocok
                </span>
              )}
            </div>

            <input
              id="confirm-code-input"
              type="text"
              placeholder={`Ketik ${hotelToDelete.hotelCode} di sini`}
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value.trim())}
              disabled={isDeleting}
              autoFocus
              autoComplete="off"
              className={`${styles.confirmInput} ${isConfirmed ? styles.confirmInputConfirmed : ""}`}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={styles.btnCancel}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting || !isConfirmed}
            className={`${styles.btnDelete} ${isConfirmed && !isDeleting ? styles.btnDeleteConfirmed : styles.btnDeleteDisabled}`}
          >
            {isDeleting ? (
              <>
                <div className={styles.spinner} />
                <span>Menghapus Database...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Hapus Permanen</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
