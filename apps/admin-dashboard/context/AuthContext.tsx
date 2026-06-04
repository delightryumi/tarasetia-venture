"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SUPERADMIN_PERMISSIONS_FALLBACK = [
    "module_pos", "module_front_office", "module_housekeeping", 
    "module_food_beverage", "module_purchasing", "module_accounting", "module_cpanel",
    "overview", "forecast", "invoice", "pnl", "logo", "hero", "room-type", 
    "about", "gallery", "footer", "attractions", "promo", "packages", "seo", "users",
    "purchasing", "store-requisition", "purchase-requisition", "daily-market-list", 
    "stock-opname", "items", "suppliers", "purchase-order", "food-beverage-product",
    "pos_home", "pos_lexupos", "pos_cashier", "pos_product", "pos_records", "pos_settings", "pos_technologies"
];

interface CustomUser {
    uid: string;
    email: string;
    displayName: string;
    role?: string;
}

interface AuthContextType {
    user: CustomUser | null;
    loading: boolean;
    loginWithFirestore: (email: string, password: string) => Promise<boolean>;
    signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    loginWithFirestore: async () => false,
    signOutUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Sync session on load
    useEffect(() => {
        const checkSession = async () => {
            if (typeof window !== "undefined") {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get("logout") === "true") {
                    localStorage.removeItem("auth_user");
                    setUser(null);
                    await fbSignOut(auth);
                    window.location.href = "/login";
                    return;
                }
            }

            const storedUser = localStorage.getItem("auth_user");
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    setLoading(false);
                    return;
                } catch (e) {
                    localStorage.removeItem("auth_user");
                }
            }

            // Fallback to Firebase Auth
            const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
                if (fbUser) {
                    const email = fbUser.email || "";
                    const docId = email.toLowerCase().replace(/[@.]/g, "_");
                    const docRef = doc(db, "users_master", docId);
                    let docSnap = await getDoc(docRef);
                    
                    // Proactively create superadmin document if it doesn't exist
                    if (!docSnap.exists() && email.toLowerCase() === "nexura.management@gmail.com") {
                        const adminPerms: Record<string, boolean> = {};
                        SUPERADMIN_PERMISSIONS_FALLBACK.forEach(k => {
                            adminPerms[k] = true;
                        });
                        await setDoc(docRef, {
                            name: "Nexura Management",
                            email: email,
                            password: "000000",
                            role: "superadmin",
                            permissions: adminPerms
                        });
                        docSnap = await getDoc(docRef);
                    }
                    
                    const customUser: CustomUser = {
                        uid: fbUser.uid,
                        email: email,
                        displayName: fbUser.displayName || email.split("@")[0],
                    };
                    
                    if (docSnap.exists()) {
                        customUser.role = docSnap.data().role;
                        customUser.displayName = docSnap.data().name || customUser.displayName;
                    }
                    
                    localStorage.setItem("auth_user", JSON.stringify(customUser));
                    setUser(customUser);
                } else {
                    setUser(null);
                }
                setLoading(false);
            });

            return unsubscribe;
        };

        checkSession();
    }, []);

    const loginWithFirestore = async (email: string, password: string): Promise<boolean> => {
        try {
            const docId = email.toLowerCase().replace(/[@.]/g, "_");
            const docRef = doc(db, "users_master", docId);
            let docSnap = await getDoc(docRef);
            
            // Proactively create superadmin document if it doesn't exist
            if (!docSnap.exists() && email.toLowerCase() === "nexura.management@gmail.com" && password === "000000") {
                const adminPerms: Record<string, boolean> = {};
                SUPERADMIN_PERMISSIONS_FALLBACK.forEach(k => {
                    adminPerms[k] = true;
                });
                await setDoc(docRef, {
                    name: "Nexura Management",
                    email: email,
                    password: "000000",
                    role: "superadmin",
                    permissions: adminPerms
                });
                docSnap = await getDoc(docRef);
            }
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.password === password) {
                    const customUser: CustomUser = {
                        uid: docId,
                        email: email,
                        displayName: data.name || email.split("@")[0],
                        role: data.role,
                    };
                    localStorage.setItem("auth_user", JSON.stringify(customUser));
                    setUser(customUser);
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.error("Firestore auth error:", e);
            return false;
        }
    };

    const signOutUser = async () => {
        localStorage.removeItem("auth_user");
        setUser(null);
        await fbSignOut(auth);
        const dashboardUrl = typeof window !== "undefined"
            ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? ":" + window.location.port : ""}/login`
            : "http://localhost:3000/login";
        window.location.href = dashboardUrl;
    };


    return (
        <AuthContext.Provider value={{ user, loading, loginWithFirestore, signOutUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
