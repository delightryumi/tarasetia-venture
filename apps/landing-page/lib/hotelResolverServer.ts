import { headers } from "next/headers";
import { resolveHotelFromHost, HotelData } from "./hotelResolver";

export async function getServerSideHotel(): Promise<HotelData | null> {
  let host = "";
  try {
    const headersList = await headers();
    host = headersList.get("host") || "";
  } catch (e) {
    // Fallback if not running in Server Request context
  }
  return resolveHotelFromHost(host || "localhost");
}
