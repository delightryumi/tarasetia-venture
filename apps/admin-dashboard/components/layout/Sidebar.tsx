"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { hasPermission, isUserSuperadmin } from "@/lib/permissionCheck";

// Import modular types, constants, and subcomponents
import { SidebarProps, SectionType, NavItemType } from "./sidebar/types";
import { allNavItems } from "./sidebar/constants";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { DockMode } from "./sidebar/DockMode";
import { ExpandedMode } from "./sidebar/ExpandedMode";
import { navigateToSidebarItem } from "./sidebar/navigation";

export const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    setIsCollapsed,
}) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [optimisticSection, setOptimisticSection] = useState<string | null>(null);

    // Reset optimistic override whenever route or query params update
    useEffect(() => {
        setOptimisticSection(null);
    }, [pathname, searchParams]);

    // Determine active section based on route path & query parameters
    let activeSection: SectionType = "overview";
    const pathParts = pathname.split("/");
    if (pathParts[1] === "purchasing") {
        activeSection = (pathParts[2] as SectionType) || "purchasing";
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
        activeSection = (pathParts[1] as SectionType) || "overview";
    }

    const effectiveActiveSection = (optimisticSection as SectionType) || activeSection;

    const handleItemClick = (itemId: string) => {
        setOptimisticSection(itemId);
        navigateToSidebarItem(itemId, activeModule, router, setIsCollapsed);
    };

    const { user, signOutUser, activeHotelCode, activeHotelName } = useAuth();
    const [activeModules, setActiveModules] = useState<string[] | null>(null);
    const [activeModule, setActiveModule] = useState<string>("front-office");
    const isSuperadmin = isUserSuperadmin(user);
    const userPermissions = user?.permissions || {};
    const mouseY = useMotionValue(Infinity);

    // Expand state for submenus
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        "Tampilan": true,
        "Fasilitas": true,
        "Pemasaran": true,
        "Sistem": true,
        "Dasbor": true,
        "Permintaan": true,
        "Operasional": true,
        "Master Data": true,
        "Personil": true,
        "Jadwal & Shift": true,
        "Pengajuan": true,
        "Kompensasi": true,
        "Pengaturan": true,
    });

    const toggleGroup = (title: string) => {
        setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    // 1. Fetch active modules for the hotel
    useEffect(() => {
        if (!activeHotelCode) {
            setActiveModules(null);
            return;
        }
        const docRef = doc(db, "hotels", activeHotelCode);
        const unsubscribe = onSnapshot(
            docRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    let modules = data.billing?.activeModules || [];
                    
                    // Map old cpanel key to cpanel-full or cpanel-only
                    if (modules.includes("cpanel")) {
                        modules = modules.filter((m: string) => m !== "cpanel");
                        const plan = data.billing?.plan || "premium";
                        if (plan === "basic") {
                            if (!modules.includes("cpanel-only")) modules.push("cpanel-only");
                        } else {
                            if (!modules.includes("cpanel-full")) modules.push("cpanel-full");
                        }
                    }
                    if (modules.length === 0) {
                        const plan = data.billing?.plan || "premium";
                        if (plan === "basic") {
                            modules = ["pos", "cpanel-only"];
                        } else {
                            modules = [
                                "pos",
                                "front-office",
                                "housekeeping",
                                "food-beverage",
                                "purchasing",
                                "accounting",
                                "hrd",
                                "cpanel-full",
                            ];
                        }
                    }
                    setActiveModules(modules);
                }
            },
            (err) => {
                console.error("Error fetching hotel modules in Sidebar:", err);
            }
        );
        return () => unsubscribe();
    }, [activeHotelCode]);

    // 2. Track current module via pathname and query parameters
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (pathname.startsWith("/purchasing")) {
                localStorage.setItem("active_module", "purchasing");
                setActiveModule("purchasing");
                return;
            }
            if (pathname.startsWith("/innalytics")) {
                localStorage.setItem("active_module", "innalytics");
                setActiveModule("innalytics");
                return;
            }
            if (pathname.startsWith("/hrd")) {
                localStorage.setItem("active_module", "hrd");
                setActiveModule("hrd");
                return;
            }
            if (
                pathname.startsWith("/front-office") ||
                pathname === "/digital-checkin" ||
                pathname === "/invoice" ||
                pathname === "/rate-inventory" ||
                pathname.startsWith("/rate-inventory") ||
                pathname.startsWith("/confirmation-letter") ||
                pathname.startsWith("/revenue-breakdown")
            ) {
                localStorage.setItem("active_module", "front-office");
                setActiveModule("front-office");
                return;
            }
            if (pathname.startsWith("/housekeeping")) {
                localStorage.setItem("active_module", "housekeeping");
                setActiveModule("housekeeping");
                return;
            }
            if (
                pathname.startsWith("/accounting") || 
                pathname === "/pnl" || 
                pathname === "/pnl-budget" || 
                pathname === "/statements" || 
                pathname === "/dsr" || 
                pathname === "/budgeting"
            ) {
                localStorage.setItem("active_module", "accounting");
                setActiveModule("accounting");
                return;
            }
            if (pathname.startsWith("/food-beverage")) {
                localStorage.setItem("active_module", "food-beverage");
                setActiveModule("food-beverage");
                return;
            }
            const cpanelPaths = ['/logo', '/hero', '/room-type', '/about', '/gallery', '/footer', '/attractions', '/promo', '/packages', '/seo', '/channel-manager', '/users', '/superadmin'];
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

    // 4. Filter navigation items based on active module and user permissions
    const getFilteredNavItems = (): NavItemType[] => {
        const moduleMap: Record<string, string> = {
            "front-office": "module_front_office",
            "innalytics": "module_innalytics",
            "housekeeping": "module_housekeeping",
            "accounting": "module_accounting",
            "food-beverage": "module_food_beverage",
            "purchasing": "module_purchasing",
            "cpanel": "module_cpanel",
            "hrd": "module_hrd",
        };
        const moduleKey = moduleMap[activeModule];

        let items = allNavItems;
        const hasInnalytics = isSuperadmin || activeModules === null || activeModules.includes("innalytics") || activeModules.includes("inalytics");
        if (activeModule === "front-office") {
            items = allNavItems.filter((item) => {
                if (item.id === "innalytics" && !hasInnalytics) return false;
                return ["overview", "fo_walkin", "forecast", "revenue-breakdown", "rate-inventory", "innalytics", "invoice", "digital-checkin", "confirmation-letter", "purchase-order"].includes(item.id);
            });
        } else if (activeModule === "innalytics") {
            items = allNavItems.filter((item) =>
                ["innalytics", "ina_reports"].includes(item.id)
            );
        } else if (activeModule === "housekeeping") {
            items = allNavItems.filter((item) =>
                ["overview", "forecast", "purchase-order"].includes(item.id)
            );
        } else if (activeModule === "accounting") {
            items = allNavItems.filter((item) =>
                ["pnl", "pnl-budget", "dsr", "budgeting", "statements", "purchase-order"].includes(item.id)
            );
        } else if (activeModule === "food-beverage") {
            const hasRealtime = isSuperadmin || activeModules === null || activeModules.includes("food-beverage-realtime") || activeModules.includes("pos-realtime");
            items = allNavItems.filter((item) => {
                if (item.id === "food-beverage-realtime" && !hasRealtime) return false;
                return ["food-beverage-ledger", "food-beverage-performance", "food-beverage-realtime", "purchase-order"].includes(item.id);
            });
        } else if (activeModule === "hrd") {
            items = allNavItems.filter((item) =>
                [
                    "hrd",
                    "hrd_attendance",
                    "hrd_shifts",
                    "hrd_scheduling",
                    "hrd_leaves",
                    "hrd_overtime",
                    "hrd_reports",
                    "hrd_payroll",
                    "hrd_settings"
                ].includes(item.id)
            );
        } else if (activeModule === "purchasing") {
            items = allNavItems.filter((item) =>
                [
                    "purchasing",
                    "store-requisition",
                    "purchase-requisition",
                    "daily-market-list",
                    "stock-opname",
                    "items",
                    "suppliers",
                ].includes(item.id)
            );
        } else if (activeModule === "cpanel") {
            if (activeSection === "users") {
                items = allNavItems.filter((item) =>
                    item.id === "users" || (item.id === "superadmin" && isSuperadmin)
                );
            } else {
                if (!isSuperadmin && activeModules !== null && !activeModules.includes("cpanel-full")) {
                    items = allNavItems.filter((item) => ["logo"].includes(item.id));
                } else {
                    const cpanelAllowedIds = [
                        "logo",
                        "hero",
                        "room-type",
                        "about",
                        "gallery",
                        "footer",
                        "attractions",
                        "promo",
                        "packages",
                        "seo",
                    ];
                    const canAccessCM = isSuperadmin || (user?.permissions?.["channel-manager"] === true && hasPermission(user, "channel-manager", "module_channel_manager"));
                    if (canAccessCM) {
                        cpanelAllowedIds.push("channel-manager");
                    }
                    if (isSuperadmin) {
                        cpanelAllowedIds.push("superadmin");
                    }
                    items = allNavItems.filter((item) => cpanelAllowedIds.includes(item.id));
                }
            }
        }

        // Filter out POS terminal from other modules
        items = items.filter((item) => item.id !== "pos");

        const canAccessCM = isSuperadmin || (user?.permissions?.["channel-manager"] === true && hasPermission(user, "channel-manager", "module_channel_manager"));
        let finalItems = items;
        // Strictly filter out superadmin menu from anyone who is not confirmed superadmin
        if (!isSuperadmin) {
            finalItems = finalItems.filter((item) => item.id !== "superadmin");
        }
        // Strictly filter out channel-manager from anyone without CM authority
        if (!canAccessCM) {
            finalItems = finalItems.filter((item) => item.id !== "channel-manager");
        }

        return isSuperadmin
            ? finalItems
            : finalItems.filter((item) => {
                if (item.id === "superadmin") return false;
                if (item.id === "channel-manager") return canAccessCM;
                return hasPermission(user, item.id, moduleKey);
            });
    };

    const navItems = getFilteredNavItems();

    // 5. Group navigation items for specific modules (cpanel, purchasing)
    const getGroupedNavItems = () => {
        if (activeModule === "cpanel") {
            const groups: { title: string; items: NavItemType[] }[] = [];
            const canAccessCM = isSuperadmin || (user?.permissions?.["channel-manager"] === true && hasPermission(user, "channel-manager", "module_channel_manager"));

            const layoutItems = navItems.filter((item) =>
                ["logo", "hero", "about", "gallery", "footer"].includes(item.id)
            );
            const facilityItems = navItems.filter((item) =>
                ["room-type", "attractions", "packages"].includes(item.id)
            );
            const marketingItems = navItems.filter((item) =>
                ["promo", "seo"].includes(item.id) || (item.id === "channel-manager" && canAccessCM)
            );
            const systemItems = navItems.filter((item) =>
                item.id === "users" || (item.id === "superadmin" && isSuperadmin)
            );

            if (layoutItems.length > 0) groups.push({ title: "Tampilan", items: layoutItems });
            if (facilityItems.length > 0) groups.push({ title: "Fasilitas", items: facilityItems });
            if (marketingItems.length > 0) groups.push({ title: "Pemasaran", items: marketingItems });
            if (systemItems.length > 0) groups.push({ title: "Sistem", items: systemItems });

            return groups;
        }

        if (activeModule === "purchasing") {
            const groups: { title: string; items: NavItemType[] }[] = [];

            const dashboardItems = navItems.filter((item) => ["purchasing"].includes(item.id));
            const reqItems = navItems.filter((item) =>
                ["store-requisition", "purchase-requisition"].includes(item.id)
            );
            const opsItems = navItems.filter((item) =>
                ["daily-market-list", "stock-opname"].includes(item.id)
            );
            const masterItems = navItems.filter((item) => ["items", "suppliers"].includes(item.id));

            if (dashboardItems.length > 0) groups.push({ title: "Dasbor", items: dashboardItems });
            if (reqItems.length > 0) groups.push({ title: "Permintaan", items: reqItems });
            if (opsItems.length > 0) groups.push({ title: "Operasional", items: opsItems });
            if (masterItems.length > 0) groups.push({ title: "Master Data", items: masterItems });

            return groups;
        }

        if (activeModule === "hrd") {
            const groups: { title: string; items: NavItemType[] }[] = [];

            const personalItems = navItems.filter((item) =>
                ["hrd", "hrd_attendance"].includes(item.id)
            );
            const scheduleItems = navItems.filter((item) =>
                ["hrd_shifts", "hrd_scheduling"].includes(item.id)
            );
            const requestItems = navItems.filter((item) =>
                ["hrd_leaves", "hrd_overtime"].includes(item.id)
            );
            const compensationItems = navItems.filter((item) =>
                ["hrd_payroll", "hrd_reports"].includes(item.id)
            );
            const configItems = navItems.filter((item) =>
                ["hrd_settings"].includes(item.id)
            );

            if (personalItems.length > 0) groups.push({ title: "Personil", items: personalItems });
            if (scheduleItems.length > 0) groups.push({ title: "Jadwal & Shift", items: scheduleItems });
            if (requestItems.length > 0) groups.push({ title: "Pengajuan", items: requestItems });
            if (compensationItems.length > 0) groups.push({ title: "Kompensasi", items: compensationItems });
            if (configItems.length > 0) groups.push({ title: "Pengaturan", items: configItems });

            return groups;
        }

        return null;
    };

    const groupedNavItems = getGroupedNavItems();

    const handleLogout = () => signOutUser();

    // Sidebar animation configurations
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
            {/* Absolute toggle button on border */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="sidebar-toggle"
            >
                {isCollapsed ? (
                    <CaretRight size={12} weight="bold" />
                ) : (
                    <CaretLeft size={12} weight="bold" />
                )}
            </motion.button>

            {/* Sidebar Header */}
            <SidebarHeader
                isCollapsed={isCollapsed}
                activeHotelName={activeHotelName}
                activeHotelCode={activeHotelCode}
            />

            {/* Main Navigation - Dock mode or Expanded mode */}
            {isCollapsed ? (
                <DockMode
                    navItems={navItems}
                    activeSection={effectiveActiveSection}
                    activeModule={activeModule}
                    mouseY={mouseY}
                    router={router}
                    setIsCollapsed={setIsCollapsed}
                    handleLogout={handleLogout}
                    onItemClick={handleItemClick}
                />
            ) : (
                <ExpandedMode
                    navItems={navItems}
                    groupedNavItems={groupedNavItems}
                    activeSection={effectiveActiveSection}
                    activeModule={activeModule}
                    activeModules={activeModules}
                    isSuperadmin={isSuperadmin}
                    router={router}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    setIsCollapsed={setIsCollapsed}
                    onItemClick={handleItemClick}
                />
            )}

            {/* Sidebar Footer */}
            <SidebarFooter
                isCollapsed={isCollapsed}
                activeModule={activeModule}
                handleLogout={handleLogout}
            />
        </motion.aside>
    );
};