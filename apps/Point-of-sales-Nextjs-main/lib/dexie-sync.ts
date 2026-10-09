import axios from 'axios';
import { localDb } from './dexie';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getHotelCollection } from './firestoreHelper';

/**
 * Offline sync disabled: App runs full online realtime.
 * Kept as no-op to prevent breaking existing caller signatures.
 */
export async function syncProductsFromServer(restoId?: string) {
  // Offline sync disabled to preserve real-time state and eliminate redundant reads
  return;
}

/**
 * Offline transaction sync disabled: App runs full online realtime directly against Firestore.
 */
export async function syncUnsyncedTransactions() {
  return;
}

/**
 * Offline network listener disabled.
 */
export function registerNetworkSync() {
  // No-op
}
