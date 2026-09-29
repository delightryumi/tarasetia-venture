"use client";

import React, { useState } from "react";
import styles from "./HotelFormModal.module.css";
import { Loader2, Utensils, Building2, Briefcase, Settings2, CheckCircle2 } from "lucide-react";

// Categorized modules structure for crystal-clear, high-precision UI looping
const MODULE_GROUPS = [
  {
    category: "POS, F&B & Resto (Utama Cafe/Resto/UMKM)",
    icon: Utensils,
    modules: [
      { id: "pos", label: "Point of Sales (POS)", desc: "Terminal kasir, shift kasir & transaksi penjualan" },
      { id: "food-beverage", label: "Food & Beverage (F&B)", desc: "Manajemen resep, katalog menu & inventory F&B" },
      { id: "pos-self-order", label: "Self-Ordering (Add-on)", desc: "Menu tamu digital QR meja / kamar" },
      { id: "food-beverage-realtime", label: "POS Real-time / KDS (Add-on)", desc: "Kitchen display system pesanan dapur live" },
    ]
  },
  {
    category: "Back Office & Operasional Bisnis",
    icon: Briefcase,
    modules: [
      { id: "accounting", label: "Accounting & Finance", desc: "Buku besar, jurnal umum, neraca & laporan laba rugi" },
      { id: "purchasing", label: "Purchasing & Pengadaan", desc: "Purchase order (PO), penerimaan barang & vendor" },
      { id: "hrd", label: "HRD & Absensi", desc: "Data staf, jadwal kerja, shift & pencatatan absensi" },
    ]
  },
  {
    category: "Hotel & Operasional Kamar (Khusus Hotel / Penginapan)",
    icon: Building2,
    modules: [
      { id: "front-office", label: "Front Office (FO)", desc: "Reservasi kamar, check-in, check-out & tamu" },
      { id: "housekeeping", label: "Housekeeping (HK)", desc: "Status kebersihan kamar, linen & tugas room attendant" },
      { id: "innalytics", label: "Innalytics (Laporan & Intelijen)", desc: "Analitik performa, DSR & laporan standar USALI" },
    ]
  },
  {
    category: "Sistem & Portal Pengaturan",
    icon: Settings2,
    modules: [
      { id: "cpanel-only", label: "CPanel Only", desc: "Pengaturan akun user staf, outlet & logo partner" },
      { id: "cpanel-full", label: "CPanel Full", desc: "Website landing page dinamis & portal web penuh" },
    ]
  }
];

const ALL_MODULES_FLAT = MODULE_GROUPS.flatMap(g => g.modules);
const MODULE_MAP = new Map(ALL_MODULES_FLAT.map(m => [m.id, m]));

