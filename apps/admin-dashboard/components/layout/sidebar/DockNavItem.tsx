"use client";

import React from "react";
import { DockNavItemProps } from "./types";

export function DockNavItem({
    icon,
    label,
    isActive,
    onClick,
}: DockNavItemProps) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-200 border-none outline-none cursor-pointer
                ${isActive
                    ? "bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-text)]"
                    : "text-[var(--sidebar-text)]/60 hover:text-[var(--sidebar-link-hover-text)] hover:bg-[var(--sidebar-link-hover-bg)]"
                }
            `}
        >
            <div className="sidebar-dock-icon flex items-center justify-center">
                {icon}
            </div>
        </button>
    );
}
