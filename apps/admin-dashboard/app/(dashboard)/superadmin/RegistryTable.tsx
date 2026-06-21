"use client";

import React from "react";
import { Sparkles, Globe, Layers, Calendar, CheckCircle, Edit, Trash2, Link } from "lucide-react";
import styles from "./superadmin.module.css";
import { HotelMasterDoc } from "./types";

interface RegistryTableProps {
  hotels: HotelMasterDoc[];
  onEdit: (hotel: HotelMasterDoc) => void;
  onDelete: (hotel: HotelMasterDoc) => void;
  onToggleActive: (hotel: HotelMasterDoc) => void;
  onMergeAccess: (hotel: HotelMasterDoc) => void;
}

export const RegistryTable: React.FC<RegistryTableProps> = ({
  hotels,
  onEdit,
  onDelete,
  onToggleActive,
  onMergeAccess,
}) => (
  <section className={styles.tableCard}>
    <div className={styles.tableHeader}>
      <h2 className={styles.tableTitle}>
        <Sparkles size={16} style={{ color: "#d9a441" }} />
        Registry Partner CRS
      </h2>
    </div>

    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHead}>
            <th>Nama Partner &amp; Kode</th>
            <th>Domain &amp; Subdomain</th>
            <th>Layanan &amp; Billing</th>
            <th>Status Langganan</th>
            <th style={{ textAlign: "center" }}>Status Sistem</th>
            <th style={{ textAlign: "center" }}>Aksi</th>
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {hotels.map((hotel) => (
            <tr key={hotel.hotelCode}>
              <td className={styles.tdPrimary}>
                <div>{hotel.name}</div>
                <div className={styles.tdMono} style={{ color: "var(--s-muted)", marginTop: "2px" }}>
                  Code: {hotel.hotelCode}
                </div>
              </td>
              <td>
                <div className="flex items-center gap-1.5">
                  <Globe size={14} style={{ color: "var(--s-muted)" }} />
                  <span>{hotel.domain || "-"}</span>
                </div>
                <div className={styles.tdMono} style={{ color: "var(--s-muted)", fontSize: "11px", marginTop: "2px" }}>
                  Sub: {hotel.subdomain || `${hotel.hotelCode}.crs.local`}
                </div>
              </td>
              <td>
                <div className="flex items-center gap-1.5">
                  <Layers size={14} style={{ color: "var(--s-muted)" }} />
                  <span className="capitalize font-medium text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                    Plan: {hotel.billing?.plan || "basic"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--s-muted)", marginTop: "4px" }}>
                  <Calendar size={14} />
                  <span>Due: {hotel.billing?.nextDueDate ? new Date(hotel.billing.nextDueDate).toLocaleDateString() : "-"}</span>
                </div>
              </td>
              <td>
                <span
                  className={`${styles.badge} ${
                    hotel.billing?.status === "paid"
                      ? styles.badgePaid
                      : hotel.billing?.status === "grace-period"
                      ? styles.badgeGrace
                      : styles.badgeOverdue
                  }`}
                >
                  {hotel.billing?.status === "paid" && "Paid"}
                  {hotel.billing?.status === "grace-period" && "Grace Period"}
                  {hotel.billing?.status === "overdue" && "Overdue"}
                  {!hotel.billing?.status && "N/A"}
                </span>
              </td>
              <td>
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <button
                    onClick={() => onToggleActive(hotel)}
                    className={`${styles.toggleBtn} ${hotel.active ? styles.toggleActive : styles.toggleInactive}`}
                  >
                    <span className={`${styles.toggleKnob} ${hotel.active ? styles.knobActive : styles.knobInactive}`} />
                  </button>
                  <span
                    className="font-bold"
                    style={{ fontSize: "10px", color: hotel.active ? "#15803d" : "#b91c1c" }}
                  >
                    {hotel.active ? "ACTIVE" : "SUSPENDED"}
                  </span>
                </div>
              </td>
              <td>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onMergeAccess(hotel)}
                    className={styles.actionBtn}
                    style={{ color: "#0ea5e9", borderColor: "rgba(14, 165, 233, 0.15)" }}
                    title="Gabungkan Akses Bisnis"
                  >
                    <Link size={14} />
                  </button>
                  <button onClick={() => onEdit(hotel)} className={styles.actionBtn} title="Edit Konfigurasi">
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(hotel)}
                    className={styles.actionBtn}
                    style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.15)" }}
                    title="Hapus Partner Secara Permanen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {hotels.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--s-muted)" }}>
                Belum ada partner terdaftar. Klik &quot;Registrasi Partner Baru&quot; untuk memulai.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);
