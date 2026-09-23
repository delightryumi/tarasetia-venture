import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
    X, Plus, User, Mail, RefreshCw, Check, Lock, Building2, 
    CheckSquare, Square, Shield, SlidersHorizontal, ChevronDown, ChevronUp, AlertTriangle, Globe 
} from "lucide-react";
import { UserProfile } from "../types";
import { 
    COMPREHENSIVE_PERMISSION_GROUPS, 
    getStandardRolePermissions, 
    TOTAL_PERMISSIONS_COUNT,
    isPermissionAddon,
    isAddonActiveForHotel
} from "../permissionConfig";
import drawerStyles from "./UserDrawer.module.css";
import styles from "../UsersStyles.module.css";

interface UserDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser: UserProfile | null;
    formData: any;
    setFormData: (data: any) => void;
    roles: string[];
    onSave: () => void;
    isSaving?: boolean;
    onChangePassword?: (userId: string, newPassword: string) => Promise<void>;
    authUser?: any;
    hotelsList?: Array<{ hotelCode: string; name: string }>;
    activeHotelCode?: string;
    activeModules?: string[] | null;
}

export const UserDrawer: React.FC<UserDrawerProps> = ({ 
    isOpen, onClose, editingUser, formData, setFormData, roles, onSave, isSaving, onChangePassword, authUser,
    hotelsList = [], activeHotelCode, activeModules = []
}) => {
    
    // Detect if editing the initial primary Admin Owner from registration
    const activeHotel = hotelsList.find(h => h.hotelCode === activeHotelCode);
    const hotelOwnerEmail = (activeHotel as any)?.email?.toLowerCase();
    const isOwnerUser = Boolean(
        (editingUser?.isOwner === true || (hotelOwnerEmail && editingUser?.email?.toLowerCase() === hotelOwnerEmail)) && 
        !editingUser?.createdBy
    );

    // Check if the role selection should be locked
    const isEditingAdmin = editingUser?.role?.toLowerCase() === "admin" || formData.role?.toLowerCase() === "admin";
    const isSuperadminLoggedIn = 
        authUser?.role?.toLowerCase() === "superadmin" || 
        authUser?.role?.toLowerCase() === "super_admin" ||
        authUser?.role?.toLowerCase() === "super admin" ||
        authUser?.email?.toLowerCase() === "superadmin@setara.co.id";
    
    const isEditingSuperadmin = editingUser?.role?.toLowerCase() === "superadmin" || formData.role?.toLowerCase() === "superadmin";
    // Non-superadmin cannot edit a Superadmin account or promote to Superadmin
    const isAccountLocked = isEditingSuperadmin && !isSuperadminLoggedIn;

    // Permission matrix hanya boleh diedit oleh superadmin atau admin property.
    // Role lain (GM, FOM, Receptionist, dll) hanya view-only — tidak bisa setup permission sendiri.
    const canEditPermissions = isSuperadminLoggedIn || authUser?.role?.toLowerCase() === "admin" || authUser?.role?.toLowerCase() === "administrator";
    const isPermLocked = !canEditPermissions || isAccountLocked;
    
    // Role selection is strictly locked for:
    // 1. Initial Admin Owner (isOwnerUser) — their role is permanent
    // 2. Editing Admin/Superadmin by non-superadmin
    // EXCEPTION: Users created by the owner (!isOwnerUser) can have their roles edited freely!
    const isRoleLocked = isOwnerUser || ((isEditingAdmin || isEditingSuperadmin) && !isSuperadminLoggedIn);

    // Filter available roles: only superadmin can assign 'superadmin' role
    const availableRoles = isSuperadminLoggedIn 
        ? [...roles, "superadmin"] 
        : roles.filter(r => r.toLowerCase() !== "superadmin");

    // Hotels available for assignment
    // If superadmin: all hotels. If admin per property: only their allowedOutlets
    const assignableHotels = isSuperadminLoggedIn
        ? hotelsList
        : hotelsList.filter(h => authUser?.allowedOutlets?.includes(h.hotelCode) || h.hotelCode === activeHotelCode);

    const currentOutlets: string[] = Array.isArray(formData.allowedOutlets) 
        ? formData.allowedOutlets 
        : (formData.hotelCode ? [formData.hotelCode] : (activeHotelCode ? [activeHotelCode] : []));

    const toggleHotelSelection = (code: string) => {
        if (isAccountLocked) return;
        const exists = currentOutlets.includes(code);
        let updated: string[];
        if (exists) {
            // Do not allow deselecting if it's the only one left
            if (currentOutlets.length <= 1) {
                return;
            }
            updated = currentOutlets.filter(c => c !== code);
        } else {
            updated = [...currentOutlets, code];
        }
        setFormData({ ...formData, allowedOutlets: updated });
    };

    const selectAllHotels = () => {
        if (isAccountLocked) return;
        const allCodes = assignableHotels.map(h => h.hotelCode);
        setFormData({ ...formData, allowedOutlets: allCodes });
    };

    const resetToActiveHotel = () => {
        if (isAccountLocked) return;
        setFormData({ ...formData, allowedOutlets: activeHotelCode ? [activeHotelCode] : [] });
    };

    // Permission Matrix State for User
    const [permSearch, setPermSearch] = useState("");
    const [permTag, setPermTag] = useState("all");
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const currentPermissions: Record<string, boolean> = formData.permissions || getStandardRolePermissions(formData.role || "General Manager", activeModules);

    const togglePermission = (permId: string) => {
        if (isPermLocked) return;
        const parentGroup = COMPREHENSIVE_PERMISSION_GROUPS.find(g => g.permissions.some(p => p.id === permId));
        const targetPerm = parentGroup?.permissions.find(p => p.id === permId);
        if (targetPerm?.isComingSoon) return;

        const addon = isPermissionAddon(permId);
        if (addon.isAddon && !isAddonActiveForHotel(permId, activeModules)) return;

        const nextVal = !currentPermissions[permId];
        const nextPerms = {
            ...currentPermissions,
            [permId]: nextVal
        };

        // Find which group this permId belongs to
        if (parentGroup) {
            const anyActive = parentGroup.permissions.some(p => p.id === permId ? nextVal : nextPerms[p.id] === true);
            nextPerms[parentGroup.id] = anyActive;
        }

        setFormData({
            ...formData,
            permissions: nextPerms
        });
    };

    const toggleModuleGroup = (group: any) => {
        if (isPermLocked) return;
        const availablePerms = group.permissions.filter((p: any) => {
            if (p.isComingSoon) return false;
            const addon = isPermissionAddon(p.id);
            if (addon.isAddon && !isAddonActiveForHotel(p.id, activeModules)) return false;
            return true;
        });
        if (availablePerms.length === 0) return;
        const allActive = availablePerms.every((p: any) => currentPermissions[p.id] === true);
        const nextState = !allActive;
        const nextPerms = { ...currentPermissions };
        nextPerms[group.id] = nextState;
        availablePerms.forEach((p: any) => {
            nextPerms[p.id] = nextState;
        });
        setFormData({
            ...formData,
            permissions: nextPerms
        });
    };

    const resetPermissions = () => {
        if (isPermLocked) return;
        const std = getStandardRolePermissions(formData.role || "General Manager", activeModules);
        setFormData({
            ...formData,
            permissions: std
        });
    };

    const activePermsCount = Object.entries(currentPermissions).filter(([key, val]) => 
        val === true && !key.startsWith("module_")
    ).length;

    const filteredGroups = COMPREHENSIVE_PERMISSION_GROUPS.filter(group => {
        if (group.isSuperadminOnly) return false;
        if (permTag !== "all" && group.id !== permTag) return false;
        return true;
    }).map(group => {
        const q = permSearch.toLowerCase().trim();
        if (!q) return group;
        const matchesGroup = group.label.toLowerCase().includes(q) || group.description.toLowerCase().includes(q);
        const filteredPerms = group.permissions.filter(p => 
            p.label.toLowerCase().includes(q) || 
            p.description.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)
        );
        if (matchesGroup) return group;
        if (filteredPerms.length > 0) {
            return { ...group, permissions: filteredPerms };
        }
        return null;
    }).filter(Boolean) as typeof COMPREHENSIVE_PERMISSION_GROUPS;

    return (
        <>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpen ? 1 : 0 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className={`${styles.drawerOverlay} ${isOpen ? styles.pointerEventsAuto : styles.pointerEventsNone}`}
            />
            <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: isOpen ? 0 : "100%" }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className={styles.drawerPanel}
            >
                <header className={styles.drawerHeader}>
                    <div className={styles.drawerHeaderTitleCluster}>
                        <div className={styles.drawerHeaderMeta}>
                            <div className={styles.drawerHeaderMetaIcon}>
                                <Plus size={10} />
                            </div>
                            <span className={styles.drawerHeaderMetaText}>
                                {isSuperadminLoggedIn ? "Global Chain Administration" : "Property Administration"}
                            </span>
                        </div>
                        <h2 className={styles.drawerTitle}>
                            {editingUser ? 'Update' : 'New'} <span className={styles.drawerTitleHighlight}>Personnel</span>
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className={styles.drawerCloseBtn}
                    >
                        <X size={14} />
                    </button>
                </header>

                <div className={`${styles.drawerBody} ${styles.customScrollbar}`}>
                    {isAccountLocked && (
                        <div className={drawerStyles.lockedAlert}>
                            <Shield size={16} />
                            <span className={drawerStyles.lockedAlertText}>
                                <b>Akun Dilindungi:</b> Akun berstatus Superadmin hanya dapat dimodifikasi oleh Superadmin.
                            </span>
                        </div>
                    )}

                    <div className={styles.drawerFormGroup}>
                        <label className={styles.drawerFormLabel}>Full Name</label>
                        <div className={styles.drawerInputWrapper}>
                            <div className={styles.drawerInputIcon}>
                                <User size={14} />
                            </div>
                            <input 
                                type="text"
                                disabled={isAccountLocked}
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="Enter full name"
                                className={styles.drawerInput}
                            />
                        </div>
                    </div>

                    <div className={styles.drawerFormGroup}>
                        <label className={styles.drawerFormLabel}>Email Address</label>
                        <div className={styles.drawerInputWrapper}>
                            <div className={styles.drawerInputIcon}>
                                <Mail size={14} />
                            </div>
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="user@example.com"
                                disabled={!!editingUser || isAccountLocked}
                                className={styles.drawerInput}
                            />
                        </div>
                    </div>

                    {!editingUser && (
                        <div className={styles.drawerFormGroup}>
                            <label className={styles.drawerFormLabel}>Initial Password</label>
                            <div className={styles.drawerInputWrapper}>
                                <div className={styles.drawerInputIcon}>
                                    <Lock size={14} />
                                </div>
                                <input 
                                    type="password"
                                    value={formData.password || ""}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="••••••••"
                                    className={styles.drawerInput}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── MULTI-HOTEL PROPERTY ASSIGNMENT (HANYA UNTUK SUPERADMIN) ── */}
                    {isSuperadminLoggedIn ? (
                        <div className={styles.drawerFormGroup}>
                            <div className={drawerStyles.hotelSectionHeader}>
                                <div className={drawerStyles.hotelHeaderTitleCluster}>
                                    <Building2 size={13} className={drawerStyles.hotelHeaderIcon} />
                                    <label className={styles.drawerFormLabel}>
                                        Penugasan Multi-Hotel (Superadmin Only)
                                    </label>
                                </div>
                                <span className={drawerStyles.hotelCountBadge}>
                                    {currentOutlets.length} Dipilih
                                </span>
                            </div>
                            <p className={drawerStyles.hotelHelpText}>
                                Centang hotel yang dapat diakses oleh staf ini. Hanya Superadmin yang berhak mengatur hak multi-hotel.
                            </p>

                            <div className={drawerStyles.hotelListBox}>
                                {assignableHotels.map(h => {
                                    const isChecked = currentOutlets.includes(h.hotelCode);
                                    const isPrimary = h.hotelCode === activeHotelCode;
                                    return (
                                        <div 
                                            key={h.hotelCode}
                                            onClick={() => toggleHotelSelection(h.hotelCode)}
                                            className={`${drawerStyles.hotelRow} ${isChecked ? drawerStyles.hotelRowActive : drawerStyles.hotelRowInactive} ${isAccountLocked ? drawerStyles.hotelRowDisabled : ""}`}
                                        >
                                            <div className={drawerStyles.hotelInfoCluster}>
                                                {isChecked ? (
                                                    <CheckSquare size={15} className={drawerStyles.hotelCheckIconChecked} />
                                                ) : (
                                                    <Square size={15} className={drawerStyles.hotelCheckIconUnchecked} />
                                                )}
                                                <span className={`${drawerStyles.hotelName} ${isChecked ? drawerStyles.hotelNameBold : ""}`}>
                                                    {h.name || `Hotel [${h.hotelCode}]`}
                                                </span>
                                            </div>
                                            <div className={drawerStyles.hotelMetaCluster}>
                                                <span className={drawerStyles.hotelCodeBadge}>
                                                    #{h.hotelCode}
                                                </span>
                                                {isPrimary && (
                                                    <span className={drawerStyles.hotelActiveTag}>
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {!isAccountLocked && assignableHotels.length > 1 && (
                                <div className={drawerStyles.hotelQuickActions}>
                                    <button
                                        type="button"
                                        onClick={selectAllHotels}
                                        className={drawerStyles.btnQuickAction}
                                    >
                                        Pilih Semua Hotel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetToActiveHotel}
                                        className={drawerStyles.btnQuickAction}
                                    >
                                        Hanya Hotel Ini
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.drawerFormGroup}>
                            <label className={styles.drawerFormLabel}>Penugasan Properti Hotel</label>
                            <div className={styles.drawerInputWrapper}>
                                <div className={styles.drawerInputIcon}>
                                    <Building2 size={14} />
                                </div>
                                <input 
                                    type="text"
                                    disabled
                                    value={hotelsList.find(h => h.hotelCode === activeHotelCode)?.name || `Hotel #${activeHotelCode}`}
                                    className={styles.drawerInput}
                                />
                            </div>
                            <p className={drawerStyles.hotelHelpText}>
                                Staf otomatis ditugaskan ke hotel aktif ini. Hak akses multi-hotel hanya dapat diatur oleh Master Superadmin.
                            </p>
                        </div>
                    )}

                    {canEditPermissions ? (
                        <div className={styles.drawerFormGroup}>
                            <div className={styles.roleSelectHeader}>
                                <label className={styles.drawerFormLabel}>Organizational Role</label>
                                <span className={styles.levelBadge}>
                                    {formData.role?.toLowerCase() === "superadmin" ? 'Level 5 (Superadmin)' : (formData.role?.toLowerCase() === "admin" ? 'Level 3 (Admin Hotel)' : 'Level 1 (Staff)')}
                                </span>
                            </div>

                            {isOwnerUser && (
                                <div className={drawerStyles.ownerLockedAlert}>
                                    <Lock size={14} style={{ flexShrink: 0 }} />
                                    <span><b>Role Owner Terkunci:</b> Akun Admin Owner dari pendaftaran awal terkunci permanen. Hanya user/staf tambahan yang dibuat oleh Owner yang rolenya dapat diubah.</span>
                                </div>
                            )}

                            <div className={styles.roleButtonGrid}>
                                {availableRoles.map((role) => {
                                    const isSelected = formData.role === role;
                                    return (
                                        <button 
                                            key={role}
                                            type="button"
                                            disabled={isRoleLocked || isAccountLocked}
                                            onClick={() => {
                                                const newPerms = getStandardRolePermissions(role);
                                                setFormData({ ...formData, role, permissions: newPerms });
                                            }}
                                            className={`${styles.roleSelectBtn} ${isSelected ? styles.roleSelectBtnActive : ""} ${(isRoleLocked || isAccountLocked) ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            {role === "superadmin" ? "Superadmin (Chain)" : role}
                                        </button>
                                    );
                                })}
                                
                                {formData.role?.toLowerCase() === "admin" && !availableRoles.includes(formData.role) && (
                                    <button 
                                        key="admin"
                                        type="button"
                                        disabled={isRoleLocked || isAccountLocked}
                                        className={`${styles.roleSelectBtn} ${styles.roleSelectBtnActive} ${(isRoleLocked || isAccountLocked) ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        Admin (Owner)
                                    </button>
                                )}
                            </div>
                            {isOwnerUser ? (
                                <p className={drawerStyles.roleLockNotice}>
                                    <Lock size={10} /> Akun Admin Owner utama tidak dapat diubah rolenya.
                                </p>
                            ) : isRoleLocked && !isAccountLocked && (
                                <p className={drawerStyles.roleLockNotice}>
                                    <Lock size={10} /> Hanya Superadmin yang dapat mengubah Role Admin/Superadmin.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className={drawerStyles.viewerRoleCard}>
                            <div className={drawerStyles.viewerRoleCardHeader}>
                                <Shield size={13} className={drawerStyles.viewerRoleIcon} />
                                <span className={drawerStyles.viewerRoleLabel}>Organizational Role</span>
                                <span className={drawerStyles.viewerRoleBadgeLocked}><Lock size={10} /> Diatur Admin</span>
                            </div>
                            <div className={drawerStyles.viewerRoleValueRow}>
                                <span className={drawerStyles.viewerRoleValue}>{formData.role || "—"}</span>
                                <span className={styles.levelBadge}>
                                    {formData.role?.toLowerCase() === "superadmin" ? 'Level 5 (Superadmin)' : (formData.role?.toLowerCase() === "admin" ? 'Level 3 (Admin Hotel)' : 'Level 1 (Staff)')}
                                </span>
                            </div>
                            <p className={drawerStyles.viewerRoleHint}>Role ditetapkan oleh Superadmin / Admin Property. Hubungi admin jika perlu perubahan jabatan.</p>
                        </div>
                    )}

                    {/* ─── Channel Manager Second Backup Delegation (Superadmin Exclusive) ─── */}
                    {isSuperadminLoggedIn && (
                        <div style={{
                            margin: "14px 0",
                            padding: "14px 16px",
                            borderRadius: "10px",
                            background: currentPermissions["channel-manager"] === true 
                                ? "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(59,130,246,0.12))"
                                : "rgba(241,245,249,0.7)",
                            border: currentPermissions["channel-manager"] === true 
                                ? "1px solid rgba(59,130,246,0.3)" 
                                : "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            transition: "all 0.2s"
                        }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    background: currentPermissions["channel-manager"] === true ? "rgba(37,99,235,0.15)" : "#e2e8f0",
                                    color: currentPermissions["channel-manager"] === true ? "#2563eb" : "#64748b",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    marginTop: "2px"
                                }}>
                                    <Globe size={17} />
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                                            Akses Channel Manager
                                        </span>
                                        <span style={{
                                            fontSize: "10px",
                                            fontWeight: 700,
                                            padding: "1px 6px",
                                            borderRadius: "4px",
                                            background: currentPermissions["channel-manager"] === true ? "#dbeafe" : "#f1f5f9",
                                            color: currentPermissions["channel-manager"] === true ? "#1e40af" : "#64748b",
                                            border: "1px solid rgba(0,0,0,0.05)"
                                        }}>
                                            Second Backup
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
                                        Tunjuk personil ini sebagai cadangan kedua Superadmin untuk membuka modul <b>Channel Manager (Channex CRS OTA)</b>.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={isAccountLocked}
                                onClick={() => {
                                    const isCurrentlyBackup = currentPermissions["channel-manager"] === true;
                                    const nextVal = !isCurrentlyBackup;
                                    setFormData({
                                        ...formData,
                                        permissions: {
                                            ...currentPermissions,
                                            "channel-manager": nextVal,
                                            "module_channel_manager": nextVal,
                                            "cm_ari_push": nextVal,
                                            "cm_mapping": nextVal,
                                            "cm_ota_logs": nextVal,
                                            "cm_restrictions": nextVal
                                        }
                                    });
                                }}
                                style={{
                                    position: "relative",
                                    width: "44px",
                                    height: "24px",
                                    borderRadius: "12px",
                                    background: currentPermissions["channel-manager"] === true ? "#2563eb" : "#cbd5e1",
                                    border: "none",
                                    cursor: isAccountLocked ? "not-allowed" : "pointer",
                                    transition: "background 0.2s",
                                    flexShrink: 0
                                }}
                                title="Toggle Otoritas Second Backup Channel Manager"
                            >
                                <span style={{
                                    position: "absolute",
                                    top: "2px",
                                    left: currentPermissions["channel-manager"] === true ? "22px" : "2px",
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "50%",
                                    background: "#ffffff",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                                    transition: "left 0.2s"
                                }} />
                            </button>
                        </div>
                    )}

                    {/* ─── Role Permissions Matrix Section ─── */}
                    {isPermLocked ? (
                        <div className={drawerStyles.permSection}>
                            <div className={drawerStyles.permLockedBanner}>
                                <Lock size={13} style={{ flexShrink: 0 }} />
                                <span><b>View-Only:</b> Hak akses hanya bisa diatur <b>Superadmin</b> &amp; <b>Admin Property</b>. Kamu tidak bisa mengubah permission sendiri.</span>
                            </div>
                            <div className={drawerStyles.permHeader}>
                                <div className={drawerStyles.permTitleCluster}>
                                    <span className={drawerStyles.permTitle}>
                                        <Shield size={14} />
                                        Hak Akses Kamu
                                    </span>
                                    <p className={drawerStyles.permSubtitle}>
                                        {activePermsCount} izin aktif untuk role <b>{formData.role}</b> — hubungi admin jika perlu perubahan
                                    </p>
                                </div>
                            </div>
                            <p className={drawerStyles.viewerPermIntro}>
                                Modul di bawah hanya yang aktif untuk akun ini. Modul tanpa akses disembunyikan otomatis. Contoh: Purchasing Officer hanya lihat bagian Purchasing.
                            </p>
                            {(() => {
                                const viewerGroups = filteredGroups
                                    .map(g => {
                                        const activeOnly = g.permissions.filter(p => currentPermissions[p.id] === true);
                                        if (activeOnly.length === 0) return null;
                                        return { ...g, permissions: activeOnly };
                                    })
                                    .filter(Boolean) as typeof COMPREHENSIVE_PERMISSION_GROUPS;
                                if (viewerGroups.length === 0) {
                                    return <div className={drawerStyles.viewerEmptyState}>Tidak ada izin aktif untuk role ini. Hubungi Admin Property.</div>;
                                }
                                return (
                                    <div className={drawerStyles.permListBox}>
                                        {viewerGroups.map(group => (
                                            <div key={group.id} className={drawerStyles.viewerPermModule}>
                                                <div className={drawerStyles.viewerPermModuleHead}>
                                                    <span className={drawerStyles.viewerPermModuleTitle}>{group.label}</span>
                                                    <span className={drawerStyles.viewerPermModuleCount}>{group.permissions.length} aktif</span>
                                                </div>
                                                {group.permissions.map(p => (
                                                    <div key={p.id} className={drawerStyles.viewerPermItem}>
                                                        <span className={drawerStyles.viewerPermCheck}><Check size={10} strokeWidth={3} /></span>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                                                            <span className={drawerStyles.viewerPermItemLabel}>
                                                                {p.label}
                                                                {p.isDangerous && <span className={drawerStyles.sensitiveBadge} style={{ marginLeft: 6 }}>Sensitif</span>}
                                                                {p.isAction && <span className={drawerStyles.actionBadge} style={{ marginLeft: 6 }}>Otoritas Tombol</span>}
                                                                {p.isComingSoon && <span className={drawerStyles.roadmapBadge} style={{ marginLeft: 6 }}>Segera Hadir</span>}
                                                            </span>
                                                            <span className={drawerStyles.viewerPermItemDesc}>{p.description}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className={drawerStyles.permSection}>
                            <div className={drawerStyles.permHeader}>
                                <div className={drawerStyles.permTitleCluster}>
                                    <span className={drawerStyles.permTitle}>
                                        <SlidersHorizontal size={14} />
                                        Hak Akses & Privileges Role
                                    </span>
                                    <p className={drawerStyles.permSubtitle}>
                                        {activePermsCount} dari {TOTAL_PERMISSIONS_COUNT} izin aktif untuk role <b>{formData.role}</b>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetPermissions}
                                    className={drawerStyles.btnResetPerm}
                                    title="Reset hak akses ke standar role"
                                >
                                    Reset Standar Role
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Cari izin fitur, laporan, void, diskon..."
                                value={permSearch}
                                onChange={(e) => setPermSearch(e.target.value)}
                                className={drawerStyles.permSearchInput}
                            />

                            <div className={drawerStyles.moduleTagsBar}>
                                <button
                                    type="button"
                                    onClick={() => setPermTag("all")}
                                    className={`${drawerStyles.moduleTag} ${permTag === "all" ? drawerStyles.moduleTagActive : ""}`}
                                >
                                    Semua
                                    <span className={`${drawerStyles.tagCountBadge} ${activePermsCount > 0 ? drawerStyles.tagCountBadgeActive : ""}`}>
                                        {activePermsCount}
                                    </span>
                                </button>
                                {COMPREHENSIVE_PERMISSION_GROUPS.filter(g => !g.isSuperadminOnly).map(g => {
                                    const activeCount = g.permissions.filter(p => currentPermissions[p.id] === true).length;
                                    const isSelected = permTag === g.id;
                                    return (
                                        <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => setPermTag(g.id)}
                                            className={`${drawerStyles.moduleTag} ${isSelected ? drawerStyles.moduleTagActive : ""}`}
                                        >
                                            {g.shortLabel || g.label.split(" (")[0]}
                                            <span className={`${drawerStyles.tagCountBadge} ${activeCount > 0 ? drawerStyles.tagCountBadgeActive : ""}`}>
                                                {activeCount}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className={drawerStyles.permListBox}>
                                {filteredGroups.map(group => {
                                    const isExpanded = expandedGroups[group.id] !== false;
                                    const activeInGroup = group.permissions.filter(p => currentPermissions[p.id] === true).length;
                                    const isAllInGroupActive = group.permissions.length > 0 && activeInGroup === group.permissions.length;
                                    return (
                                        <div key={group.id} className={drawerStyles.permGroupCard}>
                                            <div 
                                                className={drawerStyles.permGroupHeader}
                                                onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !isExpanded }))}
                                            >
                                                <span className={drawerStyles.permGroupTitle}>{group.label}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleModuleGroup(group); }}
                                                        style={{
                                                            fontSize: "10.5px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px",
                                                            border: "1px solid #cbd5e1",
                                                            background: isAllInGroupActive ? "#fef2f2" : "#f1f5f9",
                                                            color: isAllInGroupActive ? "#b91c1c" : "#0f172a", cursor: "pointer"
                                                        }}
                                                    >
                                                        {isAllInGroupActive ? "Matikan Modul" : "Pilih Semua"}
                                                    </button>
                                                    <span className={`${drawerStyles.permCountBadge} ${activeInGroup > 0 ? drawerStyles.permCountBadgeActive : ""}`}>
                                                        {activeInGroup} / {group.permissions.length}
                                                    </span>
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className={drawerStyles.permItemsContainer}>
                                                    {group.permissions.map(p => {
                                                        const addon = isPermissionAddon(p.id);
                                                        const isAddonDisabled = addon.isAddon && !isAddonActiveForHotel(p.id, activeModules);
                                                        const isRoadmap = p.isComingSoon === true;
                                                        const isLocked = isRoadmap || isAddonDisabled;
                                                        const isChecked = isAddonDisabled ? false : currentPermissions[p.id] === true;

                                                        return (
                                                            <div 
                                                                key={p.id} 
                                                                className={drawerStyles.permRow} 
                                                                onClick={() => {
                                                                    if (!isLocked) togglePermission(p.id);
                                                                }}
                                                                style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                                                            >
                                                                <div className={drawerStyles.permLabelCluster}>
                                                                    <span className={drawerStyles.permLabelText}>
                                                                        {p.label}
                                                                        {p.isDangerous && <span className={drawerStyles.sensitiveBadge}>Sensitif</span>}
                                                                        {p.isAction && <span className={drawerStyles.actionBadge}>Otoritas Tombol</span>}
                                                                        {isRoadmap && <span className={drawerStyles.roadmapBadge}>Segera Hadir</span>}
                                                                        {addon.isAddon && !isAddonDisabled && <span className={drawerStyles.addonActiveBadge}>Add-on Aktif</span>}
                                                                        {isAddonDisabled && <span className={drawerStyles.addonLockedBadge} title={`Memerlukan aktivasi Add-on ${addon.addonName} pada paket hotel`}>Add-on Belum Berlangganan</span>}
                                                                    </span>
                                                                    <span className={drawerStyles.permDescText}>
                                                                        {p.description}
                                                                        {isRoadmap && " (Roadmap / Segera Hadir)"}
                                                                        {isAddonDisabled && ` (Fitur Add-on: Memerlukan aktivasi ${addon.addonName} oleh Superadmin)`}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    disabled={isLocked}
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        if (!isLocked) togglePermission(p.id); 
                                                                    }}
                                                                    className={`${drawerStyles.permSwitch} ${isLocked ? drawerStyles.permSwitchRoadmap : isChecked ? drawerStyles.permSwitchOn : drawerStyles.permSwitchOff}`}
                                                                    title={isRoadmap ? "Fitur sedang dalam pengembangan (Roadmap)" : isAddonDisabled ? `Memerlukan aktivasi Add-on ${addon.addonName} pada paket properti` : isChecked ? "Nonaktifkan hak akses" : "Aktifkan hak akses"}
                                                                >
                                                                    <span className={`${drawerStyles.permSwitchThumb} ${isChecked && !isLocked ? drawerStyles.permSwitchThumbOn : drawerStyles.permSwitchThumbOff}`} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <footer className={styles.drawerFooter}>
                    <button 
                        onClick={onSave}
                        disabled={isSaving || isAccountLocked}
                        className={styles.submitBtn}
                    >
                        {isSaving ? (
                            <RefreshCw size={14} className={styles.animateSpin} />
                        ) : (
                            editingUser ? <RefreshCw size={14} /> : <Check size={14} />
                        )}
                        {isSaving 
                            ? 'Processing...' 
                            : (editingUser ? 'Update Profile' : 'Confirm & Create')
                        }
                    </button>
                    <button 
                        onClick={onClose} 
                        className={styles.cancelBtn}
                    >
                        Cancel
                    </button>
                </footer>
            </motion.div>
        </>
    );
};
