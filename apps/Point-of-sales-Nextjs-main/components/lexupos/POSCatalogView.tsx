'use client';

import React, { useRef, useState } from 'react';
import { Store, Search, Plus, Info, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from './types';

interface POSCatalogViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  subcategories: string[];
  selectedSubcategory: string;
  setSelectedSubcategory: (sub: string) => void;
  filteredProducts: Product[];
  onAddToCart: (product: Product) => void;
}

import { useCurrency } from '@/hooks/useCurrency';

export default function POSCatalogView({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  subcategories,
  selectedSubcategory,
  setSelectedSubcategory,
  filteredProducts,
  onAddToCart
}: POSCatalogViewProps) {
  const { formatCurrency } = useCurrency();

  // Drag Scroll for Category tabs
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [isDraggingCat, setIsDraggingCat] = useState(false);
  const [startXCat, setStartXCat] = useState(0);
  const [scrollLeftCat, setScrollLeftCat] = useState(0);

  const handleCatMouseDown = (e: React.MouseEvent) => {
    if (!catScrollRef.current) return;
    setIsDraggingCat(true);
    setStartXCat(e.pageX - catScrollRef.current.offsetLeft);
    setScrollLeftCat(catScrollRef.current.scrollLeft);
  };
  const handleCatMouseLeave = () => setIsDraggingCat(false);
  const handleCatMouseUp = () => setIsDraggingCat(false);
  const handleCatMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCat || !catScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - catScrollRef.current.offsetLeft;
    catScrollRef.current.scrollLeft = scrollLeftCat - (x - startXCat) * 1.5;
  };

  // Drag Scroll for Subcategory tabs
  const subScrollRef = useRef<HTMLDivElement>(null);
  const [isDraggingSub, setIsDraggingSub] = useState(false);
  const [startXSub, setStartXSub] = useState(0);
  const [scrollLeftSub, setScrollLeftSub] = useState(0);

  const handleSubMouseDown = (e: React.MouseEvent) => {
    if (!subScrollRef.current) return;
    setIsDraggingSub(true);
    setStartXSub(e.pageX - subScrollRef.current.offsetLeft);
    setScrollLeftSub(subScrollRef.current.scrollLeft);
  };
  const handleSubMouseLeave = () => setIsDraggingSub(false);
  const handleSubMouseUp = () => setIsDraggingSub(false);
  const handleSubMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSub || !subScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - subScrollRef.current.offsetLeft;
    subScrollRef.current.scrollLeft = scrollLeftSub - (x - startXSub) * 1.5;
  };

  // Only show subcategory bar if there are actual subcategories (more than just 'All')
  const hasSubcategories = subcategories.length > 1;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 p-4 overflow-hidden">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <Store className="w-5 h-5 text-neutral-500" />
            <span>LexuPos Workspace</span>
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">Filter & Kelola pesanan secara real-time</p>
        </div>

        <div className="relative max-w-xs w-full sm:w-56">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
          <Input
            type="text"
            placeholder="Cari produk / subkategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl text-neutral-600 dark:text-neutral-200 text-xs h-8"
          />
        </div>
      </div>

      {/* ── Category Tab Bar ─────────────────────────────────────────────────── */}
      <div className="relative w-full min-w-0 border-b border-neutral-200 dark:border-white/[0.1] mb-1 shrink-0">
        <div
          ref={catScrollRef}
          onMouseDown={handleCatMouseDown}
          onMouseLeave={handleCatMouseLeave}
          onMouseUp={handleCatMouseUp}
          onMouseMove={handleCatMouseMove}
          className="flex flex-nowrap items-center gap-2 overflow-x-auto py-1.5 no-scrollbar w-full max-w-full min-w-0 cursor-grab active:cursor-grabbing select-none"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200 text-center flex items-center justify-center cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-neutral-800 text-white border border-neutral-800 dark:bg-white dark:text-black dark:border-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.1] hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Subcategory Tab Bar (only shown when subcategories exist) ─────────── */}
      {hasSubcategories && (
        <div className="relative w-full min-w-0 mb-3 shrink-0">
          <div
            ref={subScrollRef}
            onMouseDown={handleSubMouseDown}
            onMouseLeave={handleSubMouseLeave}
            onMouseUp={handleSubMouseUp}
            onMouseMove={handleSubMouseMove}
            className="flex flex-nowrap items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar w-full max-w-full min-w-0 cursor-grab active:cursor-grabbing select-none"
          >
            <Layers className="w-3 h-3 text-neutral-400 shrink-0 ml-0.5" />
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedSubcategory === sub
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-200 dark:hover:bg-zinc-700'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Product Grid ─────────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto thin-scrollbar flex-1 pr-1 ${!hasSubcategories ? 'mt-3' : ''}`}>
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:-translate-y-1 transition-all duration-305 group"
          >
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-200/50 dark:bg-neutral-950 mb-2.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
              {/* Only show subcategory badge — keeps card clean */}
              <div className="absolute top-2 right-2">
                {product.subcategory ? (
                  <div className="bg-black/60 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-medium">
                    {product.subcategory}
                  </div>
                ) : (
                  <div className="bg-black/60 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-medium">
                    {product.category}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <h3 className="font-semibold text-neutral-700 dark:text-neutral-200 text-xs line-clamp-2 min-h-[28px] group-hover:text-blue-500 transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-neutral-800 dark:text-white">
                  {formatCurrency(product.price)}
                </span>
                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/[0.1] group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-400">
            <Info className="w-10 h-10 mx-auto mb-3 opacity-45" />
            <p className="text-xs">Tidak ada produk ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
