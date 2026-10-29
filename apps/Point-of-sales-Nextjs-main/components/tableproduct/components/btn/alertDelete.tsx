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
import { toast } from 'react-toastify';

function getPosAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('pos_auth_token') || '';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const hotelCode = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
  if (hotelCode) headers['x-hotel-code'] = hotelCode;
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.email) headers['x-user-email'] = u.email;
    if (u.id || u.uid) headers['x-user-id'] = String(u.id || u.uid);
    if (!headers['x-hotel-code'] && u.hotelCode) headers['x-hotel-code'] = String(u.hotelCode);
  } catch {}
  return headers;
}

type Data = {
  id: string;
  productstock: {
    id: string;
    name: string;
  };
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
  const router = useRouter();
  const handleCancel = () => {
    onClose();
  };

  const handleDelete = async () => {
    setLoading(true);
    // Check if the user is online
    const isOnline = navigator.onLine;

    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      setLoading(false);
      return;
    }

    try {
      await axios.delete(
        `/api/product/${data.productstock.id}`,
        {
          headers: getPosAuthHeaders(),
          withCredentials: true,
        }
      );
      onClose();
      router.refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Server Error:', error.response?.data);
      } else if (error instanceof Error) {
        console.error('Error:', error.message);
      } else {
        console.error('Unknown error:', error);
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
            Are you absolutely sure want to delete {data.productstock.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the data
            from the server.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="text-gray-100"
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
