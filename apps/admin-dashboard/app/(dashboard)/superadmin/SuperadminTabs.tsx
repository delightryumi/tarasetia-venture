"use client";

import React from "react";
import { Building2, CreditCard, Globe, Grid } from "lucide-react";
import styles from "./SuperadminTabs.module.css";
import Link from "next/link";

interface SuperadminTabsProps {
  activeTab: "registry" | "billing" | "channel-manager";
  onChange: (tab: "registry" | "billing" | "channel-manager") => void;
}

export const SuperadminTabs: React.FC<SuperadminTabsProps> = ({ activeTab, onChange }) => (
  <div className={styles.tabsContainer}>
    <div className={styles.tabsGroup}>
      <button
        onClick={() => onChange("registry")}
        className={`${styles.tabBtn} ${activeTab === "registry" ? styles.tabBtnActive : ""}`}
      >
        <Building2 size={16} />
        <span>Registry Partner</span>
      </button>
      <button
        onClick={() => onChange("billing")}
        className={`${styles.tabBtn} ${activeTab === "billing" ? styles.tabBtnActive : ""}`}
      >
        <CreditCard size={16} />
        <span>Central Billing</span>
      </button>
      <button
        onClick={() => onChange("channel-manager")}
        className={`${styles.tabBtn} ${activeTab === "channel-manager" ? styles.tabBtnActive : ""}`}
      >
        <Globe size={16} />
        <span>Channel Manager (Channex)</span>
      </button>
    </div>

    <div className={styles.tabsRightActions}>
      <Link
        href="/select-module"
        className={styles.moduleSwitchBtn}
        title="Buka menu pilihan modul sistem PMS"
      >
        <Grid size={14} />
        <span>Pilih Modul PMS</span>
      </Link>
    </div>
  </div>
);
