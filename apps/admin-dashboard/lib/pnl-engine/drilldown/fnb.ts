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

function getFbExpenses(expenses: PnlExpenseItem[]) {
  const validExpenses = expenses.filter(e => !!e);
  return validExpenses.filter(e => {
    const deptLower = (e.department || "").toLowerCase();
    const catLower = (e.category || "").toLowerCase();
    const nameLower = (e.name || "").toLowerCase();
    
    const isDeptFb = deptLower.includes('food & beverage') || deptLower === 'f&b' || catLower.includes('food & beverage') || catLower === 'f&b' || nameLower.includes('food & beverage') || nameLower.includes('f&b');
    if (!isDeptFb) return false;

    const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
    const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();
    const cleanCat = catLower.replace("food & beverage", "").replace("f&b", "").trim();
    const cleanName = nameLower.replace("food & beverage", "").replace("f&b", "").trim();
    const descLower = (e.description || "").toLowerCase();
    const cleanDesc = descLower.replace("food & beverage", "").replace("f&b", "").trim();

    const isPurchasing = e.id?.startsWith('dml-') || e.id?.startsWith('sr-') || e.id?.startsWith('pr-');
    if (isPurchasing) return true;

    const isBanquet = evCatLower === 'banquet' || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
    const isBeverage = fbCatLower === 'beverage' || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
    const isFood = fbCatLower === 'food' || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
    
    if (isBanquet || isBeverage || isFood) return true;
    
    return false;
  });
}

function mapFbExpense(e: PnlExpenseItem) {
  return {
    id: e.id || Math.random().toString(),
    type: 'expense',
    source: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual Expense')),
    description: e.description || e.name,
    amount: e.amount,
    date: e.date || 'N/A',
    department: e.department,
    documentId: e.id?.startsWith('sr-') || e.id?.startsWith('dml-') || e.id?.startsWith('pr-') ? e.id : undefined,
    docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
  };
}

