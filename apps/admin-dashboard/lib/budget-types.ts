// ─── Budget Types (USALI Hotel Accounting Standard & Detailed Excel Mirror) ───

export interface DeptSalaryWages {
  salaryKontrak: number;
  wagesDailyWorker: number;
  bpjsKesehatan: number;
  bpjsKetenagakerjaan: number;
  bonusThr: number;
  payrollTax: number;
  employeeMeals: number;
  employeeHousing: number;
  overtimePay: number;
  employeeTransportation: number;
  wagesCasual: number;
  total: number;
}

export const createDefaultSalaryWages = (): DeptSalaryWages => ({
  salaryKontrak: 0,
  wagesDailyWorker: 0,
  bpjsKesehatan: 0,
  bpjsKetenagakerjaan: 0,
  bonusThr: 0,
  payrollTax: 0,
  employeeMeals: 0,
  employeeHousing: 0,
  overtimePay: 0,
  employeeTransportation: 0,
  wagesCasual: 0,
  total: 0,
});

export interface BudgetStatistic {
  roomsAvailable: number;
  roomsOutOfOrder: number;
  houseUse: number;
  roomsCompliment: number;
  occupiedRoomsPaid: number;
  occupancyPercent: number;
  arrIdr: number;
  arrUsd?: number;
  payingPax: number;
  houseUsePax: number;
  complimentPax: number;
  totalPax: number;
  revPar?: number;
  trevPar?: number;
  trevPor?: number;
}

// ── 1. ROOM DEPARTMENT (ROOM-FO & ROOM-HK) ──

export interface RoomFoExpenses {
  uniform: number;
  printingStationery: number;
  transportFuel: number;
  travelExpenses: number;
  consultant: number;
  decoration: number;
  guestTransportation: number;
  reservationExpenses: number;
  guestSupplies: number;
  telephone: number;
  tvCable: number;
  internetProvider: number;
  entertainment: number;
  newspaperMagazine: number;
  postageCourier: number;
  pestControl: number;
  cleaningSupplies: number;
  commission: number;
  pulsaHp: number;
  welcomeDrink: number;
  miscellaneous: number;
  total: number;
}

export interface RoomHkExpenses {
  uniform: number;
  guestLaundry: number;
  printingStationery: number;
  transportFuel: number;
  travelExpenses: number;
  consultant: number;
  equipmentRental: number;
  decoration: number;
  guestSupplies: number;
  cleaningSupplies: number;
  linenReplacement: number;
  chinaGlassReplacement: number;
  telephone: number;
  landscapeGround: number;
  roomDeodorant: number;
  pestControl: number;
  postageCourier: number;
  pulsaHp: number;
  laundryLinen: number;
  miscellaneous: number;
  total: number;
}

export interface RoomDepartmentBudget {
  revenue: {
    lodging: number;
    extraBed: number;
    otherRoomRevenue: number;
    total: number;
  };
  cogs: {
    roomSupplies: number;
    linenReplacement: number;
    total: number;
  };
  frontOffice: {
    salary: DeptSalaryWages;
    expenses: RoomFoExpenses;
    totalExpenses: number;
  };
  housekeeping: {
    salary: DeptSalaryWages;
    expenses: RoomHkExpenses;
    totalExpenses: number;
  };
  totalExpenses: number;
  departmentProfit: number;
}

// ── 2. FOOD & BEVERAGE DEPARTMENT ──

export interface FbSubOutletRevenue {
  food: number;
  beverage: number;
  other: number;
  total: number;
}

export interface FbSubOutletCogs {
  costFood: number;
  costBeverage: number;
  costOther: number;
  total: number;
}

export interface FbOutletExpenses {
  uniform: number;
  printingStationery: number;
  transportFuel: number;
  entertainment: number;
  testFood: number;
  decoration: number;
  equipmentRental: number;
  kitchenSupplies: number;
  guestSupplies: number;
  cleaningSupplies: number;
  linenReplacement: number;
  chinaGlassSilverware: number;
  telephone: number;
  spoilage: number;
  specialPromotion: number;
  laundryLinen: number;
  pestControl: number;
  postageCourier: number;
  banquetExpenses: number;
  kitchenFuelGas: number;
  paperSupplies: number;
  menuFoodBevList: number;
  serviceEquipment: number;
  miscellaneous: number;
  total: number;
}

export interface FbDepartmentBudget {
  revenue: {
    restaurant: FbSubOutletRevenue;
    kitchen: FbSubOutletRevenue;
    lounge: FbSubOutletRevenue;
    banquet: FbSubOutletRevenue;
    roomService: FbSubOutletRevenue;
    totalFood: number;
    totalBeverage: number;
    totalOther: number;
    total: number;
  };
  cogs: {
    restaurant: FbSubOutletCogs;
    kitchen: FbSubOutletCogs;
    lounge: FbSubOutletCogs;
    banquet: FbSubOutletCogs;
    roomService: FbSubOutletCogs;
    total: number;
    fnbCostPercent: number;
  };
  restaurant: {
    salary: DeptSalaryWages;
    expenses: FbOutletExpenses;
    totalExpenses: number;
  };
  kitchen: {
    salary: DeptSalaryWages;
    expenses: FbOutletExpenses;
    totalExpenses: number;
  };
  lounge: {
    salary: DeptSalaryWages;
    expenses: FbOutletExpenses;
    totalExpenses: number;
  };
  banquet: {
    salary: DeptSalaryWages;
    expenses: FbOutletExpenses;
    totalExpenses: number;
  };
  roomService: {
    salary: DeptSalaryWages;
    expenses: FbOutletExpenses;
    totalExpenses: number;
  };
  totalExpenses: number;
  departmentProfit: number;
}

// ── 3. MINOR OPERATING DEPARTMENTS (MOD) ──

export interface LaundryExpenses {
  uniform: number;
  chemicalSupplies: number;
  packingSupplies: number;
  machineMaintenance: number;
  transportFuel: number;
  miscellaneous: number;
  total: number;
}

export interface SpaExpenses {
  uniform: number;
  massageOilsLinen: number;
  aromatherapySupplies: number;
  guestSupplies: number;
  cleaningSupplies: number;
  miscellaneous: number;
  total: number;
}

export interface ModDepartmentBudget {
  laundry: {
    revenue: {
      laundry: number;
      dryClean: number;
      pressing: number;
      other: number;
      total: number;
    };
    cogs: {
      costLaundry: number;
      costOther: number;
      total: number;
    };
    salary: DeptSalaryWages;
    expenses: LaundryExpenses;
    totalExpenses: number;
    departmentProfit: number;
  };
  spaFitness: {
    revenue: {
      massageTherapy: number;
      fitness: number;
      others: number;
      total: number;
    };
    cogs: {
      costTreatment: number;
      costOthers: number;
      total: number;
    };
    salary: DeptSalaryWages;
    expenses: SpaExpenses;
    totalExpenses: number;
    departmentProfit: number;
  };
  otherIncome: {
    revenue: {
      spaceRental: number;
      transportation: number;
      commission: number;
      cityTour: number;
      others: number;
      total: number;
    };
    cogs: {
      costSpaceRental: number;
      costCarRental: number;
      costCommission: number;
      costCityTour: number;
      costOthers: number;
      total: number;
    };
    departmentProfit: number;
  };
  totalRevenue: number;
  totalCogs: number;
  totalExpenses: number;
  departmentProfit: number;
}

// ── 4. ADMINISTRATIVE & GENERAL (A&G) ──

export interface AgExpenses {
  uniform: number;
  printingStationery: number;
  postageCourier: number;
  transportFuelParking: number;
  entertainment: number;
  travelExpenses: number;
  telephone: number;
  internetProvider: number;
  tvCable: number;
  bankChargesEdc: number;
  legalAuditFees: number;
  consultant: number;
  securityExpenses: number;
  recruitmentFee: number;
  softwareLicensesIt: number;
  trainingDevelopment: number;
  taxConsultant: number;
  insuranceProperty: number;
  insuranceGeneral: number;
  donationCommunity: number;
  badDebtProvision: number;
  miscellaneous: number;
  total: number;
}

