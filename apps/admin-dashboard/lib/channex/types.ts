/**
 * Channex.io Data Models & Integration Types for My Tara PMS (Multi-Hotel CRS)
 */

export interface ChannexProperty {
    id: string;
    title: string;
    currency: string;
    timezone: string;
    email?: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
    zip_code?: string;
}

export interface ChannexRoomType {
    id: string;
    property_id: string;
    title: string;
    count_of_rooms: number;
    occ_adults: number;
    occ_children?: number;
    occ_infants?: number;
    default_occupancy?: number;
    room_kind?: string;
    capacity?: number;
}

export interface ChannexRatePlan {
    id: string;
    property_id: string;
    room_type_id: string;
    title: string;
    currency: string;
    rate_mode?: "manual" | "derived" | "auto";
    parent_rate_plan_id?: string;
    options?: Array<{
        occupancy: number;
        rate: number;
        is_primary?: boolean;
    }>;
    meals?: {
        breakfast?: boolean;
        lunch?: boolean;
        dinner?: boolean;
        all_inclusive?: boolean;
    };
    cancellation_policy?: {
        type?: "free" | "non_refundable" | "deadline";
        deadline_days?: number;
    };
    derived_options?: {
        rate_mode?: "increase" | "decrease";
        rate_type?: "percent" | "amount";
        rate_value?: number;
    };
}

export interface ChannexAvailabilityValue {
    property_id: string;
    room_type_id: string;
    date?: string;
    date_from?: string;
    date_to?: string;
    availability: number;
}

export interface ChannexAvailabilityPayload {
    values: ChannexAvailabilityValue[];
}

export interface ChannexRestrictionValue {
    property_id: string;
    rate_plan_id: string;
    date?: string;
    date_from?: string;
    date_to?: string;
    days?: Array<"mo" | "tu" | "we" | "th" | "fr" | "sa" | "su">;
    rate?: number | string;
    rates?: Array<{
        occupancy: number;
        rate: number;
    }>;
    min_stay_arrival?: number;
    min_stay_through?: number;
    min_stay?: number;
    max_stay?: number;
    closed_to_arrival?: boolean;
    closed_to_departure?: boolean;
    stop_sell?: boolean;
}

export interface ChannexRestrictionsPayload {
    values: ChannexRestrictionValue[];
}

export interface ChannexBookingCustomer {
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    zip_code?: string;
    notes?: string;
    company?: string;
}

export interface ChannexBookingDayRate {
    date: string;
    amount: string | number;
}

export interface ChannexBookingRoom {
    id?: string;
    room_type_id: string;
    rate_plan_id?: string;
    occupancy?: number;
    checkin_date?: string;
    checkout_date?: string;
    days?: ChannexBookingDayRate[];
    amount?: string | number;
    guest_name?: string;
    room_number?: string;
    adults?: number;
    children?: number;
}

export interface ChannexBooking {
    id: string;
    property_id: string;
    channel_id?: string;
    channel_name?: string;
    channel_booking_id?: string;
    ota_reservation_code?: string;
    status: "new" | "modified" | "cancelled" | "confirmed";
    arrival_date: string;
    departure_date: string;
    total_price: string | number;
    currency: string;
    payment_type?: "channel_collect" | "hotel_collect" | "virtual_card";
    payment_collect?: string;
    customer?: ChannexBookingCustomer;
    guest?: ChannexBookingCustomer;
    rooms: ChannexBookingRoom[];
    notes?: string;
    inserted_at?: string;
    updated_at?: string;
}

export type ChannexWebhookEventType =
    | "booking"
    | "booking_new"
    | "booking_modification"
    | "booking_cancellation"
    | "booking_unmapped_room"
    | "booking_unmapped_rate"
    | "ari"
    | "sync_error"
    | "sync_warning"
    | "rate_error";

export interface ChannexWebhookPayload {
    event: ChannexWebhookEventType;
    property_id?: string;
    booking_revision_id?: string;
    booking?: ChannexBooking;
    data?: any;
    inserted_at?: string;
    unmapped_details?: any;
    message?: any;
    review?: any;
    is_simulation?: boolean;
}

