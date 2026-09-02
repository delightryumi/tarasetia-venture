"use client";

import React from "react";
import { Camera } from "lucide-react";

interface Props {
  photoUrl?: string;
  staffName: string;
  type: "in" | "out";
  time?: string;
  onClick?: () => void;
  size?: number;
}

export function AttendancePhotoThumbnail({
  photoUrl,
  staffName,
  type,
  onClick,
  size = 36,
}: Props) {
  if (!photoUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: "rgba(0, 0, 0, 0.04)",
          border: "1px dashed var(--s-hairline, #e2e8f0)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--s-muted, #94a3b8)",
          fontSize: 10,
          flexShrink: 0,
        }}
        title={`Belum ada foto ${type === "in" ? "Clock In" : "Clock Out"}`}
      >
        <Camera size={14} opacity={0.6} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: 8,
        overflow: "hidden",
        border: type === "in" ? "1.5px solid #22c55e" : "1.5px solid #3b82f6",
        padding: 0,
        background: "#000",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.08)";
        e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      }}
      title={`Foto ${type === "in" ? "Masuk" : "Pulang"} (${staffName}) - Klik untuk perbesar`}
    >
      <img
        src={photoUrl}
        alt={`Foto ${type} ${staffName}`}
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          background: type === "in" ? "#16a34a" : "#2563eb",
          color: "#fff",
          fontSize: 8,
          fontWeight: 700,
          padding: "1px 3px",
          borderTopLeftRadius: 4,
          lineHeight: 1,
        }}
      >
        {type === "in" ? "IN" : "OUT"}
      </div>
    </button>
  );
}
