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
    TrendingUp, PieChart, Users, ShoppingCart, ClipboardList
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";

/* ── Types ── */
export type SectionType =
    | "overview" | "logo" | "hero" | "room-type"
    | "about" | "gallery" | "footer"
    | "attractions" | "promo" | "packages" | "seo" | "invoice" | "forecast" | "pnl" | "users"
    | "purchasing" | "store-requisition" | "purchase-requisition" | "daily-market-list" | "stock-opname" | "items" | "suppliers"
    | "purchase-order" | "food-beverage-product";

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
    mouseY,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    mouseY: MotionValue<number>;
    onClick: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

    const distanceFromMouse = useTransform(mouseY, (val) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return DISTANCE;
        return val - r.y - r.height / 2;
    });

    const sizeRaw = useTransform(
        distanceFromMouse,
        [-DISTANCE, 0, DISTANCE],
        [BASE_SIZE, MAGNIFIED_SIZE, BASE_SIZE]
    );
    const size = useSpring(sizeRaw, DOCK_SPRING);

    const handleHoverStart = () => {
        if (ref.current) {
            const r = ref.current.getBoundingClientRect();
            setTooltipPos({ top: r.top + r.height / 2, left: r.right + 12 });
        }
        setHovered(true);
    };

    return (
        <motion.div
            ref={ref}
            style={{ width: size, height: size }}
            onHoverStart={handleHoverStart}
            onHoverEnd={() => setHovered(false)}
            onClick={onClick}
            tabIndex={0}
            role="button"
            className="relative inline-flex items-center justify-center cursor-pointer outline-none"
        >
            {/* The square item box */}
            <div
                className={`
                    w-full h-full rounded-[10px] flex items-center justify-center
                    border transition-colors duration-200
                    ${isActive
                        ? "bg-[var(--peach)] border-[var(--peach)] text-[var(--rich-black)] shadow-[0_4px_16px_rgba(255,216,166,0.5)]"
                        : "text-white/70 hover:text-white hover:border-white/25"
                    }
                `}
                style={isActive ? undefined : {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(255,255,255,0.1)",
                }}
            >
                {icon}
            </div>

            {/* Floating label — fixed position to escape scroll clipping */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.15 }}
                        className="px-2.5 py-1 rounded-md border text-white text-xs font-semibold whitespace-nowrap pointer-events-none"
                        style={{
                            position: "fixed",
                            top: tooltipPos.top,
                            left: tooltipPos.left,
                            transform: "translateY(-50%)",
                            zIndex: 9999,
                            backgroundColor: "var(--sage, #788069)",
                            borderColor: "rgba(255,255,255,0.15)",
                        }}
                    >
                        {label}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
                const docRef = doc(db, "settings", "landingPage");
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

    const { user, signOutUser } = useAuth();

    useEffect(() => {
        const fetchPermissions = async () => {
            if (!user?.email) return;

            try {
                // 1. Get User Role
                const userDocId = user.email.replace(/[@.]/g, '_');
                const userSnap = await getDoc(doc(db, "users_master", userDocId));
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const role = userData.role;
                    
                    if (role === "superadmin") {
                        setIsSuperadmin(true);
                        return;
                    }

                    // 2. Get Role Permissions
                    const roleId = role.toLowerCase().replace(/\s+/g, '_');
                    const roleSnap = await getDoc(doc(db, "roles_master", roleId));
                    if (roleSnap.exists()) {
                        setUserPermissions(roleSnap.data().permissions || {});
                    } else {
                        setUserPermissions({});
                    }
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
        { id: "forecast", label: "Forecast", icon: <TrendingUp size={18} strokeWidth={2} /> },
        { id: "pos", label: "POS Terminal", icon: <ShoppingCart size={18} strokeWidth={2} /> },
        { id: "invoice", label: "Create Invoice", icon: <FileText size={18} strokeWidth={2} /> },
        { id: "pnl", label: "PNL Statement", icon: <PieChart size={18} strokeWidth={2} /> },
        { id: "logo", label: "Logo (Light/Dark)", icon: <FileImage size={18} strokeWidth={2} /> },
        { id: "hero", label: "Hero Management", icon: <Home size={18} strokeWidth={2} /> },
        { id: "room-type", label: "Room Categories", icon: <Layout size={18} strokeWidth={2} /> },
        { id: "about", label: "About Us", icon: <Info size={18} strokeWidth={2} /> },
        { id: "gallery", label: "Gallery", icon: <Grid size={18} strokeWidth={2} /> },
        { id: "footer", label: "Footer Info", icon: <Settings size={18} strokeWidth={2} /> },
        { id: "attractions", label: "Nearby Attractions", icon: <MapPin size={18} strokeWidth={2} /> },
        { id: "promo", label: "Promo Management", icon: <Gift size={18} strokeWidth={2} /> },
        { id: "packages", label: "Custom Packages", icon: <Package size={18} strokeWidth={2} /> },
        { id: "seo", label: "SEO & Metadata", icon: <Search size={18} strokeWidth={2} /> },
        { id: "users", label: "User Management", icon: <Users size={18} strokeWidth={2} /> },
        { id: "purchasing", label: "Dashboard", icon: <Home size={18} strokeWidth={2} /> },
        { id: "store-requisition", label: "Store Requisitions", icon: <FileText size={18} strokeWidth={2} /> },
        { id: "purchase-requisition", label: "Purchase Requisitions", icon: <ShoppingCart size={18} strokeWidth={2} /> },
        { id: "daily-market-list", label: "Daily Market List", icon: <Coffee size={18} strokeWidth={2} /> },
        { id: "stock-opname", label: "Stock Opname", icon: <PieChart size={18} strokeWidth={2} /> },
        { id: "items", label: "Items Master", icon: <Package size={18} strokeWidth={2} /> },
        { id: "suppliers", label: "Suppliers", icon: <Users size={18} strokeWidth={2} /> },
        { id: "purchase-order", label: "Purchase Order", icon: <ClipboardList size={18} strokeWidth={2} /> },
        { id: "food-beverage-product", label: "F&B Product", icon: <Coffee size={18} strokeWidth={2} /> },
    ];

    const [activeModule, setActiveModule] = useState<string>("front-office");

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

    const getFilteredNavItems = () => {
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

        // Filter out POS terminal from other modules
        items = items.filter(item => item.id !== "pos");

        return isSuperadmin 
            ? items 
            : items.filter(item => userPermissions?.[item.id] === true);
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
                            className="h-14 w-auto object-contain brightness-0 invert drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                        />
                    )}
                </motion.div>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: isCollapsed ? 180 : 0 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="sidebar-toggle"
                >
                    {isCollapsed ? <Menu size={24} /> : <ChevronLeft size={24} />}
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
                            icon={<Grid size={18} className="text-[var(--peach)]" />}
                            label="Pilih Modul"
                            isActive={false}
                            mouseY={mouseY}
                            onClick={() => router.push('/select-module')}
                        />
                        <div className="w-8 h-px my-1" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />

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
                                    } else {
                                        router.push(`/${item.id}`);
                                    }
                                    if (window.innerWidth <= 1024) setIsCollapsed(true);
                                }}
                            />
                        ))}

                        {/* ── Divider ── */}
                        <div className="w-8 h-px my-1" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />

                        {/* ── Sign Out inside the dock ── */}
                        <DockNavItem
                            icon={<LogOut size={18} />}
                            label="Sign Out"
                            isActive={false}
                            mouseY={mouseY}
                            onClick={handleLogout}
                        />
                    </motion.nav>
                </div>
            ) : (
                /* ── EXPANDED MODE ── */
                <nav className="nav-group">
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 216, 166, 0.15)", color: "#ffffff" }}
                        whileTap={{ scale: 0.97 }}
                        className="nav-item border border-[var(--peach)]/30 text-[var(--peach)] mb-4"
                        onClick={() => router.push('/select-module')}
                    >
                        <Grid size={18} className="text-[var(--peach)]" />
                        <span className="nav-label font-bold text-[var(--peach)]">Pilih Modul</span>
                    </motion.button>

                    {navItems.map((item) => (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                backgroundColor:
                                    activeSection === item.id
                                        ? "var(--peach)"
                                        : "rgba(255, 255, 255, 0.04)",
                                color:
                                    activeSection === item.id
                                        ? "var(--rich-black)"
                                        : "rgba(255, 255, 255, 0.6)",
                                boxShadow:
                                    activeSection === item.id
                                        ? "0 12px 30px rgba(255, 216, 166, 0.5)"
                                        : "none",
                            }}
                            whileHover={{
                                scale: 1.03,
                                backgroundColor:
                                    activeSection === item.id
                                        ? "var(--peach)"
                                        : "rgba(255, 255, 255, 0.12)",
                                color:
                                    activeSection === item.id
                                        ? "var(--rich-black)"
                                        : "#ffffff",
                            }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
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
                                } else {
                                    router.push(`/${item.id}`);
                                }
                                if (window.innerWidth <= 1024) setIsCollapsed(true);
                            }}
                        >
                            {item.icon}
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="nav-label truncate"
                            >
                                {item.label}
                            </motion.span>
                        </motion.button>
                    ))}
                </nav>
            )}

            {/* Footer / Logout — only shown in expanded mode */}
            {!isCollapsed && (
                <div className="sidebar-footer">
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 216, 166, 0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </motion.button>
                </div>
            )}
        </motion.aside>
    );
};