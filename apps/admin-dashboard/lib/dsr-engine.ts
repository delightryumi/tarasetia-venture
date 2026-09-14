import {
  BudgetMonthData,
  YearlyBudgetDocument,
  DSRReportResult,
  DSRDataRow,
  DSRCell,
  createDefaultBudgetMonthData,
} from "./budget-types";

export interface TransactionEntry {
  id?: string;
  bookingId?: string;
  roomNumber?: string;
  roomType?: string;
  roomTypeId?: string;
  guestName?: string;
  checkInDate?: string;
  checkIn?: string;
  checkOutDate?: string;
  checkOut?: string;
  effectiveDate?: string;
  category?: string;
  source?: string;
  channel?: string;
  department?: string;
  type?: string;
  description?: string;
  amount: number;
  paidCash?: number;
  paidTransfer?: number;
  paidEdc?: number;
  paidQris?: number;
  paidOta?: number;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  isDeleted?: boolean;
  isHidden?: boolean;
  isCompliment?: boolean;
  isHouseUse?: boolean;
  isOOO?: boolean;
  isOutOfOrder?: boolean;
  date?: string;
  pax?: number;
  adultCount?: number;
  childCount?: number;
  roomsCount?: number;
  timestamp?: string;
  posItems?: any[];
  revenueType?: string;
}

