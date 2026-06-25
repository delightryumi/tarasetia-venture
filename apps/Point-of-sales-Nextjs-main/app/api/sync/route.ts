import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';

interface SyncItem {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
}

interface SyncTransaction {
  id: string; // UUID or TRS ID
  restoId: string;
  totalAmount: number;
  createdAt: string;
  revenueType?: string;
  paymentMethod?: string;
  items: SyncItem[];
}

export async function POST(req: NextRequest) {
  try {
    const hotelId = req.cookies.get('hotelCode')?.value || req.headers.get('x-hotel-code');
    if (!hotelId || hotelId === '87241') {
      return NextResponse.json(
        { error: 'Hotel Code is missing or invalid' },
        { status: 400 }
      );
    }
    const { transactions }: { transactions: SyncTransaction[] } = await req.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Format data transaksi tidak valid' },
        { status: 400 }
      );
    }

    const syncedIds: string[] = [];

    // Process each transaction and push it to Firestore
    for (const tx of transactions) {
      // Get the local date string in Asia/Jakarta timezone (WIB, +07:00)
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const entryDate = formatter.format(new Date(tx.createdAt));
      // Build the standard pos_orders structure
      const orderData = {
        transactionId: tx.id,
        items: tx.items.map(item => ({
          id: item.productId,
          name: item.name || 'Produk',
          price: item.price || 0,
          quantity: item.quantity,
          category: 'General',
          pnlTarget: '',
          image: '',
          isCompliment: false,
          complimentReason: null,
          originalPrice: item.price || 0,
          selectedAddons: [],
          note: ''
        })),
        subtotal: Number(tx.totalAmount),
        tax: 0,
        discount: 0,
        total: Number(tx.totalAmount),
        paymentMethod: tx.paymentMethod || 'cash',
        customerName: 'Guest',
        cashierName: 'Kasir',
        tableNumber: '-',
        notes: 'Synced from Offline',
        timestamp: new Date(tx.createdAt),
        revenueType: tx.revenueType || 'alacarte',
        shiftId: null,
        isCompliment: false,
        complimentValue: 0
      };

      // Write to pos_orders
      const posOrderRef = doc(getHotelCollection(db, 'pos_orders', hotelId), tx.id);
      await setDoc(posOrderRef, orderData);

      // Write to revenue_transactions
      const revTxRef = doc(getHotelCollection(db, 'revenue_transactions', hotelId), tx.id);
      await setDoc(revTxRef, {
        date: entryDate,
        category: tx.revenueType === 'banquet' ? 'Banquet Revenue' : 'Ala Carte Revenue',
        description: `POS Order #${tx.id.slice(-6)} - Synced`,
        amount: Number(tx.totalAmount),
        type: tx.paymentMethod === 'compliment' ? 'Compliment' : 'Nexura Collect',
        revenueType: tx.paymentMethod === 'compliment' ? 'compliment' : 'pos',
        complimentValue: 0,
        timestamp: new Date(tx.createdAt),
        transactionId: tx.id
      });

      // Append transaction to the active cashier shift in Firestore if one exists
      try {
        const shiftQuery = query(
          getHotelCollection(db, 'cashier_shifts', hotelId),
          where('status', '==', 'open'),
          where('restoId', '==', tx.restoId || 'default-resto')
        );
        const shiftSnap = await getDocs(shiftQuery);
        if (!shiftSnap.empty) {
          const shiftDoc = shiftSnap.docs[0];
          const shiftRef = doc(getHotelCollection(db, 'cashier_shifts', hotelId), shiftDoc.id);
          const currentShiftData = shiftDoc.data();
          const existingTx = (currentShiftData.transactions || []).find((t: any) => t.id === tx.id);
          if (!existingTx) {
            await updateDoc(shiftRef, {
              transactions: arrayUnion({
                id: tx.id,
                amount: Number(tx.totalAmount),
                method: tx.paymentMethod || 'cash',
                timestamp: tx.createdAt
              })
            });
          }
        }
      } catch (err) {
        console.error('Failed to append transaction to active shift in Firestore:', err);
      }

      // Decrement stock in Firestore pos_products
      for (const item of tx.items) {
        try {
          const productRef = doc(getHotelCollection(db, 'pos_products', hotelId), item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentStock = Number(productSnap.data().stock || 0);
            await updateDoc(productRef, {
              stock: Math.max(0, currentStock - item.quantity)
            });
          }
        } catch (err) {
          console.error(`Failed to update Firestore stock for product ${item.productId}:`, err);
        }
      }

      syncedIds.push(tx.id);
    }

    return NextResponse.json({
      success: true,
      syncedIds,
    });
  } catch (error: any) {
    console.error('Error during transaction sync to Firestore:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan sinkronisasi ke Firestore: ' + error.message },
      { status: 500 }
    );
  }
}
