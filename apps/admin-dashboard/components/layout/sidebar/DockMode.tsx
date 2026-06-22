"use client";

import React from "react";
import { motion, MotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { SquaresFour, SignOut } from "@phosphor-icons/react";
import { DockNavItem } from "./DockNavItem";
import { NavItemType } from "./types";

interface DockModeProps {
    navItems: NavItemType[];
    activeSection: string;
    activeModule: string;
    mouseY: MotionValue<number>;
    router: ReturnType<typeof useRouter>;
    setIsCollapsed: (collapsed: boolean) => void;
    handleLogout: () => void;
}

export function DockMode({
    navItems,
    activeSection,
    activeModule,
    mouseY,
    router,
    setIsCollapsed,
    handleLogout,
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
                            if (item.id === "purchasing") {
                                router.push(`/purchasing?module=purchasing`);
                            } else if (["store-requisition", "purchase-requisition", "daily-market-list", "stock-opname", "items", "suppliers"].includes(item.id)) {
                                router.push(`/purchasing/${item.id}?module=purchasing`);
                            } else if (item.id === "purchase-order") {
                                router.push(`/${activeModule}/purchase-order`);
                            } else if (item.id === "food-beverage-product") {
                                router.push(`/food-beverage/product?module=food-beverage`);
                            } else if (item.id === "food-beverage-realtime") {
                                router.push(`/food-beverage/realtime?module=food-beverage`);
                            } else if (item.id === "statements") {
                                router.push(`/statements?module=accounting`);
                            } else {
                                router.push(`/${item.id}`);
                            }
                            if (window.innerWidth <= 1024) setIsCollapsed(true);
                        }}
                    />
                ))}
            </motion.nav>
        </div>
    );
}
