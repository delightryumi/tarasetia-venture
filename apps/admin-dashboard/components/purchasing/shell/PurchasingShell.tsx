'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingCart, Coffee,
  ClipboardList, Package, Users, ArrowLeft
} from 'lucide-react';
import styles from './PurchasingShell.module.css';
import './purchasing-tokens.css';

const navItems = [
  {
    section: 'Overview',
    items: [
      { id: 'dashboard',           label: 'Dashboard',              href: '/purchasing',                      icon: LayoutDashboard },
    ]
  },
  {
    section: 'Procurement',
    items: [
      { id: 'store-requisition',   label: 'Store Requisition',      href: '/purchasing/store-requisition',    icon: FileText },
      { id: 'purchase-requisition',label: 'Purchase Requisition',   href: '/purchasing/purchase-requisition', icon: ShoppingCart },
      { id: 'daily-market-list',   label: 'Daily Market List',      href: '/purchasing/daily-market-list',    icon: Coffee },
    ]
  },
  {
    section: 'Inventory',
    items: [
      { id: 'stock-opname',        label: 'Stock Opname',           href: '/purchasing/stock-opname',         icon: ClipboardList },
      { id: 'items',               label: 'Items Master',           href: '/purchasing/items',                icon: Package },
      { id: 'suppliers',           label: 'Suppliers',              href: '/purchasing/suppliers',            icon: Users },
    ]
  }
];

interface PurchasingShellProps {
  children: React.ReactNode;
}

export function PurchasingShell({ children }: PurchasingShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/purchasing') return pathname === '/purchasing';
    return pathname.startsWith(href);
  };

  return (
    <div className={`purchasing-root ${styles.root}`}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoMark}>P</div>
          <div>
            <div className={styles.sidebarTitle}>Purchasing</div>
            <div className={styles.sidebarSubtitle}>Nexura HMS</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((section) => (
            <div key={section.section} className={styles.navSection}>
              <div className={styles.navSectionLabel}>{section.section}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  >
                    <Icon className={styles.navIcon} size={16} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/select-module" className={styles.backLink}>
            <ArrowLeft size={15} strokeWidth={1.8} />
            Back to Modules
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className={styles.main}>
        <div className={styles.mainInner}>
          {children}
        </div>
      </main>
    </div>
  );
}
