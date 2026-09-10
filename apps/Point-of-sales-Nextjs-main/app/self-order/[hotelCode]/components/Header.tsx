import React, { useState, useEffect } from 'react';
import { Utensils, Sparkles, Search, Sun, Moon, Sunrise, Sunset, Clock, ShieldCheck, MapPin, X } from 'lucide-react';

interface HeaderProps {
  hotelData: any;
  shopLogo: string | null;
  tableNumber: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (val: boolean) => void;
}

export default function Header({
  hotelData,
  shopLogo,
  tableNumber,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen
}: HeaderProps) {
  const [greeting, setGreeting] = useState('Selamat Datang');
  const [timeIcon, setTimeIcon] = useState<React.ReactNode>(<Sun size={12} className="text-[#c5a059]" />);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      setGreeting('Selamat Pagi');
      setTimeIcon(<Sunrise size={12} className="text-[#c5a059]" />);
    } else if (hour >= 11 && hour < 15) {
      setGreeting('Selamat Siang');
      setTimeIcon(<Sun size={12} className="text-[#c5a059]" />);
    } else if (hour >= 15 && hour < 18) {
      setGreeting('Selamat Sore');
      setTimeIcon(<Sunset size={12} className="text-[#c5a059]" />);
    } else {
      setGreeting('Selamat Malam');
      setTimeIcon(<Moon size={12} className="text-[#c5a059]" />);
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 so-glass-nav transition-all duration-300">
      <div className="w-full max-w-2xl mx-auto px-4 py-3 sm:px-6">
        
        {/* Main Nav Row */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Hotel Identity */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-[70px] h-[70px] sm:w-[82px] sm:h-[82px] rounded-2xl bg-white border border-[#c5a059]/40 p-1 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
              {shopLogo ? (
                <img src={shopLogo} alt="Hotel Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-[#0b3d2e] rounded-xl flex items-center justify-center text-[#c5a059]">
                  <Utensils size={28} />
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0 justify-center">
              <h1 className="text-[17px] sm:text-[20px] font-extrabold text-[#121615] leading-snug truncate font-sans">
                {hotelData?.name || 'Restaurant & Dining'}
              </h1>

              <div className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-[#525a56] font-medium mt-0.5">
                {timeIcon}
                <span className="text-[#8c6e33] font-bold">{greeting}</span>
              </div>
            </div>
          </div>

          {/* Table / Room Chip & Search Button */}
          <div className="flex items-center gap-2 shrink-0">
            {tableNumber && (
              <div className="so-badge-gold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-pulse" />
                <span className="text-[12px] font-extrabold tracking-tight">
                  {tableNumber.toLowerCase().startsWith('k') || tableNumber.toLowerCase().startsWith('r')
                    ? tableNumber
                    : `Meja ${tableNumber}`}
                </span>
              </div>
            )}

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isSearchOpen
                  ? 'bg-[#0b3d2e] text-white shadow-md'
                  : 'bg-white border border-[#c5a059]/30 text-[#121615] hover:bg-[#faf5ea]'
              }`}
              title="Cari Menu"
            >
              {isSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
        {isSearchOpen && (
          <div className="mt-3 pt-2.5 border-t border-[#c5a059]/15 animate-in fade-in duration-200">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3.5 text-[#8a928e]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari hidangan pembuka, main course, minuman, atau dessert..."
                autoFocus
                className="w-full bg-[#f8f7f4] border border-[#c5a059]/35 rounded-xl pl-10 pr-10 py-2.5 text-[13px] text-[#121615] placeholder:text-[#8a928e] focus:outline-none focus:border-[#0b3d2e] focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-[11px] font-bold text-[#8a928e] hover:text-[#121615] bg-gray-200 hover:bg-gray-300 w-5 h-5 rounded-full flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
