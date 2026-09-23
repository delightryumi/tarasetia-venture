import React, { useState, useRef, useEffect } from "react";
import { 
    MoreVertical, Edit3, Trash2, Lock, Building2, 
    ShieldCheck, Crown, ShieldAlert, FileText, Smartphone
} from "lucide-react";
import { UserProfile } from "../types";
import styles from "./UserTable.module.css";

interface UserTableProps {
    users: UserProfile[];
    onEdit: (user: UserProfile) => void;
    onDelete: (id: string, name: string) => void;
    onChangePasswordClick: (user: UserProfile) => void;
    onAssignHotelClick: (user: UserProfile) => void;
    onViewLogsClick?: (user: UserProfile) => void;
    authUser?: any;
    hotelsList?: Array<{ hotelCode: string; name: string }>;
}

export const UserTable: React.FC<UserTableProps> = ({
    users,
    onEdit,
    onDelete,
    onChangePasswordClick,
    onAssignHotelClick,
    onViewLogsClick,
    authUser,
    hotelsList = []
}) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [activeStatuses, setActiveStatuses] = useState<Record<string, boolean>>({});
    const menuRef = useRef<HTMLDivElement>(null);

    const isRequesterSuperadmin = 
        authUser?.role?.toLowerCase() === "superadmin" || 
        authUser?.role?.toLowerCase() === "super_admin" ||
        authUser?.role?.toLowerCase() === "super admin" ||
        authUser?.email?.toLowerCase() === "superadmin@setara.co.id";

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleUserStatus = (userId: string, isOwnerUser: boolean) => {
        if (isOwnerUser) return; // Cannot disable hotel owner
        setActiveStatuses(prev => ({
            ...prev,
            [userId]: prev[userId] !== undefined ? !prev[userId] : false
        }));
    };

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableScrollWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={`${styles.th} ${styles.thStatus}`}>Status</th>
                            <th className={styles.th}>User Name</th>
                            <th className={styles.th}>User Role Name</th>
                            <th className={styles.th}>Email</th>
                            <th className={styles.th}>Multi-Factor Authentication</th>
                            <th className={`${styles.th} ${styles.thAction}`}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => {
                            const isSuperadminUser = user.role?.toLowerCase() === "superadmin";
                            const isSystemAdmin = user.email === "nexura.management@gmail.com" || user.email === "superadmin@setara.co.id";
                            
                            // Detect if this user is the primary Admin Owner registered with the hotel
                            const userHotel = hotelsList.find(h => h.hotelCode === user.hotelCode);
                            const hotelOwnerEmail = (userHotel as any)?.email?.toLowerCase();
                            const isOwnerUser = Boolean(
                                (user.isOwner === true || (hotelOwnerEmail && user.email?.toLowerCase() === hotelOwnerEmail)) && 
                                !user.createdBy
                            );

                            const isLockedFromCurrentViewer = (isSuperadminUser || isSystemAdmin) && !isRequesterSuperadmin;
                            const isMenuOpen = openMenuId === user.id;

                            const isUserActive = activeStatuses[user.id] !== undefined ? activeStatuses[user.id] : true;
                            const outletCount = user.allowedOutlets && user.allowedOutlets.length > 0 ? user.allowedOutlets.length : 1;

                            return (
                                <tr key={user.id} className={styles.tr}>
                                    {/* Column 1: Toggle Switch */}
                                    <td className={`${styles.td} ${styles.tdStatus}`}>
                                        <button
                                            type="button"
                                            disabled={isOwnerUser || isLockedFromCurrentViewer}
                                            onClick={() => toggleUserStatus(user.id, isOwnerUser)}
                                            className={`${styles.toggleSwitch} ${isUserActive ? styles.toggleOn : styles.toggleOff}`}
                                            title={isOwnerUser ? "Owner account must remain active" : (isUserActive ? "Active" : "Inactive")}
                                            style={isOwnerUser ? { opacity: 0.85, cursor: "default" } : {}}
                                        >
                                            <span className={`${styles.toggleThumb} ${isUserActive ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
                                            <span className={`${styles.toggleLabel} ${isUserActive ? styles.toggleLabelOn : styles.toggleLabelOff}`}>
                                                {isUserActive ? "On" : "Off"}
                                            </span>
                                        </button>
                                    </td>

                                    {/* Column 2: User Name & Badges */}
                                    <td className={styles.td}>
                                        <div className={styles.userCell}>
                                            <div className={styles.userAvatar}>
                                                <img 
                                                    src={`/avatar/memo_${((((user.name || "U").charCodeAt(0) || 0) + (user.email || "E").charCodeAt(0)) % 35) + 1}.png`} 
                                                    alt={user.name}
                                                    className={styles.userAvatarImg}
                                                />
                                            </div>
                                            <div className={styles.userInfoCluster}>
                                                <div className={styles.userNameRow}>
                                                    <span className={styles.userName}>{user.name || "Unnamed User"}</span>
                                                    {isOwnerUser && (
                                                        <span className={styles.ownerCrownBadge} title="Primary Admin Owner (Terkunci)">
                                                            <Crown size={11} />
                                                            Owner
                                                        </span>
                                                    )}
                                                    {isSuperadminUser && (
                                                        <span className={styles.superadminBadge} title="Super Administrator">
                                                            <ShieldCheck size={11} />
                                                            Superadmin
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={styles.userEmail}>{user.email}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Column 3: User Role Name */}
                                    <td className={styles.td}>
                                        <div style={{ display: "inline-flex", alignItems: "center" }}>
                                            <span className={styles.roleBadge}>
                                                {isSuperadminUser ? "Master Superadmin" : (user.role || "Staff")}
                                            </span>
                                            {outletCount > 1 && (
                                                <span className={styles.outletsBadge} title={`Assigned to ${outletCount} properties`}>
                                                    <Building2 size={11} />
                                                    {outletCount} Properties
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Column 4: Email */}
                                    <td className={styles.td}>
                                        <span style={{ color: "#475569", fontSize: "13px" }}>{user.email}</span>
                                    </td>

                                    {/* Column 5: Multi-Factor Authentication */}
                                    <td className={styles.td}>
                                        <span className={styles.mfaEnabled}>
                                            <span className={`${styles.mfaDot} ${styles.mfaDotEnabled}`} />
                                            Enabled
                                        </span>
                                    </td>

                                    {/* Column 6: Action */}
                                    <td className={`${styles.td} ${styles.tdAction}`}>
                                        <div 
                                            ref={isMenuOpen ? menuRef : null}
                                            className={styles.actionWrapper}
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setOpenMenuId(prev => (prev === user.id ? null : user.id));
                                                }}
                                                className={styles.actionBtn}
                                                title="Actions"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Dropdown Menu - always opens cleanly downward */}
                                            {isMenuOpen && (
                                                <div className={styles.dropdownMenu}>
                                                    {/* Edit User */}
                                                    <button
                                                        type="button"
                                                        disabled={isLockedFromCurrentViewer}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                            onEdit(user);
                                                        }}
                                                        className={`${styles.dropdownItem} ${isLockedFromCurrentViewer ? styles.dropdownItemDisabled : ""}`}
                                                    >
                                                        <Edit3 size={14} />
                                                        <span>Edit User</span>
                                                    </button>

                                                    {/* Delete User */}
                                                    <button
                                                        type="button"
                                                        disabled={isOwnerUser || isLockedFromCurrentViewer}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                            if (isOwnerUser) return;
                                                            onDelete(user.id, user.name);
                                                        }}
                                                        className={`${styles.dropdownItem} ${styles.dropdownItemDanger} ${(isOwnerUser || isLockedFromCurrentViewer) ? styles.dropdownItemDisabled : ""}`}
                                                        title={isOwnerUser ? "Owner akun pendaftaran tidak dapat dihapus" : undefined}
                                                    >
                                                        <Trash2 size={14} />
                                                        <span>{isOwnerUser ? "Owner (Protected)" : "Delete User"}</span>
                                                    </button>

                                                    <div className={styles.dropdownDivider} />

                                                    {/* Detail Log */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                            if (onViewLogsClick) onViewLogsClick(user);
                                                        }}
                                                        className={styles.dropdownItem}
                                                    >
                                                        <FileText size={14} />
                                                        <span>Detail Log</span>
                                                    </button>

                                                    {/* Change Password */}
                                                    <button
                                                        type="button"
                                                        disabled={isLockedFromCurrentViewer}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                            onChangePasswordClick(user);
                                                        }}
                                                        className={`${styles.dropdownItem} ${isLockedFromCurrentViewer ? styles.dropdownItemDisabled : ""}`}
                                                    >
                                                        <Lock size={14} />
                                                        <span>Change Password</span>
                                                    </button>

                                                    {/* Assign Hotel */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                            onAssignHotelClick(user);
                                                        }}
                                                        className={styles.dropdownItem}
                                                    >
                                                        <Building2 size={14} />
                                                        <span>Assign Hotel</span>
                                                    </button>

                                                    {/* Multi-Factor Authentication */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                        }}
                                                        className={styles.dropdownItem}
                                                    >
                                                        <ShieldCheck size={14} />
                                                        <span>Multi-Factor Auth</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className={styles.emptyState}>
                    <ShieldAlert size={36} color="#94a3b8" />
                    <h4 className={styles.emptyTitle}>No Personnel Found</h4>
                    <p className={styles.emptySubtitle}>
                        No user profiles match your filter criteria. Click "Add User" to create a new hotel staff or administrator account.
                    </p>
                </div>
            )}
        </div>
    );
};
