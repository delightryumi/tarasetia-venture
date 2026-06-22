import React, { useState } from "react";
import { ShieldAlert, Check, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile } from "../types";
import { PermissionModule } from "../UsersSection";
import styles from "../UsersStyles.module.css";

interface RoleCardProps {
    user: UserProfile;
    permissionTree: PermissionModule[];
    onToggle: (userId: string, menuId: string, current: boolean) => void;
    onToggleModule: (userId: string, moduleId: string, subMenuIds: string[], current: boolean) => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ user, permissionTree, onToggle, onToggleModule }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // If user is admin or superadmin, their permissions are implicitly fully open
    // based on the purchased package. We lock the toggles to prevent mismatch.
    const isLockedAdmin = user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "superadmin";

    return (
        <div className={styles.roleCard}>
            <header 
                className={`${styles.roleCardHeader} ${isExpanded ? styles.roleCardHeaderExpanded : ""}`}
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ cursor: "pointer", userSelect: "none" }}
            >
                <div className={styles.roleHeaderCluster}>
                    <div className={styles.roleIconContainer}>
                        <ShieldAlert size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 className={styles.roleLabel}>{user.name}</h3>
                        <p className={styles.roleSubtitle}>{user.role} | User Access Profile</p>
                    </div>
                    <div className={`${styles.chevronContainer} ${isExpanded ? styles.chevronExpanded : ""}`}>
                        <ChevronDown size={16} />
                    </div>
                </div>
            </header>
            
            {/* Card Body & Footer Accordion */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                    >
                        {/* Card Body - Nested Modules & Submenus */}
                        <div className={`${styles.roleCardBody} ${styles.customScrollbar}`}>
                            {permissionTree.map((mod) => {
                                const isModuleEnabled = user.permissions?.[mod.id] !== false;
                                
                                return (
                                    <div key={mod.id} className={styles.moduleBox}>
                                        {/* Module Header Toggle */}
                                        <div className={styles.moduleHeader}>
                                            <div className={styles.moduleLabelCluster}>
                                                <div className={styles.moduleIcon}>
                                                    {mod.icon}
                                                </div>
                                                <span className={styles.moduleLabel}>
                                                    {mod.label} 
                                                    {isLockedAdmin && <span style={{fontSize: "10px", marginLeft: "6px", color: "#8d7a52", fontWeight: 600}}>(Full Access)</span>}
                                                </span>
                                            </div>
                                            
                                            <button 
                                                type="button"
                                                disabled={isLockedAdmin}
                                                onClick={(e) => {
                                                    if (isLockedAdmin) return;
                                                    e.stopPropagation();
                                                    // Auto-ON all submenus when enabling module
                                                    const subIds = mod.submenus.map(s => s.id);
                                                    onToggleModule(user.id, mod.id, subIds, isModuleEnabled);
                                                }}
                                                className={`${styles.toggleBtn} ${isModuleEnabled || isLockedAdmin ? styles.toggleBtnOn : styles.toggleBtnOff} ${isLockedAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                <div className={styles.toggleCircle}>
                                                    {isModuleEnabled || isLockedAdmin ? (
                                                        <Check size={6} className={styles.toggleIconOn} />
                                                    ) : (
                                                        <X size={6} className={styles.toggleIconOff} />
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                        
                                        {/* Submenu Items */}
                                        <div className={`${styles.submenuContainer} ${!isModuleEnabled ? styles.submenuContainerDisabled : ''}`}>
                                            {mod.submenus.map((sub) => {
                                                const isSubEnabled = isModuleEnabled && (user.permissions?.[sub.id] === true);
                                                
                                                return (
                                                    <div 
                                                        key={sub.id}
                                                        className={styles.submenuRow}
                                                    >
                                                        <div className={styles.submenuLabelCluster}>
                                                            <div className={styles.submenuIcon}>
                                                                {sub.icon}
                                                            </div>
                                                            <span className={styles.submenuLabel}>{sub.label}</span>
                                                        </div>
                                                        
                                                        <button 
                                                            type="button"
                                                            disabled={(!isModuleEnabled && !isLockedAdmin) || isLockedAdmin}
                                                            onClick={(e) => {
                                                                if (isLockedAdmin) return;
                                                                e.stopPropagation(); // Avoid triggering accordion close
                                                                onToggle(user.id, sub.id, isSubEnabled);
                                                            }}
                                                            className={`${styles.toggleBtnSub} ${isSubEnabled || isLockedAdmin ? styles.toggleBtnSubOn : styles.toggleBtnSubOff} ${isLockedAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
                                                        >
                                                            <div className={styles.toggleCircleSub}>
                                                                {isSubEnabled || isLockedAdmin ? (
                                                                    <Check size={5} className={styles.toggleIconOn} />
                                                                ) : (
                                                                    <X size={5} className={styles.toggleIconOff} />
                                                                )}
                                                            </div>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Card Footer */}
                        <footer className={styles.roleCardFooter}>
                            <span>
                                {Object.entries(user.permissions || {}).filter(([key, val]) => val && !key.startsWith("module_") && key !== "pos").length} Active Features
                            </span>
                            <div className={styles.footerDivider} />
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

