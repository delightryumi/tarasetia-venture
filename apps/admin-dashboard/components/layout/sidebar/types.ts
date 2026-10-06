import { MotionValue } from "framer-motion";
import React from "react";

export type SectionType =
    | "overview" | "bookings" | "pos" | "logo" | "hero" | "room-type" | "digital-checkin"
    | "about" | "gallery" | "footer" | "cpanel"
    | "attractions" | "promo" | "packages" | "seo" | "invoice" | "forecast" | "revenue-breakdown" | "pnl" | "pnl-budget" | "users" | "superadmin" | "inventory-control" | "channel-manager" | "rate-inventory" | "confirmation-letter" | "payment-gateway"
    | "purchasing" | "store-requisition" | "purchase-requisition" | "daily-market-list" | "stock-opname" | "items" | "suppliers"
    | "purchase-order" | "food-beverage-ledger" | "food-beverage-performance" | "food-beverage-product" | "food-beverage-realtime" | "hrd" | "statements" | "budgeting" | "dsr" | "innalytics"
    | "hrd_scheduling" | "hrd_attendance" | "hrd_leaves" | "hrd_payroll" | "ina_reports" | "fo_walkin"
    | "hrd_shifts" | "hrd_overtime" | "hrd_reports" | "hrd_settings";

export interface NavItemType {
    id: SectionType;
    label: string;
    icon: React.ReactNode;
}

export interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    activeModules?: string[] | null;
}

export interface DockNavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    mouseY?: MotionValue<number>;
    onClick: () => void;
}
