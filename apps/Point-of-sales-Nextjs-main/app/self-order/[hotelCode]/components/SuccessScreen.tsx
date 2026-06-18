import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface SuccessScreenProps {
  onNewOrder: () => void;
}

export default function SuccessScreen({ onNewOrder }: SuccessScreenProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#ffffff] rounded-[16px] p-8 text-center flex flex-col items-center shadow-sm"
      style={{ boxShadow: '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' }}
    >
      <div className="w-20 h-20 rounded-full bg-[#d4e9e2] flex items-center justify-center text-[#00754A] mb-6">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-[24px] font-semibold text-[rgba(0,0,0,0.87)] mb-3" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}>
        Pesanan Diterima!
      </h2>
      <p className="text-[14px] text-[rgba(0,0,0,0.58)] mb-8 max-w-[250px] mx-auto leading-relaxed">
        Terima kasih, pesanan Anda sedang kami siapkan. Silakan bersantai.
      </p>
      
      <button 
        onClick={onNewOrder}
        className="bg-transparent border border-[#00754A] text-[#00754A] font-semibold py-3 px-8 rounded-[50px] flex items-center justify-center gap-2 active:scale-95 transition-all mx-auto"
        style={{ letterSpacing: '-0.01em' }}
      >
        Buat Pesanan Baru
      </button>
    </motion.div>
  );
}
