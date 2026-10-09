"use client";

import React, { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function SentryDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleClientError = async () => {
    try {
      addLog("Memicu Sentry.captureException di browser...");
      const simulatedError = new Error("Crash Simulasi Frontend: Uji Coba Monitoring Sentry & Discord Alert");
      const eventId = Sentry.captureException(simulatedError);
      addLog(`Sentry Event ID: ${eventId || "terkirim"}`);

      // Forward alert ke Discord
      addLog("Mengirim notifikasi real-time ke Discord...");
      const discordRes = await fetch("/api/alert/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Crash Simulasi Frontend (Browser)",
          message: simulatedError.message,
          stack: simulatedError.stack,
          level: "error",
          source: "frontend",
          url: window.location.href,
          eventId: eventId ? String(eventId) : undefined,
        }),
      });

      const discordJson = await discordRes.json();
      if (discordJson.success) {
        addLog("✅ Berhasil terkirim ke Discord!");
        alert("Sukses! Notifikasi error terkirim ke Sentry.io dan Discord!");
      } else {
        addLog("Peringatan: Gagal mengirim ke Discord");
      }
    } catch (err: any) {
      addLog("Error: " + err.message);
    }
  };

  const handleServerError = async () => {
    setLoading(true);
    addLog("Memanggil API server /api/sentry-test...");
    try {
      const res = await fetch("/api/sentry-test");
      const data = await res.json();
      addLog(`Respon API: ${JSON.stringify(data)}`);
      alert("Error server berhasil dikirim ke Sentry! Event ID: " + data.eventId);
    } catch (err: any) {
      addLog("Gagal memanggil API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "700px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "32px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
          Sentry & Discord Alert Diagnostic
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
          Halaman diagnostik untuk menguji pengiriman error dari Tara CRS ke dashboard Sentry.io dan notifikasi Discord.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
          <button
            onClick={handleClientError}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            1. Test Error Frontend (Browser)
          </button>

          <button
            onClick={handleServerError}
            disabled={loading}
            style={{
              background: "#6366f1",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Mengirim..." : "2. Test Error Backend (API Server)"}
          </button>
        </div>

        <div style={{ background: "#0f172a", color: "#38bdf8", padding: "16px", borderRadius: "10px", fontFamily: "monospace", fontSize: "13px", minHeight: "120px", maxHeight: "200px", overflowY: "auto" }}>
          <div style={{ color: "#94a3b8", marginBottom: "8px", borderBottom: "1px solid #334155", paddingBottom: "4px" }}>
            Console Diagnostic Log:
          </div>
          {logs.length === 0 ? (
            <span style={{ color: "#64748b" }}>Klik tombol di atas untuk melihat log pengujian...</span>
          ) : (
            logs.map((log, idx) => <div key={idx}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
