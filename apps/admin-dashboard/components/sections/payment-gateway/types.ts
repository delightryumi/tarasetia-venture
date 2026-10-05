export type PaymentProvider = "midtrans" | "xendit" | "doku" | "manual";

export interface ManualBankDetail {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch?: string;
    instructions?: string;
}

export interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
    merchantId?: string;
    enabledChannels: string[]; // e.g. ['gopay', 'qris', 'bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'credit_card']
}

export interface XenditConfig {
    isProduction: boolean;
    secretKey: string;
    publicKey: string;
    enabledChannels: string[]; // e.g. ['QRIS', 'BCA', 'BNI', 'BRI', 'MANDIRI', 'CREDIT_CARD', 'OVO', 'DANA', 'SHOPEEPAY']
}

export interface DokuConfig {
    isProduction: boolean;
    clientId: string; // Mall ID / Client ID
    secretKey: string; // Shared Key / Secret Key
    enabledChannels: string[]; // e.g. ['QRIS', 'VIRTUAL_ACCOUNT_BCA', 'VIRTUAL_ACCOUNT_MANDIRI', 'VIRTUAL_ACCOUNT_BRI', 'VIRTUAL_ACCOUNT_BNI', 'CREDIT_CARD', 'OVO', 'DOKU_WALLET']
}

export interface ManualTransferConfig {
    enabled: boolean;
    banks: ManualBankDetail[];
    paymentInstructions: string;
    confirmationExpiryHours: number; // default 2 hours
}

export interface PricingSettings {
    taxRate: number; // e.g. 10 (PB1)
    serviceRate: number; // e.g. 10 (Service Charge)
    isTaxIncludedInRate: boolean;
    requireFullPayment: boolean;
    downPaymentPercent: number; // e.g. 50%
}

export interface PolicySettings {
    cancellationType: "free_cancellation" | "non_refundable" | "flexible";
    freeCancellationDays: number; // e.g. 1 or 2 days before checkin
    checkInTime: string; // "14:00"
    checkOutTime: string; // "12:00"
    bookingNotes: string;
}

export interface GoogleHotelCenterConfig {
    enabled: boolean;
    hotelPartnerId: string;
    deepLinkFormat: string;
    badgeText: string;
}

// ── 1. Branding & Theme Settings (Burgundy default #6D2B35) ──
export interface BookingEngineThemeSettings {
    themeColor: string; // Default: '#6D2B35' (Burgundy)
    logoUrl: string;
    headerTitle: string;
    hotelWebsiteUrl: string; // Dynamic back button target (e.g. 'https://tentrem.com' or '/')
    guaranteeType: "confirm_booking" | "hold_cc" | "manual_approval";
    incompleteBookingAction: "failed_booking" | "hold_2hours" | "auto_release";
    payAtHotel: boolean;
    payDirectlyToHotel: boolean;
    keepPackagesLocked: boolean;
    requireTermsAcceptance: boolean;
    termsContent: string;
}

// ── 2. Guest Form Preferences & Visibility ──
export interface GuestFieldPreference {
    visible: boolean;
    mandatory: boolean;
}

export interface BookingEnginePreferences {
    address: GuestFieldPreference;
    city: GuestFieldPreference;
    zipCode: GuestFieldPreference;
    state: GuestFieldPreference;
    country: GuestFieldPreference;
    arrivalTime: GuestFieldPreference;
    specialRequests: GuestFieldPreference;
}

// ── 3. Analytics & Conversion Tracking ──
export interface BookingEngineAnalytics {
    ga4Code: string; // e.g. G-XXXXXXXXXX
    gtmCode: string; // e.g. GTM-XXXXXXX
    dataLayerScript: string; // e.g. "Script 6"
    googleAdsCode: string;
    adwordsConversionCode: string;
    facebookPixelId: string;
    customTrackingScript: string;
}

// ── 4. Direct Booking Promotions & Voucher Suite ──
export interface BookingEnginePromoCode {
    id: string;
    code: string; // e.g. DIRECT10, STAYCATION
    name: string;
    discountPercent: number; // e.g. 10
    discountType: "percentage" | "fixed";
    discountAmount?: number;
    minSpend?: number;
    validFrom?: string;
    validTo?: string;
    isActive: boolean;
    description?: string;
}

export interface DirectBookingPerk {
    id: string;
    title: string;
    icon: string;
    isActive: boolean;
}

