import React from 'react';
import { Plus, Minus, Sparkles, Utensils, Star, Flame, Eye } from 'lucide-react';

export interface Addon {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  categoryId: string;
  imageUrl?: string;
  isAvailable: boolean;
  stock?: number;
  addons?: Addon[];
  isSignature?: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  qty: number;
  selectedAddons: Addon[];
  note: string;
}

interface ProductGridProps {
  products: Product[];
  cart: CartItem[];
  onProductClick: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onQuickUpdateQty: (productId: string, delta: number) => void;
  formatRupiah: (val: number) => string;
}

export default function ProductGrid({
  products,
  cart,
  onProductClick,
  onQuickAdd,
  onQuickUpdateQty,
  formatRupiah
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-[#faf5ea] border border-[#c5a059]/30 flex items-center justify-center text-[#8c6e33] mb-4 shadow-sm">
          <Utensils size={28} />
        </div>
        <h3 className="text-[17px] font-bold text-[#121615] mb-1">
          Menu Tidak Ditemukan
        </h3>
        <p className="text-[13px] text-[#525a56] max-w-xs leading-relaxed">
          Silakan pilih kategori lain atau ubah kata kunci pencarian Anda untuk menemukan hidangan favorit.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 pb-8 pt-3">
      {products.map((product) => {
        const productCartItems = cart.filter((item) => item.productId === product.id);
        const totalQty = productCartItems.reduce((sum, item) => sum + item.qty, 0);
        const hasAddons = Boolean(product.addons && product.addons.length > 0);

        return (
          <div
            key={product.id}
            onClick={() => product.isAvailable && onProductClick(product)}
            className={`so-card rounded-2xl overflow-hidden flex flex-col relative group ${
              product.isAvailable ? 'cursor-pointer' : 'opacity-65 grayscale-[35%]'
            }`}
          >
            {/* Dish Photography Frame - Proportional 1:1 Aspect Ratio */}
            <div className="relative w-full aspect-square bg-[#f2efe9] overflow-hidden flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/400x400/f2efe9/8c6e33?text=Product';
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-[#8c6e33]/70 bg-[#f2efe9]">
                  <div className="w-12 h-12 rounded-2xl bg-[#faf5ea] border border-[#c5a059]/30 flex items-center justify-center mb-1.5 shadow-2xs">
                    <Utensils size={24} className="text-[#8c6e33]/70" />
                  </div>
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#8c6e33]/80 so-display-font">
                    Product
                  </span>
                </div>
              )}

              {/* Top Status & Dietary Badges */}
              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                {!product.isAvailable ? (
                  <span className="bg-[#121615]/85 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-sm">
                    Habis
                  </span>
                ) : (
                  <>
                    {Boolean(product.isSignature) && (
                      <span className="bg-[#c5a059] text-[#121615] text-[9px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md uppercase tracking-wider">
                        <Star size={9} className="fill-[#121615]" /> Chef Pick
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Quantity in Cart Glow Pill */}
              {totalQty > 0 && (
                <div className="absolute top-2.5 right-2.5 bg-[#0b3d2e] text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in-50 duration-200">
                  {totalQty}
                </div>
              )}
            </div>

            {/* Dish Information */}
            <div className="p-3.5 flex flex-col flex-grow bg-white">
              <div className="flex items-start justify-between gap-1 mb-1">
                <h3 className="text-[14px] sm:text-[15.5px] font-bold text-[#121615] leading-snug line-clamp-2 so-display-font">
                  {product.name}
                </h3>
              </div>

              <p className="text-[11px] sm:text-[12px] text-[#525a56] line-clamp-2 leading-relaxed mb-3">
                {product.description || 'Pilihan kuliner berkelas disiapkan segar dengan bahan baku berkualitas tinggi.'}
              </p>

              {/* Price & Action Section */}
              <div className="mt-auto pt-2.5 flex items-center justify-between gap-2 border-t border-[#c5a059]/15">
                <div className="flex flex-col">
                  <span className="text-[14px] sm:text-[15.5px] font-extrabold text-[#0b3d2e] so-display-font">
                    {formatRupiah(product.price)}
                  </span>
                </div>

                {product.isAvailable && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {/* Stepper if in cart without addons */}
                    {!hasAddons && totalQty > 0 ? (
                      <div className="flex items-center bg-[#faf5ea] rounded-xl p-0.5 border border-[#c5a059]/40 shadow-sm">
                        <button
                          onClick={() => onQuickUpdateQty(product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-[#121615] flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all text-xs font-bold shadow-xs"
                          title="Kurangi"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-[12px] font-extrabold text-[#0b3d2e]">
                          {totalQty}
                        </span>
                        <button
                          onClick={() => onQuickUpdateQty(product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-[#0b3d2e] text-white flex items-center justify-center hover:bg-[#07261d] active:scale-95 transition-all text-xs font-bold shadow-xs"
                          title="Tambah"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onProductClick(product)}
                        className="px-3 py-1.5 rounded-xl bg-[#0b3d2e] text-white text-[11px] sm:text-[12px] font-bold flex items-center gap-1 shadow-sm hover:bg-[#07261d] active:scale-95 transition-all"
                      >
                        <Plus size={13} className="text-[#c5a059]" />
                        <span>{hasAddons ? 'Kustom' : 'Tambah'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
