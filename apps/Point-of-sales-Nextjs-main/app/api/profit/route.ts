export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Missing start or end date' },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setUTCHours(23, 59, 59, 999);

    // Fetch tax, service, and lostBreakage rates
    const posSettingsRef = doc(db, 'settings', 'pos');
    const posSettingsSnap = await getDoc(posSettingsRef);
    let taxRate = 10;
    let serviceRate = 0;
    let taxRateIndividual = 10;
    let lostBreakageRate = 0;
    if (posSettingsSnap.exists()) {
      const sData = posSettingsSnap.data();
      serviceRate = Number(sData.service || 0);
      taxRateIndividual = Number(sData.tax || 0);
      lostBreakageRate = Number(sData.lostBreakage || 0);
      taxRate = serviceRate + taxRateIndividual + lostBreakageRate;
    }

    // 1. Fetch products definitions for mapping
    const prodSnap = await getDocs(collection(db, 'pos_products'));
    const productMap: Record<string, { buyPrice: number; sellPrice: number; category: string; subcategory: string }> = {};
    prodSnap.forEach((d) => {
      const data = d.data();
      productMap[d.id] = {
        buyPrice: Number(data.buyPrice || 0),
        sellPrice: Number(data.price || 0),
        category: (data.category || '').trim().toUpperCase(),
        subcategory: (data.subcategory || '').trim().toUpperCase(),
      };
    });

    // 2. Fetch subcategories definitions for fallback matching
    const subcatSnap = await getDocs(collection(db, 'pos_subcategories'));
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

      if (pInfo && pInfo.category) {
        return {
          category: pInfo.category,
          subcategory: pInfo.subcategory || '—',
        };
      }

      if (subcatToParentMap[cat]) {
        sub = cat;
        cat = subcatToParentMap[cat];
      } else if (subcatToParentMap[sub]) {
        cat = subcatToParentMap[sub];
      }

      return {
        category: cat || 'GENERAL',
        subcategory: sub || '—',
      };
    };

    const alacarteGroupedData: any[] = [];
    const banquetGroupedData: any[] = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      alacarteGroupedData.push({ date: dateStr, netIncome: 0, taxIncome: 0, grossIncomeWithTax: 0 });
      banquetGroupedData.push({ date: dateStr, netIncome: 0, taxIncome: 0, grossIncomeWithTax: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let totalAlacarte = 0;
    let totalBanquet = 0;
    const syncedTransactionIds: string[] = [];

    const categoryIncomeMap: Record<string, Record<string, { gross: number; tax: number; net: number }>> = {};

    const addToCategoryMap = (cat: string, sub: string, gross: number, tax: number, net: number) => {
      const c = cat.trim().toUpperCase() || 'GENERAL';
      const s = sub.trim().toUpperCase() || '—';
      if (!categoryIncomeMap[c]) categoryIncomeMap[c] = {};
      if (!categoryIncomeMap[c][s]) {
        categoryIncomeMap[c][s] = { gross: 0, tax: 0, net: 0 };
      }
      categoryIncomeMap[c][s].gross += gross;
      categoryIncomeMap[c][s].tax += tax;
      categoryIncomeMap[c][s].net += net;
    };

    // 1. Process pos_orders only
    const posOrdersSnap = await getDocs(collection(db, 'pos_orders'));
    posOrdersSnap.forEach((docSnap) => {
      const data = docSnap.data();
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
        let costPriceTotal = 0;
        let sellPriceTotal = 0;
        let taxProfit = 0;

        const items = data.items || [];
        if (items.length > 0) {
          items.forEach((item: any) => {
            const qty = Number(item.quantity || 0);
            const sellPrice = Number(item.price || 0) * qty;
            const productInfo = productMap[item.id];
            
            const buyPrice = (productInfo ? productInfo.buyPrice : Number(item.price || 0)) * qty;
            const tax = sellPrice * (taxRate / 100);
            const sellPriceWithTax = sellPrice + tax;
            const profit = sellPrice - buyPrice;

            costPriceTotal += profit;
            sellPriceTotal += sellPriceWithTax;
            taxProfit += tax;

            const { category: cat, subcategory: sub } = resolveProductClass(
              item.id || '',
              item.category,
              item.subcategory
            );
            addToCategoryMap(cat, sub, sellPriceWithTax, tax, profit);
          });
        } else if (data.quantity !== undefined || data.price !== undefined) {
          const qty = Number(data.quantity || 1);
          const sellPrice = Number(data.price || data.subtotal || 0) * (data.price ? qty : 1);
          const productInfo = productMap[data.id || ''];
          
          const buyPrice = (productInfo ? productInfo.buyPrice : Number(data.price || data.subtotal || 0)) * (data.price ? qty : 1);
          const tax = Number(data.tax || (sellPrice * (taxRate / 100)));
          const sellPriceWithTax = sellPrice + tax;
          const profit = sellPrice - buyPrice;

          costPriceTotal += profit;
          sellPriceTotal += sellPriceWithTax;
          taxProfit += tax;

          const { category: cat, subcategory: sub } = resolveProductClass(
            data.id || '',
            data.category,
            '—'
          );
          addToCategoryMap(cat, sub, sellPriceWithTax, tax, profit);
        }

        const isBanquet = data.revenueType === 'banquet' || String(data.category || '').toLowerCase().includes('banquet');
        if (isBanquet) {
          totalBanquet += sellPriceTotal;
        } else {
          totalAlacarte += sellPriceTotal;
        }

        syncedTransactionIds.push(data.transactionId || docSnap.id);

        const targetGroup = isBanquet ? banquetGroupedData : alacarteGroupedData;
        const dateGroup = targetGroup.find((g) => g.date === docDateStr);
        if (dateGroup) {
          dateGroup.netIncome += costPriceTotal;
          dateGroup.taxIncome += taxProfit;
          dateGroup.grossIncomeWithTax += sellPriceTotal;
        }
      }
    });

    const groupedData = alacarteGroupedData.map((alacarte, index) => {
      const banquet = banquetGroupedData[index];
      return {
        date: alacarte.date,
        netIncome: alacarte.netIncome + banquet.netIncome,
        taxIncome: alacarte.taxIncome + banquet.taxIncome,
        grossIncomeWithTax: alacarte.grossIncomeWithTax + banquet.grossIncomeWithTax,
      };
    });

    const categoryBreakdown: any[] = [];
    Object.keys(categoryIncomeMap).forEach((cat) => {
      Object.keys(categoryIncomeMap[cat]).forEach((sub) => {
        const item = categoryIncomeMap[cat][sub];
        categoryBreakdown.push({
          category: cat,
          subcategory: sub,
          grossIncome: item.gross,
          taxIncome: item.tax,
          netProfit: item.net,
        });
      });
    });

    categoryBreakdown.sort((a, b) => {
      const catCompare = a.category.localeCompare(b.category);
      if (catCompare !== 0) return catCompare;
      return a.subcategory.localeCompare(b.subcategory);
    });

    return NextResponse.json({ 
      groupedData,
      alacarteGroupedData,
      banquetGroupedData,
      categoryBreakdown,
      summary: {
        totalAlacarte,
        totalBanquet
      },
      syncedTransactionIds,
      taxRate,
      serviceRate,
      taxRateIndividual,
      lostBreakageRate
    }, { status: 200 });
  } catch (error) {
    console.error('Error occurred in profit calculation GET:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
