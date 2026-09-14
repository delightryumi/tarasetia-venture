"use client";

import React from "react";
import { Building2, CheckCircle, ShieldAlert, CreditCard } from "lucide-react";
import styles from "./KpiCards.module.css";

interface RegistryKpiProps {
  totalHotels: number;
  activeHotels: number;
  overdueHotels: number;
}

interface BillingKpiProps {
  totalRevenue: number;
  outstandingAmount: number;
  overdueHotels: number;
}

export const RegistryKpiCards: React.FC<RegistryKpiProps> = ({ totalHotels, activeHotels, overdueHotels }) => (
  <section className={styles.kpiGrid}>
    <div className={styles.kpiCard}>
      <div>
        <div className={styles.kpiLabel}>Total Properti Partner</div>
        <div className={styles.kpiValue}>{totalHotels}</div>
      </div>
      <div className={styles.kpiIcon}><Building2 size={16} /></div>
    </div>
    <div className={`${styles.kpiCard} ${styles.kpiCardActive}`}>
      <div>
        <div className={styles.kpiLabel}>Hotel Aktif</div>
        <div className={styles.kpiValue} style={{ color: "#16a34a" }}>{activeHotels}</div>
      </div>
      <div className={`${styles.kpiIcon} ${styles.kpiIconActive}`}><CheckCircle size={16} /></div>
    </div>
    <div className={`${styles.kpiCard} ${styles.kpiCardOverdue}`}>
      <div>
        <div className={styles.kpiLabel}>Billing Overdue</div>
        <div className={styles.kpiValue} style={{ color: "#dc2626" }}>{overdueHotels}</div>
      </div>
      <div className={`${styles.kpiIcon} ${styles.kpiIconOverdue}`}><ShieldAlert size={16} /></div>
    </div>
  </section>
);

export const BillingKpiCards: React.FC<BillingKpiProps> = ({ totalRevenue, outstandingAmount, overdueHotels }) => (
  <section className={styles.kpiGrid}>
    <div className={`${styles.kpiCard} ${styles.kpiCardRevenue}`}>
      <div>
        <div className={styles.kpiLabel}>Total Pendapatan Terbayar</div>
        <div className={styles.kpiValue} style={{ color: "#16a34a" }}>
          Rp {totalRevenue.toLocaleString("id-ID")}
        </div>
      </div>
      <div className={`${styles.kpiIcon} ${styles.kpiIconActive}`}><CheckCircle size={16} /></div>
    </div>
    <div className={`${styles.kpiCard} ${styles.kpiCardOutstanding}`}>
      <div>
        <div className={styles.kpiLabel}>Piutang Belum Lunas</div>
        <div className={styles.kpiValue} style={{ color: "#d97706" }}>
          Rp {outstandingAmount.toLocaleString("id-ID")}
        </div>
      </div>
      <div className={`${styles.kpiIcon} ${styles.kpiIconOutstanding}`}><CreditCard size={16} /></div>
    </div>
    <div className={`${styles.kpiCard} ${styles.kpiCardOverdue}`}>
      <div>
        <div className={styles.kpiLabel}>Properti Overdue</div>
        <div className={styles.kpiValue} style={{ color: "#dc2626" }}>{overdueHotels}</div>
      </div>
      <div className={`${styles.kpiIcon} ${styles.kpiIconOverdue}`}><ShieldAlert size={16} /></div>
    </div>
  </section>
);
