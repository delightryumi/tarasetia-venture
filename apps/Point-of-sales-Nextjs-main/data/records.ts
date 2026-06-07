'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

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

    // Fetch tax settings
    const posSettingsRef = doc(db, 'settings', 'pos');
    const posSettingsSnap = await getDoc(posSettingsRef);
    let taxRate = 10;
    if (posSettingsSnap.exists()) {
      const sData = posSettingsSnap.data();
      taxRate = Number(sData.service || 0) + Number(sData.tax || 0) + Number(sData.lostBreakage || 0);
    }

    const snap = await getDocs(collection(db, 'pos_orders'));
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
        isComplete: true, // Assuming all pos_orders are confirmed
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
