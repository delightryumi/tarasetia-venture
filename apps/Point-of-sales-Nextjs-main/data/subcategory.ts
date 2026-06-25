// apps/Point-of-sales-Nextjs-main/data/subcategory.ts
import { getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cookies } from 'next/headers';
import { getHotelCollection } from '@/lib/firestoreHelper';

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
  const cookieStore = await cookies();
  const hotelCode = cookieStore.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "";
  if (!hotelCode || hotelCode === "87241") {
    return [];
  }

  const q = query(getHotelCollection(db, 'pos_subcategories', hotelCode), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    parentCategory: doc.data().parentCategory,
  }));
};
