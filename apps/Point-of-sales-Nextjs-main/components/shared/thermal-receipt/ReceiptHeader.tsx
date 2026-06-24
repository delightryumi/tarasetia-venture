import React from 'react';
import { PrintMode, ShopInfo } from './types';

interface ReceiptHeaderProps {
  shopInfo: ShopInfo;
  printMode: PrintMode;
  logoUrl: string | null;
}

export default function ReceiptHeader({ shopInfo, printMode, logoUrl }: ReceiptHeaderProps) {
  return (
    <div className="text-center mb-3 flex flex-col items-center">
      {printMode === 'all' && logoUrl && (
        <img src={logoUrl} alt="Store Logo" className="w-[36mm] h-auto object-contain mb-5" style={{ filter: 'grayscale(100%) brightness(0)' }} />
      )}
      <h2 className="text-[14px] font-black uppercase tracking-[1px] m-0 leading-tight">
        {shopInfo.name}
      </h2>
      {printMode === 'all' && shopInfo.address && (
        <p className="text-[9px] mt-[2px] mb-0 leading-tight text-neutral-600 font-medium">
          {shopInfo.address}
        </p>
      )}
      {printMode === 'all' && shopInfo.phone && (
        <p className="text-[9px] mt-[2px] mb-0 leading-tight font-semibold text-neutral-800">
          Tlp: {shopInfo.phone}
        </p>
      )}

      {printMode === 'kitchen' && (
        <div className="w-full text-center font-bold text-[11px] border border-black py-1.5 my-2 uppercase font-mono tracking-wider">
          *** TIKET DAPUR (KITCHEN) ***
        </div>
      )}
      {printMode === 'bar' && (
        <div className="w-full text-center font-bold text-[11px] border border-black py-1.5 my-2 uppercase font-mono tracking-wider">
          *** TIKET BAR (DRINKS) ***
        </div>
      )}
    </div>
  );
}
