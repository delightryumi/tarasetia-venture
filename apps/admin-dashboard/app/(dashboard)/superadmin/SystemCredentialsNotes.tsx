"use client";

import React from "react";
import styles from "./superadmin.module.css";

// Inline styles menggunakan token CSS yang sama persis dengan .kpiCard dan .tableCard
export function SystemCredentialsNotes() {
  return (
    <div style={{ marginBottom: "var(--s-space-xl)" }}>
      {/* Section label — sama dengan .kpiLabel */}
      <p style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--s-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: "var(--s-space-lg)"
      }}>
        Catatan Kredensial Sistem
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--s-space-lg)" }}>

        {/* Superadmin Card */}
        <div className={styles.kpiCard} style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--s-space-lg)" }}>
          {/* Head */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-space-md)", width: "100%" }}>
            <div className={styles.kpiIcon} style={{ color: "#006241", borderColor: "rgba(0,98,65,0.15)", backgroundColor: "rgba(0,98,65,0.06)" }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            </div>
            <div>
              <div className={styles.kpiLabel}>Akses Master</div>
              <div style={{ fontSize: "12px", color: "var(--s-body)", marginTop: "2px" }}>Superadmin · Kendali Penuh CRS</div>
            </div>
          </div>

          {/* Rows */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--s-space-sm)", borderTop: "1px solid var(--s-hairline)", paddingTop: "var(--s-space-md)" }}>
            <Row label="Email" value="admin@setara.co.id" />
            <Row label="Sandi" value="222222" mono />
            <Row label="Partner Code" value="0" mono accent="#006241" />
          </div>
        </div>

        {/* Demo Card */}
        <div className={styles.kpiCard} style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--s-space-lg)" }}>
          {/* Head */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-space-md)", width: "100%" }}>
            <div className={styles.kpiIcon} style={{ color: "#a07830", borderColor: "rgba(203,162,88,0.2)", backgroundColor: "rgba(203,162,88,0.08)" }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <div className={styles.kpiLabel}>Akses Simulasi</div>
              <div style={{ fontSize: "12px", color: "var(--s-body)", marginTop: "2px" }}>Demo Partner · Uji Coba & Presentasi</div>
            </div>
          </div>

          {/* Rows */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--s-space-sm)", borderTop: "1px solid var(--s-hairline)", paddingTop: "var(--s-space-md)" }}>
            <Row label="Email" value="demo@setara.co.id" />
            <Row label="Sandi" value="000000" mono />
            <Row label="Partner Code" value="1" mono accent="#a07830" />
          </div>
        </div>

      </div>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "13px", color: "var(--s-muted)" }}>{label}</span>
      <span
        className="select-all"
        style={{
          fontSize: "13px",
          fontFamily: mono ? "var(--font-mono-jb), monospace" : undefined,
          fontWeight: accent ? 600 : 500,
          color: accent ?? "var(--s-ink)",
          backgroundColor: accent ? `${accent}12` : undefined,
          border: accent ? `1px solid ${accent}30` : undefined,
          padding: accent ? "2px 8px" : undefined,
          borderRadius: accent ? "var(--s-radius-sm)" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
