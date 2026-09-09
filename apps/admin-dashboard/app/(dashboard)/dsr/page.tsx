import { Metadata } from "next";
import { DSRSection } from "@/components/sections/dsr/DSRSection";

export const metadata: Metadata = {
  title: "Daily Sales Report (DSR) | Accounting",
  description: "Automated Hotel Daily Sales Report and Actuals vs Budget Performance Analysis",
};

export default function DSRPage() {
  return <DSRSection />;
}
