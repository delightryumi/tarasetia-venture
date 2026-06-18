import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin } from 'lucide-react';

interface HeaderProps {
  hotelData: any;
  shopLogo: string | null;
  tableNumber: string | null;
}

export default function Header({ hotelData, shopLogo, tableNumber }: HeaderProps) {
  const [greeting, setGreeting] = useState('Selamat Datang');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      setGreeting('Selamat Pagi');
    } else if (hour >= 11 && hour < 15) {
      setGreeting('Selamat Siang');
    } else if (hour >= 15 && hour < 18) {
      setGreeting('Selamat Sore');
    } else {
      setGreeting('Selamat Malam');
    }
  }, []);

  return (
    <div className="w-full bg-sb-accent p-4 fixed top-0 left-0 right-0 z-50 tracking-[-0.01em]" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
      <div className="w-full md:px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sb-accent overflow-hidden shrink-0 shadow-sm">
            {shopLogo ? (
              <img src={shopLogo} alt="Logo Resto" className="w-full h-full object-contain p-1" />
            ) : (
              <ShoppingBag size={18} />
            )}
          </div>
          <div>
            <h1 className="text-[16px] font-semibold text-white leading-tight">
              {hotelData?.name || 'Restoran'}
            </h1>
            <p className="text-[13px] text-white/80 font-normal flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {greeting}
            </p>
          </div>
        </div>
        {tableNumber && (
          <div className="bg-white text-sb-accent text-[13px] font-bold px-4 py-1.5 rounded-full shadow-sm">
            Meja {tableNumber}
          </div>
        )}
      </div>
    </div>
  );
}
