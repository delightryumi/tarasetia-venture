"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import styles from "./hrd.module.css";
import { Save, Building2 } from "lucide-react";

export function CompanySettingCard({ hotelCode }: { hotelCode: string }) {
  const [companyName, setCompanyName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const docRef = doc(db, `hotels/${hotelCode}/settings/company`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCompanyName(snap.data().name || "");
        } else {
          // If no specific company setting, try to fetch the hotel name as fallback
          const hotelRef = doc(db, `hotels/${hotelCode}`);
          const hotelSnap = await getDoc(hotelRef);
          if (hotelSnap.exists()) {
            setCompanyName(hotelSnap.data().name || "");
          }
        }
      } catch (err) {
        console.error("Error fetching company setting:", err);
      } finally {
        setLoading(false);
      }
    };
    if (hotelCode) fetchCompany();
  }, [hotelCode]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const docRef = doc(db, `hotels/${hotelCode}/settings/company`);
      await setDoc(docRef, { name: companyName }, { merge: true });
      setSuccessMsg("Nama perusahaan berhasil disimpan.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal menyimpan nama perusahaan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.card} style={{ marginTop: 20 }}>
      <div className={styles.cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Building2 size={20} style={{ color: "var(--s-primary)" }} />
          <div>
            <h2 className={styles.cardTitle}>Profil Perusahaan</h2>
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <p style={{ fontSize: 13, color: "var(--s-muted)", marginBottom: 20, lineHeight: 1.5 }}>
          Atur nama perusahaan yang tampil di Header Portal Absensi Karyawan.
        </p>

        {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
        {successMsg && <div className={styles.successBox}>{successMsg}</div>}

        <div className={styles.formGroup} style={{ marginBottom: 20 }}>
          <label className={styles.formLabel}>Nama Perusahaan</label>
          <input
            type="text"
            className={styles.formInput}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Contoh: PT Setara Venture"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || loading}
          className={styles.btnPrimary}
        >
          {isSaving ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </div>
    </div>
  );
}
