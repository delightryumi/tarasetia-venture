import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "";

  // Deteksi apakah dimuat dari subdomain absensi
  const isAttendanceDomain =
    host.includes("staff.mytara.id") ||
    host.includes("staff.localhost");

  const { searchParams } = new URL(request.url);
  const h = searchParams.get("h");

  // Jika diakses lewat subdomain, scope dan start_url adalah "/"
  // Jika lewat domain utama/lainnya, scope dan start_url adalah "/attendance"
  const scope = isAttendanceDomain ? "/" : "/attendance";
  let start_url = isAttendanceDomain ? "/" : "/attendance";

  if (h) {
    start_url += `?h=${h}`;
  }

  const manifest = {
    id: "tara-attendance",
    scope,
    start_url,
    name: "Tara Absensi",
    short_name: "Tara Absensi",
    description: "Portal Absensi Karyawan Tara",
    display: "standalone",
    background_color: "#F54B1E",
    theme_color: "#000000",
    icons: [
      {
        src: "/absensi-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/absensi-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
