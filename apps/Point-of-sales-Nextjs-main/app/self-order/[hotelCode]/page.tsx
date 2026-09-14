'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc, addDoc } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import { Utensils } from 'lucide-react';

// Modular Luxury Components
import Header from './components/Header';
import HeroSlider from './components/HeroSlider';
import CategoryNav from './components/CategoryNav';
import ProductGrid, { Product, CartItem } from './components/ProductGrid';
import CartCheckout from './components/CartCheckout';
import SuccessScreen from './components/SuccessScreen';
import ProductDetailModal from './components/ProductDetailModal';

export default function GuestSelfOrderingPage({ params }: { params: Promise<{ hotelCode: string }> }) {
  const unwrappedParams = React.use(params);
  const hotelCode = unwrappedParams.hotelCode;

  // Global State
  const [hotelData, setHotelData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promoBanners, setPromoBanners] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filterSignatureOnly, setFilterSignatureOnly] = useState(false);

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cashier');
  const [qrisImage, setQrisImage] = useState<string | null>(null);
  const [shopLogo, setShopLogo] = useState<string | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');

  // Refs
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Load static assets
  useEffect(() => {
    const savedQris = localStorage.getItem('staticQris');
    if (savedQris) setQrisImage(savedQris);

    const savedLogo = localStorage.getItem('shopLogo');
    if (savedLogo) setShopLogo(savedLogo);

    const handleLogoChange = () => {
      const updated = localStorage.getItem('shopLogo');
      if (updated) setShopLogo(updated);
    };
    window.addEventListener('logoChanged', handleLogoChange);
    return () => window.removeEventListener('logoChanged', handleLogoChange);
  }, []);

  // Fetch Config & Data
  useEffect(() => {
    if (!hotelCode) return;

    // 1. Hotel Info
    const fetchHotelData = async () => {
      try {
        const snap = await getDoc(doc(db, 'hotels', hotelCode));
        if (snap.exists()) {
          const data = snap.data();
          setHotelData(data);
          if (data.logo || data.shopLogo) setShopLogo(data.logo || data.shopLogo);
          if (data.qrisUrl) setQrisImage(data.qrisUrl);
        }
      } catch (err) {
        console.error('Error fetching hotel data:', err);
      }
    };
    fetchHotelData();

    // 2. Read URL params
    const searchParams = new URLSearchParams(window.location.search);
    const table =
      searchParams.get('table') ||
      searchParams.get('meja') ||
      searchParams.get('kamar') ||
      searchParams.get('room');
    if (table) setTableNumber(table);

    // 3. POS Settings
    const configRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order');
    const unsubConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.promoBanners) setPromoBanners(data.promoBanners);
        if (data.shopLogo || data.logo) setShopLogo(data.shopLogo || data.logo);
        if (data.qrisUrl) setQrisImage(data.qrisUrl);
      }
    });

    const posConfigRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
    const unsubPos = onSnapshot(posConfigRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.shopLogo || data.logo) setShopLogo(data.shopLogo || data.logo);
      }
    });

    // 4. Products & Categories
    const menuRef = collection(db, 'hotels', hotelCode, 'pos_products');
    const catRef = collection(db, 'hotels', hotelCode, 'pos_categories');

    const unsubCat = onSnapshot(catRef, (snap) => {
      const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCategories(cats);
    });

    const unsubMenu = onSnapshot(menuRef, (snap) => {
      const prods: Product[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          price: Number(data.price) || 0,
          description: data.description || '',
          categoryId: data.category || '',
          imageUrl: data.image || data.imageUrl || '',
          stock: data.stock !== undefined ? data.stock : 999,
          isAvailable: data.stock === undefined || data.stock > 0,
          addons: data.addons || [],
          isSignature: data.isSignature || false
        };
      });
      setProducts(prods);
    });

    return () => {
      unsubConfig();
      unsubPos();
      unsubCat();
      unsubMenu();
    };
  }, [hotelCode]);

  // Handlers
  const handleProductClick = (product: Product) => {
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
    setCart((prev) => [...prev, newItem]);
  };

  const handleQuickAdd = (product: Product) => {
    if (product.addons && product.addons.length > 0) {
      handleProductClick(product);
      return;
    }
    const existing = cart.find(
      (item) => item.productId === product.id && item.selectedAddons.length === 0 && !item.note
    );
    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.cartItemId === existing.cartItemId ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      handleAddToCart(product.id, 1, [], '');
    }
  };

  const handleQuickUpdateQty = (productId: string, delta: number) => {
    const targetItem = cart.find((item) => item.productId === productId);
    if (!targetItem) return;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === targetItem.cartItemId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !tableNumber.trim()) {
      alert('Mohon lengkapi Nama Pemesan dan No. Meja/Kamar terlebih dahulu.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const generatedOrderNum = `SO-${Math.floor(1000 + Math.random() * 9000)}`;

      const cartItems = cart.map((item) => {
        const p = products.find((prod) => prod.id === item.productId);
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
        const addonsTotal = item.addons.reduce((a: number, b: any) => a + b.price, 0);
        return sum + (item.price + addonsTotal) * item.qty;
      }, 0);
      const tax = Math.round(subtotal * 0.10);
      const total = subtotal + tax;

      const formattedCart = cartItems.map((item) => {
        const p = products.find((prod) => prod.id === item.id);
        return {
          cartItemId: item.cartItemId,
          product: {
            id: item.id,
            name: item.name,
            price: item.price,
            category: (p as any)?.category || item.categoryId || '',
            subcategory: (p as any)?.subcategory || '',
            image: (p as any)?.image || ''
          },
          quantity: item.qty,
          selectedAddons: item.addons || [],
          note: item.note || ''
        };
      });

      const orderData = {
        orderNumber: generatedOrderNum,
        customerName: customerName.trim(),
        tableNumber: tableNumber.trim(),
        orderType: 'Self-Order Tamu',
        source: 'Self-Order Tamu',
        cart: formattedCart,
        items: cartItems,
        notes: orderNotes.trim(),
        subtotal,
        tax,
        discount: 0,
        discountPercent: 0,
        payableAmount: total,
        total,
        paymentStatus: 'PENDING',
        isPaidDirectly: false,
        paymentMethod: paymentMethod === 'qris' ? 'QRIS' : 'Cashier',
        restoId: 'default-resto',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'hotels', hotelCode, 'pos_held_orders'), orderData);

      setLastOrderNumber(generatedOrderNum);
      setOrderCompleted(true);
      setIsDrawerOpen(false);
      setCart([]);
    } catch (err) {
      console.error('Error submitting order:', err);
      alert('Gagal mengirim pesanan. Silakan coba lagi.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Product Counts By Category
  const productCountsByCategory = products.reduce((acc: Record<string, number>, p) => {
    if (p.categoryId) {
      acc[p.categoryId] = (acc[p.categoryId] || 0) + 1;
    }
    return acc;
  }, {});

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCat =
      activeCategory === 'all' ||
      (p.categoryId || '').toLowerCase() === activeCategory?.toLowerCase();

    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSignature = !filterSignatureOnly || Boolean(p.isSignature);

    return matchCat && matchSearch && matchSignature;
  });

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <main className="self-order-container self-order-max-width min-h-screen flex flex-col pt-0 pb-12">
      {/* 1. Glass Header */}
      <Header
        hotelData={hotelData}
        shopLogo={shopLogo}
        tableNumber={tableNumber}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
      />

      {/* 2. Main Page Body */}
      <div className="w-full px-4 sm:px-6 z-10 flex-grow pt-[100px] sm:pt-[112px]">
        <AnimatePresence mode="wait">
          {orderCompleted ? (
            <SuccessScreen
              orderNumber={lastOrderNumber}
              onNewOrder={() => {
                setOrderCompleted(false);
                setCustomerName('');
                setTableNumber('');
                setOrderNotes('');
              }}
            />
          ) : (
            <div id="menu-section">
              {/* Promotional Hero Carousel (Only shown when not actively searching and banners exist) */}
              {!searchQuery && promoBanners && promoBanners.length > 0 && (
                <HeroSlider
                  promoBanners={promoBanners}
                  onBannerClick={(prodId) => {
                    if (!prodId) return;
                    const linkedProduct = products.find((p) => p.id === prodId);
                    if (linkedProduct) handleProductClick(linkedProduct);
                  }}
                />
              )}

              {/* Category Sticky Navigation & Fast Filters */}
              <CategoryNav
                categories={categories}
                activeCategory={activeCategory}
                onSelectCategory={(catName) => {
                  setActiveCategory(catName);
                  if (isSearchOpen && searchQuery) setSearchQuery('');
                }}
                categoriesRef={categoriesRef}
                filterSignatureOnly={filterSignatureOnly}
                setFilterSignatureOnly={setFilterSignatureOnly}
                productCountsByCategory={productCountsByCategory}
                totalProductsCount={products.length}
              />

              {/* Product Card Grid */}
              <ProductGrid
                products={filteredProducts}
                cart={cart}
                onProductClick={handleProductClick}
                onQuickAdd={handleQuickAdd}
                onQuickUpdateQty={handleQuickUpdateQty}
                formatRupiah={formatRupiah}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
        formatRupiah={formatRupiah}
      />

      {/* 4. Cart Floating Dock & Checkout Drawer */}
      {!orderCompleted && (
        <CartCheckout
          cart={cart}
          products={products}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          customerName={customerName}
          setCustomerName={setCustomerName}
          tableNumber={tableNumber}
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

      {/* 5. Powered by Tara Logo Footer */}
      <footer className="py-10 pb-28 sm:pb-24 flex flex-col items-center justify-center gap-2 mt-auto border-t border-[#c5a059]/15">
        <a
          href="https://mytara.id"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-2 no-underline cursor-pointer group"
        >
          <span className="text-[10px] sm:text-[10.5px] uppercase font-bold tracking-[0.22em] text-[#8c6e33]/80 so-display-font group-hover:text-[#8c6e33] transition-colors">
            Powered by
          </span>
          <img
            src="/channels/1.png"
            alt="Tara"
            className="h-10 sm:h-11 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
          />
        </a>
      </footer>
    </main>
  );
}
