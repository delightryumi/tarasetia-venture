"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import type { Staff, Shift, StaffScheduleOverride } from "./types";
import { useAuth } from "@/context/AuthContext";
import styles from "./hrd.module.css";

interface Props {
  hotelCode: string;
  shifts: Shift[];
}

export function FlexibleShiftPlanner({ hotelCode, shifts }: Props) {
  const { user } = useAuth();
  const getStartOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const getEndDefault = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() + 13);
    d.setHours(23, 59, 59, 999);
    return d;
  };
  const [viewMode, setViewMode] = useState<"weekly" | "custom">("weekly");
  const [unsavedChanges, setUnsavedChanges] = useState<{ [key: string]: string }>({});
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getStartOfToday());
  const [endDate, setEndDate] = useState<Date>(() => getEndDefault(getStartOfToday()));

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<{ [staffId_date: string]: string }>({}); // value = shiftId or "OFF"
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");

  // Generate days array based on startDate and endDate
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const toYMD = (d: Date) => {
    if (!d || isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Staff
        const qStaff = query(collection(db, `hotels/${hotelCode}/staff`), where("isActive", "==", true));
        const snapStaff = await getDocs(qStaff);
        const stList = snapStaff.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
        setStaffList(stList);

        // 2. Fetch schedules for this week for all staff
        // Note: Firestore doesn't allow easy sub-collection queries without collectionGroup
        // To keep it simple, we fetch each staff's schedule sequentially (or parallel)
        const schedMap: { [key: string]: string } = {};
        const startDate = toYMD(days[0]);
        const endDate = toYMD(days[6]);

        await Promise.all(stList.map(async (staff) => {
          const qSched = query(
            collection(db, `hotels/${hotelCode}/staff/${staff.id}/schedules`),
            where("date", ">=", startDate),
            where("date", "<=", endDate)
          );
          const snapSched = await getDocs(qSched);
          snapSched.forEach(docSnap => {
            const data = docSnap.data() as StaffScheduleOverride;
            schedMap[`${staff.id}_${data.date}`] = data.shiftId;
          });
        }));

        // Preserve local unsaved changes across navigations
        Object.entries(unsavedChanges).forEach(([k, v]) => {
          if (v === "") delete schedMap[k];
          else schedMap[k] = v;
        });

        setSchedules(schedMap);
      } catch (err) {
        console.error("Error fetching planner data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hotelCode, startDate, endDate]);

  const handlePrev = () => {
    if (viewMode === "weekly") {
      setStartDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 14); return d; });
      setEndDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 14); return d; });
    }
  };

  const handleNext = () => {
    if (viewMode === "weekly") {
      setStartDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 14); return d; });
      setEndDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 14); return d; });
    }
  };

  const handleToday = () => {
    const today = getStartOfToday();
    setStartDate(today);
    setEndDate(getEndDefault(today));
    setViewMode("weekly");
  };

  const handleModeChange = (mode: "weekly" | "custom") => {
    setViewMode(mode);
    const today = getStartOfToday();
    if (mode === "weekly") {
      setStartDate(today);
      setEndDate(getEndDefault(today));
    }
  };

  const handleCellChange = (staffId: string, dateStr: string, newValue: string) => {
    const key = `${staffId}_${dateStr}`;
    setSchedules(prev => {
      const next = { ...prev };
      if (newValue === "") delete next[key];
      else next[key] = newValue;
      return next;
    });
    setUnsavedChanges(prev => ({ ...prev, [key]: newValue }));
  };

  const handleSaveChanges = async () => {
    const changesCount = Object.keys(unsavedChanges).length;
    if (changesCount === 0) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const promises = Object.entries(unsavedChanges).map(([key, newValue]) => {
        const [staffId, dateStr] = key.split("_");
        const docRef = doc(db, `hotels/${hotelCode}/staff/${staffId}/schedules/${dateStr}`);
        if (newValue === "") return deleteDoc(docRef);
        
        return setDoc(docRef, {
          date: dateStr,
          shiftId: newValue,
          updatedAt: new Date().toISOString(),
          updatedBy: (user as any)?.name || user?.email || "admin",
        });
      });
      await Promise.all(promises);
      setUnsavedChanges({});
      setSaveMessage({ type: "success", text: `Berhasil menyimpan ${changesCount} perubahan jadwal.` });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage({ type: "error", text: "Gagal menyimpan perubahan." });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDayName = (d: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[d.getDay()];
  };

  const formatShortDate = (d: Date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const formatFullDate = (d: Date) => {
    if (!d || isNaN(d.getTime())) return "";
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className={styles.card} style={{ marginTop: 20 }}>
      <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p className={styles.cardTitle}>📅 Plotting Jadwal Dinamis</p>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--s-card-bg)", border: "1px solid var(--s-border)", padding: 4, borderRadius: 8 }}>
            <button onClick={() => handleModeChange("weekly")} className={viewMode === "weekly" ? styles.btnPrimary : styles.btnSecondary} style={{ padding: "4px 12px", border: "none" }}>Mingguan</button>
            <button onClick={() => handleModeChange("custom")} className={viewMode === "custom" ? styles.btnPrimary : styles.btnSecondary} style={{ padding: "4px 12px", border: "none" }}>Kustom</button>
          </div>

          <button onClick={handleToday} className={styles.btnSecondary} style={{ padding: "4px 12px" }}>Hari Ini</button>

          {viewMode === "custom" ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input 
                type="date" 
                value={toYMD(startDate)} 
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime())) setStartDate(d);
                }} 
                className={styles.formInput} style={{ padding: "4px 8px", width: 130 }} 
              />
              <span style={{color: "var(--s-muted)"}}>-</span>
              <input 
                type="date" 
                value={toYMD(endDate)} 
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime())) setEndDate(d);
                }} 
                className={styles.formInput} style={{ padding: "4px 8px", width: 130 }} 
              />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={handlePrev} className={styles.btnSecondary} style={{ padding: "4px 8px" }}>&larr; Prev</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--s-ink)", minWidth: 250, textAlign: "center" }}>
                {formatFullDate(startDate)} - {formatFullDate(endDate)}
              </span>
              <button onClick={handleNext} className={styles.btnSecondary} style={{ padding: "4px 8px" }}>Next &rarr;</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        {saveMessage && (
          <div style={{ padding: "12px 16px", marginBottom: 20, borderRadius: 8, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, background: saveMessage.type === "success" ? "#f0fdf4" : "#fef2f2", color: saveMessage.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${saveMessage.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
            {saveMessage.type === "success" ? "✅" : "⚠️"} {saveMessage.text}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "var(--s-muted)", lineHeight: 1.5, flex: 1, minWidth: 300 }}>
            Ubah slot di bawah ini untuk menentukan jadwal shift karyawan pada tanggal tertentu. <br />
            Pilih "OFF" jika karyawan dijadwalkan libur pada hari tersebut. Jika dibiarkan kosong, karyawan dianggap tidak memiliki jadwal.
            {Object.keys(unsavedChanges).length > 0 && (
              <span style={{ display: "block", marginTop: 8, color: "#d97706", fontWeight: 600 }}>
                ⚠️ Anda memiliki {Object.keys(unsavedChanges).length} perubahan yang belum disimpan.
              </span>
            )}
          </p>
          <button 
            onClick={handleSaveChanges} 
            disabled={Object.keys(unsavedChanges).length === 0 || isSaving}
            className={styles.btnPrimary}
            style={{ opacity: Object.keys(unsavedChanges).length === 0 ? 0.5 : 1, padding: "8px 24px", fontWeight: 600 }}
          >
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Memuat data plotting...</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Cari nama atau NIK staf..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.formInput}
                style={{ flex: '1', minWidth: '200px' }}
              />
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className={styles.formInput}
                style={{ width: '200px' }}
              >
                <option value="">Semua Divisi</option>
                {Array.from(new Set(staffList.map(s => s.division))).filter(Boolean).map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div className={styles.tableContainer} style={{ overflowX: "auto" }}>
            <table className={styles.table} style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 150 }}>Karyawan</th>
                  {days.map(d => (
                    <th key={toYMD(d)} style={{ textAlign: "center", minWidth: 120 }}>
                      <div style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: d.getDay() === 0 ? "#dc2626" : d.getDay() === 6 ? "#ea580c" : "var(--s-ink)" 
                      }}>
                        {formatDayName(d)}
                      </div>
                      <div style={{ 
                        fontSize: 11, 
                        color: d.getDay() === 0 ? "#f87171" : d.getDay() === 6 ? "#fb923c" : "var(--s-muted)", 
                        fontWeight: 500, 
                        marginTop: 4 
                      }}>
                        {formatShortDate(d)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffList.filter(s => {
                  const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nik.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesDiv = selectedDivision === "" || s.division === selectedDivision;
                  return matchesSearch && matchesDiv;
                }).length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "20px 0" }}>Tidak ada staf yang sesuai dengan filter.</td>
                  </tr>
                ) : (
                  staffList.filter(s => {
                    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nik.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesDiv = selectedDivision === "" || s.division === selectedDivision;
                    return matchesSearch && matchesDiv;
                  }).map(staff => {
                    return (
                      <tr key={staff.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--s-ink)" }}>{staff.name}</div>
                          <div style={{ fontSize: 11, color: "var(--s-muted)" }}>{staff.division}</div>
                        </td>
                        {days.map(d => {
                          const dateStr = toYMD(d);
                          const key = `${staff.id}_${dateStr}`;
                          const val = schedules[key] || "";
                          
                          let bgStyle = "transparent";
                          if (val === "OFF") bgStyle = "#fee2e2"; // red-100
                          else if (val !== "") bgStyle = "#dbeafe"; // blue-100

                          return (
                            <td key={dateStr} style={{ padding: "4px 8px", background: bgStyle }}>
                              <select
                                value={val}
                                onChange={(e) => handleCellChange(staff.id, dateStr, e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "6px 2px",
                                  fontSize: 11,
                                  borderRadius: 6,
                                  border: "1px solid var(--s-border)",
                                  background: "#fff",
                                  color: "var(--s-ink)",
                                  outline: "none",
                                  cursor: "pointer",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                <option value="">(Kosong)</option>
                                <option value="OFF" style={{ color: "#dc2626", fontWeight: "bold" }}>OFF / Libur</option>
                                <optgroup label="Pilihan Shift:">
                                  {shifts.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
