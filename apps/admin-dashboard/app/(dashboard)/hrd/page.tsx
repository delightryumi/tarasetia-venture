"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { HrdTabs, type HrdTab } from "./HrdTabs";
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
import type { Shift } from "./types";
import styles from "./hrd.module.css";

export default function HrdPage() {
  const { user, activeHotelCode } = useAuth();
  const [activeTab, setActiveTab] = useState<HrdTab>("monitor");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);

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

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>HRD & Absensi</h1>
        <p className={styles.pageSubtitle}>Manajemen karyawan, shift, absensi, dan laporan payroll</p>
      </div>

      {/* Tabs */}
      <HrdTabs activeTab={activeTab} onChange={setActiveTab} />

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
