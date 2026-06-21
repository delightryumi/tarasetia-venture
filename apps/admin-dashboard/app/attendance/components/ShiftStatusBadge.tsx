"use client";

import React from "react";
import type { Shift } from "../../(dashboard)/hrd/types";
import { AlertTriangle, Hourglass, PlayCircle, Square } from "lucide-react";

interface Props {
  shift: Shift | null;
  loading: boolean;
  today: string;
}

export function ShiftStatusBadge({ shift, loading, today }: Props) {
  if (loading) {
    return (
      <div style={{ height: 32, background: "#f4f4f5", borderRadius: 8, width: "100%" }} />
    );
  }

  if (!shift || shift.id === "NONE" || shift.id === "OFF" || shift.id === "NOT_FOUND") {
    const isOff = shift?.id === "OFF";
    const isNotFound = shift?.id === "NOT_FOUND";
    const bg = isOff ? "#d1fae5" : "#fef3c7";
    const border = isOff ? "#a7f3d0" : "#fde68a";
    const color = isOff ? "#065f46" : "#92400e";
    const message = isOff ? "Jadwal hari ini: Libur (OFF)" : isNotFound ? "Shift tidak ditemukan di database. Hubungi HRD." : shift?.id === "NONE" ? "Anda belum memiliki jadwal untuk hari ini." : "Shift belum diatur. Hubungi HRD.";
    
    return (
      <div style={{ padding: "8px 12px", background: bg, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12, color: color, display: "flex", alignItems: "center", gap: 8 }}>
        {isOff ? <Hourglass size={14} /> : <AlertTriangle size={14} />} {message}
      </div>
    );
  }

  const now = new Date();
  const [startH, startM] = shift.startTime.split(":").map(Number);
  const [endH, endM] = shift.endTime.split(":").map(Number);
  const shiftStart = new Date(today);
  shiftStart.setHours(startH, startM, 0, 0);
  const shiftEnd = new Date(today);
  shiftEnd.setHours(endH, endM, 0, 0);
  const deadline = new Date(shiftStart);
  deadline.setMinutes(deadline.getMinutes() + shift.toleranceMinutes);

  const isOngoing = now >= shiftStart && now <= shiftEnd;
  const isLate = now > deadline && now <= shiftEnd;
  const isOver = now > shiftEnd;
  const isPending = now < shiftStart;

  const statusColor = isPending
    ? { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" }
    : isLate
    ? { bg: "#fef3c7", border: "#fde68a", text: "#92400e" }
    : isOngoing
    ? { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" }
    : { bg: "#f4f4f5", border: "#e4e4e7", text: "#71717a" };

  const statusLabel = isPending
    ? <><Hourglass size={14} /> Shift dimulai {shift.startTime}</>
    : isLate
    ? <><AlertTriangle size={14} /> Shift berjalan – toleransi {shift.toleranceMinutes} menit</>
    : isOngoing
    ? <><PlayCircle size={14} /> Shift aktif</>
    : <><Square size={14} /> Shift selesai</>;

  return (
    <div style={{
      padding: "8px 14px",
      background: statusColor.bg,
      border: `1px solid ${statusColor.border}`,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: statusColor.text }}>
        {shift.name} &nbsp; {shift.startTime} – {shift.endTime}
      </span>
      <span style={{ fontSize: 11, color: statusColor.text, display: "flex", alignItems: "center", gap: 6 }}>
        {statusLabel}
      </span>
    </div>
  );
}
