"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import type { AttendanceGeoSetting } from "./types";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
}

export function GpsSettingCard({ hotelCode }: Props) {
  const { user } = useAuth();
  const [geo, setGeo] = useState<AttendanceGeoSetting | null>(null);
  const [form, setForm] = useState({ lat: "", lng: "", radiusMeters: "50" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geoRef = doc(db, `hotels/${hotelCode}/settings/attendance_geo`);

  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const snap = await getDoc(geoRef);
        if (snap.exists()) {
          const data = snap.data() as AttendanceGeoSetting;
          setGeo(data);
          setForm({ lat: String(data.lat), lng: String(data.lng), radiusMeters: String(data.radiusMeters) });
        }
      } catch (err) {
        console.error("Error fetching geo setting:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGeo();
  }, [hotelCode]);

  const handleDetectLocation = () => {
    setDetecting(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setDetecting(false);
      },
      () => {
        setError("Gagal mendapatkan lokasi. Aktifkan GPS dan izinkan akses lokasi.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    const radius = parseInt(form.radiusMeters);
    if (isNaN(lat) || isNaN(lng)) { setError("Koordinat tidak valid."); return; }
    if (isNaN(radius) || radius < 10) { setError("Radius minimal 10 meter."); return; }

    setSaving(true);
    setError(null);
    try {
      const payload: AttendanceGeoSetting = {
        lat, lng, radiusMeters: radius,
        updatedAt: new Date().toISOString(),
        updatedBy: (user as any)?.name || user?.email || "admin",
      };
      await setDoc(geoRef, payload, { merge: true });
      setGeo(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan setting.");
    } finally {
      setSaving(false);
    }
  };

  const mapsUrl = form.lat && form.lng
    ? `https://www.google.com/maps?q=${form.lat},${form.lng}&z=18`
    : null;

  if (loading) return <div className={styles.loading}>Memuat pengaturan GPS...</div>;

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.cardTitle}>📍 Pengaturan Lokasi Absensi (GPS Geofencing)</p>
        </div>
        <div className={styles.cardBody}>
          <p style={{ fontSize: 13, color: "var(--s-muted)", marginBottom: 20, lineHeight: 1.5 }}>
            Tentukan titik koordinat hotel dan radius absensi. Karyawan hanya dapat clock in/out jika berada dalam radius yang ditentukan.
          </p>

          {error && (
            <div className={styles.errorBox}>
              {error}
            </div>
          )}
          {saved && (
            <div className={styles.successBox} style={{ padding: 12 }}>
              <p className={styles.successText} style={{ margin: 0, fontSize: 13 }}>✅ Pengaturan lokasi berhasil disimpan.</p>
            </div>
          )}

          {/* Current saved */}
          {geo && (
            <div style={{ padding: 12, background: "var(--s-surface-card)", border: "1px solid var(--s-hairline)", borderRadius: 8, marginBottom: 20, fontSize: 12 }}>
              <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--s-ink)" }}>Koordinat Aktif:</p>
              <p style={{ margin: "0 0 2px", color: "var(--s-muted)" }}>
                Lat: {geo.lat} &nbsp; | &nbsp; Lng: {geo.lng} &nbsp; | &nbsp; Radius: {geo.radiusMeters}m
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--s-muted)" }}>
                Diperbarui: {new Date(geo.updatedAt).toLocaleString("id-ID")} oleh {geo.updatedBy}
              </p>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleDetectLocation}
                disabled={detecting}
                style={{ fontSize: 13 }}
              >
                {detecting ? "Mendeteksi..." : "📡 Gunakan Lokasi Saya Sekarang"}
              </button>
            </div>

            <div className={styles.formGrid2} style={{ marginBottom: 14 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Latitude *</label>
                <input
                  className={styles.formInput}
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  placeholder="-8.409518"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Longitude *</label>
                <input
                  className={styles.formInput}
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  placeholder="115.188919"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 16 }}>
              <label className={styles.formLabel}>Radius Absensi (meter) *</label>
              <input
                type="number"
                className={styles.formInput}
                value={form.radiusMeters}
                onChange={(e) => setForm((f) => ({ ...f, radiusMeters: e.target.value }))}
                min={10}
                max={500}
                required
                style={{ maxWidth: 180 }}
              />
              <span style={{ fontSize: 11, color: "var(--s-muted)" }}>
                Karyawan harus berada dalam radius ini untuk bisa absensi. Rekomendasi: 50–100m.
              </span>
            </div>

            {/* Google Maps preview link */}
            {mapsUrl && (
              <div style={{ marginBottom: 16 }}>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: "#2563eb", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  🗺 Verifikasi di Google Maps ↗
                </a>
              </div>
            )}

            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Pengaturan GPS"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
