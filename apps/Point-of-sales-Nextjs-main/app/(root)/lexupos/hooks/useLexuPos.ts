import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Product, CartItem, PaymentMethodType } from '@/components/lexupos/types';
import { localDb } from '@/lib/dexie';
import { syncProductsFromServer } from '@/lib/dexie-sync';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc, updateDoc, arrayUnion, query, where, onSnapshot } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';

const getOrGenerateTableNumber = async (hotelCode: string, inputTable: string): Promise<string> => {
  if (inputTable && inputTable.trim() !== '') {
    return inputTable.trim();
  }

  try {
    const posRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
    const posSnap = await getDoc(posRef);
    let rawTables = '10';
    if (posSnap.exists()) {
      rawTables = posSnap.data().tables || '10';
    }

    let parsedTables: string[] = [];
    if (/^\d+$/.test(rawTables.trim())) {
      const count = parseInt(rawTables.trim());
      for (let i = 1; i <= count; i++) {
        parsedTables.push(`Meja ${i}`);
      }
    } else {
      parsedTables = rawTables.split(',').map(t => t.trim()).filter(Boolean);
    }

    const q = collection(db, 'hotels', hotelCode, 'pos_held_orders');
    const snap = await getDocs(q);
    const occupiedTableNames = snap.docs.map(doc => doc.data().tableNumber || '');

    const normalize = (val: string) => {
      const str = String(val).toLowerCase().trim();
      const withoutPrefix = str.replace(/^(meja|table)\s*/g, '');
      return withoutPrefix.replace(/[^a-z0-9]/g, '');
    };

    const occupiedNorms = occupiedTableNames.map(normalize);
    const emptyTables = parsedTables.filter(t => !occupiedNorms.includes(normalize(t)));

    if (emptyTables.length > 0) {
      return emptyTables[0];
    } else {
      let maxNum = parsedTables.length;
      occupiedTableNames.forEach(name => {
        const numMatch = name.match(/\d+/);
        if (numMatch) {
          const num = parseInt(numMatch[0]);
          if (num > maxNum) maxNum = num;
        }
      });
      return `Meja ${maxNum + 1}`;
    }
  } catch (err) {
    console.error("Error generating table number:", err);
    return "Meja Baru";
  }
};

