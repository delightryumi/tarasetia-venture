"use client";

import React, { useEffect, useState } from "react";
import { 
    BarChart2, TrendingUp, ShoppingCart, FileText, 
    PieChart, FileImage, Home, Layout, Info, 
    Grid, Settings, MapPin, Gift, Package, 
    Search, Users, LogOut, Coffee, ClipboardList 
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export const MobileBottomNav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOutUser } = useAuth();
    
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
    const [isSuperadmin, setIsSuperadmin] = useState(true);
    const [activeModule, setActiveModule] = useState<string>("front-office");

    // Sync active section based on sub-routes, mirroring Sidebar.tsx logic
    let activeSection = "overview";
    const pathParts = pathname.split("/");
    if (pathParts[1] === "purchasing") {
        activeSection = pathParts[2] || "purchasing";
    } else if (
        ["front-office", "housekeeping", "accounting"].includes(pathParts[1]) &&
        pathParts[2] === "purchase-order"
    ) {
        activeSection = "purchase-order";
    } else if (pathParts[1] === "food-beverage" && pathParts[2] === "product") {
        activeSection = "food-beverage-product";
    } else {
        activeSection = pathParts[1] || "overview";
    }

    // Sync active module
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (pathname.startsWith('/purchasing')) {
                localStorage.setItem("active_module", "purchasing");
                setActiveModule("purchasing");
                return;
            }
            if (pathname.startsWith('/front-office')) {
                localStorage.setItem("active_module", "front-office");
                setActiveModule("front-office");
                return;
            }
            if (pathname.startsWith('/housekeeping')) {
                localStorage.setItem("active_module", "housekeeping");
                setActiveModule("housekeeping");
                return;
            }
            if (pathname.startsWith('/accounting')) {
                localStorage.setItem("active_module", "accounting");
                setActiveModule("accounting");
                return;
            }
            if (pathname.startsWith('/food-beverage')) {
                localStorage.setItem("active_module", "food-beverage");
                setActiveModule("food-beverage");
                return;
            }
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
        { id: "pos", label: "POS Terminal", icon: <ShoppingCart size={20} /> },
        { id: "invoice", label: "Invoice", icon: <FileText size={20} /> },
        { id: "pnl", label: "PNL", icon: <PieChart size={20} /> },
        { id: "logo", label: "Logo", icon: <FileImage size={20} /> },
        { id: "hero", label: "Hero", icon: <Home size={20} /> },
        { id: "room-type", label: "Rooms", icon: <Layout size={20} /> },
        { id: "about", label: "About", icon: <Info size={20} /> },
        { id: "gallery", label: "Gallery", icon: <Grid size={20} /> },
        { id: "footer", label: "Footer", icon: <Settings size={20} /> },
        { id: "attractions", label: "Nearby Attractions", icon: <MapPin size={20} /> },
        { id: "promo", label: "Promo Management", icon: <Gift size={20} /> },
        { id: "packages", label: "Packages", icon: <Package size={20} /> },
        { id: "seo", label: "SEO", icon: <Search size={20} /> },
        { id: "users", label: "Users", icon: <Users size={20} /> },
        { id: "purchasing", label: "Dashboard", icon: <Home size={20} /> },
        { id: "store-requisition", label: "Store Requisitions", icon: <FileText size={20} /> },
        { id: "purchase-requisition", label: "Purchase Requisitions", icon: <ShoppingCart size={20} /> },
        { id: "daily-market-list", label: "Market List", icon: <Coffee size={20} /> },
        { id: "stock-opname", label: "Stock Opname", icon: <PieChart size={20} /> },
        { id: "items", label: "Items", icon: <Package size={20} /> },
        { id: "suppliers", label: "Suppliers", icon: <Users size={20} /> },
        { id: "purchase-order", label: "PO List", icon: <ClipboardList size={20} /> },
        { id: "food-beverage-product", label: "Products", icon: <Coffee size={20} /> },
    ];

    const getFilteredNavItems = () => {
        if (!isSuperadmin && userPermissions) {
            const moduleMap: Record<string, string> = {
                "front-office": "module_front_office",
                "housekeeping": "module_housekeeping",
                "accounting": "module_accounting",
                "food-beverage": "module_food_beverage",
                "purchasing": "module_purchasing",
                "cpanel": "module_cpanel"
            };
            const moduleKey = moduleMap[activeModule];
            if (moduleKey && userPermissions[moduleKey] === false) {
                return [];
            }
        }

        let items = allNavItems;
        if (activeModule === "front-office") {
            items = allNavItems.filter(item => ["overview", "forecast", "invoice", "purchase-order"].includes(item.id));
        } else if (activeModule === "housekeeping") {
            items = allNavItems.filter(item => ["overview", "forecast", "purchase-order"].includes(item.id));
        } else if (activeModule === "accounting") {
            items = allNavItems.filter(item => ["pnl", "purchase-order"].includes(item.id));
        } else if (activeModule === "food-beverage") {
            items = allNavItems.filter(item => ["food-beverage-product"].includes(item.id));
        } else if (activeModule === "purchasing") {
            items = allNavItems.filter(item => [
                "purchasing", "store-requisition", "purchase-requisition", 
                "daily-market-list", "stock-opname", "items", "suppliers"
            ].includes(item.id));
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
        <div className="fixed bottom-4 left-4 right-4 z-[100] lg:hidden pointer-events-none flex justify-center">
            <motion.div 
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="pointer-events-auto flex items-center bg-[#788069]/90 dark:bg-stone-900/90 h-[64px] px-4 border border-white/10 dark:border-white/[0.06] rounded-2xl w-full max-w-[460px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-x-auto bottom-nav-scroll"
            >
                <div className="flex items-center gap-3.5 justify-start px-1 md:justify-center md:mx-auto min-w-max">
                    {/* Pilih Modul Button */}
                    <button
                        onClick={() => router.push('/select-module')}
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 hover:border-white/10 transition-all duration-300"
                        title="Pilih Modul"
                    >
                        <Grid size={22} className="text-[#ffd8a6]" />
                    </button>

                    <div className="w-px h-6 bg-white/10 flex-shrink-0" />

                    {navItems.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <motion.button
                                layout
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                key={item.id}
                                onClick={() => {
                                    if (item.id === "purchasing") {
                                        router.push(`/purchasing?module=purchasing`);
                                    } else if (["store-requisition", "purchase-requisition", "daily-market-list", "stock-opname", "items", "suppliers"].includes(item.id)) {
                                        router.push(`/purchasing/${item.id}?module=purchasing`);
                                    } else if (item.id === "purchase-order") {
                                        router.push(`/${activeModule}/purchase-order`);
                                    } else if (item.id === "food-beverage-product") {
                                        router.push(`/food-beverage/product?module=food-beverage`);
                                    } else {
                                        router.push(`/${item.id}`);
                                    }
                                }}
                                className={`
                                    flex-shrink-0 flex items-center justify-center gap-2 rounded-[8px] h-10 transition-all duration-300 relative group
                                    ${isActive 
                                        ? 'bg-[#ffd8a6] text-[#232323] px-3.5 shadow-[0_4px_12px_rgba(255,216,166,0.3)] font-extrabold' 
                                        : 'w-10 text-white/60 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-center shrink-0">
                                    {React.cloneElement(item.icon as React.ReactElement, { 
                                        size: 18, 
                                        strokeWidth: isActive ? 2.5 : 2 
                                    })}
                                </div>

                                <AnimatePresence initial={false}>
                                    {isActive && (
                                        <motion.span 
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                    })}

                    <div className="w-px h-6 bg-white/10 flex-shrink-0" />

                    <button
                        onClick={signOutUser}
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-rose-300 hover:bg-white/5 transition-all duration-300"
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </motion.div>
            
        </div>
    );
};
