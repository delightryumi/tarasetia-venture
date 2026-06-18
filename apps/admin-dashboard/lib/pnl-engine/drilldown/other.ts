import { PnlIncomeItem, PnlExpenseItem, DrillDownData } from "../../pnl-utils";
import { ExtendedTransaction } from "../types";
import { DrillDownContext } from "./index";

export function getOtherDrillDown(cardId: string, ctx: DrillDownContext): any[] | null {
  let items: any[] = [];
  const { rawTransactions, customIncomes, expenses, posOrders, vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage } = ctx;

  switch (cardId) {
    case "Net Profit (Recon Owner)":
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

        const totalOperationalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalGop = totalRevenue - totalOperationalExpenses;

        const vatAmount = totalRevenue * (vatPercentage / 100);
        const mgmtFeeAmount = (ledgerRoomRevenue * (mgmtFeePercentage / 100)) + ((posRevAlacarte + posRevBanquet) * (mgmtFeePercentage / 100));
        
        const serviceChargeAmount = totalRevenue * (serviceChargePercentage / 100);
        const lostBreakageAmount = totalRevenue * (lostBreakagePercentage / 100);

        items = [
          {
            id: 'recon-gop',
            type: 'income',
            source: 'Calculated',
            description: 'Total GOP',
            amount: totalGop,
            date: 'N/A',
            department: 'GOP',
            docType: 'Calculated'
          },
          {
            id: 'recon-vat',
            type: 'expense',
            source: 'Deduction',
            description: `VAT Input (${vatPercentage}%)`,
            amount: vatAmount,
            date: 'N/A',
            department: 'Tax',
            docType: 'Calculated'
          },
          {
            id: 'recon-mgmt',
            type: 'expense',
            source: 'Deduction',
            description: `Management Fee Room & F&B (${mgmtFeePercentage}%)`,
            amount: mgmtFeeAmount,
            date: 'N/A',
            department: 'Fee',
            docType: 'Calculated'
          },
          {
            id: 'recon-lost',
            type: 'expense',
            source: 'Deduction',
            description: `Lost & Breakage (${lostBreakagePercentage}%)`,
            amount: lostBreakageAmount,
            date: 'N/A',
            department: 'F&B',
            docType: 'Calculated'
          },
          {
            id: 'recon-service',
            type: 'expense',
            source: 'Deduction',
            description: `Service Charge (${serviceChargePercentage}%)`,
            amount: serviceChargeAmount,
            date: 'N/A',
            department: 'F&B',
            docType: 'Calculated'
          }
        ];
      }
      break;
    case "Total F&B A la Carte Expenses":
      {
        const fbExpenses = expenses.filter(e => {
          const nameLower = (e.name || "").toLowerCase();
          const catLower = (e.category || "").toLowerCase();
          const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
          const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();
          const descLower = (e.description || "").toLowerCase();
          
          const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
          const cleanCat = cleanString(catLower);
          const cleanName = cleanString(nameLower);
          const cleanDesc = cleanString(descLower);
          
          const isBanquet = evCatLower.includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
          const isBeverage = fbCatLower.includes('beverage') || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
          const isFood = fbCatLower.includes('food') || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
          
          return isBanquet || isBeverage || isFood;
        });

        items = fbExpenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const descLower = (e.description || "").toLowerCase();
            const catLower = (e.category || "").toLowerCase();
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();

            const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
            const cleanCat = cleanString(catLower);
            const cleanName = cleanString(nameLower);
            const cleanDesc = cleanString(descLower);

            const isBanquet = evCatLower.includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
            
            return !isBanquet;
          })
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual Expense')),
            description: e.description || e.name || 'F&B A la Carte Expense',
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));
      }
      break;
    case "Total Banquet Expenses":
      {
        const fbExpenses = expenses.filter(e => {
          const nameLower = (e.name || "").toLowerCase();
          const catLower = (e.category || "").toLowerCase();
          const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
          const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();
          const descLower = (e.description || "").toLowerCase();
          
          const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
          const cleanCat = cleanString(catLower);
          const cleanName = cleanString(nameLower);
          const cleanDesc = cleanString(descLower);
          
          const isBanquet = evCatLower.includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
          const isBeverage = fbCatLower.includes('beverage') || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
          const isFood = fbCatLower.includes('food') || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
          
          return isBanquet || isBeverage || isFood;
        });

        items = fbExpenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const descLower = (e.description || "").toLowerCase();
            const catLower = (e.category || "").toLowerCase();
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();

            const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
            const cleanCat = cleanString(catLower);
            const cleanName = cleanString(nameLower);
            const cleanDesc = cleanString(descLower);

            const isBanquet = evCatLower.includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
            
            return isBanquet;
          })
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual Expense')),
            description: e.description || e.name || 'Banquet Expense',
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));
      }
      break;
    case "Operational Expenses":
      {
        items = expenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const deptLower = (e.department || "").toLowerCase();
            const catLower = (e.category || "").toLowerCase();
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();
            const descLower = (e.description || "").toLowerCase();
            
            const isHk = deptLower === 'housekeeping';
            const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
            const cleanCat = cleanString(catLower);
            const cleanName = cleanString(nameLower);
            const cleanDesc = cleanString(descLower);
            
            const isBanquet = evCatLower.includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
            const isBeverage = fbCatLower.includes('beverage') || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
            const isFood = fbCatLower.includes('food') || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
            
            const isFb = isBanquet || isBeverage || isFood;
            return !isHk && !isFb;
          })
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: 'expense_item',
            description: e.description || e.name || 'Operational Expense',
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));
      }
      break;
    case "Compliment Deductions":
      {
        items = posOrders
          .filter(o => o.isCompliment)
          .map(o => ({
            id: o.id || Math.random().toString(),
            type: 'expense',
            source: o.source || 'POS',
            description: o.description || 'Complimentary Item',
            department: o.department || 'Food & Beverage',
            docType: 'Compliment',
            amount: o.originalPrice || 0,
            date: o.date || 'N/A'
          }));
      }
      break;
    default:
      return null;
  }
  return items;
}
