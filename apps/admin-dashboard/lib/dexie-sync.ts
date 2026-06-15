import { localDb } from './dexie';
import { db } from './firebase';
import { getHotelCollection } from './firestoreHelper';
import { getDocs, query, orderBy } from 'firebase/firestore';

export async function syncProductsFromServer(restoId: string) {
  if (typeof window === 'undefined' || !navigator.onLine) {
    console.warn('Sync skipped: browser is offline or running on server');
    return;
  }

  try {
    const q = query(getHotelCollection(db, "pos_products"), orderBy("name"));
    const snap = await getDocs(q);
    const localProducts: any[] = [];

    snap.forEach((doc) => {
      const data = doc.data();
      localProducts.push({
        id: doc.id,
        restoId: restoId || 'default-resto',
        name: data.name || 'Unnamed Product',
        price: Number(data.price) || 0,
        stock: Number(data.stock) || 0,
        cat: data.category || 'General',
        image: data.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
      });
    });

    if (localProducts.length > 0) {
      // Update the local database
      await localDb.products.clear();
      await localDb.products.bulkPut(localProducts);
      console.log('Successfully synced products from Firebase to local IndexedDB:', localProducts.length);
    }
  } catch (error) {
    console.error('Failed to sync products from Firebase:', error);
  }
}

export async function syncUnsyncedTransactions() {
  console.log('Checking for unsynced transactions...');
  try {
    const unsynced = await localDb.transactions.where('isSynced').equals(0).toArray();
    if (unsynced.length > 0) {
      const ids = unsynced.map(tx => tx.id);
      await localDb.transactions.where('id').anyOf(ids).modify({ isSynced: 1 });
      console.log('Synced transactions locally:', ids.length);
    }
  } catch (e) {
    console.error(e);
  }
}

export function registerNetworkSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('Network online. Triggering offline sync...');
    await syncUnsyncedTransactions();
  });
}
