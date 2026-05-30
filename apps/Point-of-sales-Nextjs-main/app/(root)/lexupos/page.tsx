'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Product, CartItem, PaymentMethodType } from '@/components/lexupos/types';
import HoldConfirmDialog from '@/components/lexupos/HoldConfirmDialog';
import ReceiptDialog from '@/components/lexupos/ReceiptDialog';
import POSCatalogView from '@/components/lexupos/POSCatalogView';
import POSCartSidebar from '@/components/lexupos/POSCartSidebar';
import SubCategoryTable from '@/components/lexupos/SubCategoryTable';
import PaymentWorkspace from '@/components/lexupos/PaymentWorkspace';
import { localDb } from '@/lib/dexie';
import { syncUnsyncedTransactions, syncProductsFromServer } from '@/lib/dexie-sync';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Dynamic products will be fetched from Dexie (localDb) synced with the backend
export default function LexuPosPage() {
  const [step, setStep] = useState<'pos' | 'payment'>('pos');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Customer, Table & Notes state
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Revenue Type state (alacarte vs banquet)
  const [revenueType, setRevenueType] = useState<'alacarte' | 'banquet'>('alacarte');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [cashierName, setCashierName] = useState('Kasir');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [taxRatePercent, setTaxRatePercent] = useState(10);
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');

  // Fetch real products from IndexedDB (Dexie)
  const localProducts = useLiveQuery(() => localDb.products.toArray(), []) || [];
  
  // Transform to match the POS component's Product type
  const dynamicProducts: Product[] = localProducts.map(lp => ({
    id: lp.id,
    name: lp.name,
    price: lp.price,
    category: lp.cat,
    subcategory: lp.subcategory || '',
    image: lp.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
  }));

  // Extract unique categories from dynamic products and merge with custom categories
  const allRawCats = [...customCategories, ...dynamicProducts.map(p => p.category)];
  const validCats = Array.from(new Set(allRawCats)).filter(c => typeof c === 'string' && c.trim() !== '');
  const dynamicCategories = ['All', ...validCats.sort()];

  // Build subcategory list based on selected category
  const subcategorySource = selectedCategory === 'All'
    ? dynamicProducts
    : dynamicProducts.filter(p => p.category === selectedCategory);
  const rawSubcats = subcategorySource
    .map(p => p.subcategory)
    .filter((s): s is string => !!s && s.trim() !== '');
  const dynamicSubcategories = ['All', ...Array.from(new Set(rawSubcats)).sort()];

  // Load user data on mount and sync products
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snap = await getDocs(collection(db, 'pos_categories'));
        const dbCats = snap.docs.map(doc => doc.data().name);
        setCustomCategories(dbCats);
      } catch (e) {
        console.error('Failed to fetch categories:', e);
      }
    };
    fetchCategories();

    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.name) setCashierName(user.name);
        if (user.restoId) {
          syncProductsFromServer(user.restoId);
        }
      } catch (e) {}
    }

    const fetchShopTax = async () => {
      try {
        const response = await fetch('/api/shopdata', { cache: 'no-store' });
        if (response.ok) {
          const resData = await response.json();
          if (resData?.data) {
            const svc = Number(resData.data.service || 0);
            const tx = Number(resData.data.tax || 0);
            const lb = Number(resData.data.lostBreakage || 0);
            setTaxRatePercent(svc + tx + lb);
          }
        }
      } catch (err) {
        console.error('Error fetching shop tax settings:', err);
      }
    };
    fetchShopTax();
  }, []);

  // Auto-switch and lock revenueType to 'banquet' if the cart contains any BANQUET items
  useEffect(() => {
    const hasBanquetItem = cart.some(
      (item) => item.product.category?.toUpperCase() === 'BANQUET'
    );
    if (hasBanquetItem) {
      setRevenueType('banquet');
    }
  }, [cart]);

  // Hold Confirm Dialog State
  const [isHoldConfirmOpen, setIsHoldConfirmOpen] = useState(false);

  const checkActiveShift = () => {
    if (typeof window !== 'undefined') {
      const activeShift = localStorage.getItem('active_shift');
      if (!activeShift) {
        toast.warning('Peringatan: Shift kasir belum dibuka! Silakan menuju ke halaman Cashier untuk membuka shift baru.');
        return false;
      }
    }
    return true;
  };

  const handleCategoryChange = (category: string) => {
    if (!checkActiveShift()) return;
    setSelectedCategory(category);
    setSelectedSubcategory('All'); // reset subcategory when category changes
  };

  const filteredProducts = dynamicProducts.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'All' || product.subcategory === selectedSubcategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.subcategory || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    if (!checkActiveShift()) return;
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    toast.success(`${product.name} ditambahkan.`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    if (!checkActiveShift()) return;
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    if (!checkActiveShift()) return;
    if (cart.length === 0) return;
    setCart([]);
    toast.info('Keranjang dibersihkan.');
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const tax = subtotal * (taxRatePercent / 100); 
  const discount = subtotal * (discountPercent / 100);
  const payableAmount = subtotal + tax - discount;

  const handleHoldConfirm = () => {
    const nameStr = customerName.trim() ? ` untuk ${customerName.trim()}` : '';
    const tableStr = tableNumber.trim() ? ` (Meja ${tableNumber.trim()})` : '';
    toast.info(`Pesanan${nameStr}${tableStr} ditunda (Hold Order).`);
    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setNotes('');
    setIsHoldConfirmOpen(false);
  };

  const handleProceed = () => {
    if (!checkActiveShift()) return;
    if (cart.length === 0) {
      toast.warning('Keranjang masih kosong!');
      return;
    }
    setCashAmount('0');
    setStep('payment');
  };

  const executePayment = () => {
    if (paymentMethod === 'cash') {
      const cashVal = parseFloat(cashAmount);
      if (isNaN(cashVal) || cashVal < payableAmount) {
        toast.error('Uang tunai yang diterima kurang atau tidak valid!');
        return;
      }
    }
    setIsReceiptOpen(true);
  };

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    
    // Save to active shift if it exists in localStorage
    if (typeof window !== 'undefined') {
      const activeShiftJson = localStorage.getItem('active_shift');
      const transactionId = `TRS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      if (activeShiftJson) {
        try {
          const activeShift = JSON.parse(activeShiftJson);
          const newTransaction = {
            id: transactionId,
            amount: payableAmount,
            method: paymentMethod,
            timestamp: new Date().toISOString(),
            revenueType: revenueType
          };
          activeShift.transactions = [...(activeShift.transactions || []), newTransaction];
          localStorage.setItem('active_shift', JSON.stringify(activeShift));
        } catch (err) {
          console.error('Error saving shift transaction:', err);
        }
      }

      // Also save the transaction to localDb IndexedDB for synchronising to SQLite/Postgres records
      const userJson = localStorage.getItem('user');
      let restoId = '';
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          restoId = user.restoId || '';
        } catch (e) {}
      }

      const localTx = {
        id: transactionId,
        restoId: restoId || 'default-resto',
        totalPrice: payableAmount,
        createdAt: new Date().toISOString(),
        isSynced: 0,
        revenueType: revenueType,
        paymentMethod: paymentMethod
      };

      const localItems = cart.map(item => ({
        transactionId: transactionId,
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }));

      const addTxPromise = localDb.transactions.put(localTx);
      const itemsPromise = localDb.transactionItems.bulkPut(localItems);
      const stockPromises = cart.map(async (item) => {
        const dbProd = await localDb.products.get(item.product.id);
        if (dbProd) {
          await localDb.products.update(item.product.id, {
            stock: Math.max(0, dbProd.stock - item.quantity)
          });
        }
      });

      Promise.all([addTxPromise, itemsPromise, ...stockPromises]).then(async () => {
        if (navigator.onLine) {
          await syncUnsyncedTransactions();
        }
      }).catch((err) => {
        console.error('Error saving transaction to localDb:', err);
      });

      // ALSO save the transaction to Firebase Firestore!
      try {
        const orderData = {
          items: cart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            category: item.product.category,
            image: item.product.image
          })),
          subtotal,
          tax,
          total: payableAmount,
          paymentMethod,
          customerName: customerName.trim() || 'Guest',
          tableNumber: tableNumber.trim() || '',
          notes: notes.trim() || '',
          timestamp: new Date(),
          revenueType: revenueType,
          transactionId: transactionId
        };
        
        addDoc(collection(db, "pos_orders"), orderData).then((docRef) => {
          addDoc(collection(db, "revenue_transactions"), {
            date: new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Jakarta',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date()),
            category: revenueType === 'banquet' ? 'Banquet Revenue' : 'Ala Carte Revenue',
            description: `POS Order #${docRef.id.slice(-6)} - ${customerName.trim() || 'Guest'}`,
            amount: payableAmount,
            type: "Nexura Collect",
            timestamp: new Date(),
            transactionId: transactionId
          });
        }).catch((err) => {
          console.error("Failed to sync order directly to Firebase:", err);
        });
      } catch (firebaseErr) {
        console.error("Firebase store order failed:", firebaseErr);
      }
    }

    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setNotes('');
    setCashAmount('');
    setRevenueType('alacarte');
    setStep('pos');
    toast.success('Transaksi selesai!');
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-1 flex-col w-full h-full">
        <div className="w-full h-[calc(100vh-100px)] flex rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-white/[0.1] shadow-sm">
          {/* Dynamic Style Tag to completely hide browser scrollbars */}
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none !important;
            }
            .no-scrollbar {
              -ms-overflow-style: none !important;  /* IE and Edge */
              scrollbar-width: none !important;  /* Firefox */
            }
          `}</style>

          {/* Confirmation Dialog Component */}
          <HoldConfirmDialog
            isOpen={isHoldConfirmOpen}
            onOpenChange={setIsHoldConfirmOpen}
            onConfirm={handleHoldConfirm}
          />

          {/* Receipt Dialog Component */}
          <ReceiptDialog
            isOpen={isReceiptOpen}
            onOpenChange={setIsReceiptOpen}
            customerName={customerName}
            tableNumber={tableNumber}
            notes={notes}
            paymentMethod={paymentMethod}
            cart={cart}
            subtotal={subtotal}
            tax={tax}
            discount={discount}
            payableAmount={payableAmount}
            cashAmount={cashAmount}
            cashierName={cashierName}
            onClose={handleCloseReceipt}
          />

          {step === 'pos' ? (
            <>
              {/* Left Side: Product Selection */}
              <POSCatalogView
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={handleCategoryChange}
                categories={dynamicCategories}
                subcategories={dynamicSubcategories}
                selectedSubcategory={selectedSubcategory}
                setSelectedSubcategory={(sub) => {
                  if (!checkActiveShift()) return;
                  setSelectedSubcategory(sub);
                }}
                filteredProducts={filteredProducts}
                onAddToCart={addToCart}
              />

              {/* Right Side: Cart Summary */}
              <POSCartSidebar
                customerName={customerName}
                setCustomerName={setCustomerName}
                tableNumber={tableNumber}
                setTableNumber={setTableNumber}
                notes={notes}
                setNotes={setNotes}
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onClearCart={clearCart}
                subtotal={subtotal}
                tax={tax}
                discount={discount}
                discountPercent={discountPercent}
                setDiscountPercent={setDiscountPercent}
                payableAmount={payableAmount}
                onHoldOrder={() => {
                  if (!checkActiveShift()) return;
                  setIsHoldConfirmOpen(true);
                }}
                onProceed={handleProceed}
              />
            </>
          ) : (
            /* Payment Step Interface */
            <PaymentWorkspace
              customerName={customerName}
              tableNumber={tableNumber}
              notes={notes}
              cart={cart}
              subtotal={subtotal}
              tax={tax}
              discount={discount}
              payableAmount={payableAmount}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cashAmount={cashAmount}
              setCashAmount={setCashAmount}
              onBackToPOS={() => setStep('pos')}
              onConfirmPayment={executePayment}
              revenueType={revenueType}
              setRevenueType={setRevenueType}
            />
          )}
        </div>
      </div>
    </div>
  );
}
