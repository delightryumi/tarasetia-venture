import React from "react";
import { motion } from "framer-motion";
import { X, Plus, User, Mail, RefreshCw, Check, Lock, Key } from "lucide-react";
import { UserProfile } from "../types";
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
}

export const UserDrawer: React.FC<UserDrawerProps> = ({ 
    isOpen, onClose, editingUser, formData, setFormData, roles, onSave, isSaving 
}) => {
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
                            <span className={styles.drawerHeaderMetaText}>Administrative Action</span>
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
                    <div className={styles.drawerFormGroup}>
                        <label className={styles.drawerFormLabel}>Full Name</label>
                        <div className={styles.drawerInputWrapper}>
                            <div className={styles.drawerInputIcon}>
                                <User size={14} />
                            </div>
                            <input 
                                type="text"
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
                                disabled={!!editingUser}
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

                    {editingUser && (
                        <div style={{ paddingTop: '8px' }}>
                            <button 
                                onClick={() => alert("Password reset link sent to user email.")}
                                className={styles.resetBtnCluster}
                            >
                                <div className={styles.resetIconBox}>
                                    <Key size={12} />
                                </div>
                                <span>Reset User Password</span>
                            </button>
                        </div>
                    )}

                    <div className={styles.drawerFormGroup} style={{ gap: '12px' }}>
                        <div className={styles.roleSelectHeader}>
                            <label className={styles.drawerFormLabel}>Organizational Role</label>
                            <span className={styles.levelBadge}>Level {formData.role === "superadmin" ? '5' : '3'}</span>
                        </div>
                        <div className={styles.roleButtonGrid}>
                            {roles.map((role) => {
                                const isSelected = formData.role === role;
                                return (
                                    <button 
                                        key={role}
                                        type="button"
                                        onClick={() => setFormData({...formData, role})}
                                        className={`${styles.roleSelectBtn} ${isSelected ? styles.roleSelectBtnActive : ""}`}
                                    >
                                        {role}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <footer className={styles.drawerFooter}>
                    <button 
                        onClick={onSave}
                        disabled={isSaving}
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

