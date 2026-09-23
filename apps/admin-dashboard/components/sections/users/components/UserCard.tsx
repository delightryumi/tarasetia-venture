import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Edit3, Trash2, Lock, MoreVertical, Building2, ShieldCheck, Shield, Crown } from "lucide-react";
import { UserProfile } from "../types";
import styles from "../UsersStyles.module.css";

interface UserCardProps {
    user: UserProfile;
    onEdit: (user: UserProfile) => void;
    onDelete: (id: string, name: string) => void;
    variants: any;
    onChangePasswordClick?: (user: UserProfile) => void;
    authUser?: any;
    hotelsList?: Array<{ hotelCode: string; name: string }>;
}

export const UserCard: React.FC<UserCardProps> = ({ 
    user, onEdit, onDelete, variants, onChangePasswordClick, authUser, hotelsList = []
}) => {
    const isSuperadminUser = user.role?.toLowerCase() === "superadmin";
    const isSystemAdmin = user.email === "nexura.management@gmail.com" || user.email === "superadmin@setara.co.id";
    const isRequesterSuperadmin = 
        authUser?.role?.toLowerCase() === "superadmin" || 
        authUser?.role?.toLowerCase() === "super_admin" ||
        authUser?.role?.toLowerCase() === "super admin" ||
        authUser?.email?.toLowerCase() === "superadmin@setara.co.id";
    
    // Detect if this user is the primary Admin Owner registered with the hotel
    const userHotel = hotelsList.find(h => h.hotelCode === user.hotelCode);
    const hotelOwnerEmail = (userHotel as any)?.email?.toLowerCase();
    const isOwnerUser = Boolean(
        (user.isOwner === true || (hotelOwnerEmail && user.email?.toLowerCase() === hotelOwnerEmail)) && 
        !user.createdBy
    );

    // Non-superadmin cannot touch a Superadmin user
    const isLockedFromCurrentViewer = (isSuperadminUser || isSystemAdmin) && !isRequesterSuperadmin;

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const outletCount = user.allowedOutlets && user.allowedOutlets.length > 0 ? user.allowedOutlets.length : 1;
    
    return (
        <motion.div 
            variants={variants}
            className={styles.userCard}
            style={{
                border: isSuperadminUser ? "1px solid #fef08a" : undefined,
                background: isSuperadminUser ? "#fffdf5" : undefined
            }}
        >
            <div className={styles.cardHeader}>
                <div className={styles.profileInfo}>
                    <div className={styles.avatarContainer}>
                        <img 
                            src={`/avatar/memo_${((((user.name || "U").charCodeAt(0) || 0) + (user.email || "E").charCodeAt(0)) % 35) + 1}.png`} 
                            alt={user.name}
                            className={styles.avatarImage}
                        />
                    </div>
                    <div className={styles.nameRoleCluster}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <h3 className={styles.userName}>{user.name}</h3>
                            {isSuperadminUser && (
                                <span title="Master Superadmin" style={{ display: "inline-flex", color: "#ca8a04" }}>
                                    <ShieldCheck size={14} />
                                </span>
                            )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                            <span className={styles.userRole} style={{
                                background: isSuperadminUser ? "#fef9c3" : undefined,
                                color: isSuperadminUser ? "#a16207" : undefined,
                                fontWeight: isSuperadminUser ? 700 : undefined
                            }}>
                                {isSuperadminUser ? "Master Superadmin" : user.role}
                            </span>
                            {isOwnerUser && (
                                <span style={{
                                    fontSize: "10px",
                                    background: "#fef3c7",
                                    color: "#b45309",
                                    padding: "1px 6px",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px"
                                }}>
                                    <Crown size={10} />
                                    Hotel Owner (Terkunci)
                                </span>
                            )}
                            {outletCount > 1 && (
                                <span style={{
                                    fontSize: "10px",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    padding: "1px 6px",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px"
                                }}>
                                    <Building2 size={10} />
                                    {outletCount} Hotel Chain
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className={styles.cardActions}>
                    {isLockedFromCurrentViewer ? (
                        <div className={styles.lockBadge} title="Akun Superadmin dilindungi dari modifikasi Admin properti">
                            <Lock size={10} />
                            <span>Protected</span>
                        </div>
                    ) : (
                        <div className={styles.dropdownContainer} ref={menuRef}>
                            <button 
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                className={styles.iconButton}
                            >
                                <MoreVertical size={14} />
                            </button>
                            
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.1 }}
                                        className={styles.dropdownMenu}
                                    >
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                onEdit(user);
                                                setIsOpen(false);
                                            }}
                                            className={styles.dropdownItem}
                                        >
                                            <Edit3 size={14} />
                                            <span>{isRequesterSuperadmin ? "Edit User & Multi-Hotel" : "Edit Profil User"}</span>
                                        </button>
                                        
                                        {onChangePasswordClick && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    onChangePasswordClick(user);
                                                    setIsOpen(false);
                                                }}
                                                className={styles.dropdownItem}
                                            >
                                                <Lock size={14} />
                                                <span>Change Password</span>
                                            </button>
                                        )}
                                        
                                        {!isOwnerUser ? (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    onDelete(user.id, user.name);
                                                    setIsOpen(false);
                                                }}
                                                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                            >
                                                <Trash2 size={14} />
                                                <span>Delete User</span>
                                            </button>
                                        ) : (
                                            <div style={{
                                                padding: "6px 12px",
                                                fontSize: "11px",
                                                color: "#94a3b8",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}>
                                                <Lock size={12} />
                                                <span>Owner Terproteksi</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.contactItem}>
                    <Mail size={12} className={styles.contactIcon} />
                    <span className={styles.contactText}>{user.email}</span>
                </div>
                {user.allowedOutlets && user.allowedOutlets.length > 0 && (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#64748b" }}>
                            <Building2 size={11} />
                            <span>Properti:</span>
                            <span style={{ color: "#334155", fontWeight: 500 }}>
                                {user.allowedOutlets.slice(0, 3).join(", ")}
                                {user.allowedOutlets.length > 3 ? ` +${user.allowedOutlets.length - 3} lainnya` : ""}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
