export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';

export async function GET(req: NextRequest) {
  try {
    const hotelCode = req.cookies.get('hotelCode')?.value || "1";
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      console.error('Missing start or end date');
      return NextResponse.json(
        { error: 'Missing start or end date' },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setUTCHours(23, 59, 59, 999);

    // Fetch tax, service, and lostBreakage rates
    const posSettingsRef = doc(getHotelCollection(db, 'settings', hotelCode), 'pos');
    const posSettingsSnap = await getDoc(posSettingsRef);
    let taxRate = 10;
    if (posSettingsSnap.exists()) {
      const sData = posSettingsSnap.data();
      const svc = Number(sData.service || 0);
      const tx = Number(sData.tax || 0);
      const lb = Number(sData.lostBreakage || 0);
      taxRate = svc + tx + lb;
    }

    // 1. Fetch product definitions for dynamic classification mapping
    const prodSnap = await getDocs(getHotelCollection(db, 'pos_products', hotelCode));
    const productMap: Record<string, { category: string; subcategory: string }> = {};
    prodSnap.forEach((d) => {
      const data = d.data();
      productMap[d.id] = {
        category: (data.category || '').trim().toUpperCase(),
        subcategory: (data.subcategory || '').trim().toUpperCase(),
      };
    });

    // 2. Fetch subcategories definitions for fallback matching
    const subcatSnap = await getDocs(getHotelCollection(db, 'pos_subcategories', hotelCode));
    const subcatToParentMap: Record<string, string> = {};
    subcatSnap.forEach((d) => {
      const data = d.data();
      if (data.name && data.parentCategory) {
        subcatToParentMap[data.name.trim().toUpperCase()] = data.parentCategory.trim().toUpperCase();
      }
    });

    // Helper function to resolve category and subcategory cleanly
    const resolveProductClass = (itemId: string, rawCat: string, rawSub: string) => {
      const pInfo = productMap[itemId];
      let cat = (rawCat || '').trim().toUpperCase();
      let sub = (rawSub || '').trim().toUpperCase();

      // If we have it in product definitions, use that as source of truth
      if (pInfo && pInfo.category) {
        return {
          category: pInfo.category,
          subcategory: pInfo.subcategory || '—',
        };
      }

      // If raw category is actually a registered subcategory, shift it
      if (subcatToParentMap[cat]) {
        sub = cat;
        cat = subcatToParentMap[cat];
      } else if (subcatToParentMap[sub]) {
        // If sub is a registered subcategory, ensure parent is correct
        cat = subcatToParentMap[sub];
      }

      return {
        category: cat || 'GENERAL',
        subcategory: sub || '—',
      };
    };

    const snap = await getDocs(getHotelCollection(db, 'pos_orders', hotelCode));

    const dailyCategoryQty: Record<string, Record<string, number>> = {};
    const allCategoriesSet = new Set<string>();

    const breakdownMap: Record<
      string,
      {
        totalQty: number;
        totalRev: number;
        items: Record<string, { qty: number; rev: number }>;
      }
    > = {};

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'CANCELLED' || data.status === 'VOID' || data.isDeleted === true) return;
      if (!data.timestamp) return;

      const docDate = typeof data.timestamp.toDate === 'function'
        ? data.timestamp.toDate()
        : new Date(data.timestamp);

      const docDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(docDate);

      if (docDateStr >= start && docDateStr <= end) {
        const dbSubtotal = Number(data.subtotal || 0);
        const dbTax = Number(data.tax || 0);
        const dbTotal = Number(data.total || 0);
        let dbDiscount = Number(data.discount || 0);
        
        const items = data.items || [];
        if (Array.isArray(items) && items.length > 0) {
          let calcSubtotal = 0;
          items.forEach((item: any) => {
            calcSubtotal += Number(item.price || 0) * Number(item.quantity || 0);
          });
          calcSubtotal = calcSubtotal || 1;

          if (!dbDiscount && dbTotal > 0 && dbSubtotal > 0) {
            dbDiscount = Math.max(0, calcSubtotal + dbTax - dbTotal);
          }

          items.forEach((item: any) => {
            const qty = Number(item.quantity || 0);
            const rawSellPrice = Number(item.price || 0) * qty;
            const itemDiscount = dbDiscount * (rawSellPrice / calcSubtotal);
            const sellPrice = Math.max(0, rawSellPrice - itemDiscount);
            
            const tax = sellPrice * (taxRate / 100);
            const rev = sellPrice + tax; // Always use gross revenue (sellPrice + tax)
            const itemName = item.name || 'Unnamed Product';

            // Resolve correctly
            const { category: cat, subcategory: sub } = resolveProductClass(
              item.id || '',
              item.category,
              item.subcategory
            );

            allCategoriesSet.add(cat);

            if (!dailyCategoryQty[docDateStr]) {
              dailyCategoryQty[docDateStr] = {};
            }
            dailyCategoryQty[docDateStr][cat] = (dailyCategoryQty[docDateStr][cat] || 0) + qty;

            if (!breakdownMap[cat]) {
              breakdownMap[cat] = { totalQty: 0, totalRev: 0, items: {} };
            }

            breakdownMap[cat].totalQty += qty;
            breakdownMap[cat].totalRev += rev;

            if (!breakdownMap[cat].items[itemName]) {
              breakdownMap[cat].items[itemName] = { qty: 0, rev: 0 };
            }
            breakdownMap[cat].items[itemName].qty += qty;
            breakdownMap[cat].items[itemName].rev += rev;
          });
        } else {
          if (!dbDiscount && dbTotal > 0 && dbSubtotal > 0) {
            dbDiscount = Math.max(0, dbSubtotal + dbTax - dbTotal);
          }
          const qty = Number(data.quantity || 1);
          const rawSellPrice = Number(data.price || data.subtotal || 0) * (data.price ? qty : 1);
          const sellPrice = Math.max(0, rawSellPrice - dbDiscount);
          const tax = Number(data.tax || (sellPrice * (taxRate / 100)));
          const price = sellPrice + tax; // Always use gross revenue (sellPrice + tax)
          
          const { category: cat, subcategory: sub } = resolveProductClass(
            data.id || '',
            data.category,
            '—'
          );

          allCategoriesSet.add(cat);

          if (!dailyCategoryQty[docDateStr]) {
            dailyCategoryQty[docDateStr] = {};
          }
          dailyCategoryQty[docDateStr][cat] = (dailyCategoryQty[docDateStr][cat] || 0) + qty;

          if (!breakdownMap[cat]) {
            breakdownMap[cat] = { totalQty: 0, totalRev: 0, items: {} };
          }
          breakdownMap[cat].totalQty += qty;
          breakdownMap[cat].totalRev += price;
        }
      }
    });

    const categoryList = Array.from(allCategoriesSet).sort();

    const combinedResult: any[] = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(currentDate);

      if (!combinedResult.find((r) => r.day === dateStr)) {
        const catQtys: Record<string, number> = {};
        let dayTotal = 0;
        
        categoryList.forEach((cat) => {
          const qty = dailyCategoryQty[dateStr]?.[cat] ?? 0;
          catQtys[cat] = qty;
          dayTotal += qty;
        });

        combinedResult.push({
          day: dateStr,
          totalQuantity: dayTotal,
          categories: catQtys,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const breakdownList: any[] = [];
    Object.keys(breakdownMap).forEach((cat) => {
      const catData = breakdownMap[cat];
      const itemsList = Object.keys(catData.items).map((name) => ({
        name,
        quantity: catData.items[name].qty,
        revenue: catData.items[name].rev,
      })).sort((a, b) => b.quantity - a.quantity);

      breakdownList.push({
        category: cat,
        subcategory: '—',
        totalQuantity: catData.totalQty,
        totalRevenue: catData.totalRev,
        items: itemsList,
      });
    });

    breakdownList.sort((a, b) => a.category.localeCompare(b.category));

    return NextResponse.json({
      combinedResult,
      categoryList,
      breakdown: breakdownList,
    }, { status: 200 });
  } catch (error) {
    console.error('Error occurred in productsale GET:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
