"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveHotelFromHost } from "@/lib/hotelResolver";

export default function GenericBookRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [resolving, setResolving] = useState(true);

    useEffect(() => {
        async function resolve() {
            try {
                const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
                const hotel = await resolveHotelFromHost(host);
                const hotelCode = hotel?.hotelCode || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "1";
                const queryStr = searchParams ? searchParams.toString() : "";
                const target = `/book/${hotelCode}${queryStr ? `?${queryStr}` : ""}`;
                router.replace(target);
            } catch (err) {
                console.error("Failed to resolve hotel for booking redirect:", err);
                router.replace("/book/1");
            } finally {
                setResolving(false);
            }
        }
        resolve();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-[#0d0f12] text-neutral-300 flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-light">
                    Membuka Sistem Reservasi Resmi...
                </span>
            </div>
        </div>
    );
}
