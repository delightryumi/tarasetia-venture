"use client";

import React from "react";
import styles from "./superadmin.module.css";

interface SuperadminTabsProps {
  activeTab: "registry" | "billing";
  onChange: (tab: "registry" | "billing") => void;
}

export const SuperadminTabs: React.FC<SuperadminTabsProps> = ({ activeTab, onChange }) => (
  <div className={styles.tabsContainer}>
    <button
      onClick={() => onChange("registry")}
      className={`${styles.tabBtn} ${activeTab === "registry" ? styles.tabBtnActive : ""}`}
    >
      Registry Tenant
    </button>
    <button
      onClick={() => onChange("billing")}
      className={`${styles.tabBtn} ${activeTab === "billing" ? styles.tabBtnActive : ""}`}
    >
      Central Billing
    </button>
  </div>
);
