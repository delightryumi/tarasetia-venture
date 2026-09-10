import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSliderProps {
  promoBanners: any[];
  onBannerClick?: (productId?: string) => void;
}

export default function HeroSlider({ promoBanners, onBannerClick }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!promoBanners || promoBanners.length === 0) {
    return null;
  }

  const banners = promoBanners;

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      const targetScroll = currentIndex * container.clientWidth;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative mb-5 overflow-hidden rounded-3xl so-card border border-[#c5a059]/30 shadow-lg group">
      <div
        ref={sliderRef}
        className="flex overflow-hidden snap-x snap-mandatory so-no-scrollbar select-none"
      >
        {banners.map((promo, idx) => {
          const hasText = Boolean(promo.title || promo.subtitle);
          return (
            <div
              key={promo.id || idx}
              onClick={() => onBannerClick && promo.linkToProductId && onBannerClick(promo.linkToProductId)}
              className={`w-full shrink-0 snap-center relative ${promo.linkToProductId ? 'cursor-pointer' : ''}`}
            >
              {/* Responsive Aspect-Ratio Container */}
              <div className="w-full aspect-[2.1/1] sm:aspect-[2.4/1] min-h-[175px] max-h-[260px] bg-[#0b3d2e] relative overflow-hidden">
                <img
                  src={promo.imageUrl}
                  alt={promo.title || 'Promo Banner'}
                  className="w-full h-full object-cover object-center brightness-[0.88] transition-transform duration-1000 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Scrim & Typography (Only if banner has text info) */}
                {hasText && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4.5 sm:p-6 text-white">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-[#c5a059] text-[#0f1412] text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm font-sans">
                        <Sparkles size={10} /> {promo.badge || "Special Menu"}
                      </span>
                      <span className="text-[9.5px] text-white/90 font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star size={9} className="text-[#c5a059] fill-[#c5a059]" /> Recommended
                      </span>
                    </div>

                    <h3 className="text-[18px] sm:text-[22px] font-extrabold leading-tight tracking-tight text-white drop-shadow-md so-display-font">
                      {promo.title}
                    </h3>

                    {promo.subtitle && (
                      <p className="text-[11.5px] sm:text-[13px] text-white/80 line-clamp-1 mt-0.5 font-medium leading-relaxed">
                        {promo.subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Slide Nav Controls on Desktop / Tablet */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 shadow-md"
            title="Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 shadow-md"
            title="Berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Pagination Pills */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? 'w-6 bg-[#c5a059] shadow-sm'
                  : 'w-1.5 bg-white/40 hover:bg-white/75'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
