'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import ShopnameCard from './components/shopname';
import TaxrateCard from './components/taxrate';
import LogoCard from './components/logo';
import QrisCard from './components/qris';
import CurrencyCard from './components/currency';
import SelfOrderCard from './components/selforder';
import SoundSettingCard from './components/sound';
import eventBus from '@/lib/even';
export function Setting() {
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [serviceRate, setServiceRate] = useState<number>(0);
  const [lostBreakageRate, setLostBreakageRate] = useState<number>(0);
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [tables, setTables] = useState<string>('10');

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
          setTables(shopdata.tables || '10');
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
    <div className="flex min-h-screen w-full flex-col bg-neutral-100/50 dark:bg-black">
      <div className="flex flex-1 flex-col p-2 sm:p-4 md:p-8">
        <div className="mx-auto w-full max-w-6xl bg-neutral-50 dark:bg-[#0f0f11] p-4 sm:p-6 md:p-10 rounded-2xl md:rounded-[28px] shadow-lg border border-neutral-200 dark:border-neutral-800/60 overflow-x-hidden">
          <div className="grid grid-cols-1 gap-4 md:gap-6 min-w-0 w-full">
            <ShopnameCard storeName={storeName} storeId={storeId} addressProp={address} phoneProp={phone} tablesProp={tables} />
            <TaxrateCard tax={taxRate} service={serviceRate} lostBreakage={lostBreakageRate} storeId={storeId} />
            <SelfOrderCard />
            <SoundSettingCard />
            <LogoCard />
            <QrisCard />
            <CurrencyCard />
          </div>
        </div>
      </div>
    </div>
  );
}
