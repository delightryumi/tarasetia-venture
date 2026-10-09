export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getDocs, query, orderBy } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { getCachedCatalog, setCachedCatalog } from '@/lib/catalogCache';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paramHotelCode = searchParams.get('hotelCode');
    const cookieHotelCode = req.cookies.get('hotelCode')?.value;
    const headerHotelCode = req.headers.get('x-hotel-code');
    const hotelCode = paramHotelCode || cookieHotelCode || headerHotelCode || '';

    if (!hotelCode || hotelCode === '0') {
      return NextResponse.json(
        { products: [], categories: [], version: 0 },
        { status: 200 }
      );
    }

    // 1. Check server in-memory cache (reduces reads to 0 for concurrent cashiers)
    const cached = getCachedCatalog(hotelCode);
    if (cached) {
      return NextResponse.json(
        {
          products: cached.products,
          categories: cached.categories,
          version: cached.version,
        },
        {
          status: 200,
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'private, max-age=60, s-maxage=300, stale-while-revalidate=600',
            ETag: `"${cached.version}"`,
          },
        }
      );
    }

    // 2. Cache MISS: Fetch catalog and categories once from Firestore
    const prodQuery = query(getHotelCollection(db, 'pos_products', hotelCode), orderBy('name', 'asc'));
    const prodSnap = await getDocs(prodQuery);
    const products = prodSnap.docs.map((d) => {
      const data = d.data();
      const pStock = data.stock !== undefined ? Number(data.stock) : 0;
      const catUpper = (data.category || '').toUpperCase().trim();
      const isBkf = catUpper === 'ADD BREAKFAST' || catUpper === 'BREAKFAST';
      return {
        id: d.id,
        name: data.name || 'Unnamed Product',
        price: Number(data.price) || 0,
        stock: pStock,
        isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) && pStock > 0 : pStock > 0,
        category: data.category || 'General',
        subcategory: data.subcategory || '',
        pnlTarget: data.pnlTarget || (isBkf ? 'BREAKFAST' : ''),
        image: data.image || '',
        description: data.description || '',
        addons: data.addons || [],
        buyPrice: Number(data.buyPrice || 0),
        isSignature: Boolean(data.isSignature)
      };
    });

    const catSnap = await getDocs(getHotelCollection(db, 'pos_categories', hotelCode));
    const categories = catSnap.docs.map((d) => ({
      name: d.data().name || '',
      subcategories: d.data().subcategories || [],
    }));

    // 3. Save into in-memory cache
    const saved = setCachedCatalog(hotelCode, products, categories);

    return NextResponse.json(
      {
        products: saved.products,
        categories: saved.categories,
        version: saved.version,
      },
      {
        status: 200,
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'private, max-age=60, s-maxage=300, stale-while-revalidate=600',
          ETag: `"${saved.version}"`,
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
