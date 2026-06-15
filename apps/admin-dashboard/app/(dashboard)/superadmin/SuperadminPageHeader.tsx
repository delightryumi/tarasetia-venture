"use client";

import React from "react";
import { Building2, Plus, ShieldAlert, CheckCircle } from "lucide-react";
import styles from "./superadmin.module.css";

interface SuperadminPageHeaderProps {
  error: string;
  successMsg: string;
  onAddHotel: () => void;
}

export const SuperadminPageHeader: React.FC<SuperadminPageHeaderProps> = ({
  error,
  successMsg,
  onAddHotel,
}) => (
  <>
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.title}>
          <Building2 size={32} />
          Superadmin CRS Portal
        </h1>
        <p className={styles.subtitle}>
          Registry terpusat, pengawasan billing, dan aktivasi sistem hotel.
        </p>
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button onClick={onAddHotel} className={styles.btnPrimary}>
          <Plus size={16} />
          Registrasi Hotel Baru
        </button>
      </div>
    </header>

    {error && (
      <div className={`${styles.alertBox} ${styles.alertBoxError}`}>
        <ShieldAlert size={20} />
        <span>{error}</span>
      </div>
    )}
    {successMsg && (
      <div className={`${styles.alertBox} ${styles.alertBoxSuccess}`}>
        <CheckCircle size={20} />
        <span>{successMsg}</span>
      </div>
    )}
  </>
);
