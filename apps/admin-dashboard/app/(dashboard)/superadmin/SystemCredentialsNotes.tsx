"use client";

import React, { useState } from "react";
import { KeyRound, Copy, Check, ChevronDown, ChevronUp, ShieldCheck, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import styles from "./SystemCredentialsNotes.module.css";

export function SystemCredentialsNotes() {
  const [collapsed, setCollapsed] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`${label} berhasil disalin`);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <span className={styles.label}>
          <KeyRound size={13} className={styles.labelIcon} />
          Catatan Kredensial Akses Cepat Sistem (Testing &amp; Demo)
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={styles.toggleBtn}
          title={collapsed ? "Tampilkan kredensial" : "Sembunyikan kredensial"}
        >
          <span>{collapsed ? "Tampilkan" : "Sembunyikan"}</span>
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      </div>

      {!collapsed && (
        <div className={styles.grid}>
          {/* Superadmin Master */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.badgeRole}>
                <ShieldCheck size={13} />
                Akses Master (Superadmin)
              </span>
              <span className={styles.roleDesc}>Kendali Penuh CRS &amp; Multi-Hotel</span>
            </div>
            <div className={styles.rowsList}>
              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Email</span>
                <div className={styles.fieldValueGroup}>
                  <span className={styles.fieldValue} title="superadmin@setara.co.id">superadmin@setara.co.id</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("superadmin@setara.co.id", "Email Superadmin")}
                    className={styles.copyBtn}
                    title="Salin Email"
                  >
                    {copiedKey === "Email Superadmin" ? <Check size={11} style={{ color: "#16a34a" }} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Sandi</span>
                <div className={styles.fieldValueGroup}>
                  <span className={styles.fieldValue}>Agnesia27</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("Agnesia27", "Sandi Superadmin")}
                    className={styles.copyBtn}
                    title="Salin Sandi"
                  >
                    {copiedKey === "Sandi Superadmin" ? <Check size={11} style={{ color: "#16a34a" }} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Partner Code</span>
                <div className={styles.fieldValueGroup}>
                  <span className={styles.fieldValue} style={{ color: "#1e3a2f", fontWeight: 700 }}>0</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("0", "Code 0")}
                    className={styles.copyBtn}
                    title="Salin Code"
                  >
                    {copiedKey === "Code 0" ? <Check size={11} style={{ color: "#16a34a" }} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Partner */}
          <div className={`${styles.card} ${styles.cardDemo}`}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badgeRole} ${styles.badgeRoleDemo}`}>
                <PlayCircle size={13} />
                Akses Simulasi (Demo Partner)
              </span>
              <span className={styles.roleDesc}>Uji Coba Front Office &amp; POS</span>
            </div>
            <div className={styles.rowsList}>
              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Email</span>
                <div className={styles.fieldValueGroup}>
                  <span className={styles.fieldValue} title="demo@setara.co.id">demo@setara.co.id</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("demo@setara.co.id", "Email Demo")}
                    className={styles.copyBtn}
                    title="Salin Email"
                  >
                    {copiedKey === "Email Demo" ? <Check size={11} style={{ color: "#16a34a" }} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Sandi</span>
                <div className={styles.fieldValueGroup}>
                  <span className={styles.fieldValue}>000000</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("000000", "Sandi Demo")}
                    className={styles.copyBtn}
                    title="Salin Sandi"
                  >
                    {copiedKey === "Sandi Demo" ? <Check size={11} style={{ color: "#16a34a" }} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Partner Code</span>
                <div className={styles.fieldValueGroup}>
                  <span className={styles.fieldValue} style={{ color: "#b45309", fontWeight: 700 }}>1</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("1", "Code 1")}
                    className={styles.copyBtn}
                    title="Salin Code"
                  >
                    {copiedKey === "Code 1" ? <Check size={11} style={{ color: "#16a34a" }} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
