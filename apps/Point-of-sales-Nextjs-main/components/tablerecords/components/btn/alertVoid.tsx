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

type Data = {
  id: string;
};

export function VoidAlertDialog({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: Data;
}) {
  const [loading, setLoading] = useState(false);
  const [reasonInput, setReasonInput] = useState('');
  const router = useRouter();

  const handleCancel = () => {
    setReasonInput('');
    onClose();
  };

  const handleVoid = async () => {
    if (!reasonInput.trim()) {
      toast.error('Alasan pembatalan (reason) wajib diisi!');
      return;
    }
    setLoading(true);
    try {
      await axios.patch(`/api/transactions/${data.id}`, {
        reason: reasonInput
      });
      setReasonInput('');
      onClose();
      router.refresh();
      toast.success('Transaksi berhasil di-Cancel.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Server Error:', error.response?.data);
        toast.error('Gagal melakukan cancel transaksi.');
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Apakah Anda yakin ingin melakukan Cancel Order?
          </AlertDialogTitle>
          <div className="text-sm text-muted-foreground space-y-4">
            <p>
              Cancel Order akan menandai transaksi dengan Id: <span className="font-bold text-neutral-800 dark:text-neutral-100">{data.id}</span> sebagai dibatalkan (tercoret), nominalnya tidak akan dihitung di kasir/akuntansi, dan **TIDAK memerlukan sandi admin**.
            </p>
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-white/[0.05]">
              <Label htmlFor="voidReason" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Alasan Pembatalan (Reason) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="voidReason"
                type="text"
                placeholder="Tulis alasan pembatalan..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="h-10 text-sm bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl"
              />
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleVoid}
            disabled={loading}
            className="text-gray-100 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 border-none"
          >
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Cancel Order'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
