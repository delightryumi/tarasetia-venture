"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
    Building2, BedDouble, Calculator, ShoppingCart, 
    Coffee, ClipboardList, Settings, TrendingUp, 
    BarChart3, PieChart, FileText, Receipt, 
    PlusCircle, Calendar, CalendarDays, Users, 
    UserCheck, Clock, Activity, Globe, Search, 
    LogOut, X, ChevronRight, Check, LayoutGrid, 
    Layers, Compass, UtensilsCrossed, ShoppingBag, 
    Boxes, UserCog, Banknote, FileSpreadsheet, 
    FileCheck, QrCode, Tag, Image, MapPin, 
    SlidersHorizontal, Shield, Bed, Percent, 
    Truck, FileSignature, Timer, UserPlus, Sliders,
    User, Lock, Home, ShieldCheck
} from "lucide-react";
import { TwoFactorAuthModal } from "@/components/shared/TwoFactorAuthModal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { hasPermission, isUserSuperadmin } from "@/lib/permissionCheck";
import { getSidebarItemHref } from "./sidebar/navigation";
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
    primaryAction: {
        id: string;
        label: string;
        route: string;
        icon: React.ElementType;
    };
}

const MODULE_DEFINITIONS: Record<string, ModuleMeta> = {
    "front-office": {
        id: "front-office",
        label: "Front Office",
        shortName: "FO",
        subtitle: "Reception & Reservasi",
        icon: Building2,
        color: "#2563eb",
        defaultRoute: "/overview?module=front-office",
        primaryAction: {
            id: "fo_walkin",
            label: "Walk-In",
            route: "/forecast/add",
            icon: UserPlus,
        }
    },
    "housekeeping": {
        id: "housekeeping",
        label: "Housekeeping",
        shortName: "HK",
        subtitle: "Status & Kebersihan Kamar",
        icon: BedDouble,
        color: "#059669",
        defaultRoute: "/overview?module=housekeeping",
        primaryAction: {
            id: "forecast",
            label: "Kamar",
            route: "/forecast?module=housekeeping",
            icon: Bed,
        }
    },
    "accounting": {
        id: "accounting",
        label: "Accounting",
        shortName: "ACC",
        subtitle: "Laporan Keuangan & DSR",
        icon: Calculator,
        color: "#d97706",
        defaultRoute: "/pnl?module=accounting",
        primaryAction: {
            id: "dsr",
            label: "DSR",
            route: "/dsr?module=accounting",
            icon: FileText,
        }
    },
    "purchasing": {
        id: "purchasing",
        label: "Purchasing",
        shortName: "PUR",
        subtitle: "Inventaris & Permintaan Barang",
        icon: ShoppingBag,
        color: "#0d9488",
        defaultRoute: "/purchasing?module=purchasing",
        primaryAction: {
            id: "store-requisition",
            label: "SR Order",
            route: "/purchasing/store-requisition",
            icon: ClipboardList,
        }
    },
    "food-beverage": {
        id: "food-beverage",
        label: "Food & Beverage",
        shortName: "F&B",
        subtitle: "Restoran, Kasir & Dapur",
        icon: UtensilsCrossed,
        color: "#ea580c",
        defaultRoute: "/food-beverage/ledger?module=food-beverage",
        primaryAction: {
            id: "food-beverage-realtime",
            label: "Live Order",
            route: "/food-beverage/realtime",
            icon: Activity,
        }
    },
    "hrd": {
        id: "hrd",
        label: "HRD & Absensi",
        shortName: "HRD",
        subtitle: "Staf, Shift & Penggajian",
        icon: Users,
        color: "#9333ea",
        defaultRoute: "/hrd?module=hrd",
        primaryAction: {
            id: "hrd_attendance",
            label: "Presensi",
            route: "/hrd?tab=monitor",
            icon: Clock,
        }
    },
    "cpanel": {
        id: "cpanel",
        label: "CPanel & Web",
        shortName: "WEB",
        subtitle: "Konten & Pengaturan Hotel",
        icon: Settings,
        color: "#475569",
        defaultRoute: "/logo",
        primaryAction: {
            id: "users",
            label: "Users",
            route: "/users",
            icon: UserCog,
        }
    },
    "pos": {
        id: "pos",
        label: "POS Kasir",
        shortName: "POS",
        subtitle: "Terminal Kasir Resto",
        icon: ShoppingCart,
        color: "#e11d48",
        defaultRoute: "/pos",
        primaryAction: {
            id: "pos",
            label: "Kasir",
            route: "/pos",
            icon: Receipt,
        }
    },
    "innalytics": {
        id: "innalytics",
        label: "Innalytics",
        shortName: "INA",
        subtitle: "Intelijen & Analitik Hotel",
        icon: TrendingUp,
        color: "#059669",
        defaultRoute: "/innalytics",
        primaryAction: {
            id: "ina_reports",
            label: "Laporan",
            route: "/innalytics?view=reports",
            icon: PieChart,
        }
    },
};

