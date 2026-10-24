"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Plus, Trash2, RefreshCw, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import styles from "./ChannelAvailabilityRulesDesktopView.module.css";

export interface AvailabilityRule {
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

interface ChannelAvailabilityRulesDesktopViewProps {
    hotelCode: string;
    rules: AvailabilityRule[];
    loading: boolean;
    onRefresh: () => void;
    onDeleteRule: (id: string, title: string) => Promise<void>;
    onCreateRule: (payload: any) => Promise<boolean>;
}

export const ChannelAvailabilityRulesDesktopView: React.FC<ChannelAvailabilityRulesDesktopViewProps> = ({
    hotelCode,
    rules,
    loading,
    onRefresh,
    onDeleteRule,
    onCreateRule
}) => {
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

    // Keyboard accessibility: close modal on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isModalOpen) {
                setIsModalOpen(false);
            }
        };
        if (isModalOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Judul aturan wajib diisi.");
            return;
        }

        setSaving(true);
        const success = await onCreateRule({
            title: title.trim(),
            type: ruleType,
            value: ruleType === "max_availability" ? limitValue : null,
            start_date: startDate,
            end_date: endDate,
            days: selectedDays,
            affected_channels: [selectedChannel],
            affected_room_types: ["all"]
        });
        setSaving(false);

        if (success) {
            setIsModalOpen(false);
            setTitle("");
            setLimitValue(2);
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
        <div className={styles.desktopContainer}>
            {/* Top Toolbar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <h3 className={styles.title}>
                        <Sliders size={16} />
                        <span>Aturan Ketersediaan Saluran (Yield &amp; Allotment Limits)</span>
                    </h3>
                    <p className={styles.desc}>
                        Konfigurasi pembatasan kuota kamar (Max Availability) atau penghentian penjualan selektif (Close Out) pada saluran OTA tertentu tanpa mengganggu saluran lainnya.
                    </p>
                </div>

                <div className={styles.topBarActions}>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className={styles.btnRefresh}
                        title="Segarkan data aturan"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className={styles.btnAdd}
                    >
                        <Plus size={14} />
                        <span>Buat Aturan Allotment</span>
                    </button>
                </div>
            </div>

            {/* Rules Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableWrap}>
                    <table className={styles.rulesTable}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Nama Aturan</th>
                                <th className={styles.th}>Jenis Aksi</th>
                                <th className={styles.th}>Saluran Target</th>
                                <th className={styles.th}>Batas Kuota</th>
                                <th className={styles.th}>Periode Tanggal</th>
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
                                            <div className={styles.ruleName} title={r.title}>{r.title}</div>
                                            <div className={styles.ruleId}>ID: {r.id}</div>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={`${styles.badgeType} ${isCloseOut ? styles.typeCloseOut : styles.typeMax}`}>
                                                {isCloseOut ? "Close Out" : "Max Availability"}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                {(r.affected_channels || []).map(ch => (
                                                    <span key={ch} className={styles.channelChip}>
                                                        {ch.toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            {isCloseOut ? (
                                                <span style={{ color: "#b91c1c", fontWeight: 700 }}>Stop Sell (0 Kamar)</span>
                                            ) : (
                                                <span className={styles.quotaValue}>Maks {r.value} Kamar / Hari</span>
                                            )}
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.dateRange}>
                                                {r.start_date} s/d {r.end_date}
                                            </span>
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
                                                onClick={() => onDeleteRule(r.id, r.title)}
                                                className={styles.btnDelete}
                                                title="Hapus aturan"
                                                aria-label="Hapus aturan"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {rules.length === 0 && (
                                <tr>
                                    <td colSpan={7} className={styles.emptyTd}>
                                        Belum ada aturan allotment saluran yang dikonfigurasi. Klik &quot;Buat Aturan Allotment&quot; untuk membatasi kuota harian atau stop sell.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Rule Modal */}
            {isModalOpen && (
                <div
                    className={styles.modalBackdrop}
                    onClick={() => setIsModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rule-modal-title"
                >
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h4 id="rule-modal-title" className={styles.modalTitle}>
                                Buat Aturan Allotment Saluran
                            </h4>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup jendela"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Judul / Deskripsi Aturan</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Contoh: Agoda Weekend Peak Season Cap"
                                        className={styles.input}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Jenis Aksi Aturan</label>
                                    <select
                                        value={ruleType}
                                        onChange={e => setRuleType(e.target.value as any)}
                                        className={styles.input}
                                    >
                                        <option value="max_availability">Max Availability (Batasi kuota jual kamar maksimal di OTA)</option>
                                        <option value="close_out">Close Out (Hentikan seluruh penjualan kamar di saluran terpilih)</option>
                                    </select>
                                </div>

                                {ruleType === "max_availability" && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Batas Maksimal Kamar Dijual</label>
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
                                    <label className={styles.label}>Saluran OTA Target</label>
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
                                        <label className={styles.label}>Tanggal Mulai</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className={styles.input}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Tanggal Selesai</label>
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
                                    <label className={styles.label}>Hari Aktif</label>
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
                                                    borderRadius: "6px",
                                                    border: "1px solid #e4e4e7",
                                                    cursor: "pointer",
                                                    background: selectedDays.includes(d.code) ? "#09090b" : "#ffffff",
                                                    color: selectedDays.includes(d.code) ? "#ffffff" : "#18181b",
                                                    transition: "all 0.15s ease"
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
                                    {saving ? "Menerapkan ke Channex..." : "Terapkan Aturan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