export function getFnbDrillDown(cardId: string, ctx: DrillDownContext): any[] | null {
  let items: any[] = [];
  const { rawTransactions, customIncomes, expenses, posOrders, vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage } = ctx;

  switch (cardId) {
    case "Food A La Carte Revenue": {
      const normal    = posOrders.filter(o => o.category === 'food' && !o.isCancelled);
      const cancelled = posOrders.filter(o => o.category === 'food' && o.isCancelled).map(o => ({ ...o, amount: 0 }));
      items = [
        ...normal,
        ...cancelled,
        ...customIncomes
          .filter(i => (i.category || "").toLowerCase().includes("food") && (i.name || "").toLowerCase().includes("a la carte"))
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
      break;
    }
    case "Beverage A La Carte Revenue": {
      const normal    = posOrders.filter(o => o.category === 'beverage' && !o.isCancelled);
      const cancelled = posOrders.filter(o => o.category === 'beverage' && o.isCancelled).map(o => ({ ...o, amount: 0 }));
      items = [
        ...normal,
        ...cancelled,
        ...customIncomes
          .filter(i => (i.category || "").toLowerCase().includes("beverage") && (i.name || "").toLowerCase().includes("a la carte"))
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
      break;
    }
    case "Banquet Revenue": {
      const normal    = posOrders.filter(o => o.category === 'banquet' && !o.isCancelled);
      const cancelled = posOrders.filter(o => o.category === 'banquet' && o.isCancelled).map(o => ({ ...o, amount: 0 }));
      items = [
        ...normal,
        ...cancelled,
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
      break;
    }
    case "Total F&B A la Carte Revenue": {
      const normal    = posOrders.filter(o => (o.category === 'food' || o.category === 'beverage') && !o.isCancelled);
      const cancelled = posOrders.filter(o => (o.category === 'food' || o.category === 'beverage') && o.isCancelled).map(o => ({ ...o, amount: 0 }));
      items = [
        ...normal,
        ...cancelled,
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
      break;
    }
    case "Food A la Carte Performance":
      {
        const normal    = posOrders.filter(o => o.category === 'food' && !o.isCancelled);
        const cancelled = posOrders.filter(o => o.category === 'food' && o.isCancelled).map(o => ({ ...o, amount: 0 }));
        const incomes = [
          ...normal,
          ...cancelled,
          ...customIncomes
            .filter(i => (i.category || "").toLowerCase().includes("food") && (i.name || "").toLowerCase().includes("a la carte"))
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

        const exps = getFbExpenses(expenses)
          .filter(e => {
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();
            const isPurchasing = e.id?.startsWith('dml-') || e.id?.startsWith('sr-') || e.id?.startsWith('pr-');
            
            let isBanquet = false;
            let isBeverage = false;

            if (isPurchasing) {
              isBanquet = evCatLower === 'banquet';
              isBeverage = fbCatLower === 'beverage';
            } else {
              const nameLower = (e.name || "").toLowerCase();
              const descLower = (e.description || "").toLowerCase();
              const catLower = (e.category || "").toLowerCase();

              const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
              const cleanCat = cleanString(catLower);
              const cleanName = cleanString(nameLower);
              const cleanDesc = cleanString(descLower);

              isBanquet = evCatLower === 'banquet' || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
              isBeverage = fbCatLower === 'beverage' || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
            }
            
            return !isBeverage && !isBanquet;
          })
          .map(mapFbExpense);

        items = [...incomes, ...exps];
      }
      break;
    case "Banquet Performance":
      {
        const normal    = posOrders.filter(o => o.category === 'banquet' && !o.isCancelled);
        const cancelled = posOrders.filter(o => o.category === 'banquet' && o.isCancelled).map(o => ({ ...o, amount: 0 }));
        const incomes = [
          ...normal,
          ...cancelled,
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

        const exps = getFbExpenses(expenses)
          .filter(e => {
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();
            const isPurchasing = e.id?.startsWith('dml-') || e.id?.startsWith('sr-') || e.id?.startsWith('pr-');
            
            let isBanquet = false;

            if (isPurchasing) {
              isBanquet = evCatLower === 'banquet';
            } else {
              const nameLower = (e.name || "").toLowerCase();
              const descLower = (e.description || "").toLowerCase();
              const catLower = (e.category || "").toLowerCase();

              const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
              const cleanCat = cleanString(catLower);
              const cleanName = cleanString(nameLower);
              const cleanDesc = cleanString(descLower);

              isBanquet = evCatLower === 'banquet' || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
            }
            
            return isBanquet;
          })
          .map(mapFbExpense);

        items = [...incomes, ...exps];
      }
      break;
    case "Total F&B A la Carte Performance":
      {
        const normal    = posOrders.filter(o => (o.category === 'food' || o.category === 'beverage') && !o.isCancelled);
        const cancelled = posOrders.filter(o => (o.category === 'food' || o.category === 'beverage') && o.isCancelled).map(o => ({ ...o, amount: 0 }));
        const incomes = [
          ...normal,
          ...cancelled,
          ...customIncomes
            .filter(i => ((i.category || "").toLowerCase().includes("food") || (i.category || "").toLowerCase().includes("beverage")) && (i.name || "").toLowerCase().includes("a la carte"))
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

        const exps = getFbExpenses(expenses)
          .filter(e => {
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();
            const isPurchasing = e.id?.startsWith('dml-') || e.id?.startsWith('sr-') || e.id?.startsWith('pr-');
            
            let isBanquet = false;

            if (isPurchasing) {
              isBanquet = evCatLower === 'banquet';
            } else {
              const nameLower = (e.name || "").toLowerCase();
              const descLower = (e.description || "").toLowerCase();
              const catLower = (e.category || "").toLowerCase();

              const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
              const cleanCat = cleanString(catLower);
              const cleanName = cleanString(nameLower);
              const cleanDesc = cleanString(descLower);

              isBanquet = evCatLower === 'banquet' || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
            }
            
            return !isBanquet;
          })
          .map(mapFbExpense);

        items = [...incomes, ...exps];
      }
      break;
    case "Beverage A la Carte Performance":
      {
        const normal    = posOrders.filter(o => o.category === 'beverage' && !o.isCancelled);
        const cancelled = posOrders.filter(o => o.category === 'beverage' && o.isCancelled).map(o => ({ ...o, amount: 0 }));
        const incomes = [
          ...normal,
          ...cancelled,
          ...customIncomes
            .filter(i => (i.category || "").toLowerCase().includes("beverage") && (i.name || "").toLowerCase().includes("a la carte"))
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

        const exps = getFbExpenses(expenses)
          .filter(e => {
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();
            const isPurchasing = e.id?.startsWith('dml-') || e.id?.startsWith('sr-') || e.id?.startsWith('pr-');
            
            let isBanquet = false;
            let isBeverage = false;

            if (isPurchasing) {
              isBanquet = evCatLower === 'banquet';
              isBeverage = fbCatLower === 'beverage';
            } else {
              const nameLower = (e.name || "").toLowerCase();
              const descLower = (e.description || "").toLowerCase();
              const catLower = (e.category || "").toLowerCase();

              const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
              const cleanCat = cleanString(catLower);
              const cleanName = cleanString(nameLower);
              const cleanDesc = cleanString(descLower);

              isBanquet = evCatLower === 'banquet' || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
              isBeverage = fbCatLower === 'beverage' || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
            }
            
            return isBeverage && !isBanquet;
          })
          .map(mapFbExpense);

        items = [...incomes, ...exps];
      }
      break;
    default:
      return null;
  }
  return items;
}
