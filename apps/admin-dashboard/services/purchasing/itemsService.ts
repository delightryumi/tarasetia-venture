import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp, setDoc
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { ItemMaster } from "../../lib/purchasing/types";

const COLLECTION_NAME = "items";

export const itemsService = {
  async getAll(): Promise<ItemMaster[]> {
    const q = query(collection(db, COLLECTION_NAME), where("is_deleted", "!=", true));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ItemMaster))
      .filter(d => d.is_deleted !== true);
  },

  async getById(id: string): Promise<ItemMaster | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists() || snap.data().is_deleted) return null;
    return { id: snap.id, ...snap.data() } as ItemMaster;
  },

  async create(item: Omit<ItemMaster, "id" | "created_at" | "updated_at">): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...item,
      is_deleted: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, item: Partial<ItemMaster>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...item,
      updated_at: serverTimestamp()
    });
  },

  async softDelete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      is_deleted: true,
      updated_at: serverTimestamp()
    });
  },

  // Helper to seeds demo item data
  async seedDemoItems(): Promise<void> {
    const demoItems: Omit<ItemMaster, "created_at" | "updated_at">[] = [
      { item_code: "ITM-VEG-001", name: "Fresh Tomatoes", category: "Vegetables", unit: "kg", min_stock: 5, current_stock: 12, last_purchase_price: 15000, is_active: true, procurement_module: "DML", is_deleted: false },
      { item_code: "ITM-VEG-002", name: "Organic Spinach", category: "Vegetables", unit: "kg", min_stock: 3, current_stock: 2, last_purchase_price: 18000, is_active: true, procurement_module: "DML", is_deleted: false },
      { item_code: "ITM-DRY-001", name: "Jasmine Rice 20kg", category: "Dry Goods & Groceries", unit: "bag", min_stock: 2, current_stock: 4, last_purchase_price: 320000, is_active: true, procurement_module: "SR", is_deleted: false },
      { item_code: "ITM-BEV-001", name: "Mineral Water 600ml", category: "Beverages", unit: "box", min_stock: 10, current_stock: 15, last_purchase_price: 48000, is_active: true, procurement_module: "SR", is_deleted: false },
      { item_code: "ITM-HSK-001", name: "Liquid Bath Soap 5L", category: "Housekeeping Supplies", unit: "can", min_stock: 4, current_stock: 1, last_purchase_price: 125000, is_active: true, procurement_module: "SR", is_deleted: false },
      { item_code: "ITM-AST-001", name: "Heavy Duty Kitchen Mixer", category: "Kitchen Equipment", unit: "unit", min_stock: 1, current_stock: 1, last_purchase_price: 3500000, is_active: true, procurement_module: "PR", is_deleted: false },
      { item_code: "ITM-AST-002", name: "Aluminium Baking Sheet (Loyang)", category: "Kitchen Equipment", unit: "pcs", min_stock: 5, current_stock: 10, last_purchase_price: 75000, is_active: true, procurement_module: "PR", is_deleted: false },
      { item_code: "ITM-AST-003", name: "Nylon Broom (Sapu)", category: "Housekeeping Equipment", unit: "pcs", min_stock: 2, current_stock: 4, last_purchase_price: 25000, is_active: true, procurement_module: "PR", is_deleted: false },
    ];

    const currentItems = await this.getAll();
    for (const item of demoItems) {
      const exists = currentItems.some(i => i.item_code === item.item_code);
      if (!exists) {
        await this.create(item);
      }
    }
  },

  async getCategories(): Promise<string[]> {
    const q = collection(db, "item_categories");
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().name as string);
  },

  async addCategory(name: string): Promise<void> {
    const cleanName = name.trim();
    if (!cleanName) return;
    const docRef = doc(db, "item_categories", cleanName.toLowerCase());
    await setDoc(docRef, { name: cleanName, created_at: serverTimestamp() });
  },

  async getUnits(): Promise<string[]> {
    const q = collection(db, "item_units");
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().name as string);
  },

  async addUnit(name: string): Promise<void> {
    const cleanName = name.trim();
    if (!cleanName) return;
    const docRef = doc(db, "item_units", cleanName.toLowerCase());
    await setDoc(docRef, { name: cleanName, created_at: serverTimestamp() });
  }
};

