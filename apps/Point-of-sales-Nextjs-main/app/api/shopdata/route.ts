export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    // Attempt to read POS shop settings from Firestore settings/pos
    const posSettingsRef = doc(db, 'settings', 'pos');
    const posSettingsSnap = await getDoc(posSettingsRef);

    let shopData = {
      id: 'pos',
      name: 'Bumi Anyom Resort POS',
      tax: 10,
      service: 0,
      lostBreakage: 0,
      address: 'Bumi Anyom Resort, Indonesia',
      phone: '+62 123-4567-890',
    };

    if (posSettingsSnap.exists()) {
      const data = posSettingsSnap.data();
      shopData = {
        id: 'pos',
        name: data.name || shopData.name,
        tax: (data.tax !== undefined && data.tax !== null && !isNaN(Number(data.tax))) ? Number(data.tax) : shopData.tax,
        service: (data.service !== undefined && data.service !== null && !isNaN(Number(data.service))) ? Number(data.service) : 0,
        lostBreakage: (data.lostBreakage !== undefined && data.lostBreakage !== null && !isNaN(Number(data.lostBreakage))) ? Number(data.lostBreakage) : 0,
        address: data.address || shopData.address,
        phone: data.phone || shopData.phone,
      };
    } else {
      // Fallback: Check if we can read from footer settings for branding
      const footerSettingsRef = doc(db, 'settings', 'footer');
      const footerSettingsSnap = await getDoc(footerSettingsRef);
      if (footerSettingsSnap.exists()) {
        const fData = footerSettingsSnap.data();
        shopData.name = fData.companyName || shopData.name;
        shopData.address = fData.address || shopData.address;
        shopData.phone = fData.phone || shopData.phone;
      }
    }

    return NextResponse.json({ data: shopData }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching shop data from Firestore:', error);
    
    // Return default shop data instead of 500 to ensure client works offline/online seamlessly
    const fallbackData = {
      id: 'pos',
      name: 'Bumi Anyom Resort POS',
      tax: 10,
      service: 0,
      lostBreakage: 0,
      address: 'Bumi Anyom Resort, Indonesia',
      phone: '+62 123-4567-890',
    };
    return NextResponse.json({ data: fallbackData }, { status: 200 });
  }
}
