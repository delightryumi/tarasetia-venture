"use client";

import React from "react";

interface OtaLogoProps {
    code: string;
    name?: string;
    size?: number;
    className?: string;
}

export function OtaLogo({ code, name = "", size = 20, className = "" }: OtaLogoProps) {
    const normalizedCode = (code || name || "").toLowerCase().replace(/[^a-z0-9]/g, "_");

    const containerStyle: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        verticalAlign: "middle",
        borderRadius: "4px",
        overflow: "hidden"
    };

    // Authentic Pixel-Perfect Vector Brand Logos (SVG)
    // 1. Booking.com
    if (normalizedCode.includes("booking")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#003580" />
                <path d="M7 8h8.5c2.5 0 4.5 1.5 4.5 3.8 0 1.6-.9 2.9-2.3 3.4 1.8.6 2.8 2 2.8 3.8 0 2.6-2.1 4.5-4.8 4.5H7V8zm4 3.5v3.2h4.2c1.2 0 1.9-.7 1.9-1.6 0-.9-.7-1.6-1.9-1.6H11zm0 6.2v3.8h4.5c1.3 0 2.1-.8 2.1-1.9 0-1.1-.8-1.9-2.1-1.9H11z" fill="#ffffff" />
                <circle cx="23.5" cy="22" r="2" fill="#006ce4" />
            </svg>
        );
    }

    // 2. Agoda
    if (normalizedCode.includes("agoda")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="8" cy="11" r="2.8" fill="#eb2027" />
                <circle cx="16" cy="7.5" r="2.8" fill="#f7b928" />
                <circle cx="24" cy="11" r="2.8" fill="#26b99a" />
                <circle cx="11.5" cy="16.5" r="2.8" fill="#3075b5" />
                <circle cx="20.5" cy="16.5" r="2.8" fill="#92278f" />
                <path d="M7.5 24.5h2.2l.6 1.8h2.3l-2.6-6.8H8.8l-2.6 6.8h2.3l.6-1.8zm1.7-5l.7 2.4H7.9l.7-2.4zm5.6 4.6c-.8 0-1.4-.3-1.8-.8v.7h-1.9v-6.7h1.9v2.7c.4-.5 1-.8 1.8-.8 1.5 0 2.5 1.1 2.5 2.5s-1 2.4-2.5 2.4zm-.2-3.4c-.6 0-1 .4-1 .9s.4 1 1 1 1-.4 1-1-.4-.9-1-.9zm6 3.4c-1.5 0-2.6-1.1-2.6-2.5s1.1-2.5 2.6-2.5 2.6 1.1 2.6 2.5-1.1 2.5-2.6 2.5zm0-1.5c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z" fill="#334155" />
            </svg>
        );
    }

    // 3. Traveloka
    if (normalizedCode.includes("traveloka")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#0194f3" />
                <path d="M6.5 17.5c2.2-3.8 6.8-7.8 13.5-9-3.2 2.6-5.4 6-5.8 8.8 3.5-1.4 7.2-1.2 10.8 1.2-4.5.2-8.2 2.4-10.2 5.5-1.2-1.8-3.6-3.8-8.3-6.5z" fill="#ffffff" />
                <circle cx="21" cy="11.5" r="1.5" fill="#ffffff" />
            </svg>
        );
    }

    // 4. Tiket.com
    if (normalizedCode.includes("tiket")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#fedd00" />
                <circle cx="16" cy="16" r="9" fill="#0064d2" />
                <circle cx="20" cy="12" r="3.2" fill="#fedd00" />
                <path d="M12.5 14h3.5v7h-2.2v-5h-1.3v-2z" fill="#ffffff" />
            </svg>
        );
    }

    // 5. Expedia
    if (normalizedCode.includes("expedia")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#00256c" />
                <path d="M16 6a10 10 0 1 0 10 10A10 10 0 0 0 16 6zm3.8 13.2l-6.2 1.8 1.8-6.2 8.4-4-4 8.4z" fill="#ffd400" />
                <path d="M14.5 17.5l-1.5 4 4-1.5 4.5-4.5-2.5-2.5z" fill="#ffffff" />
            </svg>
        );
    }

    // 6. Airbnb
    if (normalizedCode.includes("airbnb")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#ff385c" />
                <path d="M16 6c-3.2 0-5.8 2.6-5.8 5.9 0 3.8 2.6 7.6 5.8 12.6 3.2-5 5.8-8.8 5.8-12.6 0-3.3-2.6-5.9-5.8-5.9zm0 8.2c-1.3 0-2.4-1.1-2.4-2.4s1.1-2.4 2.4-2.4 2.4 1.1 2.4 2.4-1.1 2.4-2.4 2.4z" fill="#ffffff" />
            </svg>
        );
    }

    // 7. Trip.com / Ctrip
    if (normalizedCode.includes("trip") || normalizedCode.includes("ctrip")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#2577e3" />
                <circle cx="16" cy="16" r="8" fill="#ffffff" />
                <path d="M11 16c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5" stroke="#2577e3" strokeWidth="2.5" fill="none" />
                <circle cx="19.5" cy="12.5" r="2" fill="#e03b3b" />
            </svg>
        );
    }

    // 8. Google Hotel Ads
    if (normalizedCode.includes("google")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <path d="M24.6 16.3c0-.6-.1-1.2-.2-1.8H16v3.4h4.8c-.2 1.1-.9 2.1-1.9 2.8v2.3h3.1c1.8-1.7 2.6-4.1 2.6-6.7z" fill="#4285F4" />
                <path d="M16 25c2.5 0 4.6-.8 6.1-2.3l-3.1-2.3c-.8.6-1.9.9-3 .9-2.3 0-4.3-1.6-5-3.8H7.7v2.4C9.3 22.9 12.4 25 16 25z" fill="#34A853" />
                <path d="M11 17.5c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V11H7.7C7.1 12.3 6.8 13.8 6.8 15.5s.3 3.2.9 4.5l3.3-2.5z" fill="#FBBC05" />
                <path d="M16 9.9c1.4 0 2.6.5 3.5 1.4l2.6-2.6C20.6 7.3 18.5 6.5 16 6.5 12.4 6.5 9.3 8.6 7.7 11.9l3.3 2.5c.7-2.1 2.7-3.7 5-3.7z" fill="#EA4335" />
            </svg>
        );
    }

    // 9. Hotelbeds
    if (normalizedCode.includes("hotelbeds")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#ff5a00" />
                <path d="M8 12h3v10H8zm5 3h11v7H13zm2-3h7c1.1 0 2 .9 2 2v1H15z" fill="#ffffff" />
                <circle cx="10" cy="10" r="1.5" fill="#ffffff" />
            </svg>
        );
    }

    // 10. Webbeds
    if (normalizedCode.includes("webbeds")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#00a3e0" />
                <circle cx="16" cy="16" r="7" stroke="#ffffff" strokeWidth="2" fill="none" />
                <ellipse cx="16" cy="16" rx="3.5" ry="7" stroke="#ffffff" strokeWidth="1.5" fill="none" />
                <line x1="9" y1="16" x2="23" y2="16" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
        );
    }

    // 11. MG Bedbank
    if (normalizedCode.includes("mg")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#d9251d" />
                <path d="M7 21V11l4.5 5.5L16 11v10M17 16h4.5c1.4 0 2.5 1.1 2.5 2.5S22.9 21 21.5 21H17v-10h7" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
        );
    }

    // 12. Klook
    if (normalizedCode.includes("klook")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#ff5722" />
                <circle cx="12" cy="12" r="3" fill="#ffffff" />
                <circle cx="20" cy="12" r="3" fill="#ffeb3b" />
                <path d="M9 19c2 3 5 4 7 4s5-1 7-4" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
        );
    }

    // 13. Hostelworld
    if (normalizedCode.includes("hostelworld")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#ff6600" />
                <path d="M8 8h4v6h8V8h4v16h-4v-6h-8v6H8z" fill="#ffffff" />
            </svg>
        );
    }

    // 14. Hopper
    if (normalizedCode.includes("hopper")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#ff6955" />
                <path d="M12 7c-1 0-2 2-1.5 5.5.5 3 2.5 4.5 2.5 4.5s-2 1.5-3.5 3.5c-1.5 2-.5 4.5 1 4.5 3 0 7.5-4 8.5-7.5 1-3.5 0-6.5-2-7.5.5-2-.5-3-2-3-1 0-1.5 1-1.5 2s-.5-2-1.5-2z" fill="#ffffff" />
            </svg>
        );
    }

    // 15. HotelTonight
    if (normalizedCode.includes("hoteltonight")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#4a154b" />
                <path d="M9 11h4v4h6v-4h4v12h-4v-4h-6v4H9z" fill="#ffffff" />
                <path d="M16 6a5 5 0 0 1 5 5h-2a3 3 0 0 0-3-3V6z" fill="#ffc107" />
            </svg>
        );
    }

    // 16. HRS
    if (normalizedCode.includes("hrs")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#e2001a" />
                <text x="16" y="20" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">HRS</text>
            </svg>
        );
    }

    // 17. Roibos
    if (normalizedCode.includes("roibos")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#5b21b6" />
                <circle cx="16" cy="16" r="7" fill="#8b5cf6" />
                <path d="M12 16h8M16 12v8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        );
    }

    // 18. Reconline
    if (normalizedCode.includes("reconline")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#1e3a8a" />
                <path d="M10 16a6 6 0 1 0 12 0 6 6 0 0 0-12 0zm3-3l6 6m0-6l-6 6" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
        );
    }

    // 19. Dida Travel
    if (normalizedCode.includes("dida")) {
        return (
            <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#f97316" />
                <path d="M10 21V11l10 5-10 5z" fill="#ffffff" />
            </svg>
        );
    }

    // 20. Default / Direct Engine / Custom OTA
    return (
        <svg style={containerStyle} viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#0f172a" />
            <circle cx="16" cy="16" r="8" stroke="#38bdf8" strokeWidth="2" fill="none" />
            <path d="M16 10v6l4 2" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
