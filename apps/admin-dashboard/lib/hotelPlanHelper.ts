/**
 * Helper to determine if a property/hotel subscription is Startup / Resto / Cafe / UMKM mode.
 * In this mode, hotel room operations (rooms revenue, room statistics, room expenses, ADR, RevPAR)
 * are excluded or hidden across Accounting, DSR, Budgeting, and P&L.
 */

export function isStartupPlan(hotelData?: any): boolean {
    if (!hotelData) return false;
    
    // Check explicit plan identifier
    const rawPlan = String(hotelData.billing?.plan || hotelData.plan || "").toLowerCase().trim();
    const planStr = rawPlan.replace(/[\s_-]+/g, "");
    if (planStr === "startup" || planStr === "starup" || planStr === "basic") {
        return true;
    }
    
    // Check subscribed active modules
    const activeModules: string[] = hotelData.billing?.activeModules || hotelData.activeModules || [];
    if (Array.isArray(activeModules) && activeModules.length > 0) {
        const hasFO = activeModules.includes("front-office") || activeModules.includes("overview") || activeModules.includes("forecast");
        const hasHK = activeModules.includes("housekeeping");
        // If neither Front Office nor Housekeeping is active, property operates purely in F&B / POS / Resto mode
        if (!hasFO && !hasHK) {
            return true;
        }
    }
    
    return false;
}
