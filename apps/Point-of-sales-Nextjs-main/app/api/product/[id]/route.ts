import { NextRequest, NextResponse } from 'next/server';
import { db as firestoreDb } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const hotelCode = request.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "87241") {
      return NextResponse.json({ error: 'Hotel code is missing or invalid' }, { status: 400 });
    }
    const body = await request.json();

    // Sync the updated product to Firebase Firestore under the hotel-specific subcollection
    await setDoc(doc(firestoreDb, 'hotels', hotelCode, 'pos_products', String(id)), {
      name: body.productName,
      price: Number(body.sellPrice),
      buyPrice: Number(body.buyPrice),
      stock: Number(body.stockProduct),
      category: body.category,
      subcategory: body.subcategory || '',
      image: body.imageProduct || '',
      description: body.description || '',
      addons: body.addons || []
    }, { merge: true });

    // Return the updated product structure matching the frontend's expectations
    return NextResponse.json({
      id: id,
      name: body.productName,
      stock: Number(body.stockProduct),
      price: Number(body.buyPrice),
      cat: body.category,
      subcategory: body.subcategory || '',
      imageProduct: body.imageProduct || '',
      Product: [
        {
          sellprice: Number(body.sellPrice),
        }
      ]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error updating product in Firestore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

// Handler function for DELETE request
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const hotelCode = request.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "87241") {
      return NextResponse.json({ error: 'Hotel code is missing or invalid' }, { status: 400 });
    }

    // Sync deletion to Firebase Firestore under the hotel-specific subcollection
    await deleteDoc(doc(firestoreDb, 'hotels', hotelCode, 'pos_products', String(id)));

    return NextResponse.json({ success: true, id: id }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting product from Firestore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
