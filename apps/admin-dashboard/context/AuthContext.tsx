"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, onSnapshot, getDocs } from "firebase/firestore";
import { detectClientCity } from "@/lib/clientGeo";
import { toast } from "sonner";
import { isDeviceTrusted } from "@/lib/trustedDevice";

const SUPERADMIN_PERMISSIONS_FALLBACK = [
    "module_pos", "module_front_office", "module_innalytics", "module_housekeeping", 
    "module_food_beverage", "module_purchasing", "module_accounting", "module_cpanel",
    "module_hrd",
    "innalytics", "overview", "bookings", "forecast", "revenue-breakdown", "rate-inventory", "digital-checkin", "confirmation-letter", "inventory-control", "invoice",
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
    status?: string;
}

export type LoginResult = {
    success: boolean;
    requires2Fa?: boolean;
    requires2FaSetup?: boolean;
    error?: string;
    errorCode?: string;
};

interface AuthContextType {
    user: CustomUser | null;
    loading: boolean;
    activeHotelCode: string;
    activeHotelName: string;
    hotelsList: any[];
    setActiveHotelCode: (code: string) => void;
    loginWithFirestore: (email: string, password: string, hotelCode?: string, twoFactorCode?: string) => Promise<LoginResult>;
    signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    activeHotelCode: "",
    activeHotelName: "",
    hotelsList: [],
    setActiveHotelCode: () => {},
    loginWithFirestore: async () => ({ success: false }),
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
        const isSuper = user?.role === "superadmin" || user?.email === "superadmin@setara.co.id" || user?.email === "nexura.management@gmail.com";
        const storedCode = localStorage.getItem("active_hotel_code");
        
        // If regular partner user has a specific assigned hotel, ensure activeHotelCode aligns with their hotel
        if (!isSuper && user) {
            const userAssignedHotel = user.hotelCode || (user.allowedOutlets && user.allowedOutlets.length > 0 ? user.allowedOutlets[0] : "");
            if (userAssignedHotel && userAssignedHotel !== "0") {
                if (storedCode !== userAssignedHotel) {
                    setActiveHotelCode(userAssignedHotel);
                    return;
                }
            }
        }

