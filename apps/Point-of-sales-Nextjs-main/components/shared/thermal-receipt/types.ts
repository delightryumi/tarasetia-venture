import React from 'react';

// ─── Print Mode ──────────────────────────────────────────────────────────────
export type PrintMode = 'all' | 'kitchen' | 'bar';

// ─── Receipt Item ────────────────────────────────────────────────────────────
export interface ReceiptItemData {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  quantity: number;
  isCompliment?: boolean;
  complimentReason?: string;
  selectedAddons?: { name: string; price: number }[];
  note?: string;
}

// ─── Shop Info ───────────────────────────────────────────────────────────────
export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
}

// ─── Transaction Info ────────────────────────────────────────────────────────
export interface TransactionInfo {
  id: string;
  date: string;
  customerName?: string;
  cashierName?: string;
  paymentMethod?: string;
}

// ─── Totals ──────────────────────────────────────────────────────────────────
export interface ReceiptTotals {
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  payableAmount: number;
  cashAmount?: number;
  changeAmount?: number;
}

// ─── Main Props ──────────────────────────────────────────────────────────────
export interface ThermalReceiptProps {
  shopInfo: ShopInfo;
  transactionInfo: TransactionInfo;
  items: ReceiptItemData[];
  totals: ReceiptTotals;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Grouped Items ───────────────────────────────────────────────────────────
export type GroupedItems = Record<string, Record<string, ReceiptItemData[]>>;
export type CategoryTotals = Record<string, number>;
