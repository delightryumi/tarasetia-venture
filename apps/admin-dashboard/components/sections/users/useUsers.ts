import { useState, useEffect } from "react";
import { 
    collection, setDoc, doc, updateDoc, 
    deleteDoc, onSnapshot, query, orderBy, getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "./types";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";

export const ROLES = [
    "superadmin", 
    "General Manager", 
    "House Keeping", 
    "Purchasing", 
    "Kasir", 
    "Kitchen",
    "Finance"
];

const ALL_KEYS = [
    // Modules
    "module_pos", "module_front_office", "module_housekeeping", 
    "module_food_beverage", "module_purchasing", "module_accounting", "module_cpanel",
    // Submenus
    "overview", "forecast", "invoice", "pnl", "logo", "hero", "room-type", 
    "about", "gallery", "footer", "attractions", "promo", "packages", "seo", "users",
    "purchasing", "store-requisition", "purchase-requisition", "daily-market-list", 
    "stock-opname", "items", "suppliers", "purchase-order", "food-beverage-product",
    // POS submenus
    "pos_home", "pos_lexupos", "pos_cashier", "pos_product", "pos_records", "pos_settings", "pos_technologies"
];

export const useUsers = (menuItems: any[]) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { activeHotelCode } = useAuth();
    const hotelCode = activeHotelCode;

    const migrateUsersPermissions = async (needsMigrationList: UserProfile[]) => {
        for (const u of needsMigrationList) {
            const isSuper = u.role === "superadmin" || u.role?.toLowerCase() === "superadmin";
            const roleId = u.role?.toLowerCase().replace(/\s+/g, '_') || "";
            let initialPerms: Record<string, boolean> = {};
            
            if (roleId) {
                try {
                    const roleSnap = await getDoc(doc(db, "roles_master", roleId));
                    if (roleSnap.exists()) {
                        initialPerms = roleSnap.data().permissions || {};
                    }
                } catch (e) {
                    console.error("Error fetching legacy role perms for user:", u.email, e);
                }
            }
            
            if (Object.keys(initialPerms).length === 0) {
                ALL_KEYS.forEach(k => {
                    initialPerms[k] = isSuper;
                });
            }
            
            try {
                await updateDoc(doc(getHotelCollection(db, "users_master"), u.id), {
                    permissions: initialPerms
                });
            } catch (e) {
                console.error("Failed to migrate permissions for user:", u.id, e);
            }
        }
    };

    useEffect(() => {
        // Listen to Users
        const unsubUsers = onSnapshot(query(getHotelCollection(db, "users_master"), orderBy("name")), async (snap) => {
            const list: UserProfile[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as UserProfile));
            
            // Check for Hardcoded Admin
            const adminEmail = "nexura.management@gmail.com";
            const adminExists = list.some(u => u.email === adminEmail);
            if (!adminExists) {
                const adminId = adminEmail.toLowerCase().replace(/[@.]/g, '_');
                const isSuper = true;
                const adminPerms: Record<string, boolean> = {};
                ALL_KEYS.forEach(k => {
                    adminPerms[k] = isSuper;
                });
                await setDoc(doc(getHotelCollection(db, "users_master"), adminId), {
                    name: "Nexura Management",
                    email: adminEmail,
                    password: "000000",
                    role: "superadmin",
                    permissions: adminPerms
                });
            }

            // Proactive Migration: if any user has no permissions map, migrate them in background
            const needsMigration = list.filter(u => !u.permissions);
            if (needsMigration.length > 0) {
                migrateUsersPermissions(needsMigration);
            }

            setUsers(list);
            setLoading(false);
        }, (err) => {
            console.error("Firestore read error in useUsers:", err);
            setLoading(false);
        });

        return () => {
            unsubUsers();
        };
    }, []);

    const handleSaveUser = async (formData: any, editingUser: UserProfile | null) => {
        try {
            const method = editingUser ? "PUT" : "POST";
            const response = await fetch("/api/users", {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    hotelCode,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to save user");
            }
            return true;
        } catch (error) {
            console.error("Error saving user:", error);
            throw error;
        }
    };

    const handleDeleteUser = async (id: string) => {
        try {
            const targetUser = users.find(u => u.id === id);
            if (!targetUser) throw new Error("User not found");

            const response = await fetch("/api/users", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: targetUser.email,
                    hotelCode,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to delete user");
            }
            return true;
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    };

    const togglePermission = async (userId: string, menuId: string, currentValue: boolean) => {
        const userDoc = doc(getHotelCollection(db, "users_master"), userId);
        await updateDoc(userDoc, {
            [`permissions.${menuId}`]: !currentValue
        });
    };

    const handleChangePassword = async (userId: string, newPassword: string) => {
        try {
            const targetUser = users.find(u => u.id === userId);
            if (!targetUser) throw new Error("User not found");

            const response = await fetch("/api/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: targetUser.email,
                    password: newPassword,
                    hotelCode,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to change password");
            }
            console.log(`Password for user ${userId} has been changed successfully.`);
            return true;
        } catch (error) {
            console.error("Error changing user password:", error);
            throw error;
        }
    };

    return {
        users,
        loading,
        handleSaveUser,
        handleDeleteUser,
        togglePermission,
        handleChangePassword
    };
};

