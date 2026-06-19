"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Settings, Users, LogOut } from "lucide-react";
import { ModuleActionButtons } from "@/components/layout/ModuleActionButtons";
import styles from "@/app/select-module/select-module.module.css";
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

          {isSuperadmin ? (
            <div className={`relative hidden sm:flex items-center h-9 w-[260px] md:w-[320px] rounded-[6px] overflow-hidden shadow-sm text-[13px] transition-all ${styles.hotelBadge}`}>
              <select
                value={activeHotelCode}
                onChange={(e) => {
                  setActiveHotelCode(e.target.value);
                  window.location.reload();
                }}
                className={`border-none pr-8 sm:pr-10 py-1 text-[11px] sm:text-[13px] font-medium focus:outline-none focus:ring-0 cursor-pointer appearance-none h-full w-full truncate rounded-[6px] text-left ${styles.hotelSelect}`}
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239297a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  backgroundSize: "16px",
                  paddingLeft: "12px",
                }}
              >
                {hotelsList && hotelsList.length > 0 ? (
                  hotelsList.map((hotel) => (
                    <option key={hotel.hotelCode} value={hotel.hotelCode}>
                      [{hotel.hotelCode}] {hotel.name}
                    </option>
                  ))
                ) : (
                  <option value="87241">[87241] Bumi Anyom Resort</option>
                )}
              </select>
            </div>
          ) : (
            activeHotelCode && (
              <div
                className={`hidden sm:flex items-center h-9 pr-3 w-[260px] md:w-[320px] rounded-[6px] overflow-hidden shadow-sm text-[11px] sm:text-[13px] font-semibold ${styles.hotelBadge}`}
                style={{ paddingLeft: "8px" }}
              >
                <span className="truncate w-full text-left" style={{ paddingLeft: "4px" }}>
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
