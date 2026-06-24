'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { DeleteAlertDialog } from './alertDelete';
import { VoidAlertDialog } from './alertVoid';
import Link from 'next/link';

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
};

const Dropdown = ({ records }: { records: Records }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };

  const handleVoidClose = () => {
    setVoidOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/records/${records.id}`}>View</Link>
          </DropdownMenuItem>
          {records.status !== 'CANCELLED' && (
            <DropdownMenuItem onClick={() => setVoidOpen(true)}>
              Cancel Order
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            Void Order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
