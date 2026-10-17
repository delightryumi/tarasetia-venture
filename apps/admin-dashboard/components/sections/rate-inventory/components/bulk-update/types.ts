import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
import { BulkUpdateParams, BulkUpdateItem } from "../../RateInventoryTypes";

export type BulkUpdateMetricType =
    | "rate"
    | "inventory"
    | "stopsell"
    | "minstay_through"
    | "minstay_arrival"
    | "maxstay"
    | "cta"
    | "ctd";

export interface MetricDefinition {
    id: BulkUpdateMetricType;
    label: string;
    description: string;
    category: "price" | "inventory" | "restriction";
    requiresRatePlan: boolean;
    requiresRoomType: boolean;
    icon: string;
}

export interface BulkRuleState {
    id: string;
    title: string;
    // Step 1: Metric targets
    selectedMetrics: BulkUpdateMetricType[];
    roomTypeIds: string[]; // ["all"] or specific IDs
    ratePlanIds: string[]; // ["all"] or specific IDs
    channelId: string; // "all" or specific channel

    // Step 2: Date & Day ranges
    dateFrom: string;
    dateTo: string;
    daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat

    // Step 3: Values & Actions (Channex Standard)
    rateAction: "none" | "set" | "inc_amount" | "dec_amount" | "inc_percent" | "dec_percent";
    rateValueStr: string;
    rateValue: number;

    inventoryAction: "none" | "set";
    inventoryValue: number;

    // Channex standard boolean restrictions (true / false / none)
    stopSellAction: "none" | "open" | "close" | "true" | "false";
    stopSell?: boolean;

    minStayThroughAction: "none" | "set" | "remove";
    minStayThroughValue: number;

    minStayArrivalAction: "none" | "set" | "remove";
    minStayArrivalValue: number;

    maxStayAction: "none" | "set" | "remove";
    maxStayValue: number;

    ctaAction: "none" | "open" | "close" | "true" | "false";
    closedToArrival?: boolean;

    ctdAction: "none" | "open" | "close" | "true" | "false";
    closedToDeparture?: boolean;
}

export type BulkStepId =
    | "targets_values"
    | "review_apply"
    | "metrics_select"
    | "date_ranges"
    | "days_channels";

export interface BulkStepConfig {
    id: BulkStepId;
    stepNumber: number;
    title: string;
    subtitle: string;
    shortLabel: string;
}

export interface BulkUpdateViewProps {
    onClose: () => void;
    onApply: (params: BulkUpdateParams) => Promise<void>;
    roomTypes: RoomTypeInfo[];
    ratePlans: MyTaraRatePlan[];
    channelConfigs?: Record<string, any>;
    saving: boolean;
    defaultStartDate?: string;
    canStopSell?: boolean;
    canChangeRate?: boolean;
    canChangeInventory?: boolean;
    activeHotelName?: string;
    activeHotelCode?: string;
}
