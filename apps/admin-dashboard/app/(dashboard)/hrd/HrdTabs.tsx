"use client";

import React from "react";
import styles from "./hrd.module.css";

export type HrdTab = "monitor" | "staf" | "shift" | "plotting" | "pengajuan" | "lembur" | "laporan" | "penggajian" | "setting";

const TABS: { id: HrdTab; label: string }[] = [
  { id: "monitor",   label: "📡 Monitor Hari Ini" },
  { id: "staf",      label: "👥 Manajemen Staf" },
  { id: "shift",     label: "🕐 Shift Dasar" },
  { id: "plotting",  label: "📅 Plotting Jadwal" },
  { id: "pengajuan", label: "📋 Pengajuan" },
  { id: "lembur",    label: "⏱ Lembur" },
  { id: "laporan",   label: "📊 Laporan" },
  { id: "penggajian",label: "💰 Penggajian" },
  { id: "setting",   label: "⚙️ Setting Lokasi & QR" },
];

interface Props {
  activeTab: HrdTab;
  onChange: (tab: HrdTab) => void;
}

export function HrdTabs({ activeTab, onChange }: Props) {
  return (
    <div className={styles.tabsContainer}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabBtnActive : ""}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
