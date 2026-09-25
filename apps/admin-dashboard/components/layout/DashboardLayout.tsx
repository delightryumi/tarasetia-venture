"use client";

import React, { useState, useLayoutEffect, useRef, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { ChannelManagerSidebar } from "./ChannelManagerSidebar";
import { StatusWidget } from "./StatusWidget";
import { MobileBottomNav } from "./MobileBottomNav";
import { BillingAlertModal } from "./BillingAlertModal";
import { BillingSuspendedModal } from "./BillingSuspendedModal";
import { GlobalOrderNotifier } from "./GlobalOrderNotifier";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Bell, ShieldAlert } from "lucide-react";
import { useFooter } from "../sections/footer/useFooter";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isPathAllowedForUser } from "@/lib/permissionCheck";
import gsap from "gsap";
import "./layout.css";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading, activeHotelCode, signOutUser, activeHotelName } = useAuth();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    React.useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth <= 1024) {
            setIsCollapsed(true);
        }
    }, []);

    // Global listener for components requesting sidebar toggle
    React.useEffect(() => {
        const handleToggle = () => setIsCollapsed(prev => !prev);
        window.addEventListener("toggle-sidebar", handleToggle);
        return () => window.removeEventListener("toggle-sidebar", handleToggle);
    }, []);

    const { poweredByText, poweredByLink } = useFooter();
    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Auto-collapse sidebar on Rate & Inventory for full-screen view
    React.useEffect(() => {
        if (pathname && pathname.startsWith("/rate-inventory")) {
            setIsCollapsed(true);
        }
    }, [pathname]);

    const [activeModules, setActiveModules] = useState<string[] | null>(null);
    const [isHotelActive, setIsHotelActive] = useState<boolean | null>(null);
    const [nextDueDate, setNextDueDate] = useState<string>("");
    const [orderBadge, setOrderBadge] = useState(0);
    const handleBadgeChange = useCallback((count: number) => setOrderBadge(count), []);

    React.useEffect(() => {
        // Superadmin tanpa preview hotel — skip Firestore query
        if (!activeHotelCode || activeHotelCode === "0") {
            setActiveModules(null);
            setIsHotelActive(true);
            return;
        }
        const docRef = doc(db, 'hotels', activeHotelCode);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Superadmin tidak perlu dicek status aktif hotel yang sedang di-preview
                if (user?.role === "superadmin") {
                    setIsHotelActive(true);
                } else {
                    setIsHotelActive(data.active !== false);
                }
                setNextDueDate(data.billing?.nextDueDate || "");
                let modules = data.billing?.activeModules || [];
                // Map old cpanel key to cpanel-full or cpanel-only
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
                        modules = ['pos', 'front-office', 'housekeeping', 'food-beverage', 'purchasing', 'accounting', 'innalytics', 'cpanel-full'];
                    }
                }
                setActiveModules(modules);
            }
        }, (err) => {
            console.error('Error fetching hotel modules in DashboardLayout:', err);
        });
        return () => unsubscribe();
    }, [activeHotelCode, user]);

    const [moduleParam, setModuleParam] = useState<string | null>(null);

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            setModuleParam(searchParams.get("module"));
        }
    }, [pathname]);

    const isPathAllowed = isPathAllowedForUser(pathname, moduleParam, user, activeModules);

    React.useEffect(() => {
        if (!loading && user && !isPathAllowed) {
            router.push('/select-module');
        }
    }, [pathname, isPathAllowed, user, loading, router]);




    React.useEffect(() => {
        if (!loading && !user) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
    }, [user, loading, router, pathname]);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const targets = containerRef.current.querySelectorAll(".card, .glass-card, .section-container > header, .form-group");
        if (targets.length === 0) return;

        // Reset and animate
        gsap.fromTo(
            targets,
            {
                opacity: 0,
                y: 30,
                scale: 0.98
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out",
                clearProps: "all"
            }
        );
    }, [pathname]);



    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-broken-white">
                <div className="text-sage font-semibold animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (isHotelActive === false) {
        const formattedDueDate = nextDueDate
            ? new Date(nextDueDate).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
              })
            : '-';
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#08080a] font-sans">
                <BillingSuspendedModal
                    hotelName={activeHotelName || "Hotel"}
                    formattedDueDate={formattedDueDate}
                    signOutUser={signOutUser}
                />
            </div>
        );
    }

    const isSuperadminPage = pathname === "/superadmin";
    const isChannelManagerPage = pathname === "/channel-manager";
    const isInnalyticsPage = pathname.startsWith("/innalytics");
    const isFnbRealtimePage = pathname.startsWith("/food-beverage/realtime");
    const isRateInventoryPage = pathname?.startsWith("/rate-inventory");
    const hideSidebar = isSuperadminPage || pathname === "/inventory-control" || isInnalyticsPage || isFnbRealtimePage;

    return (
        <div className={`flex flex-col min-h-screen select-none ${isSuperadminPage ? 'bg-white dark:bg-[#09090b]' : isFnbRealtimePage ? 'bg-[#fbfaf8] text-stone-900' : 'bg-transparent'}`}>
            {/* Global POS order notifier — active on every page */}
            {activeHotelCode && activeHotelCode !== '0' && (
                <GlobalOrderNotifier
                    hotelCode={activeHotelCode}
                    onBadgeChange={handleBadgeChange}
                />
            )}
            <div className={`dashboard-wrapper ${isCollapsed ? "collapsed" : ""} ${!isCollapsed ? "mobile-open" : ""} ${hideSidebar ? "no-sidebar" : ""} ${isRateInventoryPage ? "rate-inventory-fullview" : ""}`}>
                {!isSuperadminPage && !isInnalyticsPage && !isFnbRealtimePage && (
                    <header className="dashboard-top-bar">
                        <div className="dashboard-top-bar-inner">
                            <StatusWidget 
                                onMenuClick={() => setIsCollapsed(false)} 
                                isCollapsed={isCollapsed}
                                onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
                            />
                            {/* Order notification badge */}
                            {orderBadge > 0 && (
                                <button
                                    onClick={() => setOrderBadge(0)}
                                    title={`${orderBadge} pesanan POS baru — klik untuk hapus notifikasi`}
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background: 'rgba(239,68,68,0.12)',
                                        border: '1.5px solid rgba(239,68,68,0.35)',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                    }}
                                >
                                    <Bell size={16} color="#ef4444" />
                                    <span style={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -6,
                                        minWidth: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        background: '#ef4444',
                                        color: '#fff',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 4px',
                                        lineHeight: 1,
                                        boxShadow: '0 0 0 2px white',
                                    }}>{orderBadge > 99 ? '99+' : orderBadge}</span>
                                </button>
                            )}
                        </div>
                    </header>
                )}
                {!hideSidebar && (
                    isChannelManagerPage ? (
                        <ChannelManagerSidebar
                            isCollapsed={isCollapsed}
                            setIsCollapsed={setIsCollapsed}
                        />
                    ) : (
                        <React.Suspense fallback={<aside className="sidebar" />}>
                            <Sidebar
                                isCollapsed={isCollapsed}
                                setIsCollapsed={setIsCollapsed}
                            />
                        </React.Suspense>
                    )
                )}
                {/* Mobile Overlay */}
                {!isCollapsed && !hideSidebar && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsCollapsed(true)}
                    />
                )}
                <main 
                    className="main-content"
                    style={hideSidebar ? { marginLeft: 0, maxWidth: "100vw", width: "100%", paddingTop: 0 } : undefined}
                >
                    <div className={`main-scroll-container ${isChannelManagerPage || pathname.startsWith("/rate-inventory") || isInnalyticsPage || isFnbRealtimePage || pathname.startsWith("/users") || pathname.startsWith("/hrd") ? "main-scroll-container-wide" : ""}`} style={isFnbRealtimePage ? { padding: 0, maxWidth: "100%", margin: 0 } : undefined}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname}
                                ref={containerRef}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="section-wrapper"
                                style={isFnbRealtimePage ? { padding: 0, maxWidth: "100%", margin: 0 } : undefined}
                            >
                                {isPathAllowed ? (
                                    children
                                ) : (
                                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                                            <ShieldAlert size={32} />
                                        </div>
                                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Akses Halaman Dibatasi</h2>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-6 leading-relaxed">
                                            Akun Anda tidak memiliki hak akses untuk membuka halaman ini. Hubungi General Manager atau Administrator hotel untuk pembaharuan izin akun Anda.
                                        </p>
                                        <button
                                            onClick={() => router.push('/select-module')}
                                            className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 transition-all shadow-sm"
                                        >
                                            Kembali ke Menu Utama
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {!isSuperadminPage && !isInnalyticsPage && !isFnbRealtimePage && (
                            <footer className="dashboard-footer-clean">
                                <a
                                    href={
                                        poweredByLink && !poweredByLink.includes("setaraventure.com")
                                            ? (poweredByLink.startsWith('http') ? poweredByLink : `https://${poweredByLink}`)
                                            : "https://mytara.id"
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="powered-by-link"
                                >
                                    <span className="text-light">Powered by</span>
                                    <span className="text-brand">
                                        {poweredByText && !poweredByText.toLowerCase().includes("setara venture") ? poweredByText : "Tara"}
                                    </span>
                                    <ExternalLink size={12} className="link-icon" />
                                </a>
                            </footer>
                        )}
                    </div>
                </main>
                {!isSuperadminPage && !isInnalyticsPage && !isFnbRealtimePage && (
                    <React.Suspense fallback={null}>
                        <MobileBottomNav />
                    </React.Suspense>
                )}
                <BillingAlertModal />
            </div>
        </div>
    );
};
