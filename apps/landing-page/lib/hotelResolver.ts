import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface HotelData {
  hotelCode: string;
  name: string;
  active: boolean;
  domain: string;
  subdomain: string;
  address: string;
  phone: string;
  email: string;
  billing?: {
    plan: string;
    cycle: string;
    nextDueDate: string;
    status: string;
  };
}

// In-memory cache for resolved host mapping to avoid duplicate firestore calls
const hostCache: Record<string, HotelData | null> = {};

export async function resolveHotelFromHost(host: string): Promise<HotelData | null> {
  const cleanHost = host.split(":")[0].toLowerCase().trim();

  if (!cleanHost) return null;

  if (hostCache[cleanHost] !== undefined) {
    return hostCache[cleanHost];
  }

  // Fallback for local development
  const isLocal =
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "localhost.local" ||
    cleanHost.endsWith(".local");

  if (isLocal) {
    const defaultCode = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "1";
    try {
      const hotelDoc = await getDoc(doc(db, "hotels", defaultCode));
      if (hotelDoc.exists()) {
        const data = { ...hotelDoc.data(), hotelCode: defaultCode } as HotelData;
        hostCache[cleanHost] = data;
        return data;
      }
    } catch (e) {
      console.error("Local dev fallback error:", e);
    }
  }

  try {
    // 1. Try querying custom domain
    const qDomain = query(collection(db, "hotels"), where("domain", "==", cleanHost));
    const snapDomain = await getDocs(qDomain);
    if (!snapDomain.empty) {
      const data = snapDomain.docs[0].data() as HotelData;
      hostCache[cleanHost] = data;
      return data;
    }

    // 2. Try querying subdomain
    const qSub = query(collection(db, "hotels"), where("subdomain", "==", cleanHost));
    const snapSub = await getDocs(qSub);
    if (!snapSub.empty) {
      const data = snapSub.docs[0].data() as HotelData;
      hostCache[cleanHost] = data;
      return data;
    }

    // 3. Try checking if host is direct hotelCode (e.g. 1)
    const docRef = doc(db, "hotels", cleanHost);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as HotelData;
      hostCache[cleanHost] = data;
      return data;
    }
  } catch (err) {
    console.error("Error resolving hotel from host:", err);
  }

  // Final fallback to default hotel
  const defaultCode = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "1";
  try {
    const defaultDoc = await getDoc(doc(db, "hotels", defaultCode));
    if (defaultDoc.exists()) {
      const data = { ...defaultDoc.data(), hotelCode: defaultCode } as HotelData;
      hostCache[cleanHost] = data;
      return data;
    }
  } catch (e) {
    console.error("Error resolving default fallback hotel:", e);
  }

  hostCache[cleanHost] = null;
  return null;
}
