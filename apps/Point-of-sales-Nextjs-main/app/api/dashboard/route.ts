import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getDocs, doc, getDoc } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';

export async function GET(req: NextRequest) {
  try {
    const hotelCode = req.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "87241";

    // 1. Fetch live product stock from Firestore
    const productsSnap = await getDocs(getHotelCollection(db, 'pos_products', hotelCode));
    let totalStockCount = 0;
    productsSnap.forEach(d => {
      totalStockCount += Number(d.data().stock || 0);
    });

    // 2. Fetch live POS sales entries from Firestore pos_orders for today
    const ordersSnap = await getDocs(getHotelCollection(db, 'pos_orders', hotelCode));
    let totalSalesAmount = 0;
    let totalQtyCount = 0;
    
    // Fetch tax rate to calculate gross income with tax correctly
    const posSettingsRef = doc(getHotelCollection(db, 'settings', hotelCode), 'pos');
    const posSettingsSnap = await getDoc(posSettingsRef);
    const taxRate = posSettingsSnap.exists() ? (Number(posSettingsSnap.data().tax) ?? 10) : 10;
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    ordersSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.status === 'CANCELLED' || data.status === 'VOID' || data.isDeleted === true) return;
      
      let orderDate: Date | null = null;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        orderDate = data.timestamp.toDate();
      } else if (data.timestamp) {
        orderDate = new Date(data.timestamp);
      }
      
      if (orderDate && orderDate >= todayStart && orderDate <= todayEnd) {
        let sellPriceTotal = 0;
        const items = data.items || [];
        
        if (items.length > 0) {
          items.forEach((item: any) => {
            const qty = Number(item.quantity || 0);
            const sellPrice = Number(item.price || 0) * qty;
            const tax = sellPrice * (taxRate / 100);
            sellPriceTotal += (sellPrice + tax);
            totalQtyCount += qty;
          });
        } else if (data.quantity !== undefined || data.price !== undefined) {
          const qty = Number(data.quantity || 1);
          const sellPrice = Number(data.price || data.subtotal || 0) * (data.price ? qty : 1);
          const tax = Number(data.tax || (sellPrice * (taxRate / 100)));
          sellPriceTotal += (sellPrice + tax);
          totalQtyCount += qty;
        }

        totalSalesAmount += sellPriceTotal;
      }
    });

    return NextResponse.json(
      {
        totalStock: { _sum: { stock: totalStockCount } },
        totalAmount: { _sum: { totalAmount: totalSalesAmount } },
        totalQuantity: { _sum: { quantity: totalQtyCount } }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching dashboard stats from Firestore:', error);
    
    // Safety fallback data to prevent dashboard interface crashes
    return NextResponse.json(
      {
        totalStock: { _sum: { stock: 0 } },
        totalAmount: { _sum: { totalAmount: 0 } },
        totalQuantity: { _sum: { quantity: 0 } }
      },
      { status: 200 }
    );
  }
}
