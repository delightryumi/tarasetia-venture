import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PushPnLParams {
  docId: string; // e.g. 'dml-xxxx', 'pr-yyyy', 'sr-zzzz'
  docNum: string; // e.g. DML-001, PR-001, SR-001
  department: string; // F&B, Housekeeping, Front Office, etc.
  amount: number;
  date: any;
  description?: string;
  fbCategory?: string | null;
  eventCategory?: string | null;
  paymentStatus?: 'paid' | 'pending' | 'tempo';
  paymentDate?: string;
  items?: any[];
}

export async function pushCostToPnL({
  docId,
  docNum,
  department,
  amount,
  date,
  description,
  fbCategory,
  eventCategory,
  paymentStatus = 'paid',
  paymentDate,
  items
}: PushPnLParams) {
  // 1. Get the month key (YYYY-MM)
  let month = "";
  if (date) {
    if (typeof date.toDate === 'function') {
      month = date.toDate().toISOString().slice(0, 7);
    } else if (date instanceof Date) {
      month = date.toISOString().slice(0, 7);
    } else if (typeof date === 'string') {
      month = date.slice(0, 7);
    }
  }
  if (!month || month.length !== 7) {
    month = new Date().toISOString().slice(0, 7);
  }

  const expenseDate = date && typeof date === 'string' ? date : new Date().toISOString().split('T')[0];

  try {
    const docRef = doc(db, "global_pnl_reports", month);
    const docSnap = await getDoc(docRef);

    let existingExpenses: any[] = [];
    if (docSnap.exists()) {
      existingExpenses = docSnap.data().expenses || [];
    }

    // Filter out any previous entry with this docId (including split ones) to avoid duplicates
    const cleanedExpenses = existingExpenses.filter((e: any) => 
      e.id !== docId && 
      e.id !== `${docId}_paid` && 
      e.id !== `${docId}_tempo`
    );

    const newExpensesToPush: any[] = [];

    const getItemCost = (item: any) => {
      if (typeof item.total === 'number') return item.total;
      const qty = Number(item.qty_ordered || item.qty || 0);
      const price = Number(item.unit_price || item.estimated_price || 0);
      return qty * price;
    };

    if (items && items.length > 0) {
      const tempoItems = items.filter(i => (i.paymentStatus || 'paid') === 'tempo');
      const paidItems = items.filter(i => (i.paymentStatus || 'paid') !== 'tempo');

      const tempoTotal = tempoItems.reduce((sum, i) => sum + getItemCost(i), 0);
      const paidTotal = paidItems.reduce((sum, i) => sum + getItemCost(i), 0);

      if (paidTotal > 0) {
        newExpensesToPush.push({
          id: `${docId}_paid`,
          name: `${department} - ${docNum} (PAID)`,
          amount: Number(paidTotal),
          category: department,
          date: expenseDate,
          description: description || `Pushed from ${docNum} (PAID)`,
          fbCategory: fbCategory || null,
          eventCategory: eventCategory || null,
          department: department,
          paymentStatus: 'paid',
          paymentDate: expenseDate
        });
      }

      if (tempoTotal > 0) {
        newExpensesToPush.push({
          id: `${docId}_tempo`,
          name: `${department} - ${docNum} (TEMPO)`,
          amount: Number(tempoTotal),
          category: department,
          date: expenseDate,
          description: description || `Pushed from ${docNum} (TEMPO)`,
          fbCategory: fbCategory || null,
          eventCategory: eventCategory || null,
          department: department,
          paymentStatus: 'tempo',
          paymentDate: paymentDate || null
        });
      }
    } else {
      // Fallback to single entry
      newExpensesToPush.push({
        id: docId,
        name: `${department} - ${docNum}`,
        amount: Number(amount) || 0,
        category: department,
        date: expenseDate,
        description: description || `Pushed from ${docNum} (${department})`,
        fbCategory: fbCategory || null,
        eventCategory: eventCategory || null,
        department: department,
        paymentStatus: paymentStatus,
        paymentDate: paymentDate || (paymentStatus === 'paid' ? expenseDate : null)
      });
    }

    const updatedExpenses = [...cleanedExpenses, ...newExpensesToPush];
    await setDoc(docRef, { expenses: updatedExpenses }, { merge: true });
    console.log(`Successfully pushed expense for ${docNum} to P&L report for month ${month}`);
  } catch (error) {
    console.error("Failed to push expense to P&L:", error);
    throw error;
  }
}

export async function removeCostFromPnL(docId: string, date: any) {
  let month = "";
  if (date) {
    if (typeof date.toDate === 'function') {
      month = date.toDate().toISOString().slice(0, 7);
    } else if (date instanceof Date) {
      month = date.toISOString().slice(0, 7);
    } else if (typeof date === 'string') {
      month = date.slice(0, 7);
    }
  }
  if (!month || month.length !== 7) {
    month = new Date().toISOString().slice(0, 7);
  }

  try {
    const docRef = doc(db, "global_pnl_reports", month);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const existingExpenses = docSnap.data().expenses || [];
      const updatedExpenses = existingExpenses.filter((e: any) => 
        e.id !== docId && 
        e.id !== `${docId}_paid` && 
        e.id !== `${docId}_tempo`
      );
      await setDoc(docRef, { expenses: updatedExpenses }, { merge: true });
      console.log(`Successfully removed expense ${docId} from P&L report for month ${month}`);
    }
  } catch (error) {
    console.error("Failed to remove expense from P&L:", error);
  }
}
