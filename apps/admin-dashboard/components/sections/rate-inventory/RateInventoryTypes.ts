"use client";

import { ChannelSeparationMode } from "@/lib/channex/types";
export type { ChannelSeparationMode };

export type RateInventoryTab =
    | "inventory"          // 1. Availability / Room Allotment
    | "rates"              // 2. Base Room Rates
    | "minstay_arrival"    // 3. Min Stay Arrival
    | "minstay_through"    // 4. Min Stay Through
    | "maxstay"            // 5. Max Stay
    | "cta"                // 6. Closed to Arrival
    | "ctd"                // 7. Closed to Departure
    | "stopsell"           // 8. Stop Sell
    | "minstay"            // Legacy fallback alias
    | "logs"
    | "custom";

export type GridFeatureId =
    | "availability"
    | "rate"
    | "minStayThrough"
    | "minStayArrival"
    | "maxStay"
    | "closedToArrival"
    | "closedToDeparture"
    | "stopSell";

export interface GridFeatureConfig {
    id: GridFeatureId;
    label: string;
}

export const GRID_FEATURES: GridFeatureConfig[] = [
    { id: "availability", label: "Availability" },
    { id: "rate", label: "Rate" },
    { id: "minStayThrough", label: "Min Stay Through" },
    { id: "minStayArrival", label: "Min Stay Arrival" },
    { id: "maxStay", label: "Max Stay" },
    { id: "closedToArrival", label: "Closed To Arrival" },
    { id: "closedToDeparture", label: "Closed To Departure" },
    { id: "stopSell", label: "Stop Sell" }
];

export interface DayInventoryStatus {
    date: string; // YYYY-MM-DD
    dayName: string; // Sat, Sun, Mon, etc.
    dayNumber: string; // 12
    monthName: string; // Sep
    isWeekend: boolean;
    totalRooms: number;
    bookedRooms: number;
    availableRooms: number;
    occupancyPercent: number;
    stopSell: boolean;
    minStay?: number;
    minStayArrival?: number;
    minStayThrough?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
    rate: number;
    extraAdultRate: number;
    extraChildRate: number;
    isChannelCustom?: boolean;
    isCapped?: boolean;
}

export interface RatePlanGridRow {
    ratePlanId: string;
    ratePlanName: string;
    ratePlanCode: string;
    roomTypeId: string;
    roomTypeName: string;
    mealsIncluded: boolean;
    currency: string;
    baseRate: number;
    isDerived?: boolean;
    days: Record<string, DayInventoryStatus>;
}

export interface RoomTypeInventoryRow {
    roomTypeId: string;
    roomTypeName: string;
    roomTypeCode: string;
    totalPhysicalRooms: number;
    basePrice: number;
    days: Record<string, DayInventoryStatus>;
    ratePlans: RatePlanGridRow[];
}

export interface BulkUpdateItem {
    id: string;
    roomTypeId: string;
    ratePlanId: string;
    dateFrom: string;
    dateTo: string;
    daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    channelId?: string;
    rateAction?: "none" | "set" | "inc_amount" | "dec_amount" | "inc_percent" | "dec_percent";
    rateValue?: number;
    stopSellAction?: "none" | "open" | "close";
    inventoryAction?: "none" | "set";
    inventoryValue?: number;
    minStayAction?: "none" | "set" | "remove";
    minStayValue?: number;
    minStayArrivalAction?: "none" | "set" | "remove";
    minStayArrivalValue?: number;
    minStayThroughAction?: "none" | "set" | "remove";
    minStayThroughValue?: number;
    maxStayAction?: "none" | "set" | "remove";
    maxStayValue?: number;
    ctaAction?: "none" | "open" | "close";
    ctdAction?: "none" | "open" | "close";
}

export interface BulkUpdateParams {
    mode?: "single" | "multi";
    items?: BulkUpdateItem[];
    dateFrom?: string;
    dateTo?: string;
    daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    roomTypeIds?: string[]; // empty or ["all"] means all
    ratePlanIds?: string[]; // empty or ["all"] means all
    channelId?: string;
    rateAction?: "none" | "set" | "inc_amount" | "dec_amount" | "inc_percent" | "dec_percent";
    rateValue?: number;
    stopSellAction?: "none" | "open" | "close";
    inventoryAction?: "none" | "set";
    inventoryValue?: number;
    minStayAction?: "none" | "set" | "remove"; // legacy unified
    minStayValue?: number;
    minStayArrivalAction?: "none" | "set" | "remove";
    minStayArrivalValue?: number;
    minStayThroughAction?: "none" | "set" | "remove";
    minStayThroughValue?: number;
    maxStayAction?: "none" | "set" | "remove";
    maxStayValue?: number;
    ctaAction?: "none" | "open" | "close";
    ctdAction?: "none" | "open" | "close";
}

