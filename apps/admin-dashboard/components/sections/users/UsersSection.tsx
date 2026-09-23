"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, Search, ShieldCheck,
    LayoutDashboard, TrendingUp, FileText, PieChart,
    FileImage, Home as HomeIcon, Layout as LayoutIcon, 
    Info, Grid, Settings as SettingsIcon, MapPin, 
    Gift, Package, Users, ShoppingCart, Banknote, Building2,
    BedDouble, Coffee, ShoppingBag, Calculator, Store, User as UserIcon, Archive, Star,
    Camera, ClipboardList, Layers, BarChart2, Zap, FileSpreadsheet, SlidersHorizontal, Globe,
    Ban, Tag, XCircle, Trash2, Receipt, ShieldAlert
} from "lucide-react";

import { toast } from "sonner";
import { useUsers, ROLES } from "./useUsers";
import { UserTable } from "./components/UserTable";
import { RoleManagementTable, SystemRoleItem } from "./components/RoleManagementTable";
import { RolePermissionDrawer } from "./components/RolePermissionDrawer";
import { getStandardRolePermissions } from "./permissionConfig";
import { hasPermission, isUserSuperadmin } from "@/lib/permissionCheck";
import { AssignHotelDrawer } from "./components/AssignHotelDrawer";
import { BlockedUsersTab } from "./components/BlockedUsersTab";
import { SecurityPreferencesTab } from "./components/SecurityPreferencesTab";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { UserDrawer } from "./components/UserDrawer";
import { ConfirmModal } from "./components/ConfirmModal";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { UserActivityTab } from "./components/UserActivityTab";
import { DeviceActivityTab } from "./components/DeviceActivityTab";
import { UserProfile } from "./types";
import styles from "./UsersStyles.module.css";

/* ── Brand Colors & Design Tokens ── */
const SAGE = "#788069";
const INK = "#181d26";

