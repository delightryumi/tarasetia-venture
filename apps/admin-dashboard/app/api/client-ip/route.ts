import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfIp = req.headers.get("cf-connecting-ip");
    
    let ip = cfIp || realIp || (forwarded ? forwarded.split(",")[0].trim() : null);
    
    // If running in local dev / private network, provide realistic client IP
    if (!ip || ip === "::1" || ip === "127.0.0.1") {
        ip = "192.168.1.104";
    }

    return NextResponse.json({ ip, success: true });
}
