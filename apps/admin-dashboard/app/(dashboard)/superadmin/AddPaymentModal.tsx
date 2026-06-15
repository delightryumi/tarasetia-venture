"use client";

import React from "react";
import styles from "./superadmin.module.css";
import { HotelMasterDoc } from "./types";

interface AddPaymentModalProps {
  hotel: HotelMasterDoc;
  paymentAmount: string; setPaymentAmount: (v: string) => void;
  paymentStatus: string; setPaymentStatus: (v: any) => void;
  paymentPlan: string; setPaymentPlan: (v: any) => void;
  paymentCycle: string; setPaymentCycle: (v: any) => void;
  paymentPeriodStart: string; setPaymentPeriodStart: (v: string) => void;
  paymentPeriodEnd: string; setPaymentPeriodEnd: (v: string) => void;
  isSavingPayment: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  hotel,
  paymentAmount, setPaymentAmount,
  paymentStatus, setPaymentStatus,
  paymentPlan, setPaymentPlan,
  paymentCycle, setPaymentCycle,
  paymentPeriodStart, setPaymentPeriodStart,
  paymentPeriodEnd, setPaymentPeriodEnd,
  isSavingPayment,
  onSubmit,
  onClose,
}) => (
  <div className={styles.modalOverlay} style={{ zIndex: 600 }}>
    <div className={styles.modal} style={{ maxWidth: "540px" }}>
      <header className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>Catat Pembayaran Baru: {hotel.name}</h3>
        <button onClick={onClose} className={styles.modalCloseBtn}>&times;</button>
      </header>

      <form onSubmit={onSubmit} className={styles.modalBody}>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Nominal Pembayaran (Rp)</label>
            <input type="number" required placeholder="misal: 1500000" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className={styles.formInput} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Status Pembayaran</label>
            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className={styles.formSelect}>
              <option value="paid">Lunas (Paid)</option>
              <option value="unpaid">Belum Lunas (Unpaid)</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Plan Layanan</label>
            <select value={paymentPlan} onChange={e => setPaymentPlan(e.target.value)} className={styles.formSelect}>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Siklus Tagihan</label>
            <select value={paymentCycle} onChange={e => setPaymentCycle(e.target.value)} className={styles.formSelect}>
              <option value="monthly">Bulanan (Monthly)</option>
              <option value="yearly">Tahunan (Yearly)</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Mulai Masa Aktif</label>
            <input type="date" required value={paymentPeriodStart} onChange={e => setPaymentPeriodStart(e.target.value)} className={styles.formInput} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Jatuh Tempo (Akhir Masa Aktif)</label>
            <input type="date" required value={paymentPeriodEnd} onChange={e => setPaymentPeriodEnd(e.target.value)} className={styles.formInput} />
          </div>
        </div>

        <div className={styles.modalFooter} style={{ padding: "16px 0 0 0", borderTop: "1px solid var(--s-hairline)", background: "transparent" }}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>Batal</button>
          <button type="submit" className={styles.btnPrimary} disabled={isSavingPayment}>
            {isSavingPayment ? "Menyimpan..." : "Simpan Pembayaran"}
          </button>
        </div>
      </form>
    </div>
  </div>
);
