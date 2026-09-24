import { getStandardRolePermissions } from "@/components/sections/users/permissionConfig";

export interface UserPermissionProfile {
    role?: string;
    email?: string;
    permissions?: Record<string, boolean>;
    [key: string]: any;
}

/**
 * Check if the given user is a Superadmin (either by role or master superadmin email).
 */
export function isUserSuperadmin(user: UserPermissionProfile | null | undefined): boolean {
    if (!user) return false;
    if (user.isSuperadmin === true) return true;
    const role = (user.role || "").toLowerCase().trim();
    const email = (user.email || "").toLowerCase().trim();
    return (
        role === "superadmin" ||
        role === "super_admin" ||
        role === "super admin" ||
        email === "superadmin@setara.co.id" ||
        email === "nexura.management@gmail.com"
    );
}

/**
 * Check if the user is an Admin or Property Owner.
 */
export function isUserAdmin(user: UserPermissionProfile | null | undefined): boolean {
    if (!user) return false;
    if (isUserSuperadmin(user)) return true;
    if (user.isOwner === true) return true;
    const role = (user.role || "").toLowerCase().trim();
    return (
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "hotel owner" ||
        role === "hotel admin"
    );
}

/**
 * Check if a user has access to a specific permission item ID, optionally taking moduleKey into account.
 * Follows strict priority:
 * 1. Superadmin -> always true
 * 2. Explicit false on permission -> strictly false
 * 3. Explicit true on permission -> true
 * 4. Intelligent alias/mapping (e.g. hk_overview, overview, dsr, etc.) -> true if matched or active
 * 5. Explicit false on module group -> false
 * 6. Explicit true on module group -> true
 * 7. Role defaults fallback
 */
export function hasPermission(
    user: UserPermissionProfile | null | undefined,
    permId: string,
    moduleKey?: string
): boolean {
    if (isUserSuperadmin(user)) return true;
    if (!user) return false;

    // Property Admins & Owners have full access to their hotel's modules unless explicitly locked
    if (isUserAdmin(user)) return true;

    const permissions: Record<string, boolean> = user.permissions || {};

    // 1. Explicit false on specific permission item wins over everything
    if (permissions[permId] === false) {
        return false;
    }

    // 2. Explicit true on specific permission item wins (e.g. user specifically enabled 1 sub-menu)
    if (permissions[permId] === true) {
        return true;
    }

    // 3. Intelligent Alias / Mapping:
    // Housekeeping Overview: maps to hk_overview or any active Housekeeping sub-action
    if ((permId === "overview" || permId === "hk_overview") && (moduleKey === "module_housekeeping" || moduleKey === "housekeeping")) {
        if (permissions["hk_overview"] === true || permissions["overview"] === true) return true;
        const anyHkActive = Object.entries(permissions).some(([k, v]) => v === true && k.startsWith("hk_"));
        if (anyHkActive) return true;
    }

    // Front Office Overview: if user has any FO sub-menu or action, Tape Chart / Overview must be visible
    if (permId === "overview" && (moduleKey === "module_front_office" || moduleKey === "front-office" || !moduleKey)) {
        if (permissions["overview"] === true) return true;
        const anyFoAction = Object.entries(permissions).some(([k, v]) => v === true && (
            k.startsWith("fo_") || k === "digital-checkin" || k === "forecast" || 
            k === "revenue-breakdown" || k === "rate-inventory" || k === "inventory-control" || k === "invoice"
        ));
        if (anyFoAction) return true;
    }

    // Night Audit DSR: mapped under module_night_audit or module_accounting
    if (permId === "dsr") {
        if (permissions["dsr"] === true || permissions["module_night_audit"] === true) return true;
    }

    // Innalytics Dashboard: if user has innalytics or any report/analytics action
    if (permId === "innalytics") {
        if (permissions["innalytics"] === true) return true;
        const anyInaActive = Object.entries(permissions).some(([k, v]) => v === true && k.startsWith("ina_"));
        if (anyInaActive) return true;
    }

    // Food & Beverage Product / Ledger
    if (permId === "food-beverage-product") {
        if (permissions["food-beverage-product"] === true || permissions["food-beverage-ledger"] === true || permissions["pos_product"] === true) return true;
    }

    // Purchasing Dashboard
    if (permId === "purchasing") {
        if (permissions["purchasing"] === true) return true;
        const anyPurchasingActive = Object.entries(permissions).some(([k, v]) => v === true && (
            k === "store-requisition" || k === "purchase-requisition" || k === "daily-market-list" || 
            k === "stock-opname" || k === "items" || k === "suppliers" || k === "purchase-order" || k === "receiving_goods"
        ));
        if (anyPurchasingActive) return true;
    }

    // HRD Portal
    if (permId === "hrd") {
        if (permissions["hrd"] === true) return true;
        const anyHrdActive = Object.entries(permissions).some(([k, v]) => v === true && k.startsWith("hrd_"));
        if (anyHrdActive) return true;
    }

    // 4. Explicit true on the entire module group
    if (moduleKey && permissions[moduleKey] === true) {
        return true;
    }

    // 5. Explicit false on the entire module group blocks unconfigured items
    if (moduleKey && permissions[moduleKey] === false) {
        return false;
    }

    // 6. Fallback to standard industry role presets
    const roleDefaults = getStandardRolePermissions(user.role || "");

    // If role defaults explicitly deny the item
    if (roleDefaults[permId] === false) {
        return false;
    }

    // If role defaults explicitly grant the item
    if (roleDefaults[permId] === true) {
        if (moduleKey && permissions[moduleKey] === false) {
            return false;
        }
        return true;
    }

    return false;
}

