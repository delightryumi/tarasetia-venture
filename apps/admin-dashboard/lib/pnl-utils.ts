"use client";

export interface PnlIncomeItem {
  id?: string;
  name: string;
  amount: number;
  category?: string;
  paymentStatus?: string;
  date?: string;
}

export interface PnlExpenseItem {
  id?: string;
  name: string;
  amount: number;
  allocation?: "SHARED" | "MANAGEMENT";
  fbCategory?: string | null;
  eventCategory?: string | null;
  department?: string | null;
  date?: string;
  category?: string;
  description?: string;
}

export interface InvestorItem {
  id?: string;
  name: string;
  share: number;
  amount?: number;
  isFixed?: boolean;
  percentage?: number; // Some parts use percentage instead of share
}

export interface GlobalPnLResult {
  card1_TotalRevenue: number;
  card2_NonCommRevenue: number;
  card3_RevHotelCollect: number;
  card3_RevNexuraCollect: number;
  card4_PenaltyFee: number;
  card5_OtherRevenue: number;
  card6_GOP: number;
  card7_TotalGOP: number;
  card8_TotalExpenses: number;
  card9_FeeGross: number;
  card9_FeeGrossRoom?: number;
  card9_FeeGrossFnb?: number;
  card10_GAP: number;
  card11_VAT: number;
  card12_ReconOwner: number;
  revRoom?: number;
  revFoodAlacarte?: number;
  revBeverageAlacarte?: number;
  revBanquetRevenue?: number;
  revTotalFnb?: number;
  
  expHousekeeping?: number;
  expAlacarte?: number;
  expBanquet?: number;
  expOperational?: number;    // Front Office + Purchasing + Other (excl. HK & F&B)
  expFood?: number;
  expBeverage?: number;
  expFoodAlacarte?: number;
  expBeverageAlacarte?: number;
  expFoodBanquet?: number;
  expBeverageBanquet?: number;

  posGrossRevenue?: number;
  posNettRevenue?: number;
  posServiceCharge?: number;
  posTaxAmount?: number;
  posLostBreakageAmount?: number;
  posTotalServiceTax?: number;
  posServiceRate?: number;
  posTaxRateIndividual?: number;
  posLostBreakageRate?: number;
  posTaxRateCombined?: number;

  summaryServiceCharge?: number;
  summaryLostBreakage?: number;
  summaryServiceChargeRate?: number;
  summaryLostBreakageRate?: number;
  
  netProfit: number;
  gopBasis: number;
  gopFee: number;
  totalGap: number;
  investorDistributions: {
    name: string;
    amount: number;
    share: number;
  }[];
  revAlacarte?: number;
  revBanquet?: number;
  revFood?: number;
  revBeverage?: number;
}

export interface PnLDetailedItem {
  id: string;
  type: string;
  source: string;
  description: string;
  amount: number;
  date: string;
  department?: string | null;
  documentId?: string;
  docType?: string;
  category?: string;
  discount?: number;
}

export interface DrillDownData {
  title: string;
  items: PnLDetailedItem[];
}

export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};
