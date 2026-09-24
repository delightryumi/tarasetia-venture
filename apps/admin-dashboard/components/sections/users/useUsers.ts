import { useState, useEffect, useRef } from "react";
import { 
    collection, setDoc, doc, updateDoc, 
    deleteDoc, onSnapshot, query, orderBy, getDoc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "./types";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";
import { getStandardRolePermissions } from "./permissionConfig";

export const ROLES = [
    "Administrator",
    "General Manager", 
    "Front Office Manager",
    "Front Office Associate",
    "Reservation Associate",
    "Night Auditor",
    "Housekeeping Manager", 
    "Food & Beverage Manager",
    "Cashier (POS)", 
    "Revenue Manager",
    "Finance & Accounting",
    "Purchasing Officer",
    "Human Resource",
    // Backward compatibility
    "HR",
    "HRD",
    "House Keeping", 
    "Purchasing", 
    "Kasir", 
    "Kitchen",
    "Finance"
];

const ALL_KEYS = [
    // Modules
    "module_pos", "module_front_office", "module_innalytics", "module_housekeeping", 
    "module_food_beverage", "module_purchasing", "module_accounting", "module_cpanel", "module_hrd",
    // Front Office & Inalytics
    "innalytics", "overview", "digital-checkin", "forecast", "revenue-breakdown", "rate-inventory", "confirmation-letter", "inventory-control", "invoice", "purchase-order",
    // Granular Rate & Inventory & FO Transaction permissions
    "fo_stopsell", "fo_rate_change", "fo_inventory_change", "fo_cancel", "fo_void",
    // Accounting
    "pnl", "pnl-budget", "dsr", "budgeting", "statements",
    // CPanel
    "logo", "hero", "room-type", "about", "gallery", "footer", 
    "attractions", "promo", "packages", "seo", "users",
    // Purchasing
    "purchasing", "store-requisition", "purchase-requisition", "daily-market-list", 
    "stock-opname", "items", "suppliers",
    // Food & Beverage
    "food-beverage-ledger", "food-beverage-performance", "food-beverage-product", "food-beverage-realtime",
    // POS submenus & granular permissions
    "pos_home", "pos_lexupos", "pos_cashier", "pos_product", "pos_records", "pos_settings", "pos_self_order",
    "pos_cancel", "pos_void",
    // HRD
    "hrd"
];

export const useUsers = (menuItems: any[]) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModules, setActiveModules] = useState<string[]>([]);
    const { activeHotelCode, user: authUser } = useAuth();
    const hotelCode = activeHotelCode;
    const hasSyncedRef = useRef(false);
    const hasMigratedRef = useRef(false);

    const migrateUsersPermissions = async (needsMigrationList: UserProfile[]) => {
        for (const u of needsMigrationList) {
            const isSuper = u.role === "superadmin" || u.role?.toLowerCase() === "superadmin";
            const roleId = u.role?.toLowerCase().replace(/\s+/g, '_') || "";
            let initialPerms: Record<string, boolean> = {};
            
            if (roleId) {
                try {
                    if (hotelCode) {
                        const hotelRoleSnap = await getDoc(doc(db, "hotels", hotelCode, "roles_permissions", roleId));
                        if (hotelRoleSnap.exists() && hotelRoleSnap.data().permissions) {
                            initialPerms = hotelRoleSnap.data().permissions || {};
                        }
                    }
                    if (Object.keys(initialPerms).length === 0) {
                        const roleSnap = await getDoc(doc(db, "roles_master", roleId));
                        if (roleSnap.exists()) {
                            initialPerms = roleSnap.data().permissions || {};
                        }
                    }
                } catch (e) {
                    console.error("Error fetching role perms for user:", u.email, e);
                }
            }
            
            if (Object.keys(initialPerms).length === 0) {
                if (isSuper) {
                    ALL_KEYS.forEach(k => {
                        initialPerms[k] = true;
                    });
                } else {
                    initialPerms = getStandardRolePermissions(u.role || "Staff");
                }
            }
            
            try {
                await updateDoc(doc(getHotelCollection(db, "users_master", hotelCode), u.id), {
                    permissions: initialPerms
                });
            } catch (e) {
                console.error("Failed to migrate permissions for user:", u.id, e);
            }
        }
    };

    // Auto-sync newly added menu items to existing users who have module_accounting or admin/GM access
    const syncNewSubmenusToUsers = async (userList: UserProfile[]) => {
        for (const u of userList) {
            if (!u.permissions) continue;
            const updates: Record<string, boolean> = {};
            const roleLower = u.role?.toLowerCase() || "";
            const isFullRole = roleLower === "admin" || roleLower === "superadmin" || roleLower === "general manager" || roleLower === "finance";
            const hasAccounting = u.permissions.module_accounting !== false && (u.permissions.pnl === true || isFullRole);

            if (hasAccounting) {
                if (u.permissions["pnl-budget"] === undefined) updates["permissions.pnl-budget"] = true;
                if (u.permissions["dsr"] === undefined) updates["permissions.dsr"] = true;
                if (u.permissions["budgeting"] === undefined) updates["permissions.budgeting"] = true;
                if (u.permissions["statements"] === undefined) updates["permissions.statements"] = true;
            }

            const hasFrontOffice = u.permissions.module_front_office !== false && (u.permissions.overview === true || isFullRole);
            if (hasFrontOffice) {
                if (u.permissions["innalytics"] === undefined) updates["permissions.innalytics"] = true;
                if (u.permissions["module_innalytics"] === undefined) updates["permissions.module_innalytics"] = true;
                if (u.permissions["revenue-breakdown"] === undefined) updates["permissions.revenue-breakdown"] = true;
                if (u.permissions["rate-inventory"] === undefined) updates["permissions.rate-inventory"] = true;
                if (u.permissions["confirmation-letter"] === undefined) updates["permissions.confirmation-letter"] = true;
                if (u.permissions["fo_stopsell"] === undefined) updates["permissions.fo_stopsell"] = isFullRole || u.permissions["rate-inventory"] === true;
                if (u.permissions["fo_rate_change"] === undefined) updates["permissions.fo_rate_change"] = isFullRole || u.permissions["rate-inventory"] === true;
                if (u.permissions["fo_inventory_change"] === undefined) updates["permissions.fo_inventory_change"] = isFullRole || u.permissions["rate-inventory"] === true;
                if (u.permissions["fo_cancel"] === undefined) updates["permissions.fo_cancel"] = isFullRole || u.permissions["trans_cancel"] === true;
                if (u.permissions["fo_void"] === undefined) updates["permissions.fo_void"] = isFullRole || u.permissions["trans_void"] === true;
            }

            const hasPos = u.permissions.module_pos !== false && (u.permissions.pos_cashier === true || isFullRole);
            if (hasPos) {
                if (u.permissions["pos_cancel"] === undefined) updates["permissions.pos_cancel"] = isFullRole || u.permissions["trans_cancel"] === true;
                if (u.permissions["pos_void"] === undefined) updates["permissions.pos_void"] = isFullRole || u.permissions["trans_void"] === true;
            }

            const hasFnB = u.permissions.module_food_beverage !== false && (u.permissions["food-beverage-product"] === true || u.permissions["food-beverage-ledger"] === true || isFullRole);
            if (hasFnB) {
                if (u.permissions["food-beverage-ledger"] === undefined) updates["permissions.food-beverage-ledger"] = true;
                if (u.permissions["food-beverage-performance"] === undefined) updates["permissions.food-beverage-performance"] = true;
            }



            if (Object.keys(updates).length > 0) {
                try {
                    await updateDoc(doc(getHotelCollection(db, "users_master", hotelCode), u.id), updates);
                } catch (e) {
                    console.error("Failed to sync new permissions for user:", u.id, e);
                }
            }
        }
    };

    useEffect(() => {
        if (!hotelCode) return;
        hasSyncedRef.current = false;
        hasMigratedRef.current = false;
        // Listen to Users
        const unsubUsers = onSnapshot(query(getHotelCollection(db, "users_master", hotelCode), orderBy("name")), async (snap) => {
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
                await setDoc(doc(getHotelCollection(db, "users_master", hotelCode), adminId), {
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
                if (!hasMigratedRef.current) {
                    hasMigratedRef.current = true;
                    migrateUsersPermissions(needsMigration);
                }
            } else {
                // Check if existing users need new menu sync (once per mount/hotel change)
                if (!hasSyncedRef.current) {
                    hasSyncedRef.current = true;
                    syncNewSubmenusToUsers(list);
                }
            }

            // Hide superadmin users from regular property admins, show for superadmin
            const isSuperViewer = authUser?.role?.toLowerCase() === "superadmin";
            const clientVisibleUsers = isSuperViewer ? list : list.filter(u => u.role?.toLowerCase() !== "superadmin");
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
                        modules = modules.filter((m: string) => m !== 'cpanel');
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
                            modules = ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "innalytics", "hrd", "cpanel-only"];
                        } else {
                            modules = ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "innalytics", "hrd", "cpanel-full", "pos-self-order", "food-beverage-realtime"];
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
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
            const response = await fetch("/api/users", {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    ...formData,
                    hotelCode,
                    requesterRole: authUser?.role,
                    requesterEmail: authUser?.email,
                    timeZone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
                }),
            });

            if (!response.ok) {
                let errorMsg = "Failed to save user";
                try {
                    const errData = await response.json();
                    errorMsg = errData.error || errorMsg;
                } catch {
                    errorMsg = (await response.text().catch(() => "")) || errorMsg;
                }
                throw new Error(errorMsg);
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

            const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
            const response = await fetch("/api/users", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    email: targetUser.email,
                    hotelCode,
                    requesterRole: authUser?.role,
                    requesterEmail: authUser?.email,
                    timeZone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
                }),
            });

            if (!response.ok) {
                let errorMsg = "Failed to delete user";
                try {
                    const errData = await response.json();
                    errorMsg = errData.error || errorMsg;
                } catch {
                    errorMsg = (await response.text().catch(() => "")) || errorMsg;
                }
                throw new Error(errorMsg);
            }
            return true;
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    };

    const togglePermission = async (userId: string, menuId: string, currentValue: boolean) => {
        const userDoc = doc(getHotelCollection(db, "users_master", hotelCode), userId);
        await updateDoc(userDoc, {
            [`permissions.${menuId}`]: !currentValue
        });
    };

    // Toggle module + auto-ON all submenus when enabling, just toggle module when disabling
    const toggleModulePermission = async (
        userId: string,
        moduleId: string,
        subMenuIds: string[],
        currentValue: boolean
    ) => {
        const userDoc = doc(getHotelCollection(db, "users_master", hotelCode), userId);
        const updates: Record<string, boolean> = {
            [`permissions.${moduleId}`]: !currentValue,
        };
        // Auto-ON all submenus when enabling the module
        if (!currentValue) {
            subMenuIds.forEach((subId) => {
                updates[`permissions.${subId}`] = true;
            });
        }
        await updateDoc(userDoc, updates);
    };

    const handleChangePassword = async (userId: string, newPassword: string) => {
        try {
            const targetUser = users.find(u => u.id === userId);
            if (!targetUser) throw new Error("User not found");

            const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
            const response = await fetch("/api/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    email: targetUser.email,
                    password: newPassword,
                    hotelCode: targetUser.hotelCode || hotelCode,
                    name: targetUser.name,
                    role: targetUser.role,
                    permissions: targetUser.permissions || {},
                    requesterRole: authUser?.role,
                    requesterEmail: authUser?.email,
                    timeZone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
                }),
            });

            if (!response.ok) {
                let errorMsg = "Failed to change password";
                try {
                    const errData = await response.json();
                    errorMsg = errData.error || errorMsg;
                } catch {
                    errorMsg = (await response.text().catch(() => "")) || errorMsg;
                }
                throw new Error(errorMsg);
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
        toggleModulePermission,
        handleChangePassword
    };
};

