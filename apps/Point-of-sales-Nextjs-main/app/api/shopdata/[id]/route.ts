import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const posSettingsRef = doc(db, 'settings', 'pos');

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

    if (Object.keys(updateData).length > 0) {
      await setDoc(posSettingsRef, updateData, { merge: true });
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
