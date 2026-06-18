import FoodBeverageRealtimeTab from '@/components/fnb-product/FoodBeverageRealtimeTab';

export default function FnbRealtimePageRoute() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10 py-8 flex flex-col gap-8">
      {/* Header aligned with DESIGN.md spacing and colors */}
      <div className="flex flex-col gap-1 pb-5 border-b border-stone-200/60 dark:border-stone-800/65">
        <h1 className="text-2xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
          POS Real-Time Monitor
        </h1>
        <p className="text-xs text-stone-400 dark:text-stone-500 font-medium">
          Monitor status denah meja aktif dan pesanan masuk POS secara digital &amp; real-time.
        </p>
      </div>
      
      {/* Real-time Dashboard Panel */}
      <div className="w-full">
        <FoodBeverageRealtimeTab />
      </div>
    </div>
  );
}
