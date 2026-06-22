"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getHotelCollection } from "@/lib/firestoreHelper";

// Import modular types, constants, and subcomponents
import { SidebarProps, SectionType, NavItemType } from "./sidebar/types";
import { allNavItems } from "./sidebar/constants";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { DockMode } from "./sidebar/DockMode";
import { ExpandedMode } from "./sidebar/ExpandedMode";

export const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    setIsCollapsed,
}) => {
    const pathname = usePathname();
    const router = useRouter();

    // Determine active section based on route path
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

    const { user, signOutUser, activeHotelCode, activeHotelName } = useAuth();
    const [activeModules, setActiveModules] = useState<string[] | null>(null);
    const [activeModule, setActiveModule] = useState<string>("front-office");
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
    const [isSuperadmin, setIsSuperadmin] = useState(false);
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

    // 2. Fetch user permissions
    useEffect(() => {
        const fetchPermissions = async () => {
            if (!user?.email) return;

            try {
                const userDocId = user.email.toLowerCase().replace(/[@.]/g, "_");
                const isSuper =
                    (user as any).role === "superadmin" ||
                    user.email.toLowerCase() === "nexura.management@gmail.com";
                
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
                    // Default to superadmin if not found in master
                    setIsSuperadmin(true);
                }
            } catch (err) {
                console.error("Error fetching permissions:", err);
                setIsSuperadmin(true);
            }
        };
        fetchPermissions();
    }, [user]);

    // 3. Track current module via pathname and query parameters
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (pathname.startsWith("/purchasing")) {
                localStorage.setItem("active_module", "purchasing");
                setActiveModule("purchasing");
                return;
            }
            if (pathname.startsWith("/hrd")) {
                localStorage.setItem("active_module", "hrd");
                setActiveModule("hrd");
                return;
            }
            if (pathname.startsWith("/front-office")) {
                localStorage.setItem("active_module", "front-office");
                setActiveModule("front-office");
                return;
            }
            if (pathname.startsWith("/housekeeping")) {
                localStorage.setItem("active_module", "housekeeping");
                setActiveModule("housekeeping");
                return;
            }
            if (pathname.startsWith("/accounting")) {
                localStorage.setItem("active_module", "accounting");
                setActiveModule("accounting");
                return;
            }
            if (pathname.startsWith("/food-beverage")) {
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

    // 4. Filter navigation items based on active module and user permissions
    const getFilteredNavItems = (): NavItemType[] => {
        if (!isSuperadmin && userPermissions) {
            const moduleMap: Record<string, string> = {
                "front-office": "module_front_office",
                "housekeeping": "module_housekeeping",
                "accounting": "module_accounting",
                "food-beverage": "module_food_beverage",
                "purchasing": "module_purchasing",
                "cpanel": "module_cpanel",
                "hrd": "module_hrd",
            };
            const moduleKey = moduleMap[activeModule];
            if (moduleKey && userPermissions[moduleKey] === false) {
                return [];
            }
        }

        let items = allNavItems;
        if (activeModule === "front-office") {
            items = allNavItems.filter((item) =>
                ["overview", "digital-checkin", "forecast", "inventory-control", "invoice", "purchase-order"].includes(item.id)
            );
        } else if (activeModule === "housekeeping") {
            items = allNavItems.filter((item) =>
                ["overview", "forecast", "inventory-control", "purchase-order"].includes(item.id)
            );
        } else if (activeModule === "accounting") {
            items = allNavItems.filter((item) =>
                ["pnl", "statements", "purchase-order"].includes(item.id)
            );
        } else if (activeModule === "food-beverage") {
            items = allNavItems.filter((item) =>
                ["food-beverage-product", "food-beverage-realtime", "purchase-order"].includes(item.id)
            );
        } else if (activeModule === "hrd") {
            items = allNavItems.filter((item) => ["hrd"].includes(item.id));
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
                items = allNavItems.filter((item) => ["users", "superadmin"].includes(item.id));
            } else {
                if (activeModules !== null && !activeModules.includes("cpanel-full")) {
                    items = allNavItems.filter((item) => ["logo"].includes(item.id));
                } else {
                    items = allNavItems.filter((item) =>
                        [
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
                            "superadmin",
                        ].includes(item.id)
                    );
                }
            }
        }

        // Filter out POS terminal from other modules
        items = items.filter((item) => item.id !== "pos");

        const isAdminUser = user?.role?.toLowerCase() === "admin";

        let finalItems = items;
        if (!isSuperadmin) {
            finalItems = finalItems.filter((item) => item.id !== "superadmin");
        }

        return isSuperadmin || isAdminUser
            ? finalItems
            : finalItems.filter((item) => userPermissions?.[item.id] === true);
    };

    const navItems = getFilteredNavItems();

    // 5. Group navigation items for specific modules (cpanel, purchasing)
    const getGroupedNavItems = () => {
        if (activeModule === "cpanel") {
            const groups: { title: string; items: NavItemType[] }[] = [];

            const layoutItems = navItems.filter((item) =>
                ["logo", "hero", "about", "gallery", "footer"].includes(item.id)
            );
            const facilityItems = navItems.filter((item) =>
                ["room-type", "attractions", "packages"].includes(item.id)
            );
            const marketingItems = navItems.filter((item) =>
                ["promo", "seo"].includes(item.id)
            );
            const systemItems = navItems.filter((item) =>
                ["superadmin", "users"].includes(item.id)
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
                    activeSection={activeSection}
                    activeModule={activeModule}
                    mouseY={mouseY}
                    router={router}
                    setIsCollapsed={setIsCollapsed}
                    handleLogout={handleLogout}
                />
            ) : (
                <ExpandedMode
                    navItems={navItems}
                    groupedNavItems={groupedNavItems}
                    activeSection={activeSection}
                    activeModule={activeModule}
                    router={router}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    setIsCollapsed={setIsCollapsed}
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