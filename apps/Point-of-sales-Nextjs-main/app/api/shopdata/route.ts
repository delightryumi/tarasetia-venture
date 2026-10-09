export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// In-memory cache for POS shop settings (15-min TTL)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const posShopDataCache = new Map<string, CacheEntry<any>>();

export async function GET(req: NextRequest) {
  try {
    // Read hotelCode from cookies
    const hotelCode = req.cookies.get('hotelCode')?.value || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "";

    if (!hotelCode || hotelCode === "0") {
      return NextResponse.json({
        data: {
          id: 'pos',
          name: 'POS System',
          tax: 10,
          service: 0,
          lostBreakage: 0,
          address: '',
          phone: '',
          tables: '10',
        }
      }, { status: 200 });
    }

    const now = Date.now();
    const cached = posShopDataCache.get(hotelCode);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json({ data: cached.data }, {
        status: 200,
        headers: { 'X-Cache': 'HIT', 'Cache-Control': 'private, max-age=900' }
      });
    }

    // Attempt to read POS shop settings from Firestore under hotels/{hotelCode}/settings/pos
    const posSettingsRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
    const posSettingsSnap = await getDoc(posSettingsRef);

    let shopData = {
      id: 'pos',
      name: 'POS System',
      tax: 10,
      service: 0,
      lostBreakage: 0,
      address: '',
      phone: '',
      tables: '10',
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
        tables: data.tables || '10',
      };
    } else {
      // Fallback: Check if we can read from footer settings for branding
      const footerSettingsRef = doc(db, 'hotels', hotelCode, 'settings', 'footer');
      const footerSettingsSnap = await getDoc(footerSettingsRef);
      if (footerSettingsSnap.exists()) {
        const fData = footerSettingsSnap.data();
        shopData.name = fData.companyName || shopData.name;
        shopData.address = fData.address || shopData.address;
        shopData.phone = fData.phone || shopData.phone;
      }
    }

    posShopDataCache.set(hotelCode, {
      data: shopData,
      expiresAt: now + 15 * 60 * 1000 // 15 min TTL
    });

    return NextResponse.json({ data: shopData }, {
      status: 200,
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'private, max-age=900' }
    });
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
      tables: '10',
    };
    return NextResponse.json({ data: fallbackData }, { status: 200 });
  }
}
