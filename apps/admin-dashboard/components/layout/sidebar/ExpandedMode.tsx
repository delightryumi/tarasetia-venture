"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SquaresFour, CaretDown, Lock } from "@phosphor-icons/react";
import { NavItemType } from "./types";
import { navigateToSidebarItem } from "./navigation";

interface GroupedNavType {
    title: string;
    items: NavItemType[];
}

interface ExpandedModeProps {
    navItems: NavItemType[];
    groupedNavItems: GroupedNavType[] | null;
    activeSection: string;
    activeModule: string;
    activeModules?: string[] | null;
    isSuperadmin?: boolean;
    router: ReturnType<typeof useRouter>;
    expandedGroups: Record<string, boolean>;
    toggleGroup: (title: string) => void;
    setIsCollapsed: (collapsed: boolean) => void;
    onItemClick?: (itemId: string) => void;
}

export function ExpandedMode({
    navItems,
    groupedNavItems,
    activeSection,
    activeModule,
    activeModules,
    isSuperadmin,
    router,
    expandedGroups,
    toggleGroup,
    setIsCollapsed,
    onItemClick,
}: ExpandedModeProps) {
    const isItemLocked = (itemId: string) => {
        if (isSuperadmin) return false;
        if (itemId === "food-beverage-realtime") {
            return activeModules !== null && !activeModules.includes("food-beverage-realtime") && !activeModules.includes("pos-realtime");
        }
        return false;
    };
    return (
        <nav className="nav-group flex flex-col gap-1.5 flex-1 overflow-y-auto px-3">
             <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                className="nav-item select-module-btn"
                onClick={() => router.push('/select-module')}
            >
                <SquaresFour size={18} className="nav-gold-icon" weight="bold" />
                <span className="nav-label font-medium nav-gold-label">Pilih Modul</span>
            </motion.button>

            {groupedNavItems ? (
                groupedNavItems.map(group => (
                    <div key={group.title} className="mb-4 w-full flex flex-col">
                        <button
                            onClick={() => toggleGroup(group.title)}
                            className="w-full flex items-center justify-between px-3 py-3 text-[12px] font-medium uppercase tracking-wider text-[var(--sidebar-text)] opacity-75 hover:opacity-100 transition-all text-left mb-1"
                        >
                            <span>{group.title}</span>
                            <CaretDown
                                size={13}
                                weight="bold"
                                className={`transition-transform duration-200 ${expandedGroups[group.title] ? "" : "-rotate-90"}`}
                            />
                        </button>
                        <AnimatePresence initial={false}>
                            {expandedGroups[group.title] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden flex flex-col gap-1 pl-2 w-full"
                                >
                                    {group.items.map(item => (
                                        <motion.button
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileTap={{ scale: 0.97 }}
                                            transition={{ duration: 0.2 }}
                                            className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                                            onClick={() => {
                                                if (onItemClick) {
                                                    onItemClick(item.id);
                                                } else {
                                                    navigateToSidebarItem(item.id, activeModule, router, setIsCollapsed);
                                                }
                                            }}
                                        >
                                            {item.icon}
                                            <span className="nav-label truncate">{item.label}</span>
                                            {isItemLocked(item.id) && (
                                                <span className="ml-auto text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 shrink-0">
                                                    <Lock size={10} weight="bold" />
                                                    Add-on
                                                </span>
                                            )}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))
            ) : (
                navItems.map((item) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                        onClick={() => {
                            if (onItemClick) {
                                onItemClick(item.id);
                            } else {
                                navigateToSidebarItem(item.id, activeModule, router, setIsCollapsed);
                            }
                        }}
                    >
                        {item.icon}
                        <span className="nav-label truncate">
                            {item.label}
                        </span>
                        {isItemLocked(item.id) && (
                            <span className="ml-auto text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 shrink-0">
                                <Lock size={10} weight="bold" />
                                Add-on
                            </span>
                        )}
                    </motion.button>
                ))
            )}
        </nav>
    );
}
