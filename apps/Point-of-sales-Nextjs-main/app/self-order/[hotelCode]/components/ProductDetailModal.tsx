import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';

interface Addon {
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  categoryId: string;
  imageUrl?: string;
  isAvailable: boolean;
  addons?: Addon[];
}

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
    onAddToCart(product.id, qty, selectedAddons, note);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full sm:max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] shadow-2xl relative"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Image Header */}
            <div className="relative h-[200px] sm:h-[240px] bg-sb-canvas flex-shrink-0">
              <img 
                src={product.imageUrl || 'https://placehold.co/600x400?text=Product'} 
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply p-2"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Product'; }}
              />
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-sb-text shadow-sm active:scale-95 transition-transform"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-none pb-24">
              {/* PDP Breadcrumb */}
              <div className="flex items-center gap-2 text-[13px] text-sb-accent mb-4 font-medium tracking-tight">
                <span>Menu</span>
                <span className="text-gray-400">/</span>
                <span className="capitalize">{product.categoryId || 'Kategori'}</span>
                <span className="text-gray-400">/</span>
                <span className="text-sb-text truncate">{product.name}</span>
              </div>

              <h2 className="text-[24px] font-bold text-sb-text leading-snug mb-2" style={{ letterSpacing: '-0.01em' }}>
                {product.name}
              </h2>
              <p className="text-[14px] text-sb-text-soft leading-relaxed mb-6">
                {product.description || 'Tidak ada deskripsi.'}
              </p>

              {/* Modifiers (Addons) */}
              {product.addons && product.addons.length > 0 && (
                <div className="mb-8">
                  <div className="border-b border-gray-200 pb-2 mb-4">
                    <h3 className="text-[16px] font-bold text-sb-text tracking-tight uppercase">Opsi Tambahan</h3>
                    <p className="text-[13px] text-sb-text-soft">Sesuaikan pesanan Anda</p>
                  </div>
                  <div className="flex flex-col gap-0 border border-gray-200 rounded-[8px] overflow-hidden">
                    {product.addons.map((addon, idx) => {
                      const isSelected = selectedAddons.some(a => a.name === addon.name);
                      return (
                        <div key={idx} className={idx !== product.addons!.length - 1 ? "border-b border-gray-200" : ""}>
                          <label 
                            onClick={() => handleAddonToggle(addon)}
                            className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isSelected ? 'bg-[#f4f8f6]' : 'bg-white hover:bg-neutral-50'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${isSelected ? 'bg-sb-accent border-sb-accent' : 'border-gray-400 bg-white'}`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <span className={`text-[15px] ${isSelected ? 'text-sb-text font-bold' : 'text-sb-text font-medium'}`}>{addon.name}</span>
                            </div>
                            {addon.price > 0 && (
                              <span className="text-[14px] text-sb-text-soft">+{formatRupiah(addon.price)}</span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Note */}
              <div className="mb-4">
                <h3 className="text-[15px] font-bold text-sb-text mb-3">Catatan Khusus</h3>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Cth: Less sugar, ekstra es, dll."
                  className="w-full bg-neutral-50 border border-gray-200 rounded-[12px] p-3 text-[14px] text-sb-text focus:outline-none focus:border-sb-accent focus:ring-1 focus:ring-sb-accent transition-all min-h-[80px]"
                />
              </div>
            </div>

            {/* Footer / Add to Cart Action */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-10">
              {/* Qty Selector */}
              <div className="flex items-center gap-4 bg-neutral-50 rounded-full p-1 border border-gray-200">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sb-text shadow-sm active:scale-95 transition-transform"
                >
                  <Minus size={18} />
                </button>
                <span className="text-[16px] font-bold text-sb-text w-4 text-center">{qty}</span>
                <button 
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sb-text shadow-sm active:scale-95 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Add Button */}
              <button 
                onClick={handleAddToCart}
                className="flex-1 ml-4 bg-sb-accent text-white font-semibold py-3 px-4 rounded-full flex items-center justify-between active:scale-95 transition-transform shadow-[0_4px_12px_rgba(0,117,74,0.2)]"
              >
                <span>Tambahkan</span>
                <span>{formatRupiah(itemTotal)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
