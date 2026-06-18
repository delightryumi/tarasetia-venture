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

export function getExpenseDrillDown(cardId: string, ctx: DrillDownContext): any[] | null {
  let items: any[] = [];
  const { rawTransactions, customIncomes, expenses, posOrders, vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage } = ctx;

  switch (cardId) {
    case "Housekeeping Expenses":
      items = expenses
        .filter(e => e && (e.department || "").toLowerCase() === 'housekeeping')
        .map(e => ({
          id: e.id || Math.random().toString(),
          type: 'expense',
          source: 'expense_item',
          description: e.description || e.name || 'Housekeeping Expense',
          amount: e.amount,
          date: e.date || 'N/A',
          department: e.department,
          documentId: e.id?.startsWith('sr-') ? e.id : undefined,
          docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Add Expense')),
        }));
      break;
    case "Front Office and Purchasing Expenses":
      items = expenses
        .filter(e => e && ((e.department || "").toLowerCase() === 'front office' || (e.department || "").toLowerCase() === 'purchasing'))
        .map(e => ({
          id: e.id || Math.random().toString(),
          type: 'expense',
          source: 'expense_item',
          description: e.description || e.name || 'Front Office / Purchasing Expense',
          amount: e.amount,
          date: e.date || 'N/A',
          department: e.department,
          documentId: e.id?.startsWith('sr-') ? e.id : undefined,
          docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Add Expense')),
        }));
      break;
    case "Payroll Expenses":
      if (ctx.payrollDetails) {
        items = ctx.payrollDetails.map(p => ({
          id: p.staffId || Math.random().toString(),
          type: 'expense',
          source: 'payroll_summary',
          description: `Gaji: ${p.staffName} (${p.position || p.employmentType})`,
          amount: Math.max(0, (p.grossSalary || 0) + (p.overtimePay || 0) - (p.lateDeduction || 0) - (p.absenceDeduction || 0)),
          date: p.month || 'N/A',
          department: 'HRD',
          docType: 'Payroll'
        }));
      }
      break;
    case "Operational Expenses":
      items = expenses
        .filter(e => e && ((e.department || "").toLowerCase() === 'front office' || (e.department || "").toLowerCase() === 'purchasing' || ((e.department || "").toLowerCase() !== 'housekeeping' && !e.description?.toLowerCase().includes('banquet') && !e.description?.toLowerCase().includes('food') && !e.description?.toLowerCase().includes('beverage'))))
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
      break;
    case "Total Operational Expenses":
      {
        const hk = expenses
          .filter(e => e && (e.department || "").toLowerCase() === 'housekeeping')
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: 'expense_item',
            description: e.description || e.name || 'Housekeeping Expense',
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));

        const fbExpenses = expenses.filter(e => {
          const nameLower = (e.name || "").toLowerCase();
          const deptLower = (e.department || "").toLowerCase();
          const catLower = (e.category || "").toLowerCase();
          const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
          const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
          const cleanCat = cleanString(catLower);
          const cleanName = cleanString(nameLower);
          const cleanDesc = cleanString(e.description ? e.description.toLowerCase() : "");
          
          const isBanquet = (e.eventCategory || "").toLowerCase().includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
          const isBeverage = fbCatLower.includes('beverage') || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
          const isFood = fbCatLower.includes('food') || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
          
          return isBanquet || isBeverage || isFood;
        }).map(e => ({
          id: e.id || Math.random().toString(),
          type: 'expense',
          source: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual Expense')),
          description: e.description || e.name || 'F&B Expense',
          amount: e.amount,
          date: e.date || 'N/A',
          department: e.department,
          docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
        }));

        const foPurchasing = expenses
          .filter(e => e && ((e.department || "").toLowerCase() === 'front office' || (e.department || "").toLowerCase() === 'purchasing'))
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: 'expense_item',
            description: e.description || e.name || 'Front Office / Purchasing Expense',
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));

        const otherManual = expenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const deptLower = (e.department || "").toLowerCase();
            const catLower = (e.category || "").toLowerCase();
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const isHk = deptLower === 'housekeeping';
            const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
            const cleanCat = cleanString(catLower);
            const cleanName = cleanString(nameLower);
            const cleanDesc = cleanString(e.description ? e.description.toLowerCase() : "");
            
            const isBanquet = (e.eventCategory || "").toLowerCase().includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
            const isBeverage = fbCatLower.includes('beverage') || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
            const isFood = fbCatLower.includes('food') || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
            
            const isFb = isBanquet || isBeverage || isFood;
            const isFoPurchasing = deptLower === 'front office' || deptLower === 'purchasing';
            return !isHk && !isFb && !isFoPurchasing;
          })
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: 'expense_item',
            description: e.description || e.name || 'Other Expense',
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));

        let payrolls: any[] = [];
        if (ctx.payrollDetails) {
          payrolls = ctx.payrollDetails.map(p => ({
            id: p.staffId || Math.random().toString(),
            type: 'expense',
            source: 'payroll_summary',
            description: `Gaji: ${p.staffName} (${p.position || p.employmentType})`,
            amount: Math.max(0, (p.grossSalary || 0) + (p.overtimePay || 0) - (p.lateDeduction || 0) - (p.absenceDeduction || 0)),
            date: p.month || 'N/A',
            department: 'HRD',
            docType: 'Payroll'
          }));
        }

        items = [...hk, ...fbExpenses, ...foPurchasing, ...otherManual, ...payrolls];
      }
      break;
    default:
      return null;
  }
  return items;
}
