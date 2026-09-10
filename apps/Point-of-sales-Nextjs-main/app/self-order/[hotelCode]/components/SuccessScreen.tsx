import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ChefHat, Sparkles, Utensils, ArrowRight, ShieldCheck } from 'lucide-react';

interface SuccessScreenProps {
  onNewOrder: () => void;
  orderNumber?: string;
}

export default function SuccessScreen({ onNewOrder, orderNumber }: SuccessScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="bg-white rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center border border-[#c5a059]/35 so-card shadow-xl my-4"
    >
      {/* Animated Luxury Check Badge */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#0b3d2e] to-[#124d3b] flex items-center justify-center text-[#e5c378] mb-5 shadow-xl shadow-[#0b3d2e]/30 relative">
        <CheckCircle2 size={46} strokeWidth={2.5} />
        <div className="absolute -inset-1.5 rounded-3xl border border-[#c5a059]/40 animate-ping opacity-25 pointer-events-none" />
      </div>

      <span className="so-badge-gold px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest mb-2 shadow-xs">
        Pesanan Berhasil Terkirim
      </span>

      <h2 className="text-[22px] sm:text-[26px] font-extrabold text-[#121615] mb-1 so-display-font leading-tight">
        Terima Kasih, Tamu Terhormat!
      </h2>

      {orderNumber && (
        <span className="text-[14px] font-black text-[#0b3d2e] mb-3 bg-[#e6f4ef] px-3 py-1 rounded-xl">
          Nomor Pesanan: #{orderNumber}
        </span>
      )}

      <p className="text-[13px] text-[#525a56] mb-6 max-w-xs mx-auto leading-relaxed">
        Pesanan Anda telah masuk ke monitor dapur utama. Tim kuliner kami sedang mempersiapkan hidangan Anda dengan standar tertinggi.
      </p>

      {/* Live Order Timeline Card */}
      <div className="w-full bg-[#f8f7f4] rounded-3xl p-4.5 border border-[#c5a059]/25 mb-6 text-left shadow-xs">
        <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-gray-200">
          <Clock size={16} className="text-[#8c6e33]" />
          <span className="text-[13px] font-bold text-[#121615]">Status Pesanan Live</span>
          <span className="ml-auto text-[11px] text-[#8c6e33] font-bold bg-[#faf5ea] border border-[#c5a059]/30 px-2 py-0.5 rounded-lg">
            Est. 15-20 Menit
          </span>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#0b3d2e] text-white flex items-center justify-center text-[11px] font-black shadow-xs">
              ✓
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-[#121615]">Pesanan Diterima Server & Kasir</span>
              <span className="text-[10px] text-[#525a56]">Data pesanan terverifikasi sistem hotel</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#c5a059] text-[#121615] flex items-center justify-center text-[11px] font-black animate-pulse shadow-sm">
              ●
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-[#8c6e33]">Dapur Sedang Mempersiapkan</span>
              <span className="text-[10px] text-[#8c6e33]">Chef sedang memasak hidangan Anda</span>
            </div>
          </div>

          <div className="flex items-center gap-3 opacity-45">
            <div className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-[11px]">
              ○
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] text-[#525a56] font-medium">Siap Disajikan ke Meja / Kamar</span>
              <span className="text-[10px] text-[#525a56]">Waiter akan segera mengantar pesanan</span>
            </div>
          </div>
        </div>
      </div>

      {/* New Order Button */}
      <button
        onClick={onNewOrder}
        className="w-full bg-[#faf5ea] border border-[#c5a059] text-[#8c6e33] font-extrabold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#f2efe9] active:scale-95 transition-all text-[13px] shadow-sm"
      >
        <span>Pesan Menu Tambahan</span>
        <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}
