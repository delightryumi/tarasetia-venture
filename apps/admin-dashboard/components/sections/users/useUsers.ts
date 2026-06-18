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
    "module_food_beverage", "module_purchasing", "module_accounting", "module_cpanel", "module_hrd",
    // Submenus
    "overview", "forecast", "invoice", "pnl", "logo", "hero", "room-type", 
    "about", "gallery", "footer", "attractions", "promo", "packages", "seo", "users",
    "purchasing", "store-requisition", "purchase-requisition", "daily-market-list", 
    "stock-opname", "items", "suppliers", "purchase-order", "food-beverage-product",
    // POS submenus
    "pos_home", "pos_lexupos", "pos_cashier", "pos_product", "pos_records", "pos_settings",
    "hrd"
];

export const useUsers = (menuItems: any[]) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModules, setActiveModules] = useState<string[]>([]);
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
                    name: "Setara Management",
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

            // Hide superadmin users from the client UI list
            const clientVisibleUsers = list.filter(u => u.role?.toLowerCase() !== "superadmin");
            setUsers(clientVisibleUsers);
            setLoading(false);
        }, (err) => {
            console.error("Firestore read error in useUsers:", err);
            setLoading(false);
        });

        // Listen to Hotel active modules
        let unsubHotel = () => {};
        if (hotelCode) {
            unsubHotel = onSnapshot(doc(db, "hotels", hotelCode), (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    let modules = data.billing?.activeModules || [];
                    // Map old cpanel key to cpanel-full or cpanel-only
                    if (modules.includes('cpanel')) {
                        modules = modules.filter(m => m !== 'cpanel');
                        const plan = data.billing?.plan || 'enterprise';
                        if (plan === 'startup') {
                            if (!modules.includes('cpanel-only')) modules.push('cpanel-only');
                        } else {
                            if (!modules.includes('cpanel-full')) modules.push('cpanel-full');
                        }
                    }
                    if (modules.length === 0) {
                        const plan = data.billing?.plan || 'enterprise';
                        if (plan === 'startup') {
                            modules = ["pos", "hrd", "cpanel-only"];
                        } else if (plan === 'bisnis') {
                            modules = ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "hrd", "cpanel-only"];
                        } else {
                            modules = ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "hrd", "cpanel-full"];
                        }
                    }
                    setActiveModules(modules);
                } else {
                    setActiveModules(["pos", "hrd", "cpanel-only"]); // Fallback
                }
            });
        }

        return () => {
            unsubUsers();
            unsubHotel();
        };
    }, [hotelCode]);

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
        activeModules,
        handleSaveUser,
        handleDeleteUser,
        togglePermission,
        handleChangePassword
    };
};

