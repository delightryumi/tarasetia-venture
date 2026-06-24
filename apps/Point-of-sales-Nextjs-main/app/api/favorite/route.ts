export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { getHotelCollection } from '@/lib/firestoreHelper';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const hotelCode = cookieStore.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "87241";

    const revSnap = await getDocs(getHotelCollection(db, 'daily_revenue', hotelCode));
    const salesCount: Record<string, number> = {};

    // Process legacy data
    revSnap.forEach((docSnap) => {
      const entries = docSnap.data().entries || [];
      entries.forEach((e: any) => {
        const isBanquet = e.revenueType === 'banquet' || String(e.category || '').toLowerCase().includes('banquet');
        if (!isBanquet && (e.type === 'other_income' || (e.bookingId && e.bookingId.startsWith('TRS-')))) {
          const items = e.posItems || [];
          items.forEach((item: any) => {
            const id = item.productId || item.id;
            if (id) {
              salesCount[id] = (salesCount[id] || 0) + Number(item.quantity || 0);
            }
          });
        }
      });
    });

    // Process new data from pos_orders
    const posOrdersSnap = await getDocs(getHotelCollection(db, 'pos_orders', hotelCode));
    posOrdersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'CANCELLED' || data.status === 'VOID' || data.isDeleted === true) return;
      const isBanquet = data.revenueType === 'banquet' || String(data.category || '').toLowerCase().includes('banquet');
      
      if (!isBanquet) {
        const items = data.items || [];
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((item: any) => {
            const qty = Number(item.quantity || 0);
            const id = item.id || item.productId;
            if (id && qty > 0) {
              salesCount[id] = (salesCount[id] || 0) + qty;
            }
          });
        } else if (data.quantity !== undefined && data.id) {
          const qty = Number(data.quantity || 0);
          if (qty > 0) {
            salesCount[data.id] = (salesCount[data.id] || 0) + qty;
          }
        }
      }
    });

    // Sort by count desc and take top 10
    const topProductIds = Object.entries(salesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    // Fetch details from pos_products
    const productDetails = await Promise.all(
      topProductIds.map(async (productId) => {
        const productRef = doc(getHotelCollection(db, 'pos_products', hotelCode), productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const data = productSnap.data();
          return {
            id: productId,
            productId: productId,
            sellprice: Number(data.price) || 0,
            productstock: {
              id: productId,
              name: data.name || 'Unnamed Product',
              cat: data.category || 'General',
              stock: Number(data.stock) || 0,
              price: Number(data.buyPrice || data.price || 0),
              imageProduct: data.image || null,
            },
            _sum: {
              quantity: salesCount[productId],
            },
          };
        }
        return null;
      })
    );

    const filteredDetails = productDetails.filter(Boolean);

    return NextResponse.json({ topProducts: filteredDetails }, { status: 200 });
  } catch (error: any) {
    console.error('Error occurred in favorite API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
