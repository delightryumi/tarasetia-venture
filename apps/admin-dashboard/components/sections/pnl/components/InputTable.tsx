import React, { useState } from "react";
import { Plus, Trash2, Tag, Edit2, Save } from "lucide-react";
import { PnlIncomeItem, formatIDR } from "@/lib/pnl-utils";

interface InputTableProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  items: PnlIncomeItem[];
  setItems: (items: PnlIncomeItem[]) => void;
}

export default function InputTable({ title, icon, color, items, setItems }: InputTableProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className={`bg-white p-5 rounded-2xl border shadow-sm transition-all duration-300 ${isEditing ? `border-slate-900 ring-4 ring-slate-50` : "border-slate-100"}`}>
      
      {/* HEADER WITH TOGGLE */}
      <div className="flex justify-between items-center mb-4 pl-1">
        <h3 className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${color} flex items-center gap-2`}>
          {icon} {title}
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
        {!isEditing && (
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">No data entry</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')} ${color}`}>
                      <Tag size={10}/>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono-jb font-semibold text-slate-900">{formatIDR(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {isEditing && (
          <div className="animate-pnl-entry space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 group">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Tag size={12} className="text-slate-300" />
                  </div>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const n = [...items];
                      n[idx].name = e.target.value;
                      setItems(n);
                    }}
                    placeholder="Nama Item"
                    className={`w-full pl-8 pr-3 h-10 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-300 uppercase tracking-wider`}
                  />
                </div>
                <div className="w-32 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 pointer-events-none uppercase">
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
                      const n = [...items];
                      n[idx].amount = e.target.value === "" ? 0 : Number(e.target.value);
                      setItems(n);
                    }}
                    placeholder="0"
                    className={`w-full pl-8 pr-3 h-10 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono-jb font-semibold text-right text-slate-700 outline-none focus:bg-white focus:border-slate-900 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  />
                </div>
                <button
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0 border border-transparent hover:border-rose-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <button
              onClick={() => setItems([...items, { id: Date.now().toString(), name: "", amount: 0 }])}
              className={`w-full h-10 border border-dashed border-slate-300 rounded-lg text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:border-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2`}
            >
              <Plus size={14} /> Add Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
}