import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { DailyMarketList } from "../../lib/purchasing/types";
import { generateDocNumber } from "../../lib/purchasing/utils";
import { getHotelCollection } from "../../lib/firestoreHelper";

const COLLECTION_NAME = "daily_market_lists";

export const dmlService = {
  async getAll(): Promise<DailyMarketList[]> {
    const q = query(getHotelCollection(db, COLLECTION_NAME), where("is_deleted", "!=", true));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as DailyMarketList))
      .filter(d => d.is_deleted !== true);
  },

  async getById(id: string): Promise<DailyMarketList | null> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    const snap = await getDoc(docRef);
    if (!snap.exists() || snap.data().is_deleted) return null;
    return { id: snap.id, ...snap.data() } as DailyMarketList;
  },

  async create(dml: Omit<DailyMarketList, "id" | "dml_number" | "created_at">): Promise<string> {
    const dmlNumber = await generateDocNumber("DML");
    const docRef = await addDoc(getHotelCollection(db, COLLECTION_NAME), {
      ...dml,
      dml_number: dmlNumber,
      is_deleted: false,
      created_at: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, dml: Partial<DailyMarketList>): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      ...dml,
      updated_at: serverTimestamp()
    });
  },

  async softDelete(id: string): Promise<void> {
    const docRef = doc(getHotelCollection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      is_deleted: true
    });
  },

  async seedDemoDMLs(items: any[]): Promise<void> {
    const q = query(getHotelCollection(db, COLLECTION_NAME));
    const snap = await getDocs(q);
    if (!snap.empty) return;

    if (items.length === 0) return;

    const dmlItems = [];
    let totalCost = 0;

    if (items[0]) {
        dmlItems.push({
            item_id: items[0].id || "1",
            category: items[0].category,
            name: items[0].name,
            unit: items[0].unit,
            qty_ordered: 10,
            qty_received: 0,
            unit_price: 15000,
            total: 150000
        });
        totalCost += 150000;
    }

    if (items[1]) {
        dmlItems.push({
            item_id: items[1].id || "2",
            category: items[1].category,
            name: items[1].name,
            unit: items[1].unit,
            qty_ordered: 5,
            qty_received: 0,
            unit_price: 18000,
            total: 90000
        });
        totalCost += 90000;
    }

    const demoDML: Omit<DailyMarketList, "id" | "dml_number" | "created_at"> = {
      date: serverTimestamp(),
      status: "draft",
      items: dmlItems,
      total_cost: totalCost,
      submitted_by: "Demo Chef",
      submitted_by_name: "Executive Chef Marco",
      verified_by: null,
      notes: "Daily fresh stock requirements for F&B Restaurant Breakfast Buffet"
    };

    await this.create(demoDML);
  }
};
