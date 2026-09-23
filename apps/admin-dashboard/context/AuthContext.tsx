"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";

const SUPERADMIN_PERMISSIONS_FALLBACK = [
    "module_pos", "module_front_office", "module_innalytics", "module_housekeeping", 
    "module_food_beverage", "module_purchasing", "module_accounting", "module_cpanel",
    "module_hrd",
    "innalytics", "overview", "forecast", "revenue-breakdown", "rate-inventory", "digital-checkin", "confirmation-letter", "inventory-control", "invoice",
    "pnl", "pnl-budget", "dsr", "budgeting", "statements",
    "logo", "hero", "room-type", "about", "gallery", "footer", "attractions", "promo", "packages", "seo", "users", "channel-manager", "superadmin",
    "purchasing", "store-requisition", "purchase-requisition", "daily-market-list", 
    "stock-opname", "items", "suppliers", "purchase-order", "food-beverage-product", "food-beverage-realtime",
    "pos_home", "pos_lexupos", "pos_cashier", "pos_product", "pos_records", "pos_settings",
    "hrd"
];

interface CustomUser {
    uid: string;
    email: string;
    displayName: string;
    name?: string;
    role?: string;
    hotelCode?: string;
    allowedOutlets?: string[];
    permissions?: Record<string, boolean>;
}

