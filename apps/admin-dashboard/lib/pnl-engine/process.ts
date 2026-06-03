import { 
  GlobalPnLResult, 
  PnlIncomeItem, 
  PnlExpenseItem, 
  InvestorItem,
  DrillDownData
} from "../pnl-utils";
import { ExtendedTransaction, HotelMaster, PropertyStat, PnLCalculationResult } from "./types";

export function processPnLData(
  transactions: ExtendedTransaction[],
  customIncomes: PnlIncomeItem[],
  nonCommissionRevenue: PnlIncomeItem[],
  expenses: PnlExpenseItem[],
  investors: InvestorItem[],
  vatPercentage: number = 11,
  hotelGopPercentages: Record<string, any> = {},
  allHotels: HotelMaster[] = [],
  mgmtFeeRoomPercentage: number = 10,
  mgmtFeeFnbPercentage: number = 10,
  posRevAlacarte: number = 0,
  posRevBanquet: number = 0,
  posRevFood: number = 0,
  posRevBeverage: number = 0,
  posExpAlacarte: number = 0,
  posExpBanquet: number = 0,
  posExpFood: number = 0,
  posExpBeverage: number = 0,
  serviceChargePercentage: number = 10,
  lostBreakagePercentage: number = 1
): PnLCalculationResult {
  const ledgerRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExtraIncome = customIncomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExtraExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // 1. Housekeeping expenses (pr, dml, sr from housekeeping)
  const expHousekeeping = expenses
    .filter(e => {
      if (!e) return false;
      const nameLower = (e.name || "").toLowerCase();
      const deptLower = (e.department || "").toLowerCase();
      return nameLower.includes('housekeeping') || nameLower.includes('hk') || deptLower === 'housekeeping';
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // 2. F&B expenses divided into 4 categories (only from SR, DML, PR)
    const validExpenses = expenses.filter(e => !!e);
    const fbExpenses = validExpenses.filter(e => {
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

      const isBanquet = evCatLower === 'banquet' || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
      const isBeverage = fbCatLower === 'beverage' || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
      const isFood = fbCatLower === 'food' || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
      
      const isPurchasing = e.id?.startsWith('dml-') || e.id?.startsWith('sr-') || e.id?.startsWith('pr-');
      if (isPurchasing) return true;
      
      if (isBanquet || isBeverage || isFood) return true;
      
      return false;
    });

  let foodAlacarteExp = 0;
  let foodBanquetExp = 0;
  let beverageAlacarteExp = 0;
  let beverageBanquetExp = 0;

  fbExpenses.forEach(e => {
    const nameLower = (e.name || "").toLowerCase();
    const descLower = (e.description || "").toLowerCase();
    const catLower = (e.category || "").toLowerCase();
    const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
    const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();

    const isPurchasing = e.id?.startsWith('dml-') || e.id?.startsWith('sr-') || e.id?.startsWith('pr-');
    
    let isBanquet = false;
    let isBeverage = false;
    
    if (isPurchasing) {
      // STRICTLY rely on the form selection
      isBanquet = evCatLower === 'banquet';
      isBeverage = fbCatLower === 'beverage';
    } else {
      // Fallback inference for manual expenses
      const cleanString = (str: string) => str.replace(/food\s*&\s*beverage/g, '').replace(/f\s*&\s*b/g, '');
      const cleanCat = cleanString(catLower);
      const cleanName = cleanString(nameLower);
      const cleanDesc = cleanString(descLower);

      isBanquet = evCatLower === 'banquet' || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
      isBeverage = fbCatLower === 'beverage' || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
    }
    
    const isAlacarte = !isBanquet;

    if (!isBeverage && isAlacarte) {
      foodAlacarteExp += e.amount;
    } else if (!isBeverage && isBanquet) {
      foodBanquetExp += e.amount;
    } else if (isBeverage && isAlacarte) {
      beverageAlacarteExp += e.amount;
    } else if (isBeverage && isBanquet) {
      beverageBanquetExp += e.amount;
    }
  });

  const expAlacarte = posExpAlacarte + foodAlacarteExp + beverageAlacarteExp;
  const expBanquet = posExpBanquet + foodBanquetExp + beverageBanquetExp;
  const expFood = posExpFood + foodAlacarteExp + foodBanquetExp;
  const expBeverage = posExpBeverage + beverageAlacarteExp + beverageBanquetExp;

  // 3. Front Office & Purchasing expenses
  const frontOfficeAndPurchasingExpenseItems = expenses
    .filter(e => {
      const deptLower = (e.department || "").toLowerCase();
      return deptLower === 'front office' || deptLower === 'purchasing';
    });
  const expFrontOfficeAndPurchasing = frontOfficeAndPurchasingExpenseItems.reduce((sum, e) => sum + e.amount, 0);

  // 4. Other Manual Expenses (excluding Housekeeping, F&B, Front Office, and Purchasing)
  const otherManualExpenses = expenses
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
      
      const isFB = isBanquet || isBeverage || isFood;
      const isFOorPurchasing = deptLower === 'front office' || deptLower === 'purchasing';
      
      return !isHk && !isFB && !isFOorPurchasing;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOperationalExpenses = expHousekeeping + expAlacarte + expBanquet + expFrontOfficeAndPurchasing + otherManualExpenses;
  
  const expOperational = expFrontOfficeAndPurchasing + otherManualExpenses;
  
  const isAccommodation = (t: any) => {
      const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
      return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
  };
  const isFOOtherIncome = (t: any) => {
      const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
      return !isPOS && !isAccommodation(t);
  };

  const ledgerRoomRevenue = transactions
    .filter(isAccommodation)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const revenueHotelCollect = transactions
    .filter(isAccommodation)
    .reduce((sum, t) => sum + (Number(t.paidCash) || 0), 0);

  const revenueNexuraCollect = transactions
    .filter(isAccommodation)
    .reduce((sum, t) => sum + (Number(t.paidTransfer) || 0), 0);

  const ledgerOtherIncome = transactions
    .filter(isFOOtherIncome)
    .reduce((sum, t) => sum + t.amount, 0);

  const otherRevenueTotal = totalExtraIncome + ledgerOtherIncome;
  
  const totalRevenue = ledgerRoomRevenue + posRevAlacarte + posRevBanquet + otherRevenueTotal;
  
  const revFoodAlacarte = posRevFood;
  const revBeverageAlacarte = posRevBeverage;
  const revBanquetRevenue = posRevBanquet;
  const revTotalFnb = revFoodAlacarte + revBeverageAlacarte; 

  const pnlResult: GlobalPnLResult = {
    card1_TotalRevenue: totalRevenue,
    card2_NonCommRevenue: 0,
    card3_RevHotelCollect: revenueHotelCollect,
    card3_RevNexuraCollect: revenueNexuraCollect,
    card4_PenaltyFee: 0,
    card5_OtherRevenue: otherRevenueTotal,
    card6_GOP: totalRevenue - totalOperationalExpenses, 
    card7_TotalGOP: 0, 
    card8_TotalExpenses: totalOperationalExpenses,
    card9_FeeGrossRoom: ledgerRoomRevenue * (mgmtFeeRoomPercentage / 100),
    card9_FeeGrossFnb: (revTotalFnb + revBanquetRevenue) * (mgmtFeeFnbPercentage / 100),
    card9_FeeGross: (ledgerRoomRevenue * (mgmtFeeRoomPercentage / 100)) + ((revTotalFnb + revBanquetRevenue) * (mgmtFeeFnbPercentage / 100)),
    card10_GAP: 0,
    card11_VAT: totalRevenue * (vatPercentage / 100),
    card12_ReconOwner: 0, 
    revRoom: ledgerRoomRevenue,
    revFoodAlacarte: revFoodAlacarte,
    revBeverageAlacarte: revBeverageAlacarte,
    revBanquetRevenue: revBanquetRevenue,
    revBanquet: revBanquetRevenue,          
    revTotalFnb: revTotalFnb,
    revAlacarte: revTotalFnb,               
    expHousekeeping: expHousekeeping,
    expAlacarte: expAlacarte,
    expBanquet: expBanquet,
    expOperational: expOperational,         
    expFood: expFood,
    expBeverage: expBeverage,
    expFoodAlacarte: foodAlacarteExp,
    expBeverageAlacarte: beverageAlacarteExp,
    expFoodBanquet: foodBanquetExp,
    expBeverageBanquet: beverageBanquetExp,
    netProfit: 0,
    gopBasis: totalRevenue,
    gopFee: (ledgerRoomRevenue * (mgmtFeeRoomPercentage / 100)) + ((revTotalFnb + revBanquetRevenue) * (mgmtFeeFnbPercentage / 100)),
    totalGap: 0,
    investorDistributions: investors.map(inv => ({
      name: inv.name,
      share: inv.percentage || inv.share || 0,
      amount: 0 
    })),
    summaryServiceCharge: totalRevenue * (serviceChargePercentage / 100),
    summaryLostBreakage: totalRevenue * (lostBreakagePercentage / 100),
    summaryServiceChargeRate: serviceChargePercentage,
    summaryLostBreakageRate: lostBreakagePercentage
  };

  pnlResult.card7_TotalGOP = pnlResult.card1_TotalRevenue - pnlResult.card8_TotalExpenses;
  pnlResult.card12_ReconOwner = pnlResult.card7_TotalGOP 
    - (pnlResult.card11_VAT || 0) 
    - (pnlResult.summaryServiceCharge || 0) 
    - (pnlResult.summaryLostBreakage || 0) 
    - (pnlResult.card9_FeeGross || 0);
  pnlResult.netProfit = pnlResult.card12_ReconOwner;

  pnlResult.investorDistributions = pnlResult.investorDistributions.map(dist => ({
    ...dist,
    amount: pnlResult.netProfit * ((dist.share || 0) / 100)
  }));

  const operationalManualExpenses = expHousekeeping + foodAlacarteExp + foodBanquetExp + beverageAlacarteExp + beverageBanquetExp + otherManualExpenses;

  return {
    pnlResult,
    propertyStats: [],
    sharedExpensesTotal: operationalManualExpenses,
    mgmtExpensesTotal: 0,
    totalNonComm: 0,
    totalGOP: pnlResult.card7_TotalGOP,
    totalRevenueHotelCollect: revenueHotelCollect,
    finalMgmtNet: pnlResult.netProfit,
    feeForGOP: 0
  };
}

export function calculateInvestorShares(netProfit: number, investors: InvestorItem[]) {
  return investors.map(inv => ({
    ...inv,
    amount: netProfit * ((inv.percentage || inv.share || 0) / 100)
  }));
}
