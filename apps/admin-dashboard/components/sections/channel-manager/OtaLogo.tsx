"use client";

import React, { useState } from "react";

interface OtaLogoProps {
    code: string;
    name?: string;
    size?: number;
    className?: string;
}

const CHANNEL_IMAGE_MAP: Record<string, string> = {
    booking: "/channels/booking_com.png",
    booking_com: "/channels/booking_com.png",
    agoda: "/channels/agoda.png",
    traveloka: "/channels/traveloka.png",
    tiket: "/channels/tiket_com.png",
    tiket_com: "/channels/tiket_com.png",
    expedia: "/channels/expedia.png",
    airbnb: "/channels/airbnb.png",
    trip: "/channels/trip.png",
    trip_com: "/channels/trip.png",
    ctrip: "/channels/trip.png",
    mg: "/channels/mg.png",
    mg_bedbank: "/channels/mg.png",
    google: "/channels/google_hotel.png",
    google_hotel: "/channels/google_hotel.png",
    google_hotel_ads: "/channels/google_hotel.png",
    hotelbeds: "/channels/hotelbeds.png",
    webbeds: "/channels/webbeds.png",
    klook: "/channels/klook.png",
    hostelworld: "/channels/hostelworld.png",
    hopper: "/channels/hopper.png",
    dida: "/channels/dida.png",
    dida_travel: "/channels/dida.png",
    hipcamp: "/channels/hipcamp.png",
    walk_in: "/channels/walk_in.png",
    walkin: "/channels/walk_in.png",
};

function getChannelImagePath(normalized: string): string | null {
    if (CHANNEL_IMAGE_MAP[normalized]) return CHANNEL_IMAGE_MAP[normalized];
    for (const [key, path] of Object.entries(CHANNEL_IMAGE_MAP)) {
        if (normalized.includes(key)) {
            return path;
        }
    }
    return null;
}

/**
 * Authentic Pixel-Perfect Real Brand Logos for Global & Regional OTAs
 * Supports real official & AI images from /channels/, with SVG and Monogram fallbacks.
 */
