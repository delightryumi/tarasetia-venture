import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, X, User, CheckCircle2, ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface CartCheckoutProps {
  cart: any[];
  products: any[];
  isDrawerOpen: boolean;
  setIsDrawerOpen: (val: boolean) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  tableNumber: string;
  setTableNumber: (val: string) => void;
  orderNotes: string;
  setOrderNotes: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  qrisImage: string | null;
  submittingOrder: boolean;
  onSubmitOrder: () => void;
  formatRupiah: (val: number) => string;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
}

export default function CartCheckout({
  cart,
  products,
  isDrawerOpen,
  setIsDrawerOpen,
  customerName,
  setCustomerName,
  tableNumber,
  setTableNumber,
  orderNotes,
  setOrderNotes,
  paymentMethod,
  setPaymentMethod,
  qrisImage,
  submittingOrder,
  onSubmitOrder,
  formatRupiah,
  onUpdateQuantity
}: CartCheckoutProps) {
  
  const totalItems = cart.reduce((a, b) => a + b.qty, 0);
  
  const cartItems = cart.map(item => {
    const p = products.find(prod => prod.id === item.productId);
    const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum: number, addon: any) => sum + addon.price, 0) : 0;
    return {
      id: item.productId,
      cartItemId: item.cartItemId,
      name: p?.name || 'Unknown',
      basePrice: p?.price || 0,
      price: (p?.price || 0) + addonsTotal,
      qty: item.qty,
      selectedAddons: item.selectedAddons || [],
      note: item.note || ''
    };
  }).filter(item => item.qty > 0);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  return (
    <>
      {/* Floating Action Button (Frap-style) */}
      <AnimatePresence>
        {totalItems > 0 && !isDrawerOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="w-[56px] h-[56px] rounded-full bg-sb-accent flex items-center justify-center text-white relative active:scale-95 transition-transform"
              style={{ boxShadow: '0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)' }}
            >
              <ShoppingBag size={24} />
              <div className="absolute -top-1 -right-1 bg-[#c82014] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {totalItems}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-lg md:max-w-xl bg-white rounded-t-[24px] flex flex-col max-h-[90vh] shadow-2xl"
            >
              <div className="flex justify-between items-center p-5 border-b border-gray-200">
                <h2 className="text-[18px] font-semibold text-sb-text tracking-tight">Review Pesanan</h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-sb-text active:scale-95 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 scrollbar-none flex flex-col gap-6">
                
                {/* Guest Info */}
                <div className="bg-neutral-50 rounded-[12px] p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <User size={18} className="text-sb-accent" />
                    <span className="text-[14px] font-semibold text-sb-text">Informasi Tamu</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <span className="text-[11px] font-semibold text-sb-text absolute -top-2 left-3 bg-neutral-50 px-1 uppercase tracking-wider">Nama Pemesan <span className="text-red-500">*</span></span>
                        <input 
                          type="text" 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Masukkan nama Anda"
                          className="w-full bg-transparent border border-gray-300 focus:border-sb-accent rounded-[4px] px-3 py-3 text-[14px] outline-none text-sb-text"
                        />
                      </div>
                      <div className="relative w-full sm:w-[120px]">
                        <span className="text-[11px] font-semibold text-sb-text absolute -top-2 left-3 bg-neutral-50 px-1 uppercase tracking-wider">No. Meja <span className="text-red-500">*</span></span>
                        <input 
                          type="text" 
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="Meja"
                          className="w-full bg-transparent border border-gray-300 focus:border-sb-accent rounded-[4px] px-3 py-3 text-[14px] outline-none text-sb-text"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <span className="text-[11px] font-semibold text-sb-text absolute -top-2 left-3 bg-neutral-50 px-1 uppercase tracking-wider">Catatan Tambahan (Opsional)</span>
                      <input 
                        type="text" 
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Contoh: Tolong siapkan sedotan lebih, dll"
                        className="w-full bg-transparent border border-gray-300 focus:border-sb-accent rounded-[4px] px-3 py-3 text-[14px] outline-none text-sb-text"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-[14px] font-semibold text-sb-text mb-3">Daftar Pesanan ({totalItems})</h3>
                  <div className="flex flex-col gap-3">
                    {cartItems.map((item) => (
                      <div key={item.cartItemId} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                        <div className="flex gap-3">
                          <div className="flex items-center bg-sb-canvas rounded-md border border-gray-200 overflow-hidden shrink-0 h-8 self-start mt-0.5 shadow-sm">
                            <button 
                              onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                              className="w-7 h-full flex items-center justify-center text-sb-text hover:bg-neutral-200 transition-colors bg-white font-medium text-[16px]"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-[12px] font-bold text-sb-text bg-white h-full flex items-center justify-center border-x border-gray-100">
                              {item.qty}
                            </span>
                            <button 
                              onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                              className="w-7 h-full flex items-center justify-center text-sb-text hover:bg-neutral-200 transition-colors bg-white font-medium text-[16px]"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] text-sb-text font-medium leading-snug">{item.name}</span>
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.selectedAddons.map((addon: any, idx: number) => (
                                  <span key={idx} className="text-[11px] text-sb-text-soft bg-sb-canvas px-1.5 py-0.5 rounded-sm">
                                    {addon.name} {addon.price > 0 && `(+${formatRupiah(addon.price)})`}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.note && (
                              <span className="text-[12px] text-sb-accent mt-1 bg-sb-accent/5 px-2 py-0.5 rounded-sm self-start inline-block">
                                &quot;{item.note}&quot;
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[14px] font-medium text-sb-text">
                          {formatRupiah(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-[14px] font-semibold text-sb-text mb-3">Metode Pembayaran</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setPaymentMethod('cashier')}
                      className={`flex flex-col items-center justify-center p-3 rounded-[12px] border ${paymentMethod === 'cashier' ? 'border-sb-accent bg-sb-accent/5' : 'border-gray-300 bg-transparent'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border mb-2 flex items-center justify-center ${paymentMethod === 'cashier' ? 'border-sb-accent' : 'border-gray-300'}`}>
                        {paymentMethod === 'cashier' && <div className="w-2 h-2 rounded-full bg-sb-accent"></div>}
                      </div>
                      <span className="text-[13px] font-medium text-sb-text">Bayar di Kasir</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('qris')}
                      className={`flex flex-col items-center justify-center p-3 rounded-[12px] border ${paymentMethod === 'qris' ? 'border-sb-accent bg-sb-accent/5' : 'border-gray-300 bg-transparent'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border mb-2 flex items-center justify-center ${paymentMethod === 'qris' ? 'border-sb-accent' : 'border-gray-300'}`}>
                        {paymentMethod === 'qris' && <div className="w-2 h-2 rounded-full bg-sb-accent"></div>}
                      </div>
                      <span className="text-[13px] font-medium text-sb-text">QRIS / e-Wallet</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {paymentMethod === 'qris' && qrisImage && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div className="bg-sb-canvas p-4 rounded-[12px] flex flex-col items-center">
                          <p className="text-[12px] text-sb-text-soft mb-3 text-center">
                            Silakan scan QRIS di bawah ini untuk membayar.
                          </p>
                          <div className="bg-white p-2 rounded-lg shadow-sm w-48 h-48 relative">
                            <Image src={qrisImage} alt="QRIS" fill className="object-contain" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Summary */}
                <div className="bg-neutral-50 p-4 rounded-[12px] border border-gray-200 mt-2 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] text-sb-text-soft">Subtotal</span>
                    <span className="text-[13px] text-sb-text font-medium">{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[13px] text-sb-text-soft">Pajak (11%)</span>
                    <span className="text-[13px] text-sb-text font-medium">{formatRupiah(tax)}</span>
                  </div>
                  <div className="w-full h-[1px] bg-gray-200 mb-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[16px] font-bold text-sb-text">Total</span>
                    <span className="text-[18px] font-bold text-sb-house">{formatRupiah(total)}</span>
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div className="p-5 border-t border-gray-200 bg-white">
                <button 
                  disabled={submittingOrder || !customerName.trim()}
                  onClick={onSubmitOrder}
                  className="w-full bg-sb-accent disabled:bg-sb-light disabled:text-sb-accent/50 text-white font-semibold py-[14px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {submittingOrder ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    <>Pesan Sekarang <ChevronRight size={18} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