export interface AgDepartmentBudget {
  salary: DeptSalaryWages;
  expenses: AgExpenses;
  totalExpenses: number;
}

// ── 5. HUMAN RESOURCES DEPARTMENT (HRD) ──

export interface HrdExpenses {
  uniform: number;
  printingStationery: number;
  recruitmentAdvertisement: number;
  trainingSeminar: number;
  medicalClinic: number;
  staffGatheringOuting: number;
  employeeAppreciationAward: number;
  sportsRecreation: number;
  consultantHrd: number;
  miscellaneous: number;
  total: number;
}

export interface HrdDepartmentBudget {
  salary: DeptSalaryWages;
  expenses: HrdExpenses;
  totalExpenses: number;
}

// ── 6. SALES & MARKETING (SM) ──

export interface SmExpenses {
  uniform: number;
  printingStationery: number;
  marketingCollateralsBrochures: number;
  advertisingPromotionOnline: number;
  otaCommissions: number;
  travelAgentCommissions: number;
  salesTripsTravel: number;
  clientEntertainment: number;
  websiteHostingDomain: number;
  photoVideoShootingContent: number;
  exhibitionsTradeShows: number;
  publicRelationsMedia: number;
  guestGiftsSouvenirs: number;
  telephoneInternet: number;
  miscellaneous: number;
  total: number;
}

export interface SmDepartmentBudget {
  salary: DeptSalaryWages;
  expenses: SmExpenses;
  totalExpenses: number;
}

// ── 7. PROPERTY OPERATIONS, MAINTENANCE & ENERGY (POMEC) ──

export interface PomecEnergyExpenses {
  electricityPln: number;
  waterPdamWell: number;
  kitchenLpgGas: number;
  dieselFuelSolar: number;
  total: number;
}

export interface PomecMaintenanceExpenses {
  airConditioning: number;
  generatorElectrical: number;
  plumbingWaterSystem: number;
  buildingStructural: number;
  kitchenEquipmentMaint: number;
  swimmingPoolChemicals: number;
  fireSafetyEquipment: number;
  landscapingGardening: number;
  itHardwareMaintenance: number;
  elevatorMaintenance: number;
  paintingCarpentry: number;
  toolsEquipment: number;
  pestControlBuilding: number;
  miscellaneous: number;
  total: number;
}

export interface PomecDepartmentBudget {
  salary: DeptSalaryWages;
  energy: PomecEnergyExpenses;
  maintenance: PomecMaintenanceExpenses;
  totalExpenses: number;
}

// ── 8. NON-OPERATING EXPENSES & FEES (NonOP) ──

export interface NonOpDepartmentBudget {
  managementBaseFee: number;
  managementIncentiveFee: number;
  franchiseRoyaltyFee: number;
  buildingInsurance: number;
  propertyTaxPbb: number;
  bankInterestCharges: number;
  depreciationAmortization: number;
  total: number;
}

// ── 9. SUMMARY P&L & MONTH DATA STRUCTURE ──

export interface SummaryPnLBudget {
  // 1. Total Gross & Net Revenue
  roomRevenue: number;
  fnbRevenue: number;
  modRevenue: number;
  totalNetRevenue: number;
  serviceCharge: number;
  governmentTax: number;
  totalGrossRevenue: number;

  // 2. Total Cost of Sales
  roomCogs: number;
  fnbCogs: number;
  modCogs: number;
  totalCogs: number;
  grossProfit: number;
  grossProfitMarginPercent: number;

  // 3. Departmental Operating Expenses
  roomExpenses: number;
  fnbExpenses: number;
  modExpenses: number;
  totalDepartmentalExpenses: number;
  totalDepartmentalProfit: number; // TDP
  tdpMarginPercent: number;

  // 4. Undistributed Operating Expenses (UOE)
  agExpenses: number;
  hrdExpenses: number;
  smExpenses: number;
  pomecExpenses: number;
  totalUndistributedExpenses: number;

  // 5. Gross Operating Profit (GOP)
  grossOperatingProfit: number;
  gopMarginPercent: number;

  // 6. Non-Operating Expenses & Net Operating Income (NOI)
  nonOperatingExpenses: number;
  netOperatingIncome: number;
  noiMarginPercent: number;
}

// Backward-compatible Month Data supporting both high-level DSR and deep Departmental Budgeting
export interface BudgetMonthData {
  statistic: BudgetStatistic;
  
  // High-Level Summary for DSR & Engine compatibility
  roomRevenue: {
    lodging: number;
    extraBed: number;
    otherRoomRevenue: number;
    totalRoomRevenue: number;
  };
  fnbRevenue: {
    food: {
      breakfast: number;
      restaurant: number;
      roomService: number;
      banquet: number;
      totalFoodRevenue: number;
    };
    beverage: {
      restaurant: number;
      roomService: number;
      banquet: number;
      minibar: number;
      totalBeverageRevenue: number;
    };
    other: {
      restaurant: number;
      banquet: number;
      totalOtherFnBRevenue: number;
    };
    totalFnBRevenue: number;
  };
  minorOperatingRevenue: {
    additionalPillow: number;
    additionalTowel: number;
    fotocopyPrint: number;
    keyCardCharge: number;
    laundry: number;
    minibarSnacks: number;
    mineralWater: number;
    misc: number;
    otherRoomRevenue: number;
    shortOver: number;
    smokingCharge: number;
    tourTransport: number;
    spaFitness: number;
    totalMinorOperatingRevenue: number;
  };
  amenitiesRevenue: {
    minibarOther: number;
    totalAmenitiesRevenue: number;
  };
  serviceChargeRate: number;
  taxRate: number;
  netRevenue: number;
  serviceChargeAmount: number;
  taxAmount: number;
  grossRevenue: number;

  costOfSales?: CostOfSales;
  operatingExpenses?: OperatingExpenses;
  profitSummary?: ProfitSummary;

  // ── DEEP DEPARTMENTAL BUDGET SECTIONS (1:1 EXCEL MIRROR) ──
  deptRooms?: RoomDepartmentBudget;
  deptFnB?: FbDepartmentBudget;
  deptMod?: ModDepartmentBudget;
  deptAg?: AgDepartmentBudget;
  deptHrd?: HrdDepartmentBudget;
  deptSm?: SmDepartmentBudget;
  deptPomec?: PomecDepartmentBudget;
  deptNonOp?: NonOpDepartmentBudget;
  summaryPnl?: SummaryPnLBudget;
}

export interface CostOfSales {
  fnbCostPercent: number;
  fnbCostAmount: number;
  roomSuppliesCost: number;
  otherDepartmentCost: number;
  totalCostOfSales: number;
}

export interface OperatingExpenses {
  payrollSalaries: number;
  payrollServiceCharge: number;
  employeeBenefits: number;
  totalPayrollExpenses: number;
  marketingPromotion: number;
  travelAgentCommission: number;
  advertisingOta: number;
  totalMarketingExpenses: number;
  maintenanceRepairs: number;
  suppliesMaintenance: number;
  totalPomExpenses: number;
  electricity: number;
  water: number;
  gasFuel: number;
  internetPhone: number;
  totalUtilitiesExpenses: number;
  bankChargesEdc: number;
  softwareLicenses: number;
  officeSuppliesPrinting: number;
  legalProfessionalFees: number;
  insuranceProperty: number;
  otherAdminExpenses: number;
  totalAdminExpenses: number;
  totalOperatingExpenses: number;
}

export interface ProfitSummary {
  grossRevenue: number;
  netRevenue: number;
  totalCostOfSales: number;
  grossProfit: number;
  grossProfitMarginPercent: number;
  totalOperatingExpenses: number;
  grossOperatingProfit: number;
  gopMarginPercent: number;
}

export interface ManningAssumptions {
  umrPreviousYear: number;
  umrCurrentYear: number;
  umrIncrementPercent: number;
  employeeMealPerPax: number;
  inflationPercent: number;
  roomInventory: number;
  totalRoomAvailableAnnual: number;
}

export interface DeptManningLevel {
  excom: number;
  hod: number;
  coordinator: number;
  supervisor: number;
  rankAndFile: number;
  dailyWorker: number;
  trainee: number;
  casual: number;
  total: number;
}

