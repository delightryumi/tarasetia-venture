"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Tangkap error secara otomatis ke Sentry
    const eventId = Sentry.captureException(error);

    // Kirim notifikasi otomatis ke Discord
    fetch("/api/alert/discord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Runtime Page Error (Error Boundary)",
        message: error.message || "Unhandled React component error",
        stack: error.stack,
        level: "critical",
        source: "frontend",
        url: typeof window !== "undefined" ? window.location.href : "",
        eventId: eventId ? String(eventId) : undefined,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        <div style={{ margin: "0 auto 16px auto", display: "flex", justifyContent: "center" }}>
          <img
            src="/images/icons-3d/icon-3d-16.webp"
            alt="System Alert"
            style={{
              width: "88px",
              height: "88px",
              objectFit: "contain",
              filter: "drop-shadow(0 10px 18px rgba(220, 38, 38, 0.15))"
            }}
          />
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
          Terjadi Kendala Sistem
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", marginBottom: "24px" }}>
          Sistem telah mencatat kejadian ini ke log pemantauan teknis dan memberitahu tim developer secara otomatis.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "#3b82f6",
              color: "#ffffff",
              border: "none",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Muat Ulang Halaman
          </button>
          <button
            onClick={() => (window.location.href = "/select-module")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Kembali ke Modul
          </button>
        </div>
      </div>
    </div>
  );
}
