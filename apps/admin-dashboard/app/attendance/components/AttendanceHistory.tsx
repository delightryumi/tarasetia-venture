"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Calendar } from "lucide-react";
import styles from "../attendance.module.css";

interface Props {
  staffId: string;
  hotelCode: string;
}

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  hadir:    { className: styles.badgeHadir, label: "Hadir" },
  terlambat:{ className: styles.badgeTerlambat, label: "Terlambat" },
  alpa:     { className: styles.badgeAlpa, label: "Alpa" },
  izin:     { className: styles.badgeIzin, label: "Izin" },
  sakit:    { className: styles.badgeSakit, label: "Sakit" },
  cuti:     { className: styles.badgeCuti, label: "Cuti" },
};

export function AttendanceHistory({ staffId, hotelCode }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // KPIs
  const [kpi, setKpi] = useState({
    totalWorkMinutes: 0,
    lateDays: 0,
    totalLateMinutes: 0,
    leaveDays: 0,
  });

  useEffect(() => {
    const fetchHistory = async () => {
      if (!staffId || !hotelCode) return;
      setLoading(true);
      try {
        // Ambil 2 bulan terakhir
        const months: string[] = [];
        const now = new Date();
        for (let i = 0; i < 2; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }

        const allLogs: any[] = [];
        const currentMonthLogs: any[] = [];

        for (let i = 0; i < months.length; i++) {
          const month = months[i];
          const colRef = collection(db, `hotels/${hotelCode}/attendance/${month}/logs`);
          const q = query(colRef, orderBy("date", "desc"));
          const snap = await getDocs(q);
          snap.forEach((d) => {
            const data = d.data();
            if (data.staffId === staffId) {
              const logData = { id: d.id, ...data };
              allLogs.push(logData);
              if (i === 0) currentMonthLogs.push(logData);
            }
          });
        }

        // Ambil leave requests (pending & rejected)
        try {
          const leaveColRef = collection(db, `hotels/${hotelCode}/leave_requests`);
          const leaveSnap = await getDocs(leaveColRef);
          leaveSnap.forEach((d) => {
            const data = d.data();
            if (data.staffId === staffId) {
              if (data.status === "pending" || data.status === "rejected") {
                allLogs.push({
                  id: d.id,
                  date: data.date,
                  isLeaveRequest: true,
                  status: data.status === "pending" ? "pending_leave" : "rejected_leave",
                  leaveType: data.type,
                  reason: data.reason,
                  dateEnd: data.dateEnd,
                  clockIn: null,
                  clockOut: null,
                  durationMinutes: 0,
                });
              } else if (data.status === "approved" && data.date.startsWith(months[0])) {
                // Count approved leaves for current month KPI
                let days = 1;
                if (data.dateEnd && data.dateEnd !== data.date) {
                  const start = new Date(data.date);
                  const end = new Date(data.dateEnd);
                  days = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
                }
                currentMonthLogs.push({ isLeaveRequest: true, status: "approved_leave", days });
              }
            }
          });
        } catch (err) {
          console.error("Error fetching leave requests:", err);
        }

        // Calculate KPI for current month
        let totalWorkMins = 0;
        let lateCount = 0;
        let totalLateMins = 0;
        let leaveCount = 0;

        currentMonthLogs.forEach((l) => {
          const status = l.status?.toLowerCase() || "";
          if (l.isLeaveRequest && status === "approved_leave") {
            leaveCount += l.days || 1;
          } else {
            let mins = l.durationMinutes || 0;
            if (!mins && l.clockIn && l.clockOut) {
              const t1 = new Date(l.clockIn?.time || l.clockIn).getTime();
              const t2 = new Date(l.clockOut?.time || l.clockOut).getTime();
              if (t2 > t1) mins = Math.floor((t2 - t1) / 60000);
            }
            if (mins > 0) totalWorkMins += mins;

            if (status === "terlambat") {
              lateCount += 1;
              if (l.lateMinutes) totalLateMins += l.lateMinutes;
            }
            if (status === "izin" || status === "sakit" || status === "cuti") {
              leaveCount += 1;
            }
          }
        });

        setKpi({
          totalWorkMinutes: totalWorkMins,
          lateDays: lateCount,
          totalLateMinutes: totalLateMins,
          leaveDays: leaveCount,
        });

        // Sort by date desc, take last 14
        allLogs.sort((a, b) => b.date.localeCompare(a.date));
        setLogs(allLogs.slice(0, 14));
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [staffId, hotelCode]);

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center", color: "#71717a", fontSize: 13 }}>Memuat riwayat...</div>;
  }

  if (logs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#a1a1aa" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><Calendar size={48} /></div>
        <p style={{ fontSize: 14 }}>Belum ada riwayat absensi bulan ini.</p>
      </div>
    );
  }

  const formatHours = (mins: number) => {
    if (mins === 0) return <span style={{ fontSize: '1.2em' }}>0</span>;
    
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    
    const Unit = ({ children, color }: { children: React.ReactNode, color?: string }) => (
      <span style={{ fontSize: '0.55em', fontWeight: 700, opacity: 0.7, marginLeft: 2, marginRight: 4, color }}>{children}</span>
    );
    const Num = ({ children, color }: { children: React.ReactNode, color?: string }) => (
      <span style={{ fontSize: '1.2em', color }}>{children}</span>
    );

    if (h > 0 && m > 0) return <><Num>{h}</Num><Unit>JAM</Unit><Num>{m}</Num><Unit>MNT</Unit></>;
    if (h > 0) return <><Num>{h}</Num><Unit>JAM</Unit></>;
    return <><Num>{m}</Num><Unit>MNT</Unit></>;
  };

  return (
    <div>
      {/* KPI Section */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Performa Bulan Ini
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Jam Kerja - Blue Pastel */}
          <div style={{ backgroundColor: "#eff6ff", borderRadius: 16, padding: 16 }}>
            <p style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px", letterSpacing: 0.5 }}>Jam Kerja</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8", margin: 0, letterSpacing: "-0.5px" }}>{formatHours(kpi.totalWorkMinutes)}</p>
          </div>
          {/* Terlambat - Red Pastel */}
          <div style={{ backgroundColor: "#fef2f2", borderRadius: 16, padding: 16 }}>
            <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px", letterSpacing: 0.5 }}>Terlambat</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#b91c1c", margin: 0, letterSpacing: "-0.5px" }}>
              <span style={{ fontSize: '1.2em' }}>{kpi.lateDays}</span> <span style={{ fontSize: '0.55em', fontWeight: 700, opacity: 0.7, marginLeft: 2 }}>HARI</span>
            </p>
          </div>
          {/* Durasi Terlambat - Orange Pastel */}
          <div style={{ backgroundColor: "#fff7ed", borderRadius: 16, padding: 16 }}>
            <p style={{ fontSize: 11, color: "#f97316", fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px", letterSpacing: 0.5 }}>Durasi Terlambat</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#c2410c", margin: 0, letterSpacing: "-0.5px" }}>{formatHours(kpi.totalLateMinutes)}</p>
          </div>
          {/* Izin/Sakit - Purple Pastel */}
          <div style={{ backgroundColor: "#faf5ff", borderRadius: 16, padding: 16 }}>
            <p style={{ fontSize: 11, color: "#a855f7", fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px", letterSpacing: 0.5 }}>Izin / Sakit</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#7e22ce", margin: 0, letterSpacing: "-0.5px" }}>
              <span style={{ fontSize: '1.2em' }}>{kpi.leaveDays}</span> <span style={{ fontSize: '0.55em', fontWeight: 700, opacity: 0.7, marginLeft: 2 }}>HARI</span>
            </p>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Riwayat 14 Hari Terakhir
      </p>
      {logs.map((log) => {
        let badgeClass = styles.badgeDefault;
        let badgeLabel = log.status;

        if (log.isLeaveRequest) {
          const typeLabel = log.leaveType === "sakit" ? "Sakit" : log.leaveType === "cuti" ? "Cuti" : "Izin";
          if (log.status === "pending_leave") {
            badgeClass = styles.badgePending;
            badgeLabel = `${typeLabel} (Pending)`;
          } else if (log.status === "rejected_leave") {
            badgeClass = styles.badgeRejected;
            badgeLabel = `${typeLabel} (Ditolak)`;
          }
        } else {
          const st = STATUS_STYLES[log.status] || { className: styles.badgeDefault, label: log.status };
          badgeClass = st.className;
          badgeLabel = st.label;
        }

        const clockIn = log.clockIn?.time ? new Date(log.clockIn.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--";
        const clockOut = log.clockOut?.time ? new Date(log.clockOut.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--";
        const dur = log.durationMinutes > 0 ? `${Math.floor(log.durationMinutes / 60)}j ${log.durationMinutes % 60}m` : "";
        const dateObj = new Date(log.date + "T00:00:00");
        const dateLabel = dateObj.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });

        return (
          <div key={log.id} className={styles.card} style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p className={styles.textTitle} style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600 }}>{dateLabel}</p>
              <p className={styles.textMuted} style={{ margin: 0, fontSize: 11 }}>
                {log.isLeaveRequest ? (
                  log.dateEnd && log.dateEnd !== log.date ? (
                    `Tgl: ${log.date} s/d ${log.dateEnd} · Alasan: "${log.reason}"`
                  ) : (
                    `Alasan: "${log.reason}"`
                  )
                ) : (
                  `${clockIn} → ${clockOut} ${dur ? `· ${dur}` : ""}`
                )}
              </p>
            </div>
            <span className={`${styles.badge} ${badgeClass}`}>
              {badgeLabel}
              {!log.isLeaveRequest && log.status === "terlambat" && log.lateMinutes ? (() => {
                const mins = log.lateMinutes;
                if (mins < 60) return ` (${mins}m)`;
                const hrs = Math.floor(mins / 60);
                const rem = mins % 60;
                return rem > 0 ? ` (${hrs}j ${rem}m)` : ` (${hrs}j)`;
              })() : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
