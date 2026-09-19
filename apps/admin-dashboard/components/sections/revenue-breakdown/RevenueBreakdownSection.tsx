"use client";

import React, { useState } from "react";
import { useRevenueBreakdown } from "./hooks/useRevenueBreakdown";
import { 
  Receipt, 
  Printer, 
  Download, 
  RotateCw, 
  AlertCircle 
} from "lucide-react";
import styles from "./revenue-breakdown.module.css";

export const RevenueBreakdownSection: React.FC = () => {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    hotelDisplayName,
    loading,
    rows,
    grandTotal,
    includeCancelled,
    setIncludeCancelled,
    refetch,
  } = useRevenueBreakdown();

  const [activeShortcut, setActiveShortcut] = useState<string>("today");

  // Format currency with thousand separators: 370,000
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  // Format date display for title header: DD/MM/YYYY
  const formatHeaderDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Date shortcuts
  const handleShortcut = (type: "today" | "yesterday" | "last7" | "mtd") => {
    setActiveShortcut(type);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (type === "today") {
      const t = toYMD(now);
      setStartDate(t);
      setEndDate(t);
    } else if (type === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (type === "last7") {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      setStartDate(toYMD(past));
      setEndDate(toYMD(now));
    } else if (type === "mtd") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toYMD(first));
      setEndDate(toYMD(now));
    }
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV / Excel Handler (Mengikuti Standar Format VHP / DSI Audit)
  const handleExportCSV = () => {
    if (rows.length === 0) {
      alert("Tidak ada data audit pendapatan untuk diekspor.");
      return;
    }

    const headers = [
      "Audit Date",
      "Room",
      "Name",
      "Company",
      "NoBill",
      "Qty",
      "Price",
      "Gross",
      "Service",
      "Tax",
      "Nett",
      "Usr",
      "First Payment Found"
    ];

    const csvRows = [
      [`${hotelDisplayName}`],
      [`REVENUE BREAKDOWN WITH PAYMENT On : ${formatHeaderDate(startDate)} to ${formatHeaderDate(endDate)}`],
      [`Waktu Audit: ${printTimeStr}`],
      [],
      headers,
      ...rows.map(r => [
        `"${r.auditDate}"`,
        `"${r.room}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.company.replace(/"/g, '""')}"`,
        `"${r.noBill}"`,
        r.qty,
        r.price,
        r.gross,
        r.service,
        r.tax,
        r.nett,
        `"${r.usr}"`,
        `"${r.firstPaymentFound.replace(/"/g, '""')}"`
      ]),
      [],
      [
        "GrandTotal :",
        "",
        "",
        "",
        "",
        grandTotal.qty,
        "",
        grandTotal.gross,
        grandTotal.service,
        grandTotal.tax,
        grandTotal.nett,
        "",
        ""
      ]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Revenue_Breakdown_${hotelDisplayName.replace(/\s+/g, "_")}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printTimeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className={styles.container}>
      {/* Explicit Print Page Settings: Force A4 Landscape & Comfortable Margins */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 landscape;
              margin: 12mm 15mm !important;
            }
          }
        `
      }} />

      {/* 1. Control & Filter Card */}
      <div className={styles.controlCard}>
        <div className={styles.controlRowTop}>
          <div className={styles.titleArea}>
            <div className={styles.iconBadge}>
              <Receipt size={18} />
            </div>
            <div>
              <div className={styles.titleLine}>
                <h1 className={styles.mainTitle}>Revenue Breakdown with Payment</h1>
                <span className={styles.auditBadge}>Front Office Audit</span>
              </div>
              <p className={styles.subTitle}>
                {hotelDisplayName} • Laporan Audit Rincian Pendapatan Kamar & Alokasi Pembayaran
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionsGroup}>
            <button
              type="button"
              onClick={handlePrint}
              className={styles.btnSecondary}
              title="Cetak format cetak audit hotel (A4 Landscape)"
            >
              <Printer size={14} />
              <span>Cetak Laporan</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className={styles.btnSecondary}
              title="Download format CSV / Excel"
            >
              <Download size={14} />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              className={styles.btnPrimary}
              title="Segarkan data audit terbaru"
            >
              <RotateCw size={14} className={loading ? "animate-spin" : ""} />
              <span>{loading ? "Memuat..." : "Proses Data"}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          {/* Date range inputs */}
          <div className={styles.dateRangeWrapper}>
            <div className={styles.dateInputGroup}>
              <label htmlFor="startDate">Periode Dari</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveShortcut("");
                }}
              />
            </div>
            <span className={styles.dateSeparator}>s/d</span>
            <div className={styles.dateInputGroup}>
              <label htmlFor="endDate">Sampai</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveShortcut("");
                }}
              />
            </div>
          </div>

          {/* Quick Filter Shortcuts */}
          <div className={styles.quickFilters}>
            <button
              type="button"
              onClick={() => handleShortcut("today")}
              className={`${styles.quickBtn} ${activeShortcut === "today" ? styles.quickBtnActive : ""}`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleShortcut("yesterday")}
              className={`${styles.quickBtn} ${activeShortcut === "yesterday" ? styles.quickBtnActive : ""}`}
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => handleShortcut("last7")}
              className={`${styles.quickBtn} ${activeShortcut === "last7" ? styles.quickBtnActive : ""}`}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => handleShortcut("mtd")}
              className={`${styles.quickBtn} ${activeShortcut === "mtd" ? styles.quickBtnActive : ""}`}
            >
              Bulan Berjalan (MTD)
            </button>
          </div>

          {/* Include Cancelled Checkbox */}
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeCancelled}
              onChange={(e) => setIncludeCancelled(e.target.checked)}
              className={styles.checkboxInput}
            />
            <span>Sertakan Void / Batal</span>
          </label>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className={styles.kpiBar}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Produksi (RN)</span>
          <span className={styles.kpiValue}>
            {grandTotal.qty} <span className={styles.kpiUnit}>RN ({rows.length} Folio)</span>
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Bruto (Gross)</span>
          <span className={`${styles.kpiValue} ${styles.valEmerald}`}>
            Rp {formatNumber(grandTotal.gross)}
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Service Charge (10%)</span>
          <span className={styles.kpiValue}>Rp {formatNumber(grandTotal.service)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Pajak Daerah (PB1 10%)</span>
          <span className={styles.kpiValue}>Rp {formatNumber(grandTotal.tax)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Netto (Nett)</span>
          <span className={`${styles.kpiValue} ${styles.valSky}`}>
            Rp {formatNumber(grandTotal.nett)}
          </span>
        </div>
      </div>

      {/* 3. Authentic Hotel Report Paper - VHP / DSI Visual System */}
      <div className={styles.paperWrapper}>
        <div className={styles.reportSheet}>
          {/* Header Hotel System */}
          <div className={styles.reportHeader}>
            <h2 className={styles.reportHotelName}>{hotelDisplayName}</h2>
            <div className={styles.reportTitle}>
              REVENUE BREAKDOWN WITH PAYMENT On : {formatHeaderDate(startDate)} to {formatHeaderDate(endDate)}
            </div>
            <div className={styles.reportSubMeta}>
              <span>Waktu Audit / Cetak: {printTimeStr}</span>
              <span>Modul: Front Office & Night Audit</span>
              <span>Total Data: {rows.length} Transaksi ({grandTotal.qty} RN)</span>
            </div>
          </div>

          {/* Table / Loading / Empty Container */}
          <div className={styles.tableScrollContainer}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p className={styles.stateText}>Memproses data audit pendapatan kamar dari server hotel...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className={styles.emptyState}>
                <AlertCircle size={26} className="text-neutral-400" />
                <p className={styles.emptyTitle}>Tidak ada transaksi pendapatan pada periode audit yang dipilih.</p>
                <p className={styles.emptySubtitle}>Silakan sesuaikan tanggal audit atau aktifkan opsi &quot;Sertakan Void / Batal&quot;.</p>
              </div>
            ) : (
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th className={styles.textLeft} title="Tanggal Audit Transaksi">Audit Date</th>
                    <th className={styles.textCenter} title="Nomor Kamar">Room</th>
                    <th className={styles.textLeft} title="Nama Tamu (Guest Name)">Name</th>
                    <th className={styles.textLeft} title="Perusahaan / Sumber Reservasi / OTA">Company</th>
                    <th className={styles.textCenter} title="Nomor Folio / Billing">NoBill</th>
                    <th className={styles.textCenter} title="Jumlah Room Nights (RN)">Qty</th>
                    <th className={styles.textRight} title="Tarif Kamar per Malam">Price</th>
                    <th className={styles.textRight} title="Total Pendapatan Bruto (Gross)">Gross</th>
                    <th className={styles.textRight} title="Alokasi Service Charge 10%">Service</th>
                    <th className={styles.textRight} title="Alokasi Pajak Daerah PB1 10%">Tax</th>
                    <th className={styles.textRight} title="Total Pendapatan Bersih (Nett)">Nett</th>
                    <th className={styles.textCenter} title="Kasir / Operator Audit">Usr</th>
                    <th className={styles.textLeft} title="Alokasi Metode Pembayaran">First Payment Found</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.textLeft}>{row.auditDate}</td>
                      <td className={styles.textCenter}>{row.room}</td>
                      <td className={styles.textLeft} title={row.name}>{row.name}</td>
                      <td className={styles.textLeft} title={row.company}>{row.company}</td>
                      <td className={styles.textCenter}>{row.noBill}</td>
                      <td className={styles.textCenter}>{row.qty}</td>
                      <td className={styles.textRight}>{formatNumber(row.price)}</td>
                      <td className={styles.textRight}>{formatNumber(row.gross)}</td>
                      <td className={styles.textRight}>{formatNumber(row.service)}</td>
                      <td className={styles.textRight}>{formatNumber(row.tax)}</td>
                      <td className={styles.textRight}>{formatNumber(row.nett)}</td>
                      <td className={styles.textCenter}>{row.usr}</td>
                      <td className={styles.textLeft} title={row.firstPaymentFound}>{row.firstPaymentFound}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={styles.grandTotalRow}>
                    <td colSpan={5} className={styles.textRight}>GrandTotal :</td>
                    <td className={styles.textCenter}>{grandTotal.qty}</td>
                    <td className={styles.textRight}>-</td>
                    <td className={styles.textRight}>{formatNumber(grandTotal.gross)}</td>
                    <td className={styles.textRight}>{formatNumber(grandTotal.service)}</td>
                    <td className={styles.textRight}>{formatNumber(grandTotal.tax)}</td>
                    <td className={styles.textRight}>{formatNumber(grandTotal.nett)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
