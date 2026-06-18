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

export function getRevenueDrillDown(cardId: string, ctx: DrillDownContext): any[] | null {
  let items: any[] = [];
  const { rawTransactions, customIncomes, expenses, posOrders, vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage } = ctx;

  switch (cardId) {
    case "Revenue Hotel Collect":
      {
        const isAccommodation = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
        };
        items = rawTransactions
          .filter(isAccommodation)
          .filter(t => (Number(t.paidCash) || 0) > 0)
          .map(t => ({
            id: t.bookingId || Math.random().toString(),
            type: 'income',
            source: t.channel || 'Ledger',
            description: `${t.guestName || 'Guest'} (${t.roomType || 'Room'})`,
            department: 'Rooms',
            docType: 'Hotel Collect',
            amount: Number(t.paidCash) || 0,
            date: t.date || 'N/A'
          }));
      }
      break;
    case "Revenue Nexura Collect":
      {
        const isAccommodation = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
        };
        items = rawTransactions
          .filter(isAccommodation)
          .filter(t => (Number(t.paidTransfer) || 0) > 0)
          .map(t => ({
            id: t.bookingId || Math.random().toString(),
            type: 'income',
            source: t.channel || 'Ledger',
            description: `${t.guestName || 'Guest'} (${t.roomType || 'Room'})`,
            department: 'Rooms',
            docType: 'Nexura Collect',
            amount: Number(t.paidTransfer) || 0,
            date: t.date || 'N/A'
          }));
      }
      break;
    case "Room Compliment":
      {
        items = rawTransactions
          .filter(t => t.isCompliment)
          .map(t => ({
            id: t.bookingId || Math.random().toString(),
            type: 'income',
            source: t.channel || 'Ledger',
            description: `${t.guestName || 'Guest'} - ${t.complimentReason || 'Compliment'}`,
            department: 'Rooms',
            docType: 'Room Compliment',
            amount: Number(t.complimentValue) || 0,
            date: t.effectiveDate || t.date || 'N/A'
          }));
      }
      break;
    case "Revenue Room":
    case "Room Revenue":
      {
        const isAccommodation = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
        };
        items = rawTransactions
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
      }
      break;
    case "Other Revenue":
      {
        const isAccommodation = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
        };
        const isFOOtherIncome = (t: any) => {
            const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
            return !isPOS && !isAccommodation(t);
        };
        const ledgerOther = rawTransactions
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
          }));
        const customInc = customIncomes.map(i => ({
          id: i.id || Math.random().toString(),
          type: 'income',
          source: 'Custom Income',
          description: i.name,
          department: 'N/A',
          docType: 'Manual',
          amount: i.amount,
          date: i.date || 'N/A'
        }));
        items = [...ledgerOther, ...customInc];
      }
      break;
    case "Total Gross Revenue":
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

        items = [...roomRev, ...fnbAlacarteRev, ...banquetRev, ...otherRev];
      }
      break;
    default:
      return null;
  }
  return items;
}
