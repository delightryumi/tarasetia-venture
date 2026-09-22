"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
    BarChart2, TrendingUp, ShoppingCart, FileText, 
    PieChart, FileImage, Home, Layout, Info, 
    Settings, MapPin, Gift, Package, Search, Users, 
    LogOut, Coffee, ClipboardList, Activity, BookOpen, 
    Calculator, ShieldCheck, Receipt, SlidersHorizontal, 
    Globe, Layers, X, ChevronRight, Check, Sparkles, 
    Building2, BedDouble, LayoutGrid, ArrowRight, User
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import s from "./MobileBottomNav.module.css";

interface NavItemDef {
    id: string;
    label: string;
    shortLabel?: string;
    icon: React.ReactElement;
}

interface ModuleMeta {
    id: string;
    label: string;
    shortName: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    defaultRoute: string;
}

const MODULE_DEFINITIONS: Record<string, ModuleMeta> = {
    "front-office": {
        id: "front-office",
        label: "Front Office",
        shortName: "FO",
        subtitle: "Reception & Reservations",
        icon: Building2,
        color: "#2563eb",
        defaultRoute: "/overview?module=front-office",
    },
    "housekeeping": {
        id: "housekeeping",
        label: "Housekeeping",
        shortName: "HK",
        subtitle: "Room Status & Cleanliness",
        icon: BedDouble,
        color: "#059669",
        defaultRoute: "/overview?module=housekeeping",
    },
    "accounting": {
        id: "accounting",
        label: "Accounting",
        shortName: "ACC",
        subtitle: "Finance, P&L & Balance",
        icon: Calculator,
        color: "#d97706",
        defaultRoute: "/pnl?module=accounting",
    },
    "purchasing": {
        id: "purchasing",
        label: "Purchasing",
        shortName: "PUR",
        subtitle: "Inventory, SR & PR Orders",
        icon: ShoppingCart,
        color: "#0d9488",
        defaultRoute: "/purchasing?module=purchasing",
    },
    "food-beverage": {
        id: "food-beverage",
        label: "Food & Beverage",
        shortName: "F&B",
        subtitle: "Dining, POS & Kitchen",
        icon: Coffee,
        color: "#ea580c",
        defaultRoute: "/food-beverage/product?module=food-beverage",
    },
    "hrd": {
        id: "hrd",
        label: "HRD & Absensi",
        shortName: "HRD",
        subtitle: "Staff, Shifts & Payroll",
        icon: ClipboardList,
        color: "#9333ea",
        defaultRoute: "/hrd?module=hrd",
    },
    "cpanel": {
        id: "cpanel",
        label: "CPanel & Web",
        shortName: "WEB",
        subtitle: "Content, Media & Settings",
        icon: Settings,
        color: "#475569",
        defaultRoute: "/logo",
    },
    "pos": {
        id: "pos",
        label: "POS Terminal",
        shortName: "POS",
        subtitle: "Cashier & Register",
        icon: ShoppingCart,
        color: "#e11d48",
        defaultRoute: "/pos",
    },
    "innalytics": {
        id: "innalytics",
        label: "Inalytics",
        shortName: "INA",
        subtitle: "Hotel Intelligence & Reports",
        icon: TrendingUp,
        color: "#059669",
        defaultRoute: "/innalytics",
    },
};

