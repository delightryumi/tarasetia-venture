import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db as firestoreDb } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Function to generate a unique ID for a new product using Firestore
const generateUniqueId = async (hotelCode: string) => {
  let isUnique = false;
  let customId = '';

  while (!isUnique) {
    customId = `PRD-${uuidv4().slice(0, 8)}`;
    const docRef = doc(firestoreDb, 'hotels', hotelCode, 'pos_products', customId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      isUnique = true;
    }
  }

  return customId;
};

// Handler function for POST request to create a new product in Firestore
export const POST = async (request: NextRequest) => {
  try {
    const hotelCode = request.cookies.get('hotelCode')?.value || "87241";
    const customId = await generateUniqueId(hotelCode);
    const body = await request.json();

    const newProductData = {
      name: body.productName,
      price: Number(body.sellPrice),
      buyPrice: Number(body.buyPrice),
      stock: Number(body.stockProduct),
      category: body.category,
      subcategory: body.subcategory || '',
      image: body.imageProduct || '',
      description: body.description || '',
      addons: body.addons || []
    };

    // Sync the new product to Firebase Firestore under the hotel-specific subcollection
    await setDoc(doc(firestoreDb, 'hotels', hotelCode, 'pos_products', customId), newProductData);

    // Return the newly created product format matching the frontend's expectations
    return NextResponse.json({
      id: customId,
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
    console.error('Error creating product in Firestore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
