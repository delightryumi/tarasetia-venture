'use client';

import React, { useRef, useState } from 'react';
import { Store, Search, Plus, Info, Layers, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from './types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [isDraggingCat, setIsDraggingCat] = useState(false);
  const [startXCat, setStartXCat] = useState(0);
  const [scrollLeftCat, setScrollLeftCat] = useState(0);

  const handleCatPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (!catScrollRef.current) return;
    setIsDraggingCat(true);
    setStartXCat(e.pageX - catScrollRef.current.offsetLeft);
    setScrollLeftCat(catScrollRef.current.scrollLeft);
  };
  const handleCatPointerLeave = () => setIsDraggingCat(false);
  const handleCatPointerUp = () => setIsDraggingCat(false);
  const handleCatPointerMove = (e: React.PointerEvent) => {
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

  const handleSubPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (!subScrollRef.current) return;
    setIsDraggingSub(true);
    setStartXSub(e.pageX - subScrollRef.current.offsetLeft);
    setScrollLeftSub(subScrollRef.current.scrollLeft);
  };
  const handleSubPointerLeave = () => setIsDraggingSub(false);
  const handleSubPointerUp = () => setIsDraggingSub(false);
  const handleSubPointerMove = (e: React.PointerEvent) => {
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
      <div className="flex items-center justify-start gap-3 mb-4 shrink-0">
        <div className="relative max-w-xs w-full sm:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            type="text"
            placeholder="Cari produk / subkategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-4 bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-[6px] text-neutral-600 dark:text-neutral-200 text-xs h-11"
          />
        </div>
      </div>

      {/* ── Category Tab Bar ─────────────────────────────────────────────────── */}
      <div className="relative w-full min-w-0 border-b border-neutral-200 dark:border-white/[0.1] mb-2 shrink-0">
        {/* Mobile Dropdown */}
        <div className="flex md:hidden w-full pb-1">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-9 px-3 rounded-[6px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Kategori: {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Tabs */}
        <div
          ref={catScrollRef}
          onPointerDown={handleCatPointerDown}
          onPointerLeave={handleCatPointerLeave}
          onPointerUp={handleCatPointerUp}
          onPointerMove={handleCatPointerMove}
          style={{ touchAction: 'pan-x' }}
          className="hidden md:flex flex-nowrap items-center gap-2 overflow-x-auto py-1.5 no-scrollbar w-full max-w-full min-w-0 cursor-grab active:cursor-grabbing select-none"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-[6px] text-[11px] font-bold whitespace-nowrap transition-all duration-200 text-center flex items-center justify-center cursor-pointer ${
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
          {/* Mobile Subcategory Dropdown */}
          <div className="flex md:hidden w-full pb-1">
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full h-8 px-3 rounded-[6px] bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-white/[0.08] text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  Subkategori: {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Subcategory Tabs */}
          <div
            ref={subScrollRef}
            onPointerDown={handleSubPointerDown}
            onPointerLeave={handleSubPointerLeave}
            onPointerUp={handleSubPointerUp}
            onPointerMove={handleSubPointerMove}
            style={{ touchAction: 'pan-x' }}
            className="hidden md:flex flex-nowrap items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar w-full max-w-full min-w-0 cursor-grab active:cursor-grabbing select-none"
          >
            <Layers className="w-3 h-3 text-neutral-400 shrink-0 ml-0.5" />
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`px-3 py-1 rounded-[6px] text-[10px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedSubcategory === sub
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
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
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto thin-scrollbar flex-1 pr-1 ${!hasSubcategories ? 'mt-3' : ''}`}>
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-[10px] p-2 md:p-2.5 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:-translate-y-1 transition-all duration-305 group"
          >
            <div className="relative h-20 xs:h-24 md:h-auto md:aspect-square w-full rounded-xl overflow-hidden bg-slate-200/50 dark:bg-neutral-950 mb-1.5 md:mb-2.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
              {/* Only show subcategory badge — keeps card clean */}
              <div className="absolute top-1.5 right-1.5">
                {product.subcategory ? (
                  <div className="bg-black/60 backdrop-blur-md text-white text-[8px] md:text-[9px] px-2 py-0.5 rounded-full font-medium">
                    {product.subcategory}
                  </div>
                ) : (
                  <div className="bg-black/60 backdrop-blur-md text-white text-[8px] md:text-[9px] px-2 py-0.5 rounded-full font-medium">
                    {product.category}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <h3 className="font-semibold text-neutral-700 dark:text-neutral-200 text-[11px] md:text-xs line-clamp-2 min-h-[24px] md:min-h-[28px] group-hover:text-blue-500 transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] md:text-xs font-bold text-neutral-800 dark:text-white truncate max-w-[70%]">
                  {formatCurrency(product.price)}
                </span>
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/[0.1] group-hover:bg-neutral-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-colors shrink-0">
                  <Plus className="w-2.5 h-2.5 md:w-3 md:h-3" />
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
