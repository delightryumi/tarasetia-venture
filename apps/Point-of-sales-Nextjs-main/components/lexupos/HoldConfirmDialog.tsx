'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface HoldConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function HoldConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm
}: HoldConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/[0.1] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-neutral-800 dark:text-neutral-200">
            Konfirmasi Hold Order
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-500 dark:text-neutral-400">
            Apakah Anda yakin ingin menunda pesanan ini? Pesanan akan disimpan sementara dan keranjang belanja Anda akan dikosongkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-neutral-200 dark:border-white/[0.1] bg-gray-50 hover:bg-gray-100 text-neutral-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-neutral-300">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-100 border-none"
          >
            Ya, Hold Order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
