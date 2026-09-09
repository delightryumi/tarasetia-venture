"use client";

import React from "react";
import { useDSR } from "./hooks/useDSR";
import { DSRReportTab } from "../budgeting/components/DSRReportTab";
import { useDSRExport } from "../budgeting/hooks/useDSRExport";
import { Calendar, Download, Printer, RefreshCw, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import styles from "../budgeting/budgeting.module.css";

export const DSRSection: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    hotelName,
    hotelRoomCount,
    loadingActuals,
    loadingBudget,
    budgetDoc,
    dsrReport,
    refetchActuals,
  } = useDSR();

  const { exportToExcel, exportToPDF, handlePrint } = useDSRExport({
    dsrReport,
    hotelName,
  });

  const changeDateByDays = (delta: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + delta);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, "0");
    const newD = String(dateObj.getDate()).padStart(2, "0");
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const setToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const isLoading = loadingActuals || loadingBudget;

  return (
    <div className={styles.container}>
      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <Calendar size={22} className={styles.primaryIcon} />
            </div>
            <div>
              <h1 className={styles.mainTitle}>Daily Sales Report (DSR)</h1>
              <p className={styles.subTitle}>
                {hotelName} • {hotelRoomCount} Physical Rooms • Auto Generated Daily Revenue vs Target Budget
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Action Bar */}
        <div className={styles.headerRight}>
          <div className={styles.dateControlGroup}>
            <button
              onClick={() => changeDateByDays(-1)}
              className={styles.iconBtn}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.dateInput}
            />

            <button
              onClick={() => changeDateByDays(1)}
              className={styles.iconBtn}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>

            <button onClick={setToday} className={styles.todayBtn}>
              Today
            </button>
          </div>

          <div className={styles.actionBtnGroup}>
            <button
              onClick={refetchActuals}
              disabled={isLoading}
              className={styles.secondaryBtn}
              title="Refresh Transactions"
            >
              <RefreshCw size={15} className={isLoading ? styles.spinning : ""} />
              <span>Refresh</span>
            </button>

            <button onClick={exportToExcel} className={styles.secondaryBtn} title="Download Excel Spreadsheet">
              <Download size={15} />
              <span>Excel</span>
            </button>

            <button onClick={exportToPDF} className={styles.secondaryBtn} title="Download PDF File">
              <FileText size={15} />
              <span>PDF File</span>
            </button>

            <button onClick={handlePrint} className={styles.primaryBtn} title="Print or Save as PDF via Browser">
              <Printer size={15} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Status Banner */}
      {!budgetDoc && (
        <div className={styles.alertBanner}>
          <span>
            ℹ️ Target budget untuk tahun {selectedDate.slice(0, 4)} belum diset di menu <strong>Budgeting</strong>. Angka budget akan bernilai 0 sampai Anda menyimpannya.
          </span>
        </div>
      )}

      {/* Main Report View */}
      <div className={styles.tabContentArea}>
        <DSRReportTab dsrReport={dsrReport} hotelName={hotelName} />
      </div>
    </div>
  );
};
