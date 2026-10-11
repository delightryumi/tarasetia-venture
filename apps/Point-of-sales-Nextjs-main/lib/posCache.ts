// Centralized in-memory cache definitions for POS services to allow cache invalidation

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// 1. Shop Data Cache
export const posShopDataCache = new Map<string, CacheEntry<any>>();

export function invalidateShopDataCache(hotelCode?: string) {
  if (hotelCode) {
    posShopDataCache.delete(hotelCode);
  } else {
    posShopDataCache.clear();
  }
}

// 2. Product Sale Report Cache
export const posProductSaleCache = new Map<string, CacheEntry<any>>();
export const posProductMetaCache = new Map<string, CacheEntry<{ productMap: any; subcatToParentMap: any; taxRate: number }>>();

export function invalidateProductSaleCache(hotelCode?: string) {
  if (hotelCode) {
    posProductMetaCache.delete(hotelCode);
    for (const key of posProductSaleCache.keys()) {
      if (key.startsWith(`${hotelCode}_`)) {
        posProductSaleCache.delete(key);
      }
    }
  } else {
    posProductMetaCache.clear();
    posProductSaleCache.clear();
  }
}
