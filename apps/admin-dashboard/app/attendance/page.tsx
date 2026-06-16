"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, FileText, History, Menu } from "lucide-react";
import { ClockInOutCard } from "./components/ClockInOutCard";
import { AttendanceHistory } from "./components/AttendanceHistory";
import { LeaveRequestForm } from "./components/LeaveRequestForm";
import { ShiftStatusBadge } from "./components/ShiftStatusBadge";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { Shift, Staff } from "../(dashboard)/hrd/types";
import styles from "./attendance.module.css";

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillHotelCode = searchParams.get("h") || "";

  const [activeTab, setActiveTab] = useState<"absen" | "ajukan" | "riwayat">("absen");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shift, setShift] = useState<Shift | null>(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [announcement, setAnnouncement] = useState<{ title: string; text: string } | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  
  const [staffSession, setStaffSession] = useState<Staff | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [greeting, setGreeting] = useState("Selamat datang,");

  // Ganti PIN State
  const [showPinModal, setShowPinModal] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Login form state
  const [loginNik, setLoginNik] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Setup dynamic greeting based on Jakarta time
  useEffect(() => {
    const jktTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const hour = new Date(jktTimeStr).getHours();
    
    if (hour >= 4 && hour < 11) setGreeting("Selamat pagi,");
    else if (hour >= 11 && hour < 15) setGreeting("Selamat siang,");
    else if (hour >= 15 && hour < 18) setGreeting("Selamat sore,");
    else setGreeting("Selamat malam,");
  }, []);

  // Cek validasi status aktif & data karyawan terbaru dari Firestore
  useEffect(() => {
    const validateAndRefreshSession = async () => {
      const saved = localStorage.getItem("attendance_session");
      if (!saved) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        const hotelCode = parsed.hotelCode || prefillHotelCode;
        if (!hotelCode) {
          setIsCheckingSession(false);
          return;
        }

        const staffRef = doc(db, `hotels/${hotelCode}/staff/${parsed.id}`);
        const snap = await getDoc(staffRef);

        if (!snap.exists() || snap.data()?.isActive === false) {
          // Karyawan sudah dihapus atau dinonaktifkan
          localStorage.removeItem("attendance_session");
          setStaffSession(null);
        } else {
          // Sesi valid, simpan data terbaru
          const freshData = { id: snap.id, ...snap.data() };
          setStaffSession(freshData as any);
          localStorage.setItem("attendance_session", JSON.stringify(freshData));
        }
      } catch (err) {
        console.error("Error validating staff session:", err);
        // Fallback offline jika query error
        try {
          setStaffSession(JSON.parse(saved));
        } catch (e) {}
      } finally {
        setIsCheckingSession(false);
      }
    };

    validateAndRefreshSession();
  }, [prefillHotelCode]);

  // Fetch shift karyawan hari ini
  useEffect(() => {
    const fetchShift = async () => {
      if (!staffSession) return;
      const hotelCode = staffSession.hotelCode || prefillHotelCode;
      if (!hotelCode) return;
      try {
        const shiftRef = doc(db, `hotels/${hotelCode}/shifts/${staffSession.shiftId}`);
        const shiftSnap = await getDoc(shiftRef);
        if (shiftSnap.exists()) {
          setShift({ id: shiftSnap.id, ...shiftSnap.data() } as Shift);
        }
      } catch (err) {
        console.error("Error fetching shift:", err);
      } finally {
        setLoadingShift(false);
      }
    };
    if (staffSession) {
      fetchShift();
    }
  }, [staffSession, prefillHotelCode]);

  // Fetch announcement
  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!staffSession) return;
      const hotelCode = staffSession.hotelCode || prefillHotelCode;
      if (!hotelCode) return;
      try {
        const docRef = doc(db, `hotels/${hotelCode}/settings/announcement`);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().active) {
          setAnnouncement({
            title: snap.data().title || "PENGUMUMAN",
            text: snap.data().text || "",
          });
        } else {
          setAnnouncement(null);
        }
      } catch (err) {
        console.error("Error fetching announcement:", err);
      }
    };

    const fetchCompany = async () => {
      if (!staffSession) return;
      const hotelCode = staffSession.hotelCode || prefillHotelCode;
      if (!hotelCode) return;
      try {
        const docRef = doc(db, `hotels/${hotelCode}/settings/company`);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().name) {
          setCompanyName(snap.data().name);
        } else {
          const hotelRef = doc(db, `hotels/${hotelCode}`);
          const hotelSnap = await getDoc(hotelRef);
          if (hotelSnap.exists()) {
            setCompanyName(hotelSnap.data().name || "");
          }
        }
      } catch (err) {
        console.error("Error fetching company name:", err);
      }
    };

    if (staffSession) {
      fetchAnnouncement();
      fetchCompany();
    }
  }, [staffSession, prefillHotelCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefillHotelCode) {
      setLoginError("Kode hotel tidak ditemukan pada URL (?h=...)");
      return;
    }
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const staffRef = collection(db, `hotels/${prefillHotelCode}/staff`);
      const q = query(staffRef, where("nik", "==", loginNik.trim()), where("pin", "==", loginPin.trim()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setLoginError("NIK atau PIN salah.");
      } else {
        const staffDoc = snap.docs[0];
        const staffData = { id: staffDoc.id, ...staffDoc.data() } as Staff;
        
        if (staffData.isActive === false) {
          setLoginError("Akun Anda dinonaktifkan.");
          return;
        }

        setStaffSession(staffData);
        localStorage.setItem("attendance_session", JSON.stringify(staffData));
      }
    } catch (err: any) {
      setLoginError("Gagal masuk. Silakan coba lagi.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("attendance_session");
    setStaffSession(null);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    if (newPin !== confirmPin) {
      setPinError("Konfirmasi PIN baru tidak cocok.");
      return;
    }
    if (newPin.length !== 6 || isNaN(Number(newPin))) {
      setPinError("PIN baru harus 6 digit angka.");
      return;
    }
    if (!staffSession) return;
    
    setIsChangingPin(true);
    try {
      const hotelCode = staffSession.hotelCode || prefillHotelCode;
      const { doc, getDoc, updateDoc } = await import("firebase/firestore");
      const ref = doc(db, `hotels/${hotelCode}/staff/${staffSession.id}`);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data()?.pin === oldPin) {
        await updateDoc(ref, { pin: newPin });
        alert("PIN berhasil diubah!");
        setShowPinModal(false);
        setOldPin(""); setNewPin(""); setConfirmPin("");
        
        // update session
        const updatedStaff = { ...staffSession, pin: newPin };
        setStaffSession(updatedStaff);
        localStorage.setItem("attendance_session", JSON.stringify(updatedStaff));
      } else {
        setPinError("PIN Lama salah.");
      }
    } catch (err) {
      setPinError("Terjadi kesalahan sistem.");
    } finally {
      setIsChangingPin(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', boxShadow: 'none' }}>
          <div className={styles.loadingScreen}>
            <div className={styles.spinner} />
            <p>Memeriksa sesi...</p>
          </div>
        </div>
      </div>
    );
  }

  // Jika belum login, tampilkan form PIN
  if (!staffSession) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', boxShadow: 'none' }}>
          <div style={{ background: '#fff', padding: '36px 28px', borderRadius: '24px', width: '90%', maxWidth: '380px', boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 20 }}>
              <img src="/channels/1.png" alt="Setara Venture" style={{ height: 42, objectFit: 'contain' }} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', textAlign: 'center', color: '#111827', letterSpacing: '-0.5px' }}>
              Portal Absensi
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', textAlign: 'center' }}>
              Silakan masuk menggunakan NIK dan PIN Anda
            </p>
            {loginError && (
              <div style={{ width: '100%', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', textAlign: 'center', fontWeight: 500 }}>
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>ID Karyawan (NIK)</label>
                <input
                  type="text"
                  required
                  value={loginNik}
                  onChange={(e) => setLoginNik(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', outline: 'none', background: '#f9fafb', transition: 'all 0.2s', fontSize: '14px' }}
                  placeholder="Masukkan NIK"
                  onFocus={(e) => { e.target.style.borderColor = '#181d26'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>PIN Akses (6 digit)</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', outline: 'none', letterSpacing: '4px', background: '#f9fafb', transition: 'all 0.2s', fontSize: '16px', fontWeight: 600, textAlign: 'center' }}
                  placeholder="••••••"
                  onFocus={(e) => { e.target.style.borderColor = '#181d26'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                style={{ width: '100%', background: '#111827', color: '#fff', padding: '14px', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: isLoggingIn ? 'not-allowed' : 'pointer', marginTop: '8px', border: 'none', transition: 'background 0.2s' }}
                onMouseOver={(e) => { if (!isLoggingIn) e.currentTarget.style.background = '#1f2937'; }}
                onMouseOut={(e) => { if (!isLoggingIn) e.currentTarget.style.background = '#111827'; }}
              >
                {isLoggingIn ? 'Memeriksa...' : 'Masuk Absensi'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setLoginError("Lupa PIN? Silakan hubungi tim HRD / Administrator hotel untuk mereset PIN Anda.")}
                style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginTop: '4px', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                Lupa PIN Akses?
              </button>
            </form>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '24px', lineHeight: 1.5 }}>
              Sistem akan mencatat lokasi GPS Anda.<br/>Pastikan GPS / Lokasi pada perangkat aktif.
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: '#9ca3af', letterSpacing: 1, textTransform: 'lowercase', fontWeight: 600 }}>powered by</span>
            <img src="/channels/1.png" alt="Setara Venture" style={{ height: 24, objectFit: 'contain', filter: 'grayscale(1) opacity(0.6)' }} />
          </div>
        </div>
      </div>
    );
  }

  const hotelCode = staffSession.hotelCode || prefillHotelCode;
  const staffId = staffSession.id;
  const staffName = staffSession.name || "Karyawan";

  return (
    <div className={styles.wrapper}>
      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.avatar} style={{ overflow: "hidden", padding: 4 }}>
              <img src="/channels/4.png" alt="Profile" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <p className={styles.greeting}>{greeting}</p>
              <p className={styles.staffName}>{staffName}</p>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>

            {isMenuOpen && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#1c1c1e', borderRadius: 12, overflow: 'hidden', minWidth: 160, zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid #2c2c2e' }}>
                  <button 
                    onClick={() => { setShowPinModal(true); setIsMenuOpen(false); }} 
                    style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid #2c2c2e', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                  >
                    Ubah PIN Akses
                  </button>
                  <button 
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
                    style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', color: '#ef4444', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                  >
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Company Name Banner */}
        {companyName && (
          <div style={{ padding: "16px 20px 0", textAlign: "left" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1c1c1e", letterSpacing: "-0.3px", textTransform: "uppercase" }}>
              {companyName}
            </h2>
          </div>
        )}

        {/* Shift badge */}
        <div className={styles.shiftRow}>
          <ShiftStatusBadge shift={shift} loading={loadingShift} today={today} />
        </div>

        {/* Announcement Banner */}
        {announcement && (
          <div style={{ padding: "16px 20px 12px" }}>
            <div style={{ background: "rgba(217, 119, 6, 0.08)", border: "1px solid rgba(217, 119, 6, 0.15)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontSize: "14px" }}>📢</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  {announcement.title}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#4b5563", lineHeight: 1.4, fontWeight: 500, whiteSpace: "pre-line" }}>
                {announcement.text}
              </p>
            </div>
          </div>
        )}

        {/* Tab nav */}
        <nav className={styles.tabNav}>
          {(["absen", "ajukan", "riwayat"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {tab === "absen" && <><Clock size={16} /> Absen</>}
                {tab === "ajukan" && <><FileText size={16} /> Ajukan</>}
                {tab === "riwayat" && <><History size={16} /> Riwayat</>}
              </div>
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className={styles.content}>
          {activeTab === "absen" && (
            <ClockInOutCard
              staffId={staffId}
              hotelCode={hotelCode}
              today={today}
              shift={shift}
              loadingShift={loadingShift}
            />
          )}
          {activeTab === "ajukan" && (
            <LeaveRequestForm
              staffId={staffId}
              staffName={staffName}
              hotelCode={hotelCode}
            />
          )}
          {activeTab === "riwayat" && (
            <AttendanceHistory
              staffId={staffId}
              hotelCode={hotelCode}
            />
          )}
        </main>
        
        {/* Footer Setara Venture */}
        <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 'auto' }}>
          <span style={{ fontSize: 10, color: '#9ca3af', letterSpacing: 1, textTransform: 'lowercase', fontWeight: 600 }}>powered by</span>
          <img src="/channels/1.png" alt="Setara Venture" style={{ height: 24, objectFit: 'contain', filter: 'grayscale(1) opacity(0.6)' }} />
        </div>

        {/* Change PIN Modal */}
        {showPinModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: '#000', borderRadius: 16, width: '100%', maxWidth: 360, padding: 24, color: '#fff', border: '1px solid #27272a' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Ganti PIN Akses</h3>
              {pinError && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{pinError}</div>
              )}
              <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>PIN Lama</label>
                  <input type="password" required maxLength={6} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '10px 12px', background: '#1c1c1e', border: '1px solid #27272a', borderRadius: 8, color: '#fff', letterSpacing: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>PIN Baru</label>
                  <input type="password" required maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '10px 12px', background: '#1c1c1e', border: '1px solid #27272a', borderRadius: 8, color: '#fff', letterSpacing: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Konfirmasi PIN Baru</label>
                  <input type="password" required maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '10px 12px', background: '#1c1c1e', border: '1px solid #27272a', borderRadius: 8, color: '#fff', letterSpacing: 4 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={() => { setShowPinModal(false); setPinError(""); setOldPin(""); setNewPin(""); setConfirmPin(""); }} style={{ flex: 1, padding: 12, borderRadius: 8, background: '#1c1c1e', color: '#fff', border: '1px solid #27272a' }}>Batal</button>
                  <button type="submit" disabled={isChangingPin} style={{ flex: 1, padding: 12, borderRadius: 8, background: '#fff', color: '#000', border: 'none', fontWeight: 600 }}>{isChangingPin ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
