import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface CatalogEntry {
  products: any[];
  categories: any[];
  version: number;
  expiresAt: number;
}

// In-memory catalog cache keyed by hotelCode
// Default TTL: 15 minutes. Instantly invalidated on menu creation/updates/deletions.
const catalogCache = new Map<string, CatalogEntry>();

export function getCachedCatalog(hotelCode: string): CatalogEntry | null {
  const entry = catalogCache.get(hotelCode);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    catalogCache.delete(hotelCode);
    return null;
  }
  return entry;
}

export function setCachedCatalog(hotelCode: string, products: any[], categories: any[]): CatalogEntry {
  const version = Date.now();
  const entry: CatalogEntry = {
    products,
    categories,
    version,
    expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes TTL
  };
  catalogCache.set(hotelCode, entry);
  return entry;
}

export async function invalidateCatalogCache(hotelCode: string) {
  if (!hotelCode || hotelCode === '0') return;
  catalogCache.delete(hotelCode);
  try {
    // Increment version in hotel profile so all connected clients know to refresh cache
    const hotelRef = doc(db, 'hotels', hotelCode);
    await updateDoc(hotelRef, {
      posCatalogVersion: Date.now()
    });
  } catch (err) {
    // If field doesn't exist or permissions prevent update, ignore safely
    console.warn(`Could not update posCatalogVersion on hotel ${hotelCode}:`, err);
  }
}
