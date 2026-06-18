'use client';
import React, { useState, useEffect } from 'react';
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
import { taxSchema } from '@/schema';
import { ZodError } from 'zod';
import { ReloadIcon } from '@radix-ui/react-icons';
import eventBus from '@/lib/even';

interface TaxrateCardProps {
  tax: number | 0;
  service: number | 0;
  lostBreakage: number | 0;
  storeId: string | null;
}

const TaxrateCard: React.FC<TaxrateCardProps> = ({ tax, service, lostBreakage, storeId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editableTaxrate, setEditableTaxrate] = useState('');
  const [editableService, setEditableService] = useState('');
  const [editableLostBreakage, setEditableLostBreakage] = useState('');

  useEffect(() => {
    setEditableTaxrate(tax?.toString() ?? '0');
    setEditableService(service?.toString() ?? '0');
    setEditableLostBreakage(lostBreakage?.toString() ?? '0');
  }, [tax, service, lostBreakage]);

  const handleSave = async () => {
    const isOnline = navigator.onLine;

    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    if (!storeId) {
      toast.error('Store ID is required to save details.');
      return;
    }

    const taxNumber = parseFloat(editableTaxrate) || 0;
    const serviceNumber = parseFloat(editableService) || 0;
    const lostBreakageNumber = parseFloat(editableLostBreakage) || 0;

    if (
      taxNumber === tax &&
      serviceNumber === service &&
      lostBreakageNumber === lostBreakage
    ) {
      toast.info('No changes to save.');
      return;
    }

    setIsLoading(true);
    try {
      const validatedData = taxSchema.parse({
        tax: taxNumber,
        service: serviceNumber,
        lostBreakage: lostBreakageNumber,
      });

      await axios.patch(`/api/shopdata/${storeId}`, validatedData);

      toast.success('Tax configurations updated successfully.');
      eventBus.emit('fetchStoreData');
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((err) => err.message);
        toast.error(`${fieldErrors.join(', ')}`);
      } else {
        toast.error('Failed to update tax rates.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card x-chunk="dashboard-04-chunk-1" className="my-5">
        <CardHeader>
          <CardTitle>Tax & Services Configurations</CardTitle>
          <CardDescription>Set the service charge, tax rate, and lost/breakage percentages for Nexura POS checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Service Charge (%)</label>
              <Input
                type="number"
                step="any"
                value={editableService}
                onChange={(e) => setEditableService(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Tax Rate (%)</label>
              <Input
                type="number"
                step="any"
                value={editableTaxrate}
                onChange={(e) => setEditableTaxrate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Lost & Breakage (%)</label>
              <Input
                type="number"
                step="any"
                value={editableLostBreakage}
                onChange={(e) => setEditableLostBreakage(e.target.value)}
              />
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
    </>
  );
};

export default TaxrateCard;
