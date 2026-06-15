export interface HotelMasterDoc {
  hotelCode: string;
  name: string;
  active: boolean;
  domain: string;
  subdomain: string;
  createdAt: string;
  suspendedAt: string | null;
  address: string;
  phone: string;
  email: string;
  billing: {
    plan: "basic" | "premium" | "enterprise" | "custom";
    cycle: "monthly" | "yearly";
    nextDueDate: string;
    status: "paid" | "overdue" | "grace-period";
    showBillingAlert?: boolean;
    showExpirationAlert?: boolean;
    showCustomAlert?: boolean;
    activeModules?: string[];
    alertMessage?: string;
  };
}
