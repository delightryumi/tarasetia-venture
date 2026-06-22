"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
// import { WhatsAppWidget } from "./WhatsAppWidget";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 0. Redirect staff domain to /attendance if they wander into other pages
    const hostname = window.location.hostname;
    const isStaff = hostname.startsWith("staff.") || hostname === "staff.localhost";
    if (isStaff && pathname !== "/attendance" && pathname !== "/api/manifest-attendance" && pathname !== "/manifest-attendance.json") {
      window.location.replace(`/attendance${window.location.search}`);
      return;
    }

    const syncTheme = () => {
      // 1. Read shared_theme cookie
      const match = document.cookie.match(/(?:^|; )shared_theme=([^;]*)/);
      const cookieTheme = match ? match[1] : null;

      // 2. If cookie exists, sync to localStorage
      if (cookieTheme && (cookieTheme === 'light' || cookieTheme === 'dark' || cookieTheme === 'system')) {
        const localTheme = localStorage.getItem('theme');
        if (localTheme !== cookieTheme) {
          localStorage.setItem('theme', cookieTheme);
          // Dispatch storage event so other stateful components in this tab update
          window.dispatchEvent(new Event('storage'));
        }
      }

      // 3. Resolve and apply the class to HTML element
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
    };

    // Run on mount
    syncTheme();

    // Listen for focus & storage events
    window.addEventListener('focus', syncTheme);
    window.addEventListener('storage', syncTheme);

    return () => {
      window.removeEventListener('focus', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
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
