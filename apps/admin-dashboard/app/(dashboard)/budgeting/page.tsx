import { BudgetingSection } from "@/components/sections/budgeting/BudgetingSection";

export const metadata = {
  title: "Budgeting & Daily Sales Report (DSR) | Accounting",
  description: "Input target budgeting per departemen dan komparasi Daily Sales Report (Actual vs Budget).",
};

export default function BudgetingPage() {
  return <BudgetingSection />;
}
