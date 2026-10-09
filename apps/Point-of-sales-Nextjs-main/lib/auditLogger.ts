import { db } from "./firebase";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { getHotelCollection } from "./firestoreHelper";

export type AuditCategory =
  | "POS"
  | "RESERVATIONS"
  | "RATES"
  | "INVENTORY"
  | "USERS"
  | "SECURITY";

export interface AuditActor {
  uid: string;
  name: string;
  email: string;
  role: string;
}

export interface AuditLogEntry {
  id?: string;
  hotelCode: string;
  hotelName?: string;
  actor: AuditActor;
  category: AuditCategory;
  action: string;
  description: string;
  targetId?: string;
  targetName?: string;
  diff?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt?: any;
}

export async function logAuditEvent(
  entry: Omit<AuditLogEntry, "id" | "createdAt">
): Promise<string | null> {
  try {
    const hotelCode = entry.hotelCode;
    if (!hotelCode || hotelCode === "0") return null;

    const colRef = getHotelCollection(db, "audit_logs", hotelCode);
    const docRef = await addDoc(colRef, {
      ...entry,
      createdAt: serverTimestamp(),
      isoTimestamp: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Failed to write audit log:", err);
    return null;
  }
}
