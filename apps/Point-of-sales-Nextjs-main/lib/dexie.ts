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
  description?: string;
  addons?: any[];
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

export interface LocalHeldOrder {
  id: string;
  customerName: string;
  tableNumber: string;
  notes: string;
  cart: any[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  payableAmount: number;
  createdAt: string;
  restoId: string;
  cashierName: string;
}

class POSDexieDB extends Dexie {
  products!: Table<LocalProduct>;
  transactions!: Table<LocalTransaction>;
  transactionItems!: Table<LocalTransactionItem>;
  heldOrders!: Table<LocalHeldOrder>;

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
    // Version 3: added heldOrders table for Hold Bill feature
    this.version(3).stores({
      products: 'id, restoId, cat, subcategory',
      transactions: 'id, restoId, isSynced, createdAt',
      transactionItems: '++id, transactionId, productId',
      heldOrders: 'id, customerName, tableNumber, createdAt',
    });
  }
}

export const localDb = new POSDexieDB();
