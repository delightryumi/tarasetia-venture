import React from 'react';
import { Plus } from 'lucide-react';

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
  formatRupiah: (val: number) => string;
}

export default function ProductGrid({ products, cart, onProductClick, formatRupiah }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
      {products.map((product) => {
        // Calculate total quantity of this specific product across all variants in the cart
        const totalQty = cart.filter(item => item.productId === product.id).reduce((sum, item) => sum + item.qty, 0);
        
        return (
          <div 
            key={product.id} 
            onClick={() => product.isAvailable && onProductClick(product)}
            className={`bg-white flex flex-col rounded-[12px] overflow-hidden ${product.isAvailable ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
            style={{ boxShadow: '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' }}
          >
            {/* Image Box */}
            <div className="relative w-full pt-[100%] bg-sb-canvas flex-shrink-0">
              <div className="absolute inset-0 p-4 flex items-center justify-center">
                <img 
                  src={product.imageUrl || 'https://placehold.co/400x400?text=Product'} 
                  alt={product.name}
                  className={`w-full h-full object-contain drop-shadow-sm transition-opacity duration-300 ease-in ${!product.isAvailable ? 'grayscale opacity-50' : ''}`}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Product'; }}
                />
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
                    <span className="bg-sb-house text-white text-[10px] font-semibold px-3 py-1 rounded-[50px] uppercase tracking-widest">
                      Habis
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Content Box */}
            <div className="p-3 flex flex-col flex-grow">
              <h3 className="text-[14px] font-semibold text-sb-text leading-snug line-clamp-2">
                {product.name}
              </h3>
              <p className="text-[12px] text-sb-text-soft line-clamp-1 mt-0.5">
                {product.description || 'Tanpa deskripsi'}
              </p>
              
              <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] sm:text-[14px] font-bold text-sb-text whitespace-nowrap">
                  {formatRupiah(product.price)}
                </span>
                
                {product.isAvailable && (
                  <div className="relative">
                    <button 
                      className="px-2.5 h-7 sm:px-3 sm:h-8 rounded-[50px] bg-sb-accent flex items-center justify-center text-white text-[12px] sm:text-[13px] font-semibold transition-all active:scale-95 shrink-0"
                    >
                      <Plus size={14} className="mr-1 sm:w-4 sm:h-4" /> Tambah
                    </button>
                    {totalQty > 0 && (
                      <div className="absolute -top-2 -right-2 bg-[#c82014] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {totalQty}
                      </div>
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
