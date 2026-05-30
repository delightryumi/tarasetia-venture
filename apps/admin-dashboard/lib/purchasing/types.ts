import { Timestamp } from "firebase/firestore";

export interface ItemMaster {
  id?: string;
  item_code: string;
  name: string;
  category: string;
  unit: string; // e.g. kg, pcs, liter, pack
  default_supplier_id?: string;
  default_supplier_name?: string;
  min_stock: number;
  current_stock: number;
  last_purchase_price: number;
  is_active: boolean;
  procurement_module: 'SR' | 'PR' | 'DML';
  is_deleted?: boolean;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface Supplier {
  id?: string;
  name: string;
  pic_name: string;
  pic_contact: string; // Phone or email
  address: string;
  payment_terms: string; // e.g. COD, Net 30, Net 14
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface StoreRequisitionItem {
  item_id: string;
  name: string;
  unit: string;
  qty_requested: number;
  qty_fulfilled: number;
  unit_price?: number;
  total?: number;
  notes?: string;
}

export interface StoreRequisition {
  id?: string;
  sr_number: string;
  department: string;
  requested_by: string; // User UID or Name
  requested_by_name?: string;
  status: "draft" | "submitted" | "approved" | "fulfilled" | "rejected";
  items: StoreRequisitionItem[];
  created_at: any; // Timestamp
  updated_at: any; // Timestamp
  approved_by: string | null;
  approved_by_name?: string | null;
  notes: string;
  total_cost?: number;
  is_deleted?: boolean;
  fb_category?: string | null;
  event_category?: string | null;
  order_date?: any;
  delivery_date?: any;
}

export interface PurchaseRequisitionItem {
  item_id: string;
  name: string;
  unit: string;
  qty: number;
  estimated_price: number;
  actual_price: number;
  supplier_id: string;
  supplier_name?: string;
}

export interface PurchaseRequisition {
  id?: string;
  pr_number: string;
  linked_sr_id: string | null;
  linked_sr_number?: string | null;
  status: "draft" | "submitted" | "approved" | "po_issued" | "received" | "closed";
  items: PurchaseRequisitionItem[];
  total_estimated: number;
  total_actual: number;
  requested_by: string;
  requested_by_name?: string;
  approved_by: string | null;
  approved_by_name?: string | null;
  created_at: any; // Timestamp
  delivery_date: any | null; // Timestamp
  notes: string;
  is_deleted?: boolean;
  department?: string;
  fb_category?: string | null;
  event_category?: string | null;
  order_date?: any;
}

export interface DailyMarketListItem {
  item_id: string;
  category: string;
  name: string;
  unit: string;
  qty_ordered: number;
  qty_received: number;
  unit_price: number;
  total: number;
}

export interface DailyMarketList {
  id?: string;
  dml_number: string;
  date: any; // Timestamp
  status: "draft" | "submitted" | "sent_to_supplier" | "received";
  items: DailyMarketListItem[];
  total_cost: number;
  submitted_by: string;
  submitted_by_name?: string;
  verified_by: string | null;
  verified_by_name?: string | null;
  created_at: any; // Timestamp
  notes: string;
  is_deleted?: boolean;
  department?: string;
  order_date?: any;
  delivery_date?: any;
}

export interface StockOpnameItem {
  item_id: string;
  name: string;
  unit: string;
  system_qty: number;
  physical_qty: number;
  variance: number; // system_qty - physical_qty
  variance_type: "normal_shrinkage" | "damage" | "missing" | "none";
  notes?: string;
}

export interface StockOpname {
  id?: string;
  period: string; // YYYY-MM
  status: "open" | "submitted" | "approved" | "locked";
  items: StockOpnameItem[];
  conducted_by: string;
  conducted_by_name?: string;
  approved_by: string | null;
  approved_by_name?: string | null;
  created_at: any; // Timestamp
  approved_at: any | null; // Timestamp
  is_deleted?: boolean;
}