export interface ManningDeptBreakdown {
  gmExcom: DeptManningLevel;
  frontOffice: DeptManningLevel;
  housekeeping: DeptManningLevel;
  fnbKitchen: DeptManningLevel;
  fnbService: DeptManningLevel;
  salesMarketing: DeptManningLevel;
  accounting: DeptManningLevel;
  hrd: DeptManningLevel;
  engineering: DeptManningLevel;
  spaFitness: DeptManningLevel;
}

export interface YearlyManningPlan {
  assumptions: ManningAssumptions;
  departments: ManningDeptBreakdown;
  contractCount: number;
  dailyWorkerCount: number;
  casualCount: number;
  traineeCount: number;
  totalAllManning: number;
  employeeRatio: number;
}

export interface YearlyFeesPlan {
  managementFeePercent: number; // e.g. 3 (%)
  incentiveFeePercent: number;  // e.g. 4 (%)
  vatTaxPercent: number;        // e.g. 2 (%)
  autoApplyToNonOp: boolean;
}

export const createDefaultDeptManningLevel = (): DeptManningLevel => ({
  excom: 0,
  hod: 0,
  coordinator: 0,
  supervisor: 0,
  rankAndFile: 0,
  dailyWorker: 0,
  trainee: 0,
  casual: 0,
  total: 0,
});

export const createDefaultManningPlan = (roomCount: number = 8, yr: number = 2027): YearlyManningPlan => ({
  assumptions: {
    umrPreviousYear: 2350000,
    umrCurrentYear: 2502750,
    umrIncrementPercent: 6.5,
    employeeMealPerPax: 10000,
    inflationPercent: 0,
    roomInventory: roomCount,
    totalRoomAvailableAnnual: roomCount * 365,
  },
  departments: {
    gmExcom: { ...createDefaultDeptManningLevel(), excom: 1, total: 1 },
    frontOffice: { ...createDefaultDeptManningLevel(), dailyWorker: 2, trainee: 1, total: 3 },
    housekeeping: { ...createDefaultDeptManningLevel(), dailyWorker: 2, trainee: 1, total: 3 },
    fnbKitchen: { ...createDefaultDeptManningLevel(), dailyWorker: 1, trainee: 1, total: 2 },
    fnbService: { ...createDefaultDeptManningLevel(), dailyWorker: 1, trainee: 1, total: 2 },
    salesMarketing: createDefaultDeptManningLevel(),
    accounting: createDefaultDeptManningLevel(),
    hrd: createDefaultDeptManningLevel(),
    engineering: { ...createDefaultDeptManningLevel(), dailyWorker: 1, trainee: 1, total: 2 },
    spaFitness: createDefaultDeptManningLevel(),
  },
  contractCount: 1,
  dailyWorkerCount: 7,
  casualCount: 0,
  traineeCount: 5,
  totalAllManning: 13,
  employeeRatio: roomCount > 0 ? Number((13 / roomCount).toFixed(3)) : 1.625,
});

export const createDefaultFeesPlan = (): YearlyFeesPlan => ({
  managementFeePercent: 3,
  incentiveFeePercent: 4,
  vatTaxPercent: 2,
  autoApplyToNonOp: true,
});

export interface BudgetAuditLog {
  timestamp: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  action: string;
  details?: string;
  snapshot?: {
    months: Record<string, BudgetMonthData>;
    manning?: YearlyManningPlan;
    fees?: YearlyFeesPlan;
  };
}

export interface YearlyBudgetDocument {
  year: number;
  hotelCode: string;
  hotelName?: string;
  updatedAt?: any;
  lastUpdatedBy?: string;
  lastUpdatedByEmail?: string;
  lastUpdatedByRole?: string;
  auditLogs?: BudgetAuditLog[];
  months: Record<string, BudgetMonthData>; // "01" to "12"
  manning?: YearlyManningPlan;
  fees?: YearlyFeesPlan;
}

// ── DSR Computed Row Types ──

export interface DSRCell {
  todayActual: number;
  todayVar?: number;
  mtdActual: number;
  mtdPercent: number;
  mtdBudget: number;
  mtdVar: number;
  ytdActual: number;
  ytdPercent: number;
  ytdBudget: number;
  ytdVar: number;
}

export interface DSRDataRow {
  id: string;
  label: string;
  isHeader?: boolean;
  isTotal?: boolean;
  isHighlight?: boolean;
  isPercent?: boolean;
  isCurrency?: boolean;
  cells: DSRCell;
}

export interface DSRSectionGroup {
  id: string;
  title: string;
  rows: DSRDataRow[];
}

export interface DSRPaymentItem {
  id: string;
  label: string;
  today: number;
  mtd: number;
  ytd: number;
}

export interface DSRReportResult {
  date: string; // YYYY-MM-DD
  hotelCode: string;
  hotelName: string;
  openingGuestLedger?: number;
  statistics: DSRDataRow[];
  roomRevenue: DSRDataRow[];
  foodRevenue: DSRDataRow[];
  beverageRevenue: DSRDataRow[];
  otherFnbRevenue: DSRDataRow[];
  minorOperatingRevenue: DSRDataRow[];
  amenitiesRevenue: DSRDataRow[];
  summaryTotals: DSRDataRow[];
  payments: {
    cashFo: DSRPaymentItem;
    cashOutlet: DSRPaymentItem;
    cashRefundFo: DSRPaymentItem;
    totalCash: DSRPaymentItem;
    edcBca: DSRPaymentItem;
    edcMandiri: DSRPaymentItem;
    qris: DSRPaymentItem;
    transfer: DSRPaymentItem;
    cityLedger: DSRPaymentItem;
    totalSettlement: DSRPaymentItem;
  };
}

// ── FACTORY HELPERS ──

export const createDefaultRoomDepartment = (): RoomDepartmentBudget => ({
  revenue: { lodging: 0, extraBed: 0, otherRoomRevenue: 0, total: 0 },
  cogs: { roomSupplies: 0, linenReplacement: 0, total: 0 },
  frontOffice: {
    salary: createDefaultSalaryWages(),
    expenses: {
      uniform: 0, printingStationery: 0, transportFuel: 0, travelExpenses: 0, consultant: 0,
      decoration: 0, guestTransportation: 0, reservationExpenses: 0, guestSupplies: 0,
      telephone: 0, tvCable: 0, internetProvider: 0, entertainment: 0, newspaperMagazine: 0,
      postageCourier: 0, pestControl: 0, cleaningSupplies: 0, commission: 0, pulsaHp: 0,
      welcomeDrink: 0, miscellaneous: 0, total: 0,
    },
    totalExpenses: 0,
  },
  housekeeping: {
    salary: createDefaultSalaryWages(),
    expenses: {
      uniform: 0, guestLaundry: 0, printingStationery: 0, transportFuel: 0, travelExpenses: 0,
      consultant: 0, equipmentRental: 0, decoration: 0, guestSupplies: 0, cleaningSupplies: 0,
      linenReplacement: 0, chinaGlassReplacement: 0, telephone: 0, landscapeGround: 0,
      roomDeodorant: 0, pestControl: 0, postageCourier: 0, pulsaHp: 0, laundryLinen: 0,
      miscellaneous: 0, total: 0,
    },
    totalExpenses: 0,
  },
  totalExpenses: 0,
  departmentProfit: 0,
});

export const createDefaultFbOutletExpenses = (): FbOutletExpenses => ({
  uniform: 0, printingStationery: 0, transportFuel: 0, entertainment: 0, testFood: 0,
  decoration: 0, equipmentRental: 0, kitchenSupplies: 0, guestSupplies: 0, cleaningSupplies: 0,
  linenReplacement: 0, chinaGlassSilverware: 0, telephone: 0, spoilage: 0, specialPromotion: 0,
  laundryLinen: 0, pestControl: 0, postageCourier: 0, banquetExpenses: 0, kitchenFuelGas: 0,
  paperSupplies: 0, menuFoodBevList: 0, serviceEquipment: 0, miscellaneous: 0, total: 0,
});

