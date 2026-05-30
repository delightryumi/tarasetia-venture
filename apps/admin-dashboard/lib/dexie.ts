import { useState, useEffect } from 'react';

export interface LocalProduct {
  id: string; // UUID
  restoId: string;
  name: string;
  price: number;
  stock: number;
  cat: string;
  image?: string;
}

export interface LocalTransaction {
  id: string; // UUIDv4
  restoId: string;
  totalPrice: number;
  createdAt: string; // ISO string
  isSynced: number; // 0 = unsynced, 1 = synced
  revenueType?: string;
}

export interface LocalTransactionItem {
  id?: string;
  transactionId: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

const DEFAULT_PRODUCTS: LocalProduct[] = [
  { id: "p1", restoId: "default-resto", name: "Nasi Goreng Anyom", price: 125000, stock: 99, cat: "Food", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=500&auto=format&fit=crop" },
  { id: "p2", restoId: "default-resto", name: "Wagyu Ribeye Sate", price: 285000, stock: 50, cat: "Food", image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=500&auto=format&fit=crop" },
  { id: "p3", restoId: "default-resto", name: "Nexura Golden Sunset Mocktail", price: 85000, stock: 150, cat: "Beverage", image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=500&auto=format&fit=crop" },
  { id: "p4", restoId: "default-resto", name: "Premium Royal Black Tea", price: 65000, stock: 200, cat: "Beverage", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=500&auto=format&fit=crop" },
  { id: "p5", restoId: "default-resto", name: "Executive Meeting Room A (4h)", price: 1500000, stock: 10, cat: "Meeting Room", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=500&auto=format&fit=crop" },
  { id: "p6", restoId: "default-resto", name: "Grand Ballroom B (Half Day)", price: 5000000, stock: 5, cat: "Meeting Room", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=500&auto=format&fit=crop" },
  { id: "p7", restoId: "default-resto", name: "Truffle Mushroom Soup", price: 95000, stock: 80, cat: "Food", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=500&auto=format&fit=crop" },
  { id: "p8", restoId: "default-resto", name: "Artisan Matcha Latte", price: 75000, stock: 120, cat: "Beverage", image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=500&auto=format&fit=crop" }
];

class MockTable<T extends { id?: string }> {
  private key: string;
  private isProductTable: boolean;

  constructor(key: string, isProductTable = false) {
    this.key = key;
    this.isProductTable = isProductTable;
  }

  private getData(): T[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.key);
    if (!data) {
      if (this.isProductTable) {
        localStorage.setItem(this.key, JSON.stringify(DEFAULT_PRODUCTS));
        return DEFAULT_PRODUCTS as unknown as T[];
      }
      return [];
    }
    return JSON.parse(data);
  }

  private saveData(data: T[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.key, JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('dexie-update-' + this.key));
  }

  async toArray(): Promise<T[]> {
    return this.getData();
  }

  async clear(): Promise<void> {
    this.saveData([]);
  }

  async bulkPut(items: T[]): Promise<void> {
    const data = this.getData();
    items.forEach(item => {
      if (!item.id) {
        item.id = Math.random().toString(36).substring(2, 9);
      }
      const idx = data.findIndex(d => d.id === item.id);
      if (idx !== -1) {
        data[idx] = item;
      } else {
        data.push(item);
      }
    });
    this.saveData(data);
  }

  async put(item: T): Promise<void> {
    await this.bulkPut([item]);
  }

  async get(id: string): Promise<T | undefined> {
    const data = this.getData();
    return data.find(d => d.id === id);
  }

  async update(id: string, changes: Partial<T>): Promise<boolean> {
    const data = this.getData();
    const idx = data.findIndex(d => d.id === id);
    if (idx !== -1) {
      data[idx] = { ...data[idx], ...changes };
      this.saveData(data);
      return true;
    }
    return false;
  }

  where(field: keyof T) {
    const data = this.getData();
    return {
      equals: (value: any) => ({
        toArray: async () => data.filter(d => d[field] === value)
      }),
      anyOf: (values: any[]) => ({
        modify: async (changes: Partial<T>) => {
          const updated = data.map(d => {
            if (values.includes(d[field])) {
              return { ...d, ...changes };
            }
            return d;
          });
          this.saveData(updated);
        }
      })
    };
  }
}

class MockDexieDB {
  products = new MockTable<LocalProduct>('pos_dexie_products', true);
  transactions = new MockTable<LocalTransaction>('pos_dexie_transactions');
  transactionItems = new MockTable<LocalTransactionItem>('pos_dexie_transaction_items');
}

export const localDb = new MockDexieDB();

export function useLiveQuery<T>(querier: () => Promise<T>, deps: any[] = []): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const runQuerier = async () => {
      const res = await querier();
      if (active) {
        setData(res);
      }
    };

    runQuerier();

    const handleUpdate = () => {
      runQuerier();
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('dexie-update-pos_dexie_products', handleUpdate);
    window.addEventListener('dexie-update-pos_dexie_transactions', handleUpdate);
    window.addEventListener('dexie-update-pos_dexie_transaction_items', handleUpdate);
    const interval = setInterval(runQuerier, 1500);

    return () => {
      active = false;
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('dexie-update-pos_dexie_products', handleUpdate);
      window.removeEventListener('dexie-update-pos_dexie_transactions', handleUpdate);
      window.removeEventListener('dexie-update-pos_dexie_transaction_items', handleUpdate);
      clearInterval(interval);
    };
  }, deps);

  return data;
}
