"use client";

import React from "react";
import { Storefront } from "@phosphor-icons/react";

interface SidebarHeaderProps {
    isCollapsed: boolean;
    activeHotelName: string | null;
    activeHotelCode: string | null;
}

export function SidebarHeader({
    isCollapsed,
    activeHotelName,
    activeHotelCode,
}: SidebarHeaderProps) {
    return (
        <div className="sidebar-header flex flex-col justify-center px-4 relative mb-4">
            {!isCollapsed ? (
                <div className="flex flex-col gap-0.5 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[var(--sidebar-text)] opacity-60">
                        <Storefront size={14} weight="bold" />
                        <span>Partner</span>
                    </div>
                    <span className="text-[12px] font-bold text-[var(--sidebar-text)] truncate max-w-[150px]">
                        {activeHotelName ? `${activeHotelName}` : `[${activeHotelCode || "..."}]`}
                    </span>
                </div>
            ) : (
                <div className="flex justify-center w-full">
                    <Storefront size={20} className="text-[var(--sidebar-text)]" weight="bold" />
                </div>
            )}
        </div>
    );
}
