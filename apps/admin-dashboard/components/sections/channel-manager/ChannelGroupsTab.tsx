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
    ChevronDown,
    Trash2,
    AlertTriangle,
    Pencil,
    Eye,
    EyeOff,
    Save,
    Copy
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
    const [savedApiKey, setSavedApiKey] = useState<string>("");
    const [environment, setEnvironment] = useState<"staging" | "production">("staging");
    const [hasApiKey, setHasApiKey] = useState<boolean>(false);
    const [showKeyInput, setShowKeyInput] = useState<boolean>(true);
    const [showApiKey, setShowApiKey] = useState<boolean>(false);
    const [savingKey, setSavingKey] = useState<boolean>(false);
    const [syncing, setSyncing] = useState<boolean>(false);

    // Modal state - Create
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>("");
    const [newGroupDesc, setNewGroupDesc] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Modal state - Edit / Rename
    const [editingGroup, setEditingGroup] = useState<HotelGroup | null>(null);
    const [editGroupName, setEditGroupName] = useState<string>("");
    const [editGroupDesc, setEditGroupDesc] = useState<string>("");
    const [updating, setUpdating] = useState<boolean>(false);

    // Custom CSS Alert Modal for Delete Group
    const [groupToDelete, setGroupToDelete] = useState<HotelGroup | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    // Reassignment state
    const [assigningHotelCode, setAssigningHotelCode] = useState<string | null>(null);
    const [registeringHotelCode, setRegisteringHotelCode] = useState<string | null>(null);
    const [unlinkingHotelCode, setUnlinkingHotelCode] = useState<string | null>(null);
    const [propertyToUnlink, setPropertyToUnlink] = useState<{ hotelCode: string; hotelName: string } | null>(null);

    const handleUnlinkProperty = (hotelCode: string, hotelName: string) => {
        setPropertyToUnlink({ hotelCode, hotelName });
    };

    const handleConfirmUnlink = async () => {
        if (!propertyToUnlink) return;
        const { hotelCode, hotelName } = propertyToUnlink;
        setUnlinkingHotelCode(hotelCode);
        const toastId = toast.loading(`Memutuskan kaitan Channex untuk ${hotelName}...`);
        try {
            const res = await fetch("/api/channex/sync-master", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hotelCode, action: "unlink" })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Gagal memutus relasi properti Channex");
            }
            toast.success(data.message || `Relasi Channex untuk ${hotelName} berhasil diputus.`, { id: toastId });
            setPropertyToUnlink(null);
            await fetchData();
        } catch (err: any) {
            console.error("Unlink property error:", err);
            toast.error(err.message || "Gagal memutus kaitan Channex", { id: toastId });
        } finally {
            setUnlinkingHotelCode(null);
        }
    };

    const handleRegisterPropertyToChannex = async (hotelCode: string, hotelName: string) => {
        setRegisteringHotelCode(hotelCode);
        const toastId = toast.loading(`Mendaftarkan ${hotelName} ke Channex via API...`);
        try {
            const res = await fetch("/api/channex/sync-master", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hotelCode })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Gagal mendaftarkan properti ke Channex");
            }
            toast.success(`Berhasil! ${hotelName} kini terhubung ke Channex.`, { id: toastId });
            await fetchData();
        } catch (err: any) {
            console.error("Register property error:", err);
            toast.error(err.message || "Gagal mendaftarkan hotel ke Channex", { id: toastId });
        } finally {
            setRegisteringHotelCode(null);
        }
    };

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
                if (data.apiKey) {
                    setApiKey(data.apiKey);
                    setSavedApiKey(data.apiKey);
                }
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

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            toast.error("API Key tidak boleh kosong!");
            return;
        }
        setSavingKey(true);
        try {
            const res = await fetch("/api/channex/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "save_api_key",
                    apiKey: apiKey.trim(),
                    environment,
                    hotelCode: activeHotelCode
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "API Key berhasil disimpan!");
                setSavedApiKey(apiKey.trim());
                setHasApiKey(true);
                await fetchData(apiKey.trim(), environment);
            } else {
                toast.error("Gagal menyimpan API Key: " + data.error);
            }
        } catch (err: any) {
            toast.error("Terjadi kesalahan sistem: " + err.message);
        } finally {
            setSavingKey(false);
        }
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

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGroup || !editGroupName.trim()) {
            toast.error("Nama Hotel Group wajib diisi!");
            return;
        }

        setUpdating(true);
        try {
            const res = await fetch("/api/channex/groups", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_group",
                    groupId: editingGroup.id,
                    name: editGroupName.trim(),
                    description: editGroupDesc.trim(),
                    apiKey,
                    environment
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Hotel Group berhasil diperbarui!");
                setEditingGroup(null);
                fetchData(apiKey, environment);
            } else {
                toast.error("Gagal update group: " + (data.error || "Unknown error"));
            }
        } catch (err: any) {
            toast.error("Terjadi kesalahan sistem: " + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const executeDeleteGroup = async () => {
        if (!groupToDelete) return;
        const group = groupToDelete;
        setDeleting(true);

        try {
            const params = new URLSearchParams();
            params.set("groupId", group.id);
            if (group.channexGroupId) params.set("channexGroupId", group.channexGroupId);
            if (apiKey) params.set("apiKey", apiKey);
            if (environment) params.set("env", environment);

            const res = await fetch(`/api/channex/groups?${params.toString()}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || `Group "${group.name}" berhasil dihapus.`);
                setGroupToDelete(null);
                await fetchData();
            } else {
                toast.error(data.error || "Gagal menghapus group");
            }
        } catch (err: any) {
            toast.error("Terjadi kesalahan sistem: " + err.message);
        } finally {
            setDeleting(false);
        }
    };

    // Calculate metrics
    const totalProperties = hotels.length;
    const connectedChannexCount = hotels.filter((h) => !!h.channexPropertyId).length;
    const assignedCount = hotels.filter((h) => !!h.groupId).length;

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} disalin ke clipboard!`);
    };

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
                    <div className={styles.statIconWrap}>
                        <Layers size={18} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Hotel Groups</span>
                        <span className={styles.statValue}>{groups.length}</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{ background: "#f4f4f5", color: "#09090b", borderColor: "#e4e4e7" }}>
                        <Hotel size={18} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Kelola Properti</span>
                        <span className={styles.statValue}>{totalProperties}</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{ background: "#f4f4f5", color: "#09090b", borderColor: "#e4e4e7" }}>
                        <ShieldCheck size={18} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Tersambung OTA Engine</span>
                        <span className={styles.statValue}>{connectedChannexCount} / {totalProperties}</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIconWrap}>
                        <Link2 size={18} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Tergrup Jaringan</span>
                        <span className={styles.statValue}>{assignedCount}</span>
                    </div>
                </div>
            </div>

            {/* Live Master Channel Connection & Sync Banner */}
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: environment === "production" ? "#fdf2f4" : "#f4f4f5", color: environment === "production" ? "#5c0f1e" : "#27272a", border: environment === "production" ? "1px solid #f3cfd6" : "1px solid #e4e4e7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Globe size={18} />
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "13.5px", color: "#09090b" }}>Master Channel Live Sync</strong>
                            <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", background: environment === "production" ? "#fdf2f4" : "#f4f4f5", color: environment === "production" ? "#5c0f1e" : "#27272a", border: environment === "production" ? "1px solid #f3cfd6" : "1px solid #e4e4e7" }}>
                                {environment === "production" ? "Production Cloud" : "Sandbox Test Mode"}
                            </span>
                            {apiKey && apiKey === savedApiKey && (
                                <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <CheckCircle2 size={11} />
                                    Tersimpan
                                </span>
                            )}
                            {apiKey && apiKey !== savedApiKey && (
                                <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <AlertCircle size={11} />
                                    Belum Disimpan
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: "12px", color: "#71717a", margin: "2px 0 0 0" }}>
                            {hasApiKey 
                                ? (apiKey && apiKey !== savedApiKey ? "Perubahan API Key terdeteksi. Klik \"Simpan API Key\" untuk menyimpan ke database." : "API Key terverifikasi aktif. Data Group dan Properti terhubung langsung dua arah.") 
                                : "Masukkan API Key Channel Manager untuk menghubungkan Group & Properti jaringan Anda."}
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    {showKeyInput ? (
                        <>
                            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    placeholder="Paste Channel Manager API Key..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className={styles.formInput}
                                    style={{
                                        width: "250px",
                                        padding: "7px 32px 7px 10px",
                                        fontSize: "12px",
                                        fontFamily: showApiKey ? "inherit" : "monospace"
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    title={showApiKey ? "Sembunyikan API Key" : "Tampilkan API Key"}
                                    style={{
                                        position: "absolute",
                                        right: "6px",
                                        background: "none",
                                        border: "none",
                                        color: "#71717a",
                                        cursor: "pointer",
                                        padding: "3px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>

                            <select
                                value={environment}
                                onChange={(e) => setEnvironment(e.target.value as any)}
                                className={styles.formInput}
                                style={{ padding: "7px 10px", fontSize: "12px", width: "auto" }}
                            >
                                <option value="staging">Sandbox Test Mode</option>
                                <option value="production">Production Cloud</option>
                            </select>

                            <button
                                type="button"
                                onClick={handleSaveApiKey}
                                disabled={savingKey || !apiKey.trim()}
                                className={styles.btnPrimary}
                                style={{
                                    fontSize: "12px",
                                    padding: "7px 13px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: (apiKey && apiKey !== savedApiKey) ? "#5c0f1e" : "#09090b",
                                    borderColor: (apiKey && apiKey !== savedApiKey) ? "#5c0f1e" : "#09090b"
                                }}
                                title="Simpan API Key ke database"
                            >
                                {savingKey ? (
                                    <>
                                        <RefreshCw size={13} className="animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={13} />
                                        <span>Simpan API Key</span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => setShowKeyInput(!showKeyInput)}
                        className={styles.btnCancel}
                        style={{ fontSize: "12px", padding: "7px 12px" }}
                    >
                        {showKeyInput ? "Tutup Form Key" : (hasApiKey ? "Buka Form API Key" : "Set API Key")}
                    </button>

                    <button
                        type="button"
                        onClick={handleSyncChannex}
                        disabled={syncing || loading}
                        className={styles.btnCancel}
                        style={{
                            fontSize: "12px",
                            padding: "7px 12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            borderColor: "#e4e4e7"
                        }}
                    >
                        <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
                        <span>{syncing ? "Menyinkronkan..." : "Tarik Data Properti & Group"}</span>
                    </button>
                </div>
            </div>

            {/* Action Bar */}
            <div className={styles.headerActionRow}>
                <div className={styles.headerLeft}>
                    <h3 className={styles.headerTitle}>
                        <Building2 size={16} style={{ color: "#5c0f1e" }} />
                        <span>Hotel Chains &amp; Multi-Property Grouping</span>
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
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                        <span>Refresh</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className={styles.btnPrimary}
                    >
                        <Plus size={15} />
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
                                <div className={styles.groupAvatar}>
                                    {group.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <strong style={{ fontSize: "14px", color: "#09090b" }}>{group.name}</strong>
                                        <span className={styles.groupBadge}>
                                            {groupHotels.length} Properti
                                        </span>
                                        {groups.length <= 1 && (
                                            <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "4px", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                                                Root Group Utama
                                            </span>
                                        )}
                                    </div>
                                    {group.description && (
                                        <p style={{ fontSize: "12px", color: "#71717a", margin: "2px 0 0 0" }}>
                                            {group.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {group.channexGroupId ? (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(group.channexGroupId!, "Channel Manager Group UUID")}
                                        className={styles.groupChannexBadge}
                                        title={`Klik untuk menyalin Group UUID: ${group.channexGroupId}`}
                                        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                                    >
                                        <Copy size={10} style={{ opacity: 0.7 }} />
                                        <span>Group ID: <b>{group.channexGroupId}</b></span>
                                    </button>
                                ) : (
                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Lokal CRS Group</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingGroup(group);
                                        setEditGroupName(group.name);
                                        setEditGroupDesc(group.description || "");
                                    }}
                                    className={styles.btnCancel}
                                    title={`Edit Nama Group ${group.name}`}
                                    style={{
                                        color: "#09090b",
                                        borderColor: "#e4e4e7",
                                        background: "#ffffff",
                                        padding: "4px 10px",
                                        fontSize: "12px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px"
                                    }}
                                >
                                    <Pencil size={13} />
                                    <span>Edit</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGroupToDelete(group)}
                                    className={styles.btnCancel}
                                    title={`Hapus Group ${group.name}`}
                                    style={{
                                        color: "#5c0f1e",
                                        borderColor: "#f3cfd6",
                                        background: "#fdf2f4",
                                        padding: "4px 10px",
                                        fontSize: "12px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px"
                                    }}
                                >
                                    <Trash2 size={13} />
                                    <span>Hapus</span>
                                </button>
                            </div>
                        </div>

                        {groupHotels.length > 0 ? (
                            <div className={styles.tableResponsive}>
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
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(h.channexPropertyId, "Channel Manager Property UUID")}
                                                                title={`Klik untuk menyalin Channel Manager Property UUID: ${h.channexPropertyId}`}
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "5px",
                                                                    fontFamily: "var(--font-geist-mono, monospace)",
                                                                    fontSize: "11px",
                                                                    background: "#f4f4f5",
                                                                    color: "#18181b",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid #e4e4e7",
                                                                    cursor: "pointer",
                                                                    transition: "all 0.15s ease"
                                                                }}
                                                            >
                                                                <span>{h.channexPropertyId}</span>
                                                                <Copy size={11} style={{ opacity: 0.6 }} />
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: "11.5px", color: "#71717a" }}>Belum Dipetakan</span>
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
                                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                                                            {!h.channexPropertyId ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={registeringHotelCode === h.hotelCode}
                                                                    onClick={() => handleRegisterPropertyToChannex(h.hotelCode, h.name)}
                                                                    className={styles.btnPrimary}
                                                                    style={{
                                                                        padding: "3px 8px",
                                                                        fontSize: "11px",
                                                                        height: "26px",
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "4px",
                                                                        background: "#5c0f1e",
                                                                        color: "#ffffff"
                                                                    }}
                                                                    title="Daftarkan properti ini langsung ke Channex via API"
                                                                >
                                                                    {registeringHotelCode === h.hotelCode ? (
                                                                        <RefreshCw size={11} className="animate-spin" />
                                                                    ) : (
                                                                        <Plus size={11} />
                                                                    )}
                                                                    <span>{registeringHotelCode === h.hotelCode ? "Mendaftarkan..." : "Daftarkan ke Channex"}</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled={unlinkingHotelCode === h.hotelCode}
                                                                    onClick={() => handleUnlinkProperty(h.hotelCode, h.name)}
                                                                    style={{
                                                                        padding: "3px 8px",
                                                                        fontSize: "11px",
                                                                        height: "26px",
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "4px",
                                                                        background: "#fff1f2",
                                                                        border: "1px solid #fecdd3",
                                                                        color: "#be123c",
                                                                        borderRadius: "6px",
                                                                        cursor: "pointer",
                                                                        fontWeight: 600
                                                                    }}
                                                                    title="Putus relasi Channex ID ini"
                                                                >
                                                                    {unlinkingHotelCode === h.hotelCode ? (
                                                                        <RefreshCw size={11} className="animate-spin" />
                                                                    ) : (
                                                                        <Unlink size={11} />
                                                                    )}
                                                                    <span>Putus Link</span>
                                                                </button>
                                                            )}
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
                                                                style={{ color: "#5c0f1e" }}
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
                            </div>
                        ) : (
                            <div style={{ padding: "24px", textAlign: "center", color: "#71717a", fontSize: "13px" }}>
                                Belum ada hotel yang dimasukkan ke group ini. Pilih hotel dari daftar "Properti Mandiri" di bawah untuk menautkan.
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Unassigned Properties Section */}
            {unassignedHotels.length > 0 && (
                <div className={styles.groupCard} style={{ borderColor: "#e4e4e7" }}>
                    <div className={styles.groupHeader} style={{ background: "#fafafa" }}>
                        <div className={styles.groupTitleWrap}>
                            <div className={styles.statIconWrap} style={{ width: "34px", height: "34px" }}>
                                <Hotel size={18} />
                            </div>
                            <div>
                                <strong style={{ fontSize: "14px", color: "#09090b" }}>Properti Mandiri / Belum Tergrup ({unassignedHotels.length})</strong>
                                <p style={{ fontSize: "12px", color: "#71717a", margin: "2px 0 0 0" }}>
                                    Hotel-hotel berikut beroperasi mandiri dan dapat Anda masukkan ke dalam salah satu Group di atas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.tableResponsive}>
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
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(h.channexPropertyId, "Channel Manager Property UUID")}
                                                        title={`Klik untuk menyalin Channel Manager Property UUID: ${h.channexPropertyId}`}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "5px",
                                                            fontFamily: "var(--font-geist-mono, monospace)",
                                                            fontSize: "11px",
                                                            background: "#f4f4f5",
                                                            color: "#18181b",
                                                            padding: "2px 8px",
                                                            borderRadius: "4px",
                                                            border: "1px solid #e4e4e7",
                                                            cursor: "pointer",
                                                            transition: "all 0.15s ease"
                                                        }}
                                                    >
                                                        <span>{h.channexPropertyId}</span>
                                                        <Copy size={11} style={{ opacity: 0.6 }} />
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: "11.5px", color: "#71717a" }}>Belum Terhubung</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <div className={styles.groupAssignWrap} style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                                                    {!h.channexPropertyId ? (
                                                        <button
                                                            type="button"
                                                            disabled={registeringHotelCode === h.hotelCode}
                                                            onClick={() => handleRegisterPropertyToChannex(h.hotelCode, h.name)}
                                                            className={styles.btnPrimary}
                                                            style={{
                                                                padding: "3px 8px",
                                                                fontSize: "11px",
                                                                height: "26px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                                background: "#5c0f1e",
                                                                color: "#ffffff"
                                                            }}
                                                            title="Daftarkan properti ini langsung ke Channex via API"
                                                        >
                                                            {registeringHotelCode === h.hotelCode ? (
                                                                <RefreshCw size={11} className="animate-spin" />
                                                            ) : (
                                                                <Plus size={11} />
                                                            )}
                                                            <span>{registeringHotelCode === h.hotelCode ? "Mendaftarkan..." : "Daftarkan ke Channex"}</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={unlinkingHotelCode === h.hotelCode}
                                                            onClick={() => handleUnlinkProperty(h.hotelCode, h.name)}
                                                            style={{
                                                                padding: "3px 8px",
                                                                fontSize: "11px",
                                                                height: "26px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                                background: "#fff1f2",
                                                                border: "1px solid #fecdd3",
                                                                color: "#be123c",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                fontWeight: 600
                                                            }}
                                                            title="Putus relasi Channex ID ini"
                                                        >
                                                            {unlinkingHotelCode === h.hotelCode ? (
                                                                <RefreshCw size={11} className="animate-spin" />
                                                            ) : (
                                                                <Unlink size={11} />
                                                            )}
                                                            <span>Putus Link</span>
                                                        </button>
                                                    )}
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
                                                                        <CheckCircle2 size={13} style={{ color: "#5c0f1e" }} />
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <div style={{ padding: "8px 12px", fontSize: "12px", color: "#71717a" }}>
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
                </div>
            )}

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Tambah Hotel Group / Chain Baru</h3>
                        <p style={{ fontSize: "13px", color: "#71717a", margin: 0 }}>
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

            {/* Edit / Rename Group Modal */}
            {editingGroup && (
                <div className={styles.modalOverlay} onClick={() => !updating && setEditingGroup(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>Edit Detail Hotel Group</h3>
                                <p className={styles.modalSubtitle}>
                                    Ubah nama atau deskripsi jaringan grup hotel di Tara CRS dan Channex Cloud.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingGroup(null)}
                                className={styles.modalCloseBtn}
                                disabled={updating}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUpdateGroup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    Nama Hotel Group <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editGroupName}
                                    onChange={(e) => setEditGroupName(e.target.value)}
                                    placeholder="Contoh: Setara Hospitality Group"
                                    className={styles.formInput}
                                    disabled={updating}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Deskripsi / Catatan Jaringan (Opsional)</label>
                                <textarea
                                    rows={3}
                                    value={editGroupDesc}
                                    onChange={(e) => setEditGroupDesc(e.target.value)}
                                    placeholder="Deskripsi singkat jaringan atau cluster grup..."
                                    className={styles.formInput}
                                    disabled={updating}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setEditingGroup(null)}
                                    className={styles.btnCancel}
                                    disabled={updating}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className={styles.btnPrimary}
                                    disabled={updating}
                                >
                                    {updating ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Group Custom Confirmation Modal */}
            {groupToDelete && (
                <div className={styles.modalOverlay} onClick={() => !deleting && setGroupToDelete(null)}>
                    <div className={styles.confirmModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmModalHeader}>
                            <div className={styles.confirmModalIcon}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className={styles.confirmModalTitle}>Hapus Hotel Group</h3>
                                <p className={styles.confirmModalSubtitle}>
                                    Tindakan ini akan menghapus grup dari Tara CRS dan Channel Manager secara permanen.
                                </p>
                            </div>
                        </div>

                        <div className={styles.confirmModalBody}>
                            <p className={styles.confirmModalText}>
                                Yakin ingin menghapus group <strong>&ldquo;{groupToDelete.name}&rdquo;</strong>?
                            </p>
                            <p className={styles.confirmModalNotice}>
                                Seluruh properti hotel yang bertaut akan otomatis dilepaskan secara aman dan kembali berstatus properti independen.
                            </p>

                            {groups.length <= 1 && (
                                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "6px", padding: "10px 12px", color: "#92400e", fontSize: "11.5px", marginTop: "10px", lineHeight: "1.45" }}>
                                    <strong>Perhatian Aturan Channex Cloud:</strong> Akun Channel Manager mewajibkan memiliki <strong>minimal 1 Hotel Group (Root Group)</strong>. Jika grup ini adalah satu-satunya grup yang tersisa, Channex akan menolak penghapusan. Buat grup baru terlebih dahulu sebelum menghapus grup ini, atau gunakan tombol <strong>Edit</strong> untuk mengganti namanya.
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                onClick={() => setGroupToDelete(null)}
                                className={styles.btnCancel}
                                disabled={deleting}
                            >
                                Batal
                            </button>
                            {groups.length <= 1 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const g = groupToDelete;
                                        setGroupToDelete(null);
                                        setEditingGroup(g);
                                        setEditGroupName(g.name);
                                        setEditGroupDesc(g.description || "");
                                    }}
                                    className={styles.btnPrimary}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                >
                                    <Pencil size={13} />
                                    <span>Ganti Nama Group Saja (Edit)</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={executeDeleteGroup}
                                    className={styles.btnDeleteConfirm}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <RefreshCw size={13} className="animate-spin" />
                                            <span>Menghapus...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={13} />
                                            <span>Hapus Group Sekarang</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Unlink Property Custom Confirmation Modal */}
            {propertyToUnlink && (
                <div className={styles.modalOverlay} onClick={() => !unlinkingHotelCode && setPropertyToUnlink(null)}>
                    <div className={styles.confirmModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmModalHeader}>
                            <div className={styles.confirmModalIcon} style={{ background: "#fff1f2", color: "#be123c", borderColor: "#fecdd3" }}>
                                <Unlink size={20} />
                            </div>
                            <div>
                                <h3 className={styles.confirmModalTitle}>Putus Kaitan Channex</h3>
                                <p className={styles.confirmModalSubtitle}>
                                    Memutuskan relasi UUID properti antara Tara CRS dan server Channex.
                                </p>
                            </div>
                        </div>

                        <div className={styles.confirmModalBody}>
                            <p className={styles.confirmModalText}>
                                Apakah Anda yakin ingin memutuskan dan me-reset kaitan Channex untuk <strong>&ldquo;{propertyToUnlink.hotelName}&rdquo;</strong>?
                            </p>
                            <p className={styles.confirmModalNotice}>
                                Relasi ID Channex di database Tara dan server Channex akan dibersihkan. Kamar dan rate plan di Tara tidak akan terhapus.
                            </p>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                onClick={() => setPropertyToUnlink(null)}
                                className={styles.btnCancel}
                                disabled={!!unlinkingHotelCode}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmUnlink}
                                className={styles.btnDeleteConfirm}
                                disabled={!!unlinkingHotelCode}
                                style={{
                                    background: "#be123c",
                                    borderColor: "#be123c",
                                    boxShadow: "0 1px 3px rgba(190, 18, 60, 0.25)"
                                }}
                            >
                                {unlinkingHotelCode ? (
                                    <>
                                        <RefreshCw size={13} className="animate-spin" />
                                        <span>Memutuskan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Unlink size={13} />
                                        <span>Ya, Putus Kaitan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
