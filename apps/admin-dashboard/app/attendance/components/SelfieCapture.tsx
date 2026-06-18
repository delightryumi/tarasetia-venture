"use client";

import React, { useCallback, useRef, useState } from "react";
import styles from "../attendance.module.css";
import { Camera, CheckCircle2 } from "lucide-react";

interface Props {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

export function SelfieCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Browser tidak mendukung kamera. Pastikan Anda menggunakan koneksi aman (HTTPS).");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      setError("Izin kamera ditolak. Aktifkan kamera di browser Anda.");
    }
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Resize ke 400px untuk hemat storage (~50-80KB)
    const maxW = 400;
    const ratio = maxW / video.videoWidth;
    canvas.width = maxW;
    canvas.height = video.videoHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.7);
    setCaptured(base64);
    stopCamera();
  };

  const handleConfirm = () => {
    if (captured) onCapture(captured);
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera]);

  return (
    <div className={styles.card}>
      <p className={styles.textTitle} style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Camera size={18} /> Ambil Selfie
      </p>

      {error && (
        <div style={{ padding: 10, background: "#fef2f2", borderRadius: 8, fontSize: 12, color: "#b91c1c", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <span>{error}</span>
          <button onClick={startCamera} style={{ padding: "6px 12px", background: "#b91c1c", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            Coba Minta Izin Ulang
          </button>
        </div>
      )}

      {/* Video preview */}
      {!captured && (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000", aspectRatio: "4/3", marginBottom: 12 }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
          {!streaming && !error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13 }}>
              Memuat kamera...
            </div>
          )}
        </div>
      )}

      {/* Preview captured */}
      {captured && (
        <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
          <img src={captured} alt="selfie" style={{ width: "100%", transform: "scaleX(-1)" }} />
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        {!captured ? (
          <>
            <button onClick={onCancel} className={styles.btnSecondary} style={{ flex: 1, padding: 12, borderRadius: 8, fontSize: 13, cursor: "pointer", transition: "0.2s" }}>
              Batal
            </button>
            <button
              onClick={capturePhoto}
              disabled={!streaming}
              className={styles.btnPrimary}
              style={{ flex: 2, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: streaming ? "pointer" : "not-allowed", opacity: streaming ? 1 : 0.5, transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Camera size={18} /> Ambil Foto
            </button>
          </>
        ) : (
          <>
            <button onClick={handleRetake} className={styles.btnSecondary} style={{ flex: 1, padding: 12, borderRadius: 8, fontSize: 13, cursor: "pointer", transition: "0.2s" }}>
              Ulangi
            </button>
            <button onClick={handleConfirm} style={{ flex: 2, padding: 12, borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CheckCircle2 size={18} /> Gunakan Foto
            </button>
          </>
        )}
      </div>
    </div>
  );
}
