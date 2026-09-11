// apps/admin-dashboard/hooks/useSettings.ts
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { useAuth } from '@/context/AuthContext';

export interface Branding {
  logoUrl?: string;
  lightLogo?: string;
  darkLogo?: string;
}

export interface PropertyInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface SettingsData {
  branding: Branding;
  pos: PropertyInfo;
  property: PropertyInfo;
}

/**
 * Hook to fetch branding and property configuration from Firestore.
 * Reads:
 *   - collection "settings", document "landingPage" (fields lightLogo, darkLogo)
 *   - collection "settings", document "pos" (fields name, address, phone)
 *   - collection "settings", document "footer" (fields address, phones, email)
 *   - document "hotels/{activeHotelCode}" (fields name, address, phone, email)
 */
export function useSettings() {
  const { activeHotelCode, activeHotelName } = useAuth();
  const [data, setData] = useState<SettingsData>({
    branding: {},
    pos: {},
    property: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const landingRef = doc(getHotelCollection(db, 'settings'), 'landingPage');
        const posRef = doc(getHotelCollection(db, 'settings'), 'pos');
        const footerRef = doc(getHotelCollection(db, 'settings'), 'footer');
        
        let hotelRef = null;
        let code = activeHotelCode;
        if (!code && typeof window !== 'undefined') {
          code = localStorage.getItem('active_hotel_code') || '';
        }
        if (code && code !== '0') {
          hotelRef = doc(db, 'hotels', code);
        }

        const [landingSnap, posSnap, footerSnap, hotelSnap] = await Promise.all([
          getDoc(landingRef),
          getDoc(posRef),
          getDoc(footerRef),
          hotelRef ? getDoc(hotelRef) : Promise.resolve(null),
        ]);

        const landingData = landingSnap.exists() ? (landingSnap.data() as any) : {};
        const posData = posSnap.exists() ? (posSnap.data() as any) : {};
        const footerData = footerSnap.exists() ? (footerSnap.data() as any) : {};
        const hotelData = hotelSnap && hotelSnap.exists() ? (hotelSnap.data() as any) : {};

        // Preferred colored/main logo is lightLogo (for white paper backgrounds), then darkLogo, then logoUrl
        const logoUrl = landingData.lightLogo || landingData.darkLogo || landingData.logoUrl || undefined;

        const propertyName = hotelData.name || (posData.name && posData.name !== 'Hotel' ? posData.name : '') || activeHotelName || 'BUMI ANYOM HOTEL';
        const propertyAddress = hotelData.address || posData.address || footerData.address || '';
        const propertyPhone = hotelData.phone || posData.phone || (footerData.phones && footerData.phones[0]) || footerData.phone || '';
        const propertyEmail = hotelData.email || posData.email || footerData.email || '';

        const branding: Branding = {
          logoUrl,
          lightLogo: landingData.lightLogo,
          darkLogo: landingData.darkLogo,
        };

        const property: PropertyInfo = {
          name: propertyName,
          address: propertyAddress,
          phone: propertyPhone,
          email: propertyEmail,
          website: hotelData.website || footerData.website || '',
        };

        setData({ branding, pos: property, property });
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [activeHotelCode, activeHotelName]);

  return { branding: data.branding, pos: data.pos, property: data.property, loading };
}
