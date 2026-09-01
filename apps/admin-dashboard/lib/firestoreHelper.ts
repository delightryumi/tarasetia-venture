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

  // If code is not explicitly passed, try to get it from environment variables or localStorage (client-side only)
  if (!code) {
    if (typeof window !== "undefined") {
      try {
        let activeCode = localStorage.getItem("active_hotel_code");
        if (activeCode === "87241") {
          localStorage.removeItem("active_hotel_code");
          activeCode = null;
        }
        if (activeCode) {
          code = activeCode;
        } else {
          const storedUser = localStorage.getItem("auth_user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed && parsed.hotelCode && parsed.hotelCode !== "87241") {
              code = parsed.hotelCode;
            }
          }
        }
      } catch (e) {
        console.error("Error reading localStorage", e);
      }
    }
  }

  // Fallback to environment variable or default
  if (!code || code === "87241") {
    code = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "";
  }

  // If code is "root", return the root collection for backwards compatibility / local testing
  if (code === "root") {
    return collection(db, collectionName);
  }

  // Fallback if code is missing or placeholder "0"
  if (!code || code.trim() === "" || code === "87241" || code === "0") {
    return collection(db, `hotels/_default/${collectionName}`);
  }

  return collection(db, `hotels/${code}/${collectionName}`);
}
