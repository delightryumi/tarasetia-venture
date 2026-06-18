'use server';

import { db } from '@/lib/firebase';
import { getDocs, query, orderBy } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { getHotelCollection } from '@/lib/firestoreHelper';

export const fetchProduct = async ({
  take = 5,
  skip = 0,
  query: searchQuery,
}: {
  query?: string;
  take: number;
  skip: number;
}) => {
  try {
    const cookieStore = await cookies();
    const hotelCode = cookieStore.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "87241";

    const q = query(getHotelCollection(db, 'pos_products', hotelCode), orderBy('name', 'asc'));
    const snap = await getDocs(q);

    let results = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        sellprice: Number(data.price) || 0,
        productstock: {
          id: docSnap.id,
          name: data.name || 'Unnamed Product',
          cat: data.category || 'General',
          subcategory: data.subcategory || '',
          stock: Number(data.stock) || 0,
          price: Number(data.buyPrice || 0), // Buy price
          imageProduct: data.image || null,
        },
      };
    });

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter((item) =>
        item.productstock.name.toLowerCase().includes(lowerQuery)
      );
    }

    const total = results.length;
    const paginatedData = results.slice(skip, skip + take);

    return {
      data: paginatedData,
      metadata: {
        hasNextPage: skip + take < total,
        totalPages: Math.ceil(total / take),
      },
    };
  } catch (error: any) {
    console.error('Failed to fetch product from Firestore:', error);
    return {
      data: [],
      metadata: {
        hasNextPage: false,
        totalPages: 0,
      },
    };
  }
};
