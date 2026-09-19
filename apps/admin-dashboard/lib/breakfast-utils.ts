/**
 * Breakfast Package Allocation Utility
 * Standardized for International Hotel Accounting & USALI
 * 
 * Handles dynamic separation of package breakfast revenue from room accommodation charges
 * based on Channel Manager Rate Plan configuration & Hotel Settings.
 */

export interface BreakfastAllocationOptions {
    ratePlans?: any[];
    hotelBreakfastRate?: number;
    defaultRate?: number;
}

export interface BreakfastAllocation {
    hasBreakfast: boolean;
    breakfastPax: number;
    breakfastRate: number;
    breakfastAmount: number;
    netRoomAmount: number;
    isPreSplit: boolean;
}

/**
 * Detects if an accommodation transaction includes breakfast and dynamically calculates
 * the departmental split based on Rate Plan settings from Channel Manager and Hotel Settings.
 * 
 * @param entry Transaction entry object
 * @param options Rate plan array, hotel breakfast rate override, or numeric default rate
 */
export function detectBreakfastAllocation(
    entry: any,
    options?: number | BreakfastAllocationOptions
): BreakfastAllocation {
    if (!entry) {
        return {
            hasBreakfast: false,
            breakfastPax: 0,
            breakfastRate: 0,
            breakfastAmount: 0,
            netRoomAmount: 0,
            isPreSplit: false,
        };
    }

    const opts: BreakfastAllocationOptions = typeof options === "number" 
        ? { defaultRate: options } 
        : (options || {});

    const totalAmount = Number(entry.amount) || 0;
    const rateCode = String(entry.rateCode || "").toUpperCase();
    const ratePlanName = String(entry.ratePlanName || entry.ratePlan || "").toLowerCase();
    const desc = String(entry.description || entry.note || "").toLowerCase();
    const entryPlanId = String(entry.ratePlanId || entry.ratePlan || "");

    // 1. Check Rate Plan match from Channel Manager
    let matchedPlan: any = null;
    if (opts.ratePlans && opts.ratePlans.length > 0) {
        matchedPlan = opts.ratePlans.find((p: any) => 
            (entryPlanId && (p.id === entryPlanId || p.channexRatePlanId === entryPlanId)) ||
            (rateCode && p.code && p.code.toUpperCase() === rateCode) ||
            (ratePlanName && p.name && p.name.toLowerCase() === ratePlanName)
        );

        // Fallback: If code is BB or name includes breakfast, match any active rate plan that includes breakfast
        if (!matchedPlan && (ratePlanName.includes("breakfast") || ratePlanName.includes("bb") || rateCode === "BB")) {
            matchedPlan = opts.ratePlans.find((p: any) => 
                (p.mealsIncluded || p.code === "BB" || (p.name && p.name.toLowerCase().includes("breakfast"))) && Number(p.breakfastRate) > 0
            );
        }
    }

    const planMealsIncluded = matchedPlan ? Boolean(matchedPlan.mealsIncluded || matchedPlan.code === "BB" || matchedPlan.breakfast) : false;

    // Check if entry was already split at booking creation (e.g. labeled with net of breakfast)
    const isPreSplit = desc.includes("net of breakfast") || desc.includes("room charge (net");

    // Check if the booking includes breakfast
    const hasBreakfast = !entry.isCompliment && (
        entry.mealsIncluded === true ||
        entry.hasBreakfast === true ||
        entry.meals?.breakfast === true ||
        planMealsIncluded ||
        rateCode === "BB" ||
        rateCode.includes("BB") ||
        ratePlanName.includes("breakfast") ||
        ratePlanName.includes("bb") ||
        (desc.includes("breakfast") && !isPreSplit) ||
        (desc.includes("sarapan") && !isPreSplit) ||
        (Number(entry.breakfastAmount) > 0)
    );

    if (!hasBreakfast) {
        return {
            hasBreakfast: false,
            breakfastPax: 0,
            breakfastRate: 0,
            breakfastAmount: 0,
            netRoomAmount: totalAmount,
            isPreSplit,
        };
    }

    // Determine Pax
    const breakfastPax = Math.max(
        1,
        Number(entry.breakfastPax || entry.pax || entry.adults || entry.adultCount || (entry.occupancy?.adults) || 1)
    );

    // Determine Dynamic Breakfast Rate per Pax:
    // Priority:
    // 1) Transaction entry's explicit breakfastRate (if saved during booking creation / Channex sync)
    // 2) Matched Rate Plan's breakfastRate configured in Channel Manager
    // 3) Any active breakfast Rate Plan in this hotel's Channel Manager
    // 4) Hotel Settings breakfastRate / defaultBreakfastRate
    // 5) Default fallback (defaultRate or 75.000)
    let breakfastRate = Number(entry.breakfastRate);

    if ((!breakfastRate || breakfastRate <= 0) && matchedPlan && Number(matchedPlan.breakfastRate) > 0) {
        breakfastRate = Number(matchedPlan.breakfastRate);
    }

    if ((!breakfastRate || breakfastRate <= 0) && opts.ratePlans && opts.ratePlans.length > 0) {
        const anyBkfPlan = opts.ratePlans.find((p: any) => 
            (p.mealsIncluded || p.code === "BB" || (p.name && p.name.toLowerCase().includes("breakfast"))) && Number(p.breakfastRate) > 0
        );
        if (anyBkfPlan) {
            breakfastRate = Number(anyBkfPlan.breakfastRate);
        }
    }

    if ((!breakfastRate || breakfastRate <= 0) && Number(opts.hotelBreakfastRate) > 0) {
        breakfastRate = Number(opts.hotelBreakfastRate);
    }

    if (!breakfastRate || breakfastRate <= 0) {
        breakfastRate = opts.defaultRate !== undefined ? opts.defaultRate : 75000;
    }

    // Determine Breakfast Amount
    let breakfastAmount = 0;
    if (isPreSplit) {
        // If already pre-split, entry.amount is ALREADY netRoomAmount
        breakfastAmount = Number(entry.breakfastAmount) || (breakfastPax * breakfastRate);
        return {
            hasBreakfast: true,
            breakfastPax,
            breakfastRate,
            breakfastAmount,
            netRoomAmount: totalAmount,
            isPreSplit: true,
        };
    }

    if (Number(entry.breakfastAmount) > 0) {
        breakfastAmount = Number(entry.breakfastAmount);
    } else {
        const rawBreakfast = breakfastPax * breakfastRate;
        // Cap breakfast so it never exceeds 45% of total room charge (safety against extreme promo discounts)
        breakfastAmount = totalAmount > 0 ? Math.min(rawBreakfast, Math.round(totalAmount * 0.45)) : rawBreakfast;
    }

    const netRoomAmount = Math.max(0, totalAmount - breakfastAmount);

    return {
        hasBreakfast: true,
        breakfastPax,
        breakfastRate,
        breakfastAmount,
        netRoomAmount,
        isPreSplit: false,
    };
}