/**
 * Check if a user has access to at least ONE sub-menu or feature inside a given module.
 * If user has even 1 permission in the module, this returns true.
 */
export function hasModuleAccess(
    user: UserPermissionProfile | null | undefined,
    moduleKey: string
): boolean {
    if (!user) return false;
    if (isUserSuperadmin(user) || isUserAdmin(user)) return true;

    const permissions: Record<string, boolean> = user.permissions || {};

    const moduleGroupKey = moduleKey.startsWith("module_") ? moduleKey : `module_${moduleKey.replace(/-/g, "_")}`;
    if (permissions[moduleGroupKey] === true) return true;
    if (permissions[moduleKey] === true) return true;

    // Check if any permission specific to this module is explicitly true
    if (moduleKey === "front-office" || moduleGroupKey === "module_front_office") {
        return Object.entries(permissions).some(([k, v]) => v === true && (
            k === "overview" || k === "digital-checkin" || k === "forecast" || k === "revenue-breakdown" ||
            k === "rate-inventory" || k === "inventory-control" || k === "invoice" || k === "confirmation-letter" ||
            k.startsWith("fo_")
        ));
    }

    if (moduleKey === "housekeeping" || moduleGroupKey === "module_housekeeping") {
        return Object.entries(permissions).some(([k, v]) => v === true && (
            k === "hk_overview" || k.startsWith("hk_")
        ));
    }

    if (moduleKey === "accounting" || moduleGroupKey === "module_accounting") {
        return Object.entries(permissions).some(([k, v]) => v === true && (
            k === "pnl" || k === "pnl-budget" || k === "dsr" || k === "budgeting" || k === "statements" ||
            k.startsWith("accounting_") || k.startsWith("na_") || k === "module_night_audit"
        ));
    }

    if (moduleKey === "food-beverage" || moduleGroupKey === "module_food_beverage") {
        return Object.entries(permissions).some(([k, v]) => v === true && (
            k.startsWith("food-beverage-") || k.startsWith("fnb_")
        ));
    }

    if (moduleKey === "purchasing" || moduleGroupKey === "module_purchasing") {
        return Object.entries(permissions).some(([k, v]) => v === true && (
            k === "purchasing" || k === "store-requisition" || k === "purchase-requisition" ||
            k === "daily-market-list" || k === "stock-opname" || k === "items" || k === "suppliers" ||
            k === "purchase-order" || k === "receiving_goods"
        ));
    }

    if (moduleKey === "hrd" || moduleGroupKey === "module_hrd") {
        return Object.entries(permissions).some(([k, v]) => v === true && (
            k === "hrd" || k.startsWith("hrd_")
        ));
    }

    if (moduleKey === "innalytics" || moduleGroupKey === "module_innalytics") {
        return Object.entries(permissions).some(([k, v]) => v === true && (
            k === "innalytics" || k.startsWith("ina_")
        ));
    }

    if (moduleKey === "pos" || moduleGroupKey === "module_pos") {
        return Object.entries(permissions).some(([k, v]) => v === true && (
            k.startsWith("pos_") || k === "pos"
        ));
    }

    if (moduleKey === "cpanel" || moduleGroupKey === "module_cpanel") {
        const cpanelKeys = ["logo", "hero", "room-type", "about", "gallery", "footer", "attractions", "promo", "packages", "seo", "users", "channel-manager"];
        return Object.entries(permissions).some(([k, v]) => v === true && cpanelKeys.includes(k));
    }

    return false;
}

