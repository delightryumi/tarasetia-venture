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
  mouseY,
  onClick,
  href,
  isExternal,
}: DockNavItemProps) {
  const content = (
    <motion.div
      onClick={onClick}
      tabIndex={0}
      role="button"
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
