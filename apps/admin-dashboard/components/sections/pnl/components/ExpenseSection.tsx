"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Receipt,
  Edit2, Check, X, Tag, Calendar as CalendarIcon,
  AlertCircle, Save, Minus, Zap, Monitor, Users, Droplets, Flame, Wrench, Bed, UtensilsCrossed,
  Briefcase, TrendingUp, Shield, Sparkles, Building2, Search, PieChart, Layers, ArrowUpRight
} from "lucide-react";
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { PnlExpenseItem, formatIDR } from "@/lib/pnl-utils";
import s from "./OperationalExpenses.module.css";

/* ─────────────────────── Department Cost Center Constants ─────────────────────── */
export const USALI_DEPARTMENTS = [
  { key: "all", label: "All Departments", group: "all", icon: Layers },
  { key: "Rooms - Front Office", label: "Rooms - Front Office", group: "Rooms", icon: Bed },
  { key: "Rooms - Housekeeping", label: "Rooms - Housekeeping", group: "Rooms", icon: Bed },
  { key: "F&B - Kitchen", label: "F&B - Kitchen", group: "F&B", icon: UtensilsCrossed },
  { key: "F&B - Restaurant & Service", label: "F&B - Restaurant & Service", group: "F&B", icon: UtensilsCrossed },
  { key: "F&B - Sky Lounge & Bar", label: "F&B - Sky Lounge & Bar", group: "F&B", icon: UtensilsCrossed },
  { key: "F&B - Banquet & Events", label: "F&B - Banquet & Events", group: "F&B", icon: UtensilsCrossed },
  { key: "POMEC / Engineering", label: "Property Maintenance & Energy (POMEC)", group: "POMEC", icon: Wrench },
  { key: "Administrative & General", label: "Administrative & General (A&G)", group: "A&G", icon: Building2 },
  { key: "Human Resources", label: "Human Resources (HRD)", group: "HRD", icon: Users },
  { key: "Sales & Marketing", label: "Sales & Marketing (S&M)", group: "S&M", icon: TrendingUp },
  { key: "MOD - Spa & Fitness", label: "MOD - Spa & Fitness", group: "MOD", icon: Sparkles },
  { key: "MOD - Laundry", label: "MOD - Laundry", group: "MOD", icon: Sparkles },
  { key: "Non-Operating Expenses", label: "Non-Operating (Fees / PBB / Insurance)", group: "Non-Op", icon: Shield },
  { key: "Other", label: "Other Operating Expenses", group: "Other", icon: Tag },
];

export const DEPARTMENT_FILTER_TABS = [
  { id: "all", label: "All Cost Centers", icon: Layers },
  { id: "Rooms", label: "Rooms Division", icon: Bed },
  { id: "F&B", label: "F&B Outlets & Culinary", icon: UtensilsCrossed },
  { id: "POMEC", label: "POMEC / Engineering", icon: Wrench },
  { id: "A&G", label: "Admin & General (A&G)", icon: Building2 },
  { id: "HRD", label: "Human Resources (HRD)", icon: Users },
  { id: "S&M", label: "Sales & Marketing (S&M)", icon: TrendingUp },
  { id: "MOD", label: "Minor Operated Depts", icon: Sparkles },
  { id: "Non-Op", label: "Non-Operating Expenses", icon: Shield },
  { id: "Other", label: "Other Operating Expenses", icon: Tag },
];

