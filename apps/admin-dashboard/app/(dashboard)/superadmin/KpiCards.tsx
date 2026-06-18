"use client";

import React from "react";
import { Building2, CheckCircle, ShieldAlert, Layers } from "lucide-react";
import styles from "./superadmin.module.css";

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
        <div className={styles.kpiLabel}>Total Partner</div>
        <div className={styles.kpiValue}>{totalHotels}</div>
      </div>
      <div className={styles.kpiIcon}><Building2 size={20} /></div>
    </div>
    <div className={styles.kpiCard}>
      <div>
        <div className={styles.kpiLabel}>Hotel Aktif</div>
        <div className={styles.kpiValue} style={{ color: "#15803d" }}>{activeHotels}</div>
      </div>
      <div className={styles.kpiIcon}><CheckCircle size={20} style={{ color: "#15803d" }} /></div>
    </div>
    <div className={styles.kpiCard}>
      <div>
        <div className={styles.kpiLabel}>Billing Overdue</div>
        <div className={styles.kpiValue} style={{ color: "#b91c1c" }}>{overdueHotels}</div>
      </div>
      <div className={styles.kpiIcon}><ShieldAlert size={20} style={{ color: "#b91c1c" }} /></div>
    </div>
  </section>
);

export const BillingKpiCards: React.FC<BillingKpiProps> = ({ totalRevenue, outstandingAmount, overdueHotels }) => (
  <section className={styles.kpiGrid}>
    <div className={styles.kpiCard}>
      <div>
        <div className={styles.kpiLabel}>Total Pendapatan</div>
        <div className={styles.kpiValue} style={{ color: "#15803d" }}>
          Rp {totalRevenue.toLocaleString("id-ID")}
        </div>
      </div>
      <div className={styles.kpiIcon}><CheckCircle size={20} style={{ color: "#15803d" }} /></div>
    </div>
    <div className={styles.kpiCard}>
      <div>
        <div className={styles.kpiLabel}>Piutang Belum Lunas</div>
        <div className={styles.kpiValue} style={{ color: "#d9a441" }}>
          Rp {outstandingAmount.toLocaleString("id-ID")}
        </div>
      </div>
      <div className={styles.kpiIcon}><Layers size={20} style={{ color: "#d9a441" }} /></div>
    </div>
    <div className={styles.kpiCard}>
      <div>
        <div className={styles.kpiLabel}>Billing Overdue</div>
        <div className={styles.kpiValue} style={{ color: "#b91c1c" }}>{overdueHotels}</div>
      </div>
      <div className={styles.kpiIcon}><ShieldAlert size={20} style={{ color: "#b91c1c" }} /></div>
    </div>
  </section>
);
