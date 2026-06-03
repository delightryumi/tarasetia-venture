"use client";

import React, { useState, useLayoutEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { StatusWidget } from "./StatusWidget";
import { MobileBottomNav } from "./MobileBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useFooter } from "../sections/footer/useFooter";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoginSection } from "@/components/sections/login/LoginSection";
import gsap from "gsap";
import "./layout.css";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { poweredByText, poweredByLink } = useFooter();
    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        // Reset and animate
        gsap.fromTo(
            containerRef.current.querySelectorAll(".card, .glass-card, .section-container > header, .form-group"),
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

    // ── Purchasing module isolation ──
    // Per GEMINI.md: purchasing has its own shell (PurchasingShell).
    // We skip the global DashboardLayout entirely for /purchasing/* paths.
    if (pathname.startsWith('/purchasing')) {
        if (loading) return null;
        if (!user) return <LoginSection />;
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-broken-white">
                <div className="text-sage font-semibold animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <LoginSection />;
    }

    return (
        <div className={`dashboard-wrapper ${isCollapsed ? "collapsed" : ""} ${!isCollapsed ? "mobile-open" : ""}`}>
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            {/* Mobile Overlay */}
            {!isCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsCollapsed(true)}
                />
            )}
            <main className="main-content">
                {pathname !== "/forecast/add" && pathname !== "/overview" && (
                    <div className="dashboard-top-bar">
                        <StatusWidget 
                            onMenuClick={() => setIsCollapsed(false)} 
                            isCollapsed={isCollapsed}
                            onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
                        />
                    </div>
                )}

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
                            href={poweredByLink?.startsWith('http') ? poweredByLink : `https://${poweredByLink || "nexuragroups.com"}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="powered-by-link"
                        >
                            <span className="text-light">Powered by</span>
                            <span className="text-brand">{poweredByText || "Nexura Global Hospitality"}</span>
                            <ExternalLink size={12} className="link-icon" />
                        </a>
                    </footer>
                </div>
            </main>
            <MobileBottomNav />
        </div>
    );
};
