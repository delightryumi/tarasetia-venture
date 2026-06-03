const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'lib');
const pnlLogicPath = path.join(baseDir, 'pnl-logic.ts');
const engineDir = path.join(baseDir, 'pnl-engine');
const drilldownDir = path.join(engineDir, 'drilldown');

if (!fs.existsSync(engineDir)) fs.mkdirSync(engineDir);
if (!fs.existsSync(drilldownDir)) fs.mkdirSync(drilldownDir);

const content = fs.readFileSync(pnlLogicPath, 'utf8');

const processStart = content.indexOf('export function processPnLData');
const drilldownStart = content.indexOf('export function getDrillDownData');

// 1. types.ts
const typesContent = content.slice(0, processStart);
fs.writeFileSync(path.join(engineDir, 'types.ts'), typesContent.trim() + '\n');

// 2. process.ts
const processContent = content.slice(processStart, drilldownStart);
const processImports = `import { \n  GlobalPnLResult, \n  PnlIncomeItem, \n  PnlExpenseItem, \n  InvestorItem,\n  DrillDownData\n} from "../pnl-utils";\nimport { ExtendedTransaction, HotelMaster, PropertyStat, PnLCalculationResult } from "./types";\n\n`;
fs.writeFileSync(path.join(engineDir, 'process.ts'), processImports + processContent.trim() + '\n');

// 3. Split drilldown
const drilldownContent = content.slice(drilldownStart);

// We need to parse cases.
// A simple way is to use regex or split by "\n    case "
const switchStart = drilldownContent.indexOf('switch (normalizedCardId) {');
const switchEnd = drilldownContent.lastIndexOf('default:');

const beforeSwitch = drilldownContent.slice(0, switchStart + 'switch (normalizedCardId) {'.length);
const switchBody = drilldownContent.slice(switchStart + 'switch (normalizedCardId) {'.length, switchEnd);
const afterSwitch = drilldownContent.slice(switchEnd);

const cases = switchBody.split(/\n\s+case "/).filter(c => c.trim().length > 0);

const revenueCases = ["Revenue Hotel Collect", "Revenue Nexura Collect", "Revenue Room", "Room Revenue", "Other Revenue", "Total Gross Revenue"];
const fnbCases = ["Food A La Carte Revenue", "Beverage A La Carte Revenue", "Banquet Revenue", "Total F&B A la Carte Revenue", "Food A la Carte Performance", "Banquet Performance", "Total F&B A la Carte Performance", "Beverage A la Carte Performance"];
const expenseCases = ["Housekeeping Expenses", "Front Office and Purchasing Expenses", "Total Operational Expenses"];
const profitCases = ["Total GOP", "VAT Input", "Service Charge", "Lost & Breakage", "Management Fee", "Net Profit"];

let revenueCode = '';
let fnbCode = '';
let expenseCode = '';
let profitCode = '';
let otherCode = '';

for (const c of cases) {
    const caseNameMatch = c.match(/^([^"]+)"\s*:/);
    if (!caseNameMatch) {
        otherCode += `\n    case "` + c;
        continue;
    }
    const caseName = caseNameMatch[1];
    const fullCase = `\n    case "` + c;
    
    if (revenueCases.includes(caseName)) {
        revenueCode += fullCase;
    } else if (fnbCases.includes(caseName)) {
        fnbCode += fullCase;
    } else if (expenseCases.includes(caseName)) {
        expenseCode += fullCase;
    } else if (profitCases.includes(caseName)) {
        profitCode += fullCase;
    } else {
        otherCode += fullCase;
    }
}

const drilldownImports = `import { PnlIncomeItem, PnlExpenseItem, DrillDownData } from "../../pnl-utils";\nimport { ExtendedTransaction } from "../types";\n\nexport interface DrillDownContext {\n  rawTransactions: ExtendedTransaction[];\n  customIncomes: PnlIncomeItem[];\n  expenses: PnlExpenseItem[];\n  posOrders: any[];\n  vatPercentage: number;\n  mgmtFeePercentage: number;\n  serviceChargePercentage: number;\n  lostBreakagePercentage: number;\n}\n\n`;

function wrapModule(name, code) {
    return drilldownImports + `export function get${name}DrillDown(cardId: string, ctx: DrillDownContext): any[] | null {\n  let items: any[] = [];\n  const { rawTransactions, customIncomes, expenses, posOrders, vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage } = ctx;\n\n  switch (cardId) {${code}\n    default:\n      return null;\n  }\n  return items;\n}\n`;
}

fs.writeFileSync(path.join(drilldownDir, 'revenue.ts'), wrapModule('Revenue', revenueCode));
fs.writeFileSync(path.join(drilldownDir, 'fnb.ts'), wrapModule('Fnb', fnbCode));
fs.writeFileSync(path.join(drilldownDir, 'expenses.ts'), wrapModule('Expense', expenseCode));
fs.writeFileSync(path.join(drilldownDir, 'profit.ts'), wrapModule('Profit', profitCode));

// 4. Create index.ts
let indexCode = drilldownImports + `import { getRevenueDrillDown } from './revenue';\nimport { getFnbDrillDown } from './fnb';\nimport { getExpenseDrillDown } from './expenses';\nimport { getProfitDrillDown } from './profit';\n\n`;

const beforeSwitchModified = beforeSwitch.replace(
`  cardId: string,
  rawTransactions: ExtendedTransaction[],
  customIncomes: PnlIncomeItem[],
  expenses: PnlExpenseItem[],
  posOrders: any[] = [],
  vatPercentage: number = 0,
  mgmtFeePercentage: number = 0,
  serviceChargePercentage: number = 0,
  lostBreakagePercentage: number = 0`, 
`  cardId: string,
  rawTransactions: ExtendedTransaction[],
  customIncomes: PnlIncomeItem[],
  expenses: PnlExpenseItem[],
  posOrders: any[] = [],
  vatPercentage: number = 0,
  mgmtFeePercentage: number = 0,
  serviceChargePercentage: number = 0,
  lostBreakagePercentage: number = 0`
); // Keep arguments identical

indexCode += beforeSwitchModified + `
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
          switch (normalizedCardId) {
${otherCode}
${afterSwitch}
        }
      }
    }
  }
`;

fs.writeFileSync(path.join(drilldownDir, 'index.ts'), indexCode);

// 5. Replace pnl-logic.ts with barrel file
fs.writeFileSync(pnlLogicPath, `export * from './pnl-engine/types';\nexport { processPnLData } from './pnl-engine/process';\nexport { getDrillDownData } from './pnl-engine/drilldown';\n`);

console.log("Refactoring complete");
