"use client";

import React, { useEffect, useState } from "react";
import { NotificationSettingsDrawer } from "./NotificationSettingsDrawer";
import { motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
    Globe,
    BedDouble,
    Sliders,
    Table,
    TrendingUp,
    Key,
    Shield,
    Search,
    Tag,
    UploadCloud,
    MessageSquare,
    Star,
    CreditCard,
    Terminal,
    Zap,
    LayoutGrid,
    Lock,
    RefreshCw,
    ArrowLeft,
    CheckCircle2,
    Bell,
    Users
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import "./layout.css";

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
    badgeColor?: string;
}

interface CmMenuGroup {
    title: string;
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

    // Sync active tab with URL query parameter ?tab=
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get("tab");
            if (tabParam) {
                setCurrentTab(tabParam);
            }

            const handleCustomTab = (e: any) => {
                if (e.detail) setCurrentTab(e.detail);
            };
            window.addEventListener("channel-tab-change", handleCustomTab);
            return () => window.removeEventListener("channel-tab-change", handleCustomTab);
        }
    }, []);

    const handleSelectTab = (tabId: string) => {
        setCurrentTab(tabId);
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

    const sidebarVariants: any = {
        expanded: {
            width: "var(--sidebar-width)",
            transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        },
        collapsed: {
            width: "100px",
            transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        },
    };

    const MENU_GROUPS: CmMenuGroup[] = [
        {
            title: "OTA Distribution & Connectivity",
            items: [
                { id: "mapping", label: "Channel Mapping", shortLabel: "Mapping", icon: Key, badge: "Rules", badgeColor: "#16a34a" },
                { id: "catalog", label: "Channel Catalog (68+ OTAs)", shortLabel: "Catalog", icon: Globe },
                { id: "travel_agents", label: "Travel Agent & Saluran", shortLabel: "Agents", icon: Users, badge: "Mitra", badgeColor: "#7e22ce" },
                { id: "rules", label: "Yield & Inventory Rules", shortLabel: "Yield", icon: Shield },
                { id: "google", label: "Google Hotel Links", shortLabel: "Google", icon: Search },
                { id: "promotions", label: "Promotions & Deals", shortLabel: "Promos", icon: Tag },
                { id: "content", label: "Content & Amenities", shortLabel: "Content", icon: UploadCloud }
            ]
        },
        {
            title: "Inventory & Base Pricing",
            items: [
                { id: "rooms", label: "Room Types & Allotment", shortLabel: "Rooms", icon: BedDouble },
                { id: "rateplans", label: "Rate Plans & Packages", shortLabel: "Rates", icon: Sliders },
                { id: "matrix", label: "Rate Matrix (Net / Gross)", shortLabel: "Matrix", icon: Table },
                { id: "dynamic_pricing", label: "Dynamic Pricing (RMS)", shortLabel: "RMS AI", icon: TrendingUp }
            ]
        },
        {
            title: "Guest Services & Messaging",
            items: [
                { id: "messages", label: "Unified Guest Inbox", shortLabel: "Inbox", icon: MessageSquare },
                { id: "reviews", label: "Guest Reviews & Ratings", shortLabel: "Reviews", icon: Star }
            ]
        },
        {
            title: "System, Security & Diagnostics",
            items: [
                { id: "payments", label: "PCI Card Vault & Stripe", shortLabel: "PCI Vault", icon: CreditCard },
                { id: "logs", label: "ARI Transmission Logs", shortLabel: "Audit Logs", icon: Terminal },
                { id: "sandbox", label: "🧪 Certification Sandbox", shortLabel: "Sandbox", icon: Zap },
                { id: "iframe", label: "White-Label Hub (SSO)", shortLabel: "Hub SSO", icon: LayoutGrid },
                { id: "golive", label: "API Credentials & Go-Live", shortLabel: "API Keys", icon: Lock },
                { id: "sync", label: "Synchronization Feed", shortLabel: "Sync Feed", icon: RefreshCw }
            ]
        }
    ];

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
                title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
            >
                {isCollapsed ? (
                    <CaretRight size={12} weight="bold" />
                ) : (
                    <CaretLeft size={12} weight="bold" />
                )}
            </motion.button>

            {/* Sidebar Header: Suite Brand & Switch Back Button */}
            <div style={{ padding: isCollapsed ? "10px 0" : "4px 8px 12px 8px", borderBottom: "1px solid var(--sidebar-border, #e2e8f0)" }}>
                {/* Back to PMS Module button */}
                <button
                    type="button"
                    onClick={handleBackToPms}
                    title="Return to PMS Module Selection"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: isCollapsed ? "8px 0" : "8px 10px",
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        borderRadius: "6px",
                        background: "rgba(30, 58, 47, 0.08)",
                        border: "1px solid rgba(30, 58, 47, 0.2)",
                        color: "#1e3a2f",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        marginBottom: "10px",
                        transition: "all 0.15s ease"
                    }}
                >
                    <ArrowLeft size={14} />
                    {!isCollapsed && <span>Back to PMS Hub</span>}
                </button>

                {/* Brand Identity */}
                {!isCollapsed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 2px" }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "#1e3a2f",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 4px rgba(30, 58, 47, 0.2)",
                            flexShrink: 0
                        }}>
                            <Globe size={18} />
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" }}>
                                Channex Channel Suite
                            </div>
                            <div style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                                {activeHotelName || "My Tara Hotel"} ({activeHotelCode})
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                        <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: "#1e3a2f",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 4px rgba(30, 58, 47, 0.2)"
                        }}>
                            <Globe size={20} />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Groups Container */}
            <div className="nav-group" style={{ marginTop: "8px" }}>
                {MENU_GROUPS.map((group, gIdx) => (
                    <div key={gIdx} style={{ marginBottom: "16px" }}>
                        {!isCollapsed && (
                            <div style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "#94a3b8",
                                padding: "4px 12px 6px 12px"
                            }}>
                                {group.title}
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {group.items.map(item => {
                                const isActive = currentTab === item.id;
                                const IconComponent = item.icon;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectTab(item.id)}
                                        className="nav-item"
                                        style={{
                                            backgroundColor: isActive ? "#1e3a2f" : "transparent",
                                            color: isActive ? "#ffffff" : "#334155",
                                            fontWeight: isActive ? 700 : 500,
                                            border: "none",
                                            boxShadow: isActive ? "0 2px 5px rgba(30, 58, 47, 0.25)" : "none",
                                            position: "relative"
                                        }}
                                        title={item.label}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "20px" }}>
                                            <IconComponent size={16} color={isActive ? "#ffffff" : "#64748b"} />
                                        </div>

                                        {!isCollapsed && (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0, gap: "6px" }}>
                                                <span className="nav-label" style={{ fontSize: "12px", color: isActive ? "#ffffff" : "#1e293b" }}>
                                                    {item.label}
                                                </span>
                                                {item.badge && (
                                                    <span style={{
                                                        fontSize: "9px",
                                                        fontWeight: 700,
                                                        padding: "1px 6px",
                                                        borderRadius: "9999px",
                                                        background: isActive ? "rgba(255, 255, 255, 0.25)" : "#dcfce7",
                                                        color: isActive ? "#ffffff" : item.badgeColor || "#166534",
                                                        flexShrink: 0
                                                    }}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer: Sync Status + Notification Settings Bell */}
            <div style={{
                padding: isCollapsed ? "10px 0" : "10px 12px",
                borderTop: "1px solid var(--sidebar-border, #e2e8f0)",
                fontSize: "10px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "space-between",
                flexDirection: isCollapsed ? "column" : "row",
                gap: "8px"
            }}>
                {!isCollapsed && (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <CheckCircle2 size={12} color="#16a34a" />
                        <span>Channex 2-Way Sync</span>
                    </span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {!isCollapsed && (
                        <span style={{ fontWeight: 700, color: "#1e3a2f" }}>CRS v2.6</span>
                    )}
                    {/* PWA Notification Settings Bell Button */}
                    <button
                        type="button"
                        onClick={() => setIsNotifDrawerOpen(true)}
                        title="Pengaturan Notifikasi Push HP / Browser"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "28px",
                            height: "28px",
                            borderRadius: "7px",
                            background: "#ecfdf5",
                            border: "1px solid #a7f3d0",
                            color: "#059669",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            flexShrink: 0
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#d1fae5"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#ecfdf5"; }}
                    >
                        <Bell size={14} />
                    </button>
                </div>
            </div>

            {/* Notification Settings Slide-Over Drawer */}
            <NotificationSettingsDrawer
                isOpen={isNotifDrawerOpen}
                onClose={() => setIsNotifDrawerOpen(false)}
                hotelCode={activeHotelCode || "1"}
                userId={user?.uid || user?.email || "guest"}
                userEmail={user?.email || undefined}
            />
        </motion.aside>
    );
};
