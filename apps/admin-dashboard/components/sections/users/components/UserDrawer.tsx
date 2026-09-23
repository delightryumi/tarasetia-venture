import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
    X, Plus, User, Mail, RefreshCw, Check, Lock, Building2, 
    CheckSquare, Square, Shield, SlidersHorizontal, ChevronDown, ChevronUp, AlertTriangle 
} from "lucide-react";
import { UserProfile } from "../types";
import { COMPREHENSIVE_PERMISSION_GROUPS, getStandardRolePermissions, TOTAL_PERMISSIONS_COUNT } from "../permissionConfig";
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
}

export const UserDrawer: React.FC<UserDrawerProps> = ({ 
    isOpen, onClose, editingUser, formData, setFormData, roles, onSave, isSaving, onChangePassword, authUser,
    hotelsList = [], activeHotelCode
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

    const currentPermissions: Record<string, boolean> = formData.permissions || getStandardRolePermissions(formData.role || "General Manager");

    const togglePermission = (permId: string) => {
        if (isAccountLocked) return;
        const nextPerms = {
            ...currentPermissions,
            [permId]: !currentPermissions[permId]
        };
        setFormData({
            ...formData,
            permissions: nextPerms
        });
    };

    const toggleModuleGroup = (group: any) => {
        if (isAccountLocked) return;
        const allActive = group.permissions.every((p: any) => currentPermissions[p.id] === true);
        const nextState = !allActive;
        const nextPerms = { ...currentPermissions };
        nextPerms[group.id] = nextState;
        group.permissions.forEach((p: any) => {
            nextPerms[p.id] = nextState;
        });
        setFormData({
            ...formData,
            permissions: nextPerms
        });
    };

    const resetPermissions = () => {
        if (isAccountLocked) return;
        const std = getStandardRolePermissions(formData.role || "General Manager");
        setFormData({
            ...formData,
            permissions: std
        });
    };

    const activePermsCount = Object.entries(currentPermissions).filter(([key, val]) => 
        val === true && !key.startsWith("module_")
    ).length;

    const filteredGroups = COMPREHENSIVE_PERMISSION_GROUPS.filter(group => {
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
                            
                            {/* If the current role is 'admin' and not in the roles list, show it as an active button */}
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

                    {/* ─── Role Permissions Matrix Section ─── */}
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
                            {!isAccountLocked && (
                                <button
                                    type="button"
                                    onClick={resetPermissions}
                                    className={drawerStyles.btnResetPerm}
                                    title="Reset hak akses ke standar role"
                                >
                                    Reset Standar Role
                                </button>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Cari izin fitur, laporan, void, diskon..."
                            value={permSearch}
                            onChange={(e) => setPermSearch(e.target.value)}
                            className={drawerStyles.permSearchInput}
                        />

                        {/* Module Tags / Filter Chips */}
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
                            {COMPREHENSIVE_PERMISSION_GROUPS.map(g => {
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
                                            <span className={drawerStyles.permGroupTitle}>
                                                {group.label}
                                            </span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <button
                                                    type="button"
                                                    disabled={isAccountLocked}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleModuleGroup(group);
                                                    }}
                                                    style={{
                                                        fontSize: "10.5px",
                                                        fontWeight: 600,
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        border: "1px solid #cbd5e1",
                                                        background: isAllInGroupActive ? "#fef2f2" : "#f1f5f9",
                                                        color: isAllInGroupActive ? "#b91c1c" : "#0f172a",
                                                        cursor: "pointer"
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
                                                    const isChecked = currentPermissions[p.id] === true;
                                                    return (
                                                        <div 
                                                            key={p.id}
                                                            className={drawerStyles.permRow}
                                                            onClick={() => togglePermission(p.id)}
                                                        >
                                                            <div className={drawerStyles.permLabelCluster}>
                                                                <span className={drawerStyles.permLabelText}>
                                                                    {p.label}
                                                                    {p.isDangerous && (
                                                                        <span className={drawerStyles.sensitiveBadge}>
                                                                            Sensitif
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <span className={drawerStyles.permDescText}>
                                                                    {p.description}
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                disabled={isAccountLocked}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    togglePermission(p.id);
                                                                }}
                                                                className={`${drawerStyles.permSwitch} ${isChecked ? drawerStyles.permSwitchOn : drawerStyles.permSwitchOff}`}
                                                            >
                                                                <span className={`${drawerStyles.permSwitchThumb} ${isChecked ? drawerStyles.permSwitchThumbOn : drawerStyles.permSwitchThumbOff}`} />
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
