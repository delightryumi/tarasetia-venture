import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, limit, deleteDoc, where } from 'firebase/firestore';

// GET request handler to fetch onSaleProducts by transactionId from Firestore daily_revenue
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const q = query(
      collection(db, 'pos_orders'),
      where('transactionId', '==', id),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json(
        { message: 'Transaction not found in pos_orders' },
        { status: 404 }
      );
    }

    const docData = snap.docs[0].data();

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const q = query(
      collection(db, 'daily_revenue'),
      orderBy('date', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    let deleted = false;

    for (const docSnap of snap.docs) {
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

    // Delete from pos_orders
    const posOrdersQuery = query(collection(db, 'pos_orders'), where('transactionId', '==', id));
    const posOrdersSnap = await getDocs(posOrdersQuery);
    for (const orderDoc of posOrdersSnap.docs) {
      await deleteDoc(orderDoc.ref);
      deleted = true;
    }

    // Delete from revenue_transactions
    const revQuery = query(collection(db, 'revenue_transactions'), where('transactionId', '==', id));
    const revSnap = await getDocs(revQuery);
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
