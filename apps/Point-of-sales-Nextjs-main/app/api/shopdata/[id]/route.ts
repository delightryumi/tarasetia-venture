import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

import { cookies } from 'next/headers';

import { invalidateShopDataCache, invalidateProductSaleCache } from '@/lib/posCache';
import { invalidateRecordsTaxCache } from '@/data/records';

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Read hotelCode from body, query, cookie or header
    const { searchParams } = new URL(request.url);
    const searchHotelCode = searchParams.get('hotelCode');
    const cookieStore = await cookies();
    const cookieHotelCode = cookieStore.get('hotelCode')?.value;
    const headerHotelCode = request.headers.get('x-hotel-code');
    const hotelCode = body?.hotelCode || searchHotelCode || cookieHotelCode || headerHotelCode || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE;
    if (!hotelCode || hotelCode === "0") {
      return NextResponse.json({ error: 'Hotel code is missing or invalid' }, { status: 400 });
    }

    const posSettingsRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');

    const updateData: Record<string, any> = {};

    if ('storeName' in body) {
      updateData.name = body.storeName;
    }
    if ('tax' in body) {
      updateData.tax = Number(body.tax);
    }
    if ('service' in body) {
      updateData.service = Number(body.service);
    }
    if ('lostBreakage' in body) {
      updateData.lostBreakage = Number(body.lostBreakage);
    }
    if ('address' in body) {
      updateData.address = body.address;
    }
    if ('phone' in body) {
      updateData.phone = body.phone;
    }
    if ('tables' in body) {
      updateData.tables = body.tables;
    }

    if (Object.keys(updateData).length > 0) {
      await setDoc(posSettingsRef, updateData, { merge: true });
      invalidateShopDataCache(hotelCode);
      invalidateProductSaleCache(hotelCode);
      await invalidateRecordsTaxCache(hotelCode);
      return NextResponse.json({ success: true, ...updateData }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating shop data in Firestore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
