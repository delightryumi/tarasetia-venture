"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import styles from "./onboarding.module.css";

export default function OnboardingPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tokenData, setTokenData] = useState<any>(null);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/hotels/onboarding/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Token tidak valid");
        } else {
          setTokenData(data.data);
        }
      } catch (err) {
        setError("Gagal terhubung ke server.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !address || !phone || !agreed) {
      setError("Mohon lengkapi semua field dan setujui Syarat & Ketentuan.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/hotels/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          businessName,
          address,
          phone
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyelesaikan pendaftaran.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Loader2 className={`${styles.loadingSpinner} text-neutral-400`} size={32} />
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ padding: "40px", textAlign: "center" }}>
          <h2 style={{ color: "#991b1b", marginBottom: "16px" }}>Akses Ditolak</h2>
          <p style={{ color: "#4b5563" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.headerTitle}>Pendaftaran Berhasil</h1>
          </div>
          <div className={styles.successState}>
            <CheckCircle2 className={styles.successIcon} />
            <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>Selamat Datang di Setara Venture CRS</h2>
            <p style={{ color: "#4b5563", marginBottom: "24px", lineHeight: "1.6" }}>
              Sistem Anda sedang disiapkan. Kami telah mengirimkan detail kredensial dan kata sandi sementara ke email Anda (<strong>{tokenData?.email}</strong>).
            </p>
            <button onClick={() => router.push("/login")} className={styles.submitBtn}>
              Menuju Halaman Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Registrasi Partner</h1>
          <p className={styles.headerSubtitle}>Lengkapi profil bisnis Anda untuk memulai</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.body}>
          {error && <div className={styles.errorBox}>{error}</div>}
          
          <div className={styles.alertBox}>
            <strong>Paket Berlangganan:</strong> {tokenData?.plan?.toUpperCase()}<br/>
            <strong>Email Terdaftar:</strong> {tokenData?.email}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nama Usaha (Hotel / Resto)</label>
            <input 
              type="text" 
              required
              placeholder="Contoh: Grand Sunset Resort"
              className={styles.input}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nomor WhatsApp / Telepon</label>
            <input 
              type="text" 
              required
              placeholder="+62 812..."
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Alamat Lengkap</label>
            <textarea 
              required
              placeholder="Jalan, Kota, Provinsi..."
              className={styles.textarea}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Syarat, Ketentuan, dan Kontrak Layanan</label>
            <div className={styles.tosContainer}>
              <h4>KONTRAK PENGGUNAAN LAYANAN SETARA VENTURE HOSPITALITY</h4>
              <p>Dengan mendaftar dan menggunakan layanan perangkat lunak Central Reservation System ("Sistem") yang disediakan oleh Setara Venture ("Penyedia"), Anda ("Klien") menyetujui seluruh ketentuan yang mengikat berikut ini:</p>
              
              <p><strong>1. PEMBERIAN LISENSI DAN PENGGUNAAN</strong><br/>
              Penyedia memberikan Klien hak non-eksklusif, tidak dapat dipindahtangankan, dan dapat dibatalkan untuk mengakses serta menggunakan Sistem secara komersial dalam batasan paket berlangganan ("Paket") yang telah dipilih. Hak akses diberikan semata-mata untuk operasional internal properti Klien.</p>

              <p><strong>2. KEPEMILIKAN DATA DAN KERAHASIAAN</strong><br/>
              Klien memegang kepemilikan penuh atas seluruh data pelanggan, transaksi, dan aset operasional yang diinput ke dalam Sistem. Penyedia bertindak sebagai pemroses data dan berkewajiban melindungi kerahasiaan data menggunakan standar enkripsi dan isolasi multi-partner yang wajar. Penyedia tidak berhak membagikan atau memonetisasi data Klien kepada pihak ketiga tanpa izin tertulis.</p>

              <p><strong>3. KETERSEDIAAN LAYANAN (SERVICE LEVEL AGREEMENT)</strong><br/>
              Penyedia berkomitmen untuk menjaga ketersediaan layanan (Uptime) sebesar 99.5% setiap bulannya. Pemeliharaan sistem terjadwal akan diinformasikan selambat-lambatnya 24 jam sebelum pelaksanaan. Penyedia tidak bertanggung jawab atas gangguan yang disebabkan oleh force majeure, pemutusan jaringan infrastruktur Klien, atau kelalaian pengguna akhir.</p>

              <p><strong>4. KEWAJIBAN PEMBAYARAN DAN PENANGGUHAN</strong><br/>
              Klien wajib melunasi tagihan layanan berdasarkan siklus penagihan yang telah disepakati. Kegagalan Klien dalam melunasi tagihan dalam batas masa tenggang (Grace Period) 7 hari kerja setelah tanggal jatuh tempo akan mengakibatkan penangguhan layanan otomatis (Auto-Suspend). Sistem tidak dapat diakses dan seluruh aktivitas read/write akan dibekukan hingga Klien melunasi tunggakan.</p>

              <p><strong>5. PERLINDUNGAN AKSES DAN KEAMANAN AKUN</strong><br/>
              Klien bertanggung jawab mutlak atas keamanan kredensial akun, perlindungan akses API, serta penyalahgunaan yang terjadi di bawah akun mereka. Penyedia berhak mencabut hak akses admin tertentu jika terdeteksi indikasi pelanggaran keamanan sistem.</p>

              <p><strong>6. PEMBATALAN DAN PENGHAPUSAN DATA</strong><br/>
              Klien dapat membatalkan langganan kapan saja. Jika pembatalan diajukan, data Klien akan tetap diamankan dalam masa retensi selama 30 hari. Lewat dari masa tersebut, Penyedia memiliki hak untuk menghapus secara berantai (Cascade Delete) seluruh konfigurasi, metadata, dan riwayat transaksi operasional tanpa kemungkinan pemulihan data.</p>
              
              <p><em>Kontrak ini sah secara hukum digital. Dengan mencentang kotak di bawah ini, Klien menyatakan telah membaca, memahami, dan menyetujui semua pasal dalam kontrak penggunaan layanan.</em></p>
            </div>
            
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                className={styles.checkbox}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>Saya (Klien/Pemilik Usaha) setuju dan mengikatkan diri dengan Kontrak Layanan serta Kebijakan Privasi dari Setara Venture.</span>
            </label>
          </div>

          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={!agreed || submitting}
          >
            {submitting ? (
              <Loader2 className={styles.loadingSpinner} size={20} />
            ) : "Selesaikan Pendaftaran"}
          </button>
        </form>
      </div>
    </div>
  );
}
