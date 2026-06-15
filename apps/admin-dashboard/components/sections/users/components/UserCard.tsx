import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Edit3, Trash2, Lock, MoreVertical } from "lucide-react";
import { UserProfile } from "../types";
import styles from "../UsersStyles.module.css";

interface UserCardProps {
    user: UserProfile;
    onEdit: (user: UserProfile) => void;
    onDelete: (id: string, name: string) => void;
    variants: any;
    onChangePasswordClick?: (user: UserProfile) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete, variants, onChangePasswordClick }) => {
    const isSystemAdmin = user.email === "nexura.management@gmail.com";
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
    
    return (
        <motion.div 
            variants={variants}
            className={styles.userCard}
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
                        <h3 className={styles.userName}>{user.name}</h3>
                        <span className={styles.userRole}>{user.role}</span>
                    </div>
                </div>
                
                <div className={styles.cardActions}>
                    {isSystemAdmin ? (
                        <div className={styles.lockBadge}>
                            <Lock size={10} />
                            <span>System Lock</span>
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
                                            <span>Edit User</span>
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
            
            <div className={styles.cardBody}>
                <div className={styles.cardDetailItem}>
                    <Mail size={12} className={styles.mailIcon} />
                    <span>{user.email}</span>
                </div>
            </div>

            <div className={styles.cardFooter}>
                <span className={styles.footerLeftActive}>
                    <span className={styles.footerLeftActiveCircle}></span>
                    Active Profile
                </span>
                <span className={styles.footerRightSecure}>
                    <Lock size={9} />
                    Secure
                </span>
            </div>
        </motion.div>
    );
};
