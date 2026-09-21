"use client";

import { ChannelSeparationMode } from "@/lib/channex/types";
export type { ChannelSeparationMode };

export type RateInventoryTab =
    | "inventory"
    | "rates"
    | "stopsell"
    | "minstay"
    | "cta"
    | "ctd";

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

export interface BulkUpdateParams {
    dateFrom: string;
    dateTo: string;
    daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    roomTypeIds: string[]; // empty or ["all"] means all
    ratePlanIds: string[]; // empty or ["all"] means all
    channelId?: string;
    rateAction: "none" | "set" | "inc_amount" | "dec_amount" | "inc_percent" | "dec_percent";
    rateValue?: number;
    stopSellAction: "none" | "open" | "close";
    inventoryAction: "none" | "set";
    inventoryValue?: number;
    minStayAction?: "none" | "set" | "remove";
    minStayValue?: number;
    ctaAction?: "none" | "open" | "close";
    ctdAction?: "none" | "open" | "close";
}
