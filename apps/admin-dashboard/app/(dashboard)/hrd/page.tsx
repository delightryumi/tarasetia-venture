"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
import type { Staff, Shift } from "./types";
import styles from "./hrd.module.css";

export default function HrdPage() {
  const { user, activeHotelCode } = useAuth();
  const [activeTab, setActiveTab] = useState<HrdTab>("monitor");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const hotelCode = activeHotelCode || (user as any)?.hotelCode || "";

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
      {activeTab === "monitor" && <LiveMonitorTable hotelCode={hotelCode} />}

      {activeTab === "staf" && (
        <StaffTable
          hotelCode={hotelCode}
          shifts={shifts}
        />
      )}

      {activeTab === "shift" && (
        <ShiftTable
          hotelCode={hotelCode}
          onShiftsLoaded={(list) => setShifts(list)}
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

      {/* Hidden ShiftTable listener to keep shifts in sync for StaffFormModal */}
      {activeTab !== "shift" && (
        <div style={{ display: "none" }}>
          <ShiftTable hotelCode={hotelCode} onShiftsLoaded={(list) => setShifts(list)} />
        </div>
      )}
    </div>
  );
}
