'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { onSnapshot, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { 
  Coffee, Users, CheckCircle, X, 
  ShoppingBag, Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ds from './fnb-realtime.module.css';

interface FoodBeverageRealtimeTabProps {
  hotelCode?: string;
}

export default function FoodBeverageRealtimeTab({ hotelCode }: FoodBeverageRealtimeTabProps) {
  const [activeCode, setActiveCode] = useState<string>('');
  const [tablesList, setTablesList] = useState<string[]>([]);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeFeedTab, setActiveFeedTab] = useState<'pending' | 'completed'>('pending');
  const [newOrderAlert, setNewOrderAlert] = useState<boolean>(false);
  const [audioAlert, setAudioAlert] = useState<HTMLAudioElement | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(true);

  const prevHeldOrdersIdsRef = React.useRef<string[]>([]);
  const isInitialLoadRef = React.useRef(true);
  const alarmAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const getAudioInstance = useCallback(() => {
    if (!alarmAudioRef.current && typeof window !== 'undefined') {
      alarmAudioRef.current = new Audio('/sounds/notification.mp3');
      alarmAudioRef.current.volume = 1.0;
      alarmAudioRef.current.loop = true;
    }
    return alarmAudioRef.current;
  }, []);

  // Get active hotel code on mount
  useEffect(() => {
    if (hotelCode) {
      setActiveCode(hotelCode);
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
      setActiveCode(stored);
    }
  }, [hotelCode]);

  // Setup audio helper for notification sound is now handled inline per-order
  useEffect(() => {
    // Just warmup/preload the audio file so it's cached
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.load();
    }
  }, []);

  // Listen to Firestore for Tables and Held Orders + Completed Orders
  useEffect(() => {
    if (!activeCode) return;

    let unsubHeld: any;
    let unsubCompleted: any;

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

        // 2. Listen to active held orders (meja on)
        const heldCollection = getHotelCollection(db, 'pos_held_orders', activeCode);
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
            return { id: doc.id, ...data, createdAt };
          });
          
          setHeldOrders(orders);
          setIsLoading(false);
        }, (err) => {
          console.error('Firestore held orders listener error:', err);
          setIsLoading(false);
        });

        // 3. Listen to completed orders for the digital feed
        const completedCollection = getHotelCollection(db, 'pos_orders', activeCode);
        const completedQuery = query(completedCollection, orderBy('timestamp', 'desc'), limit(50));
        unsubCompleted = onSnapshot(completedQuery, (snap) => {
          const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
          const orders = snap.docs.map(doc => {
            const data = doc.data();
            let createdAt = new Date().toISOString();
            if (data.timestamp) {
              createdAt = typeof data.timestamp.toDate === 'function'
                ? data.timestamp.toDate().toISOString()
                : new Date(data.timestamp).toISOString();
            }
            return { id: doc.id, ...data, createdAt };
          }).filter(o => {
            if (!o.createdAt) return false;
            return new Date(o.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === todayStr;
          });
          setCompletedOrders(prev => {
            const hasNewOrder = orders.some(o => o.id && !prev.some(p => p.id === o.id));
            if (prev.length > 0 && hasNewOrder) {
              setNewOrderAlert(true);
              if (audioAlert) {
                audioAlert.play().catch(e => console.log('Audio playback block:', e));
              }
              setTimeout(() => setNewOrderAlert(false), 5000);
            }
            return orders;
          });
        }, (err) => {
          console.error('Firestore completed orders listener error:', err);
        });

      } catch (err) {
        console.error('Failed to init real-time listen:', err);
        setIsLoading(false);
      }
    };

    fetchConfigAndListen();

    return () => {
      if (unsubHeld) unsubHeld();
      if (unsubCompleted) unsubCompleted();
    };
  }, [activeCode, audioAlert]);

  // Helper to format currency
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Helper to normalize table names for comparison
  const normalizeTable = (val: any): string => {
    if (!val) return '';
    const str = String(val).toLowerCase().trim();
    return str.replace(/^(meja|table)\s*/g, '').replace(/[^a-z0-9]/g, '');
  };

  // Match registered tables with active held orders
  const mappedTables = React.useMemo(() => {
    const matches = tablesList.map(name => {
      const activeOrder = heldOrders.find(
        o => normalizeTable(o.tableNumber) === normalizeTable(name)
      );
      return {
        name,
        activeOrder,
        isOccupied: !!activeOrder,
        isExtra: false
      };
    });

    const extras = heldOrders
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
  }, [tablesList, heldOrders]);

  const handleTableClick = (table: any) => {
    setSelectedTable(table.name);
    setSelectedOrder(table.activeOrder || null);
  };

  // Safe and clean side-effect trigger for new orders
  useEffect(() => {
    if (isLoading) return;

    if (isInitialLoadRef.current) {
      prevHeldOrdersIdsRef.current = heldOrders.map(o => o.id);
      isInitialLoadRef.current = false;
      return;
    }

    const newOrders = heldOrders.filter(o => o.id && !prevHeldOrdersIdsRef.current.includes(o.id));
    prevHeldOrdersIdsRef.current = heldOrders.map(o => o.id);

    newOrders.forEach(data => {
      let isFresh = true;
      if (data.createdAt) {
        const createdTime = new Date(data.createdAt).getTime();
        if (Date.now() - createdTime > 30000) {
          isFresh = false;
        }
      }

      if (isFresh) {
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 5000);

        const audio = getAudioInstance();
        if (audio) {
          audio.volume = 1.0;
          audio.loop = true;
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              setIsAudioUnlocked(false);
              console.log('Audio playback blocked or failed:', e);
              toast.warning(`Gagal memutar alarm suara. Klik layar ini untuk mengizinkan!`, {
                duration: 8000,
                position: 'top-center',
                onClick: () => {
                  audio.play().catch(err => console.error('Still failed:', err));
                }
              });
            });
          }

          // Persistent toast
          toast.success(`🔔 Pesanan Baru: ${data.customerName || 'Tamu'} (Meja ${data.tableNumber || '-'})`, {
            duration: Infinity,
            position: 'top-right',
            action: {
              label: 'Matikan Alarm',
              onClick: () => {
                audio.pause();
                audio.currentTime = 0;
              }
            },
            onDismiss: () => {
              audio.pause();
              audio.currentTime = 0;
            }
          });
        }
      }
    });
  }, [heldOrders, isLoading]);

  const unlockAudioContext = useCallback(() => {
    try {
      const audio = getAudioInstance();
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
          setIsAudioUnlocked(true);
        }).catch((e) => {
          console.error("Audio unlock failed:", e);
          setIsAudioUnlocked(true);
        });
      } else {
        setIsAudioUnlocked(true);
      }
    } catch (e) {
      setIsAudioUnlocked(true);
    }
  }, [getAudioInstance]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudioContext();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [unlockAudioContext]);

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', position: 'relative' }}
    >

      {/* ── Alert Bar ── */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={ds.rtAlertBar}
          >
            <span className={ds.rtAlertDot} />
            <span className={ds.rtAlertText}>🔔 Pesanan POS Baru Diterima Real-Time!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Two-Column Layout ── */}
      <div className={ds.rtGrid}>

        {/* LEFT: Denah Meja */}
        <div className={ds.rtPanel}>
          <div className={ds.rtPanelHeader}>
            <div className={ds.rtPanelTitleGroup}>
              <div className={ds.rtLiveDot}>
                <div className={ds.rtLiveDotInner}>
                  <span className={ds.rtLiveDotPing} />
                  <span className={ds.rtLiveDotCore} />
                </div>
                <span className={ds.rtLiveLabel}>Real-time Layout</span>
              </div>
              <h2 className={ds.rtPanelTitle}>Status Denah Meja Aktif</h2>
            </div>

            <div className={ds.rtLegend}>
              <div className={`${ds.rtLegendBadge} ${ds.rtLegendBadgeOccupied}`}>
                <span className={`${ds.rtLegendDot} ${ds.rtLegendDotOccupied}`} />
                Terisi ({heldOrders.length})
              </div>
              <div className={`${ds.rtLegendBadge} ${ds.rtLegendBadgeEmpty}`}>
                <span className={`${ds.rtLegendDot} ${ds.rtLegendDotEmpty}`} />
                Kosong ({Math.max(0, tablesList.length - heldOrders.filter(o => tablesList.some(t => normalizeTable(t) === normalizeTable(o.tableNumber))).length)})
              </div>
            </div>
          </div>

          {/* Table Grid Body */}
          {isLoading ? (
            <div className={ds.rtLoadingState}>
              <RefreshCw size={24} color="#a8a29e" style={{ animation: 'spin 1s linear infinite' }} />
              <span className={ds.rtLoadingText}>Menghubungkan ke POS Database...</span>
            </div>
          ) : mappedTables.length === 0 ? (
            <div className={ds.rtEmptyState}>
              <AlertCircle size={24} color="#d4d4d4" />
              <span className={ds.rtEmptyText}>Belum ada konfigurasi meja restoran</span>
            </div>
          ) : (
            <div className={ds.rtTableGrid}>
              {mappedTables.map((table, i) => (
                <button
                  key={i}
                  onClick={() => handleTableClick(table)}
                  className={`${ds.rtTableCard} ${table.isOccupied ? ds.rtTableCardOccupied : ds.rtTableCardEmpty}`}
                >
                  <div className={ds.rtTableCardTop}>
                    <span className={`${ds.rtTableName} ${table.isOccupied ? ds.rtTableNameOccupied : ds.rtTableNameEmpty}`}>
                      {table.name}
                    </span>
                    <span className={`${ds.rtStatusDot} ${table.isOccupied ? ds.rtStatusDotOccupied : ds.rtStatusDotEmpty}`} />
                  </div>

                  {table.isOccupied ? (
                    <div className={ds.rtTableCardBody}>
                      <span className={ds.rtTableGuest}>
                        <Users size={9} />
                        <span className={ds.rtTableGuestName}>{table.activeOrder.customerName || 'Guest'}</span>
                      </span>
                      <div className={ds.rtTableBottom}>
                        <span className={ds.rtTableAmount}>
                          {formatIDR(table.activeOrder.payableAmount ?? table.activeOrder.subtotal ?? 0)}
                        </span>
                        <div className="flex items-center gap-1">
                          {table.activeOrder.payableAmount === 0 || table.activeOrder.paymentMethod === 'compliment' || table.activeOrder.discountPercent === 100 ? (
                            <span className="text-[8px] bg-purple-600 text-white font-extrabold px-1 py-0.5 rounded-[4px] tracking-wide leading-none">
                              COMP
                            </span>
                          ) : (table.activeOrder.discount > 0 || table.activeOrder.discountPercent > 0) ? (
                            <span className="text-[8px] bg-red-600 text-white font-extrabold px-1 py-0.5 rounded-[4px] tracking-wide leading-none">
                              DISC
                            </span>
                          ) : null}
                          {table.activeOrder.isPaidDirectly ? (
                            <span className={`${ds.rtBadge} ${ds.rtBadgePaid}`}>PAID</span>
                          ) : (
                            <span className={`${ds.rtBadge} ${ds.rtBadgeUnpaid}`}>UNPAID</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className={ds.rtTableEmpty}>Kosong</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Live Order Feed */}
        <div className={ds.rtPanel}>
          <div className={ds.rtPanelHeader}>
            <div className={ds.rtPanelTitleGroup}>
              <span className={ds.rtFeedSubtitle}>Digital Order Stream</span>
              <h2 className={ds.rtFeedTitle}>Pesanan Masuk Real-Time</h2>
            </div>
          </div>

          {/* Sub-tab Switcher */}
          <div className={ds.rtFeedTabs}>
            <button
              onClick={() => setActiveFeedTab('pending')}
              className={`${ds.rtFeedTab} ${activeFeedTab === 'pending' ? ds.rtFeedTabActive : ''}`}
            >
              Active/Held ({heldOrders.length})
            </button>
            <button
              onClick={() => setActiveFeedTab('completed')}
              className={`${ds.rtFeedTab} ${activeFeedTab === 'completed' ? ds.rtFeedTabActive : ''}`}
            >
              Completed ({completedOrders.length})
            </button>
          </div>

          {/* Feed Container */}
          <div className={ds.rtFeedContainer}>
            {activeFeedTab === 'pending' ? (
              heldOrders.length === 0 ? (
                <div className={ds.rtFeedEmpty}>
                  <ShoppingBag size={18} color="#d4d4d4" />
                  <span className={ds.rtFeedEmptyText}>Belum ada pesanan aktif</span>
                </div>
              ) : (
                heldOrders.map((order, i) => (
                  <div
                    key={order.id || i}
                    onClick={() => {
                      setSelectedTable(order.tableNumber || 'Meja');
                      setSelectedOrder(order);
                    }}
                    className={ds.rtFeedCard}
                  >
                    <div className={ds.rtFeedCardRow}>
                      <div className={ds.rtFeedCardInfo}>
                        <span className={ds.rtFeedCardTableName}>{order.tableNumber || 'Dine-In'}</span>
                        <span className={ds.rtFeedCardGuest}>{order.customerName || 'Guest'}</span>
                      </div>
                      <span className={ds.rtFeedCardAmount}>
                        {formatIDR(order.payableAmount ?? order.subtotal ?? 0)}
                      </span>
                    </div>
                    <div className={ds.rtFeedCardFooter}>
                      <span className={ds.rtFeedCardTime}>
                        <Clock size={9} />
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {order.payableAmount === 0 || order.paymentMethod === 'compliment' || order.discountPercent === 100 ? (
                          <span className="text-[8px] bg-purple-600 text-white font-extrabold px-1.5 py-0.5 rounded-[4px] tracking-wide leading-none">
                            COMPLIMENT
                          </span>
                        ) : (order.discount > 0 || order.discountPercent > 0) ? (
                          <span className="text-[8px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded-[4px] tracking-wide leading-none">
                            DISKON
                          </span>
                        ) : null}
                        <span className={ds.rtFeedBadgeHeld}>Active Held</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              completedOrders.length === 0 ? (
                <div className={ds.rtFeedEmpty}>
                  <CheckCircle size={18} color="#d4d4d4" />
                  <span className={ds.rtFeedEmptyText}>Belum ada pesanan lunas</span>
                </div>
              ) : (
                completedOrders.map((order, i) => (
                  <div
                    key={order.id || i}
                    onClick={() => {
                      setSelectedTable(order.tableNumber ? `Meja ${order.tableNumber.replace(/^(meja|table)\s*/i, '')}` : `Transaksi #${order.id?.slice(-8) || i}`);
                      setSelectedOrder(order);
                    }}
                    className={`${ds.rtFeedCard} ${ds.rtFeedCardCompleted}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={ds.rtFeedCardRow}>
                      <div className={ds.rtFeedCardInfo}>
                        <span className={ds.rtFeedCardTableName}>Trx #{order.id?.slice(-8) || i}</span>
                        <span className={ds.rtFeedCardGuest}>
                          Meja: {order.tableNumber || '-'} · {order.customerName || 'Guest'}
                        </span>
                      </div>
                      <span className={ds.rtFeedCardAmount}>
                        {formatIDR(order.totalAmount ?? order.payableAmount ?? 0)}
                      </span>
                    </div>
                    <div className={ds.rtFeedCardFooter}>
                      <span className={ds.rtFeedCardTime}>
                        <Clock size={9} />
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {order.totalAmount === 0 || order.payableAmount === 0 || order.paymentMethod === 'compliment' || order.discountPercent === 100 ? (
                          <span className="text-[8px] bg-purple-600 text-white font-extrabold px-1.5 py-0.5 rounded-[4px] tracking-wide leading-none">
                            COMPLIMENT
                          </span>
                        ) : (order.discount > 0 || order.discountPercent > 0) ? (
                          <span className="text-[8px] bg-red-650 text-white font-extrabold px-1.5 py-0.5 rounded-[4px] tracking-wide leading-none">
                            DISKON
                          </span>
                        ) : null}
                        <span className={ds.rtFeedBadgePaid}>Paid ({order.paymentMethod || 'Cash'})</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedTable && (
          <div className={ds.rtModalOverlay}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={ds.rtModalBackdrop}
              onClick={() => setSelectedTable(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as any }}
              className={ds.rtModalCard}
            >
              <button onClick={() => setSelectedTable(null)} className={ds.rtModalCloseBtn}>
                <X size={16} />
              </button>

              <div className={ds.rtModalHeader}>
                <span className={ds.rtModalSubtitle}>Detail Sesi Meja</span>
                <h2 className={ds.rtModalTitle}>
                  <Coffee size={18} color={selectedOrder ? '#059669' : '#a8a29e'} />
                  {selectedTable}
                </h2>
              </div>

              {selectedOrder ? (
                <div className={ds.rtModalBody}>
                  {/* Guest Info */}
                  <div className={ds.rtModalInfoBox}>
                    <div className={ds.rtModalInfoRow}>
                      <span className={ds.rtModalInfoLabel}>Nama Tamu</span>
                      <span className={ds.rtModalInfoValue}>{selectedOrder.customerName || 'Guest'}</span>
                    </div>
                    {selectedOrder.notes && (
                      <div className={ds.rtModalNotesRow}>
                        <span className={ds.rtModalInfoLabel}>Catatan Khusus</span>
                        <span className={ds.rtModalNotesText}>{selectedOrder.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Item List */}
                  <span className={ds.rtItemsLabel}>Daftar Item Menu</span>
                  <div className={ds.rtItemsList}>
                    {(() => {
                      const itemsList = selectedOrder.cart || selectedOrder.items || selectedOrder.products || [];
                      if (itemsList.length === 0) {
                        return <span className={ds.rtModalEmptyText} style={{ padding: '8px 0', fontSize: '13px' }}>Tidak ada item terdaftar</span>;
                      }
                      return itemsList.map((item: any, idx: number) => {
                        const name = item.product?.productstock?.name || item.product?.name || item.name || 'Menu Item';
                        const quantity = item.quantity ?? item.qty ?? item.count ?? 0;
                        const price = item.product?.sellprice ?? item.product?.price ?? item.price ?? 0;
                        return (
                          <div key={idx} className={ds.rtItemRow}>
                            <div className={ds.rtItemInfo}>
                              <span className={ds.rtItemName}>{name}</span>
                              <span className={ds.rtItemMeta}>
                                {quantity} × {formatIDR(price)}
                              </span>
                            </div>
                            <span className={ds.rtItemTotal}>
                              {formatIDR(price * quantity)}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Totals */}
                  <div className={ds.rtTotalsSection}>
                    <div className={ds.rtTotalRow}>
                      <span className={ds.rtTotalLabel}>Subtotal</span>
                      <span className={ds.rtTotalValue}>
                        {formatIDR(selectedOrder.subtotal ?? selectedOrder.totalAmount ?? selectedOrder.payableAmount ?? 0)}
                      </span>
                    </div>
                    {((selectedOrder.tax || 0) + (selectedOrder.serviceCharge || 0)) > 0 && (
                      <div className={ds.rtTotalRow}>
                        <span className={ds.rtTotalLabel}>Pajak &amp; Layanan</span>
                        <span className={ds.rtTotalValue}>
                          {formatIDR((selectedOrder.tax || 0) + (selectedOrder.serviceCharge || 0))}
                        </span>
                      </div>
                    )}
                    {(selectedOrder.discount > 0 || selectedOrder.discountPercent > 0) && (
                      <div className={ds.rtTotalRow}>
                        <span className={`${ds.rtTotalLabel} ${ds.rtTotalDiscount}`}>
                          Potongan Diskon {selectedOrder.discountPercent > 0 ? `(${selectedOrder.discountPercent}%)` : ''}
                        </span>
                        <span className={`${ds.rtTotalValue} ${ds.rtTotalDiscount}`}>-{formatIDR(selectedOrder.discount ?? 0)}</span>
                      </div>
                    )}
                    <div className={ds.rtGrandTotalRow}>
                      <span className={ds.rtGrandTotalLabel}>Total Tagihan</span>
                      <span className={ds.rtGrandTotalValue}>
                        {formatIDR(selectedOrder.payableAmount ?? selectedOrder.totalAmount ?? selectedOrder.subtotal ?? 0)}
                      </span>
                    </div>
                  </div>

                  {/* Status Footer */}
                  <div className={`${ds.rtStatusFooter} ${selectedOrder.isPaidDirectly || selectedOrder.paymentStatus === 'Lunas' ? ds.rtStatusFooterPaid : ds.rtStatusFooterUnpaid}`}>
                    Status: {selectedOrder.isPaidDirectly || selectedOrder.paymentStatus === 'Lunas' ? 'Sudah Dibayar (Lunas)' : 'Belum Dibayar (Pending)'}
                  </div>
                </div>
              ) : (
                <div className={ds.rtModalEmptyWrap}>
                  <div className={ds.rtModalEmptyBox}>
                    <span className={ds.rtModalEmptyText}>Tidak ada pesanan aktif di meja ini.</span>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className={ds.rtModalCloseAction}>
                    Tutup Detail
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
