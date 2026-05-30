import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
  id: string; // UUID
  restoId: string;
  name: string;
  price: number;
  stock: number;
  cat: string; // matches CatProduct enum or category name
  subcategory?: string; // subcategory within the category
  image?: string;
}

export interface LocalTransaction {
  id: string; // UUIDv4
  restoId: string;
  totalPrice: number;
  createdAt: string; // ISO string or Unix timestamp
  isSynced: number; // 0 = unsynced, 1 = synced
  revenueType?: string; // "alacarte" or "banquet"
  paymentMethod?: string;
}

export interface LocalTransactionItem {
  id?: string; // Auto-increment or UUID
  transactionId: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

class POSDexieDB extends Dexie {
  products!: Table<LocalProduct>;
  transactions!: Table<LocalTransaction>;
  transactionItems!: Table<LocalTransactionItem>;

  constructor() {
    super('POSDexieDB');
    this.version(1).stores({
      products: 'id, restoId, cat',
      transactions: 'id, restoId, isSynced, createdAt',
      transactionItems: '++id, transactionId, productId',
    });
    // Version 2: added subcategory field to products
    this.version(2).stores({
      products: 'id, restoId, cat, subcategory',
      transactions: 'id, restoId, isSynced, createdAt',
      transactionItems: '++id, transactionId, productId',
    });
  }
}

export const localDb = new POSDexieDB();
