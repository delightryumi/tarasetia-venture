export type ClientType = "CORPORATE" | "GOVERNMENT" | "GROUP" | "FIT" | "TRAVEL_AGENT";

export type ConfirmationLetterStatus = "DRAFT" | "SENT" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type LetterStatus = ConfirmationLetterStatus;

export type GuaranteeStatus = "GUARANTEED" | "NON_GUARANTEED" | "TENTATIVE";

export type MealPlanCode = "RO" | "BB" | "HB" | "FB";

export interface RoomLineItem {
    id?: string;
    roomTypeId?: string;
    roomTypeName: string;
    bedType?: "King Bed" | "Twin Bed" | "Double" | "Single" | "Triple / Extra Bed" | string;
    occupancyType?: "Single" | "Twin" | "Double" | "Triple";
    roomCount: number;
    quantity?: number;
    nights: number;
    ratePerNight: number;
    nightlyRate?: number;
    mealPlan?: MealPlanCode;
    mealPlanCode?: MealPlanCode;
    includesBreakfast?: boolean;
    breakfastPax?: number;
    inclusions?: string;
    subtotal: number;
    totalAmount?: number;
}

export interface MeetingPackageItem {
    id?: string;
    packageName: string;
    name?: string;
    roomName?: string;
    setupStyle?: "Classroom" | "U-Shape" | "Theater" | "Round Table / Banquet" | "Boardroom" | "Hollow Square" | string;
    roomSetup?: string;
    pax: number;
    days: number;
    ratePerPax: number;
    inclusions?: string;
    subtotal: number;
    totalAmount?: number;
}

export interface ExtraChargeItem {
    id?: string;
    description: string;
    amount: number;
}

export interface PaymentTerms {
    billingArrangement: string;
    method?: "Bill to Company (BTC)" | "Corporate SPK / Surat Tugas" | "Bank Transfer" | "Credit Card" | "Direct Payment" | string;
    masterAccountBilling?: string;
    personalIncidentalBilling?: string;
    depositAmount?: number;
    depositDueDate?: string;
    balanceDueDate?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    billingNotes?: string;
}

export interface Signatory {
    name: string;
    title: string;
    phone?: string;
    email?: string;
}

export interface ConfirmationLetter {
    id?: string;
    hotelId: string;
    letterNumber: string;
    letterDate: string;
    status: ConfirmationLetterStatus;
    guaranteeStatus?: GuaranteeStatus;
    clientType: ClientType;
    clientName: string;
    clientAddress?: string;
    
    // Contact Person / PIC Booker
    contactPerson: string;
    picName?: string;
    picTitle?: string;
    contactPhone: string;
    picPhone?: string;
    phone?: string;
    contactEmail?: string;
    picEmail?: string;
    email?: string;

    // Corporate & Government Details
    npwp?: string;
    spkNumber?: string;
    eventName?: string;

    // Dates & Times (Hotel Standard)
    checkInDate: string;
    checkInTime?: string;
    checkOutDate: string;
    checkOutTime?: string;
    cutOffDate?: string;
    roomingListCutOff?: string;
    roomingListCutOffDate?: string;
    incidentalDepositPerRoom?: number;
    incidentalDepositPolicy?: string;
    totalNights?: number;
    totalPax?: number;
    totalGuests?: number;

    // Tables
    rooms: RoomLineItem[];
    meetingPackages: MeetingPackageItem[];
    extraCharges?: ExtraChargeItem[];

    // Billing, Terms & Signatures
    paymentTerms: PaymentTerms;
    termsAndConditions?: string[];
    signatoryHotel: Signatory;
    hotelSignatory?: Signatory;
    signatoryClient: Signatory;
    clientSignatory?: Signatory;

    // Totals & Financials
    taxRate?: number;
    serviceRate?: number;
    subtotal: number;
    taxAmount?: number;
    serviceAmount?: number;
    grandTotal: number;
    notes?: string;

    createdAt?: string;
    updatedAt?: string;
}

export interface HotelBranding {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    logoUrl?: string;
    lightLogo?: string;
    darkLogo?: string;
    logoLight?: string;
    logoDark?: string;
    logo?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    starRating?: number;
}
