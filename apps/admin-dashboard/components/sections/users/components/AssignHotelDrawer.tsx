import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, ShieldAlert, Check } from "lucide-react";
import { UserProfile } from "../types";
import styles from "./AssignHotelDrawer.module.css";
import { toast } from "sonner";

interface AssignHotelDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile | null;
    hotelsList: Array<{ hotelCode: string; name: string }>;
    activeHotelCode?: string;
    authUser?: any;
    onSaveOutlets: (userId: string, outlets: string[]) => Promise<void>;
}

export const AssignHotelDrawer: React.FC<AssignHotelDrawerProps> = ({
    isOpen,
    onClose,
    user,
    hotelsList = [],
    activeHotelCode,
    authUser,
    onSaveOutlets
}) => {
    const isSuperadmin = 
        authUser?.role?.toLowerCase() === "superadmin" || 
        authUser?.role?.toLowerCase() === "super_admin" ||
        authUser?.role?.toLowerCase() === "super admin" ||
        authUser?.email?.toLowerCase() === "superadmin@setara.co.id";

    const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            const initial = user.allowedOutlets && user.allowedOutlets.length > 0 
                ? [...user.allowedOutlets] 
                : (user.hotelCode ? [user.hotelCode] : (activeHotelCode ? [activeHotelCode] : []));
            setSelectedOutlets(initial);
        }
    }, [user, activeHotelCode]);

    if (!isOpen || !user) return null;

    const toggleHotel = (hotelCode: string) => {
        if (!isSuperadmin) {
            toast.error("Hanya Master Superadmin yang berwenang mengubah penugasan Multi-Hotel.");
            return;
        }

        setSelectedOutlets(prev => {
            if (prev.includes(hotelCode)) {
                if (prev.length <= 1) {
                    toast.error("Pengguna harus memiliki minimal 1 properti aktif.");
                    return prev;
                }
                return prev.filter(c => c !== hotelCode);
            } else {
                return [...prev, hotelCode];
            }
        });
    };

    const handleReset = () => {
        if (user) {
            const initial = user.allowedOutlets && user.allowedOutlets.length > 0 
                ? [...user.allowedOutlets] 
                : (user.hotelCode ? [user.hotelCode] : (activeHotelCode ? [activeHotelCode] : []));
            setSelectedOutlets(initial);
        }
    };

    const handleUpdate = async () => {
        if (!isSuperadmin) {
            toast.error("Hanya Master Superadmin yang berwenang mengubah penugasan Multi-Hotel.");
            return;
        }

        setIsSaving(true);
        try {
            await onSaveOutlets(user.id, selectedOutlets);
            toast.success("Penugasan hotel berhasil diperbarui.", {
                description: `${user.name} sekarang memiliki akses ke ${selectedOutlets.length} properti.`
            });
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Gagal memperbarui penugasan hotel.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className={styles.drawerBackdrop} onClick={onClose}>
                <motion.div 
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "tween", duration: 0.25 }}
                    className={styles.drawerContent}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={styles.drawerHeader}>
                        <h2 className={styles.drawerTitle}>Assign Hotel</h2>
                        <button type="button" onClick={onClose} className={styles.drawerCloseBtn} title="Tutup">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className={styles.drawerBody}>
                        {/* User Summary */}
                        <div className={styles.userSummaryCard}>
                            <span className={styles.userSummaryName}>{user.name}</span>
                            <span className={styles.userSummaryEmail}>{user.email} &bull; {user.role}</span>
                        </div>

                        {!isSuperadmin && (
                            <div className={styles.noticeAlert}>
                                <strong>Kebijakan Multi-Hotel:</strong> Pengaturan akses multi-properti dikunci untuk tingkat Super Administrator guna mencegah tumpang tindih data antar properti.
                            </div>
                        )}

                        {/* Hotel List */}
                        <div className={styles.hotelListContainer}>
                            {hotelsList.map((hotel) => {
                                const isChecked = selectedOutlets.includes(hotel.hotelCode);

                                return (
                                    <div 
                                        key={hotel.hotelCode}
                                        className={`${styles.hotelItemRow} ${isChecked ? styles.hotelItemRowSelected : ""}`}
                                    >
                                        <label className={styles.hotelCheckLabel}>
                                            <input 
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={!isSuperadmin}
                                                onChange={() => toggleHotel(hotel.hotelCode)}
                                                className={styles.checkboxInput}
                                            />
                                            <span>{hotel.name} <small style={{ color: "#94a3b8" }}>({hotel.hotelCode})</small></span>
                                        </label>

                                        <select 
                                            disabled={!isSuperadmin || !isChecked}
                                            className={styles.hotelRoleSelect}
                                            value={user.role || "General Manager"}
                                            onChange={() => {}}
                                        >
                                            <option>{user.role || "General Manager"}</option>
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.drawerFooter}>
                        <button type="button" onClick={handleReset} className={styles.resetBtn}>
                            Reset
                        </button>
                        <button 
                            type="button" 
                            disabled={!isSuperadmin || isSaving}
                            onClick={handleUpdate} 
                            className={styles.updateBtn}
                        >
                            {isSaving ? "Updating..." : "Update"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
