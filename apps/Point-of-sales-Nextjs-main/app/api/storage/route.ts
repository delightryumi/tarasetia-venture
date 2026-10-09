import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';

import { getCachedCatalog, setCachedCatalog } from '@/lib/catalogCache';

// Handler function for GET request to fetch product stocks
export async function GET(request: NextRequest) {
  try {
    const hotelCode = request.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "0") {
      return NextResponse.json({ error: 'Hotel code is missing or invalid' }, { status: 400 });
    }

    const cached = getCachedCatalog(hotelCode);
    if (cached) {
      const productStocks = cached.products.map((p) => ({
        id: p.id,
        restoId: 'default-resto',
        name: p.name || 'Unnamed Product',
        stock: Number(p.stock) || 0,
        price: Number(p.buyPrice || p.price || 0),
        cat: p.category || 'General',
        imageProduct: p.image || null,
        Product: [
          {
            sellprice: Number(p.price) || 0,
          },
        ],
      }));
      return NextResponse.json(productStocks, { status: 200, headers: { 'X-Cache': 'HIT' } });
    }

    // Cache MISS: Fetch product stocks from Firestore pos_products collection under the hotel subcollection
    const snap = await getDocs(getHotelCollection(db, 'pos_products', hotelCode));
    
    const catalogProducts = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      const pStock = data.stock !== undefined ? Number(data.stock) : 0;
      return {
        id: docSnap.id,
        name: data.name || 'Unnamed Product',
        price: Number(data.price) || 0,
        buyPrice: Number(data.buyPrice || 0),
        stock: pStock,
        isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) && pStock > 0 : pStock > 0,
        category: data.category || 'General',
        subcategory: data.subcategory || '',
        pnlTarget: data.pnlTarget || '',
        image: data.image || '',
        description: data.description || '',
        addons: data.addons || [],
        isSignature: Boolean(data.isSignature),
      };
    });

    setCachedCatalog(hotelCode, catalogProducts, []);

    const productStocks = catalogProducts.map((p) => ({
      id: p.id,
      restoId: 'default-resto',
      name: p.name || 'Unnamed Product',
      stock: Number(p.stock) || 0,
      price: Number(p.buyPrice || p.price || 0),
      cat: p.category || 'General',
      imageProduct: p.image || null,
      Product: [
        {
          sellprice: Number(p.price) || 0,
        },
      ],
    }));

    return NextResponse.json(productStocks, { status: 200, headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    console.error('Error fetching product stocks from Firestore:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product stocks' },
      { status: 500 }
    );
  }
}