export interface PermissionSubmenu {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export interface PermissionModule {
    id: string;
    label: string;
    icon: React.ReactNode;
    submenus: PermissionSubmenu[];
}

/* ── Permission Tree (Module & Feature Structure) ── */
const PERMISSION_TREE: PermissionModule[] = [
    {
        id: "module_pos",
        label: "POS (Point of Sales)",
        icon: <Banknote size={14} />,
        submenus: [
            { id: "pos_home", label: "Home", icon: <HomeIcon size={14} /> },
            { id: "pos_lexupos", label: "LexuPos", icon: <Store size={14} /> },
            { id: "pos_cashier", label: "Cashier", icon: <UserIcon size={14} /> },
            { id: "pos_product", label: "Product", icon: <Package size={14} /> },
            { id: "pos_records", label: "Records", icon: <Archive size={14} /> },
            { id: "pos_cancel", label: "Akses Cancel Order POS", icon: <XCircle size={14} /> },
            { id: "pos_void", label: "Akses Void Order POS", icon: <Trash2 size={14} /> },
            { id: "pos_settings", label: "Settings", icon: <SettingsIcon size={14} /> },
            { id: "pos_self_order", label: "Self-Ordering", icon: <ShoppingCart size={14} /> },
        ]
    },
    {
        id: "module_front_office",
        label: "Front Office",
        icon: <Building2 size={14} />,
        submenus: [
            { id: "overview", label: "Overview", icon: <LayoutDashboard size={14} /> },
            { id: "digital-checkin", label: "GRC (Guest Card)", icon: <FileText size={14} /> },
            { id: "confirmation-letter", label: "Confirmation Letter (CL)", icon: <FileText size={14} /> },
            { id: "forecast", label: "Forecast", icon: <TrendingUp size={14} /> },
            { id: "revenue-breakdown", label: "Revenue Breakdown", icon: <Receipt size={14} /> },
            { id: "rate-inventory", label: "Rate & Inventory (Akses Menu)", icon: <SlidersHorizontal size={14} /> },
            { id: "fo_stopsell", label: "↳ Akses Stop Sell (Buka/Tutup Jual)", icon: <Ban size={14} /> },
            { id: "fo_rate_change", label: "↳ Akses Merubah Rate / Harga", icon: <Tag size={14} /> },
            { id: "fo_inventory_change", label: "↳ Akses Merubah Inventory / Allotment", icon: <Layers size={14} /> },
            { id: "fo_cancel", label: "Akses Cancel Reservasi (FO)", icon: <XCircle size={14} /> },
            { id: "fo_void", label: "Akses Void Reservasi (FO)", icon: <Trash2 size={14} /> },
            { id: "inventory-control", label: "Inventory Control", icon: <Layers size={14} /> },
            { id: "invoice", label: "Create Invoice", icon: <FileText size={14} /> },
            { id: "purchase-order", label: "Purchase Order", icon: <ShoppingCart size={14} /> },
        ]
    },
    {
        id: "module_innalytics",
        label: "Inalytics (Intelligence & Reports)",
        icon: <TrendingUp size={14} />,
        submenus: [
            { id: "innalytics", label: "Inalytics Dashboard & Reports", icon: <TrendingUp size={14} /> },
        ]
    },
    {
        id: "module_housekeeping",
        label: "House Keeping",
        icon: <BedDouble size={14} />,
        submenus: [
            { id: "overview", label: "Overview", icon: <LayoutDashboard size={14} /> },
            { id: "forecast", label: "Forecast", icon: <TrendingUp size={14} /> },
            { id: "inventory-control", label: "Inventory Control", icon: <Layers size={14} /> },
            { id: "purchase-order", label: "Purchase Order", icon: <ShoppingCart size={14} /> },
        ]
    },
    {
        id: "module_food_beverage",
        label: "Food & Beverage",
        icon: <Coffee size={14} />,
        submenus: [
            { id: "food-beverage-ledger", label: "Ledger Overview", icon: <FileText size={14} /> },
            { id: "food-beverage-performance", label: "Category Performance", icon: <PieChart size={14} /> },
            { id: "food-beverage-realtime", label: "POS Real-time", icon: <Zap size={14} /> },
            { id: "purchase-order", label: "Purchase Order", icon: <ShoppingCart size={14} /> },
        ]
    },
    {
        id: "module_purchasing",
        label: "Purchasing",
        icon: <ShoppingBag size={14} />,
        submenus: [
            { id: "purchasing", label: "Dashboard", icon: <HomeIcon size={14} /> },
            { id: "store-requisition", label: "Store Requisitions", icon: <FileText size={14} /> },
            { id: "purchase-requisition", label: "Purchase Requisitions", icon: <ShoppingCart size={14} /> },
            { id: "daily-market-list", label: "Daily Market List", icon: <Coffee size={14} /> },
            { id: "stock-opname", label: "Stock Opname", icon: <PieChart size={14} /> },
            { id: "items", label: "Items Master", icon: <Package size={14} /> },
            { id: "suppliers", label: "Suppliers", icon: <Users size={14} /> },
            { id: "purchase-order", label: "Purchase Order", icon: <ShoppingCart size={14} /> },
        ]
    },
    {
        id: "module_accounting",
        label: "Accounting",
        icon: <Calculator size={14} />,
        submenus: [
            { id: "pnl", label: "P&L Statement", icon: <PieChart size={14} /> },
            { id: "pnl-budget", label: "P&L Actual vs Budget", icon: <BarChart2 size={14} /> },
            { id: "dsr", label: "Daily Sales Report (DSR)", icon: <TrendingUp size={14} /> },
            { id: "budgeting", label: "Budgeting", icon: <FileSpreadsheet size={14} /> },
            { id: "statements", label: "Laporan Keuangan", icon: <FileText size={14} /> },
            { id: "purchase-order", label: "Purchase Order", icon: <ShoppingCart size={14} /> },
        ]
    },
    {
        id: "module_hrd",
        label: "HRD & Absensi",
        icon: <ClipboardList size={14} />,
        submenus: [
            { id: "hrd", label: "Dashboard HRD", icon: <ClipboardList size={14} /> },
        ]
    },
    {
        id: "module_cpanel",
        label: "CPanel (System Admin)",
        icon: <SettingsIcon size={14} />,
        submenus: [
            { id: "logo", label: "Logo Management", icon: <FileImage size={14} /> },
            { id: "hero", label: "Hero Management", icon: <HomeIcon size={14} /> },
            { id: "room-type", label: "Room Categories", icon: <LayoutIcon size={14} /> },
            { id: "about", label: "About Us", icon: <Info size={14} /> },
            { id: "gallery", label: "Gallery", icon: <Grid size={14} /> },
            { id: "footer", label: "Footer Info", icon: <SettingsIcon size={14} /> },
            { id: "attractions", label: "Nearby Attractions", icon: <MapPin size={14} /> },
            { id: "promo", label: "Promo Management", icon: <Gift size={14} /> },
            { id: "packages", label: "Custom Packages", icon: <Package size={14} /> },
            { id: "seo", label: "SEO & Metadata", icon: <Search size={14} /> },
            { id: "users", label: "User Management", icon: <Users size={14} /> },
        ]
    }
];

/* ── Animations ── */
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const rise = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const UsersSection: React.FC = () => {
    const { user: authUser, activeHotelCode, hotelsList } = useAuth();
    const isSuper = isUserSuperadmin(authUser);
    const canAccessUsers = isSuper || hasPermission(authUser, 'users', 'module_cpanel');
    const canManageUsers = isSuper || hasPermission(authUser, 'sec_user_manage', 'module_security');
    const canManageRoles = isSuper || hasPermission(authUser, 'sec_role_manage', 'module_security');
    const canViewDevices = isSuper || hasPermission(authUser, 'sec_device_activity', 'module_security');
    const canViewActivity = isSuper || hasPermission(authUser, 'sec_user_activity', 'module_security');
    const canManageSecurity = isSuper || hasPermission(authUser, 'sec_policies', 'module_security');

    const { 
        users, loading, activeModules,
        handleSaveUser, handleDeleteUser, togglePermission, toggleModulePermission,
        handleChangePassword
    } = useUsers([]);

    type TabType = "users" | "roles" | "blocked" | "devices" | "activity" | "security";
    const [activeTab, setActiveTab] = useState<TabType>("users");

    React.useEffect(() => {
        if (!canManageRoles && activeTab === "roles") {
            setActiveTab("users");
        }
    }, [canManageRoles, activeTab]);

    const [searchQuery, setSearchQuery] = useState("");
    const [externalUsersOnly, setExternalUsersOnly] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Assign Hotel Drawer
    const [isAssignHotelOpen, setIsAssignHotelOpen] = useState(false);
    const [assignHotelTarget, setAssignHotelTarget] = useState<UserProfile | null>(null);

    // Role Privileges Drawer State
    const [isRoleDrawerOpen, setIsRoleDrawerOpen] = useState(false);
    const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<SystemRoleItem | null>(null);

    // Delete Confirmation State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Password Change State
    const [passwordChangeTarget, setPasswordChangeTarget] = useState<UserProfile | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        role: "General Manager",
        password: "",
        allowedOutlets: [] as string[],
        permissions: getStandardRolePermissions("General Manager")
    });

    const openCreateDrawer = () => {
        setEditingUser(null);
        setFormData({ 
            email: "", 
            name: "", 
            role: "General Manager", 
            password: "",
            allowedOutlets: activeHotelCode ? [activeHotelCode] : [],
            permissions: getStandardRolePermissions("General Manager")
        });
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (user: UserProfile) => {
        setEditingUser(user);
        const standardPerms = getStandardRolePermissions(user.role || "Staff");
        const existingPerms = user.permissions && Object.keys(user.permissions).length > 0 
            ? { ...standardPerms, ...user.permissions }
            : standardPerms;

        setFormData({ 
            email: user.email, 
            name: user.name, 
            role: user.role, 
            password: "",
            allowedOutlets: user.allowedOutlets && user.allowedOutlets.length > 0 
                ? user.allowedOutlets 
                : (activeHotelCode ? [activeHotelCode] : []),
            permissions: existingPerms
        });
        setIsDrawerOpen(true);
    };

    const openAssignHotelDrawer = (user: UserProfile) => {
        setAssignHotelTarget(user);
        setIsAssignHotelOpen(true);
    };

    // Open Change Password Modal
    const openChangePassword = (user: UserProfile) => {
        setPasswordChangeTarget(user);
    };

    const onSave = async () => {
        if (!formData.name || !formData.email) {
            toast.error("Semua field wajib diisi.");
            return;
        }

        setIsSaving(true);
        try {
            await handleSaveUser(formData, editingUser);
            setIsDrawerOpen(false);
            
            toast.success(editingUser ? "Profil user berhasil diperbarui." : "User baru berhasil dibuat.", {
                description: `${formData.name} telah tersinkronisasi dengan database hotel.`,
            });
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan profil user.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveOutlets = async (userId: string, outlets: string[]) => {
        const target = users.find(u => u.id === userId);
        if (!target) return;
        await handleSaveUser({
            name: target.name,
            email: target.email,
            role: target.role,
            allowedOutlets: outlets,
            permissions: target.permissions || {},
            status: target.status,
            hotelCode: target.hotelCode || activeHotelCode
        }, target);
    };

    // Save Role Permissions and sync to users with this role
    const handleSaveRolePermissions = async (
        roleName: string, 
        newPermissions: Record<string, boolean>, 
        syncToUsers: boolean
    ) => {
        if (!activeHotelCode) {
            throw new Error("Pilih properti hotel terlebih dahulu.");
        }
        const roleId = roleName.toLowerCase().replace(/\s+/g, '_');

        // 1. Save to hotel-specific roles_permissions collection
        await setDoc(doc(db, "hotels", activeHotelCode, "roles_permissions", roleId), {
            roleId,
            roleName,
            permissions: newPermissions,
            updatedAt: new Date().toISOString(),
            updatedBy: authUser?.email || "Admin"
        }, { merge: true });

        // Also save to global roles_master as reference
        try {
            await setDoc(doc(db, "roles_master", roleId), {
                roleId,
                roleName,
                permissions: newPermissions,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.warn("Global roles_master update ignored:", e);
        }

        // 2. Sync directly to all existing users in this hotel with this role
        if (syncToUsers) {
            const target = roleName.toLowerCase();
            const matchingUsers = users.filter(u => {
                const uRole = u.role?.toLowerCase() || "";
                return uRole === target ||
                    (target === "administrator" && uRole === "admin") ||
                    (target === "admin" && uRole === "administrator");
            });
            for (const targetUser of matchingUsers) {
                try {
                    await updateDoc(doc(getHotelCollection(db, "users_master", activeHotelCode), targetUser.id), {
                        permissions: newPermissions
                    });
                } catch (err) {
                    console.error("Gagal sinkronisasi izin ke user:", targetUser.email, err);
                }
            }
        }
    };

    // Open delete confirmation modal instead of native confirm()
    const onDelete = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await handleDeleteUser(deleteTarget.id);
            toast.success("User berhasil dihapus.", {
                description: `${deleteTarget.name} telah dihapus dari sistem.`,
            });
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus user.");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const onChangePassword = async (userId: string, newPassword: string) => {
        try {
            await handleChangePassword(userId, newPassword);
            toast.success("Password Changed", {
                description: "Password berhasil diperbarui.",
            });
        } catch (error: any) {
            toast.error(error.message || "Gagal mengubah password.");
        }
    };

    const handleToggleUserStatus = async (userId: string, newStatus: "active" | "inactive") => {
        try {
            await updateDoc(doc(getHotelCollection(db, "users_master", activeHotelCode), userId), {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            toast.success(`Status akun berhasil diubah menjadi ${newStatus === "active" ? "Aktif" : "Nonaktif"}.`);
        } catch (err: any) {
            toast.error("Gagal memperbarui status akun: " + (err.message || ""));
        }
    };

    const filteredUsers = users.filter(u => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = (u.name || "").toLowerCase().includes(query) || (u.email || "").toLowerCase().includes(query) || (u.role || "").toLowerCase().includes(query);
        if (externalUsersOnly) {
            return matchesQuery && (u.allowedOutlets && u.allowedOutlets.length > 1);
        }
        return matchesQuery;
    });

    const safeActiveModules = activeModules || [];

    const filteredPermissionTree = PERMISSION_TREE.map(mod => {
        if (mod.id === "module_cpanel") {
            const hasFull = safeActiveModules.includes("cpanel-full");
            const hasOnly = safeActiveModules.includes("cpanel-only");
            if (!hasFull && !hasOnly) return null;
            if (hasFull) return mod;
            if (hasOnly) {
                return {
                    ...mod,
                    submenus: mod.submenus.filter(s => ["users", "logo"].includes(s.id))
                };
            }
        }

        if (mod.id === "module_pos") {
            if (!safeActiveModules.includes("pos")) return null;
            const hasSelfOrder = safeActiveModules.includes("pos-self-order");
            return {
                ...mod,
                submenus: hasSelfOrder 
                    ? mod.submenus 
                    : mod.submenus.filter(s => s.id !== "pos_self_order")
            };
        }

        if (mod.id === "module_food_beverage") {
            if (!safeActiveModules.includes("food-beverage")) return null;
            const hasRealtime = safeActiveModules.includes("food-beverage-realtime") || safeActiveModules.includes("pos-realtime");
            return {
                ...mod,
                submenus: hasRealtime 
                    ? mod.submenus 
                    : mod.submenus.filter(s => s.id !== "food-beverage-realtime")
            };
        }

        if (mod.id === "module_innalytics") {
            if (safeActiveModules.includes("innalytics")) {
                return mod;
            }
            return null;
        }
        
        const mappedId = mod.id.replace("module_", "").replace(/_/g, "-");
        if (safeActiveModules.includes(mappedId)) return mod;
        
        return null;
    }).filter(Boolean) as PermissionModule[];

    // Tab titles and descriptions
    const getTabMeta = () => {
        switch (activeTab) {
            case "users":
                return {
                    title: "User Management",
                    subtitle: "Manage all users in the system. Add new users, update details, assign roles, reset passwords, or deactivate users when needed."
                };
            case "roles":
                return {
                    title: "Role Management",
                    subtitle: "Define and manage user roles. Set permissions for each role to control access to different features and ensure secure, role-based responsibility."
                };
            case "blocked":
                return {
                    title: "Blocked Users",
                    subtitle: "View and manage accounts that have been blocked due to security violations or multiple failed login attempts."
                };
            case "devices":
                return {
                    title: "Device Activity",
                    subtitle: "Monitor active devices and login sessions connected to your hotel account."
                };
            case "activity":
                return {
                    title: "User Activity",
                    subtitle: "Track user activity across your property management system."
                };
            case "security":
                return {
                    title: "Security Preferences",
                    subtitle: "Configure system-wide password complexity, session duration, and multi-factor authentication policies."
                };
            default:
                return { title: "User Management", subtitle: "" };
        }
    };

    const tabMeta = getTabMeta();

    if (!canAccessUsers) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Akses Dibatasi</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-6 leading-relaxed">
                    Akun Anda tidak memiliki hak akses untuk membuka halaman manajemen user. Hubungi General Manager atau Administrator properti untuk pembaharuan izin.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* ─── Top Tabs Bar (IPMS Standard) ─── */}
            <div className={styles.header}>
                <div className={styles.ipmsTabsBar}>
                    <button 
                        type="button"
                        onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
                        className={`${styles.ipmsTabItem} ${activeTab === "users" ? styles.ipmsTabItemActive : ""}`}
                    >
                        Users
                    </button>
                    {canManageRoles && (
                        <button 
                            type="button"
                            onClick={() => { setActiveTab("roles"); setSearchQuery(""); }}
                            className={`${styles.ipmsTabItem} ${activeTab === "roles" ? styles.ipmsTabItemActive : ""}`}
                        >
                            User Role
                        </button>
                    )}
                    {canManageUsers && (
                        <button 
                            type="button"
                            onClick={() => { setActiveTab("blocked"); setSearchQuery(""); }}
                            className={`${styles.ipmsTabItem} ${activeTab === "blocked" ? styles.ipmsTabItemActive : ""}`}
                        >
                            Blocked Users
                        </button>
                    )}
                    {canViewDevices && (
                        <button 
                            type="button"
                            onClick={() => { setActiveTab("devices"); setSearchQuery(""); }}
                            className={`${styles.ipmsTabItem} ${activeTab === "devices" ? styles.ipmsTabItemActive : ""}`}
                        >
                            Device Activity
                        </button>
                    )}
                    {canViewActivity && (
                        <button 
                            type="button"
                            onClick={() => { setActiveTab("activity"); setSearchQuery(""); }}
                            className={`${styles.ipmsTabItem} ${activeTab === "activity" ? styles.ipmsTabItemActive : ""}`}
                        >
                            User Activity
                        </button>
                    )}
                    {canManageSecurity && (
                        <button 
                            type="button"
                            onClick={() => { setActiveTab("security"); setSearchQuery(""); }}
                            className={`${styles.ipmsTabItem} ${activeTab === "security" ? styles.ipmsTabItemActive : ""}`}
                        >
                            Security Preferences
                        </button>
                    )}
                </div>

                {/* Section Header: Title & Subtitle */}
                <div className={styles.headerTitleSec}>
                    <h1 className={styles.pageTitle}>{tabMeta.title}</h1>
                    <p className={styles.pageSubtitle}>{tabMeta.subtitle}</p>
                </div>

                {/* Toolbar for Users & Roles tab */}
                {(activeTab === "users" || activeTab === "roles") && (
                    <div className={styles.toolbarRow}>
                        <div className={styles.toolbarLeft}>
                            <div className={styles.searchWrapper}>
                                <input 
                                    type="text"
                                    placeholder={activeTab === "users" ? "Search User" : "Search User Role"}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={styles.searchInputIpms}
                                />
                                <div className={styles.searchIconRight}>
                                    <Search size={15} />
                                </div>
                            </div>

                            {activeTab === "users" && (
                                <label className={styles.externalUsersCheck}>
                                    <input 
                                        type="checkbox"
                                        checked={externalUsersOnly}
                                        onChange={(e) => setExternalUsersOnly(e.target.checked)}
                                        style={{ width: "16px", height: "16px", accentColor: "#0f172a", cursor: "pointer" }}
                                    />
                                    <span>External Users</span>
                                </label>
                            )}
                        </div>

                        {activeTab === "users" && canManageUsers && (
                            <button 
                                type="button"
                                onClick={openCreateDrawer}
                                className={styles.addBtnSquare}
                                title="Add User"
                            >
                                <Plus size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ─── Main Content Tabs ─── */}
            <AnimatePresence mode="wait">
                {activeTab === "users" ? (
                    <motion.section 
                        key="users-tab"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                    >
                        {loading ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner}></div>
                                <p className={styles.loadingText}>Syncing Personnel Database...</p>
                            </div>
                        ) : (
                            <UserTable 
                                users={filteredUsers}
                                onEdit={openEditDrawer}
                                onDelete={onDelete}
                                onChangePasswordClick={openChangePassword}
                                onAssignHotelClick={openAssignHotelDrawer}
                                onViewLogsClick={() => setActiveTab("activity")}
                                onToggleStatus={handleToggleUserStatus}
                                authUser={authUser}
                                hotelsList={hotelsList}
                            />
                        )}
                    </motion.section>
                ) : activeTab === "roles" ? (
                    <motion.section 
                        key="roles-tab"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                    >
                        <RoleManagementTable 
                            searchQuery={searchQuery}
                            onEditRolePermissions={(role) => {
                                setSelectedRoleForPermissions(role);
                                setIsRoleDrawerOpen(true);
                            }}
                        />
                    </motion.section>
                ) : activeTab === "blocked" ? (
                    <motion.section 
                        key="blocked-tab"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                    >
                        <BlockedUsersTab />
                    </motion.section>
                ) : activeTab === "devices" ? (
                    <motion.section 
                        key="devices-tab"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                    >
                        <DeviceActivityTab hotelCode={activeHotelCode} />
                    </motion.section>
                ) : activeTab === "activity" ? (
                    <motion.section 
                        key="activity-tab"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                    >
                        <UserActivityTab hotelCode={activeHotelCode} />
                    </motion.section>
                ) : (
                    <motion.section 
                        key="security-tab"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                    >
                        <SecurityPreferencesTab />
                    </motion.section>
                )}
            </AnimatePresence>

            {/* ─── Add/Edit User Drawer ─── */}
            <UserDrawer 
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                editingUser={editingUser}
                formData={formData}
                setFormData={setFormData}
                roles={ROLES}
                onSave={onSave}
                isSaving={isSaving}
                onChangePassword={onChangePassword}
                authUser={authUser}
                hotelsList={hotelsList}
                activeHotelCode={activeHotelCode}
                activeModules={activeModules}
            />

            {/* ─── Assign Hotel Drawer ─── */}
            <AssignHotelDrawer
                isOpen={isAssignHotelOpen}
                onClose={() => {
                    setIsAssignHotelOpen(false);
                    setAssignHotelTarget(null);
                }}
                user={assignHotelTarget}
                hotelsList={hotelsList}
                activeHotelCode={activeHotelCode}
                authUser={authUser}
                onSaveOutlets={handleSaveOutlets}
            />

            {/* ─── Role Permissions Matrix Drawer ─── */}
            <AnimatePresence>
                {isRoleDrawerOpen && selectedRoleForPermissions && (
                    <RolePermissionDrawer
                        isOpen={isRoleDrawerOpen}
                        onClose={() => {
                            setIsRoleDrawerOpen(false);
                            setSelectedRoleForPermissions(null);
                        }}
                        role={selectedRoleForPermissions}
                        activeHotelCode={activeHotelCode}
                        users={users}
                        onSaveRolePermissions={handleSaveRolePermissions}
                        activeModules={activeModules}
                    />
                )}
            </AnimatePresence>

            {/* ─── Change Password Modal ─── */}
            <ChangePasswordModal
                isOpen={!!passwordChangeTarget}
                userName={passwordChangeTarget?.name}
                isLoading={isChangingPassword}
                onConfirm={async (password) => {
                    if (passwordChangeTarget) {
                        setIsChangingPassword(true);
                        try {
                            await handleChangePassword(passwordChangeTarget.id, password);
                            toast.success("Password Changed", {
                                description: "Password berhasil diperbarui.",
                            });
                            setPasswordChangeTarget(null);
                        } catch (error: any) {
                            toast.error(error.message || "Gagal mengubah password.");
                        } finally {
                            setIsChangingPassword(false);
                        }
                    }
                }}
                onCancel={() => setPasswordChangeTarget(null)}
            />

            {/* ─── Delete User Confirmation Modal ─── */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                variant="delete"
                title="Hapus User"
                message={`Apakah Anda yakin ingin menghapus ${deleteTarget?.name || "user ini"} dari sistem? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Hapus"
                cancelLabel="Batal"
                isLoading={isDeleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};