export const createDefaultFbDepartment = (): FbDepartmentBudget => ({
  revenue: {
    restaurant: { food: 0, beverage: 0, other: 0, total: 0 },
    kitchen: { food: 0, beverage: 0, other: 0, total: 0 },
    lounge: { food: 0, beverage: 0, other: 0, total: 0 },
    banquet: { food: 0, beverage: 0, other: 0, total: 0 },
    roomService: { food: 0, beverage: 0, other: 0, total: 0 },
    totalFood: 0, totalBeverage: 0, totalOther: 0, total: 0,
  },
  cogs: {
    restaurant: { costFood: 0, costBeverage: 0, costOther: 0, total: 0 },
    kitchen: { costFood: 0, costBeverage: 0, costOther: 0, total: 0 },
    lounge: { costFood: 0, costBeverage: 0, costOther: 0, total: 0 },
    banquet: { costFood: 0, costBeverage: 0, costOther: 0, total: 0 },
    roomService: { costFood: 0, costBeverage: 0, costOther: 0, total: 0 },
    total: 0, fnbCostPercent: 30,
  },
  restaurant: { salary: createDefaultSalaryWages(), expenses: createDefaultFbOutletExpenses(), totalExpenses: 0 },
  kitchen: { salary: createDefaultSalaryWages(), expenses: createDefaultFbOutletExpenses(), totalExpenses: 0 },
  lounge: { salary: createDefaultSalaryWages(), expenses: createDefaultFbOutletExpenses(), totalExpenses: 0 },
  banquet: { salary: createDefaultSalaryWages(), expenses: createDefaultFbOutletExpenses(), totalExpenses: 0 },
  roomService: { salary: createDefaultSalaryWages(), expenses: createDefaultFbOutletExpenses(), totalExpenses: 0 },
  totalExpenses: 0,
  departmentProfit: 0,
});

export const createDefaultModDepartment = (): ModDepartmentBudget => ({
  laundry: {
    revenue: { laundry: 0, dryClean: 0, pressing: 0, other: 0, total: 0 },
    cogs: { costLaundry: 0, costOther: 0, total: 0 },
    salary: createDefaultSalaryWages(),
    expenses: { uniform: 0, chemicalSupplies: 0, packingSupplies: 0, machineMaintenance: 0, transportFuel: 0, miscellaneous: 0, total: 0 },
    totalExpenses: 0, departmentProfit: 0,
  },
  spaFitness: {
    revenue: { massageTherapy: 0, fitness: 0, others: 0, total: 0 },
    cogs: { costTreatment: 0, costOthers: 0, total: 0 },
    salary: createDefaultSalaryWages(),
    expenses: { uniform: 0, massageOilsLinen: 0, aromatherapySupplies: 0, guestSupplies: 0, cleaningSupplies: 0, miscellaneous: 0, total: 0 },
    totalExpenses: 0, departmentProfit: 0,
  },
  otherIncome: {
    revenue: { spaceRental: 0, transportation: 0, commission: 0, cityTour: 0, others: 0, total: 0 },
    cogs: { costSpaceRental: 0, costCarRental: 0, costCommission: 0, costCityTour: 0, costOthers: 0, total: 0 },
    departmentProfit: 0,
  },
  totalRevenue: 0, totalCogs: 0, totalExpenses: 0, departmentProfit: 0,
});

export const createDefaultAgDepartment = (): AgDepartmentBudget => ({
  salary: createDefaultSalaryWages(),
  expenses: {
    uniform: 0, printingStationery: 0, postageCourier: 0, transportFuelParking: 0, entertainment: 0,
    travelExpenses: 0, telephone: 0, internetProvider: 0, tvCable: 0, bankChargesEdc: 0,
    legalAuditFees: 0, consultant: 0, securityExpenses: 0, recruitmentFee: 0, softwareLicensesIt: 0,
    trainingDevelopment: 0, taxConsultant: 0, insuranceProperty: 0, insuranceGeneral: 0,
    donationCommunity: 0, badDebtProvision: 0, miscellaneous: 0, total: 0,
  },
  totalExpenses: 0,
});

export const createDefaultHrdDepartment = (): HrdDepartmentBudget => ({
  salary: createDefaultSalaryWages(),
  expenses: {
    uniform: 0, printingStationery: 0, recruitmentAdvertisement: 0, trainingSeminar: 0,
    medicalClinic: 0, staffGatheringOuting: 0, employeeAppreciationAward: 0, sportsRecreation: 0,
    consultantHrd: 0, miscellaneous: 0, total: 0,
  },
  totalExpenses: 0,
});

export const createDefaultSmDepartment = (): SmDepartmentBudget => ({
  salary: createDefaultSalaryWages(),
  expenses: {
    uniform: 0, printingStationery: 0, marketingCollateralsBrochures: 0, advertisingPromotionOnline: 0,
    otaCommissions: 0, travelAgentCommissions: 0, salesTripsTravel: 0, clientEntertainment: 0,
    websiteHostingDomain: 0, photoVideoShootingContent: 0, exhibitionsTradeShows: 0,
    publicRelationsMedia: 0, guestGiftsSouvenirs: 0, telephoneInternet: 0, miscellaneous: 0, total: 0,
  },
  totalExpenses: 0,
});

export const createDefaultPomecDepartment = (): PomecDepartmentBudget => ({
  salary: createDefaultSalaryWages(),
  energy: {
    electricityPln: 0, waterPdamWell: 0, kitchenLpgGas: 0, dieselFuelSolar: 0, total: 0,
  },
  maintenance: {
    airConditioning: 0, generatorElectrical: 0, plumbingWaterSystem: 0, buildingStructural: 0,
    kitchenEquipmentMaint: 0, swimmingPoolChemicals: 0, fireSafetyEquipment: 0,
    landscapingGardening: 0, itHardwareMaintenance: 0, elevatorMaintenance: 0,
    paintingCarpentry: 0, toolsEquipment: 0, pestControlBuilding: 0, miscellaneous: 0, total: 0,
  },
  totalExpenses: 0,
});

export const createDefaultNonOpDepartment = (): NonOpDepartmentBudget => ({
  managementBaseFee: 0,
  managementIncentiveFee: 0,
  franchiseRoyaltyFee: 0,
  buildingInsurance: 0,
  propertyTaxPbb: 0,
  bankInterestCharges: 0,
  depreciationAmortization: 0,
  total: 0,
});

export const createDefaultSummaryPnl = (): SummaryPnLBudget => ({
  roomRevenue: 0, fnbRevenue: 0, modRevenue: 0, totalNetRevenue: 0, serviceCharge: 0, governmentTax: 0, totalGrossRevenue: 0,
  roomCogs: 0, fnbCogs: 0, modCogs: 0, totalCogs: 0, grossProfit: 0, grossProfitMarginPercent: 0,
  roomExpenses: 0, fnbExpenses: 0, modExpenses: 0, totalDepartmentalExpenses: 0, totalDepartmentalProfit: 0, tdpMarginPercent: 0,
  agExpenses: 0, hrdExpenses: 0, smExpenses: 0, pomecExpenses: 0, totalUndistributedExpenses: 0,
  grossOperatingProfit: 0, gopMarginPercent: 0,
  nonOperatingExpenses: 0, netOperatingIncome: 0, noiMarginPercent: 0,
});

