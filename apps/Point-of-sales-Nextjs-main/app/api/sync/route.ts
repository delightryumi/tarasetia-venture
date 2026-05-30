import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

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

export async function POST(req: Request) {
  try {
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
      const hotelId = 'bumi-anyom-resort';
      const docId = `${hotelId}_${entryDate}`;

      // Build the standard revenue entry matching the dashboard's daily_revenue structure
      const transactionEntry = {
        bookingId: tx.id,
        guestName: `POS Order #${tx.id.slice(-6)}`,
        amount: Number(tx.totalAmount),
        paidAmount1: Number(tx.totalAmount),
        paidAmount2: 0,
        paymentStatus: 'Pay at Nexura',
        isSplitBill: false,
        source: 'Walk-in',
        status: 'CONFIRMED',
        type: 'other_income', // Mapped as other income for GOP and Other Revenue charts
        timestamp: tx.createdAt,
        channel: 'Walk-in',
        roomType: '-',
        paymentMethod: tx.paymentMethod || 'cash',
        revenueType: tx.revenueType || 'alacarte',
        posItems: tx.items.map(item => ({
          productId: item.productId,
          name: item.name || 'Produk',
          quantity: item.quantity,
          price: item.price || 0,
        }))
      };

      const docRef = doc(db, 'daily_revenue', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // If the day's record exists, append the new transaction to the entries array
        await updateDoc(docRef, {
          entries: arrayUnion(transactionEntry),
          date: entryDate
        });
      }

      // Append transaction to the active cashier shift in Firestore if one exists
      try {
        const shiftQuery = query(
          collection(db, 'cashier_shifts'),
          where('status', '==', 'open'),
          where('restoId', '==', tx.restoId || 'default-resto')
        );
        const shiftSnap = await getDocs(shiftQuery);
        if (!shiftSnap.empty) {
          const shiftDoc = shiftSnap.docs[0];
          const shiftRef = doc(db, 'cashier_shifts', shiftDoc.id);
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
          const productRef = doc(db, 'pos_products', item.productId);
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
