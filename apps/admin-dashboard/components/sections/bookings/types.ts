export type BookingStatusFilter = "ALL" | "CONFIRMED" | "CHECKED_OUT" | "CANCELLED";
export type ViewMode = "grid" | "list";

export interface BookingRecord {
    id: string;                      // Canonical identifier (bookingId / reservationId / channexBookingId)
    bookingId: string;
    reservationId: string;
    otaReservationId: string;
    revisionId: string;
    voucherCode: string;
    
    // Guest information
    guestName: string;
    phone?: string;
    email?: string;
    address?: string;
    nationality?: string;

    // Channel / Source
    channel: string;
    otaName: string;
    channelLogo: string;
    connectionChannel?: string;
    isOTA?: boolean;

    // Stay dates & room
    checkInDate: string;
    checkOutDate: string;
    effectiveDate: string;
    bookingDate: string;             // Created / Timestamp date (YYYY-MM-DD)
    timestamp: string;
    nights: number;
    roomType: string;
    roomTypeId?: string;
    roomNumber: string;
    pax: number;
    adults?: number;
    ratePlanName?: string;
    rateCode?: string;
    hasBreakfast: boolean;
    breakfastPax?: number;

    // Financials
    amount: number;                  // Net or recorded room revenue
    totalAmount: number;             // Total booking price
    grossAmount: number;             // Full gross guest price
    netToHotel: number;              // Net to hotel after OTA commission
    otaCommissionPercent?: number;
    otaCommissionAmount?: number;
    otaPromoAmount?: number;
    totalDeductionAmount?: number;
    breakfastAmount?: number;

    // Payment details
    paymentMethod: string;
    paymentCollect: "channel" | "property" | string;
    paymentStatus: string;           // Lunas, Belum Bayar, CANCELLED, Pending, Partial
    paidCash?: number;
    paidTransfer?: number;
    paidOta?: number;
    paidEdc?: number;
    paidQris?: number;

    // Status
    status: "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "PENDING" | string;
    guestStatus?: string;
    isCancelled: boolean;
    cancelReason?: string;
    note?: string;
    staffName?: string;
    propertyName?: string;

    // Origin doc reference
    _docId?: string;
    _datesOccurred: string[];
}

export interface BookingStatsSummary {
    totalBookings: number;
    confirmedCount: number;
    checkedInCount: number;
    checkedOutCount: number;
    cancelledCount: number;
    totalGrossRevenue: number;
    totalNetRevenue: number;
    totalNights: number;
}
