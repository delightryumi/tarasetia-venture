'use client';

import React, { useRef, useState } from 'react';
import { Store, Search, Plus, Info, Layers, RotateCcw, Utensils } from 'lucide-react';
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
import styles from './LexuPos.module.css';

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

  const [currentShift, setCurrentShift] = useState<any>(null);

  React.useEffect(() => {
    const readShift = () => {
      if (typeof window === 'undefined') return;
      try {
        const raw = localStorage.getItem('active_shift');
        if (raw) setCurrentShift(JSON.parse(raw));
        else setCurrentShift(null);
      } catch {
        setCurrentShift(null);
      }
    };
    readShift();
    window.addEventListener('storage', readShift);
    return () => window.removeEventListener('storage', readShift);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'hidden' }}>
      {/* Header & Search */}
      <div className={styles.catalogHeader}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={15} />
          <input
            type="text"
            placeholder="Cari produk / barcode / kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* NextLevel Live Shift Status Indicator */}
        <div>
          {currentShift ? (
            <a
              href="/cashier"
              className={styles.shiftBadgeLink}
              title="Klik untuk kelola kasir dan cash flow"
            >
              <span className={styles.shiftPulseDot} />
              <span>Shift: {currentShift.cashierName || 'Kasir'}</span>
              <span style={{ color: '#71717a', fontSize: '11px', fontWeight: 600 }}>
                ({formatCurrency(Number(currentShift.houseBank || 0))})
              </span>
            </a>
          ) : (
            <a
              href="/cashier"
              className={styles.shiftBadgeLink}
              style={{ color: '#d97706' }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} />
              <span>Kasir Belum Dibuka — Buka Shift</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Category Tab Bar ─────────────────────────────────────────────────── */}
      <div className={styles.categoryBar} ref={catScrollRef}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`${styles.categoryTab} ${selectedCategory === cat ? styles.categoryTabActive : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Subcategory Tab Bar (only shown when subcategories exist) ─────────── */}
      {hasSubcategories && (
        <div className={styles.subcategoryBar} ref={subScrollRef}>
          <Layers className="w-3 h-3 text-neutral-400 shrink-0 ml-0.5" />
          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={`${styles.subcategoryTab} ${selectedSubcategory === sub ? styles.subcategoryTabActive : ''}`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* ── Product Grid ─────────────────────────────────────────────────────── */}
      <div className={styles.productGrid}>
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => onAddToCart(product)}
            className={styles.productCard}
          >
            <div className={styles.productImgBox}>
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.name}
                  className={styles.productImg}
                />
              ) : (
                <Utensils className="w-8 h-8 opacity-40 text-neutral-400" />
              )}
              {product.subcategory ? (
                <div className={styles.productSubcategoryTag}>
                  {product.subcategory}
                </div>
              ) : (
                <div className={styles.productSubcategoryTag}>
                  {product.category}
                </div>
              )}
            </div>

            <div className={styles.productInfo}>
              <h3 className={styles.productName}>
                {product.name}
              </h3>
              <div className={styles.productPriceRow}>
                <span className={styles.productPrice}>
                  {formatCurrency(product.price)}
                </span>
                <div className={styles.productAddBtn}>
                  <Plus className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: '#71717a' }}>
            <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p style={{ fontSize: 12, fontWeight: 600 }}>Tidak ada produk ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
