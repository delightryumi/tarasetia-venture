"use client";

import React, { useState, useEffect } from "react";
import { 
    Users, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Globe, 
    Briefcase, 
    Building2, 
    CheckCircle2, 
    XCircle, 
    Percent, 
    Phone, 
    Mail, 
    User,
    X,
    ExternalLink
} from "lucide-react";
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import styles from "./TravelAgentTab.module.css";
import { ChannelMappingConfig } from "./ChannelManagerSection";

export interface TravelAgentItem {
    id: string;
    name: string;
    code?: string;
    category: "Travel Agent (Offline)" | "Corporate / Perusahaan" | "Wholesaler" | "Government / Dinas" | "Custom OTA" | "Lainnya";
    contactPerson?: string;
    phone?: string;
    email?: string;
    commissionPercent?: number;
    color?: string;
    notes?: string;
    isActive: boolean;
    createdAt?: string;
}

interface TravelAgentTabProps {
    hotelCode: string;
    channelConfigs?: Record<string, ChannelMappingConfig>;
    onNavigateToCatalog?: () => void;
}

export function TravelAgentTab({
    hotelCode,
    channelConfigs = {},
    onNavigateToCatalog
}: TravelAgentTabProps) {
    const [agents, setAgents] = useState<TravelAgentItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingAgent, setEditingAgent] = useState<TravelAgentItem | null>(null);
    const [saving, setSaving] = useState<boolean>(false);

    // Form state
    const [formName, setFormName] = useState("");
    const [formCode, setFormCode] = useState("");
    const [formCategory, setFormCategory] = useState<TravelAgentItem["category"]>("Travel Agent (Offline)");
    const [formContact, setFormContact] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formCommission, setFormCommission] = useState<number | "">(10);
    const [formNotes, setFormNotes] = useState("");

    // Subscribe to Firestore travel_agents collection
    useEffect(() => {
        if (!hotelCode || hotelCode === "0") {
            setLoading(false);
            return;
        }

        const colRef = collection(db, "hotels", hotelCode, "travel_agents");
        const unsub = onSnapshot(colRef, (snap) => {
            const list: TravelAgentItem[] = [];
            snap.forEach((d) => {
                list.push({ id: d.id, ...d.data() } as TravelAgentItem);
            });
            // Sort by name
            list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            setAgents(list);
            setLoading(false);
        }, (err) => {
            console.error("Error loading travel agents:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [hotelCode]);

    // Active OTAs from Channel Manager
    const activeOtaChannels = Object.values(channelConfigs).filter(c => c.isActive);

    const openAddModal = () => {
        setEditingAgent(null);
        setFormName("");
        setFormCode("");
        setFormCategory("Travel Agent (Offline)");
        setFormContact("");
        setFormPhone("");
        setFormEmail("");
        setFormCommission(10);
        setFormNotes("");
        setIsModalOpen(true);
    };

    const openEditModal = (ag: TravelAgentItem) => {
        setEditingAgent(ag);
        setFormName(ag.name);
        setFormCode(ag.code || "");
        setFormCategory(ag.category);
        setFormContact(ag.contactPerson || "");
        setFormPhone(ag.phone || "");
        setFormEmail(ag.email || "");
        setFormCommission(ag.commissionPercent ?? "");
        setFormNotes(ag.notes || "");
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error("Travel Agent / Channel Account Name is required");
            return;
        }

        setSaving(true);
        try {
            const agentId = editingAgent 
                ? editingAgent.id 
                : `ta_${formName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now().toString().slice(-4)}`;

            const agentDocRef = doc(db, "hotels", hotelCode, "travel_agents", agentId);
            
            const payload: TravelAgentItem = {
                id: agentId,
                name: formName.trim(),
                code: formCode.trim().toUpperCase() || formName.trim().slice(0, 4).toUpperCase(),
                category: formCategory,
                contactPerson: formContact.trim(),
                phone: formPhone.trim(),
                email: formEmail.trim(),
                commissionPercent: typeof formCommission === "number" ? formCommission : 0,
                notes: formNotes.trim(),
                isActive: editingAgent ? editingAgent.isActive : true,
                createdAt: editingAgent?.createdAt || new Date().toISOString()
            };

            await setDoc(agentDocRef, payload, { merge: true });
            toast.success(editingAgent ? `Partner account "${formName}" updated successfully.` : `Partner account "${formName}" created successfully.`);
            setIsModalOpen(false);
        } catch (err: any) {
            console.error("Error saving travel agent:", err);
            toast.error(err.message || "Failed to save travel agent.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (ag: TravelAgentItem) => {
        try {
            const agentDocRef = doc(db, "hotels", hotelCode, "travel_agents", ag.id);
            await updateDoc(agentDocRef, {
                isActive: !ag.isActive
            });
            toast.success(`Status for ${ag.name} set to ${!ag.isActive ? "Active" : "Inactive"}`);
        } catch (err: any) {
            toast.error("Failed to update partner status.");
        }
    };

    const handleDelete = async (ag: TravelAgentItem) => {
        if (!confirm(`Delete partner account "${ag.name}"?`)) return;
        try {
            const agentDocRef = doc(db, "hotels", hotelCode, "travel_agents", ag.id);
            await deleteDoc(agentDocRef);
            toast.success(`Partner "${ag.name}" deleted successfully.`);
        } catch (err: any) {
            toast.error("Failed to delete partner account.");
        }
    };

    // Filter list
    const filteredAgents = agents.filter(ag => {
        const matchesSearch = !searchQuery.trim() || 
            ag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ag.code && ag.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ag.contactPerson && ag.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCat = categoryFilter === "all" || ag.category === categoryFilter;
        return matchesSearch && matchesCat;
    });

    return (
        <div className={styles.container}>
            {/* 1. Stat Summary Cards */}
            <div className={styles.statRow}>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Distribution Channels</span>
                        <span className={styles.statValue}>{activeOtaChannels.length + agents.length}</span>
                    </div>
                    <div className={styles.statIcon} style={{ background: "#f0fdf4", color: "#166534" }}>
                        <Users size={18} />
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Connected OTAs (2-Way)</span>
                        <span className={styles.statValue}>{activeOtaChannels.length}</span>
                    </div>
                    <div className={styles.statIcon} style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                        <Globe size={18} />
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Offline Travel Agents &amp; B2B</span>
                        <span className={styles.statValue}>{agents.filter(a => a.isActive).length}</span>
                    </div>
                    <div className={styles.statIcon} style={{ background: "#faf5ff", color: "#7e22ce" }}>
                        <Briefcase size={18} />
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Direct Booking Sources</span>
                        <span className={styles.statValue}>2</span>
                    </div>
                    <div className={styles.statIcon} style={{ background: "#fefce8", color: "#854d0e" }}>
                        <Building2 size={18} />
                    </div>
                </div>
            </div>

            {/* 2. Top Bar & Filters */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <span className={styles.title}>
                        <Users size={16} color="#1e3a2f" />
                        <span>Travel Agents &amp; Distribution Partners</span>
                    </span>
                    <span className={styles.desc}>
                        Manage direct contract partners, offline travel agents, corporate accounts, wholesalers, and OTA distribution channels.
                    </span>
                </div>

                <div className={styles.topRight}>
                    <input 
                        type="text"
                        placeholder="Search travel agents, corporate accounts, or sources..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />

                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Partner Categories</option>
                        <option value="Travel Agent (Offline)">Travel Agent (Offline)</option>
                        <option value="Corporate / Perusahaan">Corporate Account</option>
                        <option value="Wholesaler">Wholesaler</option>
                        <option value="Government / Dinas">Government / Public Sector</option>
                        <option value="Custom OTA">Custom OTA</option>
                        <option value="Lainnya">Other Sources</option>
                    </select>

                    <button 
                        type="button" 
                        onClick={openAddModal}
                        className={styles.btnAdd}
                    >
                        <Plus size={14} />
                        <span>+ New Travel Agent / Account</span>
                    </button>
                </div>
            </div>

            {/* 3. Table of Travel Agents & Channels */}
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Channel / Partner Account</th>
                                <th className={styles.th}>Source Category</th>
                                <th className={styles.th}>Connection Type</th>
                                <th className={styles.th}>Contact / PIC</th>
                                <th className={styles.th}>Status</th>
                                <th className={styles.th} style={{ textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Standard Core Channels (Walk-in & Direct) */}
                            <tr className={styles.tr}>
                                <td className={styles.td}>
                                    <div className={styles.agentNameCell}>
                                        <div className={styles.agentAvatar} style={{ background: "#dcfce7", color: "#166534" }}>
                                            DIR
                                        </div>
                                        <div className={styles.agentInfo}>
                                            <span className={styles.agentName}>Direct / Walk-in</span>
                                            <span className={styles.agentCode}>FRONT-OFFICE</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.badge} ${styles.badgeOffline}`}>Direct Guest</span>
                                </td>
                                <td className={styles.td}>
                                    <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 600 }}>● Direct PMS Engine</span>
                                </td>
                                <td className={styles.td} style={{ color: "#64748b" }}>Front Desk / Walk-in Desk</td>
                                <td className={styles.td}>
                                    <span className={`${styles.badge} ${styles.badgeActive}`}>Always Active</span>
                                </td>
                                <td className={styles.td} style={{ textAlign: "center", color: "#94a3b8" }}>—</td>
                            </tr>

                            <tr className={styles.tr}>
                                <td className={styles.td}>
                                    <div className={styles.agentNameCell}>
                                        <div className={styles.agentAvatar} style={{ background: "#fef3c7", color: "#92400e" }}>
                                            WEB
                                        </div>
                                        <div className={styles.agentInfo}>
                                            <span className={styles.agentName}>Booking Engine (Direct Web)</span>
                                            <span className={styles.agentCode}>ONLINE-DIRECT</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.badge} ${styles.badgeCorporate}`}>Hotel Direct Web</span>
                                </td>
                                <td className={styles.td}>
                                    <span style={{ fontSize: "11px", color: "#b45309", fontWeight: 600 }}>● Direct Web Engine</span>
                                </td>
                                <td className={styles.td} style={{ color: "#64748b" }}>Official Booking Engine</td>
                                <td className={styles.td}>
                                    <span className={`${styles.badge} ${styles.badgeActive}`}>Always Active</span>
                                </td>
                                <td className={styles.td} style={{ textAlign: "center", color: "#94a3b8" }}>—</td>
                            </tr>

                            {/* Default Nexura Sales Corporate Partner */}
                            {!agents.some(a => a.name.toLowerCase() === "nexura sales") && (
                                <tr className={styles.tr}>
                                    <td className={styles.td}>
                                        <div className={styles.agentNameCell}>
                                            <div className={styles.agentAvatar} style={{ background: "#d1fae5", color: "#065f46" }}>
                                                NEX
                                            </div>
                                            <div className={styles.agentInfo}>
                                                <span className={styles.agentName}>Nexura Sales</span>
                                                <span className={styles.agentCode}>CODE: NEXURA</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <span className={`${styles.badge} ${styles.badgeCorporate}`}>Corporate Account</span>
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>● Direct Corporate Partner</span>
                                    </td>
                                    <td className={styles.td} style={{ color: "#64748b" }}>
                                        Corporate Sales &amp; Marketing
                                    </td>
                                    <td className={styles.td}>
                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
                                    </td>
                                    <td className={styles.td} style={{ textAlign: "center", color: "#94a3b8" }}>—</td>
                                </tr>
                            )}

                            {/* Active OTA Channels from Channel Manager */}
                            {activeOtaChannels.map((ota) => (
                                <tr key={ota.channelCode} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div className={styles.agentNameCell}>
                                            <div className={styles.agentAvatar} style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                                                OTA
                                            </div>
                                            <div className={styles.agentInfo}>
                                                <span className={styles.agentName}>{ota.channelName}</span>
                                                <span className={styles.agentCode}>ID: {ota.channelCode.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <span className={`${styles.badge} ${styles.badgeOta}`}>Online Travel Agency</span>
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600 }}>● Direct 2-Way OTA Sync</span>
                                    </td>
                                    <td className={styles.td} style={{ color: "#64748b" }}>
                                        Extranet Property ID: {ota.hotelId || "Connected"}
                                    </td>
                                    <td className={styles.td}>
                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Active (2-Way)</span>
                                    </td>
                                    <td className={styles.td} style={{ textAlign: "center" }}>
                                        <button 
                                            type="button"
                                            onClick={onNavigateToCatalog}
                                            className={styles.actionBtn}
                                            title="View configuration in Channel Catalog"
                                        >
                                            <ExternalLink size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {/* Custom Travel Agents & Partners */}
                            {filteredAgents.map((ag) => {
                                const isCorp = ag.category.includes("Corporate");
                                const isWholesale = ag.category.includes("Wholesaler");
                                const badgeClass = isCorp 
                                    ? styles.badgeCorporate 
                                    : (isWholesale ? styles.badgeWholesaler : styles.badgeOffline);

                                return (
                                    <tr key={ag.id} className={styles.tr}>
                                        <td className={styles.td}>
                                            <div className={styles.agentNameCell}>
                                                <div className={styles.agentAvatar} style={{ background: "#f3e8ff", color: "#7e22ce" }}>
                                                    {ag.code ? ag.code.slice(0, 3) : ag.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className={styles.agentInfo}>
                                                    <span className={styles.agentName}>{ag.name}</span>
                                                    <span className={styles.agentCode}>CODE: {ag.code || ag.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={`${styles.badge} ${badgeClass}`}>{ag.category}</span>
                                        </td>
                                        <td className={styles.td}>
                                            <span style={{ fontSize: "11px", color: "#7e22ce", fontWeight: 600 }}>● Direct B2B / Manual Contract</span>
                                        </td>
                                        <td className={styles.td}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                {ag.contactPerson && (
                                                    <span style={{ fontWeight: 500, color: "#0f172a" }}>{ag.contactPerson}</span>
                                                )}
                                                {ag.phone && (
                                                    <span style={{ fontSize: "11px", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <Phone size={10} /> {ag.phone}
                                                    </span>
                                                )}
                                                {ag.email && (
                                                    <span style={{ fontSize: "11px", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <Mail size={10} /> {ag.email}
                                                    </span>
                                                )}
                                                {!ag.contactPerson && !ag.phone && !ag.email && (
                                                    <span style={{ color: "#94a3b8" }}>-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(ag)}
                                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                                title="Click to toggle active status"
                                            >
                                                <span className={`${styles.badge} ${ag.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                                                    {ag.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </button>
                                        </td>
                                        <td className={styles.td} style={{ textAlign: "center" }}>
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(ag)}
                                                    className={styles.actionBtn}
                                                    title="Edit Account"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(ag)}
                                                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                                    title="Delete Account"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredAgents.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                        No offline travel agents or direct corporate partners configured yet. Click <b>"+ New Travel Agent / Account"</b> above to register a new partner.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. Modal Tambah / Edit Travel Agent */}
            {isModalOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalCard}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>
                                <Briefcase size={16} color="#1e3a2f" />
                                <span>{editingAgent ? "Edit Travel Agent / Account" : "New Travel Agent / Distribution Partner"}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className={styles.modalCloseBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Account / Agency Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Panorama JTB / Dwidayatour / PT Corporate Client"
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formRow2}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Partner Category *</label>
                                        <select
                                            value={formCategory}
                                            onChange={e => setFormCategory(e.target.value as any)}
                                            className={styles.input}
                                        >
                                            <option value="Travel Agent (Offline)">Travel Agent (Offline)</option>
                                            <option value="Corporate / Perusahaan">Corporate Account</option>
                                            <option value="Wholesaler">Wholesaler</option>
                                            <option value="Government / Dinas">Government / Public Sector</option>
                                            <option value="Custom OTA">Custom OTA</option>
                                            <option value="Lainnya">Other Sources</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Agency Code / Short Code</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="e.g. PANO"
                                            value={formCode}
                                            onChange={e => setFormCode(e.target.value.toUpperCase())}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Contact Person / Account Executive</label>
                                    <input
                                        type="text"
                                        placeholder="Contact name"
                                        value={formContact}
                                        onChange={e => setFormContact(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formRow2}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Direct Phone / WhatsApp</label>
                                        <input
                                            type="text"
                                            placeholder="+62 812 3456 7890"
                                            value={formPhone}
                                            onChange={e => setFormPhone(e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Corporate Email</label>
                                        <input
                                            type="email"
                                            placeholder="agent@company.com"
                                            value={formEmail}
                                            onChange={e => setFormEmail(e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Contract Notes &amp; Billing Terms</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Payment terms, billing cycle, voucher agreement, contract reference, etc..."
                                        value={formNotes}
                                        onChange={e => setFormNotes(e.target.value)}
                                        className={styles.input}
                                        style={{ resize: "none" }}
                                    />
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={styles.btnSecondary}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.btnPrimary}
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : (editingAgent ? "Update Account" : "Save Partner Account")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
