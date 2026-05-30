export const ITEM_CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Meat & Poultry",
  "Seafood",
  "Dairy & Eggs",
  "Dry Goods & Groceries",
  "Beverages",
  "Kitchen Equipment",
  "Housekeeping Supplies",
  "Office Stationery",
  "Others"
];

export const ITEM_UNITS = [
  "kg",
  "gram",
  "pcs",
  "pack",
  "box",
  "bottle",
  "can",
  "bag",
  "liter",
  "ml",
  "roll"
];

export const DEPARTMENTS = [
  "F&B Kitchen",
  "F&B Service",
  "Housekeeping",
  "Front Office",
  "Engineering",
  "Finance & Admin",
  "Sales & Marketing"
];

export const SR_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "submitted", label: "Submitted", color: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse" },
  { value: "approved", label: "Approved", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "fulfilled", label: "Fulfilled", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "rejected", label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200" }
];

export const PR_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "submitted", label: "Submitted", color: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse" },
  { value: "approved", label: "Approved", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "po_issued", label: "PO Issued", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "received", label: "Received", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "closed", label: "Closed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
];

export const DML_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "submitted", label: "Submitted", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "sent_to_supplier", label: "Sent to Supplier", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "received", label: "Received & Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
];

export const OPNAME_STATUSES = [
  { value: "open", label: "Active Open", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "submitted", label: "Submitted", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "approved", label: "Approved", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "locked", label: "Locked", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
];