export const DEPARTMENT_ACCOUNTS: Record<string, string[]> = {
  "Rooms - Front Office": [
    "Uniform",
    "Printing & Stationery",
    "Transport, Fuel & Parking",
    "Travelling Expenses",
    "Consultant",
    "Decoration",
    "Guest Transportation",
    "Reservation Expenses",
    "Guest Supplies",
    "Telephone",
    "TV Cable",
    "Internet Provider",
    "Entertaintment",
    "Newspaper & Magazine",
    "Postage & Courier",
    "Pest Control",
    "Cleaning Supplies",
    "Commission",
    "Pulsa HP Operasional",
    "Welcome Drink",
    "Miscellaneous"
  ],
  "Rooms - Housekeeping": [
    "Cost of Room Supplies (COGS)",
    "Cost of Linen Replacement (COGS)",
    "Uniform",
    "Guest Laundry",
    "Printing & Stationery",
    "Transport & Fuel",
    "Travelling Expenses",
    "Consultant",
    "Equipment Rental",
    "Decoration",
    "Guest Supplies",
    "Cleaning Supplies",
    "Linen Replacement",
    "China & Glass Replacement",
    "Telephone",
    "Landscape & Ground Maintenance",
    "Room Deodorant & Fragrance",
    "Pest Control",
    "Postage & Courier",
    "Pulsa HP",
    "Laundry Linen",
    "Miscellaneous"
  ],
  "F&B - Kitchen": [
    "Cost of Food (COGS)",
    "Cost of Beverage (COGS)",
    "Cost of Other (COGS)",
    "Uniform",
    "Printing & Stationery",
    "Transport, Fuel & Parking",
    "Entertaintment",
    "Test Food",
    "Decoration",
    "Equipment Rental",
    "Kitchen Supplies",
    "Guest Supplies",
    "Cleaning Supplies",
    "Linen Replacement",
    "China, Glass & Silverware Replacement",
    "Telephone",
    "Spoilage",
    "Special Promotion",
    "Laundry Linen",
    "Pest Control",
    "Postage & Courier",
    "Banquet Expenses",
    "Kitchen Fuel Gas / LPG",
    "Paper Supplies",
    "Menu Food & Beverage List",
    "Service Equipment",
    "Miscellaneous"
  ],
  "F&B - Restaurant & Service": [
    "Cost of Food (COGS)",
    "Cost of Beverage (COGS)",
    "Cost of Other (COGS)",
    "Uniform",
    "Printing & Stationery",
    "Transport, Fuel & Parking",
    "Entertaintment",
    "Decoration",
    "Equipment Rental",
    "Kitchen Supplies",
    "Guest Supplies",
    "Cleaning Supplies",
    "Linen Replacement",
    "China, Glass & Silverware Replacement",
    "Telephone",
    "Spoilage",
    "Special Promotion",
    "Laundry Linen",
    "Pest Control",
    "Postage & Courier",
    "Paper Supplies",
    "Menu Food & Beverage List",
    "Service Equipment",
    "Miscellaneous"
  ],
  "F&B - Sky Lounge & Bar": [
    "Cost of Beverage (COGS)",
    "Cost of Food (COGS)",
    "Cost of Other (COGS)",
    "Uniform",
    "Glassware Replacement",
    "Bar & Guest Supplies",
    "Entertaintment",
    "Special Promotion",
    "Miscellaneous"
  ],
  "F&B - Banquet & Events": [
    "Cost of Food (COGS)",
    "Cost of Beverage (COGS)",
    "Cost of Other (COGS)",
    "Banquet Expenses",
    "Decoration",
    "Equipment Rental",
    "Service Equipment",
    "Uniform",
    "Cleaning Supplies",
    "Miscellaneous"
  ],
  "POMEC / Engineering": [
    "Electricity (PLN)",
    "Water (PDAM / Well)",
    "Kitchen LPG Gas",
    "Diesel Fuel (Solar Genset)",
    "Air Conditioning (AC)",
    "Generator & Electrical",
    "Plumbing & Water System",
    "Building Structural",
    "Kitchen Equipment Maintenance",
    "Swimming Pool Chemicals",
    "Fire Safety Equipment",
    "Landscaping & Gardening",
    "IT Hardware Maintenance",
    "Elevator / Lift Maintenance",
    "Painting & Carpentry",
    "Tools & Equipment",
    "Pest Control Building",
    "Miscellaneous"
  ],
  "Administrative & General": [
    "Uniform",
    "Printing & Stationery",
    "Postage & Courier",
    "Transport, Fuel & Parking",
    "Entertaintment",
    "Travelling Expenses",
    "Telephone",
    "Internet Provider",
    "TV Cable",
    "Bank Charges & EDC Fees",
    "Legal & Audit Fees",
    "Consultant",
    "Security Expenses",
    "Recruitment Fee",
    "Software Licenses & IT",
    "Training & Development",
    "Tax Consultant",
    "Insurance Property",
    "Insurance General",
    "Donation & Community",
    "Bad Debt Provision",
    "Miscellaneous"
  ],
  "Human Resources": [
    "Uniform",
    "Printing & Stationery",
    "Recruitment & Advertisement",
    "Training & Seminar",
    "Medical & Clinic",
    "Staff Gathering / Outing",
    "Employee Appreciation Award",
    "Sports & Recreation",
    "Consultant HRD",
    "Miscellaneous"
  ],
  "Sales & Marketing": [
    "Uniform",
    "Printing & Stationery",
    "Marketing Collaterals & Brochures",
    "Advertising & Promotion Online",
    "OTA Commissions",
    "Travel Agent Commissions",
    "Sales Trips & Travel",
    "Client Entertaintment",
    "Website, Hosting & Domain",
    "Photo & Video Shooting Content",
    "Exhibitions & Trade Shows",
    "Public Relations & Media",
    "Guest Gifts & Souvenirs",
    "Telephone & Internet",
    "Miscellaneous"
  ],
  "MOD - Spa & Fitness": [
    "Cost of Treatment (COGS)",
    "Cost of Others (COGS)",
    "Uniform",
    "Massage Oils & Linen",
    "Aromatherapy Supplies",
    "Guest Supplies",
    "Cleaning Supplies",
    "Miscellaneous"
  ],
  "MOD - Laundry": [
    "Cost of Laundry (COGS)",
    "Cost of Other (COGS)",
    "Uniform",
    "Chemical Supplies",
    "Packing Supplies",
    "Machine Maintenance",
    "Transport & Fuel",
    "Miscellaneous"
  ],
  "Non-Operating Expenses": [
    "Exp. Management Fees (Base Fee)",
    "Exp. Incentive Fees",
    "Exp. Franchise / Royalty Fee",
    "Exp. Building Insurance",
    "Exp. Property Tax (PBB)",
    "Exp. Bank Interest & Financing",
    "Exp. Depreciation & Amortization"
  ],
  "Other": [
    "Miscellaneous Operating",
    "General Supplies",
    "System",
    "Other"
  ]
};

const DEFAULT_CATEGORIES = [
  "Electricity (PLN)", "Water (PDAM)", "Guest Supplies", "Cleaning Supplies",
  "Cost of Food (COGS)", "Cost of Beverage (COGS)", "Maintenance & Repairs",
  "OTA Commissions", "Internet & IT", "Payroll & Wages", "Other"
];

const getCategoryIcon = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("electricity") || cat.includes("pln") || cat.includes("power")) return Zap;
  if (cat.includes("water") || cat.includes("pdam")) return Droplets;
  if (cat.includes("gas") || cat.includes("fuel") || cat.includes("lpg")) return Flame;
  if (cat.includes("maintenance") || cat.includes("repair") || cat.includes("pomec")) return Wrench;
  if (cat.includes("system") || cat.includes("it") || cat.includes("software")) return Monitor;
  if (cat.includes("payroll") || cat.includes("salary") || cat.includes("wage") || cat.includes("hr")) return Users;
  if (cat.includes("food") || cat.includes("beverage") || cat.includes("f&b") || cat.includes("kitchen") || cat.includes("resto")) return UtensilsCrossed;
  if (cat.includes("room") || cat.includes("linen") || cat.includes("hk") || cat.includes("fo")) return Bed;
  if (cat.includes("sales") || cat.includes("marketing") || cat.includes("ota") || cat.includes("promo")) return TrendingUp;
  if (cat.includes("admin") || cat.includes("legal") || cat.includes("bank")) return Building2;
  if (cat.includes("insurance") || cat.includes("pbb") || cat.includes("fee")) return Shield;
  return Tag;
};

