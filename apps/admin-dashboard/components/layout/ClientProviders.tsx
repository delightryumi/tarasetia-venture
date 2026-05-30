"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
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
    </AuthProvider>
  );
}
