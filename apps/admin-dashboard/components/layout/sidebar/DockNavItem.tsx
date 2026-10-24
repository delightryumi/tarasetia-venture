"use client";

import React, { useState } from "react";
import { DockNavItemProps } from "./types";

export function DockNavItem({
    icon,
    label,
    isActive,
    onClick,
}: DockNavItemProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-200 border-none outline-none cursor-pointer
                    ${isActive
                        ? "bg-[#181d26] text-white shadow-sm"
                        : "text-[var(--sidebar-text)]/60 hover:text-[var(--sidebar-link-hover-text)] hover:bg-[var(--sidebar-link-hover-bg)]"
                    }
                `}
                aria-label={label}
            >
                <div className="sidebar-dock-icon flex items-center justify-center">
                    {icon}
                </div>
            </button>

            {/* Hover Tooltip / Flyout to the Right */}
            {isHovered && (
                <div
                    style={{
                        position: "fixed",
                        left: "68px",
                        transform: "translateY(-34px)",
                        background: "#09090b",
                        color: "#ffffff",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.18)",
                        pointerEvents: "none",
                        zIndex: 99999,
                        letterSpacing: "-0.01em",
                        animation: "dockTooltipIn 0.1s ease"
                    }}
                >
                    {label}
                </div>
            )}
        </div>
    );
}
