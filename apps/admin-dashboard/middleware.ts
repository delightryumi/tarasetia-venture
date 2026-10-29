import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const url = request.nextUrl.clone();

  // Cek apakah ini domain khusus staff (contoh: staff.mytara.id, staff.localhost)
  const isStaffDomain =
    hostname.startsWith("staff.") ||
    hostname === "staff.localhost";

  if (isStaffDomain) {
    // 1. Root "/" → redirect ke /attendance (parameter ?h= akan otomatis terbawa)
    if (url.pathname === "/") {
      url.pathname = "/attendance";
      return NextResponse.redirect(url);
    }

    // 2. Manifest absensi
    if (url.pathname === "/manifest-attendance.json") {
      url.pathname = "/api/manifest-attendance";
      return NextResponse.rewrite(url);
    }

    // 3. Izinkan hanya route absensi dan API absensi/cuti di domain staff.*
    const isAllowedStaffPath =
      url.pathname === "/attendance" ||
      url.pathname.startsWith("/attendance/") ||
      url.pathname.startsWith("/api/attendance") ||
      url.pathname.startsWith("/api/leave") ||
      url.pathname.startsWith("/api/manifest-attendance");

    if (!isAllowedStaffPath) {
      url.pathname = "/attendance";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware pada seluruh halaman aplikasi kecuali aset static Next.js & file gambar/publik
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|channels/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav)$).*)",
  ],
};
