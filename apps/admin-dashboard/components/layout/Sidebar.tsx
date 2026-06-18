"use client";

import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    AnimatePresence,
    type MotionValue,
    type SpringOptions,
} from "framer-motion";
import {
    BarChart2, FileImage, Home, Layout, Coffee,
    Info, Grid, Settings, LogOut, FileText,
    MapPin, Gift, Package, Search, ChevronLeft, Menu,
    TrendingUp, PieChart, Users, ShoppingCart, ClipboardList, Camera,
    Activity, BookOpen
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import React, { useEffect, useRef, useState } from "react";

export type SectionType =
    | "overview" | "logo" | "hero" | "room-type" | "digital-checkin"
    | "about" | "gallery" | "footer"
    | "attractions" | "promo" | "packages" | "seo" | "invoice" | "forecast" | "pnl" | "users" | "superadmin"
    | "purchasing" | "store-requisition" | "purchase-requisition" | "daily-market-list" | "stock-opname" | "items" | "suppliers"
    | "purchase-order" | "food-beverage-product" | "food-beverage-realtime" | "hrd" | "statements";

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

/* ── Dock item with magnification ── */
const DOCK_SPRING: SpringOptions = { mass: 0.1, stiffness: 150, damping: 12 };
const BASE_SIZE = 50;
const MAGNIFIED_SIZE = 80;
const DISTANCE = 200;

function DockNavItem({
    icon,
    label,
    isActive,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    mouseY?: MotionValue<number>;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                w-[76px] h-[76px] px-1 rounded-[8px] flex flex-col items-center justify-center gap-1
                transition-all duration-200 border border-transparent outline-none
                ${isActive
                    ? "bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-text)] shadow-none"
                    : "text-[var(--sidebar-text)]/60 hover:text-[var(--sidebar-link-hover-text)] hover:bg-[var(--sidebar-link-hover-bg)] hover:border-[var(--sidebar-link-hover-border)]"
                }
            `}
        >
            <div className="sidebar-dock-icon">
                {icon}
            </div>
            <span 
                className="text-[9px] text-center font-bold tracking-tight leading-tight w-full truncate block"
                style={{
                    color: isActive ? "var(--sidebar-link-active-text)" : "var(--sidebar-text)",
                }}
            >
                {label}
            </span>
        </button>
    );
}

import { usePathname, useRouter } from "next/navigation";

/* ── Main Sidebar ── */
export const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    setIsCollapsed,
}) => {
    const pathname = usePathname();
    const router = useRouter();
    
    // Get the first path segment as the active section, handling subpages under purchasing
    let activeSection: SectionType = "overview";
    const pathParts = pathname.split("/");
    if (pathParts[1] === "purchasing") {
        activeSection = (pathParts[2] as SectionType) || "purchasing";
    } else if (
        ["front-office", "housekeeping", "accounting"].includes(pathParts[1]) &&
        pathParts[2] === "purchase-order"
    ) {
        activeSection = "purchase-order";
    } else if (pathParts[1] === "food-beverage" && pathParts[2] === "product") {
        activeSection = "food-beverage-product";
    } else if (pathParts[1] === "food-beverage" && pathParts[2] === "realtime") {
        activeSection = "food-beverage-realtime";
    } else {
        activeSection = (pathParts[1] as SectionType) || "overview";
    }
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const mouseY = useMotionValue(Infinity);

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const docRef = doc(getHotelCollection(db, "settings"), "landingPage");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setLogoUrl(docSnap.data().lightLogo || null);
                }
            } catch (err) {
                console.error("Error fetching sidebar logo:", err);
            }
        };
        fetchLogo();
    }, []);

    const { user, signOutUser, activeHotelCode } = useAuth();
    const [activeModules, setActiveModules] = useState<string[] | null>(null);

    useEffect(() => {
        if (!activeHotelCode) {
            setActiveModules(null);
            return;
        }
        const docRef = doc(db, 'hotels', activeHotelCode);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                let modules = data.billing?.activeModules || [];
                // Map old cpanel key to cpanel-full or cpanel-only
                if (modules.includes('cpanel')) {
                    modules = modules.filter(m => m !== 'cpanel');
                    const plan = data.billing?.plan || 'premium';
                    if (plan === 'basic') {
                        if (!modules.includes('cpanel-only')) modules.push('cpanel-only');
                    } else {
                        if (!modules.includes('cpanel-full')) modules.push('cpanel-full');
                    }
                }
                if (modules.length === 0) {
                    const plan = data.billing?.plan || 'premium';
                    if (plan === 'basic') {
                        modules = ['pos', 'cpanel-only'];
                    } else {
                        modules = ['pos', 'front-office', 'housekeeping', 'food-beverage', 'purchasing', 'accounting', 'hrd', 'cpanel-full'];
                    }
                }
                setActiveModules(modules);
            }
        }, (err) => {
            console.error('Error fetching hotel modules in Sidebar:', err);
        });
        return () => unsubscribe();
    }, [activeHotelCode, isSuperadmin]);

    useEffect(() => {
        const fetchPermissions = async () => {
            if (!user?.email) return;

            try {
                // 1. Get User Role
                const userDocId = user.email.toLowerCase().replace(/[@.]/g, '_');
                const isSuper = (user as any).role === "superadmin" || user.email.toLowerCase() === "nexura.management@gmail.com";
                const userSnap = await getDoc(
                    isSuper 
                        ? doc(db, "users_master", userDocId) 
                        : doc(getHotelCollection(db, "users_master"), userDocId)
                );
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const role = userData.role;
                    
                    if (role === "superadmin") {
                        setIsSuperadmin(true);
                        return;
                    }

                    setUserPermissions(userData.permissions || {});
                } else {
                    // Default to superadmin if not found in master (for initial setup)
                    setIsSuperadmin(true);
                }
            } catch (err) {
                console.error("Error fetching permissions:", err);
                setIsSuperadmin(true);
            }
        };
        fetchPermissions();
    }, [user]);

    const allNavItems: { id: SectionType; label: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Overview", icon: <BarChart2 size={18} strokeWidth={2} /> },
        { id: "digital-checkin", label: "Digital Check-in", icon: <Camera size={18} strokeWidth={2} /> },
        { id: "forecast", label: "Forecast", icon: <TrendingUp size={18} strokeWidth={2} /> },
        { id: "pos", label: "POS Terminal", icon: <ShoppingCart size={18} strokeWidth={2} /> },
        { id: "invoice", label: "Create Invoice", icon: <FileText size={18} strokeWidth={2} /> },
        { id: "pnl", label: "PNL Statement", icon: <PieChart size={18} strokeWidth={2} /> },
        { id: "statements", label: "Laporan Keuangan", icon: <BookOpen size={18} strokeWidth={2} /> },
        { id: "logo", label: "Logo (Light/Dark)", icon: <FileImage size={18} strokeWidth={2} /> },
        { id: "hero", label: "Hero Management", icon: <Home size={18} strokeWidth={2} /> },
        { id: "room-type", label: "Room Categories", icon: <Layout size={18} strokeWidth={2} /> },
        { id: "about", label: "About Us", icon: <Info size={18} strokeWidth={2} /> },
        { id: "gallery", label: "Gallery", icon: <Grid size={18} strokeWidth={2} /> },
        { id: "cpanel", label: "CPanel", icon: <Settings size={18} strokeWidth={2} /> },
        { id: "footer", label: "Footer Info", icon: <Settings size={18} strokeWidth={2} /> },
        { id: "attractions", label: "Nearby Attractions", icon: <MapPin size={18} strokeWidth={2} /> },
        { id: "promo", label: "Promo Management", icon: <Gift size={18} strokeWidth={2} /> },
        { id: "packages", label: "Custom Packages", icon: <Package size={18} strokeWidth={2} /> },
        { id: "seo", label: "SEO & Metadata", icon: <Search size={18} strokeWidth={2} /> },
        { id: "users", label: "User Management", icon: <Users size={18} strokeWidth={2} /> },
        { id: "hrd", label: "HRD & Absensi", icon: <ClipboardList size={18} strokeWidth={2} /> },

        { id: "purchasing", label: "Dasbor", icon: <Home size={18} strokeWidth={2} /> },
        { id: "store-requisition", label: "Store Requisition", icon: <FileText size={18} strokeWidth={2} /> },
        { id: "purchase-requisition", label: "Purchase Requisition", icon: <ShoppingCart size={18} strokeWidth={2} /> },
        { id: "daily-market-list", label: "Daily Market List", icon: <Coffee size={18} strokeWidth={2} /> },
        { id: "stock-opname", label: "Stock Opname", icon: <PieChart size={18} strokeWidth={2} /> },
        { id: "items", label: "Master Barang", icon: <Package size={18} strokeWidth={2} /> },
        { id: "suppliers", label: "Supplier", icon: <Users size={18} strokeWidth={2} /> },
        { id: "purchase-order", label: "Purchase Order", icon: <ClipboardList size={18} strokeWidth={2} /> },
        { id: "food-beverage-product", label: "F&B Product", icon: <Coffee size={18} strokeWidth={2} /> },
        { id: "food-beverage-realtime", label: "POS Real-time", icon: <Activity size={18} strokeWidth={2} /> },
    ];

    const [activeModule, setActiveModule] = useState<string>("front-office");

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (pathname.startsWith('/purchasing')) {
                localStorage.setItem("active_module", "purchasing");
                setActiveModule("purchasing");
                return;
            }
            if (pathname.startsWith('/hrd')) {
                localStorage.setItem("active_module", "hrd");
                setActiveModule("hrd");
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

    const getFilteredNavItems = () => {
        if (!isSuperadmin && userPermissions) {
            const moduleMap: Record<string, string> = {
                "front-office": "module_front_office",
                "housekeeping": "module_housekeeping",
                "accounting": "module_accounting",
                "food-beverage": "module_food_beverage",
                "purchasing": "module_purchasing",
                "cpanel": "module_cpanel",
                "hrd": "module_hrd"
            };
            const moduleKey = moduleMap[activeModule];
            if (moduleKey && userPermissions[moduleKey] === false) {
                return [];
            }
        }

        let items = allNavItems;
        if (activeModule === "front-office") {
            items = allNavItems.filter(item => ["overview", "digital-checkin", "forecast", "invoice", "purchase-order"].includes(item.id));
        } else if (activeModule === "housekeeping") {
            items = allNavItems.filter(item => ["overview", "forecast", "purchase-order"].includes(item.id));
        } else if (activeModule === "accounting") {
            items = allNavItems.filter(item => ["pnl", "statements", "purchase-order"].includes(item.id));
        } else if (activeModule === "food-beverage") {
            items = allNavItems.filter(item => ["food-beverage-product", "food-beverage-realtime", "purchase-order"].includes(item.id));
        } else if (activeModule === "hrd") {
            items = allNavItems.filter(item => ["hrd"].includes(item.id));
        } else if (activeModule === "purchasing") {
            items = allNavItems.filter(item => [
                "purchasing", "store-requisition", "purchase-requisition", 
                "daily-market-list", "stock-opname", "items", "suppliers"
            ].includes(item.id));
        } else if (activeModule === "cpanel") {
            if (activeSection === "users") {
                items = allNavItems.filter(item => ["users", "superadmin"].includes(item.id));
            } else {
                if (activeModules !== null && !activeModules.includes('cpanel-full')) {
                    items = allNavItems.filter(item => ["logo"].includes(item.id));
                } else {
                    items = allNavItems.filter(item => [
                        "logo", "hero", "room-type", "about", "gallery", 
                        "footer", "attractions", "promo", "packages", "seo", "superadmin"
                    ].includes(item.id));
                }
            }
        }

        // Filter out POS terminal from other modules
        items = items.filter(item => item.id !== "pos");

        const isAdminUser = user?.role?.toLowerCase() === "admin";
        
        let finalItems = items;
        if (!isSuperadmin) {
            finalItems = finalItems.filter(item => item.id !== "superadmin");
        }

        return (isSuperadmin || isAdminUser)
            ? finalItems
            : finalItems.filter(item => userPermissions?.[item.id] === true);
    };

    const navItems = getFilteredNavItems();


    const handleLogout = () => signOutUser();

    /* ── Expanded sidebar variants ── */
    const sidebarVariants = {
        expanded: {
            width: "var(--sidebar-width)",
            transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        },
        collapsed: {
            width: "100px",
            transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        },
    };

    return (
        <motion.aside
            className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
            initial="expanded"
            animate={isCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
        >
            {/* Header */}
            <div className="sidebar-header">
                <motion.div
                    animate={{
                        opacity: isCollapsed ? 0 : 1,
                        display: isCollapsed ? "none" : "block",
                    }}
                    transition={{ duration: 0.3 }}
                    className="sidebar-logo"
                >
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            className="h-14 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
                        />
                    )}
                </motion.div>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: isCollapsed ? 180 : 0 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="sidebar-toggle"
                >
                    {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
                </motion.button>
            </div>

            {/* Navigation */}
            {isCollapsed ? (
                /* ── DOCK MODE (collapsed) — seamless, no inner panel ── */
                <div
                    className="flex-1 flex flex-col overflow-y-auto overflow-x-visible"
                    style={{ scrollbarWidth: "none" }}
                >
                    <motion.nav
                        onMouseMove={(e) => mouseY.set(e.clientY)}
                        onMouseLeave={() => mouseY.set(Infinity)}
                        className="
                            flex flex-col items-center gap-2 w-full
                            py-2 px-1.5 mx-auto overflow-visible flex-1
                        "
                        role="toolbar"
                        aria-label="Navigation dock"
                    >
                        <DockNavItem
                            icon={<Grid size={18} className="text-[var(--sidebar-link-active-bg)]" />}
                            label="Pilih Modul"
                            isActive={false}
                            mouseY={mouseY}
                            onClick={() => router.push('/select-module')}
                        />
                        <div className="w-8 h-px my-1" style={{ backgroundColor: "var(--sidebar-border)" }} />

                        {navItems.map((item) => (
                            <DockNavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={activeSection === item.id}
                                mouseY={mouseY}
                                onClick={() => {
                                    if (item.id === "purchasing") {
                                        router.push(`/purchasing?module=purchasing`);
                                    } else if (["store-requisition", "purchase-requisition", "daily-market-list", "stock-opname", "items", "suppliers"].includes(item.id)) {
                                        router.push(`/purchasing/${item.id}?module=purchasing`);
                                    } else if (item.id === "purchase-order") {
                                        router.push(`/${activeModule}/purchase-order`);
                                    } else if (item.id === "food-beverage-product") {
                                        router.push(`/food-beverage/product?module=food-beverage`);
                                    } else if (item.id === "food-beverage-realtime") {
                                        router.push(`/food-beverage/realtime?module=food-beverage`);
                                    } else if (item.id === "statements") {
                                        router.push(`/statements?module=accounting`);
                                    } else {
                                        router.push(`/${item.id}`);
                                    }
                                    if (window.innerWidth <= 1024) setIsCollapsed(true);
                                }}
                            />
                        ))}

                        {/* ── Divider ── */}
                        {activeModule !== "cpanel" && (
                            <div className="w-8 h-px my-1" style={{ backgroundColor: "var(--sidebar-border)" }} />
                        )}
 
                        {/* ── Sign Out inside the dock ── */}
                        {activeModule !== "cpanel" && (
                            <DockNavItem
                                icon={<LogOut size={18} />}
                                label="Keluar"
                                isActive={false}
                                mouseY={mouseY}
                                onClick={handleLogout}
                            />
                        )}
                    </motion.nav>
                </div>
            ) : (
                /* ── EXPANDED MODE ── */
                <nav className="nav-group">
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.97 }}
                        className="nav-item select-module-btn"
                        onClick={() => router.push('/select-module')}
                    >
                        <Grid size={18} className="nav-gold-icon" />
                        <span className="nav-label font-bold nav-gold-label">Pilih Modul</span>
                    </motion.button>

                    {navItems.map((item) => (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.2 }}
                            className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                            onClick={() => {
                                if (item.id === "purchasing") {
                                    router.push(`/purchasing?module=purchasing`);
                                } else if (["store-requisition", "purchase-requisition", "daily-market-list", "stock-opname", "items", "suppliers"].includes(item.id)) {
                                    router.push(`/purchasing/${item.id}?module=purchasing`);
                                } else if (item.id === "purchase-order") {
                                    router.push(`/${activeModule}/purchase-order`);
                                } else if (item.id === "food-beverage-product") {
                                    router.push(`/food-beverage/product?module=food-beverage`);
                                } else if (item.id === "food-beverage-realtime") {
                                    router.push(`/food-beverage/realtime?module=food-beverage`);
                                } else if (item.id === "statements") {
                                    router.push(`/statements?module=accounting`);
                                } else {
                                    router.push(`/${item.id}`);
                                }
                                if (window.innerWidth <= 1024) setIsCollapsed(true);
                            }}
                        >
                            {item.icon}
                            <span className="nav-label truncate">
                                {item.label}
                            </span>
                        </motion.button>
                    ))}
                </nav>
            )}

            {/* Footer / Logout — only shown in expanded mode */}
            {!isCollapsed && activeModule !== "cpanel" && (
                <div className="sidebar-footer">
                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Keluar</span>
                    </button>
                </div>
            )}
        </motion.aside>
    );
};