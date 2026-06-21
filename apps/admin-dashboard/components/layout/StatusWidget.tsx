"use client";

import React, { useState, useEffect } from "react";
import { Menu, Settings, Users, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleActionButtons } from "@/components/layout/ModuleActionButtons";
import styles from "@/app/select-module/select-module.module.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";

interface StatusWidgetProps {
    onMenuClick?: () => void;
    isCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

export const StatusWidget = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOutUser, activeHotelCode, activeHotelName, hotelsList, setActiveHotelCode } = useAuth();
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');

    const userName = user?.displayName || user?.email?.split('@')[0] || "Administrator";

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

    const fetchPermissions = async () => {
        if (!user?.email) return;
        try {
            // Fast path: AuthContext sudah konfirmasi superadmin
            if ((user as any).role === "superadmin") {
                setIsSuperadmin(true);
                return;
            }
            const userDocId = user.email.toLowerCase().replace(/[@.]/g, '_');
            const userSnap = await getDoc(
                doc(getHotelCollection(db, "users_master"), userDocId)
            );
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const role = userData.role;
                if (role === "superadmin") {
                    setIsSuperadmin(true);
                    return;
                }
                setUserPermissions(userData.permissions || {});
            }
        } catch (err) {
            console.error("Error fetching permissions in StatusWidget:", err);
        }
    };


    useEffect(() => {
        fetchPermissions();
    }, [user]);

    const hasAccess = (moduleKey: string) => {
        if (isSuperadmin) return true;
        if (!userPermissions) return false;
        switch (moduleKey) {
            case 'cpanel':
                return userPermissions['module_cpanel'] !== undefined
                    ? !!userPermissions['module_cpanel']
                    : userPermissions['users'] !== false;
            default:
                return false;
        }
    };

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

                {/* Hotel Selector / Badge */}
                {isSuperadmin || (user?.allowedOutlets && user.allowedOutlets.length > 1) ? (
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
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 8px center',
                                backgroundSize: '16px',
                                paddingLeft: '12px',
                            }}
                        >
                            {/* Opsi default Superadmin */}
                            {isSuperadmin && <option value="0">— Superadmin (tidak ada preview) —</option>}
                            {hotelsList && hotelsList.length > 0 && (
                                hotelsList.map((hotel) => (
                                    <option key={hotel.hotelCode} value={hotel.hotelCode}>
                                        [{hotel.hotelCode}] {hotel.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                ) : (
                    activeHotelCode && (
                        <div
                            className={`hidden sm:flex items-center h-9 pr-3 w-[260px] md:w-[320px] rounded-[6px] overflow-hidden shadow-sm text-[11px] sm:text-[13px] font-semibold ${styles.hotelBadge}`}
                            style={{ paddingLeft: '8px' }}
                        >
                            <span className="truncate w-full text-left" style={{ paddingLeft: '4px' }}>
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

                                    {hasAccess('cpanel') && (
                                        <>
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

                                            <div className={styles.dropdownDivider} />
                                        </>
                                    )}

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
        </div>
    );
};