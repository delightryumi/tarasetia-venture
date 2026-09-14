"use client";

import React from "react";
import { Building2, Plus, ShieldAlert, CheckCircle } from "lucide-react";
import styles from "./SuperadminPageHeader.module.css";

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
          <Building2 size={20} className={styles.titleIcon} />
          Superadmin CRS Portal
        </h1>
        <p className={styles.subtitle}>
          Registry terpusat properti hotel partner, pengawasan billing, dan aktivasi sistem PMS &amp; OTA.
        </p>
      </div>
      <div className={styles.headerRight}>
        <button onClick={onAddHotel} className={styles.btnPrimary}>
          <Plus size={15} />
          <span>Registrasi Partner Baru</span>
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
