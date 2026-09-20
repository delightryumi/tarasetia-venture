import { PnlIncomeItem, PnlExpenseItem, DrillDownData, formatIDR } from "../../pnl-utils";
import { ExtendedTransaction } from "../types";
import { DrillDownContext } from "./index";
import { detectBreakfastAllocation } from "../../breakfast-utils";

/** Resolve the best available date from a transaction entry */
const resolveDate = (t: any): string =>
  t.date || t.effectiveDate || t.checkInDate || t.checkIn || '';

/** Resolve rate plan name or fallback cleanly */
const resolveRatePlan = (t: any): string => {
  const raw = t.ratePlanName || t.ratePlan || t.rateCode || '';
  if (raw && raw !== '-' && raw !== 'N/A') return raw;
  if (t.mealsIncluded || t.hasBreakfast || t.meals?.breakfast) return 'With Breakfast (BB)';
  const desc = (t.description || t.note || '').toLowerCase();
  if (desc.includes('breakfast') || desc.includes('sarapan') || desc.includes('bb')) return 'With Breakfast (BB)';
  return 'Room Only (RO)';
};

export function getRevenueDrillDown(cardId: string, ctx: DrillDownContext): any[] | null {
  let items: any[] = [];
  const { rawTransactions, customIncomes, expenses, posOrders, vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage } = ctx;

  const isAccommodation = (t: any) => {
    const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
    const isPelunasan = t.isHidden || t.isPelunasan || t.type === "pelunasan_ar" || t.type === "pelunasan_reversal" || t.guestName?.startsWith("Koreksi Tanggal Pelunasan") || t.guestName?.startsWith("Pelunasan Piutang");
    return !isPOS && !isPelunasan && (t.type === "accommodation" || (!t.type && t.guestName));
  };
  const isFOOtherIncome = (t: any) => {
    const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
    const isPelunasan = t.isHidden || t.isPelunasan || t.type === "pelunasan_ar" || t.type === "pelunasan_reversal" || t.guestName?.startsWith("Koreksi Tanggal Pelunasan") || t.guestName?.startsWith("Pelunasan Piutang");
    return !isPOS && !isPelunasan && !isAccommodation(t);
  };
  const isOta = (t: any) => {
    const ch = (t.channel || "").toLowerCase().trim();
    return ch !== "" && !["direct", "walk-in", "internal", "-", "direct / walk-in", "offline"].includes(ch);
  };

  switch (cardId) {
    case "Revenue Cash in Hotel":
    case "Revenue Hotel Collect":
      {
        items = rawTransactions
          .filter(isAccommodation)
          .filter(t => {
            if (isOta(t)) return false;
            const pm = (t.paymentMethod || "").toLowerCase().trim();
            const isCashOnly = pm === "cash" || pm === "tunai" || (Number(t.paidCash || 0) > 0 && !pm.includes("qris") && !pm.includes("transfer") && !pm.includes("bank") && !pm.includes("edc") && !pm.includes("ledger"));
            return isCashOnly;
          })
          .map((t, idx) => {
            const alloc = detectBreakfastAllocation(t, { 
              ratePlans: ctx.ratePlans || [], 
              hotelBreakfastRate: ctx.hotelBreakfastRate 
            });
            const hasBf = alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0;
            const netAmount = hasBf ? alloc.netRoomAmount : Number(t.amount || 0);
            const planName = resolveRatePlan(t);

            return {
              id: (t as any).id || (t.bookingId ? `${t.bookingId}_${t.date || ''}_${idx}` : Math.random().toString()),
              type: 'income',
              source: t.channel || 'Cash',
              description: `${t.guestName || 'Guest'} (${t.roomType || 'Room'}) · [Cash in Hotel]`,
              department: 'Rooms',
              docType: 'Cash',
              ratePlan: planName,
              breakfastAmount: hasBf ? alloc.breakfastAmount : undefined,
              discount: hasBf ? alloc.breakfastAmount : ((t as any).discount || 0),
              amount: netAmount,
              date: resolveDate(t)
            };
          });
      }
      break;
    case "Room Revenue Transfer/EDC/QRIS":
    case "Revenue Nexura Collect":
    case "Revenue Online/Transfer Collect":
      {
        items = rawTransactions
          .filter(isAccommodation)
          .filter(t => {
            if (isOta(t)) return false;
            const pm = (t.paymentMethod || "").toLowerCase().trim();
            const isCashOnly = pm === "cash" || pm === "tunai" || (Number(t.paidCash || 0) > 0 && !pm.includes("qris") && !pm.includes("transfer") && !pm.includes("bank") && !pm.includes("edc") && !pm.includes("ledger"));
            return !isCashOnly;
          })
          .map((t, idx) => {
            const alloc = detectBreakfastAllocation(t, { 
              ratePlans: ctx.ratePlans || [], 
              hotelBreakfastRate: ctx.hotelBreakfastRate 
            });
            const hasBf = alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0;
            const netAmount = hasBf ? alloc.netRoomAmount : Number(t.amount || 0);
            const planName = resolveRatePlan(t);

            return {
              id: (t as any).id || (t.bookingId ? `${t.bookingId}_${t.date || ''}_${idx}` : Math.random().toString()),
              type: 'income',
              source: t.paymentMethod || t.channel || 'Transfer / EDC / QRIS',
              description: `${t.guestName || 'Guest'} (${t.roomType || 'Room'}) · [${t.paymentMethod || 'Direct Cashless'}]`,
              department: 'Rooms',
              docType: t.paymentMethod || 'Transfer/EDC/QRIS',
              ratePlan: planName,
              breakfastAmount: hasBf ? alloc.breakfastAmount : undefined,
              discount: hasBf ? alloc.breakfastAmount : ((t as any).discount || 0),
              amount: netAmount,
              date: resolveDate(t)
            };
          });
      }
      break;
    case "OTA Revenue":
      {
        items = rawTransactions
          .filter(isAccommodation)
          .filter(isOta)
          .map((t, idx) => {
            const alloc = detectBreakfastAllocation(t, { 
              ratePlans: ctx.ratePlans || [], 
              hotelBreakfastRate: ctx.hotelBreakfastRate 
            });
            const hasBf = alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0;
            const netAmount = hasBf ? alloc.netRoomAmount : Number(t.amount || 0);
            const planName = resolveRatePlan(t);

            return {
              id: (t as any).id || (t.bookingId ? `${t.bookingId}_${t.date || ''}_${idx}` : Math.random().toString()),
              type: 'income',
              source: t.channel || 'OTA Collect',
              description: `${t.guestName || 'Guest'} (${t.roomType || 'Room'}) · Channel: ${t.channel || 'OTA'}`,
              department: 'Rooms',
              docType: t.channel || 'OTA Collect',
              ratePlan: planName,
              breakfastAmount: hasBf ? alloc.breakfastAmount : undefined,
              discount: hasBf ? alloc.breakfastAmount : ((t as any).discount || 0),
              amount: netAmount,
              date: resolveDate(t)
            };
          });
      }
      break;
    case "Room Compliment":
      {
        items = rawTransactions
          .filter(t => t.isCompliment)
          .map((t, idx) => ({
            id: (t as any).id || (t.bookingId ? `${t.bookingId}_${t.date || ''}_${idx}` : Math.random().toString()),
            type: 'income',
            source: t.channel || 'Ledger',
            description: `${t.guestName || 'Guest'} - ${t.complimentReason || 'Compliment'}`,
            department: 'Rooms',
            docType: 'Room Compliment',
            amount: Number(t.complimentValue) || 0,
            date: t.effectiveDate || resolveDate(t)
          }));
      }
      break;
    case "Total Room Revenue":
    case "Revenue Room":
    case "Room Revenue":
      {
        items = rawTransactions
          .filter(isAccommodation)
          .map((t, idx) => {
            const alloc = detectBreakfastAllocation(t, { 
              ratePlans: ctx.ratePlans || [], 
              hotelBreakfastRate: ctx.hotelBreakfastRate 
            });
            const hasBf = alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0;
            const netAmount = hasBf ? alloc.netRoomAmount : Number(t.amount || 0);
            const planName = resolveRatePlan(t);

            return {
              id: (t as any).id || (t.bookingId ? `${t.bookingId}_${t.date || ''}_${idx}` : Math.random().toString()),
              type: 'income',
              source: t.channel || 'Ledger',
              description: `${t.guestName || 'Guest'} (${t.roomType || 'Room'})${hasBf ? ` [Room Rate: ${formatIDR(t.amount)}, Excl. Breakfast: ${formatIDR(alloc.breakfastAmount)}]` : ''}`,
              department: 'Rooms',
              docType: 'Room Booking',
              ratePlan: planName,
              breakfastAmount: hasBf ? alloc.breakfastAmount : undefined,
              discount: hasBf ? alloc.breakfastAmount : ((t as any).discount || 0),
              amount: netAmount,
              date: resolveDate(t)
            };
          });
      }
      break;
    case "Other Revenue":
      {
        const ledgerOther = rawTransactions
          .filter(isFOOtherIncome)
          .map((t, idx) => ({
            id: (t as any).id || (t.bookingId ? `${t.bookingId}_${t.date || ''}_${idx}` : Math.random().toString()),
            type: 'income',
            source: 'Ledger (Other)',
            description: t.guestName || 'Other Income Ledger',
            department: 'N/A',
            docType: 'Ledger Other',
            amount: t.amount,
            date: resolveDate(t)
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
        const posOther = posOrders
          .filter(o => o.category !== 'food' && o.category !== 'beverage' && o.category !== 'banquet' && !o.isCancelled)
          .map(o => ({
            id: o.id || Math.random().toString(),
            type: 'income',
            source: 'POS (Other)',
            description: o.description || o.name || 'POS Other Revenue',
            department: 'Outlet',
            docType: 'POS',
            amount: o.amount,
            date: o.date || 'N/A'
          }));
        items = [...ledgerOther, ...customInc, ...posOther];
      }
      break;
    case "Total Gross Revenue":
      {
        const isFnbOrBanquetCustomIncome = (i: PnlIncomeItem) => {
          const cat = (i.category || "").toLowerCase();
          const name = (i.name || "").toLowerCase();
          const isFnb = (cat.includes("food") || cat.includes("beverage")) && !name.includes("banquet") && !cat.includes("banquet");
          const isBanquet = name.includes("banquet") || cat.includes("banquet");
          return isFnb || isBanquet;
        };

        const roomRev: any[] = [];
        const packageBreakfastItems: any[] = [];
        rawTransactions.filter(isAccommodation).forEach((t, idx) => {
          const alloc = detectBreakfastAllocation(t, { ratePlans: ctx.ratePlans || [], hotelBreakfastRate: ctx.hotelBreakfastRate });
          const hasBf = alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0;
          roomRev.push({
            id: (t as any).id || (t.bookingId ? `${t.bookingId}_${t.date || ''}_${idx}` : Math.random().toString()),
            type: 'income',
            source: t.channel || 'Ledger',
            description: `${t.guestName || 'Guest'} (${t.roomType || 'Room'})${hasBf ? ` [Excl. BF: ${formatIDR(alloc.breakfastAmount)}]` : ''}`,
            department: 'Rooms',
            docType: 'Room Booking',
            discount: hasBf ? alloc.breakfastAmount : ((t as any).discount || 0),
            amount: hasBf ? alloc.netRoomAmount : Number(t.amount || 0),
            date: resolveDate(t)
          });

          if (hasBf) {
            packageBreakfastItems.push({
              id: `pkg-bf-${(t as any).id || t.bookingId}_${t.date || ''}_${idx}`,
              type: 'income',
              source: 'Room Package Breakfast',
              description: `Breakfast Package: ${t.guestName || 'Guest'} (${t.roomType || 'Room'})`,
              amount: alloc.breakfastAmount,
              date: resolveDate(t),
              department: 'Food & Beverage',
              docType: 'Package Breakfast'
            });
          }
        });

        const isFnbRevenue = (t: any) => {
          if (isAccommodation(t)) return false;
          const dept = (t.department || "").toLowerCase();
          const cat = (t.category || "").toLowerCase();
          const subCat = (t.subCat || t.subCategory || "").toLowerCase();
          const desc = (t.description || t.note || "").toLowerCase();
          return dept.includes("f&b") || cat.includes("f&b") || subCat === "breakfast" || desc.includes("breakfast") || desc.includes("sarapan");
        };

        const isFnbBeverage = (t: any) => {
          const subCat = (t.subCat || t.subCategory || "").toLowerCase();
          const desc = (t.description || t.note || "").toLowerCase();
          return subCat.includes("bev") || desc.includes("beverage") || desc.includes("drink") || desc.includes("minum");
        };

        const ledgerFood = rawTransactions
          .filter(t => !isAccommodation(t) && isFnbRevenue(t) && !isFnbBeverage(t))
          .map((t, idx) => ({
            id: (t as any).id || (t.bookingId ? `${t.bookingId}_${t.date || ''}_${idx}` : Math.random().toString()),
            type: 'income',
            source: t.channel || 'Ledger (F&B)',
            description: t.guestName || (t as any).description || 'Food Sales (Front Office)',
            amount: t.amount,
            date: resolveDate(t),
            department: 'Food & Beverage',
            docType: 'Ledger F&B'
          }));

        const ledgerBev = rawTransactions
          .filter(t => !isAccommodation(t) && isFnbRevenue(t) && isFnbBeverage(t))
          .map((t, idx) => ({
            id: (t as any).id || (t.bookingId ? `${t.bookingId}_${t.date || ''}_${idx}` : Math.random().toString()),
            type: 'income',
            source: t.channel || 'Ledger (F&B)',
            description: t.guestName || (t as any).description || 'Beverage Sales (Front Office)',
            amount: t.amount,
            date: resolveDate(t),
            department: 'Food & Beverage',
            docType: 'Ledger F&B'
          }));

        const fnbAlacarteRev = [
          ...posOrders.filter(o => (o.category === 'food' || o.category === 'beverage') && !o.isCancelled),
          ...ledgerFood,
          ...ledgerBev,
          ...packageBreakfastItems,
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
          ...posOrders.filter(o => o.category === 'banquet' && !o.isCancelled),
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
            .filter(t => isFOOtherIncome(t) && !isFnbRevenue(t))
            .map(t => ({
              id: t.bookingId || Math.random().toString(),
              type: 'income',
              source: 'Ledger (Other)',
              description: t.guestName || 'Other Income Ledger',
              department: 'N/A',
              docType: 'Ledger Other',
              amount: t.amount,
              date: resolveDate(t)
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
            })),
          ...posOrders
            .filter(o => o.category !== 'food' && o.category !== 'beverage' && o.category !== 'banquet' && !o.isCancelled)
            .map(o => ({
              id: o.id || Math.random().toString(),
              type: 'income',
              source: 'POS (Other)',
              description: o.description || o.name || 'POS Other Revenue',
              department: 'Outlet',
              docType: 'POS',
              amount: o.amount,
              date: o.date || 'N/A'
            }))
        ];

        const roomCompliments = rawTransactions
          .filter(t => t.isCompliment && (Number(t.complimentValue) || 0) > 0)
          .map((t, idx) => ({
            id: `comp-room-${(t as any).id || t.bookingId}_${idx}`,
            type: 'income',
            source: 'Compliment',
            description: `Room Compliment: ${t.guestName || 'Guest'} (${t.complimentReason || 'Compliment'})`,
            department: 'Rooms',
            docType: 'Room Compliment',
            amount: Number(t.complimentValue) || 0,
            date: resolveDate(t)
          }));

        const posCompliments = posOrders
          .filter(o => o.isCompliment && (Number(o.amount) || 0) > 0)
          .map(o => ({
            id: `comp-pos-${o.id}`,
            type: 'income',
            source: 'Compliment',
            description: `POS Compliment: ${o.description || o.name || 'Compliment Order'}`,
            department: 'Outlet',
            docType: 'POS Compliment',
            amount: Number(o.amount) || 0,
            date: o.date || 'N/A'
          }));

        items = [...roomRev, ...fnbAlacarteRev, ...banquetRev, ...otherRev, ...roomCompliments, ...posCompliments];
      }
      break;
    default:
      return null;
  }
  return items;
}
