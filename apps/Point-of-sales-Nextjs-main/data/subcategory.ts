// apps/Point-of-sales-Nextjs-main/data/subcategory.ts
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SubCategory {
  id: string;
  name: string;
  parentCategory: string;
}

/**
 * Fetch all sub‑categories from Firestore.
 * Returns an array sorted alphabetically by name.
 */
export const fetchSubCategories = async (): Promise<SubCategory[]> => {
  const q = query(collection(db, 'pos_subcategories'), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    parentCategory: doc.data().parentCategory,
  }));
};
