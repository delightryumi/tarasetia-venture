"use client";

import React, { useEffect, useState } from "react";
import { 
    BarChart2, TrendingUp, ShoppingCart, FileText, 
    PieChart, FileImage, Home, Layout, Info, 
    Grid, Settings, MapPin, Gift, Package, 
    Search, Users, LogOut 
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const SAGE = "#788069";
const PEACH = "#ffd8a6";

export const MobileBottomNav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const activeSection = pathname.split("/")[1] || "overview";
    const { user, signOutUser } = useAuth();
    
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
    const [isSuperadmin, setIsSuperadmin] = useState(true);
    const [activeModule, setActiveModule] = useState<string>("front-office");

    // Sync active module
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const modParam = params.get("module");
            if (modParam) {
                localStorage.setItem("active_module", modParam);
                setActiveModule(modParam);
            } else {
                const storedMod = localStorage.getItem("active_module");
                if (storedMod) {
                    setActiveModule(storedMod);
                } else {
                    localStorage.setItem("active_module", "front-office");
                    setActiveModule("front-office");
                }
            }
        }
    }, [pathname]);

    // Sync permissions
    useEffect(() => {
        const fetchPermissions = async () => {
            if (!user?.email) return;

            try {
                const userDocId = user.email.toLowerCase().replace(/[@.]/g, '_');
                const userSnap = await getDoc(doc(db, "users_master", userDocId));
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const role = userData.role;
                    
                    if (role === "superadmin") {
                        setIsSuperadmin(true);
                        return;
                    }

                    setIsSuperadmin(false);
                    setUserPermissions(userData.permissions || {});
                } else {
                    setIsSuperadmin(true);
                }
            } catch (err) {
                console.error("Error fetching permissions:", err);
                setIsSuperadmin(true);
            }
        };

        fetchPermissions();
    }, [user]);

    const allNavItems = [
        { id: "overview", label: "Overview", icon: <BarChart2 size={20} /> },
        { id: "forecast", label: "Forecast", icon: <TrendingUp size={20} /> },
        { id: "pos", label: "POS", icon: <ShoppingCart size={20} /> },
        { id: "invoice", label: "Invoice", icon: <FileText size={20} /> },
        { id: "pnl", label: "PNL", icon: <PieChart size={20} /> },
        { id: "logo", label: "Logo", icon: <FileImage size={20} /> },
        { id: "hero", label: "Hero", icon: <Home size={20} /> },
        { id: "room-type", label: "Rooms", icon: <Layout size={20} /> },
        { id: "about", label: "About", icon: <Info size={20} /> },
        { id: "gallery", label: "Gallery", icon: <Grid size={20} /> },
        { id: "footer", label: "Footer", icon: <Settings size={20} /> },
        { id: "attractions", label: "Travel", icon: <MapPin size={20} /> },
        { id: "promo", label: "Promo", icon: <Gift size={20} /> },
        { id: "packages", label: "Pack", icon: <Package size={20} /> },
        { id: "seo", label: "SEO", icon: <Search size={20} /> },
        { id: "users", label: "Users", icon: <Users size={20} /> },
    ];

    const getFilteredNavItems = () => {
        if (!isSuperadmin && userPermissions) {
            const moduleMap: Record<string, string> = {
                "front-office": "module_front_office",
                "housekeeping": "module_housekeeping",
                "accounting": "module_accounting",
                "cpanel": "module_cpanel"
            };
            const moduleKey = moduleMap[activeModule];
            if (moduleKey && userPermissions[moduleKey] === false) {
                return [];
            }
        }

        let items = allNavItems;
        if (activeModule === "front-office") {
            items = allNavItems.filter(item => ["overview", "forecast", "invoice"].includes(item.id));
        } else if (activeModule === "housekeeping") {
            items = allNavItems.filter(item => ["overview", "forecast"].includes(item.id));
        } else if (activeModule === "accounting") {
            items = allNavItems.filter(item => ["pnl"].includes(item.id));
        } else if (activeModule === "cpanel") {
            items = allNavItems.filter(item => [
                "logo", "hero", "room-type", "about", "gallery", 
                "footer", "attractions", "promo", "packages", "seo", "users"
            ].includes(item.id));
        }

        // Filter out POS terminal link
        items = items.filter(item => item.id !== "pos");

        return isSuperadmin 
            ? items 
            : items.filter(item => userPermissions?.[item.id] === true);
    };

    const navItems = getFilteredNavItems();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden pointer-events-none">
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto flex items-center bg-[#788069] h-[72px] px-8 pb-safe border-t border-white/10 w-full overflow-x-auto no-scrollbar shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div className="flex items-center gap-10 min-w-full justify-center">
                    {/* Pilih Modul Button */}
                    <button
                        onClick={() => router.push('/select-module')}
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:-translate-y-1 transition-all duration-300"
                    >
                        <Grid size={26} className="text-[#ffd8a6]" />
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-2 flex-shrink-0" />

                    {navItems.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => router.push(`/${item.id}`)}
                                className={`
                                    flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center 
                                    transition-all duration-300 relative group
                                    ${isActive ? 'bg-white text-[#788069] shadow-xl -translate-y-2 scale-110' : 'text-white/60 hover:text-white hover:-translate-y-1'}
                                `}
                            >
                                <div className="icon">
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 26, strokeWidth: isActive ? 2.5 : 2 })}
                                </div>

                                <AnimatePresence mode="wait">
                                    {isActive && (
                                        <motion.span 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute -top-10 px-3 py-1.5 bg-stone-900 text-white text-[9px] font-black rounded-lg uppercase tracking-[0.2em] shadow-2xl pointer-events-none whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        );
                    })}

                    <div className="w-px h-8 bg-white/10 mx-2 flex-shrink-0" />

                    <button
                        onClick={signOutUser}
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white/40 hover:text-rose-300 hover:-translate-y-1 transition-all duration-300"
                    >
                        <LogOut size={26} />
                    </button>
                </div>
            </motion.div>
            
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
