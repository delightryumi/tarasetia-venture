"use client";

import React, { useState } from "react";
import styles from "./superadmin.module.css";
import { Loader2 } from "lucide-react";

const ALL_MODULES = [
  { id: "pos", label: "Point of Sales (POS)" },
  { id: "front-office", label: "Front Office" },
  { id: "housekeeping", label: "Housekeeping" },
  { id: "food-beverage", label: "Food & Beverage" },
  { id: "purchasing", label: "Purchasing" },
  { id: "accounting", label: "Accounting" },
  { id: "hrd", label: "HRD & Absensi" },
  { id: "cpanel-only", label: "CPanel Only (User & Logo)" },
  { id: "cpanel-full", label: "CPanel Full (Landing Page)" },
  { id: "pos-self-order", label: "Self-Ordering" },
];

const PACKAGE_PRESETS: Record<string, string[]> = {
  startup: ["pos", "hrd", "cpanel-only"],
  bisnis: ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "hrd", "cpanel-only"],
  enterprise: ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "hrd", "cpanel-full", "pos-self-order"],
};

interface HotelFormModalProps {
  isEditing: boolean;
  hotelCode: string;
  name: string; setName: (v: string) => void;
  domain: string; setDomain: (v: string) => void;
  subdomain: string; setSubdomain: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  plan: string; setPlan: (v: any) => void;
  cycle: string; setCycle: (v: any) => void;
  billingStatus: string; setBillingStatus: (v: any) => void;
  nextDueDate: string; setNextDueDate: (v: string) => void;
  activeModules: string[]; setActiveModules: (v: string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSendLink?: (e: React.FormEvent) => void;
  isSendingLink?: boolean;
  onClose: () => void;
}

export const HotelFormModal: React.FC<HotelFormModalProps> = ({
  isEditing, hotelCode,
  name, setName,
  domain, setDomain,
  subdomain, setSubdomain,
  address, setAddress,
  phone, setPhone,
  email, setEmail,
  plan, setPlan,
  cycle, setCycle,
  billingStatus, setBillingStatus,
  nextDueDate, setNextDueDate,
  activeModules, setActiveModules,
  onSubmit, onSendLink, isSendingLink, onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"link" | "manual">(isEditing ? "manual" : "link");

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPlan = e.target.value;
    setPlan(selectedPlan);
    if (PACKAGE_PRESETS[selectedPlan]) {
      setActiveModules(PACKAGE_PRESETS[selectedPlan]);
    }
  };

  const handleModuleToggle = (modId: string) => {
    setActiveModules(prev =>
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    );
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? `Edit Konfigurasi: ${name}` : "Registrasi Partner Baru"}
          </h3>
          <button onClick={onClose} className={styles.modalCloseBtn}>&times;</button>
        </header>

        {!isEditing && (
          <div className={styles.tabsContainer} style={{ padding: "0 24px", marginBottom: 0, backgroundColor: "var(--s-surface-soft)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={`${styles.tabBtn} ${activeTab === "link" ? styles.tabBtnActive : ""}`}
            >
              Kirim Link Onboarding
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`${styles.tabBtn} ${activeTab === "manual" ? styles.tabBtnActive : ""}`}
            >
              Registrasi Manual
            </button>
          </div>
        )}

        {activeTab === "link" && !isEditing ? (
          <form onSubmit={onSendLink} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div className={styles.modalBody} style={{ padding: "24px 32px" }}>
              <div style={{ marginBottom: "24px", color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
                Kirimkan link satu kali pakai ke email klien. Klien akan mengisi sendiri nama usaha, alamat, dan menyetujui kontrak layanan. Akun akan terbuat otomatis setelah klien melengkapi form.
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email Klien (Tujuan)</label>
                  <input type="email" required placeholder="email@klien.com" value={email} onChange={e => setEmail(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Paket Berlangganan</label>
                  <select value={plan} onChange={handlePlanChange} className={styles.formSelect}>
                    <option value="startup">Startup</option>
                    <option value="bisnis">Bisnis</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              
              {plan && PACKAGE_PRESETS[plan] && (
                <div style={{ marginTop: "24px" }}>
                  <label className={styles.formLabel}>Modul yang akan aktif ({plan.toUpperCase()}):</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                    {PACKAGE_PRESETS[plan].map(mod => (
                      <span key={mod} style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500 }}>
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <footer className={styles.modalFooter}>
              <button type="button" onClick={onClose} className={styles.btnSecondary}>Batal</button>
              <button type="submit" disabled={isSendingLink || !email || !plan} className={styles.btnPrimary} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSendingLink ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSendingLink ? "Mengirim..." : "Kirim Link via Email"}
              </button>
            </footer>
          </form>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Kode Partner (ID Unik)</label>
                  <input type="text" required disabled value={hotelCode} placeholder="Auto-generated 5-digit ID" className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Nama Partner</label>
                  <input type="text" required placeholder="misal: Grand Sunset Resort" value={name} onChange={e => setName(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Domain Utama Custom</label>
                  <input type="text" placeholder="misal: resort.bumianyom.com" value={domain} onChange={e => setDomain(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Subdomain CRS Cadangan</label>
                  <input type="text" placeholder="Auto: {kode-hotel}.crs.local" value={subdomain} onChange={e => setSubdomain(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email Kontak</label>
                  <input type="email" placeholder="email@hotel.com" value={email} onChange={e => setEmail(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>No. Telepon</label>
                  <input type="text" placeholder="+62..." value={phone} onChange={e => setPhone(e.target.value)} className={styles.formInput} />
                </div>
              </div>

              <div className={styles.formGridFull}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Alamat Lengkap</label>
                  <textarea placeholder="Alamat lengkap hotel..." value={address} onChange={e => setAddress(e.target.value)} className={styles.formTextarea} />
                </div>
              </div>

              <div className={styles.sectionDivider} />

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Paket Berlangganan</label>
                  <select value={plan} onChange={handlePlanChange} className={styles.formSelect}>
                    <option value="startup">Startup</option>
                    <option value="bisnis">Bisnis</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="custom">Custom Plan</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Siklus Tagihan</label>
                  <select value={cycle} onChange={e => setCycle(e.target.value)} className={styles.formSelect}>
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Status Pembayaran</label>
                  <select value={billingStatus} onChange={e => setBillingStatus(e.target.value)} className={styles.formSelect}>
                    <option value="paid">Lunas (Paid)</option>
                    <option value="unpaid">Belum Lunas (Unpaid)</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Jatuh Tempo Selanjutnya</label>
                  <input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className={styles.formInput} />
                </div>
              </div>

              <div className={styles.sectionDivider} />
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Hak Akses Modul Aktif</label>
                <div className={styles.modulesGrid}>
                  {ALL_MODULES.map(mod => (
                    <label key={mod.id} className={styles.moduleCheckbox}>
                      <input
                        type="checkbox"
                        checked={activeModules.includes(mod.id)}
                        onChange={() => handleModuleToggle(mod.id)}
                      />
                      <span>{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <footer className={styles.modalFooter}>
              <button type="button" onClick={onClose} className={styles.btnSecondary}>Batal</button>
              <button type="submit" className={styles.btnPrimary}>
                {isEditing ? "Simpan Perubahan" : "Simpan Registrasi"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
};