        if (storedCode) {
            setActiveHotelCodeState(storedCode);
        } else if (user?.hotelCode) {
            setActiveHotelCode(user.hotelCode);
        } else if (user?.allowedOutlets && user.allowedOutlets.length > 0) {
            setActiveHotelCode(user.allowedOutlets[0]);
        }
    }, [user]);

    // Auto-logout after 1 hour (60 minutes) of inactivity
    // Industry standard for PMS / CRS: idle timer resets on user activity (mouse, keyboard, click, scroll, touch)
    // Synchronized across multiple open tabs via localStorage
    useEffect(() => {
        if (!user || typeof window === "undefined") return;

        const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour (60 minutes)
        const ACTIVITY_CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds
        const LAST_ACTIVITY_KEY = "tara_last_activity_timestamp";

        if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
            localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        }

        let lastRecordedTime = Date.now();
        const recordActivity = () => {
            const now = Date.now();
            // Throttle write: update at most once every 10 seconds to maintain high performance
            if (now - lastRecordedTime > 10000) {
                lastRecordedTime = now;
                localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
            }
        };

        const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
        activityEvents.forEach((evt) => {
            window.addEventListener(evt, recordActivity, { passive: true });
        });

        // Sync activity across multiple tabs in real-time
        const onStorageChange = (e: StorageEvent) => {
            if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
                lastRecordedTime = parseInt(e.newValue, 10);
            }
        };
        window.addEventListener("storage", onStorageChange);

        // Periodic inactivity check
        const intervalId = setInterval(() => {
            const lastActiveStr = localStorage.getItem(LAST_ACTIVITY_KEY);
            const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : Date.now();
            const now = Date.now();

            if (now - lastActive >= INACTIVITY_TIMEOUT_MS) {
                console.warn("[Security] User inactive for over 1 hour. Triggering auto-logout...");
                sessionStorage.setItem("logout_reason", "inactivity_timeout");
                toast.error("Sesi Anda telah berakhir secara otomatis demi keamanan karena tidak ada aktivitas selama 1 jam.");
                signOutUser();
            }
        }, ACTIVITY_CHECK_INTERVAL_MS);

        return () => {
            activityEvents.forEach((evt) => {
                window.removeEventListener(evt, recordActivity);
            });
            window.removeEventListener("storage", onStorageChange);
            clearInterval(intervalId);
        };
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
            // Superadmin needs full hotel fleet overview: fetch once via getDocs to prevent continuous live collection streaming
            let isCancelled = false;
            getDocs(collection(db, "hotels")).then((snapshot) => {
                if (isCancelled) return;
                const list: any[] = [];
                snapshot.forEach((doc) => {
                    list.push({ ...doc.data(), hotelCode: doc.id });
                });
                setHotelsList(list);
            }).catch((err) => {
                console.error("Error fetching hotels list for superadmin:", err);
            });
            return () => {
                isCancelled = true;
            };
        } else if (user && user.allowedOutlets && user.allowedOutlets.length > 0) {
            // Scoped multi-tenant access: fetch ONLY the assigned hotel documents (no global collection listener)
            const targetHotelCodes = Array.from(new Set([...user.allowedOutlets, user.hotelCode].filter(Boolean) as string[]));
            let isCancelled = false;

            Promise.all(targetHotelCodes.map((code) => getDoc(doc(db, "hotels", code))))
                .then((snapshots) => {
                    if (isCancelled) return;
                    const list: any[] = [];
                    snapshots.forEach((snap) => {
                        if (snap.exists()) {
                            list.push({ ...snap.data(), hotelCode: snap.id });
                        }
                    });
                    setHotelsList(list);
                })
                .catch((err) => {
                    console.error("Error fetching allowed outlets:", err);
                    if (!isCancelled) setHotelsList([]);
                });

            return () => {
                isCancelled = true;
            };
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
    }, [user?.role, user?.hotelCode, user?.allowedOutlets?.join(",")]);

    // Real-time sync of user permissions, profile, and allowedOutlets from users_master
    useEffect(() => {
        if (!user?.email) return;
        const isSuper = user.role?.toLowerCase() === "superadmin" || 
                        user.email?.toLowerCase() === "superadmin@setara.co.id" || 
                        user.email?.toLowerCase() === "admin@setara.co.id";

        const userDocId = user.email.toLowerCase().replace(/[@.]/g, "_");
        const docRef = (activeHotelCode && activeHotelCode !== "0")
            ? doc(db, `hotels/${activeHotelCode}/users_master`, userDocId)
            : doc(db, "users_master", userDocId);

        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.status === "inactive" && !isSuper) {
                    toast.error("Akun Anda telah dinonaktifkan oleh Administrator.");
                    signOutUser();
                    return;
                }
                setUser(prev => {
                    if (!prev) return prev;
                    const nextAllowed = Array.isArray(data.allowedOutlets) && data.allowedOutlets.length > 0 ? data.allowedOutlets : prev.allowedOutlets || [];
                    const nextName = data.name || data.displayName || prev.displayName;
                    const nextRole = data.role || prev.role;
                    const nextStatus = data.status;
                    
                    // Check if unchanged to preserve reference
                    if (
                        prev.displayName === nextName &&
                        prev.name === (data.name || prev.name) &&
                        prev.role === nextRole &&
                        prev.status === nextStatus &&
                        JSON.stringify(prev.allowedOutlets) === JSON.stringify(nextAllowed) &&
                        JSON.stringify(prev.permissions) === JSON.stringify(data.permissions || {})
                    ) {
                        return prev;
                    }

                    const updated: CustomUser = {
                        ...prev,
                        displayName: nextName,
                        name: data.name || prev.name,
                        role: nextRole,
                        status: nextStatus,
                        allowedOutlets: nextAllowed,
                        permissions: data.permissions || {}
                    };
                    localStorage.setItem("auth_user", JSON.stringify(updated));
                    return updated;
                });
            } else {
                // Document was deleted from Firestore
                if (!isSuper) {
                    toast.error("Akun Anda telah dihapus dari sistem.");
                    signOutUser();
                }
            }
        }, (err) => {
            console.error("Error listening to user permissions in AuthContext:", err);
        });

        // Periodic auth validity heartbeat & window focus check
        const checkAuthAlive = async () => {
            if (auth.currentUser && !isSuper) {
                try {
                    await auth.currentUser.reload();
                } catch (authErr: any) {
                    if (authErr?.code === "auth/user-not-found" || authErr?.code === "auth/user-disabled") {
                        toast.error("Akun Anda telah dihapus dari sistem.");
                        signOutUser();
                    }
                }
            }
        };

        const onFocus = () => {
            checkAuthAlive();
        };

        window.addEventListener("focus", onFocus);
        const aliveInterval = setInterval(checkAuthAlive, 60000);

        return () => {
            unsubscribe();
            window.removeEventListener("focus", onFocus);
            clearInterval(aliveInterval);
        };
    }, [user?.email, activeHotelCode]);

    // Helper to fetch user's real name, permissions, and assigned outlets from users_master
    const fetchUserName = async (email: string, code?: string): Promise<{ exists: boolean; name: string; role?: string; hotelCode?: string; permissions?: Record<string, boolean>; allowedOutlets?: string[]; status?: string; twoFactorEnabled?: boolean }> => {
        if (!email) return { exists: false, name: "" };
        const docId = email.toLowerCase().replace(/[@.]/g, "_");
        if (code && code !== "0") {
            try {
                const userDocRef = doc(db, `hotels/${code}/users_master`, docId);
                const snap = await getDoc(userDocRef);
                if (snap.exists()) {
                    const data = snap.data();
                    return {
                        exists: true,
                        name: data.name || data.displayName || data.full_name || "",
                        role: data.role || "",
                        hotelCode: data.hotelCode || code,
                        status: data.status,
                        permissions: data.permissions || {},
                        allowedOutlets: Array.isArray(data.allowedOutlets) ? data.allowedOutlets : [],
                        twoFactorEnabled: data.twoFactorEnabled === true
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
                    exists: true,
                    name: data.name || data.displayName || data.full_name || "",
                    role: data.role || "",
                    hotelCode: data.hotelCode || "",
                    status: data.status,
                    permissions: data.permissions || {},
                    allowedOutlets: Array.isArray(data.allowedOutlets) ? data.allowedOutlets : [],
                    twoFactorEnabled: data.twoFactorEnabled === true
                };
            }
        } catch (e) {
            console.error("Error fetching user from global users_master:", e);
        }
        return { exists: false, name: "" };
    };

    // Sync session on load
    useEffect(() => {
        const checkSession = async () => {
            if (typeof window !== "undefined") {
                if (window.location.pathname === "/login") {
                    sessionStorage.removeItem("tara_2fa_pending");
                }
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get("logout") === "true") {
                    localStorage.removeItem("auth_user");
                    localStorage.removeItem("active_hotel_code");
                    sessionStorage.removeItem("tara_2fa_pending");
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

                    // Background sync real name, permissions, and assigned outlets from users_master
                    const activeCode = localStorage.getItem("active_hotel_code") || parsed.hotelCode;
                    fetchUserName(parsed.email, activeCode).then(info => {
                        const isSuper = parsed.role?.toLowerCase() === "superadmin" || 
                                        parsed.email?.toLowerCase() === "superadmin@setara.co.id" || 
                                        parsed.email?.toLowerCase() === "admin@setara.co.id";
                        if (!info.exists && !isSuper) {
                            toast.error("Akun Anda telah dihapus dari sistem.");
                            signOutUser();
                            return;
                        }
                        if (info.status === "inactive" && !isSuper) {
                            toast.error("Akun Anda telah dinonaktifkan oleh Administrator.");
                            signOutUser();
                            return;
                        }
                        if (info.name || info.permissions || info.allowedOutlets) {
                            const updated: CustomUser = {
                                ...parsed,
                                displayName: info.name || parsed.displayName,
                                name: info.name || parsed.name,
                                role: info.role || parsed.role,
                                status: info.status,
                                allowedOutlets: info.allowedOutlets && info.allowedOutlets.length > 0 ? info.allowedOutlets : parsed.allowedOutlets || [],
                                permissions: info.permissions || parsed.permissions || {}
                            };
                            localStorage.setItem("auth_user", JSON.stringify(updated));
                            setUser(updated);
                        }
                    }).catch(() => {});

                    // Background heartbeat of device session with exact city
                    detectClientCity().then(clientLoc => {
                        fetch("/api/users/devices", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                userId: parsed.uid,
                                userEmail: parsed.email,
                                userName: parsed.displayName || parsed.name,
                                hotelCode: activeCode || "0",
                                location: clientLoc
                            })
                        }).catch(() => {});
                    });

                    return;
                } catch (e) {
                    localStorage.removeItem("auth_user");
                }
            }

            // Fallback to Firebase Auth
            const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
                if (typeof window !== "undefined" && sessionStorage.getItem("tara_2fa_pending") === "true") {
                    // 2FA verification is currently in progress, do not set user until 2FA completes
                    return;
                }
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

                    if (!userInfo.exists && !isSuperadminEmail && role !== "superadmin") {
                        toast.error("Akun Anda telah dihapus dari sistem.");
                        await signOutUser();
                        return;
                    }
                    if (userInfo.status === "inactive" && !isSuperadminEmail && role !== "superadmin") {
                        toast.error("Akun Anda telah dinonaktifkan oleh Administrator.");
                        await signOutUser();
                        return;
                    }

                    if (!role && userInfo.role) {
                        role = userInfo.role;
                    }
                    if (!hotelCode && userInfo.hotelCode) {
                        hotelCode = userInfo.hotelCode;
                    }

                    if (allowedOutlets.length === 0 && userInfo.allowedOutlets && userInfo.allowedOutlets.length > 0) {
                        allowedOutlets = userInfo.allowedOutlets;
                    }

                    if (!allowedOutlets.includes(hotelCode) && hotelCode && hotelCode !== "0") {
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

    const loginWithFirestore = async (email: string, password: string, hotelCodeInput?: string, twoFactorCode?: string): Promise<LoginResult> => {
        try {
            const isSuperadminEmail = email.toLowerCase() === "superadmin@setara.co.id";
            let code = hotelCodeInput?.trim() || "";

            // Allow "0" as a bypass code for superadmin
            const isSuperadminBypass = isSuperadminEmail || code === "0";

            if (code === "0" && !isSuperadminEmail) {
                return { success: false, error: "Hotel Code tidak valid." };
            }

            if (!isSuperadminBypass) {
                if (!code) {
                    return { success: false, error: "Hotel Code wajib diisi." };
                }

                // Verify hotel exists
                const hotelRef = doc(db, "hotels", code);
                const hotelSnap = await getDoc(hotelRef);
                if (!hotelSnap.exists()) {
                    return { success: false, error: "Hotel tidak terdaftar." };
                }
            }

            // Mark 2FA pending so onAuthStateChanged doesn't prematurely promote user
            if (typeof window !== "undefined") {
                sessionStorage.setItem("tara_2fa_pending", "true");
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

            const userInfo = await fetchUserName(email, code);

            // 2FA Security Challenge & Mandatory Setup Check
            if (userInfo.twoFactorEnabled) {
                const isTrusted = isDeviceTrusted(email);
                if (!isTrusted) {
                    if (!twoFactorCode) {
                        return { success: false, requires2Fa: true };
                    }
                    const valRes = await fetch("/api/auth/2fa/validate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email,
                            hotelCode: code,
                            code: twoFactorCode,
                        }),
                    });
                    const valData = await valRes.json();
                    if (!valRes.ok || !valData.valid) {
                        return { success: false, error: valData.error || "Kode verifikasi 2FA tidak valid." };
                    }
                }
            } else {
                // Mandatory 2FA: Force enrollment on first sign in
                return { success: false, requires2FaSetup: true };
            }

            // Fallback lookup from Firestore if claims aren't set yet
            if (!isSuperadminEmail && (!role || !hotelCode)) {
                role = userInfo.role || role;
                hotelCode = userInfo.hotelCode || hotelCode || code;
            }

            if (allowedOutlets.length === 0 && userInfo.allowedOutlets && userInfo.allowedOutlets.length > 0) {
                allowedOutlets = userInfo.allowedOutlets;
            }

            if (!allowedOutlets.includes(hotelCode) && hotelCode && hotelCode !== "0") {
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
                detectClientCity().then(clientLoc => {
                    fetch("/api/users/devices", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: fbUser.uid,
                            userEmail: email,
                            userName: resolvedDisplayName,
                            hotelCode: code,
                            timeZone: clientTz,
                            location: clientLoc
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
                            description: `Pengguna berhasil login ke properti #${code} (${clientLoc}).`,
                            timeZone: clientTz,
                            location: clientLoc
                        })
                    }).catch(() => {});
                });
            } catch (trackErr) {
                console.warn("Tracking error:", trackErr);
            }

            localStorage.setItem("auth_user", JSON.stringify(customUser));
            localStorage.setItem("tara_last_activity_timestamp", Date.now().toString());
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
            if (typeof window !== "undefined") {
                sessionStorage.removeItem("tara_2fa_pending");
            }
            return { success: true };
        } catch (e: any) {
            if (typeof window !== "undefined") {
                sessionStorage.removeItem("tara_2fa_pending");
            }
            return {
                success: false,
                errorCode: e.code,
                error: e.code === "auth/invalid-credential" || e.code === "auth/user-not-found" || e.code === "auth/wrong-password"
                    ? "Email, Password, atau Partner Code salah."
                    : e.message || "Gagal masuk."
            };
        }
    };

    const signOutUser = async () => {
        if (user) {
            try {
                const clientTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Jakarta";
                detectClientCity().then(clientLoc => {
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
                            description: `Pengguna logout dari sistem (${clientLoc}).`,
                            timeZone: clientTz,
                            location: clientLoc
                        })
                    }).catch(() => {});
                });
            } catch {}
        }
        localStorage.removeItem("auth_user");
        localStorage.removeItem("active_hotel_code");
        localStorage.removeItem("tara_last_activity_timestamp");
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