export const createDefaultBudgetMonthData = (): BudgetMonthData => ({
  statistic: {
    roomsAvailable: 0, roomsOutOfOrder: 0, houseUse: 0, roomsCompliment: 0,
    occupiedRoomsPaid: 0, occupancyPercent: 0, arrIdr: 0, payingPax: 0,
    houseUsePax: 0, complimentPax: 0, totalPax: 0,
  },
  roomRevenue: { lodging: 0, extraBed: 0, otherRoomRevenue: 0, totalRoomRevenue: 0 },
  fnbRevenue: {
    food: { breakfast: 0, restaurant: 0, roomService: 0, banquet: 0, totalFoodRevenue: 0 },
    beverage: { restaurant: 0, roomService: 0, banquet: 0, minibar: 0, totalBeverageRevenue: 0 },
    other: { restaurant: 0, banquet: 0, totalOtherFnBRevenue: 0 },
    totalFnBRevenue: 0,
  },
  minorOperatingRevenue: {
    additionalPillow: 0, additionalTowel: 0, fotocopyPrint: 0, keyCardCharge: 0,
    laundry: 0, minibarSnacks: 0, mineralWater: 0, misc: 0, otherRoomRevenue: 0,
    shortOver: 0, smokingCharge: 0, tourTransport: 0, spaFitness: 0, totalMinorOperatingRevenue: 0,
  },
  amenitiesRevenue: { minibarOther: 0, totalAmenitiesRevenue: 0 },
  serviceChargeRate: 10,
  taxRate: 10,
  netRevenue: 0,
  serviceChargeAmount: 0,
  taxAmount: 0,
  grossRevenue: 0,

  deptRooms: createDefaultRoomDepartment(),
  deptFnB: createDefaultFbDepartment(),
  deptMod: createDefaultModDepartment(),
  deptAg: createDefaultAgDepartment(),
  deptHrd: createDefaultHrdDepartment(),
  deptSm: createDefaultSmDepartment(),
  deptPomec: createDefaultPomecDepartment(),
  deptNonOp: createDefaultNonOpDepartment(),
  summaryPnl: createDefaultSummaryPnl(),
});

export const sumSalaryWages = (s?: DeptSalaryWages): number => {
  if (!s) return 0;
  return (
    (s.salaryKontrak || 0) +
    (s.wagesDailyWorker || 0) +
    (s.bpjsKesehatan || 0) +
    (s.bpjsKetenagakerjaan || 0) +
    (s.bonusThr || 0) +
    (s.payrollTax || 0) +
    (s.employeeMeals || 0) +
    (s.employeeHousing || 0) +
    (s.overtimePay || 0) +
    (s.employeeTransportation || 0) +
    (s.wagesCasual || 0)
  );
};

export const calculateSalaryFromManning = (
  level?: DeptManningLevel,
  assumptions?: ManningAssumptions
): DeptSalaryWages => {
  if (!level || !assumptions) return createDefaultSalaryWages();

  const umr = assumptions.umrCurrentYear || 2502750;
  const mealPerPaxMonth = (assumptions.employeeMealPerPax || 10000) * 30;

  const excom = level.excom || 0;
  const hod = level.hod || 0;
  const coord = level.coordinator || 0;
  const spv = level.supervisor || 0;
  const staff = level.rankAndFile || 0;
  const dw = level.dailyWorker || 0;
  const trainee = level.trainee || 0;
  const casual = level.casual || 0;
  const totalStaff = level.total || (excom + hod + coord + spv + staff + dw + trainee + casual);

  // Salary Multiples (Standard USALI benchmark)
  const salaryKontrak = Math.round(
    excom * (2.5 * umr) +
    hod * (1.75 * umr) +
    coord * (1.4 * umr) +
    spv * (1.25 * umr) +
    staff * (1.0 * umr)
  );

  const wagesDailyWorker = Math.round(dw * (1.0 * umr));
  const wagesCasual = Math.round(casual * (0.8 * umr) + trainee * 500000);

  const baseSalary = salaryKontrak + wagesDailyWorker;

  const bpjsKesehatan = Math.round(baseSalary * 0.04);
  const bpjsKetenagakerjaan = Math.round(baseSalary * 0.057);
  const bonusThr = Math.round(salaryKontrak / 12);
  const payrollTax = Math.round(salaryKontrak * 0.015);
  const employeeMeals = Math.round(totalStaff * mealPerPaxMonth);
  const employeeHousing = 0;
  const overtimePay = Math.round((staff + dw) * 0.05 * umr);
  const employeeTransportation = Math.round(totalStaff * 100000);

  const total =
    salaryKontrak +
    wagesDailyWorker +
    wagesCasual +
    bpjsKesehatan +
    bpjsKetenagakerjaan +
    bonusThr +
    payrollTax +
    employeeMeals +
    employeeHousing +
    overtimePay +
    employeeTransportation;

  return {
    salaryKontrak,
    wagesDailyWorker,
    wagesCasual,
    bpjsKesehatan,
    bpjsKetenagakerjaan,
    bonusThr,
    payrollTax,
    employeeMeals,
    employeeHousing,
    overtimePay,
    employeeTransportation,
    total,
  };
};

export const combineSalaryWages = (...salaries: DeptSalaryWages[]): DeptSalaryWages => {
  const res = createDefaultSalaryWages();
  salaries.forEach((s) => {
    if (!s) return;
    res.salaryKontrak += s.salaryKontrak || 0;
    res.wagesDailyWorker += s.wagesDailyWorker || 0;
    res.wagesCasual += s.wagesCasual || 0;
    res.bpjsKesehatan += s.bpjsKesehatan || 0;
    res.bpjsKetenagakerjaan += s.bpjsKetenagakerjaan || 0;
    res.bonusThr += s.bonusThr || 0;
    res.payrollTax += s.payrollTax || 0;
    res.employeeMeals += s.employeeMeals || 0;
    res.employeeHousing += s.employeeHousing || 0;
    res.overtimePay += s.overtimePay || 0;
    res.employeeTransportation += s.employeeTransportation || 0;
    res.total += s.total || 0;
  });
  return res;
};

export const syncManningToBudgetDoc = (doc: YearlyBudgetDocument): void => {
  if (!doc.manning || !doc.months) return;
  const m = doc.manning;
  const depts = m.departments;
  const ass = m.assumptions;

  const foSalary = calculateSalaryFromManning(depts.frontOffice, ass);
  const hkSalary = calculateSalaryFromManning(depts.housekeeping, ass);
  const kitchenSalary = calculateSalaryFromManning(depts.fnbKitchen, ass);
  const restoSalary = calculateSalaryFromManning(depts.fnbService, ass);
  const spaSalary = calculateSalaryFromManning(depts.spaFitness, ass);
  const agSalary = combineSalaryWages(
    calculateSalaryFromManning(depts.gmExcom, ass),
    calculateSalaryFromManning(depts.accounting, ass)
  );
  const hrdSalary = calculateSalaryFromManning(depts.hrd, ass);
  const smSalary = calculateSalaryFromManning(depts.salesMarketing, ass);
  const pomecSalary = calculateSalaryFromManning(depts.engineering, ass);

  for (let month = 1; month <= 12; month++) {
    const k = String(month).padStart(2, "0");
    const mData = doc.months[k];
    if (!mData) continue;

    if (!mData.deptRooms) mData.deptRooms = createDefaultRoomDepartment();
    mData.deptRooms.frontOffice.salary = JSON.parse(JSON.stringify(foSalary));
    mData.deptRooms.housekeeping.salary = JSON.parse(JSON.stringify(hkSalary));

    if (!mData.deptFnB) mData.deptFnB = createDefaultFbDepartment();
    mData.deptFnB.kitchen.salary = JSON.parse(JSON.stringify(kitchenSalary));
    mData.deptFnB.restaurant.salary = JSON.parse(JSON.stringify(restoSalary));

    if (!mData.deptMod) mData.deptMod = createDefaultModDepartment();
    mData.deptMod.spaFitness.salary = JSON.parse(JSON.stringify(spaSalary));

    if (!mData.deptAg) mData.deptAg = createDefaultAgDepartment();
    mData.deptAg.salary = JSON.parse(JSON.stringify(agSalary));

    if (!mData.deptHrd) mData.deptHrd = createDefaultHrdDepartment();
    mData.deptHrd.salary = JSON.parse(JSON.stringify(hrdSalary));

    if (!mData.deptSm) mData.deptSm = createDefaultSmDepartment();
    mData.deptSm.salary = JSON.parse(JSON.stringify(smSalary));

    if (!mData.deptPomec) mData.deptPomec = createDefaultPomecDepartment();
    mData.deptPomec.salary = JSON.parse(JSON.stringify(pomecSalary));

    recalculateBudgetMonthData(mData);
  }
};

