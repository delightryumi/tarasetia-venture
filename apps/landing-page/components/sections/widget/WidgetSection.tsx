"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cloud, CloudDrizzle, CloudFog, CloudLightning, 
  CloudMoon, CloudRain, CloudSnow, CloudSun, 
  Moon, Sun, Wind, MapPin, Clock, RefreshCw, AlertCircle
} from "lucide-react";

// Coordinates for Temanggung, Central Java
const LAT = -7.3167;
const LON = 110.1667;

type WeatherData = {
  temp: number;
  code: number;
  isDay: boolean;
};

export const WidgetSection = ({ insideHero = false }: { insideHero?: boolean }) => {
  const [time, setTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWeather = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,is_day&timezone=Asia%2FJakarta&forecast_days=1`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("API_ERROR");
      
      const data = await res.json();
      const current = data.current;
      
      if (!current) throw new Error("DATA_MISSING");

      setWeather({
        temp: Math.round(current.temperature_2m ?? 0),
        code: current.weather_code ?? 0,
        isDay: current.is_day === 1,
      });
      setStatus("success");
    } catch (err) {
      console.error("Weather fetch failed:", err);
      if (!weather) setStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  }, [weather]);

  useEffect(() => {
    setTime(new Date());
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 1800000);
    return () => {
      clearInterval(clockInterval);
      clearInterval(weatherInterval);
    };
  }, [fetchWeather]);

  const getWeatherDetails = (code: number, isDay: boolean) => {
    const defaultIcon = <Cloud size={20} className="text-[#A6AE96]" />;
    
    const config: Record<number, { text: string; icon: React.ReactNode; color: string }> = {
      0: { text: "Clear Sky", icon: isDay ? <Sun size={20} /> : <Moon size={20} />, color: isDay ? "text-yellow-400" : "text-indigo-200" },
      1: { text: "Mainly Clear", icon: isDay ? <CloudSun size={20} /> : <CloudMoon size={20} />, color: "text-blue-300" },
      2: { text: "Partly Cloudy", icon: isDay ? <CloudSun size={20} /> : <CloudMoon size={20} />, color: "text-blue-300" },
      3: { text: "Overcast", icon: <Cloud size={20} />, color: "text-slate-400" },
      45: { text: "Foggy", icon: <CloudFog size={20} />, color: "text-slate-300" },
      48: { text: "Foggy", icon: <CloudFog size={20} />, color: "text-slate-300" },
      51: { text: "Light Drizzle", icon: <CloudDrizzle size={20} />, color: "text-blue-300" },
      53: { text: "Drizzle", icon: <CloudDrizzle size={20} />, color: "text-blue-300" },
      55: { text: "Drizzle", icon: <CloudDrizzle size={20} />, color: "text-blue-300" },
      61: { text: "Light Rain", icon: <CloudRain size={20} />, color: "text-blue-400" },
      63: { text: "Rainy", icon: <CloudRain size={20} />, color: "text-blue-400" },
      65: { text: "Heavy Rain", icon: <CloudRain size={20} />, color: "text-blue-400" },
      95: { text: "Thunderstorm", icon: <CloudLightning size={20} />, color: "text-purple-400" },
    };

    return config[code] || { text: "Cloudy", icon: defaultIcon, color: "text-slate-400" };
  };

  if (!time) return null;

  const formattedTime = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: 'Asia/Jakarta' 
  });
  
  const formattedDate = time.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    timeZone: 'Asia/Jakarta' 
  });

  const weatherInfo = weather ? getWeatherDetails(weather.code, weather.isDay) : null;

  const InnerContent = (
    <div className="relative group max-w-full">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[20px] rounded-2xl sm:rounded-full border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] transition-all duration-700 group-hover:bg-white/50 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)]" />
      
      <div className="relative px-4 py-3 md:px-10 md:py-5 flex flex-row items-center justify-center gap-3 sm:gap-6 md:gap-10 lg:gap-14 w-full overflow-x-auto scrollbar-hide">
        
        {/* Time */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#788069]/10 flex items-center justify-center text-[#788069] shrink-0">
            <Clock size={14} className="sm:w-4 sm:h-4" />
          </div>
          <div>
            <p className="text-[6px] sm:text-[8px] font-black uppercase tracking-[0.3em] text-[#788069]/60 mb-0.5">Local Time</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-xl font-medium text-[#1a1a1a] tracking-tight tabular-nums">{formattedTime}</span>
              <span className="text-[7px] sm:text-[9px] font-bold text-[#1a1a1a]/30 uppercase tracking-widest">WIB</span>
            </div>
          </div>
        </div>

        <div className="w-px h-6 sm:h-8 bg-black/10 shrink-0" />

        {/* Location */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#ffd8a6]/20 flex items-center justify-center text-[#d9a86a] shrink-0">
            <MapPin size={14} className="sm:w-4 sm:h-4" />
          </div>
          <div>
            <p className="text-[6px] sm:text-[8px] font-black uppercase tracking-[0.3em] text-[#788069]/60 mb-0.5">Discovery At</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-[13px] font-bold text-[#1a1a1a] tracking-tight">Temanggung</span>
              <span className="text-[7px] sm:text-[9px] font-medium text-[#1a1a1a]/30 uppercase tracking-widest">{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="w-px h-6 sm:h-8 bg-black/10 shrink-0" />

        {/* Weather */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <AnimatePresence mode="wait">
            {status === "loading" ? (
              <motion.div 
                key="loading" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <RefreshCw size={12} className="text-[#788069] animate-spin sm:w-3.5 sm:h-3.5" />
                <span className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-[#788069]/40">Syncing</span>
              </motion.div>
            ) : status === "error" ? (
              <motion.div 
                key="error" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-rose-400"
              >
                <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-[7px] sm:text-[9px] font-bold uppercase tracking-widest">Offline</span>
              </motion.div>
            ) : (
              <motion.div 
                key="success" 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 sm:gap-4"
              >
                <div className={`p-1.5 sm:p-2 rounded-lg bg-black/5 shrink-0 ${weatherInfo?.color}`}>
                  {weatherInfo?.icon}
                </div>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm sm:text-xl font-medium text-[#1a1a1a] tabular-nums">{weather?.temp}°</span>
                    <span className="text-[7px] sm:text-[9px] font-bold text-[#1a1a1a]/30 uppercase">C</span>
                  </div>
                  <p className="text-[6px] sm:text-[8px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a]/40">
                    {weatherInfo?.text}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => fetchWeather()}
          disabled={isRefreshing}
          className="ml-auto hidden lg:flex w-7 h-7 rounded-full items-center justify-center text-black/10 hover:text-[#788069] hover:bg-[#788069]/5 transition-all duration-300 shrink-0"
        >
          <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );

  if (insideHero) {
    return (
      <div className="w-full flex justify-center pointer-events-auto px-6">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.8 }}
        >
          {InnerContent}
        </motion.div>
      </div>
    );
  }

  return (
    <section className="relative w-full -mt-16 lg:-mt-20 z-30 pointer-events-none px-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-screen-xl mx-auto flex justify-center pointer-events-auto"
      >
        {InnerContent}
      </motion.div>
    </section>
  );
};
