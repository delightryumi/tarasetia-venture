import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp, setDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { StockOpname } from "../../lib/purchasing/types";
import { getHotelCollection } from "../../lib/firestoreHelper";

const COLLECTION_NAME = "stock_opnames";

export const opnameService = {
  async getAll(): Promise<StockOpname[]> {
    const snap = await getDocs(getHotelCollection(db, COLLECTION_NAME));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as StockOpname))
      .filter(d => d.is_deleted !== true);
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
    return docRef.id;
  },

  async update(id: string, opname: Partial<StockOpname>): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      ...opname,
      updated_at: serverTimestamp()
    });
  },

  async approve(id: string, approvedBy: string, approvedByName: string): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      status: "approved",
      approved_by: approvedBy,
      approved_by_name: approvedByName,
      approved_at: serverTimestamp()
    });
  },

  async softDelete(id: string): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      is_deleted: true
    });
  }
};
