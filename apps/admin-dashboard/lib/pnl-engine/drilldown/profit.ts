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

export function getProfitDrillDown(cardId: string, ctx: DrillDownContext): any[] | null {
  let items: any[] = [];
  const { rawTransactions, customIncomes, expenses, posOrders, vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage } = ctx;

  switch (cardId) {
    case "Total GOP":
      {
        const isAccommodation = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
        };
        const isFOOtherIncome = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && !isAccommodation(t);
        };
        const isFnbOrBanquetCustomIncome = (i: PnlIncomeItem) => {
          const cat = (i.category || "").toLowerCase();
          const name = (i.name || "").toLowerCase();
          const isFnb = (cat.includes("food") || cat.includes("beverage")) && !name.includes("banquet") && !cat.includes("banquet");
          const isBanquet = name.includes("banquet") || cat.includes("banquet");
          return isFnb || isBanquet;
        };

        const roomRev = rawTransactions
          .filter(isAccommodation)
          .map(t => ({
            id: t.bookingId || Math.random().toString(),
            type: 'income',
            source: t.channel || 'Ledger',
            description: `${t.guestName || 'Guest'} (${t.roomType || 'Room'})`,
            department: 'Rooms',
            docType: 'Room Booking',
            amount: t.amount,
            date: t.date || 'N/A'
          }));

        const fnbAlacarteRev = [
          ...posOrders.filter(o => o.category === 'food' || o.category === 'beverage'),
          ...customIncomes
            .filter(i => ((i.category || "").toLowerCase().includes("food") || (i.category || "").toLowerCase().includes("beverage")) && !(i.name || "").toLowerCase().includes("banquet") && !(i.category || "").toLowerCase().includes("banquet"))
            .map(i => ({
              id: i.id || Math.random().toString(),
              type: 'income',
              source: 'Custom Income',
              description: i.name,
              amount: i.amount,
              date: i.date || 'N/A',
              category: i.category,
              department: 'Food & Beverage',
              docType: 'Manual'
            }))
        ];

        const banquetRev = [
          ...posOrders.filter(o => o.category === 'banquet'),
          ...customIncomes
            .filter(i => (i.name || "").toLowerCase().includes("banquet") || (i.category || "").toLowerCase().includes("banquet"))
            .map(i => ({
              id: i.id || Math.random().toString(),
              type: 'income',
              source: 'Custom Income',
              description: i.name,
              amount: i.amount,
              date: i.date || 'N/A',
              category: i.category,
              department: 'Food & Beverage',
              docType: 'Manual'
            }))
        ];

        const otherRev = [
          ...rawTransactions
            .filter(isFOOtherIncome)
            .map(t => ({
              id: t.bookingId || Math.random().toString(),
              type: 'income',
              source: 'Ledger (Other)',
              description: t.guestName || 'Other Income Ledger',
              department: 'N/A',
              docType: 'Ledger Other',
              amount: t.amount,
              date: t.date || 'N/A'
            })),
          ...customIncomes
            .filter(i => !isFnbOrBanquetCustomIncome(i))
            .map(i => ({
              id: i.id || Math.random().toString(),
              type: 'income',
              source: 'Custom Income',
              description: i.name,
              department: 'N/A',
              docType: 'Manual',
              amount: i.amount,
              date: i.date || 'N/A'
            }))
        ];

        const opExps = expenses.map(e => ({
          id: e.id || Math.random().toString(),
          type: 'expense',
          source: 'expense_item',
          description: e.description || e.name || 'Operational Expense',
          amount: e.amount,
          date: e.date || 'N/A',
          department: e.department,
          docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
        }));

        items = [...roomRev, ...fnbAlacarteRev, ...banquetRev, ...otherRev, ...opExps];
      }
      break;
    case "VAT Input":
      {
        const isAccommodation = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
        };
        const isFOOtherIncome = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && !isAccommodation(t);
        };

        const totalExtraIncome = customIncomes.reduce((sum, i) => sum + i.amount, 0);
        const ledgerRoomRevenue = rawTransactions.filter(isAccommodation).reduce((sum, t) => sum + t.amount, 0);
        const posRevAlacarte = posOrders.filter(o => o.category === 'food' || o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const posRevBanquet = posOrders.filter(o => o.category === 'banquet').reduce((sum, o) => sum + o.amount, 0);
        const ledgerOtherIncome = rawTransactions.filter(isFOOtherIncome).reduce((sum, t) => sum + t.amount, 0);
        const otherRevenueTotal = totalExtraIncome + ledgerOtherIncome;
        const totalRevenue = otherRevenueTotal + ledgerRoomRevenue + posRevAlacarte + posRevBanquet;
        const vatAmount = totalRevenue * (vatPercentage / 100);

        items = [{
          id: 'vat-calc',
          type: 'expense',
          source: 'Deduction',
          description: `Calculated VAT Input (${vatPercentage}%) of Total Gross Revenue (${totalRevenue.toLocaleString('id-ID')})`,
          amount: vatAmount,
          date: 'N/A',
          department: 'Tax',
          docType: 'Calculated'
        }];
      }
      break;
    case "Service Charge":
      {
        const isAccommodation = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
        };
        const isFOOtherIncome = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && !isAccommodation(t);
        };

        const totalExtraIncome = customIncomes.reduce((sum, i) => sum + i.amount, 0);
        const ledgerRoomRevenue = rawTransactions.filter(isAccommodation).reduce((sum, t) => sum + t.amount, 0);
        const posRevAlacarte = posOrders.filter(o => o.category === 'food' || o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const posRevBanquet = posOrders.filter(o => o.category === 'banquet').reduce((sum, o) => sum + o.amount, 0);
        const ledgerOtherIncome = rawTransactions.filter(isFOOtherIncome).reduce((sum, t) => sum + t.amount, 0);
        const otherRevenueTotal = totalExtraIncome + ledgerOtherIncome;
        const totalRevenue = otherRevenueTotal + ledgerRoomRevenue + posRevAlacarte + posRevBanquet;

        const serviceChargeAmount = totalRevenue * (serviceChargePercentage / 100);

        items = [{
          id: 'service-calc',
          type: 'expense',
          source: 'Deduction',
          description: `Calculated Service Charge (${serviceChargePercentage}%) of Total Gross Revenue (${totalRevenue.toLocaleString('id-ID')})`,
          amount: serviceChargeAmount,
          date: 'N/A',
          department: 'F&B',
          docType: 'Calculated'
        }];
      }
      break;
    case "Lost & Breakage":
      {
        const isAccommodation = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
        };
        const isFOOtherIncome = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && !isAccommodation(t);
        };

        const totalExtraIncome = customIncomes.reduce((sum, i) => sum + i.amount, 0);
        const ledgerRoomRevenue = rawTransactions.filter(isAccommodation).reduce((sum, t) => sum + t.amount, 0);
        const posRevAlacarte = posOrders.filter(o => o.category === 'food' || o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const posRevBanquet = posOrders.filter(o => o.category === 'banquet').reduce((sum, o) => sum + o.amount, 0);
        const ledgerOtherIncome = rawTransactions.filter(isFOOtherIncome).reduce((sum, t) => sum + t.amount, 0);
        const otherRevenueTotal = totalExtraIncome + ledgerOtherIncome;
        const totalRevenue = otherRevenueTotal + ledgerRoomRevenue + posRevAlacarte + posRevBanquet;

        const lostBreakageAmount = totalRevenue * (lostBreakagePercentage / 100);

        items = [{
          id: 'lost-calc',
          type: 'expense',
          source: 'Deduction',
          description: `Calculated Lost & Breakage (${lostBreakagePercentage}%) of Total Gross Revenue (${totalRevenue.toLocaleString('id-ID')})`,
          amount: lostBreakageAmount,
          date: 'N/A',
          department: 'F&B',
          docType: 'Calculated'
        }];
      }
      break;
    case "Management Fee":
      {
        const isAccommodation = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
        };

        const ledgerRoomRevenue = rawTransactions.filter(isAccommodation).reduce((sum, t) => sum + t.amount, 0);
        const posRevAlacarte = posOrders.filter(o => o.category === 'food' || o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const posRevBanquet = posOrders.filter(o => o.category === 'banquet').reduce((sum, o) => sum + o.amount, 0);
        const fnbRevenue = posRevAlacarte + posRevBanquet;
        
        const mgmtFeeAmount = (ledgerRoomRevenue * (mgmtFeePercentage / 100)) + (fnbRevenue * (mgmtFeePercentage / 100));

        items = [{
          id: 'mgmt-calc',
          type: 'expense',
          source: 'Deduction',
          description: `Calculated Management Fee (${mgmtFeePercentage}%) of Rooms (${ledgerRoomRevenue.toLocaleString('id-ID')}) and F&B (${fnbRevenue.toLocaleString('id-ID')})`,
          amount: mgmtFeeAmount,
          date: 'N/A',
          department: 'Fee',
          docType: 'Calculated'
        }];
      }
      break;
    default:
      return null;
  }
  return items;
}
