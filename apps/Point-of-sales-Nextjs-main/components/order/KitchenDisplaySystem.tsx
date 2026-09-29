'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { onSnapshot, doc, getDoc, query, orderBy, limit, updateDoc } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { 
  Clock, Maximize2, Minimize2, Volume2, VolumeX, 
  ArrowLeft, RefreshCw, AlertTriangle,
  Wine, LayoutGrid, Users, ChefHat,
  X, Check, History, ShieldCheck,
  Lock, Sparkles, Tv, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import ds from './KitchenDisplaySystem.module.css';

type StationFilter = 'all' | 'food' | 'bar' | 'tables';

export default function KitchenDisplaySystem() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [activeCode, setActiveCode] = useState<string>('');
  const [hotelName, setHotelName] = useState<string>('Restoran');
  const [user, setUser] = useState<any>(null);
  const [tablesList, setTablesList] = useState<string[]>([]);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hotelDocData, setHotelDocData] = useState<any>(null);
  const [isAddonCheckDone, setIsAddonCheckDone] = useState<boolean>(false);
  const [stationFilter, setStationFilter] = useState<StationFilter>('all');

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

  const prevOrdersIdsRef = useRef<string[]>([]);
  const isInitialLoadRef = useRef(true);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const posSoundUrlRef = useRef<string>('/sounds/notification.mp3');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Read user & hotel code from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const uStr = localStorage.getItem('user');
      if (uStr) {
        setUser(JSON.parse(uStr));
      }
    } catch {}

    const code = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
    setActiveCode(code);
  }, []);

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
      alarmAudioRef.current = new Audio(posSoundUrlRef.current || '/sounds/notification.mp3');
      alarmAudioRef.current.volume = 1.0;
    }
    return alarmAudioRef.current;
  }, []);

  // Listen to Firestore for Tables, Held Orders, Completed Orders, and Hotel Billing Config
  useEffect(() => {
    if (!activeCode || activeCode === '0') {
      setIsLoading(false);
      setIsAddonCheckDone(true);
      return;
    }

    let unsubHeld: any;
    let unsubCompleted: any;
    let unsubHotelConfig: any;

    const fetchConfigAndListen = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch tables list from pos settings
        const posRef = doc(db, 'hotels', activeCode, 'settings', 'pos');
        const posSnap = await getDoc(posRef);
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

        // 2. Listen to active held orders (pos_held_orders)
        const heldCollection = getHotelCollection(db, 'pos_held_orders', activeCode);
        unsubHeld = onSnapshot(heldCollection, (snap) => {
          const orders = snap.docs.map(d => {
            const data = d.data();
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
            return { id: d.id, ...data, createdAt, _collectionName: 'pos_held_orders' };
          });

          orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setHeldOrders(orders);
          setIsLoading(false);
        }, (err) => {
          console.error('POS held orders listener error:', err);
          setIsLoading(false);
        });

        // 3. Listen to cashier paid orders (pos_orders)
        const completedCollection = getHotelCollection(db, 'pos_orders', activeCode);
        const completedQuery = query(completedCollection, orderBy('timestamp', 'desc'), limit(50));
        unsubCompleted = onSnapshot(completedQuery, (snap) => {
          const orders = snap.docs.map(d => {
            const data = d.data();
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
            return { id: d.id, ...data, createdAt, _collectionName: 'pos_orders' };
          });
          setCompletedOrders(orders);
        }, (err) => {
          console.error('POS completed orders listener error:', err);
        });

        // 4. Hotel Doc: Sound & Billing Modules
        const hotelRef = doc(db, 'hotels', activeCode);
        unsubHotelConfig = onSnapshot(hotelRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setHotelDocData(data);
            if (data.name || data.hotelName) {
              setHotelName(data.name || data.hotelName);
            }
            if (data.posSoundUrl && data.posSoundUrl !== posSoundUrlRef.current) {
              posSoundUrlRef.current = data.posSoundUrl;
              if (alarmAudioRef.current) {
                alarmAudioRef.current.pause();
                alarmAudioRef.current = null;
              }
            }
          }
          setIsAddonCheckDone(true);
        }, (err) => {
          console.error('Error listening to hotel doc in POS KDS:', err);
          setIsAddonCheckDone(true);
        });

      } catch (err) {
        console.error('Failed to init POS KDS listeners:', err);
        setIsLoading(false);
      }
    };

    fetchConfigAndListen();

    return () => {
      if (unsubHeld) unsubHeld();
      if (unsubCompleted) unsubCompleted();
      if (unsubHotelConfig) unsubHotelConfig();
    };
  }, [activeCode]);

  // Check if user is superadmin
  const isSuperadmin = useMemo(() => {
    return (
      user?.role?.toLowerCase() === 'superadmin' ||
      user?.role?.toLowerCase() === 'super admin' ||
      user?.email?.toLowerCase() === 'nexura.management@gmail.com' ||
      user?.email?.toLowerCase() === 'superadmin@setara.co.id'
    );
  }, [user]);

  // Check if Add-on is active in hotel billing modules
  const isAddonActive = useMemo(() => {
    if (isSuperadmin) return true;
    if (!hotelDocData) return false;

    let modules = hotelDocData.billing?.activeModules || hotelDocData.billing?.modules || hotelDocData.activeModules || hotelDocData.modules || [];
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
      user?.permissions?.['food_beverage_realtime'] === true ||
      user?.permissions?.['pos-realtime'] === true;

    const isOwnerOrAdmin =
      user?.role === 'admin' ||
      user?.role === 'administrator' ||
      user?.role === 'owner' ||
      user?.isOwner === true;

    return hasInBilling || (isOwnerOrAdmin && hasUserPerm);
  }, [isSuperadmin, hotelDocData, user]);

  // Check if item is food or bar
  const isItemMatchStation = (item: any, station: StationFilter) => {
    if (station === 'all' || station === 'tables') return true;
    const cat = (item.product?.category || item.category || item.subcategory || '').toLowerCase();
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

    // When locked and no orders, provide preview mock cards behind blur
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

  // Incoming order chime trigger
  useEffect(() => {
    if (isLoading) return;

    if (isInitialLoadRef.current) {
      prevOrdersIdsRef.current = visibleHeldOrders.map(o => o.id);
      isInitialLoadRef.current = false;
      return;
    }

    const currentIds = visibleHeldOrders.map(o => o.id);
    const newOrders = visibleHeldOrders.filter(o => o.id && !prevOrdersIdsRef.current.includes(o.id));
    prevOrdersIdsRef.current = currentIds;

    if (newOrders.length > 0 && isAddonActive) {
      if (!isAudioMuted) {
        const audio = getAudioInstance();
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(e => console.log('Audio playback block:', e));
        }
      }

      newOrders.forEach(o => {
        toast.info(`🔔 Pesanan Baru: ${o.tableNumber || 'Meja'} · ${o.customerName || 'Tamu'}`);
      });
    }
  }, [visibleHeldOrders, isLoading, isAudioMuted, getAudioInstance, isAddonActive]);

  // Helper to format currency
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  // Helper to normalize table names
  const normalizeTable = (val: any): string => {
    if (!val) return '';
    const str = String(val).toLowerCase().trim();
    return str.replace(/^(meja|table)\s*/g, '').replace(/[^a-z0-9]/g, '');
  };

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

    toast.success(`KOT ${order.tableNumber || 'Meja'} Selesai Disajikan`);
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

    toast.info(`KOT dikembalikan ke antrean`);
  };

  // Helper to calculate elapsed time
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

  // Mapped tables for the "Floor Matrix (Meja)" overview mode
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
        {/* ── Top Hospitality Operations Control Bar ── */}
        <header className={ds.kdsHeader}>
          {/* Left: Brand & Outlet Identity */}
          <div className={ds.kdsBrandSection}>
            <button 
              onClick={() => router.push('/lexupos')}
              className={ds.kdsBackBtn}
              title="Kembali ke POS Kasir"
            >
              <ArrowLeft size={16} />
            </button>

            {/* Official My Tara Logo */}
            <button
              onClick={() => router.push('/dashboard')}
              className={ds.kdsLogoBtn}
              title="Dashboard Utama"
            >
              <img
                src="/channels/6.png"
                alt="My Tara Logo"
                className={ds.kdsLogoImg}
              />
            </button>

            <div className={ds.kdsDivider} />

            {/* Hotel / Outlet Live Tag */}
            <div className={ds.kdsHotelTag}>
              <div className={ds.kdsLiveDot}>
                <span className={ds.kdsLiveDotPing} />
                <span className={ds.kdsLiveDotCore} />
              </div>
              <div className={ds.kdsHotelTextGroup}>
                <span className={ds.kdsHotelName}>
                  {hotelName || 'Restoran'}
                </span>
                <span className={ds.kdsHotelSubtitle}>
                  Live View Order
                </span>
              </div>
            </div>

            {/* Master Clock */}
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
          </div>

          {/* Right: Recall Drawer & Controls */}
          <div className={ds.kdsControlGroup}>
            <button
              onClick={() => setIsRecallOpen(true)}
              className={`${ds.kdsControlBtn} ${ds.kdsControlBtnMuted}`}
              title="Riwayat pesanan yang sudah disajikan"
            >
              <History size={14} />
              <span>Recall ({bumpedOrders.length})</span>
            </button>

            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
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
        </div>

        {/* ── Main Canvas Grid View ── */}
        <main className={ds.kdsCanvas}>
          {isLoading ? (
            <div className={ds.kdsEmptyBox}>
              <RefreshCw size={32} className="animate-spin text-stone-400" />
              <span className={ds.kdsEmptyTitle}>Menghubungkan ke POS Live View Order...</span>
            </div>
          ) : stationFilter === 'tables' ? (
            /* ── Floor Matrix (Meja) Mode ── */
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
                        <span>{(table.activeOrder.cart || table.activeOrder.items || []).length} Menu</span>
                        <span className={ds.kdsTableCardTotal}>
                          {formatIDR(table.activeOrder.payableAmount ?? table.activeOrder.subtotal ?? table.activeOrder.totalAmount ?? 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className={ds.kdsTableCardEmptyMsg}>Tidak ada pesanan aktif</span>
                  )}
                </div>
              ))}
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
                            {order.tableNumber ? String(order.tableNumber).toUpperCase() : `KOT #${orderIdx + 1}`}
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
                      <div key={bo.id || idx} className={ds.kdsRecallCard}>
                        <div className={ds.kdsRecallHead}>
                          <div>
                            <span className={ds.kdsRecallTable}>{bo.tableNumber || 'Meja'}</span>
                            <span className={ds.kdsRecallGuest}>({bo.customerName || 'Tamu'})</span>
                          </div>
                          <button
                            onClick={() => restoreTicket(bo.id)}
                            className={ds.kdsRecallRestore}
                          >
                            <RefreshCw size={10} />
                            <span>Kembalikan</span>
                          </button>
                        </div>
                        <div className={ds.kdsRecallMeta}>
                          {(bo.cart || bo.items || []).length} Menu · Selesai: {bo.bumpedAt ? new Date(bo.bumpedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Modal Detail Tagihan & KOT ── */}
        <AnimatePresence>
          {selectedOrder && (
            <div className={ds.kdsModalOverlay}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={ds.kdsModal}
              >
                <div className={ds.kdsModalHead}>
                  <span className={ds.kdsModalSubtitle}>Rincian Pesanan Meja</span>
                  <h3 className={ds.kdsModalTitle}>
                    {selectedOrder.tableNumber ? String(selectedOrder.tableNumber).toUpperCase() : 'MEJA'} · {selectedOrder.customerName || 'Tamu'}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className={ds.kdsModalClose}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className={ds.kdsModalInfoGrid}>
                  <div>
                    <span className={ds.kdsModalInfoLabel}>Waktu Masuk</span>
                    <span className={ds.kdsModalInfoValue}>
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleTimeString('id-ID') : '-'}
                    </span>
                  </div>
                  <div>
                    <span className={ds.kdsModalInfoLabel}>Status Pembayaran</span>
                    <span className={`${ds.kdsModalInfoValue} ${selectedOrder.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedOrder.status || 'BELUM BAYAR'}
                    </span>
                  </div>
                  <div>
                    <span className={ds.kdsModalInfoLabel}>Tipe Layanan</span>
                    <span className={ds.kdsModalInfoValue}>
                      {selectedOrder.orderType || selectedOrder.source || 'Dine In'}
                    </span>
                  </div>
                  <div>
                    <span className={ds.kdsModalInfoLabel}>Total Tagihan</span>
                    <span className={ds.kdsModalInfoEmerald}>
                      {formatIDR(selectedOrder.payableAmount ?? selectedOrder.subtotal ?? selectedOrder.totalAmount ?? 0)}
                    </span>
                  </div>
                </div>

                <div className={ds.kdsModalItemsList}>
                  {(() => {
                    const items = selectedOrder.cart || selectedOrder.items || selectedOrder.products || [];
                    return items.map((it: any, idx: number) => {
                      const name = it.product?.productstock?.name || it.product?.name || it.name || 'Menu';
                      const qty = it.quantity ?? it.qty ?? it.count ?? 1;
                      const price = it.product?.price || it.price || 0;
                      const note = (it.note || it.notes || it.cookingNote || it.instruction || '').trim();
                      const rawAddons: any[] = Array.isArray(it.selectedAddons) ? it.selectedAddons : (Array.isArray(it.addons) ? it.addons : []);
                      const addons: string[] = rawAddons.map((a: any) => (typeof a === 'string' ? a : (a.name || a.addonName || ''))).filter(Boolean);

                      const variants: string[] = [
                        it.variant || it.variantName,
                        it.size ? `Size: ${it.size}` : null,
                        it.sugarLevel ? `Gula: ${it.sugarLevel}` : null,
                        it.iceLevel ? `Es: ${it.iceLevel}` : null,
                        it.spiceLevel ? `Pedas: ${it.spiceLevel}` : (it.level ? `Level: ${it.level}` : null),
                        it.doneness ? `Kematangan: ${it.doneness}` : null,
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

      {/* ── Locked Add-on Modal Overlay (Mounted to Body via Portal) ── */}
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
              POS Real-time (Live View Order &amp; KDS)
            </h2>

            <p className={ds.kdsLockedDescCompact}>
              Fitur <strong>Kitchen Display System (KDS)</strong> belum aktif untuk properti <strong>{hotelName || 'Restoran Anda'}</strong>. Modul ini adalah Add-on opsional untuk kecepatan dan presisi operasional dapur &amp; bar.
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
                  <span className={ds.kdsLockedFeatureTitleCompact}>Modifiers &amp; Catatan</span>
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
                onClick={() => router.push('/lexupos')}
                className={ds.kdsLockedSecondaryBtnCompact}
              >
                <ArrowLeft size={14} />
                <span>Kembali</span>
              </button>
              
              <a
                href={`https://wa.me/628888396598?text=${encodeURIComponent(`Halo Sales Setara, saya tertarik untuk mengaktifkan Add-on POS Real-time (Kitchen Display System / KDS) untuk ${hotelName || 'restoran/outlet kami'}. Mohon informasi aktivasinya.`)}`}
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
