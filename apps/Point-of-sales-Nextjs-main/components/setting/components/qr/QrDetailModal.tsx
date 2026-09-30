'use client';
import React, { useState } from 'react';
import { QrLink } from './types';
import { QrSvg, downloadQrPng, downloadQrSvg } from './QrSvg';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  X, 
  Utensils, 
  ShoppingBag, 
  BookOpen, 
  CalendarClock, 
  Globe, 
  ReceiptText, 
  Link2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';

interface QrDetailModalProps {
  link: QrLink;
  onClose: () => void;
  onSave: (updated: QrLink) => Promise<void>;
  onRotate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPrintSingle: (link: QrLink) => void;
  availableMenus?: Array<{ id: string; name: string }>;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  table: Utensils,
  takeaway: ShoppingBag,
  menu_view: BookOpen,
  booking: CalendarClock,
  site: Globe,
  receipt_feedback: ReceiptText,
  custom: Link2
};

const TYPE_LABELS: Record<string, string> = {
  table: 'Pesan di meja',
  takeaway: 'Pesan takeaway',
  menu_view: 'Lihat menu (tanpa pesan)',
  booking: 'Reservasi meja',
  site: 'Website bisnis',
  receipt_feedback: 'Feedback / e-struk',
  custom: 'Link custom'
};

