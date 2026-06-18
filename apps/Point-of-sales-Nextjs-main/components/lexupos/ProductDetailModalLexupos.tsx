import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import { Product } from './types';

interface Addon {
  name: string;
  price: number;
}

interface ProductDetailModalLexuposProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product, 
    qty: number, 
    selectedAddons: Addon[], 
    note: string
  ) => void;
  formatCurrency: (val: number) => string;
}

export default function ProductDetailModalLexupos({
  product,
  isOpen,
  onClose,
  onAddToCart,
  formatCurrency
}: ProductDetailModalLexuposProps) {
  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [note, setNote] = useState('');

  // Reset state when modal opens for a new product
  React.useEffect(() => {
    if (isOpen) {
      setQty(1);
      setSelectedAddons([]);
      setNote('');
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleAddonToggle = (addon: Addon) => {
    const isSelected = selectedAddons.some(a => a.name === addon.name);
    if (isSelected) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const itemTotal = (product.price + addonsTotal) * qty;

  const handleAddToCart = () => {
    onAddToCart(product, qty, selectedAddons, note);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden flex flex-col shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-white/[0.1]">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 line-clamp-1">{product.name}</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-none max-h-[60vh]">
              {product.description && (
                <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                  {product.description}
                </p>
              )}

              {/* Modifiers (Addons) */}
              {product.addons && product.addons.length > 0 && (
                <div className="mb-5">
                  <div className="flex justify-between items-end mb-3">
                    <h3 className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-200">Opsi Tambahan</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {product.addons.map((addon, idx) => {
                      const isSelected = selectedAddons.some(a => a.name === addon.name);
                      return (
                        <label 
                          key={idx} 
                          onClick={() => handleAddonToggle(addon)}
                          className={`flex items-center justify-between p-3 rounded-[8px] border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-neutral-800 bg-neutral-100 dark:border-white dark:bg-zinc-800' 
                              : 'border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${
                              isSelected 
                                ? 'bg-neutral-800 border-neutral-800 dark:bg-white dark:border-white' 
                                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-zinc-800'
                            }`}>
                              {isSelected && <svg className="w-3 h-3 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className="text-[13px] text-neutral-800 dark:text-neutral-200 font-medium">{addon.name}</span>
                          </div>
                          {addon.price > 0 && (
                            <span className="text-[12px] text-neutral-500">+{formatCurrency(addon.price)}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Note */}
              <div className="mb-2">
                <h3 className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Catatan Pesanan</h3>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Cth: Less sugar, ekstra es, dll."
                  className="w-full bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-white/[0.1] rounded-[8px] p-3 text-[13px] text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 dark:focus:border-white dark:focus:ring-white transition-all min-h-[80px]"
                />
              </div>
            </div>

            {/* Footer / Add to Cart Action */}
            <div className="p-4 border-t border-neutral-200 dark:border-white/[0.1] flex items-center justify-between bg-neutral-50 dark:bg-zinc-900/50">
              {/* Qty Selector */}
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-[8px] p-1 border border-neutral-200 dark:border-white/[0.1]">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 rounded-[6px] bg-neutral-100 dark:bg-zinc-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200 active:scale-95 transition-transform"
                >
                  <Minus size={16} />
                </button>
                <span className="text-[14px] font-bold text-neutral-800 dark:text-neutral-200 w-6 text-center">{qty}</span>
                <button 
                  onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 rounded-[6px] bg-neutral-100 dark:bg-zinc-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200 active:scale-95 transition-transform"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add Button */}
              <button 
                onClick={handleAddToCart}
                className="flex-1 ml-4 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 font-semibold py-2.5 px-4 rounded-[8px] flex items-center justify-between active:scale-95 transition-colors"
              >
                <span className="text-[13px]">Tambahkan</span>
                <span className="text-[14px]">{formatCurrency(itemTotal)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
