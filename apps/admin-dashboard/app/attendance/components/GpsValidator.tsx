"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "../attendance.module.css";
import { MapPin, CheckCircle2, RefreshCw } from "lucide-react";

interface Props {
  onConfirm: (coords: { lat: number; lng: number }) => void;
  onCancel: () => void;
}

export function GpsValidator({ onConfirm, onCancel }: Props) {
  const [status, setStatus] = useState<"loading" | "found" | "error">("loading");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLocation = useCallback(() => {
    setStatus("loading");
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Browser Anda tidak mendukung GPS. Gunakan browser Chrome atau Safari.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("found");
      },
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("Izin lokasi ditolak. Aktifkan GPS di browser Anda.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg("Lokasi tidak tersedia. Pastikan GPS aktif.");
        } else {
          setErrorMsg("Timeout mendapatkan lokasi. Coba lagi.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return (
    <div className={styles.card}>
      <p className={styles.textTitle} style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <MapPin size={18} /> Validasi Lokasi
      </p>

      {status === "loading" && (
        <div style={{ textAlign: "center", padding: 20 }}>
          <div className={styles.spinner} style={{ margin: "0 auto 10px" }} />
          <p style={{ color: "#71717a", fontSize: 13 }}>Mendapatkan lokasi GPS Anda...</p>
          <p style={{ color: "#a1a1aa", fontSize: 11, marginTop: 6 }}>Pastikan GPS aktif dan izin lokasi diberikan.</p>
        </div>
      )}

      {status === "found" && coords && (
        <div>
          <div className={styles.statusBoxSuccess} style={{ marginBottom: 12, textAlign: "center" }}>
            <p className={styles.textSuccess} style={{ fontWeight: 600, fontSize: 13, margin: "0 0 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CheckCircle2 size={16} /> Lokasi ditemukan
            </p>
            <p className={styles.textTitle} style={{ fontSize: 11, margin: 0 }}>
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
          </div>
          <p className={styles.textMuted} style={{ fontSize: 11, textAlign: "center", marginBottom: 12 }}>
            Sistem akan memvalidasi apakah Anda berada di area perusahaan.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} className={styles.btnSecondary} style={{ flex: 1, padding: 12, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              Batal
            </button>
            <button
              onClick={() => onConfirm(coords)}
              className={styles.btnPrimary}
              style={{ flex: 2, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <CheckCircle2 size={18} /> Konfirmasi Lokasi
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div>
          <div className={styles.statusBoxError} style={{ marginBottom: 12 }}>
            <p className={styles.textError} style={{ fontSize: 13, margin: 0 }}>{errorMsg}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} className={styles.btnSecondary} style={{ flex: 1, padding: 12, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              Batal
            </button>
            <button
              onClick={fetchLocation}
              className={styles.btnPrimary}
              style={{ flex: 2, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <RefreshCw size={18} /> Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
