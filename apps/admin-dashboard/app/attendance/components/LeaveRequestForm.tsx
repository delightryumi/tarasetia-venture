"use client";

import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import styles from "../attendance.module.css";
import { CheckCircle2, ClipboardList, Edit3, Thermometer, Umbrella } from "lucide-react";

interface Props {
  staffId: string;
  staffName: string;
  hotelCode: string;
}

type LeaveType = "izin" | "sakit" | "cuti";

export function LeaveRequestForm({ staffId, staffName, hotelCode }: Props) {
  const [type, setType] = useState<LeaveType>("izin");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dateEnd, setDateEnd] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError("Alasan wajib diisi."); return; }
    if (type === "sakit" && !attachment) {
      setError("Surat Dokter wajib diunggah untuk pengajuan sakit.");
      return;
    }
    setSubmitting(true);
    setError(null);

    let attachmentUrl: string | undefined;
    if (attachment) {
      try {
        const storageRef = ref(storage, `attachments/${hotelCode}/${staffId}/${Date.now()}_${attachment.name}`);
        const snapshot = await uploadBytes(storageRef, attachment);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      } catch (err: any) {
        console.error("Storage upload failed:", err);
        if (type === "sakit") {
          setError(`Gagal mengunggah Surat Dokter: ${err?.message || err?.code || err}. Silakan coba lagi.`);
          setSubmitting(false);
          return;
        }
      }
    }

    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          staffName,
          hotelCode,
          type,
          date,
          dateEnd: type === "cuti" ? dateEnd || date : date,
          reason: reason.trim(),
          attachmentUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengirim pengajuan");
      } else {
        setSuccess(true);
        setReason("");
        setDateEnd("");
        setAttachment(null);
      }
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ 
        backgroundColor: "#f4f4f5", 
        borderRadius: 28, 
        padding: "40px 20px", 
        boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
        border: "none",
        marginBottom: 20,
        textAlign: "center"
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "#16a34a" }}><CheckCircle2 size={48} /></div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>Pengajuan Terkirim!</p>
        <p className={styles.textMuted} style={{ fontSize: 13, marginBottom: 20 }}>Tim HRD akan segera meninjau permohonan Anda.</p>
        <button onClick={() => setSuccess(false)} className={styles.btnSecondary} style={{ padding: "10px 24px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
          Buat Pengajuan Baru
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ 
        backgroundColor: "#f4f4f5", 
        borderRadius: 28, 
        padding: "24px 20px", 
        boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
        border: "none",
        marginBottom: 20
      }}>
        <p style={{ color: "#1c1c1e", fontSize: 18, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 10 }}>
          <ClipboardList size={22} color="#007aff" /> Formulir Pengajuan
        </p>

        {/* Type selector */}
        <div style={{ marginBottom: 14 }}>
          <label className={styles.label}>
            Jenis Pengajuan
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {(["izin", "sakit", "cuti"] as LeaveType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={type === t ? styles.btnPrimary : styles.btnSecondary}
                style={{ 
                  flex: 1, 
                  padding: "10px 4px", 
                  borderRadius: 10, 
                  fontSize: 13, 
                  cursor: "pointer", 
                  transition: "0.2s", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: 6,
                  background: type === t ? "#000" : "#ffffff",
                  color: type === t ? "#fff" : "#1c1c1e",
                  border: type === t ? "none" : "1px solid #e5e5ea",
                  boxShadow: type === t ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 2px rgba(0,0,0,0.02)"
                }}
              >
                {t === "izin" ? <><Edit3 size={14} /> Izin</> : t === "sakit" ? <><Thermometer size={14} /> Sakit</> : <><Umbrella size={14} /> Cuti</>}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 14 }}>
          <label className={styles.label}>
            Tanggal {type === "cuti" ? "Mulai" : ""}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={`${styles.iosInput || styles.input} force-light-input`}
            style={{ borderRadius: 12, padding: "12px" }}
          />
        </div>

        {/* Date end (only for cuti) */}
        {type === "cuti" && (
          <div style={{ marginBottom: 14 }}>
            <label className={styles.label}>
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={dateEnd}
              min={date}
              onChange={(e) => setDateEnd(e.target.value)}
              className={`${styles.iosInput || styles.input} force-light-input`}
              style={{ borderRadius: 12, padding: "12px" }}
            />
          </div>
        )}

        {/* Reason */}
        <div style={{ marginBottom: 14 }}>
          <label className={styles.label}>
            Alasan
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={type === "sakit" ? "Jelaskan keluhan kesehatan Anda..." : "Tuliskan alasan pengajuan..."}
            required
            className={`${styles.iosInput || styles.input} force-light-input`}
            style={{ resize: "none", borderRadius: 12, padding: "12px" }}
          />
        </div>

        {/* Attachment (wajib untuk sakit) */}
        {type === "sakit" && (
          <div style={{ marginBottom: 14 }}>
            <label className={styles.label}>
              Surat Dokter *
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              required={type === "sakit"}
              className={`${styles.iosInput || styles.input} force-light-input`}
              style={{ padding: "10px", borderRadius: 12 }}
            />
          </div>
        )}

        {error && (
          <div style={{ padding: 10, background: "#fef2f2", borderRadius: 8, fontSize: 12, color: "#b91c1c", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={styles.btnPrimary}
          style={{ 
            width: "100%", 
            padding: 14, 
            borderRadius: 12, 
            fontWeight: 700, 
            fontSize: 15, 
            cursor: submitting ? "not-allowed" : "pointer", 
            opacity: submitting ? 0.6 : 1,
            background: "#000000",
            color: "#ffffff",
            border: "none"
          }}
        >
          {submitting ? "Mengirim..." : "Kirim Pengajuan"}
        </button>
      </div>
    </form>
  );
}
