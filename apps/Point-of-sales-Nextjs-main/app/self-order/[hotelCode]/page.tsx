'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc, addDoc, setDoc } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';

// Modular Components
import Header from './components/Header';
import HeroSlider from './components/HeroSlider';
import CategoryNav from './components/CategoryNav';
import ProductGrid from './components/ProductGrid';
import CartCheckout from './components/CartCheckout';
import SuccessScreen from './components/SuccessScreen';
import ProductDetailModal from './components/ProductDetailModal';
import { CartItem } from './components/ProductGrid';

export default function GuestSelfOrderingPage({ params }: { params: Promise<{ hotelCode: string }> }) {
  const unwrappedParams = React.use(params);
  const hotelCode = unwrappedParams.hotelCode;

  // Global State
  const [hotelData, setHotelData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [promoBanners, setPromoBanners] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>('all');
  
  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cashier');
  const [qrisImage, setQrisImage] = useState<string | null>(null);
  const [shopLogo, setShopLogo] = useState<string | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  
  // Refs
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Load static assets
  useEffect(() => {
    const savedQris = localStorage.getItem('staticQris');
    if (savedQris) setQrisImage(savedQris);
    
    const savedLogo = localStorage.getItem('shopLogo');
    if (savedLogo) setShopLogo(savedLogo);
  }, []);

  // Fetch Config & Data
  useEffect(() => {
    if (!hotelCode) return;

    // 1. Hotel Info
    const fetchHotelData = async () => {
      try {
        const snap = await getDoc(doc(db, 'hotels', hotelCode));
        if (snap.exists()) {
          setHotelData(snap.data());
        }
      } catch (err) {
        console.error("Error fetching hotel data:", err);
      }
    };
    fetchHotelData();

    // 2. Read URL params
    const searchParams = new URLSearchParams(window.location.search);
    const table = searchParams.get('table');
    if (table) setTableNumber(table);

    // 3. POS Settings
    const configRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order');
    const unsubConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.promoBanners) setPromoBanners(data.promoBanners);
      }
    });

    // 4. Products & Categories
    const menuRef = collection(db, 'hotels', hotelCode, 'pos_products');
    const catRef = collection(db, 'hotels', hotelCode, 'pos_categories');

    const unsubCat = onSnapshot(catRef, (snap) => {
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(cats);
    });

    const unsubMenu = onSnapshot(menuRef, (snap) => {
      const prods = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          price: data.price || 0,
          description: data.description || '',
          categoryId: data.category || '',
          imageUrl: data.image || '',
          stock: data.stock || 0,
          stock: data.stock || 0,
          isAvailable: (data.stock || 0) > 0,
          addons: data.addons || [],
          ...data
        };
      });
      setProducts(prods);
    });

    return () => {
      unsubConfig();
      unsubCat();
      unsubMenu();
    };
  }, [hotelCode]);

  // Handlers
  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (productId: string, qty: number, selectedAddons: any[], note: string) => {
    const newItem: CartItem = {
      cartItemId: Math.random().toString(36).substring(7),
      productId,
      qty,
      selectedAddons,
      note
    };
    setCart(prev => [...prev, newItem]);
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };


  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !tableNumber.trim()) {
      alert("Mohon isi Nama Pemesan dan No. Meja terlebih dahulu.");
      return;
    }
    
    setSubmittingOrder(true);
    try {
      const totalItems = cart.reduce((a, b) => a + b.qty, 0);
      const cartItems = cart.map(item => {
        const p = products.find(prod => prod.id === item.productId);
        return {
          id: item.productId,
          cartItemId: item.cartItemId,
          name: p?.name || 'Unknown',
          price: p?.price || 0,
          qty: item.qty,
          categoryId: p?.categoryId || null,
          addons: item.selectedAddons || [],
          note: item.note || ''
        };
      });
      const subtotal = cartItems.reduce((sum, item) => {
        const addonsTotal = item.addons.reduce((a, b) => a + b.price, 0);
        return sum + ((item.price + addonsTotal) * item.qty);
      }, 0);
      const tax = subtotal * 0.11;
      const total = subtotal + tax;

      const orderData = {
        orderNumber: `SO-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: customerName.trim(),
        tableNumber: tableNumber || 'Walk-in',
        orderType: 'Self-Order Tamu',
        items: cartItems,
        notes: orderNotes.trim(),
        subtotal,
        tax,
        total,
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod === 'qris' ? 'QRIS' : 'Cashier',
        restoId: 'default-resto',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'hotels', hotelCode, 'pos_held_orders'), orderData);
      
      setOrderCompleted(true);
      setIsDrawerOpen(false);
      setCart([]);
    } catch (err) {
      console.error("Error submitting order:", err);
      alert("Gagal mengirim pesanan. Silakan coba lagi.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Subcategory extraction
  let currentSubcategories: string[] = [];
  if (activeCategory !== 'all') {
    const matchedCat = categories.find(c => (c.name || '').toLowerCase() === (activeCategory || '').toLowerCase());
    const definedSubs = matchedCat?.subcategories || [];
    const productSubs = products
      .filter(p => (p.categoryId || '').toLowerCase() === activeCategory?.toLowerCase())
      .map(p => p.subcategory)
      .filter(Boolean);
    currentSubcategories = Array.from(new Set([...definedSubs, ...productSubs]));
  }

  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'all' || (p.categoryId || '').toLowerCase() === activeCategory?.toLowerCase();
    const matchSub = activeSubcategory === 'all' || (p.subcategory || '').toLowerCase() === activeSubcategory?.toLowerCase();
    return matchCat && matchSub;
  });

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <>
      {/* Import Inter / Space Grotesk via Google Fonts for the Starbucks vibe */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600&display=swap" 
        rel="stylesheet" 
      />
      
      {/* 
        Main Canvas 
        Starbucks Neutral Warm: sb-canvas 
      */}
      <main className="bg-sb-canvas min-h-screen relative selection:bg-sb-accent selection:text-white flex flex-col pt-0 pb-20 font-sans tracking-[-0.01em]" style={{ fontFamily: "'Inter', sans-serif" }}>
        
        <Header 
          hotelData={hotelData} 
          shopLogo={shopLogo} 
          tableNumber={tableNumber} 
        />

        <div className="w-full px-4 md:px-8 z-10 flex-grow pt-[88px]">

          <AnimatePresence>
            {orderCompleted ? (
              <SuccessScreen onNewOrder={() => {
                setOrderCompleted(false);
                setCustomerName('');
                setTableNumber('');
              }} />
            ) : (
              <div id="menu-section">
                <HeroSlider promoBanners={promoBanners} />
                <CategoryNav 
                  categories={categories} 
                  activeCategory={activeCategory || 'all'}
                  onSelectCategory={(catName) => {
                    setActiveCategory(catName);
                    setActiveSubcategory('all');
                  }}
                  categoriesRef={categoriesRef}
                />

                {/* Subcategory Nav */}
                {currentSubcategories.length > 0 && (
                  <div className="sticky top-[140px] z-10 bg-sb-canvas pb-4 -mx-4 px-4 flex gap-2 overflow-x-auto scrollbar-none items-center">
                    <button
                      onClick={() => setActiveSubcategory('all')}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all shadow-sm ${
                        activeSubcategory === 'all' 
                          ? 'bg-neutral-800 text-white border border-neutral-800' 
                          : 'bg-white text-sb-text-soft border border-gray-200 hover:bg-neutral-50'
                      }`}
                    >
                      Semua
                    </button>
                    {currentSubcategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setActiveSubcategory(sub)}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all shadow-sm ${
                          activeSubcategory === sub 
                            ? 'bg-neutral-800 text-white border border-neutral-800' 
                            : 'bg-white text-sb-text-soft border border-gray-200 hover:bg-neutral-50'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}

                <ProductGrid 
                  products={filteredProducts} 
                  cart={cart} 
                  onProductClick={handleProductClick} 
                  formatRupiah={formatRupiah}
                />
              </div>
            )}
          </AnimatePresence>

        </div>

        <ProductDetailModal 
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddToCart={handleAddToCart}
          formatRupiah={formatRupiah}
        />

        {!orderCompleted && (
          <CartCheckout 
            cart={cart}
            products={products}
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
            customerName={customerName}
            setCustomerName={setCustomerName}
            tableNumber={tableNumber || ''}
            setTableNumber={setTableNumber}
            orderNotes={orderNotes}
            setOrderNotes={setOrderNotes}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            qrisImage={qrisImage}
            submittingOrder={submittingOrder}
            onSubmitOrder={handleSubmitOrder}
            formatRupiah={formatRupiah}
            onUpdateQuantity={handleUpdateQuantity}
          />
        )}

        <div className="py-10 flex flex-col items-center justify-center gap-3 mt-auto">
          <span className="text-[12px] text-[rgba(0,0,0,0.58)] font-mono uppercase tracking-widest">Powered by</span>
          <img src="/channels/1.png" alt="Setara Venture" className="h-8 object-contain grayscale opacity-60 mix-blend-multiply" />
        </div>
      </main>
    </>
  );
}
