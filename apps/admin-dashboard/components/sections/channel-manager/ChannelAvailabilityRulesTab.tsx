"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Plus, Trash2, Calendar, ShieldAlert, CheckCircle2, RefreshCw, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import styles from "./ChannelAvailabilityRules.module.css";

interface AvailabilityRule {
    id: string;
    title: string;
    type: "max_availability" | "close_out" | "min_availability";
    value?: number | null;
    start_date: string;
    end_date: string;
    days: string[];
    affected_channels: string[];
    affected_room_types: string[];
    is_active?: boolean;
}

interface Props {
    hotelCode: string;
    roomTypes?: Array<{ id: string; name: string }>;
}

export function ChannelAvailabilityRulesTab({ hotelCode, roomTypes = [] }: Props) {
    const [rules, setRules] = useState<AvailabilityRule[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    // Form state
    const [title, setTitle] = useState<string>("");
    const [ruleType, setRuleType] = useState<"max_availability" | "close_out">("max_availability");
    const [limitValue, setLimitValue] = useState<number>(2);
    const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split("T")[0];
    });
    const [selectedChannel, setSelectedChannel] = useState<string>("agoda");
    const [selectedDays, setSelectedDays] = useState<string[]>(["mo", "tu", "we", "th", "fr", "sa", "su"]);

    const fetchRules = async () => {
        if (!hotelCode) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/channex/rules?hotelCode=${hotelCode}`);
            const data = await res.json();
            if (data.success && data.rules) {
                setRules(data.rules);
            }
        } catch (err: any) {
            console.error("Error fetching rules:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, [hotelCode]);

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Nama aturan wajib diisi.");
            return;
        }

        setSaving(true);
        try {
            const newRulePayload = {
                title: title.trim(),
                type: ruleType,
                value: ruleType === "max_availability" ? limitValue : null,
                start_date: startDate,
                end_date: endDate,
                days: selectedDays,
                affected_channels: [selectedChannel],
                affected_room_types: ["all"]
            };

            const res = await fetch("/api/channex/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    rule: newRulePayload
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setIsModalOpen(false);
                fetchRules();
                // Reset form
                setTitle("");
                setLimitValue(2);
            } else {
                toast.error(data.error || "Gagal membuat aturan");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan jaringan.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRule = async (ruleId: string, ruleTitle: string) => {
        if (!confirm(`Hapus aturan alokasi '${ruleTitle}'?`)) return;

        try {
            const res = await fetch(`/api/channex/rules?hotelCode=${hotelCode}&ruleId=${ruleId}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Aturan berhasil dihapus.");
                setRules(prev => prev.filter(r => r.id !== ruleId));
            } else {
                toast.error(data.error || "Gagal menghapus aturan");
            }
        } catch (err) {
            toast.error("Gagal menghapus aturan.");
        }
    };

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const allDays = [
        { code: "mo", label: "Sen" },
        { code: "tu", label: "Sel" },
        { code: "we", label: "Rab" },
        { code: "th", label: "Kam" },
        { code: "fr", label: "Jum" },
        { code: "sa", label: "Sab" },
        { code: "su", label: "Min" }
    ];

    return (
        <div className={styles.container}>
            {/* Top Toolbar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <Sliders size={16} color="#1e3a2f" />
                        <span>Channel Availability Rules (Yield Management &amp; Batas Kuota Saluran)</span>
                    </div>
                    <span className={styles.desc}>
                        Atur pembatasan kuota kamar (Max Availability) atau penutupan selektif (Close Out) pada saluran OTA tertentu tanpa memengaruhi penjualan saluran lainnya.
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={fetchRules}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                        title="Segarkan Aturan"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className={styles.btnAdd}
                    >
                        <Plus size={14} />
                        <span>Buat Aturan Alokasi Baru</span>
                    </button>
                </div>
            </div>

            {/* Rules Table */}
            <div className={styles.tableCard}>
                <table className={styles.rulesTable}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Nama Aturan</th>
                            <th className={styles.th}>Jenis Aturan</th>
                            <th className={styles.th}>Saluran OTA Terkena</th>
                            <th className={styles.th}>Batas Kuota / Nilai</th>
                            <th className={styles.th}>Periode Berlaku</th>
                            <th className={styles.th}>Hari Aktif</th>
                            <th className={styles.th} style={{ textAlign: "right" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map(r => {
                            const isCloseOut = r.type === "close_out";

                            return (
                                <tr key={r.id} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.title}</div>
                                        <div style={{ fontSize: "10px", color: "#64748b" }}>ID: {r.id}</div>
                                    </td>
                                    <td className={styles.td}>
                                        <span className={`${styles.badgeType} ${isCloseOut ? styles.typeCloseOut : styles.typeMax}`}>
                                            {isCloseOut ? "🛑 Close Out Saluran" : "⚡ Max Availability"}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                            {(r.affected_channels || []).map(ch => (
                                                <span key={ch} style={{ fontSize: "11px", fontWeight: 600, padding: "2px 6px", background: "#f1f5f9", borderRadius: "4px", color: "#334155" }}>
                                                    {ch.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        {isCloseOut ? (
                                            <span style={{ color: "#b91c1c", fontWeight: 700 }}>Penjualan Ditutup (0 Kamar)</span>
                                        ) : (
                                            <span>Maks <b>{r.value} Kamar</b> / Hari</span>
                                        )}
                                    </td>
                                    <td className={styles.td}>
                                        <div style={{ fontSize: "11px", color: "#334155" }}>
                                            {r.start_date} <span style={{ color: "#94a3b8" }}>s/d</span> {r.end_date}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <div className={styles.daysRow}>
                                            {allDays.map(d => (
                                                <span
                                                    key={d.code}
                                                    className={`${styles.dayPill} ${(r.days || []).includes(d.code) ? styles.dayPillActive : ""}`}
                                                >
                                                    {d.label}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className={styles.td} style={{ textAlign: "right" }}>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteRule(r.id, r.title)}
                                            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                                            title="Hapus Aturan Ini"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {rules.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                                    Belum ada aturan pembatasan kuota saluran. Klik tombol "Buat Aturan Alokasi Baru" untuk menambahkan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Rule Modal */}
            {isModalOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>Buat Aturan Pembatasan Saluran OTA</div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRule}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Nama / Deskripsi Aturan</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Contoh: Batas Kuota Agoda Weekend Peak Season"
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Jenis Aturan (Action Type)</label>
                                    <select
                                        value={ruleType}
                                        onChange={e => setRuleType(e.target.value as any)}
                                        className={styles.input}
                                    >
                                        <option value="max_availability">Max Availability (Batasi kuota maksimal penjualan di OTA)</option>
                                        <option value="close_out">Close Out (Tutup total penjualan di OTA terpilih)</option>
                                    </select>
                                </div>

                                {ruleType === "max_availability" && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Batas Maksimal Kamar yang Boleh Dijual</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={99}
                                            value={limitValue}
                                            onChange={e => setLimitValue(Number(e.target.value) || 1)}
                                            className={styles.input}
                                        />
                                    </div>
                                )}

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Saluran OTA yang Diberlakukan</label>
                                    <select
                                        value={selectedChannel}
                                        onChange={e => setSelectedChannel(e.target.value)}
                                        className={styles.input}
                                    >
                                        <option value="agoda">Agoda</option>
                                        <option value="booking_com">Booking.com</option>
                                        <option value="traveloka">Traveloka</option>
                                        <option value="tiket">Tiket.com</option>
                                        <option value="airbnb">Airbnb</option>
                                        <option value="expedia">Expedia</option>
                                    </select>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Mulai Tanggal</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className={styles.input}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Sampai Tanggal</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className={styles.input}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Pilih Hari Berlaku</label>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                                        {allDays.map(d => (
                                            <button
                                                type="button"
                                                key={d.code}
                                                onClick={() => toggleDay(d.code)}
                                                style={{
                                                    padding: "4px 10px",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    borderRadius: "4px",
                                                    border: "1px solid #cbd5e1",
                                                    cursor: "pointer",
                                                    background: selectedDays.includes(d.code) ? "#1e3a2f" : "#ffffff",
                                                    color: selectedDays.includes(d.code) ? "#ffffff" : "#334155"
                                                }}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={styles.btnCancel}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={styles.btnSave}
                                >
                                    {saving ? "Menyimpan ke Channex..." : "Terapkan Aturan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
