"use client";

import React from "react";

/**
 * High-Aesthetic 3D Soft Clay Icons (Claymorphism & Soft Pastel Style)
 * Crafted with soft pastel gradients, multi-layer diffuse specular highlights,
 * rounded puffy clay geometry, and warm ambient drop-shadows.
 */

// 1. Rates (Harga) - Soft Mint & Warm Butter Gold 3D Clay Money Bag
export function Rate3DIcon({ size = 44 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 6px 14px rgba(52, 211, 153, 0.22))" }}
        >
            <defs>
                {/* Soft Mint Pastel Bag */}
                <linearGradient id="rateSoftBagGrad" x1="16" y1="20" x2="48" y2="58" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a7f3d0" />
                    <stop offset="50%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#34d399" />
                </linearGradient>

                {/* Diffuse Puffy Clay Highlight */}
                <linearGradient id="rateClayGloss" x1="22" y1="26" x2="32" y2="44" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>

                {/* Butter Soft Gold Coin */}
                <linearGradient id="rateSoftCoinGrad" x1="32" y1="8" x2="48" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="55%" stopColor="#fde047" />
                    <stop offset="100%" stopColor="#facc15" />
                </linearGradient>

                {/* Soft Ribbon Tie */}
                <linearGradient id="rateRibbonGrad" x1="24" y1="22" x2="40" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fef9c3" />
                    <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
            </defs>

            {/* Back Golden 3D Coin popping out */}
            <circle cx="38" cy="15" r="9" fill="url(#rateSoftCoinGrad)" />
            <circle cx="38" cy="15" r="6.5" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" fill="none" />
            <ellipse cx="36" cy="13" rx="3" ry="1.5" fill="#ffffff" fillOpacity="0.8" />

            {/* Puffy Top Ruffle */}
            <path
                d="M24 23C24 18 27.5 16 32 16C36.5 16 40 18 40 23C37.5 21.8 34.5 21.2 32 21.2C29.5 21.2 26.5 21.8 24 23Z"
                fill="#6ee7b7"
            />

            {/* Main Rounded Clay Pouch Body */}
            <path
                d="M32 22C23.5 22 15.5 28.5 15 38.5C14.5 48.5 21 56 32 56C43 56 49.5 48.5 49 38.5C48.5 28.5 40.5 22 32 22Z"
                fill="url(#rateSoftBagGrad)"
            />

            {/* Specular Puffy Highlight */}
            <ellipse cx="25" cy="33" rx="6" ry="8.5" fill="url(#rateClayGloss)" transform="rotate(-18 25 33)" />
            <ellipse cx="23" cy="29" rx="2.5" ry="1.4" fill="#ffffff" fillOpacity="0.9" transform="rotate(-18 23 29)" />

            {/* Tied Clay Ribbon Band */}
            <path
                d="M23.5 22.5C27 25.5 37 25.5 40.5 22.5C40.5 26.5 37 28 32 28C27 28 23.5 26.5 23.5 22.5Z"
                fill="url(#rateRibbonGrad)"
            />
            {/* Cute Rounded Ribbon Ends */}
            <path d="M29 27L27 33L31 31.5L29 27Z" fill="#facc15" />
            <path d="M33 27L35 33.5L32 32L33 27Z" fill="#fde047" />

            {/* Soft Embossed Dollar Emblem */}
            <g style={{ filter: "drop-shadow(0 2px 2px rgba(5, 150, 105, 0.25))" }}>
                <path
                    d="M34.5 34C34.5 31.8 33 30.8 31.5 30.8C29.5 30.8 28 31.8 28 33.2C28 36.2 35 35.8 35 39.5C35 42 33 43 31.5 43C29 43 27.5 41.5 27.5 39.5"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    fill="none"
                />
                <line x1="31.5" y1="28.5" x2="31.5" y2="45.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            </g>
        </svg>
    );
}

