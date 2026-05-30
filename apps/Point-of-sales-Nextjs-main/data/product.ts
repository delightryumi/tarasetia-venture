'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

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
    const q = query(collection(db, 'pos_products'), orderBy('name', 'asc'));
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
