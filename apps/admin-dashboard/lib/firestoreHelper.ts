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
        const activeCode = localStorage.getItem("active_hotel_code");
        if (activeCode) {
          code = activeCode;
        } else {
          const storedUser = localStorage.getItem("auth_user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed && parsed.hotelCode) {
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
  if (!code) {
    code = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "";
  }

  // If code is "root", return the root collection for backwards compatibility / local testing
  if (code === "root") {
    return collection(db, collectionName);
  }

  return collection(db, `hotels/${code}/${collectionName}`);
}
