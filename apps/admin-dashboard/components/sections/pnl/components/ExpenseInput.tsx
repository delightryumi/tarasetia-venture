import React, { useState } from "react";
import { MinusCircle, Banknote, Trash2, Plus, Edit2, Save } from "lucide-react";
import { PnlExpenseItem, formatIDR } from "@/lib/pnl-utils";

interface ExtendedExpenseItem extends PnlExpenseItem {
  allocation?: "SHARED" | "MANAGEMENT";
}

interface ExpenseInputProps {
  expenses: ExtendedExpenseItem[];
  setExpenses: (expenses: ExtendedExpenseItem[]) => void;
}

export default function ExpenseInput({ expenses, setExpenses }: ExpenseInputProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className={`bg-white p-5 rounded-2xl border shadow-sm transition-all duration-300 ${isEditing ? "border-slate-900 ring-4 ring-slate-50" : "border-slate-100"}`}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 pl-1">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-600 flex items-center gap-2">
          <MinusCircle size={16} /> Operational Expenses
        </h3>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
            isEditing 
            ? "bg-slate-900 text-white hover:bg-black shadow-md" 
            : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-100"
          }`}
        >
          {isEditing ? (
            <><Save size={12} /> SAVE</>
          ) : (
            <><Edit2 size={12} /> EDIT</>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {/* VIEW MODE */}
        {!isEditing && (
          <div className="space-y-2">
            {expenses.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">No expenses recorded</p>
              </div>
            ) : (
              expenses.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                      <Banknote size={10}/>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-tight">{item.name}</div>
                        <div className={`text-[8px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase tracking-widest ${
                            item.allocation === 'MANAGEMENT' 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white text-slate-400 border border-slate-200'
                        }`}>
                            {item.allocation || 'SHARED'}
                        </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-jb font-semibold text-slate-900">{formatIDR(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* EDIT MODE */}
        {isEditing && (
          <div className="animate-pnl-entry space-y-3">
            {expenses.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60 group">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Banknote size={12} className="text-slate-300" />
                    </div>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const n = [...expenses];
                        n[idx].name = e.target.value;
                        setExpenses(n);
                      }}
                      placeholder="Nama Pengeluaran"
                      className="w-full pl-8 pr-3 h-9 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-slate-900 transition-all placeholder:text-slate-300 uppercase tracking-wider"
                    />
                  </div>
                  <div className="w-28 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 pointer-events-none uppercase">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                          e.preventDefault();
                        }
                      }}
                      value={item.amount === 0 ? "" : item.amount}
                      onChange={(e) => {
                        const n = [...expenses];
                        n[idx].amount = e.target.value === "" ? 0 : Number(e.target.value);
                        setExpenses(n);
                      }}
                      placeholder="0"
                      className="w-full pl-8 pr-3 h-9 bg-white border border-slate-200 rounded-lg text-xs font-mono-jb font-semibold text-right text-slate-700 outline-none focus:border-slate-900 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    onClick={() => setExpenses(expenses.filter((_, i) => i !== idx))}
                    className="h-9 w-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0 bg-white border border-slate-200 hover:border-rose-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Allocation:</span>
                  <select
                    value={item.allocation || "SHARED"}
                    onChange={(e) => {
                      const n = [...expenses];
                      n[idx].allocation = e.target.value as any;
                      setExpenses(n);
                    }}
                    className={`flex-1 h-7 px-2 rounded-md text-[9px] font-semibold uppercase tracking-widest border outline-none cursor-pointer transition-colors ${
                      item.allocation === "MANAGEMENT"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <option value="SHARED">Shared (Investor + Management)</option>
                    <option value="MANAGEMENT">Management Only (Internal)</option>
                  </select>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => setExpenses([...expenses, { id: Date.now().toString(), name: "", amount: 0, allocation: "SHARED" }])}
              className="w-full h-10 border border-dashed border-slate-300 rounded-lg text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:border-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Add Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
}