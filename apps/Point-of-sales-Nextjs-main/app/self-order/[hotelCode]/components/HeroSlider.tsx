import React, { useEffect, useRef } from 'react';

interface HeroSliderProps {
  promoBanners: any[];
}

export default function HeroSlider({ promoBanners }: HeroSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (promoBanners.length <= 1) return;
    const interval = setInterval(() => {
      if (sliderRef.current) {
        const container = sliderRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollTo({ left: container.scrollLeft + container.clientWidth, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [promoBanners.length]);

  if (promoBanners.length === 0) return null;

  return (
    <div className="mb-8 -mx-4">
      <div 
        ref={sliderRef}
        className="flex overflow-hidden snap-x snap-mandatory scrollbar-none"
      >
        {promoBanners.map((promo) => (
          <div key={promo.id} className="w-full shrink-0 snap-center">
            {promo.imageUrl && (
              <div className="w-full h-[200px] sm:h-[260px] md:h-[320px] lg:h-[400px] bg-sb-canvas">
                <img 
                  src={promo.imageUrl} 
                  alt={promo.title}
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=Promo'; }} 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
