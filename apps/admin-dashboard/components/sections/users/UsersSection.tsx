"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, Search, ShieldCheck,
    LayoutDashboard, TrendingUp, FileText, PieChart,
    FileImage, Home as HomeIcon, Layout as LayoutIcon, 
    Info, Grid, Settings as SettingsIcon, MapPin, 
    Gift, Package, Users, ShoppingCart, Banknote, Building2,
    BedDouble, Coffee, ShoppingBag, Calculator, Store, User as UserIcon, Archive, Star
} from "lucide-react";

import { toast } from "sonner";
import { useUsers, ROLES } from "./useUsers";
import { UserCard } from "./components/UserCard";
import { RoleCard } from "./components/RoleCard";
import { UserDrawer } from "./components/UserDrawer";
import { ConfirmModal } from "./components/ConfirmModal";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
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
            { id: "pos_settings", label: "Settings", icon: <SettingsIcon size={14} /> },
            { id: "pos_technologies", label: "Technologies", icon: <Star size={14} /> },
        ]
    },
    {
        id: "module_front_office",
        label: "Front Office",
        icon: <Building2 size={14} />,
        submenus: [
            { id: "overview", label: "Overview", icon: <LayoutDashboard size={14} /> },
            { id: "forecast", label: "Forecast", icon: <TrendingUp size={14} /> },
            { id: "invoice", label: "Create Invoice", icon: <FileText size={14} /> },
            { id: "purchase-order", label: "Purchase Order", icon: <FileText size={14} /> },
        ]
    },
    {
        id: "module_housekeeping",
        label: "House Keeping",
        icon: <BedDouble size={14} />,
        submenus: [
            { id: "overview", label: "Overview", icon: <LayoutDashboard size={14} /> },
            { id: "forecast", label: "Forecast", icon: <TrendingUp size={14} /> },
            { id: "purchase-order", label: "Purchase Order", icon: <FileText size={14} /> },
        ]
    },
    {
        id: "module_food_beverage",
        label: "Food & Beverage",
        icon: <Coffee size={14} />,
        submenus: [
            { id: "food-beverage-product", label: "F&B Product", icon: <Coffee size={14} /> },
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
        ]
    },
    {
        id: "module_accounting",
        label: "Accounting",
        icon: <Calculator size={14} />,
        submenus: [
            { id: "pnl", label: "PNL Statement", icon: <PieChart size={14} /> },
            { id: "purchase-order", label: "Purchase Order", icon: <FileText size={14} /> },
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
    const { 
        users, loading, 
        handleSaveUser, handleDeleteUser, togglePermission,
        handleChangePassword
    } = useUsers([]);

    const [activeTab, setActiveTab] = useState<"users" | "permissions">("users");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Confirmation State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Password Change State
    const [passwordChangeTarget, setPasswordChangeTarget] = useState<UserProfile | null>(null);
    // Removed unused newPassword state; ChangePasswordModal manages its own state.
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        role: "Kasir",
        password: ""
    });

    const openCreateDrawer = () => {
        setEditingUser(null);
        setFormData({ email: "", name: "", role: "Kasir", password: "" });
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (user: UserProfile) => {
        setEditingUser(user);
        setFormData({ email: user.email, name: user.name, role: user.role, password: "" });
        setIsDrawerOpen(true);
    };

    // Open Change Password Modal
    const openChangePassword = (user: UserProfile) => {
        setPasswordChangeTarget(user);
    };

    const onSave = async () => {
        if (!formData.name || !formData.email) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSaving(true);
        try {
            await handleSaveUser(formData, editingUser);
            setIsDrawerOpen(false);
            
            toast.success(editingUser ? "Personnel profile updated." : "New personnel created.", {
                description: `${formData.name} has been synchronized with the database.`,
                className: "luxury-toast",
            });
        } catch (error) {
            toast.error("Failed to save personnel profile.");
        } finally {
            setIsSaving(false);
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
            toast.success("Personnel removed successfully.", {
                description: `${deleteTarget.name} has been purged from the database.`,
                className: "luxury-toast",
            });
        } catch (error) {
            toast.error("Failed to delete personnel.");
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
                className: "luxury-toast",
            });
        } catch (error) {
            toast.error("Gagal mengubah password.");
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            {/* ─── Header ─── */}
            <motion.header variants={rise} initial="hidden" animate="show" className={styles.header}>
                <div className={styles.headerTitleSec}>
                    <div className={styles.subTitle}>
                        <ShieldCheck size={12} />
                        <span>Security & Administration</span>
                    </div>
                    <h1 className={styles.title}>
                        User <span className={styles.titleHighlight}>Management</span>
                    </h1>
                </div>

                <div className={styles.headerActions}>
                    <div className={styles.tabGroup}>
                        <button 
                            onClick={() => setActiveTab("users")}
                            className={`${styles.tabButton} ${activeTab === "users" ? styles.tabButtonActive : ""}`}
                        >
                            Users
                        </button>
                        <button 
                            onClick={() => setActiveTab("permissions")}
                            className={`${styles.tabButton} ${activeTab === "permissions" ? styles.tabButtonActive : ""}`}
                        >
                            Permissions
                        </button>
                    </div>
                    
                    {activeTab === "users" && (
                        <button 
                            onClick={openCreateDrawer}
                            className={styles.primaryButton}
                        >
                            <Plus size={14} />
                            Add User
                        </button>
                    )}
                </div>
            </motion.header>

            {/* ─── Main Content ─── */}
            <AnimatePresence mode="wait">
                {activeTab === "users" ? (
                    <motion.section 
                        key="users-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={styles.usersTabContent}
                    >
                        {/* Search Bar */}
                        <div className={styles.searchWrapper}>
                            <div className={styles.searchIcon}>
                                <Search size={16} />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>

                        {/* User Grid */}
                        {loading ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner}></div>
                                <p className={styles.loadingText}>Syncing Personnel Database...</p>
                            </div>
                        ) : (
                            <motion.div 
                                variants={stagger}
                                initial="hidden"
                                animate="show"
                                className={styles.userGrid}
                            >
                                {filteredUsers.map((user) => (
                                    <UserCard 
                                        key={user.id}
                                        user={user}
                                        onEdit={openEditDrawer}
                                        onDelete={onDelete}
                                        variants={rise}
                                        onChangePasswordClick={openChangePassword}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </motion.section>
                ) : (
                    <motion.section 
                        key="perms-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={styles.roleGrid}
                    >
                        {users.map((u) => (
                            <RoleCard 
                                key={u.id}
                                user={u}
                                permissionTree={PERMISSION_TREE}
                                onToggle={togglePermission}
                            />
                        ))}
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
            />

            {/* ─── Change Password Modal ─── */}
            <ChangePasswordModal
                isOpen={!!passwordChangeTarget}
                userName={passwordChangeTarget?.name}
                isLoading={isChangingPassword}
                onConfirm={async (password) => {
                    if (passwordChangeTarget) {
                        setIsChangingPassword(true);
                        await handleChangePassword(passwordChangeTarget.id, password);
                        setIsChangingPassword(false);
                        setPasswordChangeTarget(null);
                    }
                }}
                onCancel={() => setPasswordChangeTarget(null)}
            />

            {/* ─── Delete User Confirmation Modal ─── */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                variant="delete"
                title="Hapus Personnel"
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
