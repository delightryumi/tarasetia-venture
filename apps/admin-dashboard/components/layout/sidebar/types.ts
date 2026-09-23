import { MotionValue } from "framer-motion";
import React from "react";

export type SectionType =
    | "overview" | "logo" | "hero" | "room-type" | "digital-checkin"
    | "about" | "gallery" | "footer"
    | "attractions" | "promo" | "packages" | "seo" | "invoice" | "forecast" | "revenue-breakdown" | "pnl" | "pnl-budget" | "users" | "superadmin" | "inventory-control" | "channel-manager" | "rate-inventory" | "confirmation-letter"
    | "purchasing" | "store-requisition" | "purchase-requisition" | "daily-market-list" | "stock-opname" | "items" | "suppliers"
    | "purchase-order" | "food-beverage-ledger" | "food-beverage-performance" | "food-beverage-product" | "food-beverage-realtime" | "hrd" | "statements" | "budgeting" | "dsr" | "innalytics";

export interface NavItemType {
    id: SectionType;
    label: string;
    icon: React.ReactNode;
}

export interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export interface DockNavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    mouseY?: MotionValue<number>;
    onClick: () => void;
}
