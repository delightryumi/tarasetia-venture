import { collection, CollectionReference, DocumentData } from "firebase/firestore";

/**
 * Gets a collection reference dynamically based on the hotel code.
 * If the hotel code is set to "root", it will fallback to the root collection.
 */
export function getHotelCollection(
  db: any,
  collectionName: string,
  hotelCode?: string
): CollectionReference<DocumentData> {
  let code = hotelCode;

  // Client-side detection: try to read from sessionStorage/localStorage
  if (!code && typeof window !== "undefined") {
    try {
      const activeCode = sessionStorage.getItem("active_hotel_code") || localStorage.getItem("active_hotel_code");
      if (activeCode) {
        code = activeCode;
      }
    } catch (e) {
      console.error("Error reading storage in getHotelCollection", e);
    }
  }

  // Fallback to environment variable or default
  if (!code) {
    code = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "";
  }

  // If code is "root", return the root collection for backwards compatibility / local testing
  if (code === "root") {
    return collection(db, collectionName);
  }

  return collection(db, `hotels/${code}/${collectionName}`);
}
