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
    const hotelCode = req.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "87241") {
      return NextResponse.json({ error: "Hotel Code is missing or invalid" }, { status: 400 });
    }

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
      status: docData.status || 'SUCCESS',
      cancelReason: docData.cancelReason || '',
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

// PATCH request handler to VOID a transaction (soft delete with reason)
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const hotelCode = request.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "87241") {
      return NextResponse.json({ error: "Hotel Code is missing or invalid" }, { status: 400 });
    }
    const body = await request.json();
    const reason = body.reason || 'Voided from Records';

    let transactionDate: string | null = null;
    let shiftId: string | null = null;
    let resolvedTxId = id;

    // 1. Try to find the order document in pos_orders
    const posOrdersQuery = query(getHotelCollection(db, 'pos_orders', hotelCode), where('transactionId', '==', id));
    const posOrdersSnap = await getDocs(posOrdersQuery);
    
    let targetOrderDoc: any = null;
    let targetOrderRef: any = null;

    if (!posOrdersSnap.empty) {
      targetOrderDoc = posOrdersSnap.docs[0].data();
      targetOrderRef = posOrdersSnap.docs[0].ref;
      resolvedTxId = targetOrderDoc.transactionId || id;
    } else {
      // Fallback: try fetching by document ID directly
      const docRef = doc(getHotelCollection(db, 'pos_orders', hotelCode), id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        targetOrderDoc = docSnap.data();
        targetOrderRef = docSnap.ref;
        resolvedTxId = targetOrderDoc.transactionId || id;
      }
    }

    if (!targetOrderDoc) {
      return NextResponse.json({ error: 'Transaction not found in pos_orders' }, { status: 404 });
    }

    shiftId = targetOrderDoc.shiftId || null;
    if (targetOrderDoc.timestamp) {
      const tDate = targetOrderDoc.timestamp.toDate ? targetOrderDoc.timestamp.toDate() : new Date(targetOrderDoc.timestamp);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      transactionDate = formatter.format(tDate);
    }

    // A. Update pos_orders to status: 'CANCELLED'
    await updateDoc(targetOrderRef, {
      status: 'CANCELLED',
      cancelReason: reason,
      isDeleted: true
    });

    // B. Update revenue_transactions
    const revQuery = query(getHotelCollection(db, 'revenue_transactions', hotelCode), where('transactionId', '==', resolvedTxId));
    const revSnap = await getDocs(revQuery);
    for (const revDoc of revSnap.docs) {
      await updateDoc(revDoc.ref, {
        status: 'VOID',
        isDeleted: true
      });
    }

    // Extract transactionDate from revenue_transactions if not found yet
    if (revSnap.empty && !transactionDate) {
      const revDoc = revSnap.docs[0]?.data();
      if (revDoc) {
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
    }

    // C. Update daily_revenue entry to CANCELLED
    if (transactionDate) {
      const dailyRevDocId = `${hotelCode}_${transactionDate}`;
      const dailyRef = doc(getHotelCollection(db, 'daily_revenue', hotelCode), dailyRevDocId);
      const snapDaily = await getDoc(dailyRef);
      if (snapDaily.exists()) {
        const entries = snapDaily.data().entries || [];
        const updatedEntries = entries.map((e: any) => {
          if (e.bookingId === resolvedTxId) {
            return {
              ...e,
              status: 'CANCELLED',
              paymentStatus: 'CANCELLED'
            };
          }
          return e;
        });
        await updateDoc(dailyRef, {
          entries: updatedEntries,
        });
      }
    }

    // D. Update cashier_shifts: set the transaction status to 'CANCELLED' in the array
    if (shiftId) {
      try {
        const shiftRef = doc(getHotelCollection(db, 'cashier_shifts', hotelCode), shiftId);
        const shiftSnap = await getDoc(shiftRef);
        if (shiftSnap.exists()) {
          const shiftData = shiftSnap.data();
          const txs = shiftData.transactions || [];
          const updatedTxs = txs.map((t: any) => {
            if (t.id === resolvedTxId || t.transactionId === resolvedTxId) {
              return {
                ...t,
                status: 'CANCELLED',
                amount: 0 // make sure it's 0 so cashier panel estimates don't count it
              };
            }
            return t;
          });
          await updateDoc(shiftRef, {
            transactions: updatedTxs,
          });
        }
      } catch (err) {
        console.error('Failed to update cashier shift for void:', err);
      }
    }

    return NextResponse.json({ id: resolvedTxId, message: 'Transaction voided successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error voiding transaction in Firestore:', error);
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
    const hotelCode = request.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "87241") {
      return NextResponse.json({ error: "Hotel Code is missing or invalid" }, { status: 400 });
    }
    let transactionDate: string | null = null;
    let shiftId: string | null = null;
    let resolvedTxId = id;

    // 1. Try to find the order document in pos_orders
    const posOrdersQuery = query(getHotelCollection(db, 'pos_orders', hotelCode), where('transactionId', '==', id));
    const posOrdersSnap = await getDocs(posOrdersQuery);
    
    let targetOrderDoc: any = null;
    let targetOrderRef: any = null;

    if (!posOrdersSnap.empty) {
      targetOrderDoc = posOrdersSnap.docs[0].data();
      targetOrderRef = posOrdersSnap.docs[0].ref;
      resolvedTxId = targetOrderDoc.transactionId || id;
    } else {
      // Fallback: try fetching by document ID directly
      const docRef = doc(getHotelCollection(db, 'pos_orders', hotelCode), id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        targetOrderDoc = docSnap.data();
        targetOrderRef = docSnap.ref;
        resolvedTxId = targetOrderDoc.transactionId || id;
      }
    }

    // Extract transactionDate & shiftId if order doc was found
    if (targetOrderDoc) {
      shiftId = targetOrderDoc.shiftId || null;
      if (targetOrderDoc.timestamp) {
        const tDate = targetOrderDoc.timestamp.toDate ? targetOrderDoc.timestamp.toDate() : new Date(targetOrderDoc.timestamp);
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        transactionDate = formatter.format(tDate);
      }
    }

    // Also fetch from revenue_transactions using resolvedTxId
    const revQuery = query(getHotelCollection(db, 'revenue_transactions', hotelCode), where('transactionId', '==', resolvedTxId));
    const revSnap = await getDocs(revQuery);

    if (revSnap.empty && !transactionDate) {
      // Fallback: extract date from revenue_transactions if not found from order doc
      const revDoc = revSnap.docs[0]?.data();
      if (revDoc) {
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
    }

    // 2. Remove the transaction from the cashier shift transactions array if shiftId exists
    if (shiftId) {
      try {
        const shiftRef = doc(getHotelCollection(db, 'cashier_shifts', hotelCode), shiftId);
        const shiftSnap = await getDoc(shiftRef);
        if (shiftSnap.exists()) {
          const shiftData = shiftSnap.data();
          const txs = shiftData.transactions || [];
          const updatedTxs = txs.filter((t: any) => t.id !== resolvedTxId && t.transactionId !== resolvedTxId);
          await updateDoc(shiftRef, {
            transactions: updatedTxs,
          });
        }
      } catch (err) {
        console.error('Failed to remove transaction from cashier shift:', err);
      }
    }

    let deleted = false;

    // 3. If we determined the transaction date, we can load the specific daily_revenue doc directly!
    if (transactionDate) {
      const dailyRevDocId = `${hotelCode}_${transactionDate}`;
      const dailyRef = doc(getHotelCollection(db, 'daily_revenue', hotelCode), dailyRevDocId);
      const snapDaily = await getDoc(dailyRef);
      if (snapDaily.exists()) {
        const entries = snapDaily.data().entries || [];
        const updatedEntries = entries.filter((e: any) => e.bookingId !== resolvedTxId);
        await updateDoc(dailyRef, {
          entries: updatedEntries,
        });
        deleted = true;
      }
    }

    // 4. Fallback: If no date could be found, or direct document delete didn't happen, scan daily_revenue
    if (!deleted) {
      const dailyRevSnap = await getDocs(getHotelCollection(db, 'daily_revenue', hotelCode));
      for (const docSnap of dailyRevSnap.docs) {
        const entries = docSnap.data().entries || [];
        const index = entries.findIndex((e: any) => e.bookingId === resolvedTxId);
        if (index !== -1) {
          const updatedEntries = entries.filter((e: any) => e.bookingId !== resolvedTxId);
          await updateDoc(docSnap.ref, {
            entries: updatedEntries,
          });
          deleted = true;
          break;
        }
      }
    }

    // 5. Delete from pos_orders and revenue_transactions
    if (targetOrderRef) {
      await deleteDoc(targetOrderRef);
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

    return NextResponse.json({ id: resolvedTxId, message: 'Transaction deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting transaction from Firestore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
