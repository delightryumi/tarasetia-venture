import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "tara-attendance",
    name: "Tara Absensi",
    short_name: "Tara Absensi",
    description: "Portal Absensi Karyawan Tara",
    start_url: "/attendance",
    scope: "/attendance",
    display: "standalone",
    background_color: "#ffffff",
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
  });
}