// 2. Inventory (Allotment) - Soft Pastel Periwinkle 3D Puffy Cloud Bed
export function Inventory3DIcon({ size = 44 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 6px 14px rgba(96, 165, 250, 0.22))" }}
        >
            <defs>
                <linearGradient id="invHeadboardGrad" x1="14" y1="16" x2="50" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#bfdbfe" />
                    <stop offset="60%" stopColor="#93c5fd" />
                    <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>

                <linearGradient id="invMattressGrad" x1="10" y1="32" x2="54" y2="52" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#e0f2fe" />
                    <stop offset="60%" stopColor="#bae6fd" />
                    <stop offset="100%" stopColor="#7dd3fc" />
                </linearGradient>

                <linearGradient id="invDuvetGrad" x1="10" y1="36" x2="54" y2="52" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#93c5fd" />
                    <stop offset="50%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>

                <linearGradient id="invPillowGrad" x1="16" y1="22" x2="30" y2="34" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
            </defs>

            {/* Puffy Soft Headboard */}
            <rect x="13" y="16" width="38" height="24" rx="8" fill="url(#invHeadboardGrad)" />
            {/* Top Gloss Curve */}
            <ellipse cx="32" cy="19" rx="14" ry="2" fill="#ffffff" fillOpacity="0.45" />

            {/* Marshmallow White Pillows */}
            <rect x="15.5" y="24" width="14.5" height="10" rx="4.5" fill="url(#invPillowGrad)" />
            <ellipse cx="20" cy="26" rx="3.5" ry="1.5" fill="#ffffff" fillOpacity="0.8" />

            <rect x="34" y="24" width="14.5" height="10" rx="4.5" fill="url(#invPillowGrad)" />
            <ellipse cx="38.5" cy="26" rx="3.5" ry="1.5" fill="#ffffff" fillOpacity="0.8" />

            {/* Mattress Base */}
            <rect x="9.5" y="32" width="45" height="20" rx="7" fill="url(#invMattressGrad)" />

            {/* Folded Puffy Duvet */}
            <path
                d="M9.5 39C9.5 36.5 11.5 35 14 35H50C52.5 35 54.5 36.5 54.5 39V46C54.5 49.5 51.5 52 48 52H16C12.5 52 9.5 49.5 9.5 46V39Z"
                fill="url(#invDuvetGrad)"
            />
            {/* Sheet Roll Curve */}
            <rect x="9.5" y="35" width="45" height="4.5" rx="2.25" fill="#93c5fd" />
            <line x1="14" y1="36" x2="50" y2="36" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />

            {/* Soft Clay Bed Legs */}
            <rect x="13" y="52" width="4.5" height="5" rx="2.25" fill="#94a3b8" />
            <rect x="46.5" y="52" width="4.5" height="5" rx="2.25" fill="#94a3b8" />
        </svg>
    );
}

