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
    if (!hotelCode || hotelCode === "0") {
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

    const paymentMethod = docData.paymentMethod || docData.paymethod || docData.method || 'cash';
    const customerName = docData.customerName || 'Walk-in Customer';
    const cashierName = docData.cashierName || 'Kasir';
    const tableNumber = docData.tableNumber || '';
    const discount = Number(docData.discount || 0);
    const subtotal = docData.subtotal !== undefined ? Number(docData.subtotal) : undefined;
    const tax = docData.tax !== undefined ? Number(docData.tax) : undefined;
    const total = docData.total !== undefined ? Number(docData.total) : undefined;
    const cashAmount = docData.cashAmount !== undefined ? Number(docData.cashAmount) : undefined;
    const changeAmount = docData.changeAmount !== undefined ? Number(docData.changeAmount) : undefined;
    const status = docData.status || 'SUCCESS';
    const cancelReason = docData.cancelReason || '';
    const notes = docData.notes || '';

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
      discount,
      status,
      cancelReason,
      paymentMethod,
      paymethod: paymentMethod,
      customerName,
      cashierName,
      tableNumber,
      table: tableNumber,
      subtotal,
      tax,
      total,
      cashAmount,
      changeAmount,
      notes,
      isCompliment: !!(item.isCompliment ?? docData.isCompliment),
      complimentReason: item.complimentReason || docData.complimentReason || '',
      selectedAddons: item.selectedAddons || [],
      note: item.note || '',
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
    if (!hotelCode || hotelCode === "0") {
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

    // E. Delete corresponding shadow held order to free up the table
    try {
      const shadowHeldId = `HLD-${resolvedTxId.replace('TRS-', '')}`;
      await deleteDoc(doc(getHotelCollection(db, 'pos_held_orders', hotelCode), shadowHeldId));
    } catch (e) {
      console.error('Failed to clear shadow held order on void:', e);
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
    if (!hotelCode || hotelCode === "0") {
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

    // 6. Delete corresponding shadow held order to free up the table
    try {
      const shadowHeldId = `HLD-${resolvedTxId.replace('TRS-', '')}`;
      await deleteDoc(doc(getHotelCollection(db, 'pos_held_orders', hotelCode), shadowHeldId));
    } catch (e) {
      console.error('Failed to clear shadow held order on delete:', e);
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

// PUT request handler to EDIT PAYMENT METHOD of a transaction
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const hotelCode = request.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "0") {
      return NextResponse.json({ error: "Hotel Code is missing or invalid" }, { status: 400 });
    }

    const body = await request.json();
    const rawPaymentMethod = (body.paymentMethod || '').toLowerCase().trim();
    const notes = body.notes || '';

    const validMethods = ['cash', 'qris', 'card', 'transfer', 'compliment'];
    if (!rawPaymentMethod || !validMethods.includes(rawPaymentMethod)) {
      return NextResponse.json(
        { error: `Metode pembayaran tidak valid. Pilihan: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    const newPaymentMethod = rawPaymentMethod;
    const isNowCompliment = newPaymentMethod === 'compliment';

    let resolvedTxId = id;
    let shiftId: string | null = null;
    let transactionDate: string | null = null;

    // 1. Find the order document in pos_orders
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
      return NextResponse.json({ error: 'Transaksi tidak ditemukan di pos_orders' }, { status: 404 });
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

    const oldPaymentMethod = (targetOrderDoc.paymentMethod || targetOrderDoc.paymethod || targetOrderDoc.method || 'cash').toLowerCase();
    const wasCompliment = !!targetOrderDoc.isCompliment || oldPaymentMethod === 'compliment';

    // Calculate updated total
    const originalSubtotal = Number(targetOrderDoc.subtotal || targetOrderDoc.complimentValue || targetOrderDoc.total || 0);
    const originalTotal = Number(targetOrderDoc.total ?? targetOrderDoc.amount ?? 0);
    let newTotal = originalTotal;

    if (isNowCompliment) {
      newTotal = 0;
    } else if (wasCompliment) {
      // Revert from compliment to original value
      newTotal = Number(targetOrderDoc.complimentValue || originalSubtotal || 0);
    }

    // 2. Update pos_orders
    const posOrderUpdates: any = {
      paymentMethod: newPaymentMethod,
      paymethod: newPaymentMethod,
      method: newPaymentMethod,
      isCompliment: isNowCompliment,
      lastPaymentUpdate: {
        previousMethod: oldPaymentMethod,
        newMethod: newPaymentMethod,
        updatedAt: new Date().toISOString(),
        notes: notes.trim(),
      },
    };

    if (isNowCompliment) {
      posOrderUpdates.total = 0;
      posOrderUpdates.cashAmount = 0;
      posOrderUpdates.changeAmount = 0;
      if (!targetOrderDoc.complimentValue && (originalSubtotal > 0 || originalTotal > 0)) {
        posOrderUpdates.complimentValue = originalTotal > 0 ? originalTotal : originalSubtotal;
      }
    } else if (wasCompliment) {
      posOrderUpdates.total = newTotal;
      if (newPaymentMethod === 'cash') {
        posOrderUpdates.cashAmount = newTotal;
        posOrderUpdates.changeAmount = 0;
      }
    } else if (newPaymentMethod === 'cash') {
      posOrderUpdates.cashAmount = targetOrderDoc.cashAmount && targetOrderDoc.cashAmount > 0 
        ? targetOrderDoc.cashAmount 
        : newTotal;
    }

    if (notes.trim()) {
      posOrderUpdates.notes = targetOrderDoc.notes 
        ? `${targetOrderDoc.notes} | Edit Payment: ${notes.trim()}`
        : `Edit Payment: ${notes.trim()}`;
    }

    await updateDoc(targetOrderRef, posOrderUpdates);

    // 3. Update revenue_transactions
    const revQuery = query(getHotelCollection(db, 'revenue_transactions', hotelCode), where('transactionId', '==', resolvedTxId));
    const revSnap = await getDocs(revQuery);

    const revUpdates: any = {
      paymentMethod: newPaymentMethod,
      paymethod: newPaymentMethod,
      method: newPaymentMethod,
      type: isNowCompliment ? 'Compliment' : 'Nexura Collect',
      revenueType: isNowCompliment ? 'compliment' : (targetOrderDoc.revenueType || 'pos'),
      amount: isNowCompliment ? 0 : newTotal,
    };

    if (!revSnap.empty) {
      for (const revDoc of revSnap.docs) {
        if (!transactionDate && revDoc.data().date) {
          transactionDate = revDoc.data().date;
        }
        await updateDoc(revDoc.ref, revUpdates);
      }
    } else {
      // Fallback: direct doc check
      const revDirectRef = doc(getHotelCollection(db, 'revenue_transactions', hotelCode), resolvedTxId);
      const revDirectSnap = await getDoc(revDirectRef);
      if (revDirectSnap.exists()) {
        if (!transactionDate && revDirectSnap.data().date) {
          transactionDate = revDirectSnap.data().date;
        }
        await updateDoc(revDirectRef, revUpdates);
      }
    }

    // 4. Update daily_revenue entry
    let dailyUpdated = false;
    if (transactionDate) {
      const dailyRevDocId = `${hotelCode}_${transactionDate}`;
      const dailyRef = doc(getHotelCollection(db, 'daily_revenue', hotelCode), dailyRevDocId);
      const snapDaily = await getDoc(dailyRef);
      if (snapDaily.exists()) {
        const entries = snapDaily.data().entries || [];
        const updatedEntries = entries.map((e: any) => {
          if (e.bookingId === resolvedTxId || e.transactionId === resolvedTxId) {
            return {
              ...e,
              paymentMethod: newPaymentMethod,
              paymethod: newPaymentMethod,
              method: newPaymentMethod,
              paymentType: newPaymentMethod,
              isCompliment: isNowCompliment,
              amount: isNowCompliment ? 0 : (e.amount > 0 ? e.amount : newTotal),
              total: isNowCompliment ? 0 : (e.total > 0 ? e.total : newTotal),
            };
          }
          return e;
        });
        await updateDoc(dailyRef, { entries: updatedEntries });
        dailyUpdated = true;
      }
    }

    // Fallback scan daily_revenue if not updated
    if (!dailyUpdated) {
      const dailyRevSnap = await getDocs(getHotelCollection(db, 'daily_revenue', hotelCode));
      for (const docSnap of dailyRevSnap.docs) {
        const entries = docSnap.data().entries || [];
        const index = entries.findIndex((e: any) => e.bookingId === resolvedTxId || e.transactionId === resolvedTxId);
        if (index !== -1) {
          const updatedEntries = entries.map((e: any) => {
            if (e.bookingId === resolvedTxId || e.transactionId === resolvedTxId) {
              return {
                ...e,
                paymentMethod: newPaymentMethod,
                paymethod: newPaymentMethod,
                method: newPaymentMethod,
                paymentType: newPaymentMethod,
                isCompliment: isNowCompliment,
                amount: isNowCompliment ? 0 : (e.amount > 0 ? e.amount : newTotal),
                total: isNowCompliment ? 0 : (e.total > 0 ? e.total : newTotal),
              };
            }
            return e;
          });
          await updateDoc(docSnap.ref, { entries: updatedEntries });
          break;
        }
      }
    }

    // 5. Update cashier_shifts if shiftId exists
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
                method: newPaymentMethod,
                paymentMethod: newPaymentMethod,
                paymethod: newPaymentMethod,
                amount: isNowCompliment ? 0 : (t.amount > 0 ? t.amount : newTotal),
              };
            }
            return t;
          });
          await updateDoc(shiftRef, { transactions: updatedTxs });
        }
      } catch (err) {
        console.error('Failed to update cashier shift for payment edit:', err);
      }
    }

    return NextResponse.json({
      success: true,
      id: resolvedTxId,
      previousMethod: oldPaymentMethod,
      paymentMethod: newPaymentMethod,
      isCompliment: isNowCompliment,
      total: newTotal,
      message: 'Metode pembayaran berhasil diubah'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating payment method in Firestore:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengubah metode pembayaran' }, { status: 500 });
  }
};

