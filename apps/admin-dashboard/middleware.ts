import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const url = request.nextUrl.clone();

  // Deteksi subdomain absensi (di live maupun local testing)
  const isAttendanceDomain =
    hostname === "staff.mytara.id" ||
    hostname === "staff.localhost" ||
    hostname.endsWith(".staff.localhost");

  if (isAttendanceDomain) {
    // 1. Jika membuka root "/", belokkan secara internal ke "/attendance"
    if (url.pathname === "/") {
      url.pathname = "/attendance";
      return NextResponse.rewrite(url);
    }

    // 2. Jika memuat manifest absensi, belokkan ke API dynamic manifest
    if (url.pathname === "/manifest-attendance.json") {
      url.pathname = "/api/manifest-attendance";
      return NextResponse.rewrite(url);
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
  ],
};
