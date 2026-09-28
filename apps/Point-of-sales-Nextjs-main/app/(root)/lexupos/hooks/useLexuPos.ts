import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Product, CartItem, PaymentMethodType } from '@/components/lexupos/types';
import { localDb } from '@/lib/dexie';
import { syncProductsFromServer } from '@/lib/dexie-sync';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc, updateDoc, arrayUnion, query, where, onSnapshot } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val || 0);
};

const getOrGenerateTableNumber = async (hotelCode: string, inputTable: string): Promise<string> => {
  if (inputTable && inputTable.trim() !== '') {
    return inputTable.trim();
  }

  try {
    const posRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
    const posSnap = await getDoc(posRef);
    let parsedTables: string[] = [];

    if (posSnap.exists()) {
      const data = posSnap.data();
      if (data.tablesDetailed && Array.isArray(data.tablesDetailed) && data.tablesDetailed.length > 0) {
        parsedTables = data.tablesDetailed.map((t: any) => t.name);
      } else {
        const rawTables = data.tables || '10';
        if (/^\d+$/.test(rawTables.trim())) {
          const count = parseInt(rawTables.trim());
          for (let i = 1; i <= count; i++) {
            parsedTables.push(`Meja ${i}`);
          }
        } else {
          parsedTables = rawTables.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      }
    } else {
      for (let i = 1; i <= 10; i++) {
        parsedTables.push(`Meja ${i}`);
      }
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
  const [splitPaidCredit, setSplitPaidCredit] = useState<number>(0);

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
  const [activeHotelCode, setActiveHotelCode] = useState('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [receiptStatus, setReceiptStatus] = useState<'PAID' | 'UNPAID'>('PAID');
  const [heldOrderToPrint, setHeldOrderToPrint] = useState<any>(null);
  const [activeSplitData, setActiveSplitData] = useState<{
    paidItems: CartItem[];
    remainingItems: CartItem[];
    paymentMethod: PaymentMethodType;
    payableAmount: number;
    subtotal: number;
    tax: number;
    service: number;
    splitLabel: string;
    customerName?: string;
    splitMode?: 'by_item' | 'even';
    splitCount?: number;
    splitIndex?: number;
    totalCartPayable?: number;
    remainingBalance?: number;
  } | null>(null);

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
    let hotelCode = '';
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
    if (!hotelCode) {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      hotelCode = getCookie('hotelCode') || localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
      if (hotelCode) setActiveHotelCode(hotelCode);
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
            let restoredCart = restoredOrder.cart;

            // Reconstruct cart if cart is missing/empty but items or products exist (e.g. from self-order)
            if ((!restoredCart || !Array.isArray(restoredCart) || restoredCart.length === 0) && (restoredOrder.items || restoredOrder.products)) {
              const rawItems = restoredOrder.items || restoredOrder.products || [];
              restoredCart = rawItems.map((item: any) => {
                const name = item.product?.name || item.name || item.productstock?.name || 'Item';
                const price = Number(item.product?.price ?? item.price ?? 0);
                const quantity = Number(item.quantity ?? item.qty ?? item.count ?? 1);
                const category = item.product?.category || item.category || item.categoryId || '';
                const subcategory = item.product?.subcategory || item.subcategory || '';
                const image = item.product?.image || item.image || '';
                const selectedAddons = item.selectedAddons || item.addons || [];
                const note = item.note || '';

                return {
                  cartItemId: item.cartItemId || Math.random().toString(36).substring(7),
                  product: {
                    id: item.product?.id || item.id || Math.random().toString(36).substring(7),
                    name,
                    price,
                    category,
                    subcategory,
                    image
                  },
                  quantity,
                  selectedAddons,
                  note
                };
              });
            }

            if (restoredCart && Array.isArray(restoredCart) && restoredCart.length > 0) {
              setCart(restoredCart);
              setCustomerName(restoredOrder.customerName || '');
              setTableNumber(restoredOrder.tableNumber || '');
              
              // Clean customer notes: Remove previous split tags so text doesn't loop
              const cleanCustomerNotes = (restoredOrder.notes || '')
                .replace(/\|?\s*Sisa tagihan\s*\([^)]*\)\s*\|?/gi, '')
                .replace(/\|?\s*\[Split[^\]]*\]\s*\|?/gi, '')
                .trim();
              setNotes(cleanCustomerNotes);

              setDiscountPercent(restoredOrder.discountPercent || 0);
              setRestoredOrderId(restoredOrder.id || restoredOrder.orderNumber || null);
              
              // If order was a split bill, set already paid credit:
              if (restoredOrder.isSplitActive && restoredOrder.totalPaid) {
                setSplitPaidCredit(Number(restoredOrder.totalPaid) || 0);
                toast.info(`Memuat sisa tagihan Meja ${restoredOrder.tableNumber || ''} (Sudah terbayar split: ${formatCurrency(restoredOrder.totalPaid)}).`);
              } else {
                setSplitPaidCredit(0);
                toast.success(`Mengembalikan pesanan meja ${restoredOrder.tableNumber || ''} (${restoredOrder.customerName || 'Guest'}) ke kasir.`);
              }
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
    setSplitPaidCredit(0);
    toast.info('Keranjang dibersihkan.');
  };

  const subtotal = cart.reduce((acc, item) => {
    if (item.isCompliment) return acc;
    const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
    return acc + ((item.product.price + addonsTotal) * item.quantity);
  }, 0);
  const discount = subtotal * (discountPercent / 100);
  const tax = (subtotal - discount) * (taxRatePercent / 100); 
  const rawPayable = subtotal - discount + tax;
  const payableAmount = Math.max(0, rawPayable - splitPaidCredit);

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
    let hotelCode = '';
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        restoId = user.restoId || 'default-resto';
        hotelCode = user.hotelCode || '';
      } catch (e) {}
    }

    if (!hotelCode || hotelCode === '0') {
      toast.error("Gagal melakukan penundaan: Partner Code tidak valid.");
      return;
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
      setHeldOrderToPrint(heldOrderData);
      setReceiptStatus('UNPAID');
      setIsReceiptOpen(true);
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

  const resolveHotelCode = (): string => {
    if (activeHotelCode && activeHotelCode !== '0') return activeHotelCode;
    if (typeof window !== 'undefined') {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      let code = getCookie('hotelCode');
      if (!code) {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          try {
            const u = JSON.parse(userJson);
            if (u.hotelCode) code = u.hotelCode;
          } catch (e) {}
        }
      }
      if (!code) {
        code = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
      }
      return code || '';
    }
    return '';
  };

  const handleConfirmSplitPayment = async (splitData: {
    paidItems: CartItem[];
    remainingItems: CartItem[];
    paymentMethod: PaymentMethodType;
    payableAmount: number;
    subtotal: number;
    tax: number;
    service: number;
    splitLabel: string;
    customerName?: string;
    splitMode?: 'by_item' | 'even';
    splitCount?: number;
    splitIndex?: number;
    totalCartPayable?: number;
    remainingBalance?: number;
  }) => {
    const splitTxId = `SPLIT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setTransactionId(splitTxId);
    setPaymentMethod(splitData.paymentMethod);
    setActiveSplitData(splitData);

    const hotelCode = resolveHotelCode();
    const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let restoId = '';
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        if (u.restoId) restoId = u.restoId;
      } catch (e) {}
    }

    const finalTable = await getOrGenerateTableNumber(hotelCode, tableNumber);
    setTableNumber(finalTable);
    const finalCustomerName = customerName.trim() || 'Guest';

    // Find existing held order if any
    let existingOrder: any = null;
    if (restoredOrderId) {
      existingOrder = await localDb.heldOrders.get(restoredOrderId);
    }
    if (!existingOrder && finalTable) {
      const allHeld = await localDb.heldOrders.toArray();
      existingOrder = allHeld.find(o => o.tableNumber && o.tableNumber.toLowerCase().trim() === finalTable.toLowerCase().trim());
    }

    const isSplitEven = splitData.splitMode === 'even';
    const originalTotal = Number(existingOrder?.originalTotal || splitData.totalCartPayable || (subtotal + tax));
    const prevPaid = Number(existingOrder?.totalPaid || splitPaidCredit || 0);
    const newTotalPaid = prevPaid + splitData.payableAmount;

    let remainingPayable = 0;
    let remainingSubtotal = 0;
    let remainingTax = 0;
    let remainingItemsToKeep: CartItem[] = [];

    if (isSplitEven) {
      remainingPayable = Math.max(0, originalTotal - newTotalPaid);
      if ((splitData.splitIndex && splitData.splitCount && splitData.splitIndex >= splitData.splitCount) || remainingPayable <= 50) {
        remainingPayable = 0;
        remainingItemsToKeep = [];
      } else {
        remainingSubtotal = Math.round(remainingPayable / (1 + (taxRatePercent / 100)));
        remainingTax = remainingPayable - remainingSubtotal;
        remainingItemsToKeep = cart; // Keep original cart items for reference
      }
    } else {
      // Split by item:
      remainingItemsToKeep = splitData.remainingItems;
      if (remainingItemsToKeep.length > 0) {
        remainingSubtotal = remainingItemsToKeep.reduce((acc, item) => {
          const addonsTotal = (item.selectedAddons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
          return acc + (item.product.price + addonsTotal) * item.quantity;
        }, 0);
        remainingTax = Math.round(remainingSubtotal * (taxRatePercent / 100));
        remainingPayable = remainingSubtotal + remainingTax;
      } else {
        remainingPayable = 0;
      }
    }

    const isFullyPaid = remainingPayable <= 0 && remainingItemsToKeep.length === 0;

    // Clean customer notes: Remove stacked split tags
    const cleanCustomerNotes = (notes || '')
      .replace(/\|?\s*Sisa tagihan\s*\([^)]*\)\s*\|?/gi, '')
      .replace(/\|?\s*\[Split[^\]]*\]\s*\|?/gi, '')
      .trim();

    const splitBadgeText = isSplitEven
      ? `[Split Rata: ${(existingOrder?.paidSplitsCount || 0) + 1}/${splitData.splitCount || 2} Terbayar - Sisa: ${formatCurrency(remainingPayable)}]`
      : `[Split Menu: ${splitData.paidItems.length} menu terbayar - Sisa: ${formatCurrency(remainingPayable)}]`;

    const displayNotes = cleanCustomerNotes ? `${cleanCustomerNotes} | ${splitBadgeText}` : splitBadgeText;

    if (!isFullyPaid) {
      const splitHeldId = existingOrder?.id || restoredOrderId || `SPLIT-HOLD-${finalTable.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString(36).substring(4).toUpperCase()}`;
      const splitHeldData = {
        id: splitHeldId,
        customerName: finalCustomerName,
        tableNumber: finalTable,
        cleanCustomerNotes,
        notes: displayNotes,
        cart: remainingItemsToKeep,
        items: remainingItemsToKeep.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          qty: item.quantity,
          addons: item.selectedAddons || [],
          note: item.note || ''
        })),
        originalTotal,
        totalPaid: newTotalPaid,
        remainingPayable,
        payableAmount: remainingPayable,
        total: remainingPayable,
        subtotal: remainingSubtotal,
        tax: remainingTax,
        discount: 0,
        discountPercent: 0,
        createdAt: existingOrder?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        restoId: restoId || 'default-resto',
        cashierName: cashierName || 'Kasir',
        isSplitActive: true,
        splitStatus: 'PARTIALLY_PAID',
        splitMode: isSplitEven ? 'even' : 'by_item',
        splitCount: splitData.splitCount || (existingOrder?.splitCount || 2),
        paidSplitsCount: (existingOrder?.paidSplitsCount || 0) + 1,
        splitHistory: [
          ...(existingOrder?.splitHistory || []),
          {
            txId: splitTxId,
            label: splitData.splitLabel,
            amount: splitData.payableAmount,
            method: splitData.paymentMethod,
            paidAt: new Date().toISOString()
          }
        ],
        remainingCount: remainingItemsToKeep.length,
        lastSplitTxId: splitTxId
      };

      try {
        await localDb.heldOrders.put(splitHeldData);
        if (hotelCode && hotelCode !== '0') {
          await setDoc(doc(db, 'hotels', hotelCode, 'pos_held_orders', splitHeldId), splitHeldData);
        }
        setRestoredOrderId(splitHeldId);
        setSplitPaidCredit(newTotalPaid);
      } catch (err) {
        console.error('Error saving split held order:', err);
      }
    } else {
      const targetHeldId = existingOrder?.id || restoredOrderId;
      if (targetHeldId) {
        try {
          await localDb.heldOrders.delete(targetHeldId);
          if (hotelCode && hotelCode !== '0') {
            await deleteDoc(doc(db, 'hotels', hotelCode, 'pos_held_orders', targetHeldId));
          }
          setRestoredOrderId(null);
          setSplitPaidCredit(0);
        } catch (e) {}
      }
    }

    setIsReceiptOpen(true);
    toast.success(`Pembayaran ${splitData.splitLabel} berhasil dicatat.`);
  };

  const handleCloseReceipt = async () => {
    setIsReceiptOpen(false);
    
    if (receiptStatus === 'UNPAID') {
      setHeldOrderToPrint(null);
      setReceiptStatus('PAID');
      return;
    }

    const currentSplit = activeSplitData;
    const itemsToRecord = currentSplit ? currentSplit.paidItems : cart;
    const finalAmountToRecord = currentSplit ? currentSplit.payableAmount : payableAmount;
    const finalPaymentMethod = currentSplit ? currentSplit.paymentMethod : paymentMethod;
    const finalNotes = currentSplit ? `${notes} (${currentSplit.splitLabel})` : notes;

    if (typeof window !== 'undefined') {
      const activeShiftJson = localStorage.getItem('active_shift');
      const userJson = localStorage.getItem('user');
      let restoId = '';
      let hotelCode = '';
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          restoId = user.restoId || '';
          hotelCode = user.hotelCode || '';
        } catch (e) {}
      }

      if (!hotelCode || hotelCode === '0') {
        toast.error("Gagal menyimpan transaksi: Partner Code tidak valid.");
        return;
      }

      if (activeShiftJson) {
        try {
          const activeShift = JSON.parse(activeShiftJson);
          const newTransaction = {
            id: transactionId,
            amount: finalAmountToRecord,
            method: finalPaymentMethod,
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
        totalPrice: finalAmountToRecord,
        createdAt: new Date().toISOString(),
        isSynced: 0,
        revenueType: revenueType,
        paymentMethod: finalPaymentMethod
      };

      const localItems = itemsToRecord.map(item => ({
        transactionId: transactionId,
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }));

      const addTxPromise = localDb.transactions.put(localTx);
      const itemsPromise = localDb.transactionItems.bulkPut(localItems);
      // Inventory Stock Deduction
      // If even split, only deduct physical inventory on portion 1 so it's not deducted multiple times
      const shouldDeductStock = !currentSplit || currentSplit.splitMode !== 'even' || (currentSplit.splitIndex === 1);
      const stockPromises = shouldDeductStock ? itemsToRecord.map(async (item) => {
        const dbProd = await localDb.products.get(item.product.id);
        if (dbProd) {
          await localDb.products.update(item.product.id, {
            stock: Math.max(0, dbProd.stock - item.quantity)
          });
        }
      }) : [];

      Promise.all([addTxPromise, itemsPromise, ...stockPromises]).catch((err) => {
        console.error('Error saving transaction to localDb:', err);
      });

      try {
        const finalTableNumber = await getOrGenerateTableNumber(hotelCode, tableNumber);

        let currentShiftId = null;
        let shiftCashierName = cashierName || 'Kasir';
        const shiftJson = localStorage.getItem('active_shift');
        if (shiftJson) {
          try {
            const parsedShift = JSON.parse(shiftJson);
            currentShiftId = parsedShift.id;
            if (parsedShift.cashierName) shiftCashierName = parsedShift.cashierName;
          } catch (e) {}
        }

        // For even split, proportionally allocate item price/subtotal so DSR/accounting doesn't multiply revenue
        const splitRatio = (currentSplit && currentSplit.splitMode === 'even' && currentSplit.splitCount) 
          ? (1 / currentSplit.splitCount) 
          : 1;

        const orderData = {
          items: itemsToRecord.map(item => {
            const basePrice = item.isCompliment ? 0 : item.product.price;
            const proratedPrice = Math.round(basePrice * splitRatio);
            return {
              id: item.product.id,
              name: item.product.name,
              price: proratedPrice,
              quantity: item.quantity,
              subtotal: Math.round(proratedPrice * item.quantity),
              category: item.product.category,
              pnlTarget: item.product.pnlTarget || '',
              image: item.product.image,
              isCompliment: item.isCompliment || false,
              complimentReason: item.complimentReason || null,
              originalPrice: item.product.price,
              selectedAddons: item.selectedAddons || [],
              note: item.note || ''
            };
          }),
          subtotal: currentSplit ? currentSplit.subtotal : subtotal,
          tax: currentSplit ? currentSplit.tax : tax,
          discount: currentSplit ? 0 : discount,
          total: finalAmountToRecord,
          paymentMethod: finalPaymentMethod,
          cashAmount: finalPaymentMethod === 'cash' ? (parseFloat(cashAmount) || finalAmountToRecord) : 0,
          changeAmount: finalPaymentMethod === 'cash' ? Math.max(0, (parseFloat(cashAmount) || finalAmountToRecord) - finalAmountToRecord) : 0,
          customerName: (currentSplit?.customerName || customerName).trim() || 'Guest',
          cashierName: shiftCashierName,
          tableNumber: finalTableNumber,
          notes: finalNotes.trim() || '',
          timestamp: new Date(),
          revenueType: revenueType,
          transactionId: transactionId,
          shiftId: currentShiftId,
          isCompliment: finalAmountToRecord === 0 && itemsToRecord.length > 0 && itemsToRecord.every(i => i.isCompliment),
          complimentValue: itemsToRecord.reduce((sum, item) => sum + (item.isCompliment ? item.product.price * item.quantity : 0), 0),
          isSplitPortion: !!currentSplit
        };
        
        await setDoc(doc(db, 'hotels', hotelCode, 'pos_orders', transactionId), orderData);

        await setDoc(doc(db, 'hotels', hotelCode, 'revenue_transactions', transactionId), {
          date: new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date()),
          category: revenueType === 'banquet' ? 'Banquet Revenue' : 'Ala Carte Revenue',
          description: `POS Order #${transactionId.slice(-6)} - ${(currentSplit?.customerName || customerName).trim() || 'Guest'}` + (orderData.isCompliment ? ' (COMPLIMENT)' : '') + (currentSplit ? ` [${currentSplit.splitLabel}]` : ''),
          amount: finalAmountToRecord,
          type: finalPaymentMethod === 'compliment' ? 'Compliment' : 'Nexura Collect',
          revenueType: finalPaymentMethod === 'compliment' ? 'compliment' : 'pos',
          complimentValue: orderData.complimentValue,
          timestamp: new Date(),
          transactionId: transactionId
        });

        await localDb.transactions.update(transactionId, { isSynced: 1 });

        // If not a partial split bill, clear restoredOrderId from pos_held_orders
        if (!currentSplit && restoredOrderId) {
          if (hotelCode && hotelCode !== '0') {
            await deleteDoc(doc(db, 'hotels', hotelCode, 'pos_held_orders', restoredOrderId));
          }
          await localDb.heldOrders.delete(restoredOrderId);
        }

      } catch (firebaseErr) {
        console.error("Firebase store order failed:", firebaseErr);
      }
    }

    if (currentSplit) {
      // Split bill portion completed. Check if there are still unpaid balances in the held order
      const existingHeld = restoredOrderId ? ((await localDb.heldOrders.get(restoredOrderId)) as any) : null;
      if (existingHeld && existingHeld.isSplitActive && ((existingHeld.remainingPayable || existingHeld.payableAmount || 0) > 0)) {
        setCart(existingHeld.cart);
        setNotes(existingHeld.notes);
        setSplitPaidCredit(existingHeld.totalPaid || 0);
        setStep('pos');
        setActiveSplitData(null);
        toast.info(`Sisa kurangan Meja ${existingHeld.tableNumber}: ${formatCurrency(existingHeld.remainingPayable || existingHeld.payableAmount)}`);
        return;
      }
    }

    // Full order completed
    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setNotes('');
    setDiscountPercent(0);
    setCashAmount('');
    setRevenueType('alacarte');
    setStep('pos');
    setRestoredOrderId(null);
    setSplitPaidCredit(0);
    setTransactionId('');
    setActiveSplitData(null);
    toast.success('Seluruh transaksi meja telah selesai!');
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
    splitPaidCredit,
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
    handleConfirmSplitPayment,
    handleCloseReceipt,
    checkActiveShift,
    transactionId,
    receiptStatus,
    setReceiptStatus,
    heldOrderToPrint,
    setHeldOrderToPrint,
    activeSplitData
  };
}
