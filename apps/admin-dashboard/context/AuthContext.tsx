"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";

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
    hotelCode?: string;
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
    };

    // Load activeHotelCode from localStorage or user details
    useEffect(() => {
        const storedCode = localStorage.getItem("active_hotel_code");
        if (storedCode) {
            setActiveHotelCodeState(storedCode);
        } else if (user) {
            if (user.role === "superadmin") {
                setActiveHotelCodeState("87241");
            } else if (user.hotelCode) {
                setActiveHotelCodeState(user.hotelCode);
            }
        }
    }, [user]);

    // Fetch active hotel details
    useEffect(() => {
        if (!activeHotelCode) {
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
    }, [activeHotelCode]);

    // Fetch hotels list if superadmin
    useEffect(() => {
        if (user && user.role === "superadmin") {
            const unsubscribe = onSnapshot(collection(db, "hotels"), (snapshot) => {
                const list: any[] = [];
                snapshot.forEach((doc) => {
                    list.push(doc.data());
                });
                setHotelsList(list);
            });
            return () => unsubscribe();
        } else {
            setHotelsList([]);
        }
    }, [user]);

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
                    const tokenResult = await fbUser.getIdTokenResult();
                    const claims = tokenResult.claims;
                    
                    let role = claims.role as string || "";
                    let hotelCode = claims.hotelCode as string || "";
                    
                    const isSuperadminEmail = email.toLowerCase() === "nexura.management@gmail.com";
                    if (isSuperadminEmail) {
                        role = "superadmin";
                        hotelCode = "87241";
                    }

                    // Fallback lookup from Firestore if claims aren't set yet
                    if (!role || !hotelCode) {
                        const code = localStorage.getItem("active_hotel_code");
                        if (code) {
                            const docId = email.toLowerCase().replace(/[@.]/g, "_");
                            const userDocRef = doc(db, `hotels/${code}/users_master`, docId);
                            const snap = await getDoc(userDocRef);
                            if (snap.exists()) {
                                role = snap.data().role || "";
                                hotelCode = snap.data().hotelCode || code;
                            }
                        }
                    }

                    const customUser: CustomUser = {
                        uid: fbUser.uid,
                        email: email,
                        displayName: fbUser.displayName || email.split("@")[0],
                        role,
                        hotelCode,
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
            const isSuperadminEmail = email.toLowerCase() === "nexura.management@gmail.com";
            let code = hotelCodeInput?.trim() || "";

            // Allow "1" as a bypass code for superadmin
            const isSuperadminBypass = isSuperadminEmail || code === "1";

            if (code === "1" && !isSuperadminEmail) {
                throw new Error("Hotel Code tidak valid.");
            }

            if (!isSuperadminBypass) {
                if (!code) {
                    throw new Error("Hotel Code wajib diisi.");
                }

                // Verify hotel exists and is active
                const hotelRef = doc(db, "hotels", code);
                const hotelSnap = await getDoc(hotelRef);
                if (!hotelSnap.exists()) {
                    throw new Error("Hotel tidak terdaftar.");
                }
                if (!hotelSnap.data().active) {
                    throw new Error("Sistem ditangguhkan. Silakan hubungi administrator.");
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

            // If still no role or hotelCode, set defaults or raise error
            if (isSuperadminEmail) {
                role = "superadmin";
                hotelCode = "87241";
            } else {
                if (!role || !hotelCode) {
                    throw new Error("Akun Anda belum dikonfigurasi dengan benar. Hubungi Admin.");
                }
                // Verify hotelCode claim matches input hotelCode (unless user is superadmin)
                if (role !== "superadmin" && hotelCode !== code) {
                    // Sign out because claims don't match input hotelCode
                    await fbSignOut(auth);
                    throw new Error("Anda tidak terdaftar di hotel ini.");
                }
            }

            const customUser: CustomUser = {
                uid: fbUser.uid,
                email: email,
                displayName: fbUser.displayName || email.split("@")[0],
                role,
                hotelCode,
            };

            localStorage.setItem("auth_user", JSON.stringify(customUser));
            setUser(customUser);

            if (!isSuperadminEmail) {
                setActiveHotelCodeState(code);
                localStorage.setItem("active_hotel_code", code);
            } else {
                setActiveHotelCodeState("87241");
                localStorage.setItem("active_hotel_code", "87241");
            }
            return true;
        } catch (e: any) {
            console.error("Firebase Auth login error:", e);
            throw e;
        }
    };

    const signOutUser = async () => {
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
