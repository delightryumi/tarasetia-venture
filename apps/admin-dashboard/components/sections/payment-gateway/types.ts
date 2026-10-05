export type PaymentProvider = "midtrans" | "xendit" | "manual";

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

export interface PaymentGatewaySettings {
    enabled: boolean;
    activeProvider: PaymentProvider;
    midtrans: MidtransConfig;
    xendit: XenditConfig;
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
    manualTransfer: {
        enabled: true,
        banks: [
            {
                id: "bca-1",
                bankName: "BCA",
                accountNumber: "",
                accountHolder: "",
                branch: "Cabang Utama",
                instructions: "Mohon transfer sesuai nominal reservasi dan upload bukti transfer melalui link konfirmasi.",
            },
        ],
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
