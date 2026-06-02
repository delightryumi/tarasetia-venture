import React from "react";
import { motion } from "framer-motion";
import { Mail, Edit3, Trash2, Lock } from "lucide-react";
import { UserProfile } from "../types";
import styles from "../UsersStyles.module.css";

interface UserCardProps {
    user: UserProfile;
    onEdit: (user: UserProfile) => void;
    onDelete: (id: string, name: string) => void;
    variants: any;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete, variants }) => {
    const isSystemAdmin = user.email === "nexura.management@gmail.com";
    
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
                        <>
                            <button 
                                type="button"
                                onClick={() => onEdit(user)}
                                className={styles.iconButton}
                            >
                                <Edit3 size={12} />
                            </button>
                            <button 
                                type="button"
                                onClick={() => onDelete(user.id, user.name)}
                                className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                            >
                                <Trash2 size={12} />
                            </button>
                        </>
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
