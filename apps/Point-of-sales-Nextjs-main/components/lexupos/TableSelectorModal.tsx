'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Check, Utensils, Users, Plus, Trash2, Settings2, 
  RefreshCw, AlertCircle, ArrowRight, Clock, Receipt, Split, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, onSnapshot, query, limit } from 'firebase/firestore';
import { localDb } from '@/lib/dexie';
import { toast } from 'react-toastify';
import styles from './TableSelectorModal.module.css';

export interface TableItem {
  id: string;
  name: string;
  capacity: number;
  area: 'indoor' | 'outdoor' | 'vip' | 'bar';
}

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string;
  onSelectTable: (tableName: string) => void;
  onRestoreOrder?: (order: any) => void;
  initialSetupMode?: boolean;
}

export default function TableSelectorModal({
  isOpen,
  onClose,
  selectedTable,
  onSelectTable,
  onRestoreOrder,
  initialSetupMode = false
}: TableSelectorModalProps) {
  const [activeArea, setActiveArea] = useState<'all' | 'indoor' | 'outdoor' | 'vip' | 'bar'>('all');
  const [isSetupMode, setIsSetupMode] = useState<boolean>(initialSetupMode);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hotelCode, setHotelCode] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setIsSetupMode(initialSetupMode);
    }
  }, [isOpen, initialSetupMode]);

  // Setup form states
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableArea, setNewTableArea] = useState<'indoor' | 'outdoor' | 'vip' | 'bar'>('indoor');
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  // Selected table action popup
  const [activeTableAction, setActiveTableAction] = useState<{
    table: TableItem;
    order: any;
  } | null>(null);

  // 1. Get Hotel Code
  useEffect(() => {
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
            const userObj = JSON.parse(userJson);
            code = userObj.hotelCode;
          } catch (e) {}
        }
      }
      if (!code) {
        code = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
      }
      setHotelCode(code || '');
    }
  }, []);

  // 2. Fetch configured tables & listen to live held orders
  useEffect(() => {
    if (!isOpen) return;

    let unsub: any;
    const loadTablesAndOrders = async () => {
      setIsLoading(true);

      // Default fallback tables
      const defaultTables: TableItem[] = [
        { id: 'T01', name: 'Meja 01', capacity: 2, area: 'indoor' },
        { id: 'T02', name: 'Meja 02', capacity: 2, area: 'indoor' },
        { id: 'T03', name: 'Meja 03', capacity: 4, area: 'indoor' },
        { id: 'T04', name: 'Meja 04', capacity: 4, area: 'indoor' },
        { id: 'T05', name: 'Meja 05', capacity: 4, area: 'indoor' },
        { id: 'T06', name: 'Meja 06', capacity: 6, area: 'indoor' },
        { id: 'T07', name: 'Meja 07', capacity: 6, area: 'indoor' },
        { id: 'T08', name: 'Meja 08', capacity: 4, area: 'indoor' },
        { id: 'T11', name: 'Meja 11', capacity: 4, area: 'outdoor' },
        { id: 'T12', name: 'Meja 12', capacity: 4, area: 'outdoor' },
        { id: 'T13', name: 'Meja 13', capacity: 6, area: 'outdoor' },
        { id: 'V01', name: 'VIP 01 (Anggrek)', capacity: 10, area: 'vip' },
        { id: 'V02', name: 'VIP 02 (Cendana)', capacity: 12, area: 'vip' },
      ];

      try {
        if (hotelCode && hotelCode !== '0') {
          // Fetch settings/pos
          const posRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
          const posSnap = await getDoc(posRef);
          
          if (posSnap.exists()) {
            const data = posSnap.data();
            if (data.tablesDetailed && Array.isArray(data.tablesDetailed) && data.tablesDetailed.length > 0) {
              setTables(data.tablesDetailed);
            } else if (data.tables) {
              const raw = String(data.tables).trim();
              if (/^\d+$/.test(raw)) {
                const count = parseInt(raw);
                const generated: TableItem[] = [];
                for (let i = 1; i <= count; i++) {
                  generated.push({
                    id: `T${i.toString().padStart(2, '0')}`,
                    name: `Meja ${i}`,
                    capacity: 4,
                    area: i > 8 ? 'outdoor' : 'indoor'
                  });
                }
                setTables(generated);
              } else {
                const names = raw.split(',').map(s => s.trim()).filter(Boolean);
                setTables(names.map((name, idx) => ({
                  id: `T${(idx + 1).toString().padStart(2, '0')}`,
                  name,
                  capacity: 4,
                  area: name.toLowerCase().includes('vip') ? 'vip' : name.toLowerCase().includes('out') ? 'outdoor' : 'indoor'
                })));
              }
            } else {
              setTables(defaultTables);
            }
          } else {
            setTables(defaultTables);
          }

          // Listen to live held orders with safe limit
          const ordersRef = query(collection(db, 'hotels', hotelCode, 'pos_held_orders'), limit(50));
          unsub = onSnapshot(ordersRef, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setHeldOrders(list);
            setIsLoading(false);
          }, () => {
            setIsLoading(false);
          });
        } else {
          // Offline localDb held orders fallback
          const localList = await localDb.heldOrders.toArray();
          setHeldOrders(localList);
          setTables(defaultTables);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading tables:', err);
        setTables(defaultTables);
        setIsLoading(false);
      }
    };

    loadTablesAndOrders();

    return () => {
      if (unsub) unsub();
    };
  }, [isOpen, hotelCode]);

  if (!isOpen) return null;

  // Normalize table helper
  const normalize = (val: any) => {
    if (!val) return '';
    return String(val).toLowerCase().replace(/^(meja|table)\s*/g, '').replace(/[^a-z0-9]/g, '');
  };

  const getTableOrder = (tableName: string) => {
    const target = normalize(tableName);
    return heldOrders.find(o => normalize(o.tableNumber) === target);
  };

  const getTableStatus = (tableName: string): 'available' | 'occupied' | 'billed' | 'split_active' => {
    const order = getTableOrder(tableName);
    if (!order) return 'available';
    if (order.isSplitActive || order.splitStatus === 'PARTIALLY_PAID') return 'split_active';
    if (order.isBilled || order.status === 'BILLED') return 'billed';
    return 'occupied';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  const filteredTables = activeArea === 'all'
    ? tables
    : tables.filter(t => t.area === activeArea);

  // Setup Actions
  const handleAddTable = async () => {
    if (!newTableName.trim()) {
      toast.error('Nama meja tidak boleh kosong!');
      return;
    }
    const cleanName = newTableName.trim();
    if (tables.some(t => t.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.error('Nama meja sudah digunakan!');
      return;
    }

    const newTable: TableItem = {
      id: `T-${Date.now().toString(36).toUpperCase()}`,
      name: cleanName,
      capacity: Number(newTableCapacity) || 4,
      area: newTableArea
    };

    const updated = [...tables, newTable];
    setTables(updated);
    setNewTableName('');
    await saveTablesToConfig(updated);
    toast.success(`Meja "${cleanName}" berhasil ditambahkan.`);
  };

  const handleDeleteTable = async (tableId: string, name: string) => {
    const order = getTableOrder(name);
    if (order) {
      toast.error(`Tidak dapat menghapus "${name}" karena masih ada pesanan aktif!`);
      return;
    }
    const updated = tables.filter(t => t.id !== tableId);
    setTables(updated);
    await saveTablesToConfig(updated);
    toast.success(`Meja "${name}" berhasil dihapus.`);
  };

  const saveTablesToConfig = async (newTableList: TableItem[]) => {
    if (!hotelCode || hotelCode === '0') return;
    setIsSavingSetup(true);
    try {
      const posRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
      await updateDoc(posRef, {
        tablesDetailed: newTableList,
        tables: newTableList.map(t => t.name).join(', ')
      });
    } catch (err) {
      console.error('Failed to save table config:', err);
    } finally {
      setIsSavingSetup(false);
    }
  };

  const handleTableClick = (t: TableItem) => {
    const status = getTableStatus(t.name);
    const order = getTableOrder(t.name);

    if (status === 'split_active' || status === 'occupied' || status === 'billed') {
      setActiveTableAction({ table: t, order });
    } else {
      onSelectTable(t.name);
      onClose();
    }
  };

  const handleRestoreActiveOrder = (order: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('restored_held_order', JSON.stringify(order));
      window.dispatchEvent(new Event('restore-held-order'));
    }
    if (onRestoreOrder) {
      onRestoreOrder(order);
    }
    toast.info(`Memuat tagihan aktif ${order.tableNumber || ''} ke kasir.`);
    setActiveTableAction(null);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}>
              <Utensils className="w-5 h-5" />
            </div>
            <div className={styles.headerTitleGroup}>
              <div className={styles.titleRow}>
                <h2 className={styles.titleText}>Table Layout & Management</h2>
                {isSetupMode && (
                  <span className={styles.modeBadge}>
                    Mode Konfigurasi Meja
                  </span>
                )}
              </div>
              <p className={styles.subtitleText}>
                {isSetupMode 
                  ? 'Atur daftar meja, kapasitas kursi, dan area restoran' 
                  : 'Pilih meja untuk transaksi baru atau lanjutkan penagihan split bill'}
              </p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button
              type="button"
              onClick={() => setIsSetupMode(!isSetupMode)}
              className={`${styles.setupToggleBtn} ${isSetupMode ? styles.setupToggleBtnActive : ''}`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isSetupMode ? 'Selesai Setup Meja' : 'Mode Setup Meja'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={styles.closeBtn}
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Setup Toolbar Form (When in Setup Mode) */}
        {isSetupMode && (
          <div className={styles.setupToolbar}>
            <div className={styles.setupLabel}>
              <Plus className="w-4 h-4" />
              <span>Tambah Meja:</span>
            </div>

            <div className={styles.setupFieldGroup}>
              <input
                type="text"
                placeholder="Contoh: Meja 15 / VIP 03"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className={styles.textInput}
                autoFocus
              />

              <select
                value={newTableArea}
                onChange={(e) => setNewTableArea(e.target.value as any)}
                className={styles.selectInput}
              >
                <option value="indoor">Indoor Dining</option>
                <option value="outdoor">Outdoor / Garden</option>
                <option value="vip">VIP Room</option>
                <option value="bar">Bar Area</option>
              </select>

              <div className={styles.capacityControl}>
                <span>Kapasitas:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 2)}
                  className={styles.numberInput}
                />
                <span>Kursi</span>
              </div>

              <button
                type="button"
                onClick={handleAddTable}
                disabled={isSavingSetup}
                className={styles.saveTableBtn}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSavingSetup ? 'Menyimpan...' : 'Simpan Meja'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Area Filter Tabs & Color Legend */}
        <div className={styles.navLegendBar}>
          <div className={styles.areaTabs}>
            {[
              { key: 'all', label: 'Semua Area' },
              { key: 'indoor', label: 'Indoor Dining' },
              { key: 'outdoor', label: 'Outdoor / Garden' },
              { key: 'vip', label: 'VIP Rooms' },
              { key: 'bar', label: 'Bar' }
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveArea(key as any);
                  if (key !== 'all') {
                    setNewTableArea(key as any);
                  }
                }}
                className={`${styles.areaTabItem} ${activeArea === key ? styles.areaTabItemActive : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Real-time Status Color Legend */}
          <div className={styles.legendGroup}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotAvailable}`} /> Kosong
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotOccupied}`} /> Terisi
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotBilled}`} /> Minta Bill
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotSplit}`} /> Split Aktif
            </span>
          </div>
        </div>

        {/* Table Grid Content */}
        <div className={styles.gridContainer}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <RefreshCw className="w-6 h-6 animate-spin text-neutral-400 mb-2" />
              <span className={styles.emptyDesc}>Sinkronisasi status Table Layout live...</span>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconBox}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className={styles.emptyTitle}>
                Belum ada meja di {activeArea === 'all' ? 'restoran ini' : activeArea === 'indoor' ? 'Indoor Dining' : activeArea === 'outdoor' ? 'Outdoor / Garden' : activeArea === 'vip' ? 'VIP Rooms' : 'Bar'}
              </h4>
              <p className={styles.emptyDesc}>
                {isSetupMode
                  ? 'Gunakan bilah formulir di atas untuk mendaftarkan meja baru di area ini.'
                  : 'Aktifkan Mode Setup Meja untuk mendaftarkan meja ke area ini.'}
              </p>
              {!isSetupMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSetupMode(true);
                    if (activeArea !== 'all') {
                      setNewTableArea(activeArea);
                    }
                  }}
                  className={styles.emptyAddBtn}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buka Setup Meja Sekarang</span>
                </button>
              )}
            </div>
          ) : (
            <div className={styles.tablesGrid}>
              {filteredTables.map((t) => {
                const isSelected = selectedTable.toLowerCase().trim() === t.name.toLowerCase().trim();
                const status = getTableStatus(t.name);
                const order = getTableOrder(t.name);

                const cardClass = [
                  styles.tableCard,
                  status === 'split_active' ? styles.cardSplit :
                  status === 'billed' ? styles.cardBilled :
                  status === 'occupied' ? styles.cardOccupied :
                  styles.cardAvailable,
                  isSelected ? styles.cardSelected : ''
                ].filter(Boolean).join(' ');

                const badgeClass = [
                  styles.statusBadge,
                  status === 'split_active' ? styles.badgeSplit :
                  status === 'billed' ? styles.badgeBilled :
                  status === 'occupied' ? styles.badgeOccupied :
                  styles.badgeAvailable
                ].filter(Boolean).join(' ');

                return (
                  <div key={t.id} className={cardClass}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardTitle}>{t.name}</span>

                      {status === 'split_active' ? (
                        <span className={badgeClass}>
                          <Split className="w-2.5 h-2.5" />
                          Split Aktif
                        </span>
                      ) : status === 'billed' ? (
                        <span className={badgeClass}>
                          <Receipt className="w-2.5 h-2.5" />
                          Minta Bill
                        </span>
                      ) : status === 'occupied' ? (
                        <span className={badgeClass}>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Terisi
                        </span>
                      ) : (
                        <span className={badgeClass}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Kosong
                        </span>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      {order ? (
                        <>
                          <div className={styles.guestName} title={order.customerName || 'Guest'}>
                            {order.customerName || 'Guest'}
                          </div>
                          <div className={styles.orderAmount}>
                            {formatCurrency(Number(order.payableAmount || order.total || 0))}
                            {order.isSplitActive && (
                              <span className={styles.splitSubtext}>(Sisa Split)</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className={styles.capacityText}>
                          <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>Kapasitas {t.capacity} Kursi</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      {isSetupMode ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteTable(t.id, t.name)}
                          className={styles.deleteTableBtn}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Meja</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTableClick(t)}
                          className={`${styles.cardActionBtn} ${
                            status === 'split_active' ? styles.actionBtnSplit :
                            status === 'occupied' || status === 'billed' ? styles.actionBtnOccupied :
                            styles.actionBtnAvailable
                          }`}
                        >
                          {status === 'split_active' ? (
                            <>
                              <Split className="w-3 h-3" />
                              <span>Bayar Sisa Split</span>
                            </>
                          ) : status === 'occupied' || status === 'billed' ? (
                            <>
                              <Receipt className="w-3 h-3" />
                              <span>Lihat Tagihan</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Pilih Meja</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={() => {
              onSelectTable('Take Away');
              onClose();
            }}
            className={styles.takeAwayBtn}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" />
            <span>Pilih Pesanan Bungkus (Take Away)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={styles.closeModalBtn}
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Quick Action Modal for Occupied / Split Active Table */}
      {activeTableAction && (
        <div className={styles.actionModalOverlay} onClick={() => setActiveTableAction(null)}>
          <div className={styles.actionModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.actionModalHeader}>
              <h3 className={styles.actionModalTitle}>
                <Utensils className="w-4 h-4 text-emerald-600" />
                <span>{activeTableAction.table.name}</span>
              </h3>
              <button
                onClick={() => setActiveTableAction(null)}
                className={styles.closeBtn}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={styles.actionModalBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nama Tamu:</span>
                <span className={styles.infoValue}>
                  {activeTableAction.order?.customerName || 'Guest'}
                </span>
              </div>
              {activeTableAction.order?.isSplitActive && Number(activeTableAction.order?.totalPaid || 0) > 0 ? (
                <>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Total Order Awal:</span>
                    <span className={styles.infoValue}>
                      {formatCurrency(Number(activeTableAction.order?.originalTotal || ((activeTableAction.order?.payableAmount || 0) + Number(activeTableAction.order?.totalPaid || 0))))}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel} style={{ color: '#10b981' }}>Telah Dibayar (Split):</span>
                    <span className={styles.infoValue} style={{ color: '#10b981' }}>
                      -{formatCurrency(Number(activeTableAction.order?.totalPaid || 0))}
                    </span>
                  </div>
                  <div className={styles.infoRow} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '6px', marginTop: '4px' }}>
                    <span className={styles.infoLabel} style={{ fontWeight: 800, color: '#ef4444' }}>Sisa Kurangan:</span>
                    <span className={styles.infoValue} style={{ fontWeight: 800, color: '#ef4444', fontSize: '13px' }}>
                      {formatCurrency(Number(activeTableAction.order?.payableAmount || 0))}
                    </span>
                  </div>
                  <div className={styles.splitAlertBox}>
                    <Split className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeTableAction.order?.splitPaidBreakdown || 'Split bill aktif. Menunggu pembayaran sisa tagihan.'}</span>
                  </div>
                </>
              ) : (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Total Tagihan:</span>
                  <span className={styles.infoValue}>
                    {formatCurrency(Number(activeTableAction.order?.payableAmount || 0))}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleRestoreActiveOrder(activeTableAction.order)}
                className={styles.primaryActionBtn}
              >
                <ArrowRight className="w-4 h-4" />
                <span>
                  {activeTableAction.order?.isSplitActive 
                    ? 'Lanjutkan Bayar Sisa Split' 
                    : 'Buka Tagihan Meja ke Kasir'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTable(activeTableAction.table.name);
                  setActiveTableAction(null);
                  onClose();
                }}
                className={styles.secondaryActionBtn}
              >
                Pilih Meja untuk Pesanan Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
