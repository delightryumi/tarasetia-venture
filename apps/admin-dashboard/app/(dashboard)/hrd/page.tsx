"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { LiveMonitorTable } from "./LiveMonitorTable";
import { StaffTable } from "./StaffTable";
import { ShiftTable } from "./ShiftTable";
import { LeaveApprovalTable } from "./LeaveApprovalTable";
import { OvertimeApprovalTable } from "./OvertimeApprovalTable";
import { MonthlyReportTable } from "./MonthlyReportTable";
import { PayrollTable } from "./PayrollTable";
import { GpsSettingCard } from "./GpsSettingCard";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { FlexibleShiftPlanner } from "./FlexibleShiftPlanner";
import { AnnouncementSettingCard } from "./AnnouncementSettingCard";
import { CompanySettingCard } from "./CompanySettingCard";
import type { Shift, HrdTab } from "./types";
import styles from "./hrd.module.css";

const VALID_TABS: HrdTab[] = ["staf", "monitor", "shift", "plotting", "pengajuan", "lembur", "laporan", "penggajian", "setting"];

const TAB_METADATA: Record<HrdTab, { title: string; category: string; description: string }> = {
  staf: {
    category: "Personil",
    title: "Manajemen Staf",
    description: "Kelola profil data karyawan, NIK, PIN absensi mandiri, divisi, dan status aktif",
  },
  monitor: {
    category: "Personil",
    title: "Monitor Presensi & GPS",
    description: "Pemantauan kehadiran real-time hari ini dengan verifikasi foto selfie dan koordinat GPS",
  },
  shift: {
    category: "Jadwal & Shift",
    title: "Master Shift Dasar",
    description: "Konfigurasi jam kerja shift, waktu toleransi keterlambatan, dan jam kepulangan",
  },
  plotting: {
    category: "Jadwal & Shift",
    title: "Plotting Jadwal & Roster",
    description: "Penyusunan dan distribusi jadwal kerja berkala karyawan per divisi",
  },
  pengajuan: {
    category: "Pengajuan",
    title: "Pengajuan Cuti & Izin",
    description: "Validasi dan persetujuan pengajuan cuti tahunan, sakit, dan izin ketidakhadiran staf",
  },
  lembur: {
    category: "Pengajuan",
    title: "Persetujuan Lembur",
    description: "Tinjauan klaim kerja lembur (overtime) karyawan sebelum direkapitulasi ke payroll",
  },
  laporan: {
    category: "Kompensasi",
    title: "Rekap Laporan Absensi",
    description: "Rekapitulasi bulanan total jam kerja, keterlambatan, alpa, dan performa kehadiran",
  },
  penggajian: {
    category: "Kompensasi",
    title: "Penggajian Payroll",
    description: "Perhitungan kalkulasi gaji karyawan otomatis berdasarkan kehadiran, lembur, dan denda",
  },
  setting: {
    category: "Pengaturan",
    title: "Setting Lokasi & QR",
    description: "Pengaturan radius geofencing presensi GPS kantor, QR code check-in, dan pengumuman",
  },
};

function HrdPageContent() {
  const { user, activeHotelCode } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabQuery = searchParams.get("tab") as HrdTab | null;
  const initialTab: HrdTab = tabQuery && VALID_TABS.includes(tabQuery) ? tabQuery : "staf";
  const [activeTab, setActiveTab] = useState<HrdTab>(initialTab);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);

  // Sync tab with URL parameter changes
  useEffect(() => {
    if (tabQuery && VALID_TABS.includes(tabQuery)) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const hotelCode = activeHotelCode || (user as any)?.hotelCode || "";

  // Single centralized listener for shifts shared across tabs
  useEffect(() => {
    if (!hotelCode) return;
    const colRef = collection(db, `hotels/${hotelCode}/shifts`);
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shift));
        setShifts(list);
        setLoadingShifts(false);
      },
      (err) => {
        console.error("Error loading shifts in HrdPage:", err);
        setLoadingShifts(false);
      }
    );
    return () => unsub();
  }, [hotelCode]);

  if (!hotelCode) {
    return (
      <div className={styles.page}>
        <p style={{ color: "var(--s-muted)", fontSize: 13 }}>Memuat data hotel...</p>
      </div>
    );
  }

  const currentMeta = TAB_METADATA[activeTab] || TAB_METADATA.staf;

  return (
    <div className={styles.page}>
      {/* Header section synchronized with sidebar selection */}
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 700,
              color: "var(--s-muted)",
              background: "rgba(141, 122, 82, 0.08)",
              padding: "2px 8px",
              borderRadius: "4px",
              border: "1px solid var(--s-hairline)",
            }}
          >
            HRD • {currentMeta.category}
          </span>
        </div>
        <h1 className={styles.pageTitle}>{currentMeta.title}</h1>
        <p className={styles.pageSubtitle}>{currentMeta.description}</p>
      </div>

      {/* Content */}
      {activeTab === "monitor" && <LiveMonitorTable hotelCode={hotelCode} shifts={shifts} />}

      {activeTab === "staf" && (
        <StaffTable
          hotelCode={hotelCode}
          shifts={shifts}
        />
      )}

      {activeTab === "shift" && (
        <ShiftTable
          hotelCode={hotelCode}
          shifts={shifts}
          loading={loadingShifts}
        />
      )}

      {activeTab === "plotting" && (
        <FlexibleShiftPlanner hotelCode={hotelCode} shifts={shifts} />
      )}

      {activeTab === "pengajuan" && <LeaveApprovalTable hotelCode={hotelCode} />}

      {activeTab === "lembur" && <OvertimeApprovalTable hotelCode={hotelCode} />}

      {activeTab === "laporan" && (
        <MonthlyReportTable
          hotelCode={hotelCode}
          shifts={shifts}
        />
      )}

      {activeTab === "penggajian" && (
        <PayrollTable hotelCode={hotelCode} />
      )}

      {activeTab === "setting" && (
        <div>
          <CompanySettingCard hotelCode={hotelCode} />
          <div style={{ marginTop: 20 }}>
            <AnnouncementSettingCard hotelCode={hotelCode} />
          </div>
          <div style={{ marginTop: 20 }}>
            <GpsSettingCard hotelCode={hotelCode} />
          </div>
          <QrCodeDisplay hotelCode={hotelCode} />
        </div>
      )}
    </div>
  );
}

export default function HrdPage() {
  return (
    <Suspense fallback={<div className={styles.page}><p style={{ color: "var(--s-muted)", fontSize: 13 }}>Memuat modul HRD...</p></div>}>
      <HrdPageContent />
    </Suspense>
  );
}
