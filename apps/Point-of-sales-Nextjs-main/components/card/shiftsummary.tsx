'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, UserCircle, Wallet, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface ShiftData {
  cashierName: string;
  openedAt: string;
  houseBank: number;
  status: string;
}

function ActiveShiftSummary(): React.ReactNode {
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [activeShift, setActiveShift] = useState<ShiftData | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const shiftJson = localStorage.getItem('active_shift');
    if (shiftJson) {
      try {
        const shiftData = JSON.parse(shiftJson);
        if (shiftData && shiftData.status === 'open') {
          setActiveShift(shiftData);
        }
      } catch (e) {
        console.error('Error parsing shift data', e);
      }
    }
  }, []);

  if (!isClient) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 w-full h-full min-h-[4.5rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col justify-center items-center px-2"
    >
      {activeShift ? (
        <div className="w-full flex flex-col md:flex-row gap-2 h-auto md:h-full py-1">
          <div className="py-2 px-3 w-full md:w-1/3 rounded-xl bg-emerald-50/[0.8] dark:bg-emerald-950/20 dark:border-emerald-500/[0.2] border border-emerald-200 flex items-center gap-2.5">
            <UserCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider leading-none">Kasir</p>
              <p className="font-bold text-neutral-800 dark:text-white text-xs truncate mt-0.5" title={activeShift.cashierName}>
                {activeShift.cashierName}
              </p>
            </div>
          </div>

          <div className="py-2 px-3 w-full md:w-1/3 rounded-xl bg-blue-50/[0.8] dark:bg-blue-950/20 dark:border-blue-500/[0.2] border border-blue-200 flex items-center gap-2.5">
            <Clock size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider leading-none">Buka</p>
              <p className="font-bold text-neutral-800 dark:text-white text-xs mt-0.5">
                {new Date(activeShift.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="py-2 px-3 w-full md:w-1/3 rounded-xl bg-amber-50/[0.8] dark:bg-amber-950/20 dark:border-amber-500/[0.2] border border-amber-200 flex items-center gap-2.5">
            <Wallet size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider leading-none">Modal</p>
              <p className="font-bold text-amber-600 dark:text-amber-400 text-xs mt-0.5 truncate">
                {formatCurrency(activeShift.houseBank)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between w-full rounded-xl bg-red-50/[0.8] p-3 dark:bg-red-950/20 dark:border-red-500/[0.2] border border-red-200 gap-3">
          <div className="flex items-center gap-2.5">
            <UserCircle size={24} className="text-red-500 shrink-0" />
            <div className="flex flex-col text-left">
              <h3 className="font-bold text-red-600 dark:text-red-400 text-xs leading-none">Tidak Ada Shift Aktif</h3>
              <p className="text-[10px] text-red-500/80 mt-1">Buka shift kasir terlebih dahulu.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/cashier')}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer border-none"
          >
            Buka Shift
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default ActiveShiftSummary;
