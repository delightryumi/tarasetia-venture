'use client';
import React, { useState } from 'react';
import { QrType, QrLink } from './types';
import { 
  X, 
  Utensils, 
  ShoppingBag, 
  BookOpen, 
  CalendarClock, 
  Globe, 
  QrCode
} from 'lucide-react';
import { toast } from 'react-toastify';

interface QrCreateModalProps {
  onClose: () => void;
  onCreate: (newLink: Omit<QrLink, 'id' | 'createdAt' | 'updatedAt' | 'token' | 'scanCount' | 'lastScannedAt' | 'url'>) => Promise<void>;
  existingTableIds: Set<string>;
  allTables: Array<{ id: string; name: string }>;
  availableMenus?: Array<{ id: string; name: string }>;
  defaultType?: QrType;
}

const QR_TYPE_OPTIONS: Array<{
  key: QrType;
  label: string;
  desc: string;
  icon: React.ElementType;
}> = [
  {
    key: 'table',
    label: 'Pesan di meja',
    desc: 'Tamu memindai di meja, lalu pesan langsung dari HP.',
    icon: Utensils
  },
  {
    key: 'takeaway',
    label: 'Pesan takeaway',
    desc: 'Pesan dari HP, ambil di kasir. Cocok dipajang di counter.',
    icon: ShoppingBag
  },
  {
    key: 'menu_view',
    label: 'Lihat menu (tanpa pesan)',
    desc: 'Hanya menampilkan menu & harga, tanpa fitur checkout/pesan.',
    icon: BookOpen
  },
  {
    key: 'booking',
    label: 'Reservasi meja',
    desc: 'Pelanggan memilih tanggal, jam & jumlah orang untuk reservasi.',
    icon: CalendarClock
  },
  {
    key: 'custom',
    label: 'Website & Link Custom',
    desc: 'Membuka tautan khusus ke website bisnis Anda.',
    icon: Globe
  }
];

export function QrCreateModal({
  onClose,
  onCreate,
  existingTableIds,
  allTables = [],
  availableMenus = [],
  defaultType = 'table'
}: QrCreateModalProps) {
  const [type, setType] = useState<QrType>(defaultType);
  
  // Available tables that do not have active QR yet
  const availableTables = allTables.filter(t => !existingTableIds.has(t.name) && !existingTableIds.has(t.id));
  const initialTable = availableTables[0] || allTables[0];
  
  const [selectedTableId, setSelectedTableId] = useState<string>(initialTable?.id || '');
  const [label, setLabel] = useState<string>('');
  const [menuId, setMenuId] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [hasExpiry, setHasExpiry] = useState<boolean>(false);
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedTable = allTables.find(t => t.id === selectedTableId || t.name === selectedTableId);
  const selectedMenu = availableMenus.find(m => m.id === menuId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'table' && !selectedTable) {
      toast.warn('Pilih nomor meja terlebih dahulu');
      return;
    }

    if (type === 'custom' && !targetUrl.trim()) {
      toast.warn('Masukkan URL tujuan');
      return;
    }

    const finalLabel = label.trim() || (type === 'table' && selectedTable ? `Meja ${selectedTable.name.replace(/^meja\s*/i, '')}` : (QR_TYPE_OPTIONS.find(o => o.key === type)?.label || 'QR Link'));

    setIsSubmitting(true);
    try {
      await onCreate({
        type,
        label: finalLabel,
        tableId: type === 'table' ? (selectedTable?.id || selectedTableId) : null,
        tableName: type === 'table' ? (selectedTable?.name || selectedTableId) : null,
        menuId: menuId || null,
        menuName: selectedMenu?.name || null,
        targetUrl: type === 'custom' ? targetUrl.trim() : null,
        isActive: true,
        validFrom: hasExpiry && validFrom ? new Date(validFrom).toISOString() : null,
        validUntil: hasExpiry && validUntil ? new Date(validUntil).toISOString() : null
      });

      toast.success(`QR ${finalLabel} berhasil dibuat`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat QR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#121214] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#18181b]/50">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Buat QR Baru
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pilih fungsi QR, lalu atur meja, menu, dan masa berlakunya.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* QR Type Selection */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Jenis QR
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QR_TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = type === opt.key;
                return (
                  <label
                    key={opt.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm'
                        : 'bg-neutral-50/60 dark:bg-neutral-900/40 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="qrType"
                      value={opt.key}
                      checked={isSelected}
                      onChange={() => setType(opt.key)}
                      className="sr-only"
                    />
                    <Icon size={18} className={`shrink-0 mt-0.5 ${isSelected ? 'text-white dark:text-neutral-900' : 'text-neutral-500'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold leading-tight">{opt.label}</span>
                      <span className={`text-[10px] leading-snug mt-0.5 line-clamp-2 ${isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500'}`}>
                        {opt.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Table selector (if type === 'table') */}
          {type === 'table' && (
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Pilih Meja Resto
              </label>
              <select
                value={selectedTableId}
                onChange={e => {
                  setSelectedTableId(e.target.value);
                  const tbl = allTables.find(t => t.id === e.target.value || t.name === e.target.value);
                  if (tbl && !label) {
                    setLabel(`Meja ${tbl.name.replace(/^meja\s*/i, '')}`);
                  }
                }}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none"
              >
                {allTables.map(t => {
                  const alreadyHasQr = existingTableIds.has(t.name) || existingTableIds.has(t.id);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} {alreadyHasQr ? '• (Sudah punya QR)' : ''}
                    </option>
                  );
                })}
              </select>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                Setiap meja akan memiliki link dan token QR yang terpisah.
              </span>
            </div>
          )}

          {/* Custom URL (if type === 'custom') */}
          {type === 'custom' && (
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                URL Tujuan
              </label>
              <input
                type="url"
                required
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://restoran-anda.com/promo"
                className="w-full h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none"
              />
            </div>
          )}

          {/* Label and Special Menu in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Label QR (Opsional)
              </label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                maxLength={60}
                placeholder={type === 'table' && selectedTable ? `Meja ${selectedTable.name}` : 'cth: Counter Takeaway'}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none"
              />
            </div>

            {availableMenus.length > 0 && ['table', 'takeaway', 'menu_view'].includes(type) && (
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Menu Khusus
                </label>
                <select
                  value={menuId}
                  onChange={e => setMenuId(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none"
                >
                  <option value="">Ikut Default (Semua Kategori)</option>
                  {availableMenus.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Validity Expiry Toggle */}
          <div className="flex flex-col gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">Batasi Masa Berlaku</span>
                <span className="text-[11px] text-neutral-500">Khusus untuk QR promo, event tertentu, atau meja musiman</span>
              </div>
              <input
                type="checkbox"
                checked={hasExpiry}
                onChange={e => setHasExpiry(e.target.checked)}
                className="w-10 h-5 bg-neutral-300 checked:bg-neutral-900 dark:checked:bg-white rounded-full appearance-none relative cursor-pointer transition-all duration-300 before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white dark:before:bg-neutral-900 before:rounded-full before:top-0.5 before:left-0.5 before:transition-all before:duration-300 checked:before:left-5.5"
              />
            </div>

            {hasExpiry && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                    Mulai Berlaku
                  </label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={e => setValidFrom(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                    Berlaku Sampai
                  </label>
                  <input
                    type="datetime-local"
                    required={hasExpiry}
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <QrCode size={14} />
              <span>{isSubmitting ? 'Membuat...' : 'Buat QR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
