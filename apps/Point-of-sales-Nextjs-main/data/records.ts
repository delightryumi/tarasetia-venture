'use server';

import { db } from '@/lib/firebase';
import { getDocs, doc, getDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { getHotelCollection } from '@/lib/firestoreHelper';

export const fetchRecords = async ({
  take = 5,
  skip = 0,
  query: searchQuery,
  startDate,
  endDate,
}: {
  query?: string;
  take: number;
  skip: number;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    // Default to today if no date is provided
    if (!startDate && !endDate) {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
      startDate = today;
      endDate = today;
    }

    const cookieStore = await cookies();
    const hotelCode = cookieStore.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "1";
    console.log("[fetchRecords] hotelCode from cookie:", hotelCode);

    // Fetch tax settings
    const posSettingsRef = doc(getHotelCollection(db, 'settings', hotelCode), 'pos');
    const posSettingsSnap = await getDoc(posSettingsRef);
    let taxRate = 10;
    if (posSettingsSnap.exists()) {
      const sData = posSettingsSnap.data();
      taxRate = Number(sData.service || 0) + Number(sData.tax || 0) + Number(sData.lostBreakage || 0);
    }

    const snap = await getDocs(getHotelCollection(db, 'pos_orders', hotelCode));
    let transactions: any[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const items = data.items || [];
      const totalQuantity = items.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0
      );

      let calcSubtotal = 0;
      items.forEach((item: any) => {
        calcSubtotal += Number(item.price || 0) * Number(item.quantity || 0);
      });
      calcSubtotal = calcSubtotal > 0 ? calcSubtotal : Number(data.subtotal || 0);

      const dbTotal = Number(data.total || 0);
      const dbTax = Number(data.tax || 0);
      let dbDiscount = Number(data.discount || 0);
      if (!dbDiscount && dbTotal > 0 && calcSubtotal > 0) {
        dbDiscount = Math.max(0, calcSubtotal + dbTax - dbTotal);
      }

      const nettTotal = Math.max(0, calcSubtotal - dbDiscount);
      const computedTax = nettTotal * (taxRate / 100);
      const calculatedTotal = nettTotal + computedTax;

      let createdAt = new Date().toISOString();
      if (data.timestamp) {
        createdAt = typeof data.timestamp.toDate === 'function' 
          ? data.timestamp.toDate().toISOString() 
          : new Date(data.timestamp).toISOString();
      }

      transactions.push({
        id: data.transactionId || docSnap.id,
        totalAmount: calculatedTotal,
        discount: dbDiscount,
        createdAt,
        isComplete: data.status !== 'CANCELLED',
        status: data.status || 'SUCCESS',
        cancelReason: data.cancelReason || '',
        products: items.map((item: any) => ({
          id: item.id,
          productId: item.id,
          quantity: Number(item.quantity || 0),
        })),
        totalQuantity,
        paymentMethod: data.paymentMethod || 'cash',
        revenueType: data.revenueType || 'alacarte',
        customerName: data.customerName || '',
        tableNumber: data.tableNumber || '',
        cashierName: data.cashierName || '',
        isCompliment: !!data.isCompliment,
        complimentValue: Number(data.complimentValue || 0),
      });
    });

    // Sort by timestamp desc
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter by start date
    if (startDate) {
      transactions = transactions.filter((tx) => {
        try {
          const txDateLocalStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(new Date(tx.createdAt));
          return txDateLocalStr >= startDate!;
        } catch (e) {
          return true;
        }
      });
    }

    // Filter by end date
    if (endDate) {
      transactions = transactions.filter((tx) => {
        try {
          const txDateLocalStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(new Date(tx.createdAt));
          return txDateLocalStr <= endDate!;
        } catch (e) {
          return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      transactions = transactions.filter((tx) =>
        tx.id.toLowerCase().includes(lowerQuery)
      );
    }

    const total = transactions.length;
    console.log(`[fetchRecords] Found ${total} transactions after filtering for hotelCode ${hotelCode}`);
    const paginated = transactions.slice(skip, skip + take);

    return {
      data: paginated,
      metadata: {
        hasNextPage: skip + take < total,
        totalPages: Math.ceil(total / take),
      },
    };
  } catch (error: any) {
    console.error('Failed to fetch records from Firestore:', error);
    return {
      data: [],
      metadata: {
        hasNextPage: false,
        totalPages: 0,
      },
    };
  }
};
