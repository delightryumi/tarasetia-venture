'use client';
import React from 'react';
import Link from 'next/link';
import { motion, type MotionValue } from 'framer-motion';

interface DockNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  mouseY: MotionValue<number>;
  onClick?: () => void;
  href?: string;
  isExternal?: boolean;
}

export function DockNavItem({
  icon,
  label,
  isActive,
  mouseY, // Retained to preserve signature compatibility
  onClick,
  href,
  isExternal,
}: DockNavItemProps) {
  const content = (
    <motion.div
      onClick={onClick}
      tabIndex={0}
      role="button"
      className={`
        w-[76px] h-[76px] px-1 rounded-[8px] flex flex-col items-center justify-center gap-1
        transition-all duration-200 border border-transparent outline-none cursor-pointer
        ${isActive
          ? "bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-text)] shadow-none"
          : "text-[var(--sidebar-text)]/60 hover:text-[var(--sidebar-link-hover-text)] hover:bg-[var(--sidebar-link-hover-bg)] hover:border-[var(--sidebar-link-hover-border)]"
        }
      `}
    >
      <div className="sidebar-dock-icon">
        {icon}
      </div>
      <span
        className="text-[9px] text-center font-bold tracking-tight leading-tight w-full truncate block"
        style={{
          color: isActive ? "var(--sidebar-link-active-text)" : "var(--sidebar-text)",
        }}
      >
        {label}
      </span>
    </motion.div>
  );

  if (href && !onClick) {
    if (isExternal) {
      return <a href={href} target="_top" className="no-underline">{content}</a>;
    }
    return <Link href={href} className="no-underline">{content}</Link>;
  }

  return content;
}
