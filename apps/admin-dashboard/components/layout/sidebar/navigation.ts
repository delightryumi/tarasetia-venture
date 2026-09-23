import { useRouter } from "next/navigation";

/**
 * Resolves the destination href for any navigation item in the system,
 * ensuring query parameters (e.g. module, sub-tab, view) are properly synchronized.
 */
export function getSidebarItemHref(itemId: string, activeModule: string): string {
    switch (itemId) {
        // Purchasing & Procurement
        case "purchasing":
            return "/purchasing?module=purchasing";
        case "store-requisition":
        case "purchase-requisition":
        case "daily-market-list":
        case "stock-opname":
        case "items":
        case "suppliers":
            return `/purchasing/${itemId}?module=purchasing`;
        case "purchase-order":
            return `/${activeModule}/purchase-order`;

        // Food & Beverage
        case "food-beverage-ledger":
        case "food-beverage-product":
            return "/food-beverage/ledger?module=food-beverage";
        case "food-beverage-performance":
            return "/food-beverage/performance?module=food-beverage";
        case "food-beverage-realtime":
            return "/food-beverage/realtime?module=food-beverage";

        // Accounting & Finance
        case "pnl":
            return "/pnl?module=accounting";
        case "statements":
            return "/statements?module=accounting";
        case "pnl-budget":
            return "/pnl-budget?module=accounting";
        case "dsr":
            return "/dsr?module=accounting";
        case "budgeting":
            return "/budgeting?module=accounting";

        // HRD Sub-items deep-linking
        case "hrd":
            return "/hrd?module=hrd&tab=staf";
        case "hrd_attendance":
            return "/hrd?module=hrd&tab=monitor";
        case "hrd_shifts":
            return "/hrd?module=hrd&tab=shift";
        case "hrd_scheduling":
            return "/hrd?module=hrd&tab=plotting";
        case "hrd_leaves":
            return "/hrd?module=hrd&tab=pengajuan";
        case "hrd_overtime":
            return "/hrd?module=hrd&tab=lembur";
        case "hrd_reports":
            return "/hrd?module=hrd&tab=laporan";
        case "hrd_payroll":
            return "/hrd?module=hrd&tab=penggajian";
        case "hrd_settings":
            return "/hrd?module=hrd&tab=setting";

        // Innalytics views
        case "ina_reports":
            return "/innalytics?view=reports";
        case "innalytics":
            return "/innalytics?view=dashboard";

        // Front Office Walk-in
        case "fo_walkin":
            return "/forecast/add?module=front-office";

        // Module-contextual pages
        case "overview":
        case "forecast":
        case "confirmation-letter":
        case "revenue-breakdown":
        case "inventory-control":
        case "rate-inventory":
        case "invoice":
        case "digital-checkin":
            return `/${itemId}?module=${activeModule}`;

        default:
            return `/${itemId}`;
    }
}

/**
 * Helper to dispatch navigation and automatically close mobile sidebar if needed.
 */
export function navigateToSidebarItem(
    itemId: string,
    activeModule: string,
    router: ReturnType<typeof useRouter>,
    setIsCollapsed?: (collapsed: boolean) => void
) {
    const href = getSidebarItemHref(itemId, activeModule);
    router.push(href);
    if (typeof window !== "undefined" && window.innerWidth <= 1024 && setIsCollapsed) {
        setIsCollapsed(true);
    }
}
