// app/(dashboard)/purchasing/layout.tsx

import '@/components/purchasing/shell/purchasing-tokens.css';

export const metadata = {
  title: 'Purchasing | Nexura HMS',
  description: 'Procurement, requisitions, inventory, and supplier management.',
};

export default function PurchasingLayout({ children }: { children: React.ReactNode }) {
  return <div className="purchasing-root">{children}</div>;
}
