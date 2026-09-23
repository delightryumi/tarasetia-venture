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
    const role = (user.role || "").toLowerCase().trim();
    const email = (user.email || "").toLowerCase().trim();
    return (
        role === "superadmin" ||
        role === "super_admin" ||
        email === "superadmin@setara.co.id" ||
        email === "nexura.management@gmail.com"
    );
}

/**
 * Check if a user has access to a specific permission item ID, optionally taking moduleKey into account.
 * Follows strict priority:
 * 1. Superadmin -> always true
 * 2. Explicit false on permission -> strictly false (even if user has admin role)
 * 3. Explicit false on module -> strictly false
 * 4. Explicit true on permission -> true
 * 5. Undefined -> fallback to getStandardRolePermissions(user.role)
 */
export function hasPermission(
    user: UserPermissionProfile | null | undefined,
    permId: string,
    moduleKey?: string
): boolean {
    if (isUserSuperadmin(user)) return true;
    if (!user) return false;

    const permissions: Record<string, boolean> = user.permissions || {};

    // 1. Explicit false on specific permission item wins over everything
    if (permissions[permId] === false) {
        return false;
    }

    // 2. Explicit true on specific permission item wins (e.g. user specifically enabled 1 sub-menu even if module was previously toggled off)
    if (permissions[permId] === true) {
        return true;
    }

    // 3. Explicit false on the entire module group blocks unconfigured items
    if (moduleKey && permissions[moduleKey] === false) {
        return false;
    }

    // 4. Fallback to standard industry role presets
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
 * Comprehensive route-level checker to determine if a route is permitted for the user.
 * Checks both hotel billing activeModules AND user granular permissions.
 */
export function isPathAllowedForUser(
    pathname: string,
    moduleParam: string | null,
    user: UserPermissionProfile | null | undefined,
    activeModules: string[] | null
): boolean {
    if (isUserSuperadmin(user)) return true;

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
            if (!activeModules.includes(resolvedBilling)) {
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
