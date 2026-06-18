'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { shopnameSchema } from '@/schema';
import { ZodError } from 'zod';
import { ReloadIcon } from '@radix-ui/react-icons';
import eventBus from '@/lib/even';
interface ShopnameCardProps {
  storeName: string | null;
  storeId: string | null;
  addressProp: string;
  phoneProp: string;
  tablesProp?: string;
}

const ShopnameCard: React.FC<ShopnameCardProps> = ({ storeName, storeId, addressProp, phoneProp, tablesProp }) => {
  const [editableStoreName, setEditableStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [tables, setTables] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditableStoreName(storeName ?? '');
    setAddress(addressProp ?? '');
    setPhone(phoneProp ?? '');
    setTables(tablesProp ?? '10');
  }, [storeName, addressProp, phoneProp, tablesProp]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableStoreName(e.target.value);
  };

  const handleSave = async () => {
    // Save address, phone and tables to localStorage
    localStorage.setItem('shop_info', JSON.stringify({ address, phone, tables }));

    // Check if the user is online
    const isOnline = navigator.onLine;

    if (!isOnline) {
      toast.success('Information saved locally. Offline for store name update.');
      return;
    }

    if (!storeId) {
      toast.success('Information saved locally.');
      return;
    }

    if (editableStoreName === storeName && address === addressProp && phone === phoneProp && tables === tablesProp) {
      toast.success('Store information updated successfully.');
      return;
    }

    setIsLoading(true);

    try {
      const validatedData = shopnameSchema.parse({
        storeName: editableStoreName,
        address,
        phone,
        tables,
      });

      await axios.patch(`/api/shopdata/${storeId}`, validatedData);

      toast.success('Store information updated successfully.');
      eventBus.emit('fetchStoreData');
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle ZodError
        const fieldErrors = error.errors.map((err) => err.message);
        toast.error(`${fieldErrors.join(', ')}`);
      } else {
        toast.error('Failed to update store name.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="my-5">
      <CardHeader>
        <CardTitle>Store Information</CardTitle>
        <CardDescription>Used to identify your store name, address, phone, and tables config.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4 w-full">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Store Name</label>
              <Input value={editableStoreName} onChange={handleInputChange} />
            </div>
            <div className="flex flex-col gap-1.5 flex-[1.5]">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Complete Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Kawasan Creative Hub, Suite 101" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +62 811 2719 990" />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Registered Tables</label>
              <Input value={tables} onChange={(e) => setTables(e.target.value)} placeholder="e.g. 15 or 1,2,3,VIP-1,VIP-2" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button
          className="bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 transition-colors"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : (
            'Save'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShopnameCard;
