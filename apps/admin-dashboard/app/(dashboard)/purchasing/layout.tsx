// app/(dashboard)/purchasing/layout.tsx
// DashboardLayout detects /purchasing/* and passes children through (no sidebar/topbar).
// This layout then wraps children with the isolated PurchasingShell.
// Full layout and CSS isolation is achieved without moving route files.

import { PurchasingShell } from '@/components/purchasing/shell/PurchasingShell';

export const metadata = {
  title: 'Purchasing | Nexura HMS',
  description: 'Procurement, requisitions, inventory, and supplier management.',
};

export default function PurchasingLayout({ children }: { children: React.ReactNode }) {
  return <PurchasingShell>{children}</PurchasingShell>;
}
