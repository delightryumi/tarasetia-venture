"use client";

import React, { useState } from "react";
import {
  X,
  Store,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";
import styles from "./RegisterModal.module.css";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessPrefill?: (partnerCode: string, email: string) => void;
}

const LEAD_SOURCE_OPTIONS = [
  "Facebook",
  "Instagram",
  "TikTok",
  "Rekomendasi Teman",
  "Google / Website",
  "Lainnya"
];

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccessPrefill
}) => {
  // Form States
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [leadSource, setLeadSource] = useState("Instagram");
  const [leadSourceOther, setLeadSourceOther] = useState("");

  // Logo Upload State
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    hotelCode: string;
    businessName: string;
    email: string;
    nextDueDate: string;
  } | null>(null);

  if (!isOpen) return null;

  // Handle Logo Processing & Compression (Client-Side Canvas -> Validated by Server API)
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError("Format logo harus berupa file gambar PNG, JPG, atau WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file logo maksimal 5MB.");
      return;
    }

    setIsUploadingLogo(true);
    setUploadProgress(25);
    setError("");

    try {
      const compressedDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const MAX_DIM = 360;
            let width = img.width;
            let height = img.height;

            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Gagal menginisialisasi pemroses gambar."));
              return;
            }
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Pertahankan transparansi dengan image/png
            const outDataUrl = canvas.toDataURL("image/png");
            resolve(outDataUrl);
          };
          img.onerror = () => reject(new Error("File gambar rusak atau tidak dapat dibaca."));
          img.src = ev.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
        reader.readAsDataURL(file);
      });

      setUploadProgress(100);
      setLogoUrl(compressedDataUrl);
    } catch (err: any) {
      console.error("Logo processing error:", err);
      setError(err?.message || "Terjadi kesalahan saat memproses logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Submit Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!businessName.trim() || !address.trim() || !phone.trim() || !email.trim()) {
      setError("Mohon lengkapi semua field bertanda bintang (*).");
      return;
    }

    if (leadSource === "Lainnya" && !leadSourceOther.trim()) {
      setError("Mohon isi keterangan sumber darimana Anda mengetahui Tara.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          leadSource,
          leadSourceOther: leadSourceOther.trim(),
          logoUrl
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Pendaftaran gagal diproses.");
      }

      setSuccessData({
        hotelCode: data.hotelCode,
        businessName: data.businessName,
        email: data.email,
        nextDueDate: data.nextDueDate
      });

      if (onSuccessPrefill) {
        onSuccessPrefill(data.hotelCode, data.email);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err?.message || "Terjadi kesalahan koneksi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className="flex items-center gap-3">
            <div className={styles.headerIconBadge}>
              <img src="/channels/1.png" alt="Tara" className={styles.taraHeaderLogo} />
            </div>
            <div>
              <h2 className={styles.headerTitle}>Pendaftaran Kemitraan Tara</h2>
              <p className={styles.headerSubtitle}>
                Daftar mandiri & nikmati akses penuh Paket POS Gratis 6 Bulan
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.closeButton} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {successData ? (
          <div className={styles.successCard}>
            <div className={styles.successIconBadge}>
              <CheckCircle2 size={36} />
            </div>
            <h3 className={styles.successTitle}>Pendaftaran Berhasil!</h3>
            <p className={styles.successDesc}>
              Selamat datang di ekosistem Tara! Akun kemitraan untuk <strong>{successData.businessName}</strong> telah berhasil dibuat dengan masa aktif gratis 6 bulan.
            </p>

            <div className={styles.credentialsBox}>
              <div className={styles.credentialRow}>
                <span className={styles.credentialLabel}>Partner Code:</span>
                <span className={styles.credentialValue}>[{successData.hotelCode}]</span>
              </div>
              <div className={styles.credentialRow}>
                <span className={styles.credentialLabel}>Email Login:</span>
                <span className={styles.credentialValue}>{successData.email}</span>
              </div>
              <div className={styles.credentialRow}>
                <span className={styles.credentialLabel}>Kata Sandi:</span>
                <span className={styles.credentialValue} style={{ color: "#16a34a" }}>
                  Dikirimkan ke Email Anda
                </span>
              </div>
              <div className={styles.credentialRow}>
                <span className={styles.credentialLabel}>Bebas Biaya Hingga:</span>
                <span className={styles.credentialValue}>
                  {new Date(successData.nextDueDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "11.5px", color: "#64748b", margin: 0 }}>
              Silakan periksa kotak masuk atau spam email Anda untuk melihat kata sandi sementara Anda.
            </p>

            <button
              type="button"
              className={styles.successBtn}
              onClick={() => {
                onClose();
              }}
            >
              <span>Lanjut ke Halaman Login</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "contents" }}>
            <div className={styles.modalBody}>
              {/* Promo Banner Card */}
              <div className={styles.promoCard}>
                <div className={styles.promoBadgeRow}>
                  <span className={styles.promoBadge}>
                    Special Launch Offer
                  </span>
                  <span className={styles.promoPeriodText}>Masa Aktif 180 Hari (Free)</span>
                </div>
                <h4 className={styles.promoTitle}>Paket POS & Keuangan Terpadu</h4>
                <p className={styles.promoDesc}>
                  Dapatkan sistem operasional kasir POS modern, manajemen inventaris purchasing, pembukuan keuangan (Accounting), dan pengelolaan tim (HRD) tanpa biaya berlangganan selama 6 bulan pertama.
                </p>
                <div className={styles.promoFeaturePills}>
                  <span className={styles.featurePill}>✓ Kasir LexuPOS</span>
                  <span className={styles.featurePill}>✓ Accounting & P&L</span>
                  <span className={styles.featurePill}>✓ Purchasing (SR, PR, DML)</span>
                  <span className={styles.featurePill}>✓ HRD & Absensi</span>
                </div>
              </div>

              {error && (
                <div className={styles.errorAlert} role="alert">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Nama Usaha & Alamat */}
              <div className={styles.formRow2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Nama Usaha / Outlet *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Ruang Temu"
                    className={styles.textInput}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Kota & Alamat Lengkap *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jl. Senopati No. 12, Jakarta"
                    className={styles.textInput}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 2. WhatsApp & Email */}
              <div className={styles.formRow2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Nomor WhatsApp / HP Aktif *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    className={styles.textInput}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>Alamat Email Pemilik *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@usahaanda.com"
                    className={styles.textInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 3. Logo Usaha (Otomatis ke Struk POS & Laporan) */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <span>Logo Usaha / Brand</span>
                  <span className={styles.fieldHint}>Tampil di Struk POS & Laporan PDF</span>
                </label>
                <div className={styles.logoUploadBox}>
                  <div className={styles.logoPreviewArea}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Preview" className={styles.logoImg} />
                    ) : (
                      <ImageIcon size={22} className="text-neutral-400" />
                    )}
                  </div>
                  <div className={styles.logoUploadContent}>
                    <div className={styles.logoUploadTitle}>
                      {logoUrl ? "Logo Siap Digunakan" : "Unggah Logo Outlet Anda"}
                    </div>
                    <div className={styles.logoUploadDesc}>
                      Format PNG / JPG transparan (maks. 5MB). Logo akan otomatis tersinkronisasi ke thermal receipt dan kop surat laporan.
                    </div>
                    <div className={styles.logoActions}>
                      <label className={styles.logoUploadBtn}>
                        <Upload size={13} />
                        <span>{isUploadingLogo ? `Mengunggah (${uploadProgress}%)...` : (logoUrl ? "Ganti Logo" : "Pilih File Logo")}</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          style={{ display: "none" }}
                          disabled={isUploadingLogo || loading}
                          onChange={handleLogoFileChange}
                        />
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          className={styles.logoRemoveBtn}
                          onClick={() => setLogoUrl("")}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Kolom Wajib: Darimana Tahu Tara (Market Collection) */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <span>Darimana Anda mengetahui tentang Tara? *</span>
                  <span className={styles.fieldHint}>Bantu kami mengenal Anda lebih baik</span>
                </label>
                <div className={styles.leadSourceGrid}>
                  {LEAD_SOURCE_OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => setLeadSource(opt)}
                      className={`${styles.leadSourceItem} ${leadSource === opt ? styles.leadSourceItemActive : ""}`}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          border: leadSource === opt ? "4px solid #1e3a2f" : "1.5px solid #cbd5e1",
                          background: "#ffffff"
                        }}
                      />
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>

                {leadSource === "Lainnya" && (
                  <div style={{ marginTop: "6px" }}>
                    <input
                      type="text"
                      required
                      placeholder="Sebutkan dari mana Anda mengetahui Tara..."
                      className={styles.textInput}
                      value={leadSourceOther}
                      onChange={(e) => setLeadSourceOther(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <div className={styles.footerNote}>
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Kata sandi sementara akan dikirimkan otomatis ke email Anda</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-transparent border-none cursor-pointer"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || isUploadingLogo}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftarkan & Mulai 6 Bulan</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

