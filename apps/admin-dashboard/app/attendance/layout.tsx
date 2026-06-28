import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Absensi Karyawan",
  description: "Halaman clock in/out karyawan",
};

// Layout isolasi — tidak menggunakan DashboardLayout (tanpa sidebar)
// Role guard dihandle di page.tsx client-side via useAuth
export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          overflow: auto !important;
          height: auto !important;
          overscroll-behavior-y: auto !important;
        }
      `}} />
      <div
        style={{
          minHeight: "100dvh",
          background: "var(--canvas, #f5f5f5)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Helvetica Neue', Helvetica, Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {children}
      </div>
    </>
  );
}