interface MobileBottomNavProps {
    activeModules?: string[] | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeModules: activeModulesProp }) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, signOutUser, activeHotelCode, activeHotelName } = useAuth();
    
    const [activeModules, setActiveModules] = useState<string[] | null>(activeModulesProp ?? null);
    const isSuperadmin = isUserSuperadmin(user);
    const userPermissions = user?.permissions || {};
    const [activeModule, setActiveModule] = useState<string>("front-office");
    const [isMenuHubOpen, setIsMenuHubOpen] = useState(false);
    const [is2FaOpen, setIs2FaOpen] = useState(false);
    const [menuHubTab, setMenuHubTab] = useState<"menus" | "modules">("menus");
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Fetch active modules for the hotel (skip if already provided via props by DashboardLayout)
    useEffect(() => {
        if (activeModulesProp !== undefined) {
            setActiveModules(activeModulesProp);
            return;
        }
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
                    modules = modules.filter((m: string) => m !== 'cpanel');
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
    }, [activeHotelCode, user?.role, activeModulesProp]);

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
    } else if (pathParts[1] === "food-beverage" && pathParts[2] === "ledger") {
        activeSection = "food-beverage-ledger";
    } else if (pathParts[1] === "food-beverage" && pathParts[2] === "performance") {
        activeSection = "food-beverage-performance";
    } else if (pathParts[1] === "food-beverage" && pathParts[2] === "product") {
        activeSection = "food-beverage-ledger";
    } else if (pathParts[1] === "food-beverage" && pathParts[2] === "realtime") {
        activeSection = "food-beverage-realtime";
    } else if (pathParts[1] === "innalytics") {
        const view = searchParams?.get("view");
        if (view === "reports") {
            activeSection = "ina_reports";
        } else {
            activeSection = "innalytics";
        }
    } else if (pathParts[1] === "hrd") {
        const tab = searchParams?.get("tab") || "staf";
        if (tab === "monitor") activeSection = "hrd_attendance";
        else if (tab === "shift") activeSection = "hrd_shifts";
        else if (tab === "plotting") activeSection = "hrd_scheduling";
        else if (tab === "pengajuan") activeSection = "hrd_leaves";
        else if (tab === "lembur") activeSection = "hrd_overtime";
        else if (tab === "laporan") activeSection = "hrd_reports";
        else if (tab === "penggajian") activeSection = "hrd_payroll";
        else if (tab === "setting") activeSection = "hrd_settings";
        else activeSection = "hrd";
    } else if (pathname === "/forecast/add") {
        activeSection = "fo_walkin";
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

            const modParam = searchParams?.get("module");
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
    }, [pathname, searchParams]);

    // Close menu hub automatically on route change
    useEffect(() => {
        setIsMenuHubOpen(false);
        setSearchQuery("");
    }, [pathname, searchParams]);

    // Master list of all possible navigation items with real hotel & iOS icons
    const allNavItems: NavItemDef[] = useMemo(() => [
        { id: "overview", label: "Overview", shortLabel: "Overview", icon: <Home size={18} /> },
        { id: "bookings", label: "Master Bookings", shortLabel: "Bookings", icon: <CalendarDays size={18} /> },
        { id: "fo_walkin", label: "Walk-In & Reservasi", shortLabel: "Walk-In", icon: <UserPlus size={18} /> },
        { id: "forecast", label: "Forecast & Occupancy", shortLabel: "Forecast", icon: <CalendarDays size={18} /> },
        { id: "revenue-breakdown", label: "Rincian Pendapatan", shortLabel: "Revenue", icon: <PieChart size={18} /> },
        { id: "rate-inventory", label: "Rate & Allotment", shortLabel: "Rate & Allot", icon: <SlidersHorizontal size={18} /> },
        { id: "digital-checkin", label: "Digital Check-In", shortLabel: "Digital CI", icon: <QrCode size={18} /> },
        { id: "confirmation-letter", label: "Confirmation Letter", shortLabel: "Conf Letter", icon: <FileCheck size={18} /> },
        { id: "invoice", label: "Invoice Generator", shortLabel: "Invoice", icon: <Receipt size={18} /> },
        { id: "innalytics", label: "Innalytics Dashboard", shortLabel: "Innalytics", icon: <BarChart3 size={18} /> },
        { id: "ina_reports", label: "Innalytics Laporan", shortLabel: "Laporan", icon: <PieChart size={18} /> },
        { id: "pnl", label: "Laporan Laba Rugi", shortLabel: "P&L", icon: <Calculator size={18} /> },
        { id: "pnl-budget", label: "P&L Budgeting", shortLabel: "Budgeting", icon: <Sliders size={18} /> },
        { id: "dsr", label: "Daily Sales Report", shortLabel: "DSR", icon: <FileText size={18} /> },
        { id: "statements", label: "Financial Statement", shortLabel: "Statement", icon: <FileSpreadsheet size={18} /> },
        { id: "purchasing", label: "Purchasing Dashboard", shortLabel: "Purchasing", icon: <ShoppingBag size={18} /> },
        { id: "store-requisition", label: "Permintaan Barang (SR)", shortLabel: "SR Order", icon: <ClipboardList size={18} /> },
        { id: "purchase-requisition", label: "Purchase Request (PR)", shortLabel: "PR Order", icon: <FileSignature size={18} /> },
        { id: "daily-market-list", label: "Daily Market List (DML)", shortLabel: "DML", icon: <ShoppingCart size={18} /> },
        { id: "stock-opname", label: "Stock Opname", shortLabel: "Opname", icon: <Boxes size={18} /> },
        { id: "items", label: "Master Barang", shortLabel: "Barang", icon: <Boxes size={18} /> },
        { id: "suppliers", label: "Master Vendor & Supplier", shortLabel: "Vendor", icon: <Truck size={18} /> },
        { id: "food-beverage-ledger", label: "Buku Besar F&B", shortLabel: "Ledger", icon: <UtensilsCrossed size={18} /> },
        { id: "food-beverage-performance", label: "Performa Kasir & Menu", shortLabel: "Performa", icon: <TrendingUp size={18} /> },
        { id: "food-beverage-product", label: "Katalog Produk & Menu", shortLabel: "Produk", icon: <Coffee size={18} /> },
        { id: "food-beverage-realtime", label: "Pesanan Real-Time", shortLabel: "Live Order", icon: <Activity size={18} /> },
        { id: "hrd", label: "Data Karyawan", shortLabel: "Karyawan", icon: <Users size={18} /> },
        { id: "hrd_attendance", label: "Live Monitor Presensi", shortLabel: "Presensi", icon: <Clock size={18} /> },
        { id: "hrd_shifts", label: "Master Shift", shortLabel: "Shift", icon: <CalendarDays size={18} /> },
        { id: "hrd_scheduling", label: "Jadwal & Shift Planner", shortLabel: "Jadwal", icon: <Calendar size={18} /> },
        { id: "hrd_leaves", label: "Pengajuan Cuti & Izin", shortLabel: "Cuti", icon: <UserCheck size={18} /> },
        { id: "hrd_overtime", label: "Persetujuan Lembur", shortLabel: "Lembur", icon: <Timer size={18} /> },
        { id: "hrd_reports", label: "Laporan Kehadiran", shortLabel: "Laporan", icon: <FileText size={18} /> },
        { id: "hrd_payroll", label: "Penggajian (Payroll)", shortLabel: "Payroll", icon: <Banknote size={18} /> },
        { id: "hrd_settings", label: "Pengaturan HRD", shortLabel: "Setting", icon: <Settings size={18} /> },
        { id: "logo", label: "Branding & Logo", shortLabel: "Branding", icon: <Globe size={18} /> },
        { id: "hero", label: "Hero Banner", shortLabel: "Hero", icon: <Image size={18} /> },
        { id: "room-type", label: "Tipe & Foto Kamar", shortLabel: "Kamar", icon: <BedDouble size={18} /> },
        { id: "about", label: "Tentang Hotel", shortLabel: "Tentang", icon: <Building2 size={18} /> },
        { id: "gallery", label: "Galeri Foto", shortLabel: "Galeri", icon: <Image size={18} /> },
        { id: "footer", label: "Footer & Kontak", shortLabel: "Kontak", icon: <MapPin size={18} /> },
        { id: "attractions", label: "Wisata Sekitar", shortLabel: "Wisata", icon: <Compass size={18} /> },
        { id: "promo", label: "Promo & Diskon", shortLabel: "Promo", icon: <Tag size={18} /> },
        { id: "packages", label: "Paket Menginap", shortLabel: "Paket", icon: <Percent size={18} /> },
        { id: "seo", label: "SEO & Meta Tag", shortLabel: "SEO", icon: <Search size={18} /> },
        { id: "users", label: "Akses & Pengguna", shortLabel: "Users", icon: <UserCog size={18} /> },
        { id: "channel-manager", label: "Channel Manager (OTA)", shortLabel: "OTA Sync", icon: <Layers size={18} /> },
        { id: "superadmin", label: "Super Admin", shortLabel: "Superadmin", icon: <Shield size={18} /> },
        { id: "purchase-order", label: "Purchase Order (PO)", shortLabel: "PO", icon: <ShoppingBag size={18} /> },
    ], []);

    // Active module navigation items
    const currentModuleNavItems = useMemo(() => {
        const moduleMap: Record<string, string> = {
            "front-office": "module_front_office",
            "housekeeping": "module_housekeeping",
            "accounting": "module_accounting",
            "food-beverage": "module_food_beverage",
            "purchasing": "module_purchasing",
            "cpanel": "module_cpanel",
            "pos": "module_pos",
            "innalytics": "module_innalytics",
            "hrd": "module_hrd"
        };
        const moduleKey = moduleMap[activeModule];

        let items = allNavItems;
        const hasInnalytics = isSuperadmin || activeModules === null || activeModules.includes("innalytics") || activeModules.includes("inalytics");
        if (activeModule === "front-office") {
            items = allNavItems.filter(item => {
                if (item.id === "innalytics" && !hasInnalytics) return false;
                return [
                    "overview", "bookings", "fo_walkin", "forecast", "revenue-breakdown", "rate-inventory", 
                    "innalytics", "invoice", "digital-checkin", "confirmation-letter", "purchase-order"
                ].includes(item.id);
            });
        } else if (activeModule === "innalytics") {
            items = allNavItems.filter(item => [
                "innalytics", "ina_reports", "overview", "forecast", "revenue-breakdown"
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
            const hasRealtime = isSuperadmin || activeModules === null || activeModules.includes("food-beverage-realtime") || activeModules.includes("pos-realtime");
            items = allNavItems.filter(item => {
                if (item.id === "food-beverage-realtime" && !hasRealtime) return false;
                return [
                    "food-beverage-ledger", "food-beverage-performance", "food-beverage-product", "food-beverage-realtime", "purchase-order"
                ].includes(item.id);
            });
        } else if (activeModule === "hrd") {
            items = allNavItems.filter(item => [
                "hrd", "hrd_attendance", "hrd_shifts", "hrd_scheduling", 
                "hrd_leaves", "hrd_overtime", "hrd_reports", "hrd_payroll", "hrd_settings"
            ].includes(item.id));
        } else if (activeModule === "purchasing") {
            items = allNavItems.filter(item => [
                "purchasing", "store-requisition", "purchase-requisition", 
                "daily-market-list", "stock-opname", "items", "suppliers"
            ].includes(item.id));
        } else if (activeModule === "cpanel") {
            if (activeSection === "users") {
                items = allNavItems.filter(item => ["users", "superadmin"].includes(item.id));
            } else {
                if (!isSuperadmin && activeModules !== null && !activeModules.includes('cpanel-full')) {
                    items = allNavItems.filter(item => ["logo"].includes(item.id));
                } else {
                    const cpanelAllowedIds = [
                        "logo", "hero", "room-type", "about", "gallery", 
                        "footer", "attractions", "promo", "packages", "seo", "users"
                    ];
                    const canAccessCM = isSuperadmin || (user?.permissions?.["channel-manager"] === true && hasPermission(user, "channel-manager", "module_channel_manager"));
                    if (canAccessCM) {
                        cpanelAllowedIds.push("channel-manager");
                    }
                    if (isSuperadmin) {
                        cpanelAllowedIds.push("superadmin");
                    }
                    items = allNavItems.filter(item => cpanelAllowedIds.includes(item.id));
                }
            }
        }

        const canAccessCM = isSuperadmin || (user?.permissions?.["channel-manager"] === true && hasPermission(user, "channel-manager", "module_channel_manager"));
        let finalItems = items.filter(item => item.id !== "pos");
        if (!isSuperadmin) {
            finalItems = finalItems.filter(item => item.id !== "superadmin");
        }
        if (!canAccessCM) {
            finalItems = finalItems.filter(item => item.id !== "channel-manager");
        }

        return isSuperadmin
            ? finalItems
            : finalItems.filter((item) => {
                if (item.id === "superadmin") return false;
                if (item.id === "channel-manager") return canAccessCM;
                return hasPermission(user, item.id, moduleKey);
            });
    }, [activeModule, allNavItems, isSuperadmin, user, activeModules, activeSection]);

    // Navigation dispatcher
    const handleNavigate = (itemId: string) => {
        triggerHaptic(10);
        setIsMenuHubOpen(false);
        router.push(getSidebarItemHref(itemId, activeModule));
    };

    // Module switcher
    const handleSwitchModule = (modKey: string) => {
        triggerHaptic(12);
        setIsMenuHubOpen(false);
        localStorage.setItem("active_module", modKey);
        setActiveModule(modKey);
        const meta = MODULE_DEFINITIONS[modKey];
        if (meta?.defaultRoute) {
            router.push(meta.defaultRoute);
        }
    };

    // Accessible modules list
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
    const PrimaryActionIcon = activeMeta.primaryAction.icon;

    // Filtered menus for search
    const filteredMenuItems = useMemo(() => {
        if (!searchQuery.trim()) return currentModuleNavItems;
        const q = searchQuery.toLowerCase();
        return currentModuleNavItems.filter(i => 
            i.label.toLowerCase().includes(q) || 
            (i.shortLabel && i.shortLabel.toLowerCase().includes(q))
        );
    }, [currentModuleNavItems, searchQuery]);

    // Haptic feedback helper
    const triggerHaptic = (ms = 10) => {
        if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
            try {
                navigator.vibrate(ms);
            } catch (_) {}
        }
    };

    // Tab active status checks
    const isHomeActive = pathname === "/select-module";
    const isActionActive = activeSection === activeMeta.primaryAction.id || pathname === activeMeta.primaryAction.route.split('?')[0];

    return (
        <>
            {/* ── 1. Apple iOS Floating Tab Bar (4-Tab Precision Dock) ── */}
            <div className={`no-print ${s.dockWrapper}`}>
                <nav className={s.dockBar} aria-label="Navigasi Utama Mobile">
                    {/* Dynamic Ambient Tint Glow matching active module */}
                    <div 
                        className={s.dockAmbientGlow}
                        style={{ background: `radial-gradient(circle at 20% 50%, ${activeMeta.color}30 0%, transparent 65%)` }}
                    />

                    {/* Tab 1: Modul Switcher */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic(10);
                            setMenuHubTab("modules");
                            setIsMenuHubOpen(true);
                        }}
                        className={s.tabItem}
                        title="Ganti Modul Hotel"
                        aria-label="Pilih Modul Hotel"
                    >
                        <div className={s.iconWrapper}>
                            <ActiveModuleIcon size={20} strokeWidth={1.8} color={activeMeta.color} />
                            <span className={s.tabBadge}>
                                {activeMeta.shortName}
                            </span>
                        </div>
                        <span className={s.tabLabel}>Modul</span>
                    </button>

                    {/* Tab 2: Halaman Utama (Beranda / Select Module) */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic(10);
                            setIsMenuHubOpen(false);
                            router.push("/select-module");
                        }}
                        className={`${s.tabItem} ${isHomeActive && !isMenuHubOpen ? s.tabItemActive : ""}`}
                        title="Halaman Beranda Modul"
                        aria-label="Halaman Beranda Modul"
                    >
                        {isHomeActive && !isMenuHubOpen && (
                            <motion.div 
                                layoutId="iosActiveTabIndicator" 
                                className={s.activeTabPill} 
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            />
                        )}
                        <div className={s.iconWrapper}>
                            <Home size={20} strokeWidth={isHomeActive && !isMenuHubOpen ? 2.2 : 1.7} />
                        </div>
                        <span className={s.tabLabel}>Beranda</span>
                    </button>

                    {/* Tab 3: Fitur Utama / Shortcut Cepat */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic(10);
                            setIsMenuHubOpen(false);
                            router.push(activeMeta.primaryAction.route);
                        }}
                        className={`${s.tabItem} ${isActionActive && !isMenuHubOpen ? s.tabItemActive : ""}`}
                        title={activeMeta.primaryAction.label}
                        aria-label={activeMeta.primaryAction.label}
                    >
                        {isActionActive && !isMenuHubOpen && (
                            <motion.div 
                                layoutId="iosActiveTabIndicator" 
                                className={s.activeTabPill} 
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            />
                        )}
                        <div className={s.iconWrapper}>
                            <PrimaryActionIcon size={20} strokeWidth={isActionActive && !isMenuHubOpen ? 2.2 : 1.7} />
                        </div>
                        <span className={s.tabLabel}>{activeMeta.primaryAction.label}</span>
                    </button>

                    {/* Tab 4: Semua Menu Hub */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic(10);
                            setMenuHubTab("menus");
                            setIsMenuHubOpen(!isMenuHubOpen);
                        }}
                        className={`${s.tabItem} ${isMenuHubOpen ? s.tabItemActive : ""}`}
                        title="Buka Semua Menu"
                        aria-label="Semua Menu"
                    >
                        {isMenuHubOpen && (
                            <motion.div 
                                layoutId="iosActiveTabIndicator" 
                                className={s.activeTabPill} 
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            />
                        )}
                        <div className={s.iconWrapper}>
                            <LayoutGrid size={20} strokeWidth={isMenuHubOpen ? 2.2 : 1.7} />
                            <span className={`${s.tabBadge} ${s.tabBadgeCount}`}>
                                {currentModuleNavItems.length}
                            </span>
                        </div>
                        <span className={s.tabLabel}>Menu</span>
                    </button>
                </nav>
            </div>

            {/* ── 2. iOS Slide-Up Bottom Sheet Modal ── */}
            <AnimatePresence>
                {isMenuHubOpen && (
                    <>
                        {/* Dim Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => {
                                triggerHaptic(8);
                                setIsMenuHubOpen(false);
                            }}
                            className={`no-print ${s.sheetOverlay}`}
                        />

                        {/* Slide-Up Sheet Panel with Drag-to-Dismiss Gesture */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 90 || info.velocity.y > 350) {
                                    triggerHaptic(12);
                                    setIsMenuHubOpen(false);
                                }
                            }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            className={`no-print ${s.sheetPanel}`}
                        >
                            {/* Drag Grabber Handle */}
                            <div className={s.sheetHandle} />

                            {/* Sheet Header */}
                            <div className={s.sheetHeader}>
                                <div className={s.sheetHeaderLeft}>
                                    <div className={s.moduleIconBadge}>
                                        <ActiveModuleIcon size={22} color={activeMeta.color} />
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
                                    onClick={() => {
                                        triggerHaptic(8);
                                        setIsMenuHubOpen(false);
                                    }}
                                    className={s.sheetCloseBtn}
                                    aria-label="Tutup Menu"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Controls: Search + iOS Segmented Control */}
                            <div className={s.sheetControls}>
                                {menuHubTab === "menus" && (
                                    <div className={s.searchBox}>
                                        <Search size={14} className={s.searchIcon} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={`Cari menu di ${activeMeta.label}...`}
                                            className={s.searchInput}
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery("")}
                                                className="absolute right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xs p-1"
                                                aria-label="Hapus Pencarian"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className={s.segmentedControl}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic(8);
                                            setMenuHubTab("menus");
                                            setSearchQuery("");
                                        }}
                                        className={`${s.segmentBtn} ${menuHubTab === "menus" ? s.segmentBtnActive : ""}`}
                                    >
                                        {menuHubTab === "menus" && (
                                            <motion.div 
                                                layoutId="iosSegmentPill" 
                                                className={s.segmentPill} 
                                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                            />
                                        )}
                                        <LayoutGrid size={13} />
                                        <span>Daftar Menu ({currentModuleNavItems.length})</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic(8);
                                            setMenuHubTab("modules");
                                            setSearchQuery("");
                                        }}
                                        className={`${s.segmentBtn} ${menuHubTab === "modules" ? s.segmentBtnActive : ""}`}
                                    >
                                        {menuHubTab === "modules" && (
                                            <motion.div 
                                                layoutId="iosSegmentPill" 
                                                className={s.segmentPill} 
                                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                            />
                                        )}
                                        <Layers size={13} />
                                        <span>Ganti Modul ({accessibleModules.length})</span>
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content Body */}
                            <div className={s.sheetScrollBody}>
                                {menuHubTab === "menus" ? (
                                    /* ── Tab 1: Grid of Menus in Active Module ── */
                                    <div>
                                        <div className={s.menusGrid}>
                                            {filteredMenuItems.map((item) => {
                                                const isActive = activeSection === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => handleNavigate(item.id)}
                                                        className={`${s.menuCard} ${isActive ? s.menuCardActive : ""}`}
                                                    >
                                                        <div className={s.menuCardIconBox}>
                                                            {React.cloneElement(item.icon, { size: 17 })}
                                                        </div>
                                                        <div className={s.menuCardMeta}>
                                                            <div className={s.menuCardName}>
                                                                {item.label}
                                                            </div>
                                                            {!isSuperadmin && activeModules !== null && item.id === "food-beverage-realtime" && !activeModules.includes("food-beverage-realtime") && !activeModules.includes("pos-realtime") && (
                                                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                                                                    <Lock size={10} /> Add-on
                                                                </div>
                                                            )}
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

                                        {filteredMenuItems.length === 0 && (
                                            <div className="text-center py-8 text-xs text-neutral-400">
                                                Menu tidak ditemukan untuk pencarian "{searchQuery}"
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* ── Tab 2: Switch Hotel Module List ── */
                                    <div>
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
                                                                <ModIcon size={19} color={mod.color} />
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

                            {/* Sheet Footer (User Profile & Log Out Button) */}
                            <div className={s.sheetFooter}>
                                <div className={s.userCluster}>
                                    <div className={s.userAvatar}>
                                        <User size={16} />
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

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIs2FaOpen(true)}
                                        className={s.logoutBtn}
                                        style={{ color: '#2563eb' }}
                                        aria-label="Keamanan 2FA Google Authenticator"
                                    >
                                        <ShieldCheck size={13} />
                                        <span>2FA</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={signOutUser}
                                        className={s.logoutBtn}
                                        aria-label="Log out dari sistem"
                                    >
                                        <LogOut size={13} />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <TwoFactorAuthModal
                isOpen={is2FaOpen}
                onClose={() => setIs2FaOpen(false)}
            />
        </>
    );
};