// Preset Modul Resmi:
// Startup: POS, HRD, Accounting, Purchasing, F&B, CPanel Only (fokus cafe, resto, umkm - tanpa modul hotel)
const PACKAGE_PRESETS: Record<string, string[]> = {
  startup: [
    "pos",
    "food-beverage",
    "purchasing",
    "accounting",
    "hrd",
    "cpanel-only"
  ],
  bisnis: [
    "pos",
    "front-office",
    "innalytics",
    "housekeeping",
    "food-beverage",
    "purchasing",
    "accounting",
    "hrd",
    "cpanel-only",
  ],
  enterprise: [
    "pos",
    "front-office",
    "innalytics",
    "housekeeping",
    "food-beverage",
    "purchasing",
    "accounting",
    "hrd",
    "cpanel-full",
    "pos-self-order",
    "food-beverage-realtime",
  ],
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
  isSavingHotel?: boolean;
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
  onSubmit, onSendLink, isSendingLink, isSavingHotel, onClose,
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

  const isStartup = plan === "startup" || plan === "basic";

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? `Edit Konfigurasi: ${name}` : "Registrasi Partner Baru"}
          </h3>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn} title="Tutup Modal">&times;</button>
        </header>

        {!isEditing && (
          <div className={styles.tabsContainer}>
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
            <div className={styles.modalBody}>
              <div style={{ marginBottom: "20px", color: "#64748b", fontSize: "13.5px", lineHeight: "1.5" }}>
                Kirimkan link satu kali pakai ke email klien. Klien akan mengisi sendiri nama usaha, alamat, dan menyetujui kontrak layanan. Akun akan terbuat otomatis setelah klien melengkapi form.
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email Klien (Tujuan)</label>
                  <input
                    type="email"
                    required
                    placeholder="email@klien.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Paket Berlangganan</label>
                  <select value={plan} onChange={handlePlanChange} className={styles.formSelect}>
                    <option value="startup">Startup (POS, F&B, Purchasing, Accounting, HRD, CPanel)</option>
                    <option value="bisnis">Bisnis (Hotel Standard PMS + POS + Backoffice)</option>
                    <option value="enterprise">Enterprise (Full Hotel Suite & Add-ons)</option>
                  </select>
                </div>
              </div>

              {isStartup && (
                <div className={styles.planBanner}>
                  <div className={styles.planBannerTitle}>
                    <CheckCircle2 size={15} />
                    <span>Paket Startup: Fokus Cafe, Resto & UMKM</span>
                  </div>
                  <div className={styles.planBannerDesc}>
                    Modul aktif: <strong>Point of Sales (POS), Food & Beverage (F&B), Purchasing, Accounting, HRD & Absensi, CPanel Only</strong>. Tanpa modul hotel (bebas dari Front Office, Housekeeping, dan Innalytics).
                  </div>
                </div>
              )}
              
              {plan && PACKAGE_PRESETS[plan] && (
                <div style={{ marginTop: "20px" }}>
                  <label className={styles.formLabel}>Modul yang akan aktif ({plan.toUpperCase()}):</label>
                  <div className={styles.pillsList}>
                    {PACKAGE_PRESETS[plan].map(modId => {
                      const modInfo = MODULE_MAP.get(modId);
                      return (
                        <span key={modId} className={styles.pillItem}>
                          <CheckCircle2 size={13} />
                          <span>{modInfo?.label || modId}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <footer className={styles.modalFooter}>
              <button type="button" onClick={onClose} className={styles.btnSecondary}>Batal</button>
              <button type="submit" disabled={isSendingLink || !email || !plan} className={styles.btnPrimary}>
                {isSendingLink ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSendingLink ? "Mengirim..." : "Kirim Link via Email"}
              </button>
            </footer>
          </form>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div className={styles.modalBody}>
              {/* Identitas Partner */}
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Kode Partner (ID Unik)</label>
                  <input type="text" required disabled value={hotelCode} placeholder="Auto-generated 5-digit ID" className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Nama Partner / Usaha</label>
                  <input type="text" required placeholder="misal: Kopi Setara Cafe & Resto" value={name} onChange={e => setName(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Domain Utama Custom</label>
                  <input type="text" placeholder="misal: cafe.setara.com" value={domain} onChange={e => setDomain(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Subdomain CRS Cadangan</label>
                  <input type="text" placeholder="Auto: {kode-hotel}.crs.local" value={subdomain} onChange={e => setSubdomain(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email Kontak / Admin</label>
                  <input type="email" placeholder="admin@outlet.com" value={email} onChange={e => setEmail(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>No. Telepon / WhatsApp</label>
                  <input type="text" placeholder="+62 812..." value={phone} onChange={e => setPhone(e.target.value)} className={styles.formInput} />
                </div>
              </div>

              <div className={styles.formGridFull}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Alamat Lengkap</label>
                  <textarea placeholder="Alamat lengkap lokasi partner..." value={address} onChange={e => setAddress(e.target.value)} className={styles.formTextarea} />
                </div>
              </div>

              <div className={styles.sectionDivider} />

              {/* Paket & Penagihan */}
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Paket Berlangganan</label>
                  <select value={plan} onChange={handlePlanChange} className={styles.formSelect}>
                    <option value="startup">Startup (POS, F&B, Purchasing, Accounting, HRD, CPanel)</option>
                    <option value="bisnis">Bisnis (Hotel Standard PMS + POS + Backoffice)</option>
                    <option value="enterprise">Enterprise (Full Hotel Suite & Add-ons)</option>
                    <option value="custom">Custom Plan (Kustomisasi Manual)</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Siklus Tagihan</label>
                  <select value={cycle} onChange={e => setCycle(e.target.value)} className={styles.formSelect}>
                    <option value="monthly">Bulanan (Monthly)</option>
                    <option value="yearly">Tahunan (Yearly)</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Status Pembayaran</label>
                  <select value={billingStatus} onChange={e => setBillingStatus(e.target.value)} className={styles.formSelect}>
                    <option value="paid">Lunas (Paid)</option>
                    <option value="unpaid">Belum Lunas (Unpaid)</option>
                  </select>
                  {isEditing && billingStatus === "paid" && (
                    <p style={{ fontSize: 11, color: "#15803d", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      ✓ Mengubah ke Lunas akan otomatis <strong>mengaktifkan kembali</strong> akses partner.
                    </p>
                  )}
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Jatuh Tempo Selanjutnya</label>
                  <input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className={styles.formInput} />
                </div>
              </div>

              {isStartup && (
                <div className={styles.planBanner}>
                  <div className={styles.planBannerTitle}>
                    <CheckCircle2 size={15} />
                    <span>Paket Startup: Fokus Cafe, Resto & UMKM (Bebas Modul Hotel)</span>
                  </div>
                  <div className={styles.planBannerDesc}>
                    Modul operasional aktif: <strong>POS, Food & Beverage (F&B), Purchasing, Accounting, HRD & Absensi, dan CPanel Only</strong>. Modul Front Office, Housekeeping, dan Innalytics dinonaktifkan secara otomatis.
                  </div>
                </div>
              )}

              <div className={styles.sectionDivider} />
              
              {/* Hak Akses Modul Aktif: Grouped High Precision */}
              <div className={styles.formField}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className={styles.formLabel}>Hak Akses Modul Aktif ({activeModules.length} Modul Terpilih)</label>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>
                    Klik kartu modul untuk mengaktifkan atau menonaktifkan
                  </span>
                </div>
                
                <div className={styles.modulesContainer}>
                  {MODULE_GROUPS.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.category} className={styles.moduleGroupBlock}>
                        <div className={styles.moduleGroupTitle}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <GroupIcon size={14} />
                            <span>{group.category}</span>
                          </span>
                        </div>
                        <div className={styles.moduleGrid}>
                          {group.modules.map(mod => {
                            const isChecked = activeModules.includes(mod.id);
                            return (
                              <label
                                key={mod.id}
                                className={`${styles.moduleCard} ${isChecked ? styles.moduleCardActive : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleModuleToggle(mod.id)}
                                  className={styles.moduleCheckboxInput}
                                />
                                <div className={styles.moduleTextCol}>
                                  <span className={styles.moduleLabel}>{mod.label}</span>
                                  <span className={styles.moduleDesc}>{mod.desc}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <footer className={styles.modalFooter}>
              <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isSavingHotel}>Batal</button>
              <button type="submit" disabled={isSavingHotel} className={styles.btnPrimary}>
                {isSavingHotel ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSavingHotel ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Simpan Registrasi")}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
};
