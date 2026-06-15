"use client";

import React, { useState, useLayoutEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { StatusWidget } from "./StatusWidget";
import { MobileBottomNav } from "./MobileBottomNav";
import { BillingAlertModal } from "./BillingAlertModal";
import { BillingSuspendedModal } from "./BillingSuspendedModal";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useFooter } from "../sections/footer/useFooter";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import gsap from "gsap";
import "./layout.css";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading, activeHotelCode, signOutUser, activeHotelName } = useAuth();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { poweredByText, poweredByLink } = useFooter();
    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const [activeModules, setActiveModules] = useState<string[] | null>(null);
    const [isHotelActive, setIsHotelActive] = useState<boolean | null>(null);
    const [nextDueDate, setNextDueDate] = useState<string>("");

    React.useEffect(() => {
        if (!activeHotelCode || (user && (user.role === "superadmin" || user.email.toLowerCase() === "nexura.management@gmail.com"))) {
            setActiveModules(null); // Superadmin always has full access
            setIsHotelActive(true);
            return;
        }
        const docRef = doc(db, 'hotels', activeHotelCode);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setIsHotelActive(data.active !== false);
                setNextDueDate(data.billing?.nextDueDate || "");
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
                        modules = ['pos', 'front-office', 'housekeeping', 'food-beverage', 'purchasing', 'accounting', 'cpanel-full'];
                    }
                }
                setActiveModules(modules);
            }
        }, (err) => {
            console.error('Error fetching hotel modules in DashboardLayout:', err);
        });
        return () => unsubscribe();
    }, [activeHotelCode, user]);

    React.useEffect(() => {
        if (activeModules !== null) {
            const searchParams = new URLSearchParams(window.location.search);
            const moduleParam = searchParams.get("module");

            const isPathForbidden = (path: string, mod: string | null) => {
                if (path === '/select-module' || path === '/superadmin' || path === '/login') {
                    return false;
                }

                // If cpanel-full is not active, block forbidden landing page sub-paths
                if (activeModules !== null && !activeModules.includes('cpanel-full')) {
                    const forbiddenCPanelPaths = [
                        '/hero',
                        '/room-type',
                        '/about',
                        '/gallery',
                        '/footer',
                        '/attractions',
                        '/promo',
                        '/packages',
                        '/seo'
                    ];
                    if (forbiddenCPanelPaths.some(p => path === p || path.startsWith(p + '/'))) {
                        return true;
                    }
                }

                // Map route pathnames to module keys
                let pathModule: string | null = null;
                if (path.startsWith('/purchasing')) {
                    pathModule = 'purchasing';
                } else if (path.startsWith('/food-beverage')) {
                    pathModule = 'food-beverage';
                } else if (path.startsWith('/accounting') || path === '/pnl') {
                    pathModule = 'accounting';
                } else if (path === '/invoice') {
                    pathModule = 'front-office';
                } else if (path === '/overview' || path === '/forecast') {
                    if (mod) {
                        pathModule = mod;
                    } else {
                        const hasFO = activeModules.includes('front-office');
                        const hasHK = activeModules.includes('housekeeping');
                        if (!hasFO && !hasHK) {
                            return true;
                        }
                        return false;
                    }
                }

                const resolvedModule = mod || pathModule;

                // CPanel module itself is allowed for Logo and Users settings even if cpanel-full is not in activeModules
                if (resolvedModule && resolvedModule !== 'cpanel') {
                    if (!activeModules.includes(resolvedModule)) {
                        return true;
                    }
                }

                return false;
            };

            if (isPathForbidden(pathname, moduleParam)) {
                router.push('/select-module');
            }
        }
    }, [pathname, activeModules, router]);




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

    return (
        <div className="flex flex-col min-h-screen bg-transparent select-none">
            {!isSuperadminPage && (
                <header className="dashboard-top-bar">
                    <div className="dashboard-top-bar-inner">
                        <StatusWidget 
                            onMenuClick={() => setIsCollapsed(false)} 
                            isCollapsed={isCollapsed}
                            onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
                        />
                    </div>
                </header>
            )}

            <div className={`dashboard-wrapper ${isCollapsed ? "collapsed" : ""} ${!isCollapsed ? "mobile-open" : ""} ${isSuperadminPage ? "no-sidebar" : ""}`}>
                {!isSuperadminPage && (
                    <Sidebar
                        isCollapsed={isCollapsed}
                        setIsCollapsed={setIsCollapsed}
                    />
                )}
                {/* Mobile Overlay */}
                {!isCollapsed && !isSuperadminPage && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsCollapsed(true)}
                    />
                )}
                <main 
                    className="main-content"
                    style={isSuperadminPage ? { marginLeft: 0, maxWidth: "100vw", width: "100%" } : undefined}
                >
                    <div className="main-scroll-container">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname}
                                ref={containerRef}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="section-wrapper"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>

                        <footer className="dashboard-footer-clean">
                            <a
                                href={poweredByLink?.startsWith('http') ? poweredByLink : `https://${poweredByLink || "tarasetia.com"}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="powered-by-link"
                            >
                                <span className="text-light">Powered by</span>
                                <span className="text-brand">{poweredByText || "Tarasetia Venture"}</span>
                                <ExternalLink size={12} className="link-icon" />
                            </a>
                        </footer>
                    </div>
                </main>
                {!isSuperadminPage && <MobileBottomNav />}
                <BillingAlertModal />
            </div>
        </div>
    );
};
