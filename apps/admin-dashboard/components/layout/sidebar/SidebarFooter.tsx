"use client";

import React from "react";
import { SignOut } from "@phosphor-icons/react";

interface SidebarFooterProps {
    isCollapsed: boolean;
    activeModule: string;
    handleLogout: () => void;
}

export function SidebarFooter({
    isCollapsed,
    activeModule,
    handleLogout,
}: SidebarFooterProps) {
    if (activeModule === "cpanel") return null;

    if (isCollapsed) {
        return (
            <div className="sidebar-footer flex items-center justify-center py-2 border-t-0" style={{ borderTop: "none" }}>
                <button
                    onClick={handleLogout}
                    title="Keluar"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-none outline-none cursor-pointer text-[var(--sidebar-text)]/60 hover:text-[var(--sidebar-link-hover-text)] hover:bg-[var(--sidebar-link-hover-bg)]"
                >
                    <div className="sidebar-dock-icon flex items-center justify-center">
                        <SignOut size={18} weight="bold" />
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="sidebar-footer">
            <button
                className="logout-button"
                onClick={handleLogout}
            >
                <SignOut size={18} weight="bold" />
                <span>Keluar</span>
            </button>
        </div>
    );
}