export function OtaLogo({ code, name = "", size = 20, className = "" }: OtaLogoProps) {
    const [imgError, setImgError] = useState(false);
    const normalizedCode = (code || name || "").toLowerCase().replace(/[^a-z0-9]/g, "_");

    const containerStyle: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        verticalAlign: "middle",
        borderRadius: size >= 28 ? "8px" : size >= 20 ? "6px" : "4px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        background: "#ffffff"
    };

    // Check if we have an authentic real image asset available
    const imgPath = !imgError ? getChannelImagePath(normalizedCode) : null;
    if (imgPath) {
        return (
            <span
                className={className}
                style={{
                    ...containerStyle,
                    padding: size >= 32 ? "2px" : "1px",
                    boxSizing: "border-box",
                    border: "1px solid rgba(0,0,0,0.06)"
                }}
            >
                <img
                    src={imgPath}
                    alt={name || code}
                    onError={() => setImgError(true)}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: size >= 28 ? "6px" : size >= 20 ? "4px" : "2px",
                        display: "block"
                    }}
                />
            </span>
        );
    }

    // 1. Booking.com - Official Navy & Light Blue Dot Monogram
    if (normalizedCode.includes("booking")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#003580" />
                <path d="M9 8.5h8.6c3.2 0 5.4 1.8 5.4 4.3 0 1.9-1.2 3.4-2.9 4 2.2.6 3.5 2.2 3.5 4.4 0 3-2.5 5.3-5.9 5.3H9V8.5zm4.8 4v3.6h3.6c1.4 0 2.2-.8 2.2-1.8 0-1-.8-1.8-2.2-1.8h-3.6zm0 7.2v4.4h4c1.6 0 2.5-.9 2.5-2.2 0-1.3-.9-2.2-2.5-2.2h-4z" fill="#ffffff" />
                <circle cx="27" cy="24.5" r="2.6" fill="#006ce4" />
            </svg>
        );
    }

    // 2. Agoda - Official 5 Colorful Circles + Wordmark on Crisp White
    if (normalizedCode.includes("agoda")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="9" cy="11.5" r="3.2" fill="#eb2027" />
                <circle cx="18" cy="8" r="3.2" fill="#f7b928" />
                <circle cx="27" cy="11.5" r="3.2" fill="#26b99a" />
                <circle cx="13" cy="18" r="3.2" fill="#3075b5" />
                <circle cx="23" cy="18" r="3.2" fill="#92278f" />
                <path d="M8 27.5h2.4l.6 1.8h2.6l-2.9-7.5H9.3l-2.9 7.5h2.6l.6-1.8zm1.9-5.6l.8 2.7H8.5l.8-2.7zm6.2 5.1c-.9 0-1.6-.3-2-.9v.8h-2.1v-7.4h2.1v3c.4-.6 1.1-.9 2-.9 1.7 0 2.8 1.2 2.8 2.7s-1.1 2.7-2.8 2.7zm-.2-3.8c-.7 0-1.1.4-1.1 1s.4 1 1.1 1 1.1-.4 1.1-1-.4-1-1.1-1zm6.7 3.8c-1.7 0-2.9-1.2-2.9-2.7s1.2-2.7 2.9-2.7 2.9 1.2 2.9 2.7-1.2 2.7-2.9 2.7zm0-1.7c.7 0 1.1-.4 1.1-1s-.4-1-1.1-1-1.1.4-1.1 1 .4 1 1.1 1z" fill="#1e293b" />
            </svg>
        );
    }

    // 3. Traveloka - Official Vivid Blue with Soaring Swiftlet Bird
    if (normalizedCode.includes("traveloka")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#0194f3" />
                <path d="M7 19.5c2.5-4.3 7.8-8.8 15.3-10.1-3.6 2.9-6.1 6.8-6.5 10 3.9-1.6 8.2-1.3 12.2 1.4-5.1.2-9.3 2.7-11.5 6.2-1.4-2-4.1-4.3-9.5-7.5z" fill="#ffffff" />
                <circle cx="23.5" cy="13" r="1.8" fill="#ffffff" />
            </svg>
        );
    }

    // 4. Tiket.com - Official Tiket Yellow with Blue Round Monogram
    if (normalizedCode.includes("tiket")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#fedd00" />
                <circle cx="18" cy="18" r="11" fill="#0064d2" />
                <circle cx="23" cy="13" r="3.6" fill="#fedd00" />
                <path d="M14 15.5h4v9h-2.5v-6.5h-1.5v-2.5z" fill="#ffffff" />
            </svg>
        );
    }

    // 5. Expedia - Official Deep Navy with Golden Airplane Sweep
    if (normalizedCode.includes("expedia")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#00256c" />
                <circle cx="18" cy="18" r="11.5" fill="#ffd400" />
                <path d="M22.5 13.5l-7.5 2.2 2.2-7.5 10.1-4.8-4.8 10.1z" fill="#00256c" />
                <path d="M16 20l-1.8 4.8 4.8-1.8 5.5-5.5-3-3z" fill="#ffffff" />
            </svg>
        );
    }

    // 6. Airbnb - Official Rausch Red with Bélo Symbol
    if (normalizedCode.includes("airbnb")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#ff385c" />
                <path d="M18 7c-3.6 0-6.5 2.9-6.5 6.6 0 4.3 2.9 8.5 6.5 14.1 3.6-5.6 6.5-9.8 6.5-14.1 0-3.7-2.9-6.6-6.5-6.6zm0 9.2c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" fill="#ffffff" />
            </svg>
        );
    }

    // 7. Trip.com / Ctrip - Official Ocean Blue & Red Swoosh
    if (normalizedCode.includes("trip") || normalizedCode.includes("ctrip")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#2577e3" />
                <circle cx="18" cy="18" r="9" fill="#ffffff" />
                <path d="M12.5 18c0-3.1 2.5-5.6 5.6-5.6s5.6 2.5 5.6 5.6-2.5 5.6-5.6 5.6" stroke="#2577e3" strokeWidth="2.8" fill="none" />
                <circle cx="22" cy="14" r="2.3" fill="#e03b3b" />
            </svg>
        );
    }

    // 8. Google Hotel Search - Official 4-Color Google "G" Logo
    if (normalizedCode.includes("google")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <path d="M27.6 18.3c0-.7-.1-1.4-.2-2H18v3.8h5.4c-.2 1.2-1 2.3-2.1 3.1v2.6h3.4c2-1.9 2.9-4.6 2.9-7.5z" fill="#4285F4" />
                <path d="M18 28c2.8 0 5.2-.9 6.9-2.6l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.6 0-4.8-1.8-5.6-4.2H8.7v2.7C10.5 25.7 14 28 18 28z" fill="#34A853" />
                <path d="M12.4 19.6c-.2-.7-.3-1.4-.3-2.2s.1-1.5.3-2.2V12.5H8.7C8 13.9 7.6 15.6 7.6 17.4s.4 3.5 1.1 4.9l3.7-2.7z" fill="#FBBC05" />
                <path d="M18 11.1c1.5 0 2.9.5 4 1.5l3-3C23.1 7.8 20.8 7 18 7c-4 0-7.5 2.3-9.3 5.5l3.7 2.7c.8-2.4 3-4.1 5.6-4.1z" fill="#EA4335" />
            </svg>
        );
    }

    // 9. Hotelbeds Bedbank - Official Brand Coral Orange
    if (normalizedCode.includes("hotelbeds")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#ff5a00" />
                <path d="M9 13h3.5v11H9zm5.5 3.5h12.5V24H14.5zm2.5-3.5h8c1.2 0 2.2 1 2.2 2.2v1.3H17z" fill="#ffffff" />
                <circle cx="11.2" cy="10.8" r="1.7" fill="#ffffff" />
            </svg>
        );
    }

    // 10. WebBeds Global - Official Vibrant Cyan with Global Network Globe
    if (normalizedCode.includes("webbeds")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#00a3e0" />
                <circle cx="18" cy="18" r="8" stroke="#ffffff" strokeWidth="2.2" fill="none" />
                <ellipse cx="18" cy="18" rx="4" ry="8" stroke="#ffffff" strokeWidth="1.6" fill="none" />
                <line x1="10" y1="18" x2="26" y2="18" stroke="#ffffff" strokeWidth="1.6" />
            </svg>
        );
    }

    // 11. Klook Travel - Official Orange with Joyful Interlocking Smile
    if (normalizedCode.includes("klook")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#ff5722" />
                <circle cx="13.5" cy="13.5" r="3.4" fill="#ffffff" />
                <circle cx="22.5" cy="13.5" r="3.4" fill="#ffeb3b" />
                <path d="M10 21.5c2.2 3.4 5.6 4.5 8 4.5s5.8-1.1 8-4.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            </svg>
        );
    }

    // 12. Hostelworld - Official Tangerine Orange with Iconic H Logo
    if (normalizedCode.includes("hostelworld")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#ff6600" />
                <path d="M9 9h4.5v7h9V9H27v18h-4.5v-7h-9v7H9z" fill="#ffffff" />
            </svg>
        );
    }

    // 13. Hopper - Official Bunny Silhouette on Coral Pink
    if (normalizedCode.includes("hopper")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#ff6955" />
                <path d="M13.5 8c-1.1 0-2.2 2.2-1.7 6.1.6 3.3 2.8 5 2.8 5s-2.2 1.7-3.9 3.9c-1.7 2.2-.6 5 1.1 5 3.3 0 8.3-4.4 9.4-8.3 1.1-3.9 0-7.2-2.2-8.3.6-2.2-.6-3.3-2.2-3.3-1.1 0-1.7 1.1-1.7 2.2s-.6-2.2-1.6-2.3z" fill="#ffffff" />
            </svg>
        );
    }

    // 14. MG Bedbank - Official Crimson Red
    if (normalizedCode.includes("mg")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#d9251d" />
                <path d="M8 23V12l5 6 5-6v11M19 17.5h5c1.5 0 2.8 1.2 2.8 2.8S25.5 23 24 23H19V12h7.8" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
        );
    }

    // 15. Dida Travel - Official Flame Orange
    if (normalizedCode.includes("dida")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#f97316" />
                <path d="M11 23V13l11 5-11 5z" fill="#ffffff" />
                <circle cx="24" cy="18" r="2.5" fill="#ffffff" />
            </svg>
        );
    }

    // 16. Hipcamp - Outdoor Camping Green with Tent
    if (normalizedCode.includes("hipcamp")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#2d6a4f" />
                <path d="M18 9l10 17H8L18 9zm0 5l-5.5 9h11L18 14z" fill="#ffffff" />
            </svg>
        );
    }

    // 17. GlampingHub - Moss Green with Geodesic Dome
    if (normalizedCode.includes("glamping")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#588157" />
                <path d="M18 10a9 9 0 0 0-9 9h18a9 9 0 0 0-9-9zm-5 9a5 5 0 0 1 10 0H13z" fill="#ffffff" />
                <rect x="10" y="21" width="16" height="4" rx="2" fill="#ffffff" />
            </svg>
        );
    }

    // 18. Emerging Travel Group / Ostrovok - Emerald Green
    if (normalizedCode.includes("ostrovok")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#00a896" />
                <circle cx="18" cy="18" r="8.5" stroke="#ffffff" strokeWidth="2.4" fill="none" />
                <path d="M18 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#ffffff" />
            </svg>
        );
    }

    // 19. MakeMyTrip / Goibibo - Vivid Red
    if (normalizedCode.includes("goibibo") || normalizedCode.includes("makemytrip")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#e41d24" />
                <text x="18" y="23" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">mmt</text>
            </svg>
        );
    }

    // 20. HotelREZ GDS / HotelTrader - Midnight Blue & Gold
    if (normalizedCode.includes("hotelrez") || normalizedCode.includes("hoteltrader")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="#0b2545" />
                <path d="M10 11h4v6h8v-6h4v14h-4v-5h-8v5h-4z" fill="#e2e8f0" />
                <circle cx="22" cy="14" r="1.8" fill="#eab308" />
            </svg>
        );
    }

    // 21. OpenChannel / Custom Booking Engine - Modern Electric Indigo & Cyan
    if (normalizedCode.includes("open") || normalizedCode.includes("engine") || normalizedCode.includes("cakra") || normalizedCode.includes("zenith") || normalizedCode.includes("direct")) {
        return (
            <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="engGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                </defs>
                <rect width="36" height="36" rx="7" fill="url(#engGrad)" />
                <path d="M20 9l-7 10h5l-2 8 8-11h-5l3-7z" fill="#ffffff" />
            </svg>
        );
    }

    // Fallback: Dynamic 2-Letter Branded Monogram Badge (Aesthetic & Clean)
    const initials = (name || code || "OTA")
        .replace(/[^a-zA-Z0-9]/g, " ")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() || "")
        .join("");

    return (
        <svg style={containerStyle} viewBox="0 0 36 36" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="7" fill="#334155" />
            <text x="18" y="23" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">
                {initials || "OTA"}
            </text>
        </svg>
    );
}
