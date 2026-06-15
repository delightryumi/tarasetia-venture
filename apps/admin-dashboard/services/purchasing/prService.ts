import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { PurchaseRequisition } from "../../lib/purchasing/types";
import { generateDocNumber } from "../../lib/purchasing/utils";
import { getHotelCollection } from "../../lib/firestoreHelper";

const COLLECTION_NAME = "purchase_requisitions";

export const prService = {
  async getAll(): Promise<PurchaseRequisition[]> {
    const q = query(getHotelCollection(db, COLLECTION_NAME), where("is_deleted", "!=", true));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as PurchaseRequisition))
      .filter(d => d.is_deleted !== true);
  },

  async getById(id: string): Promise<PurchaseRequisition | null> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    const snap = await getDoc(docRef);
    if (!snap.exists() || snap.data().is_deleted) return null;
    return { id: snap.id, ...snap.data() } as PurchaseRequisition;
  },

  async create(pr: Omit<PurchaseRequisition, "id" | "pr_number" | "created_at" | "updated_at">): Promise<string> {
    const prNumber = await generateDocNumber("PR");
    const docRef = await addDoc(getHotelCollection(db, COLLECTION_NAME), {
      ...pr,
      pr_number: prNumber,
      is_deleted: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, pr: Partial<PurchaseRequisition>): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      ...pr,
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

  async seedDemoPRs(items: any[], suppliers: any[]): Promise<void> {
    const q = query(getHotelCollection(db, COLLECTION_NAME));
    const snap = await getDocs(q);
    if (!snap.empty) return;

    if (items.length === 0 || suppliers.length === 0) return;

    const demoPR: Omit<PurchaseRequisition, "id" | "pr_number" | "created_at" | "updated_at"> = {
      linked_sr_id: null,
      linked_sr_number: null,
      status: "submitted",
      items: [
        {
          item_id: items[2].id || "3",
          name: items[2].name,
          unit: items[2].unit,
          qty: 10,
          estimated_price: 320000,
          actual_price: 0,
          supplier_id: suppliers[1].id || "2",
          supplier_name: suppliers[1].name
        }
      ],
      total_estimated: 3200000,
      total_actual: 0,
      requested_by: "Demo User",
      requested_by_name: "Jane Doe",
      approved_by: null,
      delivery_date: null,
      notes: "Sembako restocking for Kitchen F&B store"
    };

    await this.create(demoPR);
  }
};
