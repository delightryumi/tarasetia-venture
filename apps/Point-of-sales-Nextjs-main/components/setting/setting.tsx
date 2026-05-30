'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import ShopnameCard from './components/shopname';
import TaxrateCard from './components/taxrate';
import LogoCard from './components/logo';
import CurrencyCard from './components/currency';
import eventBus from '@/lib/even';
export function Setting() {
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [serviceRate, setServiceRate] = useState<number>(0);
  const [lostBreakageRate, setLostBreakageRate] = useState<number>(0);
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const isOnline = navigator.onLine;

        if (!isOnline) {
          toast.error(
            'You are offline. Please check your internet connection.'
          );
          return;
        }

        const response = await axios.get('/api/shopdata');
        const shopdata = response.data.data;

        if (response.status === 200) {
          setStoreId(shopdata.id);
          setStoreName(shopdata.name);
          setTaxRate(shopdata.tax);
          setServiceRate(shopdata.service || 0);
          setLostBreakageRate(shopdata.lostBreakage || 0);
          setAddress(shopdata.address || '');
          setPhone(shopdata.phone || '');
        } else {
          toast.error('Failed to fetch data: ' + shopdata.error);
        }
      } catch (error: any) {
        toast.error(
          'Failed to fetch data: ' +
            (error.response?.data.error || error.message)
        );
      }
    };

    fetchShopData();

    const handleEventBusEvent = () => {
      fetchShopData();
    };

    eventBus.on('fetchStoreData', handleEventBusEvent);

    // Clean up event listener
    return () => {
      eventBus.removeListener('fetchStoreData', handleEventBusEvent);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 ">
          <div className="grid gap-6">
            <ShopnameCard storeName={storeName} storeId={storeId} addressProp={address} phoneProp={phone} />
            <TaxrateCard tax={taxRate} service={serviceRate} lostBreakage={lostBreakageRate} storeId={storeId} />
            <LogoCard />
            <CurrencyCard />
          </div>
        </div>
      </div>
    </div>
  );
}
