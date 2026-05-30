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
}

export async function pushCostToPnL({
  docId,
  docNum,
  department,
  amount,
  date,
  description,
  fbCategory,
  eventCategory
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


  const expenseName = `${department} - ${docNum}`;
  const expenseDate = date && typeof date === 'string' ? date : new Date().toISOString().split('T')[0];

  try {
    const docRef = doc(db, "global_pnl_reports", month);
    const docSnap = await getDoc(docRef);

    let existingExpenses: any[] = [];
    if (docSnap.exists()) {
      existingExpenses = docSnap.data().expenses || [];
    }

    // Filter out any previous entry with this docId to avoid duplicates
    const cleanedExpenses = existingExpenses.filter((e: any) => e.id !== docId);

    // Add new expense entry
    const newExpense = {
      id: docId,
      name: expenseName,
      amount: Number(amount) || 0,
      category: department,
      date: expenseDate,
      description: description || `Pushed from ${docNum} (${department})`,
      fbCategory: fbCategory || null,
      eventCategory: eventCategory || null,
      department: department
    };

    const updatedExpenses = [...cleanedExpenses, newExpense];
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
      const updatedExpenses = existingExpenses.filter((e: any) => e.id !== docId);
      await setDoc(docRef, { expenses: updatedExpenses }, { merge: true });
      console.log(`Successfully removed expense ${docId} from P&L report for month ${month}`);
    }
  } catch (error) {
    console.error("Failed to remove expense from P&L:", error);
  }
}
