import React from "react";
import { Plus, Trash2, PieChart, Lock } from "lucide-react";
import { InvestorItem, formatIDR } from "@/lib/pnl-utils";

interface InvestorInputProps {
  investors: InvestorItem[];
  setInvestors: (items: InvestorItem[]) => void;
  finalNetProfit: number; 
}

export default function InvestorInput({ investors, setInvestors, finalNetProfit }: InvestorInputProps) {
  
  const handleAdd = () => {
    setInvestors([...investors, { id: Date.now().toString(), name: "Investor Baru", percentage: 0, share: 0 }]);
  };

  const handleChange = (index: number, field: keyof InvestorItem, value: any) => {
    const newItems = [...investors];
    if (index === 0 && field === "name") return;
    
    if (field === "percentage" || field === "share") {
      newItems[index] = { 
        ...newItems[index], 
        percentage: Number(value) || 0, 
        share: Number(value) || 0 
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setInvestors(newItems);
  };

  const handleDelete = (index: number) => {
    if (index === 0) return;
    setInvestors(investors.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
          <div className="p-2 bg-slate-900 text-white rounded-lg"><PieChart size={16} /></div>
          Profit Sharing
        </h3>
        <button onClick={handleAdd} className="text-[10px] font-semibold bg-white border border-slate-900 text-slate-900 px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">
          <Plus size={14} /> Add Investor
        </button>
      </div>

      <div className="space-y-3">
        {investors.map((item, index) => {
          const isLocked = index === 0; 
          const pct = item.percentage ?? item.share ?? 0;
          const estAmount = (finalNetProfit * pct) / 100;

          return (
            <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isLocked ? 'bg-slate-50 border-slate-200 shadow-inner' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
              
              <div className="flex-1">
                <div className="relative">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleChange(index, "name", e.target.value)}
                      disabled={isLocked} 
                      className={`w-full text-xs font-semibold uppercase tracking-wider bg-transparent outline-none ${isLocked ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900'}`}
                      placeholder="Investor Name"
                    />
                    {isLocked && <Lock size={12} className="absolute right-0 top-0.5 text-slate-300" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono-jb font-semibold uppercase tracking-widest">Est: {formatIDR(estAmount)}</p>
              </div>

              <div className="w-24 relative">
                <input
                  type="number"
                  value={pct}
                  onChange={(e) => handleChange(index, "percentage", Number(e.target.value))}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-right outline-none focus:border-slate-900 transition-all font-mono-jb"
                />
                <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-semibold">%</span>
              </div>

              <button 
                onClick={() => handleDelete(index)}
                disabled={isLocked} 
                className={`p-2 rounded-lg transition-all ${isLocked ? 'text-slate-200 cursor-not-allowed' : 'text-rose-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100'}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Total Allocation</span>
          <span className={`text-xl font-semibold font-mono-jb ${investors.reduce((a,b)=>(a + (b.percentage ?? b.share ?? 0)), 0) > 100 ? 'text-rose-600 underline' : 'text-slate-900'}`}>
              {investors.reduce((a,b)=>(a + (b.percentage ?? b.share ?? 0)), 0)}%
          </span>
      </div>
    </div>
  );
}