export const recalculateBudgetMonthData = (draft: BudgetMonthData): void => {
  // Ensure all departmental sub-objects exist
  if (!draft.deptRooms) draft.deptRooms = createDefaultRoomDepartment();
  if (!draft.deptFnB) draft.deptFnB = createDefaultFbDepartment();
  if (!draft.deptMod) draft.deptMod = createDefaultModDepartment();
  if (!draft.deptAg) draft.deptAg = createDefaultAgDepartment();
  if (!draft.deptHrd) draft.deptHrd = createDefaultHrdDepartment();
  if (!draft.deptSm) draft.deptSm = createDefaultSmDepartment();
  if (!draft.deptPomec) draft.deptPomec = createDefaultPomecDepartment();
  if (!draft.deptNonOp) draft.deptNonOp = createDefaultNonOpDepartment();
  if (!draft.summaryPnl) draft.summaryPnl = createDefaultSummaryPnl();
  if (!draft.costOfSales) draft.costOfSales = { fnbCostPercent: 30, fnbCostAmount: 0, roomSuppliesCost: 0, otherDepartmentCost: 0, totalCostOfSales: 0 };
  if (!draft.operatingExpenses) draft.operatingExpenses = {
    payrollSalaries: 0, payrollServiceCharge: 0, employeeBenefits: 0, totalPayrollExpenses: 0,
    marketingPromotion: 0, travelAgentCommission: 0, advertisingOta: 0, totalMarketingExpenses: 0,
    maintenanceRepairs: 0, suppliesMaintenance: 0, totalPomExpenses: 0,
    electricity: 0, water: 0, gasFuel: 0, internetPhone: 0, totalUtilitiesExpenses: 0,
    bankChargesEdc: 0, softwareLicenses: 0, officeSuppliesPrinting: 0, legalProfessionalFees: 0, insuranceProperty: 0, otherAdminExpenses: 0, totalAdminExpenses: 0,
    totalOperatingExpenses: 0
  };
  if (!draft.profitSummary) draft.profitSummary = {
    grossRevenue: 0, netRevenue: 0, totalCostOfSales: 0, grossProfit: 0, grossProfitMarginPercent: 0,
    totalOperatingExpenses: 0, grossOperatingProfit: 0, gopMarginPercent: 0
  };

  // 1. Room Department Recalculation
  const rm = draft.deptRooms;
  if (!rm.revenue) rm.revenue = { lodging: 0, extraBed: 0, otherRoomRevenue: 0, total: 0 };
  if (!rm.cogs) rm.cogs = { roomSupplies: 0, linenReplacement: 0, total: 0 };
  if (!rm.frontOffice) rm.frontOffice = createDefaultRoomDepartment().frontOffice;
  if (!rm.housekeeping) rm.housekeeping = createDefaultRoomDepartment().housekeeping;

  rm.revenue.total = (rm.revenue.lodging || 0) + (rm.revenue.extraBed || 0) + (rm.revenue.otherRoomRevenue || (rm.revenue as any).otherRoom || 0);
  rm.cogs.total = (rm.cogs.roomSupplies || (rm.cogs as any).costOfRoom || 0) + (rm.cogs.linenReplacement || 0);
  rm.frontOffice.salary.total = sumSalaryWages(rm.frontOffice.salary);
  const foExp = rm.frontOffice.expenses;
  foExp.total = (foExp.uniform || 0) + (foExp.printingStationery || 0) + (foExp.transportFuel || 0) + (foExp.travelExpenses || 0) +
    (foExp.consultant || 0) + (foExp.decoration || 0) + (foExp.guestTransportation || 0) + (foExp.reservationExpenses || 0) +
    (foExp.guestSupplies || 0) + (foExp.telephone || 0) + (foExp.tvCable || 0) + (foExp.internetProvider || 0) +
    (foExp.entertainment || 0) + (foExp.newspaperMagazine || 0) + (foExp.postageCourier || 0) + (foExp.pestControl || 0) +
    (foExp.cleaningSupplies || 0) + (foExp.commission || 0) + (foExp.pulsaHp || 0) + (foExp.welcomeDrink || 0) + (foExp.miscellaneous || 0);
  rm.frontOffice.totalExpenses = rm.frontOffice.salary.total + foExp.total;

  rm.housekeeping.salary.total = sumSalaryWages(rm.housekeeping.salary);
  const hkExp = rm.housekeeping.expenses;
  hkExp.total = (hkExp.uniform || 0) + (hkExp.guestLaundry || 0) + (hkExp.printingStationery || 0) + (hkExp.transportFuel || 0) +
    (hkExp.travelExpenses || 0) + (hkExp.consultant || 0) + (hkExp.equipmentRental || 0) + (hkExp.decoration || 0) +
    (hkExp.guestSupplies || 0) + (hkExp.cleaningSupplies || 0) + (hkExp.linenReplacement || 0) + (hkExp.chinaGlassReplacement || 0) +
    (hkExp.telephone || 0) + (hkExp.landscapeGround || 0) + (hkExp.roomDeodorant || 0) + (hkExp.pestControl || 0) +
    (hkExp.postageCourier || 0) + (hkExp.pulsaHp || 0) + (hkExp.laundryLinen || 0) + (hkExp.miscellaneous || 0);
  rm.housekeeping.totalExpenses = rm.housekeeping.salary.total + hkExp.total;

  rm.totalExpenses = rm.frontOffice.totalExpenses + rm.housekeeping.totalExpenses;
  rm.departmentProfit = rm.revenue.total - rm.cogs.total - rm.totalExpenses;

  // Sync Room top-level
  draft.roomRevenue.lodging = rm.revenue.lodging;
  draft.roomRevenue.extraBed = rm.revenue.extraBed;
  draft.roomRevenue.otherRoomRevenue = rm.revenue.otherRoomRevenue || (rm.revenue as any).otherRoom || 0;
  draft.roomRevenue.totalRoomRevenue = rm.revenue.total;

  // 2. F&B Department Recalculation
  const fnb = draft.deptFnB;
  if (!fnb.revenue) fnb.revenue = createDefaultFbDepartment().revenue;
  if (!fnb.revenue.restaurant) fnb.revenue.restaurant = { food: 0, beverage: 0, other: 0, total: 0 };
  if (!fnb.revenue.kitchen) fnb.revenue.kitchen = { food: 0, beverage: 0, other: 0, total: 0 };
  if (!fnb.revenue.lounge) fnb.revenue.lounge = { food: 0, beverage: 0, other: 0, total: 0 };
  if (!fnb.revenue.banquet) fnb.revenue.banquet = { food: 0, beverage: 0, other: 0, total: 0 };
  if (!fnb.revenue.roomService) fnb.revenue.roomService = { food: 0, beverage: 0, other: 0, total: 0 };

  if (!fnb.cogs) fnb.cogs = createDefaultFbDepartment().cogs;
  if (!fnb.cogs.restaurant) fnb.cogs.restaurant = { costFood: 0, costBeverage: 0, costOther: 0, total: 0 };
  if (!fnb.cogs.kitchen) fnb.cogs.kitchen = { costFood: 0, costBeverage: 0, costOther: 0, total: 0 };
  if (!fnb.cogs.lounge) fnb.cogs.lounge = { costFood: 0, costBeverage: 0, costOther: 0, total: 0 };
  if (!fnb.cogs.banquet) fnb.cogs.banquet = { costFood: 0, costBeverage: 0, costOther: 0, total: 0 };
  if (!fnb.cogs.roomService) fnb.cogs.roomService = { costFood: 0, costBeverage: 0, costOther: 0, total: 0 };

  const fbOutletKeys: ("restaurant" | "kitchen" | "lounge" | "banquet" | "roomService")[] = [
    "restaurant",
    "kitchen",
    "lounge",
    "banquet",
    "roomService",
  ];

  fbOutletKeys.forEach((k) => {
    if (!fnb[k]) {
      fnb[k] = {
        salary: createDefaultSalaryWages(),
        expenses: createDefaultFbOutletExpenses(),
        totalExpenses: 0,
      };
    }
    if (!fnb[k].salary) fnb[k].salary = createDefaultSalaryWages();
    if (!fnb[k].expenses) fnb[k].expenses = createDefaultFbOutletExpenses();
  });

  const foodRev =
    (fnb.revenue.restaurant.food || 0) +
    (fnb.revenue.lounge.food || 0) +
    (fnb.revenue.banquet.food || 0) +
    (fnb.revenue.roomService.food || 0);
  const bevRev =
    (fnb.revenue.restaurant.beverage || 0) +
    (fnb.revenue.lounge.beverage || 0) +
    (fnb.revenue.banquet.beverage || 0) +
    (fnb.revenue.roomService.beverage || 0);
  const othRev =
    (fnb.revenue.restaurant.other || 0) +
    (fnb.revenue.lounge.other || 0) +
    (fnb.revenue.banquet.other || 0) +
    (fnb.revenue.roomService.other || 0);

  fnb.revenue.restaurant.total = (fnb.revenue.restaurant.food || 0) + (fnb.revenue.restaurant.beverage || 0) + (fnb.revenue.restaurant.other || 0);
  fnb.revenue.kitchen.food = 0;
  fnb.revenue.kitchen.beverage = 0;
  fnb.revenue.kitchen.other = 0;
  fnb.revenue.kitchen.total = 0;
  fnb.revenue.lounge.total = (fnb.revenue.lounge.food || 0) + (fnb.revenue.lounge.beverage || 0) + (fnb.revenue.lounge.other || 0);
  fnb.revenue.banquet.total = (fnb.revenue.banquet.food || 0) + (fnb.revenue.banquet.beverage || 0) + (fnb.revenue.banquet.other || 0);
  fnb.revenue.roomService.total = (fnb.revenue.roomService.food || 0) + (fnb.revenue.roomService.beverage || 0) + (fnb.revenue.roomService.other || 0);

  fnb.revenue.totalFood = foodRev;
  fnb.revenue.totalBeverage = bevRev;
  fnb.revenue.totalOther = othRev;
  fnb.revenue.total = foodRev + bevRev + othRev;

  // COGS
  const cogsResto = (fnb.cogs.restaurant.costFood || 0) + (fnb.cogs.restaurant.costBeverage || 0) + (fnb.cogs.restaurant.costOther || 0);
  fnb.cogs.restaurant.total = cogsResto;
  const cogsKitchen = (fnb.cogs.kitchen.costFood || 0) + (fnb.cogs.kitchen.costBeverage || 0) + (fnb.cogs.kitchen.costOther || 0);
  fnb.cogs.kitchen.total = cogsKitchen;
  const cogsLounge = (fnb.cogs.lounge.costFood || 0) + (fnb.cogs.lounge.costBeverage || 0) + (fnb.cogs.lounge.costOther || 0);
  fnb.cogs.lounge.total = cogsLounge;
  const cogsBanquet = (fnb.cogs.banquet.costFood || 0) + (fnb.cogs.banquet.costBeverage || 0) + (fnb.cogs.banquet.costOther || 0);
  fnb.cogs.banquet.total = cogsBanquet;
  const cogsRoomService = (fnb.cogs.roomService.costFood || 0) + (fnb.cogs.roomService.costBeverage || 0) + (fnb.cogs.roomService.costOther || 0);
  fnb.cogs.roomService.total = cogsRoomService;

  fnb.cogs.total = cogsResto + cogsKitchen + cogsLounge + cogsBanquet + cogsRoomService;
  fnb.cogs.fnbCostPercent = fnb.revenue.total > 0 ? (fnb.cogs.total / fnb.revenue.total) * 100 : 0;

  // Outlets
  const outlets = [fnb.restaurant, fnb.kitchen, fnb.lounge, fnb.banquet, fnb.roomService];
  let totFbPayroll = 0;
  let totFbOtherExp = 0;
  outlets.forEach((out) => {
    if (out) {
      out.salary.total = sumSalaryWages(out.salary);
      const e = out.expenses;
      e.total = Object.entries(e).reduce((acc, [k, v]) => (k !== "total" && typeof v === "number" ? acc + v : acc), 0);
      out.totalExpenses = out.salary.total + e.total;
      totFbPayroll += out.salary.total;
      totFbOtherExp += e.total;
    }
  });
  fnb.totalExpenses = totFbPayroll + totFbOtherExp;
  fnb.departmentProfit = fnb.revenue.total - fnb.cogs.total - fnb.totalExpenses;

  // Sync F&B top-level
  draft.fnbRevenue.food = {
    breakfast: 0,
    restaurant: fnb.revenue.restaurant.food || 0,
    roomService: fnb.revenue.roomService.food || 0,
    banquet: fnb.revenue.banquet.food || 0,
    totalFoodRevenue: foodRev,
  };
  draft.fnbRevenue.beverage = {
    restaurant: fnb.revenue.restaurant.beverage || 0,
    roomService: fnb.revenue.roomService.beverage || 0,
    banquet: fnb.revenue.banquet.beverage || 0,
    minibar: fnb.revenue.lounge.beverage || 0,
    totalBeverageRevenue: bevRev,
  };
  draft.fnbRevenue.other = {
    restaurant: fnb.revenue.restaurant.other || 0,
    banquet: fnb.revenue.banquet.other || 0,
    totalOtherFnBRevenue: othRev,
  };
  draft.fnbRevenue.totalFnBRevenue = fnb.revenue.total;

  // 3. Minor Operating Departments (MOD)
  const mod = draft.deptMod;
  // Laundry
  mod.laundry.revenue.total =
    (mod.laundry.revenue.laundry || 0) +
    (mod.laundry.revenue.dryClean || 0) +
    (mod.laundry.revenue.pressing || 0) +
    (mod.laundry.revenue.other || 0);
  mod.laundry.cogs.total =
    (mod.laundry.cogs.costLaundry || 0) +
    (mod.laundry.cogs.costOther || 0);
  mod.laundry.salary.total = sumSalaryWages(mod.laundry.salary);
  const lExp = mod.laundry.expenses;
  lExp.total = Object.entries(lExp).reduce((acc, [k, v]) => (k !== "total" && typeof v === "number" ? acc + v : acc), 0);
  mod.laundry.totalExpenses = mod.laundry.salary.total + lExp.total;
  mod.laundry.departmentProfit = mod.laundry.revenue.total - mod.laundry.cogs.total - mod.laundry.totalExpenses;

  // Spa
  mod.spaFitness.revenue.total =
    (mod.spaFitness.revenue.massageTherapy || 0) +
    (mod.spaFitness.revenue.fitness || 0) +
    (mod.spaFitness.revenue.others || 0);
  mod.spaFitness.cogs.total =
    (mod.spaFitness.cogs.costTreatment || 0) +
    (mod.spaFitness.cogs.costOthers || 0);
  mod.spaFitness.salary.total = sumSalaryWages(mod.spaFitness.salary);
  const sExp = mod.spaFitness.expenses;
  sExp.total = Object.entries(sExp).reduce((acc, [k, v]) => (k !== "total" && typeof v === "number" ? acc + v : acc), 0);
  mod.spaFitness.totalExpenses = mod.spaFitness.salary.total + sExp.total;
  mod.spaFitness.departmentProfit = mod.spaFitness.revenue.total - mod.spaFitness.cogs.total - mod.spaFitness.totalExpenses;

  // Other Income
  mod.otherIncome.revenue.total =
    (mod.otherIncome.revenue.spaceRental || 0) +
    (mod.otherIncome.revenue.transportation || 0) +
    (mod.otherIncome.revenue.commission || 0) +
    (mod.otherIncome.revenue.cityTour || 0) +
    (mod.otherIncome.revenue.others || 0);
  mod.otherIncome.cogs.total =
    (mod.otherIncome.cogs.costSpaceRental || 0) +
    (mod.otherIncome.cogs.costCarRental || 0) +
    (mod.otherIncome.cogs.costCommission || 0) +
    (mod.otherIncome.cogs.costCityTour || 0) +
    (mod.otherIncome.cogs.costOthers || 0);
  mod.otherIncome.departmentProfit = mod.otherIncome.revenue.total - mod.otherIncome.cogs.total;

  mod.totalRevenue = mod.laundry.revenue.total + mod.spaFitness.revenue.total + mod.otherIncome.revenue.total;
  mod.totalCogs = mod.laundry.cogs.total + mod.spaFitness.cogs.total + mod.otherIncome.cogs.total;
  mod.totalExpenses = mod.laundry.totalExpenses + mod.spaFitness.totalExpenses;
  mod.departmentProfit = mod.laundry.departmentProfit + mod.spaFitness.departmentProfit + mod.otherIncome.departmentProfit;

  // Sync Minor top-level
  draft.minorOperatingRevenue.laundry = mod.laundry.revenue.total;
  draft.minorOperatingRevenue.spaFitness = mod.spaFitness.revenue.total;
  draft.minorOperatingRevenue.tourTransport = mod.otherIncome.revenue.transportation;
  draft.minorOperatingRevenue.misc = mod.otherIncome.revenue.others;
  draft.minorOperatingRevenue.totalMinorOperatingRevenue = mod.totalRevenue;

  // 4. Undistributed Departments
  // A&G
  const ag = draft.deptAg;
  ag.salary.total = sumSalaryWages(ag.salary);
  const agExp = ag.expenses;
  agExp.total = Object.entries(agExp).reduce((acc, [k, v]) => (k !== "total" && typeof v === "number" ? acc + v : acc), 0);
  ag.totalExpenses = ag.salary.total + agExp.total;

  // HRD
  const hrd = draft.deptHrd;
  hrd.salary.total = sumSalaryWages(hrd.salary);
  const hrdExp = hrd.expenses;
  hrdExp.total = Object.entries(hrdExp).reduce((acc, [k, v]) => (k !== "total" && typeof v === "number" ? acc + v : acc), 0);
  hrd.totalExpenses = hrd.salary.total + hrdExp.total;

  // S&M
  const sm = draft.deptSm;
  sm.salary.total = sumSalaryWages(sm.salary);
  const smExp = sm.expenses;
  smExp.total = Object.entries(smExp).reduce((acc, [k, v]) => (k !== "total" && typeof v === "number" ? acc + v : acc), 0);
  sm.totalExpenses = sm.salary.total + smExp.total;

  // POMEC
  const pomec = draft.deptPomec;
  pomec.salary.total = sumSalaryWages(pomec.salary);
  pomec.energy.total = (pomec.energy.electricityPln || 0) + (pomec.energy.waterPdamWell || 0) + (pomec.energy.kitchenLpgGas || 0) + (pomec.energy.dieselFuelSolar || 0);
  const mExp = pomec.maintenance;
  mExp.total = Object.entries(mExp).reduce((acc, [k, v]) => (k !== "total" && typeof v === "number" ? acc + v : acc), 0);
  pomec.totalExpenses = pomec.salary.total + pomec.energy.total + mExp.total;

  // Non-Operating / Fees
  const nonOp = draft.deptNonOp;
  nonOp.total = (nonOp.managementBaseFee || 0) + (nonOp.managementIncentiveFee || 0) + (nonOp.franchiseRoyaltyFee || 0) +
    (nonOp.buildingInsurance || 0) + (nonOp.propertyTaxPbb || 0) + (nonOp.bankInterestCharges || 0) + (nonOp.depreciationAmortization || 0);

  // 5. Master Summary P&L Rollup
  const pnl = draft.summaryPnl;
  pnl.roomRevenue = rm.revenue.total;
  pnl.fnbRevenue = fnb.revenue.total;
  pnl.modRevenue = mod.totalRevenue;
  pnl.totalNetRevenue = pnl.roomRevenue + pnl.fnbRevenue + pnl.modRevenue;

  const svcRate = (draft.serviceChargeRate || 10) / 100;
  const taxRate = (draft.taxRate || 10) / 100;
  pnl.serviceCharge = Math.round(pnl.totalNetRevenue * svcRate);
  pnl.governmentTax = Math.round(pnl.totalNetRevenue * taxRate);
  pnl.totalGrossRevenue = pnl.totalNetRevenue + pnl.serviceCharge + pnl.governmentTax;

  draft.netRevenue = pnl.totalNetRevenue;
  draft.serviceChargeAmount = pnl.serviceCharge;
  draft.taxAmount = pnl.governmentTax;
  draft.grossRevenue = pnl.totalGrossRevenue;

  pnl.roomCogs = rm.cogs.total;
  pnl.fnbCogs = fnb.cogs.total;
  pnl.modCogs = mod.totalCogs;
  pnl.totalCogs = pnl.roomCogs + pnl.fnbCogs + pnl.modCogs;
  pnl.grossProfit = pnl.totalNetRevenue - pnl.totalCogs;
  pnl.grossProfitMarginPercent = pnl.totalNetRevenue > 0 ? (pnl.grossProfit / pnl.totalNetRevenue) * 100 : 0;

  pnl.roomExpenses = rm.totalExpenses;
  pnl.fnbExpenses = fnb.totalExpenses;
  pnl.modExpenses = mod.totalExpenses;
  pnl.totalDepartmentalExpenses = pnl.roomExpenses + pnl.fnbExpenses + pnl.modExpenses;

  pnl.totalDepartmentalProfit = rm.departmentProfit + fnb.departmentProfit + mod.departmentProfit;
  pnl.tdpMarginPercent = pnl.totalNetRevenue > 0 ? (pnl.totalDepartmentalProfit / pnl.totalNetRevenue) * 100 : 0;

  pnl.agExpenses = ag.totalExpenses;
  pnl.hrdExpenses = hrd.totalExpenses;
  pnl.smExpenses = sm.totalExpenses;
  pnl.pomecExpenses = pomec.totalExpenses;
  pnl.totalUndistributedExpenses = pnl.agExpenses + pnl.hrdExpenses + pnl.smExpenses + pnl.pomecExpenses;

  pnl.grossOperatingProfit = pnl.totalDepartmentalProfit - pnl.totalUndistributedExpenses;
  pnl.gopMarginPercent = pnl.totalNetRevenue > 0 ? (pnl.grossOperatingProfit / pnl.totalNetRevenue) * 100 : 0;

  pnl.nonOperatingExpenses = nonOp.total;
  pnl.netOperatingIncome = pnl.grossOperatingProfit - pnl.nonOperatingExpenses;
  pnl.noiMarginPercent = pnl.totalNetRevenue > 0 ? (pnl.netOperatingIncome / pnl.totalNetRevenue) * 100 : 0;

  // Sync Legacy CostOfSales & OperatingExpenses
  if (draft.costOfSales) {
    draft.costOfSales.fnbCostAmount = fnb.cogs.total;
    draft.costOfSales.roomSuppliesCost = rm.cogs.total;
    draft.costOfSales.otherDepartmentCost = mod.totalCogs;
    draft.costOfSales.totalCostOfSales = pnl.totalCogs;
    draft.costOfSales.fnbCostPercent = fnb.cogs.fnbCostPercent;
  }

  if (draft.operatingExpenses) {
    draft.operatingExpenses.totalPayrollExpenses = rm.frontOffice.salary.total + rm.housekeeping.salary.total + totFbPayroll + mod.laundry.salary.total + mod.spaFitness.salary.total + ag.salary.total + hrd.salary.total + sm.salary.total + pomec.salary.total;
    draft.operatingExpenses.totalMarketingExpenses = sm.totalExpenses;
    draft.operatingExpenses.totalPomExpenses = pomec.maintenance.total;
    draft.operatingExpenses.totalUtilitiesExpenses = pomec.energy.total;
    draft.operatingExpenses.totalAdminExpenses = ag.totalExpenses + hrd.totalExpenses;
    draft.operatingExpenses.totalOperatingExpenses = pnl.totalDepartmentalExpenses + pnl.totalUndistributedExpenses;
  }

  if (draft.profitSummary) {
    draft.profitSummary = {
      grossRevenue: pnl.totalGrossRevenue,
      netRevenue: pnl.totalNetRevenue,
      totalCostOfSales: pnl.totalCogs,
      grossProfit: pnl.grossProfit,
      grossProfitMarginPercent: pnl.grossProfitMarginPercent,
      totalOperatingExpenses: draft.operatingExpenses?.totalOperatingExpenses || 0,
      grossOperatingProfit: pnl.grossOperatingProfit,
      gopMarginPercent: pnl.gopMarginPercent,
    };
  }
};