export interface MyTaraRatePlan {
    id: string;
    hotelCode: string;
    name: string;
    code: string;
    roomTypeId: string;
    roomTypeName: string;
    baseRate: number;
    currency: string;
    mealsIncluded: boolean;
    cancellationPolicy: "FREE" | "NON_REFUNDABLE" | "MODERATE";
    minStay: number;
    stopSell: boolean;
    channexRatePlanId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoomTypeInfo {
    id: string;
    name: string;
    code: string;
    totalRooms: number;
    basePrice: number;
    channexRoomTypeId?: string;
    physicalRooms?: string[];
}

export interface ChannexHotelSettings {
    hotelCode: string;
    channexPropertyId?: string;
    apiKeyOverride?: string;
    webhookSecret?: string;
    isSyncActive: boolean;
    lastSyncAt?: string;
    lastSyncStatus?: "SUCCESS" | "FAILED" | "PENDING";
    lastSyncMessage?: string;
    connectedChannels?: Array<{
        id: string;
        title: string;
        code: string;
        isActive: boolean;
    }>;
}

// ── Separated Rate & Allotment per OTA Types ──
export type ChannelSeparationMode = "merged" | "separated_rate" | "separated_allotment" | "separated_both";

export interface ChannelRateOverride {
    rate?: number;
    extraAdultRate?: number;
    extraChildRate?: number;
    stopSell?: boolean;
    isCustom?: boolean; // true if overridden manually, false if derived
}

export interface ChannelAllotmentOverride {
    allotmentLimit?: number; // max_availability cap for this channel
    stopSell?: boolean; // channel close_out
    isCustom?: boolean;
}

export interface ChannelDayOverrides {
    rates?: Record<string, ChannelRateOverride>; // ratePlanId -> override
    allotments?: Record<string, ChannelAllotmentOverride>; // roomTypeId -> override
    stopSell?: boolean; // Channel Master Stop Sell
}

export interface DayAriOverrideDocument {
    rates?: Record<string, number>; // ratePlanId -> base rate
    extraAdultRates?: Record<string, number>;
    extraChildRates?: Record<string, number>;
    stopsell?: Record<string, boolean>; // ratePlanId -> stopSell
    availabilityOverrides?: Record<string, number>; // roomTypeId -> physical count
    channels?: Record<string, ChannelDayOverrides>; // channelCode -> specific overrides
    updatedAt?: string;
    updatedBy?: string;
}

// ── Advanced Channex Integration Models ──
export interface GoogleHotelConfig {
    isEnabled: boolean;
    googleHotelCenterId?: string;
    status: "ACTIVE" | "PENDING" | "DISCONNECTED";
    landingPageUrl?: string;
    currency: string;
    taxPolicy: "inclusive" | "exclusive";
    lastSyncAt?: string;
    totalDirectClicks?: number;
}

export interface DynamicPricingConfig {
    provider: "pricelabs" | "roompricegenie" | "beyond" | "custom";
    isEnabled: boolean;
    apiKey?: string;
    propertyId?: string;
    minRateGuardrail?: number;
    maxRateGuardrail?: number;
    autoPushToChannex: boolean;
    lastSyncAt?: string;
    lastSyncStatus?: "SUCCESS" | "ERROR";
    syncNotes?: string;
}

export interface OtaPromotionConfig {
    id: string;
    title: string;
    channelCode: "airbnb" | "booking_com" | "agoda" | "expedia";
    promoType: "mobile_only" | "high_rated_guest" | "last_minute" | "early_bird" | "los";
    discountPercent: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    applicableRoomTypeIds: string[]; // "all" or specific room types
    minLos?: number;
    daysAdvance?: number;
}

export interface StripeTokenizationConfig {
    isEnabled: boolean;
    stripePublishableKey?: string;
    accountStatus: "CONNECTED" | "NOT_CONFIGURED" | "RESTRICTED";
    autoPreAuthOnBooking: boolean;
    autoCaptureOnCheckin: boolean;
    pciComplianceLevel: string;
    lastTokenizedAt?: string;
}

