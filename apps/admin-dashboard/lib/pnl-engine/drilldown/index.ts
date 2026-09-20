import { PnlIncomeItem, PnlExpenseItem, DrillDownData } from "../../pnl-utils";
import { ExtendedTransaction } from "../types";

export interface DrillDownContext {
  rawTransactions: ExtendedTransaction[];
  customIncomes: PnlIncomeItem[];
  expenses: PnlExpenseItem[];
  posOrders: any[];
  vatPercentage: number;
  mgmtFeePercentage: number;
  serviceChargePercentage: number;
  lostBreakagePercentage: number;
  payrollDetails?: any[];
  pnlResult?: any;
  ratePlans?: any[];
  hotelBreakfastRate?: number;
}

import { getRevenueDrillDown } from './revenue';
import { getFnbDrillDown } from './fnb';
import { getExpenseDrillDown } from './expenses';
import { getProfitDrillDown } from './profit';
import { getOtherDrillDown } from './other';

export function getDrillDownData(
  cardId: string,
  rawTransactions: ExtendedTransaction[],
  customIncomes: PnlIncomeItem[],
  expenses: PnlExpenseItem[],
  posOrders: any[] = [],
  vatPercentage: number = 0,
  mgmtFeePercentage: number = 0,
  serviceChargePercentage: number = 0,
  lostBreakagePercentage: number = 0,
  payrollDetails: any[] = [],
  pnlResult?: any,
  ratePlans: any[] = [],
  hotelBreakfastRate?: number
): DrillDownData {
  let items: any[] = [];
  let title = cardId;

  let normalizedCardId = cardId;
  if (cardId.startsWith("VAT Input")) normalizedCardId = "VAT Input";
  else if (cardId.startsWith("Service Charge")) normalizedCardId = "Service Charge";
  else if (cardId.startsWith("Lost & Breakage")) normalizedCardId = "Lost & Breakage";
  else if (cardId.startsWith("Management Fee")) normalizedCardId = "Management Fee";
  else if (cardId === "Total Room Revenue" || cardId === "Room Revenue" || cardId === "Revenue Room") normalizedCardId = "Total Room Revenue";
  else if (cardId === "Revenue Cash in Hotel" || cardId === "Revenue Hotel Collect") normalizedCardId = "Revenue Cash in Hotel";
  else if (cardId === "Room Revenue Transfer/EDC/QRIS" || cardId === "Revenue Online/Transfer Collect" || cardId === "Revenue Nexura Collect") normalizedCardId = "Room Revenue Transfer/EDC/QRIS";
  else if (cardId === "OTA Revenue") normalizedCardId = "OTA Revenue";
  else if (cardId === "Total Banquet Revenue") normalizedCardId = "Banquet Revenue";
  else if (cardId === "Compliment Deductions") normalizedCardId = "Compliment Deductions";
  else if (cardId === "OCC" || cardId === "ARR" || cardId === "RevPAR") normalizedCardId = "Total Room Revenue";
  else if (cardId.toLowerCase().includes("pomec") || cardId.toLowerCase().includes("maintenance")) normalizedCardId = "POMEC / Maintenance Expenses";

  const ctx: DrillDownContext = {
    rawTransactions,
    customIncomes,
    expenses,
    posOrders,
    vatPercentage,
    mgmtFeePercentage,
    serviceChargePercentage,
    lostBreakagePercentage,
    payrollDetails,
    pnlResult,
    ratePlans,
    hotelBreakfastRate
  };
  
  let result = getRevenueDrillDown(normalizedCardId, ctx);
  if (result) { items = result; }
  else {
    result = getFnbDrillDown(normalizedCardId, ctx);
    if (result) { items = result; }
    else {
      result = getExpenseDrillDown(normalizedCardId, ctx);
      if (result) { items = result; }
      else {
        result = getProfitDrillDown(normalizedCardId, ctx);
        if (result) { items = result; }
        else {
          result = getOtherDrillDown(normalizedCardId, ctx);
          if (result) { items = result; }
          else {
            // Default: Return all custom incomes for unhandled card IDs, or handle other types
            items = customIncomes.map(i => ({
              id: i.id || Math.random().toString(),
              type: 'income',
              source: 'custom_income',
              description: i.name,
              amount: i.amount,
              date: i.date || 'N/A',
              category: i.category
            }));
          }
        }
      }
    }
  }

  return {
    title: title,
    items: items,
  };
}