export function useLexuPos() {
  const [step, setStep] = useState<'pos' | 'payment'>('pos');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Customer, Table & Notes state
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [restoredOrderId, setRestoredOrderId] = useState<string | null>(null);

  // Revenue Type state
  const [revenueType, setRevenueType] = useState<'alacarte' | 'banquet'>('alacarte');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [cashierName, setCashierName] = useState('Kasir');
  const [customCategories, setCustomCategories] = useState<{ name: string; subcategories: string[] }[]>([]);
  const [taxRatePercent, setTaxRatePercent] = useState(10);
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [isHoldConfirmOpen, setIsHoldConfirmOpen] = useState(false);
  const [activeHotelCode, setActiveHotelCode] = useState('87241');
  const [transactionId, setTransactionId] = useState<string>('');

  const localProducts = useLiveQuery(() => localDb.products.toArray(), []) || [];
  
  const dynamicProducts: Product[] = localProducts.map(lp => ({
    id: lp.id,
    name: lp.name,
    price: lp.price,
    category: lp.cat,
    subcategory: lp.subcategory || '',
    pnlTarget: lp.pnlTarget || '',
    image: lp.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
    description: lp.description || '',
    addons: lp.addons || []
  }));

  const allRawCats = [...customCategories.map(c => c.name)];
  const uniqueCatsMap = new Map<string, string>();
  allRawCats.forEach(c => {
    if (typeof c === 'string' && c.trim() !== '') {
      const upper = c.toUpperCase();
      if (!uniqueCatsMap.has(upper)) {
        uniqueCatsMap.set(upper, c);
      }
    }
  });
  const validCats = Array.from(uniqueCatsMap.values());
  const dynamicCategories = ['All', ...validCats.sort()];

  let rawSubcats: string[] = [];
  if (selectedCategory === 'All') {
    const definedSubcats = customCategories.flatMap(c => c.subcategories);
    rawSubcats = [...definedSubcats];
  } else {
    const matchedCat = customCategories.find(
      c => c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (matchedCat) {
      rawSubcats = matchedCat.subcategories;
    }
  }

  const uniqueSubCatsMap = new Map<string, string>();
  rawSubcats.forEach(s => {
    if (typeof s === 'string' && s.trim() !== '') {
      const upper = s.toUpperCase();
      if (!uniqueSubCatsMap.has(upper)) {
        uniqueSubCatsMap.set(upper, s);
      }
    }
  });
  const dynamicSubcategories = ['All', ...Array.from(uniqueSubCatsMap.values()).sort()];

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    let hotelCode = '87241';
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.name) setCashierName(user.name);
        if (user.restoId) {
          syncProductsFromServer(user.restoId);
        }
        if (user.hotelCode) {
            hotelCode = user.hotelCode;
            setActiveHotelCode(hotelCode);
        }
      } catch (e) {}
    }

    const fetchCategories = async () => {
      try {
        const snap = await getDocs(getHotelCollection(db, 'pos_categories', hotelCode));
        const dbCats = snap.docs.map(doc => ({
          name: doc.data().name || '',
          subcategories: doc.data().subcategories || [],
        }));
        setCustomCategories(dbCats);
      } catch (e) {
        console.error('Failed to fetch categories:', e);
      }
    };
    fetchCategories();

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

    // ── Sync active shift from Firestore across all devices ──
    // This ensures PC-B can see the shift opened by PC-A
    const unsubShift = onSnapshot(
      query(getHotelCollection(db, 'cashier_shifts', hotelCode), where('status', '==', 'open')),
      (snapshot) => {
        if (!snapshot.empty) {
          const shiftDoc = snapshot.docs[0];
          const shiftData = { id: shiftDoc.id, ...shiftDoc.data() };
          const current = localStorage.getItem('active_shift');
          // Only update if different (avoid overwriting local cashFlows)
          if (!current) {
            localStorage.setItem('active_shift', JSON.stringify(shiftData));
          } else {
            try {
              const local = JSON.parse(current);
              if (local.id !== shiftData.id) {
                // Different shift opened, replace
                localStorage.setItem('active_shift', JSON.stringify(shiftData));
              }
              // Same shift: keep local (it has more up-to-date cashFlows)
            } catch { localStorage.setItem('active_shift', JSON.stringify(shiftData)); }
          }
        } else {
          // No open shift — clear local
          localStorage.removeItem('active_shift');
        }
      }
    );
    return () => unsubShift();
  }, []);


  useEffect(() => {
    const handleRestoreEvent = () => {
      if (typeof window !== 'undefined') {
        const restoredJson = localStorage.getItem('restored_held_order');
        if (restoredJson) {
          try {
            const restoredOrder = JSON.parse(restoredJson);
            if (restoredOrder.cart && Array.isArray(restoredOrder.cart)) {
              setCart(restoredOrder.cart);
              setCustomerName(restoredOrder.customerName || '');
              setTableNumber(restoredOrder.tableNumber || '');
              setNotes(restoredOrder.notes || '');
              setDiscountPercent(restoredOrder.discountPercent || 0);
              setRestoredOrderId(restoredOrder.id);
              toast.success(`Mengembalikan pesanan held untuk ${restoredOrder.customerName || 'Guest'}`);
            }
          } catch (err) {
            console.error('Failed to parse restored held order:', err);
          } finally {
            localStorage.removeItem('restored_held_order');
          }
        }

        const prefilledTable = localStorage.getItem('prefilled_table_number');
        if (prefilledTable) {
          setTableNumber(prefilledTable);
          localStorage.removeItem('prefilled_table_number');
          toast.info(`Membuka meja baru: ${prefilledTable}`);
        }
      }
    };

    handleRestoreEvent();
    window.addEventListener('restore_held_order', handleRestoreEvent);
    return () => window.removeEventListener('restore_held_order', handleRestoreEvent);
  }, []);

  useEffect(() => {
    const hasBanquetItem = cart.some(
      (item) => item.product.category?.toUpperCase() === 'BANQUET'
    );
    if (hasBanquetItem) {
      setRevenueType('banquet');
    }
  }, [cart]);

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
    setSelectedSubcategory('All');
  };

  const filteredProducts = dynamicProducts.filter(product => {
    const matchesCategory = selectedCategory === 'All' || (product.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchesSubcategory = selectedSubcategory === 'All' || (product.subcategory || '').toLowerCase() === selectedSubcategory.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.subcategory || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  const handleProductClick = (product: Product) => {
    if (!checkActiveShift()) return;
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (product: Product, qty: number, selectedAddons: any[], note: string) => {
    setCart(prevCart => {
      const newItem: CartItem = {
        cartItemId: Math.random().toString(36).substring(7),
        product,
        quantity: qty,
        selectedAddons,
        note
      };
      return [...prevCart, newItem];
    });
    toast.success(`${product.name} ditambahkan.`);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    if (!checkActiveShift()) return;
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.cartItemId === cartItemId) {
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

  const subtotal = cart.reduce((acc, item) => {
    if (item.isCompliment) return acc;
    const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
    return acc + ((item.product.price + addonsTotal) * item.quantity);
  }, 0);
  const discount = subtotal * (discountPercent / 100);
  const tax = (subtotal - discount) * (taxRatePercent / 100); 
  const payableAmount = subtotal - discount + tax;

  const handleToggleCompliment = (cartItemId: string) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const isComp = !item.isCompliment;
        return {
          ...item,
          isCompliment: isComp,
          complimentReason: isComp ? (item.complimentReason || 'Service Recovery') : undefined
        };
      }
      return item;
    }));
  };

  const handleSetComplimentReason = (cartItemId: string, reason: string) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        return { ...item, complimentReason: reason };
      }
      return item;
    }));
  };

  const handleHoldConfirm = async () => {
    const userJson = localStorage.getItem('user');
    let restoId = 'default-resto';
    let hotelCode = '87241';
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        restoId = user.restoId || 'default-resto';
        hotelCode = user.hotelCode || '87241';
      } catch (e) {}
    }

    const finalTableNumber = await getOrGenerateTableNumber(hotelCode, tableNumber);
    const nameStr = customerName.trim() ? ` untuk ${customerName.trim()}` : '';
    const tableStr = ` (Meja ${finalTableNumber})`;

    const heldId = restoredOrderId || `HLD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const heldOrderData = {
      id: heldId,
      customerName: customerName.trim() || 'Guest',
      tableNumber: finalTableNumber,
      notes: notes.trim() || '',
      cart: cart.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          category: item.product.category || '',
          subcategory: item.product.subcategory || '',
          image: item.product.image || ''
        },
        quantity: item.quantity,
        cartItemId: item.cartItemId,
        selectedAddons: item.selectedAddons || [],
        note: item.note || ''
      })),
      subtotal,
      discount,
      discountPercent,
      tax,
      payableAmount,
      createdAt: new Date().toISOString(),
      restoId,
      cashierName: cashierName || 'Kasir'
    };

    try {
      await localDb.heldOrders.put(heldOrderData);
      await setDoc(doc(getHotelCollection(db, "pos_held_orders"), heldId), heldOrderData);
      toast.success(`Pesanan${nameStr}${tableStr} berhasil ditunda (Hold Order).`);
    } catch (err) {
      console.error("Failed to hold order:", err);
      toast.error("Gagal menunda pesanan. Silakan coba lagi.");
    }

    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setNotes('');
    setDiscountPercent(0);
    setIsHoldConfirmOpen(false);
    setRestoredOrderId(null);
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
    // Generate transaction ID upfront so the receipt can display it immediately
    const newTxId = `TRS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setTransactionId(newTxId);
    setIsReceiptOpen(true);
  };

  const handleCloseReceipt = async () => {
    setIsReceiptOpen(false);
    
    if (typeof window !== 'undefined') {
      const activeShiftJson = localStorage.getItem('active_shift');
      // Use pre-generated transactionId from executePayment

      const userJson = localStorage.getItem('user');
      let restoId = '';
      let hotelCode = '87241';
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          restoId = user.restoId || '';
          hotelCode = user.hotelCode || '87241';
        } catch (e) {}
      }

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
          
          if (activeShift.id) {
            const shiftRef = doc(getHotelCollection(db, 'cashier_shifts', hotelCode), activeShift.id);
            updateDoc(shiftRef, {
              transactions: arrayUnion(newTransaction)
            }).catch(console.error);
          }
        } catch (err) {
          console.error('Error saving shift transaction:', err);
        }
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

      Promise.all([addTxPromise, itemsPromise, ...stockPromises]).catch((err) => {
        console.error('Error saving transaction to localDb:', err);
      });

      try {
        const finalTableNumber = await getOrGenerateTableNumber(hotelCode, tableNumber);

        let currentShiftId = null;
        let shiftCashierName = cashierName || 'Kasir';
        if (typeof window !== 'undefined') {
          const shiftJson = localStorage.getItem('active_shift');
          if (shiftJson) {
            try {
              const parsedShift = JSON.parse(shiftJson);
              currentShiftId = parsedShift.id;
              // Use shift's cashierName (who opened shift), fallback to logged-in user
              if (parsedShift.cashierName) shiftCashierName = parsedShift.cashierName;
            } catch (e) {}
          }
        }

        const orderData = {
          items: cart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.isCompliment ? 0 : item.product.price,
            quantity: item.quantity,
            category: item.product.category,
            pnlTarget: item.product.pnlTarget || '',
            image: item.product.image,
            isCompliment: item.isCompliment || false,
            complimentReason: item.complimentReason || null,
            originalPrice: item.product.price,
            selectedAddons: item.selectedAddons || [],
            note: item.note || ''
          })),
          subtotal,
          tax,
          discount,
          total: payableAmount,
          paymentMethod,
          customerName: customerName.trim() || 'Guest',
          cashierName: shiftCashierName,
          tableNumber: finalTableNumber,
          notes: notes.trim() || '',
          timestamp: new Date(),
          revenueType: revenueType,
          transactionId: transactionId,
          shiftId: currentShiftId,
          isCompliment: payableAmount === 0 && cart.length > 0 && cart.every(i => i.isCompliment),
          complimentValue: cart.reduce((sum, item) => sum + (item.isCompliment ? item.product.price * item.quantity : 0), 0)
        };
        
        await addDoc(getHotelCollection(db, "pos_orders"), orderData);

        await addDoc(getHotelCollection(db, "revenue_transactions"), {
          date: new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date()),
          category: revenueType === 'banquet' ? 'Banquet Revenue' : 'Ala Carte Revenue',
          description: `POS Order #${transactionId.slice(-6)} - ${customerName.trim() || 'Guest'}` + (orderData.isCompliment ? ' (COMPLIMENT)' : ''),
          amount: payableAmount,
          type: paymentMethod === 'compliment' ? 'Compliment' : 'Nexura Collect',
          revenueType: paymentMethod === 'compliment' ? 'compliment' : 'pos',
          complimentValue: orderData.complimentValue,
          timestamp: new Date(),
          transactionId: transactionId
        });

        if (restoredOrderId) {
          await deleteDoc(doc(getHotelCollection(db, 'pos_held_orders'), restoredOrderId));
          await localDb.heldOrders.delete(restoredOrderId);
        }

        if (!restoredOrderId) {
          const shadowHeldId = `HLD-${transactionId.replace('TRS-', '')}`;
          const shadowHeldData = {
            id: shadowHeldId,
            customerName: customerName.trim() || 'Guest',
            tableNumber: finalTableNumber,
            notes: notes.trim() || '',
            cart: cart.map(item => ({
              product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                category: item.product.category || '',
                subcategory: item.product.subcategory || '',
                image: item.product.image || ''
              },
              quantity: item.quantity
            })),
            subtotal,
            discount,
            discountPercent,
            tax,
            payableAmount,
            createdAt: new Date().toISOString(),
            restoId: restoId || 'default-resto',
            cashierName: cashierName || 'Kasir',
            isPaidDirectly: true
          };
          await setDoc(doc(getHotelCollection(db, "pos_held_orders"), shadowHeldId), shadowHeldData);
          await localDb.heldOrders.put(shadowHeldData);
        }

      } catch (firebaseErr) {
        console.error("Firebase store order failed:", firebaseErr);
      }
    }

    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setNotes('');
    setDiscountPercent(0);
    setCashAmount('');
    setRevenueType('alacarte');
    setStep('pos');
    setRestoredOrderId(null);
    setTransactionId('');
    toast.success('Transaksi selesai!');
  };

  return {
    step,
    setStep,
    selectedCategory,
    handleCategoryChange,
    searchQuery,
    setSearchQuery,
    cart,
    setCart,
    discountPercent,
    setDiscountPercent,
    showCart,
    setShowCart,
    selectedProduct,
    setSelectedProduct,
    isModalOpen,
    setIsModalOpen,
    customerName,
    setCustomerName,
    tableNumber,
    setTableNumber,
    notes,
    setNotes,
    revenueType,
    setRevenueType,
    paymentMethod,
    setPaymentMethod,
    cashAmount,
    setCashAmount,
    isReceiptOpen,
    setIsReceiptOpen,
    cashierName,
    taxRatePercent,
    selectedSubcategory,
    setSelectedSubcategory,
    isHoldConfirmOpen,
    setIsHoldConfirmOpen,
    dynamicCategories,
    dynamicSubcategories,
    filteredProducts,
    handleProductClick,
    handleAddToCart,
    updateQuantity,
    clearCart,
    subtotal,
    discount,
    tax,
    payableAmount,
    handleToggleCompliment,
    handleSetComplimentReason,
    handleHoldConfirm,
    handleProceed,
    executePayment,
    handleCloseReceipt,
    checkActiveShift,
    transactionId
  };
}
