import { NextResponse } from "next/server";
import { sendDiscordAlert } from "@/lib/discordNotifier";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const success = await sendDiscordAlert({
      title: body.title || "Frontend Error Alert",
      message: body.message || "An error occurred on the frontend",
      stack: body.stack,
      level: body.level || "error",
      source: body.source || "frontend",
      url: body.url,
      eventId: body.eventId,
      userEmail: body.userEmail,
      hotelCode: body.hotelCode,
    });

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