// 3. Min Stay Through - Soft Sky Blue 3D Puffy Stopwatch/Clock with Butter Hands
export function MinStayThrough3DIcon({ size = 44 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 6px 14px rgba(56, 189, 248, 0.22))" }}
        >
            <defs>
                {/* Soft Blue Puffy Bezel */}
                <linearGradient id="clockPuffyBezel" x1="10" y1="12" x2="54" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#bae6fd" />
                    <stop offset="45%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                {/* Dial Face */}
                <linearGradient id="clockPuffyDial" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>

                {/* Soft Butter Yellow Hand */}
                <linearGradient id="clockYellowHand" x1="28" y1="20" x2="42" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
            </defs>

            {/* Puffy Top Clay Crown / Button */}
            <rect x="29" y="6" width="6" height="5" rx="2.5" fill="#38bdf8" />
            <rect x="27.5" y="5" width="9" height="2.5" rx="1.25" fill="#7dd3fc" />

            {/* Main Rounded 3D Ring */}
            <circle cx="32" cy="33" r="22" fill="url(#clockPuffyBezel)" />

            {/* Puffy Gloss Highlight on Ring */}
            <path
                d="M17 22C20.5 16 26.5 13 33 13C36 13 39 13.8 42 15"
                stroke="#ffffff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeOpacity="0.75"
            />
            <ellipse cx="20" cy="20" rx="2.5" ry="1.2" fill="#ffffff" fillOpacity="0.9" transform="rotate(-30 20 20)" />

            {/* Dial Face */}
            <circle cx="32" cy="33" r="15.5" fill="url(#clockPuffyDial)" />
            <circle cx="32" cy="33" r="15.5" stroke="#e2e8f0" strokeWidth="1" fill="none" />

            {/* Subtle Hour Marks */}
            <circle cx="32" cy="21.5" r="1.3" fill="#cbd5e1" />
            <circle cx="43.5" cy="33" r="1.3" fill="#cbd5e1" />
            <circle cx="32" cy="44.5" r="1.3" fill="#cbd5e1" />
            <circle cx="20.5" cy="33" r="1.3" fill="#cbd5e1" />

            {/* Blue Short Hour Hand */}
            <rect
                x="30.5"
                y="26"
                width="3"
                height="8"
                rx="1.5"
                fill="#0284c7"
                transform="rotate(-40 32 33)"
            />

            {/* Butter Long Minute Hand */}
            <rect
                x="30.5"
                y="20.5"
                width="3"
                height="13.5"
                rx="1.5"
                fill="url(#clockYellowHand)"
                transform="rotate(60 32 33)"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.12))" }}
            />

            {/* Center Clay Spherical Pin */}
            <circle cx="32" cy="33" r="3" fill="#f59e0b" />
            <circle cx="32" cy="33" r="1.2" fill="#ffffff" />
        </svg>
    );
}

// 4. Min Stay Arrival - Soft Peach & Sky 3D Calendar with Coral Pushpin
export function MinStayArrival3DIcon({ size = 44 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 6px 14px rgba(251, 113, 133, 0.22))" }}
        >
            <defs>
                <linearGradient id="calSheetGrad" x1="14" y1="16" x2="50" y2="54" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>

                <linearGradient id="calHeaderSoft" x1="13" y1="14" x2="51" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#bae6fd" />
                    <stop offset="60%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                {/* Soft Coral Pin */}
                <linearGradient id="coralPinGrad" x1="36" y1="6" x2="52" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fecdd3" />
                    <stop offset="50%" stopColor="#fda4af" />
                    <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
            </defs>

            {/* Puffy White Calendar Pad */}
            <rect x="13" y="16" width="38" height="38" rx="8" fill="url(#calSheetGrad)" />
            <rect x="13" y="50" width="38" height="4" rx="2" fill="#e2e8f0" />

            {/* Top Soft Blue Curved Header */}
            <path d="M13 24C13 19.5 16.5 16 21 16H43C47.5 16 51 19.5 51 24V28H13V24Z" fill="url(#calHeaderSoft)" />

            {/* Cute Spiral Clay Rings */}
            <rect x="21" y="12" width="3.5" height="7.5" rx="1.75" fill="#94a3b8" />
            <rect x="39" y="12" width="3.5" height="7.5" rx="1.75" fill="#94a3b8" />

            {/* Subtle Calendar Dots */}
            <circle cx="21" cy="35" r="1.8" fill="#cbd5e1" />
            <circle cx="28" cy="35" r="1.8" fill="#cbd5e1" />
            <circle cx="35" cy="35" r="1.8" fill="#cbd5e1" />
            <circle cx="42" cy="35" r="1.8" fill="#cbd5e1" />

            <circle cx="21" cy="43" r="1.8" fill="#cbd5e1" />
            <circle cx="28" cy="43" r="2.4" fill="#38bdf8" />
            <circle cx="35" cy="43" r="1.8" fill="#cbd5e1" />
            <circle cx="42" cy="43" r="1.8" fill="#cbd5e1" />

            {/* Soft Coral 3D Pushpin */}
            <g style={{ filter: "drop-shadow(0 3px 6px rgba(244, 63, 94, 0.28))" }}>
                <ellipse cx="43" cy="18" rx="6.5" ry="4.5" fill="url(#coralPinGrad)" />
                <ellipse cx="42" cy="16.5" rx="3.5" ry="1.8" fill="#ffffff" fillOpacity="0.75" />
                <path d="M40 19C40 23.5 42 26.5 43 27.5C44 26.5 46 23.5 46 19H40Z" fill="#fb7185" />
                <path d="M42.5 27.5L41.5 35.5L43.5 35.5L43.5 27.5H42.5Z" fill="#94a3b8" />
            </g>
        </svg>
    );
}

