import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  ChevronRight,
  X,
  User,
  Utensils,
  CreditCard,
  Building,
  Minus,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Phone,
  QrCode,
  Receipt
} from 'lucide-react';
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
  const [serviceType, setServiceType] = useState<'dine-in' | 'room-service' | 'takeaway'>('dine-in');

  const totalItems = cart.reduce((a, b) => a + b.qty, 0);

  const cartItems = cart
    .map((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      const addonsTotal = item.selectedAddons
        ? item.selectedAddons.reduce((sum: number, addon: any) => sum + addon.price, 0)
        : 0;
      return {
        id: item.productId,
        cartItemId: item.cartItemId,
        name: p?.name || 'Item Pilihan',
        imageUrl: p?.imageUrl,
        basePrice: p?.price || 0,
        price: (p?.price || 0) + addonsTotal,
        qty: item.qty,
        selectedAddons: item.selectedAddons || [],
        note: item.note || ''
      };
    })
    .filter((item) => item.qty > 0);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.10); // PB1 10%
  const grandTotal = subtotal + tax;

  return (
    <>
      {/* ── Persistent Floating Cart Island ── */}
      <AnimatePresence>
        {totalItems > 0 && !isDrawerOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-lg mx-auto"
          >
            <div
              onClick={() => setIsDrawerOpen(true)}
              className="so-floating-island text-white rounded-3xl p-3 sm:p-3.5 flex items-center justify-between cursor-pointer active:scale-[0.985] transition-all"
            >
              {/* Left Item Stack & Total */}
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-[#c5a059] border border-white/15 shadow-inner">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#c5a059] text-[#121615] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-[#0b3d2e]">
                    {totalItems}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold block">
                    {totalItems} Menu Dipilih
                  </span>
                  <span className="text-[17px] font-black text-[#e5c378] leading-none">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Right Checkout Pill CTA */}
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#c5a059] to-[#e5c378] text-[#121615] px-4 py-2.5 rounded-2xl font-black text-[13px] shadow-md">
                <span>Lihat Pesanan</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Checkout Drawer Modal ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-md p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh] shadow-2xl border border-[#c5a059]/30 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[#c5a059]/15 bg-[#f8f7f4]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#0b3d2e] text-[#c5a059] flex items-center justify-center shadow-sm">
                    <Utensils size={17} />
                  </div>
                  <div>
                    <h2 className="text-[16px] sm:text-[18px] font-bold text-[#121615] leading-tight font-sans">
                      Rincian & Konfirmasi Pesanan
                    </h2>
                    <span className="text-[11px] text-[#525a56]">Setara Five-Star Hospitality</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 text-[#121615] flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-transform"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 so-no-scrollbar flex flex-col gap-5">
                
                {/* 1. Service Mode Selector */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#8c6e33] block mb-2">
                    Pilihan Tipe Layanan
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceType('dine-in')}
                      className={`py-2.5 px-2 rounded-2xl border text-[12px] font-bold flex flex-col items-center gap-1 transition-all ${
                        serviceType === 'dine-in'
                          ? 'bg-[#0b3d2e] text-white border-[#0b3d2e] shadow-md ring-1 ring-[#c5a059]'
                          : 'bg-[#f8f7f4] text-[#525a56] border-gray-200 hover:bg-[#f2efe9]'
                      }`}
                    >
                      <Utensils size={15} className={serviceType === 'dine-in' ? 'text-[#c5a059]' : ''} />
                      <span>Dine-In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceType('room-service')}
                      className={`py-2.5 px-2 rounded-2xl border text-[12px] font-bold flex flex-col items-center gap-1 transition-all ${
                        serviceType === 'room-service'
                          ? 'bg-[#0b3d2e] text-white border-[#0b3d2e] shadow-md ring-1 ring-[#c5a059]'
                          : 'bg-[#f8f7f4] text-[#525a56] border-gray-200 hover:bg-[#f2efe9]'
                      }`}
                    >
                      <Building size={15} className={serviceType === 'room-service' ? 'text-[#c5a059]' : ''} />
                      <span>Room Service</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceType('takeaway')}
                      className={`py-2.5 px-2 rounded-2xl border text-[12px] font-bold flex flex-col items-center gap-1 transition-all ${
                        serviceType === 'takeaway'
                          ? 'bg-[#0b3d2e] text-white border-[#0b3d2e] shadow-md ring-1 ring-[#c5a059]'
                          : 'bg-[#f8f7f4] text-[#525a56] border-gray-200 hover:bg-[#f2efe9]'
                      }`}
                    >
                      <ShoppingBag size={15} className={serviceType === 'takeaway' ? 'text-[#c5a059]' : ''} />
                      <span>Takeaway</span>
                    </button>
                  </div>
                </div>

                {/* 2. Guest Information Card */}
                <div className="bg-[#f8f7f4] rounded-3xl p-4 border border-[#c5a059]/25">
                  <div className="flex items-center gap-2 mb-3 text-[#0b3d2e] font-extrabold text-[13px]">
                    <User size={15} className="text-[#8c6e33]" />
                    <span>Identitas Tamu & Meja</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#525a56] block mb-1">
                          Nama Pemesan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Cth: Bpk. Hendra"
                          className="w-full bg-white border border-gray-200 focus:border-[#0b3d2e] rounded-xl px-3 py-2 text-[13px] text-[#121615] outline-none shadow-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#525a56] block mb-1">
                          {serviceType === 'room-service' ? 'No. Kamar Hotel' : 'No. Meja'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder={serviceType === 'room-service' ? 'Cth: 304' : 'Cth: 12'}
                          className="w-full bg-white border border-gray-200 focus:border-[#0b3d2e] rounded-xl px-3 py-2 text-[13px] text-[#121615] outline-none shadow-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#525a56] block mb-1">
                        Catatan Pesanan Keseluruhan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Cth: Tolong sendok ekstra, pisahkan bill, dll"
                        className="w-full bg-white border border-gray-200 focus:border-[#0b3d2e] rounded-xl px-3 py-2 text-[13px] text-[#121615] outline-none shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Itemized List Review */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#8c6e33]">
                      Daftar Pesanan ({totalItems} Menu)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {cartItems.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="p-3 bg-[#f8f7f4] rounded-2xl border border-gray-200/90 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#f2efe9] border border-gray-200 flex flex-col items-center justify-center shrink-0 text-[#8c6e33]/60">
                              <Utensils size={16} />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-bold text-[#121615] leading-tight truncate">
                              {item.name}
                            </span>
                            <span className="text-[12px] font-extrabold text-[#0b3d2e] mt-0.5">
                              {formatRupiah(item.price)}
                            </span>
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.selectedAddons.map((addon: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-bold text-[#8c6e33] bg-[#faf5ea] border border-[#c5a059]/40 px-1.5 py-0.2 rounded"
                                  >
                                    +{addon.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.note && (
                              <span className="text-[11px] text-[#525a56] italic mt-0.5">
                                &quot;{item.note}&quot;
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Stepper */}
                        <div className="flex items-center bg-white rounded-xl border border-gray-300 p-0.5 shrink-0 shadow-xs">
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                            className="w-6 h-6 flex items-center justify-center text-[#525a56] hover:text-[#121615] active:scale-95"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-[12px] font-extrabold text-[#0b3d2e]">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#525a56] hover:text-[#121615] active:scale-95"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Payment Method Selection */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#8c6e33] block mb-2">
                    Metode Pembayaran
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cashier')}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all ${
                        paymentMethod === 'cashier'
                          ? 'border-[#0b3d2e] bg-[#faf5ea] shadow-sm ring-1 ring-[#c5a059]'
                          : 'border-gray-200 bg-white hover:bg-[#f8f7f4]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          paymentMethod === 'cashier'
                            ? 'border-[#0b3d2e] bg-[#0b3d2e]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'cashier' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="text-[12px] font-bold text-[#121615] block leading-tight">
                          Bayar di Kasir
                        </span>
                        <span className="text-[10px] text-[#525a56]">Tunai / EDC Hotel</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris')}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all ${
                        paymentMethod === 'qris'
                          ? 'border-[#0b3d2e] bg-[#faf5ea] shadow-sm ring-1 ring-[#c5a059]'
                          : 'border-gray-200 bg-white hover:bg-[#f8f7f4]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          paymentMethod === 'qris'
                            ? 'border-[#0b3d2e] bg-[#0b3d2e]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'qris' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="text-[12px] font-bold text-[#121615] block leading-tight">
                          QRIS Instan
                        </span>
                        <span className="text-[10px] text-[#525a56]">Semua e-Wallet</span>
                      </div>
                    </button>
                  </div>

                  {/* QRIS Display Container */}
                  <AnimatePresence>
                    {paymentMethod === 'qris' && qrisImage && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="bg-[#f8f7f4] p-4 rounded-3xl border border-[#c5a059]/30 flex flex-col items-center shadow-xs">
                          <span className="text-[13px] font-bold text-[#121615] mb-1 flex items-center gap-1.5">
                            <QrCode size={15} className="text-[#8c6e33]" /> Scan QRIS Pembayaran
                          </span>
                          <p className="text-[11px] text-[#525a56] mb-3 text-center">
                            Dukung BCA, Mandiri, Gopay, OVO, Dana, ShopeePay, dan semua mobile banking.
                          </p>
                          <div className="bg-white p-3 rounded-2xl shadow-md w-48 h-48 relative border border-gray-200">
                            <Image src={qrisImage} alt="QRIS" fill className="object-contain p-1" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 5. Financial Summary Breakdown */}
                <div className="bg-[#f8f7f4] p-4 rounded-3xl border border-[#c5a059]/25 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[12px] text-[#525a56]">
                    <span>Subtotal Makanan & Minuman</span>
                    <span className="font-bold text-[#121615]">{formatRupiah(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[12px] text-[#525a56]">
                    <span>Pajak Restoran PB1 (10%)</span>
                    <span className="font-bold text-[#121615]">{formatRupiah(tax)}</span>
                  </div>

                  <div className="w-full h-px bg-gray-200 my-1" />

                  <div className="flex justify-between items-center text-[15px]">
                    <span className="font-bold text-[#121615]">Total Pembayaran</span>
                    <span className="font-black text-[18px] text-[#0b3d2e]">
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>
                </div>

              </div>

              {/* Drawer Submit CTA */}
              <div className="p-4 sm:p-5 border-t border-[#c5a059]/15 bg-white">
                <button
                  disabled={submittingOrder || !customerName.trim() || !tableNumber.trim()}
                  onClick={onSubmitOrder}
                  className="w-full bg-gradient-to-r from-[#0b3d2e] to-[#124d3b] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-[#0b3d2e]/30"
                >
                  {submittingOrder ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Meneruskan Pesanan ke Dapur...
                    </span>
                  ) : (
                    <>
                      <span>Kirim Pesanan ({formatRupiah(grandTotal)})</span>
                      <ChevronRight size={18} />
                    </>
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
