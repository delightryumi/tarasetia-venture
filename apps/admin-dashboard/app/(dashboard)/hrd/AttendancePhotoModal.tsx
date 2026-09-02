"use client";

import React, { useEffect } from "react";
import { X, MapPin, Clock, Calendar, User, ExternalLink } from "lucide-react";
import styles from "./hrd.module.css";

export interface AttendancePhotoModalData {
  photoUrl: string;
  staffName: string;
  type: "in" | "out";
  date: string;
  time?: string;
  status?: string;
  gps?: { lat: number; lng: number };
  lateReason?: string;
  position?: string;
  division?: string;
}

interface Props {
  data: AttendancePhotoModalData | null;
  onClose: () => void;
}

export function AttendancePhotoModal({ data, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (data) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data, onClose]);

  if (!data) return null;

  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isIn = data.type === "in";
  const mapsUrl =
    data.gps && data.gps.lat && data.gps.lng
      ? `https://www.google.com/maps?q=${data.gps.lat},${data.gps.lng}&z=18`
      : null;

  return (
    <div
      className={styles.modalBackdrop}
      style={{ zIndex: 1200, padding: 16 }}
      onClick={onClose}
    >
      <div
        className={styles.modal}
        style={{
          maxWidth: 480,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          background: "var(--s-canvas, #ffffff)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--s-hairline, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--s-surface-card, #f8fafc)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: isIn ? "#dcfce7" : "#dbeafe",
                color: isIn ? "#15803d" : "#1d4ed8",
                border: isIn ? "1px solid #bbf7d0" : "1px solid #bfdbfe",
              }}
            >
              {isIn ? "🟢 Absen Masuk (Clock In)" : "🔵 Absen Pulang (Clock Out)"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              color: "var(--s-muted, #64748b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Photo Container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            backgroundColor: "#09090b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 280,
            maxHeight: 400,
            overflow: "hidden",
          }}
        >
          <img
            src={data.photoUrl}
            alt={`Foto ${data.type} ${data.staffName}`}
            style={{
              maxWidth: "100%",
              maxHeight: 400,
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        {/* Detail Information */}
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--s-ink, #0f172a)" }}>
                {data.staffName}
              </h3>
              {(data.position || data.division) && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--s-muted, #64748b)" }}>
                  {[data.position, data.division].filter(Boolean).join(" • ")}
                </p>
              )}
            </div>
            {data.status && (
              <span
                className={`${styles.badge} ${
                  data.status === "hadir"
                    ? styles.badgeHadir
                    : data.status === "terlambat"
                    ? styles.badgeTerlambat
                    : styles.badgeAlpa
                }`}
              >
                {data.status.toUpperCase()}
              </span>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              padding: "12px",
              background: "var(--s-surface-card, #f8fafc)",
              borderRadius: 10,
              border: "1px solid var(--s-hairline, #e2e8f0)",
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--s-body, #334155)" }}>
              <Calendar size={14} color="var(--s-muted, #64748b)" />
              <span>{formatDate(data.date)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--s-body, #334155)", fontFamily: "monospace", fontWeight: 600 }}>
              <Clock size={14} color="var(--s-muted, #64748b)" />
              <span>{formatTime(data.time)} WIB</span>
            </div>
          </div>

          {/* GPS Coordinates */}
          {data.gps && (
            <div style={{ marginTop: 10, fontSize: 12 }}>
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--s-primary, #2563eb)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  <MapPin size={14} />
                  <span>Lokasi GPS: {data.gps.lat.toFixed(5)}, {data.gps.lng.toFixed(5)}</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--s-muted, #64748b)" }}>
                  <MapPin size={14} />
                  <span>Lokasi GPS tidak tercatat</span>
                </span>
              )}
            </div>
          )}

          {/* Late reason if any */}
          {data.lateReason && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: 8,
                fontSize: 12,
                color: "#92400e",
              }}
            >
              <strong>Alasan Terlambat:</strong> {data.lateReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
