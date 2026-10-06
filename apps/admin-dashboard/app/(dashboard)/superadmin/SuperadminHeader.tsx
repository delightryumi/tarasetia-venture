"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Settings, Users, LogOut, ChevronDown, Check } from "lucide-react";
import { ModuleActionButtons } from "@/components/layout/ModuleActionButtons";
import styles from "./SuperadminHeader.module.css";
import selectStyles from "@/app/select-module/select-module.module.css";
import { HotelMasterDoc } from "./types";

interface SuperadminHeaderProps {
  theme: "dark" | "light" | "system";
  changeTheme: (t: "dark" | "light" | "system") => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (v: boolean) => void;
  activeHotelCode: string;
  activeHotelName: string;
  isSuperadmin: boolean;
  hotelsList: HotelMasterDoc[];
  setActiveHotelCode: (code: string) => void;
  onLogoClick: () => void;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}

export const SuperadminHeader: React.FC<SuperadminHeaderProps> = ({
  theme,
  changeTheme,
  isMenuOpen,
  setIsMenuOpen,
  activeHotelCode,
  activeHotelName,
  isSuperadmin,
  hotelsList,
  setActiveHotelCode,
  onLogoClick,
  onNavigate,
  onSignOut,
}) => {
  const [isHotelDropdownOpen, setIsHotelDropdownOpen] = useState(false);
  const hotelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hotelDropdownRef.current &&
        !hotelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsHotelDropdownOpen(false);
      }
    };
    if (isHotelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHotelDropdownOpen]);

  return (
    <header className={styles.headerBar}>
      <div className={styles.headerInner}>
        {/* Left Side: Logo & Hotel Badge */}
        <div className={styles.logoArea}>
          <button
            onClick={onLogoClick}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
            title="Kembali ke Module Selector"
          >
            <img src="/channels/6.png" alt="Logo" className={styles.logoImage} />
          </button>

          {(activeHotelCode || isSuperadmin) && (
            <div className={`${styles.dividerLine} hidden sm:block`} />
          )}

          {/* Hotel Selector / Badge (iOS Floating Card Pill Style) */}
          {isSuperadmin || (hotelsList && hotelsList.length > 1) ? (
            <div className={selectStyles.hotelSelectorWrap} ref={hotelDropdownRef}>
              <button
                type="button"
                onClick={() => setIsHotelDropdownOpen(!isHotelDropdownOpen)}
                className={`${selectStyles.hotelPillBtn} ${isHotelDropdownOpen ? selectStyles.hotelPillBtnActive : ""}`}
                title="Ganti Properti / Hotel Aktif"
              >
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  {activeHotelCode === "0" || !activeHotelCode
                    ? "Superadmin (Tanpa Preview)"
                    : `[${activeHotelCode}] ${hotelsList?.find((h) => String(h.hotelCode) === String(activeHotelCode))?.name || activeHotelName || "Pilih Properti"}`}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 shrink-0 ${isHotelDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isHotelDropdownOpen && (
                <div className={selectStyles.hotelDropdownCard}>
                  <div className={selectStyles.hotelDropdownHeader}>Pilih Properti Aktif</div>
                  {isSuperadmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveHotelCode("0");
                        setIsHotelDropdownOpen(false);
                        window.location.reload();
                      }}
                      className={`${selectStyles.hotelDropdownItem} ${activeHotelCode === "0" || !activeHotelCode ? selectStyles.hotelDropdownItemActive : ""}`}
                    >
                      <span className="truncate font-semibold">Superadmin (Tanpa Preview)</span>
                      {(activeHotelCode === "0" || !activeHotelCode) && (
                        <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
                  )}
                  {hotelsList && hotelsList.length > 0 && (
                    hotelsList.map((hotel) => {
                      const isSelected = String(activeHotelCode) === String(hotel.hotelCode);
                      return (
                        <button
                          key={hotel.hotelCode}
                          type="button"
                          onClick={() => {
                            setActiveHotelCode(hotel.hotelCode);
                            setIsHotelDropdownOpen(false);
                            window.location.reload();
                          }}
                          className={`${selectStyles.hotelDropdownItem} ${isSelected ? selectStyles.hotelDropdownItemActive : ""}`}
                        >
                          <div className="flex items-center gap-2 truncate text-left">
                            <span className={selectStyles.hotelCodeBadge}>{hotel.hotelCode}</span>
                            <span className="truncate">{hotel.name}</span>
                          </div>
                          {isSelected && (
                            <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ) : (
            activeHotelCode && (
              <div className={selectStyles.hotelPillStatic}>
                <span>
                  [{activeHotelCode || "0"}] {activeHotelName || "Memuat..."}
                </span>
              </div>
            )
          )}
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-3">
          <ModuleActionButtons
            showGrid={false}
            setShowGrid={() => {}}
            theme={theme}
            changeTheme={changeTheme}
          />

          {/* Hamburger Menu */}
          <div className={styles.menuWrapper}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={styles.menuButton}
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div className={styles.backdrop} onClick={() => setIsMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className={styles.dropdownMenu}
                  >
                    {/* Active Partner Info (Mobile only) */}
                    <div className="px-3 py-2 bg-[#f8fafc] dark:bg-white/[0.03] rounded-[10px] mb-2 flex flex-col gap-0.5 border-t border-slate-200 dark:border-white/[0.08] pt-2 mt-1 sm:hidden">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Active Partner</span>
                      <span className="text-xs font-semibold text-neutral-850 dark:text-[#f4f4f5] truncate">
                        [{activeHotelCode || "0"}] {activeHotelName || "Memuat..."}
                      </span>
                    </div>
                    <button
                      onClick={() => { setIsMenuOpen(false); onNavigate("/logo?module=cpanel"); }}
                      className={styles.dropdownItem}
                    >
                      <Settings className={styles.dropdownIcon} />
                      <span>CPanel</span>
                    </button>
                    <button
                      onClick={() => { setIsMenuOpen(false); onNavigate("/users?module=cpanel"); }}
                      className={styles.dropdownItem}
                    >
                      <Users className={styles.dropdownIcon} />
                      <span>User Settings</span>
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button
                      onClick={() => { setIsMenuOpen(false); onSignOut(); }}
                      className={styles.dropdownItemDanger}
                    >
                      <LogOut className={styles.dropdownIcon} />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
