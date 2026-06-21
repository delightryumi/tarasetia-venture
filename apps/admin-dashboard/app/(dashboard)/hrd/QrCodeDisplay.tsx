"use client";

import React, { useRef } from "react";
import QRCode from "qrcode";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
}

export function QrCodeDisplay({ hotelCode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = React.useState(false);
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const { protocol, hostname, port } = window.location;
    let attendanceUrl = "";

    // Jika sedang live di domain production, gunakan subdomain staff.mytara.id
    if (hostname.includes("live.mytara.id")) {
      attendanceUrl = `https://staff.mytara.id/?h=${hotelCode}`;
    } else {
      // Fallback untuk testing lokal
      const base = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
      attendanceUrl = `${base}/attendance?h=${hotelCode}`;
    }
    setUrl(attendanceUrl);
  }, [hotelCode]);

  const generateQR = async () => {
    if (!canvasRef.current || !url) return;
    try {
      await QRCode.toCanvas(canvasRef.current, url, {
        width: 240,
        margin: 2,
        color: { dark: "#181d26", light: "#ffffff" },
      });
      setGenerated(true);
    } catch (err) {
      console.error("QR generation error:", err);
    }
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `QR_Absensi_${hotelCode}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const printQR = () => {
    if (!canvasRef.current) return;
    const imgData = canvasRef.current.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>QR Absensi Hotel ${hotelCode}</title>
    <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;padding:32px;text-align:center}h2{font-size:16px;margin-bottom:8px}p{font-size:12px;color:#6b7280;margin-bottom:20px}img{width:240px;height:240px}small{font-size:10px;color:#9ca3af;margin-top:16px;display:block}</style>
    </head><body>
    <h2>Scan untuk Absensi</h2>
    <p>Gunakan kamera HP Anda untuk scan QR ini</p>
    <img src="${imgData}" alt="QR Absensi"/>
    <small>${url}</small>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>📱 QR Code Absensi Karyawan</p>
      </div>
      <div className={styles.cardBody}>
        <p style={{ fontSize: 13, color: "var(--s-muted)", marginBottom: 16, lineHeight: 1.5 }}>
          Cetak atau tampilkan QR Code ini di hotel. Karyawan scan QR → otomatis terbuka halaman absensi dengan Hotel Code yang sudah ter-prefill.
        </p>

        {url && (
          <div style={{ marginBottom: 16, padding: "8px 12px", background: "var(--s-surface-card)", border: "1px solid var(--s-hairline)", borderRadius: 8, fontSize: 12, wordBreak: "break-all", color: "var(--s-muted)" }}>
            URL: <span style={{ fontFamily: "monospace", color: "var(--s-ink)" }}>{url}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <button className={styles.btnPrimary} onClick={generateQR}>
            {generated ? "🔄 Regenerate QR" : "📲 Generate QR Code"}
          </button>
          {generated && (
            <>
              <button className={styles.btnSecondary} onClick={downloadQR}>⬇ Download PNG</button>
              <button className={styles.btnSecondary} onClick={printQR}>🖨 Print QR</button>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            padding: 16,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e4e4e7",
            display: generated ? "block" : "none",
          }}>
            <canvas ref={canvasRef} />
          </div>
          {!generated && (
            <div style={{
              width: 240, height: 240,
              background: "#f4f4f5",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: 13,
            }}>
              QR belum digenerate
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
