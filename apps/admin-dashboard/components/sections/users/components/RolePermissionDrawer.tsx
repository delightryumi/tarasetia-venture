import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Search, ShieldCheck, ShieldAlert, Check, RefreshCw, 
    ChevronDown, ChevronUp, AlertTriangle, Building2, Banknote, 
    BedDouble, Coffee, ShoppingBag, Calculator, TrendingUp, 
    ClipboardList, Layers, SlidersHorizontal, CheckSquare, Square,
    Globe, Receipt, CheckCircle2
} from "lucide-react";
import { 
    COMPREHENSIVE_PERMISSION_GROUPS, 
    TOTAL_PERMISSIONS_COUNT, 
    getStandardRolePermissions,
    PermissionGroup 
} from "../permissionConfig";
import { SystemRoleItem } from "./RoleManagementTable";
import { UserProfile } from "../types";
import styles from "./RolePermissionDrawer.module.css";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface RolePermissionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    role: SystemRoleItem | null;
    activeHotelCode?: string;
    users: UserProfile[];
    onSaveRolePermissions: (roleName: string, permissions: Record<string, boolean>, syncToUsers: boolean) => Promise<void>;
}

export const RolePermissionDrawer: React.FC<RolePermissionDrawerProps> = ({
    isOpen,
    onClose,
    role,
    activeHotelCode,
    users,
    onSaveRolePermissions
}) => {
    const [permissions, setPermissions] = useState<Record<string, boolean>>(() => {
        return role ? getStandardRolePermissions(role.name) : {};
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string>("all");
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        COMPREHENSIVE_PERMISSION_GROUPS.forEach(g => {
            initial[g.id] = true;
        });
        return initial;
    });
    const [syncToUsers, setSyncToUsers] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Count how many users currently have this role
    const assignedUsersCount = useMemo(() => {
        if (!role) return 0;
        const targetRoleLower = role.name.toLowerCase();
        return users.filter(u => {
            const uRole = u.role?.toLowerCase() || "";
            return uRole === targetRoleLower || 
                (targetRoleLower === "administrator" && uRole === "admin") ||
                (targetRoleLower === "admin" && uRole === "administrator");
        }).length;
    }, [users, role]);

    // Load permissions preset immediately whenever role changes and load overrides
    useEffect(() => {
        if (!role) return;

        // 1. Immediately apply full standard preset for this role
        const standard = getStandardRolePermissions(role.name);
        setPermissions(standard);
        setSelectedTag("all");
        setSearchQuery("");

        // 2. Expand all groups immediately
        const initialExpanded: Record<string, boolean> = {};
        COMPREHENSIVE_PERMISSION_GROUPS.forEach(g => {
            initialExpanded[g.id] = true;
        });
        setExpandedGroups(initialExpanded);

        // 3. Fetch any custom saved overrides from Firestore in background
        const roleId = role.id || role.name.toLowerCase().replace(/\s+/g, '_');
        if (activeHotelCode) {
            getDoc(doc(db, "hotels", activeHotelCode, "roles_permissions", roleId))
                .then(snap => {
                    if (snap.exists() && snap.data().permissions) {
                        setPermissions(prev => ({
                            ...standard,
                            ...snap.data().permissions
                        }));
                    }
                })
                .catch(err => {
                    console.warn("Background role fetch note:", err);
                });
        }
    }, [role?.id, role?.name, activeHotelCode]);

    if (!isOpen || !role) return null;

    // Toggle single permission
    const togglePermission = (permId: string) => {
        setPermissions(prev => ({
            ...prev,
            [permId]: !prev[permId]
        }));
    };

    // Toggle entire module
    const toggleModuleGroup = (group: PermissionGroup) => {
        const allActive = group.permissions.every(p => permissions[p.id] === true);
        const nextState = !allActive;

        setPermissions(prev => {
            const next = { ...prev };
            next[group.id] = nextState;
            group.permissions.forEach(p => {
                next[p.id] = nextState;
            });
            return next;
        });

        toast.info(
            nextState 
                ? `Semua hak akses modul ${group.shortLabel || group.label} diaktifkan.` 
                : `Semua hak akses modul ${group.shortLabel || group.label} dinonaktifkan.`
        );
    };

    // Quick Actions
    const handleGrantAll = () => {
        const next: Record<string, boolean> = {};
        COMPREHENSIVE_PERMISSION_GROUPS.forEach(g => {
            next[g.id] = true;
            g.permissions.forEach(p => {
                next[p.id] = true;
            });
        });
        setPermissions(next);
        toast.success("Seluruh izin di semua 12 modul hotel telah diaktifkan.");
    };

    const handleRevokeAll = () => {
        setPermissions({});
        toast.info("Seluruh izin akses modul telah dinonaktifkan.");
    };

    const handleResetStandard = () => {
        const preset = getStandardRolePermissions(role.name);
        setPermissions(preset);
        toast.info(`Hak akses dikembalikan ke standar industri hotel untuk role ${role.name}.`);
    };

    const handleExpandAll = () => {
        const next: Record<string, boolean> = {};
        COMPREHENSIVE_PERMISSION_GROUPS.forEach(g => {
            next[g.id] = true;
        });
        setExpandedGroups(next);
    };

    const handleCollapseAll = () => {
        const next: Record<string, boolean> = {};
        COMPREHENSIVE_PERMISSION_GROUPS.forEach(g => {
            next[g.id] = false;
        });
        setExpandedGroups(next);
    };

    const toggleGroupAccordion = (groupId: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // Calculate Active Counts
    const activePermsCount = Object.entries(permissions).filter(([key, val]) => 
        val === true && !key.startsWith("module_")
    ).length;
    
    const percentage = Math.round((activePermsCount / TOTAL_PERMISSIONS_COUNT) * 100);

    // Filter Groups by Selected Tag & Search Query
    const filteredGroups = COMPREHENSIVE_PERMISSION_GROUPS.filter(group => {
        if (selectedTag !== "all" && group.id !== selectedTag) return false;
        return true;
    }).map(group => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return group;

        const matchesGroup = 
            group.label.toLowerCase().includes(q) || 
            group.description.toLowerCase().includes(q) ||
            group.shortLabel.toLowerCase().includes(q);

        const filteredPerms = group.permissions.filter(p => 
            p.label.toLowerCase().includes(q) || 
            p.description.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)
        );

        if (matchesGroup) return group;
        if (filteredPerms.length > 0) {
            return {
                ...group,
                permissions: filteredPerms
            };
        }
        return null;
    }).filter(Boolean) as PermissionGroup[];

    // Render Group Icon
    const renderIcon = (iconName: string) => {
        switch (iconName) {
            case "Building2": return <Building2 size={18} />;
            case "Receipt": return <Receipt size={18} />;
            case "Globe": return <Globe size={18} />;
            case "Banknote": return <Banknote size={18} />;
            case "BedDouble": return <BedDouble size={18} />;
            case "Coffee": return <Coffee size={18} />;
            case "ShoppingBag": return <ShoppingBag size={18} />;
            case "Calculator": return <Calculator size={18} />;
            case "TrendingUp": return <TrendingUp size={18} />;
            case "ClipboardList": return <ClipboardList size={18} />;
            case "Layers": return <Layers size={18} />;
            case "ShieldCheck": return <ShieldCheck size={18} />;
            default: return <SlidersHorizontal size={18} />;
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveRolePermissions(role.name, permissions, syncToUsers);
            toast.success(`Hak akses untuk role ${role.name} berhasil disimpan.`, {
                description: syncToUsers && assignedUsersCount > 0 
                    ? `Perubahan telah otomatis diterapkan ke ${assignedUsersCount} personil aktif.`
                    : "Konfigurasi matriks role diperbarui."
            });
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Gagal menyimpan permission role.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.drawerBackdrop} 
            onClick={onClose}
        >
            <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className={styles.drawer}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.drawerHeader}>
                    <div className={styles.headerTopRow}>
                        <div className={styles.roleTitleCluster}>
                            <div className={styles.roleIconBadge}>
                                <SlidersHorizontal size={20} />
                            </div>
                            <div>
                                <h2 className={styles.roleNameText}>
                                    {role.name}
                                    <span className={styles.systemBadge}>
                                        Atasan: {role.parentRole}
                                    </span>
                                </h2>
                                <p className={styles.roleDescription}>
                                    {role.description} • {assignedUsersCount} personil aktif di hotel
                                </p>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            onClick={onClose} 
                            className={styles.closeBtn}
                            title="Tutup"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Progress Bar & Top Quick Actions */}
                    <div className={styles.statsBar}>
                        <div className={styles.statsLeft}>
                            <div className={styles.statsLabelRow}>
                                <span>Total Hak Akses Aktif</span>
                                <span>{activePermsCount} / {TOTAL_PERMISSIONS_COUNT} Privileges ({percentage}%)</span>
                            </div>
                            <div className={styles.progressBarContainer}>
                                <div 
                                    className={styles.progressBarFill} 
                                    style={{ width: `${percentage}%` }} 
                                />
                            </div>
                        </div>

                        <div className={styles.quickActions}>
                            <button 
                                type="button" 
                                onClick={handleGrantAll} 
                                className={styles.quickBtn}
                                title="Aktifkan seluruh hak akses"
                            >
                                Pilih Semua
                            </button>
                            <button 
                                type="button" 
                                onClick={handleRevokeAll} 
                                className={styles.quickBtn}
                                title="Nonaktifkan seluruh hak akses"
                            >
                                Cabut Semua
                            </button>
                            <button 
                                type="button" 
                                onClick={handleResetStandard} 
                                className={styles.quickBtn}
                                title="Kembalikan ke standar industri hotel"
                            >
                                Reset Standar Role
                            </button>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className={styles.searchWrapper}>
                        <input 
                            type="text"
                            placeholder="Cari izin fitur, laporan, void, diskon, room move, atau modul..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        <Search size={15} className={styles.searchIcon} />
                    </div>

                    {/* Module Tags / Filter Chips Bar */}
                    <div className={styles.moduleTagsBar}>
                        <button
                            type="button"
                            onClick={() => setSelectedTag("all")}
                            className={`${styles.moduleTag} ${selectedTag === "all" ? styles.moduleTagActive : ""}`}
                        >
                            Semua Modul
                            <span className={`${styles.tagCountBadge} ${activePermsCount > 0 ? styles.tagCountBadgeActive : ""}`}>
                                {activePermsCount}/{TOTAL_PERMISSIONS_COUNT}
                            </span>
                        </button>
                        {COMPREHENSIVE_PERMISSION_GROUPS.map(g => {
                            const activeCount = g.permissions.filter(p => permissions[p.id] === true).length;
                            const isSelected = selectedTag === g.id;
                            return (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => setSelectedTag(g.id)}
                                    className={`${styles.moduleTag} ${isSelected ? styles.moduleTagActive : ""}`}
                                >
                                    {g.shortLabel || g.label.split(" (")[0]}
                                    <span className={`${styles.tagCountBadge} ${activeCount > 0 ? styles.tagCountBadgeActive : ""}`}>
                                        {activeCount}/{g.permissions.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Body: Module List and Permissions */}
                <div className={styles.drawerBody}>
                    {/* Batch Control Bar for "Semua Modul" */}
                    {selectedTag === "all" && !searchQuery && (
                        <div className={styles.batchControlBar}>
                            <div className={styles.batchControlTitle}>
                                <CheckCircle2 size={16} className={styles.batchIcon} />
                                <span>Tinjauan <b>Semua Modul Hotel</b> ({COMPREHENSIVE_PERMISSION_GROUPS.length} Modul Terintegrasi)</span>
                            </div>
                            <div className={styles.batchButtonsGroup}>
                                <button
                                    type="button"
                                    onClick={handleGrantAll}
                                    className={styles.batchActionBtn}
                                    title="Aktifkan seluruh izin di semua modul"
                                >
                                    Pilih Semua Modul
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRevokeAll}
                                    className={styles.batchActionBtn}
                                    title="Matikan seluruh izin di semua modul"
                                >
                                    Matikan Semua Modul
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExpandAll}
                                    className={styles.batchActionBtn}
                                    title="Buka seluruh akordion modul"
                                >
                                    Buka Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCollapseAll}
                                    className={styles.batchActionBtn}
                                    title="Tutup seluruh akordion modul"
                                >
                                    Tutup Semua
                                </button>
                            </div>
                        </div>
                    )}

                    {filteredGroups.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                            <ShieldAlert size={28} style={{ margin: "0 auto 8px", color: "#94a3b8" }} />
                            <p style={{ fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>Hak Akses Tidak Ditemukan</p>
                            <p style={{ fontSize: "12px", margin: 0 }}>Tidak ada fitur hotel yang cocok dengan kata kunci "{searchQuery}".</p>
                        </div>
                    ) : (
                        filteredGroups.map(group => {
                            const isExpanded = expandedGroups[group.id] !== false;
                            const activeInGroup = group.permissions.filter(p => permissions[p.id] === true).length;
                            const isAllInGroupActive = group.permissions.length > 0 && activeInGroup === group.permissions.length;

                            return (
                                <div key={group.id} className={styles.groupCard}>
                                    {/* Group Accordion Header */}
                                    <div 
                                        className={styles.groupHeader}
                                        onClick={() => toggleGroupAccordion(group.id)}
                                    >
                                        <div className={styles.groupHeaderLeft}>
                                            <div className={styles.groupIconWrap}>
                                                {renderIcon(group.icon)}
                                            </div>
                                            <div>
                                                <h4 className={styles.groupTitle}>{group.label}</h4>
                                            </div>
                                            <span className={`${styles.groupCountBadge} ${activeInGroup > 0 ? styles.groupCountBadgeActive : ""}`}>
                                                {activeInGroup} / {group.permissions.length}
                                            </span>
                                        </div>

                                        <div className={styles.groupHeaderRight} onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => toggleModuleGroup(group)}
                                                className={`${styles.moduleToggleBtn} ${isAllInGroupActive ? styles.moduleToggleBtnActive : ""}`}
                                            >
                                                {isAllInGroupActive ? "Matikan Modul" : "Pilih Semua"}
                                            </button>
                                            <div 
                                                style={{ cursor: "pointer", display: "flex", alignItems: "center", color: "#64748b" }}
                                                onClick={() => toggleGroupAccordion(group.id)}
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permissions Item List */}
                                    {isExpanded && (
                                        <div className={styles.itemsList}>
                                            {group.permissions.map(perm => {
                                                const isChecked = permissions[perm.id] === true;

                                                return (
                                                    <div 
                                                        key={perm.id} 
                                                        className={styles.permItemRow}
                                                        onClick={() => togglePermission(perm.id)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <div className={styles.permInfoCluster}>
                                                            <div className={styles.permLabelRow}>
                                                                <span className={styles.permLabel}>{perm.label}</span>
                                                                {perm.isDangerous && (
                                                                    <span className={styles.dangerousBadge} title="Tindakan sensitif / butuh otorisasi supervisor">
                                                                        <AlertTriangle size={10} />
                                                                        Otoritas Sensitif
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className={styles.permDescription}>{perm.description}</p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                togglePermission(perm.id);
                                                            }}
                                                            className={`${styles.switch} ${isChecked ? styles.switchOn : styles.switchOff}`}
                                                        >
                                                            <span className={`${styles.switchThumb} ${isChecked ? styles.switchThumbOn : styles.switchThumbOff}`} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className={styles.drawerFooter}>
                    <label className={styles.footerLeft}>
                        <input 
                            type="checkbox"
                            checked={syncToUsers}
                            onChange={(e) => setSyncToUsers(e.target.checked)}
                            style={{ width: "16px", height: "16px", accentColor: "#0f172a", cursor: "pointer" }}
                        />
                        <span>
                            Terapkan langsung ke <strong>{assignedUsersCount} personil</strong> dengan role ini
                        </span>
                    </label>

                    <div className={styles.footerRight}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelBtn}
                            disabled={isSaving}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className={styles.saveBtn}
                        >
                            {isSaving ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    <span>Menyimpan Privileges...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    <span>Simpan Hak Akses</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
