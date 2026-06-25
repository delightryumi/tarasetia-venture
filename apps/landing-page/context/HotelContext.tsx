"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { resolveHotelFromHost, HotelData } from "@/lib/hotelResolver";

interface HotelContextType {
  hotelCode: string;
  hotelData: HotelData | null;
  loading: boolean;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const HotelProvider = ({
  children,
  initialHotel,
}: {
  children: React.ReactNode;
  initialHotel?: HotelData | null;
}) => {
  const [hotelData, setHotelData] = useState<HotelData | null>(initialHotel || null);
  const [loading, setLoading] = useState(!initialHotel);

  useEffect(() => {
    if (initialHotel) return;

    const resolve = async () => {
      try {
        const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
        const res = await resolveHotelFromHost(host);
        setHotelData(res);
        if (res?.hotelCode) {
          sessionStorage.setItem("active_hotel_code", res.hotelCode);
          localStorage.setItem("active_hotel_code", res.hotelCode);
        }
      } catch (e) {
        console.error("Failed to resolve hotel client-side", e);
      } finally {
        setLoading(false);
      }
    };
    resolve();
  }, [initialHotel]);

  useEffect(() => {
    if (hotelData?.hotelCode) {
      try {
        sessionStorage.setItem("active_hotel_code", hotelData.hotelCode);
        localStorage.setItem("active_hotel_code", hotelData.hotelCode);
      } catch (e) {
        console.error("Failed to write hotelCode to storage", e);
      }
    }
  }, [hotelData]);

  // Handle active status check
  if (!loading && hotelData && !hotelData.active) {
    return (
      <div className="min-h-screen w-full bg-[#1a1a1a] flex flex-col items-center justify-center text-center p-6 select-none z-[9999] relative">
        <div className="max-w-md w-full bg-[#fdfbf7] p-8 md:p-10 rounded-3xl border border-neutral-100 shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-red-600 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2
            className="text-2xl md:text-3xl text-neutral-900 font-light uppercase tracking-wide mb-4 text-center"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Sistem Ditangguhkan
          </h2>
          <p className="text-sm text-neutral-500 font-light leading-relaxed mb-6 text-center">
            Layanan untuk hotel <strong>{hotelData.name}</strong> sedang dinonaktifkan sementara oleh administrator sistem. Silakan hubungi bagian administrasi atau pusat dukungan Nexura Global Hospitality untuk informasi lebih lanjut.
          </p>
          <div className="w-full h-[1px] bg-neutral-200/60 mb-6" />
          <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
            Nexura Global Hospitality
          </div>
        </div>
      </div>
    );
  }

  const hotelCode = hotelData?.hotelCode || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "1";

  return (
    <HotelContext.Provider value={{ hotelCode, hotelData, loading }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (context === undefined) {
    throw new Error("useHotel must be used within a HotelProvider");
  }
  return context;
};
