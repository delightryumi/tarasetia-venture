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

/* ─────────────────────── USALI Constants ─────────────────────── */
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
  { id: "all", label: "All Departments", icon: Layers },
  { id: "Rooms", label: "Rooms (FO & HK)", icon: Bed },
  { id: "F&B", label: "F&B Outlets", icon: UtensilsCrossed },
  { id: "POMEC", label: "POMEC / Energy", icon: Wrench },
  { id: "A&G", label: "Admin & General", icon: Building2 },
  { id: "HRD", label: "HRD", icon: Users },
  { id: "S&M", label: "Sales & Marketing", icon: TrendingUp },
  { id: "MOD", label: "Minor Depts (MOD)", icon: Sparkles },
  { id: "Non-Op", label: "Non-Operating", icon: Shield },
  { id: "Other", label: "Other", icon: Tag },
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
  const d = (deptStr || "").toLowerCase();
  if (d.includes("room") || d.includes("fo") || d.includes("front office") || d.includes("hk") || d.includes("housekeeping")) return "Rooms";
  if (d.includes("food") || d.includes("bev") || d.includes("f&b") || d.includes("kitchen") || d.includes("resto") || d.includes("lounge") || d.includes("banquet")) return "F&B";
  if (d.includes("pomec") || d.includes("eng") || d.includes("maintenance") || d.includes("pln") || d.includes("energy")) return "POMEC";
  if (d.includes("ag") || d.includes("admin") || d.includes("general")) return "A&G";
  if (d.includes("hr") || d.includes("human")) return "HRD";
  if (d.includes("sm") || d.includes("sales") || d.includes("marketing") || d.includes("promo")) return "S&M";
  if (d.includes("spa") || d.includes("laundry") || d.includes("mod")) return "MOD";
  if (d.includes("nonop") || d.includes("non-op") || d.includes("fee") || d.includes("pbb") || d.includes("insurance")) return "Non-Op";
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

  const [newRows, setNewRows] = useState<Partial<PnlExpenseItem>[]>([
    { category: "Electricity (PLN)", department: "POMEC / Engineering", description: "", amount: 0, date: today() },
  ]);

  function today() { return new Date().toISOString().split("T")[0]; }

  const addRow = () => {
    const defaultDept = activeFilterTab !== "all"
      ? (activeDepartments.find(d => d.group === activeFilterTab)?.key || "POMEC / Engineering")
      : "POMEC / Engineering";
    const available = DEPARTMENT_ACCOUNTS[defaultDept] || DEFAULT_CATEGORIES;
    setNewRows(r => [...r, { 
      category: available[0] || "Other", 
      department: defaultDept, 
      description: "", 
      amount: 0, 
      date: today() 
    }]);
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
      setNewRows([{ category: "Electricity (PLN)", department: "POMEC / Engineering", description: "", amount: 0, date: today() }]);
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
    DEPARTMENT_FILTER_TABS.forEach(t => {
      if (t.id !== "all") {
        const val = departmentCounts[t.id]?.total || 0;
        if (val > topVal) {
          topVal = val;
          topName = t.label;
        }
      }
    });
    return { name: topName, amount: topVal, percent: totalOpex > 0 ? ((topVal / totalOpex) * 100).toFixed(1) : "0" };
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
        (e.department || "").toLowerCase().includes(q)
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
              <Receipt size={22} />
            </div>
            <div className={s.titleText}>
              <h2 className={s.mainTitle}>
                OPERATIONAL <span className={s.mainTitleHighlight}>EXPENSES</span> (USALI)
              </h2>
              <p className={s.subTitle}>Alokasi Pengeluaran 8 Departemen Perhotelan &amp; Mutasi Audit</p>
            </div>
          </div>

          <button
            className={s.addEntryBtn}
            onClick={() => setIsAdding(v => !v)}
          >
            {isAdding ? <X size={15} /> : <Plus size={15} />}
            {isAdding ? "Batal Entri" : "Tambah Pengeluaran"}
          </button>
        </div>

        {/* ── Executive KPI Stat Cards ── */}
        <div className={s.kpiGrid}>
          <div className={s.kpiCard}>
            <div className={s.kpiTopRow}>
              <span className={s.kpiLabel}>Total Beban Operasional</span>
              <div className={s.kpiIconContainer}><Receipt size={15} /></div>
            </div>
            <span className={s.kpiMainNumber} style={{ color: "#0284c7" }}>
              {formatIDR(totalOpex)}
            </span>
            <span className={s.kpiFooterText}>
              Periode Bulan {month}
            </span>
          </div>

          <div className={s.kpiCard}>
            <div className={s.kpiTopRow}>
              <span className={s.kpiLabel}>Pengeluaran Tertinggi</span>
              <div className={s.kpiIconContainer}><PieChart size={15} /></div>
            </div>
            <span className={s.kpiMainNumber} style={{ fontSize: "16px", color: "#d97706" }}>
              {topSpendingDept.name}
            </span>
            <span className={s.kpiFooterText}>
              {formatIDR(topSpendingDept.amount)} ({topSpendingDept.percent}% dari total)
            </span>
          </div>

          <div className={s.kpiCard}>
            <div className={s.kpiTopRow}>
              <span className={s.kpiLabel}>Total Mutasi / Kwitansi</span>
              <div className={s.kpiIconContainer}><Layers size={15} /></div>
            </div>
            <span className={s.kpiMainNumber}>
              {expenses.length} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Transaksi</span>
            </span>
            <span className={s.kpiFooterText}>
              {displayedExpenses.length} transaksi pada filter aktif
            </span>
          </div>

          <div className={s.kpiCard}>
            <div className={s.kpiTopRow}>
              <span className={s.kpiLabel}>Rata-rata per Transaksi</span>
              <div className={s.kpiIconContainer}><ArrowUpRight size={15} /></div>
            </div>
            <span className={s.kpiMainNumber} style={{ color: "#059669" }}>
              {formatIDR(avgExpense)}
            </span>
            <span className={s.kpiFooterText}>
              Beban rata-rata per nota
            </span>
          </div>
        </div>

        {/* ── Bulk Entry Drawer ── */}
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
                  Entri Cepat Pengeluaran Departemen · {newRows.length} baris
                </span>
              </div>

              <div className={s.rowList}>
                {newRows.map((row, idx) => {
                  const deptCategories = DEPARTMENT_ACCOUNTS[row.department || ""] || DEFAULT_CATEGORIES;
                  return (
                    <div key={idx} className={s.entryRowBox}>
                      {/* Date */}
                      <div className={s.formField}>
                        <label className={s.formLabel}>Tanggal</label>
                        <input
                          type="date"
                          className={`${s.formControl} ${s.dateControl}`}
                          value={row.date || ""}
                          onChange={e => patchRow(idx, { date: e.target.value })}
                        />
                      </div>

                      {/* Department */}
                      <div className={s.formField}>
                        <label className={s.formLabel}>Departemen</label>
                        <select
                          className={`${s.formControl} ${s.selectControl}`}
                          value={row.department || ""}
                          onChange={e => {
                            const dept = e.target.value;
                            const available = DEPARTMENT_ACCOUNTS[dept] || DEFAULT_CATEGORIES;
                            patchRow(idx, { 
                              department: dept,
                              category: available[0] || ""
                            });
                          }}
                        >
                          {activeDepartments.map(d => (
                            <option key={d.key} value={d.key}>{d.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Category / Account */}
                      <div className={s.formField}>
                        <label className={s.formLabel}>Akun Beban USALI</label>
                        <select
                          className={`${s.formControl} ${s.selectControl}`}
                          value={row.category || ""}
                          onChange={e => patchRow(idx, { category: e.target.value })}
                          required
                        >
                          <option value="">Pilih Akun Beban…</option>
                          {deptCategories.map(cat => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div className={s.formField}>
                        <label className={s.formLabel}>Nominal (IDR)</label>
                        <input
                          type="number"
                          min="0"
                          onWheel={(e) => e.currentTarget.blur()}
                          onKeyDown={(e) => {
                            if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                              e.preventDefault();
                            }
                          }}
                          placeholder="0"
                          className={s.formControl}
                          value={row.amount || ""}
                          onChange={e => patchRow(idx, { amount: Number(e.target.value) })}
                        />
                      </div>

                      {/* Description */}
                      <div className={s.formField}>
                        <label className={s.formLabel}>Keterangan / Vendor</label>
                        <input
                          type="text"
                          placeholder="No. nota / vendor / keterangan..."
                          className={s.formControl}
                          value={row.description || ""}
                          onChange={e => patchRow(idx, { description: e.target.value })}
                        />
                      </div>

                      <button
                        className={s.deleteRowBtn}
                        onClick={() => removeRow(idx)}
                        disabled={newRows.length <= 1}
                        title="Hapus baris"
                      >
                        <Minus size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className={s.drawerActions}>
                <button className={s.addMoreRowsBtn} onClick={addRow}>
                  <Plus size={14} />
                  Tambah Baris Baru
                </button>

                <button className={s.saveAllEntriesBtn} onClick={handleSaveAll} disabled={loading}>
                  {loading
                    ? <span className={s.loadingSpinner} />
                    : <><Save size={14} /> Simpan Semua Transaksi</>
                  }
                </button>
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
              placeholder="Cari transaksi, vendor, atau akun..."
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
              Menampilkan: <b>{DEPARTMENT_FILTER_TABS.find(t => t.id === activeFilterTab)?.label}</b> ({displayedExpenses.length} baris)
            </span>
            <span>
              Subtotal: <span className={s.subtotalDigits}>{formatIDR(activeSubtotal)}</span>
            </span>
          </div>
        </div>

        {/* ── Audit Ledger Table ── */}
        <div className={s.tableContainer}>
          <div className={s.tableScrollArea}>
            <table className={s.ledgerTable}>
              <thead className={s.ledgerTableHead}>
                <tr>
                  <th style={{ width: "110px" }}>Tanggal</th>
                  <th style={{ width: "170px" }}>Departemen</th>
                  <th style={{ width: "200px" }}>Akun USALI</th>
                  <th>Keterangan / No. Nota</th>
                  <th className={s.textRightAlign} style={{ width: "160px" }}>Nominal (IDR)</th>
                  <th style={{ width: "80px", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={s.emptyStateWrapper}>
                      <div className={s.emptyStateContent}>
                        <AlertCircle size={24} style={{ color: "#94a3b8" }} />
                        <span style={{ fontWeight: 600, color: "var(--oe-text-muted)" }}>
                          Tidak ada mutasi pengeluaran ditemukan
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--oe-text-subtle)" }}>
                          {searchQuery ? `Tidak ada hasil untuk kata kunci "${searchQuery}"` : `Belum ada beban yang dicatat pada kategori ${DEPARTMENT_FILTER_TABS.find(t => t.id === activeFilterTab)?.label}`}
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

                    const tdFirst = isEditing ? s.cellItemEditing : s.cellItem;
                    const tdMid   = isEditing ? s.cellItemEditing : s.cellItem;
                    const tdLast  = isEditing ? s.cellItemEditing : s.cellItem;

                    const editDeptCategories = DEPARTMENT_ACCOUNTS[editData?.department || ""] || DEFAULT_CATEGORIES;

                    return (
                      <tr key={item.id || i} className={s.tableRow}>
                        {/* ── Date ── */}
                        <td className={tdFirst}>
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
                                ? new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" })
                                : "—"
                              }
                            </span>
                          )}
                        </td>

                        {/* ── Department ── */}
                        <td className={tdMid}>
                          {isEditing ? (
                            <select
                              className={`${s.formControl} ${s.selectControl}`}
                              value={editData?.department || ""}
                              onChange={e => setEditData(d => d ? { ...d, department: e.target.value } : null)}
                            >
                              {activeDepartments.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                            </select>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center" }}>
                              {source && (
                                <span className={`${s.originBadge} ${s[`origin${source}`]}`}>
                                  {source}
                                </span>
                              )}
                              <span className={`${s.deptPill} ${getDeptPillClass(item.department || item.category)}`}>
                                {item.department || "Other"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* ── Category ── */}
                        <td className={tdMid}>
                          {isEditing ? (
                            <select
                              className={`${s.formControl} ${s.selectControl}`}
                              value={editData?.category || ""}
                              onChange={e => setEditData(d => d ? { ...d, category: e.target.value } : null)}
                            >
                              <option value="">Pilih Akun…</option>
                              {editDeptCategories.map(cat => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className={s.accountGroup}>
                              <div className={s.accountIconBox}><Icon size={13} /></div>
                              <span className={s.accountName}>{item.category || "General"}</span>
                            </div>
                          )}
                        </td>

                        {/* ── Description ── */}
                        <td className={tdMid}>
                          {isEditing ? (
                            <input
                              className={s.formControl}
                              value={editData?.description || ""}
                              onChange={e => setEditData(d => d ? { ...d, description: e.target.value } : null)}
                            />
                          ) : (
                            <span className={s.notesText} title={item.description || ""}>
                              {item.description || "—"}
                            </span>
                          )}
                        </td>

                        {/* ── Amount ── */}
                        <td className={tdMid} style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              onWheel={(e) => e.currentTarget.blur()}
                              onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                  e.preventDefault();
                                }
                              }}
                              className={s.formControl}
                              style={{ textAlign: "right" }}
                              value={editData?.amount || ""}
                              onChange={e => setEditData(d => d ? { ...d, amount: Number(e.target.value) } : null)}
                            />
                          ) : (
                            <span className={s.amountDisplay}>
                              {formatIDR(item.amount || 0)}
                            </span>
                          )}
                        </td>

                        {/* ── Actions ── */}
                        <td className={tdLast}>
                          <div className={s.actionRow}>
                            {isLocked ? (
                              <span className={s.lockedIndicator} title="Terkunci dari modul purchasing/store">Terkunci</span>
                            ) : isEditing ? (
                              <>
                                <button className={`${s.tableActionBtn} ${s.btnSave}`} onClick={handleSaveEdit} title="Simpan">
                                  <Check size={13} />
                                </button>
                                <button className={`${s.tableActionBtn} ${s.btnCancel}`} onClick={handleCancelEdit} title="Batal">
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
                                  title="Hapus"
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
    </div>
  );
};
