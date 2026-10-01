'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Search, Plus, Info, Layers, Utensils, LayoutGrid, List } from 'lucide-react';
import { Product } from './types';
import styles from './POSCatalogView.module.css';
import { useCurrency } from '@/hooks/useCurrency';

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Load and persist preferred view mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedMode = localStorage.getItem('lexupos_catalog_view_mode');
      if (savedMode === 'grid' || savedMode === 'table') {
        setViewMode(savedMode);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('lexupos_catalog_view_mode', mode);
    } catch {
      // ignore
    }
  };

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

  const hasSubcategories = subcategories.length > 1;
  const [currentShift, setCurrentShift] = useState<any>(null);

  useEffect(() => {
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
    <div className={styles.catalogContainer}>
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

        <div className={styles.headerActions}>
          {/* Dual View Mode Toggle (Grid vs Table) */}
          <div className={styles.viewToggleGroup} title="Ganti Tampilan Produk">
            <button
              type="button"
              onClick={() => handleToggleViewMode('grid')}
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
              title="Tampilan Grid (Kartu)"
            >
              <LayoutGrid size={14} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('table')}
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
              title="Tampilan Tabel (Daftar Presisi)"
            >
              <List size={14} />
              <span>Tabel</span>
            </button>
          </div>

          {/* Shift Status Indicator */}
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
      <div
        className={styles.categoryBar}
        ref={catScrollRef}
        onPointerDown={handleCatPointerDown}
        onPointerLeave={handleCatPointerLeave}
        onPointerUp={handleCatPointerUp}
        onPointerMove={handleCatPointerMove}
      >
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
        <div
          className={styles.subcategoryBar}
          ref={subScrollRef}
          onPointerDown={handleSubPointerDown}
          onPointerLeave={handleSubPointerLeave}
          onPointerUp={handleSubPointerUp}
          onPointerMove={handleSubPointerMove}
        >
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

      {/* ── VIEW MODE 1: GRID VIEW ────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className={styles.productGrid}>
          {filteredProducts.map((product) => {
            const isSoldOut = (product.stock !== undefined && product.stock <= 0) || product.isAvailable === false;
            return (
              <div
                key={product.id}
                onClick={() => {
                  if (!isSoldOut) onAddToCart(product);
                }}
                className={`${styles.productCard} ${isSoldOut ? styles.productCardSoldOut : ''}`}
                title={isSoldOut ? `${product.name} (Stok Habis / Sold Out)` : `Klik untuk menambahkan ${product.name}`}
              >
                <div className={styles.productImgBox}>
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className={styles.productImg}
                      loading="lazy"
                    />
                  ) : (
                    <Utensils className="w-8 h-8 opacity-40 text-neutral-400" />
                  )}
                  {isSoldOut ? (
                    <div className={styles.soldOutOverlay}>
                      <span className={styles.soldOutOverlayBadge}>Sold Out</span>
                    </div>
                  ) : product.subcategory ? (
                    <div className={styles.productSubcategoryTag}>
                      {product.subcategory}
                    </div>
                  ) : product.category ? (
                    <div className={styles.productSubcategoryTag}>
                      {product.category}
                    </div>
                  ) : null}
                </div>

                <div className={styles.productInfo}>
                  <h3 className={styles.productName} title={product.name}>
                    {product.name}
                  </h3>
                  <div className={styles.productPriceRow}>
                    <div className="flex flex-col">
                      <span className={styles.productPrice}>
                        {formatCurrency(product.price)}
                      </span>
                      {product.stock !== undefined && (
                        <span className={`text-[10px] font-semibold ${isSoldOut ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {isSoldOut ? 'Stok Habis' : `Stok: ${product.stock}`}
                        </span>
                      )}
                    </div>
                    {isSoldOut ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 dark:bg-red-950/60 dark:text-red-400 px-2 py-1 rounded-md border border-red-200 dark:border-red-900">
                        Habis
                      </span>
                    ) : (
                      <div className={styles.productAddBtn}>
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className={styles.emptyState}>
              <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className={styles.emptyStateTitle}>Tidak ada produk ditemukan.</p>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW MODE 2: TABLE VIEW ───────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className={styles.tableWrapper}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th className={styles.thCell} style={{ width: '56px', textAlign: 'center' }}>Foto</th>
                <th className={styles.thCell}>Nama Produk</th>
                <th className={styles.thCell}>Kategori</th>
                <th className={styles.thCell} style={{ textAlign: 'center' }}>Stok</th>
                <th className={styles.thCell} style={{ textAlign: 'right' }}>Harga</th>
                <th className={styles.thCell} style={{ width: '90px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isSoldOut = (product.stock !== undefined && product.stock <= 0) || product.isAvailable === false;
                return (
                  <tr
                    key={product.id}
                    onClick={() => {
                      if (!isSoldOut) onAddToCart(product);
                    }}
                    className={`${styles.tableRow} ${isSoldOut ? styles.productCardSoldOut : ''}`}
                    title={isSoldOut ? `${product.name} (Sold Out)` : `Klik untuk menambahkan ${product.name}`}
                  >
                    <td className={styles.tdCell} style={{ textAlign: 'center' }}>
                      <div className={styles.tableThumbBox}>
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className={styles.tableThumbImg}
                            loading="lazy"
                          />
                        ) : (
                          <Utensils className="w-4 h-4 opacity-40 text-neutral-400" />
                        )}
                      </div>
                    </td>
                    <td className={styles.tdCell}>
                      <div className="flex items-center gap-2">
                        <div className={styles.tableProductName}>{product.name}</div>
                        {isSoldOut && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.5 rounded">
                            Sold Out
                          </span>
                        )}
                      </div>
                      {product.subcategory && (
                        <span style={{ fontSize: '10px', color: '#71717a' }}>
                          {product.subcategory}
                        </span>
                      )}
                    </td>
                    <td className={styles.tdCell}>
                      <span className={styles.tableCategoryBadge}>
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className={styles.tdCell} style={{ textAlign: 'center' }}>
                      {product.stock !== undefined ? (
                        isSoldOut ? (
                          <span className="text-xs font-bold text-red-600">0 (Habis)</span>
                        ) : (
                          <span className="text-xs font-semibold">{product.stock}</span>
                        )
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className={styles.tdCell} style={{ textAlign: 'right' }}>
                      <span className={styles.tablePrice}>
                        {formatCurrency(product.price)}
                      </span>
                    </td>
                    <td className={styles.tdCell} style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        disabled={isSoldOut}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSoldOut) onAddToCart(product);
                        }}
                        className={`${styles.tableAddButton} ${isSoldOut ? styles.tableAddButtonDisabled : ''}`}
                      >
                        {isSoldOut ? (
                          <span>Habis</span>
                        ) : (
                          <>
                            <Plus size={13} />
                            <span>Tambah</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className={styles.emptyStateTitle}>Tidak ada produk ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
