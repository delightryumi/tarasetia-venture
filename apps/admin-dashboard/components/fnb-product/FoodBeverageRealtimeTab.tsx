'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '@/lib/firebase';
import { onSnapshot, doc, getDoc, query, orderBy, limit, updateDoc } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { 
  Clock, Maximize2, Minimize2, Volume2, VolumeX, 
  ArrowLeft, RefreshCw, AlertTriangle,
  UtensilsCrossed, Wine, LayoutGrid, Users, ChefHat,
  X, Check, History, RotateCcw, ShieldCheck,
  Lock, Sparkles, Tv, Zap, ListOrdered, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ds from './fnb-realtime.module.css';

interface FoodBeverageRealtimeTabProps {
  hotelCode?: string;
}

type StationFilter = 'all' | 'food' | 'bar' | 'tables' | 'summary';

export default function FoodBeverageRealtimeTab({ hotelCode }: FoodBeverageRealtimeTabProps) {
  const router = useRouter();
  const { user, activeHotelCode, activeHotelName } = useAuth();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [activeCode, setActiveCode] = useState<string>('');
  const [tablesList, setTablesList] = useState<string[]>([]);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hotelDocData, setHotelDocData] = useState<any>(null);
  const [isAddonCheckDone, setIsAddonCheckDone] = useState<boolean>(false);
  const [stationFilter, setStationFilter] = useState<StationFilter>('all');
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState<boolean>(false);
  const [summaryStationFilter, setSummaryStationFilter] = useState<'all' | 'food' | 'bar'>('all');
  const [summarySearchQuery, setSummarySearchQuery] = useState<string>('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Realtime Master Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Sound alarm state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  
  // Checked items (marked prepared by kitchen)
  const [preparedItems, setPreparedItems] = useState<Record<string, boolean>>({});
  
  // Local bumped/dispatched tickets for KDS expeditor flow
  const [bumpedOrders, setBumpedOrders] = useState<any[]>([]);
  const [isRecallOpen, setIsRecallOpen] = useState<boolean>(false);
  
  // Modal for detail inspection
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const isAudioUnlockedRef = useRef<boolean>(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState<boolean>(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmTimeoutRef = useRef<any>(null);
  const posSoundUrlRef = useRef<string>('/sounds/notification.mp3');

  // Master ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  const getAudioInstance = useCallback(() => {
    if (!alarmAudioRef.current && typeof window !== 'undefined') {
      const soundUrl = (typeof window !== 'undefined' ? localStorage.getItem('pos_sound_url') : null) || posSoundUrlRef.current || '/sounds/notification.mp3';
      alarmAudioRef.current = new Audio(soundUrl);
      alarmAudioRef.current.volume = 1.0;
      alarmAudioRef.current.loop = true;
    }
    return alarmAudioRef.current;
  }, []);

  const unlockAudioContext = useCallback(() => {
    try {
      const audio = getAudioInstance();
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
          isAudioUnlockedRef.current = true;
          setIsAudioBlocked(false);
        }).catch((e) => {
          console.warn('Audio unlock pending user interaction:', e);
        });
      }
    } catch (e) {
      console.warn('Audio context unlock error:', e);
    }
  }, [getAudioInstance]);

  // Unlock audio context on any user click / touch / keyboard interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudioContext();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [unlockAudioContext]);

  // Listen to custom soundChanged event from settings
  useEffect(() => {
    const handleSoundChanged = () => {
      const updated = localStorage.getItem('pos_sound_url') || '/sounds/notification.mp3';
      posSoundUrlRef.current = updated;
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current = null;
      }
    };
    window.addEventListener('soundChanged', handleSoundChanged);
    return () => window.removeEventListener('soundChanged', handleSoundChanged);
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
    if (alarmAudioRef.current) {
      try {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
      } catch (e) {}
    }
  }, []);

  const playOrderAlarm = useCallback((label: string, orderData: any) => {
    if (isAudioMuted) return;

    try {
      const soundUrl = (typeof window !== 'undefined' ? localStorage.getItem('pos_sound_url') : null) || posSoundUrlRef.current || '/sounds/notification.mp3';
      const audio = getAudioInstance();
      if (audio) {
        if (audio.src !== soundUrl && !audio.src.endsWith(soundUrl)) {
          audio.src = soundUrl;
        }
        audio.currentTime = 0;
        audio.loop = true;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              isAudioUnlockedRef.current = true;
              setIsAudioBlocked(false);
            })
            .catch(err => {
              console.warn('Audio playback blocked by browser in KDS:', err);
              setIsAudioBlocked(true);
            });
        }

        // Auto stop after 12 seconds so kitchen is not blasted continuously if unattended
        if (alarmTimeoutRef.current) {
          clearTimeout(alarmTimeoutRef.current);
        }
        alarmTimeoutRef.current = setTimeout(() => {
          stopAlarm();
        }, 12000);
      }

      const table = orderData.tableNumber || orderData.table || 'Meja';
      const guest = orderData.customerName || orderData.guestName || 'Tamu';
      const items = orderData.cart || orderData.items || orderData.products || [];

      toast.info(
        <div className="flex flex-col gap-1 cursor-pointer" onClick={stopAlarm}>
          <div className="font-semibold text-sm">🔔 {label}</div>
          <div className="text-xs text-stone-700">{table} · {guest} {items.length > 0 ? `(${items.length} Menu)` : ''}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Klik notifikasi ini untuk menghentikan bunyi</div>
        </div>,
        {
          duration: 12000,
          position: 'top-center',
          onDismiss: stopAlarm,
          onAutoClose: stopAlarm,
        }
      );
    } catch (err) {
      console.error('playOrderAlarm error:', err);
    }
  }, [isAudioMuted, getAudioInstance, stopAlarm]);

  const playOrderAlarmRef = useRef(playOrderAlarm);
  useEffect(() => {
    playOrderAlarmRef.current = playOrderAlarm;
  }, [playOrderAlarm]);

  // Set active hotel code
  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return undefined;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
    const cookieHotelCode = getCookie('hotelCode');
    const localActive = typeof window !== 'undefined' ? (localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode')) : '';
    const resolved = hotelCode || activeHotelCode || user?.hotelCode || (user?.allowedOutlets && user.allowedOutlets[0]) || cookieHotelCode || localActive || '';
    if (resolved && resolved !== '0') {
      setActiveCode(resolved);
    }
  }, [hotelCode, activeHotelCode, user]);

  // Listen to Firestore for Tables, Held Orders, Completed Orders, and Pos sound
  useEffect(() => {
    if (!activeCode || activeCode === '0') return;

    let unsubHeld: any;
    let unsubCompleted: any;
    let unsubHotelConfig: any;

    const fetchConfigAndListen = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch tables list from pos settings (async without blocking listeners)
        const posRef = doc(db, 'hotels', activeCode, 'settings', 'pos');
        getDoc(posRef).then(posSnap => {
          let rawTables = '12';
          if (posSnap.exists()) {
            rawTables = posSnap.data().tables || '12';
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
          setTablesList(parsedTables);
        }).catch(err => {
          console.warn('Error fetching pos tables config:', err);
        });

        // 2. Listen to active held orders in REALTIME with instant docChanges
        const heldCollection = getHotelCollection(db, 'pos_held_orders', activeCode);
        let isInitialHeld = true;
        unsubHeld = onSnapshot(heldCollection, (snap) => {
          const orders = snap.docs.map(doc => {
            const data = doc.data();
            let createdAt = new Date().toISOString();
            if (data.timestamp) {
              createdAt = typeof data.timestamp.toDate === 'function'
                ? data.timestamp.toDate().toISOString()
                : new Date(data.timestamp).toISOString();
            } else if (data.createdAt) {
              createdAt = typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date(data.createdAt).toISOString();
            }
            return { id: doc.id, ...data, createdAt, _collectionName: 'pos_held_orders' };
          });
          
          // FIFO order flow
          orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          
          setHeldOrders(orders);
          setIsLoading(false);

          if (isInitialHeld) {
            isInitialHeld = false;
            return;
          }

          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data.status === 'CANCELLED' || data.status === 'VOID') return;
              let isFresh = true;
              if (data.createdAt) {
                const createdTime = new Date(data.createdAt).getTime();
                if (!isNaN(createdTime) && (Date.now() - createdTime > 10 * 60 * 1000)) {
                  isFresh = false;
                }
              }
              if (isFresh) {
                const isSelfOrder = data.source === 'Self-Order Tamu' || data.orderType === 'Self-Order Tamu';
                const label = isSelfOrder ? '🛎️ Self-Order Tamu Baru' : '🔔 Pesanan Meja Baru';
                if (playOrderAlarmRef.current) {
                  playOrderAlarmRef.current(label, data);
                }
              }
            }
          });
        }, (err) => {
          console.error('Firestore held orders listener error:', err);
          setIsLoading(false);
        });

        // 3. Listen to cashier paid orders in REALTIME with instant docChanges
        const completedCollection = getHotelCollection(db, 'pos_orders', activeCode);
        const completedQuery = query(completedCollection, orderBy('timestamp', 'desc'), limit(50));
        let isInitialCompleted = true;
        unsubCompleted = onSnapshot(completedQuery, (snap) => {
          const orders = snap.docs.map(doc => {
            const data = doc.data();
            let createdAt = new Date().toISOString();
            if (data.timestamp) {
              createdAt = typeof data.timestamp.toDate === 'function'
                ? data.timestamp.toDate().toISOString()
                : new Date(data.timestamp).toISOString();
            } else if (data.createdAt) {
              createdAt = typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date(data.createdAt).toISOString();
            }
            return { id: doc.id, ...data, createdAt, _collectionName: 'pos_orders' };
          });
          setCompletedOrders(orders);

          if (isInitialCompleted) {
            isInitialCompleted = false;
            return;
          }

          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data.status === 'CANCELLED' || data.status === 'VOID') return;

              let isFresh = true;
              let orderTime = 0;
              if (data.timestamp) {
                orderTime = typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate().getTime() : new Date(data.timestamp).getTime();
              } else if (data.createdAt) {
                orderTime = typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime();
              }
              if (orderTime && (Date.now() - orderTime > 5 * 60 * 1000)) {
                isFresh = false;
              }

              if (isFresh) {
                if (playOrderAlarmRef.current) {
                  playOrderAlarmRef.current('💰 Transaksi Kasir Selesai', data);
                }
              }
            }
          });
        }, (err) => {
          console.error('Firestore completed orders listener error:', err);
        });

        // 4. Hotel Pos Sound URL & Billing Modules
        const hotelRef = doc(db, 'hotels', activeCode);
        unsubHotelConfig = onSnapshot(hotelRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setHotelDocData(data);
            if (data.posSoundUrl && data.posSoundUrl !== posSoundUrlRef.current) {
              posSoundUrlRef.current = data.posSoundUrl;
              if (alarmAudioRef.current) {
                alarmAudioRef.current.pause();
                alarmAudioRef.current = null;
              }
              if (typeof window !== 'undefined') {
                localStorage.setItem('pos_sound_url', data.posSoundUrl);
              }
            }
          }
          setIsAddonCheckDone(true);
        }, (err) => {
          console.error('Error listening to hotel doc in KDS:', err);
          setIsAddonCheckDone(true);
        });

      } catch (err) {
        console.error('Failed to init KDS listeners:', err);
        setIsLoading(false);
      }
    };

    fetchConfigAndListen();

    return () => {
      if (unsubHeld) unsubHeld();
      if (unsubCompleted) unsubCompleted();
      if (unsubHotelConfig) unsubHotelConfig();
      stopAlarm();
    };
  }, [activeCode, stopAlarm]);

  // Helper to format currency
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Helper to normalize table names
  const normalizeTable = (val: any): string => {
    if (!val) return '';
    const str = String(val).toLowerCase().trim();
    return str.replace(/^(meja|table)\s*/g, '').replace(/[^a-z0-9]/g, '');
  };

  // Check if item is food or bar
  const isItemMatchStation = (item: any, station: StationFilter) => {
    if (station === 'all' || station === 'tables' || station === 'summary') return true;
    const cat = (item.product?.category || item.category || '').toLowerCase();
    const pnl = (item.product?.pnlTarget || item.pnlTarget || '').toLowerCase();

    const isBeverage = cat.includes('beverage') || cat.includes('minuman') || cat.includes('bar') || cat.includes('drink') || cat.includes('coffee') || cat.includes('jus') || pnl.includes('beverage') || pnl.includes('bar');
    
    if (station === 'bar') {
      return isBeverage;
    }
    if (station === 'food') {
      return !isBeverage;
    }
    return true;
  };

  // Check if user is superadmin
  const isSuperadmin = useMemo(() => {
    return (
      user?.role?.toLowerCase() === 'superadmin' ||
      user?.role?.toLowerCase() === 'super admin' ||
      user?.email?.toLowerCase() === 'nexura.management@gmail.com' ||
      user?.email?.toLowerCase() === 'superadmin@setara.co.id'
    );
  }, [user]);

  // Check if Add-on is active
  const isAddonActive = useMemo(() => {
    if (isSuperadmin) return true;
    if (!hotelDocData) return false;

    let modules = hotelDocData.billing?.activeModules || hotelDocData.activeModules || [];
    if (modules.includes('cpanel')) {
      modules = modules.filter((m: string) => m !== 'cpanel');
      const plan = hotelDocData.billing?.plan || hotelDocData.plan || 'premium';
      if (plan === 'basic' || plan === 'startup') {
        if (!modules.includes('cpanel-only')) modules.push('cpanel-only');
      } else {
        if (!modules.includes('cpanel-full')) modules.push('cpanel-full');
      }
    }
    if (modules.length === 0) {
      const plan = hotelDocData.billing?.plan || hotelDocData.plan || 'enterprise';
      if (plan === 'startup' || plan === 'basic') {
        modules = ['pos', 'hrd', 'cpanel-only'];
      } else if (plan === 'bisnis') {
        modules = ['pos', 'front-office', 'innalytics', 'housekeeping', 'food-beverage', 'purchasing', 'accounting', 'hrd', 'cpanel-only'];
      } else {
        modules = ['pos', 'front-office', 'innalytics', 'housekeeping', 'food-beverage', 'purchasing', 'accounting', 'hrd', 'cpanel-full', 'pos-self-order', 'food-beverage-realtime'];
      }
    }

    const hasInBilling =
      modules.includes('food-beverage-realtime') ||
      modules.includes('food_beverage_realtime') ||
      modules.includes('pos-realtime') ||
      modules.includes('pos_realtime');

    const hasUserPerm =
      user?.permissions?.['food-beverage-realtime'] === true ||
      user?.permissions?.['food_beverage_realtime'] === true;

    const isOwnerOrAdmin =
      user?.role === 'admin' ||
      user?.role === 'administrator' ||
      user?.role === 'owner' ||
      user?.isOwner === true;

    return hasInBilling || (isOwnerOrAdmin && hasUserPerm);
  }, [isSuperadmin, hotelDocData, user]);

  // Active non-bumped orders (Combines both pos_held_orders and pos_orders inline so zero tickets are missed!)
  const visibleHeldOrders = useMemo(() => {
    const bumpedIds = new Set(bumpedOrders.map(b => b.id));

    // 1. Active held / table / self-orders
    const activeHeld = heldOrders.filter(o => {
      if (bumpedIds.has(o.id)) return false;
      if (o.status === 'CANCELLED' || o.status === 'VOID') return false;
      if (o.kitchenStatus === 'served') return false;
      return true;
    });

    // 2. Active cashier paid orders (pos_orders)
    const activePaid = completedOrders.filter(o => {
      if (bumpedIds.has(o.id)) return false;
      if (o.status === 'CANCELLED' || o.status === 'VOID') return false;
      if (o.kitchenStatus === 'served') return false;
      // Filter out stale orders unless explicit kitchenStatus
      const ageMs = Date.now() - new Date(o.createdAt).getTime();
      const isRecent = ageMs < 24 * 60 * 60 * 1000;
      const isExplicitCooking = o.kitchenStatus === 'queue' || o.kitchenStatus === 'cooking' || o.kitchenStatus === 'ready';
      return isRecent || isExplicitCooking;
    });

    // Deduplicate: If an order in activePaid originated from an order in activeHeld, prefer activePaid
    const combined: any[] = [];
    const seenIds = new Set<string>();

    activePaid.forEach(o => {
      seenIds.add(o.id);
      if (o.heldOrderId) seenIds.add(o.heldOrderId);
      combined.push(o);
    });

    activeHeld.forEach(o => {
      if (!seenIds.has(o.id)) {
        combined.push(o);
      }
    });

    // FIFO: oldest order first
    combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (combined.length === 0 && !isAddonActive && isAddonCheckDone) {
      return [
        {
          id: 'preview_kot_1',
          tableNumber: 'Meja 04',
          customerName: 'Bpk. Hendra Kusuma',
          orderType: 'Dine In',
          createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
          cart: [
            { name: 'Nasi Goreng Spesial', qty: 2, note: 'Pedas sedang, telur ceplok setengah matang', selectedAddons: ['Kerupuk Ekstra'] },
            { name: 'Sate Ayam Madura (10 Tusuk)', qty: 1, note: 'Bumbu kacang dipisah' },
          ]
        },
        {
          id: 'preview_kot_2',
          tableNumber: 'Room 302',
          customerName: 'Ibu Ratna Dewi',
          orderType: 'Room Service',
          createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
          cart: [
            { name: 'Grilled Norwegian Salmon', qty: 1, doneness: 'Medium Well', note: 'Saus lemon butter' },
            { name: 'Iced Caramel Macchiato', qty: 2, sugarLevel: 'Less Sugar', iceLevel: 'Less Ice' },
          ]
        },
        {
          id: 'preview_kot_3',
          tableNumber: 'Meja 09',
          customerName: 'Mr. David Smith',
          orderType: 'Dine In',
          createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
          cart: [
            { name: 'Australian Wagyu Ribeye', qty: 1, doneness: 'Medium', note: 'Mushroom sauce' },
            { name: 'Fresh Tropical Fruit Juice', qty: 1, note: 'No added sugar' },
          ]
        }
      ];
    }
    return combined;
  }, [heldOrders, completedOrders, bumpedOrders, isAddonActive, isAddonCheckDone]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    let totalItems = 0;
    let foodItems = 0;
    let barItems = 0;

    visibleHeldOrders.forEach(order => {
      const items = order.cart || order.items || order.products || [];
      items.forEach((item: any) => {
        const qty = Number(item.quantity ?? item.qty ?? item.count ?? 1);
        totalItems += qty;
        if (isItemMatchStation(item, 'bar')) {
          barItems += qty;
        } else {
          foodItems += qty;
        }
      });
    });

    return {
      activeTables: visibleHeldOrders.length,
      totalItems,
      foodItems,
      barItems
    };
  }, [visibleHeldOrders]);

  interface AggregatedWaitingItem {
    id: string;
    name: string;
    totalQty: number;
    isBar: boolean;
    category: string;
    orders: {
      orderId: string;
      tableNumber: string;
      customerName: string;
      qty: number;
      notes: string;
      addons: string[];
      variants: string[];
      createdAt: string;
      rawOrder: any;
    }[];
  }

  // Aggregated Summary of Waiting List Orders across all tables/tickets
  const summaryWaitingList = useMemo(() => {
    const map = new Map<string, AggregatedWaitingItem>();

    visibleHeldOrders.forEach(order => {
      const items = order.cart || order.items || order.products || [];
      items.forEach((item: any) => {
        const name = (item.product?.productstock?.name || item.product?.name || item.name || 'Menu Item').trim();
        const qty = Number(item.quantity ?? item.qty ?? item.count ?? 1);
        if (qty <= 0) return;

        const isBar = isItemMatchStation(item, 'bar');
        const category = item.product?.category || item.category || (isBar ? 'Beverage' : 'Food');
        const note = (item.note || item.notes || item.cookingNote || item.customization || item.instruction || item.remarks || '').trim();
        
        const rawAddons: any[] = Array.isArray(item.selectedAddons) ? item.selectedAddons : (Array.isArray(item.addons) ? item.addons : (Array.isArray(item.toppings) ? item.toppings : []));
        const addons: string[] = rawAddons.map((a: any) => (typeof a === 'string' ? a : (a.name || a.addonName || a.title || '')).trim()).filter(Boolean);
        
        const variants: string[] = [
          item.variant || item.variantName,
          item.size ? `Size: ${item.size}` : null,
          item.sugarLevel ? `Gula: ${item.sugarLevel}` : null,
          item.iceLevel ? `Es: ${item.iceLevel}` : null,
          item.spiceLevel ? `Pedas: ${item.spiceLevel}` : (item.level ? `Level: ${item.level}` : null),
          item.doneness ? `Kematangan: ${item.doneness}` : null,
          item.temperature ? `Suhu: ${item.temperature}` : null,
        ].filter(Boolean) as string[];

        const cleanKey = name.toLowerCase();

        if (!map.has(cleanKey)) {
          map.set(cleanKey, {
            id: cleanKey,
            name,
            totalQty: 0,
            isBar,
            category,
            orders: []
          });
        }

        const entry = map.get(cleanKey)!;
        entry.totalQty += qty;
        entry.orders.push({
          orderId: order.id,
          tableNumber: order.tableNumber || 'Meja',
          customerName: order.customerName || 'Tamu',
          qty,
          notes: note,
          addons,
          variants,
          createdAt: item.createdAt || order.createdAt,
          rawOrder: order
        });
      });
    });

    const list = Array.from(map.values());
    list.sort((a, b) => b.totalQty - a.totalQty);
    return list;
  }, [visibleHeldOrders]);

  const filteredSummaryList = useMemo(() => {
    return summaryWaitingList.filter(item => {
      if (summaryStationFilter === 'food' && item.isBar) return false;
      if (summaryStationFilter === 'bar' && !item.isBar) return false;

      if (summarySearchQuery.trim()) {
        const q = summarySearchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchTable = item.orders.some(o => 
          o.tableNumber.toLowerCase().includes(q) || 
          o.customerName.toLowerCase().includes(q) || 
          o.notes.toLowerCase().includes(q)
        );
        if (!matchName && !matchTable) return false;
      }

      return true;
    });
  }, [summaryWaitingList, summaryStationFilter, summarySearchQuery]);

  // Toggle item prepared status
  const toggleItemDone = (orderId: string, itemIdx: number) => {
    const key = `${orderId}_${itemIdx}`;
    setPreparedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Bump / Dispatch KOT Ticket
  const bumpTicket = async (order: any) => {
    setBumpedOrders(prev => [
      { ...order, bumpedAt: new Date().toISOString() },
      ...prev.filter(p => p.id !== order.id)
    ]);

    // Persist status update to Firestore so POS / Admin stay inline in realtime
    if (activeCode && order.id && !order.id.startsWith('preview_')) {
      try {
        const col = order._collectionName || (order.cart && !order.transactionId ? 'pos_held_orders' : 'pos_orders');
        const ticketRef = doc(getHotelCollection(db, col, activeCode), order.id);
        await updateDoc(ticketRef, {
          kitchenStatus: 'served',
          kitchenServedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not update firestore kitchenStatus:', err);
      }
    }

    toast.success(`KOT ${order.tableNumber || 'Meja'} Selesai Disajikan`, {
      duration: 3000,
      position: 'bottom-right'
    });
  };

  // Restore bumped ticket back to board
  const restoreTicket = async (orderId: string) => {
    const orderToRestore = bumpedOrders.find(p => p.id === orderId);
    setBumpedOrders(prev => prev.filter(p => p.id !== orderId));

    if (activeCode && orderId && !orderId.startsWith('preview_')) {
      try {
        const col = orderToRestore?._collectionName || 'pos_orders';
        const ticketRef = doc(getHotelCollection(db, col, activeCode), orderId);
        await updateDoc(ticketRef, {
          kitchenStatus: 'cooking',
          kitchenRestoredAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not restore firestore kitchenStatus:', err);
      }
    }

    toast.info(`KOT dikembalikan ke antrean`, {
      duration: 3000,
      position: 'bottom-right'
    });
  };

  // Helper to calculate elapsed time with clean capping for old mock records
  const getElapsedInfo = (createdAtStr: string) => {
    if (!createdAtStr) return { elapsedText: '00:00', minutes: 0, urgency: 'normal' };
    const created = new Date(createdAtStr).getTime();
    const diffMs = Math.max(0, currentTime.getTime() - created);
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;

    let elapsedText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    let urgency: 'normal' | 'warning' | 'danger' = 'normal';

    if (mins >= 120) {
      elapsedText = '> 2 Jam';
      urgency = 'danger';
    } else if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      elapsedText = `${hours}j ${remMins}m`;
      urgency = 'danger';
    } else if (mins >= 18) {
      urgency = 'danger';
    } else if (mins >= 10) {
      urgency = 'warning';
    }

    return { elapsedText, minutes: mins, urgency };
  };

  // Mapped tables for the "Denah Meja" overview mode
  const mappedTables = useMemo(() => {
    const matches = tablesList.map(name => {
      const activeOrder = visibleHeldOrders.find(
        o => normalizeTable(o.tableNumber) === normalizeTable(name)
      );
      return {
        name,
        activeOrder,
        isOccupied: !!activeOrder,
        isExtra: false
      };
    });

    const extras = visibleHeldOrders
      .filter(o => {
        const norm = normalizeTable(o.tableNumber);
        return norm && !tablesList.some(t => normalizeTable(t) === norm);
      })
      .map(o => ({
        name: o.tableNumber || 'Meja Ekstra',
        activeOrder: o,
        isOccupied: true,
        isExtra: true
      }));

    return [...matches, ...extras];
  }, [tablesList, visibleHeldOrders]);

  return (
    <div className={ds.kdsWrapper}>
      <div className={`${ds.kdsContainer} ${!isAddonActive && isAddonCheckDone ? ds.kdsBlurredBackground : ''}`}>
        {/* Banner if browser blocked autoplay */}
        {isAudioBlocked && (
          <div 
            onClick={() => {
              unlockAudioContext();
              const audio = getAudioInstance();
              if (audio) {
                audio.play().then(() => {
                  setIsAudioBlocked(false);
                }).catch(() => {});
              }
            }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs py-2 px-4 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md z-50 select-none animate-pulse"
          >
            <AlertTriangle size={15} />
            <span>Audio Notifikasi Belum Diizinkan Browser — <u>Klik di sini untuk mengaktifkan bel suara dapur realtime</u></span>
          </div>
        )}

        {/* ── Top Hotel Operations Control Bar ── */}
        <header className={ds.kdsHeader}>
        {/* Left: Official My Tara Logo & Hotel Identity */}
        <div className={ds.kdsBrandSection}>
          <button 
            onClick={() => router.push('/food-beverage/ledger?module=food-beverage')}
            className={ds.kdsBackBtn}
            title="Kembali ke Halaman Food & Beverage"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Official My Tara Logo */}
          <button
            onClick={() => router.push('/select-module')}
            className={ds.kdsLogoBtn}
            title="Kembali ke Module Selector"
          >
            <img
              src="/channels/6.png"
              alt="My Tara Logo"
              className={ds.kdsLogoImg}
            />
          </button>

          <div className={ds.kdsDivider} />

          {/* Hotel Outlet Status Badge */}
          <div className={ds.kdsHotelTag}>
            <div className={ds.kdsLiveDot}>
              <span className={ds.kdsLiveDotPing} />
              <span className={ds.kdsLiveDotCore} />
            </div>
            <div className={ds.kdsHotelTextGroup}>
              <span className={ds.kdsHotelName}>
                {activeHotelName || 'Restoran'}
              </span>
              <span className={ds.kdsHotelSubtitle}>
                Live View Order
              </span>
            </div>
          </div>

          {/* Master Operational Clock */}
          <div className={ds.kdsClockBox}>
            <span className={ds.kdsClockTime}>
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div className={ds.kdsClockDateBox}>
              <span>{currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <span className={ds.kdsClockLiveLabel}>LIVE SYNC</span>
            </div>
          </div>
        </div>

        {/* Center: Kitchen Station Routing (Pill Tabs) */}
        <div className={ds.kdsStationTabs}>
          <button
            onClick={() => setStationFilter('all')}
            className={`${ds.kdsStationTab} ${stationFilter === 'all' ? ds.kdsStationTabActive : ''}`}
          >
            <LayoutGrid size={13} />
            <span>Semua Station</span>
            <span className={ds.kdsStationBadge}>{visibleHeldOrders.length}</span>
          </button>

          <button
            onClick={() => setStationFilter('food')}
            className={`${ds.kdsStationTab} ${stationFilter === 'food' ? ds.kdsStationTabActive : ''}`}
          >
            <ChefHat size={13} />
            <span>Hot &amp; Cold Kitchen</span>
            <span className={ds.kdsStationBadge}>{metrics.foodItems}</span>
          </button>

          <button
            onClick={() => setStationFilter('bar')}
            className={`${ds.kdsStationTab} ${stationFilter === 'bar' ? ds.kdsStationTabActive : ''}`}
          >
            <Wine size={13} />
            <span>Bar &amp; Lounge</span>
            <span className={ds.kdsStationBadge}>{metrics.barItems}</span>
          </button>

          <button
            onClick={() => setStationFilter('tables')}
            className={`${ds.kdsStationTab} ${stationFilter === 'tables' ? ds.kdsStationTabActive : ''}`}
          >
            <Users size={13} />
            <span>Floor Matrix (Meja)</span>
            <span className={ds.kdsStationBadge}>{mappedTables.filter(t => t.isOccupied).length}/{mappedTables.length}</span>
          </button>

          <button
            onClick={() => setStationFilter('summary')}
            className={`${ds.kdsStationTab} ${stationFilter === 'summary' ? ds.kdsStationTabActive : ''}`}
            title="Ringkasan total antrean per menu (Waiting List)"
          >
            <ListOrdered size={13} />
            <span>Summary Waiting List</span>
            <span className={ds.kdsStationBadge}>{summaryWaitingList.length}</span>
          </button>
        </div>

        {/* Right: Operational Controls & Recall Drawer */}
        <div className={ds.kdsControlGroup}>
          <button
            onClick={() => setIsSummaryDrawerOpen(true)}
            className={`${ds.kdsControlBtn} ${isSummaryDrawerOpen || stationFilter === 'summary' ? ds.kdsControlBtnActive : ds.kdsControlBtnMuted}`}
            title="Buka panel ringkasan antrean menu (Waiting List)"
          >
            <ListOrdered size={14} />
            <span>Summary ({summaryWaitingList.length})</span>
          </button>

          <button
            onClick={() => setIsRecallOpen(true)}
            className={`${ds.kdsControlBtn} ${ds.kdsControlBtnMuted}`}
            title="Riwayat pesanan yang sudah disajikan"
          >
            <History size={14} />
            <span>Recall ({bumpedOrders.length})</span>
          </button>

          <button
            onClick={() => {
              if (isAudioMuted) {
                setIsAudioMuted(false);
                unlockAudioContext();
              } else {
                setIsAudioMuted(true);
                stopAlarm();
              }
            }}
            className={`${ds.kdsControlBtn} ${isAudioMuted ? ds.kdsControlBtnMuted : ds.kdsControlBtnActive}`}
            title={isAudioMuted ? 'Suara Bel Mati (Klik untuk Mengaktifkan)' : 'Suara Bel Aktif'}
          >
            {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isAudioMuted ? 'Muted' : 'Chime'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={ds.kdsControlBtn}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh TV (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </header>

      {/* ── Performance Metrics Ribbon ── */}
      <div className={ds.kdsMetricBar}>
        <div className={ds.kdsMetricCard}>
          <span className={ds.kdsMetricTitle}>Meja Aktif:</span>
          <span className={`${ds.kdsMetricNum} ${ds.kdsMetricNumEmerald}`}>
            {metrics.activeTables} Meja
          </span>
        </div>

        <div className={ds.kdsMetricCard}>
          <span className={ds.kdsMetricTitle}>Menu Dapur (Food):</span>
          <span className={`${ds.kdsMetricNum} ${ds.kdsMetricNumAmber}`}>
            {metrics.foodItems} Porsi
          </span>
        </div>

        <div className={ds.kdsMetricCard}>
          <span className={ds.kdsMetricTitle}>Menu Bar (Beverage):</span>
          <span className={`${ds.kdsMetricNum} ${ds.kdsMetricNumSky}`}>
            {metrics.barItems} Minuman
          </span>
        </div>

        <div className={ds.kdsMetricCard}>
          <span className={ds.kdsMetricTitle}>Total Antrean:</span>
          <span className={`${ds.kdsMetricNum} ${ds.kdsMetricNumEmerald}`}>
            {metrics.totalItems} Porsi
          </span>
        </div>

        <div 
          onClick={() => setStationFilter('summary')}
          className={`${ds.kdsMetricCard} cursor-pointer hover:border-amber-400 transition-colors`}
          title="Klik untuk melihat ringkasan antrean menu (Summary Waiting List)"
        >
          <span className={ds.kdsMetricTitle}>Jenis Menu Antre:</span>
          <span className={`${ds.kdsMetricNum} text-amber-600`}>
            {summaryWaitingList.length} Jenis
          </span>
        </div>
      </div>

      {/* ── Main Canvas Grid View ── */}
      <main className={ds.kdsCanvas}>
        {isLoading ? (
          <div className={ds.kdsEmptyBox}>
            <RefreshCw size={32} className="animate-spin text-stone-400" />
            <span className={ds.kdsEmptyTitle}>Menghubungkan ke POS Live View Order...</span>
          </div>
        ) : stationFilter === 'tables' ? (
          /* ── Table Floor Matrix Mode ── */
          <div className={ds.kdsFloorGrid}>
            {mappedTables.map((table, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (table.activeOrder) {
                    setSelectedOrder(table.activeOrder);
                  }
                }}
                className={`${ds.kdsTableCard} ${table.isOccupied ? ds.kdsTableCardActive : ds.kdsTableCardEmpty}`}
              >
                <div className={ds.kdsTableCardHead}>
                  <span className={ds.kdsTableCardTitle}>{table.name}</span>
                  <span className={`${ds.kdsTableCardBadge} ${table.isOccupied ? ds.kdsTableCardBadgeActive : ds.kdsTableCardBadgeEmpty}`}>
                    {table.isOccupied ? 'Terisi' : 'Kosong'}
                  </span>
                </div>

                {table.isOccupied && table.activeOrder ? (
                  <div className={ds.kdsTableCardBody}>
                    <div className={ds.kdsTableCardRow}>
                      <span className={ds.kdsTableCardGuest}>
                        {table.activeOrder.customerName || 'Tamu'}
                      </span>
                      <span>
                        {getElapsedInfo(table.activeOrder.createdAt).elapsedText}
                      </span>
                    </div>
                    <div className={ds.kdsTableCardFoot}>
                      <span>{(table.activeOrder.cart || []).length} Menu</span>
                      <span className={ds.kdsTableCardTotal}>
                        {formatIDR(table.activeOrder.payableAmount ?? table.activeOrder.subtotal ?? 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className={ds.kdsTableCardEmptyMsg}>Tidak ada pesanan aktif</span>
                )}
              </div>
            ))}
          </div>
        ) : stationFilter === 'summary' ? (
          /* ── Summary Waiting List View Mode ── */
          <div className={ds.kdsSummaryWrapper}>
            {/* Filter Bar */}
            <div className={ds.kdsSummaryFilterBar}>
              <div className={ds.kdsSummaryTabs}>
                <button
                  onClick={() => setSummaryStationFilter('all')}
                  className={`${ds.kdsSummaryTabBtn} ${summaryStationFilter === 'all' ? ds.kdsSummaryTabBtnActive : ''}`}
                >
                  <LayoutGrid size={13} />
                  <span>Semua Menu</span>
                  <span className={ds.kdsSummaryTabBadge}>
                    {summaryWaitingList.reduce((acc, it) => acc + it.totalQty, 0)} Porsi
                  </span>
                </button>
                <button
                  onClick={() => setSummaryStationFilter('food')}
                  className={`${ds.kdsSummaryTabBtn} ${summaryStationFilter === 'food' ? ds.kdsSummaryTabBtnActive : ''}`}
                >
                  <ChefHat size={13} />
                  <span>Dapur / Kitchen (Food)</span>
                  <span className={ds.kdsSummaryTabBadge}>
                    {summaryWaitingList.filter(it => !it.isBar).reduce((acc, it) => acc + it.totalQty, 0)} Porsi
                  </span>
                </button>
                <button
                  onClick={() => setSummaryStationFilter('bar')}
                  className={`${ds.kdsSummaryTabBtn} ${summaryStationFilter === 'bar' ? ds.kdsSummaryTabBtnActive : ''}`}
                >
                  <Wine size={13} />
                  <span>Bar / Minuman (Beverage)</span>
                  <span className={ds.kdsSummaryTabBadge}>
                    {summaryWaitingList.filter(it => it.isBar).reduce((acc, it) => acc + it.totalQty, 0)} Minuman
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className={ds.kdsSummarySearchBox}>
                <Search size={14} className="text-stone-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari nama menu, nomor meja, tamu..."
                  value={summarySearchQuery}
                  onChange={(e) => setSummarySearchQuery(e.target.value)}
                  className={ds.kdsSummarySearchInput}
                />
                {summarySearchQuery && (
                  <button 
                    onClick={() => setSummarySearchQuery('')}
                    className="text-stone-400 hover:text-stone-700 text-xs px-1"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Aggregated Items */}
            {filteredSummaryList.length === 0 ? (
              <div className={ds.kdsEmptyBox}>
                <ShieldCheck size={40} className="text-emerald-600" />
                <h3 className={ds.kdsEmptyTitle}>Tidak Ada Antrean Menu</h3>
                <p className={ds.kdsEmptyDesc}>
                  {summarySearchQuery ? 'Tidak ada menu yang sesuai dengan kata kunci pencarian.' : 'Seluruh pesanan dapur dan bar telah selesai diproses.'}
                </p>
              </div>
            ) : (
              <div className={ds.kdsSummaryGrid}>
                {filteredSummaryList.map((item) => (
                  <div key={item.id} className={ds.kdsSummaryCard}>
                    <div className={ds.kdsSummaryCardHead}>
                      <div className={ds.kdsSummaryCardInfo}>
                        <div className="flex items-center gap-2">
                          <span className={item.isBar ? ds.kdsTagBar : ds.kdsTagFood}>
                            {item.isBar ? 'BAR' : 'KITCHEN'}
                          </span>
                          <span className={ds.kdsSummaryCardMeta}>{item.orders.length} Meja Memesan</span>
                        </div>
                        <h4 className={ds.kdsSummaryCardTitle}>{item.name}</h4>
                      </div>
                      <div className={ds.kdsSummaryCardTotal}>
                        <span className={`${ds.kdsSummaryTotalNum} ${item.isBar ? ds.kdsSummaryTotalNumBar : ''}`}>
                          {item.totalQty}
                        </span>
                        <span className={ds.kdsSummaryTotalLabel}>
                          {item.isBar ? 'Total Minuman' : 'Total Porsi'}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown per Table */}
                    <div className={ds.kdsSummaryOrdersList}>
                      {item.orders.map((ord, oIdx) => (
                        <div key={oIdx} className={ds.kdsSummaryOrderRow}>
                          <div className={ds.kdsSummaryOrderHead}>
                            <div className="flex items-center gap-2">
                              <span 
                                onClick={() => setSelectedOrder(ord.rawOrder)}
                                className={ds.kdsSummaryTableBadge}
                                title="Klik untuk melihat tiket meja ini"
                              >
                                {ord.tableNumber}
                              </span>
                              <span className={ds.kdsSummaryGuest}>{ord.customerName}</span>
                            </div>
                            <span className={ds.kdsSummaryRowQty}>
                              {ord.qty}x
                            </span>
                          </div>

                          {/* Notes if any */}
                          {ord.notes && (
                            <div className={ds.kdsSummaryNoteBox}>
                              <span className="shrink-0 font-bold">📝</span>
                              <span>{ord.notes}</span>
                            </div>
                          )}

                          {/* Addons / Variants if any */}
                          {(ord.addons.length > 0 || ord.variants.length > 0) && (
                            <div className={ds.kdsSummaryAddonsList}>
                              {ord.variants.map((v, vIdx) => (
                                <span key={vIdx} className={ds.kdsSummaryAddonTag}>{v}</span>
                              ))}
                              {ord.addons.map((a, aIdx) => (
                                <span key={aIdx} className={ds.kdsSummaryAddonTag}>+{a}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : visibleHeldOrders.length === 0 ? (
          /* ── Empty Queue State ── */
          <div className={ds.kdsEmptyBox}>
            <ShieldCheck size={44} className="text-emerald-600" />
            <h3 className={ds.kdsEmptyTitle}>Semua Pesanan Selesai Disajikan</h3>
            <p className={ds.kdsEmptyDesc}>
              Tidak ada pesanan tertahan saat ini. Pesanan baru dari Kasir POS atau Tamu akan langsung tampil di layar ini secara real-time.
            </p>
          </div>
        ) : (
          /* ── KOT Multi-Column Grid ── */
          <div className={ds.kdsGrid}>
            {visibleHeldOrders.map((order, orderIdx) => {
              const allItems = order.cart || order.items || order.products || [];
              const filteredItems = allItems.filter((it: any) => isItemMatchStation(it, stationFilter));
              
              if (filteredItems.length === 0 && stationFilter !== 'all') {
                return null;
              }

              const { elapsedText, urgency } = getElapsedInfo(order.createdAt);
              const orderType = (order.source || order.orderType || '').toLowerCase();
              const isRoom = orderType.includes('room') || String(order.tableNumber || '').toLowerCase().includes('kamar');
              const isSelf = orderType.includes('self');

              return (
                <div
                  key={order.id || orderIdx}
                  className={`${ds.kdsTicket} ${
                    urgency === 'danger'
                      ? ds.kdsTicketUrgentDanger
                      : urgency === 'warning'
                      ? ds.kdsTicketUrgentWarn
                      : ''
                  }`}
                >
                  {/* KOT Header Band */}
                  <div className={ds.kdsTicketHead}>
                    <div className={ds.kdsTicketHeadLeft}>
                      <div className={ds.kdsTableBadge}>
                        <span className={ds.kdsTableText}>
                          {order.tableNumber ? order.tableNumber.toUpperCase() : `KOT #${orderIdx + 1}`}
                        </span>
                      </div>
                      <span className={`${ds.kdsServicePill} ${
                        isRoom 
                          ? ds.kdsServiceRoom 
                          : isSelf 
                          ? ds.kdsServiceTakeaway 
                          : ds.kdsServiceDineIn
                      }`}>
                        {isRoom ? 'Room Service' : isSelf ? 'Self Order' : 'Dine-In POS'}
                      </span>
                    </div>

                    {/* Live SLA Urgency Timer */}
                    <div className={`${ds.kdsTimerChip} ${
                      urgency === 'danger'
                        ? ds.kdsTimerDanger
                        : urgency === 'warning'
                        ? ds.kdsTimerWarn
                        : ds.kdsTimerNormal
                    }`}>
                      <Clock size={12} />
                      <span>{elapsedText}</span>
                    </div>
                  </div>

                  {/* Sub Header: Guest */}
                  <div className={ds.kdsTicketMeta}>
                    <div className={ds.kdsGuestName}>
                      <Users size={12} className="text-stone-400" />
                      <span>{order.customerName || 'Tamu Restoran'}</span>
                    </div>
                  </div>

                  {/* KOT Body (Itemized List) */}
                  <div className={ds.kdsTicketItems}>
                    {filteredItems.map((item: any, itemIdx: number) => {
                      const itemName = item.product?.productstock?.name || item.product?.name || item.name || 'Menu Item';
                      const quantity = item.quantity ?? item.qty ?? item.count ?? 1;
                      const itemNote = (item.note || item.notes || item.cookingNote || item.customization || item.instruction || item.remarks || '').trim();
                      const rawAddons: any[] = Array.isArray(item.selectedAddons) ? item.selectedAddons : (Array.isArray(item.addons) ? item.addons : (Array.isArray(item.toppings) ? item.toppings : []));
                      const addons: string[] = rawAddons.map((a: any) => (typeof a === 'string' ? a : (a.name || a.addonName || a.title || '')).trim()).filter(Boolean);
                      
                      const variants: string[] = [
                        item.variant || item.variantName,
                        item.size ? `Size: ${item.size}` : null,
                        item.sugarLevel ? `Gula: ${item.sugarLevel}` : null,
                        item.iceLevel ? `Es: ${item.iceLevel}` : null,
                        item.spiceLevel ? `Pedas: ${item.spiceLevel}` : (item.level ? `Level: ${item.level}` : null),
                        item.doneness ? `Kematangan: ${item.doneness}` : null,
                        item.temperature ? `Suhu: ${item.temperature}` : null,
                      ].filter(Boolean) as string[];

                      const isBar = isItemMatchStation(item, 'bar');
                      const isDone = !!preparedItems[`${order.id}_${itemIdx}`];

                      return (
                        <div
                          key={itemIdx}
                          onClick={() => toggleItemDone(order.id, itemIdx)}
                          className={`${ds.kdsItem} ${isDone ? ds.kdsItemDone : ''}`}
                          title="Klik untuk menandai hidangan siap saji"
                        >
                          <div className={ds.kdsItemRow}>
                            <div className={ds.kdsItemLeft}>
                              <div className={`${ds.kdsQtyBox} ${quantity > 1 ? ds.kdsQtyMulti : ''}`}>
                                {quantity}
                              </div>
                              <span className={ds.kdsItemTitle}>{itemName}</span>
                            </div>

                            <div className={ds.kdsItemRight}>
                              <span className={isBar ? ds.kdsTagBar : ds.kdsTagFood}>
                                {isBar ? 'BAR' : 'KITCHEN'}
                              </span>
                              <div className={`${ds.kdsCheckbox} ${isDone ? ds.kdsCheckboxChecked : ''}`}>
                                {isDone && <Check size={12} />}
                              </div>
                            </div>
                          </div>

                          {/* Addons & Variants Badges */}
                          {(addons.length > 0 || variants.length > 0) && (
                            <div className={ds.kdsAddonsList}>
                              {variants.map((v, vIdx) => (
                                <span key={vIdx} className={ds.kdsVariantPill}>
                                  {v}
                                </span>
                              ))}
                              {addons.map((ad, adIdx) => (
                                <span key={adIdx} className={ds.kdsAddonPill}>
                                  + {ad}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Cooking Request / Specific Note / Customization */}
                          {itemNote && (
                            <div className={ds.kdsCookNote}>
                              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                              <span><strong>Instruksi:</strong> {itemNote}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Overall Order Notes */}
                    {order.notes && (
                      <div className={ds.kdsTableNote}>
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                        <span>Catatan Meja: {order.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* KOT Footer & Dispatch Bump Action */}
                  <div className={ds.kdsTicketFoot}>
                    <div className={ds.kdsFootSummary}>
                      <span className={ds.kdsFootCount}>
                        {filteredItems.reduce((sum: number, it: any) => sum + Number(it.quantity ?? it.qty ?? 1), 0)} Porsi ({filteredItems.length} Menu)
                      </span>
                      <span className={ds.kdsFootTime}>
                        <Clock size={10} />
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>

                    <div className={ds.kdsActionWrap}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className={ds.kdsInfoBtn}
                        title="Lihat rincian tagihan"
                      >
                        Info
                      </button>

                      <button
                        onClick={() => bumpTicket(order)}
                        className={ds.kdsBumpBtn}
                        title="Tandai pesanan selesai disajikan"
                      >
                        <Check size={12} />
                        <span>Bump</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Slide-Over Recall Drawer (Dispatched KOT History) ── */}
      <AnimatePresence>
        {isRecallOpen && (
          <div className={ds.kdsDrawerOverlay}>
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={ds.kdsDrawer}
            >
              <div className={ds.kdsDrawerHead}>
                <span className={ds.kdsDrawerTitle}>
                  <History size={16} />
                  <span>Riwayat Saji (Recall)</span>
                </span>
                <button
                  onClick={() => setIsRecallOpen(false)}
                  className={ds.kdsDrawerClose}
                >
                  <X size={16} />
                </button>
              </div>

              <div className={ds.kdsDrawerBody}>
                {bumpedOrders.length === 0 ? (
                  <div className={ds.kdsRecallEmpty}>
                    Belum ada pesanan yang di-bump
                  </div>
                ) : (
                  bumpedOrders.map((bo, idx) => (
                    <div key={idx} className={ds.kdsRecallCard}>
                      <div className={ds.kdsRecallHead}>
                        <div>
                          <span className={ds.kdsRecallTable}>
                            {bo.tableNumber ? bo.tableNumber.toUpperCase() : 'MEJA'}
                          </span>
                          <span className={ds.kdsRecallGuest}>
                            {bo.customerName || 'Tamu'}
                          </span>
                        </div>
                        <button
                          onClick={() => restoreTicket(bo.id)}
                          className={ds.kdsRecallRestore}
                        >
                          <RotateCcw size={10} />
                          <span>Restore</span>
                        </button>
                      </div>
                      <div className={ds.kdsRecallMeta}>
                        {(bo.cart || []).length} Menu · Selesai jam {new Date(bo.bumpedAt).toLocaleTimeString('id-ID')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Summary Waiting List Quick Drawer ── */}
      <AnimatePresence>
        {isSummaryDrawerOpen && (
          <div className={ds.kdsDrawerOverlay} onClick={() => setIsSummaryDrawerOpen(false)}>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={ds.kdsSummaryDrawer}
            >
              <div className={ds.kdsDrawerHead}>
                <div className={ds.kdsDrawerTitle}>
                  <ListOrdered size={16} className="text-amber-600" />
                  <span>Summary Waiting List ({filteredSummaryList.length} Menu)</span>
                </div>
                <button
                  onClick={() => setIsSummaryDrawerOpen(false)}
                  className={ds.kdsDrawerClose}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Station Filter Pills in Drawer */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSummaryStationFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-colors ${summaryStationFilter === 'all' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-stone-200'}`}
                >
                  Semua ({summaryWaitingList.reduce((acc, it) => acc + it.totalQty, 0)})
                </button>
                <button
                  onClick={() => setSummaryStationFilter('food')}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-colors ${summaryStationFilter === 'food' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-stone-200'}`}
                >
                  Kitchen ({summaryWaitingList.filter(it => !it.isBar).reduce((acc, it) => acc + it.totalQty, 0)})
                </button>
                <button
                  onClick={() => setSummaryStationFilter('bar')}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-colors ${summaryStationFilter === 'bar' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-stone-200'}`}
                >
                  Bar ({summaryWaitingList.filter(it => it.isBar).reduce((acc, it) => acc + it.totalQty, 0)})
                </button>
              </div>

              {/* Drawer Search */}
              <div className={ds.kdsSummarySearchBox} style={{ maxWidth: '100%' }}>
                <Search size={14} className="text-stone-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari nama menu / nomor meja..."
                  value={summarySearchQuery}
                  onChange={(e) => setSummarySearchQuery(e.target.value)}
                  className={ds.kdsSummarySearchInput}
                />
                {summarySearchQuery && (
                  <button 
                    onClick={() => setSummarySearchQuery('')}
                    className="text-stone-400 hover:text-stone-700 text-xs px-1"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Drawer Items Body */}
              <div className={ds.kdsDrawerBody}>
                {filteredSummaryList.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs">
                    Tidak ada menu dalam antrean
                  </div>
                ) : (
                  filteredSummaryList.map((item) => (
                    <div key={item.id} className={ds.kdsSummaryCard} style={{ padding: '12px' }}>
                      <div className={ds.kdsSummaryCardHead} style={{ paddingBottom: '6px' }}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={item.isBar ? ds.kdsTagBar : ds.kdsTagFood}>
                              {item.isBar ? 'BAR' : 'KITCHEN'}
                            </span>
                            <span className="text-[11px] text-stone-500 font-medium">
                              {item.orders.length} Meja
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-stone-900 mt-1">{item.name}</h4>
                        </div>
                        <div className={ds.kdsSummaryCardTotal}>
                          <span className={`${ds.kdsSummaryTotalNum} ${item.isBar ? ds.kdsSummaryTotalNumBar : ''}`} style={{ fontSize: '20px' }}>
                            {item.totalQty}
                          </span>
                          <span className={ds.kdsSummaryTotalLabel}>
                            {item.isBar ? 'Minuman' : 'Porsi'}
                          </span>
                        </div>
                      </div>

                      <div className={ds.kdsSummaryOrdersList}>
                        {item.orders.map((ord, oIdx) => (
                          <div key={oIdx} className={ds.kdsSummaryOrderRow}>
                            <div className={ds.kdsSummaryOrderHead}>
                              <div className="flex items-center gap-1.5">
                                <span 
                                  onClick={() => {
                                    setIsSummaryDrawerOpen(false);
                                    setSelectedOrder(ord.rawOrder);
                                  }}
                                  className={ds.kdsSummaryTableBadge}
                                  title="Lihat detail pesanan meja ini"
                                >
                                  {ord.tableNumber}
                                </span>
                                <span className={ds.kdsSummaryGuest}>{ord.customerName}</span>
                              </div>
                              <span className={ds.kdsSummaryRowQty}>{ord.qty}x</span>
                            </div>

                            {ord.notes && (
                              <div className={ds.kdsSummaryNoteBox}>
                                <span>📝</span>
                                <span>{ord.notes}</span>
                              </div>
                            )}

                            {(ord.addons.length > 0 || ord.variants.length > 0) && (
                              <div className={ds.kdsSummaryAddonsList}>
                                {ord.variants.map((v, vIdx) => (
                                  <span key={vIdx} className={ds.kdsSummaryAddonTag}>{v}</span>
                                ))}
                                {ord.addons.map((a, aIdx) => (
                                  <span key={aIdx} className={ds.kdsSummaryAddonTag}>+{a}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Order Detail Modal ── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className={ds.kdsModalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={ds.kdsModal}
            >
              <button
                onClick={() => setSelectedOrder(null)}
                className={ds.kdsModalClose}
              >
                <X size={15} />
              </button>

              <div className={ds.kdsModalHead}>
                <span className={ds.kdsModalSubtitle}>
                  Rincian Transaksi POS
                </span>
                <h2 className={ds.kdsModalTitle}>
                  {selectedOrder.tableNumber ? selectedOrder.tableNumber.toUpperCase() : 'TRANSAKSI MEJA'}
                </h2>
              </div>

              {/* Guest & Timing details */}
              <div className={ds.kdsModalInfoGrid}>
                <div>
                  <span className={ds.kdsModalInfoLabel}>Nama Tamu:</span>
                  <span className={ds.kdsModalInfoValue}>{selectedOrder.customerName || 'Guest'}</span>
                </div>
                <div>
                  <span className={ds.kdsModalInfoLabel}>Waktu Pesan:</span>
                  <span className={ds.kdsModalInfoValue}>
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleTimeString('id-ID') : '—'}
                  </span>
                </div>
                <div>
                  <span className={ds.kdsModalInfoLabel}>Metode Pembayaran:</span>
                  <span className={ds.kdsModalInfoValue}>{selectedOrder.paymentMethod || 'Kasir (Pending)'}</span>
                </div>
                <div>
                  <span className={ds.kdsModalInfoLabel}>Total Tagihan:</span>
                  <span className={ds.kdsModalInfoEmerald}>
                    {formatIDR(selectedOrder.payableAmount ?? selectedOrder.subtotal ?? 0)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className={ds.kdsModalItemsList}>
                {(() => {
                  const items = selectedOrder.cart || selectedOrder.items || selectedOrder.products || [];
                  return items.map((it: any, idx: number) => {
                    const name = it.product?.productstock?.name || it.product?.name || it.name || 'Menu Item';
                    const qty = it.quantity ?? it.qty ?? it.count ?? 1;
                    const price = it.product?.sellprice ?? it.product?.price ?? it.price ?? 0;
                    const note = (it.note || it.notes || it.cookingNote || it.customization || it.instruction || it.remarks || '').trim();
                    const rawAddons: any[] = Array.isArray(it.selectedAddons) ? it.selectedAddons : (Array.isArray(it.addons) ? it.addons : (Array.isArray(it.toppings) ? it.toppings : []));
                    const addons: string[] = rawAddons.map((a: any) => (typeof a === 'string' ? a : (a.name || a.addonName || a.title || '')).trim()).filter(Boolean);
                    const variants: string[] = [
                      it.variant || it.variantName,
                      it.size ? `Size: ${it.size}` : null,
                      it.sugarLevel ? `Gula: ${it.sugarLevel}` : null,
                      it.iceLevel ? `Es: ${it.iceLevel}` : null,
                      it.spiceLevel ? `Pedas: ${it.spiceLevel}` : (it.level ? `Level: ${it.level}` : null),
                      it.doneness ? `Kematangan: ${it.doneness}` : null,
                      it.temperature ? `Suhu: ${it.temperature}` : null,
                    ].filter(Boolean) as string[];

                    return (
                      <div key={idx} className={ds.kdsModalItemRow}>
                        <div className={ds.kdsModalItemMain}>
                          <span className={ds.kdsModalItemName}>
                            {qty}× {name}
                          </span>
                          <span className={ds.kdsModalItemPrice}>
                            {formatIDR(qty * price)}
                          </span>
                        </div>

                        {(variants.length > 0 || addons.length > 0) && (
                          <div className={ds.kdsAddonsList}>
                            {variants.map((v, vIdx) => (
                              <span key={vIdx} className={ds.kdsVariantPill}>{v}</span>
                            ))}
                            {addons.map((ad, adIdx) => (
                              <span key={adIdx} className={ds.kdsAddonPill}>+ {ad}</span>
                            ))}
                          </div>
                        )}

                        {note && (
                          <span className={ds.kdsModalItemNote}>
                            ⚠️ Instruksi: {note}
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <div className={ds.kdsModalFoot}>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={ds.kdsModalCloseAction}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {/* ── Compact Locked Add-on Modal Overlay (Mounted to Body via Portal) ── */}
      {isMounted && !isAddonActive && isAddonCheckDone && typeof document !== 'undefined' && createPortal(
        <div className={ds.kdsLockedOverlay}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={ds.kdsLockedCardCompact}
          >
            <div className={ds.kdsLockedIconBadgeCompact}>
              <Lock size={20} />
            </div>

            <div className={ds.kdsLockedTagCompact}>
              <Sparkles size={11} className="text-amber-600" />
              <span>Add-on Module</span>
            </div>

            <h2 className={ds.kdsLockedTitleCompact}>
              POS Real-time (Live View Order & KDS)
            </h2>

            <p className={ds.kdsLockedDescCompact}>
              Fitur <strong>Kitchen Display System (KDS)</strong> belum aktif untuk properti <strong>{activeHotelName || 'Hotel Anda'}</strong>. Modul ini adalah Add-on opsional untuk kecepatan dan presisi operasional dapur & bar.
            </p>

            <div className={ds.kdsLockedGridCompact}>
              <div className={ds.kdsLockedFeatureCompact}>
                <div className={ds.kdsLockedFeatureIconBox}>
                  <Zap size={13} className="text-amber-600" />
                </div>
                <div className={ds.kdsLockedFeatureText}>
                  <span className={ds.kdsLockedFeatureTitleCompact}>Live Order KOT</span>
                  <span className={ds.kdsLockedFeatureDescCompact}>Tiket pesanan otomatis</span>
                </div>
              </div>

              <div className={ds.kdsLockedFeatureCompact}>
                <div className={ds.kdsLockedFeatureIconBox}>
                  <Clock size={13} className="text-emerald-600" />
                </div>
                <div className={ds.kdsLockedFeatureText}>
                  <span className={ds.kdsLockedFeatureTitleCompact}>SLA Cooking Timer</span>
                  <span className={ds.kdsLockedFeatureDescCompact}>Peringatan warna durasi</span>
                </div>
              </div>

              <div className={ds.kdsLockedFeatureCompact}>
                <div className={ds.kdsLockedFeatureIconBox}>
                  <ChefHat size={13} className="text-amber-700" />
                </div>
                <div className={ds.kdsLockedFeatureText}>
                  <span className={ds.kdsLockedFeatureTitleCompact}>Modifiers & Catatan</span>
                  <span className={ds.kdsLockedFeatureDescCompact}>Instruksi menu detail</span>
                </div>
              </div>

              <div className={ds.kdsLockedFeatureCompact}>
                <div className={ds.kdsLockedFeatureIconBox}>
                  <Tv size={13} className="text-blue-600" />
                </div>
                <div className={ds.kdsLockedFeatureText}>
                  <span className={ds.kdsLockedFeatureTitleCompact}>TV Fullscreen Mode</span>
                  <span className={ds.kdsLockedFeatureDescCompact}>Tampilan layar TV dapur</span>
                </div>
              </div>
            </div>

            <div className={ds.kdsLockedActionsCompact}>
              <button 
                onClick={() => router.push('/food-beverage/ledger?module=food-beverage')}
                className={ds.kdsLockedSecondaryBtnCompact}
              >
                <ArrowLeft size={14} />
                <span>Kembali</span>
              </button>
              
              <a
                href={`https://wa.me/628888396598?text=${encodeURIComponent(`Halo Sales Setara, saya tertarik untuk mengaktifkan Add-on POS Real-time (Kitchen Display System / KDS) untuk ${activeHotelName || 'properti kami'}. Mohon informasi aktivasinya.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={ds.kdsLockedPrimaryBtnCompact}
              >
                <Sparkles size={14} />
                <span>Hubungi Sales</span>
              </a>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
