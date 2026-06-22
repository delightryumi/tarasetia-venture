'use client';
import React from 'react';
import { SignOut } from '@phosphor-icons/react';

interface SidebarFooterExpandedProps {
  handleLogout: () => void;
}

export function SidebarFooterExpanded({
  handleLogout,
}: SidebarFooterExpandedProps) {
  return (
    <div
      className="mt-auto flex flex-col gap-2"
      style={{
        paddingTop: "16px",
        borderTop: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-[6px] text-sm font-semibold cursor-pointer transition-all whitespace-nowrap text-left border border-transparent hover:bg-[rgba(220,38,38,0.08)] hover:border-[rgba(220,38,38,0.15)] hover:text-[#dc2626]"
        style={{
          backgroundColor: "transparent",
          color: "var(--sidebar-text)",
        }}
      >
        <SignOut size={18} weight="bold" />
        <span>Keluar</span>
      </button>
    </div>
  );
}
