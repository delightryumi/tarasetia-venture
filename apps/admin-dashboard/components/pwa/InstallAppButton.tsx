"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import styles from "./InstallAppButton.module.css";

export const InstallAppButton = ({ appName = "Tara App" }: { appName?: string }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Tangkap event instalasi PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log(`[PWA] beforeinstallprompt fired for: ${appName}`);
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Cek jika app sudah terinstal via standalone display mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log(`[PWA] ${appName} is already running as an installed standalone app.`);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [appName]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Jangan tampilkan tombol jika PWA tidak/belum siap diinstal pada browser ini
  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className={styles.container}>
      <button
        onClick={handleInstallClick}
        type="button"
        className={styles.button}
      >
        <Download size={16} strokeWidth={2.5} className={styles.icon} />
        <span>Install {appName}</span>
      </button>
    </div>
  );
};
