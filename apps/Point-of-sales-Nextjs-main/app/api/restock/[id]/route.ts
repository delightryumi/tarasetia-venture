import { NextRequest, NextResponse } from 'next/server';
import { db as firestoreDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Handler function for PATCH request to update a single product's stock in Firestore
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const hotelCode = request.cookies.get('hotelCode')?.value || "87241";
    const body = await request.json();

    const docRef = doc(firestoreDb, 'hotels', hotelCode, 'pos_products', String(id));
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentStock = Number(docSnap.data().stock || 0);
    const newStock = currentStock + Number(body.stockProduct);

    // Update the product's stock in Firestore under the hotel-specific subcollection
    await updateDoc(docRef, {
      stock: newStock,
    });

    return NextResponse.json({ id: id, stock: newStock }, { status: 201 });
  } catch (error: any) {
    console.error('Error during single product restock in Firestore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