function formatIsoForInput(isoString: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function QrDetailModal({
  link,
  onClose,
  onSave,
  onRotate,
  onDelete,
  onPrintSingle,
  availableMenus = []
}: QrDetailModalProps) {
  const [label, setLabel] = useState(link.label || '');
  const [menuId, setMenuId] = useState(link.menuId || '');
  const [isActive, setIsActive] = useState(link.isActive);
  const [validFrom, setValidFrom] = useState(formatIsoForInput(link.validFrom));
  const [validUntil, setValidUntil] = useState(formatIsoForInput(link.validUntil));
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'rotate' | 'delete' | null>(null);

  const TypeIcon = TYPE_ICONS[link.type] || Utensils;
  const sanitizedFilename = (label || link.type).replace(/[^\w-]+/g, '-').toLowerCase();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success('Link QR berhasil disalin ke clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const selectedMenu = availableMenus.find(m => m.id === menuId);
      const updated: QrLink = {
        ...link,
        label: label.trim() || link.label,
        menuId: menuId || null,
        menuName: selectedMenu?.name || null,
        isActive,
        validFrom: validFrom ? new Date(validFrom).toISOString() : null,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        updatedAt: new Date().toISOString()
      };
      await onSave(updated);
      toast.success('Pengaturan QR berhasil disimpan');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan QR');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    const now = Date.now();
    if (!isActive) {
      return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">Nonaktif</span>;
    }
    if (link.validFrom && new Date(link.validFrom).getTime() > now) {
      return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">Terjadwal</span>;
    }
    if (link.validUntil && new Date(link.validUntil).getTime() < now) {
      return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">Kedaluwarsa</span>;
    }
    return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">Aktif</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121214] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#18181b]/50">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>{label || TYPE_LABELS[link.type] || 'Detail QR'}</span>
              {getStatusBadge()}
            </h3>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
              <TypeIcon size={14} className="text-neutral-600 dark:text-neutral-400" />
              <span>{TYPE_LABELS[link.type] || link.type}</span>
              {link.tableName && <span>• {link.tableName}</span>}
              {link.menuName && <span>• Menu: {link.menuName}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-[13rem_1fr] gap-6 md:gap-8">
          {/* Left Column: QR Code & Quick Download Actions */}
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 bg-white rounded-xl border border-neutral-200 shadow-sm transition-opacity duration-200 ${!isActive ? 'opacity-35 grayscale' : ''}`}>
              <QrSvg value={link.url} size={180} />
            </div>

            <div className="text-center text-xs text-neutral-500 leading-tight">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {link.scanCount > 0 ? `${link.scanCount}× dipindai` : 'Belum pernah dipindai'}
              </span>
              {link.lastScannedAt && (
                <span className="block text-[11px] text-neutral-400 mt-0.5">
                  Terakhir: {new Date(link.lastScannedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>

            {/* Quick Actions (Cetak, PNG, SVG) */}
            <div className="grid grid-cols-3 gap-1.5 w-full pt-1">
              <button
                type="button"
                onClick={() => onPrintSingle(link)}
                className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors"
              >
                <Printer size={15} />
                <span>Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => downloadQrPng(link.url, sanitizedFilename)}
                className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors"
              >
                <Download size={15} />
                <span>PNG</span>
              </button>
              <button
                type="button"
                onClick={() => downloadQrSvg(link.url, sanitizedFilename)}
                className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors"
              >
                <Download size={15} />
                <span>SVG</span>
              </button>
            </div>
          </div>

          {/* Right Column: Settings & Link Form */}
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 min-w-0">
            {/* Copiable URL box */}
            <div className="flex items-center gap-2 p-1.5 pl-3 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <span className="flex-1 font-mono text-xs text-neutral-600 dark:text-neutral-300 truncate select-all">
                {link.url}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md text-xs font-bold shadow-sm border border-neutral-200 dark:border-neutral-700 transition-colors shrink-0"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            {/* Label */}
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Label QR
              </label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                maxLength={60}
                placeholder="cth: Meja 1 atau Bar Counter"
                className="w-full h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <span className="text-[11px] text-neutral-400 block mt-0.5">Tampil pada daftar meja dan hasil cetakan</span>
            </div>

            {/* Special Menu (Optional) */}
            {availableMenus.length > 0 && (
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Menu Khusus
                </label>
                <select
                  value={menuId}
                  onChange={e => setMenuId(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  <option value="">Ikut Default (Semua Kategori)</option>
                  {availableMenus.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-neutral-400 block mt-0.5">Kosongkan bila ingin menampilkan seluruh menu reguler</span>
              </div>
            )}

            {/* Date Range Validity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Berlaku Mulai
                </label>
                <input
                  type="datetime-local"
                  value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Berlaku Sampai
                </label>
                <input
                  type="datetime-local"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Active Toggle Switch */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <div>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">QR Aktif</span>
                <span className="text-[11px] text-neutral-500">Matikan sementara tanpa perlu mengganti QR yang sudah dicetak</span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-10 h-5 bg-neutral-300 checked:bg-neutral-900 dark:checked:bg-white rounded-full appearance-none relative cursor-pointer transition-all duration-300 before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white dark:before:bg-neutral-900 before:rounded-full before:top-0.5 before:left-0.5 before:transition-all before:duration-300 checked:before:left-5.5"
              />
            </div>

            {/* Confirm Danger Box (Rotate or Delete) */}
            {confirmAction && (
              <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                confirmAction === 'rotate' 
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200' 
                  : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    {confirmAction === 'rotate' ? (
                      <>
                        <strong className="block font-bold mb-0.5">Rotasi Token &amp; Ganti dengan QR baru?</strong>
                        Pengaturan tetap sama, namun QR lama yang sudah dicetak otomatis menjadi tidak berlaku. Gunakan fitur ini jika QR disalahgunakan.
                      </>
                    ) : (
                      <>
                        <strong className="block font-bold mb-0.5">Hapus QR ini secara permanen?</strong>
                        QR akan dicabut dan dihapus dari daftar. Tamu yang memindai QR ini akan melihat notifikasi bahwa QR sudah tidak berlaku.
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Batal
                  </button>
                  {confirmAction === 'rotate' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await onRotate(link.id);
                        setConfirmAction(null);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <RefreshCw size={13} />
                      <span>Ya, Buat QR Baru</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await onDelete(link.id);
                        setConfirmAction(null);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Trash2 size={13} />
                      <span>Ya, Hapus QR</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            {!confirmAction && (
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction('rotate')}
                    className="px-3 py-2 text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} />
                    <span>Rotasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction('delete')}
                    className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
