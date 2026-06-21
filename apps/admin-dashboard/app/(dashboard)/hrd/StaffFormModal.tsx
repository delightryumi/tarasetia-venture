"use client";

import React, { useState } from "react";
import type { Staff, Shift } from "./types";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
  shifts: Shift[];
  editTarget: Staff | null;
  onClose: () => void;
}

export function StaffFormModal({ hotelCode, shifts, editTarget, onClose }: Props) {
  const isEdit = !!editTarget;
  const [form, setForm] = useState({
    name:     editTarget?.name || "",
    phone:    editTarget?.phone || "",
    nik:      editTarget?.nik || "",
    pin:      editTarget?.pin || "",
    position: editTarget?.position || "",
    division: editTarget?.division || "",
    isActive: editTarget !== undefined ? editTarget?.isActive ?? true : true,
    employmentType: editTarget?.employmentType || "staff",
    baseSalary: editTarget?.payrollConfig?.baseSalary || 0,
    overtimeRatePerHour: editTarget?.payrollConfig?.overtimeRatePerHour || 0,
    lateDeductionPerMinute: editTarget?.payrollConfig?.lateDeductionPerMinute || 0,
    bpjsPercentage: editTarget?.payrollConfig?.bpjsPercentage || 0,
  });
  const [activeTab, setActiveTab] = useState<"profil" | "gaji">("profil");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ nik: string; pin: string } | null>(null);

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        const payload = {
          ...form,
          id: editTarget!.id,
          hotelCode,
          payrollConfig: {
            baseSalary: Number(form.baseSalary),
            overtimeRatePerHour: Number(form.overtimeRatePerHour),
            lateDeductionPerMinute: Number(form.lateDeductionPerMinute),
            bpjsPercentage: Number(form.bpjsPercentage),
          }
        };
        const res = await fetch("/api/staff", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal update");
        onClose();
      } else {
        const payload = {
          ...form,
          hotelCode,
          payrollConfig: {
            baseSalary: Number(form.baseSalary),
            overtimeRatePerHour: Number(form.overtimeRatePerHour),
            lateDeductionPerMinute: Number(form.lateDeductionPerMinute),
            bpjsPercentage: Number(form.bpjsPercentage),
          }
        };
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membuat akun");
        // Tampilkan kredensial PIN
        setNewCredentials({ nik: form.nik, pin: data.pin });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>{isEdit ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--s-muted)" }}>✕</button>
        </div>

        {newCredentials ? (
          <div className={styles.modalBody}>
            <div className={styles.successBox}>
              <p className={styles.successText}>✅ Akun berhasil dibuat!</p>
              <p className={styles.infoText}>Berikan kredensial ini kepada karyawan:</p>
              <div className={styles.monoBox}>
                <p style={{ margin: "0 0 6px" }}><strong>ID Karyawan (NIK):</strong> {newCredentials.nik}</p>
                <p style={{ margin: 0 }}><strong>PIN Akses:</strong> {newCredentials.pin}</p>
              </div>
              <p className={styles.mutedText}>
                Karyawan dapat login di <strong>/attendance</strong> menggunakan kredensial di atas.
              </p>
            </div>
            <button className={styles.btnPrimary} onClick={onClose} style={{ width: "100%" }}>Tutup</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              {error && (
                <div className={styles.errorBox}>
                  {error}
                </div>
              )}

              <div className={styles.segmentedControl}>
                <button type="button" onClick={() => setActiveTab("profil")} className={`${styles.segmentedBtn} ${activeTab === "profil" ? styles.segmentedBtnActive : ""}`}>Data Profil</button>
                <button type="button" onClick={() => setActiveTab("gaji")} className={`${styles.segmentedBtn} ${activeTab === "gaji" ? styles.segmentedBtnActive : ""}`}>Data Gaji & Payroll</button>
              </div>

              {activeTab === "profil" && (
                <>
                  <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nama Lengkap *</label>
                  <input className={styles.formInput} value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Budi Santoso" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>No. HP *</label>
                  <input className={styles.formInput} value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="081234567890" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>NIK (digunakan sebagai username login) *</label>
                <input
                  className={styles.formInput}
                  value={form.nik}
                  onChange={(e) => set("nik", e.target.value)}
                  required
                  placeholder="1234567890123456"
                  disabled={isEdit} // NIK tidak bisa diubah setelah dibuat
                  style={isEdit ? { opacity: 0.5 } : {}}
                />
                {!isEdit && <span style={{ fontSize: 11, color: "var(--s-muted)" }}>Gunakan NIK ini untuk masuk ke portal absen. PIN 6-digit akan dibuatkan otomatis.</span>}
              </div>

              {isEdit && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>PIN Akses (6 digit) *</label>
                  <input
                    className={styles.formInput}
                    value={form.pin}
                    onChange={(e) => set("pin", e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    minLength={6}
                    maxLength={6}
                    pattern="\d{6}"
                    placeholder="123456"
                  />
                  <span style={{ fontSize: 11, color: "var(--s-muted)" }}>Anda dapat mengubah PIN akses karyawan di sini.</span>
                </div>
              )}

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Jabatan/Posisi *</label>
                  <input className={styles.formInput} value={form.position} onChange={(e) => set("position", e.target.value)} required placeholder="Housekeeping" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Divisi *</label>
                  <input className={styles.formInput} value={form.division} onChange={(e) => set("division", e.target.value)} required placeholder="Operasional" />
                </div>
              </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Status Staf</label>
                      <div style={{ marginTop: 8 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
                          Aktif
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "gaji" && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tipe Karyawan *</label>
                    <select className={styles.formInput} value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
                      <option value="staff">Staff (Gaji Tetap Bulanan)</option>
                      <option value="dw">Daily Worker / DW (Gaji Harian)</option>
                    </select>
                    <p style={{ fontSize: 11, color: "var(--s-muted)", marginTop: 4 }}>Daily Worker tidak dibayar jika absen (Izin, Sakit, Cuti, Alpa otomatis dipotong).</p>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{form.employmentType === 'staff' ? 'Gaji Pokok Bulanan (Rp)' : 'Upah Harian (Rp)'} *</label>
                      <input type="number" className={styles.formInput} value={form.baseSalary} onChange={(e) => set("baseSalary", e.target.value)} onWheel={(e) => e.currentTarget.blur()} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Tarif Lembur per Jam (Rp)</label>
                      <input type="number" className={styles.formInput} value={form.overtimeRatePerHour} onChange={(e) => set("overtimeRatePerHour", e.target.value)} onWheel={(e) => e.currentTarget.blur()} required />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Potongan Telat per Menit (Rp)</label>
                      <input type="number" className={styles.formInput} value={form.lateDeductionPerMinute} onChange={(e) => set("lateDeductionPerMinute", e.target.value)} onWheel={(e) => e.currentTarget.blur()} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Premi BPJS (%)</label>
                      <input type="number" step="0.01" className={styles.formInput} value={form.bpjsPercentage} onChange={(e) => set("bpjsPercentage", e.target.value)} onWheel={(e) => e.currentTarget.blur()} required />
                      <p style={{ fontSize: 11, color: "var(--s-muted)", marginTop: 4 }}>Cth: 1 = 1%. Dipotong dari gaji pokok.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={onClose}>Batal</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Akun Karyawan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
