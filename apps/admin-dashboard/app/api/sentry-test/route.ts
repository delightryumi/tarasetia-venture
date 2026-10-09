import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { sendDiscordAlert } from "@/lib/discordNotifier";

export async function GET() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  
  if (!dsn) {
    return NextResponse.json(
      {
        status: "waiting_for_dsn",
        message: "NEXT_PUBLIC_SENTRY_DSN belum diisi di file .env.local.",
        hint: "Daftar gratis di sentry.io, buat project Next.js, lalu masukkan DSN ke .env.local",
      },
      { status: 400 }
    );
  }

  const testError = new Error("Uji Coba Notifikasi Discord Tara CRS: Sistem Monitoring Error Aktif");
  // 1. Kirim issue exception pengetesan ke Sentry.io
  const eventId = Sentry.captureException(testError);

  // 2. Kirim notifikasi embed real-time langsung ke Discord
  const discordDelivered = await sendDiscordAlert({
    title: "Uji Coba Sistem Monitoring Error",
    message: testError.message,
    stack: testError.stack,
    level: "error",
    source: "backend",
    url: "/api/sentry-test",
    eventId: eventId ? String(eventId) : undefined,
  });

  return NextResponse.json({
    status: "connected",
    message: "Event test exception berhasil dikirim ke Sentry.io dan Discord secara real-time!",
    eventId,
    discordDelivered,
    dsnPrefix: dsn.substring(0, 16) + "...",
  });
}

