import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';

// Handler function for GET request to fetch product stocks
export async function GET(request: NextRequest) {
  try {
    const hotelCode = request.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "87241") {
      return NextResponse.json({ error: 'Hotel code is missing or invalid' }, { status: 400 });
    }
    // Fetch product stocks from Firestore pos_products collection under the hotel subcollection
    const snap = await getDocs(getHotelCollection(db, 'pos_products', hotelCode));
    
    const productStocks = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        restoId: 'default-resto',
        name: data.name || 'Unnamed Product',
        stock: Number(data.stock) || 0,
        price: Number(data.buyPrice || data.price || 0),
        cat: data.category || 'General',
        imageProduct: data.image || null,
        Product: [
          {
            sellprice: Number(data.price) || 0,
          },
        ],
      };
    });

    return NextResponse.json(productStocks, { status: 200 });
  } catch (error) {
    console.error('Error fetching product stocks from Firestore:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product stocks' },
      { status: 500 }
    );
  }
}
