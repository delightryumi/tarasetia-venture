"use client";

import React, { useState, useEffect } from "react";
import styles from "./ChannelGroups.module.css";
import { 
    Building2, 
    Plus, 
    Link2, 
    Unlink, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    ExternalLink, 
    Globe, 
    Layers, 
    Hotel,
    Search,
    ShieldCheck,
    ChevronDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface HotelGroup {
    id: string;
    name: string;
    description?: string;
    channexGroupId?: string;
    source?: string;
    createdAt?: string;
}

interface HotelProperty {
    hotelCode: string;
    name: string;
    city: string;
    groupId: string;
    groupName: string;
    channexPropertyId: string;
    channexEnvironment: string;
    totalRooms: number;
    status: string;
}

export const ChannelGroupsTab: React.FC = () => {
    const { activeHotelCode, setActiveHotelCode } = useAuth();
    const [groups, setGroups] = useState<HotelGroup[]>([]);
    const [hotels, setHotels] = useState<HotelProperty[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [openDropdownHotelCode, setOpenDropdownHotelCode] = useState<string | null>(null);
    
    // Live Channex API Key & Environment configuration
    const [apiKey, setApiKey] = useState<string>("");
    const [environment, setEnvironment] = useState<"staging" | "production">("staging");
    const [hasApiKey, setHasApiKey] = useState<boolean>(false);
    const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
    const [syncing, setSyncing] = useState<boolean>(false);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>("");
    const [newGroupDesc, setNewGroupDesc] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Reassignment state
    const [assigningHotelCode, setAssigningHotelCode] = useState<string | null>(null);

    const fetchData = async (overrideKey?: string, overrideEnv?: "staging" | "production") => {
        setLoading(true);
        try {
            const effectiveKey = overrideKey !== undefined ? overrideKey : apiKey;
            const effectiveEnv = overrideEnv || environment;
            const params = new URLSearchParams();
            if (activeHotelCode) params.set("hotelCode", activeHotelCode);
            if (effectiveKey) params.set("apiKey", effectiveKey);
            if (effectiveEnv) params.set("env", effectiveEnv);

            const res = await fetch(`/api/channex/groups?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setGroups(data.groups || []);
                setHotels(data.hotels || []);
                setHasApiKey(data.hasApiKey || !!effectiveKey);
                if (data.environment) setEnvironment(data.environment);
            } else {
                toast.error("Gagal memuat data grup hotel: " + data.error);
            }
        } catch (err: any) {
            console.error("Error fetching groups:", err);
            toast.error("Terjadi kesalahan jaringan.");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncChannex = async () => {
        setSyncing(true);
        toast.info("Menghubungi Master Channel " + (environment === "production" ? "Production" : "Sandbox") + "...");
        await fetchData(apiKey, environment);
        setSyncing(false);
        toast.success("Sinkronisasi data Master Channel selesai!");
    };

    useEffect(() => {
        fetchData();
    }, [activeHotelCode]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(`.${styles.groupAssignWrap}`)) {
                setOpenDropdownHotelCode(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) {
            toast.error("Nama Hotel Group wajib diisi!");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/channex/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newGroupName,
                    description: newGroupDesc,
                    apiKey,
                    environment,
                    hotelCode: activeHotelCode
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Hotel Group berhasil dibuat!");
                setNewGroupName("");
                setNewGroupDesc("");
                setIsCreateModalOpen(false);
                fetchData(apiKey, environment);
            } else {
                toast.error("Gagal membuat group: " + data.error);
            }
        } catch (err: any) {
            toast.error("Terjadi kesalahan sistem: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignGroup = async (hotelCode: string, targetGroupId: string, targetGroupName: string) => {
        try {
            const res = await fetch("/api/channex/groups", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    groupId: targetGroupId,
                    groupName: targetGroupName
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setAssigningHotelCode(null);
                fetchData();
            } else {
                toast.error("Gagal update group hotel: " + data.error);
            }
        } catch (err: any) {
            toast.error("Gagal menyimpan perubahan: " + err.message);
        }
    };

    // Calculate metrics
    const totalProperties = hotels.length;
    const connectedChannexCount = hotels.filter((h) => !!h.channexPropertyId).length;
    const assignedCount = hotels.filter((h) => !!h.groupId).length;

    // Filter hotels & groups by search
    const filteredGroups = groups.filter((g) => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.channexGroupId && g.channexGroupId.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const unassignedHotels = hotels.filter((h) => !h.groupId && 
        (h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.hotelCode.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className={styles.container}>
            {/* Top Overview Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{ background: "#e0f2fe", color: "#0284c7" }}>
                        <Layers size={22} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Hotel Groups</span>
                        <span className={styles.statValue}>{groups.length}</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{ background: "#f0fdf4", color: "#16a34a" }}>
                        <Hotel size={22} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Kelola Properti</span>
                        <span className={styles.statValue}>{totalProperties}</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{ background: "#fef3c7", color: "#d97706" }}>
                        <ShieldCheck size={22} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Tersambung OTA Engine</span>
                        <span className={styles.statValue}>{connectedChannexCount} / {totalProperties}</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                        <Link2 size={22} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Tergrup Jaringan</span>
                        <span className={styles.statValue}>{assignedCount}</span>
                    </div>
                </div>
            </div>

            {/* Live Master Channel Connection & Sync Banner */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: environment === "production" ? "#dcfce7" : "#fef3c7", color: environment === "production" ? "#15803d" : "#b45309", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Globe size={20} />
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "14px", color: "#0f172a" }}>Master Channel Live Sync</strong>
                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: environment === "production" ? "#dcfce7" : "#fef3c7", color: environment === "production" ? "#15803d" : "#b45309" }}>
                                {environment === "production" ? "Production Cloud" : "Sandbox Test Mode"}
                            </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                            {hasApiKey ? "API Key terverifikasi aktif. Data Group dan Properti terhubung langsung dua arah." : "Masukkan API Key Channel Manager untuk menghubungkan Group & Properti jaringan Anda."}
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {showKeyInput ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="password"
                                placeholder="Paste Channel Manager API Key..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className={styles.formInput}
                                style={{ width: "240px", padding: "6px 12px", fontSize: "12px" }}
                            />
                            <select
                                value={environment}
                                onChange={(e) => setEnvironment(e.target.value as any)}
                                className={styles.formInput}
                                style={{ padding: "6px 10px", fontSize: "12px", width: "auto" }}
                            >
                                <option value="staging">Sandbox Test Mode</option>
                                <option value="production">Production Cloud</option>
                            </select>
                        </div>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => setShowKeyInput(!showKeyInput)}
                        className={styles.btnCancel}
                        style={{ fontSize: "12px", padding: "8px 12px" }}
                    >
                        {showKeyInput ? "Tutup Input Key" : (hasApiKey ? "Ubah API Key" : "Set API Key")}
                    </button>

                    <button
                        type="button"
                        onClick={handleSyncChannex}
                        disabled={syncing || loading}
                        className={styles.btnPrimary}
                        style={{ background: "#0f766e" }}
                    >
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                        <span>{syncing ? "Menyinkronkan..." : "Tarik Data Properti & Group"}</span>
                    </button>
                </div>
            </div>

            {/* Action Bar */}
            <div className={styles.headerActionRow}>
                <div className={styles.headerLeft}>
                    <h3 className={styles.headerTitle}>
                        <Building2 size={18} color="#0284c7" />
                        <span>Hotel Chains & Multi-Property Grouping</span>
                    </h3>
                    <p className={styles.headerDesc}>
                        Kelola jaringan hotel, tetapkan grup properti untuk distribusi OTA serentak, dan pantau status koneksi terpusat.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                        type="button"
                        onClick={() => fetchData()}
                        className={styles.btnCancel}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        title="Segarkan Data"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span>Refresh</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className={styles.btnPrimary}
                    >
                        <Plus size={16} />
                        <span>Buat Hotel Group Baru</span>
                    </button>
                </div>
            </div>

            {/* List of Groups */}
            {filteredGroups.map((group) => {
                const groupHotels = hotels.filter((h) => h.groupId === group.id);

                return (
                    <div key={group.id} className={styles.groupCard}>
                        <div className={styles.groupHeader}>
                            <div className={styles.groupTitleWrap}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#0284c7", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                                    {group.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <strong style={{ fontSize: "15px", color: "#0f172a" }}>{group.name}</strong>
                                        <span className={styles.groupBadge}>
                                            {groupHotels.length} Properti
                                        </span>
                                    </div>
                                    {group.description && (
                                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                                            {group.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {group.channexGroupId ? (
                                    <span className={styles.groupChannexBadge} title="Tersinkronisasi dengan Master Channel ID">
                                        Group ID: {group.channexGroupId.slice(0, 8)}...
                                    </span>
                                ) : (
                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Lokal CRS Group</span>
                                )}
                            </div>
                        </div>

                        {groupHotels.length > 0 ? (
                            <table className={styles.hotelTable}>
                                <thead>
                                    <tr>
                                        <th>Nama Properti</th>
                                        <th>Kota / Lokasi</th>
                                        <th>Kamar</th>
                                        <th>Channel Property ID</th>
                                        <th>Status Distribusi</th>
                                        <th style={{ textAlign: "right" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupHotels.map((h) => {
                                        const isActive = h.hotelCode === activeHotelCode;

                                        return (
                                            <tr key={h.hotelCode} className={`${styles.hotelTableRow} ${isActive ? styles.activeHotelRow : ""}`}>
                                                <td>
                                                    <span className={styles.hotelName}>{h.name}</span>
                                                    <span className={styles.hotelCode}>ID: {h.hotelCode}</span>
                                                </td>
                                                <td>{h.city}</td>
                                                <td><strong>{h.totalRooms || "-"}</strong> Kamar</td>
                                                <td>
                                                    {h.channexPropertyId ? (
                                                        <span style={{ fontFamily: "monospace", fontSize: "11.5px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                                                            {h.channexPropertyId.slice(0, 13)}...
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>Belum Dipetakan</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {h.channexPropertyId ? (
                                                        <span className={`${styles.statusPill} ${styles.statusConnected}`}>
                                                            <CheckCircle2 size={12} />
                                                            <span>Tersambung ({h.channexEnvironment === "production" ? "Production" : "Sandbox"})</span>
                                                        </span>
                                                    ) : (
                                                        <span className={`${styles.statusPill} ${styles.statusPending}`}>
                                                            <AlertCircle size={12} />
                                                            <span>Perlu Setup</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveHotelCode(h.hotelCode)}
                                                            className={`${styles.btnSwitch} ${isActive ? styles.btnSwitchActive : ""}`}
                                                        >
                                                            {isActive ? "● Sedang Aktif" : "Beralih ke Hotel"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAssignGroup(h.hotelCode, "", "")}
                                                            className={styles.btnSwitch}
                                                            title="Lepas dari Group ini"
                                                            style={{ color: "#ef4444" }}
                                                        >
                                                            <Unlink size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                                Belum ada hotel yang dimasukkan ke group ini. Pilih hotel dari daftar "Properti Mandiri" di bawah untuk menautkan.
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Unassigned Properties Section */}
            {unassignedHotels.length > 0 && (
                <div className={styles.groupCard} style={{ borderColor: "#cbd5e1" }}>
                    <div className={styles.groupHeader} style={{ background: "#f1f5f9" }}>
                        <div className={styles.groupTitleWrap}>
                            <Hotel size={20} color="#475569" />
                            <div>
                                <strong style={{ fontSize: "14px", color: "#334155" }}>Properti Mandiri / Belum Tergrup ({unassignedHotels.length})</strong>
                                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                                    Hotel-hotel berikut beroperasi mandiri dan dapat Anda masukkan ke dalam salah satu Group di atas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <table className={styles.hotelTable}>
                        <thead>
                            <tr>
                                <th>Nama Properti</th>
                                <th>Kota</th>
                                <th>Channel Property ID</th>
                                <th style={{ textAlign: "right" }}>Tautkan ke Group</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unassignedHotels.map((h) => {
                                const isActive = h.hotelCode === activeHotelCode;

                                return (
                                    <tr key={h.hotelCode} className={`${styles.hotelTableRow} ${isActive ? styles.activeHotelRow : ""}`}>
                                        <td>
                                            <span className={styles.hotelName}>{h.name}</span>
                                            <span className={styles.hotelCode}>ID: {h.hotelCode}</span>
                                        </td>
                                        <td>{h.city}</td>
                                        <td>
                                            {h.channexPropertyId ? (
                                                <span style={{ fontFamily: "monospace", fontSize: "11.5px", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>
                                                    {h.channexPropertyId.slice(0, 13)}...
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>Belum Terhubung</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <div className={styles.groupAssignWrap}>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenDropdownHotelCode(openDropdownHotelCode === h.hotelCode ? null : h.hotelCode)}
                                                    className={`${styles.groupSelectBtn} ${openDropdownHotelCode === h.hotelCode ? styles.groupSelectBtnActive : ""}`}
                                                >
                                                    <span>+ Tautkan ke Group</span>
                                                    <ChevronDown size={13} />
                                                </button>

                                                {openDropdownHotelCode === h.hotelCode && (
                                                    <div className={styles.groupDropdownMenu}>
                                                        <div className={styles.groupDropdownHeader}>Pilih Group Tujuan</div>
                                                        {groups.length > 0 ? (
                                                            groups.map((g) => (
                                                                <button
                                                                    key={g.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleAssignGroup(h.hotelCode, g.id, g.name);
                                                                        setOpenDropdownHotelCode(null);
                                                                    }}
                                                                    className={styles.groupDropdownItem}
                                                                >
                                                                    <span>{g.name}</span>
                                                                    <CheckCircle2 size={13} color="#16a34a" />
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div style={{ padding: "8px 12px", fontSize: "12px", color: "#94a3b8" }}>
                                                                Belum ada grup. Buat grup baru di atas.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Tambah Hotel Group / Chain Baru</h3>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                            Group ini akan otomatis dibuat di Tara CRS dan disinkronkan ke Master Channel Manager jaringan Anda.
                        </p>

                        <form onSubmit={handleCreateGroup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nama Hotel Group *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Setara Hospitality Group, Bumi Anyom Collection"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className={styles.formInput}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Keterangan / Deskripsi (Opsional)</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Manajemen operator 4 hotel resort di Jawa Barat"
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                    className={styles.formInput}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className={styles.btnCancel}
                                    disabled={submitting}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className={styles.btnPrimary}
                                    disabled={submitting}
                                >
                                    {submitting ? "Menyimpan..." : "Simpan & Sinkronkan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
