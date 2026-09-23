"use client";

import React from "react";
import { motion, MotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { SquaresFour, SignOut } from "@phosphor-icons/react";
import { DockNavItem } from "./DockNavItem";
import { NavItemType } from "./types";
import { navigateToSidebarItem } from "./navigation";

interface DockModeProps {
    navItems: NavItemType[];
    activeSection: string;
    activeModule: string;
    mouseY: MotionValue<number>;
    router: ReturnType<typeof useRouter>;
    setIsCollapsed: (collapsed: boolean) => void;
    handleLogout: () => void;
    onItemClick?: (itemId: string) => void;
}

export function DockMode({
    navItems,
    activeSection,
    activeModule,
    mouseY,
    router,
    setIsCollapsed,
    handleLogout,
    onItemClick,
}: DockModeProps) {
    return (
        <div
            className="flex-1 flex flex-col overflow-y-auto overflow-x-visible"
            style={{ scrollbarWidth: "none" }}
        >
            <motion.nav
                onMouseMove={(e) => mouseY.set(e.clientY)}
                onMouseLeave={() => mouseY.set(Infinity)}
                className="
                    flex flex-col items-center gap-2 w-full
                    py-2 px-1.5 mx-auto overflow-visible flex-1
                "
                role="toolbar"
                aria-label="Navigation dock"
            >
                <DockNavItem
                    icon={<SquaresFour size={18} className="text-[var(--sidebar-text)]" weight="bold" />}
                    label="Pilih Modul"
                    isActive={false}
                    mouseY={mouseY}
                    onClick={() => router.push('/select-module')}
                />

                {navItems.map((item) => (
                    <DockNavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeSection === item.id}
                        mouseY={mouseY}
                        onClick={() => {
                            if (onItemClick) {
                                onItemClick(item.id);
                            } else {
                                navigateToSidebarItem(item.id, activeModule, router, setIsCollapsed);
                            }
                        }}
                    />
                ))}
            </motion.nav>
        </div>
    );
}
