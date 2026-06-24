import axios from 'axios';
import { localDb } from './dexie';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getHotelCollection } from './firestoreHelper';

/**
 * Downloads products from the Firebase Firestore backend
 * and syncs them to the local IndexedDB database.
 */
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
        subcategory: data.subcategory || '',
        pnlTarget: data.pnlTarget || '',
        image: data.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
        description: data.description || '',
        addons: data.addons || []
      });
    });

    // Update the local database
    await localDb.products.clear();
    if (localProducts.length > 0) {
      await localDb.products.bulkPut(localProducts);
    }
    console.log('Successfully synced products from Firebase to local IndexedDB:', localProducts.length);
  } catch (error) {
    console.error('Failed to sync products from Firebase:', error);
  }
}

/**
 * Uploads all unsynced offline transactions stored in IndexedDB to the Postgres server.
 */
export async function syncUnsyncedTransactions() {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return;
  }

  try {
    // 1. Fetch unsynced transactions from local IndexedDB
    const unsyncedTxList = await localDb.transactions
      .where('isSynced')
      .equals(0)
      .toArray();

    if (unsyncedTxList.length === 0) {
      return;
    }

    console.log(`Found ${unsyncedTxList.length} unsynced transactions. Initiating sync...`);

    const transactionsPayload = [];

    // 2. Fetch items for each transaction and build payload
    for (const tx of unsyncedTxList) {
      const items = await localDb.transactionItems
        .where('transactionId')
        .equals(tx.id)
        .toArray();

      transactionsPayload.push({
        id: tx.id,
        restoId: tx.restoId,
        totalAmount: tx.totalPrice,
        createdAt: tx.createdAt,
        revenueType: tx.revenueType || 'alacarte',
        paymentMethod: tx.paymentMethod || 'cash',
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
        })),
      });
    }

    // 3. Post to backend sync endpoint
    const response = await axios.post('/api/sync', {
      transactions: transactionsPayload,
    });

    if (response.status === 200 && response.data.success) {
      const { syncedIds } = response.data;
      
      // 4. Update sync status in Dexie database
      await localDb.transactions
        .where('id')
        .anyOf(syncedIds)
        .modify({ isSynced: 1 });

      console.log('Successfully synced transactions to Postgres:', syncedIds.length);
    }
  } catch (error) {
    console.error('Error syncing transactions to server:', error);
  }
}

/**
 * Sets up listeners for network connectivity changes.
 * Automatically triggers transaction sync when online.
 */
export function registerNetworkSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('Network connected. Starting automatic offline sync...');
    await syncUnsyncedTransactions();
    
    // Also refresh products
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.restoId) {
        await syncProductsFromServer(user.restoId);
      }
    }
  });
}
