import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { query, getDocs, doc, updateDoc, orderBy, limit, deleteDoc, where, getDoc } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';

// GET request handler to fetch onSaleProducts by transactionId from Firestore daily_revenue
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const hotelCode = req.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "87241";

    const q = query(
      getHotelCollection(db, 'pos_orders', hotelCode),
      where('transactionId', '==', id),
      limit(1)
    );
    const snap = await getDocs(q);

    let docData;
    if (snap.empty) {
      // Fallback: try fetching by document ID directly (for older transactions)
      const docRef = doc(getHotelCollection(db, 'pos_orders', hotelCode), id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return NextResponse.json(
          { message: 'Transaction not found in pos_orders' },
          { status: 404 }
        );
      }
      docData = docSnap.data();
    } else {
      docData = snap.docs[0].data();
    }

    const items = (docData.items || []).map((item: any) => ({
      id: item.id,
      transactionId: id,
      productId: item.id,
      quantity: item.quantity,
      saledate: docData.timestamp 
        ? (typeof docData.timestamp.toDate === 'function' ? docData.timestamp.toDate().toISOString() : new Date(docData.timestamp).toISOString())
        : new Date().toISOString(),
      product: {
        sellprice: item.price,
        productstock: {
          name: item.name || 'Produk',
          cat: item.category || 'General',
          subcategory: item.subcategory || '',
        },
      },
      discount: docData.discount || 0,
    }));

    return NextResponse.json(items, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching transaction from Firestore:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// PATCH request handler (mock to satisfy local state updates, Dexie handles the main edits client-side)
export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    return NextResponse.json(
      { message: 'Transaction patched successfully in client state' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

// DELETE request handler to delete a transaction from Firestore daily_revenue
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const hotelCode = request.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "87241";
    let transactionDate: string | null = null;

    // 1. Try to find the transaction date in pos_orders first
    const posOrdersQuery = query(getHotelCollection(db, 'pos_orders', hotelCode), where('transactionId', '==', id));
    const posOrdersSnap = await getDocs(posOrdersQuery);
    
    // Also fetch from revenue_transactions just in case
    const revQuery = query(getHotelCollection(db, 'revenue_transactions', hotelCode), where('transactionId', '==', id));
    const revSnap = await getDocs(revQuery);

    // Extract transactionDate
    if (!posOrdersSnap.empty) {
      const orderDoc = posOrdersSnap.docs[0].data();
      if (orderDoc.timestamp) {
        const tDate = orderDoc.timestamp.toDate ? orderDoc.timestamp.toDate() : new Date(orderDoc.timestamp);
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        transactionDate = formatter.format(tDate);
      }
    } else if (!revSnap.empty) {
      const revDoc = revSnap.docs[0].data();
      if (revDoc.date) {
        transactionDate = revDoc.date;
      } else if (revDoc.timestamp) {
        const tDate = revDoc.timestamp.toDate ? revDoc.timestamp.toDate() : new Date(revDoc.timestamp);
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        transactionDate = formatter.format(tDate);
      }
    }

    let deleted = false;

    // 2. If we determined the transaction date, we can load the specific daily_revenue doc directly!
    if (transactionDate) {
      const dailyRevDocId = `${hotelCode}_${transactionDate}`;
      const dailyRef = doc(getHotelCollection(db, 'daily_revenue', hotelCode), dailyRevDocId);
      const snapDaily = await getDoc(dailyRef);
      if (snapDaily.exists()) {
        const entries = snapDaily.data().entries || [];
        const updatedEntries = entries.filter((e: any) => e.bookingId !== id);
        await updateDoc(dailyRef, {
          entries: updatedEntries,
        });
        deleted = true;
      }
    }

    // 3. Fallback: If no date could be found, or direct document delete didn't happen, scan daily_revenue
    if (!deleted) {
      const dailyRevSnap = await getDocs(getHotelCollection(db, 'daily_revenue', hotelCode));
      for (const docSnap of dailyRevSnap.docs) {
        const entries = docSnap.data().entries || [];
        const index = entries.findIndex((e: any) => e.bookingId === id);
        if (index !== -1) {
          const updatedEntries = entries.filter((e: any) => e.bookingId !== id);
          await updateDoc(docSnap.ref, {
            entries: updatedEntries,
          });
          deleted = true;
          break;
        }
      }
    }

    // 4. Delete from pos_orders and revenue_transactions
    for (const orderDoc of posOrdersSnap.docs) {
      await deleteDoc(orderDoc.ref);
      deleted = true;
    }

    for (const revDoc of revSnap.docs) {
      await deleteDoc(revDoc.ref);
      deleted = true;
    }

    if (!deleted) {
      return NextResponse.json(
        { error: 'Transaction not found in Firestore' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id, message: 'Transaction deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting transaction from Firestore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