export interface PaymentGatewaySettings {
    enabled: boolean;
    activeProvider: PaymentProvider;
    theme: BookingEngineThemeSettings;
    preferences: BookingEnginePreferences;
    analytics: BookingEngineAnalytics;
    promotions: BookingEnginePromoCode[];
    directPerks: DirectBookingPerk[];
    midtrans: MidtransConfig;
    xendit: XenditConfig;
    doku: DokuConfig;
    manualTransfer: ManualTransferConfig;
    pricing: PricingSettings;
    policies: PolicySettings;
    googleHotelCenter: GoogleHotelCenterConfig;
    updatedAt?: string;
    updatedBy?: string;
}

export const DEFAULT_PAYMENT_GATEWAY_SETTINGS: PaymentGatewaySettings = {
    enabled: true,
    activeProvider: "manual",
    theme: {
        themeColor: "#6D2B35", // Burgundy Luxury Default
        logoUrl: "",
        headerTitle: "",
        hotelWebsiteUrl: "/",
        guaranteeType: "confirm_booking",
        incompleteBookingAction: "failed_booking",
        payAtHotel: false,
        payDirectlyToHotel: false,
        keepPackagesLocked: true,
        requireTermsAcceptance: true,
        termsContent: "Tamu wajib menunjukkan identitas resmi (KTP/Paspor) saat check-in. Pembatalan gratis berlaku sesuai kebijakan tarif yang dipilih.",
    },
    preferences: {
        address: { visible: true, mandatory: false },
        city: { visible: true, mandatory: false },
        zipCode: { visible: false, mandatory: false },
        state: { visible: false, mandatory: false },
        country: { visible: true, mandatory: false },
        arrivalTime: { visible: true, mandatory: true },
        specialRequests: { visible: true, mandatory: false },
    },
    analytics: {
        ga4Code: "",
        gtmCode: "",
        dataLayerScript: "Script 6",
        googleAdsCode: "",
        adwordsConversionCode: "",
        facebookPixelId: "",
        customTrackingScript: "",
    },
    promotions: [],
    directPerks: [
        { id: "perk-1", title: "Jaminan Harga Resmi Bebas Komisi OTA 0%", icon: "ShieldCheck", isActive: true },
        { id: "perk-2", title: "Konfirmasi Instan Terhubung ke Front Desk", icon: "Sparkles", isActive: true },
        { id: "perk-3", title: "Mendukung QRIS, Multi-Bank VA & Kartu Kredit", icon: "CreditCard", isActive: true },
    ],
    midtrans: {
        isProduction: false,
        serverKey: "",
        clientKey: "",
        merchantId: "",
        enabledChannels: ["qris", "gopay", "bca_va", "bni_va", "bri_va", "mandiri_va", "credit_card"],
    },
    xendit: {
        isProduction: false,
        secretKey: "",
        publicKey: "",
        enabledChannels: ["QRIS", "BCA", "BNI", "BRI", "MANDIRI", "CREDIT_CARD"],
    },
    doku: {
        isProduction: false,
        clientId: "",
        secretKey: "",
        enabledChannels: ["QRIS", "VIRTUAL_ACCOUNT_BCA", "VIRTUAL_ACCOUNT_MANDIRI", "VIRTUAL_ACCOUNT_BRI", "VIRTUAL_ACCOUNT_BNI", "CREDIT_CARD", "OVO", "DOKU_WALLET"],
    },
    manualTransfer: {
        enabled: true,
        banks: [],
        paymentInstructions: "Silakan transfer ke rekening resmi hotel berikut sebelum batas waktu konfirmasi berakhir.",
        confirmationExpiryHours: 2,
    },
    pricing: {
        taxRate: 10,
        serviceRate: 10,
        isTaxIncludedInRate: false,
        requireFullPayment: true,
        downPaymentPercent: 50,
    },
    policies: {
        cancellationType: "flexible",
        freeCancellationDays: 1,
        checkInTime: "14:00",
        checkOutTime: "12:00",
        bookingNotes: "Check-in lebih awal atau check-out terlambat bergantung pada ketersediaan kamar dan dapat dikenakan biaya tambahan.",
    },
    googleHotelCenter: {
        enabled: true,
        hotelPartnerId: "",
        deepLinkFormat: "/book/{hotelCode}?checkin={checkin}&checkout={checkout}&adults={adults}&children={children}",
        badgeText: "Situs Resmi",
    },
};
