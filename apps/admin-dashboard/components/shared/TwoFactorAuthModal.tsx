"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  Copy, 
  Check, 
  Download, 
  AlertCircle, 
  Loader2, 
  X, 
  Lock,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import styles from "./TwoFactorAuthModal.module.css";

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TwoFactorAuthModal({ isOpen, onClose }: TwoFactorAuthModalProps) {
  const { user, activeHotelCode } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [enabledAt, setEnabledAt] = useState<string | null>(null);

  // Setup Step State
  const [step, setStep] = useState<"overview" | "setup" | "backup" | "disable">("overview");
  const [secret, setSecret] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [disableCode, setDisableCode] = useState<string>("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Fetch current 2FA status
  const checkStatus = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/auth/2fa/status?email=${encodeURIComponent(user.email)}&hotelCode=${encodeURIComponent(activeHotelCode || "0")}`);
      const data = await res.json();
      setIsEnabled(data.enabled === true);
      setEnabledAt(data.enabledAt || null);
      setStep("overview");
    } catch (err: any) {
      console.error("Failed to fetch 2FA status:", err);
      setErrorMsg("Gagal memeriksa status 2FA.");
    } finally {
      setLoading(false);
    }
  }, [user?.email, activeHotelCode]);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setVerificationCode("");
      setDisableCode("");
      setErrorMsg("");
    }
  }, [isOpen, checkStatus]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  // Start setup flow
  const handleStartSetup = async () => {
    if (!user?.email) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          hotelCode: activeHotelCode || "0",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menginisialisasi 2FA.");
      }
      setSecret(data.secret);
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setVerificationCode("");
      setStep("setup");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses setup 2FA.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm and enable 2FA
  const handleConfirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || verificationCode.length !== 6) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          hotelCode: activeHotelCode || "0",
          code: verificationCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengaktifkan 2FA. Pastikan kode 6 digit cocok.");
      }
      setRecoveryCodes(data.recoveryCodes || []);
      setIsEnabled(true);
      setEnabledAt(new Date().toISOString());
      setStep("backup");
      toast.success("Two-Factor Authentication berhasil diaktifkan!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memverifikasi kode 2FA.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm disable 2FA
  const handleConfirmDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !disableCode.trim()) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          hotelCode: activeHotelCode || "0",
          code: disableCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menonaktifkan 2FA. Kode tidak cocok.");
      }
      setIsEnabled(false);
      setEnabledAt(null);
      setStep("overview");
      setDisableCode("");
      toast.success("Two-Factor Authentication dinonaktifkan.");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menonaktifkan 2FA.");
    } finally {
      setSubmitting(false);
    }
  };

  // Copy secret key
  const handleCopyKey = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success("Kunci rahasia disalin ke clipboard.");
  };

  // Copy recovery codes
  const handleCopyCodes = () => {
    if (!recoveryCodes.length) return;
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
    toast.success("Semua kode cadangan disalin ke clipboard.");
  };

  // Download recovery codes as .txt
  const handleDownloadCodes = () => {
    if (!recoveryCodes.length) return;
    const content = `TARA HOSPITALITY MANAGEMENT SYSTEM\nTwo-Factor Authentication - Emergency Recovery Codes\nAkun: ${user?.email}\nTanggal: ${new Date().toLocaleString("id-ID")}\n\n` +
      recoveryCodes.map((code, idx) => `${idx + 1}. ${code}`).join("\n") +
      `\n\nPERINGATAN: Simpan kode ini di tempat yang aman. Setiap kode hanya dapat digunakan 1 kali jika Anda kehilangan akses ke aplikasi Google Authenticator.`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tara-2fa-backup-codes-${user?.email?.replace(/[@.]/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("File backup codes berhasil diunduh.");
  };

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-2fa-title"
    >
      <div className={styles.modalCard}>
        {/* Header */}
        <header className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBadge}>
              <Lock size={22} />
            </div>
            <div>
              <h2 id="modal-2fa-title" className={styles.headerTitle}>
                Two-Factor Authentication (2FA)
              </h2>
              <p className={styles.headerSubtitle}>
                Google Authenticator & TOTP (RFC 6238)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={styles.closeButton}
            aria-label="Tutup dialog keamanan"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content Body */}
        <div className={styles.modalBody}>
          {errorMsg && (
            <div className={styles.errorAlert} role="alert">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "#64748b" }}>
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Memeriksa status keamanan...
              </span>
            </div>
          ) : step === "overview" ? (
            <>
              {/* Status Banner */}
              <div className={`${styles.statusBanner} ${isEnabled ? styles.statusActive : styles.statusInactive}`}>
                <div className={styles.statusIconBox}>
                  {isEnabled ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                </div>
                <div className={styles.statusTextGroup}>
                  <h3 className={styles.statusTitle}>
                    {isEnabled ? "Akun Anda Terlindungi 2FA" : "2FA Belum Diaktifkan"}
                  </h3>
                  <p className={styles.statusDesc}>
                    {isEnabled 
                      ? "Setiap kali masuk, sistem akan meminta 6 digit kode dari aplikasi Google Authenticator Anda."
                      : "Tingkatkan keamanan akun hotel dan reservasi Anda dari akses tidak sah dengan mengaktifkan Two-Factor Authentication."}
                  </p>
                  {isEnabled && enabledAt && (
                    <span className={styles.statusDate}>
                      Aktif sejak: {new Date(enabledAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                    </span>
                  )}
                </div>
              </div>

              {/* How it works */}
              <div className={styles.workflowSection}>
                <h4 className={styles.sectionHeaderLabel}>Cara Kerja</h4>
                <div className={styles.stepsList}>
                  <div className={styles.stepPill}>
                    <span className={styles.stepBadgeNumber}>1</span>
                    <span>Pasang Google Authenticator atau aplikasi TOTP kompatibel di smartphone Anda.</span>
                  </div>
                  <div className={styles.stepPill}>
                    <span className={styles.stepBadgeNumber}>2</span>
                    <span>Pindai QR code atau ketik manual kunci rahasia untuk menyinkronkan token.</span>
                  </div>
                  <div className={styles.stepPill}>
                    <span className={styles.stepBadgeNumber}>3</span>
                    <span>Masukkan 6 digit kode yang muncul di layar HP Anda untuk konfirmasi aktivasi.</span>
                  </div>
                </div>
              </div>
            </>
          ) : step === "setup" ? (
            <>
              <div className={styles.instructionHeader}>
                <h3 className={styles.instructionTitle}>Pindai QR Code</h3>
                <p className={styles.instructionSubtitle}>
                  Buka Google Authenticator di smartphone Anda, lalu pindai QR code berikut:
                </p>
              </div>

              {/* QR Code Container */}
              <div className={styles.qrContainer}>
                <div className={styles.qrFrame}>
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Google Authenticator QR Code" 
                      className={styles.qrImage}
                    />
                  ) : (
                    <div style={{ width: "170px", height: "170px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Secret key for manual entry */}
              <div className={styles.secretBox}>
                <div className={styles.secretHeader}>
                  <span className={styles.secretLabel}>Atau Ketik Kunci Manual</span>
                  <button 
                    type="button" 
                    onClick={handleCopyKey} 
                    className={styles.copySecretBtn}
                  >
                    {copiedKey ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedKey ? "Tersalin" : "Salin Kunci"}</span>
                  </button>
                </div>
                <div className={styles.secretText}>
                  {secret}
                </div>
              </div>

              {/* Verification Input Group */}
              <div className={styles.inputFormGroup}>
                <label htmlFor="totp-code" className={styles.inputLabel}>
                  Masukkan 6 Digit Kode Verifikasi
                </label>
                <input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className={styles.codeInput}
                />
              </div>
            </>
          ) : step === "backup" ? (
            <>
              <div className={styles.instructionHeader}>
                <div style={{ width: "48px", height: "48px", borderRadius: "9999px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px auto" }}>
                  <Check size={26} strokeWidth={3} />
                </div>
                <h3 className={styles.instructionTitle}>2FA Berhasil Diaktifkan!</h3>
                <p className={styles.instructionSubtitle}>
                  Simpan kode cadangan berikut jika sewaktu-waktu HP Anda hilang atau rusak:
                </p>
              </div>

              {/* Recovery Codes Grid */}
              <div className={styles.recoveryGrid}>
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className={styles.recoveryCodeItem}>
                    {code}
                  </div>
                ))}
              </div>

              <div className={styles.recoveryActionsRow}>
                <button
                  type="button"
                  onClick={handleCopyCodes}
                  className={styles.outlinedButton}
                >
                  {copiedCodes ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedCodes ? "Tersalin" : "Salin Semua"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCodes}
                  className={styles.outlinedButton}
                >
                  <Download size={14} />
                  <span>Unduh File .TXT</span>
                </button>
              </div>
            </>
          ) : (
            /* Disable confirmation form */
            <>
              <div className={styles.warningBox}>
                <strong>Peringatan:</strong> Menonaktifkan 2FA akan menurunkan tingkat keamanan akun Anda. Masukkan 6 digit kode dari Google Authenticator Anda atau kode recovery cadangan untuk mengonfirmasi.
              </div>

              <div className={styles.inputFormGroup}>
                <label htmlFor="disable-code" className={styles.inputLabel}>
                  Kode 6 Digit atau Kode Cadangan
                </label>
                <input
                  id="disable-code"
                  type="text"
                  autoFocus
                  placeholder="000000 atau KODE-RECOVERY"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.toUpperCase())}
                  className={styles.codeInput}
                />
              </div>
            </>
          )}
        </div>

        {/* Dedicated Stationary Footer */}
        {!loading && (
          <footer className={`${styles.modalFooter} ${step === "overview" && !isEnabled ? styles.footerRightOnly : ""}`}>
            {step === "overview" ? (
              isEnabled ? (
                <>
                  <div />
                  <button
                    type="button"
                    onClick={() => {
                      setDisableCode("");
                      setErrorMsg("");
                      setStep("disable");
                    }}
                    className={styles.dangerButton}
                  >
                    Nonaktifkan 2FA
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartSetup}
                  disabled={submitting}
                  className={styles.primaryButton}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyiapkan QR Code...</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={16} />
                      <span>Mulai Setup Google Authenticator</span>
                    </>
                  )}
                </button>
              )
            ) : step === "setup" ? (
              <>
                <button
                  type="button"
                  onClick={() => setStep("overview")}
                  disabled={submitting}
                  className={styles.secondaryButton}
                >
                  <ArrowLeft size={16} />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEnable}
                  disabled={submitting || verificationCode.length !== 6}
                  className={styles.primaryButton}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Verifikasi & Aktifkan</span>
                    </>
                  )}
                </button>
              </>
            ) : step === "backup" ? (
              <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep("overview");
                    onClose();
                  }}
                  className={styles.primaryButton}
                >
                  Selesai
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep("overview")}
                  disabled={submitting}
                  className={styles.secondaryButton}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDisable}
                  disabled={submitting || !disableCode.trim()}
                  className={styles.dangerSolidButton}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Nonaktifkan</span>
                  )}
                </button>
              </>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
