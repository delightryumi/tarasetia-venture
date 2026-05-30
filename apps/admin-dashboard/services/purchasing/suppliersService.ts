import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Supplier } from "../../lib/purchasing/types";

const COLLECTION_NAME = "suppliers";

export const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    const q = query(collection(db, COLLECTION_NAME), where("is_deleted", "!=", true));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Supplier))
      .filter(d => d.is_deleted !== true);
  },

  async getById(id: string): Promise<Supplier | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists() || snap.data().is_deleted) return null;
    return { id: snap.id, ...snap.data() } as Supplier;
  },

  async create(supplier: Omit<Supplier, "id" | "created_at" | "updated_at">): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...supplier,
      is_deleted: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, supplier: Partial<Supplier>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...supplier,
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

  async seedDemoSuppliers(): Promise<void> {
    const q = query(collection(db, COLLECTION_NAME));
    const snap = await getDocs(q);
    if (!snap.empty) return;

    const demoSuppliers: Omit<Supplier, "created_at" | "updated_at">[] = [
      { name: "Sinar Jaya Veggies", pic_name: "Budi Santoso", pic_contact: "081234567890", address: "Pasar Induk Kramat Jati Blok C/12", payment_terms: "COD", is_active: true, is_deleted: false },
      { name: "Mandiri Sembako", pic_name: "Dewi Lestari", pic_contact: "082199887766", address: "Jl. Hayam Wuruk No. 45, Jakarta", payment_terms: "Net 14", is_active: true, is_deleted: false },
      { name: "Indo Clean Supplies", pic_name: "Anton Wijaya", pic_contact: "081122334455", address: "Kawasan Industri MM2100 Cibitung", payment_terms: "Net 30", is_active: true, is_deleted: false },
    ];

    for (const supplier of demoSuppliers) {
      await this.create(supplier);
    }
  }
};
