'use server';

import { db } from '@/lib/firebase';
import { getDocs, query, orderBy } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { getCachedCatalog, setCachedCatalog } from '@/lib/catalogCache';

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
    const hotelCode = cookieStore.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "";
    if (!hotelCode || hotelCode === "0") {
      return {
        data: [],
        metadata: {
          hasNextPage: false,
          totalPages: 0,
        },
      };
    }

    const cached = getCachedCatalog(hotelCode);
    let results: any[] = [];

    if (cached) {
      results = cached.products.map((p) => ({
        id: p.id,
        sellprice: Number(p.price) || 0,
        productstock: {
          id: p.id,
          name: p.name || 'Unnamed Product',
          cat: p.category || 'General',
          subcategory: p.subcategory || '',
          stock: Number(p.stock) || 0,
          price: Number(p.buyPrice || 0),
          imageProduct: p.image || null,
          description: p.description || '',
          addons: p.addons || [],
          isSignature: Boolean(p.isSignature),
        },
      }));
    } else {
      const q = query(getHotelCollection(db, 'pos_products', hotelCode), orderBy('name', 'asc'));
      const snap = await getDocs(q);

      const catalogProducts = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        const pStock = data.stock !== undefined ? Number(data.stock) : 0;
        const catUpper = (data.category || '').toUpperCase().trim();
        const isBkf = catUpper === 'ADD BREAKFAST' || catUpper === 'BREAKFAST';
        return {
          id: docSnap.id,
          name: data.name || 'Unnamed Product',
          price: Number(data.price) || 0,
          buyPrice: Number(data.buyPrice || 0),
          stock: pStock,
          isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) && pStock > 0 : pStock > 0,
          category: data.category || 'General',
          subcategory: data.subcategory || '',
          pnlTarget: data.pnlTarget || (isBkf ? 'BREAKFAST' : ''),
          image: data.image || '',
          description: data.description || '',
          addons: data.addons || [],
          isSignature: Boolean(data.isSignature),
        };
      });

      // Also fetch and cache categories
      let catList: any[] = [];
      try {
        const catSnap = await getDocs(getHotelCollection(db, 'pos_categories', hotelCode));
        catList = catSnap.docs.map((d) => ({
          name: d.data().name || '',
          subcategories: d.data().subcategories || [],
        }));
      } catch (e) {
        // Safe fallback if pos_categories isn't available
      }

      setCachedCatalog(hotelCode, catalogProducts, catList);

      results = catalogProducts.map((p) => ({
        id: p.id,
        sellprice: Number(p.price) || 0,
        productstock: {
          id: p.id,
          name: p.name || 'Unnamed Product',
          cat: p.category || 'General',
          subcategory: p.subcategory || '',
          stock: Number(p.stock) || 0,
          price: Number(p.buyPrice || 0),
          imageProduct: p.image || null,
          description: p.description || '',
          addons: p.addons || [],
          isSignature: Boolean(p.isSignature),
        },
      }));
    }

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
