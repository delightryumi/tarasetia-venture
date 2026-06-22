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

    // 3. Blokir akses ke halaman admin dashboard agar staff tidak bisa nyasar
    const isAdminRoute =
      url.pathname.startsWith("/select-module") ||
      url.pathname.startsWith("/login") ||
      url.pathname.startsWith("/superadmin") ||
      url.pathname.startsWith("/(dashboard)");

    if (isAdminRoute) {
      url.pathname = "/attendance";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware hanya pada route halaman, bukan aset static
     */
    "/",
    "/manifest-attendance.json",
    "/attendance/:path*",
    "/select-module",
    "/login",
    "/superadmin/:path*",
  ],
};
