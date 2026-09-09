import { Metadata } from "next";
import { PNLBudgetSection } from "@/components/sections/pnl-budget/PNLBudgetSection";

export const metadata: Metadata = {
  title: "P&L Statement (Actual vs Budget) | Accounting",
  description: "Laporan Laba Rugi USALI komparasi Realisasi (Actual) vs Target (Budget) dengan analisis varians Rp dan %.",
};

export default function PNLBudgetPage() {
  return <PNLBudgetSection />;
}
