"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
// import { WhatsAppWidget } from "./WhatsAppWidget";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      let resolved = savedTheme;
      if (savedTheme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [pathname]);

  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "luxury-toast",
          style: {
            background: "var(--cream)",
            color: "var(--rich-black)",
            border: "1px solid rgba(120, 128, 105, 0.2)",
            borderRadius: "16px",
            fontFamily: "var(--font-geist-sans), sans-serif",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)"
          },
        }}
      />
      {/* <WhatsAppWidget /> */}
    </AuthProvider>
  );
}
