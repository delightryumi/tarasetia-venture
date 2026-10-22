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
    Users,
    Compass,
    Building2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isUserSuperadmin } from "@/lib/permissionCheck";
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
    const navGroupRef = React.useRef<HTMLDivElement>(null);

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

    // Auto-scroll sidebar so active menu item is smoothly positioned near the top of the sidebar viewport
    useEffect(() => {
        if (!currentTab) return;
        const timer = setTimeout(() => {
            const navContainer = navGroupRef.current;
            const targetEl = document.getElementById(`cm-sidebar-item-${currentTab}`);
            if (navContainer && targetEl) {
                const containerRect = navContainer.getBoundingClientRect();
                const targetRect = targetEl.getBoundingClientRect();
                const relativeOffset = targetRect.top - containerRect.top;

                navContainer.scrollTo({
                    top: navContainer.scrollTop + relativeOffset - 12,
                    behavior: "smooth"
                });
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [currentTab]);

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
            title: "Line 1: Setup & Koneksi",
            items: [
                { id: "groups", label: "Jaringan Hotel & Grup", shortLabel: "Grup", icon: Building2, badge: "Multi-Hotel", badgeColor: "#2563eb" },
                { id: "golive", label: "Kredensial API & Go-Live", shortLabel: "Go-Live", icon: Lock, badge: "Step 1", badgeColor: "#2563eb" },
                { id: "iframe", label: "Konsol Ekstranet (SSO)", shortLabel: "SSO", icon: LayoutGrid }
            ]
        },
        {
            title: "Line 2: Master Kamar & Harga",
            items: [
                { id: "rooms", label: "Tipe Kamar & Alotmen", shortLabel: "Kamar", icon: BedDouble },
                { id: "rateplans", label: "Master Rate Plans", shortLabel: "Rates", icon: Sliders },
                { id: "matrix", label: "Kalkulator Rate Matrix", shortLabel: "Matrix", icon: Table, badge: "Nett/Gross", badgeColor: "#2563eb" }
            ]
        },
        {
            title: "Line 3: Distribusi OTA & RMS",
            items: [
                { id: "mapping", label: "Pemetaan Saluran & OTA", shortLabel: "Mapping", icon: Key, badge: "68+ OTA", badgeColor: "#2563eb" },
                { id: "dynamic_pricing", label: "Yield & Dynamic RMS", shortLabel: "RMS", icon: TrendingUp },
                { id: "promotions", label: "Promosi & Diskon OTA", shortLabel: "Promo", icon: Tag },
                { id: "google", label: "Google Hotel Free Links", shortLabel: "Google", icon: Search, badge: "0%", badgeColor: "#16a34a" },
                { id: "travel_agents", label: "Travel Agent & B2B", shortLabel: "B2B", icon: Users },
                { id: "content", label: "Konten & Foto Kamar", shortLabel: "Konten", icon: UploadCloud }
            ]
        },
        {
            title: "Line 4: Direct Guest & Booking",
            items: [
                { id: "booking_engine", label: "Direct Booking Engine", shortLabel: "Direct", icon: Globe, badge: "Web Suite", badgeColor: "#2563eb" },
                { id: "messages", label: "Kotak Masuk Pesan Tamu", shortLabel: "Pesan", icon: MessageSquare },
                { id: "reviews", label: "Ulasan & Reputasi Tamu", shortLabel: "Ulasan", icon: Star }
            ]
        },
        {
            title: "Line 5: Keamanan & Monitoring",
            items: [
                { id: "logs", label: "Log Transmisi & Webhook", shortLabel: "Logs", icon: Terminal },
                { id: "sync", label: "Live ARI Sync Feed", shortLabel: "Sync Feed", icon: RefreshCw },
                { id: "payments", label: "PCI Card Vault & VCC", shortLabel: "PCI Vault", icon: CreditCard }
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
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? (
                    <CaretRight size={12} weight="bold" />
                ) : (
                    <CaretLeft size={12} weight="bold" />
                )}
            </motion.button>

            {/* Sidebar Header: Suite Brand & Switch Back Button */}
            <div style={{ padding: isCollapsed ? "10px 0" : "4px 8px 12px 8px", borderBottom: "1px solid var(--sidebar-border, #e4e4e7)" }}>
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
                        padding: isCollapsed ? "8px 0" : "7px 10px",
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        borderRadius: "6px",
                        background: "#fafafa",
                        border: "1px solid #e4e4e7",
                        color: "#27272a",
                        fontSize: "11px",
                        fontWeight: 600,
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
                            borderRadius: "6px",
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #bfdbfe",
                            boxShadow: "0 1px 2px rgba(37, 99, 235, 0.08)",
                            flexShrink: 0
                        }}>
                            <Globe size={16} />
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                                Global Channel Manager
                            </div>
                            <div style={{ fontSize: "10.5px", color: "#64748b", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                                {activeHotelName || "My Tara Hotel"} ({activeHotelCode})
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                        <div style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "6px",
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #bfdbfe",
                            boxShadow: "0 1px 2px rgba(37, 99, 235, 0.08)"
                        }}>
                            <Globe size={18} />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Groups Container */}
            <div ref={navGroupRef} className="nav-group" style={{ marginTop: "8px" }}>
                {MENU_GROUPS.map((group, gIdx) => (
                    <div key={gIdx} style={{ marginBottom: "14px" }}>
                        {!isCollapsed && (
                            <div style={{
                                fontSize: "9.5px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "#94a3b8",
                                padding: "4px 10px 6px 10px"
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
                                        id={`cm-sidebar-item-${item.id}`}
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectTab(item.id)}
                                        className="nav-item"
                                        style={{
                                            backgroundColor: isActive ? "#eff6ff" : "transparent",
                                            color: isActive ? "#1e40af" : "#475569",
                                            fontWeight: isActive ? 600 : 500,
                                            border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
                                            borderLeft: isActive ? "3px solid #2563eb" : "1px solid transparent",
                                            borderRadius: "6px",
                                            boxShadow: isActive ? "0 1px 2px rgba(37, 99, 235, 0.06)" : "none",
                                            position: "relative"
                                        }}
                                        title={item.label}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "20px" }}>
                                            <IconComponent size={15} color={isActive ? "#2563eb" : "#64748b"} />
                                        </div>

                                        {!isCollapsed && (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0, gap: "6px" }}>
                                                <span className="nav-label" style={{ fontSize: "12px", color: isActive ? "#1e40af" : "#334155" }}>
                                                    {item.label}
                                                </span>
                                                {item.badge && (
                                                    <span style={{
                                                        fontSize: "9px",
                                                        fontWeight: 700,
                                                        padding: "1px 6px",
                                                        borderRadius: "6px",
                                                        background: isActive ? "#dbeafe" : "#f1f5f9",
                                                        color: isActive ? "#1e40af" : (item.badgeColor || "#64748b"),
                                                        border: isActive ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
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
                borderTop: "1px solid var(--sidebar-border, #e4e4e7)",
                fontSize: "10px",
                color: "#71717a",
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "space-between",
                flexDirection: isCollapsed ? "column" : "row",
                gap: "8px"
            }}>
                {!isCollapsed && (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <CheckCircle2 size={12} style={{ color: "#2563eb" }} />
                        <span>Direct 2-Way OTA Sync</span>
                    </span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {!isCollapsed && (
                        <span style={{ fontWeight: 700, color: "#27272a" }}>CRS v2.6</span>
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
                            borderRadius: "6px",
                            background: "#ffffff",
                            border: "1px solid #e4e4e7",
                            color: "#52525b",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            flexShrink: 0
                        }}
                    >
                        <Bell size={13} />
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
