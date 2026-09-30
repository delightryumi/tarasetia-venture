'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { QrLink, QrType, QrPrintTemplate, QrTabConfig } from './types';
import { QrSvg } from './QrSvg';
import { QrDetailModal } from './QrDetailModal';
import { QrCreateModal } from './QrCreateModal';
import { QrPrintModal } from './QrPrintModal';
import { 
  QrCode, 
  Plus, 
  Printer, 
  Utensils, 
  ShoppingBag, 
  BookOpen, 
  CalendarClock, 
  Globe, 
  Link2, 
  ExternalLink,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { toast } from 'react-toastify';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface QrTableManagerProps {
  hotelCode: string;
  storeName?: string;
  storeLogo?: string;
}

const TAB_CONFIGS: QrTabConfig[] = [
  { key: 'table', label: 'Meja', types: ['table'], description: 'Tamu memindai di meja, lalu pesan langsung dari HP.' },
  { key: 'takeaway', label: 'Takeaway', types: ['takeaway'], description: 'Pesan dari HP, ambil di kasir. Cocok di counter.' },
  { key: 'menu_view', label: 'Lihat menu', types: ['menu_view'], description: 'Hanya menampilkan menu & harga, tanpa pesan.' },
  { key: 'booking', label: 'Reservasi', types: ['booking'], description: 'Pelanggan memilih tanggal, jam & jumlah orang untuk reservasi meja.' },
  { key: 'link', label: 'Website & link', types: ['site', 'receipt_feedback', 'custom'], description: 'Ke halaman tertentu di website bisnis Anda.' }
];

const TYPE_SUBTITLES: Record<string, string> = {
  table: 'Pesan di meja',
  takeaway: 'Pesan takeaway',
  menu_view: 'Lihat menu (tanpa pesan)',
  booking: 'Reservasi meja',
  site: 'Website bisnis',
  receipt_feedback: 'Feedback / e-struk',
  custom: 'Link custom'
};

export function QrTableManager({ hotelCode, storeName = 'Resto Setara', storeLogo }: QrTableManagerProps) {
  const [activeTabKey, setActiveTabKey] = useState<string>('table');
  const [qrLinks, setQrLinks] = useState<QrLink[]>([]);
  const [tablesList, setTablesList] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modals
  const [activeDetailLink, setActiveDetailLink] = useState<QrLink | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    links: QrLink[];
    template: QrPrintTemplate;
  } | null>(null);
  
  const [bulkTemplate, setBulkTemplate] = useState<QrPrintTemplate>('tent');
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_POS_URL || 'http://localhost:3001');

  // 1. Listen to Tables & Categories & QR Links from Firestore
  useEffect(() => {
    if (!hotelCode) return;

    // A. Read tables from pos settings
    const posRef = doc(db, 'hotels', hotelCode, 'settings', 'pos');
    const unsubPos = onSnapshot(posRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const rawTables = data.tables || '10';
        const parsed: Array<{ id: string; name: string }> = [];
        if (/^\d+$/.test(rawTables.trim())) {
          const count = parseInt(rawTables.trim()) || 10;
          for (let i = 1; i <= count; i++) {
            parsed.push({ id: `table_${i}`, name: `Meja ${i}` });
          }
        } else {
          rawTables.split(',').forEach((t: string, i: number) => {
            const clean = t.trim();
            if (clean) parsed.push({ id: `table_${i + 1}`, name: clean });
          });
        }
        setTablesList(parsed);
      } else {
        const defaultTables = Array.from({ length: 10 }, (_, i) => ({ id: `table_${i + 1}`, name: `Meja ${i + 1}` }));
        setTablesList(defaultTables);
      }
    });

    // B. Read Categories
    const catRef = collection(db, 'hotels', hotelCode, 'pos_categories');
    const unsubCat = onSnapshot(catRef, (snap) => {
      const cats = snap.docs.map(d => ({ id: d.id, name: d.data().name || d.id }));
      setCategories(cats);
    });

    // C. Read QR links from pos_self_order settings
    const selfOrderRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order');
    const unsubSelfOrder = onSnapshot(selfOrderRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.qrLinks)) {
          setQrLinks(data.qrLinks);
        }
      }
    });

    return () => {
      unsubPos();
      unsubCat();
      unsubSelfOrder();
    };
  }, [hotelCode]);

  // Active tab filter
  const currentTabConfig = TAB_CONFIGS.find(t => t.key === activeTabKey) || TAB_CONFIGS[0];
  const filteredLinks = useMemo(() => {
    return qrLinks.filter(l => currentTabConfig.types.includes(l.type));
  }, [qrLinks, currentTabConfig]);

  const isAllFilteredSelected = filteredLinks.length > 0 && filteredLinks.every(l => selectedIds.has(l.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLinks.map(l => l.id)));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper to persist QR Links back to Firestore
  const persistQrLinks = async (updatedLinks: QrLink[]) => {
    setQrLinks(updatedLinks);
    const selfOrderRef = doc(db, 'hotels', hotelCode, 'settings', 'pos_self_order');
    await setDoc(selfOrderRef, { qrLinks: updatedLinks }, { merge: true });
  };

  // ── 1. Action: "QR semua meja" (Bulk Generate / Sync All Tables) ──
  const handleGenerateAllTables = async () => {
    if (tablesList.length === 0) {
      toast.warn('Belum ada meja yang terdaftar di pengaturan POS.');
      return;
    }

    setIsGeneratingAll(true);
    try {
      const existingTableNames = new Set(qrLinks.filter(l => l.type === 'table').map(l => l.tableName?.toLowerCase().trim()));
      const newLinksToAdd: QrLink[] = [];
      let createdCount = 0;

      tablesList.forEach(t => {
        const cleanName = t.name.trim();
        if (!existingTableNames.has(cleanName.toLowerCase())) {
          const token = Math.random().toString(36).substring(2, 10);
          const orderUrl = `${originUrl}/self-order/${hotelCode}?table=${encodeURIComponent(cleanName)}&qr=${token}`;
          newLinksToAdd.push({
            id: `qr_${t.id}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: 'table',
            label: cleanName,
            tableId: t.id,
            tableName: cleanName,
            menuId: null,
            menuName: null,
            targetUrl: null,
            url: orderUrl,
            token,
            isActive: true,
            scanCount: 0,
            lastScannedAt: null,
            validFrom: null,
            validUntil: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          createdCount++;
        }
      });

      if (createdCount === 0) {
        toast.info('Semua meja sudah memiliki QR Code aktif.');
      } else {
        const merged = [...qrLinks, ...newLinksToAdd];
        await persistQrLinks(merged);
        toast.success(`Berhasil membuat ${createdCount} QR meja baru!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal membuat QR semua meja');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // ── 2. Action: Create New QR ──
  const handleCreateQr = async (data: Omit<QrLink, 'id' | 'createdAt' | 'updatedAt' | 'token' | 'scanCount' | 'lastScannedAt' | 'url'>) => {
    const token = Math.random().toString(36).substring(2, 10);
    let targetUrl = `${originUrl}/self-order/${hotelCode}`;

    if (data.type === 'table' && data.tableName) {
      targetUrl += `?table=${encodeURIComponent(data.tableName)}&qr=${token}`;
    } else if (data.type === 'takeaway') {
      targetUrl += `?type=takeaway&qr=${token}`;
    } else if (data.type === 'menu_view') {
      targetUrl += `?view=menu&qr=${token}`;
    } else if (data.type === 'booking') {
      targetUrl += `?view=booking&qr=${token}`;
    } else if (data.type === 'custom' && data.targetUrl) {
      targetUrl = data.targetUrl;
    }

    if (data.menuId) {
      targetUrl += `${targetUrl.includes('?') ? '&' : '?'}menu=${data.menuId}`;
    }

    const newLink: QrLink = {
      ...data,
      id: `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      token,
      url: targetUrl,
      scanCount: 0,
      lastScannedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const merged = [newLink, ...qrLinks];
    await persistQrLinks(merged);
  };

  // ── 3. Action: Save / Update Existing QR ──
  const handleSaveQr = async (updated: QrLink) => {
    const updatedList = qrLinks.map(l => l.id === updated.id ? updated : l);
    await persistQrLinks(updatedList);
  };

  // ── 4. Action: Rotate Token ──
  const handleRotateQr = async (id: string) => {
    const target = qrLinks.find(l => l.id === id);
    if (!target) return;

    const newToken = Math.random().toString(36).substring(2, 10);
    let newUrl = target.url;

    if (newUrl.includes('qr=')) {
      newUrl = newUrl.replace(/qr=[a-zA-Z0-9]+/, `qr=${newToken}`);
    } else {
      newUrl += `${newUrl.includes('?') ? '&' : '?'}qr=${newToken}`;
    }

    const updated: QrLink = {
      ...target,
      token: newToken,
      url: newUrl,
      updatedAt: new Date().toISOString()
    };

    const updatedList = qrLinks.map(l => l.id === id ? updated : l);
    await persistQrLinks(updatedList);
    toast.success('Token QR berhasil dirotasi. QR lama tidak lagi berlaku.');
  };

  // ── 5. Action: Delete QR ──
  const handleDeleteQr = async (id: string) => {
    const updatedList = qrLinks.filter(l => l.id !== id);
    await persistQrLinks(updatedList);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success('QR berhasil dihapus.');
  };

  // ── 6. Action: Print Trigger ──
  const handlePrintSelected = () => {
    const selectedLinks = qrLinks.filter(l => selectedIds.has(l.id));
    if (selectedLinks.length === 0) {
      toast.warn('Pilih setidaknya 1 QR untuk dicetak');
      return;
    }
    setPrintModalState({
      isOpen: true,
      links: selectedLinks,
      template: bulkTemplate
    });
  };

  const handlePrintSingle = (link: QrLink) => {
    setPrintModalState({
      isOpen: true,
      links: [link],
      template: 'tent'
    });
  };

  const getStatusBadge = (l: QrLink) => {
    const now = Date.now();
    if (!l.isActive) {
      return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">Nonaktif</span>;
    }
    if (l.validFrom && new Date(l.validFrom).getTime() > now) {
      return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">Mulai {new Date(l.validFrom).toLocaleDateString('id-ID')}</span>;
    }
    if (l.validUntil && new Date(l.validUntil).getTime() < now) {
      return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">Kedaluwarsa</span>;
    }
    return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">Aktif</span>;
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* 1. TOP HEADER & ACTIONS (Matching POSONE exactly) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
            Menu &amp; Meja
          </span>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            QR &amp; Link Resto
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
            QR token unik per meja (tidak bisa ditebak), bisa dirotasi kapan saja. Ikat ke menu khusus, atur masa berlaku, dan cetak.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Tampilan Menu */}
          <a
            href={`${originUrl}/self-order/${hotelCode}`}
            target="_blank"
            rel="noreferrer"
            className="h-8 px-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <BookOpen size={13} />
            <span>Tampilan Menu</span>
          </a>

          {/* QR Semua Meja (Bulk Auto-generate for all tables) */}
          <button
            type="button"
            onClick={handleGenerateAllTables}
            disabled={isGeneratingAll}
            className="h-8 px-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <QrCode size={13} className={isGeneratingAll ? 'animate-spin' : ''} />
            <span>{isGeneratingAll ? 'Memproses...' : 'QR Semua Meja'}</span>
          </button>

          {/* + QR Baru */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={13} />
            <span>QR Baru</span>
          </button>
        </div>
      </div>

      {/* 2. CATEGORY TABS WITH LIVE COUNTERS (POSONE Underline Style) */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 scrollbar-none">
        {TAB_CONFIGS.map(tab => {
          const isSelected = activeTabKey === tab.key;
          const count = qrLinks.filter(l => tab.types.includes(l.type)).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTabKey(tab.key);
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 select-none -mb-[1px] cursor-pointer ${
                isSelected
                  ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-semibold transition-colors ${
                isSelected 
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. TABLE / QR ITEM LIST */}
      <div className="flex flex-col min-h-[220px]">
        {filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-50/50 dark:bg-neutral-900/20 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
            <QrCode size={36} className="text-neutral-400 mb-2" />
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Belum ada QR untuk kategori {currentTabConfig.label}
            </span>
            <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-4">
              {currentTabConfig.description}
            </p>
            {activeTabKey === 'table' ? (
              <button
                type="button"
                onClick={handleGenerateAllTables}
                className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <QrCode size={14} />
                <span>Buat QR Semua Meja Otomatis</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span>Buat QR Baru</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {/* Select All Row */}
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 select-none">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {isAllFilteredSelected ? (
                  <CheckSquare size={16} className="text-neutral-900 dark:text-white" />
                ) : (
                  <Square size={16} className="text-neutral-400" />
                )}
                <span>Pilih Semua ({filteredLinks.length} QR)</span>
              </button>
            </div>

            {/* List Rows */}
            <div className="flex flex-col gap-1.5">
              {filteredLinks.map(link => {
                const isSelected = selectedIds.has(link.id);
                return (
                  <div
                    key={link.id}
                    onClick={() => setActiveDetailLink(link)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-neutral-100/80 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700'
                        : 'bg-white dark:bg-[#151517] hover:bg-neutral-50 dark:hover:bg-[#1a1a1d] border-neutral-200/80 dark:border-neutral-800/80 shadow-sm'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={e => handleToggleSelectOne(link.id, e)}
                      className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-neutral-900 dark:text-white" />
                      ) : (
                        <Square size={16} className="text-neutral-400" />
                      )}
                    </div>

                    {/* QR Thumbnail */}
                    <div className="p-1 bg-white rounded-lg border border-neutral-200 shrink-0">
                      <QrSvg value={link.url} size={36} />
                    </div>

                    {/* Label & Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {link.label || link.tableName || TYPE_SUBTITLES[link.type]}
                        </span>
                        {link.tableName && link.tableName !== link.label && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                            {link.tableName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500 block truncate">
                        {TYPE_SUBTITLES[link.type]}
                        {link.menuName ? ` • Menu: ${link.menuName}` : ''}
                      </span>
                    </div>

                    {/* Scan Count */}
                    <span className="hidden sm:block text-xs font-mono text-neutral-500 font-medium w-24 text-right">
                      {link.scanCount} scan
                    </span>

                    {/* Status Badge */}
                    <div className="shrink-0 w-28 text-right">
                      {getStatusBadge(link)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. STICKY BULK ACTION BAR (when >= 1 item selected) */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              {selectedIds.size} QR dipilih
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline font-medium"
            >
              Batal
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={bulkTemplate}
              onChange={e => setBulkTemplate(e.target.value as QrPrintTemplate)}
              className="h-9 px-3 text-xs font-bold bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none"
            >
              <option value="tent">Table Tent A6 (Tenda Meja)</option>
              <option value="sticker">Stiker 3×3 (9 per lembar A4)</option>
              <option value="sheet">Lembar A4 (6 per lembar 2×3)</option>
            </select>

            <button
              type="button"
              onClick={handlePrintSelected}
              className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer size={14} />
              <span>Cetak ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. MODALS */}
      {/* Detail / Edit Modal */}
      {activeDetailLink && (
        <QrDetailModal
          link={activeDetailLink}
          onClose={() => setActiveDetailLink(null)}
          onSave={handleSaveQr}
          onRotate={handleRotateQr}
          onDelete={handleDeleteQr}
          onPrintSingle={handlePrintSingle}
          availableMenus={categories}
        />
      )}

      {/* Create New QR Modal */}
      {isCreateOpen && (
        <QrCreateModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateQr}
          existingTableIds={new Set(qrLinks.filter(l => l.type === 'table').map(l => l.tableName || ''))}
          allTables={tablesList}
          availableMenus={categories}
          defaultType={currentTabConfig.types[0] || 'table'}
        />
      )}

      {/* Print Preview Modal */}
      {printModalState?.isOpen && (
        <QrPrintModal
          links={printModalState.links}
          storeName={storeName}
          storeLogo={storeLogo}
          defaultTemplate={printModalState.template}
          onClose={() => setPrintModalState(null)}
        />
      )}
    </div>
  );
}
