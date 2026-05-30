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

export function DeleteAlertDialog({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: Data;
}) {
  const [loading, setLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const router = useRouter();

  const handleCancel = () => {
    setPasswordInput('');
    onClose();
  };

  const handleDelete = async () => {
    if (passwordInput !== 'admin123' && passwordInput !== 'owner123') {
      toast.error('Password Admin salah! Penghapusan dibatalkan.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.delete(`/api/transactions/${data.id}`);
      setPasswordInput('');
      onClose();
      router.refresh();
      toast.success('Transaksi berhasil dihapus.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Server Error:', error.response?.data);
        toast.error('Gagal menghapus transaksi.');
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
            Are you absolutely sure want to delete ?
          </AlertDialogTitle>
          <div className="text-sm text-muted-foreground space-y-4">
            <p>
              This action cannot be undone. This will permanently delete the
              transaction with Id: <span className="font-bold text-neutral-800 dark:text-neutral-100">{data.id}</span> from the server.
            </p>
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-white/[0.05]">
              <Label htmlFor="adminPassword" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Konfirmasi Password Admin
              </Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Masukkan password admin..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="h-10 text-sm bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-xl"
              />
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="text-gray-100 bg-red-600 hover:bg-red-750 dark:bg-red-600 dark:hover:bg-red-700"
          >
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
