"use client";

import { 
  GlobalPnLResult, 
  PnlIncomeItem, 
  PnlExpenseItem, 
  InvestorItem,
  DrillDownData
} from "../pnl-utils";

export interface ExtendedTransaction {
  amount: number;
  paidCash: number;
  paidTransfer: number;
  feePercentage: number;
  status: string;
  channel: string;
  penaltyType: string;
  penaltyAmount: number;
  penaltyMethod?: string;
  propertyId: string;
  date: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  bookingId: string;
  paymentStatus?: string;
  type?: string;
}

export interface HotelMaster {
  id: string;
  name: string;
  /** Number of rooms for the hotel */
  roomCount?: number;
}

export interface PropertyStat {
  id: string;
  name: string;
  gross: number;
  payAtHotel: number;
  fee: number;
  penalty: number;
  nett: number;
  gap: number;
}

export interface PnLCalculationResult {
  pnlResult: GlobalPnLResult;
  propertyStats: PropertyStat[];
  sharedExpensesTotal: number;
  mgmtExpensesTotal: number;
  totalNonComm: number;
  totalGOP: number;
  totalRevenueHotelCollect: number;
  finalMgmtNet: number;
  feeForGOP: number;
}
