import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  deleteDoc
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { StoreRequisition } from "../../lib/purchasing/types";
import { generateDocNumber } from "../../lib/purchasing/utils";
import { getHotelCollection } from "../../lib/firestoreHelper";

const COLLECTION_NAME = "store_requisitions";

export const srService = {
  async getAll(): Promise<StoreRequisition[]> {
    const q = query(
      getHotelCollection(db, COLLECTION_NAME), 
      where("is_deleted", "!=", true)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as StoreRequisition))
      .filter(d => d.is_deleted !== true);
  },

  async getById(id: string): Promise<StoreRequisition | null> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    const snap = await getDoc(docRef);
    if (!snap.exists() || snap.data().is_deleted) return null;
    return { id: snap.id, ...snap.data() } as StoreRequisition;
  },

  async create(sr: Omit<StoreRequisition, "id" | "sr_number" | "created_at" | "updated_at">): Promise<string> {
    const srNumber = await generateDocNumber("SR");
    const docRef = await addDoc(getHotelCollection(db, COLLECTION_NAME), {
      ...sr,
      sr_number: srNumber,
      is_deleted: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, sr: Partial<StoreRequisition>): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      ...sr,
      updated_at: serverTimestamp()
    });
  },

  async softDelete(id: string): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      is_deleted: true,
      updated_at: serverTimestamp()
    });
  },

  // Hard delete: permanently remove document, allowed for any status
  async hardDelete(id: string): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await deleteDoc(docRef);
  },

  async seedDemoSRs(items: any[]): Promise<void> {
    const q = query(getHotelCollection(db, COLLECTION_NAME));
    const snap = await getDocs(q);
    if (!snap.empty) return;

    if (items.length === 0) return;

    const unitPrice = items[0].last_purchase_price || 25000;
    const qty = 5;
    const total = qty * unitPrice;

    const demoSR: Omit<StoreRequisition, "id" | "sr_number" | "created_at" | "updated_at"> = {
      department: "Housekeeping",
      requested_by: "Demo User",
      requested_by_name: "John Doe",
      status: "submitted",
      items: [
        {
          item_id: items[0].id || "1",
          name: items[0].name,
          unit: items[0].unit,
          qty_requested: qty,
          qty_fulfilled: 0,
          unit_price: unitPrice,
          total: total,
          notes: "Need urgent replacement for rooms"
        }
      ],
      total_cost: total,
      approved_by: null,
      notes: "Monthly room cleaning supplies replenish"
    };

    await this.create(demoSR);
  }
};
