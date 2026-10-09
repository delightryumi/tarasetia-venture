import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp, setDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { StockOpname } from "../../lib/purchasing/types";
import { getHotelCollection } from "../../lib/firestoreHelper";

const COLLECTION_NAME = "stock_opnames";

let opnameCache: { data: StockOpname[]; timestamp: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

export function invalidateOpnameCache() {
  opnameCache = null;
}

export const opnameService = {
  async getAll(forceRefresh = false): Promise<StockOpname[]> {
    if (!forceRefresh && opnameCache && Date.now() - opnameCache.timestamp < CACHE_TTL) {
      return opnameCache.data;
    }
    const q = query(getHotelCollection(db, COLLECTION_NAME), where("is_deleted", "!=", true));
    const snap = await getDocs(q);
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as StockOpname))
      .filter(d => d.is_deleted !== true);
    opnameCache = { data, timestamp: Date.now() };
    return data;
  },

  async getById(id: string): Promise<StockOpname | null> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    const snap = await getDoc(docRef);
    if (!snap.exists() || snap.data().is_deleted) return null;
    return { id: snap.id, ...snap.data() } as StockOpname;
  },

  async create(opname: Omit<StockOpname, "id" | "created_at" | "approved_at">): Promise<string> {
    // Enforce single opname per period per department
    const targetDept = opname.department || "Purchasing";
    const q = query(
      getHotelCollection(db, COLLECTION_NAME), 
      where("period", "==", opname.period),
      where("department", "==", targetDept),
      where("is_deleted", "!=", true)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error(`A stock opname record already exists for period ${opname.period} in department ${targetDept}`);
    }

    const docRef = await addDoc(getHotelCollection(db, COLLECTION_NAME), {
      ...opname,
      department: targetDept,
      is_deleted: false,
      created_at: serverTimestamp(),
      approved_at: null
    });
    opnameCache = null;
    return docRef.id;
  },

  async update(id: string, opname: Partial<StockOpname>): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      ...opname,
      updated_at: serverTimestamp()
    });
    opnameCache = null;
  },

  async approve(id: string, approvedBy: string, approvedByName: string): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      status: "approved",
      approved_by: approvedBy,
      approved_by_name: approvedByName,
      approved_at: serverTimestamp()
    });
    opnameCache = null;
  },

  async softDelete(id: string): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      is_deleted: true
    });
    opnameCache = null;
  }
};
