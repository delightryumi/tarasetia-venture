'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CreditCard, Eye, Ban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { DeleteAlertDialog } from './alertDelete';
import { VoidAlertDialog } from './alertVoid';
import { EditPaymentDialog } from './alertEditPayment';
import Link from 'next/link';
import { useRBAC } from '@/hooks/useRBAC';

type Products = {
  id: string;
  productId: string;
  quantity: number;
};

type Records = {
  totalQuantity: number;
  id: string;
  totalAmount: string | null;
  createdAt: string;
  isComplete: boolean;
  products: Products[];
  status?: string;
  paymentMethod?: string;
  isCompliment?: boolean;
  complimentValue?: number;
  customerName?: string;
  tableNumber?: string;
};

interface DropdownProps {
  records: Records;
  onPaymentUpdated?: (newMethod: string, isCompliment?: boolean) => void;
}

const Dropdown = ({ records, onPaymentUpdated }: DropdownProps) => {
  const { canAccess } = useRBAC();
  const canCancel = canAccess('pos_cancel');
  const canVoid = canAccess('pos_void') || canAccess('trans_void');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };

  const handleVoidClose = () => {
    setVoidOpen(false);
  };

  const handleEditPaymentClose = () => {
    setEditPaymentOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-lg">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 p-1">
          <DropdownMenuLabel className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-2 py-1.5">
            Aksi Transaksi
          </DropdownMenuLabel>
          <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-xs font-medium">
            <Link href={`/records/${records.id}`} className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-neutral-500" />
              <span>Lihat Detail</span>
            </Link>
          </DropdownMenuItem>

          {records.status !== 'CANCELLED' && (
            <DropdownMenuItem 
              onClick={() => setEditPaymentOpen(true)}
              className="rounded-lg cursor-pointer text-xs font-medium flex items-center gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 dark:focus:text-emerald-300 focus:bg-emerald-50 dark:focus:bg-emerald-950/40"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Edit Metode Payment</span>
            </DropdownMenuItem>
          )}

          {(canCancel || canVoid) && <DropdownMenuSeparator className="my-1 bg-neutral-100 dark:bg-white/[0.06]" />}

          {records.status !== 'CANCELLED' && canCancel && (
            <DropdownMenuItem 
              onClick={() => setVoidOpen(true)}
              className="rounded-lg cursor-pointer text-xs font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400 focus:text-amber-700 dark:focus:text-amber-300 focus:bg-amber-50 dark:focus:bg-amber-950/40"
            >
              <Ban className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Cancel Order</span>
            </DropdownMenuItem>
          )}
          {canVoid && (
            <DropdownMenuItem 
              onClick={() => setDeleteOpen(true)}
              className="rounded-lg cursor-pointer text-xs font-medium flex items-center gap-2 text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/40"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Void Order</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPaymentDialog
        open={editPaymentOpen}
        onClose={handleEditPaymentClose}
        data={records}
        onUpdated={onPaymentUpdated}
      />

      <DeleteAlertDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        data={records}
      />
      <VoidAlertDialog
        open={voidOpen}
        onClose={handleVoidClose}
        data={records}
      />
    </>
  );
};

export default Dropdown;
