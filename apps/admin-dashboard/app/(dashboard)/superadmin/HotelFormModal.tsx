"use client";

import React from "react";
import styles from "./superadmin.module.css";
import { HotelMasterDoc } from "./types";

const ALL_MODULES = [
  { id: "pos", label: "Point of Sales (POS)" },
  { id: "front-office", label: "Front Office" },
  { id: "housekeeping", label: "Housekeeping" },
  { id: "food-beverage", label: "Food & Beverage" },
  { id: "purchasing", label: "Purchasing" },
  { id: "accounting", label: "Accounting" },
  { id: "cpanel-only", label: "CPanel Only (User & Logo)" },
  { id: "cpanel-full", label: "CPanel Full (Landing Page)" },
];

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
  onSubmit, onClose,
}) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <header className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>
          {isEditing ? `Edit Konfigurasi: ${name}` : "Registrasi Hotel Baru"}
        </h3>
        <button onClick={onClose} className={styles.modalCloseBtn}>&times;</button>
      </header>

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Kode Hotel (ID Unik)</label>
              <input type="text" required disabled value={hotelCode} placeholder="Auto-generated 5-digit ID" className={styles.formInput} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Nama Hotel</label>
              <input type="text" required placeholder="misal: Bumi Anyom Resort" value={name} onChange={e => setName(e.target.value)} className={styles.formInput} />
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

          <div className={styles.modalDivider} />

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Siklus Tagihan</label>
              <select value={cycle} onChange={e => setCycle(e.target.value)} className={styles.formSelect}>
                <option value="monthly">Bulanan (Monthly)</option>
                <option value="yearly">Tahunan (Yearly)</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Status Tagihan</label>
              <select value={billingStatus} onChange={e => setBillingStatus(e.target.value)} className={styles.formSelect}>
                <option value="paid">Paid (Lunas)</option>
                <option value="grace-period">Grace Period (Masa Tenggang)</option>
                <option value="overdue">Overdue (Nunggak)</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Tanggal Jatuh Tempo Berikutnya</label>
              <input type="date" required value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className={styles.formInput} />
            </div>
          </div>

          {/* Active Modules */}
          <div className={styles.formGridFull} style={{ marginTop: "16px", marginBottom: "16px" }}>
            <div className={styles.formField}>
              <label className={styles.formLabel} style={{ marginBottom: "12px", fontWeight: "bold" }}>Modul Aktif Tenant</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10">
                {ALL_MODULES.map((mod) => (
                  <label key={mod.id} className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={activeModules.includes(mod.id)}
                      onChange={(e) => {
                        let updated = [...activeModules];
                        if (e.target.checked) {
                          updated.push(mod.id);
                          if (mod.id === "cpanel-only") updated = updated.filter(id => id !== "cpanel-full");
                          else if (mod.id === "cpanel-full") updated = updated.filter(id => id !== "cpanel-only");
                        } else {
                          updated = updated.filter(id => id !== mod.id);
                        }
                        setActiveModules(updated);
                      }}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnSecondary} style={{ height: "38px", fontSize: "13px", padding: "0 16px" }}>
            Batal
          </button>
          <button type="submit" className={styles.btnPrimary} style={{ height: "38px", fontSize: "13px", padding: "0 16px" }}>
            Simpan Konfigurasi
          </button>
        </div>
      </form>
    </div>
  </div>
);
