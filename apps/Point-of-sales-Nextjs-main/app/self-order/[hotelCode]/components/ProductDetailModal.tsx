import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Sparkles, Check, MessageSquare, Info, ShieldCheck, Utensils } from 'lucide-react';
import { Product, Addon } from './ProductGrid';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    productId: string,
    qty: number,
    selectedAddons: Addon[],
    note: string
  ) => void;
  formatRupiah: (val: number) => string;
}

const QUICK_TAGS = [
  'Es Sedikit (Less Ice)',
  'Sedikit Gula (Less Sugar)',
  'Pedas Sedang',
  'Tidak Pedas',
  'Pisahkan Sambal & Saus',
  'Sajikan Hangat'
];

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  formatRupiah
}: ProductDetailModalProps) {
  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQty(1);
      setSelectedAddons([]);
      setNote('');
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleAddonToggle = (addon: Addon) => {
    const isSelected = selectedAddons.some((a) => a.name === addon.name);
    if (isSelected) {
      setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleQuickTagClick = (tag: string) => {
    if (note.includes(tag)) {
      setNote(note.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setNote(note ? `${note}, ${tag}` : tag);
    }
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const itemTotal = (product.price + addonsTotal) * qty;

  const handleConfirm = () => {
    onAddToCart(product.id, qty, selectedAddons, note.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh] max-h-[92dvh] shadow-2xl relative border border-[#c5a059]/30"
          >
            {/* Sheet Handle for Mobile */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-white/70 z-20 pointer-events-none" />

            {/* Header Dish Photography - Generous & appetizing presentation */}
            <div className="so-modal-img relative h-[210px] sm:h-[250px] md:h-[280px] bg-[#f2efe9] shrink-0 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover brightness-95"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/600x400/f2efe9/8c6e33?text=Product';
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8c6e33]/70 bg-[#f2efe9]">
                  <div className="w-14 h-14 rounded-2xl bg-[#faf5ea] border border-[#c5a059]/30 flex items-center justify-center mb-1.5 shadow-xs">
                    <Utensils size={28} className="text-[#8c6e33]/70" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#8c6e33]/80 so-display-font">
                    Product
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all shadow-md z-10"
              >
                <X size={16} />
              </button>

              {/* Title & Price on Image Overlay */}
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  {product.isSignature && (
                    <span className="bg-[#c5a059] text-[#121615] text-[9.5px] font-black px-2 py-0.2 rounded-md uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                      <Sparkles size={9} /> Chef Pick
                    </span>
                  )}
                  {product.categoryId && (
                    <span className="text-[9.5px] bg-white/20 backdrop-blur-md px-2 py-0.2 rounded-md text-white/90">
                      {product.categoryId}
                    </span>
                  )}
                </div>

                <h2 className="so-modal-title text-[18px] sm:text-[22px] font-extrabold leading-tight drop-shadow-md so-display-font line-clamp-1">
                  {product.name}
                </h2>

                <p className="so-modal-price text-[15px] sm:text-[17px] font-black text-[#e5c378] mt-0.2 so-display-font">
                  {formatRupiah(product.price)}
                </p>
              </div>
            </div>

            {/* Scrollable Content Body (Full flex-1 with min-h-0 so it scrolls naturally without cutoffs) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 so-no-scrollbar min-h-0 flex flex-col gap-4">
              
              {/* Description */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#8c6e33] mb-1 flex items-center gap-1">
                  <Info size={13} /> Deskripsi & Cita Rasa
                </h4>
                <p className="text-[12.5px] sm:text-[13px] text-[#525a56] leading-relaxed">
                  {product.description ||
                    'Pilihan kuliner istimewa yang diolah secara higienis menggunakan bahan-bahan pilihan berkualitas hotel bintang 5.'}
                </p>
              </div>

              {/* Addons / Modifiers Section */}
              {product.addons && product.addons.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5 border-b border-[#c5a059]/20 pb-1.5">
                    <div>
                      <h4 className="text-[12.5px] sm:text-[13px] font-bold text-[#121615] uppercase tracking-wider">
                        Pilihan Tambahan / Topping
                      </h4>
                      <p className="text-[10.5px] sm:text-[11px] text-[#525a56]">Pilih varian favorit Anda</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {product.addons.map((addon, idx) => {
                      const isSelected = selectedAddons.some((a) => a.name === addon.name);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleAddonToggle(addon)}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[#faf5ea] border-[#c5a059] text-[#121615] shadow-xs'
                              : 'bg-white border-gray-200 text-[#525a56] hover:bg-[#f8f7f4]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-[#0b3d2e] text-white shadow-xs'
                                  : 'border border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="text-[12.5px] font-bold">{addon.name}</span>
                          </div>
                          {addon.price > 0 && (
                            <span className="text-[12px] font-extrabold text-[#8c6e33]">
                              +{formatRupiah(addon.price)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Notes & Quick Chips */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare size={13} className="text-[#8c6e33]" />
                  <h4 className="text-[12px] sm:text-[12.5px] font-bold text-[#121615]">Catatan Tambahan untuk Dapur</h4>
                </div>

                {/* Quick Tags */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = note.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleQuickTagClick(tag)}
                        className={`text-[10.5px] px-2.5 py-1 rounded-xl border transition-all font-semibold ${
                          isSelected
                            ? 'bg-[#0b3d2e] text-white border-[#0b3d2e]'
                            : 'bg-[#f8f7f4] text-[#525a56] border-gray-200 hover:bg-[#f2efe9]'
                        }`}
                      >
                        + {tag}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tuliskan catatan khusus atau preferensi alergi makanan..."
                  className="w-full bg-[#f8f7f4] border border-gray-200 focus:border-[#0b3d2e] rounded-xl p-2.5 text-[12.5px] text-[#121615] placeholder:text-[#8a928e] focus:outline-none transition-all resize-none min-h-[60px]"
                />
              </div>
            </div>

            {/* Natural Flex Footer (NOT absolute, never covers content) */}
            <div className="shrink-0 bg-white border-t border-[#c5a059]/20 p-3 sm:p-4 flex items-center justify-between gap-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] z-20">
              {/* Stepper */}
              <div className="flex items-center bg-[#faf5ea] rounded-xl p-0.5 border border-[#c5a059]/35">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 rounded-lg bg-white text-[#121615] flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all shadow-xs"
                >
                  <Minus size={14} />
                </button>
                <span className="w-7 text-center text-[14px] font-black text-[#0b3d2e]">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 rounded-lg bg-[#0b3d2e] text-white flex items-center justify-center hover:bg-[#07261d] active:scale-95 transition-all shadow-xs"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Order CTA */}
              <button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-[#0b3d2e] to-[#124d3b] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between active:scale-95 transition-all shadow-md shadow-[#0b3d2e]/25"
              >
                <span className="text-[12.5px] sm:text-[13px]">Tambahkan ke Pesanan</span>
                <span className="text-[14px] sm:text-[15px] text-[#e5c378] font-black">{formatRupiah(itemTotal)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
