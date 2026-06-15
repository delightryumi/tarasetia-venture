"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

function ThemeSyncHelper() {
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    if (typeof window === "undefined" || !theme) return;

    // Sync theme whenever it changes in next-themes to the shared cookie
    const match = document.cookie.match(/(?:^|; )shared_theme=([^;]*)/);
    const cookieTheme = match ? match[1] : null;
    if (theme !== cookieTheme) {
      document.cookie = `shared_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [theme]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const syncThemeFromCookie = () => {
      const match = document.cookie.match(/(?:^|; )shared_theme=([^;]*)/);
      const cookieTheme = match ? match[1] : null;
      if (cookieTheme && (cookieTheme === "light" || cookieTheme === "dark" || cookieTheme === "system")) {
        if (theme !== cookieTheme) {
          setTheme(cookieTheme);
        }
      }
    };

    // Check on mount & window focus
    syncThemeFromCookie();
    window.addEventListener("focus", syncThemeFromCookie);
    return () => {
      window.removeEventListener("focus", syncThemeFromCookie);
    };
  }, [theme, setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSyncHelper />
      {children}
    </NextThemesProvider>
  );
}
