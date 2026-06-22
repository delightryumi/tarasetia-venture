import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Home({ searchParams }: { searchParams: Promise<{ h?: string }> }) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isStaffDomain = host.startsWith("staff.") || host === "staff.localhost";

  if (isStaffDomain) {
    const resolvedParams = await searchParams;
    const hotelCode = resolvedParams.h || "";
    redirect(hotelCode ? `/attendance?h=${hotelCode}` : "/attendance");
  } else {
    redirect("/select-module");
  }
}
