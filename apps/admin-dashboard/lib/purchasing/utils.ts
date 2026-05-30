import { runTransaction, collection, doc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Generates an atomic, collision-free document sequence number using a counter document in Firestore.
 * Format examples: SR-YYYY-MM-XXXX, PR-YYYY-MM-XXXX, DML-YYYY-MM-DD-XXXX
 */
export async function generateDocNumber(prefix: "SR" | "PR" | "DML"): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  let periodStr = `${year}-${month}`;
  if (prefix === "DML") {
    periodStr = `${year}-${month}-${day}`;
  }

  const counterRef = doc(db, "purchasing_counters", `${prefix}_${periodStr}`);

  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let nextNum = 1;

    if (counterSnap.exists()) {
      nextNum = (counterSnap.data().current_seq || 0) + 1;
    }

    transaction.set(counterRef, { current_seq: nextNum }, { merge: true });

    const seqPadding = String(nextNum).padStart(4, "0");
    return `${prefix}-${periodStr.replace(/-/g, "")}-${seqPadding}`;
  });
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusStyle(status: string, statusList: { value: string; color: string }[]): string {
  const match = statusList.find(s => s.value === status);
  return match ? match.color : "bg-neutral-100 text-neutral-700 border-neutral-200";
}
