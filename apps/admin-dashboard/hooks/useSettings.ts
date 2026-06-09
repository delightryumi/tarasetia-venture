// apps/admin-dashboard/hooks/useSettings.ts
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface Branding {
  darkLogo?: string;
}

export interface PosInfo {
  name?: string;
  address?: string;
  phone?: string;
}

export interface SettingsData {
  branding: Branding;
  pos: PosInfo;
}

/**
 * Hook to fetch branding and POS configuration from Firestore.
 * Reads:
 *   - collection "settings", document "landingPage" (field darkLogo)
 *   - collection "settings", document "pos" (fields name, address, phone)
 */
export function useSettings() {
  const [data, setData] = useState<SettingsData>({ branding: {}, pos: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const landingRef = doc(db, 'settings', 'landingPage');
        const posRef = doc(db, 'settings', 'pos');
        const [landingSnap, posSnap] = await Promise.all([
          getDoc(landingRef),
          getDoc(posRef),
        ]);
        const branding: Branding = {
          darkLogo: landingSnap.exists() ? (landingSnap.data() as any).darkLogo : undefined,
        };
        const posData: PosInfo = posSnap.exists()
          ? (posSnap.data() as any)
          : {};
        setData({ branding, pos: posData });
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { branding: data.branding, pos: data.pos, loading };
}
