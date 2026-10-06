import React, { useState, useEffect, useRef } from "react";
import { Menu, Settings, Users, LogOut, Building2, BellRing, ChevronDown, Check } from "lucide-react";
import { NotificationSettingsDrawer } from "./NotificationSettingsDrawer";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleActionButtons } from "@/components/layout/ModuleActionButtons";
import styles from "@/app/select-module/select-module.module.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { hasPermission, isUserSuperadmin } from "@/lib/permissionCheck";

interface StatusWidgetProps {
    onMenuClick?: () => void;
    isCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

export const StatusWidget = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOutUser, activeHotelCode, activeHotelName, hotelsList, setActiveHotelCode } = useAuth();
    const isSuperadmin = isUserSuperadmin(user);
    const userRole = user?.role || "";
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isHotelDropdownOpen, setIsHotelDropdownOpen] = useState(false);
    const hotelDropdownRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const userName = user?.displayName || user?.email?.split('@')[0] || "Administrator";

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
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isHotelDropdownOpen]);

    useEffect(() => {
        const syncTheme = () => {
            const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'system';
            setTheme(savedTheme);
        };
        syncTheme();
        window.addEventListener('focus', syncTheme);
        window.addEventListener('storage', syncTheme);
        return () => {
            window.removeEventListener('focus', syncTheme);
            window.removeEventListener('storage', syncTheme);
        };
    }, []);

    const changeTheme = (newTheme: 'dark' | 'light' | 'system') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.cookie = `shared_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
        let resolved = newTheme;
        if (newTheme === 'system') {
            resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (resolved === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const canAccessCpanel = hasPermission(user, 'logo', 'module_cpanel');
    const canAccessUsers = hasPermission(user, 'users', 'module_cpanel');
    const canAccessProfile = isSuperadmin || user?.role?.toLowerCase() === "admin";

    return (
        <div className="status-widget-container flex items-center justify-between w-full z-50">
            {/* Left Side: Nexura Logo & Hotel Badge/Selector */}
            <div className={styles.logoArea}>
                <button
                    onClick={() => router.push('/select-module')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Kembali ke Module Selector"
                >
                    <img
                        src="/channels/6.png"
                        alt="Nexura Logo"
                        className={styles.logoImage}
                    />
                </button>

                {/* Divider line */}
                {(activeHotelCode || isSuperadmin) && (
                    <div className={`${styles.dividerLine} hidden sm:block`} />
                )}

                {/* Hotel Selector / Badge (iOS Floating Card Pill Style) */}
                {isSuperadmin || (hotelsList && hotelsList.length > 1) ? (
                    <div className={styles.hotelSelectorWrap} ref={hotelDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsHotelDropdownOpen(!isHotelDropdownOpen)}
                            className={`${styles.hotelPillBtn} ${isHotelDropdownOpen ? styles.hotelPillBtnActive : ''}`}
                            title="Ganti Properti / Hotel Aktif"
                        >
                            <span className="truncate max-w-[200px] sm:max-w-[280px]">
                                {activeHotelCode === '0' || !activeHotelCode
                                    ? 'Superadmin (Tanpa Preview)'
                                    : `[${activeHotelCode}] ${hotelsList?.find((h) => String(h.hotelCode) === String(activeHotelCode))?.name || activeHotelName || 'Pilih Properti'}`}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 shrink-0 ${isHotelDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {isHotelDropdownOpen && (
                            <div className={styles.hotelDropdownCard}>
                                <div className={styles.hotelDropdownHeader}>Pilih Properti Aktif</div>
                                {isSuperadmin && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveHotelCode('0');
                                            setIsHotelDropdownOpen(false);
                                            window.location.reload();
                                        }}
                                        className={`${styles.hotelDropdownItem} ${activeHotelCode === '0' || !activeHotelCode ? styles.hotelDropdownItemActive : ''}`}
                                    >
                                        <span className="truncate font-semibold">Superadmin (Tanpa Preview)</span>
                                        {(activeHotelCode === '0' || !activeHotelCode) && (
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
                                                className={`${styles.hotelDropdownItem} ${isSelected ? styles.hotelDropdownItemActive : ''}`}
                                            >
                                                <div className="flex items-center gap-2 truncate text-left">
                                                    <span className={styles.hotelCodeBadge}>{hotel.hotelCode}</span>
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
                        <div className={styles.hotelPillStatic}>
                            <span>
                                [{activeHotelCode || "0"}] {activeHotelName || 'Memuat...'}
                            </span>
                        </div>
                    )
                )}
            </div>

            {/* Right Side: Theme Switcher & Hamburger Menu */}
            <div className="flex items-center gap-3">
                <ModuleActionButtons
                    showGrid={false}
                    setShowGrid={() => {}}
                    theme={theme}
                    changeTheme={changeTheme}
                />


                {/* Hamburger Menu (Garis 3) */}

                <div className={styles.menuWrapper}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={styles.menuButton}
                        title="Menu CPanel & Akun"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className={styles.backdrop}
                                    onClick={() => setIsMenuOpen(false)}
                                />

                                {/* Dropdown Menu */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className={styles.dropdownMenu}
                                >
                                    {/* User Login Info Profile Card */}
                                    <div className={styles.menuUserCard}>
                                        <div 
                                            className="w-10 h-10 rounded-full overflow-hidden border border-[#8d7a52]/40 flex-shrink-0 flex items-center justify-center"
                                            style={{ backgroundColor: ['rgba(141, 122, 82, 0.15)', 'rgba(120, 128, 105, 0.15)', '#f3e8ff', '#e0e7ff', '#dcfce7', '#fee2e2', '#fef3c7'][((userName || "U").charCodeAt(0) || 0) % 7] }}
                                        >
                                            <img 
                                                src={`/avatar/memo_${((((userName || "U").charCodeAt(0) || 0) + 5) % 35) + 1}.png`} 
                                                alt={userName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`truncate ${styles.menuUserName}`}>{userName}</span>
                                            <span className={`truncate ${styles.menuUserEmail}`}>{user?.email}</span>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-[8px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest">System Live</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Hotel Info (Mobile only) */}
                                    <div className="px-3 py-2 bg-[#f8fafc] dark:bg-white/[0.03] rounded-[10px] mb-2 flex flex-col gap-0.5 border-t border-[var(--f-hairline)] pt-2 mt-1 sm:hidden">
                                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Active Hotel</span>
                                        <span className="text-xs font-semibold text-neutral-850 dark:text-[#f4f4f5] truncate">
                                            {activeHotelCode === "0" || !activeHotelCode
                                                ? "Superadmin"
                                                : `[${activeHotelCode}] ${activeHotelName || '—'}`}
                                        </span>
                                    </div>

                                    {(canAccessCpanel || canAccessUsers || canAccessProfile) && (
                                        <>
                                            {canAccessCpanel && (
                                                <button
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        router.push('/logo?module=cpanel');
                                                    }}
                                                    className={styles.dropdownItem}
                                                >
                                                    <Settings className={styles.dropdownIcon} />
                                                    <span>CPanel</span>
                                                </button>
                                            )}

                                            {canAccessUsers && (
                                                <button
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        router.push('/users?module=cpanel');
                                                    }}
                                                    className={styles.dropdownItem}
                                                >
                                                    <Users className={styles.dropdownIcon} />
                                                    <span>User Settings</span>
                                                </button>
                                            )}

                                            {canAccessProfile && (
                                                <button
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        router.push('/profile?module=cpanel');
                                                    }}
                                                    className={styles.dropdownItem}
                                                >
                                                    <Building2 className={styles.dropdownIcon} />
                                                    <span>Profile Settings</span>
                                                </button>
                                            )}

                                            <div className={styles.dropdownDivider} />
                                        </>
                                    )}

                                    {/* Notification Settings Menu Item */}
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setIsNotifOpen(true);
                                        }}
                                        className={styles.dropdownItem}
                                    >
                                        <BellRing className={styles.dropdownIcon} />
                                        <span>Notification Settings</span>
                                    </button>

                                    <div className={styles.dropdownDivider} />

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            signOutUser();
                                        }}
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

            {/* PWA Notification Settings Drawer (global, all pages) */}
            <NotificationSettingsDrawer
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                hotelCode={activeHotelCode || "1"}
                userId={user?.uid || user?.email || "guest"}
                userEmail={user?.email || undefined}
            />
        </div>
    );
};