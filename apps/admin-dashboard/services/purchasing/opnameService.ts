import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp, setDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { StockOpname } from "../../lib/purchasing/types";

const COLLECTION_NAME = "stock_opnames";

export const opnameService = {
  async getAll(): Promise<StockOpname[]> {
    const q = query(collection(db, COLLECTION_NAME), where("is_deleted", "!=", true));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as StockOpname))
      .filter(d => d.is_deleted !== true);
  },

  async getById(id: string): Promise<StockOpname | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists() || snap.data().is_deleted) return null;
    return { id: snap.id, ...snap.data() } as StockOpname;
  },

  async create(opname: Omit<StockOpname, "id" | "created_at" | "approved_at">): Promise<string> {
    // Enforce single opname per period: check if already exists
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("period", "==", opname.period),
      where("is_deleted", "!=", true)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error(`A stock opname record already exists for period ${opname.period}`);
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...opname,
      is_deleted: false,
      created_at: serverTimestamp(),
      approved_at: null
    });
    return docRef.id;
  },

  async update(id: string, opname: Partial<StockOpname>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...opname,
      updated_at: serverTimestamp()
    });
  },

  async approve(id: string, approvedBy: string, approvedByName: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status: "approved",
      approved_by: approvedBy,
      approved_by_name: approvedByName,
      approved_at: serverTimestamp()
    });
  },

  async softDelete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      is_deleted: true
    });
  },

  async seedDemoOpnames(items: any[]): Promise<void> {
    const q = query(collection(db, COLLECTION_NAME));
    const snap = await getDocs(q);
    if (!snap.empty) return;

    if (items.length === 0) return;

    const currentYearMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-05"

    const demoOpname: Omit<StockOpname, "id" | "created_at" | "approved_at"> = {
      period: currentYearMonth,
      status: "open",
      conducted_by: "Demo Inventory Controller",
      conducted_by_name: "Staff Alex",
      approved_by: null,
      items: items.map(item => ({
        item_id: item.id || "1",
        name: item.name,
        unit: item.unit,
        system_qty: item.current_stock,
        physical_qty: item.current_stock, // Initialized as correct
        variance: 0,
        variance_type: "none",
        notes: "Matches system inventory level"
      }))
    };

    await this.create(demoOpname);
  }
};