const getSourceLabel = (id?: string): "DML" | "PR" | "SR" | null => {
  if (id?.startsWith("dml-")) return "DML";
  if (id?.startsWith("pr-"))  return "PR";
  if (id?.startsWith("sr-"))  return "SR";
  return null;
};

const getDeptGroup = (deptStr?: string): string => {
  if (!deptStr) return "Other";
  // Primary: exact key lookup from USALI_DEPARTMENTS — most reliable, avoids substring false-positives
  const found = USALI_DEPARTMENTS.find(dep => dep.key === deptStr);
  if (found && found.group !== "all") return found.group;

  // Secondary: fallback for legacy / non-standard strings (e.g. from PR/SR/DML sources)
  const d = deptStr.toLowerCase();
  // Rooms — use startsWith or exact equality; NEVER d.includes("fo") which also matches "Cost of Food"
  if (d.startsWith("rooms") || d === "front office" || d === "housekeeping" || d === "fo" || d === "hk") return "Rooms";
  // F&B — use startsWith to avoid accidental matches in category names like "Cost of Food (COGS)"
  if (d.startsWith("f&b") || d === "fnb" || d === "food & beverage") return "F&B";
  if (d.includes("kitchen") || d.includes("restaurant") || d.includes("banquet") || d.includes("sky lounge")) return "F&B";
  // POMEC
  if (d.includes("pomec") || d.includes("engineering") || d.includes("maintenance") || d.includes("energy")) return "POMEC";
  // A&G
  if (d.includes("administrative") || d === "admin & general" || d === "a&g") return "A&G";
  // HRD
  if (d.includes("human resources") || d === "hrd") return "HRD";
  // S&M
  if (d.includes("sales & marketing") || d === "s&m") return "S&M";
  // MOD
  if (d.startsWith("mod -") || d === "mod") return "MOD";
  // Non-Op
  if (d.includes("non-operating") || d.includes("non operating")) return "Non-Op";
  return "Other";
};

const getDeptPillClass = (deptStr?: string): string => {
  const grp = getDeptGroup(deptStr);
  switch (grp) {
    case "Rooms": return s.pill_Rooms;
    case "F&B": return s.pill_FnB;
    case "POMEC": return s.pill_POMEC;
    case "A&G": return s.pill_AG;
    case "HRD": return s.pill_HRD;
    case "S&M": return s.pill_SM;
    case "MOD": return s.pill_MOD;
    case "Non-Op": return s.pill_NonOp;
    default: return s.pill_Other;
  }
};

/* ─────────────────────── types ─────────────────────── */
interface ExpenseSectionProps {
  isStartup?: boolean;
  month: string;
  expenses: PnlExpenseItem[];
  onRefresh: () => void;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export const ExpenseSection: React.FC<ExpenseSectionProps> = ({
  isStartup = false,
  month,
  expenses,
  onRefresh,
}) => {
  const activeDepartments = useMemo(() => {
    return USALI_DEPARTMENTS.filter(d => d.key !== "all" && (!isStartup || (d.group !== "Rooms")));
  }, [isStartup]);

  const [activeFilterTab, setActiveFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAdding,    setIsAdding]    = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editData,    setEditData]    = useState<PnlExpenseItem | null>(null);
  const [loading,     setLoading]     = useState(false);

  // ── KPI Detail Modal ──
  interface KpiDetailModal {
    title:    string;
    subtitle?: string;
    items:    PnlExpenseItem[];
  }
  const [detailModal, setDetailModal] = useState<KpiDetailModal | null>(null);

  const [newRows, setNewRows] = useState<Partial<PnlExpenseItem>[]>(() => [{
    date:          new Date().toISOString().split("T")[0],
    department:    "POMEC / Engineering",
    category:      "",
    vendor:        "",
    voucherNo:     "",
    paymentMethod: "CASH" as const,
    amount:        0,
    taxAmount:     0,
    description:   "",
  }]);

  function today() { return new Date().toISOString().split("T")[0]; }

  const PAYMENT_METHODS: { value: PnlExpenseItem["paymentMethod"]; label: string }[] = [
    { value: "CASH",        label: "Cash" },
    { value: "TRANSFER",    label: "Bank Transfer" },
    { value: "DEBIT",       label: "Debit Card" },
    { value: "CREDIT_CARD", label: "Credit Card" },
    { value: "GIRO",        label: "Giro" },
    { value: "CHEQUE",      label: "Cheque" },
  ];

  const EMPTY_ROW = (): Partial<PnlExpenseItem> => ({
    date:          today(),
    department:    "POMEC / Engineering",
    category:      DEPARTMENT_ACCOUNTS["POMEC / Engineering"]?.[0] || "",
    vendor:        "",
    voucherNo:     "",
    paymentMethod: "CASH",
    amount:        0,
    taxIncluded:   false,
    taxAmount:     0,
    description:   "",
  });

  const addRow = () => {
    const defaultDept = activeFilterTab !== "all"
      ? (activeDepartments.find(d => d.group === activeFilterTab)?.key || "POMEC / Engineering")
      : "POMEC / Engineering";
    setNewRows(r => [...r, { ...EMPTY_ROW(), department: defaultDept, category: DEPARTMENT_ACCOUNTS[defaultDept]?.[0] || "" }]);
  };

  const removeRow = (idx: number) => {
    if (newRows.length <= 1) return;
    setNewRows(r => r.filter((_, i) => i !== idx));
  };

  const patchRow = (idx: number, patch: Partial<PnlExpenseItem>) =>
    setNewRows(r => r.map((row, i) => i === idx ? { ...row, ...patch } : row));