// 5. Stop Sell - Soft Strawberry Coral 3D Puffy Stop Octagon
export function StopSell3DIcon({ size = 44 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 6px 14px rgba(244, 63, 94, 0.24))" }}
        >
            <defs>
                <linearGradient id="stopCoralGrad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fecdd3" />
                    <stop offset="45%" stopColor="#fda4af" />
                    <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
            </defs>

            {/* 3D Puffy Octagon */}
            <polygon
                points="22,11 42,11 53,22 53,42 42,53 22,53 11,42 11,22"
                fill="url(#stopCoralGrad)"
            />

            {/* Inner Puffy Contour */}
            <polygon
                points="23,13.5 41,13.5 50.5,23 50.5,41 41,50.5 23,50.5 13.5,41 13.5,23"
                stroke="#ffffff"
                strokeWidth="2.2"
                fill="none"
                opacity="0.85"
            />

            {/* Top Gloss Sheen */}
            <ellipse cx="32" cy="17" rx="10" ry="2.2" fill="#ffffff" fillOpacity="0.45" />

            {/* Puffy White Slash Barrier */}
            <circle cx="32" cy="32" r="11" stroke="#ffffff" strokeWidth="2.8" fill="none" opacity="0.95" />
            <line x1="24.5" y1="24.5" x2="39.5" y2="39.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" opacity="0.95" />
        </svg>
    );
}

// 6. Maximum Stay - Soft Pastel Lilac 3D Puffy Scroll & Mint Checkmark
export function MaxStay3DIcon({ size = 44 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 6px 14px rgba(192, 132, 252, 0.22))" }}
        >
            <defs>
                <linearGradient id="scrollPuffySheet" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f5f3ff" />
                </linearGradient>

                <linearGradient id="checkMintGrad" x1="24" y1="28" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a7f3d0" />
                    <stop offset="60%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
            </defs>

            {/* Top Curled Scroll Roll */}
            <ellipse cx="32" cy="14" rx="15" ry="3.8" fill="#e9d5ff" />
            <ellipse cx="32" cy="13" rx="15" ry="3.2" fill="#ffffff" />

            {/* Unrolled Soft Sheet */}
            <path
                d="M17 14V45C17 48 20 50 23 50C26 50 32 48.5 35 50C38 51.5 44 50 47 47V14H17Z"
                fill="url(#scrollPuffySheet)"
            />

            {/* Bottom Tail Roll */}
            <path
                d="M17 45C17 48.5 20.5 52 26 52H43C46 52 47 49.5 47 47C44 48 38 49.5 35 48C32 46.5 26 48 23 48C20 48 17 46 17 45Z"
                fill="#d8b4fe"
            />

            {/* Subtle Text Lines */}
            <line x1="23" y1="22" x2="41" y2="22" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
            <line x1="23" y1="27" x2="35" y2="27" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />

            {/* 3D Round Mint Checkmark Badge */}
            <circle cx="33" cy="37" r="7.8" fill="url(#checkMintGrad)" style={{ filter: "drop-shadow(0 2px 5px rgba(52, 211, 153, 0.35))" }} />
            <ellipse cx="31" cy="33" rx="2.5" ry="1.2" fill="#ffffff" fillOpacity="0.75" />
            <path
                d="M30 37L32 39.2L36 34.8"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// 7. Closed to Arrival (COA) - Soft Pastel Sage Door with Coral Badge
export function Cta3DIcon({ size = 44 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 6px 14px rgba(52, 211, 153, 0.22))" }}
        >
            <defs>
                <linearGradient id="doorPuffyGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a7f3d0" />
                    <stop offset="60%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#34d399" />
                </linearGradient>

                <linearGradient id="doorBadgeGrad" x1="36" y1="36" x2="50" y2="50" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fda4af" />
                    <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
            </defs>

            {/* Arch Frame */}
            <rect x="13" y="11" width="38" height="42" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="15.5" y="13" width="33" height="40" rx="6" fill="url(#doorPuffyGrad)" />

            {/* Top Gloss Curve */}
            <ellipse cx="32" cy="16" rx="10" ry="1.5" fill="#ffffff" fillOpacity="0.6" />

            {/* Recessed Panels */}
            <rect x="19" y="18" width="11" height="12" rx="2.5" fill="#059669" opacity="0.25" />
            <rect x="33" y="18" width="11" height="12" rx="2.5" fill="#059669" opacity="0.25" />
            <rect x="19" y="34" width="11" height="12" rx="2.5" fill="#059669" opacity="0.25" />
            <rect x="33" y="34" width="11" height="12" rx="2.5" fill="#059669" opacity="0.25" />

            {/* Butter Golden Door Knob */}
            <circle cx="21" cy="32" r="2.4" fill="#fde047" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }} />

            {/* Soft Coral Arrival Lock Badge */}
            <circle cx="43" cy="43" r="7.5" fill="url(#doorBadgeGrad)" style={{ filter: "drop-shadow(0 2px 4px rgba(244, 63, 94, 0.3))" }} />
            <path d="M39.5 43H46.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
    );
}

