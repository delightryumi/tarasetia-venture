import React from 'react';
import { Sparkles, Coffee, UtensilsCrossed, Wine, IceCream, Compass, Flame, Star, Leaf } from 'lucide-react';

interface CategoryNavProps {
  categories: any[];
  activeCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  categoriesRef: React.RefObject<HTMLDivElement | null>;
  filterSignatureOnly: boolean;
  setFilterSignatureOnly: (val: boolean) => void;
  productCountsByCategory?: Record<string, number>;
  totalProductsCount?: number;
}

export default function CategoryNav({
  categories,
  activeCategory,
  onSelectCategory,
  categoriesRef,
  filterSignatureOnly,
  setFilterSignatureOnly,
  productCountsByCategory = {},
  totalProductsCount = 0
}: CategoryNavProps) {
  if (categories.length === 0) return null;

  const getCategoryIcon = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('minum') || lower.includes('beverage') || lower.includes('drink') || lower.includes('kopi') || lower.includes('tea')) {
      return <Coffee size={14} className="shrink-0" />;
    }
    if (lower.includes('makan') || lower.includes('main') || lower.includes('food') || lower.includes('nasi') || lower.includes('mie')) {
      return <UtensilsCrossed size={14} className="shrink-0" />;
    }
    if (lower.includes('dessert') || lower.includes('snack') || lower.includes('kue') || lower.includes('ice')) {
      return <IceCream size={14} className="shrink-0" />;
    }
    if (lower.includes('special') || lower.includes('chef') || lower.includes('signature') || lower.includes('promo')) {
      return <Sparkles size={14} className="shrink-0" />;
    }
    return <Compass size={14} className="shrink-0" />;
  };

  return (
    <div className="sticky top-[64px] sm:top-[70px] z-30 bg-[#f8f7f4]/95 backdrop-blur-xl py-2.5 -mx-4 px-4 border-b border-[#c5a059]/20 transition-all">
      
      {/* Category Pills Strip */}
      <div
        ref={categoriesRef}
        className="flex gap-2 overflow-x-auto so-no-scrollbar items-center py-0.5"
      >
        {/* All Items Pill */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
            activeCategory === 'all'
              ? 'bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/25 ring-2 ring-[#c5a059]'
              : 'bg-white text-[#525a56] border border-[#c5a059]/25 hover:bg-[#faf5ea] hover:text-[#121615]'
          }`}
        >
          <Sparkles size={14} className={activeCategory === 'all' ? 'text-[#c5a059]' : 'text-[#8a928e]'} />
          <span>Semua Menu</span>
          {totalProductsCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeCategory === 'all' ? 'bg-[#c5a059] text-[#121615]' : 'bg-[#f2efe9] text-[#525a56]'
            }`}>
              {totalProductsCount}
            </span>
          )}
        </button>

        {/* Dynamic Category Pills */}
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.name;
          const count = productCountsByCategory[cat.name] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`shrink-0 px-4 py-2 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                isSelected
                  ? 'bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/25 ring-2 ring-[#c5a059]'
                  : 'bg-white text-[#525a56] border border-[#c5a059]/25 hover:bg-[#faf5ea] hover:text-[#121615]'
              }`}
            >
              {getCategoryIcon(cat.name)}
              <span>{cat.name}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? 'bg-[#c5a059] text-[#121615]' : 'bg-[#f2efe9] text-[#525a56]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Fast Filter Bar */}
      <div className="flex items-center gap-2 mt-2 pt-1.5 overflow-x-auto so-no-scrollbar">
        <button
          onClick={() => setFilterSignatureOnly(!filterSignatureOnly)}
          className={`text-[11px] font-bold px-3 py-1 rounded-xl border flex items-center gap-1 shrink-0 transition-all ${
            filterSignatureOnly
              ? 'bg-[#c5a059] text-[#121615] border-[#c5a059] shadow-sm'
              : 'bg-white text-[#525a56] border-gray-200 hover:bg-[#faf5ea]'
          }`}
        >
          <Star size={11} className={filterSignatureOnly ? 'fill-[#121615]' : 'text-[#c5a059]'} />
          <span>⭐ Chef Signature</span>
        </button>

        <span className="text-[11px] text-[#8a928e] shrink-0 font-medium">
          • Sentuh menu untuk kustomisasi / pilihan topping
        </span>
      </div>

    </div>
  );
}
