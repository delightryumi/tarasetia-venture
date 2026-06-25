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
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.hotelCode) {
            code = parsed.hotelCode;
          }
        }
      } catch (e) {
        console.error("Error reading user from localStorage", e);
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

  // Guard: if code is empty/falsy, or matches invalid dummy code, throw an error to prevent data contamination
  if (!code || code.trim() === "" || code === "87241") {
    throw new Error(`Invalid Hotel Code "${code}". Action denied to prevent data contamination.`);
  }

  return collection(db, `hotels/${code}/${collectionName}`);
}
