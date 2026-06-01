"use client";

import { 
  GlobalPnLResult, 
  PnlIncomeItem, 
  PnlExpenseItem, 
  InvestorItem,
  DrillDownData
} from "./pnl-utils";

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

export function processPnLData(
  transactions: ExtendedTransaction[],
  customIncomes: PnlIncomeItem[],
  nonCommissionRevenue: PnlIncomeItem[],
  expenses: PnlExpenseItem[],
  investors: InvestorItem[],
  vatPercentage: number = 11,
  hotelGopPercentages: Record<string, any> = {},
  allHotels: HotelMaster[] = [],
  mgmtFeePercentage: number = 10,
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
  // Placeholder implementation to allow build to pass
  // Real logic would be more complex
  
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
  // 2. F&B expenses divided into 4 categories (includes both purchasing docs and manual entries)
  const fbExpenses = expenses.filter(e => {
    const nameLower = (e.name || "").toLowerCase();
    const deptLower = (e.department || "").toLowerCase();
    const catLower = (e.category || "").toLowerCase();
    const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
    
    return (
      deptLower.includes('food & beverage') || 
      deptLower === 'f&b' ||
      catLower.includes('food & beverage') ||
      catLower === 'f&b' ||
      nameLower.includes('food & beverage') || 
      nameLower.includes('f&b') || 
      fbCatLower !== ""
    );
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

    // Check if Beverage vs Food
    const isBeverage = 
      fbCatLower.includes('beverage') || 
      catLower.includes('beverage') || 
      catLower.includes('drink') || 
      catLower.includes('minuman') || 
      nameLower.includes('beverage') || 
      nameLower.includes('drink') || 
      nameLower.includes('minuman') ||
      descLower.includes('beverage') || 
      descLower.includes('drink') || 
      descLower.includes('minuman');
    
    // Check if Banquet vs A la Carte
    const isBanquet = 
      evCatLower.includes('banquet') || 
      nameLower.includes('banquet') || 
      descLower.includes('banquet');
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
      
      const isHousekeeping = deptLower === 'housekeeping';
      const isFB = 
        deptLower.includes('food & beverage') || 
        deptLower === 'f&b' ||
        catLower.includes('food & beverage') ||
        catLower === 'f&b' ||
        nameLower.includes('food & beverage') || 
        nameLower.includes('f&b') || 
        fbCatLower !== "";
      const isFOorPurchasing = deptLower === 'front office' || deptLower === 'purchasing';
      
      return !isHousekeeping && !isFB && !isFOorPurchasing;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOperationalExpenses = expHousekeeping + expAlacarte + expBanquet + expFrontOfficeAndPurchasing + otherManualExpenses;
  
  // Operational Expenses = all expenses excluding Housekeeping, F&B (A la Carte + Banquet)
  // i.e. Front Office + Purchasing + other manual expenses
  const expOperational = expFrontOfficeAndPurchasing + otherManualExpenses;
  
  // Match Front Office Overview logic for Accommodation vs Other Income
  const isAccommodation = (t: any) => {
      const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
      return !isPOS && (t.type === "accommodation" || (!t.type && t.guestName));
  };
  const isFOOtherIncome = (t: any) => {
      const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
      return !isPOS && !isAccommodation(t);
  };

  // Calculate Room Revenue (Accommodation only)
  const ledgerRoomRevenue = transactions
    .filter(isAccommodation)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate Revenue Hotel Collect (Pay at Hotel) - Accommodation only
  const revenueHotelCollect = transactions
    .filter(isAccommodation)
    .reduce((sum, t) => sum + (Number(t.paidCash) || 0), 0);

  // Calculate Revenue Nexura Collect (Pay at Nexura) - Accommodation only
  const revenueNexuraCollect = transactions
    .filter(isAccommodation)
    .reduce((sum, t) => sum + (Number(t.paidTransfer) || 0), 0);

  // Other Income from daily_revenue (Ledger) - Matches FO Overview
  const ledgerOtherIncome = transactions
    .filter(isFOOtherIncome)
    .reduce((sum, t) => sum + t.amount, 0);

  // Card 5: Other Revenue (Manual + Ledger) – kept separate from Gross Revenue
  const otherRevenueTotal = totalExtraIncome + ledgerOtherIncome;
  
  // Total Gross Revenue = Room Revenue + Total F&B A la Carte Revenue + Banquet Revenue + Other Revenue
  const totalRevenue = ledgerRoomRevenue + posRevAlacarte + posRevBanquet + otherRevenueTotal;
  
  const revFoodAlacarte = posRevFood;
  const revBeverageAlacarte = posRevBeverage;
  const revBanquetRevenue = posRevBanquet;
  const revTotalFnb = revFoodAlacarte + revBeverageAlacarte; // F&B A la Carte only (no Banquet)

  const pnlResult: GlobalPnLResult = {
    card1_TotalRevenue: totalRevenue,
    card2_NonCommRevenue: 0,
    card3_RevHotelCollect: revenueHotelCollect,
    card3_RevNexuraCollect: revenueNexuraCollect,
    card4_PenaltyFee: 0,
    card5_OtherRevenue: otherRevenueTotal,
    card6_GOP: totalRevenue - totalOperationalExpenses, 
    card7_TotalGOP: 0, // Calculated below
    card8_TotalExpenses: totalOperationalExpenses,
    // VAT and Management Fee are applied on Total Gross Revenue
    card9_FeeGross: totalRevenue * (mgmtFeePercentage / 100), 
    card10_GAP: 0,
    card11_VAT: totalRevenue * (vatPercentage / 100),
    card12_ReconOwner: 0, 
    revRoom: ledgerRoomRevenue,
    revFoodAlacarte: revFoodAlacarte,
    revBeverageAlacarte: revBeverageAlacarte,
    revBanquetRevenue: revBanquetRevenue,
    revBanquet: revBanquetRevenue,          // alias used by Executive Summary
    revTotalFnb: revTotalFnb,
    revAlacarte: revTotalFnb,               // alias: Total F&B A la Carte
    expHousekeeping: expHousekeeping,
    expAlacarte: expAlacarte,
    expBanquet: expBanquet,
    expOperational: expOperational,         // Front Office + Purchasing + Other (excl. HK & F&B)
    expFood: expFood,
    expBeverage: expBeverage,
    expFoodAlacarte: foodAlacarteExp,
    expBeverageAlacarte: beverageAlacarteExp,
    expFoodBanquet: foodBanquetExp,
    expBeverageBanquet: beverageBanquetExp,
    netProfit: 0,
    gopBasis: totalRevenue,
    gopFee: totalRevenue * (mgmtFeePercentage / 100),
    totalGap: 0,
    investorDistributions: investors.map(inv => ({
      name: inv.name,
      share: inv.percentage || inv.share || 0,
      amount: 0 // Calculated below
    })),
    // Service Charge and Lost Breakage are applied on F&B A la Carte Revenue only
    summaryServiceCharge: revTotalFnb * (serviceChargePercentage / 100),
    summaryLostBreakage: revTotalFnb * (lostBreakagePercentage / 100),
    summaryServiceChargeRate: serviceChargePercentage,
    summaryLostBreakageRate: lostBreakagePercentage
  };

  // Formula 1: Total GOP = Total Gross Revenue - Total Operational Expenses
  pnlResult.card7_TotalGOP = pnlResult.card1_TotalRevenue - pnlResult.card8_TotalExpenses;
  
  // Formula 2: Net Profit = Total GOP - VAT - Service Charge - Lost & Breakage - Management Fee
  pnlResult.card12_ReconOwner = pnlResult.card7_TotalGOP 
    - (pnlResult.card11_VAT || 0) 
    - (pnlResult.summaryServiceCharge || 0) 
    - (pnlResult.summaryLostBreakage || 0) 
    - (pnlResult.card9_FeeGross || 0);
  pnlResult.netProfit = pnlResult.card12_ReconOwner;

  // Update investor amounts based on the final net profit
  pnlResult.investorDistributions = pnlResult.investorDistributions.map(dist => ({
    ...dist,
    amount: pnlResult.netProfit * (dist.share / 100)
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

  // Normalise the cardId to handle dynamic percentages in labels and different variations
  let normalizedCardId = cardId;
  if (cardId.startsWith("VAT Input")) normalizedCardId = "VAT Input";
  else if (cardId.startsWith("Service Charge")) normalizedCardId = "Service Charge";
  else if (cardId.startsWith("Lost & Breakage")) normalizedCardId = "Lost & Breakage";
  else if (cardId.startsWith("Management Fee")) normalizedCardId = "Management Fee";
  else if (cardId === "Room Revenue") normalizedCardId = "Revenue Room";
  else if (cardId === "Total Banquet Revenue") normalizedCardId = "Banquet Revenue";

  switch (normalizedCardId) {
    case "Revenue Hotel Collect":
      items = rawTransactions
        .filter(t => t.type !== "other_income" && (Number(t.paidCash) || 0) > 0)
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
      break;

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

    case "Food A La Carte Revenue":
      items = [
        ...posOrders.filter(o => o.category === 'food'),
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

    case "Beverage A La Carte Revenue":
      items = [
        ...posOrders.filter(o => o.category === 'beverage'),
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

    case "Banquet Revenue":
      items = [
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
      break;

    case "Total F&B A la Carte Revenue":
      items = [
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
      break;

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

    case "Food A la Carte Performance":
      {
        const incomes = [
          ...posOrders.filter(o => o.category === 'food'),
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

        const fbExpenses = expenses.filter(e => {
          const nameLower = (e.name || "").toLowerCase();
          const deptLower = (e.department || "").toLowerCase();
          const catLower = (e.category || "").toLowerCase();
          const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
          
          return (
            deptLower.includes('food & beverage') || 
            deptLower === 'f&b' ||
            catLower.includes('food & beverage') ||
            catLower === 'f&b' ||
            nameLower.includes('food & beverage') || 
            nameLower.includes('f&b') || 
            fbCatLower !== ""
          );
        });

        const exps = fbExpenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const descLower = (e.description || "").toLowerCase();
            const catLower = (e.category || "").toLowerCase();
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();

            const isBeverage = 
              fbCatLower.includes('beverage') || 
              catLower.includes('beverage') || 
              catLower.includes('drink') || 
              catLower.includes('minuman') || 
              nameLower.includes('beverage') || 
              nameLower.includes('drink') || 
              nameLower.includes('minuman') ||
              descLower.includes('beverage') || 
              descLower.includes('drink') || 
              descLower.includes('minuman');
            
            const isBanquet = 
              evCatLower.includes('banquet') || 
              nameLower.includes('banquet') || 
              descLower.includes('banquet');
            
            return !isBeverage && !isBanquet;
          })
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual Expense')),
            description: e.description || e.name,
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            documentId: e.id?.startsWith('sr-') ? e.id : undefined,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));

        items = [...incomes, ...exps];
      }
      break;

    case "Banquet Performance":
      {
        const incomes = [
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

        const fbExpenses = expenses.filter(e => {
          const nameLower = (e.name || "").toLowerCase();
          const deptLower = (e.department || "").toLowerCase();
          const catLower = (e.category || "").toLowerCase();
          const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
          
          return (
            deptLower.includes('food & beverage') || 
            deptLower === 'f&b' ||
            catLower.includes('food & beverage') ||
            catLower === 'f&b' ||
            nameLower.includes('food & beverage') || 
            nameLower.includes('f&b') || 
            fbCatLower !== ""
          );
        });

        const exps = fbExpenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const descLower = (e.description || "").toLowerCase();
            const catLower = (e.category || "").toLowerCase();
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();

            const isBanquet = 
              evCatLower.includes('banquet') || 
              nameLower.includes('banquet') || 
              descLower.includes('banquet');
            
            return isBanquet;
          })
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual Expense')),
            description: e.description || e.name,
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            documentId: e.id?.startsWith('sr-') ? e.id : undefined,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));

        items = [...incomes, ...exps];
      }
      break;

    case "Total F&B A la Carte Performance":
      {
        const incomes = [
          ...posOrders.filter(o => o.category === 'food' || o.category === 'beverage'),
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

        const fbExpenses = expenses.filter(e => {
          const nameLower = (e.name || "").toLowerCase();
          const deptLower = (e.department || "").toLowerCase();
          const catLower = (e.category || "").toLowerCase();
          const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
          
          return (
            deptLower.includes('food & beverage') || 
            deptLower === 'f&b' ||
            catLower.includes('food & beverage') ||
            catLower === 'f&b' ||
            nameLower.includes('food & beverage') || 
            nameLower.includes('f&b') || 
            fbCatLower !== ""
          );
        });

        const exps = fbExpenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const descLower = (e.description || "").toLowerCase();
            const catLower = (e.category || "").toLowerCase();
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();

            const isBanquet = 
              evCatLower.includes('banquet') || 
              nameLower.includes('banquet') || 
              descLower.includes('banquet');
            
            return !isBanquet;
          })
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual Expense')),
            description: e.description || e.name,
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            documentId: e.id?.startsWith('sr-') ? e.id : undefined,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));

        items = [...incomes, ...exps];
      }
      break;

    case "Beverage A la Carte Performance":
      {
        const incomes = [
          ...posOrders.filter(o => o.category === 'beverage'),
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

        const fbExpenses = expenses.filter(e => {
          const nameLower = (e.name || "").toLowerCase();
          const deptLower = (e.department || "").toLowerCase();
          const catLower = (e.category || "").toLowerCase();
          const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
          
          return (
            deptLower.includes('food & beverage') || 
            deptLower === 'f&b' ||
            catLower.includes('food & beverage') ||
            catLower === 'f&b' ||
            nameLower.includes('food & beverage') || 
            nameLower.includes('f&b') || 
            fbCatLower !== ""
          );
        });

        const exps = fbExpenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const descLower = (e.description || "").toLowerCase();
            const catLower = (e.category || "").toLowerCase();
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();

            const isBeverage = 
              fbCatLower.includes('beverage') || 
              catLower.includes('beverage') || 
              catLower.includes('drink') || 
              catLower.includes('minuman') || 
              nameLower.includes('beverage') || 
              nameLower.includes('drink') || 
              nameLower.includes('minuman') ||
              descLower.includes('beverage') || 
              descLower.includes('drink') || 
              descLower.includes('minuman');
            
            const isBanquet = 
              evCatLower.includes('banquet') || 
              nameLower.includes('banquet') || 
              descLower.includes('banquet');
            
            return isBeverage && !isBanquet;
          })
          .map(e => ({
            id: e.id || Math.random().toString(),
            type: 'expense',
            source: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual Expense')),
            description: e.description || e.name,
            amount: e.amount,
            date: e.date || 'N/A',
            department: e.department,
            documentId: e.id?.startsWith('sr-') ? e.id : undefined,
            docType: e.id?.startsWith('sr-') ? 'SR' : (e.id?.startsWith('dml-') ? 'DML' : (e.id?.startsWith('pr-') ? 'PR' : 'Manual'))
          }));

        items = [...incomes, ...exps];
      }
      break;

    case "Total Gross Revenue":
      {
        const roomRev = rawTransactions
          .filter(t => t.type !== "other_income")
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
            .filter(t => t.type === "other_income")
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
          ...customIncomes.map(i => ({
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

    case "Total GOP":
      {
        const roomRev = rawTransactions
          .filter(t => t.type !== "other_income")
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
            .filter(t => t.type === "other_income")
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
          ...customIncomes.map(i => ({
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

    case "Net Profit (Recon Owner)":
      {
        const roomRev = rawTransactions
          .filter(t => t.type !== "other_income")
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
            .filter(t => t.type === "other_income")
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
          ...customIncomes.map(i => ({
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

        const totalExtraIncome = customIncomes.reduce((sum, i) => sum + i.amount, 0);
        const ledgerRoomRevenue = rawTransactions.filter(t => t.type !== "other_income").reduce((sum, t) => sum + t.amount, 0);
        const posRevAlacarte = posOrders.filter(o => o.category === 'food' || o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const posRevBanquet = posOrders.filter(o => o.category === 'banquet').reduce((sum, o) => sum + o.amount, 0);
        const ledgerOtherIncome = rawTransactions.filter(t => t.type === "other_income").reduce((sum, t) => sum + t.amount, 0);
        const otherRevenueTotal = totalExtraIncome + ledgerOtherIncome;
        const totalRevenue = otherRevenueTotal + ledgerRoomRevenue + posRevAlacarte + posRevBanquet;

        const deductions: any[] = [];
        const vatAmount = totalRevenue * (vatPercentage / 100);
        const mgmtFeeAmount = totalRevenue * (mgmtFeePercentage / 100);
        
        const posRevFood = posOrders.filter(o => o.category === 'food').reduce((sum, o) => sum + o.amount, 0);
        const posRevBeverage = posOrders.filter(o => o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const revTotalFnb = posRevFood + posRevBeverage;
        
        const serviceChargeAmount = revTotalFnb * (serviceChargePercentage / 100);
        const lostBreakageAmount = revTotalFnb * (lostBreakagePercentage / 100);

        if (vatAmount > 0) {
          deductions.push({
            id: 'ded-vat',
            type: 'expense',
            source: 'Deduction',
            description: `VAT Input (${vatPercentage}%)`,
            amount: vatAmount,
            date: 'N/A',
            department: 'Tax',
            docType: 'Calculated'
          });
        }
        if (mgmtFeeAmount > 0) {
          deductions.push({
            id: 'ded-mgmt',
            type: 'expense',
            source: 'Deduction',
            description: `Management Fee (${mgmtFeePercentage}%)`,
            amount: mgmtFeeAmount,
            date: 'N/A',
            department: 'Fee',
            docType: 'Calculated'
          });
        }
        if (serviceChargeAmount > 0) {
          deductions.push({
            id: 'ded-service',
            type: 'expense',
            source: 'Deduction',
            description: `Service Charge (${serviceChargePercentage}%)`,
            amount: serviceChargeAmount,
            date: 'N/A',
            department: 'F&B',
            docType: 'Calculated'
          });
        }
        if (lostBreakageAmount > 0) {
          deductions.push({
            id: 'ded-lost',
            type: 'expense',
            source: 'Deduction',
            description: `Lost & Breakage (${lostBreakagePercentage}%)`,
            amount: lostBreakageAmount,
            date: 'N/A',
            department: 'F&B',
            docType: 'Calculated'
          });
        }

        items = [...roomRev, ...fnbAlacarteRev, ...banquetRev, ...otherRev, ...opExps, ...deductions];
      }
      break;

    case "Total F&B A la Carte Expenses":
      {
        const fbExpenses = expenses.filter(e => {
          const nameLower = (e.name || "").toLowerCase();
          const deptLower = (e.department || "").toLowerCase();
          const catLower = (e.category || "").toLowerCase();
          const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
          return (
            deptLower.includes('food & beverage') || 
            deptLower === 'f&b' ||
            catLower.includes('food & beverage') ||
            catLower === 'f&b' ||
            nameLower.includes('food & beverage') || 
            nameLower.includes('f&b') || 
            fbCatLower !== ""
          );
        });

        items = fbExpenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const descLower = (e.description || "").toLowerCase();
            const catLower = (e.category || "").toLowerCase();
            const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();

            const isBeverage = 
              fbCatLower.includes('beverage') || 
              catLower.includes('beverage') || 
              catLower.includes('drink') || 
              catLower.includes('minuman') || 
              nameLower.includes('beverage') || 
              nameLower.includes('drink') || 
              nameLower.includes('minuman') ||
              descLower.includes('beverage') || 
              descLower.includes('drink') || 
              descLower.includes('minuman');
            
            const isBanquet = 
              evCatLower.includes('banquet') || 
              nameLower.includes('banquet') || 
              descLower.includes('banquet');
            
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
          const deptLower = (e.department || "").toLowerCase();
          const catLower = (e.category || "").toLowerCase();
          const fbCatLower = (e.fbCategory || (e as any).fb_category || "").toLowerCase();
          return (
            deptLower.includes('food & beverage') || 
            deptLower === 'f&b' ||
            catLower.includes('food & beverage') ||
            catLower === 'f&b' ||
            nameLower.includes('food & beverage') || 
            nameLower.includes('f&b') || 
            fbCatLower !== ""
          );
        });

        items = fbExpenses
          .filter(e => {
            const nameLower = (e.name || "").toLowerCase();
            const descLower = (e.description || "").toLowerCase();
            const evCatLower = (e.eventCategory || (e as any).event_category || "").toLowerCase();

            const isBanquet = 
              evCatLower.includes('banquet') || 
              nameLower.includes('banquet') || 
              descLower.includes('banquet');
            
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
            const isHk = deptLower === 'housekeeping';
            const isFb = deptLower.includes('food & beverage') || deptLower === 'f&b' || catLower.includes('food & beverage') || catLower === 'f&b' || nameLower.includes('food & beverage') || nameLower.includes('f&b') || fbCatLower !== "";
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
          return (
            deptLower.includes('food & beverage') || 
            deptLower === 'f&b' ||
            catLower.includes('food & beverage') ||
            catLower === 'f&b' ||
            nameLower.includes('food & beverage') || 
            nameLower.includes('f&b') || 
            fbCatLower !== ""
          );
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
            const isFb = deptLower.includes('food & beverage') || deptLower === 'f&b' || catLower.includes('food & beverage') || catLower === 'f&b' || nameLower.includes('food & beverage') || nameLower.includes('f&b') || fbCatLower !== "";
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

        items = [...hk, ...fbExpenses, ...foPurchasing, ...otherManual];
      }
      break;

    case "VAT Input":
      {
        const totalExtraIncome = customIncomes.reduce((sum, i) => sum + i.amount, 0);
        const ledgerRoomRevenue = rawTransactions.filter(t => t.type !== "other_income").reduce((sum, t) => sum + t.amount, 0);
        const posRevAlacarte = posOrders.filter(o => o.category === 'food' || o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const posRevBanquet = posOrders.filter(o => o.category === 'banquet').reduce((sum, o) => sum + o.amount, 0);
        const ledgerOtherIncome = rawTransactions.filter(t => t.type === "other_income").reduce((sum, t) => sum + t.amount, 0);
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
        const posRevFood = posOrders.filter(o => o.category === 'food').reduce((sum, o) => sum + o.amount, 0);
        const posRevBeverage = posOrders.filter(o => o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const revTotalFnb = posRevFood + posRevBeverage;
        const serviceChargeAmount = revTotalFnb * (serviceChargePercentage / 100);

        items = [{
          id: 'service-calc',
          type: 'expense',
          source: 'Deduction',
          description: `Calculated Service Charge (${serviceChargePercentage}%) of Total F&B A la Carte Revenue (${revTotalFnb.toLocaleString('id-ID')})`,
          amount: serviceChargeAmount,
          date: 'N/A',
          department: 'F&B',
          docType: 'Calculated'
        }];
      }
      break;

    case "Lost & Breakage":
      {
        const posRevFood = posOrders.filter(o => o.category === 'food').reduce((sum, o) => sum + o.amount, 0);
        const posRevBeverage = posOrders.filter(o => o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const revTotalFnb = posRevFood + posRevBeverage;
        const lostBreakageAmount = revTotalFnb * (lostBreakagePercentage / 100);

        items = [{
          id: 'lost-calc',
          type: 'expense',
          source: 'Deduction',
          description: `Calculated Lost & Breakage (${lostBreakagePercentage}%) of Total F&B A la Carte Revenue (${revTotalFnb.toLocaleString('id-ID')})`,
          amount: lostBreakageAmount,
          date: 'N/A',
          department: 'F&B',
          docType: 'Calculated'
        }];
      }
      break;

    case "Management Fee":
      {
        const totalExtraIncome = customIncomes.reduce((sum, i) => sum + i.amount, 0);
        const ledgerRoomRevenue = rawTransactions.filter(t => t.type !== "other_income").reduce((sum, t) => sum + t.amount, 0);
        const posRevAlacarte = posOrders.filter(o => o.category === 'food' || o.category === 'beverage').reduce((sum, o) => sum + o.amount, 0);
        const posRevBanquet = posOrders.filter(o => o.category === 'banquet').reduce((sum, o) => sum + o.amount, 0);
        const ledgerOtherIncome = rawTransactions.filter(t => t.type === "other_income").reduce((sum, t) => sum + t.amount, 0);
        const otherRevenueTotal = totalExtraIncome + ledgerOtherIncome;
        const totalRevenue = otherRevenueTotal + ledgerRoomRevenue + posRevAlacarte + posRevBanquet;
        const mgmtFeeAmount = totalRevenue * (mgmtFeePercentage / 100);

        items = [{
          id: 'mgmt-calc',
          type: 'expense',
          source: 'Deduction',
          description: `Calculated Management Fee (${mgmtFeePercentage}%) of Total Gross Revenue (${totalRevenue.toLocaleString('id-ID')})`,
          amount: mgmtFeeAmount,
          date: 'N/A',
          department: 'Fee',
          docType: 'Calculated'
        }];
      }
      break;

    default:
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
      break;
  }

  return {
    title: title,
    items: items,
  };
}

export function calculateInvestorShares(netProfit: number, investors: InvestorItem[]) {
  return investors.map(inv => ({
    ...inv,
    amount: netProfit * ((inv.percentage || inv.share || 0) / 100)
  }));
}
