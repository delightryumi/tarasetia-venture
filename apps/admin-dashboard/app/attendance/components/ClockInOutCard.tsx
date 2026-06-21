"use client";

import React, { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { SelfieCapture } from "./SelfieCapture";
import { GpsValidator } from "./GpsValidator";
import styles from "../attendance.module.css";
import { Play, Square, CheckCircle2 } from "lucide-react";

interface Props {
  staffId: string;
  hotelCode: string;
  today: string;
  shift: any;
  loadingShift?: boolean;
}

type Step = "idle" | "selfie" | "late_reason" | "gps" | "submitting" | "done";

export function ClockInOutCard({ staffId, hotelCode, today, shift, loadingShift }: Props) {
  const [log, setLog] = useState<any>(null);
  const [loadingLog, setLoadingLog] = useState(true);
  const [step, setStep] = useState<Step>("idle");
  const [clockType, setClockType] = useState<"clock_in" | "clock_out">("clock_in");
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lateReason, setLateReason] = useState("");

  const yyyyMM = today.slice(0, 7);
  const logId = `${staffId}_${today}`;

  // Real-time listener untuk log hari ini
  useEffect(() => {
    if (!staffId || !hotelCode) return;
    const logRef = doc(db, `hotels/${hotelCode}/attendance/${yyyyMM}/logs/${logId}`);
    const unsub = onSnapshot(logRef, (snap) => {
      setLog(snap.exists() ? snap.data() : null);
      setLoadingLog(false);
    });
    return () => unsub();
  }, [staffId, hotelCode, yyyyMM, logId]);

  const hasClockedIn = !!log?.clockIn;
  const hasClockedOut = !!log?.clockOut;

  const checkIfLate = (type: "clock_in" | "clock_out"): boolean => {
    if (type !== "clock_in" || !shift) return false;
    try {
      const [shH, shM] = (shift.startTime as string).split(":").map(Number);
      const tolerance = shift.toleranceMinutes || 0;
      // Gunakan today (yyyy-mm-dd) + tambahkan 'T' agar parse sebagai local time
      const shiftStart = new Date(`${today}T${String(shH).padStart(2,"0")}:${String(shM).padStart(2,"0")}:00`);
      shiftStart.setMinutes(shiftStart.getMinutes() + tolerance);
      const isLate = new Date() > shiftStart;
      console.debug("[checkIfLate]", { shiftStart: shiftStart.toISOString(), now: new Date().toISOString(), isLate });
      return isLate;
    } catch (e) {
      console.error("[checkIfLate] Error:", e);
      return false;
    }
  };

  const handleStartClock = (type: "clock_in" | "clock_out") => {
    setClockType(type);
    setSelfieBase64(null);
    setGpsCoords(null);
    setError(null);
    setSuccessMsg(null);
    setLateReason("");
    setStep("selfie");
  };

  const handleSelfieCapture = (base64: string) => {
    setSelfieBase64(base64);
    if (checkIfLate(clockType)) {
      setLateReason("");
      setStep("late_reason");
    } else {
      setStep("gps");
    }
  };

  const handleGpsCapture = (coords: { lat: number; lng: number }) => {
    setGpsCoords(coords);
    setStep("submitting");
    submitAttendance(coords);
  };

  const submitAttendance = async (coords: { lat: number; lng: number }) => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: clockType,
          staffId,
          hotelCode,
          gps: coords,
          selfieBase64,
          date: today,
          lateReason: lateReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan absensi");
        setStep("idle");
      } else {
        setSuccessMsg(clockType === "clock_in" ? "Clock In berhasil!" : "Clock Out berhasil!");
        setStep("done");
        setTimeout(() => setStep("idle"), 3000);
      }
    } catch (err: any) {
      setError("Koneksi gagal. Coba lagi.");
      setStep("idle");
    }
  };

  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (loadingLog) {
    return <div style={{ padding: 20, textAlign: "center", color: "#71717a", fontSize: 13 }}>Memuat status absensi...</div>;
  }

  return (
    <div>
      {/* iOS Style Status Widget */}
      <div style={{ 
        backgroundColor: "#f4f4f5", 
        borderRadius: 28, 
        padding: "24px 20px", 
        boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
        border: "none",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ color: "#8e8e93", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 6px" }}>
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p style={{ color: "#1c1c1e", fontSize: 52, fontWeight: 800, margin: 0, letterSpacing: "-1.5px", lineHeight: 1 }}>
            {now.replace(".", ":")}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Status Clock In */}
          <div style={{ 
            backgroundColor: hasClockedIn ? "#f0fdf4" : "#ffffff", 
            borderRadius: 20, 
            padding: "16px 12px",
            textAlign: "center",
            border: hasClockedIn ? "none" : "1px solid #e4e4e7"
          }}>
            <p style={{ color: hasClockedIn ? "#16a34a" : "#8e8e93", fontSize: 11, margin: "0 0 6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Clock In</p>
            <p style={{ color: hasClockedIn ? "#15803d" : "#c7c7cc", fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
              {hasClockedIn ? new Date(log.clockIn.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":") : "--:--"}
            </p>
          </div>
          {/* Status Clock Out */}
          <div style={{ 
            backgroundColor: hasClockedOut ? "#eff6ff" : "#ffffff", 
            borderRadius: 20, 
            padding: "16px 12px",
            textAlign: "center",
            border: hasClockedOut ? "none" : "1px solid #e4e4e7"
          }}>
            <p style={{ color: hasClockedOut ? "#3b82f6" : "#8e8e93", fontSize: 11, margin: "0 0 6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Clock Out</p>
            <p style={{ color: hasClockedOut ? "#1d4ed8" : "#c7c7cc", fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
              {hasClockedOut ? new Date(log.clockOut.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":") : "--:--"}
            </p>
          </div>
        </div>

        {/* Status badge */}
        {log?.status && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: 24,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.5,
              backgroundColor: log.status === "hadir" ? "#dcfce7" : log.status === "terlambat" ? "#ffedd5" : "#fee2e2",
              color: log.status === "hadir" ? "#15803d" : log.status === "terlambat" ? "#c2410c" : "#b91c1c"
            }}>
              {log.status.toUpperCase()}
              {log.status === "terlambat" && log.lateMinutes ? (() => {
                const mins = log.lateMinutes;
                if (mins < 60) return ` (${mins} MNT)`;
                const hrs = Math.floor(mins / 60);
                const rem = mins % 60;
                return rem > 0 ? ` (${hrs} J ${rem} M)` : ` (${hrs} J)`;
              })() : ""}
            </span>
            {log.status === "terlambat" && log.lateReason && (
              <p style={{ fontSize: 12, color: "#8e8e93", fontStyle: "italic", margin: "12px 0 0" }}>
                "{log.lateReason}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Feedback messages */}
      {error && (
        <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 12, fontSize: 13, color: "#b91c1c" }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginBottom: 12, fontSize: 14, fontWeight: 600, color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Multi-step flow */}
      {step === "selfie" && (
        <SelfieCapture onCapture={handleSelfieCapture} onCancel={() => setStep("idle")} />
      )}
      {step === "late_reason" && (
        <div className={styles.card} style={{ padding: 20 }}>
          <p className={styles.textTitle} style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, textAlign: "center", color: "#ef4444" }}>
            Anda Terlambat Masuk Shift
          </p>
          <p className={styles.textMuted} style={{ fontSize: 12, marginBottom: 16, textAlign: "center", color: "#a1a1aa" }}>
            Harap isi alasan keterlambatan Anda terlebih dahulu.
          </p>
          <div style={{ marginBottom: 16 }}>
            <textarea
              required
              placeholder="Masukkan alasan keterlambatan..."
              value={lateReason}
              onChange={(e) => setLateReason(e.target.value)}
              style={{
                width: "100%",
                height: 80,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #27272a",
                background: "#1c1c1e",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                resize: "none"
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setStep("idle")}
              className={styles.btnSecondary}
              style={{ flex: 1, padding: 12, borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #27272a", background: "#1c1c1e", color: "#fff" }}
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (!lateReason.trim()) {
                  alert("Alasan keterlambatan wajib diisi.");
                  return;
                }
                setStep("gps");
              }}
              className={styles.btnPrimary}
              style={{ flex: 2, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#ef4444", border: "none", color: "#fff" }}
            >
              Lanjutkan ke Lokasi
            </button>
          </div>
        </div>
      )}
      {step === "gps" && selfieBase64 && (
        <GpsValidator onConfirm={handleGpsCapture} onCancel={() => setStep("idle")} />
      )}
      {step === "submitting" && (
        <div className={styles.card} style={{ textAlign: "center" }}>
          <div className={styles.spinner} style={{ margin: "0 auto 8px" }} />
          <p className={styles.textMuted} style={{ fontSize: 13 }}>Menyimpan absensi...</p>
        </div>
      )}

      {/* Action buttons */}
      {step === "idle" && (
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {/* Jika belum ada jadwal shift sama sekali */}
          {(!shift || shift.id === "NONE" || shift.id === "NOT_FOUND") && !loadingShift && !hasClockedIn && (
            <div style={{ flex: 1, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#b91c1c", fontWeight: 600, fontSize: 14, textAlign: 'center' }}>
              Belum ada jadwal shift hari ini
            </div>
          )}

          {!hasClockedIn && shift && shift.id !== "NONE" && shift.id !== "OFF" && shift.id !== "NOT_FOUND" && (
            <button
              onClick={() => handleStartClock("clock_in")}
              disabled={!!loadingShift}
              className={styles.btnPrimary}
              style={{ flex: 1, padding: "14px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loadingShift ? "not-allowed" : "pointer", transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loadingShift ? 0.6 : 1 }}
            >
              <Play size={18} fill="currentColor" /> {loadingShift ? "Memuat shift..." : "Clock In"}
            </button>
          )}
          {hasClockedIn && !hasClockedOut && (
            <button
              onClick={() => handleStartClock("clock_out")}
              style={{ flex: 1, padding: "14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Square size={18} fill="currentColor" /> Clock Out
            </button>
          )}
          {hasClockedIn && hasClockedOut && (
            <div style={{ flex: 1, padding: 14, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, color: "#16a34a", fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle2 size={18} /> Absensi selesai hari ini
            </div>
          )}
        </div>
      )}
    </div>
  );
}
