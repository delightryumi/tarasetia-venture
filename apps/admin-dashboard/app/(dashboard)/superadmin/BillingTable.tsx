"use client";

import React from "react";
import { Sparkles, Calendar, Receipt, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import styles from "./superadmin.module.css";
import { HotelMasterDoc } from "./types";

interface BillingTableProps {
  hotels: HotelMasterDoc[];
  selectedHotelCodes: string[];
  setSelectedHotelCodes: (codes: string[]) => void;
  onToggleExpirationAlert: (hotel: HotelMasterDoc) => void;
  onToggleBillingAlert: (hotel: HotelMasterDoc) => void;
  onManageInvoice: (hotel: HotelMasterDoc) => void;
  onOpenBulkAlert: () => void;
  // Billing history section
  selectedHotelForBilling: HotelMasterDoc | null;
  setSelectedHotelForBilling: (h: HotelMasterDoc | null) => void;
  billingRecords: any[];
  loadingBillingRecords: boolean;
  onTogglePaymentStatus: (record: any) => void;
  onPrintInvoice: (record: any, hotel: HotelMasterDoc) => void;
  onOpenAddPayment: () => void;
}

export const BillingTable: React.FC<BillingTableProps> = ({
  hotels,
  selectedHotelCodes,
  setSelectedHotelCodes,
  onToggleExpirationAlert,
  onToggleBillingAlert,
  onManageInvoice,
  onOpenBulkAlert,
  selectedHotelForBilling,
  setSelectedHotelForBilling,
  billingRecords,
  loadingBillingRecords,
  onTogglePaymentStatus,
  onPrintInvoice,
  onOpenAddPayment,
}) => (
  <>
    {/* ── Billing & Due Date Table ── */}
    <section className={styles.tableCard}>
      <div className={styles.tableHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <h2 className={styles.tableTitle}>
          <Sparkles size={16} style={{ color: "#d9a441" }} />
          Daftar Billing &amp; Jatuh Tempo Tenant
        </h2>
        <button
          onClick={onOpenBulkAlert}
          className={styles.btnSecondary}
          style={{ padding: "0 16px", height: "36px", fontSize: "13px", borderRadius: "var(--s-radius-md)", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Sparkles size={14} style={{ color: "#d9a441" }} />
          <span>Kelola Alert Kustom (Bulk) {selectedHotelCodes.length > 0 && `(${selectedHotelCodes.length} dipilih)`}</span>
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th style={{ width: "40px", padding: "12px 16px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={hotels.length > 0 && selectedHotelCodes.length === hotels.length}
                  onChange={(e) => setSelectedHotelCodes(e.target.checked ? hotels.map(h => h.hotelCode) : [])}
                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                />
              </th>
              <th>Properti Hotel</th>
              <th>Subscription &amp; Due Date</th>
              <th>Status Billing</th>
              <th style={{ textAlign: "center" }}>Warning Expiry (H-3)</th>
              <th style={{ textAlign: "center" }}>Pop-up Suspend</th>
              <th style={{ textAlign: "center" }}>Pesan Alert Kustom</th>
              <th style={{ textAlign: "center" }}>Aksi Billing</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {hotels.map((hotel) => {
              const daysLeft = hotel.billing?.nextDueDate
                ? Math.ceil((new Date(hotel.billing.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <tr key={hotel.hotelCode}>
                  <td style={{ textAlign: "center", padding: "12px 16px" }}>
                    <input
                      type="checkbox"
                      checked={selectedHotelCodes.includes(hotel.hotelCode)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHotelCodes([...selectedHotelCodes, hotel.hotelCode]);
                        } else {
                          setSelectedHotelCodes(selectedHotelCodes.filter(c => c !== hotel.hotelCode));
                        }
                      }}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </td>
                  <td className={styles.tdPrimary}>
                    <div>{hotel.name}</div>
                    <div className={styles.tdMono} style={{ color: "var(--s-muted)", marginTop: "2px" }}>
                      Code: {hotel.hotelCode}
                    </div>
                  </td>
                  <td>
                    <span className="capitalize font-medium text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                      Plan: {hotel.billing?.plan || "basic"} ({hotel.billing?.cycle || "monthly"})
                    </span>
                    <div
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{
                        color: daysLeft !== null && daysLeft < 0 ? "#dc2626" : daysLeft !== null && daysLeft <= 3 ? "#d97706" : "var(--s-muted)",
                        marginTop: "4px",
                      }}
                    >
                      <Calendar size={14} />
                      <span>Due: {hotel.billing?.nextDueDate ? new Date(hotel.billing.nextDueDate).toLocaleDateString("id-ID") : "-"}</span>
                      {daysLeft !== null && (
                        <span style={{ fontSize: "10px" }}>
                          ({daysLeft < 0 ? `Lewat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari lagi`})
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        hotel.billing?.status === "paid" ? styles.badgePaid
                        : hotel.billing?.status === "grace-period" ? styles.badgeGrace
                        : styles.badgeOverdue
                      }`}
                    >
                      {hotel.billing?.status === "paid" && "Paid"}
                      {hotel.billing?.status === "grace-period" && "Grace Period"}
                      {hotel.billing?.status === "overdue" && "Overdue"}
                      {!hotel.billing?.status && "N/A"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => onToggleExpirationAlert(hotel)}
                      className={`${styles.toggleBtn} ${hotel.billing?.showExpirationAlert ? styles.toggleActive : styles.toggleInactive}`}
                      style={{ margin: "0 auto" }}
                    >
                      <span className={`${styles.toggleKnob} ${hotel.billing?.showExpirationAlert ? styles.knobActive : styles.knobInactive}`} />
                    </button>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => onToggleBillingAlert(hotel)}
                      className={`${styles.toggleBtn} ${hotel.billing?.showBillingAlert ? styles.toggleActive : styles.toggleInactive}`}
                      style={{ margin: "0 auto" }}
                    >
                      <span className={`${styles.toggleKnob} ${hotel.billing?.showBillingAlert ? styles.knobActive : styles.knobInactive}`} />
                    </button>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {hotel.billing?.alertMessage ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className="font-bold px-2 py-0.5 rounded text-[10px]"
                          style={{
                            backgroundColor: hotel.billing?.showCustomAlert !== false ? "rgba(21, 128, 61, 0.1)" : "rgba(100, 116, 139, 0.1)",
                            color: hotel.billing?.showCustomAlert !== false ? "#15803d" : "#64748b",
                            border: "1px solid",
                            borderColor: hotel.billing?.showCustomAlert !== false ? "rgba(21, 128, 61, 0.2)" : "rgba(100, 116, 139, 0.2)",
                          }}
                        >
                          {hotel.billing?.showCustomAlert !== false ? "ACTIVE" : "OFF"}
                        </span>
                        <div style={{ fontSize: "11px", color: "var(--s-ink)", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={hotel.billing.alertMessage}>
                          {hotel.billing.alertMessage}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--s-muted)" }}>-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onManageInvoice(hotel)}
                        className={styles.btnPrimary}
                        style={{ padding: "0 16px", height: "30px", fontSize: "12px", borderRadius: "var(--s-radius-sm)", whiteSpace: "nowrap" }}
                      >
                        Kelola Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {hotels.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "var(--s-muted)" }}>
                  Belum ada hotel terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>

    {/* ── Billing History Per Account ── */}
    <section id="billing-history-section" className={styles.tableCard} style={{ marginTop: "32px" }}>
      <div className={styles.tableHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Receipt size={16} style={{ color: "#d9a441" }} />
          <h2 className={styles.tableTitle}>
            {selectedHotelForBilling
              ? `Riwayat Pembayaran & Invoice: ${selectedHotelForBilling.name}`
              : "Riwayat Pembayaran & Invoice Tenant"}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ fontSize: "12px", color: "var(--s-muted)", fontWeight: "500" }}>Pilih Tenant:</span>
          <select
            value={selectedHotelForBilling?.hotelCode || ""}
            onChange={(e) => {
              const hotel = hotels.find(h => h.hotelCode === e.target.value);
              setSelectedHotelForBilling(hotel || null);
            }}
            style={{ height: "32px", padding: "0 12px", fontSize: "12px", borderRadius: "6px", width: "200px", border: "1px solid var(--s-hairline)", backgroundColor: "var(--s-canvas)", color: "var(--s-ink)" }}
          >
            <option value="">-- Pilih Properti --</option>
            {hotels.map(h => (
              <option key={h.hotelCode} value={h.hotelCode}>{h.name}</option>
            ))}
          </select>

          {selectedHotelForBilling && (
            <button
              onClick={onOpenAddPayment}
              className={styles.btnPrimary}
              style={{ height: "30px", fontSize: "12px", padding: "0 14px", borderRadius: "var(--s-radius-sm)" }}
            >
              <Plus size={14} /> Catat Pembayaran
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {!selectedHotelForBilling ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--s-muted)", fontSize: "13px" }}>
            Pilih properti hotel dari dropdown di atas atau klik tombol <strong>&quot;Kelola Invoice&quot;</strong> pada daftar billing untuk memuat riwayat pembayaran.
          </div>
        ) : loadingBillingRecords ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHead}>
                <th>No. Invoice</th>
                <th>Plan &amp; Siklus</th>
                <th>Periode Aktif</th>
                <th>Nominal Tagihan</th>
                <th style={{ textAlign: "center" }}>Status Pembayaran</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {billingRecords.map((record) => (
                <tr key={record.id}>
                  <td className={styles.tdMono} style={{ fontSize: "11px", fontWeight: "600" }}>{record.invoiceId}</td>
                  <td><span className="capitalize font-medium text-xs">{record.plan} ({record.cycle})</span></td>
                  <td style={{ fontSize: "12px", color: "var(--s-muted)" }}>
                    {new Date(record.billingPeriodStart).toLocaleDateString("id-ID")} - {new Date(record.billingPeriodEnd).toLocaleDateString("id-ID")}
                  </td>
                  <td style={{ fontWeight: "600" }}>Rp {Number(record.amount || 0).toLocaleString("id-ID")}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => onTogglePaymentStatus(record)}
                      className={`${styles.badge} ${record.status === "paid" ? styles.badgePaid : styles.badgeOverdue}`}
                      style={{ border: "none", cursor: "pointer", margin: "0 auto" }}
                      title="Klik untuk mengubah status pembayaran"
                    >
                      {record.status === "paid" ? "Lunas" : "Belum Lunas"}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onPrintInvoice(record, selectedHotelForBilling!)}
                        className={styles.smallIconBtn}
                        title="Unduh / Cetak Invoice"
                      >
                        Cetak
                      </button>
                      <button
                        onClick={() => {
                          toast.success("Invoice terkirim!", {
                            description: `Invoice ${record.invoiceId} berhasil dikirim ke ${selectedHotelForBilling!.email}`,
                          });
                        }}
                        className={styles.smallIconBtn}
                        title="Kirim Invoice ke Email"
                      >
                        Kirim
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {billingRecords.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--s-muted)" }}>
                    Belum ada riwayat pembayaran yang tercatat untuk hotel ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  </>
);