/**
 * Comprehensive route-level checker to determine if a route is permitted for the user.
 * Checks both hotel billing activeModules AND user granular permissions.
 */
export function isPathAllowedForUser(
    pathname: string,
    moduleParam: string | null,
    user: UserPermissionProfile | null | undefined,
    activeModules: string[] | null
): boolean {
    if (isUserSuperadmin(user) || isUserAdmin(user)) return true;

    // Public/system routes that are always allowed once authenticated
    if (pathname === "/select-module" || pathname === "/login" || pathname === "/profile") {
        return true;
    }

    // /superadmin is exclusively for confirmed superadmins
    if (pathname === "/superadmin" || pathname.startsWith("/superadmin/")) {
        return false;
    }

    // 1. Active hotel modules (billing subscription) validation
    if (activeModules !== null) {
        if (pathname.startsWith("/innalytics")) {
            if (!activeModules.includes("innalytics") && !activeModules.includes("inalytics")) {
                return false;
            }
        }

        // If cpanel-full is not active, block landing page CMS subpaths
        if (!activeModules.includes("cpanel-full")) {
            const forbiddenCPanelPaths = [
                "/hero",
                "/room-type",
                "/about",
                "/gallery",
                "/footer",
                "/attractions",
                "/promo",
                "/packages",
                "/seo",
            ];
            if (forbiddenCPanelPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
                return false;
            }
        }

        // Map route pathnames to module keys for subscription validation
        let requiredBillingModule: string | null = null;
        if (pathname.startsWith("/purchasing")) {
            requiredBillingModule = "purchasing";
        } else if (pathname.startsWith("/food-beverage")) {
            requiredBillingModule = "food-beverage";
        } else if (
            pathname.startsWith("/accounting") ||
            pathname === "/pnl" ||
            pathname === "/pnl-budget" ||
            pathname === "/statements" ||
            pathname === "/dsr" ||
            pathname === "/budgeting"
        ) {
            requiredBillingModule = "accounting";
        } else if (pathname === "/invoice" || pathname === "/revenue-breakdown") {
            requiredBillingModule = "front-office";
        } else if (pathname === "/overview" || pathname === "/forecast") {
            if (moduleParam) {
                requiredBillingModule = moduleParam;
            } else {
                const hasFO = activeModules.includes("front-office");
                const hasHK = activeModules.includes("housekeeping");
                if (!hasFO && !hasHK) {
                    return false;
                }
            }
        }

        const resolvedBilling = moduleParam || requiredBillingModule;
        if (resolvedBilling && resolvedBilling !== "cpanel") {
            if (!activeModules.includes(resolvedBilling) && !hasModuleAccess(user, resolvedBilling)) {
                return false;
            }
        }
    }

    // 2. User Granular Permissions Validation
    if (!user) return false;

    // Users / Staff Management Route
    if (pathname === "/users" || pathname.startsWith("/users/")) {
        return hasPermission(user, "users", "module_cpanel");
    }

    // Front Office & Housekeeping Routes
    if (pathname === "/overview") {
        if (moduleParam === "housekeeping") {
            return hasPermission(user, "hk_overview", "module_housekeeping");
        }
        if (hasPermission(user, "overview", "module_front_office")) {
            return true;
        }
        if (user.permissions?.overview !== false && hasPermission(user, "hk_overview", "module_housekeeping")) {
            return true;
        }
        return false;
    }

    if (pathname === "/digital-checkin") {
        return hasPermission(user, "digital-checkin", "module_front_office");
    }
    if (pathname === "/confirmation-letter") {
        return hasPermission(user, "confirmation-letter", "module_front_office");
    }
    if (pathname === "/forecast") {
        return hasPermission(user, "forecast", "module_front_office");
    }
    if (pathname === "/revenue-breakdown") {
        return hasPermission(user, "revenue-breakdown", "module_front_office");
    }
    if (pathname === "/rate-inventory" || pathname.startsWith("/rate-inventory/")) {
        return hasPermission(user, "rate-inventory", "module_front_office");
    }
    if (pathname === "/inventory-control") {
        return hasPermission(user, "inventory-control", "module_front_office");
    }
    if (pathname === "/invoice") {
        return hasPermission(user, "invoice", "module_front_office");
    }

    // Finance & Accounting Routes
    if (pathname === "/dsr") {
        return (
            hasPermission(user, "dsr", "module_accounting") ||
            hasPermission(user, "dsr", "module_night_audit")
        );
    }
    if (pathname === "/pnl") {
        return hasPermission(user, "pnl", "module_accounting");
    }
    if (pathname === "/pnl-budget") {
        return hasPermission(user, "pnl-budget", "module_accounting");
    }
    if (pathname === "/budgeting") {
        return hasPermission(user, "budgeting", "module_accounting");
    }
    if (pathname === "/statements") {
        return hasPermission(user, "statements", "module_accounting");
    }

    // Purchasing Routes
    if (pathname === "/purchasing") {
        return hasPermission(user, "purchasing", "module_purchasing");
    }
    if (pathname.startsWith("/purchasing/")) {
        const sub = pathname.replace("/purchasing/", "").split("/")[0].split("?")[0];
        return hasPermission(user, sub, "module_purchasing");
    }
    if (pathname.endsWith("/purchase-order")) {
        const mod = pathname.split("/")[1];
        return hasPermission(user, "purchase-order", `module_${mod.replace("-", "_")}`);
    }

    // Food & Beverage Routes
    if (pathname.startsWith("/food-beverage/")) {
        const sub = pathname.replace("/food-beverage/", "").split("/")[0].split("?")[0];
        if (sub === "ledger") return hasPermission(user, "food-beverage-ledger", "module_food_beverage");
        if (sub === "performance") return hasPermission(user, "food-beverage-performance", "module_food_beverage");
        if (sub === "realtime") return hasPermission(user, "food-beverage-realtime", "module_food_beverage");
        if (sub === "product") return hasPermission(user, "food-beverage-ledger", "module_food_beverage");
        return hasPermission(user, "food-beverage-ledger", "module_food_beverage");
    }

    // Innalytics Business Intelligence
    if (pathname.startsWith("/innalytics")) {
        return hasPermission(user, "innalytics", "module_innalytics");
    }

    // HRD Routes
    if (pathname.startsWith("/hrd")) {
        return hasPermission(user, "hrd", "module_hrd");
    }

    // Channel Manager (Exclusively Superadmin + Explicit Second Backup User)
    if (pathname === "/channel-manager" || pathname.startsWith("/channel-manager/")) {
        return isUserSuperadmin(user) || (user?.permissions?.["channel-manager"] === true && hasPermission(user, "channel-manager", "module_channel_manager"));
    }

    // CPanel / CMS Routes
    const cpanelRoutes = [
        "logo",
        "hero",
        "room-type",
        "about",
        "gallery",
        "footer",
        "attractions",
        "promo",
        "packages",
        "seo",
    ];
    for (const r of cpanelRoutes) {
        if (pathname === `/${r}` || pathname.startsWith(`/${r}/`)) {
            return hasPermission(user, r, "module_cpanel");
        }
    }

    return true;
}