// 8. Closed to Departure (COD) - Soft Pastel Lavender Suitcase with Coral Badge
export function Ctd3DIcon({ size = 44 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 6px 14px rgba(192, 132, 252, 0.22))" }}
        >
            <defs>
                <linearGradient id="suitcasePuffyGrad" x1="16" y1="18" x2="48" y2="52" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f3e8ff" />
                    <stop offset="50%" stopColor="#e9d5ff" />
                    <stop offset="100%" stopColor="#d8b4fe" />
                </linearGradient>

                <linearGradient id="suitcaseBadgeGrad" x1="36" y1="36" x2="50" y2="50" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fda4af" />
                    <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
            </defs>

            {/* Handle */}
            <path
                d="M26 18V10.5C26 9 27.5 7.5 29 7.5H35C36.5 7.5 38 9 38 10.5V18"
                stroke="#94a3b8"
                strokeWidth="2.2"
                fill="none"
            />
            <rect x="28" y="7.5" width="8" height="2.8" rx="1.4" fill="#64748b" />

            {/* Puffy Suitcase Body */}
            <rect x="17" y="18" width="30" height="33" rx="8" fill="url(#suitcasePuffyGrad)" />

            {/* Top Gloss Curve */}
            <ellipse cx="32" cy="21" rx="10" ry="1.8" fill="#ffffff" fillOpacity="0.6" />

            {/* Soft Grooves */}
            <rect x="21" y="26" width="22" height="1.8" rx="0.9" fill="#a855f7" opacity="0.3" />
            <rect x="21" y="32" width="22" height="1.8" rx="0.9" fill="#a855f7" opacity="0.3" />
            <rect x="21" y="38" width="22" height="1.8" rx="0.9" fill="#a855f7" opacity="0.3" />

            {/* Wheels */}
            <circle cx="22" cy="52" r="2.2" fill="#64748b" />
            <circle cx="42" cy="52" r="2.2" fill="#64748b" />

            {/* Soft Coral Departure Lock Badge */}
            <circle cx="43" cy="43" r="7.5" fill="url(#suitcaseBadgeGrad)" style={{ filter: "drop-shadow(0 2px 4px rgba(244, 63, 94, 0.3))" }} />
            <path d="M39.5 43H46.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
    );
}
