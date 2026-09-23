import React from "react";
import { motion } from "framer-motion";
import { X, Plus, User, Mail, RefreshCw, Check, Lock, Building2, CheckSquare, Square, Shield } from "lucide-react";
import { UserProfile } from "../types";
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
    
    // Check if the role selection should be locked
    const isEditingAdmin = editingUser?.role?.toLowerCase() === "admin" || formData.role?.toLowerCase() === "admin";
    const isEditingSuperadmin = editingUser?.role?.toLowerCase() === "superadmin" || formData.role?.toLowerCase() === "superadmin";
    const isSuperadminLoggedIn = authUser?.role?.toLowerCase() === "superadmin";
    
    // Non-superadmin cannot edit a Superadmin account or promote to Superadmin
    const isAccountLocked = isEditingSuperadmin && !isSuperadminLoggedIn;
    const lockRoleSelection = (isEditingAdmin || isEditingSuperadmin) && !isSuperadminLoggedIn;

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
                        <div className={styles.roleButtonGrid}>
                            {availableRoles.map((role) => {
                                const isSelected = formData.role === role;
                                return (
                                    <button 
                                        key={role}
                                        type="button"
                                        disabled={lockRoleSelection || isAccountLocked}
                                        onClick={() => setFormData({...formData, role})}
                                        className={`${styles.roleSelectBtn} ${isSelected ? styles.roleSelectBtnActive : ""} ${(lockRoleSelection || isAccountLocked) ? "opacity-50 cursor-not-allowed" : ""}`}
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
                                    disabled={lockRoleSelection || isAccountLocked}
                                    className={`${styles.roleSelectBtn} ${styles.roleSelectBtnActive} ${(lockRoleSelection || isAccountLocked) ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    Admin (Owner)
                                </button>
                            )}
                        </div>
                        {lockRoleSelection && !isAccountLocked && (
                            <p className={drawerStyles.roleLockNotice}>
                                <Lock size={10} /> Hanya Superadmin yang dapat mengubah Role Admin/Superadmin.
                            </p>
                        )}
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
