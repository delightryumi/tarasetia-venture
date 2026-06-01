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
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col justify-center items-center px-4"
    >
      {activeShift ? (
        <div className="w-full flex gap-4 h-full">
          <div className="h-full w-1/3 rounded-2xl bg-emerald-50/[0.8] p-4 dark:bg-emerald-950/20 dark:border-emerald-500/[0.2] border border-emerald-200 flex flex-col items-center justify-center">
            <UserCircle size={40} className="text-emerald-600 dark:text-emerald-400" />
            <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
              Kasir Aktif
            </p>
            <p className="font-bold text-neutral-800 dark:text-white mt-1 text-center">
              {activeShift.cashierName}
            </p>
          </div>

          <div className="h-full w-1/3 rounded-2xl bg-blue-50/[0.8] p-4 dark:bg-blue-950/20 dark:border-blue-500/[0.2] border border-blue-200 flex flex-col items-center justify-center">
            <Clock size={40} className="text-blue-600 dark:text-blue-400" />
            <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
              Waktu Buka
            </p>
            <p className="font-bold text-neutral-800 dark:text-white mt-1 text-center text-xs">
              {new Date(activeShift.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="h-full w-1/3 rounded-2xl bg-amber-50/[0.8] p-4 dark:bg-amber-950/20 dark:border-amber-500/[0.2] border border-amber-200 flex flex-col items-center justify-center">
            <Wallet size={40} className="text-amber-600 dark:text-amber-400" />
            <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
              Kas Awal (Modal)
            </p>
            <p className="font-bold text-amber-600 dark:text-amber-400 mt-1 text-center text-sm">
              {formatCurrency(activeShift.houseBank)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full w-full rounded-2xl bg-red-50/[0.8] p-6 dark:bg-red-950/20 dark:border-red-500/[0.2] border border-red-200">
          <div className="text-red-500 mb-2">
            <UserCircle size={40} />
          </div>
          <h3 className="font-bold text-red-600 dark:text-red-400 text-lg mb-1">Tidak Ada Shift Aktif</h3>
          <p className="text-xs text-red-500/80 mb-4 text-center">Silakan buka shift kasir terlebih dahulu untuk mencatat transaksi.</p>
          <button
            onClick={() => router.push('/cashier')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Buka Shift Kasir
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default ActiveShiftSummary;
