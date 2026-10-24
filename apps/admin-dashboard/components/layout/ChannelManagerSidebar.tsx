"use client";

import React, { useEffect, useState, useRef } from "react";
import { NotificationSettingsDrawer } from "./NotificationSettingsDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    CaretLeft,
    CaretRight,
    CaretDown,
    SquaresFour,
    Bell,
    Key,
    Table,
    Globe,
    UsersThree,
    Browsers,
    ShieldCheck,
    TrendUp,
    Tag,
    MagnifyingGlass,
    Image,
    ChatCircleDots,
    Star,
    CreditCard,
    Receipt,
    Bed,
    SlidersHorizontal,
    Buildings,
    Compass,
    ArrowsClockwise,
    TerminalWindow,
    CheckSquare,
    PlugsConnected,
    Check,
    Broadcast
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import styles from "./ChannelManagerSidebar.module.css";

interface ChannelManagerSidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

interface CmMenuItem {
    id: string;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    badge?: string;
}

interface CmMenuGroup {
    title: string;
    icon: React.ElementType;
    items: CmMenuItem[];
}

export const ChannelManagerSidebar: React.FC<ChannelManagerSidebarProps> = ({
    isCollapsed,
    setIsCollapsed
}) => {
    const router = useRouter();
    const { activeHotelCode, activeHotelName, user } = useAuth();
    const [currentTab, setCurrentTab] = useState<string>("mapping");
    const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);

    // Hover flyout submenu state
    const [hoveredGroup, setHoveredGroup] = useState<CmMenuGroup | null>(null);
    const [flyoutTop, setFlyoutTop] = useState<number>(100);
    const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Collapsible group state for expanded mode
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        "Distribusi Saluran": true,
        "Yield & Revenue": true,
        "Komunikasi & Tamu": true,
        "Finansial & Booking": true,
        "Master Data Properti": true,
        "Log & Audit Sistem": true,
        "Sertifikasi & Gateway": true,
    });

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => {
            const nextState = !prev[title];
            if (nextState) {
                // When expanding a group, suppress flyout immediately
                setHoveredGroup(null);
            }
            return {
                ...prev,
                [title]: nextState
            };
        });
    };

    // Sync active tab with URL query parameter ?tab= and events
    useEffect(() => {
        if (typeof window !== "undefined") {
            const syncFromUrl = () => {
                const params = new URLSearchParams(window.location.search);
                const tabParam = params.get("tab");
                if (tabParam) {
                    setCurrentTab(tabParam);
                }
            };

            syncFromUrl();

            const handleCustomTab = (e: any) => {
                const tab = typeof e.detail === "string" ? e.detail : e.detail?.tab;
                if (tab) setCurrentTab(tab);
            };

            window.addEventListener("channel-tab-change", handleCustomTab);
            window.addEventListener("popstate", syncFromUrl);

            return () => {
                window.removeEventListener("channel-tab-change", handleCustomTab);
                window.removeEventListener("popstate", syncFromUrl);
            };
        }
    }, []);

    const MENU_GROUPS: CmMenuGroup[] = [
        {
            title: "Distribusi Saluran",
            icon: PlugsConnected,
            items: [
                { id: "mapping", label: "Saluran & Pemetaan", shortLabel: "Pemetaan", icon: PlugsConnected },
                { id: "matrix", label: "Matriks Paritas Tarif", shortLabel: "Matriks", icon: Table },
                { id: "catalog", label: "Katalog Saluran OTA", shortLabel: "Katalog", icon: Globe, badge: "68+" },
                { id: "travel_agents", label: "Travel Agent & B2B", shortLabel: "B2B", icon: UsersThree },
                { id: "iframe", label: "Ekstranet Visual Channex", shortLabel: "Channex", icon: Browsers }
            ]
        },
        {
            title: "Yield & Revenue",
            icon: TrendUp,
            items: [
                { id: "rules", label: "Aturan Yield & Restriksi", shortLabel: "Restriksi", icon: ShieldCheck },
                { id: "dynamic_pricing", label: "Dynamic Pricing RMS", shortLabel: "RMS", icon: TrendUp, badge: "RMS" },
                { id: "promotions", label: "Promo & Diskon OTA", shortLabel: "Promo", icon: Tag },
                { id: "google", label: "Google Hotel Free Links", shortLabel: "Google", icon: MagnifyingGlass, badge: "0%" },
                { id: "content", label: "Konten & Foto Kamar", shortLabel: "Konten", icon: Image }
            ]
        },
        {
            title: "Komunikasi & Tamu",
            icon: ChatCircleDots,
            items: [
                { id: "messages", label: "Pusat Pesan Tamu", shortLabel: "Pesan", icon: ChatCircleDots },
                { id: "reviews", label: "Ulasan & Reputasi Tamu", shortLabel: "Review", icon: Star }
            ]
        },
        {
            title: "Finansial & Booking",
            icon: CreditCard,
            items: [
                { id: "payments", label: "PCI Card Vault & VCC", shortLabel: "PCI Vault", icon: CreditCard, badge: "PCI-DSS" },
                { id: "payment_gateway", label: "Direct Booking Engine", shortLabel: "Gateway", icon: Receipt }
            ]
        },
        {
            title: "Master Data Properti",
            icon: Buildings,
            items: [
                { id: "rooms", label: "Master Tipe Kamar", shortLabel: "Kamar", icon: Bed },
                { id: "rateplans", label: "Master Rate Plan", shortLabel: "Rate Plan", icon: SlidersHorizontal },
                { id: "groups", label: "Grup Hotel & Multi-Properti", shortLabel: "Grup", icon: Buildings },
                { id: "tutorial", label: "Roadmap Go-Live Produksi", shortLabel: "Roadmap", icon: Compass, badge: "5 Tahap" }
            ]
        },
        {
            title: "Log & Audit Sistem",
            icon: TerminalWindow,
            items: [
                { id: "logs", label: "Audit Log", shortLabel: "Audit Log", icon: TerminalWindow },
                { id: "webhooks", label: "Webhook Traces", shortLabel: "Webhook", icon: Broadcast },
                { id: "sync", label: "Live ARI Sync Feed", shortLabel: "Sync Feed", icon: ArrowsClockwise }
            ]
        },
        {
            title: "Sertifikasi & Gateway",
            icon: CheckSquare,
            items: [
                { id: "sandbox", label: "Skenario Sertifikasi", shortLabel: "Sertifikasi", icon: CheckSquare, badge: "8 Tes" },
                { id: "golive", label: "Kredensial & Webhook", shortLabel: "Kredensial", icon: Key }
            ]
        }
    ];

    // Ensure the group containing the active tab is expanded in expanded mode
    useEffect(() => {
        if (!currentTab) return;
        const group = MENU_GROUPS.find(g => g.items.some(i => i.id === currentTab));
        if (group && !expandedGroups[group.title]) {
            setExpandedGroups(prev => ({ ...prev, [group.title]: true }));
        }
    }, [currentTab]);

    const handleSelectTab = (tabId: string) => {
        setCurrentTab(tabId);
        setHoveredGroup(null);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", tabId);
            window.history.replaceState(null, "", url.toString());
            window.dispatchEvent(new CustomEvent("channel-tab-change", { detail: tabId }));
        }
    };

    const handleBackToPms = () => {
        router.push("/select-module");
    };

    // Handle mouse enter for hover flyout submenu
    // Appears when:
    // 1) Sidebar is in collapsed dock mode, OR
    // 2) An accordion menu group in expanded sidebar is currently closed (posisi side bar menu tertutup)
    const handleGroupMouseEnter = (group: CmMenuGroup, e: React.MouseEvent<HTMLElement>, isFromExpandedHeader: boolean = false) => {
        // If sidebar is expanded and this menu group is already OPEN, do not show the right flyout
        if (!isCollapsed && isFromExpandedHeader && expandedGroups[group.title]) {
            setHoveredGroup(null);
            return;
        }

        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        // Position flyout aligned to button, clamped within viewport
        const maxTop = typeof window !== "undefined" ? Math.max(68, window.innerHeight - 380) : 400;
        const targetTop = Math.min(Math.max(68, rect.top), maxTop);
        setFlyoutTop(targetTop);
        setHoveredGroup(group);
    };

    const handleGroupMouseLeave = () => {
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
        }
        leaveTimeoutRef.current = setTimeout(() => {
            setHoveredGroup(null);
        }, 280);
    };

    const handleFlyoutMouseEnter = () => {
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
        }
    };

    const handleFlyoutMouseLeave = () => {
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
        }
        leaveTimeoutRef.current = setTimeout(() => {
            setHoveredGroup(null);
        }, 200);
    };

    const sidebarVariants: any = {
        expanded: {
            width: "var(--sidebar-width)",
            transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        },
        collapsed: {
            width: "var(--sidebar-collapsed-width, 64px)",
            transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        },
    };

    return (
        <>
            <motion.aside
                className={styles.sidebarContainer}
                initial="expanded"
                animate={isCollapsed ? "collapsed" : "expanded"}
                variants={sidebarVariants}
            >
                {/* Sidebar Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={styles.sidebarToggle}
                    style={{
                        left: isCollapsed
                            ? "calc(var(--sidebar-collapsed-width, 64px) - 11px)"
                            : "calc(var(--sidebar-width) - 11px)"
                    }}
                    aria-label="Toggle sidebar width"
                >
                    {isCollapsed ? (
                        <CaretRight size={11} weight="bold" />
                    ) : (
                        <CaretLeft size={11} weight="bold" />
                    )}
                </button>

                {/* Sidebar Header */}
                <div className={styles.sidebarHeader}>
                    {!isCollapsed ? (
                        <div className={styles.headerExpanded}>
                            <div className={styles.headerTitleRow}>
                                <Globe size={13} weight="bold" color="#71717a" />
                                <span>Channel Manager</span>
                            </div>
                            <span className={styles.hotelName}>
                                {activeHotelName || `Properti: ${activeHotelCode || "0"}`}
                            </span>
                        </div>
                    ) : (
                        <div className={styles.headerCollapsed}>
                            <Globe size={18} weight="bold" />
                        </div>
                    )}
                </div>

                {/* Navigation Scroll Container */}
                <nav className={styles.navGroup}>
                    {/* Pilih Modul Switcher */}
                    {!isCollapsed ? (
                        <button
                            className={styles.selectModuleBtn}
                            onClick={handleBackToPms}
                        >
                            <SquaresFour size={16} weight="bold" />
                            <span>Pilih Modul</span>
                        </button>
                    ) : (
                        <button
                            className={styles.selectModuleCollapsedBtn}
                            onClick={handleBackToPms}
                        >
                            <SquaresFour size={16} weight="bold" />
                        </button>
                    )}

                    {/* Navigation Items / Groups */}
                    {!isCollapsed ? (
                        /* Expanded View: Groups with accordion */
                        MENU_GROUPS.map(group => {
                            const isGroupActive = group.items.some(i => i.id === currentTab);
                            const GroupIcon = group.icon;
                            return (
                                <div
                                    key={group.title}
                                    className={styles.groupWrapper}
                                >
                                    <button
                                        onClick={() => toggleGroup(group.title)}
                                        onMouseEnter={e => handleGroupMouseEnter(group, e, true)}
                                        onMouseLeave={handleGroupMouseLeave}
                                        className={styles.groupHeaderBtn}
                                        aria-label={group.title}
                                    >
                                        <div className={styles.groupHeaderLeft}>
                                            <GroupIcon size={16} weight={isGroupActive ? "bold" : "regular"} />
                                            <span>{group.title}</span>
                                            {isGroupActive && <span className={styles.groupHeaderActiveDot} />}
                                        </div>
                                        <CaretDown
                                            size={13}
                                            weight="bold"
                                            color="#71717a"
                                            style={{
                                                transform: expandedGroups[group.title] ? "rotate(0deg)" : "rotate(-90deg)",
                                                transition: "transform 0.18s ease"
                                            }}
                                        />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {expandedGroups[group.title] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.16 }}
                                                className={styles.groupItemsList}
                                            >
                                                {group.items.map(item => {
                                                    const isActive = currentTab === item.id;
                                                    const ItemIcon = item.icon;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                                                            onClick={() => handleSelectTab(item.id)}
                                                            aria-label={item.label}
                                                        >
                                                            <ItemIcon size={15} weight={isActive ? "bold" : "regular"} />
                                                            <span className={styles.itemLabel}>{item.label}</span>
                                                            {item.badge && (
                                                                <span className={`${styles.itemBadge} ${isActive ? styles.badgeDark : styles.badgeLight}`}>
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    ) : (
                        /* Collapsed / Dock Mode: 6 Category Icons with Hover Flyout on the right */
                        <div className={styles.dockColumn}>
                            {MENU_GROUPS.map(group => {
                                const isGroupActive = group.items.some(i => i.id === currentTab);
                                const GroupIcon = group.icon;
                                const isHovered = hoveredGroup?.title === group.title;
                                return (
                                    <button
                                        key={group.title}
                                        className={`${styles.dockGroupBtn} ${isGroupActive ? styles.dockGroupBtnActive : ""}`}
                                        onMouseEnter={e => handleGroupMouseEnter(group, e)}
                                        onMouseLeave={handleGroupMouseLeave}
                                        onClick={() => {
                                            // Jump to first item in group if clicked directly
                                            if (group.items[0]) handleSelectTab(group.items[0].id);
                                        }}
                                        aria-label={group.title}
                                    >
                                        <GroupIcon size={18} weight={isGroupActive || isHovered ? "bold" : "regular"} />
                                        {isGroupActive && <span className={styles.dockActiveDot} />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </nav>

                {/* Sidebar Footer */}
                <div className={styles.sidebarFooter}>
                    {!isCollapsed ? (
                        <>
                            <div className={styles.syncIndicator}>
                                <span className={styles.syncPulse} />
                                <span>2-Way Live Sync</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsNotifDrawerOpen(true)}
                                aria-label="Pengaturan Notifikasi Push Channel"
                                className={styles.notifBtn}
                            >
                                <Bell size={15} weight="bold" />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsNotifDrawerOpen(true)}
                            aria-label="Pengaturan Notifikasi Push Channel"
                            className={styles.notifBtn}
                            style={{ margin: "0 auto" }}
                        >
                            <Bell size={17} weight="bold" />
                        </button>
                    )}
                </div>
            </motion.aside>

            {/* Hover Flyout Submenu on the Right (Active in collapsed dock mode OR when a menu group is closed) */}
            <AnimatePresence>
                {hoveredGroup && (isCollapsed || !expandedGroups[hoveredGroup.title]) && (
                    <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.12 }}
                        className={styles.flyoutCard}
                        style={{
                            left: isCollapsed ? "70px" : "230px",
                            top: `${flyoutTop}px`
                        }}
                        onMouseEnter={handleFlyoutMouseEnter}
                        onMouseLeave={handleFlyoutMouseLeave}
                    >
                        <div className={styles.flyoutHeader}>
                            <span className={styles.flyoutTitle}>
                                <hoveredGroup.icon size={15} weight="bold" />
                                <span>{hoveredGroup.title}</span>
                            </span>
                            <span className={styles.flyoutCount}>
                                {hoveredGroup.items.length} Modul
                            </span>
                        </div>

                        {hoveredGroup.items.map(item => {
                            const isActive = currentTab === item.id;
                            const ItemIcon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    className={`${styles.flyoutItem} ${isActive ? styles.flyoutItemActive : ""}`}
                                    onClick={() => handleSelectTab(item.id)}
                                >
                                    <div className={styles.flyoutItemLeft}>
                                        <ItemIcon size={14} weight={isActive ? "bold" : "regular"} />
                                        <span>{item.label}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {item.badge && (
                                            <span className={`${styles.itemBadge} ${isActive ? styles.badgeDark : styles.badgeLight}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                        {isActive && <Check size={12} weight="bold" />}
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Drawer */}
            <NotificationSettingsDrawer
                isOpen={isNotifDrawerOpen}
                onClose={() => setIsNotifDrawerOpen(false)}
                hotelCode={activeHotelCode || "1"}
                userId={user?.uid || user?.email || "guest"}
                userEmail={user?.email || undefined}
            />
        </>
    );
};
