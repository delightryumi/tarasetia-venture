import React from 'react';

interface CategoryNavProps {
  categories: any[];
  activeCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  categoriesRef: React.RefObject<HTMLDivElement | null>;
}

export default function CategoryNav({ categories, activeCategory, onSelectCategory, categoriesRef }: CategoryNavProps) {
  if (categories.length === 0) return null;

  return (
    <div className="sticky top-[88px] z-20 bg-sb-canvas pb-4 pt-2 -mx-4 px-4">
      <div 
        ref={categoriesRef}
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2 items-center"
      >
        <button
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 px-5 py-2 rounded-full text-[14px] font-semibold transition-all shadow-sm ${
            activeCategory === 'all' 
              ? 'bg-sb-accent text-white border border-sb-accent scale-95' 
              : 'bg-transparent text-sb-text border border-sb-text hover:bg-black/5'
          }`}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.name)}
            className={`shrink-0 px-5 py-2 rounded-full text-[14px] font-semibold transition-all shadow-sm ${
              activeCategory === cat.name 
                ? 'bg-sb-accent text-white border border-sb-accent scale-95' 
                : 'bg-transparent text-sb-text border border-sb-text hover:bg-black/5'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
