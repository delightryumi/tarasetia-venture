"use client";

import React from "react";
import styles from "./superadmin.module.css";

interface PrintInvoiceProps {
  invoice: any;
}

export const PrintInvoice: React.FC<PrintInvoiceProps> = ({ invoice }) => (
  <div className={styles.printInvoiceContainer}>
    <div className={styles.printHeader}>
      <div>
        <span className={styles.printLogo}>CRS Central Billing</span>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}>Central Reservation System Billing</p>
      </div>
      <div className={styles.printMeta}>
        <h3 className={styles.printInvoiceTitle}>INVOICE</h3>
        <p style={{ margin: "4px 0" }}>Nomor: {invoice.invoiceId}</p>
        <p style={{ margin: "4px 0" }}>Tanggal: {new Date(invoice.createdAt).toLocaleDateString("id-ID")}</p>
      </div>
    </div>

    <div className={styles.printBillingDetails}>
      <div className={styles.printDetailBlock}>
        <h4>Diterbitkan Oleh:</h4>
        <strong>CRS Finance Department</strong>
        <p>Email: billing@crs.local</p>
        <p>Central Billing System</p>
      </div>
      <div className={styles.printDetailBlock}>
        <h4>Ditagihkan Kepada:</h4>
        <strong>{invoice.hotelName}</strong>
        <p>Email: {invoice.hotelEmail || "-"}</p>
        <p>Telp: {invoice.hotelPhone || "-"}</p>
        <p>{invoice.hotelAddress || "-"}</p>
      </div>
    </div>

    <table className={styles.printTable}>
      <thead>
        <tr>
          <th>Deskripsi Layanan</th>
          <th>Siklus</th>
          <th>Masa Aktif</th>
          <th style={{ textAlign: "right" }}>Total Biaya</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Layanan Multi-Hotel CRS Cloud Workspace - Plan: {invoice.plan}</td>
          <td style={{ textTransform: "capitalize" }}>{invoice.cycle}</td>
          <td>
            {new Date(invoice.billingPeriodStart).toLocaleDateString("id-ID")} s/d{" "}
            {new Date(invoice.billingPeriodEnd).toLocaleDateString("id-ID")}
          </td>
          <td style={{ textAlign: "right", fontWeight: "bold" }}>
            Rp {Number(invoice.amount).toLocaleString("id-ID")}
          </td>
        </tr>
      </tbody>
    </table>

    <div className={styles.printTotalRow}>
      Total Pembayaran: Rp {Number(invoice.amount).toLocaleString("id-ID")}
    </div>

    <div className={styles.printFooter}>
      <p>Terima kasih atas kerja sama Anda bersama kami.</p>
      <p>Invoice ini sah diterbitkan secara elektronik oleh CRS Central Billing.</p>
    </div>
  </div>
);
