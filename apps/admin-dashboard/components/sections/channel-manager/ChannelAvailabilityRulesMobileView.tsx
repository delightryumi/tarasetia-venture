"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Plus, Trash2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import type { AvailabilityRule } from "./ChannelAvailabilityRulesDesktopView";
import styles from "./ChannelAvailabilityRulesMobileView.module.css";

interface ChannelAvailabilityRulesMobileViewProps {
    hotelCode: string;
    rules: AvailabilityRule[];
    loading: boolean;
    onRefresh: () => void;
    onDeleteRule: (id: string, title: string) => Promise<void>;
    onCreateRule: (payload: any) => Promise<boolean>;
}

export const ChannelAvailabilityRulesMobileView: React.FC<ChannelAvailabilityRulesMobileViewProps> = ({
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
        <div className={styles.mobileContainer}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.topBarHeader}>
                    <h3 className={styles.title}>
                        <Sliders size={15} />
                        <span>Aturan Allotment Saluran</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className={styles.btnRefreshMobile}
                        title="Segarkan data"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
                <p className={styles.desc}>
                    Kelola batasan kuota kamar (Max Cap) atau stop sell di tiap saluran OTA.
                </p>
                <div className={styles.topBarActions}>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className={styles.btnAddMobile}
                    >
                        <Plus size={13} />
                        <span>Buat Aturan Allotment</span>
                    </button>
                </div>
            </div>

            {/* Rules Cards List */}
            {rules.length === 0 ? (
                <div className={styles.emptyState}>
                    Belum ada aturan allotment saluran. Klik &quot;Buat Aturan Allotment&quot; untuk memulai.
                </div>
            ) : (
                <div className={styles.rulesList}>
                    {rules.map(r => {
                        const isCloseOut = r.type === "close_out";

                        return (
                            <div key={r.id} className={styles.ruleCard}>
                                <div className={styles.ruleCardHeader}>
                                    <div>
                                        <div className={styles.ruleTitle}>{r.title}</div>
                                        <div className={styles.ruleId}>ID: {r.id}</div>
                                    </div>
                                    <span className={`${styles.badgeType} ${isCloseOut ? styles.typeCloseOut : styles.typeMax}`}>
                                        {isCloseOut ? "Close Out" : "Max Allotment"}
                                    </span>
                                </div>

                                <div className={styles.ruleMetaRow}>
                                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                        {(r.affected_channels || []).map(ch => (
                                            <span key={ch} className={styles.channelPill}>
                                                {ch.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                    <span className={styles.quotaValue}>
                                        {isCloseOut ? "Stop Sell (0 Kamar)" : `Maks ${r.value} Kamar/Hari`}
                                    </span>
                                </div>

                                <div className={styles.dateRange}>
                                    Periode: {r.start_date} s/d {r.end_date}
                                </div>

                                <div className={styles.daysGrid}>
                                    {allDays.map(d => (
                                        <span
                                            key={d.code}
                                            className={`${styles.dayPill} ${(r.days || []).includes(d.code) ? styles.dayPillActive : ""}`}
                                        >
                                            {d.label}
                                        </span>
                                    ))}
                                </div>

                                <div className={styles.cardFooter}>
                                    <span style={{ fontSize: "10.5px", color: "#71717a" }}>
                                        Properti: {hotelCode}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteRule(r.id, r.title)}
                                        className={styles.btnDeleteMobile}
                                    >
                                        <Trash2 size={11} />
                                        <span>Hapus</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div
                    className={styles.modalBackdrop}
                    onClick={() => setIsModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rule-modal-mobile-title"
                >
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h4 id="rule-modal-mobile-title" className={styles.modalTitle}>
                                Buat Aturan Allotment Saluran
                            </h4>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className={styles.modalCloseBtn}
                                aria-label="Tutup"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Judul / Deskripsi</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Contoh: Agoda Weekend Cap"
                                        className={styles.input}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Jenis Aksi</label>
                                    <select
                                        value={ruleType}
                                        onChange={e => setRuleType(e.target.value as any)}
                                        className={styles.input}
                                    >
                                        <option value="max_availability">Max Availability (Batasi kuota jual)</option>
                                        <option value="close_out">Close Out (Hentikan penjualan)</option>
                                    </select>
                                </div>

                                {ruleType === "max_availability" && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Maksimal Kamar Dijual</label>
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

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
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
                                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                                        {allDays.map(d => (
                                            <button
                                                type="button"
                                                key={d.code}
                                                onClick={() => toggleDay(d.code)}
                                                style={{
                                                    padding: "4px 8px",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    borderRadius: "4px",
                                                    border: "1px solid #e4e4e7",
                                                    cursor: "pointer",
                                                    background: selectedDays.includes(d.code) ? "#09090b" : "#ffffff",
                                                    color: selectedDays.includes(d.code) ? "#ffffff" : "#18181b"
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
                                    {saving ? "Menerapkan..." : "Terapkan Aturan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
