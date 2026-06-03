"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Receipt,
  Edit2, Check, X, Tag, Calendar as CalendarIcon,
  AlertCircle, Save, Minus, Zap, Monitor, Users, ChevronDown,
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PnlExpenseItem, formatIDR } from "@/lib/pnl-utils";
import s from "./ExpenseSection.module.css";

/* ─────────────────────── constants ─────────────────────── */
const CATEGORIES = [
  { label: "Electricity", icon: Zap,     color: "text-amber-500" },
  { label: "System",      icon: Monitor,  color: "text-blue-500"  },
  { label: "Payroll",     icon: Users,    color: "text-purple-500"},
  { label: "Other",       icon: Tag,      color: "text-stone-400" },
];

const DEPARTMENTS = [
  "F&B", "Housekeeping", "Front Office", "Purchasing", "Admin & General", "Other",
];

const getCategoryIcon = (category: string) => {
  const found = CATEGORIES.find(c => c.label.toLowerCase() === category.toLowerCase());
  return found ? found.icon : Tag;
};

const getSourceLabel = (id?: string): "DML" | "PR" | "SR" | null => {
  if (id?.startsWith("dml-")) return "DML";
  if (id?.startsWith("pr-"))  return "PR";
  if (id?.startsWith("sr-"))  return "SR";
  return null;
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ─────────────────────── types ─────────────────────── */
interface ExpenseSectionProps {
  month: string;
  expenses: PnlExpenseItem[];
  onRefresh: () => void;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export const ExpenseSection: React.FC<ExpenseSectionProps> = ({
  month,
  expenses,
  onRefresh,
}) => {
  const [isAdding,    setIsAdding]    = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editData,    setEditData]    = useState<PnlExpenseItem | null>(null);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null); // add-form dropdown
  const [editDropdown, setEditDropdown] = useState(false);               // edit-row dropdown
  const [loading,     setLoading]     = useState(false);

  const [newRows, setNewRows] = useState<Partial<PnlExpenseItem>[]>([
    { category: "", department: "", description: "", amount: 0, date: today() },
  ]);

  /* ── helpers ── */
  function today() { return new Date().toISOString().split("T")[0]; }

  /* ─── add rows ─── */
  const addRow = () =>
    setNewRows(r => [...r, { category: "", department: "", description: "", amount: 0, date: today() }]);

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
      alert("Please fill in at least one valid expense (Category & Amount)");
      return;
    }
    setLoading(true);
    try {
      const newEntries = validRows.map(r => ({
        ...r,
        id: Math.random().toString(36).substr(2, 9) + Date.now(),
      } as PnlExpenseItem));

      const docRef = doc(db, "global_pnl_reports", month);
      await setDoc(docRef, { expenses: [...expenses, ...newEntries] }, { merge: true });
      setNewRows([{ category: "", department: "", description: "", amount: 0, date: today() }]);
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save expenses.");
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
      await setDoc(doc(db, "global_pnl_reports", month), { expenses: updated }, { merge: true });
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
    if (!window.confirm("Delete this expense?")) return;
    setLoading(true);
    try {
      const updated = expenses.filter(e => e.id !== id);
      await setDoc(doc(db, "global_pnl_reports", month), { expenses: updated }, { merge: true });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ─── sorted ledger ─── */
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <motion.section variants={rise} initial="hidden" animate="show" className={s.section}>
      <div className={s.outerCard}>

        {/* ── Header ── */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <h2 className={s.title}>
              <Receipt size={24} />
              Operational <span className={s.titleAccent}>Expenses</span>
            </h2>
            <p className={s.subtitle}>Bulk Entry &amp; Audit Ledger</p>
          </div>

          <button
            className={s.addBtn}
            onClick={() => setIsAdding(v => !v)}
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
            {isAdding ? "Cancel Entry" : "Add Expense"}
          </button>
        </div>

        {/* ── Inner tray ── */}
        <div className={s.innerTray}>

          {/* ── Bulk entry form ── */}
          <AnimatePresence mode="popLayout">
            {isAdding && (
              <motion.div
                layout
                initial={{ opacity: 0, y: -16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,   scale: 1 }}
                exit={{ opacity: 0, y: -16,    scale: 0.98 }}
                className={s.formCard}
              >
                <div className={s.formHeader}>
                  <span className={s.formBadge}>
                    Bulk Recording · {newRows.length} item{newRows.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className={s.rowList}>
                  {newRows.map((row, idx) => (
                    <div key={idx} className={s.entryRow}>
                      {/* Date */}
                      <div className={s.field}>
                        <label className={s.label}>Date</label>
                        <input
                          type="date"
                          className={s.input}
                          value={row.date || ""}
                          onChange={e => patchRow(idx, { date: e.target.value })}
                        />
                      </div>

                      {/* Category */}
                      <div className={s.field} style={{ position: "relative" }}>
                        <label className={s.label}>Category</label>
                        <div className={s.inputWrap}>
                          <input
                            type="text"
                            placeholder="Type or select…"
                            className={s.input}
                            value={row.category || ""}
                            onFocus={() => setActiveRowIdx(idx)}
                            onBlur={() => setTimeout(() => setActiveRowIdx(null), 180)}
                            onChange={e => patchRow(idx, { category: e.target.value })}
                          />
                          <span className={s.inputChevron}><ChevronDown size={13} /></span>

                          {activeRowIdx === idx && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={s.categoryDropdown}
                            >
                              {CATEGORIES.map(cat => (
                                <button
                                  key={cat.label}
                                  onMouseDown={e => {
                                    e.preventDefault();
                                    patchRow(idx, { category: cat.label });
                                    setActiveRowIdx(null);
                                  }}
                                  className={`${s.categoryOption} ${row.category === cat.label ? s.categoryOptionActive : ""}`}
                                >
                                  <div className={s.categoryIconBox}>
                                    <cat.icon size={15} />
                                  </div>
                                  <div className={s.categoryOptionText}>
                                    <span className={s.categoryOptionName}>{cat.label}</span>
                                    <span className={s.categoryOptionMeta}>Preset</span>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Department */}
                      <div className={s.field}>
                        <label className={s.label}>Department</label>
                        <select
                          className={s.select}
                          value={row.department || ""}
                          onChange={e => patchRow(idx, { department: e.target.value })}
                        >
                          <option value="">Select…</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>

                      {/* Amount */}
                      <div className={s.field}>
                        <label className={s.label}>Amount (IDR)</label>
                        <input
                          type="number"
                          placeholder="0"
                          className={s.input}
                          value={row.amount || ""}
                          onWheel={e => e.currentTarget.blur()}
                          onChange={e => patchRow(idx, { amount: Number(e.target.value) })}
                        />
                      </div>

                      {/* Description + remove */}
                      <div className={s.field} style={{ gridColumn: "span 1" }}>
                        <label className={s.label}>Description</label>
                        <div className={s.descRow}>
                          <input
                            type="text"
                            placeholder="Notes…"
                            className={s.input}
                            style={{ flex: 1 }}
                            value={row.description || ""}
                            onChange={e => patchRow(idx, { description: e.target.value })}
                          />
                          {newRows.length > 1 && (
                            <button className={s.removeBtn} onClick={() => removeRow(idx)}>
                              <Minus size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={s.formActions}>
                  <button className={s.addRowBtn} onClick={addRow}>
                    <Plus size={14} style={{ color: "var(--es-sage)" }} />
                    Add Another Row
                  </button>

                  <button className={s.saveBtn} onClick={handleSaveAll} disabled={loading}>
                    {loading
                      ? <span className={s.spinner} />
                      : <><Save size={14} /> Save All Entries</>
                    }
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Audit Ledger ── */}
          <div className={s.ledgerCard}>
            <div className={s.tableScroll}>
              <table className={s.table}>
                <thead className={s.tableHead}>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Description</th>
                    <th className={s.thRight}>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={s.emptyState}>
                        <div className={s.emptyInner}>
                          <div className={s.emptyIcon}><AlertCircle size={22} /></div>
                          <span className={s.emptyText}>
                            No manual expenses recorded for this period
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sorted.map((item, i) => {
                      const Icon        = getCategoryIcon(item.category || "");
                      const isEditing   = editingId === item.id;
                      const source      = getSourceLabel(item.id);
                      const isLocked    = source !== null;

                      const tdFirst = isEditing ? s.tdFirstEditing : s.tdFirst;
                      const tdMid   = isEditing ? s.tdMidEditing   : s.tdMid;
                      const tdLast  = isEditing ? s.tdLastEditing  : s.tdLast;

                      return (
                        <tr key={item.id || i} className={s.rowGroup}>
                          {/* ── Date ── */}
                          <td className={tdFirst}>
                            {isEditing ? (
                              <input
                                type="date"
                                className={s.cellInput}
                                value={editData?.date || ""}
                                onChange={e => setEditData(d => d ? { ...d, date: e.target.value } : null)}
                              />
                            ) : (
                              <span className={s.cellDate}>
                                <CalendarIcon size={11} />
                                {item.date
                                  ? new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                                  : "—"
                                }
                              </span>
                            )}
                          </td>

                          {/* ── Category ── */}
                          <td className={tdMid}>
                            {isEditing ? (
                              <div style={{ position: "relative" }}>
                                <input
                                  className={s.cellInput}
                                  value={editData?.category || ""}
                                  onFocus={() => setEditDropdown(true)}
                                  onBlur={() => setTimeout(() => setEditDropdown(false), 180)}
                                  onChange={e => setEditData(d => d ? { ...d, category: e.target.value } : null)}
                                />
                                {editDropdown && (
                                  <div className={s.miniDropdown}>
                                    {CATEGORIES.map(cat => (
                                      <button
                                        key={cat.label}
                                        onMouseDown={e => {
                                          e.preventDefault();
                                          setEditData(d => d ? { ...d, category: cat.label } : null);
                                          setEditDropdown(false);
                                        }}
                                        className={s.miniOption}
                                      >
                                        <cat.icon size={12} />
                                        {cat.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className={s.cellCategory}>
                                <div className={s.catIconBox}><Icon size={12} /></div>
                                <span className={s.catLabel}>{item.category}</span>
                              </div>
                            )}
                          </td>

                          {/* ── Department ── */}
                          <td className={tdMid}>
                            {isEditing ? (
                              <select
                                className={s.cellSelect}
                                value={editData?.department || ""}
                                onChange={e => setEditData(d => d ? { ...d, department: e.target.value } : null)}
                              >
                                <option value="">Select…</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            ) : (
                              <div className={s.cellDept}>
                                {source && (
                                  <span className={`${s.sourceBadge} ${s[`source${source}`]}`}>
                                    {source}
                                  </span>
                                )}
                                <span className={s.deptText}>{item.department || "—"}</span>
                              </div>
                            )}
                          </td>

                          {/* ── Description ── */}
                          <td className={tdMid}>
                            {isEditing ? (
                              <input
                                className={s.cellInput}
                                value={editData?.description || ""}
                                onChange={e => setEditData(d => d ? { ...d, description: e.target.value } : null)}
                              />
                            ) : (
                              <span className={s.descText}>{item.description || "—"}</span>
                            )}
                          </td>

                          {/* ── Amount ── */}
                          <td className={tdMid} style={{ textAlign: "right" }}>
                            {isEditing ? (
                              <input
                                type="number"
                                className={`${s.cellInput} ${s.cellInputRight}`}
                                value={editData?.amount || ""}
                                onWheel={e => e.currentTarget.blur()}
                                onChange={e => setEditData(d => d ? { ...d, amount: Number(e.target.value) } : null)}
                              />
                            ) : (
                              <span className={s.amountText}>
                                Rp {item.amount.toLocaleString("id-ID")}
                              </span>
                            )}
                          </td>

                          {/* ── Actions ── */}
                          <td className={tdLast}>
                            <div className={s.actionCell}>
                              {isLocked ? (
                                <span className={s.lockedBadge}>Locked</span>
                              ) : isEditing ? (
                                <>
                                  <button className={`${s.iconBtn} ${s.iconBtnSave}`} onClick={handleSaveEdit}>
                                    <Check size={13} />
                                  </button>
                                  <button className={`${s.iconBtn} ${s.iconBtnCancel}`} onClick={handleCancelEdit}>
                                    <X size={13} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className={`${s.iconBtn} ${s.iconBtnEdit}`}
                                    onClick={() => handleStartEdit(item)}
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    className={`${s.iconBtn} ${s.iconBtnDel}`}
                                    onClick={() => handleDelete(item.id || "")}
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

        </div>{/* /innerTray */}
      </div>{/* /outerCard */}
    </motion.section>
  );
};
