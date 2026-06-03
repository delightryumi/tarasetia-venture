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
  lostBreakagePercentage: number = 0
): DrillDownData {
  let items: any[] = [];
  let title = cardId;

  let normalizedCardId = cardId;
  if (cardId.startsWith("VAT Input")) normalizedCardId = "VAT Input";
  else if (cardId.startsWith("Service Charge")) normalizedCardId = "Service Charge";
  else if (cardId.startsWith("Lost & Breakage")) normalizedCardId = "Lost & Breakage";
  else if (cardId.startsWith("Management Fee")) normalizedCardId = "Management Fee";
  else if (cardId === "Room Revenue") normalizedCardId = "Revenue Room";
  else if (cardId === "Total Banquet Revenue") normalizedCardId = "Banquet Revenue";

  const ctx: DrillDownContext = { rawTransactions, customIncomes, expenses, posOrders, vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage };
  
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
