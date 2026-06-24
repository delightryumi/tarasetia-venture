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
    const hotelId = req.cookies.get('hotelCode')?.value || '87241';
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

      const docRef = doc(getHotelCollection(db, 'daily_revenue', hotelId), docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // If the day's record exists, append the new transaction to the entries array
        await updateDoc(docRef, {
          entries: arrayUnion(transactionEntry),
          date: entryDate
        });
      } else {
        // If the day's record does not exist, create it with the transaction entry
        await setDoc(docRef, {
          entries: [transactionEntry],
          date: entryDate,
          hotelId: hotelId
        });
      }

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