interface AuthContextType {
    user: CustomUser | null;
    loading: boolean;
    activeHotelCode: string;
    activeHotelName: string;
    hotelsList: any[];
    setActiveHotelCode: (code: string) => void;
    loginWithFirestore: (email: string, password: string, hotelCode?: string) => Promise<boolean>;
    signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    activeHotelCode: "",
    activeHotelName: "",
    hotelsList: [],
    setActiveHotelCode: () => {},
    loginWithFirestore: async () => false,
    signOutUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeHotelCode, setActiveHotelCodeState] = useState<string>("");
    const [activeHotelName, setActiveHotelName] = useState<string>("");
    const [hotelsList, setHotelsList] = useState<any[]>([]);

    const setActiveHotelCode = (code: string) => {
        setActiveHotelCodeState(code);
        localStorage.setItem("active_hotel_code", code);
        localStorage.setItem("hotelCode", code);
        if (typeof document !== "undefined") {
            document.cookie = `hotelCode=${code}; path=/; max-age=31536000; SameSite=Lax`;
        }
    };

    // Load activeHotelCode from localStorage or user details
    useEffect(() => {
        const storedCode = localStorage.getItem("active_hotel_code");
        if (storedCode) {
            setActiveHotelCodeState(storedCode);
        } else if (user?.hotelCode) {
            setActiveHotelCodeState(user.hotelCode);
        }
    }, [user]);

    // Fetch active hotel details
    useEffect(() => {
        // Superadmin tanpa preview hotel → tampilkan label tetap
        if (user?.role === "superadmin" && (!activeHotelCode || activeHotelCode === "0")) {
            setActiveHotelName("Superadmin");
            return;
        }
        if (!activeHotelCode || activeHotelCode === "0") {
            setActiveHotelName("");
            return;
        }
        const docRef = doc(db, "hotels", activeHotelCode);
        getDoc(docRef).then((snap) => {
            if (snap.exists()) {
                setActiveHotelName(snap.data().name || "");
            } else {
                setActiveHotelName("");
            }
        }).catch((err) => {
            console.error("Error fetching active hotel name:", err);
            setActiveHotelName("");
        });
    }, [activeHotelCode, user?.role]);

    // Fetch hotels list if superadmin or has allowedOutlets / assigned hotel
    useEffect(() => {
        if (user && user.role === "superadmin") {
            const unsubscribe = onSnapshot(collection(db, "hotels"), (snapshot) => {
                const list: any[] = [];
                snapshot.forEach((doc) => {
                    list.push({ ...doc.data(), hotelCode: doc.id });
                });
                setHotelsList(list);
            });
            return () => unsubscribe();
        } else if (user && user.allowedOutlets && user.allowedOutlets.length > 0) {
            const unsubscribe = onSnapshot(collection(db, "hotels"), (snapshot) => {
                const list: any[] = [];
                snapshot.forEach((doc) => {
                    if (user.allowedOutlets?.includes(doc.id) || (user.hotelCode && doc.id === user.hotelCode)) {
                        list.push({ ...doc.data(), hotelCode: doc.id });
                    }
                });
                setHotelsList(list);
            });
            return () => unsubscribe();
        } else if (user && user.hotelCode) {
            const docRef = doc(db, "hotels", user.hotelCode);
            getDoc(docRef).then((snap) => {
                if (snap.exists()) {
                    setHotelsList([{ ...snap.data(), hotelCode: snap.id }]);
                } else {
                    setHotelsList([]);
                }
            }).catch(() => {
                setHotelsList([]);
            });
        } else {
            setHotelsList([]);
        }
    }, [user]);

    // Real-time sync of user permissions and profile from users_master
    useEffect(() => {
        if (!user?.email || !activeHotelCode || activeHotelCode === "0") return;
        const userDocId = user.email.toLowerCase().replace(/[@.]/g, "_");
        const userDocRef = doc(db, `hotels/${activeHotelCode}/users_master`, userDocId);
        const unsubscribe = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setUser(prev => {
                    if (!prev) return prev;
                    const updated: CustomUser = {
                        ...prev,
                        displayName: data.name || data.displayName || prev.displayName,
                        name: data.name || prev.name,
                        role: data.role || prev.role,
                        permissions: data.permissions || {}
                    };
                    localStorage.setItem("auth_user", JSON.stringify(updated));
                    return updated;
                });
            }
        }, (err) => {
            console.error("Error listening to user permissions in AuthContext:", err);
        });
        return () => unsubscribe();
    }, [user?.email, activeHotelCode]);

    // Helper to fetch user's real name and permissions from users_master
    const fetchUserName = async (email: string, code?: string): Promise<{ name: string; role?: string; hotelCode?: string; permissions?: Record<string, boolean> }> => {
        if (!email) return { name: "" };
        const docId = email.toLowerCase().replace(/[@.]/g, "_");
        if (code && code !== "0") {
            try {
                const userDocRef = doc(db, `hotels/${code}/users_master`, docId);
                const snap = await getDoc(userDocRef);
                if (snap.exists()) {
                    const data = snap.data();
                    return {
                        name: data.name || data.displayName || data.full_name || "",
                        role: data.role || "",
                        hotelCode: data.hotelCode || code,
                        permissions: data.permissions || {}
                    };
                }
            } catch (e) {
                console.error("Error fetching user from hotel users_master:", e);
            }
        }
        try {
            const globalDocRef = doc(db, "users_master", docId);
            const globalSnap = await getDoc(globalDocRef);
            if (globalSnap.exists()) {
                const data = globalSnap.data();
                return {
                    name: data.name || data.displayName || data.full_name || "",
                    role: data.role || "",
                    hotelCode: data.hotelCode || "",
                    permissions: data.permissions || {}
                };
            }
        } catch (e) {
            console.error("Error fetching user from global users_master:", e);
        }
        return { name: "" };
    };

    // Sync session on load
    useEffect(() => {
        const checkSession = async () => {
            if (typeof window !== "undefined") {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get("logout") === "true") {
                    localStorage.removeItem("auth_user");
                    localStorage.removeItem("active_hotel_code");
                    setUser(null);
                    setActiveHotelCodeState("");
                    await fbSignOut(auth);
                    window.location.href = "/login";
                    return;
                }
            }

            const storedUser = localStorage.getItem("auth_user");
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    if (parsed.role === "superadmin") {
                        if (!parsed.hotelCode) {
                            parsed.hotelCode = "0";
                        }
                        const savedActiveCode = localStorage.getItem("active_hotel_code");
                        if (!savedActiveCode) {
                            localStorage.setItem("active_hotel_code", parsed.hotelCode);
                            setActiveHotelCodeState(parsed.hotelCode);
                        } else {
                            setActiveHotelCodeState(savedActiveCode);
                            parsed.hotelCode = savedActiveCode; // Sync user object with active code
                        }
                        localStorage.setItem("auth_user", JSON.stringify(parsed));
                    } else {
                        const savedActiveCode = localStorage.getItem("active_hotel_code");
                        if (savedActiveCode) {
                            setActiveHotelCodeState(savedActiveCode);
                        }
                    }

                    setUser(parsed);
                    setLoading(false);

                    // Background sync real name and permissions from users_master
                    const activeCode = localStorage.getItem("active_hotel_code") || parsed.hotelCode;
                    fetchUserName(parsed.email, activeCode).then(info => {
                        if (info.name || info.permissions) {
                            const updated: CustomUser = {
                                ...parsed,
                                displayName: info.name || parsed.displayName,
                                name: info.name || parsed.name,
                                role: info.role || parsed.role,
                                permissions: info.permissions || parsed.permissions || {}
                            };
                            localStorage.setItem("auth_user", JSON.stringify(updated));
                            setUser(updated);
                        }
                    }).catch(() => {});

                    return;
                } catch (e) {
                    localStorage.removeItem("auth_user");
                }
            }

            // Fallback to Firebase Auth
            const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
                if (fbUser) {
                    const email = fbUser.email || "";
                    const tokenResult = await fbUser.getIdTokenResult();
                    const claims = tokenResult.claims;
                    
                    let role = claims.role as string || "";
                    let hotelCode = claims.hotelCode as string || "";
                    let allowedOutlets = claims.allowedOutlets as string[] || [];
                    
                    const isSuperadminEmail = email.toLowerCase() === "admin@setara.co.id" || email.toLowerCase() === "superadmin@setara.co.id";
                    if (isSuperadminEmail) {
                        role = "superadmin";
                        hotelCode = "0";
                    }

                    const code = localStorage.getItem("active_hotel_code") || hotelCode;
                    const userInfo = await fetchUserName(email, code);

                    if (!role && userInfo.role) {
                        role = userInfo.role;
                    }
                    if (!hotelCode && userInfo.hotelCode) {
                        hotelCode = userInfo.hotelCode;
                    }

                    if (!allowedOutlets.includes(hotelCode) && hotelCode) {
                        allowedOutlets = [...allowedOutlets, hotelCode];
                    }

                    const resolvedDisplayName = userInfo.name || fbUser.displayName || email.split("@")[0];

                    const customUser: CustomUser = {
                        uid: fbUser.uid,
                        email: email,
                        displayName: resolvedDisplayName,
                        name: resolvedDisplayName,
                        role,
                        hotelCode,
                        allowedOutlets,
                        permissions: userInfo.permissions || {},
                    };
                    
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

    const loginWithFirestore = async (email: string, password: string, hotelCodeInput?: string): Promise<boolean> => {
        try {
            const isSuperadminEmail = email.toLowerCase() === "superadmin@setara.co.id";
            let code = hotelCodeInput?.trim() || "";

            // Allow "0" as a bypass code for superadmin
            const isSuperadminBypass = isSuperadminEmail || code === "0";

            if (code === "0" && !isSuperadminEmail) {
                throw new Error("Hotel Code tidak valid.");
            }

            if (!isSuperadminBypass) {
                if (!code) {
                    throw new Error("Hotel Code wajib diisi.");
                }

                // Verify hotel exists
                const hotelRef = doc(db, "hotels", code);
                const hotelSnap = await getDoc(hotelRef);
                if (!hotelSnap.exists()) {
                    throw new Error("Hotel tidak terdaftar.");
                }
            }

            // Call Firebase Auth signInWithEmailAndPassword
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const fbUser = userCredential.user;

            // Retrieve token result to inspect claims
            const tokenResult = await fbUser.getIdTokenResult(true); // Force refresh to get latest claims
            const claims = tokenResult.claims;

            let role = claims.role as string || "";
            let hotelCode = claims.hotelCode as string || "";
            let allowedOutlets = claims.allowedOutlets as string[] || [];

            // Fallback lookup from Firestore if claims aren't set yet
            if (!isSuperadminEmail && (!role || !hotelCode)) {
                const docId = email.toLowerCase().replace(/[@.]/g, "_");
                const userDocRef = doc(db, `hotels/${code}/users_master`, docId);
                const snap = await getDoc(userDocRef);
                if (snap.exists()) {
                    role = snap.data().role || "";
                    hotelCode = snap.data().hotelCode || code;
                }
            }

            if (!allowedOutlets.includes(hotelCode) && hotelCode) {
                allowedOutlets = [...allowedOutlets, hotelCode];
            }

            // If still no role or hotelCode, set defaults or raise error
            if (isSuperadminEmail) {
                role = "superadmin";
                hotelCode = "0";
            } else {
                if (!role || !hotelCode) {
                    throw new Error("Akun Anda belum dikonfigurasi dengan benar. Hubungi Admin.");
                }
                // Verify hotelCode claim matches input hotelCode (unless user is superadmin)
                if (role !== "superadmin") {
                    if (allowedOutlets.length > 0 && !allowedOutlets.includes(code)) {
                        await fbSignOut(auth);
                        throw new Error("Anda tidak terdaftar di outlet ini.");
                    } else if (allowedOutlets.length === 0 && hotelCode !== code) {
                        await fbSignOut(auth);
                        throw new Error("Anda tidak terdaftar di outlet ini.");
                    }
                }
            }

            const userInfo = await fetchUserName(email, code);
            const resolvedDisplayName = userInfo.name || fbUser.displayName || email.split("@")[0];

            const customUser: CustomUser = {
                uid: fbUser.uid,
                email: email,
                displayName: resolvedDisplayName,
                name: resolvedDisplayName,
                role: role || userInfo.role || "",
                hotelCode: role !== "superadmin" ? code : "0", // Gunakan code yg diinput sbg hotelCode aktif saat login
                allowedOutlets,
                permissions: userInfo.permissions || {},
            };

            // Auto-register device session and login activity in background
            try {
                const clientTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Jakarta";
                fetch("/api/users/devices", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: fbUser.uid,
                        userEmail: email,
                        userName: resolvedDisplayName,
                        hotelCode: code,
                        timeZone: clientTz
                    })
                }).catch(() => {});

                fetch("/api/users/activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: code,
                        userId: fbUser.uid,
                        userName: resolvedDisplayName,
                        userEmail: email,
                        action: "LOGIN",
                        module: "SYSTEM",
                        description: `Pengguna berhasil login ke properti #${code}.`,
                        timeZone: clientTz
                    })
                }).catch(() => {});
            } catch (trackErr) {
                console.warn("Tracking error:", trackErr);
            }

            localStorage.setItem("auth_user", JSON.stringify(customUser));
            setUser(customUser);

            if (!isSuperadminEmail) {
                setActiveHotelCodeState(code);
                localStorage.setItem("active_hotel_code", code);
            } else {
                // Superadmin: reset ke "0" (tidak terikat hotel manapun)
                setActiveHotelCodeState("0");
                localStorage.setItem("active_hotel_code", "0");
                setActiveHotelName("Superadmin");
            }
            return true;
        } catch (e: any) {
            console.error("Firebase Auth login error:", e);
            throw e;
        }
    };

    const signOutUser = async () => {
        if (user) {
            try {
                const clientTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Jakarta";
                fetch("/api/users/activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        hotelCode: activeHotelCode || "0",
                        userId: user.uid,
                        userName: user.name || user.displayName || user.email,
                        userEmail: user.email,
                        action: "LOGOUT",
                        module: "SYSTEM",
                        description: `Pengguna logout dari sistem.`,
                        timeZone: clientTz
                    })
                }).catch(() => {});
            } catch {}
        }
        localStorage.removeItem("auth_user");
        localStorage.removeItem("active_hotel_code");
        setUser(null);
        setActiveHotelCodeState("");
        setActiveHotelName("");
        await fbSignOut(auth);
        const dashboardUrl = typeof window !== "undefined"
            ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? ":" + window.location.port : ""}/login`
            : "http://localhost:3000/login";
        window.location.href = dashboardUrl;
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            activeHotelCode, 
            activeHotelName, 
            hotelsList, 
            setActiveHotelCode, 
            loginWithFirestore, 
            signOutUser 
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
