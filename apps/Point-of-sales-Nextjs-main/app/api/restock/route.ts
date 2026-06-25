import { NextRequest, NextResponse } from 'next/server';
import { db as firestoreDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const POST = async (request: NextRequest) => {
  try {
    const hotelCode = request.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "87241") {
      return NextResponse.json({ error: 'Hotel code is missing or invalid' }, { status: 400 });
    }
    const body = await request.json();

    if (!body.productId || typeof body.stock !== 'number') {
      return NextResponse.json(
        { error: 'productId and stock are required and stock must be a number' },
        { status: 400 }
      );
    }

    const docRef = doc(firestoreDb, 'hotels', hotelCode, 'pos_products', body.productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentStock = Number(docSnap.data().stock || 0);
    await updateDoc(docRef, {
      stock: currentStock + body.stock,
    });

    return NextResponse.json(
      { message: 'Updated product stock' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error during restock in Firestore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