  /* ─── save all (add) ─── */
  const handleSaveAll = async () => {
    const validRows = newRows.filter(r => r.category && r.amount);
    if (!validRows.length) {
      alert("Mohon lengkapi minimal 1 entri pengeluaran dengan Kategori & Nominal valid.");
      return;
    }
    setLoading(true);
    try {
      const newEntries = validRows.map(r => ({
        ...r,
        id: Math.random().toString(36).substr(2, 9) + Date.now(),
      } as PnlExpenseItem));

      const docRef = doc(getHotelCollection(db, "global_pnl_reports"), month);
      await setDoc(docRef, { expenses: [...expenses, ...newEntries] }, { merge: true });
      setNewRows([EMPTY_ROW()]);
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan pengeluaran.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── edit ─── */
  const handleStartEdit = (item: PnlExpenseItem) => {
    setEditingId(item.id || null);
    setEditData({ ...item });
  };
  const handleCancelEdit = () => { setEditingId(null); setEditData(null); };

  const handleSaveEdit = async () => {
    if (!editData || !editingId) return;
    setLoading(true);
    try {
      const updated = expenses.map(e => e.id === editingId ? editData : e);
      await setDoc(doc(getHotelCollection(db, "global_pnl_reports"), month), { expenses: updated }, { merge: true });
      setEditingId(null);
      setEditData(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ─── delete ─── */
  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus catatan pengeluaran ini?")) return;
    setLoading(true);
    try {
      const updated = expenses.filter(e => e.id !== id);
      await setDoc(doc(getHotelCollection(db, "global_pnl_reports"), month), { expenses: updated }, { merge: true });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Filtered Ledger & Department Aggregates ─── */
  const sorted = useMemo(() => {
    return [...expenses].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [expenses]);

  const departmentCounts = useMemo(() => {
    const counts: Record<string, { count: number; total: number }> = {
      all: { count: expenses.length, total: expenses.reduce((s, e) => s + (e.amount || 0), 0) }
    };
    DEPARTMENT_FILTER_TABS.forEach(t => {
      if (t.id !== "all") {
        const filtered = expenses.filter(e => getDeptGroup(e.department || e.category) === t.id);
        counts[t.id] = {
          count: filtered.length,
          total: filtered.reduce((s, e) => s + (e.amount || 0), 0)
        };
      }
    });
    return counts;
  }, [expenses]);

  const totalOpex = departmentCounts.all.total;

  const topSpendingDept = useMemo(() => {
    let topName = "—";
    let topVal = 0;
    let topId  = "all";
    DEPARTMENT_FILTER_TABS.forEach(t => {
      if (t.id !== "all") {
        const val = departmentCounts[t.id]?.total || 0;
        if (val > topVal) {
          topVal  = val;
          topName = t.label;
          topId   = t.id;
        }
      }
    });
    return { name: topName, amount: topVal, percent: totalOpex > 0 ? ((topVal / totalOpex) * 100).toFixed(1) : "0", deptId: topId };
  }, [departmentCounts, totalOpex]);

  const avgExpense = useMemo(() => {
    return expenses.length > 0 ? Math.round(totalOpex / expenses.length) : 0;
  }, [expenses.length, totalOpex]);

  const displayedExpenses = useMemo(() => {
    let list = sorted;
    if (activeFilterTab !== "all") {
      list = list.filter(e => getDeptGroup(e.department || e.category) === activeFilterTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.description || "").toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q) ||
        (e.voucherNo || "").toLowerCase().includes(q) ||
        (e.vendor || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [sorted, activeFilterTab, searchQuery]);

  const activeSubtotal = useMemo(() => {
    return displayedExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  }, [displayedExpenses]);

  return (
    <div className={s.container}>
      <div className={s.mainFrame}>

        {/* ── Header Banner ── */}
        <div className={s.headerBanner}>
          <div className={s.titleGroup}>
            <div className={s.titleIcon}>
              <Receipt size={20} />
            </div>
            <div className={s.titleText}>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-slate-900 text-white dark:bg-[#285f47] dark:text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold tracking-wider uppercase">
                  SCHEDULE 03 · OPERATIONAL
                </span>
                <span className="text-[11px] font-semibold text-[#1e4d3a] dark:text-[#52a37f] uppercase tracking-wider bg-[#f0f7f3] dark:bg-[#1e4d3a]/30 px-2 py-0.5 rounded border border-[#c4decb] dark:border-[#285f47]">
                  Undistributed &amp; Direct Opex
                </span>
              </div>
              <h2 className={s.mainTitle}>
                OPERATIONAL EXPENSES <span className={s.mainTitleHighlight}>· OPERATING COST LEDGER</span>
              </h2>
              <p className={s.subTitle}>
                Cash Out Voucher Ledger (BKK) · 8 Cost Center Departments · Direct Operating Expenses &amp; Undistributed Costs
              </p>
            </div>
          </div>

          <button
            className={s.addEntryBtn}
            onClick={() => setIsAdding(v => !v)}
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
            {isAdding ? "Close Form" : "+ New Cash Out Voucher"}
          </button>
        </div>

        {/* ── Executive KPI Stat Cards (clickable → detail modal) ── */}
        <div className={s.kpiGrid}>

          {/* Card 1 – Total Operating Expenses */}
          <div
            className={s.kpiCard}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onClick={() => setDetailModal({
              title:    "Total Operating Expenses",
              subtitle: `Period: ${month} · ${expenses.length} Vouchers`,
              items:    [...expenses].sort((a, b) => (b.amount || 0) - (a.amount || 0)),
            })}
          >
            <div className={s.kpiTopRow}>
              <span className={s.kpiLabel}>Total Operating Expenses</span>
              <div className={s.kpiIconContainer}><Receipt size={15} /></div>
            </div>
            <span className={s.kpiMainNumber} style={{ color: "#1e4d3a" }}>
              {formatIDR(totalOpex)}
            </span>
            <span className={s.kpiFooterText}>
              Posting Period: {month}
              <ArrowUpRight size={10} style={{ marginLeft: 4, opacity: 0.5 }} />
            </span>
          </div>

          {/* Card 2 – Largest Cost Center */}
          <div
            className={s.kpiCard}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onClick={() => {
              const topItems = expenses
                .filter(e => getDeptGroup(e.department || e.category) === topSpendingDept.deptId)
                .sort((a, b) => (b.amount || 0) - (a.amount || 0));
              setDetailModal({
                title:    `Largest Cost Center: ${topSpendingDept.name}`,
                subtitle: `${formatIDR(topSpendingDept.amount)} · ${topSpendingDept.percent}% of total`,
                items:    topItems,
              });
            }}
          >
            <div className={s.kpiTopRow}>
              <span className={s.kpiLabel}>Largest Cost Center</span>
              <div className={s.kpiIconContainer}><PieChart size={15} /></div>
            </div>
            <span className={s.kpiMainNumber} style={{ fontSize: "16px", color: "#d97706" }}>
              {topSpendingDept.name}
            </span>
            <span className={s.kpiFooterText}>
              {formatIDR(topSpendingDept.amount)} ({topSpendingDept.percent}% of total)
              <ArrowUpRight size={10} style={{ marginLeft: 4, opacity: 0.5 }} />
            </span>
          </div>

          {/* Card 3 – Total Vouchers */}
          <div
            className={s.kpiCard}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onClick={() => setDetailModal({
              title:    "All Transactions & Vouchers",
              subtitle: `${expenses.length} vouchers · sorted newest first`,
              items:    [...expenses].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()),
            })}
          >
            <div className={s.kpiTopRow}>
              <span className={s.kpiLabel}>Total Transactions / Vouchers</span>
              <div className={s.kpiIconContainer}><Layers size={15} /></div>
            </div>
            <span className={s.kpiMainNumber}>
              {expenses.length} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Vouchers</span>
            </span>
            <span className={s.kpiFooterText}>
              {displayedExpenses.length} vouchers in active filter
              <ArrowUpRight size={10} style={{ marginLeft: 4, opacity: 0.5 }} />
            </span>
          </div>

          {/* Card 4 – Average per Voucher */}
          <div
            className={s.kpiCard}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onClick={() => setDetailModal({
              title:    "Transaction Audit (Ranked by Amount)",
              subtitle: `Average: ${formatIDR(avgExpense)} per voucher`,
              items:    [...expenses].sort((a, b) => (b.amount || 0) - (a.amount || 0)),
            })}
          >
            <div className={s.kpiTopRow}>
              <span className={s.kpiLabel}>Average per Voucher</span>
              <div className={s.kpiIconContainer}><ArrowUpRight size={15} /></div>
            </div>
            <span className={s.kpiMainNumber} style={{ color: "#059669" }}>
              {formatIDR(avgExpense)}
            </span>
            <span className={s.kpiFooterText}>
              Average expense per voucher
              <ArrowUpRight size={10} style={{ marginLeft: 4, opacity: 0.5 }} />
            </span>
          </div>

        </div>

        {/* ── Formulir Entri Pengeluaran Operasional ── */}
        <AnimatePresence mode="popLayout">
          {isAdding && (
            <motion.div
              layout
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              className={s.entryDrawer}
            >
              <div className={s.entryDrawerHeader}>
                <span className={s.drawerTagBadge}>
                  <Sparkles size={13} />
                  Cash Out Voucher Entry · Period {month} · {newRows.length} {newRows.length === 1 ? "row" : "rows"}
                </span>
                <span style={{ fontSize: 11, color: "var(--oe-text-subtle)", fontStyle: "italic" }}>
                  International Hospitality Accounting Standard
                </span>
              </div>

              <div className={s.rowList}>
                {newRows.map((row, idx) => {
                  const deptCategories = DEPARTMENT_ACCOUNTS[row.department || ""] || DEFAULT_CATEGORIES;
                  const dppValue = row.taxIncluded && row.taxAmount
                    ? (row.amount || 0) - (row.taxAmount || 0)
                    : (row.amount || 0);
                  return (
                    <div key={idx} className={s.entryRowBox}>

                      {/* ── ROW HEADER ── */}
                      <div className={s.entryRowHeader}>
                        <span className={s.entryRowNum}>#{String(idx + 1).padStart(2, "0")}</span>
                        <span className={`${s.deptPill} ${getDeptPillClass(row.department || "")}`} style={{ fontSize: 10 }}>
                          {getDeptGroup(row.department || "")}
                        </span>
                        <button
                          className={s.deleteRowBtn}
                          onClick={() => removeRow(idx)}
                          disabled={newRows.length <= 1}
                          title="Remove line"
                        >
                          <Minus size={13} /> Remove
                        </button>
                      </div>

                      {/* ── GRID ROW 1: Date · Dept · Expense Account ── */}
                      <div className={s.entryGrid3}>
                        <div className={s.formField}>
                          <label className={s.formLabel}>Posting Date <span className={s.formRequired}>*</span></label>
                          <input
                            type="date"
                            className={`${s.formControl} ${s.dateControl}`}
                            value={row.date || ""}
                            onChange={e => patchRow(idx, { date: e.target.value })}
                          />
                        </div>

                        <div className={s.formField}>
                          <label className={s.formLabel}>Cost Center / Department <span className={s.formRequired}>*</span></label>
                          <select
                            className={`${s.formControl} ${s.selectControl}`}
                            value={row.department || ""}
                            onChange={e => {
                              const dept = e.target.value;
                              patchRow(idx, { department: dept, category: DEPARTMENT_ACCOUNTS[dept]?.[0] || "" });
                            }}
                          >
                            {activeDepartments.map(d => (
                              <option key={d.key} value={d.key}>{d.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className={s.formField}>
                          <label className={s.formLabel}>Operating Cost Account <span className={s.formRequired}>*</span></label>
                          <select
                            className={`${s.formControl} ${s.selectControl}`}
                            value={row.category || ""}
                            onChange={e => patchRow(idx, { category: e.target.value })}
                          >
                            <option value="">— Select Expense Account —</option>
                            {deptCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* ── GRID ROW 2: Voucher No · Payee / Vendor · Payment Method ── */}
                      <div className={s.entryGrid3}>
                        <div className={s.formField}>
                          <label className={s.formLabel}>Voucher / Receipt No.</label>
                          <input
                            type="text"
                            placeholder="Voucher / BKK Number"
                            className={s.formControl}
                            value={row.voucherNo || ""}
                            onChange={e => patchRow(idx, { voucherNo: e.target.value })}
                          />
                        </div>

                        <div className={s.formField}>
                          <label className={s.formLabel}>Payee / Supplier / Vendor</label>
                          <input
                            type="text"
                            placeholder="Vendor or Payee Name"
                            className={s.formControl}
                            value={row.vendor || ""}
                            onChange={e => patchRow(idx, { vendor: e.target.value })}
                          />
                        </div>

                        <div className={s.formField}>
                          <label className={s.formLabel}>Payment Method</label>
                          <select
                            className={`${s.formControl} ${s.selectControl}`}
                            value={row.paymentMethod || "CASH"}
                            onChange={e => patchRow(idx, { paymentMethod: e.target.value as PnlExpenseItem["paymentMethod"] })}
                          >
                            {PAYMENT_METHODS.map(pm => (
                              <option key={pm.value} value={pm.value}>{pm.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* ── GRID ROW 3: Net DPP · VAT · Total ── */}
                      <div className={s.entryGrid3}>
                        <div className={s.formField}>
                          <label className={s.formLabel}>Net Amount (DPP) <span className={s.formRequired}>*</span></label>
                          <input
                            type="number" min="0"
                            onWheel={e => e.currentTarget.blur()}
                            onKeyDown={e => { if (["-","e","E","+"].includes(e.key)) e.preventDefault(); }}
                            placeholder="0"
                            className={s.formControl}
                            value={row.amount || ""}
                            onChange={e => patchRow(idx, { amount: Number(e.target.value) })}
                          />
                          <span className={s.formHint}>Net expense before VAT/tax</span>
                        </div>

                        <div className={s.formField}>
                          <label className={s.formLabel}>VAT / Tax Amount</label>
                          <input
                            type="number" min="0"
                            onWheel={e => e.currentTarget.blur()}
                            onKeyDown={e => { if (["-","e","E","+"].includes(e.key)) e.preventDefault(); }}
                            placeholder="0"
                            className={s.formControl}
                            value={row.taxAmount || ""}
                            onChange={e => patchRow(idx, { taxAmount: Number(e.target.value) })}
                          />
                          <span className={s.formHint}>Leave 0 if non-taxable</span>
                        </div>

                        <div className={s.formField}>
                          <label className={s.formLabel}>Total Disbursement</label>
                          <div className={s.totalAmountDisplay}>
                            {formatIDR((row.amount || 0) + (row.taxAmount || 0))}
                          </div>
                          <span className={s.formHint}>Net DPP + Tax</span>
                        </div>
                      </div>

                      {/* ── ROW 4: Description / Remarks ── */}
                      <div className={s.formField}>
                        <label className={s.formLabel}>Description / Transaction Remarks</label>
                        <input
                          type="text"
                          placeholder="Operational expense details, voucher remarks or memo..."
                          className={s.formControl}
                          value={row.description || ""}
                          onChange={e => patchRow(idx, { description: e.target.value })}
                        />
                      </div>

                    </div>
                  );
                })}
              </div>

              <div className={s.drawerActions}>
                <button className={s.addMoreRowsBtn} onClick={addRow}>
                  <Plus size={14} />
                  Add Line
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className={s.drawerTotalBadge}>
                    Total: <b>{formatIDR(newRows.reduce((sum, r) => sum + (r.amount || 0) + (r.taxAmount || 0), 0))}</b>
                  </span>
                  <button className={s.saveAllEntriesBtn} onClick={handleSaveAll} disabled={loading}>
                    {loading
                      ? <span className={s.loadingSpinner} />
                      : <><Save size={14} /> Post to Ledger</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Department Filter Tabs ── */}
        <div className={s.deptTabsBar}>
          {DEPARTMENT_FILTER_TABS.map(tab => {
            const TabIcon = tab.icon;
            const info = departmentCounts[tab.id] || { count: 0, total: 0 };
            const isActive = activeFilterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilterTab(tab.id)}
                className={`${s.deptTabButton} ${isActive ? s.deptTabButtonActive : ""}`}
              >
                <TabIcon size={14} />
                {tab.label}
                <span className={s.tabBadgeNumber}>
                  {info.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Filter Toolbar: Search & Subtotal Banner ── */}
        <div className={s.toolbarRow}>
          <div className={s.searchWrapper}>
            <Search size={14} className={s.searchIconLeft} />
            <input
              type="text"
              placeholder="Search voucher no, payee/vendor, account, description..."
              className={s.searchField}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={s.clearButton} onClick={() => setSearchQuery("")}>
                <X size={13} />
              </button>
            )}
          </div>

          <div className={s.subtotalBadgeBanner}>
            <span>
              Cost Center: <b>{DEPARTMENT_FILTER_TABS.find(t => t.id === activeFilterTab)?.label}</b> ({displayedExpenses.length} {displayedExpenses.length === 1 ? "entry" : "entries"})
            </span>
            <span>
              Subtotal: <span className={s.subtotalDigits}>{formatIDR(activeSubtotal)}</span>
            </span>
          </div>
        </div>

        {/* ── Audit Ledger Jurnal Pengeluaran ── */}
        <div className={s.tableContainer}>
          <div className={s.tableScrollArea}>
            <table className={s.ledgerTable}>
              <thead className={s.ledgerTableHead}>
                <tr>
                  <th style={{ width: "36px", textAlign: "center" }}>#</th>
                  <th style={{ width: "105px" }}>Posting Date</th>
                  <th style={{ width: "165px" }}>Cost Center</th>
                  <th style={{ width: "190px" }}>Expense Account</th>
                  <th style={{ width: "145px" }}>Payee / Vendor</th>
                  <th>Description &amp; Voucher No</th>
                  <th style={{ width: "85px", textAlign: "center" }}>Payment</th>
                  <th className={s.textRightAlign} style={{ width: "140px" }}>Amount (IDR)</th>
                  <th style={{ width: "75px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={s.emptyStateWrapper}>
                      <div className={s.emptyStateContent}>
                        <AlertCircle size={24} style={{ color: "#94a3b8" }} />
                        <span style={{ fontWeight: 600, color: "var(--oe-text-muted)" }}>
                          No expense ledger records found
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--oe-text-subtle)" }}>
                          {searchQuery ? `No results found for "${searchQuery}"` : `No expense transactions posted for: ${DEPARTMENT_FILTER_TABS.find(t => t.id === activeFilterTab)?.label}`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedExpenses.map((item, i) => {
                    const Icon        = getCategoryIcon(item.category || item.department || "");
                    const isEditing   = editingId === item.id;
                    const source      = getSourceLabel(item.id);
                    const isLocked    = source !== null;
                    const td = isEditing ? s.cellItemEditing : s.cellItem;
                    const editDeptCategories = DEPARTMENT_ACCOUNTS[editData?.department || ""] || DEFAULT_CATEGORIES;
                    const pmLabel = PAYMENT_METHODS.find(p => p.value === item.paymentMethod)?.label || (item.paymentMethod || "—");

                    return (
                      <tr key={item.id || i} className={s.tableRow}>

                        {/* # */}
                        <td className={td} style={{ fontSize: 11, color: "var(--oe-text-subtle)", textAlign: "center", fontFamily: "var(--oe-font-mono)" }}>{i + 1}</td>

                        {/* Date */}
                        <td className={td}>
                          {isEditing ? (
                            <input
                              type="date"
                              className={`${s.formControl} ${s.dateControl}`}
                              value={editData?.date || ""}
                              onChange={e => setEditData(d => d ? { ...d, date: e.target.value } : null)}
                            />
                          ) : (
                            <span className={s.dateDisplay}>
                              <CalendarIcon size={12} style={{ color: "var(--oe-text-subtle)" }} />
                              {item.date
                                ? new Date(item.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
                                : "—"}
                            </span>
                          )}
                        </td>

                        {/* Department */}
                        <td className={td}>
                          {isEditing ? (
                            <select
                              className={`${s.formControl} ${s.selectControl}`}
                              value={editData?.department || ""}
                              onChange={e => setEditData(d => d ? { ...d, department: e.target.value } : null)}
                            >
                              {activeDepartments.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                            </select>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                              {source && (
                                <span className={`${s.originBadge} ${s[`origin${source}`]}`}>{source}</span>
                              )}
                              <span className={`${s.deptPill} ${getDeptPillClass(item.department || item.category)}`}>
                                {item.department || "Other"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Expense Account */}
                        <td className={td}>
                          {isEditing ? (
                            <select
                              className={`${s.formControl} ${s.selectControl}`}
                              value={editData?.category || ""}
                              onChange={e => setEditData(d => d ? { ...d, category: e.target.value } : null)}
                            >
                              <option value="">— Select Account —</option>
                              {editDeptCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : (
                            <div className={s.accountGroup}>
                              <div className={s.accountIconBox}><Icon size={13} /></div>
                              <span className={s.accountName}>{item.category || "General"}</span>
                            </div>
                          )}
                        </td>

                        {/* Vendor */}
                        <td className={td}>
                          {isEditing ? (
                            <input
                              className={s.formControl}
                              placeholder="Vendor / Payee Name..."
                              value={editData?.vendor || ""}
                              onChange={e => setEditData(d => d ? { ...d, vendor: e.target.value } : null)}
                            />
                          ) : (
                            <span className={s.notesText} title={item.vendor || ""}>
                              {item.vendor || <span style={{ color: "var(--oe-text-subtle)" }}>—</span>}
                            </span>
                          )}
                        </td>

                        {/* Description & Voucher */}
                        <td className={td}>
                          {isEditing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <input
                                className={s.formControl}
                                placeholder="Voucher / BKK Number"
                                value={editData?.voucherNo || ""}
                                onChange={e => setEditData(d => d ? { ...d, voucherNo: e.target.value } : null)}
                                style={{ fontSize: 11, fontFamily: "var(--oe-font-mono)" }}
                              />
                              <input
                                className={s.formControl}
                                placeholder="Expense description or memo"
                                value={editData?.description || ""}
                                onChange={e => setEditData(d => d ? { ...d, description: e.target.value } : null)}
                              />
                            </div>
                          ) : (
                            <div>
                              <span className={s.notesText} title={item.description || ""}>
                                {item.description || "—"}
                              </span>
                              {item.voucherNo && (
                                <span className={s.voucherBadge}>{item.voucherNo}</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td className={td} style={{ textAlign: "center" }}>
                          {isEditing ? (
                            <select
                              className={`${s.formControl} ${s.selectControl}`}
                              value={editData?.paymentMethod || "CASH"}
                              onChange={e => setEditData(d => d ? { ...d, paymentMethod: e.target.value as PnlExpenseItem["paymentMethod"] } : null)}
                            >
                              {PAYMENT_METHODS.map(pm => (
                                <option key={pm.value} value={pm.value}>{pm.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`${s.paymentBadge} ${s[`pay_${item.paymentMethod || "CASH"}`]}`}>
                              {item.paymentMethod === "CASH" ? "Cash" :
                               item.paymentMethod === "TRANSFER" ? "TRF" :
                               item.paymentMethod === "CREDIT_CARD" ? "CC" :
                               item.paymentMethod === "DEBIT" ? "Debit" :
                               item.paymentMethod === "GIRO" ? "Giro" :
                               item.paymentMethod === "CHEQUE" ? "Cheque" : "—"}
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className={td} style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <input
                                type="number" min="0"
                                onWheel={e => e.currentTarget.blur()}
                                onKeyDown={e => { if (["-","e","E","+"].includes(e.key)) e.preventDefault(); }}
                                className={s.formControl}
                                style={{ textAlign: "right", fontFamily: "var(--oe-font-mono)" }}
                                placeholder="Net DPP"
                                value={editData?.amount || ""}
                                onChange={e => setEditData(d => d ? { ...d, amount: Number(e.target.value) } : null)}
                              />
                              <input
                                type="number" min="0"
                                onWheel={e => e.currentTarget.blur()}
                                onKeyDown={e => { if (["-","e","E","+"].includes(e.key)) e.preventDefault(); }}
                                className={s.formControl}
                                style={{ textAlign: "right", fontSize: 10, fontFamily: "var(--oe-font-mono)" }}
                                placeholder="VAT/Tax"
                                value={editData?.taxAmount || ""}
                                onChange={e => setEditData(d => d ? { ...d, taxAmount: Number(e.target.value) } : null)}
                              />
                            </div>
                          ) : (
                            <div style={{ textAlign: "right" }}>
                              <span className={s.amountDisplay}>
                                {formatIDR(item.amount || 0)}
                              </span>
                              {item.taxAmount && item.taxAmount > 0 && (
                                <div style={{ fontSize: 10, color: "var(--oe-text-subtle)", marginTop: 1 }}>
                                  Tax: {formatIDR(item.taxAmount)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* ── Actions ── */}
                        <td className={td}>
                          <div className={s.actionRow}>
                            {isLocked ? (
                              <span className={s.lockedIndicator} title="Locked from purchasing/store module">Locked</span>
                            ) : isEditing ? (
                              <>
                                <button className={`${s.tableActionBtn} ${s.btnSave}`} onClick={handleSaveEdit} title="Save">
                                  <Check size={13} />
                                </button>
                                <button className={`${s.tableActionBtn} ${s.btnCancel}`} onClick={handleCancelEdit} title="Cancel">
                                  <X size={13} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className={`${s.tableActionBtn} ${s.btnEdit}`}
                                  onClick={() => handleStartEdit(item)}
                                  title="Edit"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  className={`${s.tableActionBtn} ${s.btnDelete}`}
                                  onClick={() => handleDelete(item.id || "")}
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════
          KPI Detail Modal — drill-down per card
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailModal && (
          <motion.div
            key="kpi-detail-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setDetailModal(null)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(15,23,42,0.55)",
              backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 200, padding: 16,
            }}
          >
            <motion.div
              key="kpi-detail-panel"
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: 6,
                width: "100%", maxWidth: 920, maxHeight: "90vh",
                display: "flex", flexDirection: "column", overflow: "hidden",
                boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
                border: "1px solid #cbd5e1",
              }}
            >
              {/* ── Modal Header ── */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexShrink: 0, background: "#f8fafc" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0f172a", background: "#e2e8f0", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: 4 }}>TRANSACTION AUDIT LEDGER</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#475569", background: "#ffffff", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: 4, fontFamily: "var(--oe-font-mono)" }}>PERIOD {month}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{detailModal.title}</h3>
                  {detailModal.subtitle && <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>{detailModal.subtitle}</p>}
                </div>
                <button
                  onClick={() => setDetailModal(null)}
                  style={{ width: 28, height: 28, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569", flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* ── Stats Strip ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, padding: "12px 20px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
                {[
                  { label: "Total Vouchers",  value: String(detailModal.items.length),  color: "#0f172a" },
                  { label: "Total Amount",     value: formatIDR(detailModal.items.reduce((s, e) => s + (e.amount || 0), 0)), color: "#1e4d3a" },
                  { label: "Average / Voucher", value: formatIDR(detailModal.items.length > 0 ? Math.round(detailModal.items.reduce((s, e) => s + (e.amount || 0), 0) / detailModal.items.length) : 0), color: "#1e4d3a" },
                ].map(card => (
                  <div key={card.label} style={{ background: "#fff", borderRadius: 4, padding: "10px 14px", border: "1px solid #cbd5e1" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{card.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: card.color, fontFamily: "var(--oe-font-mono)" }}>{card.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Expense Table ── */}
              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: 36 }} />
                    <col style={{ width: 105 }} />
                    <col style={{ width: 160 }} />
                    <col style={{ width: 180 }} />
                    <col />
                    <col style={{ width: 140 }} />
                  </colgroup>
                  <thead style={{ position: "sticky", top: 0, background: "#0f172a", zIndex: 1 }}>
                    <tr style={{ borderBottom: "1px solid #1e293b" }}>
                      {(["#", "Posting Date", "Cost Center", "Expense Account", "Description & Voucher No", "Amount (IDR)"] as const).map((col, i) => (
                        <th key={col} style={{ padding: "9px 12px", fontSize: 10, fontWeight: 800, color: "#f8fafc", textAlign: i === 5 ? "right" : "left", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "56px 16px", color: "#94a3b8", fontSize: 13 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                            <Receipt size={26} style={{ opacity: 0.3 }} />
                            <span>No expense vouchers found</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      detailModal.items.map((item, idx) => {
                        const src = getSourceLabel(item.id);
                        return (
                          <tr
                            key={item.id || idx}
                            style={{ borderBottom: "1px solid #f8fafc" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "11px 14px", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{idx + 1}</td>
                            <td style={{ padding: "11px 14px", fontSize: 12, color: "#475569" }}>
                              {item.date
                                ? new Date(item.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                                : "—"}
                            </td>
                            <td style={{ padding: "11px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {src && (
                                  <span className={`${s.originBadge} ${s[`origin${src}`]}`} style={{ fontSize: 9 }}>{src}</span>
                                )}
                                <span className={`${s.deptPill} ${getDeptPillClass(item.department || item.category)}`} style={{ fontSize: 10 }}>
                                  {item.department || "—"}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "11px 14px", fontSize: 12, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.category || "—"}
                            </td>
                            <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.description || ""}>
                              {item.description || "—"}
                            </td>
                            <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#dc2626", textAlign: "right", fontFamily: "monospace" }}>
                              {formatIDR(item.amount || 0)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Modal Footer ── */}
              <div style={{ padding: "12px 26px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{detailModal.items.length} {detailModal.items.length === 1 ? "voucher" : "vouchers"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>
                  Total: {formatIDR(detailModal.items.reduce((s, e) => s + (e.amount || 0), 0))}
                </span>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
