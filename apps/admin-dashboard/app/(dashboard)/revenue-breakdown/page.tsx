import { Metadata } from "next";
import { RevenueBreakdownSection } from "@/components/sections/revenue-breakdown/RevenueBreakdownSection";

export const metadata: Metadata = {
  title: "Revenue Breakdown with Payment | Front Office",
  description: "Laporan Rincian Pendapatan Kamar dan Alokasi Pembayaran Sistem Hotel VHP / DSI",
};

export default function RevenueBreakdownPage() {
  return <RevenueBreakdownSection />;
}