export const MobileBottomNav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOutUser, activeHotelCode, activeHotelName } = useAuth();
    
    const [activeModules, setActiveModules] = useState<string[] | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [activeModule, setActiveModule] = useState<string>("front-office");
    const [isMenuHubOpen, setIsMenuHubOpen] = useState(false);
    const [menuHubTab, setMenuHubTab] = useState<"menus" | "modules">("menus");

    // 1. Fetch active modules for the hotel
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
            console.error('Error fetching hotel modules in MobileBottomNav:', err);
        });
        return () => unsubscribe();
    }, [activeHotelCode, user]);

    // 2. Sync active section based on route
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
    } else if (pathParts[1] === "food-beverage" && pathParts[2] === "realtime") {
        activeSection = "food-beverage-realtime";
    } else if (pathParts[1] === "innalytics") {
        activeSection = "innalytics";
    } else {
        activeSection = pathParts[1] || "overview";
    }

    // 3. Sync active module
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (pathname.startsWith('/innalytics')) {
                localStorage.setItem("active_module", "innalytics");
                setActiveModule("innalytics");
                return;
            }
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
            if (
                pathname.startsWith('/front-office') ||
                pathname === '/digital-checkin' ||
                pathname === '/invoice' ||
                pathname.startsWith('/rate-inventory') ||
                pathname.startsWith('/confirmation-letter') ||
                pathname.startsWith('/revenue-breakdown')
            ) {
                localStorage.setItem("active_module", "front-office");
                setActiveModule("front-office");
                return;
            }
            if (pathname.startsWith('/housekeeping')) {
                localStorage.setItem("active_module", "housekeeping");
                setActiveModule("housekeeping");
                return;
            }
            if (
                pathname.startsWith('/accounting') || 
                pathname === '/pnl' || 
                pathname === '/pnl-budget' || 
                pathname === '/statements' || 
                pathname === '/dsr' || 
                pathname === '/budgeting'
            ) {
                localStorage.setItem("active_module", "accounting");
                setActiveModule("accounting");
                return;
            }
            if (pathname.startsWith('/food-beverage')) {
                localStorage.setItem("active_module", "food-beverage");
                setActiveModule("food-beverage");
                return;
            }
            const cpanelPaths = ['/logo', '/hero', '/room-type', '/about', '/gallery', '/footer', '/attractions', '/promo', '/packages', '/seo', '/users', '/superadmin', '/channel-manager'];
            if (pathname.startsWith('/cpanel') || cpanelPaths.some(p => pathname.startsWith(p))) {
                localStorage.setItem("active_module", "cpanel");
                setActiveModule("cpanel");
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

    // Close menu hub automatically on route change
    useEffect(() => {
        setIsMenuHubOpen(false);
    }, [pathname]);

    // 4. Sync permissions
    useEffect(() => {
        const fetchPermissions = async () => {
            if (!user?.email) return;

            const isSuperEmail =
                user.email.toLowerCase() === "superadmin@setara.co.id" ||
                user.email.toLowerCase() === "nexura.management@gmail.com";
            const userRole = (user as any).role?.toLowerCase();

            if (userRole === "superadmin" || isSuperEmail) {
                setIsSuperadmin(true);
                return;
            }

            try {
                const userDocId = user.email.toLowerCase().replace(/[@.]/g, '_');
                const userSnap = await getDoc(
                    doc(getHotelCollection(db, "users_master"), userDocId)
                );
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    if (userData.role?.toLowerCase() === "superadmin") {
                        setIsSuperadmin(true);
                        return;
                    }
                    setIsSuperadmin(false);
                    setUserPermissions(userData.permissions || {});
                } else {
                    setIsSuperadmin(false);
                    setUserPermissions({});
                }
            } catch (err) {
                console.error("Error fetching permissions:", err);
                setIsSuperadmin(false);
                setUserPermissions({});
            }
        };

        fetchPermissions();
    }, [user]);

    // 5. Complete list of all nav items across all modules
    const allNavItems: NavItemDef[] = useMemo(() => [
        // Front Office & Inalytics
        { id: "overview", label: "Overview", shortLabel: "Overview", icon: <BarChart2 size={16} /> },
        { id: "innalytics", label: "Inalytics", shortLabel: "Inalytics", icon: <TrendingUp size={16} /> },
        { id: "forecast", label: "Forecast", shortLabel: "Forecast", icon: <TrendingUp size={16} /> },
        { id: "revenue-breakdown", label: "Revenue Breakdown", shortLabel: "Revenue", icon: <Receipt size={16} /> },
        { id: "rate-inventory", label: "Rate & Inventory", shortLabel: "Rate & Inv", icon: <SlidersHorizontal size={16} /> },
        { id: "invoice", label: "Invoice Desk", shortLabel: "Invoice", icon: <FileText size={16} /> },
        { id: "digital-checkin", label: "GRC (Guest Card)", shortLabel: "GRC", icon: <FileText size={16} /> },
        { id: "confirmation-letter", label: "Confirmation Letter", shortLabel: "CL", icon: <FileText size={16} /> },
        { id: "inventory-control", label: "Inventory Control", shortLabel: "Inv Control", icon: <Layers size={16} /> },

        // Accounting
        { id: "pnl", label: "P&L Statement", shortLabel: "P&L", icon: <PieChart size={16} /> },
        { id: "pnl-budget", label: "P&L Actual vs Budget", shortLabel: "Budget vs Act", icon: <BarChart2 size={16} /> },
        { id: "dsr", label: "Daily Sales Report", shortLabel: "DSR", icon: <TrendingUp size={16} /> },
        { id: "budgeting", label: "Budgeting Ledger", shortLabel: "Budgeting", icon: <Calculator size={16} /> },
        { id: "statements", label: "Laporan Keuangan", shortLabel: "Lap. Keuangan", icon: <BookOpen size={16} /> },

        // Purchasing
        { id: "purchasing", label: "Dasbor Purchasing", shortLabel: "Dasbor", icon: <Home size={16} /> },
        { id: "store-requisition", label: "Store Requisition", shortLabel: "Store Req", icon: <FileText size={16} /> },
        { id: "purchase-requisition", label: "Purchase Requisition", shortLabel: "Purch Req", icon: <ShoppingCart size={16} /> },
        { id: "daily-market-list", label: "Daily Market List", shortLabel: "Market List", icon: <Coffee size={16} /> },
        { id: "stock-opname", label: "Stock Opname", shortLabel: "Opname", icon: <PieChart size={16} /> },
        { id: "items", label: "Master Barang", shortLabel: "Barang", icon: <Package size={16} /> },
        { id: "suppliers", label: "Supplier List", shortLabel: "Supplier", icon: <Users size={16} /> },

        // Food & Beverage
        { id: "food-beverage-product", label: "F&B Products", shortLabel: "Products", icon: <Coffee size={16} /> },
        { id: "food-beverage-realtime", label: "POS Real-time", shortLabel: "Real-time", icon: <Activity size={16} /> },

        // Shared PO
        { id: "purchase-order", label: "Purchase Order (PO)", shortLabel: "PO List", icon: <ClipboardList size={16} /> },

        // HRD
        { id: "hrd", label: "HRD & Absensi", shortLabel: "HRD", icon: <ClipboardList size={16} /> },

        // CPanel
        { id: "logo", label: "Logo & Branding", shortLabel: "Logo", icon: <FileImage size={16} /> },
        { id: "hero", label: "Manajemen Hero", shortLabel: "Hero", icon: <Home size={16} /> },
        { id: "room-type", label: "Kategori Kamar", shortLabel: "Kamar", icon: <Layout size={16} /> },
        { id: "about", label: "Tentang Hotel", shortLabel: "About", icon: <Info size={16} /> },
        { id: "gallery", label: "Galeri Foto", shortLabel: "Galeri", icon: <FileImage size={16} /> },
        { id: "footer", label: "Info Footer", shortLabel: "Footer", icon: <Settings size={16} /> },
        { id: "attractions", label: "Atraksi Sekitar", shortLabel: "Atraksi", icon: <MapPin size={16} /> },
        { id: "promo", label: "Manajemen Promo", shortLabel: "Promo", icon: <Gift size={16} /> },
        { id: "packages", label: "Paket Kustom", shortLabel: "Paket", icon: <Package size={16} /> },
        { id: "seo", label: "SEO & Metadata", shortLabel: "SEO", icon: <Search size={16} /> },
        { id: "users", label: "Manajemen User", shortLabel: "Users", icon: <Users size={16} /> },
        { id: "channel-manager", label: "Channel Manager", shortLabel: "Channel Mgr", icon: <Globe size={16} /> },
        { id: "superadmin", label: "Super Admin", shortLabel: "Superadmin", icon: <ShieldCheck size={16} /> },
    ], []);

    // 6. Filter submenus for current active module
    const currentModuleNavItems = useMemo(() => {
        if (!isSuperadmin && userPermissions) {
            const moduleMap: Record<string, string> = {
                "front-office": "module_front_office",
                "innalytics": "module_innalytics",
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
            items = allNavItems.filter(item => [
                "overview", "forecast", "revenue-breakdown", "rate-inventory", 
                "innalytics", "invoice", "digital-checkin", "confirmation-letter", "purchase-order"
            ].includes(item.id));
        } else if (activeModule === "innalytics") {
            items = allNavItems.filter(item => [
                "innalytics", "overview", "forecast", "revenue-breakdown"
            ].includes(item.id));
        } else if (activeModule === "housekeeping") {
            items = allNavItems.filter(item => [
                "overview", "forecast", "purchase-order"
            ].includes(item.id));
        } else if (activeModule === "accounting") {
            items = allNavItems.filter(item => [
                "pnl", "pnl-budget", "dsr", "budgeting", "statements", "purchase-order"
            ].includes(item.id));
        } else if (activeModule === "food-beverage") {
            items = allNavItems.filter(item => [
                "food-beverage-product", "food-beverage-realtime", "purchase-order"
            ].includes(item.id));
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
                    const cpanelAllowedIds = [
                        "logo", "hero", "room-type", "about", "gallery", 
                        "footer", "attractions", "promo", "packages", "seo", "users"
                    ];
                    if (isSuperadmin) {
                        cpanelAllowedIds.push("channel-manager");
                        cpanelAllowedIds.push("superadmin");
                    }
                    items = allNavItems.filter(item => cpanelAllowedIds.includes(item.id));
                }
            }
        }

        // Filter out POS terminal from items
        items = items.filter(item => item.id !== "pos");

        const isAdminUser = user?.role?.toLowerCase() === "admin";
        
        let finalItems = items;
        if (!isSuperadmin) {
            finalItems = finalItems.filter(item => item.id !== "superadmin" && item.id !== "channel-manager");
        }

        return (isSuperadmin || isAdminUser)
            ? finalItems
            : finalItems.filter(item => userPermissions?.[item.id] === true);
    }, [activeModule, allNavItems, isSuperadmin, userPermissions, activeModules, activeSection, user?.role]);

    // 7. Navigation dispatcher
    const handleNavigate = (itemId: string) => {
        setIsMenuHubOpen(false);
        if (itemId === "innalytics") {
            router.push(`/innalytics`);
        } else if (itemId === "purchasing") {
            router.push(`/purchasing?module=purchasing`);
        } else if (["store-requisition", "purchase-requisition", "daily-market-list", "stock-opname", "items", "suppliers"].includes(itemId)) {
            router.push(`/purchasing/${itemId}?module=purchasing`);
        } else if (itemId === "purchase-order") {
            router.push(`/${activeModule}/purchase-order`);
        } else if (itemId === "food-beverage-product") {
            router.push(`/food-beverage/product?module=food-beverage`);
        } else if (itemId === "food-beverage-realtime") {
            router.push(`/food-beverage/realtime?module=food-beverage`);
        } else if (itemId === "pnl") {
            router.push(`/pnl?module=accounting`);
        } else if (itemId === "statements") {
            router.push(`/statements?module=accounting`);
        } else if (itemId === "pnl-budget") {
            router.push(`/pnl-budget?module=accounting`);
        } else if (itemId === "dsr") {
            router.push(`/dsr?module=accounting`);
        } else if (itemId === "budgeting") {
            router.push(`/budgeting?module=accounting`);
        } else if (itemId === "inventory-control") {
            router.push(`/inventory-control?module=${activeModule}`);
        } else if (["overview", "forecast", "revenue-breakdown", "rate-inventory", "confirmation-letter", "invoice", "digital-checkin"].includes(itemId)) {
            router.push(`/${itemId}?module=${activeModule}`);
        } else {
            router.push(`/${itemId}`);
        }
    };

    // 8. Module switcher
    const handleSwitchModule = (modKey: string) => {
        setIsMenuHubOpen(false);
        localStorage.setItem("active_module", modKey);
        setActiveModule(modKey);
        const meta = MODULE_DEFINITIONS[modKey];
        if (meta?.defaultRoute) {
            router.push(meta.defaultRoute);
        }
    };

    // Filter accessible modules for current user
    const accessibleModules = useMemo(() => {
        const list = Object.values(MODULE_DEFINITIONS);
        return list.filter(m => {
            if (isSuperadmin) return true;
            if (m.id === "channel-manager") return false;
            if (activeModules && !activeModules.includes(m.id) && m.id !== 'cpanel') {
                return false;
            }
            if (userPermissions) {
                const mapKey = `module_${m.id.replace(/-/g, '_')}`;
                if (userPermissions[mapKey] === false) return false;
            }
            return true;
        });
    }, [isSuperadmin, activeModules, userPermissions]);

    const activeMeta = MODULE_DEFINITIONS[activeModule] || MODULE_DEFINITIONS["front-office"];
    const ActiveModuleIcon = activeMeta.icon;

    // Detect currently active submenu item
    const currentActiveItem = useMemo(() => {
        return currentModuleNavItems.find(i => i.id === activeSection) || currentModuleNavItems[0];
    }, [currentModuleNavItems, activeSection]);

    const activeItemLabel = currentActiveItem ? (currentActiveItem.shortLabel || currentActiveItem.label) : "Dashboard";

    return (
        <>
            {/* ── 1. Floating Precision Dock Bar (100% Fixed, Zero Scroll, Zero Cutoff) ── */}
            <div className={`no-print ${s.dockWrapper}`}>
                <div className={s.dockBar}>
                    {/* Slot 1: Modul Button (Opens Ganti Modul directly) */}
                    <button
                        type="button"
                        onClick={() => {
                            setMenuHubTab("modules");
                            setIsMenuHubOpen(true);
                        }}
                        className={s.moduleBtn}
                        title="Ganti Modul"
                        aria-label="Pilih Modul"
                    >
                        <div className={s.moduleIconWrapper}>
                            <ActiveModuleIcon size={17} color={activeMeta.color} />
                            <span className={s.moduleBadge}>
                                {activeMeta.shortName}
                            </span>
                        </div>
                        <span className={s.moduleBtnLabel}>
                            Modul
                        </span>
                    </button>

                    <div className={s.dockDivider} />

                    {/* Slot 2: Active Location Breadcrumb (Shows current page name, clicks to open all menus) */}
                    <button
                        type="button"
                        onClick={() => {
                            setMenuHubTab("menus");
                            setIsMenuHubOpen(true);
                        }}
                        className={s.centerLocationBtn}
                        title={`Sedang di halaman ${activeItemLabel} — Klik untuk lihat semua menu`}
                        aria-label={`Halaman Aktif: ${activeItemLabel}`}
                    >
                        <div className={s.locationTopRow}>
                            <span className={s.activeDotPulse} />
                            <span className={s.activePageName}>
                                {activeItemLabel}
                            </span>
                        </div>
                        <span className={s.locationSubtext}>
                            Halaman Aktif
                        </span>
                    </button>

                    <div className={s.dockDivider} />

                    {/* Slot 3: Menu Hub Button (Opens Semua Menu Sheet) */}
                    <button
                        type="button"
                        onClick={() => {
                            setMenuHubTab("menus");
                            setIsMenuHubOpen(!isMenuHubOpen);
                        }}
                        className={`${s.menuHubBtn} ${isMenuHubOpen ? s.menuHubBtnOpen : ""}`}
                        title="Buka Semua Menu"
                        aria-label="Semua Menu"
                    >
                        <div className={s.menuHubIconWrapper}>
                            {isMenuHubOpen ? <X size={17} /> : <LayoutGrid size={17} />}
                        </div>
                        <span className={s.menuHubBtnLabel}>
                            {isMenuHubOpen ? "Tutup" : `Menu (${currentModuleNavItems.length})`}
                        </span>
                    </button>
                </div>
            </div>

            {/* ── 2. Slide-Up Menu Hub (Bottom Sheet Modal) ── */}
            <AnimatePresence>
                {isMenuHubOpen && (
                    <>
                        {/* Dim Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsMenuHubOpen(false)}
                            className={`no-print ${s.sheetOverlay}`}
                        />

                        {/* Slide-Up Container */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 320 }}
                            className={`no-print ${s.sheetPanel}`}
                        >
                            {/* Drag Grab Handle */}
                            <div className={s.sheetHandle} />

                            {/* Sheet Header */}
                            <div className={s.sheetHeader}>
                                <div className={s.sheetHeaderLeft}>
                                    <div className={s.moduleIconBadge}>
                                        <ActiveModuleIcon size={20} color={activeMeta.color} />
                                    </div>
                                    <div>
                                        <h3 className={s.sheetModuleTitle}>
                                            <span>{activeMeta.label}</span>
                                            <span className={s.sheetModuleCode}>{activeMeta.shortName}</span>
                                        </h3>
                                        <div className={s.sheetHotelName}>
                                            {activeHotelName || "Sistem Hotel Terpadu"}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsMenuHubOpen(false)}
                                    className={s.sheetCloseBtn}
                                    aria-label="Tutup Menu"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Segmented Control Switcher */}
                            <div className={s.tabsContainer}>
                                <div className={s.segmentedControl}>
                                    <button
                                        type="button"
                                        onClick={() => setMenuHubTab("menus")}
                                        className={`${s.segmentBtn} ${menuHubTab === "menus" ? s.segmentBtnActive : ""}`}
                                    >
                                        <LayoutGrid size={13} />
                                        <span>Semua Menu ({currentModuleNavItems.length})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMenuHubTab("modules")}
                                        className={`${s.segmentBtn} ${menuHubTab === "modules" ? s.segmentBtnActive : ""}`}
                                    >
                                        <Sparkles size={13} />
                                        <span>Ganti Modul ({accessibleModules.length})</span>
                                    </button>
                                </div>
                            </div>

                            {/* Sheet Scroll Body */}
                            <div className={s.sheetScrollBody}>
                                {menuHubTab === "menus" ? (
                                    /* ── Tab 1: Grid of All Menus in Active Module ── */
                                    <div>
                                        <div className={s.sectionHeader}>
                                            <span className={s.sectionTitle}>
                                                Daftar Menu {activeMeta.label}
                                            </span>
                                            <span className={s.sectionSubtitle}>
                                                Pilih untuk navigasi
                                            </span>
                                        </div>

                                        <div className={s.menusGrid}>
                                            {currentModuleNavItems.map((item) => {
                                                const isActive = activeSection === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => handleNavigate(item.id)}
                                                        className={`${s.menuCard} ${isActive ? s.menuCardActive : ""}`}
                                                    >
                                                        <div className={s.menuCardIconBox}>
                                                            {React.cloneElement(item.icon, { size: 16 })}
                                                        </div>
                                                        <div className={s.menuCardMeta}>
                                                            <div className={s.menuCardName}>
                                                                {item.label}
                                                            </div>
                                                            {isActive && (
                                                                <div className={s.menuCardStatus}>
                                                                    <Check size={10} strokeWidth={3} /> Sedang Aktif
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    /* ── Tab 2: Switch Modules List ── */
                                    <div>
                                        <div className={s.sectionHeader}>
                                            <span className={s.sectionTitle}>
                                                Pilih Modul Hotel
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsMenuHubOpen(false);
                                                    router.push('/select-module');
                                                }}
                                                style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                                            >
                                                Buka Penuh <ArrowRight size={11} />
                                            </button>
                                        </div>

                                        <div className={s.modulesList}>
                                            {accessibleModules.map((mod) => {
                                                const isCurrent = activeModule === mod.id;
                                                const ModIcon = mod.icon;
                                                return (
                                                    <button
                                                        key={mod.id}
                                                        type="button"
                                                        onClick={() => handleSwitchModule(mod.id)}
                                                        className={`${s.moduleCard} ${isCurrent ? s.moduleCardCurrent : ""}`}
                                                    >
                                                        <div className={s.moduleCardLeft}>
                                                            <div 
                                                                className={s.moduleCardIconBox}
                                                                style={{ background: `${mod.color}15`, border: `1px solid ${mod.color}30` }}
                                                            >
                                                                <ModIcon size={18} color={mod.color} />
                                                            </div>
                                                            <div className={s.moduleCardText}>
                                                                <div className={s.moduleCardTitleRow}>
                                                                    <span className={s.moduleCardTitle}>{mod.label}</span>
                                                                    {isCurrent && (
                                                                        <span className={s.moduleBadgeActive}>Aktif</span>
                                                                    )}
                                                                </div>
                                                                <div className={s.moduleCardSubtitle}>
                                                                    {mod.subtitle}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <ChevronRight size={15} color="#94a3b8" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sheet Footer */}
                            <div className={s.sheetFooter}>
                                <div className={s.userCluster}>
                                    <div className={s.userAvatar}>
                                        <User size={15} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div className={s.userName}>
                                            {user?.displayName || user?.email?.split('@')[0] || "Staf Hotel"}
                                        </div>
                                        <div className={s.userRole}>
                                            {(user as any)?.role || "User"}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={signOutUser}
                                    className={s.logoutBtn}
                                    aria-label="Keluar dari sistem"
                                >
                                    <LogOut size={12} />
                                    <span>Keluar</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