export interface PosOrderItem {
  id?: string;
  name?: string;
  category?: "food" | "beverage" | "other" | string;
  outlet?: "restaurant" | "room_service" | "banquet" | "bar" | string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface PosOrder {
  id?: string;
  orderNumber?: string;
  createdAt: string;
  date?: string;
  items: PosOrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentMethod?: string;
  orderType?: string;
}

export interface CustomIncomeItem {
  id?: string;
  name: string;
  amount: number;
  category?: string;
  date?: string;
}

export interface DSREngineInput {
  date: string; // YYYY-MM-DD
  hotelCode: string;
  hotelName: string;
  totalPropertyRooms?: number;
  budgetDoc: YearlyBudgetDocument | null;
  allTransactions?: TransactionEntry[]; // Full ranged FO transactions for year/overlap
  todayTransactions?: TransactionEntry[];
  mtdTransactions?: TransactionEntry[];
  ytdTransactions?: TransactionEntry[];
  todayPosOrders?: PosOrder[];
  mtdPosOrders?: PosOrder[];
  ytdPosOrders?: PosOrder[];
  customIncomes?: CustomIncomeItem[];
}

function calculateCell(
  todayAct: number,
  mtdAct: number,
  mtdBud: number,
  ytdAct: number,
  ytdBud: number,
  isPercent: boolean = false,
  todayBud?: number
): DSRCell {
  const mtdPct = mtdBud > 0 ? (mtdAct / mtdBud) * 100 : 0;
  const mtdVar = mtdAct - mtdBud;

  const ytdPct = ytdBud > 0 ? (ytdAct / ytdBud) * 100 : 0;
  const ytdVar = ytdAct - ytdBud;

  const todayVar = todayBud !== undefined ? todayAct - todayBud : undefined;

  return {
    todayActual: todayAct,
    todayVar,
    mtdActual: mtdAct,
    mtdPercent: mtdPct,
    mtdBudget: mtdBud,
    mtdVar: mtdVar,
    ytdActual: ytdAct,
    ytdPercent: ytdPct,
    ytdBudget: ytdBud,
    ytdVar: ytdVar,
  };
}

export function computeDSRReport(input: DSREngineInput): DSRReportResult {
  const {
    date,
    hotelCode,
    hotelName,
    totalPropertyRooms = 39,
    budgetDoc,
    allTransactions = [],
    todayTransactions = [],
    mtdTransactions = [],
    ytdTransactions = [],
    todayPosOrders = [],
    mtdPosOrders = [],
    ytdPosOrders = [],
    customIncomes = [],
  } = input;

  const [yearStr, monthStr, dayStr] = date.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const currentDay = parseInt(dayStr, 10);

  const startOfMonth = `${yearStr}-${monthStr}-01`;
  const startOfYear = `${yearStr}-01-01`;

  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const monthKey = monthStr.padStart(2, "0");

  let totalDaysSoFar = 0;
  for (let m = 1; m < monthNum; m++) {
    totalDaysSoFar += new Date(year, m, 0).getDate();
  }
  totalDaysSoFar += currentDay;

  const currentMonthBudget: BudgetMonthData =
    budgetDoc?.months?.[monthKey] || createDefaultBudgetMonthData();

  // Helper for budget pro-ration
  const getProRatedTodayBudget = (fullMonthBudget: number) => {
    return daysInMonth > 0 ? (fullMonthBudget || 0) / daysInMonth : 0;
  };

  // Full Month Budget (constant throughout the month)
  const getMonthBudget = (fullMonthBudget: number) => {
    return fullMonthBudget || 0;
  };

  // YTD Budget = Sum of full monthly budgets from Month 01 up to current Month (inclusive)
  const getYtdBudget = (accessor: (m: BudgetMonthData) => number) => {
    let sum = 0;
    for (let m = 1; m <= monthNum; m++) {
      const k = String(m).padStart(2, "0");
      const bData = budgetDoc?.months?.[k] || createDefaultBudgetMonthData();
      sum += accessor(bData) || 0;
    }
    return sum;
  };

  // ─────────────────────────────────────────────────────────────
  // 1. RESOLVE ACCOMMODATION TRANSACTIONS INTO DAILY STAY NIGHTS
  // ─────────────────────────────────────────────────────────────
  const rawTxList = allTransactions.length > 0 ? allTransactions : ytdTransactions;

  // Filter out VOID / CANCELLED / DELETED entries
  const validEntries = rawTxList.filter((e) => {
    if (e.isDeleted || e.isHidden) return false;
    const st = (e.status || "").toUpperCase();
    const pst = (e.paymentStatus || "").toUpperCase();
    if (
      st === "VOID" ||
      st === "VOIDED" ||
      st === "CANCEL" ||
      st === "CANCELLED" ||
      st === "NO-SHOW" ||
      pst === "VOID" ||
      pst === "VOIDED" ||
      pst === "CANCEL" ||
      pst === "CANCELLED"
    ) {
      return false;
    }
    return true;
  });

  const nonAccommodationEntries: TransactionEntry[] = [];

  interface DailyStayRecord {
    date: string; // YYYY-MM-DD
    roomNumber: string;
    roomType: string;
    guestName: string;
    dailyAmount: number;
    pax: number;
    roomsCount: number;
    isOOO: boolean;
    isHouseUse: boolean;
    isCompliment: boolean;
    isSold: boolean;
  }

  const dailyStayRecords: DailyStayRecord[] = [];

  const dayAccommodationGroups: Record<string, any[]> = {};

  validEntries.forEach((e) => {
    const isPelunasan =
      (e as any).isPelunasan ||
      e.type === "pelunasan_ar" ||
      e.type === "pelunasan_reversal" ||
      e.guestName?.startsWith("Koreksi Tanggal Pelunasan") ||
      e.guestName?.startsWith("Pelunasan Piutang");
    if (isPelunasan) return;


    const isPOS = e.guestName?.startsWith("POS Order") || !!e.posItems || !!e.revenueType;
    const isAccommodation =
      !isPOS &&
      (e.type === "accommodation" ||
        (!e.type && (e.guestName || e.roomNumber || e.roomType)));

    if (isAccommodation) {
      const entryDate = e.effectiveDate || e.date || e.checkInDate || date;
      const normGuestName = (e.guestName || "").trim().toLowerCase();
      const roomIdent = String(e.roomNumber || e.roomTypeId || e.roomType || '').trim();
      const cIn = e.checkInDate || e.checkIn || '';
      const cOut = e.checkOutDate || e.checkOut || '';
      const key = `${entryDate}_${(normGuestName && cIn) ? `${normGuestName}_${roomIdent}_${cIn}_${cOut}` : (e.bookingId ? `b_${e.bookingId}` : `t_${e.timestamp}`)}`;
      if (!dayAccommodationGroups[key]) {
        dayAccommodationGroups[key] = [];
      }
      dayAccommodationGroups[key].push(e);
    } else {
      nonAccommodationEntries.push(e);
    }
  });

  const cleanAccommodationEntries: any[] = [];
  Object.values(dayAccommodationGroups).forEach(group => {
    group.sort((a, b) => {
      const tA = new Date(a.timestamp || 0).getTime();
      const tB = new Date(b.timestamp || 0).getTime();
      return tA - tB;
    });
    cleanAccommodationEntries.push(group[group.length - 1]);
  });

  cleanAccommodationEntries.forEach((e) => {
    const entryDate = e.effectiveDate || e.date || e.checkInDate || date;
    const st = (e.status || "").toUpperCase();
    const pst = (e.paymentStatus || "").toUpperCase();
    const isOOO = st === "OOO" || st === "OUT_OF_ORDER" || !!e.isOOO || !!e.isOutOfOrder;
    const isHouseUse = st === "HOUSE_USE" || !!e.isHouseUse;
    const isCompliment = st === "COMPLIMENT" || pst === "COMPLIMENT" || !!e.isCompliment;
    const isSold = !isOOO && !isHouseUse && !isCompliment;

    dailyStayRecords.push({
      date: entryDate,
      roomNumber: e.roomNumber || "-",
      roomType: e.roomType || "-",
      guestName: e.guestName || "-",
      dailyAmount: isSold ? (Number(e.amount) || 0) : 0,
      pax: Number(e.pax) || Number(e.adultCount || 0) + Number(e.childCount || 0) || 1,
      roomsCount: Math.max(1, Number(e.roomsCount || (e as any).roomCount) || 1),
      isOOO,
      isHouseUse,
      isCompliment,
      isSold,
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. STATISTIC METRICS CALCULATION
  // ─────────────────────────────────────────────────────────────
  const physicalHotelRooms = totalPropertyRooms > 0 ? totalPropertyRooms : 8;

  // Rooms Available
  const roomsAvailableToday = physicalHotelRooms;
  const roomsAvailableMtdAct = physicalHotelRooms * currentDay;
  const roomsAvailableYtdAct = physicalHotelRooms * totalDaysSoFar;

  const roomsAvailableTodayBud = currentMonthBudget.statistic?.roomsAvailable
    ? currentMonthBudget.statistic.roomsAvailable / daysInMonth
    : physicalHotelRooms;
  const roomsAvailableMtdBud = currentMonthBudget.statistic?.roomsAvailable || physicalHotelRooms * daysInMonth;
  const roomsAvailableYtdBud = getYtdBudget(
    (b) => b.statistic?.roomsAvailable || (physicalHotelRooms * 30)
  );

  // Filter stay records by timeframe
  const todayStays = dailyStayRecords.filter((r) => r.date === date);
  const mtdStays = dailyStayRecords.filter(
    (r) => r.date >= startOfMonth && r.date <= date
  );
  const ytdStays = dailyStayRecords.filter(
    (r) => r.date >= startOfYear && r.date <= date
  );

  // Out of Order (OOO)
  const oooToday = todayStays.filter((r) => r.isOOO).reduce((s, r) => s + r.roomsCount, 0);
  const oooMtd = mtdStays.filter((r) => r.isOOO).reduce((s, r) => s + r.roomsCount, 0);
  const oooYtd = ytdStays.filter((r) => r.isOOO).reduce((s, r) => s + r.roomsCount, 0);

  const oooBudToday = getProRatedTodayBudget(currentMonthBudget.statistic?.roomsOutOfOrder || 0);
  const oooBudMtd = currentMonthBudget.statistic?.roomsOutOfOrder || 0;
  const oooBudYtd = getYtdBudget((b) => b.statistic?.roomsOutOfOrder || 0);

  // House Use
  const houseUseToday = todayStays.filter((r) => r.isHouseUse).reduce((s, r) => s + r.roomsCount, 0);
  const houseUseMtd = mtdStays.filter((r) => r.isHouseUse).reduce((s, r) => s + r.roomsCount, 0);
  const houseUseYtd = ytdStays.filter((r) => r.isHouseUse).reduce((s, r) => s + r.roomsCount, 0);

  const houseUseBudToday = getProRatedTodayBudget(currentMonthBudget.statistic?.houseUse || 0);
  const houseUseBudMtd = currentMonthBudget.statistic?.houseUse || 0;
  const houseUseBudYtd = getYtdBudget((b) => b.statistic?.houseUse || 0);

  // Compliment
  const complimentToday = todayStays.filter((r) => r.isCompliment).reduce((s, r) => s + r.roomsCount, 0);
  const complimentMtd = mtdStays.filter((r) => r.isCompliment).reduce((s, r) => s + r.roomsCount, 0);
  const complimentYtd = ytdStays.filter((r) => r.isCompliment).reduce((s, r) => s + r.roomsCount, 0);

  const complimentBudToday = getProRatedTodayBudget(currentMonthBudget.statistic?.roomsCompliment || 0);
  const complimentBudMtd = currentMonthBudget.statistic?.roomsCompliment || 0;
  const complimentBudYtd = getYtdBudget((b) => b.statistic?.roomsCompliment || 0);

  // Room Sold (Paid Occupied)
  const roomsSoldToday = todayStays.filter((r) => r.isSold).reduce((s, r) => s + r.roomsCount, 0);
  const roomsSoldMtd = mtdStays.filter((r) => r.isSold).reduce((s, r) => s + r.roomsCount, 0);
  const roomsSoldYtd = ytdStays.filter((r) => r.isSold).reduce((s, r) => s + r.roomsCount, 0);

  const roomsSoldBudToday = getProRatedTodayBudget(currentMonthBudget.statistic?.occupiedRoomsPaid || 0);
  const roomsSoldBudMtd = currentMonthBudget.statistic?.occupiedRoomsPaid || 0;
  const roomsSoldBudYtd = getYtdBudget((b) => b.statistic?.occupiedRoomsPaid || 0);

  // Room Saleable = Available - OOO
  const roomsSaleableToday = Math.max(0, roomsAvailableToday - oooToday);
  const roomsSaleableTodayBud = Math.max(0, roomsAvailableTodayBud - oooBudToday);
  const roomsSaleableMtdAct = Math.max(0, roomsAvailableMtdAct - oooMtd);
  const roomsSaleableMtdBud = Math.max(0, roomsAvailableMtdBud - oooBudMtd);
  const roomsSaleableYtdAct = Math.max(0, roomsAvailableYtdAct - oooYtd);
  const roomsSaleableYtdBud = Math.max(0, roomsAvailableYtdBud - oooBudYtd);

  // Room Occupied = Sold + Compliment + House Use
  const roomsOccupiedToday = roomsSoldToday + complimentToday + houseUseToday;
  const roomsOccupiedMtd = roomsSoldMtd + complimentMtd + houseUseMtd;
  const roomsOccupiedYtd = roomsSoldYtd + complimentYtd + houseUseYtd;

  const roomsOccupiedBudToday = roomsSoldBudToday + houseUseBudToday + complimentBudToday;
  const roomsOccupiedBudMtd = roomsSoldBudMtd + houseUseBudMtd + complimentBudMtd;
  const roomsOccupiedBudYtd = roomsSoldBudYtd + houseUseBudYtd + complimentBudYtd;

  // Occupancy & Sold Percent
  const occToday = roomsSaleableToday > 0 ? (roomsOccupiedToday / roomsSaleableToday) * 100 : 0;
  const occMtd = roomsSaleableMtdAct > 0 ? (roomsOccupiedMtd / roomsSaleableMtdAct) * 100 : 0;
  const occYtd = roomsSaleableYtdAct > 0 ? (roomsOccupiedYtd / roomsSaleableYtdAct) * 100 : 0;
  const occBudToday = currentMonthBudget.statistic?.occupancyPercent || (roomsSaleableTodayBud > 0 ? (roomsOccupiedBudToday / roomsSaleableTodayBud) * 100 : 0);
  const occBudMtd = currentMonthBudget.statistic?.occupancyPercent || (roomsSaleableMtdBud > 0 ? (roomsOccupiedBudMtd / roomsSaleableMtdBud) * 100 : 0);
  const occBudYtd = roomsSaleableYtdBud > 0 ? (roomsOccupiedBudYtd / roomsSaleableYtdBud) * 100 : (currentMonthBudget.statistic?.occupancyPercent || 0);

  const soldPctToday = roomsSaleableToday > 0 ? (roomsSoldToday / roomsSaleableToday) * 100 : 0;
  const soldPctMtd = roomsSaleableMtdAct > 0 ? (roomsSoldMtd / roomsSaleableMtdAct) * 100 : 0;
  const soldPctYtd = roomsSaleableYtdAct > 0 ? (roomsSoldYtd / roomsSaleableYtdAct) * 100 : 0;
  const soldPctBudToday = roomsSaleableTodayBud > 0 ? (roomsSoldBudToday / roomsSaleableTodayBud) * 100 : (currentMonthBudget.statistic?.occupancyPercent || 0);
  const soldPctBudMtd = roomsSaleableMtdBud > 0 ? (roomsSoldBudMtd / roomsSaleableMtdBud) * 100 : (currentMonthBudget.statistic?.occupancyPercent || 0);
  const soldPctBudYtd = roomsSaleableYtdBud > 0 ? (roomsSoldBudYtd / roomsSaleableYtdBud) * 100 : (currentMonthBudget.statistic?.occupancyPercent || 0);

  // Total Number of Pax
  const paxToday = todayStays.reduce((s, r) => s + r.pax, 0);
  const paxMtd = mtdStays.reduce((s, r) => s + r.pax, 0);
  const paxYtd = ytdStays.reduce((s, r) => s + r.pax, 0);

  const getPaxBudVal = (b: BudgetMonthData) => {
    return (
      b.statistic?.totalPax ||
      b.statistic?.payingPax ||
      b.statistic?.occupiedRoomsPaid ||
      0
    );
  };
  const paxBudToday = getProRatedTodayBudget(getPaxBudVal(currentMonthBudget));
  const paxBudMtd = getPaxBudVal(currentMonthBudget);
  const paxBudYtd = getYtdBudget(getPaxBudVal);

  // ─────────────────────────────────────────────────────────────
  // 3. REVENUE BREAKDOWN CALCULATIONS
  // ─────────────────────────────────────────────────────────────

  // Lodging Revenue from Stay Records
  const roomLodgingToday = todayStays.reduce((s, r) => s + r.dailyAmount, 0);
  const roomLodgingMtd = mtdStays.reduce((s, r) => s + r.dailyAmount, 0);
  const roomLodgingYtd = ytdStays.reduce((s, r) => s + r.dailyAmount, 0);

  const getLodgingBudVal = (b: BudgetMonthData) => {
    return (
      b.roomRevenue?.lodging ||
      b.deptRooms?.revenue?.lodging ||
      b.summaryPnl?.roomRevenue ||
      ((b.statistic?.occupiedRoomsPaid || 0) * (b.statistic?.arrIdr || 0)) ||
      0
    );
  };

  const roomLodgingBudToday = getProRatedTodayBudget(getLodgingBudVal(currentMonthBudget));
  const roomLodgingBudMtd = getLodgingBudVal(currentMonthBudget);
  const roomLodgingBudYtd = getYtdBudget(getLodgingBudVal);

  // Other Room Revenue (Extra bed, late checkout, etc.)
  const filterNonAccRev = (
    timeframe: "today" | "mtd" | "ytd",
    matcher: (t: TransactionEntry) => boolean
  ) => {
    return nonAccommodationEntries
      .filter((t) => {
        const d = t.date || date;
        if (timeframe === "today" && d !== date) return false;
        if (timeframe === "mtd" && (d < startOfMonth || d > date)) return false;
        if (timeframe === "ytd" && (d < startOfYear || d > date)) return false;
        return matcher(t);
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  };

  const isOtherRoomMatcher = (t: TransactionEntry) => {
    const cat = (t.category || t.department || "").toLowerCase();
    const desc = (t.description || "").toLowerCase();
    return (
      cat.includes("extra_bed") ||
      cat.includes("other_room") ||
      desc.includes("extra bed") ||
      desc.includes("late checkout") ||
      desc.includes("early checkin")
    );
  };

  const roomOtherToday = filterNonAccRev("today", isOtherRoomMatcher);
  const roomOtherMtd = filterNonAccRev("mtd", isOtherRoomMatcher);
  const roomOtherYtd = filterNonAccRev("ytd", isOtherRoomMatcher);

  const getRoomOtherBudVal = (b: BudgetMonthData) => {
    return (
      b.roomRevenue?.otherRoomRevenue ||
      b.roomRevenue?.extraBed ||
      b.deptRooms?.revenue?.otherRoomRevenue ||
      b.deptRooms?.revenue?.extraBed ||
      0
    );
  };

  const roomOtherBudToday = getProRatedTodayBudget(getRoomOtherBudVal(currentMonthBudget));
  const roomOtherBudMtd = getRoomOtherBudVal(currentMonthBudget);
  const roomOtherBudYtd = getYtdBudget(getRoomOtherBudVal);

  const totalRoomToday = roomLodgingToday + roomOtherToday;
  const totalRoomMtd = roomLodgingMtd + roomOtherMtd;
  const totalRoomYtd = roomLodgingYtd + roomOtherYtd;
  const totalRoomBudToday = roomLodgingBudToday + roomOtherBudToday;
  const totalRoomBudMtd = roomLodgingBudMtd + roomOtherBudMtd;
  const totalRoomBudYtd = roomLodgingBudYtd + roomOtherBudYtd;

  // ARR & RevPAR
  const arrToday = roomsSoldToday > 0 ? roomLodgingToday / roomsSoldToday : 0;
  const arrMtd = roomsSoldMtd > 0 ? roomLodgingMtd / roomsSoldMtd : 0;
  const arrYtd = roomsSoldYtd > 0 ? roomLodgingYtd / roomsSoldYtd : 0;
  const arrBudToday = currentMonthBudget.statistic?.arrIdr || (roomsSoldBudToday > 0 ? roomLodgingBudToday / roomsSoldBudToday : 0);
  const arrBudMtd = currentMonthBudget.statistic?.arrIdr || (roomsSoldBudMtd > 0 ? roomLodgingBudMtd / roomsSoldBudMtd : 0);
  const arrBudYtd = roomsSoldBudYtd > 0 ? roomLodgingBudYtd / roomsSoldBudYtd : (currentMonthBudget.statistic?.arrIdr || 0);

  const revparToday = roomsAvailableToday > 0 ? roomLodgingToday / roomsAvailableToday : 0;
  const revparMtd = roomsAvailableMtdAct > 0 ? roomLodgingMtd / roomsAvailableMtdAct : 0;
  const revparYtd = roomsAvailableYtdAct > 0 ? roomLodgingYtd / roomsAvailableYtdAct : 0;
  const revparBudToday = roomsAvailableTodayBud > 0 ? roomLodgingBudToday / roomsAvailableTodayBud : 0;
  const revparBudMtd = roomsAvailableMtdBud > 0 ? roomLodgingBudMtd / roomsAvailableMtdBud : 0;
  const revparBudYtd = roomsAvailableYtdBud > 0 ? roomLodgingBudYtd / roomsAvailableYtdBud : 0;

  // POS / F&B Orders Helper
  const filterPosRev = (
    orders: PosOrder[],
    type: "food" | "beverage" | "other",
    outletMatcher?: (outlet: string) => boolean
  ) => {
    return orders.reduce((sum, order) => {
      const isVoid = ((order as any).status || "").toUpperCase();
      if (isVoid === "VOID" || isVoid === "VOIDED" || isVoid === "CANCELLED" || isVoid === "CANCEL" || (order as any).isDeleted) {
        return sum;
      }

      const items = order.items || [];
      if (items.length > 0) {
        const itemSum = items.reduce((iSum, item) => {
          const cat = (item.category || (item as any).pnlTarget || "").toLowerCase().trim();
          const outlet = (item.outlet || (order as any).revenueType || "restaurant").toLowerCase().trim();
          
          let matchesCat = false;
          if (type === "food") {
            matchesCat = cat === "food" || cat === "makanan" || cat.includes("food") || cat.includes("makan");
          } else if (type === "beverage") {
            matchesCat = cat === "beverage" || cat === "bev" || cat === "drink" || cat === "minuman" || cat.includes("bev") || cat.includes("drink") || cat.includes("minum");
          } else {
            // Other: not food and not beverage (and not spa/laundry)
            const isFoodOrBev = cat.includes("food") || cat.includes("makan") || cat.includes("bev") || cat.includes("drink") || cat.includes("minum");
            const isMinor = cat.includes("spa") || cat.includes("laundry");
            matchesCat = cat === "other" || (!isFoodOrBev && !isMinor);
          }

          const matchesOutlet = outletMatcher ? outletMatcher(outlet) : true;
          if (matchesCat && matchesOutlet) {
            return iSum + (Number(item.subtotal) || Number(item.price || 0) * Number(item.quantity || 1) || 0);
          }
          return iSum;
        }, 0);
        return sum + itemSum;
      }

      // Fallback if order has no items array
      const ordAmt = Number(order.subtotal || order.total || 0);
      if (ordAmt > 0) {
        const ordCat = ((order as any).orderType || (order as any).category || (order as any).revenueType || "").toLowerCase().trim();
        const outlet = ((order as any).revenueType || "restaurant").toLowerCase().trim();
        let matchesCat = false;
        if (type === "food") {
          matchesCat = ordCat.includes("food") || ordCat.includes("makan");
        } else if (type === "beverage") {
          matchesCat = ordCat.includes("bev") || ordCat.includes("drink") || ordCat.includes("minum");
        } else {
          matchesCat = type === "other";
        }
        const matchesOutlet = outletMatcher ? outletMatcher(outlet) : true;
        if (matchesCat && matchesOutlet) {
          return sum + ordAmt;
        }
      }

      return sum;
    }, 0);
  };

  const getFnbRev = (
    subCat: "breakfast" | "restaurant" | "roomService" | "banquet" | "minibar",
    type: "food" | "beverage" | "other"
  ) => {
    const outletMatcher = (outlet: string) => {
      const o = (outlet || "").toLowerCase();
      if (subCat === "breakfast") return o.includes("breakfast") || o.includes("pagi");
      if (subCat === "restaurant") return o.includes("restaurant") || o.includes("resto") || o.includes("outlet") || o.includes("alacarte") || o === "restaurant" || !o;
      if (subCat === "roomService") return o.includes("room") || o.includes("service") || o.includes("rs");
      if (subCat === "banquet") return o.includes("banquet") || o.includes("bq") || o.includes("meeting");
      if (subCat === "minibar") return o.includes("minibar") || o.includes("mini");
      return true;
    };

    const foMatcher = (t: TransactionEntry) => {
      const cat = (t.category || t.department || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const isFnb =
        cat.includes("f&b") ||
        cat.includes("resto") ||
        cat.includes("food") ||
        cat.includes("bev") ||
        desc.includes("makan") ||
        desc.includes("minum");
      if (!isFnb) return false;
      if (type === "food" && (cat.includes("food") || desc.includes("makanan") || !cat.includes("bev"))) {
        return outletMatcher(cat + " " + desc);
      }
      if (type === "beverage" && (cat.includes("bev") || desc.includes("minuman") || cat.includes("drink"))) {
        return outletMatcher(cat + " " + desc);
      }
      return outletMatcher(cat + " " + desc);
    };

    const todayAct = filterPosRev(todayPosOrders, type, outletMatcher) + filterNonAccRev("today", foMatcher);
    const mtdAct = filterPosRev(mtdPosOrders, type, outletMatcher) + filterNonAccRev("mtd", foMatcher);
    const ytdAct = filterPosRev(ytdPosOrders, type, outletMatcher) + filterNonAccRev("ytd", foMatcher);

    return { todayAct, mtdAct, ytdAct };
  };

  // Food Sub-items
  const foodBkf = getFnbRev("breakfast", "food");
  const foodRest = getFnbRev("restaurant", "food");
  const foodRs = getFnbRev("roomService", "food");
  const foodBq = getFnbRev("banquet", "food");

  const totalFoodToday = foodBkf.todayAct + foodRest.todayAct + foodRs.todayAct + foodBq.todayAct;
  const totalFoodMtd = foodBkf.mtdAct + foodRest.mtdAct + foodRs.mtdAct + foodBq.mtdAct;
  const totalFoodYtd = foodBkf.ytdAct + foodRest.ytdAct + foodRs.ytdAct + foodBq.ytdAct;

  const getFoodBkfBud = (b: BudgetMonthData) => b.fnbRevenue?.food?.breakfast || b.deptFnB?.revenue?.kitchen?.food || 0;
  const getFoodRestBud = (b: BudgetMonthData) => b.fnbRevenue?.food?.restaurant || b.deptFnB?.revenue?.restaurant?.food || 0;
  const getFoodRsBud = (b: BudgetMonthData) => b.fnbRevenue?.food?.roomService || b.deptFnB?.revenue?.roomService?.food || 0;
  const getFoodBqBud = (b: BudgetMonthData) => b.fnbRevenue?.food?.banquet || b.deptFnB?.revenue?.banquet?.food || 0;
  const getTotalFoodBud = (b: BudgetMonthData) =>
    b.fnbRevenue?.food?.totalFoodRevenue ||
    b.deptFnB?.revenue?.totalFood ||
    (getFoodBkfBud(b) + getFoodRestBud(b) + getFoodRsBud(b) + getFoodBqBud(b));

  const totalFoodBudToday = getProRatedTodayBudget(getTotalFoodBud(currentMonthBudget));
  const totalFoodBudMtd = getTotalFoodBud(currentMonthBudget);
  const totalFoodBudYtd = getYtdBudget(getTotalFoodBud);

  // Beverage Sub-items
  const bevRest = getFnbRev("restaurant", "beverage");
  const bevRs = getFnbRev("roomService", "beverage");
  const bevBq = getFnbRev("banquet", "beverage");
  const bevMinibar = getFnbRev("minibar", "beverage");

  const totalBevToday = bevRest.todayAct + bevRs.todayAct + bevBq.todayAct + bevMinibar.todayAct;
  const totalBevMtd = bevRest.mtdAct + bevRs.mtdAct + bevBq.mtdAct + bevMinibar.mtdAct;
  const totalBevYtd = bevRest.ytdAct + bevRs.ytdAct + bevBq.ytdAct + bevMinibar.ytdAct;

  const getBevRestBud = (b: BudgetMonthData) => b.fnbRevenue?.beverage?.restaurant || b.deptFnB?.revenue?.restaurant?.beverage || 0;
  const getBevRsBud = (b: BudgetMonthData) => b.fnbRevenue?.beverage?.roomService || b.deptFnB?.revenue?.roomService?.beverage || 0;
  const getBevBqBud = (b: BudgetMonthData) => b.fnbRevenue?.beverage?.banquet || b.deptFnB?.revenue?.banquet?.beverage || 0;
  const getBevMinibarBud = (b: BudgetMonthData) => b.fnbRevenue?.beverage?.minibar || b.deptFnB?.revenue?.lounge?.beverage || 0;
  const getTotalBevBud = (b: BudgetMonthData) =>
    b.fnbRevenue?.beverage?.totalBeverageRevenue ||
    b.deptFnB?.revenue?.totalBeverage ||
    (getBevRestBud(b) + getBevRsBud(b) + getBevBqBud(b) + getBevMinibarBud(b));

  const totalBevBudToday = getProRatedTodayBudget(getTotalBevBud(currentMonthBudget));
  const totalBevBudMtd = getTotalBevBud(currentMonthBudget);
  const totalBevBudYtd = getYtdBudget(getTotalBevBud);

  // Other F&B
  const otherRest = getFnbRev("restaurant", "other");
  const otherBq = getFnbRev("banquet", "other");

  const totalOtherToday = otherRest.todayAct + otherBq.todayAct;
  const totalOtherMtd = otherRest.mtdAct + otherBq.mtdAct;
  const totalOtherYtd = otherRest.ytdAct + otherBq.ytdAct;

  const getOtherFnbRestBud = (b: BudgetMonthData) => b.fnbRevenue?.other?.restaurant || b.deptFnB?.revenue?.restaurant?.other || 0;
  const getOtherFnbBqBud = (b: BudgetMonthData) => b.fnbRevenue?.other?.banquet || b.deptFnB?.revenue?.banquet?.other || 0;
  const getTotalOtherFnbBud = (b: BudgetMonthData) =>
    b.fnbRevenue?.other?.totalOtherFnBRevenue ||
    b.deptFnB?.revenue?.totalOther ||
    (getOtherFnbRestBud(b) + getOtherFnbBqBud(b));

  const totalOtherBudToday = getProRatedTodayBudget(getTotalOtherFnbBud(currentMonthBudget));
  const totalOtherBudMtd = getTotalOtherFnbBud(currentMonthBudget);
  const totalOtherBudYtd = getYtdBudget(getTotalOtherFnbBud);

  // Minor Operating Revenue Helper for POS
  const filterPosMinorRev = (orders: PosOrder[], keyword: string) => {
    return orders.reduce((sum, order) => {
      const isVoid = ((order as any).status || "").toUpperCase();
      if (isVoid === "VOID" || isVoid === "VOIDED" || isVoid === "CANCELLED" || isVoid === "CANCEL" || (order as any).isDeleted) {
        return sum;
      }
      const items = order.items || [];
      if (items.length > 0) {
        const itemSum = items.reduce((iSum, item) => {
          const cat = (item.category || (item as any).pnlTarget || "").toLowerCase().trim();
          const name = (item.name || "").toLowerCase().trim();
          if (cat.includes(keyword) || name.includes(keyword)) {
            return iSum + (Number(item.subtotal) || Number(item.price || 0) * Number(item.quantity || 1) || 0);
          }
          return iSum;
        }, 0);
        return sum + itemSum;
      }
      const ordCat = ((order as any).orderType || (order as any).category || (order as any).revenueType || "").toLowerCase().trim();
      if (ordCat.includes(keyword)) {
        return sum + (Number(order.subtotal || order.total) || 0);
      }
      return sum;
    }, 0);
  };

  // Minor Operating Revenue Helper for Custom Incomes
  const filterCustomIncomeRev = (
    incomes: CustomIncomeItem[] = [],
    keyword: string,
    timeframe: "today" | "mtd" | "ytd"
  ) => {
    return (incomes || []).reduce((sum, item) => {
      const d = item.date || date;
      if (timeframe === "today" && d !== date) return sum;
      if (timeframe === "mtd" && (d < startOfMonth || d > date)) return sum;
      if (timeframe === "ytd" && (d < startOfYear || d > date)) return sum;

      const cat = (item.category || "").toLowerCase().trim();
      const name = (item.name || "").toLowerCase().trim();

      let matches = false;
      if (keyword === "misc") {
        const isSpecific =
          cat.includes("laundry") ||
          cat.includes("spa") ||
          cat.includes("tour") ||
          cat.includes("transport") ||
          cat.includes("snack") ||
          cat.includes("mineral") ||
          cat.includes("food") ||
          cat.includes("bev");
        matches =
          cat.includes("misc") ||
          cat.includes("other") ||
          cat.includes("sewa") ||
          cat.includes("rental") ||
          name.includes("misc") ||
          name.includes("other") ||
          name.includes("sewa") ||
          name.includes("rental") ||
          !isSpecific;
      } else {
        matches = cat.includes(keyword) || name.includes(keyword);
      }

      if (matches) {
        return sum + (Number(item.amount) || 0);
      }
      return sum;
    }, 0);
  };

  // Minor Operating Revenue
  const getMinorRev = (keyword: string) => {
    const matcher = (t: TransactionEntry) => {
      const cat = (t.category || t.department || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      if (keyword === "misc") {
        const isSpecific =
          cat.includes("laundry") ||
          cat.includes("spa") ||
          cat.includes("snack") ||
          cat.includes("mineral") ||
          cat.includes("pillow") ||
          cat.includes("towel") ||
          cat.includes("print") ||
          cat.includes("key") ||
          cat.includes("smoking") ||
          cat.includes("tour") ||
          cat.includes("food") ||
          cat.includes("bev") ||
          cat.includes("extra_bed") ||
          desc.includes("extra bed");
        return (
          cat.includes("misc") ||
          cat.includes("other") ||
          cat.includes("sewa") ||
          cat.includes("rental") ||
          desc.includes("misc") ||
          desc.includes("other") ||
          desc.includes("sewa") ||
          desc.includes("rental") ||
          (!isSpecific && (t.type === "other_income" || cat.includes("income")))
        );
      }
      return cat.includes(keyword) || desc.includes(keyword);
    };
    return {
      todayAct: filterNonAccRev("today", matcher) + filterPosMinorRev(todayPosOrders, keyword) + filterCustomIncomeRev(customIncomes, keyword, "today"),
      mtdAct: filterNonAccRev("mtd", matcher) + filterPosMinorRev(mtdPosOrders, keyword) + filterCustomIncomeRev(customIncomes, keyword, "mtd"),
      ytdAct: filterNonAccRev("ytd", matcher) + filterPosMinorRev(ytdPosOrders, keyword) + filterCustomIncomeRev(customIncomes, keyword, "ytd"),
    };
  };

  const laundryRev = getMinorRev("laundry");
  const minibarSnackRev = getMinorRev("snack");
  const mineralWaterRev = getMinorRev("mineral");
  const miscRev = getMinorRev("misc");
  const pillowRev = getMinorRev("pillow");
  const towelRev = getMinorRev("towel");
  const printRev = getMinorRev("print");
  const keyCardRev = getMinorRev("key");
  const smokingRev = getMinorRev("smoking");
  const tourRev = getMinorRev("tour");
  const spaRev = getMinorRev("spa");

  const totalMinorToday =
    laundryRev.todayAct +
    minibarSnackRev.todayAct +
    mineralWaterRev.todayAct +
    miscRev.todayAct +
    pillowRev.todayAct +
    towelRev.todayAct +
    printRev.todayAct +
    keyCardRev.todayAct +
    smokingRev.todayAct +
    tourRev.todayAct +
    spaRev.todayAct;
  const totalMinorMtd =
    laundryRev.mtdAct +
    minibarSnackRev.mtdAct +
    mineralWaterRev.mtdAct +
    miscRev.mtdAct +
    pillowRev.mtdAct +
    towelRev.mtdAct +
    printRev.mtdAct +
    keyCardRev.mtdAct +
    smokingRev.mtdAct +
    tourRev.mtdAct +
    spaRev.mtdAct;
  const totalMinorYtd =
    laundryRev.ytdAct +
    minibarSnackRev.ytdAct +
    mineralWaterRev.ytdAct +
    miscRev.ytdAct +
    pillowRev.ytdAct +
    towelRev.ytdAct +
    printRev.ytdAct +
    keyCardRev.ytdAct +
    smokingRev.ytdAct +
    tourRev.ytdAct +
    spaRev.ytdAct;

  const getLaundryBud = (b: BudgetMonthData) => b.minorOperatingRevenue?.laundry || b.deptMod?.laundry?.revenue?.total || 0;
  const getSpaBud = (b: BudgetMonthData) => b.minorOperatingRevenue?.spaFitness || b.deptMod?.spaFitness?.revenue?.total || 0;
  const getMinibarSnackBud = (b: BudgetMonthData) => b.minorOperatingRevenue?.minibarSnacks || 0;
  const getMineralWaterBud = (b: BudgetMonthData) => b.minorOperatingRevenue?.mineralWater || 0;
  const getTourBud = (b: BudgetMonthData) => b.minorOperatingRevenue?.tourTransport || b.deptMod?.otherIncome?.revenue?.transportation || 0;
  const getMiscBud = (b: BudgetMonthData) => b.minorOperatingRevenue?.misc || b.deptMod?.otherIncome?.revenue?.others || 0;
  const getTotalMinorBud = (b: BudgetMonthData) =>
    b.minorOperatingRevenue?.totalMinorOperatingRevenue ||
    b.deptMod?.totalRevenue ||
    b.summaryPnl?.modRevenue ||
    (getLaundryBud(b) + getSpaBud(b) + getMinibarSnackBud(b) + getMineralWaterBud(b) + getTourBud(b) + getMiscBud(b));

  const totalMinorBudToday = getProRatedTodayBudget(getTotalMinorBud(currentMonthBudget));
  const totalMinorBudMtd = getTotalMinorBud(currentMonthBudget);
  const totalMinorBudYtd = getYtdBudget(getTotalMinorBud);

  // Amenities Revenue
  const amenitiesOtherRev = getMinorRev("amenities");
  const totalAmenitiesToday = amenitiesOtherRev.todayAct;
  const totalAmenitiesMtd = amenitiesOtherRev.mtdAct;
  const totalAmenitiesYtd = amenitiesOtherRev.ytdAct;

  const getAmenitiesBud = (b: BudgetMonthData) => b.amenitiesRevenue?.totalAmenitiesRevenue || b.amenitiesRevenue?.minibarOther || 0;

  const totalAmenitiesBudToday = getProRatedTodayBudget(getAmenitiesBud(currentMonthBudget));
  const totalAmenitiesBudMtd = getAmenitiesBud(currentMonthBudget);
  const totalAmenitiesBudYtd = getYtdBudget(getAmenitiesBud);

  // Total Net Revenue
  const netRevenueToday =
    totalRoomToday +
    totalFoodToday +
    totalBevToday +
    totalOtherToday +
    totalMinorToday +
    totalAmenitiesToday;
  const netRevenueMtd =
    totalRoomMtd +
    totalFoodMtd +
    totalBevMtd +
    totalOtherMtd +
    totalMinorMtd +
    totalAmenitiesMtd;
  const netRevenueYtd =
    totalRoomYtd +
    totalFoodYtd +
    totalBevYtd +
    totalOtherYtd +
    totalMinorYtd +
    totalAmenitiesYtd;

  const getNetRevBud = (b: BudgetMonthData) =>
    b.netRevenue ||
    b.summaryPnl?.totalNetRevenue ||
    (getLodgingBudVal(b) + getRoomOtherBudVal(b) + getTotalFoodBud(b) + getTotalBevBud(b) + getTotalOtherFnbBud(b) + getTotalMinorBud(b) + getAmenitiesBud(b));

  const netRevenueBudToday = getProRatedTodayBudget(getNetRevBud(currentMonthBudget));
  const netRevenueBudMtd = getNetRevBud(currentMonthBudget);
  const netRevenueBudYtd = getYtdBudget(getNetRevBud);

  const serviceRate = (currentMonthBudget.serviceChargeRate || 10) / 100;
  const taxRate = (currentMonthBudget.taxRate || 10) / 100;

  const serviceToday = netRevenueToday * serviceRate;
  const serviceMtd = netRevenueMtd * serviceRate;
  const serviceYtd = netRevenueYtd * serviceRate;

  const getSvcBud = (b: BudgetMonthData) =>
    b.serviceChargeAmount ||
    b.summaryPnl?.serviceCharge ||
    (getNetRevBud(b) * ((b.serviceChargeRate || 10) / 100));

  const serviceBudToday = getProRatedTodayBudget(getSvcBud(currentMonthBudget));
  const serviceBudMtd = getSvcBud(currentMonthBudget);
  const serviceBudYtd = getYtdBudget(getSvcBud);

  const taxToday = netRevenueToday * taxRate;
  const taxMtd = netRevenueMtd * taxRate;
  const taxYtd = netRevenueYtd * taxRate;

  const getTaxBud = (b: BudgetMonthData) =>
    b.taxAmount ||
    b.summaryPnl?.governmentTax ||
    (getNetRevBud(b) * ((b.taxRate || 10) / 100));

  const taxBudToday = getProRatedTodayBudget(getTaxBud(currentMonthBudget));
  const taxBudMtd = getTaxBud(currentMonthBudget);
  const taxBudYtd = getYtdBudget(getTaxBud);

  const grossRevenueToday = netRevenueToday + serviceToday + taxToday;
  const grossRevenueMtd = netRevenueMtd + serviceMtd + taxMtd;
  const grossRevenueYtd = netRevenueYtd + serviceYtd + taxYtd;

  const getGrossRevBud = (b: BudgetMonthData) =>
    b.grossRevenue ||
    b.summaryPnl?.totalGrossRevenue ||
    (getNetRevBud(b) + getSvcBud(b) + getTaxBud(b));

  const grossRevenueBudToday = getProRatedTodayBudget(getGrossRevBud(currentMonthBudget));
  const grossRevenueBudMtd = getGrossRevBud(currentMonthBudget);
  const grossRevenueBudYtd = getYtdBudget(getGrossRevBud);

  // TrevPAR & TRevPOR
  const trevparToday = roomsAvailableToday > 0 ? grossRevenueToday / roomsAvailableToday : 0;
  const trevparMtd = roomsAvailableMtdAct > 0 ? grossRevenueMtd / roomsAvailableMtdAct : 0;
  const trevparBudToday = roomsAvailableTodayBud > 0 ? grossRevenueBudToday / roomsAvailableTodayBud : 0;
  const trevparBudMtd = roomsAvailableMtdBud > 0 ? grossRevenueBudMtd / roomsAvailableMtdBud : 0;
  const trevparYtd = roomsAvailableYtdAct > 0 ? grossRevenueYtd / roomsAvailableYtdAct : 0;
  const trevparBudYtd = roomsAvailableYtdBud > 0 ? grossRevenueBudYtd / roomsAvailableYtdBud : 0;

  const trevporToday = roomsOccupiedToday > 0 ? grossRevenueToday / roomsOccupiedToday : 0;
  const trevporMtd = roomsOccupiedMtd > 0 ? grossRevenueMtd / roomsOccupiedMtd : 0;
  const trevporBudToday = roomsOccupiedBudToday > 0 ? grossRevenueBudToday / roomsOccupiedBudToday : 0;
  const trevporBudMtd = roomsOccupiedBudMtd > 0 ? grossRevenueBudMtd / roomsOccupiedBudMtd : 0;
  const trevporYtd = roomsOccupiedYtd > 0 ? grossRevenueYtd / roomsOccupiedYtd : 0;
  const trevporBudYtd = roomsOccupiedBudYtd > 0 ? grossRevenueBudYtd / roomsOccupiedBudYtd : 0;

  // ─────────────────────────────────────────────────────────────
  // 4. PAYMENTS & SETTLEMENTS
  // ─────────────────────────────────────────────────────────────
  const sumPayment = (timeframe: "today" | "mtd" | "ytd", type: "cash" | "edc_bca" | "edc_mandiri" | "qris" | "transfer" | "city_ledger") => {
    let foSum = 0;
    validEntries.forEach((t) => {
      const d = t.date || date;
      if (timeframe === "today" && d !== date) return;
      if (timeframe === "mtd" && (d < startOfMonth || d > date)) return;
      if (timeframe === "ytd" && (d < startOfYear || d > date)) return;

      const hasGranular = (t.paidCash !== undefined || t.paidEdc !== undefined || t.paidQris !== undefined || t.paidTransfer !== undefined || t.paidOta !== undefined);
      const pm = (t.paymentMethod || t.channel || "").toLowerCase();
      const isOtaChannel = t.channel && !["direct", "walk-in", "internal", "-"].includes(t.channel.toLowerCase());

      if (hasGranular) {
        if (type === "cash") foSum += Number(t.paidCash || 0);
        else if (type === "edc_bca") foSum += Number(t.paidEdc || 0);
        else if (type === "edc_mandiri") foSum += 0;
        else if (type === "qris") foSum += Number(t.paidQris || 0);
        else if (type === "transfer") foSum += Number(t.paidTransfer || 0);
        else if (type === "city_ledger") foSum += Number(t.paidOta || (isOtaChannel ? t.paidTransfer || 0 : 0));
      } else {
        // Legacy fallback
        const legacyHotel = Number((t as any).payHotel ?? t.paidCash ?? 0);
        const legacyTransfer = Number((t as any).payTransfer ?? (t as any).payNexura ?? t.paidTransfer ?? 0);

        if (type === "cash") {
          if (pm.includes("cash") || pm.includes("tunai") || (!isOtaChannel && legacyHotel > 0 && !pm.includes("edc") && !pm.includes("qris") && !pm.includes("transfer"))) {
            foSum += legacyHotel || Number(t.amount || 0);
          }
        } else if (type === "edc_bca") {
          if (pm.includes("bca") || pm.includes("card") || (pm.includes("edc") && !pm.includes("mandiri"))) {
            foSum += legacyHotel || Number(t.amount || 0);
          }
        } else if (type === "edc_mandiri") {
          if (pm.includes("mandiri")) {
            foSum += legacyHotel || Number(t.amount || 0);
          }
        } else if (type === "qris") {
          if (pm.includes("qris")) {
            foSum += legacyHotel || Number(t.amount || 0);
          }
        } else if (type === "transfer") {
          if (!isOtaChannel && (pm.includes("transfer") || pm.includes("bank"))) {
            foSum += legacyTransfer || legacyHotel || Number(t.amount || 0);
          }
        } else if (type === "city_ledger") {
          if (isOtaChannel || pm.includes("ota") || pm.includes("virtual") || pm.includes("city_ledger")) {
            foSum += legacyTransfer || Number(t.amount || 0);
          }
        }
      }
    });

    const posList = timeframe === "today" ? todayPosOrders : timeframe === "mtd" ? mtdPosOrders : ytdPosOrders;
    let posSum = 0;
    posList.forEach((o) => {
      const pm = (o.paymentMethod || "").toLowerCase();
      if (type === "cash" && (pm.includes("cash") || pm.includes("tunai"))) posSum += Number(o.total || 0);
      else if (type === "transfer" && (pm.includes("transfer") || pm.includes("bank"))) posSum += Number(o.total || 0);
      else if (type === "edc_bca" && (pm.includes("bca") || pm.includes("edc"))) posSum += Number(o.total || 0);
      else if (type === "edc_mandiri" && pm.includes("mandiri")) posSum += Number(o.total || 0);
      else if (type === "qris" && pm.includes("qris")) posSum += Number(o.total || 0);
      else if (type === "city_ledger" && (pm.includes("city") || pm.includes("room_charge") || pm.includes("folio"))) posSum += Number(o.total || 0);
    });

    return foSum + posSum;
  };

  const cashToday = sumPayment("today", "cash");
  const cashMtd = sumPayment("mtd", "cash");
  const cashYtd = sumPayment("ytd", "cash");

  const edcBcaToday = sumPayment("today", "edc_bca");
  const edcBcaMtd = sumPayment("mtd", "edc_bca");
  const edcBcaYtd = sumPayment("ytd", "edc_bca");

  const qrisToday = sumPayment("today", "qris");
  const qrisMtd = sumPayment("mtd", "qris");
  const qrisYtd = sumPayment("ytd", "qris");

  const transferToday = sumPayment("today", "transfer");
  const transferMtd = sumPayment("mtd", "transfer");
  const transferYtd = sumPayment("ytd", "transfer");

  const cityLedgerToday = sumPayment("today", "city_ledger");
  const cityLedgerMtd = sumPayment("mtd", "city_ledger");
  const cityLedgerYtd = sumPayment("ytd", "city_ledger");

  const totalSettlementToday = cashToday + edcBcaToday + qrisToday + transferToday + cityLedgerToday;
  const totalSettlementMtd = cashMtd + edcBcaMtd + qrisMtd + transferMtd + cityLedgerMtd;
  const totalSettlementYtd = cashYtd + edcBcaYtd + qrisYtd + transferYtd + cityLedgerYtd;

  // ─────────────────────────────────────────────────────────────
  // 5. BUILD FORMATTED DSR ROWS
  // ─────────────────────────────────────────────────────────────
  const statisticsRows: DSRDataRow[] = [
    {
      id: "stat_avail",
      label: "Room Available",
      cells: calculateCell(roomsAvailableToday, roomsAvailableMtdAct, roomsAvailableMtdBud, roomsAvailableYtdAct, roomsAvailableYtdBud, false, roomsAvailableTodayBud),
    },
    {
      id: "stat_ooo",
      label: "Room Out of Order",
      cells: calculateCell(oooToday, oooMtd, oooBudMtd, oooYtd, oooBudYtd, false, oooBudToday),
    },
    {
      id: "stat_house_use",
      label: "Room House Use",
      cells: calculateCell(houseUseToday, houseUseMtd, houseUseBudMtd, houseUseYtd, houseUseBudYtd, false, houseUseBudToday),
    },
    {
      id: "stat_saleable",
      label: "Room Saleable",
      cells: calculateCell(roomsSaleableToday, roomsSaleableMtdAct, roomsSaleableMtdBud, roomsSaleableYtdAct, roomsSaleableYtdBud, false, roomsSaleableTodayBud),
    },
    {
      id: "stat_occupied",
      label: "Room Occupied",
      cells: calculateCell(roomsOccupiedToday, roomsOccupiedMtd, roomsOccupiedBudMtd, roomsOccupiedYtd, roomsOccupiedBudYtd, false, roomsOccupiedBudToday),
    },
    {
      id: "stat_compliment",
      label: "Room Compliment",
      cells: calculateCell(complimentToday, complimentMtd, complimentBudMtd, complimentYtd, complimentBudYtd, false, complimentBudToday),
    },
    {
      id: "stat_sold",
      label: "Room Sold",
      cells: calculateCell(roomsSoldToday, roomsSoldMtd, roomsSoldBudMtd, roomsSoldYtd, roomsSoldBudYtd, false, roomsSoldBudToday),
    },
    {
      id: "stat_occ_pct",
      label: "% Occupancy",
      isPercent: true,
      cells: calculateCell(occToday, occMtd, occBudMtd, occYtd, occBudYtd, true, occBudToday),
    },
    {
      id: "stat_sold_pct",
      label: "% Sold",
      isPercent: true,
      cells: calculateCell(soldPctToday, soldPctMtd, soldPctBudMtd, soldPctYtd, soldPctBudYtd, true, soldPctBudToday),
    },
    {
      id: "stat_pax",
      label: "Total Number of Pax",
      cells: calculateCell(paxToday, paxMtd, paxBudMtd, paxYtd, paxBudYtd, false, paxBudToday),
    },
    {
      id: "stat_arr",
      label: "Average Room Rate (ARR)",
      isCurrency: true,
      cells: calculateCell(arrToday, arrMtd, arrBudMtd, arrYtd, arrBudYtd, false, arrBudToday),
    },
    {
      id: "stat_revpar",
      label: "Rev Par",
      isCurrency: true,
      cells: calculateCell(revparToday, revparMtd, revparBudMtd, revparYtd, revparBudYtd, false, revparBudToday),
    },
    {
      id: "stat_trevpar",
      label: "TrevPAR",
      isCurrency: true,
      cells: calculateCell(trevparToday, trevparMtd, trevparBudMtd, trevparYtd, trevparBudYtd, false, trevparBudToday),
    },
    {
      id: "stat_trevpor",
      label: "TRevPOR",
      isCurrency: true,
      cells: calculateCell(trevporToday, trevporMtd, trevporBudMtd, trevporYtd, trevporBudYtd, false, trevporBudToday),
    },
  ];

  const roomRevenueRows: DSRDataRow[] = [
    {
      id: "room_lodging",
      label: "LODGING",
      isCurrency: true,
      cells: calculateCell(roomLodgingToday, roomLodgingMtd, roomLodgingBudMtd, roomLodgingYtd, roomLodgingBudYtd, false, roomLodgingBudToday),
    },
    {
      id: "room_other",
      label: "OTHER ROOM REVENUE",
      isCurrency: true,
      cells: calculateCell(roomOtherToday, roomOtherMtd, roomOtherBudMtd, roomOtherYtd, roomOtherBudYtd, false, roomOtherBudToday),
    },
    {
      id: "room_total",
      label: "Total Room Revenue",
      isTotal: true,
      isCurrency: true,
      cells: calculateCell(totalRoomToday, totalRoomMtd, totalRoomBudMtd, totalRoomYtd, totalRoomBudYtd, false, totalRoomBudToday),
    },
  ];

  const foodRevenueRows: DSRDataRow[] = [
    {
      id: "food_bkf",
      label: "Food - BREAKFAST",
      isCurrency: true,
      cells: calculateCell(foodBkf.todayAct, foodBkf.mtdAct, getFoodBkfBud(currentMonthBudget), foodBkf.ytdAct, getYtdBudget(getFoodBkfBud), false, getProRatedTodayBudget(getFoodBkfBud(currentMonthBudget))),
    },
    {
      id: "food_rest",
      label: "Food - RESTAURANT",
      isCurrency: true,
      cells: calculateCell(foodRest.todayAct, foodRest.mtdAct, getFoodRestBud(currentMonthBudget), foodRest.ytdAct, getYtdBudget(getFoodRestBud), false, getProRatedTodayBudget(getFoodRestBud(currentMonthBudget))),
    },
    {
      id: "food_rs",
      label: "Food - ROOM SERVICE",
      isCurrency: true,
      cells: calculateCell(foodRs.todayAct, foodRs.mtdAct, getFoodRsBud(currentMonthBudget), foodRs.ytdAct, getYtdBudget(getFoodRsBud), false, getProRatedTodayBudget(getFoodRsBud(currentMonthBudget))),
    },
    {
      id: "food_bq",
      label: "Food - BANQUET",
      isCurrency: true,
      cells: calculateCell(foodBq.todayAct, foodBq.mtdAct, getFoodBqBud(currentMonthBudget), foodBq.ytdAct, getYtdBudget(getFoodBqBud), false, getProRatedTodayBudget(getFoodBqBud(currentMonthBudget))),
    },
    {
      id: "food_total",
      label: "Total Food",
      isTotal: true,
      isCurrency: true,
      cells: calculateCell(totalFoodToday, totalFoodMtd, totalFoodBudMtd, totalFoodYtd, totalFoodBudYtd, false, totalFoodBudToday),
    },
  ];

  const beverageRevenueRows: DSRDataRow[] = [
    {
      id: "bev_rest",
      label: "Bev - RESTAURANT",
      isCurrency: true,
      cells: calculateCell(bevRest.todayAct, bevRest.mtdAct, getBevRestBud(currentMonthBudget), bevRest.ytdAct, getYtdBudget(getBevRestBud), false, getProRatedTodayBudget(getBevRestBud(currentMonthBudget))),
    },
    {
      id: "bev_rs",
      label: "Bev - ROOM SERVICE",
      isCurrency: true,
      cells: calculateCell(bevRs.todayAct, bevRs.mtdAct, getBevRsBud(currentMonthBudget), bevRs.ytdAct, getYtdBudget(getBevRsBud), false, getProRatedTodayBudget(getBevRsBud(currentMonthBudget))),
    },
    {
      id: "bev_bq",
      label: "Bev - BANQUET",
      isCurrency: true,
      cells: calculateCell(bevBq.todayAct, bevBq.mtdAct, getBevBqBud(currentMonthBudget), bevBq.ytdAct, getYtdBudget(getBevBqBud), false, getProRatedTodayBudget(getBevBqBud(currentMonthBudget))),
    },
    {
      id: "bev_minibar",
      label: "Bev - MINIBAR",
      isCurrency: true,
      cells: calculateCell(bevMinibar.todayAct, bevMinibar.mtdAct, getBevMinibarBud(currentMonthBudget), bevMinibar.ytdAct, getYtdBudget(getBevMinibarBud), false, getProRatedTodayBudget(getBevMinibarBud(currentMonthBudget))),
    },
    {
      id: "bev_total",
      label: "Total Beverage",
      isTotal: true,
      isCurrency: true,
      cells: calculateCell(totalBevToday, totalBevMtd, totalBevBudMtd, totalBevYtd, totalBevBudYtd, false, totalBevBudToday),
    },
  ];

  const otherFnbRevenueRows: DSRDataRow[] = [
    {
      id: "other_fnb_rest",
      label: "Other F&B - RESTAURANT",
      isCurrency: true,
      cells: calculateCell(otherRest.todayAct, otherRest.mtdAct, getOtherFnbRestBud(currentMonthBudget), otherRest.ytdAct, getYtdBudget(getOtherFnbRestBud), false, getProRatedTodayBudget(getOtherFnbRestBud(currentMonthBudget))),
    },
    {
      id: "other_fnb_bq",
      label: "Other F&B - BANQUET",
      isCurrency: true,
      cells: calculateCell(otherBq.todayAct, otherBq.mtdAct, getOtherFnbBqBud(currentMonthBudget), otherBq.ytdAct, getYtdBudget(getOtherFnbBqBud), false, getProRatedTodayBudget(getOtherFnbBqBud(currentMonthBudget))),
    },
    {
      id: "other_fnb_total",
      label: "Total Other F&B",
      isTotal: true,
      isCurrency: true,
      cells: calculateCell(totalOtherToday, totalOtherMtd, totalOtherBudMtd, totalOtherYtd, totalOtherBudYtd, false, totalOtherBudToday),
    },
  ];

  const minorOperatingRevenueRows: DSRDataRow[] = [
    {
      id: "minor_laundry",
      label: "Laundry",
      isCurrency: true,
      cells: calculateCell(laundryRev.todayAct, laundryRev.mtdAct, getLaundryBud(currentMonthBudget), laundryRev.ytdAct, getYtdBudget(getLaundryBud), false, getProRatedTodayBudget(getLaundryBud(currentMonthBudget))),
    },
    {
      id: "minor_spa",
      label: "Spa & Fitness",
      isCurrency: true,
      cells: calculateCell(spaRev.todayAct, spaRev.mtdAct, getSpaBud(currentMonthBudget), spaRev.ytdAct, getYtdBudget(getSpaBud), false, getProRatedTodayBudget(getSpaBud(currentMonthBudget))),
    },
    {
      id: "minor_minibar_snack",
      label: "Minibar Snacks",
      isCurrency: true,
      cells: calculateCell(minibarSnackRev.todayAct, minibarSnackRev.mtdAct, getMinibarSnackBud(currentMonthBudget), minibarSnackRev.ytdAct, getYtdBudget(getMinibarSnackBud), false, getProRatedTodayBudget(getMinibarSnackBud(currentMonthBudget))),
    },
    {
      id: "minor_water",
      label: "Mineral Water",
      isCurrency: true,
      cells: calculateCell(mineralWaterRev.todayAct, mineralWaterRev.mtdAct, getMineralWaterBud(currentMonthBudget), mineralWaterRev.ytdAct, getYtdBudget(getMineralWaterBud), false, getProRatedTodayBudget(getMineralWaterBud(currentMonthBudget))),
    },
    {
      id: "minor_tour",
      label: "Tour & Transportation",
      isCurrency: true,
      cells: calculateCell(tourRev.todayAct, tourRev.mtdAct, getTourBud(currentMonthBudget), tourRev.ytdAct, getYtdBudget(getTourBud), false, getProRatedTodayBudget(getTourBud(currentMonthBudget))),
    },
    {
      id: "minor_misc",
      label: "Misc / Other Charges",
      isCurrency: true,
      cells: calculateCell(miscRev.todayAct, miscRev.mtdAct, getMiscBud(currentMonthBudget), miscRev.ytdAct, getYtdBudget(getMiscBud), false, getProRatedTodayBudget(getMiscBud(currentMonthBudget))),
    },
    {
      id: "minor_total",
      label: "Total Minor Operating",
      isTotal: true,
      isCurrency: true,
      cells: calculateCell(totalMinorToday, totalMinorMtd, totalMinorBudMtd, totalMinorYtd, totalMinorBudYtd, false, totalMinorBudToday),
    },
  ];

  const amenitiesRevenueRows: DSRDataRow[] = [
    {
      id: "amenities_other",
      label: "Amenities & Other",
      isCurrency: true,
      cells: calculateCell(totalAmenitiesToday, totalAmenitiesMtd, totalAmenitiesBudMtd, totalAmenitiesYtd, totalAmenitiesBudYtd, false, totalAmenitiesBudToday),
    },
    {
      id: "amenities_total",
      label: "Total Amenities",
      isTotal: true,
      isCurrency: true,
      cells: calculateCell(totalAmenitiesToday, totalAmenitiesMtd, totalAmenitiesBudMtd, totalAmenitiesYtd, totalAmenitiesBudYtd, false, totalAmenitiesBudToday),
    },
  ];

  const summaryTotalsRows: DSRDataRow[] = [
    {
      id: "summary_net",
      label: "Total Net Revenue",
      isHighlight: true,
      isCurrency: true,
      cells: calculateCell(netRevenueToday, netRevenueMtd, netRevenueBudMtd, netRevenueYtd, netRevenueBudYtd, false, netRevenueBudToday),
    },
    {
      id: "summary_service",
      label: `Service Charge (${currentMonthBudget.serviceChargeRate || 10}%)`,
      isCurrency: true,
      cells: calculateCell(serviceToday, serviceMtd, serviceBudMtd, serviceYtd, serviceBudYtd, false, serviceBudToday),
    },
    {
      id: "summary_tax",
      label: `Government Tax (${currentMonthBudget.taxRate || 10}%)`,
      isCurrency: true,
      cells: calculateCell(taxToday, taxMtd, taxBudMtd, taxYtd, taxBudYtd, false, taxBudToday),
    },
    {
      id: "summary_gross",
      label: "Total Gross Revenue",
      isTotal: true,
      isHighlight: true,
      isCurrency: true,
      cells: calculateCell(grossRevenueToday, grossRevenueMtd, grossRevenueBudMtd, grossRevenueYtd, grossRevenueBudYtd, false, grossRevenueBudToday),
    },
  ];

  return {
    date,
    hotelCode,
    hotelName,
    openingGuestLedger: 0,
    statistics: statisticsRows,
    roomRevenue: roomRevenueRows,
    foodRevenue: foodRevenueRows,
    beverageRevenue: beverageRevenueRows,
    otherFnbRevenue: otherFnbRevenueRows,
    minorOperatingRevenue: minorOperatingRevenueRows,
    amenitiesRevenue: amenitiesRevenueRows,
    summaryTotals: summaryTotalsRows,
    payments: {
      cashFo: { id: "p_cash_fo", label: "Cash (FO)", today: cashToday, mtd: cashMtd, ytd: cashYtd },
      cashOutlet: { id: "p_cash_outlet", label: "Cash (Outlet POS)", today: 0, mtd: 0, ytd: 0 },
      cashRefundFo: { id: "p_cash_refund", label: "Cash Refund FO", today: 0, mtd: 0, ytd: 0 },
      totalCash: { id: "p_total_cash", label: "Total Cash", today: cashToday, mtd: cashMtd, ytd: cashYtd },
      edcBca: { id: "p_edc_bca", label: "EDC BCA / Mandiri", today: edcBcaToday, mtd: edcBcaMtd, ytd: edcBcaYtd },
      edcMandiri: { id: "p_edc_mandiri", label: "EDC Other", today: 0, mtd: 0, ytd: 0 },
      qris: { id: "p_qris", label: "QRIS Payment", today: qrisToday, mtd: qrisMtd, ytd: qrisYtd },
      transfer: { id: "p_transfer", label: "Bank Transfer", today: transferToday, mtd: transferMtd, ytd: transferYtd },
      cityLedger: { id: "p_city_ledger", label: "City Ledger (AR / OTA)", today: cityLedgerToday, mtd: cityLedgerMtd, ytd: cityLedgerYtd },
      totalSettlement: { id: "p_total_settlement", label: "Total Settlement", today: totalSettlementToday, mtd: totalSettlementMtd, ytd: totalSettlementYtd },
    },
  };
}
