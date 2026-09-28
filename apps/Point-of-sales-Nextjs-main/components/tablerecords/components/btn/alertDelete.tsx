'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import axios from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { localDb } from '@/lib/dexie';
import { useRBAC } from '@/hooks/useRBAC';

type Data = {
  id: string;
};

export function DeleteAlertDialog({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: Data;
}) {
  const { canAccess, role } = useRBAC();
  const canVoid = canAccess('pos_void') || canAccess('trans_void');
  const [loading, setLoading] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const router = useRouter();

  const handleCancel = () => {
    setPinInput('');
    setVoidReason('');
    onClose();
  };

  const handleVoid = async () => {
    if (!canVoid) {
      toast.error('Anda tidak memiliki izin otorisasi untuk melakukan void transaksi.');
      return;
    }

    if (!voidReason.trim()) {
      toast.error('Alasan void transaksi wajib diisi untuk catatan audit.');
      return;
    }

    // PIN verification: strictly admin123
    const validPins = ['admin123'];

    // If current logged in user is admin / superadmin, allow their direct action
    const isAdmin = role?.toLowerCase() === 'superadmin' || 
                    role?.toLowerCase() === 'super admin' || 
                    role?.toLowerCase() === 'admin' ||
                    role?.toLowerCase() === 'manager';

    if (!isAdmin && !validPins.includes(pinInput.trim())) {
      toast.error('PIN / Password Supervisor tidak valid! Otorisasi ditolak.');
      return;
    }

    setLoading(true);
    try {
      // 1. Soft-void update in IndexedDB
      if (data.id) {
        try {
          await localDb.transactions.update(data.id, {
            status: 'VOID',
            cancelReason: `[VOID SUPERVISOR]: ${voidReason.trim()}`
          } as any);
        } catch (e) {
          console.warn('Local indexedDb update skipped:', e);
        }
      }

      // 2. Soft-void in Server via PATCH to preserve audit ledger
      await axios.patch(`/api/transactions/${data.id}`, {
        reason: `[VOID SUPERVISOR]: ${voidReason.trim()}`,
        status: 'VOID'
      });

      setPinInput('');
      setVoidReason('');
      onClose();
      router.refresh();
      toast.success('Transaksi berhasil di-Void dengan otorisasi supervisor.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Server Error:', error.response?.data);
        toast.error('Gagal memvoid transaksi di server.');
      } else if (error instanceof Error) {
        console.error('Error:', error.message);
        toast.error(error.message);
      } else {
        console.error('Unknown error:', error);
        toast.error('Terjadi kesalahan tidak dikenal.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-6 shadow-xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Otorisasi Void Transaksi (Supervisor Approval)
          </AlertDialogTitle>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-4 pt-2">
            <p className="leading-relaxed">
              Transaksi dengan ID <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{data.id}</span> akan dibatalkan resmi (status VOID) dan dicatat ke dalam audit trail pengawas.
            </p>

            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
              <Label htmlFor="voidReason" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Alasan Pembatalan / Void <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="voidReason"
                type="text"
                placeholder="Contoh: Salah input pesanan / Tamu batal..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="h-10 text-xs bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.08] rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="supervisorPin" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                PIN / Sandi Supervisor <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="supervisorPin"
                type="password"
                placeholder="Masukkan PIN supervisor (misal: 1234 atau sandi admin)..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="h-10 text-xs font-mono bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.08] rounded-xl"
              />
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-5 flex gap-2">
          <AlertDialogCancel 
            onClick={handleCancel}
            className="rounded-xl h-10 text-xs font-semibold border-neutral-200 dark:border-white/[0.08]"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleVoid}
            disabled={loading}
            className="rounded-xl h-10 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 border-none shadow-sm flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-3.5 w-3.5 animate-spin" />
                Memproses Void...
              </>
            ) : (
              'Konfirmasi Void Order'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
